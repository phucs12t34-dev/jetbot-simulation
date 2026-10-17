import React from 'react';
import { X, Network, Cpu, Battery, Camera, Eye, Radio } from 'lucide-react';

interface PinoutDiagramModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PinoutDiagramModal: React.FC<PinoutDiagramModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl bg-[#0C121A] border border-cyber-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-cyber-border flex items-center justify-between bg-[#111A26]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-nvidia-green/15 text-nvidia-green border border-nvidia-green/30">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-nvidia-green font-mono font-semibold">
                KIẾN TRÚC PHẦN CỨNG & SƠ ĐỒ ĐẤU NỐI DÂY
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white font-display">
                NVIDIA JetBot Hardware Architecture & Pinout
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-cyber-card transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs sm:text-sm">
          {/* Hardware Block Diagram */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3 font-mono">
              1. Sơ Đồ Khối Toàn Hệ Thống (System Block Diagram)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-xl bg-[#090E14] border border-cyber-border">
              {/* Sensors Column */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-cyber-accent uppercase font-mono flex items-center gap-1.5">
                  <Eye className="w-4 h-4" /> Khối Thu Nhận (Sensors)
                </div>
                <div className="p-3 rounded-lg bg-[#111923] border border-cyber-border space-y-1">
                  <div className="font-bold text-white">Sony IMX219 Camera</div>
                  <div className="text-[11px] text-gray-400 font-mono">Góc rộng 160° • MIPI CSI-2</div>
                  <div className="text-[10px] text-nvidia-green">Direct Memory Access vào ISP</div>
                </div>
                <div className="p-3 rounded-lg bg-[#111923] border border-cyber-border space-y-1">
                  <div className="font-bold text-white">Gamepad Controller</div>
                  <div className="text-[11px] text-gray-400 font-mono">Wireless Bluetooth 4.2 / USB</div>
                  <div className="text-[10px] text-cyber-accent">HTML5 Gamepad API & ipywidgets</div>
                </div>
              </div>

              {/* Central Processing Brain */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-nvidia-green uppercase font-mono flex items-center gap-1.5">
                  <Cpu className="w-4 h-4" /> Bộ Não AI (Processing Core)
                </div>
                <div className="p-4 rounded-lg bg-[#14221A] border border-nvidia-green/40 shadow-inner space-y-2">
                  <div className="font-bold text-nvidia-green flex items-center gap-2">
                    NVIDIA Jetson Nano
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-nvidia-green text-black font-bold">128 CUDA</span>
                  </div>
                  <ul className="text-[11px] space-y-1 text-gray-300 font-mono">
                    <li>• Quad-Core ARM Cortex-A57</li>
                    <li>• TensorRT FP16 Inference Engine</li>
                    <li>• PyTorch 1.8 + cuDNN Acceleration</li>
                    <li>• JupyterLab Service (Port 8888)</li>
                    <li>• I2C Bus 1 Controller (/dev/i2c-1)</li>
                  </ul>
                </div>
                {/* OLED Display */}
                <div className="p-2.5 rounded-lg bg-[#111923] border border-cyber-border text-center">
                  <div className="text-xs font-bold text-white">OLED SSD1306 (128x32)</div>
                  <div className="text-[10px] text-cyber-accent font-mono">I2C Address: 0x3C</div>
                </div>
              </div>

              {/* Actuators & Power Column */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-amber-400 uppercase font-mono flex items-center gap-1.5">
                  <Battery className="w-4 h-4" /> Chấp Hành & Nguồn (Actuators & Power)
                </div>
                <div className="p-3 rounded-lg bg-[#111923] border border-cyber-border space-y-1">
                  <div className="font-bold text-white">Motor Driver PCA9685</div>
                  <div className="text-[11px] text-gray-400 font-mono">I2C Address: 0x60 • 12-bit PWM</div>
                  <div className="text-[10px] text-amber-300">Cầu H kép TB6612FNG (1.2A/kênh)</div>
                </div>
                <div className="p-3 rounded-lg bg-[#111923] border border-cyber-border space-y-1">
                  <div className="font-bold text-white">2x TT DC Geared Motors</div>
                  <div className="text-[11px] text-gray-400 font-mono">Tỉ số 1:48 • Bánh cao su 65mm</div>
                  <div className="text-[10px] text-emerald-400">Truyền động vi sai độc lập</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#1b1510] border border-amber-500/30 text-amber-200 text-[11px]">
                  <span className="font-bold">Nguồn điện: </span>2 Cell Li-ion 18650 (7.4V) + Buck 5V 4A
                </div>
              </div>
            </div>
          </div>

          {/* 40-Pin GPIO Header Reference */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2 font-mono">
              2. Sơ Đồ Chân 40-Pin GPIO Header Jetson Nano
            </h3>
            <div className="p-4 rounded-xl bg-[#090E14] border border-cyber-border space-y-3">
              <div className="text-xs text-gray-300 leading-relaxed">
                Trên JetBot, chúng ta sử dụng <span className="font-bold text-nvidia-green">I2C Bus 1</span> để điều khiển cả màn hình OLED và mạch điều khiển động cơ:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-[#111A26] border border-cyber-border space-y-1.5">
                  <div className="text-nvidia-green font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-nvidia-green" />
                    I2C Bus 1 Connections:
                  </div>
                  <div>• Pin 1: 3.3V Power (Nuôi logic OLED)</div>
                  <div>• Pin 3: I2C1_SDA (Đường truyền dữ liệu Data)</div>
                  <div>• Pin 5: I2C1_SCL (Xung nhịp đồng hồ Clock)</div>
                  <div>• Pin 9: GND (Nối đất chung hệ thống)</div>
                </div>
                <div className="p-3 rounded-lg bg-[#111A26] border border-cyber-border space-y-1.5">
                  <div className="text-cyber-accent font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyber-accent" />
                    Địa Chỉ Hex Thiết Bị Trên I2C Bus:
                  </div>
                  <div>• <span className="text-white font-bold">0x60</span>: PCA9685 Motor Driver</div>
                  <div>• <span className="text-white font-bold">0x3C</span>: SSD1306 128x32 OLED Display</div>
                  <div className="text-[11px] text-gray-400">Kiểm tra trong Linux bằng lệnh: <span className="text-yellow-300">i2cdetect -y -r 1</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-cyber-border bg-[#111A26] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-black bg-nvidia-green hover:bg-[#86d600] rounded-md transition-colors"
          >
            Đóng Sơ Đồ
          </button>
        </div>
      </div>
    </div>
  );
};
