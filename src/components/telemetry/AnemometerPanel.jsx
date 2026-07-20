import React from 'react';
import { useRover } from '../../context/RoverContext';

export default function AnemometerPanel() {
  const { telemetry = {} } = useRover();
  const wind = telemetry.anemometer || { speed: 3.4, direction: 245, dirName: 'WSW', gust: 5.2, trend: 'STEADY' };


  return (
    <div className="hud-panel p-3.5 border-space-800 bg-[#0b0f19]/30 relative overflow-hidden font-mono select-none flex flex-col gap-2.5">
      
      {/* SECTION HEADER */}
      <div className="flex justify-between items-center text-[10px] text-cyber-amber/60 uppercase tracking-widest border-b border-space-800/60 pb-2 shrink-0">
        <span>[04_ANEMOMETER]</span>
        <span className={`text-[8.5px] font-bold ${wind.trend === 'STEADY' ? 'text-cyber-green' : 'text-cyber-orange animate-pulse'}`}>
          {wind.trend}
        </span>
      </div>

      <div className="flex items-center justify-between gap-4">
        
        {/* Wind vector circular compass dial */}
        <div className="w-[66px] h-[66px] rounded-full border border-space-800 bg-space-950 flex items-center justify-center relative shrink-0">
          {/* Compass cardinal markings */}
          <div className="absolute inset-0 flex flex-col justify-between items-center p-0.5 text-[5px] text-slate-600 font-black">
            <span>N</span>
            <span>S</span>
          </div>
          <div className="absolute inset-0 flex justify-between items-center p-0.5 text-[5px] text-slate-600 font-black">
            <span>W</span>
            <span>E</span>
          </div>

          {/* Wind direction vector arrow */}
          <svg 
            className="w-8 h-8 pointer-events-none transition-transform duration-500"
            viewBox="0 0 32 32"
            style={{ transform: `rotate(${wind.direction}deg)` }}
          >
            {/* Elegant vector wind pointer */}
            <path d="M16,2 L21,12 L17,10 L16,30 L15,10 L11,12 Z" fill="#06b6d4" opacity="0.85" />
            <polygon points="16,2 14,8 18,8" fill="#D74E0B" />
          </svg>
        </div>

        {/* Telemetry Metrics (OVERHAULED TYPOGRAPHY) */}
        <div className="flex-1 flex flex-col gap-1.5 text-right">
          <div className="flex justify-between items-baseline border-b border-space-850 pb-0.5">
            <span className="text-slate-500 uppercase font-bold text-[9px] tracking-wider text-left">WIND VELOCITY</span>
            <span className="text-sm font-black text-slate-200">{wind.speed.toFixed(1)} <span className="text-[8.5px] font-normal text-slate-500">m/s</span></span>
          </div>
          <div className="flex justify-between items-baseline border-b border-space-850 pb-0.5">
            <span className="text-slate-500 uppercase font-bold text-[9px] tracking-wider text-left">MAX GUSTS</span>
            <span className="text-sm font-black text-cyber-orange">{wind.gust.toFixed(1)} <span className="text-[8.5px] font-normal text-slate-500">m/s</span></span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-slate-500 uppercase font-bold text-[9px] tracking-wider text-left">WIND VECTOR</span>
            <span className="text-sm font-black text-cyber-cyan">{wind.direction}° <span className="text-[8.5px] font-normal text-slate-500">({wind.dirName})</span></span>
          </div>
        </div>

      </div>

      <div className="flex items-center justify-between text-[7.5px] text-slate-500 font-bold border-t border-space-850/60 pt-1.5 px-0.5">
        <span>SENSOR: ANEMO_4.1</span>
        <span>FLOW: STEADY</span>
      </div>

    </div>
  );
}
