import React, { useState } from 'react';
import { useRover } from '../context/RoverContext';
import CameraFrame from '../components/video/CameraFrame';
import ActionBar from '../components/controls/ActionBar';
import { 
  LayoutGrid, 
  List, 
  Maximize2, 
  Minimize2, 
  Video, 
  Radio, 
  Camera,
  Activity,
  Play,
  Square
} from 'lucide-react';

export default function MultiCameraControlView() {
  const { cameras, multiCamLayout, setMultiCamLayout } = useRover();
  
  // Track Enlarged Camera stream
  const [maximizedCamId, setMaximizedCamId] = useState(null);

  // Active feeds limit: supports 1 to 8 cameras
  const [activeFeedCount, setActiveFeedCount] = useState(8);

  // Global recording state
  const [isGlobalRecording, setIsGlobalRecording] = useState(false);

  const handleToggleMaximize = (camId) => {
    if (maximizedCamId === camId) {
      setMaximizedCamId(null);
    } else {
      setMaximizedCamId(camId);
    }
  };

  // Slice the cameras array dynamically based on the chosen feed count
  const visibleCameras = cameras.slice(0, activeFeedCount);

  // Map columns based on count for the responsive grid layout
  const getGridColsClass = (count) => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-1 md:grid-cols-2';
    if (count === 4) return 'grid-cols-1 md:grid-cols-2';
    if (count === 6) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
  };

  return (
    <div className="flex-1 flex flex-col gap-4 overflow-hidden select-none font-mono">
      
      {/* 1. TOP TACTICAL CONTROL HEADER */}
      <div className="w-full bg-[#0b0f19]/60 border border-space-800 rounded-md p-3.5 flex flex-col md:flex-row justify-between items-center gap-3 font-mono text-[10px] shrink-0">
        
        {/* Left: Section Title */}
        <h1 className="text-sm font-bold tracking-widest text-slate-100 uppercase m-0 flex items-center gap-2">
          <Video className="w-4 h-4 text-cyber-orange animate-pulse" />
          <span>MULTI-CAMERA STREAM RECEIVER</span>
        </h1>

        {/* Center: Controls panel */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Feed count selector (Supports 1-8 cameras) */}
          <div className="flex bg-[#060608]/85 p-0.5 border border-space-850 rounded items-center gap-1">
            <span className="text-[7.5px] text-slate-500 font-bold px-2 uppercase">FEEDS:</span>
            {[1, 2, 4, 6, 8].map(count => (
              <button
                key={count}
                onClick={() => { setActiveFeedCount(count); setMaximizedCamId(null); }}
                className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase transition-all duration-200 ${
                  activeFeedCount === count 
                    ? 'bg-cyber-amber/15 text-cyber-amber border border-cyber-amber/25' 
                    : 'text-slate-500 hover:text-slate-350'
                }`}
              >
                {count}
              </button>
            ))}
          </div>

          {/* Global Recording Toggle */}
          <button
            onClick={() => setIsGlobalRecording(!isGlobalRecording)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded border font-black uppercase transition-all duration-200 ${
              isGlobalRecording 
                ? 'bg-cyber-red/15 text-cyber-red border-cyber-red/35 shadow-[0_0_10px_rgba(239,68,68,0.15)] animate-pulse' 
                : 'bg-[#060608]/40 border-space-850 text-slate-400 hover:border-cyber-red/40 hover:text-cyber-red'
            }`}
          >
            {isGlobalRecording ? (
              <>
                <Square className="w-3 h-3 fill-current" />
                <span>STOP REC</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span>REC ALL</span>
              </>
            )}
          </button>

          {/* Grid/List Toggles */}
          <div className="flex bg-[#060608]/85 p-0.5 border border-space-850 rounded gap-1">
            <button
              onClick={() => { setMultiCamLayout('grid'); setMaximizedCamId(null); }}
              className={`p-1.5 rounded transition-colors ${
                multiCamLayout === 'grid' && !maximizedCamId ? 'bg-cyber-orange/15 text-cyber-orange' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Grid Layout Matrix"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => { setMultiCamLayout('list'); setMaximizedCamId(null); }}
              className={`p-1.5 rounded transition-colors ${
                multiCamLayout === 'list' && !maximizedCamId ? 'bg-cyber-orange/15 text-cyber-orange' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="List Layout Rows"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>

      {/* 2. DYNAMIC GRID/LIST CAMERA INGEST ARRAY */}
      <div className="flex-1 overflow-y-auto pr-1">
        {maximizedCamId ? (
          /* Maximized stream view */
          <div className="relative w-full h-[520px] rounded-lg overflow-hidden bg-space-950 flex flex-col">
            <CameraFrame 
              camera={{
                ...cameras.find(c => c.id === maximizedCamId),
                isRecording: isGlobalRecording
              }} 
              isMinified={false} 
            />
            <button
              onClick={() => setMaximizedCamId(null)}
              className="absolute top-14 right-3.5 z-30 flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-space-950/80 border border-cyber-orange text-cyber-orange font-mono text-[9px] hover:bg-cyber-orange/15 transition-all shadow-glow-amber/20 font-bold"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              MINIMIZE STREAM
            </button>
          </div>
        ) : multiCamLayout === 'list' ? (
          /* List Row layout */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleCameras.map(cam => (
              <div key={cam.id} className="relative group rounded-lg overflow-hidden flex flex-col">
                <CameraFrame 
                  camera={{
                    ...cam,
                    isRecording: isGlobalRecording
                  }} 
                  isMinified={true} 
                />
                
                {/* Hover Maximize button */}
                <div className="absolute top-14 right-3.5 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleToggleMaximize(cam.id)}
                    className="p-1.5 rounded bg-space-950/80 border border-space-850 hover:border-cyber-orange text-slate-300 hover:text-cyber-orange transition-all shadow-md"
                    title="Maximize stream"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Matrix Grid responsive layout */
          <div className={`grid gap-4 ${getGridColsClass(activeFeedCount)}`}>
            {visibleCameras.map(cam => (
              <div key={cam.id} className="relative group rounded-lg overflow-hidden flex flex-col h-56">
                <CameraFrame 
                  camera={{
                    ...cam,
                    isRecording: isGlobalRecording
                  }} 
                  isMinified={true} 
                />

                {/* Hover Maximize button */}
                <div className="absolute top-14 right-3.5 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleToggleMaximize(cam.id)}
                    className="p-1.5 rounded bg-space-950/80 border border-space-850 hover:border-cyber-orange text-slate-300 hover:text-cyber-orange transition-all shadow-md"
                    title="Maximize stream"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. DOCKED FOOTER ACTIONS */}
      <ActionBar />

    </div>
  );
}
