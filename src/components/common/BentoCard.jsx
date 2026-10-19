import React, { useState } from 'react';
import { GripVertical, ChevronUp, ChevronDown, Maximize2, Minimize2 } from 'lucide-react';

/**
 * BentoCard - Curvy, aerospace-themed Bento card container.
 * Features:
 * - Curvy rounded-2xl / rounded-3xl corners with subtle glassmorphic backdrop.
 * - Dedicated draggable header zone with drag grip icon.
 * - Integrated Resizer Controls: quick size presets (S, M, L, MAX) and Collapse/Expand.
 * - Bold high-contrast typography for field operations.
 * - Automatic staleness detection watermark.
 */
export default function BentoCard({
  title,
  subtitle,
  badge,
  badgeColor = 'cyan', // 'cyan' | 'green' | 'amber' | 'red' | 'purple' | 'slate'
  isStale = false,
  headerAction,
  children,
  className = '',
  noPadding = false,
  isDraggable = true,
  onResizePreset, // (preset: 'compact' | 'standard' | 'wide' | 'full' | 'collapse') => void
  allowCollapse = true,
  isCollapsed: controlledCollapsed,
  onCollapseToggle,
}) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const handleToggleCollapse = (e) => {
    e.stopPropagation();
    const next = !isCollapsed;
    setInternalCollapsed(next);
    if (onCollapseToggle) onCollapseToggle(next);
    if (onResizePreset) onResizePreset(next ? 'collapse' : 'standard');
  };

  const getBadgeStyle = () => {
    switch (badgeColor) {
      case 'green':
        return 'text-emerald-300 border-emerald-500/40 bg-emerald-950/60 shadow-[0_0_8px_rgba(16,185,129,0.15)]';
      case 'amber':
        return 'text-amber-300 border-amber-500/40 bg-amber-950/60 shadow-[0_0_8px_rgba(245,158,11,0.15)]';
      case 'red':
        return 'text-rose-300 border-rose-500/50 bg-rose-950/70 shadow-[0_0_10px_rgba(244,63,94,0.2)] animate-pulse';
      case 'purple':
        return 'text-purple-300 border-purple-500/40 bg-purple-950/60';
      case 'slate':
        return 'text-slate-300 border-slate-700/60 bg-slate-900/60';
      case 'theme':
      case 'cyan':
      default:
        return 'text-[var(--color-accent-text)] border-[var(--color-accent-border)] bg-[var(--color-accent-bg)] shadow-[0_0_8px_var(--color-accent-glow)]';
    }
  };

  return (
    <div
      className={`relative bg-[var(--color-card-bg)] backdrop-blur-md border border-[var(--color-card-border)] hover:border-[var(--color-card-border-hover)] rounded-2xl md:rounded-3xl overflow-hidden shadow-[0_4px_25px_-5px_rgba(0,0,0,0.7)] flex flex-col font-mono select-none transition-all duration-200 h-full w-full group ${className}`}
    >
      {/* High-tech subtle mesh overlay */}
      <div className="absolute inset-0 grid-overlay opacity-[0.03] pointer-events-none" />

      {/* Staleness Watermark Indicator */}
      {isStale && (
        <div className="absolute top-3 right-3 z-30 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-rose-950/90 border border-rose-500/50 text-rose-300 animate-pulse shadow-lg">
          STALE TELEMETRY
        </div>
      )}

      {/* Header Bar with Drag Handle and Resizer Controls */}
      {(title || subtitle || badge || headerAction || onResizePreset || allowCollapse) && (
        <div className="flex items-center justify-between px-3 md:px-4 py-2.5 border-b border-[var(--color-card-border)] bg-[var(--color-card-header)] shrink-0 gap-2">
          {/* Left: Drag Handle + Subtitle + Title */}
          <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
            {isDraggable && (
              <div
                className="bento-drag-handle cursor-grab active:cursor-grabbing p-1 rounded hover:bg-slate-800/60 text-slate-500 hover:text-[var(--color-accent-text)] transition-colors shrink-0"
                title="Drag to rearrange panel"
              >
                <GripVertical className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </div>
            )}
            {subtitle && (
              <span className="text-[9px] md:text-xs text-[var(--color-accent-text)] font-bold uppercase tracking-widest shrink-0">
                {subtitle}
              </span>
            )}
            {title && (
              <h3 className="text-xs md:text-sm font-black text-slate-100 uppercase tracking-wide truncate m-0">
                {title}
              </h3>
            )}
            {isCollapsed && (
              <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                COLLAPSED
              </span>
            )}
          </div>

          {/* Right: Resizer Presets, Badges & Controls */}
          <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
            {/* Quick Sizing Presets for rapid operational resizing */}
            {onResizePreset && (
              <div className="hidden sm:flex items-center bg-[#05070e] border border-slate-800 rounded-lg p-0.5 gap-0.5 text-[8.5px] font-black">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isCollapsed) setInternalCollapsed(false);
                    onResizePreset('compact');
                  }}
                  className="px-1.5 py-0.5 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 transition-colors"
                  title="Compact Size (Small)"
                >
                  S
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isCollapsed) setInternalCollapsed(false);
                    onResizePreset('standard');
                  }}
                  className="px-1.5 py-0.5 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 transition-colors"
                  title="Standard Size (Medium)"
                >
                  M
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isCollapsed) setInternalCollapsed(false);
                    onResizePreset('wide');
                  }}
                  className="px-1.5 py-0.5 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 transition-colors"
                  title="Wide / 2x Size"
                >
                  L
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isCollapsed) setInternalCollapsed(false);
                    onResizePreset('full');
                  }}
                  className="px-1.5 py-0.5 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 transition-colors"
                  title="Full Width (Max)"
                >
                  MAX
                </button>
              </div>
            )}

            {/* Subsystem Status Badge */}
            {badge && (
              <span
                className={`px-2 py-0.5 text-[9px] md:text-[10px] font-black uppercase rounded-full border tracking-wider ${getBadgeStyle()}`}
              >
                {badge}
              </span>
            )}

            {headerAction}

            {/* Card Collapse / Expand Toggle */}
            {allowCollapse && (
              <button
                onClick={handleToggleCollapse}
                className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors"
                title={isCollapsed ? 'Expand panel' : 'Collapse panel'}
              >
                {isCollapsed ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronUp className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Card Content Body (Hidden if collapsed) */}
      {!isCollapsed && (
        <div
          className={`flex-1 flex flex-col relative ${
            noPadding ? 'overflow-hidden' : 'overflow-y-auto overflow-x-hidden p-2.5 md:p-3.5'
          }`}
        >
          {children}
        </div>
      )}
    </div>
  );
}
