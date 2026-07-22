import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { INITIAL_CAMERAS } from '../services/cameras';

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
  const [cameras, setCameras] = useState(INITIAL_CAMERAS || []);
  const [activeCameraId, setActiveCameraId] = useState('front_cam');
  
  // Operational logs
  const [logs, setLogs] = useState([
    { id: 1, timestamp: new Date(Date.now() - 400000).toISOString(), level: 'SUCCESS', node: 'SYSTEM', message: 'Mission control telemetry node bootstrapped' },
    { id: 2, timestamp: new Date(Date.now() - 250000).toISOString(), level: 'INFO', node: 'JETSON', message: 'Jetson Nano AI core initialized. CUDA support active.' },
    { id: 3, timestamp: new Date(Date.now() - 120000).toISOString(), level: 'SUCCESS', node: 'COMMS', message: 'Downlink telemetry stream synchronized @ 50Hz' },
    { id: 4, timestamp: new Date(Date.now() - 50000).toISOString(), level: 'INFO', node: 'SENSOR', message: 'IMU alignment complete. Tactical grids ready.' }
  ]);

  // Unified dynamic telemetry state
  const [telemetry, setTelemetry] = useState(INITIAL_TELEMETRY);

  const activeCamera = (cameras && cameras.length > 0) 
    ? (cameras.find(c => c.id === activeCameraId) || cameras[0]) 
    : null;

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
      ...prev.slice(0, 49)
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
    if (cameras && cameras.some(c => c.id === camId)) {
      setActiveCameraId(camId);
      addLog(`Active stream redirected: ${camId}`, 'INFO', 'CAM');
    }
  }, [cameras, addLog]);

  const updateCameraStatus = useCallback((camId, updates) => {
    setCameras(prev => prev.map(c => c.id === camId ? { ...c, ...updates } : c));
  }, []);

  // WEBSOCKET TELEMETRY CONNECTION
  const wsRef = useRef(null);

  useEffect(() => {
    let reconnectTimeout = null;

    const connectWebSocket = () => {
      const wsUrl = 'ws://127.0.0.1:8000/ws/telemetry';
      console.log(`Connecting to Telemetry WebSocket: ${wsUrl}`);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Telemetry WebSocket connected.');
        setConnectionStatus('connected');
      };

      ws.onmessage = (event) => {
        try {
          const rawPayload = JSON.parse(event.data);
          const parsed = rawPayload.data ? rawPayload.data : rawPayload;

          if (parsed) {
            setTelemetry(prev => ({
              ...prev,
              ...parsed,
              battery: parsed.battery ? { ...prev.battery, ...parsed.battery } : prev.battery,
              gps: parsed.gps ? { ...prev.gps, ...parsed.gps } : prev.gps,
              network: parsed.network ? { ...prev.network, ...parsed.network } : prev.network,
              nodes: parsed.nodes ? { ...prev.nodes, ...parsed.nodes } : prev.nodes,
              driveMotors: parsed.driveMotors !== undefined ? parsed.driveMotors : prev.driveMotors,
              armMotors: parsed.armMotors !== undefined ? parsed.armMotors : prev.armMotors,
              science: parsed.science !== undefined ? parsed.science : prev.science,
              imu: parsed.imu !== undefined ? parsed.imu : prev.imu,
              anemometer: parsed.anemometer !== undefined ? parsed.anemometer : prev.anemometer,
            }));
          }
        } catch (err) {
          console.error('Failed to parse WebSocket frame:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('Telemetry WebSocket error:', error);
      };

      ws.onclose = () => {
        setConnectionStatus('disconnected');
        reconnectTimeout = setTimeout(() => {
          connectWebSocket();
        }, 2000);
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
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
      multiCamLayout,
      setMultiCamLayout
    }}>
      {children}
    </RoverContext.Provider>
  );
};