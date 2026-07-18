import React, { useState } from 'react';
import { useRover } from '../context/RoverContext';
import { useNavigate } from 'react-router-dom';
import CameraFrame from '../components/video/CameraFrame';
import ActionBar from '../components/controls/ActionBar';
import { LayoutGrid, List, Maximize2, Minimize2, ChevronLeft } from 'lucide-react';

/**
 * Multi Camera Control View (Page 2)
 * Matrix panel showing configured camera feeds simultaneously in high-fidelity orange themes.
 */
export default function MultiCameraControlView() {
  const navigate = useNavigate();
  
  // Track enlarged camera stream layout configurations
  const [multiCamLayout, setMultiCamLayout] = useState('grid'); // 'grid' or 'list'
  const [maximizedCamId, setMaximizedCamId] = useState(null);

  // Define your active physical rover camera stream matrix blueprints explicitly
  const activeCameras = [
    { id: 'nav_cam', name: 'Navigation Cam (Lapcare)', path: 'nav_cam' },
    { id: 'realsense_cam', name: 'RealSense RGB Feed', path: 'realsense_cam' }
  ];

  const handleToggleMaximize = (camId) => {
    if (maximizedCamId === camId) {
      setMaximizedCamId(null);
    } else {
      setMaximizedCamId(camId);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-4 overflow-hidden select-none">
      
      {/* 1. TOP TACTICAL TITLE BAR */}
      <div className="w-full bg-[#0b0f19]/60 border border-slate-800 rounded-md p-3.5 flex justify-between items-center font-mono text-[10px] shrink-0">
        
        {/* Left: Back to Cockpit Navigation */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded border border-slate-800 hover:border-cyber-orange text-slate-300 hover:text-cyber-orange bg-[#060608]/40 font-bold uppercase tracking-widest transition-all"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>BACK TO COCKPIT HUD</span>
        </button>

        {/* Center: Title */}
        <h1 className="text-sm font-bold tracking-widest text-slate-100 uppercase font-mono m-0">
          MULTI-CAMERA FEED DECK
        </h1>

        {/* Right: Layout Config Icons */}
        <div className="flex bg-[#060608]/85 p-0.5 border border-slate-800 rounded gap-1">
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

      {/* 2. DYNAMIC GRID/LIST/MAXIMIZE CAMERA ARRAY */}
      <div className="flex-1 overflow-y-auto pr-1">
        {maximizedCamId ? (
          /* Maximized Cinematic Mode */
          <div className="relative w-full h-[520px] rounded-lg overflow-hidden bg-slate-950 flex flex-col">
            {(() => {
              const cam = activeCameras.find(c => c.id === maximizedCamId);
              return (
                <CameraFrame 
                  cameraName={cam.name} 
                  streamPath={cam.path} 
                  jetsonIp="192.168.88.10" 
                />
              );
            })()}
            <button
              onClick={() => setMaximizedCamId(null)}
              className="absolute top-14 right-3 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-950 border border-cyber-orange text-cyber-orange font-mono text-[9px] hover:bg-cyber-orange/15 transition-all font-bold shadow-md"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              MINIMIZE STREAM
            </button>
          </div>
        ) : multiCamLayout === 'list' ? (
          /* List Row layout (Vertical list rows) */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeCameras.map(cam => (
              <div key={cam.id} className="relative group rounded-lg overflow-hidden flex flex-col bg-slate-950">
                <CameraFrame 
                  cameraName={cam.name} 
                  streamPath={cam.path} 
                  jetsonIp="192.168.88.10" 
                />
                
                {/* Hover Maximize Overlay */}
                <div className="absolute top-14 right-3.5 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleToggleMaximize(cam.id)}
                    className="p-1.5 rounded bg-slate-950/80 border border-slate-800 hover:border-cyber-orange text-slate-300 hover:text-cyber-orange transition-all"
                    title="Maximize stream"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Matrix Grid Layout Matrix side-by-side */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeCameras.map(cam => (
              <div key={cam.id} className="relative group rounded-lg overflow-hidden flex flex-col h-full bg-slate-950">
                <CameraFrame 
                  cameraName={cam.name} 
                  streamPath={cam.path} 
                  jetsonIp="192.168.88.10" 
                />

                {/* Hover Maximize Overlay */}
                <div className="absolute top-14 right-3.5 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleToggleMaximize(cam.id)}
                    className="p-1.5 rounded bg-slate-950/80 border border-slate-800 hover:border-cyber-orange text-slate-300 hover:text-cyber-orange transition-all"
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

      {/* 3. FOOTER CONTROL BAR */}
      <ActionBar />

    </div>
  );
}