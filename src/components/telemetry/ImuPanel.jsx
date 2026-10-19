import React from 'react';
import { useRover } from '../../context/RoverContext';
import BentoCard from '../common/BentoCard';

export default function ImuPanel({ onResizePreset }) {
  const { telemetry = {} } = useRover();
  const imu = telemetry.imu || { roll: 0, pitch: 0, yaw: 0, stability: 'SECURE' };

  const roll = Number(imu.roll || 0);
  const pitch = Number(imu.pitch || 0);
  const yaw = Number(imu.yaw || 0);

  const badgeColor = imu.stability === 'SECURE' ? 'green' : 'amber';

  return (
    <BentoCard
      title="Attitude & Gyro"
      subtitle="[01_IMU]"
      badge={imu.stability || 'SECURE'}
      badgeColor={badgeColor}
      isStale={telemetry.is_stale}
      onResizePreset={onResizePreset}
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 h-full">
        {/* Compact Artificial Horizon Vector Dial */}
        <div className="w-[78px] h-[78px] rounded-full border-2 border-slate-750 bg-[#05070e] flex items-center justify-center relative shrink-0 overflow-hidden shadow-inner">
          {/* Pitch markings inside */}
          <div
            className="w-full h-full absolute inset-0 flex flex-col justify-between p-1.5 text-[6px] text-cyan-400/50 pointer-events-none transition-transform duration-200"
            style={{ transform: `rotate(${-roll}deg) translateY(${pitch * 1.5}px)` }}
          >
            <div className="w-full text-center border-t border-dashed border-cyan-400/30">+20°</div>
            <div className="w-full text-center border-t border-solid border-cyan-400/60 flex justify-between px-1 font-bold">
              <span>-</span>
              <span>00°</span>
              <span>-</span>
            </div>
            <div className="w-full text-center border-b border-dashed border-cyan-400/30">-20°</div>
          </div>

          {/* Roll pointer indicator */}
          <svg className="w-full h-full absolute inset-0 pointer-events-none" viewBox="0 0 78 78">
            <g transform={`rotate(${-roll} 39 39)`}>
              <line x1="12" y1="39" x2="28" y2="39" stroke="#ea580c" strokeWidth="2" />
              <line x1="50" y1="39" x2="66" y2="39" stroke="#ea580c" strokeWidth="2" />
              <polygon points="39,12 35,18 43,18" fill="#06b6d4" />
            </g>
            <circle cx="39" cy="39" r="2" fill="#ea580c" />
          </svg>
        </div>

        {/* High-Visibility Legible Numerical Readings */}
        <div className="flex-1 grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-[#050814]/80 border border-slate-800 rounded-xl flex flex-col justify-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">ROLL</span>
            <span className="text-lg md:text-xl font-black text-slate-100">
              {roll > 0 ? '+' : ''}{roll.toFixed(1)}°
            </span>
          </div>
          <div className="p-2 bg-[#050814]/80 border border-slate-800 rounded-xl flex flex-col justify-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">PITCH</span>
            <span className="text-lg md:text-xl font-black text-slate-100">
              {pitch > 0 ? '+' : ''}{pitch.toFixed(1)}°
            </span>
          </div>
          <div className="p-2 bg-[#050814]/80 border border-slate-800 rounded-xl flex flex-col justify-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">YAW</span>
            <span className="text-lg md:text-xl font-black text-cyan-400">
              {yaw.toFixed(1)}°
            </span>
          </div>
        </div>
      </div>
    </BentoCard>
  );
}
