import React, { useState } from 'react';
import { ResponsiveGridLayout, useContainerWidth } from 'react-grid-layout';
import { useRover } from '../context/RoverContext';
import BentoCard from '../components/common/BentoCard';
import CameraFrame from '../components/video/CameraFrame';
import ImuPanel from '../components/telemetry/ImuPanel';
import GpsPanel from '../components/system/GpsPanel';
import DriveMotorsPanel from '../components/telemetry/DriveMotorsPanel';
import SystemDiagnostics from '../components/system/SystemDiagnostics';
import ActionBar from '../components/controls/ActionBar';
import { RotateCcw, Video, Compass, Truck, SlidersHorizontal } from 'lucide-react';

const STORAGE_KEY = 'universo_cockpit_layout_v4';

// Symmetrical 12-col grid:
// Top: Hero Cam (7 cols) + Aux Cams (5 cols) [h: 7]
// Middle: Drivetrain (6 cols) + GPS & Compass (6 cols) [h: 5] -> All 6 wheels fit with zero clipping!
// Bottom: Diagnostics (6 cols) + IMU (6 cols) [h: 3] -> Full horizon + telemetry fit with zero clipping!
const DEFAULT_LAYOUTS = {
  lg: [
    { i: 'hero_cam', x: 0, y: 0, w: 7, h: 7, minW: 4, minH: 5 },
    { i: 'aux_cams', x: 7, y: 0, w: 5, h: 7, minW: 3, minH: 4 },
    { i: 'drivetrain', x: 0, y: 7, w: 6, h: 5, minW: 4, minH: 4 },
    { i: 'gps', x: 6, y: 7, w: 6, h: 5, minW: 3, minH: 3 },
    { i: 'diagnostics', x: 0, y: 12, w: 6, h: 3, minW: 3, minH: 2 },
    { i: 'imu', x: 6, y: 12, w: 6, h: 3, minW: 3, minH: 2 },
  ],
  md: [
    { i: 'hero_cam', x: 0, y: 0, w: 6, h: 6 },
    { i: 'aux_cams', x: 6, y: 0, w: 4, h: 6 },
    { i: 'drivetrain', x: 0, y: 6, w: 5, h: 5 },
    { i: 'gps', x: 5, y: 6, w: 5, h: 5 },
    { i: 'diagnostics', x: 0, y: 11, w: 5, h: 3 },
    { i: 'imu', x: 5, y: 11, w: 5, h: 3 },
  ],
  sm: [
    { i: 'hero_cam', x: 0, y: 0, w: 6, h: 5 },
    { i: 'aux_cams', x: 0, y: 5, w: 6, h: 5 },
    { i: 'drivetrain', x: 0, y: 10, w: 6, h: 5 },
    { i: 'gps', x: 0, y: 15, w: 6, h: 4 },
    { i: 'diagnostics', x: 0, y: 19, w: 6, h: 3 },
    { i: 'imu', x: 0, y: 22, w: 6, h: 3 },
  ]
};

// Preset 2: Drive Operations Focus
const DRIVE_FOCUS_LAYOUTS = {
  lg: [
    { i: 'hero_cam', x: 0, y: 0, w: 7, h: 6 },
    { i: 'aux_cams', x: 7, y: 0, w: 5, h: 6 },
    { i: 'drivetrain', x: 0, y: 6, w: 8, h: 5 },
    { i: 'gps', x: 8, y: 6, w: 4, h: 5 },
    { i: 'imu', x: 0, y: 11, w: 6, h: 3 },
    { i: 'diagnostics', x: 6, y: 11, w: 6, h: 3 },
  ]
};

// Preset 3: Cam / Scouting Focus
const CAM_FOCUS_LAYOUTS = {
  lg: [
    { i: 'hero_cam', x: 0, y: 0, w: 8, h: 9 },
    { i: 'aux_cams', x: 8, y: 0, w: 4, h: 9 },
    { i: 'drivetrain', x: 0, y: 9, w: 6, h: 4 },
    { i: 'gps', x: 6, y: 9, w: 6, h: 4 },
    { i: 'diagnostics', x: 0, y: 13, w: 6, h: 3 },
    { i: 'imu', x: 6, y: 13, w: 6, h: 3 },
  ]
};

export default function PrimaryOperatorView() {
  const { cameras, activeCameraId, activeCamera, selectCamera } = useRover();
  const { containerRef, width } = useContainerWidth();

  // Load persisted layout or fallback to defaults
  const [layouts, setLayouts] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load saved layout from localStorage:', e);
    }
    return DEFAULT_LAYOUTS;
  });

  const handleLayoutChange = (currentLayout, allLayouts) => {
    setLayouts(allLayouts);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allLayouts));
    } catch (e) {
      // ignore
    }
  };

  const applyPresetLayout = (presetObj) => {
    const updated = { ...layouts, ...presetObj };
    setLayouts(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}
  };

  const handleResetLayout = () => {
    setLayouts(DEFAULT_LAYOUTS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  };

  /**
   * Safe resizer triggered from individual BentoCard header (S, M, L, MAX, Collapse).
   * Generous height allocations prevent any telemetry or wheel data clipping!
   */
  const handleResizePreset = (itemKey, preset) => {
    setLayouts((prevLayouts) => {
      const updated = { ...prevLayouts };
      Object.keys(updated).forEach((bp) => {
        updated[bp] = (updated[bp] || []).map((item) => {
          if (item.i !== itemKey) return item;

          let newW = item.w;
          let newH = item.h;

          if (preset === 'compact') {
            // S (Compact)
            if (itemKey === 'drivetrain') { newW = bp === 'lg' ? 5 : 5; newH = 4; }
            else if (itemKey === 'hero_cam') { newW = bp === 'lg' ? 6 : 6; newH = 6; }
            else if (itemKey === 'aux_cams') { newW = bp === 'lg' ? 4 : 4; newH = 6; }
            else if (itemKey === 'gps') { newW = bp === 'lg' ? 4 : 5; newH = 4; }
            else if (itemKey === 'diagnostics') { newW = bp === 'lg' ? 4 : 5; newH = 3; }
            else if (itemKey === 'imu') { newW = bp === 'lg' ? 3 : 5; newH = 3; }
            else { newW = 4; newH = 3; }
          } else if (preset === 'standard') {
            // M (Standard)
            if (itemKey === 'drivetrain') { newW = bp === 'lg' ? 6 : 5; newH = 5; }
            else if (itemKey === 'hero_cam') { newW = bp === 'lg' ? 7 : 6; newH = 7; }
            else if (itemKey === 'aux_cams') { newW = bp === 'lg' ? 5 : 4; newH = 7; }
            else if (itemKey === 'gps') { newW = bp === 'lg' ? 6 : 5; newH = 5; }
            else if (itemKey === 'diagnostics') { newW = bp === 'lg' ? 6 : 5; newH = 3; }
            else if (itemKey === 'imu') { newW = bp === 'lg' ? 6 : 5; newH = 3; }
            else { newW = 6; newH = 4; }
          } else if (preset === 'wide') {
            // L (Wide)
            if (itemKey === 'drivetrain') { newW = bp === 'lg' ? 8 : 8; newH = 5; }
            else if (itemKey === 'hero_cam') { newW = bp === 'lg' ? 9 : 8; newH = 8; }
            else if (itemKey === 'aux_cams') { newW = bp === 'lg' ? 6 : 6; newH = 8; }
            else if (itemKey === 'gps') { newW = bp === 'lg' ? 8 : 8; newH = 5; }
            else if (itemKey === 'diagnostics') { newW = bp === 'lg' ? 8 : 8; newH = 3; }
            else if (itemKey === 'imu') { newW = bp === 'lg' ? 6 : 6; newH = 3; }
            else { newW = 8; newH = 5; }
          } else if (preset === 'full') {
            // MAX (Full Width)
            newW = bp === 'lg' ? 12 : bp === 'md' ? 10 : 6;
            newH = itemKey === 'drivetrain' ? 5 : itemKey === 'hero_cam' ? 9 : 4;
          } else if (preset === 'collapse') {
            newH = item.h === 1 ? (itemKey === 'drivetrain' ? 5 : 4) : 1;
          }

          return { ...item, w: newW, h: newH };
        });
      });

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const auxiliaryCameras = cameras.filter(
    (c) => (c.path || c.id) !== activeCameraId
  );

  return (
    <div className="w-full flex flex-col gap-3 font-mono select-none">
      {/* Top Controls: Layout Resizers & Preset Switcher */}
      <div className="flex flex-wrap justify-between items-center px-1 gap-2 bg-[var(--color-card-bg)] p-2 rounded-2xl border border-[var(--color-card-border)] backdrop-blur-md transition-colors duration-300">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider flex items-center gap-1 mr-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--color-accent-text)]" />
            GRID PRESETS:
          </span>
          <button
            onClick={() => applyPresetLayout(DEFAULT_LAYOUTS)}
            className="px-2.5 py-1 rounded-lg bg-[#05070e] border border-slate-800 hover:border-[var(--color-accent)] text-slate-300 hover:text-[var(--color-accent-text)] text-[10px] font-bold transition-all"
          >
            BALANCED HUD
          </button>
          <button
            onClick={() => applyPresetLayout(DRIVE_FOCUS_LAYOUTS)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#05070e] border border-slate-800 hover:border-amber-500 text-slate-300 hover:text-amber-400 text-[10px] font-bold transition-all"
          >
            <Truck className="w-3 h-3 text-amber-400" />
            DRIVE FOCUS
          </button>
          <button
            onClick={() => applyPresetLayout(CAM_FOCUS_LAYOUTS)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#05070e] border border-slate-800 hover:border-[var(--color-accent)] text-slate-300 hover:text-[var(--color-accent-text)] text-[10px] font-bold transition-all"
          >
            <Video className="w-3 h-3 text-[var(--color-accent-text)]" />
            CAM FOCUS
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden lg:inline text-[9.5px] text-slate-500 font-bold tracking-wider">
            DRAG HEADERS TO MOVE • [S][M][L][MAX] ON CARDS TO RESIZE
          </span>
          <button
            onClick={handleResetLayout}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-rose-500 text-slate-400 hover:text-rose-400 text-[10px] font-bold transition-all"
            title="Reset to default Cockpit grid dimensions"
          >
            <RotateCcw className="w-3 h-3" />
            <span>RESET</span>
          </button>
        </div>
      </div>

      {/* Draggable & Resizable Grid Container */}
      <div ref={containerRef} className="w-full">
        {width > 0 && (
          <ResponsiveGridLayout
            width={width}
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={65}
            dragHandle=".bento-drag-handle"
            onLayoutChange={handleLayoutChange}
            isDraggable={true}
            isResizable={true}
            margin={[14, 14]}
          >
            {/* 1. HERO CAMERA (55% Width default) */}
            <div key="hero_cam" className="h-full w-full">
              <BentoCard
                title={activeCamera?.name || 'Navigation Feed'}
                subtitle="[HERO_STREAM]"
                badge={activeCamera?.status?.toUpperCase() || 'ONLINE'}
                badgeColor={activeCamera?.status === 'online' ? 'green' : 'amber'}
                noPadding={true}
                className="h-full w-full"
                onResizePreset={(preset) => handleResizePreset('hero_cam', preset)}
                headerAction={
                  <div className="flex items-center gap-1.5 text-[9px] text-cyan-400 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span>ACTIVE</span>
                  </div>
                }
              >
                <CameraFrame
                  isHero={true}
                  cameraName={activeCamera?.name || 'Navigation Camera'}
                  streamPath={activeCamera?.path || activeCamera?.id || 'nav_cam'}
                />
              </BentoCard>
            </div>

            {/* 2. AUXILIARY CAMERAS DECK (45% Width default, larger frames) */}
            <div key="aux_cams" className="h-full w-full">
              <BentoCard
                title="Secondary Streams Deck"
                subtitle="[00_FEEDS]"
                badge={`${cameras.length} CHANNELS`}
                badgeColor="cyan"
                className="h-full w-full"
                onResizePreset={(preset) => handleResizePreset('aux_cams', preset)}
              >
                <div className="flex flex-col h-full justify-between gap-2 overflow-hidden">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider shrink-0">
                    CLICK ANY STREAM TO SWAP INTO HERO VIEWPORT:
                  </span>

                  {auxiliaryCameras.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2.5 overflow-y-auto flex-1 pr-1">
                      {auxiliaryCameras.map((cam) => (
                        <div key={cam.path || cam.id} className="relative group">
                          <CameraFrame
                            isHero={false}
                            cameraName={cam.name}
                            streamPath={cam.path || cam.id}
                            onSelect={selectCamera}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-4 border border-dashed border-slate-800 rounded-2xl text-center text-slate-500 text-xs">
                      <Video className="w-8 h-8 text-slate-600 mb-1.5" />
                      <span className="font-bold text-slate-300">NO SECONDARY STREAMS</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">
                        MediaMTX will auto-publish additional cameras.
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[9px] text-slate-400 border-t border-slate-800/80 pt-2 shrink-0 font-bold">
                    <span>WHEP LOW-LATENCY</span>
                    <span className="text-cyan-400">ACTIVE: {activeCameraId}</span>
                  </div>
                </div>
              </BentoCard>
            </div>

            {/* 3. DRIVETRAIN (COMPACT PHYSICAL CHASSIS - 6 MOTORS UNCLIPPED) */}
            <div key="drivetrain" className="h-full w-full">
              <DriveMotorsPanel
                onResizePreset={(preset) => handleResizePreset('drivetrain', preset)}
              />
            </div>

            {/* 4. GPS & NAVIGATION (SPEED + COMPASS + SATS UNCLIPPED) */}
            <div key="gps" className="h-full w-full">
              <GpsPanel
                onResizePreset={(preset) => handleResizePreset('gps', preset)}
              />
            </div>

            {/* 5. COMMS & TELEMETRY RATE */}
            <div key="diagnostics" className="h-full w-full">
              <SystemDiagnostics
                onResizePreset={(preset) => handleResizePreset('diagnostics', preset)}
              />
            </div>

            {/* 6. ATTITUDE & GYRO (COMPACT HORIZON) */}
            <div key="imu" className="h-full w-full">
              <ImuPanel
                onResizePreset={(preset) => handleResizePreset('imu', preset)}
              />
            </div>
          </ResponsiveGridLayout>
        )}
      </div>

      {/* Docked Control & E-Stop Action Bar */}
      <ActionBar />
    </div>
  );
}
