import React, { useState, useEffect, useRef } from 'react';
import { useRover } from '../context/RoverContext';
import StatusLed from '../components/common/StatusLed';
import ActionBar from '../components/controls/ActionBar';
import { 
  Beaker, 
  Thermometer, 
  Droplet, 
  Wind, 
  Sun, 
  Radio, 
  Compass, 
  Leaf, 
  Activity, 
  Database,
  AlertTriangle,
  Flame,
  Lightbulb,
  Cpu
} from 'lucide-react';

export default function LifeScienceView() {
  const { telemetry } = useRover();
  const sensors = telemetry.science || {};

  // Default fallbacks to prevent crash
  const temp = sensors.temp ?? 28.2;
  const humidity = sensors.humidity ?? 54;
  const pressure = sensors.pressure ?? 1008;
  const co = sensors.co ?? 24;
  const ch4 = sensors.ch4 ?? 11;
  const airQuality = sensors.airQuality ?? 'SAFE';
  const soilN = sensors.soilN ?? 42;
  const soilP = sensors.soilP ?? 18;
  const soilK = sensors.soilK ?? 35;
  const soilPh = sensors.soilPh ?? 6.8;
  const soilMoisture = sensors.soilMoisture ?? 48;
  const soilTemp = sensors.soilTemp ?? 22.4;
  const co2 = sensors.co2 ?? 412;
  const h2s = sensors.h2s ?? 1.2;
  const uvIndex = sensors.uvIndex ?? 3.1;
  const light = sensors.light ?? 850;
  const radiation = sensors.radiation ?? 0.14;
  const sampleStatus = sensors.sampleStatus ?? 'SECURED_CAROUSEL_3';
  const experimentStatus = sensors.experimentStatus ?? 'SPECTROMETRY_ACTIVE';

  // State to hold moving histories of coordinates to plot SVGs
  const [history, setHistory] = useState({
    temp: Array(15).fill(28.2),
    humidity: Array(15).fill(54),
    soilMoisture: Array(15).fill(48),
    co2: Array(15).fill(412),
    radiation: Array(15).fill(0.14)
  });

  // Ticking science console logs state
  const [scienceLogs, setScienceLogs] = useState([
    { time: '16:40:11', msg: 'SPECTROMETRY: Initiating infrared core absorption diagnostic...' },
    { time: '16:40:15', msg: 'SAMPLE INGEST: Core sample Carousel #3 loaded successfully.' },
    { time: '16:40:22', msg: 'SOIL MATRIX: NPK sensors calibrated at 100% telemetry resolution.' },
    { time: '16:40:35', msg: 'ATMOSPHERE: Gas chromatograph baseline calibration complete.' }
  ]);

  // Push new telemetry points to history array on change
  useEffect(() => {
    setHistory(prev => ({
      temp: [...prev.temp.slice(1), temp],
      humidity: [...prev.humidity.slice(1), humidity],
      soilMoisture: [...prev.soilMoisture.slice(1), soilMoisture],
      co2: [...prev.co2.slice(1), co2],
      radiation: [...prev.radiation.slice(1), radiation]
    }));

    // Periodically add mock diagnostic message (approx 20% chance)
    if (Math.random() < 0.2) {
      const msgs = [
        `CHROMATOGRAPH: Methane sensor reading stabilized at ${ch4} ppm`,
        `RADIATION: Scintillation level drift verified at ${radiation} µSv/h`,
        `SOIL ANALYZER: pH core levels verified at ${soilPh}`,
        `CAROUSEL: Sample core spectrometer reporting status: ${experimentStatus}`,
        `ATMOSPHERE: CO2 levels registered at ${co2} ppm (stable trend)`
      ];
      const timeStr = new Date().toTimeString().slice(0, 8);
      setScienceLogs(prev => [
        { time: timeStr, msg: msgs[Math.floor(Math.random() * msgs.length)] },
        ...prev.slice(0, 18) // buffer size limit
      ]);
    }
  }, [temp, humidity, soilMoisture, co2, radiation, ch4, soilPh, experimentStatus]);

  // Helper to generate SVG Polyline points
  const getPolylinePoints = (arr, min, max, width = 120, height = 28) => {
    return arr.map((val, idx) => {
      const x = (idx / (arr.length - 1)) * width;
      const range = max - min === 0 ? 1 : max - min;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');
  };

  const getAqColor = (aq) => {
    if (aq === 'CRITICAL') return 'text-cyber-red animate-pulse';
    if (aq === 'WARNING') return 'text-cyber-orange';
    return 'text-cyber-green';
  };

  return (
    <div className="flex-1 flex flex-col gap-4 overflow-hidden select-none font-mono">
      
      {/* 1. OPERATIONS HEADER STRIP */}
      <div className="w-full bg-[#0b0f19]/60 border border-space-800 rounded-md p-3.5 flex justify-between items-center font-mono text-[10px] shrink-0">
        <h1 className="text-sm font-bold tracking-widest text-slate-100 uppercase m-0 flex items-center gap-2">
          <Beaker className="w-4 h-4 text-cyber-amber animate-pulse" />
          <span>LIFE SCIENCE ANALYSIS SYSTEM</span>
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-slate-500 font-bold uppercase">LAST READINGS INDEX</span>
          <span className="text-cyber-amber font-black border border-cyber-amber/25 px-2 py-0.5 bg-cyber-amber/5 rounded">
            UTC {new Date().toISOString().slice(11, 19)}
          </span>
        </div>
      </div>

      {/* 2. SCIENCE WORKSPACE GRID */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-4 gap-4 overflow-y-auto pr-1 items-start">
        
        {/* COLUMNS 1, 2, 3: SENSORS AND LAB CHAMBERS */}
        <div className="xl:col-span-3 flex flex-col gap-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* PANEL A: ATMOSPHERIC LABORATORY */}
            <div className="hud-panel p-4 bg-[#0b0f19]/30 border-space-800 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-space-800 pb-2">
                <span className="text-[10px] text-cyber-orange font-bold uppercase tracking-widest">[SEC_01_ATMOSPHERICS]</span>
                <StatusLed status="online" className="w-2 h-2" />
              </div>

              <div className="flex flex-col gap-2.5 text-[9px]">
                {/* Air Temp */}
                <div className="flex justify-between items-center bg-[#060608]/85 p-2 border border-space-850 rounded-lg">
                  <div className="flex flex-col">
                    <span className="text-slate-500 font-bold">AIR TEMPERATURE</span>
                    <span className="text-xs font-black text-slate-200 mt-0.5">{temp} <span className="text-[8px] font-normal text-slate-500">°C</span></span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-[120px] h-[28px] stroke-cyber-orange fill-none" strokeWidth="1.2">
                      <polyline points={getPolylinePoints(history.temp, 27, 30)} />
                    </svg>
                    <span className="text-cyber-orange text-[8px] font-bold">BME280</span>
                  </div>
                </div>

                {/* Humidity */}
                <div className="flex justify-between items-center bg-[#060608]/85 p-2 border border-space-850 rounded-lg">
                  <div className="flex flex-col">
                    <span className="text-slate-500 font-bold">RELATIVE HUMIDITY</span>
                    <span className="text-xs font-black text-cyber-cyan mt-0.5">{humidity} <span className="text-[8px] font-normal text-slate-500">%</span></span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-[120px] h-[28px] stroke-cyber-cyan fill-none" strokeWidth="1.2">
                      <polyline points={getPolylinePoints(history.humidity, 50, 60)} />
                    </svg>
                    <span className="text-cyber-cyan text-[8px] font-bold">BME280</span>
                  </div>
                </div>

                {/* Pressure */}
                <div className="flex justify-between items-center bg-[#060608]/85 p-2 border border-space-850 rounded-lg">
                  <div className="flex flex-col">
                    <span className="text-slate-500 font-bold">ATM PRESSURE</span>
                    <span className="text-xs font-black text-cyber-amber mt-0.5">{pressure} <span className="text-[8px] font-normal text-slate-500">hPa</span></span>
                  </div>
                  <div className="flex items-center gap-3 font-bold text-cyber-amber text-[9px]">
                    <span>101.3 kPa (STP)</span>
                  </div>
                </div>

                {/* UV Index */}
                <div className="flex justify-between items-center bg-[#060608]/85 p-2 border border-space-850 rounded-lg">
                  <div className="flex flex-col">
                    <span className="text-slate-500 font-bold">UV INDEX</span>
                    <span className="text-xs font-black text-slate-200 mt-0.5">{uvIndex} <span className="text-[8px] font-normal text-slate-500">UVI</span></span>
                  </div>
                  <span className="text-[8.5px] border border-cyber-cyan/35 text-cyber-cyan px-2 py-0.5 rounded bg-cyber-cyan/5 font-black uppercase">
                    {uvIndex > 7 ? 'CRITICAL' : uvIndex > 4 ? 'MODERATE' : 'LOW'}
                  </span>
                </div>

                {/* Light Intensity */}
                <div className="flex justify-between items-center bg-[#060608]/85 p-2 border border-space-850 rounded-lg">
                  <div className="flex flex-col">
                    <span className="text-slate-500 font-bold">LIGHT INTENSITY</span>
                    <span className="text-xs font-black text-cyber-cyan mt-0.5">{light} <span className="text-[8px] font-normal text-slate-500">LUX</span></span>
                  </div>
                  <span className="text-slate-450 font-bold">OPTICAL_DIODE</span>
                </div>

                {/* Radiation */}
                <div className="flex justify-between items-center bg-[#060608]/85 p-2 border border-space-850 rounded-lg">
                  <div className="flex flex-col">
                    <span className="text-slate-500 font-bold">RADIATION (GEIGER)</span>
                    <span className="text-xs font-black text-cyber-red mt-0.5">{radiation} <span className="text-[8px] font-normal text-slate-500">µSv/h</span></span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-[120px] h-[28px] stroke-cyber-red fill-none" strokeWidth="1.2">
                      <polyline points={getPolylinePoints(history.radiation, 0.1, 0.2)} />
                    </svg>
                    <span className="text-cyber-red text-[8px] font-bold">GEIGER_ON</span>
                  </div>
                </div>
              </div>
            </div>

            {/* PANEL B: GAS CHROMATOGRAPH & GAS CONCENTRATION */}
            <div className="hud-panel p-4 bg-[#0b0f19]/30 border-space-800 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-space-800 pb-2">
                <span className="text-[10px] text-cyber-amber font-bold uppercase tracking-widest">[SEC_02_CHROMATOGRAPHY]</span>
                <StatusLed status="online" className="w-2 h-2" />
              </div>

              <div className="flex flex-col gap-2.5 text-[9px]">
                {/* CO */}
                <div className="flex justify-between items-center bg-[#060608]/85 p-2.5 border border-space-850 rounded-lg">
                  <span className="text-slate-500 font-bold">CO CARBON MONOXIDE</span>
                  <span className="text-xs font-black text-slate-200">{co} <span className="text-[8px] font-normal text-slate-500">ppm</span></span>
                </div>

                {/* CH4 */}
                <div className="flex justify-between items-center bg-[#060608]/85 p-2.5 border border-space-850 rounded-lg">
                  <span className="text-slate-500 font-bold">CH4 METHANE</span>
                  <span className="text-xs font-black text-slate-200">{ch4} <span className="text-[8px] font-normal text-slate-500">ppm</span></span>
                </div>

                {/* CO2 */}
                <div className="flex justify-between items-center bg-[#060608]/85 p-2.5 border border-space-850 rounded-lg">
                  <div className="flex flex-col">
                    <span className="text-slate-500 font-bold">CO2 CARBON DIOXIDE</span>
                    <span className="text-xs font-black text-slate-200 mt-0.5">{co2} <span className="text-[8px] font-normal text-slate-500">ppm</span></span>
                  </div>
                  <svg className="w-[120px] h-[28px] stroke-cyber-cyan fill-none" strokeWidth="1.2">
                    <polyline points={getPolylinePoints(history.co2, 400, 430)} />
                  </svg>
                </div>

                {/* H2S */}
                <div className="flex justify-between items-center bg-[#060608]/85 p-2.5 border border-space-850 rounded-lg">
                  <span className="text-slate-500 font-bold">H2S HYDROGEN SULFIDE</span>
                  <span className="text-xs font-black text-cyber-orange">{h2s} <span className="text-[8px] font-normal text-slate-500">ppm</span></span>
                </div>

                {/* Air Quality Status */}
                <div className="flex justify-between items-center bg-[#060608]/85 p-2.5 border border-space-850 rounded-lg">
                  <span className="text-slate-500 font-bold">AIR QUALITY INDEX</span>
                  <div className="flex items-center gap-1.5">
                    <StatusLed 
                      status={airQuality === 'SAFE' ? 'online' : (airQuality === 'WARNING' ? 'warning' : 'critical')} 
                      pulse={airQuality !== 'SAFE'} 
                      className="w-1.5 h-1.5" 
                    />
                    <span className={`text-[10px] font-black uppercase ${getAqColor(airQuality)}`}>{airQuality}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* PANEL C: SOIL ANALYZER (NPK & MOISTURE) */}
            <div className="hud-panel p-4 bg-[#0b0f19]/30 border-space-800 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-space-800 pb-2">
                <span className="text-[10px] text-cyber-amber font-bold uppercase tracking-widest">[SEC_03_SOIL_ANALYZER]</span>
                <StatusLed status="online" className="w-2 h-2" />
              </div>

              <div className="flex flex-col gap-2.5 text-[9px]">
                {/* NPK grid */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-[#060608]/85 border border-space-850 rounded-lg flex flex-col justify-center">
                    <span className="text-[8px] text-slate-500 font-bold uppercase">NITROGEN (N)</span>
                    <span className="text-xs font-black text-slate-200 mt-1">{soilN} <span className="text-[7.5px] font-normal text-slate-500">mg</span></span>
                  </div>
                  <div className="p-2 bg-[#060608]/85 border border-space-850 rounded-lg flex flex-col justify-center">
                    <span className="text-[8px] text-slate-500 font-bold uppercase">PHOSPHORUS (P)</span>
                    <span className="text-xs font-black text-slate-200 mt-1">{soilP} <span className="text-[7.5px] font-normal text-slate-500">mg</span></span>
                  </div>
                  <div className="p-2 bg-[#060608]/85 border border-space-850 rounded-lg flex flex-col justify-center">
                    <span className="text-[8px] text-slate-500 font-bold uppercase">POTASSIUM (K)</span>
                    <span className="text-xs font-black text-slate-200 mt-1">{soilK} <span className="text-[7.5px] font-normal text-slate-500">mg</span></span>
                  </div>
                </div>

                {/* Soil Moisture */}
                <div className="flex justify-between items-center bg-[#060608]/85 p-2 border border-space-850 rounded-lg">
                  <div className="flex flex-col">
                    <span className="text-slate-500 font-bold">SOIL MOISTURE</span>
                    <span className="text-xs font-black text-cyber-cyan mt-0.5">{soilMoisture} <span className="text-[8px] font-normal text-slate-500">%</span></span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="w-[120px] h-[28px] stroke-cyber-cyan fill-none" strokeWidth="1.2">
                      <polyline points={getPolylinePoints(history.soilMoisture, 45, 52)} />
                    </svg>
                    <span className="text-cyber-cyan text-[8px] font-bold">CAPACITIVE</span>
                  </div>
                </div>

                {/* Soil Temperature */}
                <div className="flex justify-between items-center bg-[#060608]/85 p-2.5 border border-space-850 rounded-lg">
                  <span className="text-slate-500 font-bold">SOIL TEMPERATURE</span>
                  <span className="text-xs font-black text-slate-200">{soilTemp} <span className="text-[8px] font-normal text-slate-500">°C</span></span>
                </div>

                {/* Soil pH */}
                <div className="flex justify-between items-center bg-[#060608]/85 p-2.5 border border-space-850 rounded-lg">
                  <span className="text-slate-500 font-bold">SOIL pH MATRIX</span>
                  <span className="text-xs font-black text-cyber-amber">{soilPh} <span className="text-[8px] font-normal text-slate-500">pH</span></span>
                </div>
              </div>
            </div>

            {/* PANEL D: DRILL CHAMBER & SAMPLE CONTROLS */}
            <div className="hud-panel p-4 bg-[#0b0f19]/30 border-space-800 flex flex-col justify-between h-full gap-3">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-space-800 pb-2">
                  <span className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">[SEC_04_CHAMBER_STATUS]</span>
                  <StatusLed status="active" className="w-2 h-2" />
                </div>

                <div className="flex flex-col gap-2.5 text-[9px]">
                  {/* Sample Status */}
                  <div className="flex flex-col bg-[#060608]/85 p-2.5 border border-space-850 rounded-lg gap-0.5">
                    <span className="text-slate-500 font-bold">SAMPLE INGEST RECEPTACLE</span>
                    <span className="text-xs font-black text-cyber-cyan uppercase">{sampleStatus}</span>
                  </div>

                  {/* Experiment Status */}
                  <div className="flex flex-col bg-[#060608]/85 p-2.5 border border-space-850 rounded-lg gap-0.5">
                    <span className="text-slate-500 font-bold">SPECTROMETER PROFILE</span>
                    <span className="text-xs font-black text-cyber-orange uppercase">{experimentStatus}</span>
                  </div>
                </div>
              </div>

              {/* Progress visual bar */}
              <div className="flex flex-col gap-1 text-[8.5px] border-t border-space-900/60 pt-2.5">
                <div className="flex justify-between font-bold text-slate-400">
                  <span>SPECTRAL SCAN SPEED:</span>
                  <span className="text-cyber-amber font-black">94.2% COMPLETE</span>
                </div>
                <div className="w-full bg-space-950 h-1.5 rounded-sm border border-space-800 overflow-hidden">
                  <div className="bg-gradient-to-r from-cyber-cyan to-cyber-amber h-full w-[94.2%]" />
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* COLUMN 4: LOGGING & WARNING SIDE PANEL */}
        <div className="xl:col-span-1 flex flex-col gap-4">
          
          {/* Science Alerts Box */}
          <div className="hud-panel p-3.5 bg-space-950/75 border border-cyber-red/25 rounded-xl flex flex-col gap-2.5">
            <div className="flex items-center gap-2 border-b border-cyber-red/20 pb-2 text-cyber-red font-black text-[9.5px]">
              <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
              <span>ACTIVE SCIENCE ALERTS</span>
            </div>

            <div className="flex flex-col gap-2 font-mono text-[8px]">
              {co > 35 && (
                <div className="flex items-center gap-2 bg-cyber-red/10 border border-cyber-red/30 text-cyber-red p-2 rounded">
                  <span className="animate-ping w-1 h-1 rounded-full bg-cyber-red shrink-0" />
                  <span>CO MONOXIDE CONCENTRATION ABOVE SAFETY LIMIT</span>
                </div>
              )}
              {ch4 > 15 && (
                <div className="flex items-center gap-2 bg-cyber-red/10 border border-cyber-red/30 text-cyber-red p-2 rounded">
                  <span className="animate-ping w-1 h-1 rounded-full bg-cyber-red shrink-0" />
                  <span>METHANE SPARK WARNING: LEAK DETECTED</span>
                </div>
              )}
              {radiation > 0.35 ? (
                <div className="flex items-center gap-2 bg-cyber-red/10 border border-cyber-red/30 text-cyber-red p-2 rounded">
                  <span className="animate-ping w-1 h-1 rounded-full bg-cyber-red shrink-0" />
                  <span>CRITICAL CRUSTAL GAMMA EXPOSURE</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-space-950 border border-space-850 text-slate-400 p-2 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyber-green shrink-0" />
                  <span>RADIATION PARAMETERS STABLE</span>
                </div>
              )}
              <div className="flex items-center gap-2 bg-space-950 border border-space-850 text-slate-450 p-2 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-cyber-cyan shrink-0" />
                <span>SOIL SATURATION PHASES NOMINAL</span>
              </div>
            </div>
          </div>

          {/* Interactive Science Logs */}
          <div className="hud-panel p-3.5 bg-[#0b0f19]/30 border-space-800 rounded-xl flex flex-col gap-2.5 h-[340px]">
            <div className="flex items-center justify-between border-b border-space-800 pb-2">
              <span className="text-[10px] text-cyber-amber font-bold uppercase tracking-widest flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-cyber-amber animate-pulse" />
                <span>LAB_INGEST_LOGS</span>
              </span>
              <span className="text-[7.5px] text-slate-500 font-bold">MAX_BUFFER_100</span>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col gap-2 text-[8px] font-mono text-slate-350 scrollbar-thin">
              {scienceLogs.map((l, idx) => (
                <div key={idx} className="flex gap-1.5 leading-relaxed">
                  <span className="text-cyber-cyan shrink-0">[{l.time}]</span>
                  <span className="text-slate-300">{l.msg}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* 3. DOCKED FOOTER ACTIONS */}
      <ActionBar />

    </div>
  );
}
