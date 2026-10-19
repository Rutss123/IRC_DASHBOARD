import React from 'react';
import { useRover } from '../../context/RoverContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldAlert, Video } from 'lucide-react';

export default function ActionBar() {
  const { roverMode, changeMode, triggerEStop, resetEStop, selectCamera, cameras, activeCameraId } = useRover();
  const navigate = useNavigate();
  const location = useLocation();
  const isMultiCamPage = location.pathname === '/multicam';

  const isEstop = roverMode === 'E-STOP';

  const handleEStopToggle = () => {
    if (isEstop) {
      resetEStop();
    } else {
      triggerEStop();
    }
  };

  return (
    <div className="w-full bg-[var(--color-card-bg)] border border-[var(--color-card-border)] rounded-xl p-3 flex flex-wrap justify-between items-center gap-3 select-none relative overflow-hidden backdrop-blur-md font-mono transition-colors duration-300">
      {/* 1. Quick Hero Camera Selector */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
          HERO STREAM:
        </span>
        <select
          value={activeCameraId}
          onChange={(e) => selectCamera(e.target.value)}
          className="bg-[#060810] border border-slate-700/80 px-2.5 py-1 text-xs text-slate-200 rounded-lg outline-none cursor-pointer focus:border-[var(--color-accent)] font-bold transition-colors"
        >
          {cameras.map(cam => (
            <option key={cam.path || cam.id} value={cam.path || cam.id}>
              {cam.name} ({cam.status?.toUpperCase() || 'ONLINE'})
            </option>
          ))}
        </select>
      </div>

      {/* 2. Mode Switches */}
      <div className="flex items-center gap-1.5 bg-[#060810] p-1 border border-slate-800 rounded-lg">
        {['NAV', 'SCIENCE', 'ARM'].map(m => (
          <button
            key={m}
            disabled={isEstop}
            onClick={() => changeMode(m)}
            className={`px-3 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all disabled:opacity-30 ${
              roverMode === m
                ? 'bg-[var(--color-accent-bg)] text-[var(--color-accent-text)] border border-[var(--color-accent-border)] shadow-[0_0_8px_var(--color-accent-glow)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* 3. Action Controls & Emergency Stop */}
      <div className="flex items-center gap-2.5">
        {isMultiCamPage ? (
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-cyan-500/40 text-cyan-400 bg-cyan-950/20 hover:bg-cyan-950/40 transition-all"
          >
            <Video className="w-3.5 h-3.5" />
            BENTO COCKPIT
          </button>
        ) : (
          <button
            onClick={() => navigate('/multicam')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-cyan-500/40 text-cyan-400 bg-cyan-950/20 hover:bg-cyan-950/40 transition-all"
          >
            <Video className="w-3.5 h-3.5" />
            MULTI-CAM MATRIX
          </button>
        )}

        {/* CRITICAL HARDWARE E-STOP */}
        <button
          onClick={handleEStopToggle}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold tracking-widest text-xs uppercase border transition-all duration-300 ${
            isEstop
              ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-[0_0_15px_#34d399] animate-pulse'
              : 'bg-rose-950/60 text-rose-400 border-rose-500/50 hover:bg-rose-600 hover:text-white shadow-[0_0_12px_rgba(244,63,94,0.2)]'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>{isEstop ? 'RESET E-STOP' : 'EMERGENCY STOP'}</span>
        </button>
      </div>
    </div>
  );
}
