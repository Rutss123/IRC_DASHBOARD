import React from 'react';

export default function StatusLed({ status = "healthy", pulse = true, className = "" }) {
  const getColorClasses = () => {
    switch (status) {
      case "healthy":
      case "online":
        return "bg-cyber-green text-cyber-green shadow-glow-green/30 border-cyber-green/40";
      case "warning":
      case "standby":
        return "bg-cyber-amber text-cyber-amber shadow-glow-amber/30 border-cyber-amber/40";
      case "critical":
      case "offline":
      case "error":
      case "fault":
        return "bg-cyber-red text-cyber-red shadow-glow-red/30 border-cyber-red/40";
      case "active":
      case "syncing":
        return "bg-cyber-cyan text-cyber-cyan shadow-glow-cyan/30 border-cyber-cyan/40";
      default:
        return "bg-slate-500 text-slate-500 border-slate-600";
    }
  };

  return (
    <div className={`relative flex items-center justify-center w-2.5 h-2.5 ${className}`}>
      {pulse && (
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${getColorClasses()}`} />
      )}
      <span className={`relative inline-flex rounded-full h-2 w-2 border ${getColorClasses()}`} />
    </div>
  );
}
