import React, { useState, useEffect, useRef } from 'react';

/**
 * CameraFrame - A highly optimized, low-latency video streaming terminal
 * designed for the Dhruva Rover Dashboard. Natively consumes WebRTC (WHEP)
 * streams from MediaMTX running on the Jetson, with seamless failbacks.
 * * @param {string} cameraName - Descriptive name of the feed (e.g., "Navigation Cam")
 * @param {string} streamPath - MediaMTX stream path (e.g., "nav_cam")
 * @param {string} jetsonIp - Network IP of the Jetson (default: "192.168.88.10")
 * @param {string} fallbackMjpegUrl - Fallback URL if running legacy MJPEG testing
 */
const CameraFrame = ({ 
  cameraName = "Navigation Camera", 
  streamPath = "nav_cam", 
  jetsonIp = "192.168.88.10",
  fallbackMjpegUrl = ""
}) => {
  const [streamMode, setStreamMode] = useState('webrtc'); // 'webrtc', 'iframe', 'mjpeg'
  const [connectionStatus, setConnectionStatus] = useState('DISCONNECTED'); // 'DISCONNECTED', 'CONNECTING', 'CONNECTED', 'FAILED'
  const [showCrosshair, setShowCrosshair] = useState(false);
  
  // Video filter states (applied in real-time on base station Base-Station monitor)
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [isMuted, setIsMuted] = useState(true);

  const videoRef = useRef(null);
  const peerConnectionRef = useRef(null);

  // Address definitions
  const whepUrl = `http://${jetsonIp}:8889/${streamPath}/whep`;
  const iframeUrl = `http://${jetsonIp}:8889/${streamPath}`;
  const mjpegUrl = fallbackMjpegUrl || `http://${jetsonIp}:8000/api/video/${streamPath}`;

  // Clean up WebRTC peer connections
  const stopWebRTC = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // WebRTC WHEP connection negotiator
  const startWebRTC = async () => {
    stopWebRTC();
    setConnectionStatus('CONNECTING');

    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      peerConnectionRef.current = pc;

      // Handle incoming media tracks
      pc.ontrack = (event) => {
        if (videoRef.current && event.streams[0]) {
          videoRef.current.srcObject = event.streams[0];
          setConnectionStatus('CONNECTED');
        }
      };

      // Handle ICE connection state changes
      pc.oniceconnectionstatechange = () => {
        if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'closed') {
          setConnectionStatus('DISCONNECTED');
        } else if (pc.iceConnectionState === 'failed') {
          setConnectionStatus('FAILED');
        }
      };

      // Create WebRTC WHEP Offer (Receive Only)
      pc.addTransceiver('video', { direction: 'recvonly' });
      pc.addTransceiver('audio', { direction: 'recvonly' });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Perform SDP exchange with MediaMTX WHEP endpoint
      const response = await fetch(whepUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sdp',
        },
        body: offer.sdp,
      });

      if (!response.ok) {
        throw new Error(`WHEP endpoint returned status ${response.status}`);
      }

      const answerSdp = await response.text();
      await pc.setRemoteDescription(new RTCSessionDescription({
        type: 'answer',
        sdp: answerSdp,
      }));

    } catch (error) {
      console.warn("WHEP WebRTC handshake failed, falling back to Iframe view. Error: ", error);
      setConnectionStatus('FAILED');
      // If direct WebRTC fails, default to MediaMTX built-in web page
      setStreamMode('iframe');
    }
  };

  useEffect(() => {
    if (streamMode === 'webrtc') {
      startWebRTC();
    } else {
      stopWebRTC();
    }

    return () => stopWebRTC();
  }, [streamMode, jetsonIp, streamPath]);

  // Reset video settings
  const handleResetFilters = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl p-4 flex flex-col h-full">
      
      {/* Header bar with controls and signal badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-[0_0_8px_#22d3ee] animate-pulse"></span>
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            {cameraName}
          </h3>
        </div>

        {/* Source Selector & UI Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Signal Indicator */}
          {streamMode === 'webrtc' && (
            <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md uppercase border ${
              connectionStatus === 'CONNECTED' 
                ? 'bg-emerald-950/70 text-emerald-400 border-emerald-500/30' 
                : connectionStatus === 'CONNECTING'
                ? 'bg-amber-950/70 text-amber-400 border-amber-500/30 animate-pulse'
                : 'bg-rose-950/70 text-rose-400 border-rose-500/30'
            }`}>
              WebRTC: {connectionStatus}
            </span>
          )}

          {streamMode === 'iframe' && (
            <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md uppercase bg-sky-950/70 text-sky-400 border border-sky-500/30">
              MediaMTX Web View
            </span>
          )}

          {streamMode === 'mjpeg' && (
            <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md uppercase bg-purple-950/70 text-purple-400 border border-purple-500/30">
              Legacy MJPEG
            </span>
          )}

          {/* Mode Switcher */}
          <select 
            value={streamMode} 
            onChange={(e) => setStreamMode(e.target.value)}
            className="bg-slate-850 border border-slate-700 rounded text-xs px-2 py-1 text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="webrtc">WebRTC (Direct)</option>
            <option value="iframe">WebRTC (Iframe)</option>
            <option value="mjpeg">MJPEG (Legacy)</option>
          </select>
        </div>
      </div>

      {/* Primary Video Container */}
      <div className="relative aspect-video w-full bg-slate-950 rounded-lg overflow-hidden border border-slate-800 group">
        
        {/* Real-time WebRTC HTML5 Video Renderer */}
        {streamMode === 'webrtc' && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isMuted}
            className="w-full h-full object-contain transition-all duration-150"
            style={{
              filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
            }}
          />
        )}

        {/* MediaMTX embedded iframe handler */}
        {streamMode === 'iframe' && (
          <iframe
            src={iframeUrl}
            title={cameraName}
            className="w-full h-full border-none bg-black"
            scrolling="no"
            allow="autoplay; encrypted-media; picture-in-picture"
            sandbox="allow-scripts allow-same-origin"
          />
        )}

        {/* Legacy MJPEG fallback route */}
        {streamMode === 'mjpeg' && (
          <img
            src={mjpegUrl}
            alt={cameraName}
            className="w-full h-full object-contain"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%230b0f19'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23ef4444' font-size='6' font-family='sans-serif'>NO LIVE STREAM SIGNAL FOUND</text></svg>";
            }}
          />
        )}

        {/* Tactical Crosshair HUD Overlay */}
        {showCrosshair && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Center Dot */}
            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_4px_#22d3ee]"></div>
            
            {/* Horizontal & Vertical Crosshair Scope */}
            <div className="absolute w-24 h-[1px] bg-cyan-400/40 shadow-[0_0_2px_rgba(34,211,238,0.2)]"></div>
            <div className="absolute h-24 w-[1px] bg-cyan-400/40 shadow-[0_0_2px_rgba(34,211,238,0.2)]"></div>
            
            {/* Box Framing */}
            <div className="absolute w-12 h-12 border border-cyan-400/30 rounded-sm"></div>
            
            {/* Outer Range Ring */}
            <div className="absolute w-36 h-36 border border-dashed border-cyan-400/10 rounded-full animate-[spin_40s_linear_infinite]"></div>
          </div>
        )}

        {/* Loading overlay if initializing stream */}
        {streamMode === 'webrtc' && connectionStatus === 'CONNECTING' && (
          <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin"></div>
            <span className="text-xs text-slate-400 font-mono">negotiating whep session...</span>
          </div>
        )}

        {/* Connection Failure Splash */}
        {streamMode === 'webrtc' && connectionStatus === 'FAILED' && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-4 text-center">
            <svg className="w-12 h-12 text-rose-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h4 className="text-sm font-bold text-slate-200">WebRTC Broadcast Offline</h4>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              Verify `mediamtx` is running on {jetsonIp} and streaming to stream rule path `{streamPath}`.
            </p>
          </div>
        )}

        {/* Floating Quick Action HUD */}
        <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={() => setShowCrosshair(!showCrosshair)}
            title="Toggle Pilot Crosshairs"
            className={`p-2 rounded bg-slate-900/80 hover:bg-slate-800 text-xs font-bold border transition-colors ${
              showCrosshair ? 'text-cyan-400 border-cyan-500/40' : 'text-slate-400 border-slate-700'
            }`}
          >
            🎯 HUD
          </button>
          
          {streamMode === 'webrtc' && (
            <button
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? "Unmute Audio Feed" : "Mute Audio Feed"}
              className={`p-2 rounded bg-slate-900/80 hover:bg-slate-800 text-xs font-bold border transition-colors ${
                !isMuted ? 'text-emerald-400 border-emerald-500/40' : 'text-slate-400 border-slate-700'
              }`}
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
          )}

          <button
            onClick={streamMode === 'webrtc' ? startWebRTC : undefined}
            disabled={streamMode !== 'webrtc'}
            title="Force WebRTC Renegotiation"
            className="p-2 rounded bg-slate-900/80 hover:bg-slate-800 text-xs font-bold border border-slate-700 text-slate-400 disabled:opacity-40"
          >
            🔄 Reset
          </button>
        </div>
      </div>

      {/* Lower Dashboard adjustments drawer (exclusive to WebRTC mode) */}
      {streamMode === 'webrtc' && connectionStatus === 'CONNECTED' && (
        <div className="mt-4 pt-3 border-t border-slate-800/60 grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
          
          {/* Brightness Adjustment */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>🔆 Brightness</span>
              <span>{brightness}%</span>
            </div>
            <input 
              type="range" 
              min="50" 
              max="150" 
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="accent-cyan-500 h-1 rounded bg-slate-950 cursor-pointer"
            />
          </div>

          {/* Contrast Adjustment */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>🌗 Contrast</span>
              <span>{contrast}%</span>
            </div>
            <input 
              type="range" 
              min="50" 
              max="150" 
              value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
              className="accent-cyan-500 h-1 rounded bg-slate-950 cursor-pointer"
            />
          </div>

          {/* Saturation Adjustment */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>🎨 Saturation</span>
              <span>{saturation}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="200" 
              value={saturation}
              onChange={(e) => setSaturation(Number(e.target.value))}
              className="accent-cyan-500 h-1 rounded bg-slate-950 cursor-pointer"
            />
          </div>

          {/* Preset Reset Button */}
          <div className="flex justify-end">
            <button
              onClick={handleResetFilters}
              className="w-full md:w-auto px-3 py-1.5 text-xs border border-slate-700 rounded bg-slate-850 hover:bg-slate-800 text-slate-300 font-mono transition-colors"
            >
              Reset Filters
            </button>
          </div>

        </div>
      )}

      {/* Diagnostic telemetry stats readout footer */}
      <div className="mt-3 flex justify-between items-center text-[10px] text-slate-500 font-mono">
        <span>Address: {jetsonIp}:{streamMode === 'webrtc' || streamMode === 'iframe' ? '8889' : '8000'}</span>
        <span>Codec: H.264 (Baseline Profile)</span>
      </div>
    </div>
  );
};

export default CameraFrame;