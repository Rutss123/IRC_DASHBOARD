import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { RoverProvider } from './context/RoverContext';
import { ThemeProvider } from './context/ThemeContext';
import { useSimulatedRover } from './hooks/useSimulatedRover';
import MissionControlLayout from './layouts/MissionControlLayout';
import PrimaryOperatorView from './pages/PrimaryOperatorView';
import RoboticArmView from './pages/RoboticArmView';
import LifeScienceView from './pages/LifeScienceView';
import MultiCameraControlView from './pages/MultiCameraControlView';

const RoverSimulatorDriver = () => {
  const isSimulationEnabled = import.meta.env.VITE_ENABLE_SIMULATION === 'true';
  useSimulatedRover(isSimulationEnabled);
  return null;
};

function App() {
  return (
    <ThemeProvider>
      <RoverProvider>
        <RoverSimulatorDriver />
        <Router>
        <MissionControlLayout>
          <Routes>
            {/* Tab 1 - Primary Cockpit HUD (Driving & Nav) */}
            <Route path="/" element={<PrimaryOperatorView />} />

            {/* Tab 2 - Dedicated Manipulator & Arm Control */}
            <Route path="/arm" element={<RoboticArmView />} />

            {/* Tab 3 - Dedicated Environmental & Life Science Laboratory */}
            <Route path="/science" element={<LifeScienceView />} />

            {/* Tab 4 - Full Multi-Camera Matrix Deck */}
            <Route path="/multicam" element={<MultiCameraControlView />} />
          </Routes>
        </MissionControlLayout>
      </Router>
    </RoverProvider>
  </ThemeProvider>
  );
}

export default App;
