# NVIDIA JetBot Autonomous Control & 3D Simulation Platform

> Nền tảng mô phỏng 3D tương tác, điều khiển động học vi sai và tự hành AI (Deep Learning & TensorRT) dành cho robot giáo dục NVIDIA JetBot.

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-success?style=for-the-badge&logo=vercel)](https://jetbot-simulation.vercel.app)
[![Tech Stack](https://img.shields.io/badge/Stack-React_18_%7C_TypeScript_%7C_Three.js_%7C_Tailwind-blue?style=for-the-badge)](https://react.dev)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

---

## 🌐 Trải Nghiệm Trực Tuyến

Truy cập bản mô phỏng chạy trực tiếp trên trình duyệt tại:  
👉 **[https://jetbot-simulation.vercel.app](https://jetbot-simulation.vercel.app)**

---

## 📌 Tổng Quan Dự Án

Dự án tái hiện toàn diện hệ thống robot tự hành **NVIDIA JetBot** (nền tảng Jetson Nano) dưới dạng Web App 3D tương tác cao:

1. **Cấu Tạo 3D Lab (Interactive Hardware Breakdown):**
   - Mô hình 3D trực quan JetBot với khả năng xoay, zoom, tách lớp linh kiện (Explode View).
   - Chi tiết thông số kỹ thuật, sơ đồ chân GPIO/I2C của Jetson Nano, Driver PCA9685, Camera Sony IMX219, màn hình OLED SSD1306 và động cơ DC vi sai TT.

2. **Đấu Trường AI 3D (3D Simulation Arena):**
   - Mô phỏng động học vi sai (Differential Drive Kinematics) với lực quán tính và bánh lăn tự do (Caster wheels).
   - **Tự hành bám làn (Road Following):** Thuật toán Pure Pursuit bám vạch kẻ đường liên tục với sai số lệch tâm cực thấp ($CTE \sim 1.8\text{cm} - 2.4\text{cm}$).
   - **Né tránh vật cản (Collision Avoidance):** Phát hiện vật cản (thùng gỗ, nón tiêu, thùng phuy) qua luồng camera FPV và tính toán quỹ đạo lượn sóng hình sin an toàn.
   - Hỗ trợ lái thủ công bàn phím (`W/A/S/D`), 3 góc camera (Đuôi xe, Toàn cảnh, Trên cao) và thay đổi tốc độ ($1.0\times - 3.0\times$).

3. **Hướng Dẫn Sử Dụng & Tài Liệu Kỹ Thuật:**
   - Hướng dẫn phần cứng & quy trình 4 bước khởi động robot thực tế.
   - Lập trình điều khiển động cơ Python SDK (`Robot.forward()`, `set_motors()`).
   - Kiến trúc mô hình AI Deep Learning (ResNet-18) và kỹ thuật tăng tốc suy luận bằng **NVIDIA TensorRT FP16 Engine** ($35+\text{ FPS}$).
   - Bảng tra cứu sự cố phần cứng & FAQ (I2C bus `0x60`, sụt áp nguồn LiPo, daemon camera).

4. **Bảng Lái Điều Khiển A → B (Teleoperation Flight Deck):**
   - Giao diện điều khiển từ xa dạng Flight Deck với telemetry tốc độ, điện áp pin, nhiệt độ GPU và mini-game di chuyển theo điểm mốc.

---

## 🛠 Công Nghệ Sử Dụng

- **Frontend & UI:** React 18, TypeScript, Tailwind CSS, Lucide Icons, Canvas Confetti.
- **3D Graphics & Physics:** Three.js, OrbitControls, mô hình JetBot 3D tùy biến, bộ tính toán động học vi sai và bám làn thời gian thực.
- **Build & Bundler:** Vite 6, PostCSS, Autoprefixer.
- **Deploy:** Vercel Edge Network.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Cục Bộ

### 1. Yêu cầu hệ thống
- Node.js >= 18.0.0
- npm hoặc yarn / pnpm

### 2. Cài đặt

```bash
# Clone repository
git clone https://github.com/phucs12t34-dev/jetbot-simulation.git

# Di chuyển vào thư mục dự án
cd jetbot-simulation

# Cài đặt các thư viện phụ thuộc
npm install
```

### 3. Khởi chạy môi trường phát triển (Development)

```bash
npm run dev
```

Mở trình duyệt tại địa chỉ `http://localhost:5173`.

### 4. Build bản thương phẩm (Production)

```bash
npm run build
```

Thư mục đầu ra sẽ nằm tại `dist/`.

---

## 📂 Cấu Trúc Thư Mục

```
jetbot-control-simulation/
├── src/
│   ├── components/
│   │   ├── Curriculum/        # Bài giảng lý thuyết & slide hướng dẫn
│   │   ├── FlightDeck/        # Bảng điều khiển lái từ xa A -> B
│   │   ├── HardwareLab/       # Phòng thí nghiệm cấu tạo phần cứng 3D
│   │   ├── JupyterLab/        # Hướng dẫn sử dụng & tài liệu kỹ thuật
│   │   ├── SimulationArena/   # Đấu trường mô phỏng 3D & FPV Camera
│   │   ├── Navbar.tsx         # Thanh điều hướng công nghệ cao
│   │   └── TelemetryHUD.tsx   # Hiển thị thông số vi sai & trạng thái xe
│   ├── simulation/
│   │   ├── ArenaEnvironment.ts # Môi trường đường đua, ánh sáng, vật cản Three.js
│   │   ├── JetBot3DModel.ts    # Dựng mô hình 3D JetBot đầy đủ bánh xe & casters
│   │   └── PhysicsKinematics.ts# Giải thuật động học vi sai & Pure Pursuit
│   ├── types/
│   │   └── jetbot.ts          # Định nghĩa kiểu dữ liệu TypeScript
│   ├── utils/
│   │   ├── audio.ts           # Hiệu ứng âm thanh động cơ & tương tác
│   │   └── hardwareComponents.ts # Cơ sở dữ liệu linh kiện JetBot
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── README.md
```

---

## 👨‍💻 Tác Giả & Bản Quyền

- **Họ và tên:** Nguyễn Thành Phúc
- **GitHub:** [@phucs12t34-dev](https://github.com/phucs12t34-dev)
- **Email:** phucs12t34@gmail.com
- Phát triển phục vụ mục đích nghiên cứu, học tập và giảng dạy công nghệ robot AI.
