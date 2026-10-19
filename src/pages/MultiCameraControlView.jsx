import React, { useState } from 'react';
import { useRover } from '../context/RoverContext';
import { useNavigate } from 'react-router-dom';
import CameraFrame from '../components/video/CameraFrame';
import ActionBar from '../components/controls/ActionBar';
import {
  LayoutGrid,
  List,
  Maximize2,
  Minimize2,
  ChevronLeft,
  Video,
  Grid3X3,
  Columns2,
  Columns3,
  Columns4,
  SlidersHorizontal
} from 'lucide-react';

/**
 * MultiCameraControlView - Multi-Camera Feed Deck with Interactive Resizing.
 * Automatically displays all active / discovered cameras from MediaMTX
 * in curvy, high-contrast Bento boxes with customizable grid density.
 */
export default function MultiCameraControlView() {
  const navigate = useNavigate();
  const { cameras, selectCamera } = useRover();

  // Grid density resizer state: 'quad' (2 cols), 'matrix' (3 cols), 'wide' (4 cols), 'single' (1 col), 'list'
  const [gridColumns, setGridColumns] = useState('quad'); 
  const [maximizedCamId, setMaximizedCamId] = useState(null);

  const handleToggleMaximize = (camId) => {
    setMaximizedCamId((prev) => (prev === camId ? null : camId));
  };

  const getGridClass = () => {
    switch (gridColumns) {
      case 'single':
        return 'grid-cols-1 max-w-4xl mx-auto';
      case 'matrix':
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case 'wide':
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
      case 'list':
        return 'grid-cols-1';
      case 'quad':
      default:
        return 'grid-cols-1 md:grid-cols-2';
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-3.5 overflow-hidden select-none font-mono">
      {/* 1. TOP TACTICAL TITLE & RESIZER BAR */}
      <div className="w-full bg-[var(--color-card-bg)] border border-[var(--color-card-border)] rounded-2xl md:rounded-3xl p-3 px-5 flex flex-wrap justify-between items-center text-xs shrink-0 shadow-xl backdrop-blur-md gap-3 transition-colors duration-300">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-800 hover:border-[var(--color-accent)] text-slate-300 hover:text-[var(--color-accent-text)] bg-[#05070e] font-bold uppercase tracking-wider transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>COCKPIT HUD</span>
        </button>

        <h1 className="text-xs md:text-sm font-black tracking-widest text-slate-100 uppercase m-0 flex items-center gap-2.5">
          <Video className="w-4 h-4 text-[var(--color-accent-text)]" />
          MULTI-STREAM MATRIX ({cameras.length} CHANNELS)
        </h1>

        {/* Matrix Grid Resizers */}
        <div className="flex items-center gap-2 bg-[#05070e] p-1 border border-slate-800 rounded-xl">
          <span className="text-[9px] text-slate-500 font-black uppercase px-1.5 hidden sm:inline">
            GRID SIZE:
          </span>
          <button
            onClick={() => {
              setGridColumns('single');
              setMaximizedCamId(null);
            }}
            className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all ${
              gridColumns === 'single' && !maximizedCamId
                ? 'bg-[var(--color-accent-bg)] text-[var(--color-accent-text)] border border-[var(--color-accent-border)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="1 Column (Focus)"
          >
            1x1
          </button>
          <button
            onClick={() => {
              setGridColumns('quad');
              setMaximizedCamId(null);
            }}
            className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all ${
              gridColumns === 'quad' && !maximizedCamId
                ? 'bg-[var(--color-accent-bg)] text-[var(--color-accent-text)] border border-[var(--color-accent-border)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="2 Columns (Quad)"
          >
            2x2
          </button>
          <button
            onClick={() => {
              setGridColumns('matrix');
              setMaximizedCamId(null);
            }}
            className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all ${
              gridColumns === 'matrix' && !maximizedCamId
                ? 'bg-[var(--color-accent-bg)] text-[var(--color-accent-text)] border border-[var(--color-accent-border)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="3 Columns (Matrix)"
          >
            3x3
          </button>
          <button
            onClick={() => {
              setGridColumns('wide');
              setMaximizedCamId(null);
            }}
            className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all ${
              gridColumns === 'wide' && !maximizedCamId
                ? 'bg-[var(--color-accent-bg)] text-[var(--color-accent-text)] border border-[var(--color-accent-border)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="4 Columns (Wide Matrix)"
          >
            4x4
          </button>
          <button
            onClick={() => {
              setGridColumns('list');
              setMaximizedCamId(null);
            }}
            className={`p-1.5 rounded-lg transition-colors ${
              gridColumns === 'list' && !maximizedCamId
                ? 'bg-[var(--color-accent-bg)] text-[var(--color-accent-text)] border border-[var(--color-accent-border)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="List Feed Rows"
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. DYNAMIC CAMERA GRID */}
      <div className="flex-1 overflow-y-auto pr-1">
        {maximizedCamId ? (
          /* Maximized Cinematic Mode with Curvy Borders */
          <div className="relative w-full h-[580px] rounded-3xl overflow-hidden bg-slate-950 flex flex-col border-2 border-cyan-500/50 shadow-2xl">
            {(() => {
              const cam = cameras.find((c) => (c.path || c.id) === maximizedCamId) || cameras[0];
              return (
                <CameraFrame
                  isHero={true}
                  cameraName={cam.name}
                  streamPath={cam.path || cam.id}
                />
              );
            })()}
            <button
              onClick={() => setMaximizedCamId(null)}
              className="absolute top-12 right-4 z-30 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950/90 border border-cyan-500 text-cyan-400 text-xs hover:bg-cyan-950/40 transition-all font-black shadow-2xl"
            >
              <Minimize2 className="w-4 h-4" />
              MINIMIZE STREAM
            </button>
          </div>
        ) : (
          /* Dynamic Grid Matrix (Customizable resizer columns) */
          <div className={`grid gap-4 ${getGridClass()}`}>
            {cameras.map((cam) => {
              const streamKey = cam.path || cam.id;
              return (
                <div
                  key={streamKey}
                  className="relative group rounded-2xl md:rounded-3xl overflow-hidden flex flex-col bg-slate-950 border border-slate-700/60 hover:border-cyan-500/50 shadow-xl transition-all"
                >
                  <CameraFrame
                    isHero={false}
                    cameraName={cam.name}
                    streamPath={streamKey}
                    onSelect={(id) => {
                      selectCamera(id);
                      navigate('/');
                    }}
                  />
                  <div className="absolute top-10 right-3 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleToggleMaximize(streamKey)}
                      className="p-2 rounded-xl bg-slate-950/90 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-400 transition-all shadow-xl"
                      title="Maximize feed"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. FOOTER CONTROL BAR */}
      <ActionBar />
    </div>
  );
}