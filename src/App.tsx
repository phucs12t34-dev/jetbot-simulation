import React, { useState } from 'react';
import { ViewMode, RobotState } from './types/jetbot';
import { Navbar } from './components/Navbar';
import { HardwareLabView } from './components/HardwareLab/HardwareLabView';
import { JupyterLabView } from './components/JupyterLab/JupyterLabView';
import { SimulationArenaView } from './components/SimulationArena/SimulationArenaView';
import { FlightDeckView } from './components/FlightDeck/FlightDeckView';

export const App: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<ViewMode>('arena');

  const [robotState] = useState<RobotState>({
    connected: true,
    leftMotor: { targetSpeed: 0, currentSpeed: 0, rpm: 0 },
    rightMotor: { targetSpeed: 0, currentSpeed: 0, rpm: 0 },
    pose: { x: -1.8, z: -2.0, theta: -Math.PI / 2 },
    telemetry: {
      linearVelocity: 0,
      angularVelocity: 0,
      headingDegrees: 90,
      leftMotorRpm: 0,
      rightMotorRpm: 0,
      batteryVoltage: 7.8,
      batteryPercent: 82,
      gpuTemp: 42.5,
      gpuLoad: 28,
      cpuLoad: 18,
      ramUsedGb: 1.4,
      ramTotalGb: 4.0,
      distanceTraveled: 0,
      fps: 60,
      speedMultiplier: 1.5,
    },
    autonomousMode: 'none',
    oledText: ['NVIDIA JETBOT v2', 'IP: 192.168.1.105', 'RAM: 1.4G / 4.0G', 'GPU: 38% | 42.5C'],
    cameraFps: 30,
    aiProbBlocked: 0.05,
    aiRoadSteering: 0.0,
    aiTargetPoint: { x: 0, y: 0.5 },
    detectedObjects: [],
  });

  const handleEmergencyStop = () => {
    robotState.leftMotor.targetSpeed = 0;
    robotState.rightMotor.targetSpeed = 0;
    robotState.autonomousMode = 'none';
  };

  const handleResetRobot = () => {
    robotState.leftMotor.targetSpeed = 0;
    robotState.leftMotor.currentSpeed = 0;
    robotState.rightMotor.targetSpeed = 0;
    robotState.rightMotor.currentSpeed = 0;
    robotState.pose.x = -1.8;
    robotState.pose.z = -2.0;
    robotState.pose.theta = -Math.PI / 2;
    robotState.autonomousMode = 'none';
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-[#080C10] text-gray-100 overflow-hidden font-sans select-none">
      {/* Top Futuristic Navigation Bar */}
      <Navbar
        currentMode={currentMode}
        onSelectMode={(mode) => setCurrentMode(mode)}
        robotState={robotState}
        onResetRobot={handleResetRobot}
        onEmergencyStop={handleEmergencyStop}
      />

      {/* Main Mode View */}
      <main className="flex-1 overflow-hidden relative">
        {currentMode === 'anatomy' && <HardwareLabView />}
        {currentMode === 'arena' && <SimulationArenaView robotState={robotState} />}
        {currentMode === 'jupyter' && (
          <JupyterLabView
            robotState={robotState}
            onOpenArena={() => setCurrentMode('arena')}
          />
        )}
        {currentMode === 'teleop' && <FlightDeckView robotState={robotState} />}
      </main>
    </div>
  );
};

export default App;
