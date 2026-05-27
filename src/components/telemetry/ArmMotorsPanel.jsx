import React from 'react';
import { useRover } from '../../context/RoverContext';
import StatusLed from '../common/StatusLed';

export default function ArmMotorsPanel() {
  const { roverMode, telemetry = {} } = useRover();
  const joints = telemetry.armMotors || [];



  return (
    <div className="hud-panel p-3.5 border-space-800 bg-[#0b0f19]/30 relative overflow-hidden font-mono select-none flex flex-col gap-2.5">
      
      {/* Mesh grid */}
      <div className="absolute inset-0 grid-overlay opacity-[0.02] pointer-events-none" />

      {/* HEADER */}
      <div className="flex justify-between items-center text-[10px] text-cyber-cyan/50 uppercase tracking-widest border-b border-space-800/60 pb-2 shrink-0">
        <span>[07_ROBOTIC_ARM_TELEM]</span>
        <span className={`text-[8.5px] font-bold ${roverMode === 'ARM' ? 'text-cyber-cyan animate-pulse' : 'text-slate-500'}`}>
          {roverMode === 'ARM' ? 'PRECISION_LOCK' : 'STANDBY'}
        </span>
      </div>

      {/* Stacked Joints List (OVERHAULED TYPOGRAPHY) */}
      <div className="flex flex-col gap-2 text-[8.5px]">
        {joints.map((joint) => {
          return (
            <div key={joint.name} className="bg-[#060608]/85 border border-space-850 rounded p-2 flex items-center justify-between gap-3">
              {/* Joint name and indicator */}
              <div className="flex items-center gap-2 shrink-0 w-24">
                <StatusLed status={joint.direction !== 'IDLE' ? 'active' : 'online'} pulse={joint.direction !== 'IDLE'} className="w-1 h-1" />
                <span className="font-bold text-slate-350 tracking-tight text-[8px]">{joint.name}</span>
              </div>

              {/* Angle & velocity indicators */}
              <div className="flex-1 flex justify-around items-center text-[8px] text-slate-500 gap-2">
                <div>
                  ANGLE: <span className="text-xs font-black text-cyber-cyan">{joint.angle > 0 ? '+' : ''}{joint.angle}°</span>
                </div>
                <div>
                  RPM: <span className="text-xs font-black text-slate-200">{joint.rpm}</span>
                </div>
                <div>
                  DIR: <span className={`text-[8px] font-black ${joint.direction === 'POS' ? 'text-cyber-green' : joint.direction === 'NEG' ? 'text-cyber-orange' : 'text-slate-500'}`}>
                    {joint.direction}
                  </span>
                </div>
              </div>

              {/* Encoder Status Badge */}
              <span className={`text-[7px] font-bold border px-1 rounded-sm uppercase tracking-wide shrink-0 ${
                joint.encoder === 'OK_SYNC' ? 'text-cyber-green border-cyber-green/20' : 'text-slate-500 border-space-800'
              }`}>
                {joint.encoder}
              </span>
            </div>
          );
        })}
      </div>

    </div>
  );
}
