import React from 'react';
import { useRover } from '../../context/RoverContext';
import CompassWidget from './CompassWidget';
import { 
  Battery, 
  MapPin, 
  Wifi, 
  Flame, 
  Zap, 
  Cpu, 
  Orbit, 
  Gauge 
} from 'lucide-react';

export default function TelemetrySidebar() {
  const { telemetry, roverMode } = useRover();
  const { battery, gps, heading, speed, motorTemp, network } = telemetry;

  // Battery bar color mapping
  const getBatteryColor = (pct) => {
    if (pct < 20) return "bg-cyber-red shadow-glow-red/40";
    if (pct < 50) return "bg-cyber-amber shadow-glow-amber/40";
    return "bg-cyber-green shadow-glow-green/40";
  };

  // Signal strength color mapping
  const getSignalColor = (sq) => {
    if (sq < 40) return "text-cyber-red";
    if (sq < 75) return "text-cyber-amber";
    return "text-cyber-cyan";
  };

  return (
    <div className="flex flex-col gap-4 w-80 min-w-[20rem] h-full shrink-0 select-none overflow-y-auto pr-1">
      {/* 1. COMPASS ORIENTATION HUD */}
      <CompassWidget heading={heading} />

      {/* 2. PRIMARY PROPULSION / SPEED */}
      <div className="hud-panel hud-brackets p-3 border-space-800">
        <div className="flex justify-between items-center text-[10px] font-mono text-cyber-cyan/60 uppercase tracking-widest border-b border-space-800 pb-1.5 mb-3">
          <span>[03_PROPULSION]</span>
          <span className="text-cyber-amber font-bold">LIVE FEED</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-space-800 rounded border border-space-700">
              <Gauge className="w-5.5 h-5.5 text-cyber-cyan" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-mono">VELOCITY (M/S)</div>
              <div className="text-2xl font-black font-mono tracking-wider text-slate-100">
                {speed.toFixed(2)} <span className="text-xs font-normal text-slate-400">m/s</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-widest ${
              roverMode === 'E-STOP' ? 'bg-cyber-red/20 text-cyber-red border border-cyber-red/30' :
              roverMode === 'NAV' ? 'bg-cyber-green/20 text-cyber-green border border-cyber-green/30' :
              roverMode === 'SCIENCE' ? 'bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/30' :
              'bg-purple-950 text-purple-400 border border-purple-800/30'
            }`}>
              {roverMode}
            </span>
            <div className="text-[9px] text-slate-500 font-mono mt-1">STATUS ACTIVE</div>
          </div>
        </div>

        {/* Speed visualizer slider */}
        <div className="mt-3 bg-space-950 h-1.5 rounded-full overflow-hidden relative border border-space-800">
          <div 
            className="h-full bg-gradient-to-r from-cyber-cyan to-cyber-green transition-all duration-300"
            style={{ width: `${Math.min(100, (speed / 2.0) * 100)}%` }}
          />
        </div>
      </div>

      {/* 3. BATTERY CELL METRICS */}
      <div className="hud-panel p-3 border-space-800">
        <div className="flex justify-between items-center text-[10px] font-mono text-cyber-cyan/60 uppercase tracking-widest border-b border-space-800 pb-1.5 mb-3">
          <span>[04_ENERGY_GRID]</span>
          <span className="text-cyber-green">ONLINE</span>
        </div>
        
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-space-800 rounded border border-space-700">
              <Battery className="w-5.5 h-5.5 text-cyber-green" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-mono">BATTERY CELL</span>
              <div className="text-xl font-bold font-mono tracking-wide text-slate-100">
                {battery.percentage}%
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-x-3 text-[9px] font-mono text-right shrink-0">
            <div className="text-slate-400">VOLTS: <span className="text-slate-100 font-bold">{battery.voltage}V</span></div>
            <div className="text-slate-400">DRAW: <span className="text-cyber-amber font-bold">{battery.current}A</span></div>
            <div className="text-slate-400 col-span-2">CORE TEMP: <span className="text-slate-100 font-bold">{battery.temp}°C</span></div>
          </div>
        </div>

        {/* Battery visualizer grid */}
        <div className="mt-3 flex gap-0.5 bg-space-950 p-0.5 rounded border border-space-800">
          {Array.from({ length: 10 }).map((_, idx) => {
            const isActive = battery.percentage > idx * 10;
            return (
              <div 
                key={idx}
                className={`h-2.5 flex-1 rounded-sm transition-all duration-300 ${
                  isActive ? getBatteryColor(battery.percentage) : "bg-space-900"
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* 4. POSITION & GPS DOCK */}
      <div className="hud-panel p-3 border-space-800">
        <div className="flex justify-between items-center text-[10px] font-mono text-cyber-cyan/60 uppercase tracking-widest border-b border-space-800 pb-1.5 mb-3">
          <span>[05_GPS_TELEMETRY]</span>
          <span className="text-cyber-cyan font-semibold">{gps.lock}</span>
        </div>

        <div className="flex items-start gap-2.5">
          <div className="p-1.5 bg-space-800 rounded border border-space-700 shrink-0">
            <MapPin className="w-5.5 h-5.5 text-cyber-amber" />
          </div>
          <div className="flex-1 font-mono text-xs">
            <div className="flex justify-between border-b border-space-800/40 py-1">
              <span className="text-slate-400 text-[10px]">LATITUDE:</span>
              <span className="text-slate-200 font-bold tracking-wider">{gps.lat.toFixed(6)} N</span>
            </div>
            <div className="flex justify-between border-b border-space-800/40 py-1">
              <span className="text-slate-400 text-[10px]">LONGITUDE:</span>
              <span className="text-slate-200 font-bold tracking-wider">{gps.lng.toFixed(6)} E</span>
            </div>
            <div className="flex justify-between py-1 text-[10px]">
              <span className="text-slate-400">ALTITUDE:</span>
              <span className="text-slate-200">{gps.alt} m</span>
            </div>
          </div>
        </div>

        <div className="mt-2.5 p-1.5 bg-space-950 rounded border border-space-800 flex justify-between items-center text-[10px] font-mono">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Orbit className="w-3.5 h-3.5 text-cyber-cyan" />
            <span>SATELLITES IN VIEW:</span>
          </div>
          <span className="text-cyber-cyan font-bold">{gps.satellites}</span>
        </div>
      </div>

      {/* 5. MOTOR TEMPERATURE MATRIX */}
      <div className="hud-panel p-3 border-space-800">
        <div className="flex justify-between items-center text-[10px] font-mono text-cyber-cyan/60 uppercase tracking-widest border-b border-space-800 pb-1.5 mb-2.5">
          <span>[06_MOTOR_TEMPS]</span>
          <span className="text-cyber-amber">4 CHANNELS</span>
        </div>

        <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
          <div className="p-2 bg-space-950 border border-space-800/80 rounded flex flex-col gap-0.5">
            <span className="text-slate-500">FRONT L</span>
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-bold text-slate-200">{motorTemp.frontLeft}°C</span>
              <span className={`w-1.5 h-1.5 rounded-full ${motorTemp.frontLeft > 45 ? "bg-cyber-red" : "bg-cyber-green"}`} />
            </div>
          </div>
          <div className="p-2 bg-space-950 border border-space-800/80 rounded flex flex-col gap-0.5">
            <span className="text-slate-500">FRONT R</span>
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-bold text-slate-200">{motorTemp.frontRight}°C</span>
              <span className={`w-1.5 h-1.5 rounded-full ${motorTemp.frontRight > 45 ? "bg-cyber-red" : "bg-cyber-green"}`} />
            </div>
          </div>
          <div className="p-2 bg-space-950 border border-space-800/80 rounded flex flex-col gap-0.5">
            <span className="text-slate-500">REAR L</span>
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-bold text-slate-200">{motorTemp.rearLeft}°C</span>
              <span className={`w-1.5 h-1.5 rounded-full ${motorTemp.rearLeft > 45 ? "bg-cyber-red" : "bg-cyber-green"}`} />
            </div>
          </div>
          <div className="p-2 bg-space-950 border border-space-800/80 rounded flex flex-col gap-0.5">
            <span className="text-slate-500">REAR R</span>
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-bold text-slate-200">{motorTemp.rearRight}°C</span>
              <span className={`w-1.5 h-1.5 rounded-full ${motorTemp.rearRight > 45 ? "bg-cyber-red" : "bg-cyber-green"}`} />
            </div>
          </div>
        </div>
      </div>

      {/* 6. NETWORK DIAGNOSTICS */}
      <div className="hud-panel p-3 border-space-800 mb-2">
        <div className="flex justify-between items-center text-[10px] font-mono text-cyber-cyan/60 uppercase tracking-widest border-b border-space-800 pb-1.5 mb-2.5">
          <span>[07_COMMS_LINK]</span>
          <span className={getSignalColor(network.signalQuality)}>SIG {network.signalQuality}%</span>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[10px] font-mono">
          <div className="flex justify-between">
            <span className="text-slate-500">LATENCY:</span>
            <span className="text-cyber-cyan font-bold">{network.latency} ms</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">LOSS:</span>
            <span className="text-cyber-amber font-bold">{network.packetLoss}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">JITTER:</span>
            <span className="text-slate-200">{network.jitter} ms</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">FREQ:</span>
            <span className="text-slate-200">{network.frequency} Hz</span>
          </div>
        </div>

        <div className="mt-2.5 flex items-center justify-between p-1.5 bg-space-950 border border-space-800 rounded">
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 text-cyber-cyan" />
            <span className="text-[10px] text-slate-400 font-mono">SIGNAL STABILITY</span>
          </div>
          <span className="text-cyber-green font-mono text-[10px] font-semibold">SECURE</span>
        </div>
      </div>
    </div>
  );
}
