/**
 * Telemetry Service Layer
 * Isolates telemetry payload parsing, validation, and standardizing.
 * Prepared for WebSocket payload parsing and FastAPI integration.
 */

export const parseTelemetryPacket = (rawPacket) => {
  try {
    const data = typeof rawPacket === "string" ? JSON.parse(rawPacket) : rawPacket;
    return {
      timestamp: data.timestamp || new Date().toISOString(),
      battery: {
        percentage: Math.min(100, Math.max(0, data.battery?.percentage ?? 100)),
        voltage: data.battery?.voltage || 24.2,
        current: data.battery?.current || 3.4, // Amps
        temp: data.battery?.temp || 32, // Celsius
      },
      gps: {
        lat: data.gps?.lat || 12.9716,
        lng: data.gps?.lng || 77.5946,
        alt: data.gps?.alt || 920, // meters
        satellites: data.gps?.satellites || 12,
        lock: data.gps?.lock || "3D_FIX", // "NO_LOCK", "2D", "3D", "3D_FIX"
        hdop: data.gps?.hdop || 0.82,
      },
      heading: data.heading ?? 0, // 0 to 359 degrees
      speed: data.speed ?? 0.0, // meters/sec
      roverMode: data.roverMode || "NAV", // "NAV", "SCIENCE", "ARM", "E-STOP"
      motorTemp: {
        frontLeft: data.motorTemp?.frontLeft || 42.4,
        frontRight: data.motorTemp?.frontRight || 41.8,
        rearLeft: data.motorTemp?.rearLeft || 44.1,
        rearRight: data.motorTemp?.rearRight || 43.6,
      },
      network: {
        latency: data.network?.latency || 24, // ms
        jitter: data.network?.jitter || 2, // ms
        packetLoss: data.network?.packetLoss || 0.1, // percentage
        frequency: data.network?.frequency || 50, // hz telemetry frequency
        signalQuality: data.network?.signalQuality || 96, // percentage
        heartbeat: data.network?.heartbeat ?? true,
      },
      nodes: {
        jetson: data.nodes?.jetson || "healthy", // "healthy", "warning", "critical"
        rpi: data.nodes?.rpi || "healthy",
        encoder: data.nodes?.encoder || "healthy",
        sensor: data.nodes?.sensor || "healthy"
      },
      // Auxiliary modules passed through if provided
      driveMotors: data.driveMotors,
      armMotors: data.armMotors,
      science: data.science,
      imu: data.imu,
      anemometer: data.anemometer
    };
  } catch (err) {
    console.error("Telemetry parse exception:", err);
    return null;
  }
};

/**
 * Checks safety margins for various systems and reports levels.
 */
export const getTelemetryStatus = (value, limits) => {
  if (value >= limits.critical) return "critical";
  if (value >= limits.warning) return "warning";
  return "healthy";
};
