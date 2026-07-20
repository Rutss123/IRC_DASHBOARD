import React from 'react';
import ActionBar from '../components/controls/ActionBar';
import { 
  Sliders, 
  Settings, 
  Wifi, 
  Camera, 
  Activity, 
  User, 
  Palette, 
  Briefcase, 
  ShieldCheck 
} from 'lucide-react';

export default function SettingsView() {
  return (
    <div className="flex-1 flex flex-col gap-4 overflow-hidden select-none font-mono">
      
      {/* 1. SECTION HEADER */}
      <div className="w-full bg-[#0b0f19]/60 border border-space-800 rounded-md p-3.5 flex justify-between items-center font-mono text-[10px] shrink-0">
        <h1 className="text-sm font-bold tracking-widest text-slate-100 uppercase m-0 flex items-center gap-2">
          <Settings className="w-4 h-4 text-cyber-cyan animate-pulse" />
          <span>MISSION CONTROL CONFIGURATION</span>
        </h1>
        <span className="bg-cyber-amber/15 text-cyber-amber border border-cyber-amber/30 px-2 py-0.5 rounded text-[8px] font-black uppercase">
          UNDER DEVELOPMENT
        </span>
      </div>

      {/* 2. MAIN COMPONENT CONTENT */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 overflow-y-auto pr-1 items-start">
        
        {/* LEFT COLUMN: ACTIVE INTERACTIVE NOTICE */}
        <div className="lg:col-span-1 hud-panel p-4 bg-[#0b0f19]/30 border-space-800 flex flex-col gap-4 h-full min-h-[380px] justify-between">
          <div className="flex flex-col gap-3">
            <h2 className="text-xs font-black text-slate-350 tracking-wider uppercase border-b border-space-800 pb-1.5 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyber-amber" />
              <span>Settings Deck</span>
            </h2>
            <p className="text-[9.5px] leading-relaxed text-slate-400 font-bold uppercase">
              Mission Profiles, Network telemetry pipelines, and Operator preferences settings are currently locked.
            </p>
          </div>
          
          <div className="bg-[#2d220c]/30 border border-cyber-amber/20 p-3 rounded-lg flex flex-col gap-1.5">
            <span className="text-cyber-amber font-bold text-[9px] uppercase tracking-wide flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              READ-ONLY PROTECTION
            </span>
            <span className="text-[7.5px] text-slate-400 font-bold uppercase leading-relaxed">
              Operator profiles and config writes are disabled during simulation mode. All settings default to nominal ground values.
            </span>
          </div>
        </div>

        {/* RIGHT COLUMNS: CONFIGURATION CATEGORIES MOCKUPS */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-30 select-none pointer-events-none">
          
          {/* Wireframe 1: Network Config */}
          <div className="hud-panel p-3.5 bg-space-950/40 border-space-850 flex flex-col gap-2.5">
            <span className="text-[8.5px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5" /> Network Configuration
            </span>
            <div className="flex flex-col gap-1.5 text-[8px] font-bold text-slate-600">
              <div className="p-2 border border-space-800 rounded">FASTAPI_IP: 127.0.0.1</div>
              <div className="p-2 border border-space-800 rounded">SOCKET_PORT: 8000</div>
              <div className="p-2 border border-space-800 rounded">WEBRTC_ICE_SERVERS: 1</div>
            </div>
          </div>

          {/* Wireframe 2: Camera Config */}
          <div className="hud-panel p-3.5 bg-space-950/40 border-space-850 flex flex-col gap-2.5">
            <span className="text-[8.5px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5" /> Camera Configuration
            </span>
            <div className="flex flex-col gap-1.5 text-[8px] font-bold text-slate-600">
              <div className="p-2 border border-space-800 rounded">DEFAULT_BITRATE: 4.5 MBPS</div>
              <div className="p-2 border border-space-800 rounded">AUTO_EXPOSURE: ON</div>
              <div className="p-2 border border-space-800 rounded">CODEC: H.264 / AV1</div>
            </div>
          </div>

          {/* Wireframe 3: Telemetry Settings */}
          <div className="hud-panel p-3.5 bg-space-950/40 border-space-850 flex flex-col gap-2.5">
            <span className="text-[8.5px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" /> Telemetry Settings
            </span>
            <div className="flex flex-col gap-1.5 text-[8px] font-bold text-slate-600">
              <div className="p-2 border border-space-800 rounded">REFRESH_FREQUENCY: 50 HZ</div>
              <div className="p-2 border border-space-800 rounded">SLOW_TICK_DAMPEN: 1.2S</div>
              <div className="p-2 border border-space-800 rounded">BUFFER_LIMIT: 100 PACKETS</div>
            </div>
          </div>

          {/* Wireframe 4: User Preferences */}
          <div className="hud-panel p-3.5 bg-space-950/40 border-space-850 flex flex-col gap-2.5">
            <span className="text-[8.5px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> User Preferences
            </span>
            <div className="flex flex-col gap-1.5 text-[8px] font-bold text-slate-600">
              <div className="p-2 border border-space-800 rounded">CONSOLE_MODE: OPERATOR_1</div>
              <div className="p-2 border border-space-800 rounded">HOTKEY_MAPPINGS: INDUSTRIAL</div>
              <div className="p-2 border border-space-800 rounded">SPEECH_FEEDBACK: DISABLED</div>
            </div>
          </div>

          {/* Wireframe 5: Theme */}
          <div className="hud-panel p-3.5 bg-space-950/40 border-space-850 flex flex-col gap-2.5">
            <span className="text-[8.5px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5" /> HUD Theme
            </span>
            <div className="flex flex-col gap-1.5 text-[8px] font-bold text-slate-600">
              <div className="p-2 border border-space-800 rounded">THEME_PROFILE: JPL_DARK</div>
              <div className="p-2 border border-space-800 rounded">COLOR_GRADIENTS: SPACE_GLOW</div>
              <div className="p-2 border border-space-800 rounded">CONTRAST_RATIO: DOCKING_BRIGHT</div>
            </div>
          </div>

          {/* Wireframe 6: Mission Profiles */}
          <div className="hud-panel p-3.5 bg-space-950/40 border-space-850 flex flex-col gap-2.5">
            <span className="text-[8.5px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" /> Mission Profiles
            </span>
            <div className="flex flex-col gap-1.5 text-[8px] font-bold text-slate-600">
              <div className="p-2 border border-space-800 rounded">ROVER_TARGET: CRATER_B</div>
              <div className="p-2 border border-space-800 rounded">Waypoint Profile: AUTO_NAV_01</div>
              <div className="p-2 border border-space-800 rounded">SAMPLE_QUOTA: 10 / 12</div>
            </div>
          </div>

        </div>

      </div>

      {/* 3. FOOTER */}
      <ActionBar />

    </div>
  );
}
