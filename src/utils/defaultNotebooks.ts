import { JupyterNotebook } from '../types/jetbot';

export const DEFAULT_NOTEBOOKS: JupyterNotebook[] = [
  {
    id: 'basic_motion',
    title: 'Basic Motion Control',
    titleVi: 'Bài 1: Điều Khiển Động Cơ Cơ Bản',
    filename: '1_basic_motion.ipynb',
    levelVi: 'Cơ bản',
    descriptionVi: 'Khởi tạo đối tượng Robot, điều khiển 2 motor vi sai tiến, lùi, quay xe và kết hợp bộ đếm thời gian với mô phỏng động học trực quan.',
    cells: [
      {
        id: 'bm-1',
        type: 'markdown',
        source: `# Điều Khiển Động Cơ Cơ Bản (Basic Motion) - NVIDIA JetBot
Chào mừng các bạn đến với bài học lập trình JetBot!
Chạy từng ô code dưới đây để xem **kết quả mô phỏng động học trực quan**:
- \`robot.forward(speed)\`: Tiến thẳng phía trước
- \`robot.backward(speed)\`: Chạy lùi
- \`robot.left(speed)\` / \`robot.right(speed)\`: Quay xe tại chỗ (Zero Radius Turn)
- \`robot.set_motors(left, right)\`: Uốn lượn đường cong vi sai`,
      },
      {
        id: 'bm-2',
        type: 'code',
        source: `# Khởi tạo đối tượng Robot kết nối qua Adafruit Motor Driver PCA9685 I2C 0x60
from jetbot import Robot
import time

robot = Robot()
print("Kết nối thành công với bộ điều khiển động cơ JetBot!")`,
        output: `Connecting to Adafruit Motor FeatherWing at I2C address 0x60...
PCA9685 16-channel PWM driver initialized @ 1600 Hz.
robot = Robot() instantiated successfully.
Kết nối thành công với bộ điều khiển động cơ JetBot!`,
        outputWidget: 'motion_sim',
        executionCount: 1,
      },
      {
        id: 'bm-3',
        type: 'markdown',
        source: `### 1.1 Thử nghiệm chạy tiến trong 1.5 giây và dừng lại`,
      },
      {
        id: 'bm-4',
        type: 'code',
        source: `# Cho robot chạy tiến với tốc độ 40% trong 1.5 giây
robot.forward(0.40)
time.sleep(1.5)
robot.stop()
print("Hoàn thành lệnh tiến: robot.stop() đã ngắt xung PWM an toàn.")`,
        output: `robot.forward(speed=0.4) -> Left: 0.4, Right: 0.4
time.sleep(1.5) -> Executing timed motion for 1.5s
robot.stop() -> Left Motor: 0.0, Right Motor: 0.0 [Stopped]
Hoàn thành lệnh tiến: robot.stop() đã ngắt xung PWM an toàn.`,
        outputWidget: 'motion_sim',
        executionCount: 2,
      },
      {
        id: 'bm-5',
        type: 'markdown',
        source: `### 1.2 Thử nghiệm quay xe tại chỗ (Zero Radius Pivot Turn)`,
      },
      {
        id: 'bm-6',
        type: 'code',
        source: `# Bánh trái quay lùi (-0.35), bánh phải quay tiến (+0.35) -> Quay sang Trái
robot.left(0.35)
time.sleep(1.2)
robot.stop()`,
        output: `robot.left(speed=0.35) -> Turning Left (Zero Radius Pivot Turn)
robot.stop() -> Left Motor: 0.0, Right Motor: 0.0 [Stopped]`,
        outputWidget: 'motion_sim',
        executionCount: 3,
      },
      {
        id: 'bm-7',
        type: 'markdown',
        source: `### 1.3 Điều khiển vi sai 2 bánh độc lập qua hàm set_motors()`,
      },
      {
        id: 'bm-8',
        type: 'code',
        source: `# Cho bánh trái chạy 45%, bánh phải chạy 20% để rẽ vòng cung uốn lượn
robot.set_motors(0.45, 0.20)
time.sleep(2.0)
robot.stop()`,
        output: `robot.set_motors(left=0.45, right=0.2) applied to Adafruit FeatherWing PCA9685 I2C 0x60.
robot.stop() -> Left Motor: 0.0, Right Motor: 0.0 [Stopped]`,
        outputWidget: 'motion_sim',
        executionCount: 4,
      },
    ],
  },
  {
    id: 'teleoperation',
    title: 'Teleoperation & Camera Stream',
    titleVi: 'Bài 2: Điều Khiển Từ Xa & Stream Camera',
    filename: '2_teleoperation.ipynb',
    levelVi: 'Trung cấp',
    descriptionVi: 'Liên kết cần điều khiển Gamepad và luồng hình ảnh trực tiếp từ Camera Sony IMX219 thông qua cơ chế Traitlets.',
    cells: [
      {
        id: 'to-1',
        type: 'markdown',
        source: `# Điều Khiển Từ Xa & Truyền Hình Ảnh (Teleoperation)
Trong bài học này, chúng ta sử dụng **Traitlets** để kết nối:
1. Luồng video từ camera MIPI-CSI \`widgets.Image\`
2. Cần điều khiển Gamepad ảo \`widgets.Controller\``,
      },
      {
        id: 'to-2',
        type: 'code',
        source: `from jetbot import Robot, Camera
import ipywidgets.widgets as widgets
import traitlets

robot = Robot()
camera = Camera.instance(width=224, height=224)
print("Camera Sony IMX219 đã kích hoạt qua đường ống GStreamer phần cứng!")`,
        output: `Camera instance initialized: Sony IMX219 (MIPI CSI-2 GStreamer pipeline)
Streaming 224x224 JPEG at 30 FPS via traitlets Image widget.
Camera Sony IMX219 đã kích hoạt qua đường ống GStreamer phần cứng!`,
        outputWidget: 'camera',
        executionCount: 1,
      },
      {
        id: 'to-3',
        type: 'markdown',
        source: `### 2.1 Hiển thị khung hình camera thời gian thực (Live Camera Feed)`,
      },
      {
        id: 'to-4',
        type: 'code',
        source: `image_widget = widgets.Image(format='jpeg', width=224, height=224)
camera_link = traitlets.dlink((camera, 'value'), (image_widget, 'value'))
display(image_widget)`,
        output: `Displaying 224x224 live camera stream widget.`,
        outputWidget: 'camera',
        executionCount: 2,
      },
      {
        id: 'to-5',
        type: 'markdown',
        source: `### 2.2 Tạo tay cầm Gamepad điều khiển trực tiếp (Controller Widget)`,
      },
      {
        id: 'to-6',
        type: 'code',
        source: `controller = widgets.Controller(index=0)
traitlets.dlink((controller.axes[1], 'value'), (robot.left_motor, 'value'))
traitlets.dlink((controller.axes[3], 'value'), (robot.right_motor, 'value'))
display(controller)`,
        output: `Loaded ipywidgets.Controller(index=0)
Traitlets: Directional link established between Gamepad axes and Robot motor values.
Differential drive teleoperation active!`,
        outputWidget: 'gamepad',
        executionCount: 3,
      },
    ],
  },
  {
    id: 'collision_avoidance',
    title: 'AI Collision Avoidance (ResNet-18 + TensorRT)',
    titleVi: 'Bài 3: Tránh Vật Cản Bằng Học Sâu AI',
    filename: '3_collision_avoidance.ipynb',
    levelVi: 'Nâng cao AI',
    descriptionVi: 'Mô hình ResNet-18 phân loại nhị phân (Free vs Blocked) được tối ưu bằng NVIDIA TensorRT, tự động phát hiện vật cản và rẽ né tránh.',
    cells: [
      {
        id: 'ca-1',
        type: 'markdown',
        source: `# Tránh Vật Cản AI (ResNet-18 + NVIDIA TensorRT)
Mạng nơ-ron tích chập **ResNet-18** chạy ở độ chính xác FP16 trên 128 lõi GPU Maxwell:
- $P(\\text{blocked}) < 0.5$: Đường phía trước thông thoáng -> \`robot.forward(0.35)\`
- $P(\\text{blocked}) \\ge 0.5$: Có chướng ngại vật chắn đường -> \`robot.left(0.35)\` để né!`,
      },
      {
        id: 'ca-2',
        type: 'code',
        source: `import torch
from torch2trt import TRTModule
from jetbot import Robot, Camera

# Tải mô hình TensorRT đã tối ưu FP16
model_trt = TRTModule()
model_trt.load_state_dict(torch.load('best_model_trt.pth'))
print("Đã tải xong TensorRT ResNet-18 Collision Avoidance Model!")`,
        output: `[PyTorch 1.8.0 / TensorRT 7.1] Loading optimized engine: resnet18_trt.pth ...
CUDA device 0: NVIDIA Tegra X1 (Maxwell 128 CUDA cores)
Allocating TensorRT GPU memory context: 48.2 MB
Đã tải xong TensorRT ResNet-18 Collision Avoidance Model!`,
        outputWidget: 'collision_sim',
        executionCount: 1,
      },
      {
        id: 'ca-3',
        type: 'markdown',
        source: `### 3.1 Vòng lặp tự hành né vật cản theo thời gian thực (Live Autonomous Loop)`,
      },
      {
        id: 'ca-4',
        type: 'code',
        source: `import torch.nn.functional as F

def update(change):
    x = preprocess(change['new'])
    y = model_trt(x)
    prob_blocked = float(F.softmax(y, dim=1).flatten()[0])
    
    if prob_blocked < 0.5:
        robot.forward(0.35)
    else:
        robot.left(0.35)

# Bắt đầu vòng lặp tự lái tránh vật cản
robot.autonomous_mode = 'collision_avoidance'`,
        output: `Autonomous Collision Avoidance Loop started!
>>> Real-time inference running at ~45 FPS on Jetson Nano TensorRT FP16 engine
>>> Traitlets callback linked to robot differential drive.`,
        outputWidget: 'collision_sim',
        executionCount: 2,
      },
      {
        id: 'ca-5',
        type: 'code',
        source: `# Dừng chế độ tự hành AI
robot.stop()
print("Đã dừng xe an toàn.")`,
        output: `robot.stop() -> Left Motor: 0.0, Right Motor: 0.0 [Stopped]
Đã dừng xe an toàn.`,
        outputWidget: 'motion_sim',
        executionCount: 3,
      },
    ],
  },
  {
    id: 'road_following',
    title: 'Road Following & PID Control',
    titleVi: 'Bài 4: Bám Làn Đường Tự Hành & PID',
    filename: '4_road_following.ipynb',
    levelVi: 'Nâng cao Robotics',
    descriptionVi: 'Mô hình hồi quy dự đoán toạ độ mục tiêu (x, y) trên tim làn đường, tính toán góc lái và bộ điều khiển PID khép kín bám đường đua.',
    cells: [
      {
        id: 'rf-1',
        type: 'markdown',
        source: `# Bám Làn Đường Tự Động (Road Following via Regression)
1. ResNet-18 dự đoán toạ độ mục tiêu $(x, y)$ trên vạch kẻ đường phía trước.
2. Tính góc bẻ lái: $\\alpha = \\text{atan2}(x, y)$
3. Bộ điều khiển tỉ lệ **P-Controller**:
$$v_{\\text{left}} = v_{\\text{base}} + \\alpha \\times K_p, \\quad v_{\\text{right}} = v_{\\text{base}} - \\alpha \\times K_p$$`,
      },
      {
        id: 'rf-2',
        type: 'code',
        source: `import math
from jetbot import Robot, Camera

# Tải mô hình hồi quy bám làn đường
model_trt = torch.load('best_steering_model_xy_trt.pth')
steering_gain = 0.55
steering_kd = 0.12
speed_base = 0.35

print(f"Cấu hình PID: Kp={steering_gain}, Kd={steering_kd}, Speed={speed_base}")`,
        output: `[PyTorch / TensorRT] Loading Road Following Regression Engine: best_steering_model_xy_trt.pth
Warming up TensorRT execution context for 224x224 RGB input...
PID Controller initialized: Kp = 0.55, Kd = 0.12, base_speed = 0.32
Cấu hình PID: Kp=0.55, Kd=0.12, Speed=0.35`,
        outputWidget: 'road_sim',
        executionCount: 1,
      },
      {
        id: 'rf-3',
        type: 'code',
        source: `# Bắt đầu bám làn đường tự động
robot.road_following_loop(steering_gain=0.55, speed=0.35)`,
        output: `Autonomous Road Following Loop started!
>>> Projecting target waypoint (x, y) onto motor differential velocity.`,
        outputWidget: 'road_sim',
        executionCount: 2,
      },
      {
        id: 'rf-4',
        type: 'code',
        source: `robot.stop()`,
        output: `robot.stop() -> Left Motor: 0.0, Right Motor: 0.0 [Stopped]`,
        outputWidget: 'motion_sim',
        executionCount: 3,
      },
    ],
  },
  {
    id: 'oled_stats',
    title: 'OLED SSD1306 Display & Stats',
    titleVi: 'Bài 5: Lập Trình Màn Hình OLED SSD1306',
    filename: '5_oled_stats.ipynb',
    levelVi: 'Phần cứng & I2C',
    descriptionVi: 'Điều khiển màn hình OLED SSD1306 128x32 qua I2C bus 1 hiển thị địa chỉ IP, RAM, GPU và pin theo thời gian thực.',
    cells: [
      {
        id: 'os-1',
        type: 'markdown',
        source: `# Lập Trình Màn Hình OLED SSD1306 Trên JetBot
Màn hình OLED gắn trên JetBot kết nối qua **I2C Bus 1 (Địa chỉ 0x3C)**.
Mục đích: hiển thị địa chỉ Wi-Fi IP và tình trạng CPU/GPU của Jetson Nano!`,
      },
      {
        id: 'os-2',
        type: 'code',
        source: `import Adafruit_SSD1306
from PIL import Image, ImageDraw, ImageFont

# Khởi tạo màn hình OLED SSD1306 128x32 qua bus I2C 1
disp = Adafruit_SSD1306.SSD1306_128_32(rst=None, i2c_bus=1, gpio=1)
disp.begin()
disp.clear()
disp.display()
print("Màn hình OLED SSD1306 I2C 0x3C đã sẵn sàng hiển thị!")`,
        output: `[SSD1306 OLED Display] I2C Bus 1 address 0x3C initialized.
Writing telemetry frames: IP, Memory, GPU stats to 128x32 OLED.
Màn hình OLED SSD1306 I2C 0x3C đã sẵn sàng hiển thị!`,
        outputWidget: 'oled_sim',
        executionCount: 1,
      },
      {
        id: 'os-3',
        type: 'code',
        source: `# Cập nhật các thông số hệ thống lên màn hình
def stats():
    ip = "192.168.1.105"
    ram = "1.4G / 4.0G"
    gpu = "GPU: 38% | 42.5C"
    print(f"OLED Output:\\n- Line 1: NVIDIA JETBOT v2\\n- Line 2: IP: {ip}\\n- Line 3: RAM: {ram}\\n- Line 4: {gpu}")

stats()`,
        output: `OLED Output:
- Line 1: NVIDIA JETBOT v2
- Line 2: IP: 192.168.1.105
- Line 3: RAM: 1.4G / 4.0G
- Line 4: GPU: 38% | 42.5C`,
        outputWidget: 'oled_sim',
        executionCount: 2,
      },
    ],
  },
  {
    id: 'scratchpad',
    title: 'Free Scratchpad',
    titleVi: 'Khu Vực Gõ Code Sandbox Tự Do',
    filename: 'scratchpad.ipynb',
    levelVi: 'Tự do',
    descriptionVi: 'Khu vực tự do gõ bất kỳ câu lệnh nào để điều khiển robot và kiểm tra ngay phản ứng động học trên mô phỏng.',
    cells: [
      {
        id: 'sp-1',
        type: 'markdown',
        source: `# Sandbox Lập Trình Tự Do
Thử nghiệm các lệnh bất kỳ để quan sát robot phản hồi:
- \`robot.forward(0.4)\`
- \`robot.backward(0.4)\`
- \`robot.left(0.4)\`
- \`robot.right(0.4)\`
- \`robot.set_motors(0.5, 0.2)\`
- \`robot.stop()\``,
      },
      {
        id: 'sp-2',
        type: 'code',
        source: `from jetbot import Robot
import time

robot = Robot()

# Chạy tiến 2 giây rồi rẽ phải
robot.forward(0.40)
time.sleep(2.0)
robot.right(0.35)
time.sleep(1.0)
robot.stop()
print("Hoàn tất chu trình lệnh!")`,
        output: `robot.forward(speed=0.4) -> Left: 0.4, Right: 0.4
time.sleep(2.0) -> Executing timed motion for 2.0s
robot.stop() -> Left Motor: 0.0, Right Motor: 0.0 [Stopped]
Hoàn tất chu trình lệnh!`,
        outputWidget: 'motion_sim',
        executionCount: 1,
      },
    ],
  },
];
