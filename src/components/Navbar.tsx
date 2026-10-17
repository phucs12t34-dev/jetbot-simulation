import React, { useState } from 'react';
import { ViewMode, RobotState } from '../types/jetbot';
import {
  BookOpen,
  Code2,
  Gamepad2,
  Compass,
  Volume2,
  VolumeX,
  RotateCcw,
  OctagonAlert,
  Eye,
  Radio,
} from 'lucide-react';
import { soundFx } from '../utils/audio';

interface NavbarProps {
  currentMode: ViewMode;
  onSelectMode: (mode: ViewMode) => void;
  robotState: RobotState;
  onResetRobot: () => void;
  onEmergencyStop: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentMode,
  onSelectMode,
  robotState,
  onResetRobot,
  onEmergencyStop,
}) => {
  const [isMuted, setIsMuted] = useState(soundFx.isMuted());

  const handleToggleSound = () => {
    const muted = soundFx.toggleMute();
    setIsMuted(muted);
    if (!muted) soundFx.playClick();
  };

  const navItems: Array<{ id: ViewMode; label: string; icon: React.ReactNode; badge?: string }> = [
    { id: 'anatomy', label: 'Cấu Tạo 3D Lab', icon: <Eye className="w-4 h-4" /> },
    { id: 'arena', label: 'Đấu Trường AI 3D', icon: <Compass className="w-4 h-4" />, badge: 'AI FPV' },
    { id: 'jupyter', label: 'Hướng Dẫn Sử Dụng', icon: <BookOpen className="w-4 h-4" />, badge: 'Tài Liệu' },
    { id: 'teleop', label: 'Bảng Lái A → B', icon: <Gamepad2 className="w-4 h-4" />, badge: 'Mini-Game' },
  ];

  return (
    <header className="h-14 border-b border-cyber-border bg-[#090D13]/95 backdrop-blur-md px-3 sm:px-5 flex items-center justify-between z-30 select-none">
      {/* Brand & Connection */}
      <div className="flex items-center gap-3">
        <div
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[#111922] border border-[#233346] hover:border-nvidia-green transition-colors cursor-pointer"
          onClick={() => onSelectMode('anatomy')}
        >
          <div className="w-3 h-3 rounded-full bg-nvidia-green animate-pulse" />
          <span className="text-xs font-bold tracking-wider text-nvidia-green font-display flex items-center gap-1.5">
            NVIDIA JETBOT
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-nvidia-green/20 text-nvidia-green font-mono">
              v2.0
            </span>
          </span>
        </div>

        {/* Live Port */}
        <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-gray-400 bg-cyber-surface/60 px-2.5 py-1 rounded border border-cyber-border/60">
          <span className="flex items-center gap-1 text-cyber-accent">
            <Radio className="w-3 h-3 animate-pulse" />
            192.168.1.105:8888
          </span>
        </div>
      </div>

      {/* Main 4 Navigation Tabs */}
      <nav className="flex items-center gap-1.5 bg-cyber-surface/90 p-1 rounded-xl border border-cyber-border shadow-inner">
        {navItems.map((item) => {
          const isActive = currentMode === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                soundFx.playClick();
                onSelectMode(item.id);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-nvidia-green text-black font-bold shadow-[0_0_15px_rgba(118,185,0,0.4)]'
                  : 'text-gray-300 hover:text-white hover:bg-cyber-card/70'
              }`}
            >
              {item.icon}
              <span className="hidden sm:inline">{item.label}</span>
              {item.badge && !isActive && (
                <span className="hidden md:inline-block text-[9px] px-1 rounded bg-nvidia-green/10 text-nvidia-green border border-nvidia-green/30">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Action Controls */}
      <div className="flex items-center gap-2">
        {/* Audio Toggle */}
        <button
          onClick={handleToggleSound}
          title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          className={`p-2 rounded-lg border transition-colors ${
            isMuted
              ? 'text-gray-500 border-gray-700 bg-cyber-surface/50'
              : 'text-nvidia-green border-nvidia-green/40 bg-nvidia-green/10'
          }`}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Reset Pose */}
        <button
          onClick={() => {
            soundFx.playClick();
            onResetRobot();
          }}
          title="Đưa robot về vạch xuất phát"
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-300 bg-cyber-surface hover:bg-cyber-card border border-cyber-border rounded-lg transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-cyber-accent" />
          <span className="hidden sm:inline">Reset Xe</span>
        </button>

        {/* Emergency Stop */}
        <button
          onClick={() => {
            soundFx.playCollisionAlert();
            onEmergencyStop();
          }}
          title="Dừng khẩn cấp toàn bộ động cơ"
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg shadow-md active:scale-95 transition-all"
        >
          <OctagonAlert className="w-3.5 h-3.5" />
          <span>E-STOP</span>
        </button>
      </div>
    </header>
  );
};
