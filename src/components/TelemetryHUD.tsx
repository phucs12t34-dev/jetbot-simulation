import React from 'react';
import { RobotState } from '../types/jetbot';
import { Gauge, Compass, Activity, Navigation, Zap } from 'lucide-react';

interface TelemetryHUDProps {
  robotState: RobotState;
}

export const TelemetryHUD: React.FC<TelemetryHUDProps> = ({ robotState }) => {
  const { telemetry, pose, autonomousMode, leftMotor, rightMotor } = robotState;

  const speedCms = Math.round(telemetry.linearVelocity * 100);

  return (
    <div className="cyber-panel p-2.5 rounded-lg border border-cyber-border text-xs font-mono select-none flex flex-wrap items-center justify-between gap-3 shadow-lg">
      {/* 1. Velocity */}
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded bg-cyber-card border border-cyber-border text-cyber-accent">
          <Gauge className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wider">Vận Tốc Dài</div>
          <div className="text-sm font-bold text-white flex items-baseline gap-1">
            <span className="text-cyber-accent">{speedCms}</span>
            <span className="text-[10px] text-gray-400">cm/s</span>
            <span className="text-[10px] text-gray-500">({telemetry.linearVelocity.toFixed(2)} m/s)</span>
          </div>
        </div>
      </div>

      {/* 2. Left & Right Motor RPM */}
      <div className="flex items-center gap-3 bg-cyber-card/60 px-2.5 py-1 rounded border border-cyber-border/40">
        <div>
          <div className="text-[9px] text-gray-400">MOTOR L</div>
          <div className={`font-bold ${leftMotor.targetSpeed < 0 ? 'text-amber-400' : 'text-nvidia-green'}`}>
            {leftMotor.rpm} <span className="text-[9px] text-gray-500">RPM</span>
          </div>
        </div>
        <div className="w-[1px] h-6 bg-cyber-border" />
        <div>
          <div className="text-[9px] text-gray-400">MOTOR R</div>
          <div className={`font-bold ${rightMotor.targetSpeed < 0 ? 'text-amber-400' : 'text-nvidia-green'}`}>
            {rightMotor.rpm} <span className="text-[9px] text-gray-500">RPM</span>
          </div>
        </div>
      </div>

      {/* 3. Heading Compass */}
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded bg-cyber-card border border-cyber-border text-amber-400">
          <Compass className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wider">Góc Hướng (Heading)</div>
          <div className="text-sm font-bold text-amber-300">
            {Math.round(telemetry.headingDegrees)}°
            <span className="text-[10px] text-gray-400 ml-1">({(pose.theta * (180 / Math.PI)).toFixed(1)}°)</span>
          </div>
        </div>
      </div>

      {/* 4. Pose Coordinates */}
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded bg-cyber-card border border-cyber-border text-emerald-400">
          <Navigation className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wider">Toạ Độ (X, Z)</div>
          <div className="text-xs font-semibold text-emerald-300">
            X: <span className="text-white">{pose.x.toFixed(2)}m</span> | Z: <span className="text-white">{pose.z.toFixed(2)}m</span>
          </div>
        </div>
      </div>

      {/* 5. Autonomous AI Mode */}
      <div className="flex items-center gap-2 bg-[#0d141e] px-2.5 py-1 rounded border border-cyber-border">
        <Activity className="w-4 h-4 text-nvidia-green animate-pulse" />
        <div>
          <div className="text-[9px] text-gray-400">CHẾ ĐỘ LÁI</div>
          <div className="font-bold">
            {autonomousMode === 'none' && <span className="text-gray-400">Thủ Công (Manual)</span>}
            {autonomousMode === 'collision' && (
              <span className="text-nvidia-green flex items-center gap-1">
                ResNet-18 Né Vật Cản
                <span className="text-[9px] text-gray-400 font-mono">({Math.round(robotState.aiProbBlocked * 100)}% Blocked)</span>
              </span>
            )}
            {autonomousMode === 'road' && (
              <span className="text-cyber-accent flex items-center gap-1">
                Road Following PID
                <span className="text-[9px] text-gray-400 font-mono">(steer: {robotState.aiRoadSteering.toFixed(2)})</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 6. Distance Odometer */}
      <div className="hidden xl:flex items-center gap-1.5 text-gray-400 text-xs">
        <Zap className="w-3.5 h-3.5 text-yellow-400" />
        <span>Quãng đường:</span>
        <span className="text-white font-bold">{telemetry.distanceTraveled.toFixed(2)}m</span>
      </div>
    </div>
  );
};
