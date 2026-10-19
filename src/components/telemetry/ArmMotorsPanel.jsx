import React from 'react';
import { useRover } from '../../context/RoverContext';
import BentoCard from '../common/BentoCard';
import StatusLed from '../common/StatusLed';

const DEFAULT_JOINTS = [
  { name: 'J1_BASE_YAW', angle: 0, rpm: 0, direction: 'IDLE', encoder: 'OK_SYNC' },
  { name: 'J2_SHLDR_PITCH', angle: 0, rpm: 0, direction: 'IDLE', encoder: 'OK_SYNC' },
  { name: 'J3_ELBOW_PITCH', angle: 0, rpm: 0, direction: 'IDLE', encoder: 'OK_SYNC' },
  { name: 'J4_WRIST_PITCH', angle: 0, rpm: 0, direction: 'IDLE', encoder: 'OK_SYNC' },
  { name: 'J5_WRIST_ROLL', angle: 0, rpm: 0, direction: 'IDLE', encoder: 'OK_SYNC' },
  { name: 'J6_GRIPPER', angle: 0, rpm: 0, direction: 'IDLE', encoder: 'N/A' }
];

export default function ArmMotorsPanel({ onResizePreset }) {
  const { roverMode, telemetry = {} } = useRover();
  const joints =
    telemetry.armMotors && telemetry.armMotors.length > 0
      ? telemetry.armMotors
      : DEFAULT_JOINTS;

  const isArmMode = roverMode === 'ARM';

  return (
    <BentoCard
      title="Manipulator Arm"
      subtitle="[04_ARM]"
      badge={isArmMode ? 'ARM ACTIVE' : 'STANDBY'}
      badgeColor={isArmMode ? 'cyan' : 'slate'}
      isStale={telemetry.is_stale}
      className="h-full"
      onResizePreset={onResizePreset}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-[8px] h-full overflow-y-auto pr-0.5">
        {joints.map((joint) => {
          const angle = Number(joint.angle ?? 0);
          const rpm = joint.rpm ?? 0;
          const dir = joint.direction || 'IDLE';

          return (
            <div
              key={joint.name}
              className="bg-[#060810]/90 border border-slate-800/80 rounded p-1.5 flex flex-col justify-between gap-1 shrink-0"
            >
              <div className="flex items-center justify-between border-b border-slate-850 pb-1">
                <span className="font-bold text-slate-300 truncate text-[7.5px]">{joint.name}</span>
                <StatusLed
                  status={dir !== 'IDLE' ? 'active' : 'online'}
                  pulse={dir !== 'IDLE'}
                  className="w-1.5 h-1.5 shrink-0"
                />
              </div>

              <div className="flex justify-between items-baseline text-slate-500 text-[8px]">
                <span>ANGLE:</span>
                <span className="text-xs font-black text-cyan-400">
                  {angle > 0 ? '+' : ''}
                  {angle.toFixed(1)}°
                </span>
              </div>

              <div className="flex justify-between items-baseline text-slate-500 text-[8px]">
                <span>SPEED:</span>
                <span className="text-xs font-black text-slate-200">{rpm} RPM</span>
              </div>

              <div className="flex justify-between items-center pt-0.5 border-t border-slate-900 text-[7px]">
                <span
                  className={`font-black ${
                    dir === 'POS' ? 'text-emerald-400' : dir === 'NEG' ? 'text-amber-500' : 'text-slate-500'
                  }`}
                >
                  DIR: {dir}
                </span>
                <span className="text-slate-500">{joint.encoder || 'SYNC'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </BentoCard>
  );
}
