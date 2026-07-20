import React, { useEffect, useRef } from 'react';
import { useRover } from '../../context/RoverContext';
import { Terminal, AlertTriangle, ShieldCheck, Cpu } from 'lucide-react';

export default function LogsPanel() {
  const { logs, roverMode } = useRover();
  const logEndRef = useRef(null);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toISOString().slice(11, 19) + '.' + String(date.getMilliseconds()).padStart(3, '0');
    } catch {
      return "00:00:00.000";
    }
  };

  const getSeverityStyles = (level) => {
    switch (level) {
      case 'SUCCESS':
        return {
          border: 'border-l-4 border-l-cyber-green border-space-850',
          bg: 'bg-cyber-green/5',
          text: 'text-cyber-green',
          badge: 'bg-cyber-green/10 border-cyber-green/20 text-cyber-green',
          tag: '[NOMINAL_SUCCESS]'
        };
      case 'WARNING':
        return {
          border: 'border-l-4 border-l-cyber-orange border-space-850',
          bg: 'bg-cyber-orange/5',
          text: 'text-cyber-orange',
          badge: 'bg-cyber-orange/10 border-cyber-orange/20 text-cyber-orange',
          tag: '[SYSTEM_WARNING]'
        };
      case 'ERROR':
        return {
          border: 'border-l-4 border-l-cyber-red border-space-850',
          bg: 'bg-cyber-red/5',
          text: 'text-cyber-red font-bold animate-pulse',
          badge: 'bg-cyber-red/10 border-cyber-red/20 text-cyber-red',
          tag: '[CRITICAL_FAULT]'
        };
      default:
        return {
          border: 'border-l-4 border-l-cyber-amber border-space-850',
          bg: 'bg-cyber-amber/5',
          text: 'text-slate-200',
          badge: 'bg-cyber-amber/10 border-cyber-amber/20 text-cyber-amber',
          tag: '[INFO_NOMINAL]'
        };
    }
  };

  return (
    <div className="w-full bg-[#0b0f19]/60 border border-space-800 rounded-xl p-4 flex flex-col gap-3 font-mono select-none relative overflow-hidden">
      
      {/* Tech scan grid overlay */}
      <div className="absolute inset-0 grid-overlay opacity-[0.02] pointer-events-none" />

      {/* 1. AEROSPACE DIAGNOSTIC HEADER */}
      <div className="flex flex-wrap justify-between items-center text-[10px] text-cyber-amber/60 uppercase tracking-widest border-b border-space-800/70 pb-2 gap-3">
        <span className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyber-amber animate-pulse" />
          [08_AEROSPACE_DIAGNOSTICS_LOGS]
        </span>

        {/* Live Diagnostics Statistics Strip */}
        <div className="flex items-center gap-4 text-[9px] font-bold">
          <div className="flex items-center gap-1">
            <span className="text-slate-500">FAULTS ACTIVE:</span>
            {roverMode === 'E-STOP' ? (
              <span className="text-cyber-red animate-pulse bg-cyber-red/5 px-1.5 py-0.5 border border-cyber-red/15 rounded">
                1 CRITICAL FAULT
              </span>
            ) : (
              <span className="text-cyber-green bg-cyber-green/5 px-1.5 py-0.5 border border-cyber-green/15 rounded">
                0 CRITICAL
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <span className="text-slate-500">LINK:</span>
            <span className="text-cyber-green">ONLINE</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-slate-500">STATE:</span>
            <span className={roverMode === 'E-STOP' ? 'text-cyber-red' : 'text-cyber-amber'}>{roverMode}</span>
          </div>
        </div>
      </div>

      {/* 2. FAILURE & DIAGNOSTIC EVENT STREAM */}
      <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto bg-space-950 p-2.5 rounded-lg border border-space-850 scrollbar-thin">
        
        {logs.slice(0, 20).map((log) => {
          const style = getSeverityStyles(log.level);
          return (
            <div 
              key={log.id} 
              className={`flex flex-wrap items-center justify-between p-2.5 rounded border ${style.border} ${style.bg} transition-colors duration-200 gap-3 hover:bg-space-900/10`}
            >
              {/* Event Metadata (Time & Node) */}
              <div className="flex items-center gap-3 text-[10px] text-slate-400 font-semibold shrink-0">
                <span className="text-slate-500 font-bold select-all">
                  [{formatTime(log.timestamp)}]
                </span>
                <span className="text-purple-400 font-bold tracking-widest uppercase">
                  NODE: {log.node}
                </span>
              </div>

              {/* Event Severity Message Tag */}
              <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                <span className={`px-2 py-0.5 border rounded text-[8px] font-black uppercase tracking-wider ${style.badge}`}>
                  {style.tag}
                </span>
                <span className={`text-[10.5px] tracking-wide select-text truncate ${style.text}`}>
                  {log.message}
                </span>
              </div>

              {/* Status Code / Integrity Check */}
              <span className="text-[8px] text-slate-600 font-bold tracking-widest uppercase hidden md:inline shrink-0">
                INT_CHECK: OK
              </span>

            </div>
          );
        })}
        <div ref={logEndRef} />
      </div>

    </div>
  );
}
