import React, { useState, useEffect, useRef } from 'react';
import { useRover } from '../../context/RoverContext';
import StatusLed from '../common/StatusLed';
import { Wifi, MapPin, Globe, Radio, AlertTriangle } from 'lucide-react';

export default function RightTelemetryPanel() {
  const { telemetry, roverMode, primaryComms } = useRover();
  const { gps, network } = telemetry;
  const canvasRef = useRef(null);

  // Comms signal trend rolling array
  const [signalHistory, setSignalHistory] = useState([
    -60, -61, -59, -60, -62, -61, -63, -60, -58, -60, -61, -62, -60, -59, -61, -60, -61, -62, -59, -60
  ]);

  const currentDbm = -Math.round(110 - (network.signalQuality * 0.5) + (Math.random() - 0.5) * 1.5);

  useEffect(() => {
    setSignalHistory(prev => [...prev.slice(1), currentDbm]);
  }, [network.timestamp, currentDbm]);

  const getLatencyColor = (ms) => {
    if (ms >= 100) return 'text-cyber-red font-bold';
    if (ms >= 40) return 'text-cyber-orange';
    return 'text-cyber-green font-bold';
  };

  const getLossColor = (pct) => {
    if (pct >= 2.0) return 'text-cyber-red font-bold';
    if (pct >= 0.5) return 'text-cyber-orange';
    return 'text-cyber-green font-bold';
  };

  const getSvgPoints = (history, width, height) => {
    const minDbm = -90;
    const maxDbm = -50;
    const dbmRange = maxDbm - minDbm;
    const stepX = width / (history.length - 1);

    return history.map((val, index) => {
      const x = index * stepX;
      const clampedVal = Math.max(minDbm, Math.min(maxDbm, val));
      const ratio = (clampedVal - minDbm) / dbmRange;
      const y = height - (ratio * (height - 8)) - 4;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  };

  const svgWidth = 240;
  const svgHeight = 40;
  const points = getSvgPoints(signalHistory, svgWidth, svgHeight);

  // Render tactical grid radar canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const w = canvas.width = canvas.clientWidth;
    const h = canvas.height = canvas.clientHeight;
    
    ctx.fillStyle = '#08080a';
    ctx.fillRect(0, 0, w, h);

    // Fine coordinate grid
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.05)';
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

    // Concentric range rings
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 15, 0, Math.PI * 2);
    ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
    ctx.stroke();

    // Destination target waypoint WP_ALPHA
    ctx.fillStyle = 'rgba(234, 88, 12, 0.2)';
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(centerX + 24, centerY - 10, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ea580c';
    ctx.font = '6px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('WP_ALPHA', centerX + 29, centerY - 8);

    // Draw active rover navigation triangle pointing north/heading
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((telemetry.heading * Math.PI) / 180);
    
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(3.5, 3.5);
    ctx.lineTo(0, 1.2);
    ctx.lineTo(-3.5, 3.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

  }, [telemetry.heading]);

  return (
    <div className="flex flex-col gap-4 w-full select-none">
      
      {/* 1. COMMS CHANNEL & SIGNAL GRAPH */}
      <div className="hud-panel p-3.5 border-space-800 bg-[#0b0f19]/40 relative overflow-hidden">
        <div className="absolute inset-0 grid-overlay opacity-[0.02] pointer-events-none" />
        <div className="flex justify-between items-center text-[9px] font-mono text-cyber-cyan/60 uppercase tracking-widest border-b border-space-800/70 pb-1.5 mb-3">
          <span>[04_COMMS_DIAGNOSTICS]</span>
          <div className="flex items-center gap-1.5 text-[8px] text-cyber-green font-bold">
            <StatusLed status={primaryComms} pulse={primaryComms === 'online'} className="w-1 h-1" />
            <span>SECURE</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1.5 text-[8.5px] font-mono text-center mb-3">
          <div className="py-1 bg-space-950 border border-space-850 rounded flex flex-col justify-center">
            <span className="text-[6.5px] text-slate-500 font-bold uppercase">LATENCY</span>
            <span className={getLatencyColor(network.latency)}>{network.latency}ms</span>
          </div>
          <div className="py-1 bg-space-950 border border-space-850 rounded flex flex-col justify-center">
            <span className="text-[6.5px] text-slate-500 font-bold uppercase">LOSS</span>
            <span className={getLossColor(network.packetLoss)}>{network.packetLoss}%</span>
          </div>
          <div className="py-1 bg-space-950 border border-space-850 rounded flex flex-col justify-center">
            <span className="text-[6.5px] text-slate-500 font-bold uppercase">JITTER</span>
            <span className="text-slate-350 font-bold">{network.jitter}ms</span>
          </div>
          <div className="py-1 bg-space-950 border border-space-850 rounded flex flex-col justify-center">
            <span className="text-[6.5px] text-slate-500 font-bold uppercase">SIGNAL</span>
            <span className="text-cyber-cyan font-bold">{currentDbm}dBm</span>
          </div>
        </div>

        {/* SVG rolling graph lines */}
        <div className="relative w-full h-[36px] bg-space-950 border border-space-850 rounded-lg overflow-hidden shrink-0">
          <div className="absolute inset-0 flex flex-col justify-between p-0.5 opacity-10 pointer-events-none text-[5px] font-mono text-cyber-cyan/50 select-none">
            <div className="border-b border-cyber-cyan/10 w-full flex justify-between"><span>-50 dBm</span></div>
            <div className="w-full flex justify-between"><span>-90 dBm</span></div>
          </div>

          <svg className="w-full h-full" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
            <polyline fill="none" stroke="#06b6d4" strokeWidth="2.0" opacity="0.15" points={points} />
            <polyline fill="none" stroke="#ea580c" strokeWidth="1" points={points} />
          </svg>
        </div>
      </div>

      {/* 2. GPS DOCK & RADAR RADIAL MAP */}
      <div className="hud-panel p-3.5 border-space-800 bg-[#0b0f19]/40 relative overflow-hidden">
        <div className="absolute inset-0 grid-overlay opacity-[0.02] pointer-events-none" />
        <div className="flex justify-between items-center text-[9px] font-mono text-cyber-cyan/60 uppercase tracking-widest border-b border-space-800/70 pb-1.5 mb-3">
          <span>[05_TACTICAL_MAP_GPS]</span>
          <span className="text-cyber-green font-bold text-[8.5px] tracking-wide">{gps.lock}</span>
        </div>

        {/* GPS Coordinates grids */}
        <div className="grid grid-cols-2 gap-2 text-[9px] font-mono mb-3">
          <div className="p-1.5 bg-space-950 border border-space-850 rounded flex justify-between items-center">
            <span className="text-slate-500 font-bold uppercase text-[7.5px]">LAT</span>
            <span className="text-slate-200 font-bold">{gps.lat.toFixed(6)} N</span>
          </div>
          <div className="p-1.5 bg-space-950 border border-space-850 rounded flex justify-between items-center">
            <span className="text-slate-500 font-bold uppercase text-[7.5px]">LNG</span>
            <span className="text-slate-200 font-bold">{gps.lng.toFixed(6)} E</span>
          </div>
          <div className="p-1.5 bg-space-950 border border-space-850 rounded flex justify-between items-center">
            <span className="text-slate-500 font-bold uppercase text-[7.5px]">ALT</span>
            <span className="text-cyber-cyan font-bold">{gps.alt} m</span>
          </div>
          <div className="p-1.5 bg-space-950 border border-space-850 rounded flex justify-between items-center">
            <span className="text-slate-500 font-bold uppercase text-[7.5px]">SATS</span>
            <span className="text-cyber-amber font-bold">{gps.satellites} SATS</span>
          </div>
        </div>

        {/* Tactical radar canvas */}
        <div className="relative w-full h-[62px] bg-[#060608] border border-space-850 rounded-lg overflow-hidden shrink-0">
          <canvas ref={canvasRef} className="w-full h-full block" />
          <div className="absolute top-1 left-1.5 text-[5.5px] font-mono text-slate-500 bg-space-950/80 px-1 rounded uppercase tracking-wider font-bold">
            TELEM_RADAR_GUIDANCE
          </div>
        </div>
      </div>

      {/* 3. SAFETY ALERTS & ALARM CONTROL */}
      <div className="hud-panel p-3.5 border-space-800 bg-[#0b0f19]/40 relative overflow-hidden">
        <div className="absolute inset-0 grid-overlay opacity-[0.02] pointer-events-none" />
        <div className="flex justify-between items-center text-[9px] font-mono text-cyber-cyan/60 uppercase tracking-widest border-b border-space-800/70 pb-1.5 mb-2.5">
          <span>[06_SAFETY_MATRIX]</span>
          <span className="text-cyber-orange font-bold text-[8.5px]">MONITOR</span>
        </div>

        <div className="flex flex-col gap-1.5 font-mono text-[8.5px]">
          {/* Diagnostic Warnings Alerts List */}
          <div className="flex items-center gap-2 p-2 bg-[#2d0909]/20 border border-cyber-red/20 text-cyber-red rounded-lg">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 animate-pulse text-cyber-red" />
            <div className="flex-1 text-[8.5px] leading-snug">
              {roverMode === 'E-STOP' ? (
                <span className="font-bold uppercase tracking-wider">CRITICAL: emergency stop disarmed system motors.</span>
              ) : (
                <span>WARNING: Rover operating in Restricted Survey parameters.</span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-[7.5px] text-slate-500 font-bold border-t border-space-850/60 pt-2 px-0.5">
            <span>IMU: CALIBRATED</span>
            <span>THERMAL: NOMINAL</span>
          </div>
        </div>
      </div>

    </div>
  );
}
