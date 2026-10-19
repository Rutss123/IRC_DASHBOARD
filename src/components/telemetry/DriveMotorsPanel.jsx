import React from 'react';
import { useRover } from '../../context/RoverContext';
import BentoCard from '../common/BentoCard';
import StatusLed from '../common/StatusLed';

const DEFAULT_MOTORS = [
  { id: 'FL_DRIVE', name: 'FRONT LEFT', rpm: 0, angle: 0, pwm: 0, status: 'offline' },
  { id: 'FR_DRIVE', name: 'FRONT RIGHT', rpm: 0, angle: 0, pwm: 0, status: 'offline' },
  { id: 'ML_DRIVE', name: 'MID LEFT', rpm: 0, angle: 0, pwm: 0, status: 'offline' },
  { id: 'MR_DRIVE', name: 'MID RIGHT', rpm: 0, angle: 0, pwm: 0, status: 'offline' },
  { id: 'RL_DRIVE', name: 'REAR LEFT', rpm: 0, angle: 0, pwm: 0, status: 'offline' },
  { id: 'RR_DRIVE', name: 'REAR RIGHT', rpm: 0, angle: 0, pwm: 0, status: 'offline' }
];

export default function DriveMotorsPanel({ onResizePreset }) {
  const { telemetry = {} } = useRover();
  const speed = telemetry.speed ?? 0;
  const driveMotors =
    telemetry.driveMotors && telemetry.driveMotors.length > 0
      ? telemetry.driveMotors
      : DEFAULT_MOTORS;

  const onlineCount = driveMotors.filter((m) => m.status === 'online').length;
  const badgeColor = onlineCount === 6 ? 'green' : onlineCount > 0 ? 'amber' : 'slate';

  // Group into physical Left (Port) and Right (Starboard) rover chassis columns
  const leftMotors = driveMotors.filter((m) => m.id.includes('L_') || m.name.includes('LEFT'));
  const rightMotors = driveMotors.filter((m) => m.id.includes('R_') || m.name.includes('RIGHT'));

  const renderMotorCard = (motor) => {
    const rpm = motor.rpm ?? 0;
    const pwm = motor.pwm ?? 0;
    const angle = motor.angle ?? 0;
    const pwmPercent = Math.min(100, Math.max(0, (pwm / 255) * 100));

    return (
      <div
        key={motor.id}
        className="bg-[#050814]/90 border border-slate-800/90 rounded-xl p-1.5 px-2.5 flex flex-col justify-center gap-1 text-xs shrink-0"
      >
        {/* Top: Motor name + LED + RPM */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5 min-w-0">
            <StatusLed status={motor.status || 'offline'} pulse={speed > 0} className="w-1.5 h-1.5 shrink-0" />
            <span className="font-black text-slate-200 text-[10px] md:text-xs truncate uppercase tracking-wider">
              {motor.name}
            </span>
          </div>
          <div className="flex items-baseline gap-1 shrink-0">
            <span className="text-xs md:text-sm font-black text-slate-100">{rpm}</span>
            <span className="text-[8px] text-slate-400 font-bold uppercase">RPM</span>
          </div>
        </div>

        {/* Bottom: Angle readout + Mini PWM Duty Bar */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-1 text-[9px] shrink-0 font-bold">
            <span className="text-slate-500">ANG:</span>
            <span className="font-black text-cyan-400">{angle}°</span>
          </div>
          <div className="flex-1 bg-slate-900 h-1 rounded-full overflow-hidden border border-slate-800/60 max-w-[80px]">
            <div
              className="bg-gradient-to-r from-cyan-500 to-amber-500 h-full rounded-full transition-all duration-200"
              style={{ width: `${pwmPercent}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <BentoCard
      title="Drivetrain (Chassis)"
      subtitle="[03_DRIVE]"
      badge={`${onlineCount}/6 ONLINE`}
      badgeColor={badgeColor}
      isStale={telemetry.is_stale}
      onResizePreset={onResizePreset}
    >
      {/* 2-Column Physical Chassis Layout: Left Wheels | Right Wheels */}
      <div className="grid grid-cols-2 gap-2 md:gap-3 w-full">
        {/* Left (Port) Side - 3 Motors */}
        <div className="flex flex-col gap-1.5">
          <div className="text-[8.5px] md:text-[9px] font-black text-cyan-400 tracking-wider uppercase border-b border-slate-800/80 pb-0.5 flex justify-between">
            <span>PORT (LEFT)</span>
            <span>3 MOTORS</span>
          </div>
          {leftMotors.map(renderMotorCard)}
        </div>

        {/* Right (Starboard) Side - 3 Motors */}
        <div className="flex flex-col gap-1.5">
          <div className="text-[8.5px] md:text-[9px] font-black text-amber-400 tracking-wider uppercase border-b border-slate-800/80 pb-0.5 flex justify-between">
            <span>STARBOARD (RIGHT)</span>
            <span>3 MOTORS</span>
          </div>
          {rightMotors.map(renderMotorCard)}
        </div>
      </div>
    </BentoCard>
  );
}
