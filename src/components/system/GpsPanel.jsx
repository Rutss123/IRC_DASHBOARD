import React, { useEffect, useRef } from 'react';
import { useRover } from '../../context/RoverContext';
import BentoCard from '../common/BentoCard';
import { Navigation, Compass } from 'lucide-react';

export default function GpsPanel({ onResizePreset }) {
  const { telemetry } = useRover();
  const gps = telemetry.gps || { lat: 0, lng: 0, alt: 0, satellites: 0, lock: 'NO_LOCK', hdop: 99 };
  const heading = telemetry.heading ?? 0;
  const speed = telemetry.speed ?? 0;
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const w = (canvas.width = canvas.clientWidth);
    const h = (canvas.height = canvas.clientHeight);

    ctx.fillStyle = '#05070e';
    ctx.fillRect(0, 0, w, h);

    // Coordinate grid
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
    ctx.lineWidth = 1;
    const gridSize = 16;
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
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.16)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 18, 0, Math.PI * 2);
    ctx.arc(centerX, centerY, 36, 0, Math.PI * 2);
    ctx.stroke();

    // Rotating pointer
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(((heading ?? 0) * Math.PI) / 180);
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(5, 6);
    ctx.lineTo(0, 2.5);
    ctx.lineTo(-5, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }, [heading]);

  const lockColor =
    gps.lock === '3D_FIX' ? 'green' : gps.lock === '2D_LOCK' ? 'amber' : 'slate';

  return (
    <BentoCard
      title="GPS & Waypoints"
      subtitle="[02_NAV]"
      badge={gps.lock || 'NO_LOCK'}
      badgeColor={lockColor}
      isStale={telemetry.is_stale}
      onResizePreset={onResizePreset}
    >
      <div className="flex flex-col gap-2 md:gap-2.5 h-full">
        {/* Top: Large Speed & Heading Readout */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 bg-[#050814]/80 border border-slate-800 rounded-xl flex flex-col justify-center">
            <span className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
              GROUND SPEED
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl md:text-2xl font-black text-slate-100">{Number(speed || 0).toFixed(2)}</span>
              <span className="text-xs font-bold text-slate-400">m/s</span>
            </div>
          </div>

          <div className="p-2 bg-[#050814]/80 border border-slate-800 rounded-xl flex flex-col justify-center">
            <span className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
              BEARING LOCK
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl md:text-2xl font-black text-cyan-400">{heading}°</span>
              <span className="text-xs font-bold text-slate-400">TRUE</span>
            </div>
          </div>
        </div>

        {/* Middle: Latitude, Longitude, Altitude, Satellites */}
        <div className="grid grid-cols-2 gap-1.5 text-right">
          <div className="p-1.5 px-2 bg-[#050814]/80 border border-slate-800 rounded-xl flex flex-col justify-center">
            <span className="text-[8.5px] text-slate-400 font-bold uppercase tracking-wider text-left mb-0.5">
              LATITUDE
            </span>
            <span className="text-xs md:text-sm font-black text-slate-200">
              {Number(gps.lat || 0).toFixed(5)} <span className="text-[8.5px] font-bold text-slate-400">N</span>
            </span>
          </div>
          <div className="p-1.5 px-2 bg-[#050814]/80 border border-slate-800 rounded-xl flex flex-col justify-center">
            <span className="text-[8.5px] text-slate-400 font-bold uppercase tracking-wider text-left mb-0.5">
              LONGITUDE
            </span>
            <span className="text-xs md:text-sm font-black text-slate-200">
              {Number(gps.lng || 0).toFixed(5)} <span className="text-[8.5px] font-bold text-slate-400">E</span>
            </span>
          </div>
          <div className="p-1.5 px-2 bg-[#050814]/80 border border-slate-800 rounded-xl flex flex-col justify-center">
            <span className="text-[8.5px] text-slate-400 font-bold uppercase tracking-wider text-left mb-0.5">
              ALTITUDE
            </span>
            <span className="text-xs md:text-sm font-black text-cyan-400">
              {Number(gps.alt || 0).toFixed(1)} <span className="text-[8.5px] font-bold text-slate-400">m</span>
            </span>
          </div>
          <div className="p-1.5 px-2 bg-[#050814]/80 border border-slate-800 rounded-xl flex flex-col justify-center">
            <span className="text-[8.5px] text-slate-400 font-bold uppercase tracking-wider text-left mb-0.5">
              SATELLITES
            </span>
            <span className="text-xs md:text-sm font-black text-amber-400">
              {gps.satellites ?? 0} <span className="text-[8.5px] font-bold text-slate-400">SATS</span>
            </span>
          </div>
        </div>

        {/* Mini Bearing Radar */}
        <div className="relative w-full h-[52px] bg-[#05070e] border border-slate-800 rounded-xl overflow-hidden shrink-0 mt-auto">
          <canvas ref={canvasRef} className="w-full h-full block" />
          <div className="absolute top-1 left-2 text-[8px] text-cyan-400/80 bg-[#05070e]/90 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
            TACTICAL COMPASS
          </div>
        </div>
      </div>
    </BentoCard>
  );
}
