"""
services/telemetry_service.py
------------------------------
Singleton service that owns the single "latest known rover state".

Data flow:
  [Simulator / Jetson UDP listener]
        │
        ▼  update_telemetry(snapshot)
  TelemetryService  ──► get_telemetry() ──► REST GET /api/telemetry
        │
        └──► subscribers notified via asyncio.Event
              │
              ▼
        WebSocketManager.broadcast()

Why a singleton?
  FastAPI creates one application instance; a module-level singleton means
  every router, background task, and WebSocket handler shares the same
  in-memory state without needing dependency injection boilerplate.

Future Jetson integration:
  Replace or augment the simulator by pointing a UDP listener at this
  service:

      packet = await udp_socket.recvfrom(4096)
      snapshot = parse_jetson_packet(packet)
      telemetry_service.update_telemetry(snapshot)

  The rest of the pipeline (WebSocket broadcast, REST endpoint) is
  unchanged — the service acts as a stable internal bus.
"""

from __future__ import annotations

import asyncio
import time
from typing import Optional

from models.telemetry import TelemetrySnapshot


class TelemetryService:
    """Thread-safe (asyncio-safe) store for the latest telemetry snapshot."""

    def __init__(self) -> None:
        self._snapshot: Optional[TelemetrySnapshot] = None
        # Asyncio Event used to wake up the WebSocket broadcaster whenever
        # fresh telemetry arrives without polling.
        self._update_event: asyncio.Event = asyncio.Event()
        self._start_time: float = time.monotonic()
        self._update_count: int = 0

    # ------------------------------------------------------------------
    # Write path
    # ------------------------------------------------------------------

    def update_telemetry(self, snapshot: TelemetrySnapshot) -> None:
        """
        Called by the simulator or (future) Jetson UDP receiver.
        Stores the latest snapshot and signals any awaiting coroutines.
        """
        self._snapshot = snapshot
        self._update_count += 1
        # Wake up the broadcast loop — set() is safe from any coroutine.
        self._update_event.set()

    # ------------------------------------------------------------------
    # Read path
    # ------------------------------------------------------------------

    def get_telemetry(self) -> Optional[TelemetrySnapshot]:
        """Returns the latest snapshot, or None if none received yet."""
        return self._snapshot

    # ------------------------------------------------------------------
    # Broadcast helper
    # ------------------------------------------------------------------

    async def wait_for_update(self) -> TelemetrySnapshot:
        """
        Coroutine: suspends until a new snapshot arrives, then returns it.
        Used by the WebSocket broadcast loop so it never busy-polls.
        """
        await self._update_event.wait()
        self._update_event.clear()
        return self._snapshot  # type: ignore[return-value]

    # ------------------------------------------------------------------
    # Diagnostics
    # ------------------------------------------------------------------

    @property
    def uptime_seconds(self) -> float:
        return time.monotonic() - self._start_time

    @property
    def update_count(self) -> int:
        return self._update_count


# Module-level singleton — import this everywhere.
telemetry_service = TelemetryService()
