import React from 'react';
import universoLogoImg from '../../assets/universo_logo.png';

/**
 * Universo Premium Aerospace-Grade Logo Component.
 * Integrates the EXACT ORIGINAL hand-drawn spaceship/planet logo emblem
 * from the uploaded image by cropping it, alongside premium aerospace HTML typography.
 */
export default function UniversoLogo({ className = "" }) {
  return (
    <div className={`flex items-center gap-3.5 select-none font-mono ${className}`}>
      
      {/* 1. ORIGINAL UNIVERSO EMBLEM CROPPED CONTAINER */}
      <div className="relative w-12 h-12 flex items-center justify-center shrink-0 group rounded-lg overflow-hidden border border-space-800 bg-[#020204] shadow-[0_0_12px_rgba(6,182,212,0.1)] hover:border-cyber-cyan/30 transition-all duration-300">
        
        {/* Glow backdrop overlay */}
        <div className="absolute inset-0 bg-cyber-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        
        {/* Exact crop of the emblem portion of the uploaded image */}
        <img 
          src={universoLogoImg} 
          alt="UNIVERSO Emblem" 
          className="absolute top-0 left-0 w-full h-[155%] object-cover object-top transition-transform duration-500 group-hover:scale-[1.06]"
        />
      </div>

      {/* 2. ADVANCED TYPOGRAPHY BRANDING SECTION */}
      <div className="flex flex-col select-text pl-3.5 border-l border-space-800/80">
        
        {/* Main Title: UNIVERSO S & A */}
        <span 
          className="text-xs md:text-sm font-black uppercase tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-slate-50 via-slate-200 to-slate-400 leading-none mb-1 font-sans drop-shadow-[0_0_8px_rgba(6,182,212,0.2)]"
        >
          UNIVERSO S & A
        </span>
        
        {/* Sanskrit Slogan: EXACT text "आकाश धारिणं सर्वं ॥" */}
        <span 
          className="text-[8.5px] md:text-[10px] font-bold tracking-wider leading-none text-transparent bg-clip-text bg-gradient-to-r from-cyber-cyan/90 via-cyber-cyan to-cyber-amber/95 font-sans filter drop-shadow-[0_0_4px_rgba(6,182,212,0.15)]"
        >
          आकाश धारिणं सर्वं ॥
        </span>

      </div>

    </div>
  );
}


