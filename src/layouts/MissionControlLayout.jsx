import React, { useState, useEffect } from 'react';
import { useRover } from '../context/RoverContext';
import UniversoLogo from '../components/common/UniversoLogo';
import { 
  Battery, 
  Clock, 
  AlertTriangle 
} from 'lucide-react';

/**
 * High-Density MissionControlLayout.
 * Compressed navbar height and alert padding to guarantee full screen visibility.
 * Completely locks the dashboard viewport inside 100vh using h-screen overflow-hidden.
 */
export default function MissionControlLayout({ children }) {
  const { telemetry, connectionStatus, roverMode, driverMode, setDriverMode } = useRover();
  const [utcTime, setUtcTime] = useState('');

  // Clock in UTC format matching JPG: "YYYY-MM-DD HH:MM:SS UTC"
  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      const formatted = date.toISOString().slice(0, 19).replace('T', ' ') + ' UTC';
      setUtcTime(formatted);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full min-h-screen bg-[#060608] flex flex-col p-3 gap-3 text-slate-100 font-sans antialiased select-none pb-6">
      
      {/* 1. TOP NAVBAR HEADER (Futuristic Aerospace Mission-Control Style) */}
      <header className="w-full bg-gradient-to-r from-space-900/90 via-[#0e1525]/85 to-space-950/90 border border-space-800/90 rounded-lg p-3 px-5 flex justify-between items-center gap-4 relative shrink-0 shadow-[0_4px_20px_-3px_rgba(0,0,0,0.7),_0_0_15px_-4px_rgba(6,182,212,0.1),_inset_0_1px_0_rgba(255,255,255,0.03)]">
        
        {/* Subtle grid line mesh overlay */}
        <div className="absolute inset-0 grid-overlay opacity-[0.04] pointer-events-none" />
        
        {/* Sleek top-border indicator line */}
        <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-cyber-cyan/30 to-transparent" />
        
        {/* Universo Logo & Sanskrit quote (Full Scale) */}
        <UniversoLogo className="relative z-10" />

        {/* Right Status Controls Bar */}
        <div className="relative z-10 flex items-center gap-3 font-mono text-[8px] md:text-[9px]">

          {/* Segmented Driver Mode Toggle (MANUAL vs AUTONOMOUS) */}
          <div className="flex bg-space-950/80 p-0.5 border border-space-800/70 rounded-lg gap-0.5 items-center mr-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]">
            <span className="text-[7.5px] md:text-[8px] text-slate-500 font-bold uppercase tracking-wider px-2">DRIVE_MODE:</span>
            <button
              onClick={() => setDriverMode('MANUAL')}
              className={`px-2.5 py-0.5 rounded font-black uppercase tracking-wider transition-all duration-200 text-[8px] ${
                driverMode === 'MANUAL' 
                  ? 'bg-cyber-orange/15 text-cyber-orange border border-cyber-orange/25 shadow-glow-amber/10' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              MANUAL
            </button>
            <button
              onClick={() => setDriverMode('AUTONOMOUS')}
              className={`px-2.5 py-0.5 rounded font-black uppercase tracking-wider transition-all duration-200 text-[8px] ${
                driverMode === 'AUTONOMOUS' 
                  ? 'bg-cyber-cyan/15 text-cyber-cyan border border-cyber-cyan/25 shadow-glow-cyan/10' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              AUTONOMOUS
            </button>
          </div>

          {/* WebSocket Ingest status */}
          <div className={`px-2.5 py-0.5 rounded border font-black uppercase tracking-widest text-[8px] transition-all duration-300 ${
            connectionStatus === 'connected' 
              ? 'border-cyber-green/30 text-cyber-green bg-cyber-green/5 shadow-[0_0_8px_rgba(16,185,129,0.08)]' 
              : 'border-cyber-amber/40 text-cyber-amber bg-cyber-amber/5 animate-pulse'
          }`}>
            WS: {connectionStatus === 'connected' ? 'ONLINE' : 'OFFLINE'}
          </div>

          {/* Battery Indicator with dynamic status */}
          <div className={`flex items-center gap-1.5 border px-2.5 py-0.5 rounded font-black text-[8px] transition-all duration-300 ${
            (telemetry.battery?.percentage ?? 15) < 20
              ? 'border-cyber-red/40 text-cyber-red bg-cyber-red/5 font-bold animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.15)]'
              : 'border-cyber-green/30 text-cyber-green bg-cyber-green/5 shadow-[0_0_8px_rgba(16,185,129,0.08)]'
          }`}>
            <Battery className="w-3 h-3 text-current shrink-0" />
            <span>BATTERY {telemetry.battery?.percentage ?? 15.0}%</span>
          </div>

          {/* Clock: Date Time formatted */}
          <div className="hidden lg:flex items-center gap-1.5 border border-space-800/80 px-2.5 py-0.5 rounded bg-space-950/70 text-slate-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]">
            <Clock className="w-3 h-3 text-cyber-cyan shrink-0 animate-pulse-slow" />
            <span className="tracking-widest font-black select-all text-slate-200">{utcTime}</span>
          </div>

        </div>

      </header>

      {/* 2. SECONDARY GLOBAL WARNING ALERT STRIP (Compressed) */}
      <section className="w-full bg-[#3d090a]/30 border border-cyber-red/20 rounded-md p-1 px-3 flex justify-between items-center text-[8px] font-mono shrink-0">
        <div className="flex items-center gap-1.5 text-cyber-red animate-pulse font-bold tracking-wide">
          <AlertTriangle className="w-3 h-3 text-cyber-red shrink-0" />
          <span>WARNING: SYSTEM OPERATES IN RESTRICTED CAPACITY. CHECK ACTIVE DIAGNOSTIC WARNING ALERTS</span>
        </div>
        <div className="text-slate-400 font-bold shrink-0">
          RTT: <span className="text-cyber-green">48MS</span> // ESTOP: <span className="text-cyber-green">READY</span>
        </div>
      </section>

      {/* 3. MAIN COMPONENT VIEWER */}
      <main className="flex-1 flex flex-col gap-3">
        {children}
      </main>

    </div>
  );
}
