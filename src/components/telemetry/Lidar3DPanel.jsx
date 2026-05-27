import React, { useEffect, useRef, useState } from 'react';
import { useRover } from '../../context/RoverContext';
import { Layers, ShieldAlert, Cpu, Compass, Maximize2 } from 'lucide-react';

/**
 * Lidar3DPanel Component.
 * Implements a high-density, professional 3D autonomous navigation perception panel.
 * Projects a real-time 3D depth grid, curved path planning lane, coordinate space, 
 * point-cloud particle fields, and projected obstacle bounding wireframes using Canvas.
 */
export default function Lidar3DPanel() {
  const { telemetry, roverMode, driverMode } = useRover();
  const { speed } = telemetry;
  const canvasRef = useRef(null);

  // Derived high-clarity telemetry overlays connected to centralized state
  const isEstop = roverMode === 'E-STOP';
  const scanRange = 22.0 + speed * 3.5 + Math.sin(Date.now() / 6000) * 0.4;
  const objectCount = isEstop ? 14 : (speed > 0 ? 42 + Math.round(speed * 6) + (Math.round(Date.now() / 1500) % 3) : 38);
  const activeDetection = isEstop ? 'ESTOP_HOLD' : (speed > 0 ? 'DYNAMIC_TRACK' : 'SLAM_LOCK');
  const sensorStatus = isEstop ? 'FAULT_STANDBY' : 'NOMINAL';
  const navLock = driverMode;


  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    let animationId;
    let sweepPhase = 0;
    
    // 3D Point Cloud procedurally scattered particles (x, y, z)
    // coordinate system: y pointing upwards, base plane is at y = 45 (ground)
    const points = [];
    for (let i = 0; i < 180; i++) {
      const z = 20 + Math.random() * 160; // depth
      const angle = (Math.random() - 0.5) * 1.5; // arc spread
      const x = Math.sin(angle) * (z * 0.7); // scale width by depth
      
      // mostly on ground, some elevated points to resemble terrain/obstacles
      let y = 45; 
      let isObstacle = false;
      
      // cluster 1: Rock left (x: -30, z: 80)
      if (Math.abs(x + 30) < 12 && Math.abs(z - 80) < 10) {
        y = 45 - Math.random() * 8;
        isObstacle = true;
      }
      // cluster 2: Rock right (x: 40, z: 120)
      if (Math.abs(x - 40) < 15 && Math.abs(z - 120) < 12) {
        y = 45 - Math.random() * 12;
        isObstacle = true;
      }
      // cluster 3: Rock center distance (x: -5, z: 150)
      if (Math.abs(x + 5) < 8 && Math.abs(z - 150) < 8) {
        y = 45 - Math.random() * 6;
        isObstacle = true;
      }

      points.push({
        x,
        y: y + (Math.random() - 0.5) * 1.5, // slight sensor jitter
        z,
        isObstacle,
        jitterSeed: Math.random() * 100
      });
    }

    // 3D Wireframe obstacles config
    const obstacles3D = [
      { cx: -30, cy_base: 45, cz: 80, w: 14, h: 10, d: 12, name: "OBS_01_LEFT", alert: false },
      { cx: 38, cy_base: 45, cz: 115, w: 16, h: 14, d: 14, name: "OBS_02_RIGHT", alert: false },
      { cx: -5, cy_base: 45, cz: 145, w: 10, h: 8, d: 10, name: "OBS_03_DIST", alert: false }
    ];

    const render = () => {
      const w = canvas.width = canvas.clientWidth;
      const h = canvas.height = canvas.clientHeight;
      
      ctx.fillStyle = '#060608';
      ctx.fillRect(0, 0, w, h);

      // 3D Perspective Projection Engine parameters
      const centerX = w / 2;
      const horizonY = h * 0.28; // high camera view looking down
      const focalLength = w * 0.9; // field of view factor
      const groundPlaneY = 45; // base coordinate height

      // Helper function to project 3D coordinate (x, y, z) -> 2D (px, py)
      const project = (x, y, z) => {
        if (z <= 0) z = 0.1;
        // Perspective scaling factor
        const scale = focalLength / z;
        return {
          x: centerX + x * scale,
          y: horizonY + y * scale,
          scale
        };
      };

      // 1. Draw 3D Ground Mesh (Longitudinal and Lateral segments)
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
      ctx.lineWidth = 1;

      // A. Longitudinal Lines converging to horizon vanishing point
      const xGridLines = [-120, -90, -60, -30, 0, 30, 60, 90, 120];
      xGridLines.forEach(gx => {
        ctx.beginPath();
        const pStart = project(gx, groundPlaneY, 15);
        const pEnd = project(gx, groundPlaneY, 180);
        ctx.moveTo(pStart.x, pStart.y);
        ctx.lineTo(pEnd.x, pEnd.y);
        ctx.stroke();
      });

      // B. Lateral lines (horizontal bars getting closer to horizon)
      const zGridLines = [20, 30, 40, 50, 60, 75, 90, 110, 130, 155, 180];
      zGridLines.forEach(gz => {
        ctx.beginPath();
        const pLeft = project(-130, groundPlaneY, gz);
        const pRight = project(130, groundPlaneY, gz);
        ctx.moveTo(pLeft.x, pLeft.y);
        ctx.lineTo(pRight.x, pRight.y);
        ctx.stroke();

        // Subtle distance markers text
        if (gz % 20 === 0 || gz === 90 || gz === 180) {
          ctx.fillStyle = 'rgba(6, 182, 212, 0.22)';
          ctx.font = '6.5px monospace';
          ctx.fillText(`${(gz / 10).toFixed(0)}m`, pRight.x + 4, pRight.y + 2.5);
        }
      });

      // 2. Curving Autonomous Navigation Path Planning ribbon
      ctx.fillStyle = 'rgba(6, 182, 212, 0.04)';
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
      ctx.lineWidth = 1.8;

      ctx.beginPath();
      // Generate left and right ribbons of the autonomous navigation lane
      const laneWidth = 14; 
      const pathPointsLeft = [];
      const pathPointsRight = [];
      
      for (let z = 15; z <= 175; z += 5) {
        // Path curves based on simple wave calculation
        const cx = Math.sin(z / 32 + sweepPhase * 0.08) * 12;
        pathPointsLeft.push(project(cx - laneWidth, groundPlaneY, z));
        pathPointsRight.push(project(cx + laneWidth, groundPlaneY, z));
      }

      // Draw Left ribbon edge
      ctx.beginPath();
      pathPointsLeft.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();

      // Draw Right ribbon edge
      ctx.beginPath();
      pathPointsRight.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();

      // Draw path infill pattern (dashes inside lane center)
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 8]);
      ctx.beginPath();
      for (let z = 18; z <= 170; z += 8) {
        const cx = Math.sin(z / 32 + sweepPhase * 0.08) * 12;
        const p = project(cx, groundPlaneY, z);
        if (z === 18) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      ctx.setLineDash([]); // clear dash

      // 3. Realtime Laser Sweep Wave in 3D
      sweepPhase += speed > 0 ? (0.35 + speed * 0.15) : 0.08;
      const scanZ = 20 + ((sweepPhase * 1.8) % 155); // sweep forward depth
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const pScanLeft = project(-110, groundPlaneY, scanZ);
      const pScanRight = project(110, groundPlaneY, scanZ);
      ctx.moveTo(pScanLeft.x, pScanLeft.y);
      ctx.lineTo(pScanRight.x, pScanRight.y);
      ctx.stroke();

      // Subtle orange laser sweep fill trail
      ctx.fillStyle = 'rgba(245, 158, 11, 0.015)';
      ctx.beginPath();
      const pScanBaseLeft = project(-115, groundPlaneY, Math.max(15, scanZ - 12));
      const pScanBaseRight = project(115, groundPlaneY, Math.max(15, scanZ - 12));
      ctx.moveTo(pScanBaseLeft.x, pScanBaseLeft.y);
      ctx.lineTo(pScanBaseRight.x, pScanBaseRight.y);
      ctx.lineTo(pScanRight.x, pScanRight.y);
      ctx.lineTo(pScanLeft.x, pScanLeft.y);
      ctx.fill();

      // 4. Draw 3D Point Cloud particles with realistic depth sizing
      points.forEach(pt => {
        // slight procedural jitter to make points shimmer like live scanners
        const jitter = Math.sin(sweepPhase * 0.2 + pt.jitterSeed) * 0.4;
        const proj = project(pt.x + jitter, pt.y, pt.z);

        if (proj.x < 0 || proj.x > w || proj.y < 0 || proj.y > h) return;

        // Color points based on depth, highlight obstacles in orange/red
        let baseColor = 'rgba(6, 182, 212, 0.55)'; // Cyan
        if (pt.isObstacle) {
          baseColor = pt.z < 95 ? 'rgba(239, 68, 68, 0.8)' : 'rgba(245, 158, 11, 0.7)'; // Red or Orange
        }

        // Particle size scale gets larger as depth decreases (closer to rover)
        const radius = Math.max(0.6, pt.isObstacle ? proj.scale * 0.45 : proj.scale * 0.3);

        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Highlight scan points hit by active sweep beam
        if (Math.abs(pt.z - scanZ) < 8) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, radius * 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 5. Draw 3D Projected Wireframe Bounding Boxes for Obstacles
      obstacles3D.forEach(obs => {
        const halfW = obs.w / 2;
        const halfD = obs.d / 2;
        const base = obs.cy_base;
        const top = base - obs.h;

        // Alert state based on depth proximity (z < 95m means rover close warning)
        const isAlert = obs.cz < 95;
        ctx.strokeStyle = isAlert ? 'rgba(239, 68, 68, 0.75)' : 'rgba(6, 182, 212, 0.4)';
        ctx.lineWidth = isAlert ? 1.4 : 0.8;

        // Define 8 vertices of the 3D cube
        const v = [
          project(obs.cx - halfW, base, obs.cz - halfD), // 0: bottom front left
          project(obs.cx + halfW, base, obs.cz - halfD), // 1: bottom front right
          project(obs.cx + halfW, base, obs.cz + halfD), // 2: bottom back right
          project(obs.cx - halfW, base, obs.cz + halfD), // 3: bottom back left
          project(obs.cx - halfW, top,  obs.cz - halfD), // 4: top front left
          project(obs.cx + halfW, top,  obs.cz - halfD), // 5: top front right
          project(obs.cx + halfW, top,  obs.cz + halfD), // 6: top back right
          project(obs.cx - halfW, top,  obs.cz + halfD)  // 7: top back left
        ];

        // Draw bottom face
        ctx.beginPath();
        ctx.moveTo(v[0].x, v[0].y); ctx.lineTo(v[1].x, v[1].y);
        ctx.lineTo(v[2].x, v[2].y); ctx.lineTo(v[3].x, v[3].y);
        ctx.closePath();
        ctx.stroke();

        // Draw top face
        ctx.beginPath();
        ctx.moveTo(v[4].x, v[4].y); ctx.lineTo(v[5].x, v[5].y);
        ctx.lineTo(v[6].x, v[6].y); ctx.lineTo(v[7].x, v[7].y);
        ctx.closePath();
        ctx.stroke();

        // Draw vertical connector struts
        ctx.beginPath();
        ctx.moveTo(v[0].x, v[0].y); ctx.lineTo(v[4].x, v[4].y);
        ctx.moveTo(v[1].x, v[1].y); ctx.lineTo(v[5].x, v[5].y);
        ctx.moveTo(v[2].x, v[2].y); ctx.lineTo(v[6].x, v[6].y);
        ctx.moveTo(v[3].x, v[3].y); ctx.lineTo(v[7].x, v[7].y);
        ctx.stroke();

        // Draw flat hazard wireframe floor projection (dashed block below object)
        ctx.fillStyle = isAlert ? 'rgba(239, 68, 68, 0.05)' : 'rgba(6, 182, 212, 0.015)';
        ctx.beginPath();
        ctx.moveTo(v[0].x, v[0].y); ctx.lineTo(v[1].x, v[1].y);
        ctx.lineTo(v[2].x, v[2].y); ctx.lineTo(v[3].x, v[3].y);
        ctx.fill();

        // Tag label above obstacle bounds
        const labelPoint = v[4]; // Top front left
        ctx.fillStyle = isAlert ? '#ef4444' : '#06b6d4';
        ctx.font = '6px monospace';
        ctx.fillText(`${obs.name} [d:${(obs.cz/10).toFixed(1)}m]`, labelPoint.x, labelPoint.y - 4);
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [speed]);

  return (
    <div className="hud-panel p-3 border-space-800 bg-[#0b0f19]/30 relative overflow-hidden font-mono select-none flex flex-col gap-3 rounded-lg border">
      
      {/* 1. Header perception layer panel layout */}
      <div className="flex justify-between items-center text-[10px] text-cyber-cyan/50 uppercase tracking-widest border-b border-space-800/60 pb-2.5">
        <span className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyber-cyan animate-pulse" />
          [07_AUTONOMOUS_NAV_3D_LIDAR_POINTCLOUD_MESH]
        </span>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[7.5px] text-slate-500 font-bold">
            <Cpu className="w-3 h-3 text-cyber-cyan" />
            ENGINE: SLAM_V3
          </span>
          <span className="text-[8px] font-black px-2 py-0.5 border rounded uppercase text-cyber-cyan border-cyber-cyan/20 bg-cyber-cyan/5">
            {navLock}
          </span>
        </div>
      </div>

      {/* 2. Visual 3D canvas layer */}
      <div className="w-full h-[220px] bg-[#060608] border border-space-850 rounded-lg relative overflow-hidden shrink-0">
        
        {/* Subtle grid mesh overlay */}
        <div className="absolute inset-0 grid-overlay opacity-[0.03] pointer-events-none" />
        
        <canvas ref={canvasRef} className="w-full h-full block" />
        
        {/* Visual axis coordinates overlay */}
        <div className="absolute bottom-2.5 left-3 text-[6px] text-slate-500 bg-[#060608]/90 p-1 border border-space-850/60 rounded flex flex-col gap-0.5 tracking-wider font-bold">
          <div>COORD: WGS84_UTM</div>
          <div>SCAN_SPAN: 180° HORIZ</div>
          <div>AXIS_LOCK: GRID_NOMINAL</div>
        </div>

        {/* Dynamic Warning alerts when sweep approaches hazards */}
        <div className="absolute top-2.5 right-3 flex items-center gap-1.5 bg-cyber-red/10 border border-cyber-red/20 text-cyber-red text-[7.5px] px-2 py-0.5 rounded font-black tracking-wide animate-pulse">
          <ShieldAlert className="w-3 h-3 shrink-0" />
          <span>COLLISION AVOIDANCE ACTIVE</span>
        </div>
      </div>

      {/* 3. Compact Minimal Telemetry Overlay */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 border-t border-space-800/50 pt-2.5">
        
        {/* Item 1: Scan range */}
        <div className="p-2 bg-[#060608]/85 border border-space-850/80 rounded-md flex flex-col">
          <span className="text-[7.5px] text-slate-500 uppercase font-black tracking-wider leading-none mb-1">SCAN RANGE</span>
          <span className="text-xs md:text-sm font-black text-slate-200 leading-none">
            {scanRange.toFixed(1)} <span className="text-[8px] font-normal text-slate-500">m</span>
          </span>
        </div>

        {/* Item 2: Objects count */}
        <div className="p-2 bg-[#060608]/85 border border-space-850/80 rounded-md flex flex-col">
          <span className="text-[7.5px] text-slate-500 uppercase font-black tracking-wider leading-none mb-1">OBJECTS</span>
          <span className="text-xs md:text-sm font-black text-cyber-cyan leading-none">
            {objectCount} <span className="text-[8px] font-normal text-slate-500">OBJs</span>
          </span>
        </div>

        {/* Item 3: Active Detection */}
        <div className="p-2 bg-[#060608]/85 border border-space-850/80 rounded-md flex flex-col">
          <span className="text-[7.5px] text-slate-500 uppercase font-black tracking-wider leading-none mb-1">DETECTION</span>
          <span className="text-[10px] font-black text-cyber-cyan leading-none mt-0.5">
            {activeDetection}
          </span>
        </div>

        {/* Item 4: Sensor Status */}
        <div className="p-2 bg-[#060608]/85 border border-space-850/80 rounded-md flex flex-col">
          <span className="text-[7.5px] text-slate-500 uppercase font-black tracking-wider leading-none mb-1">SENSOR</span>
          <span className="text-[10px] font-black text-cyber-green leading-none mt-0.5">
            {sensorStatus}
          </span>
        </div>

        {/* Item 5: Depth Resolution */}
        <div className="p-2 bg-[#060608]/85 border border-space-850/80 rounded-md flex flex-col">
          <span className="text-[7.5px] text-slate-500 uppercase font-black tracking-wider leading-none mb-1">RESOLUTION</span>
          <span className="text-xs md:text-sm font-black text-slate-200 leading-none">
            0.05m
          </span>
        </div>

        {/* Item 6: Navigation Lock */}
        <div className="p-2 bg-[#060608]/85 border border-space-850/80 rounded-md flex flex-col">
          <span className="text-[7.5px] text-slate-500 uppercase font-black tracking-wider leading-none mb-1">NAV_LOCK</span>
          <span className="text-[10px] font-black text-cyber-orange leading-none mt-0.5">
            LOCKED_3D
          </span>
        </div>

      </div>

    </div>
  );
}

