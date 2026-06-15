"""
models/telemetry.py
-------------------
Single source of truth for all Pydantic models.

CONTRACT: Every field name here MUST match RoverContext.jsx exactly.
The frontend destructures telemetry by key name — renaming anything here
will silently break the dashboard.

Architecture note:
  - TelemetrySnapshot is the root model broadcast over WebSocket and
    returned by GET /api/telemetry.
  - All sub-models are exported individually so rover_simulator.py and
    telemetry_service.py can construct them in isolation.
"""

from __future__ import annotations

from typing import Literal
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# GPS
# ---------------------------------------------------------------------------

class GPS(BaseModel):
    lat: float
    lng: float
    alt: float
    satellites: int
    lock: str                          # e.g. "3D_FIX", "2D_LOCK"
    hdop: float


# ---------------------------------------------------------------------------
# Battery
# ---------------------------------------------------------------------------

class Battery(BaseModel):
    percentage: float
    voltage: float
    current: float
    temp: float


# ---------------------------------------------------------------------------
# Network
# ---------------------------------------------------------------------------

class Network(BaseModel):
    latency: int
    jitter: int
    packetLoss: float
    frequency: int
    signalQuality: int
    heartbeat: bool


# ---------------------------------------------------------------------------
# System Nodes
# ---------------------------------------------------------------------------

class Nodes(BaseModel):
    jetson: str      # "healthy" | "warning" | "offline"
    rpi: str
    encoder: str
    sensor: str


# ---------------------------------------------------------------------------
# IMU
# ---------------------------------------------------------------------------

class IMU(BaseModel):
    roll: float
    pitch: float
    yaw: float
    stability: str   # "SECURE" | "DRIFT_WARNING"


# ---------------------------------------------------------------------------
# Anemometer
# ---------------------------------------------------------------------------

class Anemometer(BaseModel):
    speed: float
    direction: int
    dirName: str     # e.g. "WSW"
    gust: float
    trend: str       # "STEADY" | "GUSTING"


# ---------------------------------------------------------------------------
# Drive Motors  (6 wheels)
# ---------------------------------------------------------------------------

class DriveMotor(BaseModel):
    id: str          # e.g. "FL_DRIVE"
    name: str        # e.g. "FRONT LEFT"
    rpm: int
    angle: int
    pwm: int
    status: str      # "online" | "offline" | "warning"


# ---------------------------------------------------------------------------
# Arm Motors  (6 joints)
# ---------------------------------------------------------------------------

class ArmMotor(BaseModel):
    name: str        # e.g. "J1_BASE_YAW"
    angle: float
    rpm: int
    direction: str   # "IDLE" | "POS" | "NEG"
    encoder: str     # "OK_SYNC" | "N/A"


# ---------------------------------------------------------------------------
# Science Payload
# ---------------------------------------------------------------------------

class Science(BaseModel):
    temp: float
    humidity: int
    pressure: int
    co: int
    ch4: int
    airQuality: str      # "SAFE" | "WARNING" | "CRITICAL"
    soilN: int
    soilP: int
    soilK: int
    soilPh: float
    soilMoisture: int


# ---------------------------------------------------------------------------
# Root snapshot — this is the object broadcast to the frontend
# ---------------------------------------------------------------------------

class TelemetrySnapshot(BaseModel):
    """
    Root telemetry packet.  Matches the shape of `telemetry` state inside
    RoverContext.jsx so the frontend can spread it directly into setState.
    """
    timestamp: str

    gps: GPS
    heading: int
    speed: float

    battery: Battery
    network: Network
    nodes: Nodes
    imu: IMU
    anemometer: Anemometer

    driveMotors: list[DriveMotor]   # always 6 elements
    armMotors: list[ArmMotor]       # always 6 elements
    science: Science


# ---------------------------------------------------------------------------
# Health response model
# ---------------------------------------------------------------------------

class HealthResponse(BaseModel):
    status: str
    uptime_seconds: float
    connected_clients: int
    simulator_running: bool
    telemetry_hz: int
