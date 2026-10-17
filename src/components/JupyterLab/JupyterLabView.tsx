import React, { useState, useMemo } from 'react';
import { RobotState } from '../../types/jetbot';
import { soundFx } from '../../utils/audio';
import {
  BookOpen,
  AlertTriangle,
  Copy,
  Check,
  Search,
  Compass,
  ChevronRight,
  Zap,
  Cpu,
  Eye,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  FileCode,
  Sparkles,
} from 'lucide-react';

interface JupyterLabViewProps {
  robotState: RobotState;
  onOpenArena: () => void;
}

interface GuideSection {
  id: string;
  category: 'quickstart' | 'motor' | 'ai' | 'arena' | 'troubleshoot';
  title: string;
  shortTitle: string;
  badge: string;
  readTime: string;
  content: React.ReactNode;
}

export const JupyterLabView: React.FC<JupyterLabViewProps> = ({ onOpenArena }) => {
  const [activeSectionId, setActiveSectionId] = useState<string>('quickstart');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const handleCopy = (codeId: string, codeText: string) => {
    navigator.clipboard.writeText(codeText.trim());
    setCopiedCodeId(codeId);
    soundFx.playClick();
    setTimeout(() => {
      setCopiedCodeId(null);
    }, 2000);
  };

  const CodeBlock: React.FC<{ id: string; title: string; code: string; language?: string }> = ({
    id,
    title,
    code,
    language = 'python',
  }) => {
    const isCopied = copiedCodeId === id;
    return (
      <div className="my-3 rounded-xl overflow-hidden border border-cyber-border bg-[#0a0f16] shadow-lg">
        <div className="px-3.5 py-2 bg-[#101722] border-b border-cyber-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
            </div>
            <span className="text-xs font-mono text-gray-300 font-semibold">{title}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyber-card text-nvidia-green font-mono uppercase">
              {language}
            </span>
          </div>
          <button
            onClick={() => handleCopy(id, code)}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyber-surface hover:bg-cyber-card border border-cyber-border text-[11px] font-mono text-gray-300 hover:text-white transition-colors"
          >
            {isCopied ? (
              <>
                <Check className="w-3 h-3 text-nvidia-green" />
                <span className="text-nvidia-green font-bold">Đã sao chép!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Sao chép</span>
              </>
            )}
          </button>
        </div>
        <pre className="p-4 text-xs font-mono text-gray-200 overflow-x-auto leading-relaxed select-text">
          <code>{code.trim()}</code>
        </pre>
      </div>
    );
  };

  const motorBasicCode = `from jetbot import Robot
import time

# Khởi tạo đối tượng robot điều khiển
robot = Robot()

# 1. Tiến thẳng với tốc độ 40% trong 1.5 giây
robot.forward(speed=0.4)
time.sleep(1.5)

# 2. Dừng xe
robot.stop()
time.sleep(0.5)

# 3. Lùi lại tốc độ 30% trong 1.0 giây
robot.backward(speed=0.3)
time.sleep(1.0)
robot.stop()

# 4. Quay tại chỗ sang trái (bánh phải tiến, bánh trái lùi)
robot.left(speed=0.35)
time.sleep(0.8)

# 5. Dừng hẳn an toàn
robot.stop()`;

  const motorDiffCode = `from jetbot import Robot
import time

robot = Robot()

# Rẽ phải mượt mà: Bánh trái quay nhanh hơn bánh phải
robot.set_motors(left_speed=0.50, right_speed=0.20)
time.sleep(2.0)

# Rẽ trái mượt mà: Bánh phải quay nhanh hơn bánh trái
robot.set_motors(left_speed=0.20, right_speed=0.50)
time.sleep(2.0)

# Dừng an toàn khi kết thúc hành trình
robot.stop()`;

  const trtCode = `import torch
import torchvision
from torch2trt import TRTModule
from jetbot import Robot, Camera

# 1. Tải mô hình ResNet-18 đã tối ưu hóa TensorRT FP16
model_trt = TRTModule()
model_trt.load_state_dict(torch.load('road_following_model_trt.pth'))

# 2. Khởi tạo Camera CSI độ phân giải 224x224 và Robot
camera = Camera.instance(width=224, height=224, fps=30)
robot = Robot()

speed_cruise = 0.42
Kp = 0.65

def process_frame(change):
    image = change['new']
    # Tiền xử lý chuẩn hóa ảnh Tensor trên GPU
    x = preprocess(image).to('cuda')
    # Dự đoán tọa độ tâm làn (x, y)
    y = model_trt(x).detach().cpu().numpy().flatten()
    target_x = float(y[0])

    # Thuật toán lái vi sai Pure Pursuit
    steering = target_x * Kp
    robot.set_motors(
        speed_cruise + steering,
        speed_cruise - steering
    )

# Gắn bộ lắng nghe khung hình thời gian thực (Event listener)
camera.observe(process_frame, names='value')`;

  const sections: GuideSection[] = useMemo(
    () => [
      {
        id: 'quickstart',
        category: 'quickstart',
        title: '1. Tổng Quan Phần Cứng & Khởi Động Nhanh',
        shortTitle: 'Khởi Động Nhanh',
        badge: 'Cơ Bản',
        readTime: '3 phút',
        content: (
          <div className="space-y-4 text-sm leading-relaxed text-gray-300">
            <p>
              <strong className="text-white">NVIDIA JetBot</strong> là nền tảng robot tự hành mã nguồn mở
              được phát triển bởi NVIDIA, tối ưu hóa cho giáo dục AI, Computer Vision và điều khiển nhúng.
              Trái tim của JetBot là máy tính <strong className="text-nvidia-green">NVIDIA Jetson Nano</strong> với
              GPU 128 nhân Maxwell kiến trúc CUDA, cho phép chạy trực tiếp các mạng nơ-ron sâu mà không cần truyền dữ liệu về máy tính chủ.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-4">
              <div className="p-3.5 rounded-xl border border-cyber-border bg-cyber-card/40">
                <div className="flex items-center gap-2 text-nvidia-green font-bold text-sm mb-1.5">
                  <Cpu className="w-4 h-4" />
                  <span>Bộ Xử Lý Trung Tâm Jetson Nano</span>
                </div>
                <ul className="text-xs space-y-1 text-gray-400 list-disc list-inside">
                  <li>GPU: 128-core NVIDIA Maxwell architecture</li>
                  <li>CPU: Quad-core ARM Cortex-A57 @ 1.43 GHz</li>
                  <li>RAM: 4 GB 64-bit LPDDR4 25.6 GB/s</li>
                  <li>Hệ điều hành: Ubuntu 18.04 LTS (JetPack SDK)</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl border border-cyber-border bg-cyber-card/40">
                <div className="flex items-center gap-2 text-cyber-accent font-bold text-sm mb-1.5">
                  <Eye className="w-4 h-4" />
                  <span>Cảm Biến & Động Cơ</span>
                </div>
                <ul className="text-xs space-y-1 text-gray-400 list-disc list-inside">
                  <li>Camera: Sony IMX219 CSI 8MP góc rộng 160° FOV</li>
                  <li>Driver: Adafruit PCA9685 PWM 16 kênh qua I2C (0x60)</li>
                  <li>Động cơ: 2x Motor vi sai TT 1:48 + bánh xe đệm cao su</li>
                  <li>Màn hình OLED: I2C SSD1306 128x32 hiển thị địa chỉ IP</li>
                </ul>
              </div>
            </div>

            <h4 className="text-base font-bold text-white pt-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-nvidia-green" />
              Quy Trình 4 Bước Khởi Động Robot Thực Tế
            </h4>
            <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm pl-1">
              <li>
                <strong className="text-white">Cấp nguồn:</strong> Kết nối pack pin LiPo 2S/3S (7.4V - 11.1V) vào mạch điều áp.
              </li>
              <li>
                <strong className="text-white">Bật công tắc:</strong> Chờ Jetson Nano boot hệ điều hành (đèn LED xanh sáng ổn định ~40 giây).
              </li>
              <li>
                <strong className="text-white">Xem IP trên OLED:</strong> Màn hình OLED hiển thị địa chỉ IP WiFi (ví dụ:{' '}
                <code className="text-nvidia-green font-mono">192.168.1.105</code>).
              </li>
              <li>
                <strong className="text-white">Truy cập giao diện:</strong> Mở trình duyệt trên máy tính và truy cập{' '}
                <code className="text-cyber-accent font-mono bg-black/60 px-1 py-0.5 rounded">http://192.168.1.105:8888</code>{' '}
                (mật khẩu mặc định: <span className="text-amber-400 font-mono">jetbot</span>).
              </li>
            </ol>
          </div>
        ),
      },
      {
        id: 'motor',
        category: 'motor',
        title: '2. Lập Trình Điều Khiển Động Cơ Vi Sai (Python SDK)',
        shortTitle: 'Lập Trình Động Cơ',
        badge: 'Python SDK',
        readTime: '4 phút',
        content: (
          <div className="space-y-4 text-sm leading-relaxed text-gray-300">
            <p>
              JetBot sử dụng hệ chuyển động vi sai 2 bánh độc lập (Differential Drive).
              Mỗi động cơ được cấp công suất trong dải <code className="text-nvidia-green font-mono">[-1.0, 1.0]</code> qua mạch băm xung PCA9685 PWM.
            </p>

            <CodeBlock id="motor-basic" title="1_basic_motion.py - Lệnh Điều Khiển Động Cơ Cơ Bản" code={motorBasicCode} />

            <h4 className="text-base font-bold text-white pt-2">Lệnh Điều Khiển Vi Sai 2 Bánh (Differential Steering)</h4>
            <p className="text-xs sm:text-sm">
              Phương thức <code className="text-cyber-accent font-mono">set_motors(left_speed, right_speed)</code> cho phép
              thiết lập vận tốc từng bánh riêng biệt để tạo bán kính quay mượt mà:
            </p>

            <CodeBlock id="motor-diff" title="2_differential_turn.py - Vào Cua Mượt Mà" code={motorDiffCode} />

            <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-200">
              <strong className="text-amber-300 flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-4 h-4" /> Nguyên Tắc An Toàn Khi Lập Trình
              </strong>
              Luôn bọc các khối lệnh vận hành trong <code className="font-mono">try ... finally: robot.stop()</code> để đảm bảo động cơ ngắt điện tức thì khi có ngoại lệ hoặc khi người dùng dừng chương trình.
            </div>
          </div>
        ),
      },
      {
        id: 'ai',
        category: 'ai',
        title: '3. Tự Hành Bám Làn & Tránh Vật Cản AI (ResNet-18 & TensorRT)',
        shortTitle: 'Mô Hình AI & TensorRT',
        badge: 'Deep Learning',
        readTime: '6 phút',
        content: (
          <div className="space-y-4 text-sm leading-relaxed text-gray-300">
            <p>
              Hệ thống AI trên JetBot kết hợp 2 giải thuật học sâu thời gian thực:
            </p>

            <div className="space-y-3 my-2">
              <div className="p-4 rounded-xl border border-cyber-border bg-cyber-card/30">
                <h4 className="text-base font-bold text-nvidia-green flex items-center gap-2">
                  <Compass className="w-4 h-4" />
                  Mô Hình 1: Bám Làn Đường (Road Following - Regression)
                </h4>
                <p className="text-xs sm:text-sm mt-1 text-gray-300">
                  Mạng nơ-ron <strong className="text-white">ResNet-18</strong> được huấn luyện bài toán hồi quy để dự đoán
                  tọa độ tâm làn đường <code className="text-nvidia-green font-mono">(x, y)</code> trong không gian ảnh 224x224.
                </p>
                <div className="mt-2 p-2.5 rounded bg-black/60 font-mono text-xs text-gray-300 border border-cyber-border/50">
                  <div className="text-cyber-accent font-bold mb-1">Công thức điều khiển lái Pure Pursuit vi sai:</div>
                  <div>angle = arctan2(target_x, target_y)</div>
                  <div>steer = angle * Kp</div>
                  <div>v_left = v_cruise * (1 + steer),  v_right = v_cruise * (1 - steer)</div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-cyber-border bg-cyber-card/30">
                <h4 className="text-base font-bold text-amber-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Mô Hình 2: Tránh Vật Cản (Collision Avoidance - Binary Classification)
                </h4>
                <p className="text-xs sm:text-sm mt-1 text-gray-300">
                  Mô hình phân loại 2 nhãn: <code className="text-emerald-400 font-bold font-mono">free</code> (đường thoáng) và <code className="text-red-400 font-bold font-mono">blocked</code> (có vật cản).
                  Khi xác suất <code className="text-red-400 font-mono">P(blocked) &gt;= 0.5</code>, robot sẽ kích hoạt né vật cản an toàn.
                </p>
              </div>
            </div>

            <h4 className="text-base font-bold text-white pt-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-nvidia-green" />
              Tối Ưu Hóa Tốc Độ Suy Luận Với NVIDIA TensorRT (35+ FPS)
            </h4>
            <p className="text-xs sm:text-sm">
              Biên dịch mô hình PyTorch sang engine TensorRT FP16 giúp tối ưu hóa biểu đồ tính toán (layer fusion)
              và tăng tốc độ thực thi từ 8 FPS lên hơn 35 FPS trên GPU Jetson Nano:
            </p>

            <CodeBlock id="trt-code" title="3_autonomous_drive.py - Tự Hành TensorRT Thời Gian Thực" code={trtCode} />
          </div>
        ),
      },
      {
        id: 'arena',
        category: 'arena',
        title: '4. Hướng Dẫn Vận Hành Đấu Trường Mô Phỏng 3D',
        shortTitle: 'Vận Hành Đấu Trường 3D',
        badge: 'Simulation',
        readTime: '3 phút',
        content: (
          <div className="space-y-4 text-sm leading-relaxed text-gray-300">
            <p>
              Đấu trường mô phỏng 3D cung cấp động học vi sai chính xác, hệ thống tính toán sai số bám làn (Cross-Track Error) thời gian thực
              và góc nhìn FPV camera giả lập từ phía trước xe.
            </p>

            <div className="p-3.5 rounded-xl border border-cyber-border bg-[#0d1520] space-y-2.5">
              <h5 className="font-bold text-white text-xs uppercase tracking-wider text-cyber-accent">
                Bảng Phím Lái Bàn Phím Trực Tiếp
              </h5>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="p-2 rounded bg-black/60 border border-cyber-border flex flex-col items-center">
                  <span className="text-nvidia-green font-bold text-sm">[W] / [↑]</span>
                  <span className="text-gray-400 mt-1">Tiến tới</span>
                </div>
                <div className="p-2 rounded bg-black/60 border border-cyber-border flex flex-col items-center">
                  <span className="text-nvidia-green font-bold text-sm">[S] / [↓]</span>
                  <span className="text-gray-400 mt-1">Lùi lại</span>
                </div>
                <div className="p-2 rounded bg-black/60 border border-cyber-border flex flex-col items-center">
                  <span className="text-nvidia-green font-bold text-sm">[A] / [←]</span>
                  <span className="text-gray-400 mt-1">Rẽ trái</span>
                </div>
                <div className="p-2 rounded bg-black/60 border border-cyber-border flex flex-col items-center">
                  <span className="text-nvidia-green font-bold text-sm">[D] / [→]</span>
                  <span className="text-gray-400 mt-1">Rẽ phải</span>
                </div>
              </div>
              <p className="text-[11px] text-gray-400 pt-1">
                * Cơ chế phanh quán tính: Khi nhả phím, xe sẽ tự động hãm tốc độ về 0 mà không bị trôi tự do.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              <h5 className="font-bold text-white text-sm">Các Chế Độ Vận Hành:</h5>
              <ul className="space-y-2 text-xs sm:text-sm pl-2">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-nvidia-green shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">BẬT TỰ LÁI AI:</strong> Kích hoạt bộ điều khiển Pure Pursuit vi sai tự động bám vạch vàng và né chướng ngại vật mượt mà với độ lệch tâm trung bình chỉ ~2cm.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-nvidia-green shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Đường Có Vật Cản:</strong> Thử thách AI né các chướng ngại vật (thùng gỗ, nón tiêu giao thông, thùng phuy) được bố trí trên đường đua.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-nvidia-green shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">3 Chế Độ Camera:</strong> Đuôi xe (Chase), Toàn cảnh 3D (Orbit) và Trên cao (Top-down) để quan sát toàn bộ sa hình.
                  </span>
                </li>
              </ul>
            </div>

            <div className="pt-2">
              <button
                onClick={onOpenArena}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-nvidia-green text-black font-bold text-xs hover:bg-[#86d200] shadow-lg transition-all"
              >
                <Compass className="w-4 h-4" />
                <span>Chuyển Sang Đấu Trường 3D Chạy Thử Ngay</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ),
      },
      {
        id: 'troubleshoot',
        category: 'troubleshoot',
        title: '5. Bảng Tra Cứu Lỗi & Xử Lý Sự Cố Thường Gặp (FAQ)',
        shortTitle: 'Xử Lý Sự Cố & FAQ',
        badge: 'Troubleshooting',
        readTime: '5 phút',
        content: (
          <div className="space-y-4 text-sm leading-relaxed text-gray-300">
            <p>
              Tổng hợp các câu hỏi và giải pháp xử lý sự cố kỹ thuật thường gặp nhất khi triển khai dự án JetBot:
            </p>

            <div className="space-y-3 my-2">
              <div className="p-3.5 rounded-xl border border-cyber-border bg-cyber-card/40">
                <h5 className="font-bold text-white text-sm flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                  Hỏi: Tại sao xe bị lệch hoặc lắc lư (oscillation) khi chạy tốc độ cao?
                </h5>
                <p className="text-xs text-gray-300 mt-1.5 pl-6">
                  <strong className="text-nvidia-green">Giải pháp:</strong> Hiện tượng lắc lư xảy ra khi độ lợi khuếch đại Kp quá cao. Hãy giảm Kp xuống khoảng 0.45 - 0.55 và tăng khoảng cách ngắm trước (lookahead distance) lên 0.45m để quỹ đạo mượt mà hơn.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-cyber-border bg-cyber-card/40">
                <h5 className="font-bold text-white text-sm flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                  Hỏi: Động cơ không quay hoặc báo lỗi Errno 121 / Remote I/O error?
                </h5>
                <p className="text-xs text-gray-300 mt-1.5 pl-6">
                  <strong className="text-nvidia-green">Giải pháp:</strong> Kiểm tra kết nối I2C bằng lệnh <code className="font-mono bg-black/60 px-1 py-0.5 rounded text-cyber-accent">i2cdetect -y -r 1</code> trong terminal. Địa chỉ của mạch driver motor PCA9685 phải hiển thị tại 0x60. Kiểm tra lại giắc cắm pin cấp cho Motor HAT.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-cyber-border bg-cyber-card/40">
                <h5 className="font-bold text-white text-sm flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                  Hỏi: Camera CSI Sony IMX219 bị đen màn hình hoặc không mở được stream?
                </h5>
                <p className="text-xs text-gray-300 mt-1.5 pl-6">
                  <strong className="text-nvidia-green">Giải pháp:</strong> Khởi động lại service quản lý camera của JetPack qua SSH terminal bằng lệnh: <code className="block my-1.5 p-2 rounded bg-black/70 font-mono text-cyber-accent text-xs">sudo systemctl restart nvargus-daemon</code> sau đó khởi động lại kernel Jupyter.
                </p>
              </div>
            </div>
          </div>
        ),
      },
    ],
    [onOpenArena]
  );

  const filteredSections = useMemo(() => {
    return sections.filter((s) => {
      const matchCat = activeCategory === 'all' || s.category === activeCategory;
      const matchSearch =
        searchQuery.trim() === '' ||
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.shortTitle.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [sections, activeCategory, searchQuery]);

  const activeSection = sections.find((s) => s.id === activeSectionId) || sections[0];

  return (
    <div className="w-full h-[calc(100vh-3.5rem)] flex flex-col md:flex-row overflow-hidden bg-[#070B10] text-gray-100 select-none">
      {/* Left Sidebar */}
      <aside className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-cyber-border bg-[#090E15] flex flex-col shrink-0">
        <div className="p-3.5 border-b border-cyber-border space-y-2.5">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-nvidia-green" />
            <h2 className="font-bold text-sm text-white font-display">HƯỚNG DẪN SỬ DỤNG JETBOT</h2>
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm chủ đề, mã lệnh..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-cyber-surface border border-cyber-border text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-nvidia-green transition-colors"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="px-3 py-2 border-b border-cyber-border/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'quickstart', label: 'Khởi động' },
            { id: 'motor', label: 'Động cơ' },
            { id: 'ai', label: 'AI & Model' },
            { id: 'arena', label: '3D Arena' },
            { id: 'troubleshoot', label: 'FAQ' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                soundFx.playClick();
                setActiveCategory(cat.id);
              }}
              className={'px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors ' + (activeCategory === cat.id ? 'bg-nvidia-green text-black font-bold' : 'text-gray-400 hover:text-white hover:bg-cyber-card')}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Table of Contents */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredSections.map((sec) => {
            const isSelected = sec.id === activeSection.id;
            return (
              <button
                key={sec.id}
                onClick={() => {
                  soundFx.playClick();
                  setActiveSectionId(sec.id);
                }}
                className={'w-full text-left p-3 rounded-xl transition-all flex items-start justify-between gap-2 border ' + (isSelected ? 'bg-cyber-card/90 border-nvidia-green/60 shadow-md text-white' : 'border-transparent text-gray-400 hover:text-white hover:bg-cyber-surface/60')}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={'text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ' + (isSelected ? 'bg-nvidia-green text-black' : 'bg-cyber-surface text-gray-400')}>
                      {sec.badge}
                    </span>
                    <span className="text-[10px] font-mono text-gray-500">{sec.readTime}</span>
                  </div>
                  <div className={'text-xs font-semibold leading-snug ' + (isSelected ? 'text-nvidia-green font-bold' : 'text-gray-200')}>
                    {sec.title}
                  </div>
                </div>
                <ChevronRight className={'w-4 h-4 mt-1 transition-transform ' + (isSelected ? 'text-nvidia-green translate-x-0.5' : 'text-gray-600')} />
              </button>
            );
          })}
        </nav>

        {/* Bottom Quick Button */}
        <div className="p-3 border-t border-cyber-border bg-[#070b10]">
          <button
            onClick={onOpenArena}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-cyber-card hover:bg-[#192433] border border-cyber-border text-xs text-cyber-accent hover:text-white font-semibold transition-all shadow"
          >
            <Compass className="w-3.5 h-3.5 text-nvidia-green" />
            <span>Mở Đấu Trường AI 3D</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 select-text">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="pb-4 border-b border-cyber-border space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-nvidia-green">
              <span>TÀI LIỆU KỸ THUẬT</span>
              <span>/</span>
              <span className="text-gray-400 uppercase">{activeSection.category}</span>
              <span>/</span>
              <span className="text-gray-500">{activeSection.readTime} đọc</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white font-display tracking-tight">
              {activeSection.title}
            </h1>
          </div>

          <div className="animate-fade-in">{activeSection.content}</div>

          <div className="pt-8 pb-4 border-t border-cyber-border/70 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400 font-mono">
            <span>NVIDIA JetBot Educational Platform v2.0</span>
            <button
              onClick={onOpenArena}
              className="flex items-center gap-1.5 text-nvidia-green hover:underline font-bold"
            >
              <span>Vào Đấu Trường Thử Nghiệm Ngay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
