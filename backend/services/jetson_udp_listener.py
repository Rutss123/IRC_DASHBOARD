import socket
import asyncio
import json

from models.telemetry import TelemetrySnapshot
from services.telemetry_service import telemetry_service


async def run_udp_listener(host="0.0.0.0", port=9000):

    print(f"UDP Listener started on {host}:{port}")

    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

    sock.bind((host, port))

    sock.setblocking(False)

    loop = asyncio.get_running_loop()

    while True:
        try:
            data, addr = await loop.sock_recvfrom(sock, 8192)

            packet = json.loads(data.decode())

            print("UDP PACKET RECEIVED")

            snapshot = TelemetrySnapshot(**packet)

            telemetry_service.update_telemetry(snapshot)

        except Exception as e:
            print("UDP ERROR:", e)