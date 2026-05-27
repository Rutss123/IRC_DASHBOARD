import React, { useState, useEffect } from 'react';
import { useRover } from '../../context/RoverContext';
import { 
  Gauge, 
  Settings, 
  Activity, 
  Zap, 
  Navigation,
  Compass,
  CheckCircle,
  HelpCircle,
  Eye
} from 'lucide-react';

export default function LeftTelemetryPanel() {
  const { telemetry, roverMode, driverMode, setDriverMode } = useRover();
  const { speed, heading } = telemetry;

  // Compact calculated mobility parameters
  const [mobilityStats, setMobilityStats] = useState({
    distanceTraveled: 142.4,
    timeToTarget: 54,
    powerLoad: 3.4
  });

  useEffect(() => {
    if (speed === 0) return;
    const interval = setInterval(() => {
      setMobilityStats(prev => {
        const nextDist = parseFloat((prev.distanceTraveled + (speed * 1)).toFixed(1));
        const nextTime = Math.max(0, prev.timeToTarget - (speed > 1.2 ? 2 : 1));
        const nextPower = parseFloat((3.1 + Math.random() * 0.6).toFixed(1));
        return {
          distanceTraveled: nextDist,
          timeToTarget: nextTime === 0 ? 60 : nextTime,
          powerLoad: nextPower
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [speed]);

  const getStateColor = () => {
    switch (roverMode) {
      case 'E-STOP':
        return 'text-cyber-red border-cyber-red/30 bg-cyber-red/5';
      case 'NAV':
        return 'text-cyber-green border-cyber-green/30 bg-cyber-green/5';
      case 'SCIENCE':
        return 'text-cyber-cyan border-cyber-cyan/30 bg-cyber-cyan/5';
      default:
        return 'text-purple-400 border-purple-800/30 bg-purple-950/5';
    }
  };

  return (
    <div className="flex flex-col gap-3.5 w-full select-none font-mono">
      
      {/* 1. DRIVE MODE SELECTION */}
      <div className="hud-panel p-3 bg-[#0b0f19]/40 border-space-800">
        <div className="text-[8.5px] text-cyber-cyan/50 uppercase tracking-widest border-b border-space-800/60 pb-1.5 mb-2.5">
          <span>[01_DRIVE_CONTROL_MODE]</span>
        </div>

        <div className="flex bg-space-950 p-1 border border-space-850 rounded gap-1 w-full justify-between">
          <button
            onClick={() => setDriverMode('MANUAL')}
            className={`flex-1 py-1 rounded text-[9px] font-bold uppercase tracking-widest transition-all duration-200 ${
              driverMode === 'MANUAL' 
                ? 'bg-cyber-orange/15 text-cyber-orange border border-cyber-orange/20 shadow-glow-amber/5' 
                : 'text-slate-500 hover:text-slate-355'
            }`}
          >
            MANUAL
          </button>
          <button
            onClick={() => setDriverMode('AUTONOMOUS')}
            className={`flex-1 py-1 rounded text-[9px] font-bold uppercase tracking-widest transition-all duration-200 ${
              driverMode === 'AUTONOMOUS' 
                ? 'bg-cyber-cyan/15 text-cyber-cyan border border-cyber-cyan/20 shadow-glow-cyan/5' 
                : 'text-slate-500 hover:text-slate-355'
            }`}
          >
            AUTONOMOUS
          </button>
        </div>
      </div>

      {/* 2. ROVER STATE MATRIX */}
      <div className="hud-panel p-3 bg-[#0b0f19]/40 border-space-800">
        <div className="text-[8.5px] text-cyber-cyan/50 uppercase tracking-widest border-b border-space-800/60 pb-1.5 mb-2.5">
          <span>[02_OPERATIONAL_STATE]</span>
        </div>

        <div className={`flex items-center justify-between p-2 rounded border ${getStateColor()} transition-colors duration-300`}>
          <div className="flex flex-col gap-0.5">
            <span className="text-[7.5px] text-slate-500 font-bold uppercase">ROVER CURRENT STATE</span>
            <span className="text-sm font-bold uppercase tracking-wider">{roverMode} LOCK</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-current animate-pulse shadow-glow-amber" />
        </div>
      </div>

      {/* 3. VELOCITY INGEST (DIGITAL) */}
      <div className="hud-panel p-3 bg-[#0b0f19]/40 border-space-800">
        <div className="text-[8.5px] text-cyber-cyan/50 uppercase tracking-widest border-b border-space-800/60 pb-1.5 mb-2.5">
          <span>[03_DIGITAL_VELOCITY]</span>
        </div>

        <div className="flex items-center gap-3.5 bg-space-950 p-2 border border-space-850 rounded">
          <div className="p-2 bg-space-900 border border-space-800 rounded">
            <Gauge className="w-5 h-5 text-cyber-cyan" />
          </div>
          <div className="flex flex-col">
            <span className="text-[7.5px] text-slate-500 uppercase font-semibold tracking-wider">SPEED READOUT</span>
            <div className="text-xl font-black text-slate-100 leading-tight">
              {speed.toFixed(2)} <span className="text-[8.5px] font-bold text-slate-500 uppercase">m/s</span>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}
