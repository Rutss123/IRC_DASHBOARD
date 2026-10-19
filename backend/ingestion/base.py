"""
ingestion/base.py
-----------------
Abstract base class for telemetry ingestion drivers (UDP, ROS2, Serial, etc.).
Allows ground station to switch or combine transport mechanisms seamlessly.
"""

from __future__ import annotations
from abc import ABC, abstractmethod
from typing import Any, Dict


class BaseIngestor(ABC):
    """Abstract telemetry ingestion driver."""

    @abstractmethod
    async def start(self) -> None:
        """Start listening for incoming telemetry."""
        pass

    @abstractmethod
    async def stop(self) -> None:
        """Stop listening and release resources."""
        pass

    @abstractmethod
    def is_running(self) -> bool:
        """Check if driver is actively ingesting."""
        pass

    @abstractmethod
    def get_stats(self) -> Dict[str, Any]:
        """Return driver diagnostics (e.g. packets received, error counts)."""
        pass
