import React, { useState, useEffect, useRef } from 'react';
import { Maximize2, RefreshCw, Crosshair, Volume2, VolumeX, Radio } from 'lucide-react';

const DEFAULT_JETSON_IP = import.meta.env.VITE_JETSON_IP || '192.168.88.10';
const DEFAULT_WHEP_PORT = import.meta.env.VITE_MEDIAMTX_WHEP_PORT || '8889';

/**
 * CameraFrame - Low-latency WebRTC (WHEP) stream player.
 * Supports both dominant Hero viewport and compact Bento thumbnail feeds.
 */
export default function CameraFrame({
  cameraName = 'Navigation Camera',
  streamPath = 'nav_cam',
  jetsonIp = DEFAULT_JETSON_IP,
  whepPort = DEFAULT_WHEP_PORT,
  isHero = false,
  isActive = false,
  onSelect = null,
  className = '',
}) {
  const [streamMode, setStreamMode] = useState('webrtc'); // 'webrtc' | 'iframe'
  const [connectionStatus, setConnectionStatus] = useState('CONNECTING'); // 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'FAILED'
  const [showCrosshair, setShowCrosshair] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Real-time video filters
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);

  const videoRef = useRef(null);
  const pcRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  const whepUrl = `http://${jetsonIp}:${whepPort}/${streamPath}/whep`;
  const iframeUrl = `http://${jetsonIp}:${whepPort}/${streamPath}`;

  const stopWebRTC = () => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (pcRef.current) {
      try {
        pcRef.current.close();
      } catch (e) {
        // ignore
      }
      pcRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startWebRTC = async () => {
    stopWebRTC();
    setConnectionStatus('CONNECTING');

    try {
      // Local LAN connection: no STUN required, avoids WAN timeout in field
      const pc = new RTCPeerConnection({
        iceServers: []
      });
      pcRef.current = pc;

      pc.ontrack = (event) => {
        if (videoRef.current && event.streams[0]) {
          videoRef.current.srcObject = event.streams[0];
          setConnectionStatus('CONNECTED');
        }
      };

      pc.oniceconnectionstatechange = () => {
        if (!pcRef.current) return;
        const state = pc.iceConnectionState;
        if (state === 'connected' || state === 'completed') {
          setConnectionStatus('CONNECTED');
        } else if (state === 'disconnected') {
          setConnectionStatus('DISCONNECTED');
          scheduleReconnect();
        } else if (state === 'failed') {
          setConnectionStatus('FAILED');
          scheduleReconnect();
        }
      };

      // Receive only video (and audio)
      pc.addTransceiver('video', { direction: 'recvonly' });
      pc.addTransceiver('audio', { direction: 'recvonly' });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Perform SDP exchange with MediaMTX WHEP
      const res = await fetch(whepUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/sdp' },
        body: offer.sdp,
        signal: AbortSignal.timeout(4000)
      });

      if (!res.ok) {
        throw new Error(`MediaMTX WHEP rejected: ${res.statusText}`);
      }

      const answerSdp = await res.text();
      await pc.setRemoteDescription(new RTCSessionDescription({
        type: 'answer',
        sdp: answerSdp
      }));

    } catch (err) {
      console.warn(`[CameraFrame:${streamPath}] WHEP connection failed:`, err.message);
      setConnectionStatus('FAILED');
      scheduleReconnect();
    }
  };

  const scheduleReconnect = () => {
    if (reconnectTimerRef.current) return;
    reconnectTimerRef.current = setTimeout(() => {
      reconnectTimerRef.current = null;
      if (streamMode === 'webrtc') {
        startWebRTC();
      }
    }, 5000);
  };

  useEffect(() => {
    if (streamMode === 'webrtc') {
      startWebRTC();
    } else {
      stopWebRTC();
    }

    return () => {
      stopWebRTC();
    };
  }, [streamMode, streamPath, jetsonIp, whepPort]);

  const handleContainerClick = () => {
    if (!isHero && onSelect) {
      onSelect(streamPath);
    }
  };

  return (
    <div
      onClick={handleContainerClick}
      className={`relative rounded-xl overflow-hidden bg-slate-950 border transition-all duration-200 flex flex-col ${
        isHero
          ? 'w-full h-full border-slate-800 shadow-2xl'
          : `cursor-pointer aspect-video border-slate-800/80 hover:border-cyan-500/50 hover:shadow-cyan-500/10 ${
              isActive ? 'ring-2 ring-cyan-500/80 border-cyan-500' : ''
            }`
      } ${className}`}
    >
      {/* Top Header Strip */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-2 bg-gradient-to-b from-slate-950/90 via-slate-950/40 to-transparent pointer-events-none">
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <span
            className={`w-2 h-2 rounded-full ${
              connectionStatus === 'CONNECTED'
                ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]'
                : connectionStatus === 'CONNECTING'
                ? 'bg-amber-400 animate-pulse'
                : 'bg-rose-500'
            }`}
          />
          <span className="text-[10px] font-mono font-bold text-slate-200 uppercase tracking-wider truncate max-w-[140px] md:max-w-none">
            {cameraName}
          </span>
        </div>

        <div className="flex items-center gap-1 pointer-events-auto">
          <span className="px-1.5 py-0.5 text-[8px] font-mono font-bold rounded uppercase bg-slate-900/80 border border-slate-800 text-slate-400">
            {streamPath}
          </span>
          {isHero && (
            <button
              onClick={() => startWebRTC()}
              title="Force Reconnect"
              className="p-1 rounded bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Main Video Viewport */}
      <div className="relative flex-1 w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden">
        {streamMode === 'webrtc' && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isMuted}
            className="w-full h-full object-contain"
            style={{
              filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
            }}
          />
        )}

        {streamMode === 'iframe' && (
          <iframe
            src={iframeUrl}
            title={cameraName}
            className="w-full h-full border-none bg-black"
            scrolling="no"
            allow="autoplay; encrypted-media"
          />
        )}

        {/* Tactical Crosshair HUD (Hero Only) */}
        {isHero && showCrosshair && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_6px_#22d3ee]" />
            <div className="absolute w-32 h-[1px] bg-cyan-400/40" />
            <div className="absolute h-32 w-[1px] bg-cyan-400/40" />
            <div className="absolute w-16 h-16 border border-cyan-400/30 rounded-sm" />
            <div className="absolute w-44 h-44 border border-dashed border-cyan-400/15 rounded-full animate-[spin_40s_linear_infinite]" />
          </div>
        )}

        {/* Loading Overlay */}
        {connectionStatus === 'CONNECTING' && (
          <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-2 pointer-events-none">
            <div className="w-6 h-6 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
            <span className="text-[9px] font-mono text-slate-400">CONNECTING WHEP...</span>
          </div>
        )}

        {/* Offline Splash */}
        {connectionStatus === 'FAILED' && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-3 text-center pointer-events-none">
            <Radio className="w-6 h-6 text-rose-500/80 mb-1 animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-slate-300">STREAM OFFLINE</span>
            <span className="text-[8px] font-mono text-slate-500 mt-0.5">
              {jetsonIp}:{whepPort}/{streamPath}
            </span>
          </div>
        )}

        {/* Hero Quick Floating HUD */}
        {isHero && connectionStatus === 'CONNECTED' && (
          <div className="absolute bottom-2 right-2 flex gap-1 z-20">
            <button
              onClick={() => setShowCrosshair(!showCrosshair)}
              title="Toggle Crosshair HUD"
              className={`p-1.5 rounded text-xs border font-mono transition-colors ${
                showCrosshair ? 'bg-cyan-950/80 text-cyan-400 border-cyan-500/50' : 'bg-slate-900/80 text-slate-400 border-slate-800'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              className="p-1.5 rounded text-xs bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
          </div>
        )}
      </div>

      {/* Click-to-Focus Prompt on Hover (for non-hero thumbnails) */}
      {!isHero && (
        <div className="absolute inset-0 bg-cyan-950/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="px-2 py-1 rounded bg-slate-950/90 border border-cyan-500/40 text-[9px] font-mono font-bold text-cyan-300 tracking-wider">
            FOCUS FEED ↗
          </span>
        </div>
      )}
    </div>
  );
}