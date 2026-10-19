from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from core.broadcaster import broadcaster
from core.mission_logger import mission_logger
from core.state_manager import state_manager
from ingestion.udp_server import udp_ingestor
from routers.cameras import router as cameras_router
from routers.commands import router as commands_router
from routers.health import router as health_router
from routers.telemetry import router as telemetry_router
from services.mediamtx_discovery import mediamtx_discovery

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)
logger = logging.getLogger("mission_control")


# ---------------------------------------------------------------------------
# Background Broadcast Loop
# ---------------------------------------------------------------------------
async def _broadcast_loop() -> None:
    """
    Periodic WebSocket broadcast loop.
    Wakes up when new telemetry arrives or after a short timeout to refresh staleness.
    """
    logger.info("WebSocket telemetry broadcast loop started.")
    interval = 1.0 / max(1.0, settings.BROADCAST_RATE_HZ)

    while True:
        try:
            # Wait for fresh packet or timeout
            snapshot = await state_manager.wait_for_update(timeout=interval)

            if broadcaster.client_count > 0:
                payload = snapshot.model_dump()
                await broadcaster.broadcast(payload)

            await asyncio.sleep(interval)
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.debug("Broadcast loop cycle error: %s", e)
            await asyncio.sleep(0.05)


# ---------------------------------------------------------------------------
# Lifespan Supervisor
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Supervised startup and shutdown of backend tasks and hardware listeners."""
    logger.info("Initializing Rover Mission Control Backend...")

    # 1. Start UDP Telemetry Receiver
    await udp_ingestor.start()

    # 2. Start MediaMTX Camera Stream Discovery
    await mediamtx_discovery.start()

    # 3. Start WebSocket Broadcast Task
    broadcast_task = asyncio.create_task(_broadcast_loop(), name="ws_broadcast_loop")

    logger.info(
        "Backend operational. UDP Ingest on :%d | Command uplink target: %s:%d",
        settings.UDP_INGEST_PORT,
        settings.COMMAND_HOST,
        settings.COMMAND_PORT,
    )
    yield

    # Shutdown sequence
    logger.info("Shutting down mission control tasks...")
    broadcast_task.cancel()
    try:
        await broadcast_task
    except asyncio.CancelledError:
        pass

    await mediamtx_discovery.stop()
    await udp_ingestor.stop()
    mission_logger.close()
    logger.info("Backend shutdown complete.")


# ---------------------------------------------------------------------------
# FastAPI Application
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Mars Rover Mission Control API",
    description="Modular telemetry, video stream discovery, and command backend for IRC Ground Station.",
    version="2.0.0",
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
app.include_router(health_router)
app.include_router(telemetry_router)
app.include_router(cameras_router)
app.include_router(commands_router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info",
    )