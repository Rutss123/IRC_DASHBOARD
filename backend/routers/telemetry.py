"""
routers/telemetry.py
---------------------
All telemetry-related HTTP and WebSocket endpoints.

Endpoints
---------
  GET  /api/telemetry     → current snapshot (REST polling fallback)
  WS   /ws                → live 10 Hz stream to dashboard

WebSocket flow:
  1. Frontend calls  new WebSocket("ws://<host>/ws")
  2. FastAPI upgrades the HTTP connection and calls manager.connect().
  3. The inner  async for message in websocket  loop keeps the coroutine
     alive so the socket stays open.
  4. Separately, the broadcast loop in main.py pushes snapshots to ALL
     connected sockets at 10 Hz via manager.broadcast().
  5. If the client disconnects, WebSocketDisconnect is caught and the
     socket is removed from the manager pool.

Why keep receive loop alive?
  Without awaiting incoming messages the coroutine would exit immediately
  and the connection would close.  We consume any message the browser
  might send (e.g. command ACKs) and log them; this is also where you
  would add command handling later.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from models.telemetry import TelemetrySnapshot
from services.telemetry_service import telemetry_service
from websocket.websocket_manager import connection_manager

logger = logging.getLogger(__name__)

router = APIRouter()


# ---------------------------------------------------------------------------
# REST — snapshot polling fallback
# ---------------------------------------------------------------------------

@router.get("/api/telemetry", response_model=TelemetrySnapshot | None)
async def get_current_telemetry() -> TelemetrySnapshot | None:
    """
    Returns the latest telemetry snapshot.
    Useful for:
      • initial page load (hydrate before WebSocket connects)
      • low-bandwidth fallback polling
      • integration testing without a live WebSocket client
    """
    return telemetry_service.get_telemetry()


# ---------------------------------------------------------------------------
# WebSocket — live stream
# ---------------------------------------------------------------------------

@router.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    """
    Accepts dashboard WebSocket connections.

    The connection is registered with ConnectionManager; the broadcast loop
    in main.py handles pushing snapshots.  This coroutine simply keeps the
    socket alive by consuming any incoming frames.
    """
    await connection_manager.connect(websocket)
    logger.info("New WebSocket dashboard client registered.")

    try:
        # Keep coroutine alive — receive any client messages (commands, pings)
        async for message in websocket.iter_text():
            # Future: parse command messages here
            # e.g.  {"type": "set_mode", "mode": "ARM"}
            logger.debug("Received from client: %s", message)

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected cleanly.")
    except Exception as exc:
        logger.warning("WebSocket error: %s", exc)
    finally:
        await connection_manager.disconnect(websocket)
