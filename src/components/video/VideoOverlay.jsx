import React from 'react';

/**
 * Camera Viewport HUD Overlay.
 * Cleans up cinematic sci-fi elements like radar sweeps and rotating widgets.
 * Retains only the practical operator flight bars, tapes, and brackets.
 */
export default function VideoOverlay({ camera, speed }) {
  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 scanlines grid-overlay">
      
      {/* 1. Fine Center Brackets */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border border-cyber-cyan/10 rounded-full flex items-center justify-center">
        {/* Fine crosshairs */}
        <div className="w-6 h-[1px] bg-cyber-cyan/40 absolute" />
        <div className="h-6 w-[1px] bg-cyber-cyan/40 absolute" />
        
        {/* Core brackets */}
        <div className="w-12 h-12 border border-cyber-cyan/20 rounded-full border-t-transparent border-b-transparent" />
      </div>

      {/* 2. Aerospace Corner Brackets */}
      <div className="absolute top-5 left-5 w-6 h-6 border-t border-l border-cyber-cyan/25" />
      <div className="absolute top-5 right-5 w-6 h-6 border-t border-r border-cyber-cyan/25" />
      <div className="absolute bottom-5 left-5 w-6 h-6 border-b border-l border-cyber-cyan/25" />
      <div className="absolute bottom-5 right-5 w-6 h-6 border-b border-r border-cyber-cyan/25" />

      {/* 3. Flight Horizon Indicator Brackets (Pitch/Roll indicator side scales) */}
      <div className="absolute top-[35%] bottom-[35%] left-10 w-6 border-l border-t border-b border-cyber-cyan/15 flex flex-col justify-between text-[7px] font-mono text-cyber-cyan/40 pl-1">
        <span>+30</span>
        <span>+15</span>
        <span className="text-cyber-orange font-semibold">- 00 -</span>
        <span>-15</span>
        <span>-30</span>
      </div>
      <div className="absolute top-[35%] bottom-[35%] right-10 w-6 border-r border-t border-b border-cyber-cyan/15 flex flex-col justify-between text-[7px] font-mono text-cyber-cyan/40 pr-1 text-right">
        <span>+30</span>
        <span>+15</span>
        <span className="text-cyber-orange font-semibold">- 00 -</span>
        <span>-15</span>
        <span>-30</span>
      </div>

      {/* 4. Left Tape (Velocity telemetry widget) */}
      <div className="absolute top-1/2 -translate-y-1/2 left-16 bg-[#08080a]/80 border border-space-800 px-2 py-1.5 rounded text-[8px] font-mono flex flex-col gap-0.5 w-16">
        <span className="text-slate-500 uppercase tracking-widest text-[7px]">SPD_INGEST</span>
        <span className="text-cyber-cyan font-bold text-[11px] tracking-wide">
          {speed.toFixed(2)} M/S
        </span>
      </div>

      {/* 5. Downlink Stream Secure identifier badge */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-[#08080a]/80 border border-cyber-cyan/20 text-cyber-cyan px-2.5 py-0.5 rounded text-[8px] font-mono uppercase tracking-widest flex items-center gap-1.5">
        <span className="w-1 h-1 rounded-full bg-cyber-cyan animate-pulse" />
        <span>VIDEO DOWNLINK: INGESTION STABLE // H.264</span>
      </div>

    </div>
  );
}
