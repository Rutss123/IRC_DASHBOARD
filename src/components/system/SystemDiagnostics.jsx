import React, { useState, useEffect } from 'react';
import { useRover } from '../../context/RoverContext';
import StatusLed from '../common/StatusLed';

export default function SystemDiagnostics() {
  const { telemetry, primaryComms, secondaryComms } = useRover();
  const { network } = telemetry;

  // Rolling DBm signal history
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
    return 'text-cyber-amber font-black';
  };

  const getLossColor = (pct) => {
    if (pct >= 2.0) return 'text-cyber-red font-bold';
    if (pct >= 0.5) return 'text-cyber-orange';
    return 'text-cyber-amber font-black';
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
      const y = height - (ratio * (height - 6)) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  };

  const svgWidth = 200;
  const svgHeight = 32;
  const points = getSvgPoints(signalHistory, svgWidth, svgHeight);

  return (
    <div className="hud-panel p-3.5 border-space-800 bg-[#0b0f19]/30 relative overflow-hidden font-mono select-none">
      
      {/* 1. SECTION HEADER */}
      <div className="flex justify-between items-center text-[10px] text-cyber-amber/60 uppercase tracking-widest border-b border-space-800/60 pb-2 mb-3">
        <span>[01_COMMUNICATIONS]</span>
        <div className="flex items-center gap-1.5 text-[8.5px] text-cyber-amber font-bold">
          <StatusLed status={primaryComms} pulse={primaryComms === 'online'} className="w-1.5 h-1.5" />
          <span>SECURE</span>
        </div>
      </div>

      {/* Comms Link Toggles */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-[8.5px]">
        <div className="flex justify-between items-center bg-[#060608]/80 px-2 py-1.5 border border-space-850 rounded">
          <span className="text-slate-300 font-bold tracking-tight text-[8px]">PRI_COMMS</span>
          <span className="text-cyber-amber text-[7.5px] font-bold">▲</span>
        </div>
        <div className="flex justify-between items-center bg-[#060608]/80 px-2 py-1.5 border border-space-850 rounded text-slate-500">
          <span className="text-[8px] tracking-tight font-bold">SEC_COMMS</span>
          <span className="text-[7.5px]">○</span>
        </div>
      </div>

      {/* Link parameter cards (OVERHAULED TYPOGRAPHY) */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-right">
        
        {/* Latency */}
        <div className="p-2 bg-[#060608]/80 border border-space-850 rounded-lg flex flex-col justify-center">
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider text-left mb-0.5">LATENCY</span>
          <span className={`text-sm ${getLatencyColor(network.latency)}`}>{network.latency} <span className="text-[8px] font-normal text-slate-500">ms</span></span>
        </div>

        {/* Packet Loss */}
        <div className="p-2 bg-[#060608]/80 border border-space-850 rounded-lg flex flex-col justify-center">
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider text-left mb-0.5">LOSS RATE</span>
          <span className={`text-sm ${getLossColor(network.packetLoss)}`}>{network.packetLoss} <span className="text-[8px] font-normal text-slate-500">%</span></span>
        </div>

        {/* Signal Strength */}
        <div className="p-2 bg-[#060608]/80 border border-space-850 rounded-lg flex flex-col justify-center">
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider text-left mb-0.5">SIGNAL</span>
          <span className="text-sm text-cyber-amber font-black">{currentDbm} <span className="text-[8px] font-normal text-slate-500">dBm</span></span>
        </div>

        {/* Frequency */}
        <div className="p-2 bg-[#060608]/80 border border-space-850 rounded-lg flex flex-col justify-center">
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider text-left mb-0.5">FREQUENCY</span>
          <span className="text-sm text-cyber-amber font-black">5.8 <span className="text-[8px] font-normal text-slate-500">GHz</span></span>
        </div>

      </div>

      {/* Mini Signal History graph line */}
      <div className="relative w-full h-[32px] bg-space-950/75 border border-space-850 rounded-md overflow-hidden shrink-0">
        <svg className="w-full h-full" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
          <polyline fill="none" stroke="#D74E0B" strokeWidth="1.8" opacity="0.12" points={points} />
          <polyline fill="none" stroke="#D74E0B" strokeWidth="0.8" points={points} />
        </svg>
      </div>

    </div>
  );
}
