import React, { useState, useEffect } from 'react';
import { useRover } from '../../context/RoverContext';
import StatusLed from '../common/StatusLed';

export default function ImuPanel() {
  const { telemetry = {} } = useRover();
  const imu = telemetry.imu || { roll: 0.8, pitch: -1.4, yaw: 182.0, stability: 'SECURE' };



  return (
    <div className="hud-panel p-3.5 border-space-800 bg-[#0b0f19]/30 relative overflow-hidden font-mono select-none flex flex-col gap-2.5">
      
      {/* HEADER */}
      <div className="flex justify-between items-center text-[10px] text-cyber-amber/60 uppercase tracking-widest border-b border-space-800/60 pb-2 shrink-0">
        <span>[03_IMU_ORIENTATION]</span>
        <span className={`text-[8.5px] font-bold ${imu.stability === 'SECURE' ? 'text-cyber-amber' : 'text-cyber-orange animate-pulse'}`}>
          {imu.stability}
        </span>
      </div>

      {/* Gyroscopic visual overlay & telemetry readings (OVERHAULED TYPOGRAPHY) */}
      <div className="flex items-center justify-between gap-4">
        
        {/* Aerospace Gyroscopic artificial horizon vector dial */}
        <div className="w-[66px] h-[66px] rounded-full border border-space-800 bg-space-950 flex items-center justify-center relative shrink-0 overflow-hidden">
          {/* Pitch markings inside */}
          <div 
            className="w-full h-full absolute inset-0 flex flex-col justify-between p-1 text-[5px] text-cyber-cyan/35 pointer-events-none transition-transform duration-300"
            style={{ transform: `rotate(${-imu.roll}deg) translateY(${imu.pitch * 1.5}px)` }}
          >
            <div className="w-full text-center border-t border-dashed border-cyber-cyan/15">+20°</div>
            <div className="w-full text-center border-t border-solid border-cyber-cyan/30 flex justify-between px-1">
              <span>-</span><span>00°</span><span>-</span>
            </div>
            <div className="w-full text-center border-b border-dashed border-cyber-cyan/15">-20°</div>
          </div>

          {/* Roll pointer indicator */}
          <svg className="w-full h-full absolute inset-0 pointer-events-none" viewBox="0 0 66 66">
            <g transform={`rotate(${-imu.roll} 33 33)`}>
              {/* Roll vector wings */}
              <line x1="12" y1="33" x2="24" y2="33" stroke="#D74E0B" strokeWidth="1" />
              <line x1="42" y1="33" x2="54" y2="33" stroke="#D74E0B" strokeWidth="1" />
              <polygon points="33,10 31,14 35,14" fill="#06b6d4" />
            </g>
            {/* Center reticle */}
            <circle cx="33" cy="33" r="1.5" fill="#D74E0B" />
          </svg>
        </div>

        {/* Textual Readings */}
        <div className="flex-1 flex flex-col gap-1.5 text-right">
          <div className="flex justify-between items-baseline border-b border-space-850 pb-0.5">
            <span className="text-slate-500 uppercase font-bold text-[9px] tracking-wider text-left">ROLL AXIS</span>
            <span className="text-sm font-black text-slate-100">{imu.roll > 0 ? '+' : ''}{imu.roll}°</span>
          </div>
          <div className="flex justify-between items-baseline border-b border-space-850 pb-0.5">
            <span className="text-slate-500 uppercase font-bold text-[9px] tracking-wider text-left">PITCH AXIS</span>
            <span className="text-sm font-black text-slate-100">{imu.pitch > 0 ? '+' : ''}{imu.pitch}°</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-slate-500 uppercase font-bold text-[9px] tracking-wider text-left">YAW HDG</span>
            <span className="text-sm font-black text-cyber-cyan">{imu.yaw.toFixed(1)}°</span>
          </div>
        </div>

      </div>

      <div className="flex items-center justify-between text-[7.5px] text-slate-500 font-bold border-t border-space-850/60 pt-1.5 px-0.5">
        <span>INERTIAL_LOCK: 3D_FIX</span>
        <span>GYRO_REF: 400Hz</span>
      </div>

    </div>
  );
}
