import React from 'react';
import { useRover } from '../../context/RoverContext';
import StatusLed from '../common/StatusLed';
import { Thermometer, Droplet, Wind, Flame, Globe, Leaf, Beaker } from 'lucide-react';

export default function SciencePanel() {
  const { telemetry = {} } = useRover();
  const sensors = telemetry.science || {
    temp: 28.2,
    humidity: 54,
    pressure: 1008,
    co: 24,
    ch4: 11,
    airQuality: 'SAFE',
    soilN: 42,
    soilP: 18,
    soilK: 35,
    soilPh: 6.8,
    soilMoisture: 48
  };



  const getAqColor = (aq) => {
    if (aq === 'CRITICAL') return 'text-cyber-red font-bold animate-pulse';
    if (aq === 'WARNING') return 'text-cyber-orange font-bold';
    return 'text-cyber-green font-bold';
  };

  return (
    <div className="w-full bg-[#0b0f19]/30 border border-space-800 rounded-xl p-4 flex flex-col gap-4 select-none relative overflow-hidden font-mono select-none">
      
      {/* Mesh grid pattern background */}
      <div className="absolute inset-0 grid-overlay opacity-[0.02] pointer-events-none" />

      {/* Header details */}
      <div className="flex justify-between items-center text-[10px] text-cyber-cyan/50 uppercase tracking-widest border-b border-space-800/60 pb-2 shrink-0">
        <span className="flex items-center gap-2">
          <Beaker className="w-4 h-4 text-cyber-cyan animate-pulse" />
          [07_SCIENCE_ENVIRONMENTAL_INGEST]
        </span>
        <span className="text-cyber-orange text-[8.5px] font-bold tracking-widest bg-cyber-orange/5 px-2.5 py-0.5 border border-cyber-orange/15 rounded">
          SENSORS: ACTIVE
        </span>
      </div>

      {/* Spacious side-by-side modular grid (OVERHAULED TYPOGRAPHY) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Subsection 1: Atmospheric conditions */}
        <div className="bg-space-950/65 border border-space-850 p-3.5 rounded-lg flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-space-800/60 pb-1.5">
            <Globe className="w-4 h-4 text-cyber-orange" />
            <span className="text-[9.5px] text-slate-350 font-bold uppercase tracking-wider">01 // Atmospheric (BME280)</span>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center bg-[#060608]/85 p-2.5 border border-space-850 rounded-lg">
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-cyber-orange" />
                <span className="text-slate-500 uppercase font-bold text-[9px] tracking-wider">TEMPERATURE</span>
              </div>
              <span className="text-sm font-black text-slate-200">{sensors.temp} <span className="text-[8px] font-normal text-slate-500">°C</span></span>
            </div>

            <div className="flex justify-between items-center bg-[#060608]/85 p-2.5 border border-space-850 rounded-lg">
              <div className="flex items-center gap-2">
                <Droplet className="w-4 h-4 text-cyber-cyan" />
                <span className="text-slate-500 uppercase font-bold text-[9px] tracking-wider">HUMIDITY</span>
              </div>
              <span className="text-sm font-black text-cyber-cyan">{sensors.humidity} <span className="text-[8px] font-normal text-slate-500">%</span></span>
            </div>

            <div className="flex justify-between items-center bg-[#060608]/85 p-2.5 border border-space-850 rounded-lg">
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-cyber-green" />
                <span className="text-slate-500 uppercase font-bold text-[9px] tracking-wider">PRESSURE</span>
              </div>
              <span className="text-sm font-black text-cyber-green">{sensors.pressure} <span className="text-[8px] font-normal text-slate-500">hPa</span></span>
            </div>
          </div>
        </div>

        {/* Subsection 2: MQ Gas Analysis */}
        <div className="bg-space-950/65 border border-space-850 p-3.5 rounded-lg flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-space-800/60 pb-1.5">
            <Flame className="w-4 h-4 text-cyber-cyan" />
            <span className="text-[9.5px] text-slate-350 font-bold uppercase tracking-wider">02 // Gas Concentration</span>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center bg-[#060608]/85 p-2.5 border border-space-850 rounded-lg">
              <span className="text-slate-500 uppercase font-bold text-[9px] tracking-wider">CO MONOXIDE</span>
              <span className="text-sm font-black text-slate-200">{sensors.co} <span className="text-[8px] font-normal text-slate-500">ppm</span></span>
            </div>

            <div className="flex justify-between items-center bg-[#060608]/85 p-2.5 border border-space-850 rounded-lg">
              <span className="text-slate-500 uppercase font-bold text-[9px] tracking-wider">CH4 METHANE</span>
              <span className="text-sm font-black text-slate-200">{sensors.ch4} <span className="text-[8px] font-normal text-slate-500">ppm</span></span>
            </div>

            <div className="flex justify-between items-center bg-[#060608]/85 p-2.5 border border-space-850 rounded-lg">
              <span className="text-slate-500 uppercase font-bold text-[9px] tracking-wider">AIR QUALITY STATUS</span>
              <div className="flex items-center gap-1.5">
                <StatusLed 
                  status={sensors.airQuality === 'SAFE' ? 'online' : (sensors.airQuality === 'WARNING' ? 'warning' : 'critical')} 
                  pulse={sensors.airQuality !== 'SAFE'} 
                  className="w-1.5 h-1.5" 
                />
                <span className={`text-[10.5px] uppercase ${getAqColor(sensors.airQuality)}`}>{sensors.airQuality}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Subsection 3: Soil Chemistry analysis */}
        <div className="bg-space-950/65 border border-space-850 p-3.5 rounded-lg flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-space-800/60 pb-1.5">
            <Leaf className="w-4 h-4 text-cyber-green" />
            <span className="text-[9.5px] text-slate-350 font-bold uppercase tracking-wider">03 // Soil Chemistry</span>
          </div>

          <div className="flex flex-col gap-2">
            {/* NPK parameters */}
            <div className="grid grid-cols-3 gap-2 text-[8px] text-center mb-0.5">
              <div className="p-1.5 bg-[#060608]/85 border border-space-850 rounded-lg">
                <div className="text-[7.5px] text-slate-500 uppercase font-bold">NITROGEN (N)</div>
                <span className="text-xs font-black text-slate-200">{sensors.soilN} <span className="text-[7px] font-normal text-slate-500">mg</span></span>
              </div>
              <div className="p-1.5 bg-[#060608]/85 border border-space-850 rounded-lg">
                <div className="text-[7.5px] text-slate-500 uppercase font-bold">PHOSPHORUS (P)</div>
                <span className="text-xs font-black text-slate-200">{sensors.soilP} <span className="text-[7px] font-normal text-slate-500">mg</span></span>
              </div>
              <div className="p-1.5 bg-[#060608]/85 border border-space-850 rounded-lg">
                <div className="text-[7.5px] text-slate-500 uppercase font-bold">POTASSIUM (K)</div>
                <span className="text-xs font-black text-slate-200">{sensors.soilK} <span className="text-[7px] font-normal text-slate-500">mg</span></span>
              </div>
            </div>

            <div className="flex justify-between items-center bg-[#060608]/85 p-2.5 border border-space-850 rounded-lg">
              <span className="text-slate-500 uppercase font-bold text-[9px] tracking-wider">SOIL pH MATRIX</span>
              <span className="text-sm font-black text-cyber-green">{sensors.soilPh} <span className="text-[8px] font-normal text-slate-500">pH</span></span>
            </div>

            <div className="flex justify-between items-center bg-[#060608]/85 p-2.5 border border-space-850 rounded-lg">
              <span className="text-slate-500 uppercase font-bold text-[9px] tracking-wider">MOISTURE CONTENT</span>
              <span className="text-sm font-black text-cyber-cyan">{sensors.soilMoisture} <span className="text-[8px] font-normal text-slate-500">%</span></span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
