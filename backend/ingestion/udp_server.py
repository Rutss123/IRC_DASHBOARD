"""
ingestion/udp_server.py
-----------------------
Asynchronous UDP telemetry listener implementing BaseIngestor.
Binds to port 9000 (configurable) and ingests incoming telemetry datagrams.
Never drops valid data due to strict schema mismatches.
"""

from __future__ import annotations

import asyncio
import json
import logging
import socket
from typing import Any, Dict

from config import settings
from core.mission_logger import mission_logger
from core.state_manager import state_manager
from ingestion.base import BaseIngestor

logger = logging.getLogger(__name__)


class UdpIngestor(BaseIngestor):
    """Async UDP server for rover telemetry datagrams."""

    def __init__(self, host: str = settings.UDP_INGEST_HOST, port: int = settings.UDP_INGEST_PORT) -> None:
        self.host = host
        self.port = port
        self._sock: socket.socket | None = None
        self._running = False
        self._task: asyncio.Task | None = None

        # Statistics
        self.packets_received = 0
        self.bytes_received = 0
        self.malformed_packets = 0

    async def start(self) -> None:
        """Create socket and launch async receive loop."""
        if self._running:
            return

        self._sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        # Allow immediate socket reuse
        self._sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self._sock.bind((self.host, self.port))
        self._sock.setblocking(False)

        self._running = True
        self._task = asyncio.create_task(self._receive_loop(), name="udp_ingest_loop")
        logger.info("UDP Telemetry Receiver bound to %s:%d", self.host, self.port)

    async def stop(self) -> None:
        """Cancel task and close socket cleanly."""
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None

        if self._sock:
            try:
                self._sock.close()
            except Exception:
                pass
            self._sock = None

        logger.info("UDP Telemetry Receiver stopped.")

    def is_running(self) -> bool:
        return self._running

    def get_stats(self) -> Dict[str, Any]:
        return {
            "driver": "udp",
            "host": self.host,
            "port": self.port,
            "is_running": self._running,
            "packets_received": self.packets_received,
            "bytes_received": self.bytes_received,
            "malformed_packets": self.malformed_packets,
        }

    async def _receive_loop(self) -> None:
        """Core async datagram reception loop."""
        loop = asyncio.get_running_loop()

        while self._running and self._sock:
            try:
                data, addr = await loop.sock_recvfrom(self._sock, 65535)
                self.packets_received += 1
                self.bytes_received += len(data)

                # Parse JSON
                try:
                    payload = json.loads(data.decode("utf-8"))
                except (json.JSONDecodeError, UnicodeDecodeError):
                    self.malformed_packets += 1
                    continue

                # Forward to StateManager and MissionLogger
                state_manager.ingest_packet(payload)
                mission_logger.log(payload)

            except asyncio.CancelledError:
                break
            except Exception as exc:
                if self._running:
                    logger.warning("UDP receive error: %s", exc)
                    await asyncio.sleep(0.01)  # Prevent tight loop on OS socket errors


udp_ingestor = UdpIngestor()
