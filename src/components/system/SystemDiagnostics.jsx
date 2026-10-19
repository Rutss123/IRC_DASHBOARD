import React from 'react';
import { useRover } from '../../context/RoverContext';
import BentoCard from '../common/BentoCard';
import { Wifi, Activity } from 'lucide-react';

export default function SystemDiagnostics({ onResizePreset }) {
  const { telemetry, connectionStatus } = useRover();
  const network = telemetry.network || { latency: 0, jitter: 0, packetLoss: 0, frequency: 50 };
  const measuredHz = telemetry.telemetry_hz ?? 0;
  const isStale = telemetry.is_stale ?? true;

  const isConnected = connectionStatus === 'connected';
  const badgeText = !isConnected ? 'DISCONNECTED' : isStale ? 'STALE' : `${measuredHz.toFixed(1)} HZ`;
  const badgeColor = !isConnected ? 'red' : isStale ? 'amber' : 'green';

  return (
    <BentoCard
      title="Link & Telemetry Rates"
      subtitle="[06_COMMS]"
      badge={badgeText}
      badgeColor={badgeColor}
      isStale={isStale && isConnected}
      onResizePreset={onResizePreset}
    >
      <div className="flex flex-col justify-between gap-3 h-full">
        {/* Core Link Metrics in 2x2 Grid with Bold Typography */}
        <div className="grid grid-cols-2 gap-2.5 text-right flex-1">
          <div className="p-2.5 bg-[#050814]/80 border border-slate-800 rounded-xl flex flex-col justify-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-left mb-0.5">
              TELEMETRY RATE
            </span>
            <div className="flex items-baseline justify-end gap-1">
              <span className="text-2xl font-black text-cyan-400">{measuredHz.toFixed(1)}</span>
              <span className="text-xs font-bold text-slate-400">Hz</span>
            </div>
          </div>

          <div className="p-2.5 bg-[#050814]/80 border border-slate-800 rounded-xl flex flex-col justify-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-left mb-0.5">
              LINK LATENCY
            </span>
            <div className="flex items-baseline justify-end gap-1">
              <span className="text-2xl font-black text-slate-100">{network.latency ?? 0}</span>
              <span className="text-xs font-bold text-slate-400">ms</span>
            </div>
          </div>

          <div className="p-2.5 bg-[#050814]/80 border border-slate-800 rounded-xl flex flex-col justify-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-left mb-0.5">
              PACKET LOSS
            </span>
            <div className="flex items-baseline justify-end gap-1">
              <span className="text-xl font-black text-amber-400">
                {Number(network.packetLoss ?? 0).toFixed(2)}
              </span>
              <span className="text-xs font-bold text-slate-400">%</span>
            </div>
          </div>

          <div className="p-2.5 bg-[#050814]/80 border border-slate-800 rounded-xl flex flex-col justify-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-left mb-0.5">
              BATTERY LEVEL
            </span>
            <div className="flex items-baseline justify-end gap-1">
              <span className="text-2xl font-black text-emerald-400">
                {Number(telemetry.battery?.percentage ?? 0).toFixed(1)}
              </span>
              <span className="text-xs font-bold text-slate-400">%</span>
            </div>
          </div>
        </div>

        {/* Status Strip Footer */}
        <div className="flex items-center justify-between text-[8.5px] text-slate-400 font-bold border-t border-slate-850 pt-2 px-1">
          <span className="flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 text-cyan-400" />
            DOWNLINK: {isConnected ? 'SYNCHRONIZED' : 'OFFLINE'}
          </span>
          <span className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            WATCHDOG: {isStale ? 'ALERT' : 'NOMINAL'}
          </span>
        </div>
      </div>
    </BentoCard>
  );
}
