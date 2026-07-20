import React, { useState } from 'react';
import { useRover } from '../context/RoverContext';
import NodeStatusStrip from '../components/system/NodeStatusStrip';
import SystemDiagnostics from '../components/system/SystemDiagnostics';
import GpsPanel from '../components/system/GpsPanel';
import ImuPanel from '../components/telemetry/ImuPanel';
import AnemometerPanel from '../components/telemetry/AnemometerPanel';
import CameraFrame from '../components/video/CameraFrame';
import DriveMotorsPanel from '../components/telemetry/DriveMotorsPanel';
import ArmMotorsPanel from '../components/telemetry/ArmMotorsPanel';
import ActionBar from '../components/controls/ActionBar';

/**
 * High-Density Professional Science & Robotics Telemetry grounds cockpit.
 * Organizes grounds panels in a naturally scrollable 3-column operator console layout:
 * 1. NodeStatusStrip: Horizontal heartbeat node strip.
 * 2. Main operator cockpit Area (cols-5 grid split):
 *    - Left Sidebar (col-span-1 / ~20%): Comms, GPS positioning, IMU horizon, and Anemometer.
 *    - Center Ingest Viewport (col-span-3 / ~60%): visually dominant Live Video.
 *    - Right Sidebar (col-span-1 / ~20%): 6 Drive wheels RPMs matrix, and 6-Axis manipulator angles.
 * 3. ActionBar: Bottom docked controls.
 * Fully scrollable vertically.
 */
export default function PrimaryOperatorView() {
  const { activeCamera, cameras } = useRover();
  const [secondaryCamId, setSecondaryCamId] = useState('arm_cam');

  const secondaryOptions = [
    { id: 'front_cam', name: 'Front Camera' },
    { id: 'rear_cam', name: 'Rear Camera' },
    { id: 'arm_cam', name: 'Arm Camera' },
    { id: 'science_cam', name: 'Science Camera' },
    { id: 'thermal_cam', name: 'Thermal Camera' },
    { id: 'nav_cam', name: 'Navigation Camera' }
  ];

  const secondaryCamera = cameras.find(c => c.id === secondaryCamId) || cameras[2];

  return (
    <div className="w-full flex flex-col gap-4 font-mono select-none">
      
      {/* 1. NODE STATUS HEARBEATS */}
      <NodeStatusStrip />

      {/* 2. MAIN COCKPIT GRIDS SPLITS (Left Sidebar 20% | Center Camera 60% | Right Sidebar 20%) */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 w-full items-start">
        
        {/* Left Sidebar (col-span-1 / ~20% width) - stacked link diagnostics, bearings, and weather */}
        <div className="xl:col-span-1 flex flex-col gap-3.5 w-full">
          <SystemDiagnostics />
          <GpsPanel />
          <ImuPanel />
          <AnemometerPanel />
        </div>

        {/* Center Live Video Viewports (~60% width) - Flexbox 50/50 fill layout */}
        <div className="xl:col-span-3 w-full flex flex-col gap-3 self-stretch min-h-0">
          {/* Primary Viewport (Dominant) */}
          <CameraFrame 
            camera={activeCamera} 
            isMinified={false} 
            className="flex-1" 
          />

          {/* Secondary Viewport (Equal Size 50/50) */}
          <CameraFrame 
            camera={secondaryCamera} 
            isMinified={false} 
            className="flex-1"
            headerSelector={(
              <select
                value={secondaryCamId}
                onChange={(e) => setSecondaryCamId(e.target.value)}
                className="bg-[#060608]/90 text-cyber-amber border border-space-800 rounded px-1.5 py-0.5 focus:outline-none focus:border-cyber-amber cursor-pointer uppercase text-[8px] font-black font-mono ml-1"
              >
                {secondaryOptions.map(opt => (
                  <option key={opt.id} value={opt.id} className="bg-space-950 text-slate-350 font-mono">
                    ▼ {opt.name.toUpperCase()}
                  </option>
                ))}
              </select>
            )}
          />
        </div>

        {/* Right Sidebar (col-span-1 / ~20% width) - motor drivetrain & robotic arm grids */}
        <div className="xl:col-span-1 flex flex-col gap-3.5 w-full">
          <DriveMotorsPanel />
          <ArmMotorsPanel />
        </div>

      </div>

      {/* 3. DOCKED ACTIONS CONTROLS BAR */}
      <ActionBar />

    </div>
  );
}
