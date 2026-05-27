import React from 'react';
import { useRover } from '../../context/RoverContext';
import StatusLed from '../common/StatusLed';

export default function DriveMotorsPanel() {
  const { telemetry = {} } = useRover();
  const speed = telemetry.speed ?? 0;
  const driveMotors = telemetry.driveMotors || [];


  return (
    <div className="hud-panel p-3.5 border-space-800 bg-[#0b0f19]/30 relative overflow-hidden font-mono select-none flex flex-col gap-2.5">
      
      {/* Mesh grid */}
      <div className="absolute inset-0 grid-overlay opacity-[0.02] pointer-events-none" />

      {/* HEADER */}
      <div className="flex justify-between items-center text-[10px] text-cyber-cyan/50 uppercase tracking-widest border-b border-space-800/60 pb-2 shrink-0">
        <span>[06_DRIVE_MOTOR_DIAGS]</span>
        <span className="text-cyber-green text-[8.5px] font-bold tracking-wider">DRIVETRAIN_OK</span>
      </div>

      {/* 3x2 Grid of Motor Cards (100% telemetry driven) */}
      <div className="grid grid-cols-2 gap-2 text-[8.5px]">
        
        {driveMotors && driveMotors.map((motor) => {
          const rpm = motor.rpm;
          const pwm = motor.pwm;
          const pos = motor.angle;
          
          return (
            <div key={motor.id} className="bg-[#060608]/85 border border-space-850 rounded-lg p-2.5 flex flex-col gap-1.5">
              {/* Card header */}
              <div className="flex justify-between items-center border-b border-space-900 pb-1 text-[8px] font-bold text-slate-400">
                <span>{motor.name}</span>
                <div className="flex items-center gap-1">
                  <StatusLed status={motor.status} pulse={speed > 0} className="w-1.5 h-1.5" />
                  <span className="text-cyber-green text-[7px] font-semibold">{motor.id}</span>
                </div>
              </div>

              {/* Parameters stack */}
              <div className="flex flex-col gap-1 text-[8px] text-slate-500">
                <div className="flex justify-between items-baseline">
                  <span className="text-[8.5px] font-bold uppercase tracking-wider">VELOCITY:</span>
                  <span className="text-xs font-black text-slate-200">{rpm} <span className="text-[7.5px] font-normal text-slate-500">RPM</span></span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-[8.5px] font-bold uppercase tracking-wider">ANGLE:</span>
                  <span className="text-xs font-black text-cyber-cyan">{pos}°</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-[8.5px] font-bold uppercase tracking-wider">PWM DUTY:</span>
                  <span className="text-xs font-black text-cyber-orange">{pwm}</span>
                </div>
                <div className="flex justify-between border-t border-space-900/50 pt-1 mt-0.5 text-[7px] font-bold">
                  <span>ENCODER:</span>
                  <span className="text-cyber-green uppercase">SYNCED</span>
                </div>
              </div>
            </div>
          );
        })}

      </div>

    </div>
  );
}

