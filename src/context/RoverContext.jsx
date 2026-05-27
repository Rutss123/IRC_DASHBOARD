import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { INITIAL_CAMERAS } from '../services/cameras';
import { parseTelemetryPacket } from '../services/telemetry';

const RoverContext = createContext(null);

export const useRover = () => {
  const context = useContext(RoverContext);
  if (!context) {
    throw new Error('useRover must be used within a RoverProvider');
  }
  return context;
};

// Centralized Initial Telemetry State Representation
const INITIAL_TELEMETRY = {
  timestamp: new Date().toISOString(),
  gps: { lat: 12.9716, lng: 77.5946, alt: 920.4, satellites: 14, lock: '3D_FIX', hdop: 0.82 },
  heading: 182,
  speed: 0.85,
  battery: { percentage: 94.2, voltage: 24.2, current: 3.4, temp: 32.5 },
  network: { latency: 22, jitter: 1, packetLoss: 0.02, frequency: 50, signalQuality: 98, heartbeat: true },
  nodes: { jetson: 'healthy', rpi: 'healthy', encoder: 'healthy', sensor: 'healthy' },
  imu: { roll: 0.8, pitch: -1.4, yaw: 182.0, stability: 'SECURE' },
  anemometer: { speed: 3.4, direction: 245, dirName: 'WSW', gust: 5.2, trend: 'STEADY' },
  driveMotors: [
    { id: 'FL_DRIVE', name: 'FRONT LEFT', rpm: 0, angle: 142, pwm: 0, status: 'online' },
    { id: 'FR_DRIVE', name: 'FRONT RIGHT', rpm: 0, angle: 142, pwm: 0, status: 'online' },
    { id: 'ML_DRIVE', name: 'MIDDLE LEFT', rpm: 0, angle: 142, pwm: 0, status: 'online' },
    { id: 'MR_DRIVE', name: 'MIDDLE RIGHT', rpm: 0, angle: 142, pwm: 0, status: 'online' },
    { id: 'RL_DRIVE', name: 'REAR LEFT', rpm: 0, angle: 142, pwm: 0, status: 'online' },
    { id: 'RR_DRIVE', name: 'REAR RIGHT', rpm: 0, angle: 142, pwm: 0, status: 'online' }
  ],
  armMotors: [
    { name: 'J1_BASE_YAW', angle: 45.2, rpm: 0, direction: 'IDLE', encoder: 'OK_SYNC' },
    { name: 'J2_SHLDR_PITCH', angle: -24.8, rpm: 0, direction: 'IDLE', encoder: 'OK_SYNC' },
    { name: 'J3_ELBOW_PITCH', angle: 88.4, rpm: 0, direction: 'IDLE', encoder: 'OK_SYNC' },
    { name: 'J4_WRIST_PITCH', angle: 12.6, rpm: 0, direction: 'IDLE', encoder: 'OK_SYNC' },
    { name: 'J5_WRIST_ROLL', angle: -5.0, rpm: 0, direction: 'IDLE', encoder: 'OK_SYNC' },
    { name: 'J6_GRIPPER_ROT', angle: 120.0, rpm: 0, direction: 'IDLE', encoder: 'N/A' }
  ],
  science: {
    temp: 28.2,
    humidity: 54,
    pressure: 1008,
    co: 24,
    ch4: 11,
    airQuality: 'SAFE',
    soilN: 42,
    soilP: 18,
    soilK: 35,
    soilPh: 6.8,
    soilMoisture: 48
  }
};

export const RoverProvider = ({ children }) => {
  // Base connection state
  const [connectionStatus, setConnectionStatus] = useState('connected');
  
  // Rover Mode: "NAV", "SCIENCE", "ARM", "E-STOP"
  const [roverMode, setRoverMode] = useState('NAV');

  // Driver Mode: "MANUAL" or "AUTONOMOUS"
  const [driverMode, setDriverMode] = useState('MANUAL');

  // Communication Channel states
  const [primaryComms, setPrimaryComms] = useState('online');     // 'online', 'standby', 'offline'
  const [secondaryComms, setSecondaryComms] = useState('standby'); // 'online', 'standby', 'offline'

  // Multi camera layout mode: "grid" or "list"
  const [multiCamLayout, setMultiCamLayout] = useState('grid');
  
  // Camera array state
  const [cameras, setCameras] = useState(INITIAL_CAMERAS);
  const [activeCameraId, setActiveCameraId] = useState('front_cam');
  
  // Operational logs (Shortened list by default)
  const [logs, setLogs] = useState([
    { id: 1, timestamp: new Date(Date.now() - 400000).toISOString(), level: 'SUCCESS', node: 'SYSTEM', message: 'Mission control telemetry node bootstrapped' },
    { id: 2, timestamp: new Date(Date.now() - 250000).toISOString(), level: 'INFO', node: 'JETSON', message: 'Jetson Nano AI core initialized. CUDA support active.' },
    { id: 3, timestamp: new Date(Date.now() - 120000).toISOString(), level: 'SUCCESS', node: 'COMMS', message: 'Downlink telemetry stream synchronized @ 50Hz' },
    { id: 4, timestamp: new Date(Date.now() - 50000).toISOString(), level: 'INFO', node: 'SENSOR', message: 'IMU alignment complete. Tactical grids ready.' }
  ]);

  // Unified dynamic telemetry state
  const [telemetry, setTelemetry] = useState(INITIAL_TELEMETRY);

  // Centralized high-fidelity telemetry background simulation loop
  useEffect(() => {
    let gpsLat = 12.9716;
    let gpsLng = 77.5946;
    let bearing = 182;
    let baseDriveAngles = [142, 142, 142, 142, 142, 142];
    let armJointsState = [
      { name: 'J1_BASE_YAW', angle: 45.2, rpm: 0, direction: 'IDLE', encoder: 'OK_SYNC' },
      { name: 'J2_SHLDR_PITCH', angle: -24.8, rpm: 0, direction: 'IDLE', encoder: 'OK_SYNC' },
      { name: 'J3_ELBOW_PITCH', angle: 88.4, rpm: 0, direction: 'IDLE', encoder: 'OK_SYNC' },
      { name: 'J4_WRIST_PITCH', angle: 12.6, rpm: 0, direction: 'IDLE', encoder: 'OK_SYNC' },
      { name: 'J5_WRIST_ROLL', angle: -5.0, rpm: 0, direction: 'IDLE', encoder: 'OK_SYNC' },
      { name: 'J6_GRIPPER_ROT', angle: 120.0, rpm: 0, direction: 'IDLE', encoder: 'N/A' }
    ];

    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

    const interval = setInterval(() => {
      setTelemetry(prev => {
        const isEstop = roverMode === 'E-STOP';
        const isArmActive = roverMode === 'ARM';
        const isMoving = !isEstop && (driverMode === 'AUTONOMOUS' || roverMode === 'NAV');

        const timeMs = Date.now();
        const slowTick = Math.floor(timeMs / 1200);   // Updates slowly (every 1.2 seconds)
        const mediumTick = Math.floor(timeMs / 600);  // Updates moderately (every 0.6 seconds)

        // Speed drifts dynamically and slowly around baseline
        const currentSpeed = isEstop ? 0.0 : (isMoving ? parseFloat((0.95 + Math.sin(timeMs / 8000) * 0.08).toFixed(2)) : 0.0);
        bearing = (bearing + (isMoving ? Math.sin(timeMs / 30000) * 0.3 : 0.0) + 360) % 360;

        // GPS coordinates drift slowly forward (exploration trajectory)
        if (isMoving && currentSpeed > 0) {
          const distanceScale = 0.00000006 * currentSpeed;
          gpsLat += distanceScale * Math.cos((bearing * Math.PI) / 180);
          gpsLng += distanceScale * Math.sin((bearing * Math.PI) / 180);
        }

        // IMU orientations physically and slowly connected to speed
        const rollDrift = parseFloat((0.5 + Math.sin(timeMs / 12000) * 0.8 * (currentSpeed > 0 ? currentSpeed : 0.2)).toFixed(1));
        const pitchDrift = parseFloat((-1.0 + Math.cos(timeMs / 10000) * 0.6 * (currentSpeed > 0 ? currentSpeed : 0.2)).toFixed(1));

        // Anemometer compass bearings and gust velocities
        const windSpeedDrift = parseFloat((2.8 + Math.sin(timeMs / 25000) * 0.8).toFixed(1));
        const windDirDrift = Math.round((245 + Math.sin(timeMs / 35000) * 10 + 360) % 360);
        const windGustDrift = parseFloat((windSpeedDrift + 1.2 + Math.cos(timeMs / 12000) * 0.3).toFixed(1));
        const dirIndex = Math.round(((windDirDrift % 360) / 22.5)) % 16;

        // Drive Motors synchronized RPM, position angles, and PWM metrics
        baseDriveAngles = baseDriveAngles.map(pos => {
          if (currentSpeed === 0) return pos;
          return (pos + Math.round(currentSpeed * 4)) % 360;
        });

        // Fluctuates slowly on mediumTick to prevent rapid flashing
        const rpmValue = currentSpeed === 0 ? 0 : Math.round(currentSpeed * 85 + Math.sin(mediumTick) * 1.5);
        const pwmValue = currentSpeed === 0 ? 0 : Math.min(255, Math.round(currentSpeed * 120 + 15 + Math.sin(mediumTick) * 1));

        const prevDriveMotors = prev.driveMotors || INITIAL_TELEMETRY.driveMotors;
        const driveMotors = prevDriveMotors.map((m, idx) => ({
          ...m,
          rpm: rpmValue,
          angle: baseDriveAngles[idx],
          pwm: pwmValue
        }));

        // Arm joints precision lock movements fluctuate deliberately on slowTick
        armJointsState = armJointsState.map((joint, idx) => {
          const isActive = isArmActive && (Math.sin(slowTick + idx) > 0.4);
          let nextAngle = joint.angle;
          let nextRpm = 0;
          let nextDir = 'IDLE';

          if (isActive) {
            const delta = parseFloat((Math.sin(timeMs / 1200 + idx) * 0.5).toFixed(1));
            nextAngle = parseFloat((joint.angle + delta).toFixed(1));
            nextRpm = Math.round(3 + Math.abs(Math.sin(slowTick)) * 3);
            nextDir = delta > 0 ? 'POS' : 'NEG';
          }
          return {
            ...joint,
            angle: nextAngle,
            rpm: nextRpm,
            direction: nextDir
          };
        });

        // Climate indicators with highly stable scientific noise
        const prevScience = prev.science || INITIAL_TELEMETRY.science;
        const tempDrift = parseFloat((Math.sin(slowTick / 15) * 0.12).toFixed(2));
        const humDrift = Math.round(Math.sin(slowTick / 20) * 1);
        
        const nextTemp = parseFloat((28.2 + tempDrift).toFixed(1));
        const nextHum = Math.min(100, Math.max(0, 54 + humDrift));
        const nextPres = prevScience.pressure; // keep stable
        const nextCo = Math.max(5, 24 + Math.round(Math.sin(slowTick / 10) * 1));
        const nextCh4 = Math.max(2, 11 + Math.round(Math.cos(slowTick / 15) * 0.5));
        let nextAq = 'SAFE';
        if (nextCo > 30 || nextCh4 > 15) nextAq = 'WARNING';
        if (nextCo > 45 || nextCh4 > 25) nextAq = 'CRITICAL';
        const nextPh = parseFloat((prevScience.soilPh + (Math.sin(slowTick / 30) * 0.01)).toFixed(2));
        const nextMoist = Math.min(100, Math.max(0, prevScience.soilMoisture + (Math.random() > 0.95 ? Math.round((Math.random() - 0.5) * 1) : 0)));

        // Network latency variations
        const netLatency = Math.round(20 + Math.sin(slowTick / 6) * 1.5);
        const netJitter = Math.round(1 + Math.abs(Math.sin(slowTick / 12)) * 0.8);
        const netLoss = parseFloat((0.02 + Math.abs(Math.cos(slowTick / 25)) * 0.01).toFixed(3));
        const netSignal = Math.round(97 + Math.sin(slowTick / 50) * 1);

        // Power consumption dynamics
        const prevBattery = prev.battery || INITIAL_TELEMETRY.battery;
        const batteryPct = parseFloat(Math.max(0, prevBattery.percentage - 0.00008).toFixed(4));
        const batteryVoltage = parseFloat((23.8 + (batteryPct / 100) * 1.2 + Math.sin(timeMs / 30000) * 0.04).toFixed(2));
        const batteryCurrent = parseFloat((2.5 + currentSpeed * 0.8 + (isArmActive ? 0.4 : 0) + Math.sin(timeMs / 15000) * 0.1).toFixed(2));

        return {
          timestamp: new Date().toISOString(),
          gps: {
            lat: gpsLat,
            lng: gpsLng,
            alt: parseFloat((920.4 + Math.sin(Date.now() / 10000) * 0.6).toFixed(1)),
            satellites: 14,
            lock: isEstop ? '2D_LOCK' : '3D_FIX',
            hdop: 0.82
          },
          heading: Math.round(bearing),
          speed: currentSpeed,
          imu: {
            roll: rollDrift,
            pitch: pitchDrift,
            yaw: Math.round(bearing),
            stability: Math.abs(rollDrift) > 2.5 || Math.abs(pitchDrift) > 2.5 ? 'DRIFT_WARNING' : 'SECURE'
          },
          anemometer: {
            speed: windSpeedDrift,
            direction: windDirDrift,
            dirName: directions[dirIndex],
            gust: windGustDrift,
            trend: windSpeedDrift > 4.5 ? 'GUSTING' : 'STEADY'
          },
          driveMotors,
          armMotors: armJointsState,
          science: {
            ...prev.science,
            temp: nextTemp,
            humidity: nextHum,
            pressure: nextPres,
            co: nextCo,
            ch4: nextCh4,
            airQuality: nextAq,
            soilPh: nextPh,
            soilMoisture: nextMoist
          },
          battery: {
            percentage: parseFloat(batteryPct.toFixed(1)),
            voltage: batteryVoltage,
            current: batteryCurrent,
            temp: parseFloat((31.5 + currentSpeed * 0.8 + Math.sin(Date.now() / 20000) * 0.4).toFixed(1))
          },
          network: {
            latency: netLatency,
            jitter: netJitter,
            packetLoss: netLoss,
            frequency: 50,
            signalQuality: netSignal,
            heartbeat: Date.now() % 2000 > 120
          },
          nodes: {
            jetson: isEstop ? 'warning' : 'healthy',
            rpi: 'healthy',
            encoder: isEstop ? 'warning' : 'healthy',
            sensor: 'healthy'
          }
        };
      });
    }, 150);

    return () => clearInterval(interval);
  }, [roverMode, driverMode]);

  // Derived active camera object
  const activeCamera = cameras.find(c => c.id === activeCameraId) || cameras[0];

  // Helper to add logs to system console
  const addLog = useCallback((message, level = 'INFO', node = 'SYSTEM') => {
    setLogs(prev => [
      {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        level,
        node: node.toUpperCase(),
        message
      },
      ...prev.slice(0, 49) // Keep buffer short
    ]);
  }, []);

  // System mode controls
  const changeMode = useCallback((mode) => {
    if (roverMode === 'E-STOP' && mode !== 'NAV' && mode !== 'E-STOP') {
      addLog('ACCESS REFUSED: Emergency Stop is currently engaged.', 'ERROR', 'CRITICAL');
      return;
    }
    
    setRoverMode(mode);
    addLog(`System mode transition: ${roverMode} -> ${mode}`, 'SUCCESS', 'SYS');

    // Auto camera select based on mode
    if (mode === 'NAV') {
      setActiveCameraId('front_cam');
      addLog('Auto-switched active camera to Front Cam (NAV Mode)', 'INFO', 'CAM');
    } else if (mode === 'SCIENCE') {
      setActiveCameraId('science_cam');
      addLog('Auto-switched active camera to Science Cam (SCIENCE Mode)', 'INFO', 'CAM');
    } else if (mode === 'ARM') {
      setActiveCameraId('arm_cam');
      addLog('Auto-switched active camera to Arm Cam (ARM Mode)', 'INFO', 'CAM');
    }
  }, [roverMode, addLog]);

  // Toggle Emergency Stop
  const triggerEStop = useCallback(() => {
    setRoverMode('E-STOP');
    setTelemetry(prev => ({
      ...prev,
      speed: 0.0,
      nodes: { ...prev.nodes, encoder: 'warning', jetson: 'warning' }
    }));
    addLog('CRITICAL: EMERGENCY STOP DISPATCHED! Motors disarmed immediately.', 'ERROR', 'CRITICAL');
  }, [addLog]);

  const resetEStop = useCallback(() => {
    setRoverMode('NAV');
    setTelemetry(prev => ({
      ...prev,
      nodes: { jetson: 'healthy', rpi: 'healthy', encoder: 'healthy', sensor: 'healthy' }
    }));
    addLog('ESTOP cancelled. System reset to NAV mode.', 'SUCCESS', 'SYS');
  }, [addLog]);

  const selectCamera = useCallback((camId) => {
    const camExists = cameras.some(c => c.id === camId);
    if (camExists) {
      setActiveCameraId(camId);
      addLog(`Active stream redirected: ${camId}`, 'INFO', 'CAM');
    }
  }, [cameras, addLog]);

  const updateTelemetry = useCallback((data) => {
    const parsed = parseTelemetryPacket(data);
    if (parsed) {
      setTelemetry(prev => ({
        ...prev,
        ...parsed,
        battery: parsed.battery ? { ...prev.battery, ...parsed.battery } : prev.battery,
        gps: parsed.gps ? { ...prev.gps, ...parsed.gps } : prev.gps,
        motorTemp: parsed.motorTemp ? { ...prev.motorTemp, ...parsed.motorTemp } : prev.motorTemp,
        network: parsed.network ? { ...prev.network, ...parsed.network } : prev.network,
        nodes: parsed.nodes ? { ...prev.nodes, ...parsed.nodes } : prev.nodes,
        driveMotors: parsed.driveMotors !== undefined ? parsed.driveMotors : prev.driveMotors,
        armMotors: parsed.armMotors !== undefined ? parsed.armMotors : prev.armMotors,
        science: parsed.science !== undefined ? parsed.science : prev.science,
        imu: parsed.imu !== undefined ? parsed.imu : prev.imu,
        anemometer: parsed.anemometer !== undefined ? parsed.anemometer : prev.anemometer,
      }));
    }
  }, []);

  const updateCameraStatus = useCallback((camId, updates) => {
    setCameras(prev => prev.map(c => c.id === camId ? { ...c, ...updates } : c));
  }, []);

  return (
    <RoverContext.Provider value={{
      connectionStatus,
      setConnectionStatus,
      roverMode,
      changeMode,
      driverMode,
      setDriverMode,
      primaryComms,
      setPrimaryComms,
      secondaryComms,
      setSecondaryComms,
      triggerEStop,
      resetEStop,
      cameras,
      activeCameraId,
      activeCamera,
      selectCamera,
      updateCameraStatus,
      logs,
      setLogs,
      addLog,
      telemetry,
      updateTelemetry,
      multiCamLayout,
      setMultiCamLayout
    }}>
      {children}
    </RoverContext.Provider>
  );
};
