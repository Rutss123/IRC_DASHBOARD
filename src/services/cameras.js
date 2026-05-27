/**
 * NASA/IRC Rover Camera Profile configurations
 * Prepared for dynamic WebRTC bindings and status monitoring.
 */

export const INITIAL_CAMERAS = [
  {
    id: "front_cam",
    name: "Front Cam",
    type: "navigation",
    status: "online",
    fps: 30,
    latency: 24,
    resolution: "1920x1080",
    stream: null
  },
  {
    id: "rear_cam",
    name: "Rear Cam",
    type: "navigation",
    status: "online",
    fps: 30,
    latency: 28,
    resolution: "1280x720",
    stream: null
  },
  {
    id: "arm_cam",
    name: "Arm Cam",
    type: "robotic",
    status: "online",
    fps: 60,
    latency: 18,
    resolution: "1280x720",
    stream: null
  },
  {
    id: "thermal_cam",
    name: "Thermal Cam",
    type: "robotic",
    status: "online",
    fps: 15,
    latency: 42,
    resolution: "640x480",
    stream: null
  },
  {
    id: "nav_cam",
    name: "Navigation Cam",
    type: "navigation",
    status: "online",
    fps: 30,
    latency: 25,
    resolution: "1920x1080",
    stream: null
  },
  {
    id: "science_cam",
    name: "Science Cam",
    type: "science",
    status: "online",
    fps: 30,
    latency: 35,
    resolution: "3840x2160",
    stream: null
  },
  {
    id: "wheel_cam",
    name: "Wheel Cam",
    type: "auxiliary",
    status: "online",
    fps: 30,
    latency: 29,
    resolution: "1280x720",
    stream: null
  },
  {
    id: "backup_cam",
    name: "Backup Cam",
    type: "auxiliary",
    status: "standby",
    fps: 0,
    latency: 0,
    resolution: "1280x720",
    stream: null
  }
];

export const getCameraTypeColor = (type) => {
  switch (type) {
    case "navigation":
      return "text-cyber-cyan border-cyber-cyan/30";
    case "science":
      return "text-cyber-amber border-cyber-amber/30";
    case "robotic":
      return "text-purple-400 border-purple-500/30";
    default:
      return "text-slate-400 border-slate-700/35";
  }
};
