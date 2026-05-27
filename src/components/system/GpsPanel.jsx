import React, { useEffect, useRef, useState } from 'react';
import { useRover } from '../../context/RoverContext';
import StatusLed from '../common/StatusLed';

export default function GpsPanel() {
  const { telemetry } = useRover();
  const { gps, heading, speed } = telemetry;
  const canvasRef = useRef(null);

  // Live ticking UTC time clock inside card
  const [cardTime, setCardTime] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      setCardTime(date.toISOString().slice(11, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Render tactical waypoint map
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const w = canvas.width = canvas.clientWidth;
    const h = canvas.height = canvas.clientHeight;
    
    ctx.fillStyle = '#08080a';
    ctx.fillRect(0, 0, w, h);

    // Fine coordinate grid
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.04)';
    ctx.lineWidth = 0.8;
    const gridSize = 12;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    const centerX = w / 2;
    const centerY = h / 2;

    // Range rings
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.06)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 14, 0, Math.PI * 2);
    ctx.arc(centerX, centerY, 28, 0, Math.PI * 2);
    ctx.stroke();

    // Waypoint target
    ctx.fillStyle = 'rgba(234, 88, 12, 0.2)';
    ctx.strokeStyle = '#ea580c';
    ctx.beginPath();
    ctx.arc(centerX + 20, centerY - 10, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Rotating pointer
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((heading * Math.PI) / 180);
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.moveTo(0, -4.5);
    ctx.lineTo(3.5, 3.5);
    ctx.lineTo(0, 1.2);
    ctx.lineTo(-3.5, 3.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

  }, [heading]);

  return (
    <div className="hud-panel p-3.5 border-space-800 bg-[#0b0f19]/30 relative overflow-hidden font-mono select-none flex flex-col gap-2.5">
      
      {/* Mesh grid */}
      <div className="absolute inset-0 grid-overlay opacity-[0.02] pointer-events-none" />

      {/* HEADER */}
      <div className="flex justify-between items-center text-[10px] text-cyber-cyan/50 uppercase tracking-widest border-b border-space-800/60 pb-2 shrink-0">
        <span>[02_GPS_NAVIGATION]</span>
        <div className="flex items-center gap-1.5 text-[8.5px] text-cyber-green font-bold">
          <StatusLed status="healthy" pulse={false} className="w-1.5 h-1.5" />
          <span>{gps.lock}</span>
        </div>
      </div>

      {/* Primary Coordinates Readout (OVERHAULED TYPOGRAPHY) */}
      <div className="grid grid-cols-2 gap-2 text-right shrink-0">
        <div className="p-2 bg-[#060608]/85 border border-space-850 rounded-lg flex flex-col justify-center">
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider text-left mb-0.5">LATITUDE</span>
          <span className="text-sm font-black text-slate-200">{gps.lat.toFixed(5)} <span className="text-[8px] font-normal text-slate-500">N</span></span>
        </div>
        <div className="p-2 bg-[#060608]/85 border border-space-850 rounded-lg flex flex-col justify-center">
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider text-left mb-0.5">LONGITUDE</span>
          <span className="text-sm font-black text-slate-200">{gps.lng.toFixed(5)} <span className="text-[8px] font-normal text-slate-500">E</span></span>
        </div>
        <div className="p-2 bg-[#060608]/85 border border-space-850 rounded-lg flex flex-col justify-center">
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider text-left mb-0.5">ALTITUDE</span>
          <span className="text-sm font-black text-cyber-cyan">{gps.alt} <span className="text-[8px] font-normal text-slate-500">m</span></span>
        </div>
        <div className="p-2 bg-[#060608]/85 border border-space-850 rounded-lg flex flex-col justify-center">
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider text-left mb-0.5">SATELLITES</span>
          <span className="text-sm font-black text-cyber-amber">{gps.satellites} <span className="text-[8px] font-normal text-slate-500">SATS</span></span>
        </div>
      </div>

      {/* Navigation detail parameters */}
      <div className="flex flex-col gap-1.5 text-[8.5px]">
        <div className="flex justify-between border-b border-space-900 pb-1">
          <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider">HDOP ACCURACY</span>
          <span className="text-cyber-green font-black text-xs">0.82 (±1.2m)</span>
        </div>
        <div className="flex justify-between border-b border-space-900 pb-1">
          <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider">GROUND SPEED</span>
          <span className="text-slate-200 font-black text-xs">{speed.toFixed(2)} m/s</span>
        </div>
        <div className="flex justify-between border-b border-space-900 pb-1">
          <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider">BEARING LOCK</span>
          <span className="text-cyber-cyan font-black text-xs">{heading}° TRUE</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider">UTC DATETIME</span>
          <span className="text-slate-300 font-bold">{cardTime}</span>
        </div>
      </div>

      {/* Radar waypoint canvas */}
      <div className="relative w-full h-[52px] bg-[#060608] border border-space-850 rounded-md overflow-hidden shrink-0">
        <canvas ref={canvasRef} className="w-full h-full block" />
        <div className="absolute top-0.5 left-1.5 text-[5px] text-slate-500 bg-[#060608]/80 px-1.5 rounded font-bold uppercase tracking-wider">
          TACTICAL_RADAR_NAV
        </div>
      </div>

    </div>
  );
}
