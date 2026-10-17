import React, { useState, useEffect } from 'react';
import { RobotState } from '../../types/jetbot';
import {
  Video,
  Sliders,
  Gamepad2,
  Cpu,
  Tv,
  Activity,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
  Eye,
  CheckCircle2,
  Navigation,
  Compass,
} from 'lucide-react';
import { soundFx } from '../../utils/audio';

interface IpywidgetsPanelProps {
  type: string;
  robotState: RobotState;
}

export const IpywidgetsPanel: React.FC<IpywidgetsPanelProps> = ({ type, robotState }) => {
  const [motionTicks, setMotionTicks] = useState(0);

  // Poll for animated updates
  useEffect(() => {
    const timer = setInterval(() => {
      setMotionTicks((t) => t + 1);
    }, 100);
    return () => clearInterval(timer);
  }, []);

  // 1. MOTION SIMULATION WIDGET (Cho các bài điều khiển động cơ cơ bản)
  if (type === 'motion_sim' || type === 'sliders') {
    const isMoving = Math.abs(robotState.leftMotor.targetSpeed) > 0.01 || Math.abs(robotState.rightMotor.targetSpeed) > 0.01;
    let motionAction = 'Đang đứng yên (robot.stop())';
    if (robotState.leftMotor.targetSpeed > 0 && robotState.rightMotor.targetSpeed > 0) {
      motionAction = 'Đang chạy tiến thẳng (robot.forward())';
    } else if (robotState.leftMotor.targetSpeed < 0 && robotState.rightMotor.targetSpeed < 0) {
      motionAction = 'Đang chạy lùi (robot.backward())';
    } else if (robotState.leftMotor.targetSpeed < 0 && robotState.rightMotor.targetSpeed > 0) {
      motionAction = 'Đang quay tại chỗ sang Trái (robot.left())';
    } else if (robotState.leftMotor.targetSpeed > 0 && robotState.rightMotor.targetSpeed < 0) {
      motionAction = 'Đang quay tại chỗ sang Phải (robot.right())';
    } else if (robotState.leftMotor.targetSpeed !== robotState.rightMotor.targetSpeed) {
      motionAction = 'Đang lái cua vòng vi sai (robot.set_motors())';
    }

    return (
      <div className="p-3.5 my-2.5 rounded-xl bg-[#090E15] border border-cyber-border max-w-lg space-y-3 font-mono text-xs shadow-lg">
        <div className="flex items-center justify-between pb-2 border-b border-cyber-border text-gray-300">
          <span className="flex items-center gap-2 text-nvidia-green font-bold">
            <Activity className="w-4 h-4" />
            MÔ PHỎNG KẾT QUẢ ĐỘNG HỌC (MOTION SIMULATOR)
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isMoving ? 'bg-nvidia-green text-black animate-pulse' : 'bg-gray-800 text-gray-400'}`}>
            {isMoving ? 'MOTOR ACTIVE' : 'IDLE'}
          </span>
        </div>

        {/* Action Description */}
        <div className="p-2 rounded-lg bg-[#111924] border border-cyber-border/70 flex items-center justify-between text-xs">
          <span className="text-gray-400">Hành vi robot:</span>
          <span className="text-white font-bold">{motionAction}</span>
        </div>

        {/* Visual 2D Robot Chassis Kinematics Diagram */}
        <div className="relative h-28 rounded-lg bg-[#0e1622] border border-cyber-border/60 flex items-center justify-center overflow-hidden">
          {/* Floor grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1b2636_1px,transparent_1px),linear-gradient(to_bottom,#1b2636_1px,transparent_1px)] bg-[size:14px_14px] opacity-40" />

          {/* JetBot Chassis Representation */}
          <div className="relative w-28 h-20 rounded-xl bg-nvidia-green/20 border-2 border-nvidia-green flex flex-col items-center justify-between p-1.5 shadow-[0_0_15px_rgba(118,185,0,0.3)]">
            {/* Front Caster Wheel */}
            <div className="w-3.5 h-3.5 rounded-full bg-cyan-400 border border-white flex items-center justify-center text-[7px] text-black font-bold">
              F
            </div>

            {/* Middle Jetson Nano & Motor status */}
            <div className="flex items-center justify-between w-full px-1 text-[9px]">
              {/* Left Motor bar */}
              <div className="flex flex-col items-center">
                <span className="text-[8px] text-gray-400">L</span>
                <span className="font-bold text-nvidia-green">{robotState.leftMotor.targetSpeed.toFixed(2)}</span>
              </div>
              <div className="text-[8px] text-gray-300 font-bold">JETBOT</div>
              {/* Right Motor bar */}
              <div className="flex flex-col items-center">
                <span className="text-[8px] text-gray-400">R</span>
                <span className="font-bold text-nvidia-green">{robotState.rightMotor.targetSpeed.toFixed(2)}</span>
              </div>
            </div>

            {/* Rear Caster Wheel */}
            <div className="w-3.5 h-3.5 rounded-full bg-cyan-400 border border-white flex items-center justify-center text-[7px] text-black font-bold">
              R
            </div>

            {/* Left and Right Main Wheels */}
            <div className={`absolute -left-2.5 top-5 w-2 h-10 rounded bg-gray-900 border-2 ${robotState.leftMotor.targetSpeed !== 0 ? 'border-nvidia-green animate-pulse' : 'border-gray-600'}`} />
            <div className={`absolute -right-2.5 top-5 w-2 h-10 rounded bg-gray-900 border-2 ${robotState.rightMotor.targetSpeed !== 0 ? 'border-nvidia-green animate-pulse' : 'border-gray-600'}`} />
          </div>
        </div>

        {/* Live Motor Sliders */}
        <div className="space-y-2 pt-1">
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-400">robot.left_motor.value:</span>
              <span className="text-nvidia-green font-bold">{robotState.leftMotor.targetSpeed.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="-1.0"
              max="1.0"
              step="0.05"
              value={robotState.leftMotor.targetSpeed}
              onChange={(e) => {
                robotState.leftMotor.targetSpeed = parseFloat(e.target.value);
                soundFx.playClick();
              }}
              className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-nvidia-green"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-400">robot.right_motor.value:</span>
              <span className="text-nvidia-green font-bold">{robotState.rightMotor.targetSpeed.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="-1.0"
              max="1.0"
              step="0.05"
              value={robotState.rightMotor.targetSpeed}
              onChange={(e) => {
                robotState.rightMotor.targetSpeed = parseFloat(e.target.value);
                soundFx.playClick();
              }}
              className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-nvidia-green"
            />
          </div>
        </div>
      </div>
    );
  }

  // 2. COLLISION AVOIDANCE AI SIMULATION WIDGET (Bài 3)
  if (type === 'collision_sim') {
    const prob = robotState.aiProbBlocked;
    const isBlocked = prob >= 0.5;

    return (
      <div className="p-3.5 my-2.5 rounded-xl bg-[#090E15] border border-cyber-border max-w-lg space-y-3 font-mono text-xs shadow-lg">
        <div className="flex items-center justify-between pb-2 border-b border-cyber-border">
          <span className="flex items-center gap-2 text-nvidia-green font-bold">
            <Cpu className="w-4 h-4" />
            MÔ PHỎNG AI NÉ VẬT CẢN (ResNet-18 + TensorRT)
          </span>
          <span className="text-[10px] text-gray-400">Inference: 45 FPS</span>
        </div>

        {/* AI Output Result Box */}
        <div className="grid grid-cols-2 gap-2">
          {/* Classification Banner */}
          <div className={`p-2.5 rounded-lg border flex flex-col justify-between ${isBlocked ? 'bg-red-950/40 border-red-500/80 text-red-300' : 'bg-emerald-950/40 border-emerald-500/80 text-emerald-300'}`}>
            <span className="text-[10px] text-gray-400 uppercase font-semibold">Quyết Định AI:</span>
            <div className="text-sm font-bold flex items-center gap-1.5 mt-1">
              {isBlocked ? <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" /> : <Eye className="w-4 h-4 text-emerald-400" />}
              <span>{isBlocked ? 'BLOCKED (Vật Cản)' : 'FREE (Đường Thông)'}</span>
            </div>
          </div>

          {/* Action Triggered */}
          <div className="p-2.5 rounded-lg bg-[#111924] border border-cyber-border flex flex-col justify-between">
            <span className="text-[10px] text-gray-400 uppercase font-semibold">Lệnh Chấp Hành:</span>
            <div className="text-xs font-bold text-white mt-1">
              {isBlocked ? (
                <span className="text-yellow-400">robot.left(0.35) ⤶ [Né]</span>
              ) : (
                <span className="text-emerald-400">robot.forward(0.35) ↑ [Tiến]</span>
              )}
            </div>
          </div>
        </div>

        {/* Probability Gauge */}
        <div className="space-y-1 p-2 rounded-lg bg-[#111924] border border-cyber-border/60">
          <div className="flex justify-between text-[11px]">
            <span className="text-gray-400">Xác suất gặp vật cản P(blocked):</span>
            <span className={`font-bold ${isBlocked ? 'text-red-400' : 'text-emerald-400'}`}>
              {(prob * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-200 ${isBlocked ? 'bg-red-500' : 'bg-nvidia-green'}`}
              style={{ width: `${Math.min(100, Math.max(0, prob * 100))}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  // 3. ROAD FOLLOWING PID SIMULATION WIDGET (Bài 4)
  if (type === 'road_sim') {
    const steer = robotState.aiRoadSteering;
    const pt = robotState.aiTargetPoint;

    return (
      <div className="p-3.5 my-2.5 rounded-xl bg-[#090E15] border border-cyber-border max-w-lg space-y-3 font-mono text-xs shadow-lg">
        <div className="flex items-center justify-between pb-2 border-b border-cyber-border">
          <span className="flex items-center gap-2 text-cyber-accent font-bold">
            <Navigation className="w-4 h-4" />
            MÔ PHỎNG BÁM LÀN ĐƯỜNG (PID STEERING)
          </span>
          <span className="text-[10px] text-nvidia-green font-bold">Kp=0.55, Kd=0.12</span>
        </div>

        {/* Waypoint Coordinates & Steering Angle */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded bg-[#111924] border border-cyber-border">
            <span className="text-[10px] text-gray-400">Toạ độ đích (x, y):</span>
            <div className="text-white font-bold mt-0.5">
              X: {pt.x.toFixed(2)}, Y: {pt.y.toFixed(2)}
            </div>
          </div>
          <div className="p-2 rounded bg-[#111924] border border-cyber-border">
            <span className="text-[10px] text-gray-400">Góc bẻ lái atan2(x, y):</span>
            <div className="text-cyber-accent font-bold mt-0.5">
              {(steer * (180 / Math.PI)).toFixed(1)}° ({steer.toFixed(2)})
            </div>
          </div>
        </div>

        {/* Steering Vector Arrow Visualizer */}
        <div className="relative h-20 rounded bg-[#0d1520] border border-cyber-border flex items-center justify-center overflow-hidden">
          {/* Road lane line */}
          <div className="absolute top-0 bottom-0 w-8 border-x border-dashed border-yellow-500/60" />
          {/* Target Waypoint Dot */}
          <div
            className="w-4 h-4 rounded-full bg-nvidia-green border-2 border-white animate-ping absolute"
            style={{ transform: `translate(${pt.x * 60}px, ${(0.5 - pt.y) * 30}px)` }}
          />
          <div
            className="w-4 h-4 rounded-full bg-nvidia-green border-2 border-white absolute"
            style={{ transform: `translate(${pt.x * 60}px, ${(0.5 - pt.y) * 30}px)` }}
          />
        </div>
      </div>
    );
  }

  // 4. OLED SSD1306 DISPLAY SIMULATOR (Bài 5)
  if (type === 'oled_sim') {
    return (
      <div className="p-3.5 my-2.5 rounded-xl bg-[#090E15] border border-cyber-border max-w-sm space-y-2 font-mono text-xs shadow-lg">
        <div className="flex items-center justify-between pb-1.5 border-b border-cyber-border text-gray-300">
          <span className="flex items-center gap-1.5 text-cyber-accent font-bold">
            <Tv className="w-4 h-4" />
            MÀN HÌNH OLED SSD1306 (128x32 I2C 0x3C)
          </span>
          <span className="text-[10px] text-emerald-400">● LIVE</span>
        </div>

        {/* Realistic Glowing OLED Screen Box */}
        <div className="p-3 rounded-lg bg-[#04080e] border-2 border-gray-700 shadow-inner font-mono text-xs space-y-1">
          <div className="text-cyan-400 font-bold text-sm tracking-wider">NVIDIA JETBOT v2</div>
          <div className="text-nvidia-green text-xs">IP: 192.168.1.105</div>
          <div className="text-yellow-300 text-xs">RAM: {robotState.telemetry.ramUsedGb}G / 4.0G</div>
          <div className="text-emerald-400 text-xs">GPU: {robotState.telemetry.gpuLoad}% | {robotState.telemetry.gpuTemp.toFixed(1)}°C</div>
        </div>
      </div>
    );
  }

  // 5. CAMERA STREAMING WIDGET (Bài 2)
  if (type === 'camera') {
    return (
      <div className="p-3 my-2 rounded-xl bg-[#0a0f16] border border-cyber-border max-w-sm">
        <div className="flex items-center justify-between text-xs font-mono text-gray-300 pb-1.5 border-b border-cyber-border mb-2">
          <span className="flex items-center gap-1.5 text-nvidia-green font-bold">
            <Video className="w-3.5 h-3.5" />
            widgets.Image (Sony IMX219 224x224)
          </span>
          <span className="text-[10px] text-red-500 animate-pulse">● LIVE 30 FPS</span>
        </div>
        <div className="relative aspect-square w-full rounded bg-black border border-cyber-border overflow-hidden flex flex-col justify-between p-2 font-mono text-[10px]">
          <div className="flex justify-between text-cyber-accent">
            <span>MIPI-CSI2 GStreamer</span>
            <span className="text-nvidia-green">TensorRT Ready</span>
          </div>
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 border border-nvidia-green/40 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-nvidia-green rounded-full animate-ping" />
            </div>
          </div>
          <div className="flex justify-between text-gray-300 bg-black/60 p-1 rounded backdrop-blur-sm">
            <span>P(blocked): {robotState.aiProbBlocked.toFixed(2)}</span>
            <span>STEER: {robotState.aiRoadSteering.toFixed(2)}</span>
          </div>
        </div>
      </div>
    );
  }

  // 6. GAMEPAD WIDGET
  if (type === 'gamepad') {
    return (
      <div className="p-3.5 my-2.5 rounded-xl bg-[#090E15] border border-cyber-border max-w-sm font-mono text-xs space-y-3">
        <div className="flex items-center justify-between pb-1.5 border-b border-cyber-border text-gray-300">
          <span className="flex items-center gap-1.5 text-yellow-400 font-bold">
            <Gamepad2 className="w-4 h-4" />
            ipywidgets.Controller(index=0)
          </span>
          <span className="text-[10px] text-emerald-400">Gamepad API</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 py-1">
          <button
            onMouseDown={() => {
              robotState.leftMotor.targetSpeed = 0.45;
              robotState.rightMotor.targetSpeed = 0.45;
            }}
            onMouseUp={() => {
              robotState.leftMotor.targetSpeed = 0;
              robotState.rightMotor.targetSpeed = 0;
            }}
            className="w-16 h-8 rounded bg-cyber-card hover:bg-nvidia-green hover:text-black border border-cyber-border font-bold transition-colors"
          >
            TIẾN ↑
          </button>
          <div className="flex gap-2">
            <button
              onMouseDown={() => {
                robotState.leftMotor.targetSpeed = -0.4;
                robotState.rightMotor.targetSpeed = 0.4;
              }}
              onMouseUp={() => {
                robotState.leftMotor.targetSpeed = 0;
                robotState.rightMotor.targetSpeed = 0;
              }}
              className="w-16 h-8 rounded bg-cyber-card hover:bg-nvidia-green hover:text-black border border-cyber-border font-bold transition-colors"
            >
              ← TRÁI
            </button>
            <button
              onClick={() => {
                robotState.leftMotor.targetSpeed = 0;
                robotState.rightMotor.targetSpeed = 0;
              }}
              className="w-12 h-8 rounded bg-red-800 text-white font-bold text-[10px]"
            >
              STOP
            </button>
            <button
              onMouseDown={() => {
                robotState.leftMotor.targetSpeed = 0.4;
                robotState.rightMotor.targetSpeed = -0.4;
              }}
              onMouseUp={() => {
                robotState.leftMotor.targetSpeed = 0;
                robotState.rightMotor.targetSpeed = 0;
              }}
              className="w-16 h-8 rounded bg-cyber-card hover:bg-nvidia-green hover:text-black border border-cyber-border font-bold transition-colors"
            >
              PHẢI →
            </button>
          </div>
          <button
            onMouseDown={() => {
              robotState.leftMotor.targetSpeed = -0.45;
              robotState.rightMotor.targetSpeed = -0.45;
            }}
            onMouseUp={() => {
              robotState.leftMotor.targetSpeed = 0;
              robotState.rightMotor.targetSpeed = 0;
            }}
            className="w-16 h-8 rounded bg-cyber-card hover:bg-nvidia-green hover:text-black border border-cyber-border font-bold transition-colors"
          >
            LÙI ↓
          </button>
        </div>
      </div>
    );
  }

  return null;
};
