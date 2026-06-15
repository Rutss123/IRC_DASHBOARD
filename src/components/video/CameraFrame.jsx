import React, { useEffect, useRef } from 'react';
import { useRover } from '../../context/RoverContext';
import { Camera, AlertCircle, AlertTriangle } from 'lucide-react';

export default function CameraFrame({ camera, isMinified = false }) {
  const { telemetry, roverMode } = useRover();
  const { speed, heading, gps } = telemetry;
  
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || camera.status !== 'online') return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;
    
    const resizeCanvas = () => {
      if (canvas) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }
    };
    resizeCanvas();

    let gridOffset = 0;

    const render = () => {
      if (!ctx || !canvas) return;
      
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2 + 15;
      const centerX = width / 2;

      // 1. BASE MATRIX BACKGROUND
      if (camera.id === 'thermal_cam') {
        const grad = ctx.createRadialGradient(centerX, centerY, 50, centerX, centerY, width / 1.3);
        grad.addColorStop(0, '#2d0909');
        grad.addColorStop(1, '#0b0303');
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = '#070709';
      }
      ctx.fillRect(0, 0, width, height);

      // 2. SUBTLE TERRAIN PREDICTION LINES
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = camera.id === 'thermal_cam' ? 'rgba(239, 68, 68, 0.02)' : 'rgba(6, 182, 212, 0.04)';
      
      gridOffset = (gridOffset + (speed * 3.5)) % 30;
      const numLines = 10;
      
      // Perspective vertical grid guides
      for (let i = 0; i <= numLines; i++) {
        const ratio = i / numLines;
        const xOffset = (ratio - 0.5) * width * 2.3;
        const targetX = centerX + xOffset - ((heading * 1.2) % (width / 5));
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(targetX, height);
        ctx.stroke();
      }

      // Depth grid contours
      const depthLines = 5;
      for (let i = 0; i < depthLines; i++) {
        const z = (i * 45 + gridOffset) % 225;
        const pct = z / 225;
        const y = centerY + pct * (height - centerY);
        
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 3. PREDICTIVE WHEELS GUIDELINES (Subtle path forecast)
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([5, 5]);

      // Left wheel guide arc
      ctx.beginPath();
      ctx.moveTo(centerX - 70, height);
      ctx.quadraticCurveTo(centerX - 35, centerY + (height - centerY) * 0.45, centerX - 6, centerY);
      ctx.stroke();

      // Right wheel guide arc
      ctx.beginPath();
      ctx.moveTo(centerX + 70, height);
      ctx.quadraticCurveTo(centerX + 35, centerY + (height - centerY) * 0.45, centerX + 6, centerY);
      ctx.stroke();
      ctx.setLineDash([]); // Reset

      // 4. SPACE-GRADE MINIMAL CROSSHAIR Reticle
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
      ctx.lineWidth = 0.8;

      ctx.beginPath();
      ctx.moveTo(centerX - 8, centerY - 15);
      ctx.lineTo(centerX - 3, centerY - 15);
      ctx.moveTo(centerX + 3, centerY - 15);
      ctx.lineTo(centerX + 8, centerY - 15);
      ctx.moveTo(centerX, centerY - 23);
      ctx.lineTo(centerX, centerY - 18);
      ctx.moveTo(centerX, centerY - 12);
      ctx.lineTo(centerX, centerY - 7);
      ctx.stroke();

      // Digital Heading scale overlay
      const hdgText = `HDG ${Math.round(heading).toString().padStart(3, '0')}°`;
      ctx.fillStyle = 'rgba(11, 19, 43, 0.85)';
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      
      const boxW = 54;
      const boxH = 13;
      ctx.fillRect(centerX - boxW / 2, centerY - 54, boxW, boxH);
      ctx.strokeRect(centerX - boxW / 2, centerY - 54, boxW, boxH);

      ctx.fillStyle = '#06b6d4';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(hdgText, centerX, centerY - 45);

      // Pitch indicators (dimmed)
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.1)';
      ctx.beginPath();
      ctx.moveTo(centerX - 40, centerY - 20);
      ctx.lineTo(centerX - 44, centerY - 20);
      ctx.lineTo(centerX - 44, centerY - 10);
      ctx.lineTo(centerX - 40, centerY - 10);
      ctx.moveTo(centerX + 40, centerY - 20);
      ctx.lineTo(centerX + 44, centerY - 20);
      ctx.lineTo(centerX + 44, centerY - 10);
      ctx.lineTo(centerX + 40, centerY - 10);
      ctx.stroke();

      // Minimal active targeted lock boxes
      ctx.strokeStyle = 'rgba(234, 88, 12, 0.25)';
      ctx.strokeRect(centerX + 65, centerY - 26, 26, 16);
      ctx.fillStyle = 'rgba(234, 88, 12, 0.65)';
      ctx.font = 'bold 5.5px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('TARGET LOCK', centerX + 69, centerY - 20);

      // Coordinates text stamp
      ctx.fillStyle = 'rgba(6, 182, 212, 0.5)';
      ctx.font = '6.5px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`GPS LOCK: ${gps.lat.toFixed(5)}N, ${gps.lng.toFixed(5)}E`, width - 15, height - 15);

      animationId = requestAnimationFrame(render);
    };

    render();

    window.addEventListener('resize', resizeCanvas);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [camera, speed, heading, gps]);

  return (
    <div className={`relative w-full rounded-lg overflow-hidden bg-space-950 flex flex-col justify-between transition-all duration-300 ${
      isMinified 
        ? "h-48 border border-cyber-orange/40 hover:border-cyber-orange shadow-glow-amber/5" 
        : "w-full h-[520px] border border-cyber-cyan/35 shadow-glow-cyan/5"
    }`}>
      
      {/* 1. TOP BAR INFORMATION OVERLAY */}
      <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-space-950 via-space-950/70 to-transparent z-10 flex justify-between items-start text-[10px] font-mono select-none">
        
        {/* Left details */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 text-slate-100 font-bold tracking-wider">
            <Camera className="w-4 h-4 text-cyber-orange shrink-0 animate-pulse" />
            <span>{camera.name.toUpperCase()}</span>
          </div>
          <span className="text-[7.5px] text-slate-500 font-bold tracking-widest pl-5.5 uppercase">
            WEBRTC DOCK // PROFILE: {camera.resolution}
          </span>
        </div>

        {/* Right badging */}
        <div className="flex items-center bg-space-950/80 border border-space-850 px-2 py-1 rounded gap-3 text-[8.5px] text-slate-400 font-bold font-mono">
          <div>
            FPS: <span className="text-cyber-orange font-bold">{camera.fps || 30}</span>
          </div>
          <div className="w-[1px] h-2.5 bg-space-800" />
          <div>
            RTT: <span className="text-cyber-green font-bold">{camera.latency || 22}ms</span>
          </div>
          <div className="w-[1px] h-2.5 bg-space-800" />
          <div className="flex items-center gap-1 text-cyber-red font-bold animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-cyber-red" />
            <span>LIVE</span>
          </div>
        </div>
      </div>

      {/* 2. FLOATING REAL-TIME WARNING & NOTIFICATION SYSTEMS */}
      
      {/* Top Center Mission Status Alert Badge */}
      <div className="absolute top-3.5 left-1/2 -translate-x-1/2 z-20 bg-space-950/85 border border-cyber-cyan/35 text-cyber-cyan font-mono text-[8px] px-3.5 py-0.5 rounded-lg tracking-widest uppercase font-bold flex items-center gap-1.5 backdrop-blur-sm">
        <span className="w-1 h-1 rounded-full bg-cyber-cyan animate-pulse shadow-glow-cyan" />
        <span>MISSION ACTIVE: ZONE B SURVEYING</span>
      </div>

      {/* Floating Critical Alert panel */}
      {roverMode === 'E-STOP' && (
        <div className="absolute top-16 left-3.5 z-30 bg-[#2d0909]/45 border border-cyber-red text-cyber-red rounded-lg p-3 backdrop-blur-md shadow-glow-red/20 flex items-center gap-2.5 animate-pulse max-w-xs border-l-4">
          <AlertTriangle className="w-5 h-5 text-cyber-red shrink-0 animate-bounce" />
          <div className="font-mono text-[9px]">
            <div className="font-black uppercase tracking-widest text-[9.5px]">CRITICAL: ESTOP engage</div>
            <div className="text-slate-300 text-[7.5px] mt-0.5 font-bold uppercase tracking-wide">
              Motors disarmed immediately. check telemetry links.
            </div>
          </div>
        </div>
      )}

      {/* Bottom Left subtle Operator Notification panel */}
      <div className="absolute bottom-3.5 left-3.5 z-20 bg-space-950/85 border border-space-850 text-slate-400 font-mono text-[7px] px-2.5 py-1 rounded font-bold uppercase tracking-wider backdrop-blur-sm flex items-center gap-1.5">
        <span className="text-cyber-green animate-pulse">●</span>
        <span>SYS LOCK: NOMINAL // LINK LEVEL: 50HZ</span>
      </div>

      {/* RENDER VIEWPORT FRAME */}
      <div className="relative w-full h-full flex-1 flex items-center justify-center overflow-hidden">
        {camera.status === 'online' ? (
  <img
    src="http://192.168.1.5:8080/video"
    alt="Live Feed"
    className="w-full h-full object-cover"
  />
) :camera.status === 'standby' ? (
  <div className="w-full h-full flex flex-col items-center justify-center bg-space-900 text-center font-mono">
    <AlertTriangle className="w-6 h-6 text-cyber-orange animate-pulse mb-2" />
    <div className="text-cyber-orange font-bold text-[9px] uppercase tracking-widest">
      STREAM STANDBY
    </div>
    <span className="text-slate-500 text-[7px] mt-0.5">
      READY TO POLL
    </span>
  </div>
) : (
  <div className="w-full h-full flex flex-col items-center justify-center bg-space-950 text-center font-mono">
    <AlertCircle className="w-6 h-6 text-cyber-red animate-bounce mb-2" />
    <div className="text-cyber-red font-bold text-[9px] uppercase tracking-widest">
      INGEST FAULT: OFFLINE
    </div>
    <span className="text-slate-500 text-[7px] mt-0.5">
      VERIFY HARDWARE DRIVER STATUS
    </span>
  </div>
)
}
 </div>

    </div>
  );
}

