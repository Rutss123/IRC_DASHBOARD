"""
core/state_manager.py
---------------------
Central state repository for the ground station.
Maintains subsystem state caches, tracks packet frequencies, and evaluates staleness.
"""

from __future__ import annotations

import asyncio
import time
from collections import deque
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from config import settings
from models.telemetry import (
    GPS, Battery, Network, Nodes, IMU, Anemometer,
    DriveMotor, ArmMotor, Science, TelemetrySnapshot,
)


class StateManager:
    """Thread-safe and asyncio-friendly rover telemetry state repository."""

    def __init__(self) -> None:
        self._start_time: float = time.monotonic()
        self._last_packet_time: Optional[float] = None
        self._total_packets_received: int = 0
        self._dropped_packets: int = 0

        # Subsystem caches
        self._gps = GPS()
        self._battery = Battery()
        self._network = Network()
        self._nodes = Nodes()
        self._imu = IMU()
        self._anemometer = Anemometer()
        self._science = Science()
        self._drive_motors: list[DriveMotor] = []
        self._arm_motors: list[ArmMotor] = []
        self._custom_fields: Dict[str, Any] = {}

        self._heading: int = 0
        self._speed: float = 0.0
        self._rover_mode: str = "NAV"
        self._driver_mode: str = "MANUAL"

        # Sliding window for true Hz measurement (timestamps of packets in the last 2 seconds)
        self._packet_timestamps: deque[float] = deque()

        # Update event for broadcaster coroutine
        self._update_event: asyncio.Event = asyncio.Event()

    # ------------------------------------------------------------------
    # Write Path (Ingestion)
    # ------------------------------------------------------------------

    def ingest_packet(self, raw_data: Dict[str, Any]) -> None:
        """
        Ingest a packet from UDP or any other source.
        Supports both modular subsystem packets and full snapshots.
        """
        now = time.monotonic()
        self._last_packet_time = now
        self._total_packets_received += 1
        self._packet_timestamps.append(now)

        # Prune timestamps older than 2.0s
        cutoff = now - 2.0
        while self._packet_timestamps and self._packet_timestamps[0] < cutoff:
            self._packet_timestamps.popleft()

        # 1. Check if packet is a modular topic envelope: e.g. {"subsystem": "imu", "data": {...}}
        subsystem = raw_data.get("subsystem") or raw_data.get("topic") or raw_data.get("type")
        payload = raw_data.get("data") if "data" in raw_data and isinstance(raw_data["data"], dict) else raw_data

        if subsystem and isinstance(subsystem, str):
            subsystem_lower = subsystem.lower()
            self._update_subsystem(subsystem_lower, payload)
        else:
            # 2. Otherwise, treat as flat or nested dictionary snapshot
            self._update_from_dict(raw_data)

        # Notify awaiting broadcasters
        self._update_event.set()

    def _update_subsystem(self, subsystem: str, data: Dict[str, Any]) -> None:
        """Update a specific subsystem without touching others."""
        try:
            if subsystem in ("gps", "nav"):
                self._gps = GPS(**data)
            elif subsystem in ("imu", "orientation", "attitude"):
                self._imu = IMU(**data)
                if "yaw" in data and isinstance(data["yaw"], (int, float)):
                    self._heading = int(data["yaw"]) % 360
            elif subsystem in ("battery", "power"):
                self._battery = Battery(**data)
            elif subsystem in ("network", "comms"):
                self._network = Network(**data)
            elif subsystem in ("nodes", "heartbeat"):
                self._nodes = Nodes(**data)
            elif subsystem in ("anemometer", "wind"):
                self._anemometer = Anemometer(**data)
            elif subsystem in ("science", "sensors"):
                self._science = Science(**data)
            elif subsystem in ("drive", "drive_motors", "drivetrain"):
                motors = data.get("motors", data)
                if isinstance(motors, list):
                    self._drive_motors = [DriveMotor(**m) if isinstance(m, dict) else m for m in motors]
            elif subsystem in ("arm", "arm_motors", "manipulator"):
                motors = data.get("motors", data)
                if isinstance(motors, list):
                    self._arm_motors = [ArmMotor(**m) if isinstance(m, dict) else m for m in motors]
            else:
                self._custom_fields[subsystem] = data
        except Exception:
            self._dropped_packets += 1

    def _update_from_dict(self, data: Dict[str, Any]) -> None:
        """Update multiple subsystems from a multi-key dictionary."""
        if "gps" in data and isinstance(data["gps"], dict):
            self._gps = GPS(**data["gps"])
        if "heading" in data and isinstance(data["heading"], (int, float)):
            self._heading = int(data["heading"]) % 360
        if "speed" in data and isinstance(data["speed"], (int, float)):
            self._speed = float(data["speed"])
        if "roverMode" in data and isinstance(data["roverMode"], str):
            self._rover_mode = data["roverMode"]
        if "driverMode" in data and isinstance(data["driverMode"], str):
            self._driver_mode = data["driverMode"]

        if "battery" in data and isinstance(data["battery"], dict):
            self._battery = Battery(**data["battery"])
        if "network" in data and isinstance(data["network"], dict):
            self._network = Network(**data["network"])
        if "nodes" in data and isinstance(data["nodes"], dict):
            self._nodes = Nodes(**data["nodes"])
        if "imu" in data and isinstance(data["imu"], dict):
            self._imu = IMU(**data["imu"])
        if "anemometer" in data and isinstance(data["anemometer"], dict):
            self._anemometer = Anemometer(**data["anemometer"])
        if "science" in data and isinstance(data["science"], dict):
            self._science = Science(**data["science"])

        if "driveMotors" in data and isinstance(data["driveMotors"], list):
            self._drive_motors = [DriveMotor(**m) if isinstance(m, dict) else m for m in data["driveMotors"]]
        if "armMotors" in data and isinstance(data["armMotors"], list):
            self._arm_motors = [ArmMotor(**m) if isinstance(m, dict) else m for m in data["armMotors"]]

    def set_system_mode(self, rover_mode: Optional[str] = None, driver_mode: Optional[str] = None) -> None:
        """Update system operating modes from operator commands."""
        if rover_mode:
            self._rover_mode = rover_mode
        if driver_mode:
            self._driver_mode = driver_mode
        self._update_event.set()

    # ------------------------------------------------------------------
    # Read Path
    # ------------------------------------------------------------------

    @property
    def is_stale(self) -> bool:
        """True if no packet has been received within the configured timeout."""
        if self._last_packet_time is None:
            return True
        return (time.monotonic() - self._last_packet_time) > settings.TELEMETRY_STALE_TIMEOUT_S

    @property
    def current_hz(self) -> float:
        """Calculate actual measured packet frequency over the sliding window."""
        now = time.monotonic()
        cutoff = now - 1.0
        recent = [t for t in self._packet_timestamps if t >= cutoff]
        return float(len(recent))

    @property
    def uptime_seconds(self) -> float:
        return round(time.monotonic() - self._start_time, 2)

    @property
    def total_packets(self) -> int:
        return self._total_packets_received

    @property
    def dropped_packets(self) -> int:
        return self._dropped_packets

    def get_snapshot(self) -> TelemetrySnapshot:
        """Generate a complete telemetry snapshot."""
        now_iso = datetime.now(timezone.utc).isoformat()
        return TelemetrySnapshot(
            timestamp=now_iso,
            is_stale=self.is_stale,
            telemetry_hz=round(self.current_hz, 1),
            heading=self._heading,
            speed=self._speed,
            roverMode=self._rover_mode,
            driverMode=self._driver_mode,
            gps=self._gps,
            battery=self._battery,
            network=self._network,
            nodes=self._nodes,
            imu=self._imu,
            anemometer=self._anemometer,
            science=self._science,
            driveMotors=self._drive_motors,
            armMotors=self._arm_motors,
            custom=self._custom_fields,
        )

    async def wait_for_update(self, timeout: float = 0.5) -> TelemetrySnapshot:
        """Wait until a new packet arrives or timeout expires."""
        try:
            await asyncio.wait_for(self._update_event.wait(), timeout=timeout)
            self._update_event.clear()
        except asyncio.TimeoutError:
            pass
        return self.get_snapshot()


state_manager = StateManager()
