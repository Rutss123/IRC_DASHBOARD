import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Palette, Check, Sparkles, Sun, Shield } from 'lucide-react';

export default function ThemeSwitcher() {
  const { theme, setTheme, themes, activeThemeMeta } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getThemeIcon = (themeId) => {
    switch (themeId) {
      case 'arrakis':
        return <Sun className="w-3 h-3 text-amber-400" />;
      case 'stealth':
        return <Shield className="w-3 h-3 text-emerald-400" />;
      case 'artemis':
      default:
        return <Sparkles className="w-3 h-3 text-cyan-400" />;
    }
  };

  return (
    <div className="relative font-mono text-xs select-none" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#05070e] border border-slate-800 hover:border-[var(--color-accent)] transition-all text-slate-300 hover:text-white shadow-md group"
        title="Change Ground Station Theme & Visual Style"
      >
        <span
          className="w-2 h-2 rounded-full shadow-[0_0_6px_currentColor] transition-colors"
          style={{ backgroundColor: activeThemeMeta.accentColor, color: activeThemeMeta.accentColor }}
        />
        <Palette className="w-3 h-3 text-slate-400 group-hover:text-[var(--color-accent-text)] transition-colors" />
        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-wider hidden sm:inline">
          {activeThemeMeta.name}
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-[#090d1a]/95 border border-[var(--color-card-border)] rounded-2xl shadow-2xl p-2 z-50 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-2.5 py-1.5 border-b border-slate-800 text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
            <span>OPERATIONAL THEMES</span>
            <span className="text-cyan-400">3 PRESETS</span>
          </div>

          <div className="flex flex-col gap-1.5 mt-1.5">
            {themes.map((t) => {
              const isSelected = t.id === theme;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    setIsOpen(false);
                  }}
                  className={`p-2 rounded-xl border text-left transition-all flex items-start justify-between gap-2.5 group ${
                    isSelected
                      ? 'bg-[var(--color-accent-bg)] border-[var(--color-accent)] shadow-[0_0_12px_var(--color-accent-glow)]'
                      : 'bg-[#05070e]/80 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      {getThemeIcon(t.id)}
                      <span className="text-xs font-black text-slate-100 uppercase tracking-wide">
                        {t.name}
                      </span>
                      <span
                        className="text-[7.5px] font-black uppercase px-1.5 py-0.5 rounded border"
                        style={{
                          color: t.accentColor,
                          borderColor: `${t.accentColor}50`,
                          backgroundColor: `${t.accentColor}15`,
                        }}
                      >
                        {t.badge}
                      </span>
                    </div>
                    <span className="text-[8.5px] text-slate-400 font-sans leading-tight mt-0.5">
                      {t.tagline}
                    </span>
                  </div>

                  {isSelected && (
                    <Check
                      className="w-4 h-4 shrink-0 mt-0.5"
                      style={{ color: t.accentColor }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
