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
    Runs forever. Wakes up whenever TelemetryService receives a new packet 
    via UDP and broadcasts it to all connected WebSocket clients as JSON.
    """
    logger.info("Broadcast loop started.")

    while True:
        # Wakes up automatically when telemetry_service.update_telemetry() is called
        snapshot = await telemetry_service.wait_for_update()

        if snapshot is None:
            continue

        # Convert Pydantic snapshot model to dict/JSON
        payload = snapshot.model_dump()

        # Send to all connected React clients
        await connection_manager.broadcast(payload)

# ---------------------------------------------------------------------------
# Lifespan Context Manager
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start background UDP listener and WS broadcast tasks on startup."""
    logger.info("Starting Mars Rover backend …")

    # Start Jetson UDP Receiver Task on Port 9000
    udp_task = asyncio.create_task(
        run_udp_listener(),
        name="jetson_udp_listener"
    )
    
    # Start WebSocket Broadcast Task
    broadcast_task = asyncio.create_task(
        _broadcast_loop(), 
        name="ws_broadcast"
    )

    logger.info("Jetson UDP listener (Port 9000) and WS broadcast loop running.")
    yield  # Application executes here

    # Shutdown procedure
    logger.info("Shutting down backend tasks…")
    udp_task.cancel()
    broadcast_task.cancel()
    
    try:
        await asyncio.gather(udp_task, broadcast_task, return_exceptions=True)
    except Exception:
        pass
    logger.info("Backend shut down cleanly.")


# ---------------------------------------------------------------------------
# App Factory
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Mars Rover Mission Control API",
    description="Real-time telemetry backend for the IRC Mars Rover dashboard.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(telemetry_router)


# ---------------------------------------------------------------------------
# Health Endpoint
# ---------------------------------------------------------------------------

_start_time = time.monotonic()


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check() -> HealthResponse:
    """Lightweight liveness probe."""
    return HealthResponse(
        status="ok",
        uptime_seconds=round(time.monotonic() - _start_time, 2),
        connected_clients=connection_manager.client_count,
        simulator_running=False,
        telemetry_hz=20,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )