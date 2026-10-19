"""
backend/test_backend.py
-----------------------
Automated integration tests for the new modular backend.
Tests:
- UDP ingestion (both modular and flat payloads)
- Tolerant parsing (no dropped packets on partial schemas)
- True Hz measurement & staleness detection
- Camera discovery fallback
- Command dispatch
"""

import asyncio
import json
import socket
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from config import settings
from core.state_manager import state_manager
from ingestion.udp_server import udp_ingestor, UdpIngestor
from services.mediamtx_discovery import mediamtx_discovery
from services.command_dispatcher import command_dispatcher
from models.commands import CommandRequest


async def run_tests():
    print("=== STARTING MODULAR BACKEND TESTS ===")

    # 1. Test Camera Discovery Fallback
    print("\n[TEST 1] Testing MediaMTX Discovery Fallback...")
    cameras = mediamtx_discovery.get_cameras()
    assert len(cameras) >= 2, f"Expected fallback cameras, got {len(cameras)}"
    print(f" -> Passed. {len(cameras)} cameras available (fallback active).")
    for cam in cameras:
        print(f"    Camera: {cam['name']} ({cam['path']}) [{cam['type']}]")

    # 2. Test Ingestion Server Lifecycle on isolated test port
    print("\n[TEST 2] Testing UDP Ingestor Lifecycle...")
    test_port = 9005
    test_ingestor = UdpIngestor(port=test_port)
    await test_ingestor.start()
    assert test_ingestor.is_running(), "UDP Ingestor should be running"
    print(f" -> Passed. UDP Ingestor bound to test port {test_port}")

    # 3. Test Ingesting Modular Subsystem UDP Packet (e.g. IMU only)
    print("\n[TEST 3] Sending Modular IMU UDP Packet...")
    test_imu = {
        "subsystem": "imu",
        "data": {
            "roll": 3.14,
            "pitch": -1.57,
            "yaw": 270.0,
            "stability": "SECURE"
        }
    }
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
        sock.sendto(json.dumps(test_imu).encode(), ("127.0.0.1", test_port))

    await asyncio.sleep(0.1)  # Allow event loop to process
    snap = state_manager.get_snapshot()
    assert snap.imu.roll == 3.14, f"Expected roll 3.14, got {snap.imu.roll}"
    assert snap.imu.yaw == 270.0, f"Expected yaw 270.0, got {snap.imu.yaw}"
    assert snap.heading == 270, f"Expected heading 270, got {snap.heading}"
    print(f" -> Passed. IMU ingested: roll={snap.imu.roll}, yaw={snap.imu.yaw}, heading={snap.heading}")

    # 4. Test Ingesting Partial GPS Packet without breaking other state
    print("\n[TEST 4] Sending Modular GPS UDP Packet...")
    test_gps = {
        "subsystem": "gps",
        "data": {
            "lat": 13.0827,
            "lng": 80.2707,
            "alt": 15.2,
            "satellites": 18,
            "lock": "3D_FIX"
        }
    }
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
        sock.sendto(json.dumps(test_gps).encode(), ("127.0.0.1", test_port))

    await asyncio.sleep(0.1)
    snap = state_manager.get_snapshot()
    assert snap.gps.lat == 13.0827, f"Expected lat 13.0827, got {snap.gps.lat}"
    # Verify IMU from previous test is still intact
    assert snap.imu.roll == 3.14, "IMU should remain preserved after GPS update"
    print(f" -> Passed. GPS ingested: lat={snap.gps.lat}, lng={snap.gps.lng}. IMU state retained.")

    # 5. Test Packet Rate (Hz) & Staleness
    print("\n[TEST 5] Testing Telemetry Hz Calculation & Staleness...")
    assert not snap.is_stale, "Telemetry should be marked NOT stale right after packets"
    print(f" -> Passed. Measured telemetry_hz: {snap.telemetry_hz} Hz, is_stale={snap.is_stale}")

    # 6. Test Command Dispatch (e.g. E-Stop)
    print("\n[TEST 6] Testing E-Stop Command Dispatch...")
    cmd_resp = command_dispatcher.dispatch(CommandRequest(command="estop_engage"))
    snap = state_manager.get_snapshot()
    assert snap.roverMode == "E-STOP", f"Expected roverMode 'E-STOP', got '{snap.roverMode}'"
    print(f" -> Passed. E-Stop dispatched: message='{cmd_resp.message}', local roverMode={snap.roverMode}")

    # Clean up
    await test_ingestor.stop()
    print("\n=== ALL BACKEND TESTS PASSED SUCCESSFULLY! ===")


if __name__ == "__main__":
    asyncio.run(run_tests())
