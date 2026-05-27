import React from 'react';

/**
 * High-fidelity Aerospace Compass HUD Widget
 * Rotates dynamically based on telemetry heading angle.
 */
export default function CompassWidget({ heading = 0 }) {
  // Create circular ticks every 30 degrees
  const ticks = Array.from({ length: 12 }, (_, i) => i * 30);
  
  // Format heading display (e.g. 045, 009, 180)
  const formatHeading = (angle) => {
    return String(Math.round(angle) % 360).padStart(3, '0');
  };

  const getCardinalDirection = (angle) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(((angle % 360) / 45)) % 8;
    return directions[index];
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-3 hud-panel hud-border-cyan/20 select-none">
      {/* HUD Compass Header */}
      <div className="w-full flex justify-between items-center text-[10px] font-mono text-cyber-cyan/60 uppercase tracking-widest border-b border-space-800 pb-1.5 mb-3">
        <span>[02_ORIENTATION]</span>
        <span className="text-cyber-amber">HEADING LOCK</span>
      </div>

      <div className="relative w-36 h-36 flex items-center justify-center">
        {/* Outer Circular Dial with ticks */}
        <svg viewBox="0 0 120 120" className="w-full h-full text-space-700">
          {/* Circular border */}
          <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 3" />
          <circle cx="60" cy="60" r="48" fill="none" stroke="rgba(6, 182, 212, 0.08)" />

          {/* Rotating Compass Card */}
          <g transform={`rotate(${-heading} 60 60)`} className="transition-transform duration-500 ease-out text-cyber-cyan/50">
            {/* North Indicator */}
            <line x1="60" y1="6" x2="60" y2="12" stroke="#ea580c" strokeWidth="2" />
            <text x="60" y="20" fontSize="9" fontWeight="bold" fill="#ea580c" textAnchor="middle" dominantBaseline="middle">
              N
            </text>

            {/* South, East, West Indicators */}
            <text x="60" y="102" fontSize="8" textAnchor="middle" dominantBaseline="middle" fill="currentColor">S</text>
            <text x="102" y="60" fontSize="8" textAnchor="middle" dominantBaseline="middle" fill="currentColor">E</text>
            <text x="18" y="60" fontSize="8" textAnchor="middle" dominantBaseline="middle" fill="currentColor">W</text>

            {/* Intermediate Ticks & Degree Labels */}
            {ticks.map((tick) => {
              if (tick % 90 === 0) return null; // Already drawn cardinal letters
              
              const angleRad = (tick * Math.PI) / 180;
              const x1 = 60 + Math.sin(angleRad) * 48;
              const y1 = 60 - Math.cos(angleRad) * 48;
              const x2 = 60 + Math.sin(angleRad) * 52;
              const y2 = 60 - Math.cos(angleRad) * 52;

              return (
                <g key={tick}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="1" />
                  {tick % 60 === 0 && (
                    <text 
                      x={60 + Math.sin(angleRad) * 38} 
                      y={60 - Math.cos(angleRad) * 38} 
                      fontSize="6" 
                      textAnchor="middle" 
                      dominantBaseline="middle" 
                      fill="rgba(6, 182, 212, 0.3)"
                    >
                      {tick}
                    </text>
                  )}
                </g>
              );
            })}
          </g>

          {/* HUD Crosshairs (Fixed overlay) */}
          <g className="text-cyber-cyan/35" stroke="currentColor" strokeWidth="0.5">
            <line x1="60" y1="26" x2="60" y2="40" />
            <line x1="60" y1="80" x2="60" y2="94" />
            <line x1="26" y1="60" x2="40" y2="60" />
            <line x1="80" y1="60" x2="94" y2="60" />
          </g>

          {/* Static Heading Arrow Pointer (Pointer is at top, pointing to current direction) */}
          <polygon points="60,26 56,33 64,33" fill="#ea580c" className="animate-pulse" />
        </svg>

        {/* Dynamic Center Digits readout */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-xl font-bold tracking-wider text-slate-100 font-mono leading-none">
            {formatHeading(heading)}°
          </span>
          <span className="text-[9px] font-semibold text-cyber-cyan tracking-widest font-mono">
            {getCardinalDirection(heading)}
          </span>
        </div>
      </div>

      {/* Auxiliary Pitch / Roll telemetry values */}
      <div className="w-full grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-space-800 text-[10px] font-mono">
        <div className="flex justify-between text-slate-400">
          <span>PITCH:</span>
          <span className="text-slate-200">1.4°</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>ROLL:</span>
          <span className="text-slate-200">-0.8°</span>
        </div>
      </div>
    </div>
  );
}
