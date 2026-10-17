import React from 'react';
import { JetBotComponent } from '../../types/jetbot';
import { X, Cpu, CheckCircle2, Zap, Share2 } from 'lucide-react';

interface ComponentDetailsModalProps {
  component: JetBotComponent | null;
  onClose: () => void;
}

export const ComponentDetailsModal: React.FC<ComponentDetailsModalProps> = ({ component, onClose }) => {
  if (!component) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#0E1520] border border-cyber-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-cyber-border flex items-center justify-between bg-[#121B28]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-nvidia-green/15 text-nvidia-green border border-nvidia-green/30">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-nvidia-green font-mono font-semibold">
                {component.category.toUpperCase()} • LINH KIỆN JETBOT
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white font-display">{component.nameVi}</h2>
              <div className="text-xs text-gray-400 font-mono">{component.name}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-cyber-card transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 text-sm">
          {/* Summary */}
          <div className="p-3 rounded-lg bg-nvidia-green/10 border border-nvidia-green/30 text-emerald-200 text-xs sm:text-sm leading-relaxed">
            <span className="font-bold text-nvidia-green">Tóm tắt: </span>
            {component.summaryVi}
          </div>

          {/* Detailed Description */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1.5 font-mono">
              Mô Tả Chi Tiết & Nguyên Lý
            </h3>
            <p className="text-gray-300 leading-relaxed text-xs sm:text-sm">{component.descriptionVi}</p>
          </div>

          {/* Technical Specifications */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2 font-mono flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-cyber-accent" />
              Thông Số Kỹ Thuật (Technical Specs)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {Object.entries(component.specs).map(([key, value]) => (
                <div key={key} className="p-2.5 rounded bg-[#131D2A] border border-cyber-border/70 flex flex-col">
                  <span className="text-gray-400 font-medium">{key}</span>
                  <span className="text-white font-mono font-semibold mt-0.5">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pin Connections */}
          {component.pinConnections && component.pinConnections.length > 0 && (
            <div>
              <h3 className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2 font-mono flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-yellow-400" />
                Sơ Đồ Kết Nối Chân Tín Hiệu (Pin Connections)
              </h3>
              <div className="overflow-x-auto rounded-lg border border-cyber-border">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#121B28] text-gray-400 border-b border-cyber-border font-mono">
                    <tr>
                      <th className="p-2.5">Chân / Cổng</th>
                      <th className="p-2.5">Chức năng</th>
                      <th className="p-2.5">Giao thức</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyber-border/50 bg-[#0E1520] font-mono">
                    {component.pinConnections.map((pin, idx) => (
                      <tr key={idx} className="hover:bg-cyber-card/50">
                        <td className="p-2.5 font-bold text-nvidia-green">{pin.pin}</td>
                        <td className="p-2.5 text-gray-300">{pin.functionVi}</td>
                        <td className="p-2.5 text-cyber-accent">{pin.protocol}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Role in Robotics Education */}
          <div className="p-3.5 rounded-lg bg-[#14202E] border border-cyber-border space-y-1.5">
            <h3 className="text-xs uppercase tracking-wider text-nvidia-green font-semibold font-mono flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-nvidia-green" />
              Ý Nghĩa Trong Giáo Dục Robotics & STEM
            </h3>
            <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">{component.educationalRoleVi}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-cyber-border bg-[#121B28] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-black bg-nvidia-green hover:bg-[#86d600] rounded-md transition-colors"
          >
            Đóng Chi Tiết
          </button>
        </div>
      </div>
    </div>
  );
};
