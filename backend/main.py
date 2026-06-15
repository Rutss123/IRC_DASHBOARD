"""
main.py
--------
Application entry point.

Startup sequence:
  1. FastAPI app created with CORS middleware (allow all origins in dev).
  2. Lifespan context manager fires on startup:
       a. Simulator background task started at 10 Hz.
       b. Broadcast background task started — waits for new snapshots from
          TelemetryService and fans them out to all WebSocket clients.
  3. Routers mounted:
       /api/telemetry  (REST)
       /ws             (WebSocket)
       /health         (REST)

Broadcast loop design:
  Rather than polling on a timer, the broadcast loop awaits
  telemetry_service.wait_for_update() — an asyncio.Event that fires exactly
  when new data arrives.  This means broadcast frequency automatically tracks
  simulator frequency (10 Hz) with no extra sleep() calls and zero busy-polling.

Replacing the simulator with Jetson UDP:
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  # services/jetson_udp_listener.py  (new file, ~40 lines)               │
  │                                                                          │
  │  import asyncio, socket, struct                                          │
  │  from models.telemetry import TelemetrySnapshot                         │
  │  from services.telemetry_service import telemetry_service               │
  │                                                                          │
  │  async def run_udp_listener(host="0.0.0.0", port=9000):                 │
  │      loop = asyncio.get_running_loop()                                   │
  │      sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)            │
  │      sock.bind((host, port))                                             │
  │      sock.setblocking(False)                                             │
  │      while True:                                                         │
  │          data, _ = await loop.sock_recvfrom(sock, 4096)                 │
  │          snapshot = parse_jetson_packet(data)   # your decoder          │
  │          telemetry_service.update_telemetry(snapshot)                   │
  └─────────────────────────────────────────────────────────────────────────┘

  Then in main.py startup replace:
      asyncio.create_task(run_simulator())
  with:
      asyncio.create_task(run_udp_listener())

  Everything downstream (WebSocket broadcast, REST endpoint) is untouched.
"""

from __future__ import annotations

import asyncio
import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from models.telemetry import HealthResponse
from routers.telemetry import router as telemetry_router

from services.telemetry_service import telemetry_service
from simulators.rover_simulator import is_running, run_simulator, stop_simulator
from services.jetson_udp_listener import run_udp_listener
from websocket.websocket_manager import connection_manager

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Background: broadcast loop
# ---------------------------------------------------------------------------

async def _broadcast_loop() -> None:
    """
    Runs forever.  Wakes up whenever TelemetryService has a new snapshot
    and broadcasts it to all connected WebSocket clients as JSON.
    """
    logger.info("Broadcast loop started.")

    while True:
        snapshot = await telemetry_service.wait_for_update()

        print("BROADCASTING DATA")

        if snapshot is None:
            continue

        payload = snapshot.model_dump()

        await connection_manager.broadcast(payload)

# ---------------------------------------------------------------------------
# Lifespan (replaces @app.on_event deprecated API)
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start background tasks on startup; cancel them on shutdown."""
    logger.info("Starting rover backend …")

    sim_task = asyncio.create_task(
    run_udp_listener(),
    name="jetson_udp_listener"
)
    broadcast_task = asyncio.create_task(_broadcast_loop(), name="ws_broadcast")

    logger.info("Simulator and broadcast loop running.")
    yield  # ← application runs here

    # Graceful shutdown
    logger.info("Shutting down …")
    stop_simulator()
    sim_task.cancel()
    broadcast_task.cancel()
    try:
        await asyncio.gather(sim_task, broadcast_task, return_exceptions=True)
    except Exception:
        pass
    logger.info("Backend shut down cleanly.")


# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Mars Rover Mission Control API",
    description="Real-time telemetry backend for the IRC Mars Rover dashboard.",
    version="1.0.0",
    lifespan=lifespan,
)

# Allow the React dev server (localhost:3000 / :5173) and any deployed origin.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten to specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(telemetry_router)


# ---------------------------------------------------------------------------
# Health endpoint
# ---------------------------------------------------------------------------

_start_time = time.monotonic()


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check() -> HealthResponse:
    """
    Lightweight liveness probe.
    Returns uptime, connected WebSocket clients, and simulator status.
    Use this with Docker HEALTHCHECK or a load-balancer probe.
    """
    return HealthResponse(
        status="ok",
        uptime_seconds=round(time.monotonic() - _start_time, 2),
        connected_clients=connection_manager.client_count,
        simulator_running=is_running(),
        telemetry_hz=10,
    )


# ---------------------------------------------------------------------------
# Dev entrypoint
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
