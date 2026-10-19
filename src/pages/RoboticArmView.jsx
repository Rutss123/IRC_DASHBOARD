import React, { useState } from 'react';
import { ResponsiveGridLayout, useContainerWidth } from 'react-grid-layout';
import { useRover } from '../context/RoverContext';
import BentoCard from '../components/common/BentoCard';
import CameraFrame from '../components/video/CameraFrame';
import ArmMotorsPanel from '../components/telemetry/ArmMotorsPanel';
import ActionBar from '../components/controls/ActionBar';
import { Bot, Crosshair, RotateCcw, Video, SlidersHorizontal } from 'lucide-react';

const STORAGE_KEY = 'universo_arm_layout_v1';

const DEFAULT_LAYOUTS = {
  lg: [
    { i: 'arm_cam', x: 0, y: 0, w: 7, h: 7, minW: 4, minH: 4 },
    { i: 'ik_pose', x: 7, y: 0, w: 5, h: 4, minW: 3, minH: 3 },
    { i: 'alt_cams', x: 7, y: 4, w: 5, h: 3, minW: 3, minH: 2 },
    { i: 'arm_motors', x: 0, y: 7, w: 12, h: 4, minW: 6, minH: 3 },
  ],
  md: [
    { i: 'arm_cam', x: 0, y: 0, w: 6, h: 6 },
    { i: 'ik_pose', x: 6, y: 0, w: 4, h: 3 },
    { i: 'alt_cams', x: 6, y: 3, w: 4, h: 3 },
    { i: 'arm_motors', x: 0, y: 6, w: 10, h: 4 },
  ],
  sm: [
    { i: 'arm_cam', x: 0, y: 0, w: 6, h: 5 },
    { i: 'ik_pose', x: 0, y: 5, w: 6, h: 3 },
    { i: 'alt_cams', x: 0, y: 8, w: 6, h: 3 },
    { i: 'arm_motors', x: 0, y: 11, w: 6, h: 4 },
  ]
};

const CAM_FOCUS_LAYOUTS = {
  lg: [
    { i: 'arm_cam', x: 0, y: 0, w: 8, h: 8 },
    { i: 'ik_pose', x: 8, y: 0, w: 4, h: 4 },
    { i: 'alt_cams', x: 8, y: 4, w: 4, h: 4 },
    { i: 'arm_motors', x: 0, y: 8, w: 12, h: 4 },
  ]
};

const KINEMATICS_FOCUS_LAYOUTS = {
  lg: [
    { i: 'arm_cam', x: 0, y: 0, w: 5, h: 7 },
    { i: 'ik_pose', x: 5, y: 0, w: 7, h: 4 },
    { i: 'alt_cams', x: 5, y: 4, w: 7, h: 3 },
    { i: 'arm_motors', x: 0, y: 7, w: 12, h: 4 },
  ]
};

export default function RoboticArmView() {
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
            if (itemKey === 'arm_cam') { newW = 5; newH = 5; }
            else if (itemKey === 'ik_pose') { newW = 4; newH = 3; }
            else if (itemKey === 'alt_cams') { newW = 3; newH = 2; }
            else { newW = 6; newH = 3; }
          } else if (preset === 'standard') {
            if (itemKey === 'arm_cam') { newW = 7; newH = 7; }
            else if (itemKey === 'ik_pose') { newW = 5; newH = 4; }
            else if (itemKey === 'alt_cams') { newW = 5; newH = 3; }
            else { newW = 12; newH = 4; }
          } else if (preset === 'wide') {
            if (itemKey === 'arm_cam') { newW = 9; newH = 8; }
            else if (itemKey === 'ik_pose') { newW = 7; newH = 5; }
            else if (itemKey === 'alt_cams') { newW = 7; newH = 4; }
            else { newW = 12; newH = 5; }
          } else if (preset === 'full') {
            newW = 12;
            newH = itemKey === 'arm_cam' ? 8 : 4;
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

  // Try to find arm cam, or fallback to active camera
  const armCam = cameras.find((c) => c.path === 'arm_cam' || c.id === 'arm_cam') || cameras[0];
  const isArmMode = roverMode === 'ARM';

  return (
    <div className="w-full flex flex-col gap-3 font-mono select-none">
      {/* Top Controls: Layout Resizers & Preset Switcher */}
      <div className="flex flex-wrap justify-between items-center px-1 gap-2 bg-[var(--color-card-bg)] p-2 rounded-2xl border border-[var(--color-card-border)] backdrop-blur-md transition-colors duration-300">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider flex items-center gap-1 mr-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--color-accent-text)]" />
            ARM HUD PRESETS:
          </span>
          <button
            onClick={() => applyPresetLayout(DEFAULT_LAYOUTS)}
            className="px-2.5 py-1 rounded-lg bg-[#05070e] border border-slate-800 hover:border-[var(--color-accent)] text-slate-300 hover:text-[var(--color-accent-text)] text-[10px] font-bold transition-all"
          >
            BALANCED (60/40)
          </button>
          <button
            onClick={() => applyPresetLayout(CAM_FOCUS_LAYOUTS)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#05070e] border border-slate-800 hover:border-[var(--color-accent)] text-slate-300 hover:text-[var(--color-accent-text)] text-[10px] font-bold transition-all"
          >
            <Video className="w-3 h-3 text-[var(--color-accent-text)]" />
            OPTICS FOCUS
          </button>
          <button
            onClick={() => applyPresetLayout(KINEMATICS_FOCUS_LAYOUTS)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#05070e] border border-slate-800 hover:border-amber-500 text-slate-300 hover:text-amber-400 text-[10px] font-bold transition-all"
          >
            <Bot className="w-3 h-3 text-amber-400" />
            KINEMATICS FOCUS
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetLayout}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#05070e] border border-slate-800 hover:border-rose-500 text-slate-400 hover:text-rose-400 text-[10px] font-bold transition-all"
            title="Reset arm layout"
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
            {/* 1. ROBOTIC ARM CAMERA */}
            <div key="arm_cam" className="h-full w-full">
              <BentoCard
                title={armCam?.name || 'Robotic Arm Cam'}
                subtitle="[ARM_FEED]"
                badge={isArmMode ? 'ARM ACTIVE' : 'STANDBY'}
                badgeColor={isArmMode ? 'cyan' : 'slate'}
                noPadding={true}
                className="h-full w-full"
                onResizePreset={(preset) => handleResizePreset('arm_cam', preset)}
                headerAction={
                  <button
                    onClick={() => changeMode('ARM')}
                    className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all border ${
                      isArmMode
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-cyan-400'
                    }`}
                  >
                    {isArmMode ? 'ENGAGED' : 'ENGAGE ARM MODE'}
                  </button>
                }
              >
                <CameraFrame
                  isHero={true}
                  cameraName={armCam?.name || 'Robotic Arm Cam'}
                  streamPath={armCam?.path || armCam?.id || 'arm_cam'}
                />
              </BentoCard>
            </div>

            {/* 2. INVERSE KINEMATICS & POSE */}
            <div key="ik_pose" className="h-full w-full">
              <BentoCard
                title="Inverse Kinematics & Pose"
                subtitle="[IK_SOLVER]"
                badge="NOMINAL"
                badgeColor="green"
                className="h-full w-full"
                onResizePreset={(preset) => handleResizePreset('ik_pose', preset)}
              >
                <div className="flex flex-col justify-between gap-3 h-full">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 bg-[#050814]/80 border border-slate-800 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">END EFFECTOR X</span>
                      <div className="text-xl font-black text-cyan-400 mt-1">
                        420.5 <span className="text-xs text-slate-500">mm</span>
                      </div>
                    </div>
                    <div className="p-2.5 bg-[#050814]/80 border border-slate-800 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">END EFFECTOR Y</span>
                      <div className="text-xl font-black text-cyan-400 mt-1">
                        -85.2 <span className="text-xs text-slate-500">mm</span>
                      </div>
                    </div>
                    <div className="p-2.5 bg-[#050814]/80 border border-slate-800 rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">END EFFECTOR Z</span>
                      <div className="text-xl font-black text-cyan-400 mt-1">
                        190.0 <span className="text-xs text-slate-500">mm</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-[#050814]/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Crosshair className="w-4 h-4 text-amber-500" />
                      <span className="font-bold text-slate-300">GRIPPER APERTURE:</span>
                    </div>
                    <span className="text-base font-black text-amber-400">85 mm (OPEN)</span>
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold border-t border-slate-850 pt-2">
                    <span>INTERLOCK: SECURE</span>
                    <span>TORQUE SAFETY: 100%</span>
                  </div>
                </div>
              </BentoCard>
            </div>

            {/* 3. ALTERNATIVE ANGLES SWITCHER */}
            <div key="alt_cams" className="h-full w-full">
              <BentoCard
                title="Alternative Angles"
                subtitle="[FEED_SWAP]"
                badge={`${cameras.length} AVAILABLE`}
                badgeColor="purple"
                className="h-full w-full"
                onResizePreset={(preset) => handleResizePreset('alt_cams', preset)}
              >
                <div className="grid grid-cols-2 gap-2 overflow-y-auto h-full pr-1">
                  {cameras.map((cam) => (
                    <div
                      key={cam.path || cam.id}
                      onClick={() => selectCamera(cam.path || cam.id)}
                      className="p-2 bg-[#050814]/90 border border-slate-800 hover:border-cyan-500/60 rounded-xl cursor-pointer transition-all flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-slate-200 truncate">{cam.name}</span>
                      <span className="text-[9px] text-cyan-400 uppercase font-black">VIEW ↗</span>
                    </div>
                  ))}
                </div>
              </BentoCard>
            </div>

            {/* 4. DEDICATED 6-AXIS MANIPULATOR PANEL */}
            <div key="arm_motors" className="h-full w-full">
              <ArmMotorsPanel
                onResizePreset={(preset) => handleResizePreset('arm_motors', preset)}
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
