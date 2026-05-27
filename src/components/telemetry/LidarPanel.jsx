import React, { useEffect, useRef, useState } from 'react';
import { useRover } from '../../context/RoverContext';
import { Eye, ShieldAlert, Layers } from 'lucide-react';

export default function LidarPanel() {
  const { telemetry } = useRover();
  const { speed } = telemetry;
  const canvasRef = useRef(null);

  // Live distance and cluster parameters
  const [lidarMetrics, setLidarMetrics] = useState({
    nearestObstacle: 1.84,
    scanRange: 12.0,
    activeScan: 'ACTIVE_SWEEP',
    objectCount: 24,
    sectorStatus: 'CLEAR'
  });

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    let animationId;
    let sweepAngle = 0;
    let sweepDir = 1;
    
    // Scanned point cloud clusters (procedural Lidar scans)
    const points = [
      { r: 35, theta: 60, size: 2.2, color: 'rgba(234, 88, 12, 0.75)' }, 
      { r: 60, theta: 90, size: 1.8, color: 'rgba(6, 182, 212, 0.65)' },
      { r: 85, theta: 120, size: 1.5, color: 'rgba(6, 182, 212, 0.5)' },
      { r: 42, theta: 150, size: 2.0, color: 'rgba(234, 88, 12, 0.75)' },
      { r: 70, theta: 30, size: 1.5, color: 'rgba(6, 182, 212, 0.6)' },
      { r: 25, theta: 80, size: 2.5, color: 'rgba(239, 68, 68, 0.85)' } // too close!
    ];

    const render = () => {
      const w = canvas.width = canvas.clientWidth;
      const h = canvas.height = canvas.clientHeight;
      
      // Pivot coordinates at bottom center to represent wide 180° forward LIDAR
      const centerX = w / 2;
      const centerY = h - 10;

      ctx.fillStyle = '#070709';
      ctx.fillRect(0, 0, w, h);

      // 1. Draw 180° concentric distance rings
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.05)';
      ctx.lineWidth = 0.8;
      
      const rings = [30, 60, 90, 120];
      rings.forEach(r => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, Math.PI, 0);
        ctx.stroke();

        // Print distance label on rings
        ctx.fillStyle = 'rgba(6, 182, 212, 0.3)';
        ctx.font = '5px monospace';
        ctx.fillText(`${(r / 10).toFixed(1)}m`, centerX + r - 8, centerY - 2);
      });

      // Sector lines fanning forward
      const sectors = [30, 60, 90, 120, 150];
      sectors.forEach(angleDeg => {
        const rad = (angleDeg * Math.PI) / 180;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX - Math.cos(rad) * 120, centerY - Math.sin(rad) * 120);
        ctx.stroke();
      });

      // 2. Oscillating Lidar Sweep line (180° range)
      sweepAngle += 0.015 * sweepDir;
      if (sweepAngle >= Math.PI) {
        sweepAngle = Math.PI;
        sweepDir = -1;
      } else if (sweepAngle <= 0) {
        sweepAngle = 0;
        sweepDir = 1;
      }

      const sweepX = centerX - Math.cos(sweepAngle) * 120;
      const sweepY = centerY - Math.sin(sweepAngle) * 120;

      // Draw active sweep beam gradient
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(sweepX, sweepY);
      ctx.stroke();

      // 3. Draw 2D Point Cloud clusters
      points.forEach(pt => {
        const rad = (pt.theta * Math.PI) / 180;
        const px = centerX - Math.cos(rad) * pt.r;
        const py = centerY - Math.sin(rad) * pt.r;

        // Scanned point highlights
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(px, py, pt.size, 0, Math.PI * 2);
        ctx.fill();

        // Halo glows around scanned obstacles
        ctx.strokeStyle = pt.color;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(px, py, pt.size * 2, 0, Math.PI * 2);
        ctx.stroke();
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [speed]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLidarMetrics(prev => {
        const obsDrift = parseFloat((1.2 + Math.random() * 0.9).toFixed(2));
        const countDrift = Math.round(18 + Math.random() * 8);
        return {
          ...prev,
          nearestObstacle: obsDrift,
          objectCount: countDrift,
          sectorStatus: obsDrift < 1.4 ? 'OBSTACLE_ALERT' : 'NOMINAL'
        };
      });
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hud-panel p-3.5 border-space-800 bg-[#0b0f19]/30 relative overflow-hidden font-mono select-none flex flex-col gap-3">
      
      {/* Grid background mesh */}
      <div className="absolute inset-0 grid-overlay opacity-[0.02] pointer-events-none" />

      {/* Header */}
      <div className="flex justify-between items-center text-[10px] text-cyber-cyan/50 uppercase tracking-widest border-b border-space-800/60 pb-2">
        <span className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyber-cyan animate-pulse" />
          [08_LIDAR_SLAM_PERCEPTION_MESH]
        </span>
        <span className={`text-[8.5px] font-bold px-2 py-0.5 border rounded uppercase ${
          lidarMetrics.sectorStatus === 'NOMINAL' 
            ? 'text-cyber-green border-cyber-green/20 bg-cyber-green/5' 
            : 'text-cyber-red border-cyber-red/20 bg-cyber-red/5 animate-pulse'
        }`}>
          {lidarMetrics.sectorStatus}
        </span>
      </div>

      {/* Wide horizontal visual layout split */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        
        {/* Left side: Wide 2D Point Cloud SLAM canvas (occupies 2 columns) */}
        <div className="md:col-span-2 w-full h-[120px] bg-[#060608] border border-space-850 rounded-lg relative overflow-hidden shrink-0">
          <canvas ref={canvasRef} className="w-full h-full block" />
          <div className="absolute top-1 left-1.5 text-[5px] text-slate-500 bg-[#060608]/80 px-1 rounded uppercase tracking-wider font-bold">
            SLAM_2D_FORWARD_SCANS
          </div>
        </div>

        {/* Right side: High-Clarity Telemetry Readouts (1 column) */}
        <div className="md:col-span-1 w-full flex flex-col gap-2.5">
          {/* Nearest Obstacle (BIG VALUE HIERARCHY) */}
          <div className="flex justify-between items-center bg-[#060608]/85 p-2.5 border border-space-850 rounded-lg">
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider leading-none mb-1">NEAREST_OBS</span>
              <span className="text-[7.5px] text-slate-600 font-bold uppercase tracking-wider">CRIT_THRESHOLD: 1.5m</span>
            </div>
            <div className="text-right">
              <span className={`text-xl font-black font-mono tracking-tight leading-none ${
                lidarMetrics.nearestObstacle < 1.4 ? 'text-cyber-red animate-pulse' : 'text-cyber-orange'
              }`}>
                {lidarMetrics.nearestObstacle.toFixed(2)} <span className="text-[9px] font-normal text-slate-500">m</span>
              </span>
            </div>
          </div>

          {/* Grid readings */}
          <div className="grid grid-cols-2 gap-2 text-right">
            <div className="p-2 bg-[#060608]/80 border border-space-850 rounded flex flex-col justify-center">
              <span className="text-[8.5px] text-slate-500 font-bold uppercase tracking-wider text-left mb-0.5">SCAN RANGE</span>
              <span className="text-base font-bold text-slate-200">{lidarMetrics.scanRange.toFixed(1)} <span className="text-[8px] font-normal text-slate-500">m</span></span>
            </div>
            <div className="p-2 bg-[#060608]/80 border border-space-850 rounded flex flex-col justify-center">
              <span className="text-[8.5px] text-slate-500 font-bold uppercase tracking-wider text-left mb-0.5">OBJECTS</span>
              <span className="text-base font-bold text-cyber-cyan">{lidarMetrics.objectCount} <span className="text-[8px] font-normal text-slate-500">OBJs</span></span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[7.5px] text-slate-500 font-bold border-t border-space-850/60 pt-2 px-0.5">
            <span>PERCEPTION: NOMINAL</span>
            <span>FREQ: 40Hz SWEEP</span>
          </div>
        </div>

      </div>

    </div>
  );
}
