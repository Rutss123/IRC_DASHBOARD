import React, { useState } from 'react';
import { ResponsiveGridLayout, useContainerWidth } from 'react-grid-layout';
import { useRover } from '../context/RoverContext';
import BentoCard from '../components/common/BentoCard';
import CameraFrame from '../components/video/CameraFrame';
import SciencePanel from '../components/system/SciencePanel';
import ActionBar from '../components/controls/ActionBar';
import { Beaker, Flame, Leaf, Droplet, RotateCcw, Video, SlidersHorizontal } from 'lucide-react';

const STORAGE_KEY = 'universo_science_layout_v1';

const DEFAULT_LAYOUTS = {
  lg: [
    { i: 'science_cam', x: 0, y: 0, w: 7, h: 7, minW: 4, minH: 4 },
    { i: 'bio_hazard', x: 7, y: 0, w: 5, h: 4, minW: 3, minH: 3 },
    { i: 'context_cams', x: 7, y: 4, w: 5, h: 3, minW: 3, minH: 2 },
    { i: 'science_panel', x: 0, y: 7, w: 12, h: 5, minW: 6, minH: 3 },
  ],
  md: [
    { i: 'science_cam', x: 0, y: 0, w: 6, h: 6 },
    { i: 'bio_hazard', x: 6, y: 0, w: 4, h: 3 },
    { i: 'context_cams', x: 6, y: 3, w: 4, h: 3 },
    { i: 'science_panel', x: 0, y: 6, w: 10, h: 5 },
  ],
  sm: [
    { i: 'science_cam', x: 0, y: 0, w: 6, h: 5 },
    { i: 'bio_hazard', x: 0, y: 5, w: 6, h: 3 },
    { i: 'context_cams', x: 0, y: 8, w: 6, h: 3 },
    { i: 'science_panel', x: 0, y: 11, w: 6, h: 5 },
  ]
};

const OPTICS_FOCUS_LAYOUTS = {
  lg: [
    { i: 'science_cam', x: 0, y: 0, w: 8, h: 8 },
    { i: 'bio_hazard', x: 8, y: 0, w: 4, h: 4 },
    { i: 'context_cams', x: 8, y: 4, w: 4, h: 4 },
    { i: 'science_panel', x: 0, y: 8, w: 12, h: 5 },
  ]
};

const SENSOR_FOCUS_LAYOUTS = {
  lg: [
    { i: 'science_cam', x: 0, y: 0, w: 5, h: 7 },
    { i: 'bio_hazard', x: 5, y: 0, w: 7, h: 4 },
    { i: 'context_cams', x: 5, y: 4, w: 7, h: 3 },
    { i: 'science_panel', x: 0, y: 7, w: 12, h: 5 },
  ]
};

export default function LifeScienceView() {
  const { cameras, activeCameraId, selectCamera, telemetry, changeMode, roverMode } = useRover();
  const { containerRef, width } = useContainerWidth();

  const [layouts, setLayouts] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_LAYOUTS;
  });

  const handleLayoutChange = (currentLayout, allLayouts) => {
    setLayouts(allLayouts);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allLayouts));
    } catch (e) {}
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

  const handleResizePreset = (itemKey, preset) => {
    setLayouts((prevLayouts) => {
      const updated = { ...prevLayouts };
      Object.keys(updated).forEach((bp) => {
        updated[bp] = (updated[bp] || []).map((item) => {
          if (item.i !== itemKey) return item;
          let newW = item.w;
          let newH = item.h;

          if (preset === 'compact') {
            if (itemKey === 'science_cam') { newW = 5; newH = 5; }
            else if (itemKey === 'bio_hazard') { newW = 4; newH = 3; }
            else if (itemKey === 'context_cams') { newW = 3; newH = 2; }
            else { newW = 6; newH = 3; }
          } else if (preset === 'standard') {
            if (itemKey === 'science_cam') { newW = 7; newH = 7; }
            else if (itemKey === 'bio_hazard') { newW = 5; newH = 4; }
            else if (itemKey === 'context_cams') { newW = 5; newH = 3; }
            else { newW = 12; newH = 5; }
          } else if (preset === 'wide') {
            if (itemKey === 'science_cam') { newW = 9; newH = 8; }
            else if (itemKey === 'bio_hazard') { newW = 7; newH = 5; }
            else if (itemKey === 'context_cams') { newW = 7; newH = 4; }
            else { newW = 12; newH = 6; }
          } else if (preset === 'full') {
            newW = 12;
            newH = itemKey === 'science_cam' ? 8 : 5;
          } else if (preset === 'collapse') {
            newH = item.h === 1 ? 4 : 1;
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

  // Try to find science cam, or fallback
  const scienceCam = cameras.find((c) => c.path === 'science_cam' || c.id === 'science_cam') || cameras[0];
  const isScienceMode = roverMode === 'SCIENCE';

  const sensors = telemetry.science || {
    temp: 0,
    humidity: 0,
    pressure: 0,
    co: 0,
    ch4: 0,
    airQuality: 'SAFE',
    soilN: 0,
    soilP: 0,
    soilK: 0,
    soilPh: 7.0,
    soilMoisture: 0
  };

  return (
    <div className="w-full flex flex-col gap-3 font-mono select-none">
      {/* Top Controls: Layout Resizers & Preset Switcher */}
      <div className="flex flex-wrap justify-between items-center px-1 gap-2 bg-[var(--color-card-bg)] p-2 rounded-2xl border border-[var(--color-card-border)] backdrop-blur-md transition-colors duration-300">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider flex items-center gap-1 mr-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--color-accent-text)]" />
            SCIENCE HUD PRESETS:
          </span>
          <button
            onClick={() => applyPresetLayout(DEFAULT_LAYOUTS)}
            className="px-2.5 py-1 rounded-lg bg-[#05070e] border border-slate-800 hover:border-[var(--color-accent)] text-slate-300 hover:text-[var(--color-accent-text)] text-[10px] font-bold transition-all"
          >
            BALANCED LAB (60/40)
          </button>
          <button
            onClick={() => applyPresetLayout(OPTICS_FOCUS_LAYOUTS)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#05070e] border border-slate-800 hover:border-[var(--color-accent)] text-slate-300 hover:text-[var(--color-accent-text)] text-[10px] font-bold transition-all"
          >
            <Video className="w-3 h-3 text-[var(--color-accent-text)]" />
            MICROSCOPE FOCUS
          </button>
          <button
            onClick={() => applyPresetLayout(SENSOR_FOCUS_LAYOUTS)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#05070e] border border-slate-800 hover:border-emerald-500 text-slate-300 hover:text-emerald-400 text-[10px] font-bold transition-all"
          >
            <Beaker className="w-3 h-3 text-emerald-400" />
            BIO-MATRIX FOCUS
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetLayout}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#05070e] border border-slate-800 hover:border-rose-500 text-slate-400 hover:text-rose-400 text-[10px] font-bold transition-all"
            title="Reset science layout"
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
            {/* 1. MICROSCOPE / SCIENCE CAMERA */}
            <div key="science_cam" className="h-full w-full">
              <BentoCard
                title={scienceCam?.name || 'Science / Microscope Feed'}
                subtitle="[SCIENCE_OPTICS]"
                badge={isScienceMode ? 'SCIENCE ACTIVE' : 'STANDBY'}
                badgeColor={isScienceMode ? 'amber' : 'slate'}
                noPadding={true}
                className="h-full w-full"
                onResizePreset={(preset) => handleResizePreset('science_cam', preset)}
                headerAction={
                  <button
                    onClick={() => changeMode('SCIENCE')}
                    className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all border ${
                      isScienceMode
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-amber-400'
                    }`}
                  >
                    {isScienceMode ? 'ENGAGED' : 'ENGAGE SCIENCE MODE'}
                  </button>
                }
              >
                <CameraFrame
                  isHero={true}
                  cameraName={scienceCam?.name || 'Science Cam'}
                  streamPath={scienceCam?.path || scienceCam?.id || 'science_cam'}
                />
              </BentoCard>
            </div>

            {/* 2. REAL-TIME CHEMISTRY & GAS RISK MATRIX */}
            <div key="bio_hazard" className="h-full w-full">
              <BentoCard
                title="Bio-Atmospheric Risk Matrix"
                subtitle="[BIO_HAZARD]"
                badge={sensors.airQuality || 'SAFE'}
                badgeColor={sensors.airQuality === 'SAFE' ? 'green' : 'amber'}
                isStale={telemetry.is_stale}
                className="h-full w-full"
                onResizePreset={(preset) => handleResizePreset('bio_hazard', preset)}
              >
                <div className="flex flex-col justify-between gap-3 h-full">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-2.5 bg-[#050814]/80 border border-slate-800 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-cyan-400" /> CO MONOXIDE
                      </span>
                      <div className="text-xl md:text-2xl font-black text-slate-100 mt-1">
                        {sensors.co ?? 0} <span className="text-xs text-slate-500 font-normal">ppm</span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-[#050814]/80 border border-slate-800 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-amber-500" /> CH4 METHANE
                      </span>
                      <div className="text-xl md:text-2xl font-black text-slate-100 mt-1">
                        {sensors.ch4 ?? 0} <span className="text-xs text-slate-500 font-normal">ppm</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="p-2.5 bg-[#050814]/80 border border-slate-800 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1.5">
                        <Leaf className="w-3.5 h-3.5 text-emerald-400" /> SOIL pH
                      </span>
                      <div className="text-xl md:text-2xl font-black text-emerald-400 mt-1">
                        {Number(sensors.soilPh || 7.0).toFixed(1)}{' '}
                        <span className="text-xs text-slate-500 font-normal">pH</span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-[#050814]/80 border border-slate-800 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1.5">
                        <Droplet className="w-3.5 h-3.5 text-cyan-400" /> MOISTURE
                      </span>
                      <div className="text-xl md:text-2xl font-black text-cyan-400 mt-1">
                        {sensors.soilMoisture ?? 0}{' '}
                        <span className="text-xs text-slate-500 font-normal">%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold border-t border-slate-850 pt-2">
                    <span>SPECTROMETRY: READY</span>
                    <span>SAMPLE DRILL: STOWED</span>
                  </div>
                </div>
              </BentoCard>
            </div>

            {/* 3. FIELD CONTEXT CAMERAS */}
            <div key="context_cams" className="h-full w-full">
              <BentoCard
                title="Field Context Cameras"
                subtitle="[OPTICS_SELECT]"
                badge={`${cameras.length} CHANNELS`}
                badgeColor="cyan"
                className="h-full w-full"
                onResizePreset={(preset) => handleResizePreset('context_cams', preset)}
              >
                <div className="grid grid-cols-2 gap-2 overflow-y-auto h-full pr-1">
                  {cameras.map((cam) => (
                    <div
                      key={cam.path || cam.id}
                      onClick={() => selectCamera(cam.path || cam.id)}
                      className="p-2 bg-[#050814]/90 border border-slate-800 hover:border-amber-500/60 rounded-xl cursor-pointer transition-all flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-slate-200 truncate">{cam.name}</span>
                      <span className="text-[9px] text-amber-400 uppercase font-black">VIEW ↗</span>
                    </div>
                  ))}
                </div>
              </BentoCard>
            </div>

            {/* 4. COMPREHENSIVE SCIENCE & SPECTROMETRY PANEL */}
            <div key="science_panel" className="h-full w-full">
              <SciencePanel
                onResizePreset={(preset) => handleResizePreset('science_panel', preset)}
              />
            </div>
          </ResponsiveGridLayout>
        )}
      </div>

      {/* Docked Control Bar */}
      <ActionBar />
    </div>
  );
}
