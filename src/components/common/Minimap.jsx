import React, { useEffect, useState, useRef } from 'react';
import { useRover } from '../../context/RoverContext';
import { Compass, Navigation } from 'lucide-react';

/**
 * High-fidelity HUD Map / Tactical Terrain Minimap
 * Simulates real-time tactical coordinates, GPS walking trail,
 * and rotating orientation arrow representing ROS sensor feeds.
 */
export default function Minimap() {
  const { telemetry } = useRover();
  const { gps, heading } = telemetry;
  const canvasRef = useRef(null);

  // Maintain path coordinates trail
  const [trail, setTrail] = useState([]);

  useEffect(() => {
    // Append coordinates when they drift significantly
    setTrail(prev => {
      const last = prev[prev.length - 1];
      if (!last || Math.abs(last.lat - gps.lat) > 0.000005 || Math.abs(last.lng - gps.lng) > 0.000005) {
        return [...prev.slice(-35), { lat: gps.lat, lng: gps.lng }]; // Keep last 35 points
      }
      return prev;
    });
  }, [gps.lat, gps.lng]);

  // Render tactical grid overlay
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const w = canvas.width = canvas.clientWidth;
    const h = canvas.height = canvas.clientHeight;
    
    // Clear
    ctx.fillStyle = '#060608';
    ctx.fillRect(0, 0, w, h);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.06)';
    ctx.lineWidth = 1;
    const gridSize = 25;
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

    // Draw concentric radar range circles
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 40, 0, Math.PI * 2);
    ctx.arc(w / 2, h / 2, 80, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshairs
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.12)';
    ctx.beginPath();
    ctx.moveTo(w / 2, 10);
    ctx.lineTo(w / 2, h - 10);
    ctx.moveTo(10, h / 2);
    ctx.lineTo(w - 10, h / 2);
    ctx.stroke();

    // Center Coordinate is active Rover position
    const centerX = w / 2;
    const centerY = h / 2;

    // Draw trail
    if (trail.length > 1) {
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      
      trail.forEach((pt, i) => {
        // Compute delta mapping relative to active GPS
        const dLng = (pt.lng - gps.lng) * 450000; // scaling factor
        const dLat = (pt.lat - gps.lat) * 450000;
        
        const x = centerX + dLng;
        const y = centerY - dLat; // lat is positive upwards, canvas y positive downwards
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]); // Reset
    }

    // Draw static target waypoint/obstacles in tactical grid
    ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1;
    // Obstacle 1
    ctx.beginPath();
    ctx.arc(centerX + 60, centerY - 40, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ef4444';
    ctx.font = '6px monospace';
    ctx.fillText('FAULT_A', centerX + 68, centerY - 38);

    // Obstacle 2
    ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
    ctx.strokeStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(centerX - 70, centerY + 30, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#10b981';
    ctx.fillText('TARGET_B', centerX - 94, centerY + 32);

    // Draw Rover Arrow at center, rotated according to heading
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((heading * Math.PI) / 180);
    
    // Draw glowing center marker
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#06b6d4';
    ctx.fillStyle = '#06b6d4';
    
    ctx.beginPath();
    ctx.moveTo(0, -9); // Apex of arrow
    ctx.lineTo(6, 6);
    ctx.lineTo(0, 2);
    ctx.lineTo(-6, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

  }, [gps, heading, trail]);

  return (
    <div className="hud-panel p-3 border-space-800 flex flex-col h-full overflow-hidden select-none">
      {/* Header */}
      <div className="flex justify-between items-center text-[10px] font-mono text-cyber-cyan/60 uppercase tracking-widest border-b border-space-800 pb-1.5 mb-2.5 shrink-0">
        <span className="flex items-center gap-1">
          <Compass className="w-3.5 h-3.5 text-cyber-cyan" />
          [10_TACTICAL_RADAR]
        </span>
        <span className="text-cyber-amber">ROS_INGEST</span>
      </div>

      {/* Canvas Viewport */}
      <div className="relative flex-1 bg-space-950 border border-space-850 rounded-lg overflow-hidden h-40">
        <canvas ref={canvasRef} className="w-full h-full block" />
        
        {/* Corner labels */}
        <div className="absolute top-2 left-2 text-[7px] font-mono text-slate-500 bg-space-950/80 px-1 rounded border border-space-900">
          GRID_RES: 5.0M
        </div>
        <div className="absolute bottom-2 left-2 text-[7px] font-mono text-slate-500 bg-space-950/80 px-1 rounded border border-space-900">
          LOCK: INERTIAL_MAPPING
        </div>
      </div>

      {/* Position metrics */}
      <div className="mt-2 flex justify-between items-center text-[9px] font-mono text-slate-400 font-semibold shrink-0">
        <div className="flex items-center gap-1">
          <Navigation className="w-3 h-3 text-cyber-amber" />
          <span>HDG: {Math.round(heading)}°</span>
        </div>
        <span>COORD: {gps.lat.toFixed(4)}, {gps.lng.toFixed(4)}</span>
      </div>
    </div>
  );
}
