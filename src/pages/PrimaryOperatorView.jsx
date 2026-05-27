import React from 'react';
import { useRover } from '../context/RoverContext';
import NodeStatusStrip from '../components/system/NodeStatusStrip';
import SystemDiagnostics from '../components/system/SystemDiagnostics';
import GpsPanel from '../components/system/GpsPanel';
import ImuPanel from '../components/telemetry/ImuPanel';
import AnemometerPanel from '../components/telemetry/AnemometerPanel';
import CameraFrame from '../components/video/CameraFrame';
import Lidar3DPanel from '../components/telemetry/Lidar3DPanel';
import DriveMotorsPanel from '../components/telemetry/DriveMotorsPanel';
import ArmMotorsPanel from '../components/telemetry/ArmMotorsPanel';
import SciencePanel from '../components/system/SciencePanel';
import ActionBar from '../components/controls/ActionBar';

/**
 * High-Density Professional Science & Robotics Telemetry grounds cockpit.
 * Organizes grounds panels in a naturally scrollable 3-column operator console layout:
 * 1. NodeStatusStrip: Horizontal heartbeat node strip.
 * 2. Main operator cockpit Area (cols-5 grid split):
 *    - Left Sidebar (col-span-1 / ~20%): Comms, GPS positioning, IMU horizon, and Anemometer.
 *    - Center Ingest Viewport (col-span-3 / ~60%): visually dominant Live Video and 3D Lidar perception mesh.
 *    - Right Sidebar (col-span-1 / ~20%): 6 Drive wheels RPMs matrix, and 6-Axis manipulator angles.
 * 3. Environmental Science Panel: Modular atmospheric, gas, and soil arrays placed wide BELOW.
 * 4. ActionBar: Bottom docked controls.
 * Fully scrollable vertically.
 */
export default function PrimaryOperatorView() {
  const { activeCamera } = useRover();

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

        {/* Center Live Video Viewport & Large 3D Lidar Perception (~60% width) */}
        <div className="xl:col-span-3 w-full flex flex-col gap-4">
          <CameraFrame camera={activeCamera} isMinified={false} />
          <Lidar3DPanel />
        </div>

        {/* Right Sidebar (col-span-1 / ~20% width) - motor drivetrain & robotic arm grids */}
        <div className="xl:col-span-1 flex flex-col gap-3.5 w-full">
          <DriveMotorsPanel />
          <ArmMotorsPanel />
        </div>

      </div>

      {/* 3. LABORATORY SCIENCE PANEL (wide layout BELOW main cockpit) */}
      <SciencePanel />

      {/* 4. DOCKED ACTIONS CONTROLS BAR */}
      <ActionBar />

    </div>
  );
}
