"""
core/broadcaster.py
-------------------
High-performance, non-blocking WebSocket connection manager.
Implements per-client queues with backpressure handling (drops stale frames for slow clients)
so a lagging connection never stalls the broadcast loop or other operators.
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Dict
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)


class WebSocketClient:
    """Encapsulates a connected WebSocket with an isolated message queue and sender task."""

    def __init__(self, websocket: WebSocket, queue_size: int = 10) -> None:
        self.websocket = websocket
        self.queue: asyncio.Queue[str] = asyncio.Queue(maxsize=queue_size)
        self.task: asyncio.Task | None = None
        self.is_alive = True

    async def start(self) -> None:
        """Start the background consumer task for this client."""
        self.task = asyncio.create_task(self._consumer(), name=f"ws_sender_{id(self.websocket)}")

    async def stop(self) -> None:
        """Cancel and clean up the client task."""
        self.is_alive = False
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass

    def enqueue(self, message: str) -> None:
        """Put message into queue. Drops oldest message if queue is full."""
        if not self.is_alive:
            return
        if self.queue.full():
            try:
                self.queue.get_nowait()
            except asyncio.QueueEmpty:
                pass
        try:
            self.queue.put_nowait(message)
        except asyncio.QueueFull:
            pass

    async def _consumer(self) -> None:
        """Drain the queue and send frames over the WebSocket."""
        try:
            while self.is_alive:
                message = await self.queue.get()
                await self.websocket.send_text(message)
                self.queue.task_done()
        except asyncio.CancelledError:
            pass
        except Exception as exc:
            logger.debug("Client consumer terminated: %s", exc)
        finally:
            self.is_alive = False


class Broadcaster:
    """Manages pool of connected WebSocket clients with non-blocking fan-out."""

    def __init__(self) -> None:
        self._clients: Dict[WebSocket, WebSocketClient] = {}
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket) -> None:
        """Accept handshake and register client with isolated sender task."""
        await websocket.accept()
        client = WebSocketClient(websocket)
        await client.start()

        async with self._lock:
            self._clients[websocket] = client

        logger.info("WebSocket connected. Active clients: %d", len(self._clients))

        # Send initial connection acknowledgment
        ack = json.dumps({"type": "connection_ack", "status": "connected", "server_time": asyncio.get_event_loop().time()})
        client.enqueue(ack)

    async def disconnect(self, websocket: WebSocket) -> None:
        """Clean up and deregister a client."""
        async with self._lock:
            client = self._clients.pop(websocket, None)

        if client:
            await client.stop()
            logger.info("WebSocket disconnected. Remaining clients: %d", len(self._clients))

    async def broadcast(self, payload: dict) -> None:
        """Serialize payload once and enqueue concurrently to all clients."""
        if not self._clients:
            return

        json_str = json.dumps(payload)
        async with self._lock:
            clients_snapshot = list(self._clients.values())

        for client in clients_snapshot:
            if client.is_alive:
                client.enqueue(json_str)

    @property
    def client_count(self) -> int:
        return len(self._clients)


broadcaster = Broadcaster()
