import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { INITIAL_CAMERAS, fetchAvailableCameras } from '../services/cameras';
import { sendEStop, sendModeChange } from '../services/commands';

const RoverContext = createContext(null);

export const useRover = () => {
  const context = useContext(RoverContext);
  if (!context) {
    throw new Error('useRover must be used within a RoverProvider');
  }
  return context;
};

// Safe Initial Telemetry with zero-safe defaults (no deceptive Bangalore fake values)
const INITIAL_TELEMETRY = {
  timestamp: '',
  is_stale: true,
  telemetry_hz: 0.0,
  heading: 0,
  speed: 0.0,
  roverMode: 'NAV',
  driverMode: 'MANUAL',
  gps: { lat: 0.0, lng: 0.0, alt: 0.0, satellites: 0, lock: 'NO_LOCK', hdop: 99.9 },
  battery: { percentage: 0.0, voltage: 0.0, current: 0.0, temp: 0.0 },
  network: { latency: 0, jitter: 0, packetLoss: 0.0, frequency: 50, signalQuality: 0, heartbeat: false },
  nodes: { jetson: 'offline', rpi: 'offline', encoder: 'offline', sensor: 'offline' },
  imu: { roll: 0.0, pitch: 0.0, yaw: 0.0, stability: 'SECURE' },
  anemometer: { speed: 0.0, direction: 0, dirName: 'N', gust: 0.0, trend: 'STEADY' },
  driveMotors: [],
  armMotors: [],
  science: {
    temp: 0.0,
    humidity: 0,
    pressure: 0,
    co: 0,
    ch4: 0,
    airQuality: 'SAFE',
    soilN: 0,
    soilP: 0,
    soilK: 0,
    soilPh: 7.0,
    soilMoisture: 0
  }
};

export const RoverProvider = ({ children }) => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [roverMode, setRoverMode] = useState('NAV');
  const [driverMode, setDriverMode] = useState('MANUAL');

  // Cameras state - populated dynamically from backend
  const [cameras, setCameras] = useState(INITIAL_CAMERAS);
  const [activeCameraId, setActiveCameraId] = useState(INITIAL_CAMERAS[0]?.path || 'nav_cam');

  // Unified dynamic telemetry state
  const [telemetry, setTelemetry] = useState(INITIAL_TELEMETRY);

  // Operational logs
  const [logs, setLogs] = useState([
    { id: 1, timestamp: new Date().toISOString(), level: 'INFO', node: 'SYSTEM', message: 'Mission control console initialized.' }
  ]);

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

  // Fetch discovered cameras on mount and periodically
  useEffect(() => {
    let isMounted = true;

    const loadCameras = async () => {
      const activeCams = await fetchAvailableCameras();
      if (isMounted && activeCams && activeCams.length > 0) {
        setCameras(activeCams);
        setActiveCameraId(prev => {
          const exists = activeCams.some(c => (c.path || c.id) === prev);
          return exists ? prev : (activeCams[0].path || activeCams[0].id);
        });
      }
    };

    loadCameras();
    const interval = setInterval(loadCameras, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // System mode controls with real backend dispatch
  const changeMode = useCallback(async (mode) => {
    setRoverMode(mode);
    addLog(`Operator requested mode transition: ${mode}`, 'INFO', 'SYS');
    const res = await sendModeChange(mode);
    if (!res.success) {
      addLog(`Failed to dispatch mode command: ${res.error || res.message}`, 'ERROR', 'SYS');
    }
  }, [addLog]);

  // Real Emergency Stop dispatch
  const triggerEStop = useCallback(async () => {
    setRoverMode('E-STOP');
    addLog('CRITICAL: EMERGENCY STOP DISPATCHED TO ROVER!', 'ERROR', 'CRITICAL');
    const res = await sendEStop('engage');
    if (res.success) {
      addLog('E-Stop datagram transmitted to rover hardware.', 'SUCCESS', 'CRITICAL');
    } else {
      addLog(`E-Stop transmission failed: ${res.error || res.message}`, 'ERROR', 'CRITICAL');
    }
  }, [addLog]);

  const resetEStop = useCallback(async () => {
    setRoverMode('NAV');
    addLog('E-Stop reset dispatched. Returning to NAV mode.', 'SUCCESS', 'SYS');
    const res = await sendEStop('reset');
    if (!res.success) {
      addLog(`E-Stop reset error: ${res.error || res.message}`, 'ERROR', 'SYS');
    }
  }, [addLog]);

  const selectCamera = useCallback((camPathOrId) => {
    setActiveCameraId(camPathOrId);
    addLog(`Primary Hero stream switched: ${camPathOrId}`, 'INFO', 'CAM');
  }, [addLog]);

  // Active camera object reference
  const activeCamera = (cameras && cameras.length > 0)
    ? (cameras.find(c => (c.path || c.id) === activeCameraId) || cameras[0])
    : null;

  // Real-time WebSocket connection to backend
  const wsRef = useRef(null);

  useEffect(() => {
    let reconnectTimeout = null;
    let isCancelled = false;

    const connectWebSocket = () => {
      const wsUrl = import.meta.env.VITE_BACKEND_WS_URL || 'ws://127.0.0.1:8000/ws/telemetry';
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (isCancelled) return;
        setConnectionStatus('connected');
        addLog('Telemetry WebSocket stream connected.', 'SUCCESS', 'COMMS');
      };

      ws.onmessage = (event) => {
        if (isCancelled) return;
        try {
          const payload = JSON.parse(event.data);

          // Ignore connection ack
          if (payload.type === 'connection_ack') return;

          setTelemetry(prev => ({
            ...prev,
            ...payload,
            gps: payload.gps ? { ...prev.gps, ...payload.gps } : prev.gps,
            battery: payload.battery ? { ...prev.battery, ...payload.battery } : prev.battery,
            network: payload.network ? { ...prev.network, ...payload.network } : prev.network,
            nodes: payload.nodes ? { ...prev.nodes, ...payload.nodes } : prev.nodes,
            imu: payload.imu ? { ...prev.imu, ...payload.imu } : prev.imu,
            anemometer: payload.anemometer ? { ...prev.anemometer, ...payload.anemometer } : prev.anemometer,
            science: payload.science ? { ...prev.science, ...payload.science } : prev.science,
            driveMotors: payload.driveMotors !== undefined ? payload.driveMotors : prev.driveMotors,
            armMotors: payload.armMotors !== undefined ? payload.armMotors : prev.armMotors,
          }));

          if (payload.roverMode) setRoverMode(payload.roverMode);
          if (payload.driverMode) setDriverMode(payload.driverMode);

        } catch (err) {
          console.error('[Telemetry] Failed to parse WebSocket frame:', err);
        }
      };

      ws.onerror = (err) => {
        console.warn('[Telemetry] WebSocket error:', err);
      };

      ws.onclose = () => {
        if (isCancelled) return;
        setConnectionStatus('disconnected');
        reconnectTimeout = setTimeout(connectWebSocket, 2000);
      };
    };

    connectWebSocket();

    return () => {
      isCancelled = true;
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [addLog]);

  return (
    <RoverContext.Provider
      value={{
        connectionStatus,
        roverMode,
        changeMode,
        driverMode,
        setDriverMode,
        triggerEStop,
        resetEStop,
        cameras,
        activeCameraId,
        activeCamera,
        selectCamera,
        telemetry,
        logs,
        addLog
      }}
    >
      {children}
    </RoverContext.Provider>
  );
};