import React, { useState } from 'react';
import { RobotState } from '../../types/jetbot';
import { Camera, ShieldAlert, Eye, ChevronDown, ChevronUp, Crosshair } from 'lucide-react';

interface FPVCameraFeedProps {
  robotState: RobotState;
}

export const FPVCameraFeed: React.FC<FPVCameraFeedProps> = ({ robotState }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const { aiProbBlocked, aiTargetPoint, detectedObjects } = robotState;
  const isBlocked = aiProbBlocked >= 0.5;

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="cyber-panel px-3 py-1.5 rounded-lg border border-cyber-border text-xs font-mono text-nvidia-green hover:text-white flex items-center gap-2 shadow-xl backdrop-blur-md transition-all"
      >
        <Camera className="w-3.5 h-3.5" />
        <span>Mở Camera FPV AI (224x224)</span>
        <ChevronUp className="w-3.5 h-3.5" />
      </button>
    );
  }

  return (
    <div className="cyber-panel p-2.5 rounded-xl border border-cyber-border flex flex-col gap-1.5 w-64 sm:w-72 shadow-2xl backdrop-blur-md select-none animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between text-xs font-mono text-gray-300 pb-1 border-b border-cyber-border/70">
        <div className="flex items-center gap-1.5">
          <Camera className="w-3.5 h-3.5 text-nvidia-green" />
          <span className="font-bold text-white text-[11px]">CAMERA JETBOT FPV</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <button
            onClick={() => setIsMinimized(true)}
            className="p-0.5 rounded text-gray-400 hover:text-white hover:bg-cyber-card transition-colors"
            title="Thu nhỏ camera"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Video Stream Simulation */}
      <div className="relative aspect-square w-full rounded-lg bg-black border border-cyber-border overflow-hidden">
        {/* Perspective Road Canvas */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#141d2b] via-[#1e2c3d] to-[#0c131c]">
          {/* Horizon Line */}
          <div className="absolute top-[38%] left-0 right-0 h-[1px] bg-cyber-border/50" />

          {/* Road Visual Vectors */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
            {/* Road Boundary Lines */}
            <line x1="15" y1="100" x2="45" y2="38" stroke="#cbd5e1" strokeWidth="2" />
            <line x1="85" y1="100" x2="55" y2="38" stroke="#cbd5e1" strokeWidth="2" />

            {/* Center Yellow Dashes */}
            <line
              x1="50"
              y1="100"
              x2="50"
              y2="38"
              stroke="#eab308"
              strokeWidth="2"
              strokeDasharray="4 4"
            />

            {/* AI Target Steering Vector */}
            <circle
              cx={50 + aiTargetPoint.x * 35}
              cy={38 + (1 - aiTargetPoint.y) * 45}
              r="4"
              fill="#76b900"
              className="animate-pulse"
            />
            <line
              x1="50"
              y1="90"
              x2={50 + aiTargetPoint.x * 35}
              y2={38 + (1 - aiTargetPoint.y) * 45}
              stroke="#76b900"
              strokeWidth="1.5"
            />
          </svg>

          {/* AI Detected Obstacle Bounding Boxes */}
          {detectedObjects.map((obj, i) => (
            <div
              key={i}
              className="absolute border-2 border-red-500 bg-red-500/15 rounded flex flex-col justify-start p-0.5 font-mono text-[9px] text-red-200 animate-pulse"
              style={{
                left: `${Math.max(10, Math.min(75, obj.x * 100 - (obj.w * 100) / 2))}%`,
                top: `${Math.max(25, Math.min(65, obj.y * 100 - (obj.h * 100) / 2))}%`,
                width: `${Math.min(50, obj.w * 100)}%`,
                height: `${Math.min(50, obj.h * 100)}%`,
              }}
            >
              <span className="bg-black/90 px-1 py-0.2 rounded w-fit text-[8px] font-bold">
                {obj.label} ({obj.confidence}%)
              </span>
            </div>
          ))}

          {/* Reticle */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
            <Crosshair className="w-6 h-6 text-white" />
          </div>

          {/* Status Badge */}
          <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none">
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono flex items-center gap-1 shadow ${
                isBlocked
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              {isBlocked ? <ShieldAlert className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
              <span>{isBlocked ? 'BLOCKED' : 'FREE'}</span>
            </span>
            <span className="text-[9px] font-mono bg-black/70 px-1 rounded text-gray-300">
              30 FPS
            </span>
          </div>

          {/* P(blocked) bar */}
          <div className="absolute bottom-1.5 left-1.5 right-1.5 p-1 rounded bg-black/80 text-[9px] font-mono flex flex-col gap-0.5">
            <div className="flex justify-between text-gray-400">
              <span>P(blocked):</span>
              <span className={`font-bold ${isBlocked ? 'text-red-400' : 'text-emerald-400'}`}>
                {(aiProbBlocked * 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-150 ${isBlocked ? 'bg-red-500' : 'bg-nvidia-green'}`}
                style={{ width: `${Math.min(100, Math.max(0, aiProbBlocked * 100))}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
