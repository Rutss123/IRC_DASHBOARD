import React from 'react';
import ActionBar from '../components/controls/ActionBar';
import { 
  Gamepad, 
  Cpu, 
  Keyboard, 
  Sliders, 
  AlertTriangle, 
  Eye, 
  Play, 
  Disc 
} from 'lucide-react';

export default function ControllerView() {
  return (
    <div className="flex-1 flex flex-col gap-4 overflow-hidden select-none font-mono">
      
      {/* 1. SECTION HEADER */}
      <div className="w-full bg-[#0b0f19]/60 border border-space-800 rounded-md p-3.5 flex justify-between items-center font-mono text-[10px] shrink-0">
        <h1 className="text-sm font-bold tracking-widest text-slate-100 uppercase m-0 flex items-center gap-2">
          <Gamepad className="w-4 h-4 text-cyber-orange animate-pulse" />
          <span>ROVER TELEOPERATION SYSTEM</span>
        </h1>
        <span className="bg-cyber-orange/15 text-cyber-orange border border-cyber-orange/30 px-2 py-0.5 rounded text-[8px] font-black uppercase animate-pulse">
          COMING SOON
        </span>
      </div>

      {/* 2. MAIN COMPONENT AREA WITH DISABLED CONTROL DECK OVERLAYS */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 overflow-y-auto pr-1 items-start">
        
        {/* LEFT COLUMN: ACTIVE INTERACTIVE NOTICE */}
        <div className="lg:col-span-1 hud-panel p-4 bg-[#0b0f19]/30 border-space-800 flex flex-col gap-4 h-full min-h-[380px] justify-between">
          <div className="flex flex-col gap-3">
            <h2 className="text-xs font-black text-slate-350 tracking-wider uppercase border-b border-space-800 pb-1.5 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyber-cyan" />
              <span>Controller Module</span>
            </h2>
            <p className="text-[9.5px] leading-relaxed text-slate-400 font-bold uppercase">
              Manual drive and robotic arm controls will be integrated in a future update.
            </p>
          </div>
          
          <div className="bg-[#2d0f0c]/30 border border-cyber-orange/20 p-3 rounded-lg flex flex-col gap-1.5">
            <span className="text-cyber-orange font-bold text-[9px] uppercase tracking-wide flex items-center gap-1.5 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              INTEGRATION IN PROGRESS
            </span>
            <span className="text-[7.5px] text-slate-400 font-bold uppercase leading-relaxed">
              FastAPI ROS telemetry binding is currently mapping joint velocity control states. Manual joystick input is disabled.
            </span>
          </div>
        </div>

        {/* RIGHT COLUMNS: DISABLED WIREFRAME LAYOUTS */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 opacity-30 select-none pointer-events-none">
          
          {/* Wireframe A: Joystick Control */}
          <div className="hud-panel p-4 bg-space-950/40 border-space-850 flex flex-col gap-3">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">[JOYSTICK_TELEOP_MAPPING]</span>
            <div className="w-full h-44 bg-[#060608]/85 border border-dashed border-space-800 rounded-lg flex flex-col items-center justify-center gap-2">
              <span className="w-10 h-10 rounded-full border-2 border-space-800 flex items-center justify-center">
                <span className="w-2.5 h-2.5 rounded-full bg-space-850" />
              </span>
              <span className="text-[7.5px] text-slate-600 font-bold">X: 0.00 // Y: 0.00 (DEADZONE_ACTIVE)</span>
            </div>
          </div>

          {/* Wireframe B: Keyboard Control */}
          <div className="hud-panel p-4 bg-space-950/40 border-space-850 flex flex-col gap-3">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">[KEYBOARD_DRIVE_MAPPING]</span>
            <div className="w-full h-44 bg-[#060608]/85 border border-dashed border-space-800 rounded-lg flex flex-col items-center justify-center gap-3">
              <div className="flex gap-2">
                <span className="w-6 h-6 border border-space-800 rounded flex items-center justify-center text-[8px] text-slate-600">W</span>
              </div>
              <div className="flex gap-2">
                <span className="w-6 h-6 border border-space-800 rounded flex items-center justify-center text-[8px] text-slate-600">A</span>
                <span className="w-6 h-6 border border-space-800 rounded flex items-center justify-center text-[8px] text-slate-600">S</span>
                <span className="w-6 h-6 border border-space-800 rounded flex items-center justify-center text-[8px] text-slate-600">D</span>
              </div>
              <span className="text-[7.5px] text-slate-600 font-bold">KEYBOARD CONTROLS DISARMED</span>
            </div>
          </div>

          {/* Wireframe C: Robotic Arm Joint Controls */}
          <div className="hud-panel p-4 bg-space-950/40 border-space-850 flex flex-col gap-3">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">[MANIPULATOR_INVERSE_KINEMATICS]</span>
            <div className="flex flex-col gap-2">
              {[1, 2, 3, 4].map(idx => (
                <div key={idx} className="flex justify-between items-center bg-[#060608]/85 p-2 border border-space-850 rounded">
                  <span className="text-[8px] text-slate-650 font-bold">JOINT_0{idx} FEEDBACK</span>
                  <span className="w-16 bg-space-950 h-1 rounded overflow-hidden">
                    <span className="bg-space-800 h-full block w-[20%]" />
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Wireframe D: Mode Toggles & Options */}
          <div className="hud-panel p-4 bg-space-950/40 border-space-850 flex flex-col gap-3">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">[DRIVE_SYSTEMS_CONFIGURATION]</span>
            <div className="grid grid-cols-2 gap-2 text-[8px] font-bold text-slate-600">
              <div className="p-2 border border-space-800 rounded flex justify-between">
                <span>AUTONOMOUS</span>
                <span>OFF</span>
              </div>
              <div className="p-2 border border-space-800 rounded flex justify-between">
                <span>ESTOP ENGAGED</span>
                <span>READY</span>
              </div>
              <div className="p-2 border border-space-800 rounded flex justify-between">
                <span>ARM INTERFERENCE</span>
                <span>LOCK</span>
              </div>
              <div className="p-2 border border-space-800 rounded flex justify-between">
                <span>MACRO ROUTINES</span>
                <span>STANDBY</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* 3. FOOTER */}
      <ActionBar />

    </div>
  );
}
