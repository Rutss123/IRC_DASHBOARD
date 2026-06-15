"""
websocket/websocket_manager.py
-------------------------------
Manages all active WebSocket dashboard connections.

Responsibilities:
  • accept() and register new client connections
  • clean up on disconnect (graceful or abrupt)
  • broadcast JSON telemetry payloads to all connected clients in parallel

Architecture:
  One ConnectionManager singleton is shared across the entire application.
  FastAPI's WebSocket objects are stored in a plain set; asyncio.gather()
  sends to all of them concurrently so a slow client cannot block others.

WebSocket flow:
  1. Browser opens  ws://<host>/ws
  2. connect(websocket) stores the socket and sends an ACK ping.
  3. broadcast_telemetry() is called by the broadcast loop in main.py
     at 10 Hz and fans out the JSON payload to every stored socket.
  4. If a socket raises on send (client disconnected), it is silently
     removed from the active set.

Error handling:
  Each send is individually try/caught; one bad connection never
  prevents delivery to healthy clients.
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Set

from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages the pool of live WebSocket dashboard clients."""

    def __init__(self) -> None:
        # Using a set so connect/disconnect are O(1)
        self._active: Set[WebSocket] = set()

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    async def connect(self, websocket: WebSocket) -> None:
        """Accept a new WebSocket handshake and register the client."""
        await websocket.accept()
        self._active.add(websocket)
        logger.info(
            "WebSocket client connected. Total clients: %d", len(self._active)
        )
        # Immediately acknowledge so the frontend knows the pipe is alive.
        await self._send_one(websocket, {"type": "connection_ack", "status": "connected"})

    async def disconnect(self, websocket: WebSocket) -> None:
        """Deregister a client (called on graceful close or error)."""
        self._active.discard(websocket)
        logger.info(
            "WebSocket client disconnected. Remaining clients: %d", len(self._active)
        )

    # ------------------------------------------------------------------
    # Broadcasting
    # ------------------------------------------------------------------

    async def broadcast(self, payload: dict) -> None:
        """
        Send `payload` as JSON to every connected client concurrently.
        Dead sockets are pruned from the active set automatically.
        """
        print("CLIENTS:", len(self._active))    
        if not self._active:
            return
        

        dead: Set[WebSocket] = set()

        async def _send(ws: WebSocket) -> None:
            try:
                await ws.send_text(json.dumps(payload))
            except Exception:
                dead.add(ws)

        # Fan-out: all sends in parallel
        await asyncio.gather(*[_send(ws) for ws in self._active])

        # Prune sockets that failed during this broadcast round
        for ws in dead:
            await self.disconnect(ws)

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    async def _send_one(self, websocket: WebSocket, payload: dict) -> None:
        """Best-effort send to a single client; errors are suppressed."""
        try:
            await websocket.send_text(json.dumps(payload))
        except Exception as exc:
            logger.debug("Failed to send to single client: %s", exc)

    @property
    def client_count(self) -> int:
        return len(self._active)


# Module-level singleton
connection_manager = ConnectionManager()
