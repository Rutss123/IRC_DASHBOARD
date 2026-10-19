import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useRover } from '../context/RoverContext';
import UniversoLogo from '../components/common/UniversoLogo';
import ThemeSwitcher from '../components/common/ThemeSwitcher';
import {
  Battery,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Activity,
  Compass,
  Bot,
  Beaker,
  Video
} from 'lucide-react';

export default function MissionControlLayout({ children }) {
  const { telemetry, connectionStatus, roverMode, driverMode, setDriverMode } = useRover();
  const [utcTime, setUtcTime] = useState('');
  const [uiDensity, setUiDensity] = useState(() => {
    try {
      return localStorage.getItem('universo_ui_density') || 'normal';
    } catch (e) {
      return 'normal';
    }
  });

  const handleSetUiDensity = (density) => {
    setUiDensity(density);
    try {
      localStorage.setItem('universo_ui_density', density);
    } catch (e) {}
  };

  // Clock in UTC format
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

  const isConnected = connectionStatus === 'connected';
  const isEstop = roverMode === 'E-STOP';
  const isStale = telemetry.is_stale ?? true;
  const batteryPct = Number(telemetry.battery?.percentage ?? 0);
  const measuredHz = Number(telemetry.telemetry_hz ?? 0);

  return (
    <div className="w-full min-h-screen bg-[var(--color-bg-base)] flex flex-col p-3 gap-3 text-slate-100 font-sans antialiased select-none pb-6 transition-colors duration-300">
      {/* 1. TOP NAVBAR HEADER */}
      <header className="w-full bg-[var(--color-card-bg)] border border-[var(--color-card-border)] rounded-2xl md:rounded-3xl p-3 px-5 flex flex-wrap justify-between items-center gap-4 relative shrink-0 shadow-2xl backdrop-blur-md transition-colors duration-300">
        {/* Left: Logo & Sanskrit quote */}
        <div className="flex items-center gap-4">
          <UniversoLogo className="relative z-10" />

          {/* 4 DEDICATED MISSION TABS */}
          <nav className="hidden md:flex items-center gap-1 bg-[#05070e] p-1 border border-slate-800 rounded-xl font-mono">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[var(--color-accent-bg)] text-[var(--color-accent-text)] border border-[var(--color-accent-border)] shadow-[0_0_10px_var(--color-accent-glow)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <Compass className="w-3.5 h-3.5" />
              <span>COCKPIT</span>
            </NavLink>
            <NavLink
              to="/arm"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[var(--color-accent-bg)] text-[var(--color-accent-text)] border border-[var(--color-accent-border)] shadow-[0_0_10px_var(--color-accent-glow)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <Bot className="w-3.5 h-3.5" />
              <span>ARM</span>
            </NavLink>
            <NavLink
              to="/science"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[var(--color-accent-bg)] text-[var(--color-accent-text)] border border-[var(--color-accent-border)] shadow-[0_0_10px_var(--color-accent-glow)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <Beaker className="w-3.5 h-3.5" />
              <span>SCIENCE</span>
            </NavLink>
            <NavLink
              to="/multicam"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[var(--color-accent-bg)] text-[var(--color-accent-text)] border border-[var(--color-accent-border)] shadow-[0_0_10px_var(--color-accent-glow)]'
                    : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <Video className="w-3.5 h-3.5" />
              <span>CAMERAS</span>
            </NavLink>
          </nav>
        </div>

        {/* Right Status Controls Bar */}
        <div className="relative z-10 flex items-center gap-2 font-mono text-[9px] md:text-[10px]">
          {/* Theme Switcher */}
          <ThemeSwitcher />
          {/* Global UI Density / Zoom Selector */}
          <div className="flex bg-[#05070e] p-0.5 border border-slate-800 rounded-xl gap-0.5 items-center">
            <span className="text-[8px] md:text-[9px] text-slate-500 font-bold uppercase tracking-wider px-1.5 hidden xl:inline">
              ZOOM:
            </span>
            <button
              onClick={() => handleSetUiDensity('compact')}
              className={`px-2 py-0.5 rounded text-[8.5px] font-black transition-colors ${
                uiDensity === 'compact'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Compact Zoom (90%)"
            >
              90%
            </button>
            <button
              onClick={() => handleSetUiDensity('normal')}
              className={`px-2 py-0.5 rounded text-[8.5px] font-black transition-colors ${
                uiDensity === 'normal'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Default Zoom (100%)"
            >
              100%
            </button>
            <button
              onClick={() => handleSetUiDensity('comfort')}
              className={`px-2 py-0.5 rounded text-[8.5px] font-black transition-colors ${
                uiDensity === 'comfort'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Comfort Zoom (110%)"
            >
              110%
            </button>
          </div>

          {/* Driver Mode Toggle */}
          <div className="flex bg-[#05070e] p-0.5 border border-slate-800 rounded-xl gap-0.5 items-center mr-1">
            <span className="text-[8px] md:text-[9px] text-slate-400 font-bold uppercase tracking-wider px-2">
              DRIVE:
            </span>
            <button
              onClick={() => setDriverMode('MANUAL')}
              className={`px-2.5 py-1 rounded-lg font-black uppercase tracking-wider transition-all text-[9px] ${
                driverMode === 'MANUAL'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.15)]'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              MANUAL
            </button>
            <button
              onClick={() => setDriverMode('AUTONOMOUS')}
              className={`px-2.5 py-1 rounded-lg font-black uppercase tracking-wider transition-all text-[9px] ${
                driverMode === 'AUTONOMOUS'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.15)]'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              AUTO
            </button>
          </div>

          {/* WebSocket Ingest status */}
          <div
            className={`px-3 py-1 rounded-xl border font-black uppercase tracking-widest text-[9px] flex items-center gap-1.5 transition-all ${
              isConnected
                ? 'border-emerald-500/40 text-emerald-300 bg-emerald-950/30 shadow-[0_0_8px_rgba(16,185,129,0.15)]'
                : 'border-rose-500/40 text-rose-300 bg-rose-950/30 animate-pulse'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-rose-500'
              }`}
            />
            <span>WS: {isConnected ? 'ONLINE' : 'OFFLINE'}</span>
            {isConnected && <span className="text-cyan-400 font-bold">({measuredHz.toFixed(1)} Hz)</span>}
          </div>

          {/* Battery Indicator with dynamic status */}
          <div
            className={`flex items-center gap-1.5 border px-3 py-1 rounded-xl font-black text-[9px] transition-all ${
              batteryPct > 0 && batteryPct < 20
                ? 'border-rose-500/50 text-rose-300 bg-rose-950/30 animate-pulse'
                : 'border-emerald-500/40 text-emerald-300 bg-emerald-950/20'
            }`}
          >
            <Battery className="w-3.5 h-3.5 text-current shrink-0" />
            <span>BATTERY {batteryPct > 0 ? `${batteryPct.toFixed(1)}%` : '--'}</span>
          </div>

          {/* Clock: Date Time formatted */}
          <div className="hidden xl:flex items-center gap-1.5 border border-slate-800 px-3 py-1 rounded-xl bg-[#05070e] text-slate-300 font-bold">
            <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="tracking-widest">{utcTime}</span>
          </div>
        </div>
      </header>

      {/* 2. DYNAMIC SYSTEM STATUS / ALERT STRIP */}
      {isEstop ? (
        <section className="w-full bg-rose-950/50 border border-rose-500/60 rounded-xl p-2 px-4 flex justify-between items-center text-xs font-mono shrink-0 shadow-[0_0_20px_rgba(244,63,94,0.25)] animate-pulse">
          <div className="flex items-center gap-2 text-rose-300 font-black tracking-wide">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>CRITICAL ALERT: EMERGENCY STOP ENGAGED. ALL MOTOR CHANNELS DISARMED.</span>
          </div>
          <div className="text-rose-200 font-black">ESTOP ACTIVE</div>
        </section>
      ) : isConnected && isStale ? (
        <section className="w-full bg-amber-950/40 border border-amber-500/50 rounded-xl p-2 px-4 flex justify-between items-center text-xs font-mono shrink-0">
          <div className="flex items-center gap-2 text-amber-300 font-black tracking-wide">
            <Activity className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <span>TELEMETRY STALE: NO RECENT UDP PACKETS RECEIVED FROM ROVER (&gt; 2.5s)</span>
          </div>
          <div className="text-amber-400 font-black">RATE: 0.0 Hz</div>
        </section>
      ) : !isConnected ? (
        <section className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-2 px-4 flex justify-between items-center text-xs font-mono shrink-0 text-slate-300">
          <div className="flex items-center gap-2 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span>DISCONNECTED FROM BACKEND TELEMETRY SERVICE (RECONNECTING...)</span>
          </div>
          <div className="text-slate-400 font-bold">PORT: 8000</div>
        </section>
      ) : (
        <section className="w-full bg-[#060a14]/60 border border-slate-800/80 rounded-xl p-1.5 px-4 flex justify-between items-center text-[9px] font-mono shrink-0 text-slate-400">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>ALL GROUND SYSTEMS NOMINAL</span>
          </div>
          <div>
            INGEST: <span className="text-cyan-400 font-bold">{measuredHz.toFixed(1)} HZ</span> // MODE:{' '}
            <span className="text-amber-400 font-bold">{roverMode}</span>
          </div>
        </section>
      )}

      {/* 3. MAIN COMPONENT VIEWER */}
      <main
        className="flex-1 flex flex-col gap-3.5 transition-all"
        style={{ zoom: uiDensity === 'compact' ? 0.9 : uiDensity === 'comfort' ? 1.08 : 1 }}
      >
        {children}
      </main>
    </div>
  );
}
