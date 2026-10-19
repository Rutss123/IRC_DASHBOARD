/**
 * services/cameras.js
 * -------------------
 * Camera configuration and stream discovery client.
 * Connects to the backend discovery service (which polls MediaMTX).
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export const INITIAL_CAMERAS = [
  {
    id: "nav_cam",
    name: "Navigation Cam",
    type: "navigation",
    status: "online",
    path: "nav_cam"
  },
  {
    id: "realsense_cam",
    name: "RealSense RGB Feed",
    type: "navigation",
    status: "online",
    path: "realsense_cam"
  },
  {
    id: "arm_cam",
    name: "Robotic Arm Cam",
    type: "robotic",
    status: "online",
    path: "arm_cam"
  },
  {
    id: "science_cam",
    name: "Science Cam",
    type: "science",
    status: "online",
    path: "science_cam"
  }
];

export async function fetchAvailableCameras() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/cameras`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.debug("[Cameras] Using fallback camera configurations:", err.message);
  }
  return INITIAL_CAMERAS;
}

export const getCameraTypeColor = (type) => {
  switch (type) {
    case "navigation":
      return "text-cyber-cyan border-cyber-cyan/30 bg-cyber-cyan/10";
    case "science":
      return "text-cyber-amber border-cyber-amber/30 bg-cyber-amber/10";
    case "robotic":
      return "text-purple-400 border-purple-500/30 bg-purple-500/10";
    default:
      return "text-slate-400 border-slate-700/35 bg-slate-800/20";
  }
};
