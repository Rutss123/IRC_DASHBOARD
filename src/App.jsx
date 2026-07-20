import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { RoverProvider } from './context/RoverContext';
import { useSimulatedRover } from './hooks/useSimulatedRover';
import MissionControlLayout from './layouts/MissionControlLayout';
import PrimaryOperatorView from './pages/PrimaryOperatorView';
import MultiCameraControlView from './pages/MultiCameraControlView';
import LifeScienceView from './pages/LifeScienceView';
import ControllerView from './pages/ControllerView';
import SettingsView from './pages/SettingsView';

// Background driver trigger to update live state data loops
const RoverSimulatorDriver = () => {
  useSimulatedRover(true);
  return null;
};

function App() {
  return (
    <RoverProvider>
      {/* Background Simulation Loop Trigger */}
      <RoverSimulatorDriver />
      
      <Router>
        <MissionControlLayout>
          <Routes>
            {/* Page 1 - Primary Operator driving telemetry Viewport */}
            <Route path="/" element={<PrimaryOperatorView />} />
            
            {/* Page 2 - Multi Camera Controls Matrix Dashboard */}
            <Route path="/multicam" element={<MultiCameraControlView />} />

            {/* Page 3 - Dedicated Science Laboratory Telemetry */}
            <Route path="/science" element={<LifeScienceView />} />

            {/* Page 4 - Wireframe Joystick / Teleoperation Console */}
            <Route path="/controller" element={<ControllerView />} />

            {/* Page 5 - Config and Preferences settings Panel */}
            <Route path="/settings" element={<SettingsView />} />
          </Routes>
        </MissionControlLayout>
      </Router>
    </RoverProvider>
  );
}

export default App;
