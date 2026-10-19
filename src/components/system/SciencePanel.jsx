import React from 'react';
import { useRover } from '../../context/RoverContext';
import BentoCard from '../common/BentoCard';
import StatusLed from '../common/StatusLed';
import { Thermometer, Droplet, Wind, Flame, Globe, Leaf } from 'lucide-react';

export default function SciencePanel({ onResizePreset }) {
  const { telemetry = {} } = useRover();
  const sensors = telemetry.science || {
    temp: 0,
    humidity: 0,
    pressure: 0,
    co: 0,
    ch4: 0,
    airQuality: 'SAFE',
    soilN: 0,
    soilP: 0,
    soilK: 0,
    soilPh: 7.0,
    soilMoisture: 0
  };

  const getAqColor = (aq) => {
    if (aq === 'CRITICAL') return 'text-rose-400 font-bold animate-pulse';
    if (aq === 'WARNING') return 'text-amber-400 font-bold';
    return 'text-emerald-400 font-bold';
  };

  const aqBadge = sensors.airQuality || 'SAFE';
  const aqColor = aqBadge === 'SAFE' ? 'green' : aqBadge === 'WARNING' ? 'amber' : 'red';

  return (
    <BentoCard
      title="Environmental & Laboratory Sensors"
      subtitle="[05_SCIENCE]"
      badge={`AIR: ${aqBadge}`}
      badgeColor={aqColor}
      isStale={telemetry.is_stale}
      className="h-full"
      onResizePreset={onResizePreset}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 h-full overflow-y-auto pr-0.5">
        {/* Subsection 1: Atmospheric */}
        <div className="bg-[#060810]/80 border border-slate-800/80 p-2.5 rounded-lg flex flex-col justify-between gap-2">
          <div className="flex items-center gap-1.5 border-b border-slate-850 pb-1 text-[8.5px] font-bold text-slate-300">
            <Globe className="w-3.5 h-3.5 text-amber-500" />
            <span>ATMOSPHERIC (BME280)</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center bg-slate-900/60 p-1.5 rounded border border-slate-850 text-[8.5px]">
              <span className="text-slate-500 font-bold flex items-center gap-1">
                <Thermometer className="w-3 h-3 text-amber-500" /> TEMP
              </span>
              <span className="font-black text-slate-200">{Number(sensors.temp || 0).toFixed(1)} °C</span>
            </div>
            <div className="flex justify-between items-center bg-slate-900/60 p-1.5 rounded border border-slate-850 text-[8.5px]">
              <span className="text-slate-500 font-bold flex items-center gap-1">
                <Droplet className="w-3 h-3 text-cyan-400" /> HUMIDITY
              </span>
              <span className="font-black text-cyan-400">{sensors.humidity ?? 0} %</span>
            </div>
            <div className="flex justify-between items-center bg-slate-900/60 p-1.5 rounded border border-slate-850 text-[8.5px]">
              <span className="text-slate-500 font-bold flex items-center gap-1">
                <Wind className="w-3 h-3 text-emerald-400" /> PRESSURE
              </span>
              <span className="font-black text-emerald-400">{sensors.pressure ?? 0} hPa</span>
            </div>
          </div>
        </div>

        {/* Subsection 2: Gas MQ */}
        <div className="bg-[#060810]/80 border border-slate-800/80 p-2.5 rounded-lg flex flex-col justify-between gap-2">
          <div className="flex items-center gap-1.5 border-b border-slate-850 pb-1 text-[8.5px] font-bold text-slate-300">
            <Flame className="w-3.5 h-3.5 text-cyan-400" />
            <span>GAS CONCENTRATION (MQ)</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center bg-slate-900/60 p-1.5 rounded border border-slate-850 text-[8.5px]">
              <span className="text-slate-500 font-bold">CO MONOXIDE</span>
              <span className="font-black text-slate-200">{sensors.co ?? 0} ppm</span>
            </div>
            <div className="flex justify-between items-center bg-slate-900/60 p-1.5 rounded border border-slate-850 text-[8.5px]">
              <span className="text-slate-500 font-bold">CH4 METHANE</span>
              <span className="font-black text-slate-200">{sensors.ch4 ?? 0} ppm</span>
            </div>
            <div className="flex justify-between items-center bg-slate-900/60 p-1.5 rounded border border-slate-850 text-[8.5px]">
              <span className="text-slate-500 font-bold">AIR QUALITY</span>
              <span className={getAqColor(sensors.airQuality)}>{sensors.airQuality || 'SAFE'}</span>
            </div>
          </div>
        </div>

        {/* Subsection 3: Soil Chemistry */}
        <div className="bg-[#060810]/80 border border-slate-800/80 p-2.5 rounded-lg flex flex-col justify-between gap-2">
          <div className="flex items-center gap-1.5 border-b border-slate-850 pb-1 text-[8.5px] font-bold text-slate-300">
            <Leaf className="w-3.5 h-3.5 text-emerald-400" />
            <span>SOIL CHEMISTRY</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="grid grid-cols-3 gap-1 text-[7.5px] text-center">
              <div className="p-1 bg-slate-900/60 border border-slate-850 rounded">
                <div className="text-slate-500 font-bold">N</div>
                <span className="font-black text-slate-200">{sensors.soilN ?? 0}</span>
              </div>
              <div className="p-1 bg-slate-900/60 border border-slate-850 rounded">
                <div className="text-slate-500 font-bold">P</div>
                <span className="font-black text-slate-200">{sensors.soilP ?? 0}</span>
              </div>
              <div className="p-1 bg-slate-900/60 border border-slate-850 rounded">
                <div className="text-slate-500 font-bold">K</div>
                <span className="font-black text-slate-200">{sensors.soilK ?? 0}</span>
              </div>
            </div>
            <div className="flex justify-between items-center bg-slate-900/60 p-1.5 rounded border border-slate-850 text-[8.5px]">
              <span className="text-slate-500 font-bold">SOIL pH</span>
              <span className="font-black text-emerald-400">{Number(sensors.soilPh || 7.0).toFixed(1)} pH</span>
            </div>
            <div className="flex justify-between items-center bg-slate-900/60 p-1.5 rounded border border-slate-850 text-[8.5px]">
              <span className="text-slate-500 font-bold">MOISTURE</span>
              <span className="font-black text-cyan-400">{sensors.soilMoisture ?? 0} %</span>
            </div>
          </div>
        </div>
      </div>
    </BentoCard>
  );
}
