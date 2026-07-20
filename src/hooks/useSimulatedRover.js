import { useEffect } from 'react';
import { useRover } from '../context/RoverContext';

/**
 * Hook to simulate auxiliary live dashboard behaviors (random system logs,
 * comms status updates, and camera dynamic FPS/latency noise) to keep the layout active.
 */
export const useSimulatedRover = (isActive = true) => {
  let contextVal;
  try {
    contextVal = useRover();
  } catch (err) {
    return; // Safely bypass initialization during context setup or hot reload
  }

  const { 
    roverMode, 
    addLog, 
    updateCameraStatus,
    cameras,
    setPrimaryComms,
    setSecondaryComms
  } = contextVal;

  // Mock messages lists to inject into the console
  const mockMessages = [
    { level: 'INFO', node: 'JETSON', message: 'Orin AI Object Detection: Safe navigation corridor identified' },
    { level: 'SUCCESS', node: 'SENSOR', message: 'Tactical grids mapping complete.' },
    { level: 'WARNING', node: 'SYSTEM', message: 'Telemetry packet latency spiked temporarily' },
    { level: 'INFO', node: 'RPI', message: 'WebRTC camera streams ping: OK' },
    { level: 'SUCCESS', node: 'SYS', message: 'Thermal parameters within nominal aerospace tolerances' },
    { level: 'INFO', node: 'SENSOR', message: 'Ultrasonic distance array cleared of collision obstacles' }
  ];

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      // 1. Simulate comms channels status changes
      if (Math.random() < 0.05) {
        setSecondaryComms(prev => Math.random() > 0.5 ? 'standby' : 'online');
      }

      // 2. Random live warning/log injection (Approx. 5% chance per update)
      if (Math.random() < 0.05 && roverMode !== 'E-STOP') {
        const randMsg = mockMessages[Math.floor(Math.random() * mockMessages.length)];
        addLog(randMsg.message, randMsg.level, randMsg.node);
      }

      // 3. Update Camera Frame metadata (FPS & Latency jitter)
      cameras.forEach(cam => {
        if (cam.status === 'online') {
          const fpsJitter = Math.max(12, Math.min(60, cam.fps + Math.round((Math.random() - 0.5) * 4)));
          const latencyJitter = Math.max(10, Math.min(80, cam.latency + Math.round((Math.random() - 0.5) * 5)));
          updateCameraStatus(cam.id, { fps: fpsJitter, latency: latencyJitter });
        }
      });

    }, 1000);

    return () => clearInterval(interval);
  }, [roverMode, addLog, updateCameraStatus, cameras, isActive, setPrimaryComms, setSecondaryComms]);
};

