"""
models/telemetry.py
-------------------
Tolerant, modular Pydantic models for rover telemetry.
All sub-models support optional fields and allow extra fields for forward compatibility.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class TolerantModel(BaseModel):
    """Base model that allows extra unknown fields and safely handles partial updates."""
    model_config = ConfigDict(extra="allow", populate_by_name=True)


# ---------------------------------------------------------------------------
# GPS
# ---------------------------------------------------------------------------

class GPS(TolerantModel):
    lat: float = 0.0
    lng: float = 0.0
    alt: float = 0.0
    satellites: int = 0
    lock: str = "NO_LOCK"          # "NO_LOCK", "2D_LOCK", "3D_FIX"
    hdop: float = 99.9


# ---------------------------------------------------------------------------
# Battery
# ---------------------------------------------------------------------------

class Battery(TolerantModel):
    percentage: float = 0.0
    voltage: float = 0.0
    current: float = 0.0
    temp: float = 0.0


# ---------------------------------------------------------------------------
# Network & Comms
# ---------------------------------------------------------------------------

class Network(TolerantModel):
    latency: int = 0
    jitter: int = 0
    packetLoss: float = 0.0
    frequency: int = 50
    signalQuality: int = 0
    heartbeat: bool = False


# ---------------------------------------------------------------------------
# System Nodes
# ---------------------------------------------------------------------------

class Nodes(TolerantModel):
    jetson: str = "offline"        # "healthy" | "warning" | "offline"
    rpi: str = "offline"
    encoder: str = "offline"
    sensor: str = "offline"


# ---------------------------------------------------------------------------
# IMU
# ---------------------------------------------------------------------------

class IMU(TolerantModel):
    roll: float = 0.0
    pitch: float = 0.0
    yaw: float = 0.0
    stability: str = "SECURE"      # "SECURE" | "DRIFT_WARNING"


# ---------------------------------------------------------------------------
# Anemometer
# ---------------------------------------------------------------------------

class Anemometer(TolerantModel):
    speed: float = 0.0
    direction: int = 0
    dirName: str = "N"
    gust: float = 0.0
    trend: str = "STEADY"


# ---------------------------------------------------------------------------
# Drive Motors
# ---------------------------------------------------------------------------

class DriveMotor(TolerantModel):
    id: str = "DRIVE"
    name: str = "DRIVE MOTOR"
    rpm: int = 0
    angle: int = 0
    pwm: int = 0
    status: str = "offline"        # "online" | "offline" | "warning"


# ---------------------------------------------------------------------------
# Arm Motors
# ---------------------------------------------------------------------------

class ArmMotor(TolerantModel):
    name: str = "JOINT"
    angle: float = 0.0
    rpm: int = 0
    direction: str = "IDLE"        # "IDLE" | "POS" | "NEG"
    encoder: str = "N/A"           # "OK_SYNC" | "N/A"


# ---------------------------------------------------------------------------
# Science Payload
# ---------------------------------------------------------------------------

class Science(TolerantModel):
    temp: float = 0.0
    humidity: int = 0
    pressure: int = 0
    co: int = 0
    ch4: int = 0
    airQuality: str = "SAFE"
    soilN: int = 0
    soilP: int = 0
    soilK: int = 0
    soilPh: float = 7.0
    soilMoisture: int = 0


# ---------------------------------------------------------------------------
# Root Snapshot Model (WebSocket broadcast & REST state)
# ---------------------------------------------------------------------------

class TelemetrySnapshot(TolerantModel):
    """
    Combined telemetry snapshot broadcast to dashboard clients.
    All sections are optional and resilient to missing data.
    """
    timestamp: str = ""
    is_stale: bool = True
    telemetry_hz: float = 0.0

    heading: int = 0
    speed: float = 0.0
    roverMode: str = "NAV"
    driverMode: str = "MANUAL"

    gps: GPS = Field(default_factory=GPS)
    battery: Battery = Field(default_factory=Battery)
    network: Network = Field(default_factory=Network)
    nodes: Nodes = Field(default_factory=Nodes)
    imu: IMU = Field(default_factory=IMU)
    anemometer: Anemometer = Field(default_factory=Anemometer)
    science: Science = Field(default_factory=Science)

    driveMotors: List[DriveMotor] = Field(default_factory=list)
    armMotors: List[ArmMotor] = Field(default_factory=list)

    # Dictionary for any arbitrary dynamic metrics or future custom subsystems
    custom: Dict[str, Any] = Field(default_factory=dict)
