"""
simulators/rover_simulator.py
------------------------------
Generates high-fidelity synthetic telemetry at 10 Hz that exactly mirrors
the simulation logic inside RoverContext.jsx.

This module is the ONLY place that produces fake data.  When you integrate
real hardware, you simply stop calling start_simulator() and instead start
your Jetson UDP / serial listener — the rest of the pipeline is unchanged.

Design decisions:
  • All mutable rover state (GPS position, bearing, arm angles, …) lives in
    a RoverSimulatorState dataclass so the loop function is stateless and
    easy to test.
  • math functions are kept identical to the JS originals so QA can compare
    outputs side-by-side.
  • The loop calls telemetry_service.update_telemetry() which in turn wakes
    the WebSocket broadcaster.

Replacing with real hardware:
  1. Comment out  asyncio.create_task(run_simulator())  in main.py startup.
  2. Create  services/jetson_udp_listener.py  (see main.py docstring).
  3. In the UDP receive loop call:
       telemetry_service.update_telemetry(parsed_snapshot)
  No other file needs to change.
"""

from __future__ import annotations

import asyncio
import math
import time
from dataclasses import dataclass, field
from typing import List

from models.telemetry import (
    GPS, Battery, Network, Nodes, IMU, Anemometer,
    DriveMotor, ArmMotor, Science, TelemetrySnapshot,
)
from services.telemetry_service import telemetry_service

# ---------------------------------------------------------------------------
# Simulation tick interval — 10 Hz
# ---------------------------------------------------------------------------
TICK_INTERVAL_S: float = 0.10

# ---------------------------------------------------------------------------
# Compass rose used for anemometer direction names
# ---------------------------------------------------------------------------
_COMPASS = [
    "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
]


# ---------------------------------------------------------------------------
# Persistent state carried between ticks (mirrors JS closure variables)
# ---------------------------------------------------------------------------

@dataclass
class _SimState:
    gps_lat: float = 12.9716
    gps_lng: float = 77.5946
    bearing: float = 182.0
    battery_pct: float = 94.2
    drive_angles: List[float] = field(
        default_factory=lambda: [142.0, 142.0, 142.0, 142.0, 142.0, 142.0]
    )
    arm_angles: List[float] = field(
        default_factory=lambda: [45.2, -24.8, 88.4, 12.6, -5.0, 120.0]
    )
    arm_rpms: List[int] = field(default_factory=lambda: [0] * 6)
    arm_dirs: List[str] = field(default_factory=lambda: ["IDLE"] * 6)
    soil_moisture: int = 48
    pressure: int = 1008
    soil_n: int = 42
    soil_p: int = 18
    soil_k: int = 35
    # Rover operational mode — kept in sync with commands received via REST
    rover_mode: str = "NAV"
    driver_mode: str = "MANUAL"


_DRIVE_IDS = ["FL_DRIVE", "FR_DRIVE", "ML_DRIVE", "MR_DRIVE", "RL_DRIVE", "RR_DRIVE"]
_DRIVE_NAMES = ["FRONT LEFT", "FRONT RIGHT", "MIDDLE LEFT", "MIDDLE RIGHT", "REAR LEFT", "REAR RIGHT"]
_ARM_NAMES = ["J1_BASE_YAW", "J2_SHLDR_PITCH", "J3_ELBOW_PITCH",
              "J4_WRIST_PITCH", "J5_WRIST_ROLL", "J6_GRIPPER_ROT"]
_ARM_ENCODERS = ["OK_SYNC", "OK_SYNC", "OK_SYNC", "OK_SYNC", "OK_SYNC", "N/A"]


# Module-level state — persists across ticks
_state = _SimState()


def get_sim_state() -> _SimState:
    """Expose state reference so REST command endpoints can update mode."""
    return _state


# ---------------------------------------------------------------------------
# Core tick function — pure computation, easy to unit test
# ---------------------------------------------------------------------------

def _tick(state: _SimState, time_ms: float) -> TelemetrySnapshot:
    """Compute one telemetry snapshot from current state + wall-clock time."""

    is_estop = state.rover_mode == "E-STOP"
    is_arm_active = state.rover_mode == "ARM"
    is_moving = not is_estop and (
        state.driver_mode == "AUTONOMOUS" or state.rover_mode == "NAV"
    )

    slow_tick = math.floor(time_ms / 1200)
    medium_tick = math.floor(time_ms / 600)

    # ── Speed ──────────────────────────────────────────────────────────────
    current_speed: float
    if is_estop:
        current_speed = 0.0
    elif is_moving:
        current_speed = round(0.95 + math.sin(time_ms / 8000) * 0.08, 2)
    else:
        current_speed = 0.0

    # ── Bearing ────────────────────────────────────────────────────────────
    if is_moving:
        state.bearing = (state.bearing + math.sin(time_ms / 30000) * 0.3) % 360

    # ── GPS drift ──────────────────────────────────────────────────────────
    if is_moving and current_speed > 0:
        scale = 0.00000006 * current_speed
        state.gps_lat += scale * math.cos(math.radians(state.bearing))
        state.gps_lng += scale * math.sin(math.radians(state.bearing))

    # ── IMU ────────────────────────────────────────────────────────────────
    spd_factor = current_speed if current_speed > 0 else 0.2
    roll = round(0.5 + math.sin(time_ms / 12000) * 0.8 * spd_factor, 1)
    pitch = round(-1.0 + math.cos(time_ms / 10000) * 0.6 * spd_factor, 1)
    stability = "DRIFT_WARNING" if abs(roll) > 2.5 or abs(pitch) > 2.5 else "SECURE"

    # ── Anemometer ─────────────────────────────────────────────────────────
    wind_speed = round(2.8 + math.sin(time_ms / 25000) * 0.8, 1)
    wind_dir = int((245 + math.sin(time_ms / 35000) * 10 + 360) % 360)
    wind_gust = round(wind_speed + 1.2 + math.cos(time_ms / 12000) * 0.3, 1)
    dir_idx = round((wind_dir % 360) / 22.5) % 16
    wind_trend = "GUSTING" if wind_speed > 4.5 else "STEADY"

    # ── Drive motors ───────────────────────────────────────────────────────
    if current_speed > 0:
        state.drive_angles = [
            (a + round(current_speed * 4)) % 360
            for a in state.drive_angles
        ]

    rpm_val = 0 if current_speed == 0 else int(current_speed * 85 + math.sin(medium_tick) * 1.5)
    pwm_val = 0 if current_speed == 0 else min(255, int(current_speed * 120 + 15 + math.sin(medium_tick)))

    drive_motors = [
        DriveMotor(
            id=_DRIVE_IDS[i],
            name=_DRIVE_NAMES[i],
            rpm=rpm_val,
            angle=int(state.drive_angles[i]),
            pwm=pwm_val,
            status="online",
        )
        for i in range(6)
    ]

    # ── Arm motors ─────────────────────────────────────────────────────────
    for idx in range(6):
        is_active = is_arm_active and (math.sin(slow_tick + idx) > 0.4)
        if is_active:
            delta = round(math.sin(time_ms / 1200 + idx) * 0.5, 1)
            state.arm_angles[idx] = round(state.arm_angles[idx] + delta, 1)
            state.arm_rpms[idx] = int(3 + abs(math.sin(slow_tick)) * 3)
            state.arm_dirs[idx] = "POS" if delta > 0 else "NEG"
        else:
            state.arm_rpms[idx] = 0
            state.arm_dirs[idx] = "IDLE"

    arm_motors = [
        ArmMotor(
            name=_ARM_NAMES[i],
            angle=state.arm_angles[i],
            rpm=state.arm_rpms[i],
            direction=state.arm_dirs[i],
            encoder=_ARM_ENCODERS[i],
        )
        for i in range(6)
    ]

    # ── Science payload ────────────────────────────────────────────────────
    temp_drift = round(math.sin(slow_tick / 15) * 0.12, 2)
    science_temp = round(28.2 + temp_drift, 1)
    humidity = min(100, max(0, 54 + int(math.sin(slow_tick / 20))))
    co = max(5, 24 + int(math.sin(slow_tick / 10)))
    ch4 = max(2, 11 + int(math.cos(slow_tick / 15) * 0.5))
    air_q = "SAFE"
    if co > 30 or ch4 > 15:
        air_q = "WARNING"
    if co > 45 or ch4 > 25:
        air_q = "CRITICAL"
    soil_ph = round(6.8 + math.sin(slow_tick / 30) * 0.01, 2)

    # ── Battery ────────────────────────────────────────────────────────────
    state.battery_pct = max(0.0, state.battery_pct - 0.00008)
    batt_voltage = round(23.8 + (state.battery_pct / 100) * 1.2 + math.sin(time_ms / 30000) * 0.04, 2)
    batt_current = round(2.5 + current_speed * 0.8 + (0.4 if is_arm_active else 0) + math.sin(time_ms / 15000) * 0.1, 2)
    batt_temp = round(31.5 + current_speed * 0.8 + math.sin(time_ms / 20000) * 0.4, 1)

    # ── Network ────────────────────────────────────────────────────────────
    net_latency = int(20 + math.sin(slow_tick / 6) * 1.5)
    net_jitter = int(1 + abs(math.sin(slow_tick / 12)) * 0.8)
    net_loss = round(0.02 + abs(math.cos(slow_tick / 25)) * 0.01, 3)
    net_signal = int(97 + math.sin(slow_tick / 50))
    heartbeat = int(time_ms) % 2000 > 120

    # ── Nodes ──────────────────────────────────────────────────────────────
    node_jetson = "warning" if is_estop else "healthy"
    node_encoder = "warning" if is_estop else "healthy"

    # ── Assemble snapshot ──────────────────────────────────────────────────
    return TelemetrySnapshot(
        timestamp=_iso_now(),
        gps=GPS(
            lat=state.gps_lat,
            lng=state.gps_lng,
            alt=round(920.4 + math.sin(time_ms / 10000) * 0.6, 1),
            satellites=14,
            lock="2D_LOCK" if is_estop else "3D_FIX",
            hdop=0.82,
        ),
        heading=int(state.bearing) % 360,
        speed=current_speed,
        battery=Battery(
            percentage=round(state.battery_pct, 1),
            voltage=batt_voltage,
            current=batt_current,
            temp=batt_temp,
        ),
        network=Network(
            latency=net_latency,
            jitter=net_jitter,
            packetLoss=net_loss,
            frequency=50,
            signalQuality=net_signal,
            heartbeat=heartbeat,
        ),
        nodes=Nodes(
            jetson=node_jetson,
            rpi="healthy",
            encoder=node_encoder,
            sensor="healthy",
        ),
        imu=IMU(roll=roll, pitch=pitch, yaw=int(state.bearing) % 360, stability=stability),
        anemometer=Anemometer(
            speed=wind_speed,
            direction=wind_dir,
            dirName=_COMPASS[dir_idx],
            gust=wind_gust,
            trend=wind_trend,
        ),
        driveMotors=drive_motors,
        armMotors=arm_motors,
        science=Science(
            temp=science_temp,
            humidity=humidity,
            pressure=state.pressure,
            co=co,
            ch4=ch4,
            airQuality=air_q,
            soilN=state.soil_n,
            soilP=state.soil_p,
            soilK=state.soil_k,
            soilPh=soil_ph,
            soilMoisture=state.soil_moisture,
        ),
    )


# ---------------------------------------------------------------------------
# Async simulator loop
# ---------------------------------------------------------------------------

_running = False


async def run_simulator() -> None:
    """
    Background coroutine: runs at 10 Hz, pushes each tick into
    TelemetryService.  Launched via asyncio.create_task() in main.py startup.
    """
    global _running
    _running = True

    while _running:
        time_ms = time.time() * 1000  # milliseconds, mirrors Date.now() in JS
        snapshot = _tick(_state, time_ms)
        telemetry_service.update_telemetry(snapshot)
        await asyncio.sleep(TICK_INTERVAL_S)


def stop_simulator() -> None:
    global _running
    _running = False


def is_running() -> bool:
    return _running


# ---------------------------------------------------------------------------
# Utility
# ---------------------------------------------------------------------------

def _iso_now() -> str:
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat()
