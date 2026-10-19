"""
routers/telemetry.py
--------------------
Telemetry REST and WebSocket endpoints.
"""

from __future__ import annotations

import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from core.broadcaster import broadcaster
from core.state_manager import state_manager
from models.telemetry import TelemetrySnapshot
from services.command_dispatcher import command_dispatcher
from models.commands import CommandRequest

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Telemetry"])


@router.get("/api/telemetry", response_model=TelemetrySnapshot)
async def get_current_telemetry() -> TelemetrySnapshot:
    """Returns the latest telemetry snapshot for page hydration or low-bandwidth polling."""
    return state_manager.get_snapshot()


@router.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    """
    WebSocket endpoint for real-time telemetry streaming to the dashboard.
    Also accepts inbound command frames from the dashboard.
    """
    await broadcaster.connect(websocket)

    try:
        async for message in websocket.iter_text():
            try:
                data = json.loads(message)
                if isinstance(data, dict) and "command" in data:
                    cmd_req = CommandRequest(**data)
                    command_dispatcher.dispatch(cmd_req)
            except Exception as e:
                logger.debug("Non-command frame received on telemetry WS: %s", e)

    except WebSocketDisconnect:
        pass
    except Exception as exc:
        logger.warning("Telemetry WebSocket error: %s", exc)
    finally:
        await broadcaster.disconnect(websocket)
