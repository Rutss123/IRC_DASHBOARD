import React from 'react';
import { useRover } from '../../context/RoverContext';
import StatusLed from '../common/StatusLed';
import { Cpu, Server, ShieldCheck, Terminal, Compass, Layers } from 'lucide-react';

export default function NodeStatusStrip() {
  const { telemetry } = useRover();
  const { nodes } = telemetry;

  const getNodeStatus = (status) => {
    return status === 'healthy' ? 'online' : status === 'warning' ? 'warning' : 'critical';
  };

  const getNodeColor = (status) => {
    if (status === 'healthy') return 'text-cyber-green border-cyber-green/20 bg-cyber-green/5';
    if (status === 'warning') return 'text-cyber-orange border-cyber-orange/20 bg-cyber-orange/5';
    return 'text-cyber-red border-cyber-red/20 bg-cyber-red/5';
  };

  return (
    <div className="w-full bg-[#0b0f19]/60 border border-space-800 rounded-lg p-2.5 px-4 flex flex-wrap justify-between items-center gap-4 font-mono text-[10px] select-none relative overflow-hidden">
      
      {/* Tech Grid mesh subtle backdrop */}
      <div className="absolute inset-0 grid-overlay opacity-[0.04] pointer-events-none" />

      {/* Left Label */}
      <div className="flex items-center gap-2">
        <Layers className="w-4 h-4 text-cyber-cyan animate-pulse" />
        <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">
          [SYSTEM_NODE_MATRIX]:
        </span>
      </div>

      {/* Nodes Horizontal Stack */}
      <div className="flex flex-1 flex-wrap justify-start sm:justify-around items-center gap-4">
        
        {/* Node 1: Jetson AI Core */}
        <div className={`flex items-center gap-2 px-3 py-1 rounded-md border ${getNodeColor(nodes.jetson)} transition-all duration-300`}>
          <StatusLed status={getNodeStatus(nodes.jetson)} pulse={nodes.jetson !== 'healthy'} className="w-1.5 h-1.5" />
          <div className="flex flex-col">
            <span className="font-bold tracking-wide">JETSON AI CORE</span>
            <span className="text-[7.5px] text-slate-500 font-semibold tracking-wider">
              {nodes.jetson === 'healthy' ? 'CUDA_OK // ORIN_ON' : 'DEGRADED_CORE'}
            </span>
          </div>
        </div>

        {/* Node 2: RPi Gateway */}
        <div className={`flex items-center gap-2 px-3 py-1 rounded-md border ${getNodeColor(nodes.rpi)} transition-all duration-300`}>
          <StatusLed status={getNodeStatus(nodes.rpi)} pulse={nodes.rpi !== 'healthy'} className="w-1.5 h-1.5" />
          <div className="flex flex-col">
            <span className="font-bold tracking-wide">RPI GATEWAY</span>
            <span className="text-[7.5px] text-slate-500 font-semibold tracking-wider">
              {nodes.rpi === 'healthy' ? 'WEBRTC_DOWNLINK // 50Hz' : 'FAULT_RECONNECTING'}
            </span>
          </div>
        </div>

        {/* Node 3: Encoders */}
        <div className={`flex items-center gap-2 px-3 py-1 rounded-md border ${getNodeColor(nodes.encoder)} transition-all duration-300`}>
          <StatusLed status={getNodeStatus(nodes.encoder)} pulse={nodes.encoder !== 'healthy'} className="w-1.5 h-1.5" />
          <div className="flex flex-col">
            <span className="font-bold tracking-wide">DRIVE ENCODERS</span>
            <span className="text-[7.5px] text-slate-500 font-semibold tracking-wider">
              {nodes.encoder === 'healthy' ? 'FEEDBACK_SYNCED' : 'ESTOP_LOCKED'}
            </span>
          </div>
        </div>

        {/* Node 4: Sensor Node */}
        <div className={`flex items-center gap-2 px-3 py-1 rounded-md border ${getNodeColor(nodes.sensor)} transition-all duration-300`}>
          <StatusLed status={getNodeStatus(nodes.sensor)} pulse={nodes.sensor !== 'healthy'} className="w-1.5 h-1.5" />
          <div className="flex flex-col">
            <span className="font-bold tracking-wide">ENVIRONMENT SENSOR NODE</span>
            <span className="text-[7.5px] text-slate-500 font-semibold tracking-wider">
              {nodes.sensor === 'healthy' ? 'BME_OK // MQ_ACTIVE' : 'SENSOR_INGEST_ERR'}
            </span>
          </div>
        </div>

      </div>

      {/* Right status lock banner */}
      <div className="hidden lg:flex items-center gap-1.5 border border-cyber-cyan/15 bg-cyber-cyan/5 text-cyber-cyan px-2 py-0.5 rounded text-[8px] font-bold">
        <ShieldCheck className="w-3.5 h-3.5 text-cyber-cyan shrink-0" />
        <span>NODE INTEGRITY: SAFE</span>
      </div>

    </div>
  );
}
