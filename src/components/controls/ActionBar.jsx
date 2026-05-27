import React, { useState } from 'react';
import { useRover } from '../../context/RoverContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ShieldAlert, 
  Video 
} from 'lucide-react';

export default function ActionBar() {
  const { roverMode, changeMode, triggerEStop, resetEStop, selectCamera, cameras, activeCameraId } = useRover();
  const navigate = useNavigate();
  const location = useLocation();
  const isMultiCamPage = location.pathname === '/multicam';

  const [estopArmed, setEstopArmed] = useState(false);

  const handleEStopClick = () => {
    if (roverMode === 'E-STOP') {
      resetEStop();
      setEstopArmed(false);
    } else {
      triggerEStop();
      setEstopArmed(true);
    }
  };

  return (
    <div className="w-full bg-space-900 border border-space-800 rounded-xl p-3.5 flex flex-wrap justify-between items-center gap-4 select-none relative overflow-hidden backdrop-blur-md">
      

      {/* 2. QUICK CAMERA CHANGER (NAVBAR OR DOCK-BASED SWITCHER) */}
      <div className="flex items-center gap-2.5 font-mono">
        {!isMultiCamPage && (
          <>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              [ACTIVE_CAM]:
            </span>
            <select
              disabled={roverMode === 'E-STOP'}
              value={activeCameraId}
              onChange={(e) => selectCamera(e.target.value)}
              className="bg-space-950 border border-space-850 px-3 py-1.5 text-xs text-slate-200 rounded-lg outline-none cursor-pointer focus:border-cyber-cyan font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {cameras.map(cam => (
                <option key={cam.id} value={cam.id} className="bg-space-950 text-slate-200">
                  {cam.name} ({cam.status.toUpperCase()})
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      {/* 3. AUXILIARY CONTROL LAYOUT TRIGGERS (MATRIX OR GRID TOGGLE) */}
      <div className="flex items-center gap-3 font-mono">
        {isMultiCamPage ? (
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-cyber-cyan text-cyber-cyan bg-cyber-cyan/10 hover:bg-cyber-cyan/20 transition-all"
          >
            <Video className="w-4 h-4" />
            PRIMARY OPERATOR
          </button>
        ) : (
          <button
            onClick={() => window.open('/multicam', '_blank')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-cyber-cyan text-cyber-cyan bg-cyber-cyan/10 hover:bg-cyber-cyan/20 transition-all"
          >
            <Video className="w-4 h-4" />
            MULTI-CAM MATRIX
          </button>
        )}

        {/* 4. CRITICAL EMERGENCY STOP ACTION */}
        <button
          onClick={handleEStopClick}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold tracking-widest text-xs uppercase border transition-all duration-300 ${
            roverMode === 'E-STOP'
              ? 'bg-cyber-green text-space-950 border-cyber-green shadow-glow-green animate-pulse'
              : 'bg-cyber-red/20 text-cyber-red border-cyber-red hover:bg-cyber-red hover:text-white shadow-glow-red/20'
          }`}
        >
          <ShieldAlert className="w-4.5 h-4.5" />
          <span>
            {roverMode === 'E-STOP' ? "RE-ARM SYSTEMS" : "EMERGENCY STOP"}
          </span>
        </button>
      </div>

    </div>
  );
}
