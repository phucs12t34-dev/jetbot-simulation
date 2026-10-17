import { JetBotComponent } from '../types/jetbot';

export const JETBOT_COMPONENTS: JetBotComponent[] = [
  {
    id: 'jetson_nano',
    name: 'NVIDIA Jetson Nano Developer Kit',
    nameVi: 'Bo mạch Máy tính Trí tuệ Nhân tạo Edge Jetson Nano',
    category: 'compute',
    summaryVi: 'Bộ não AI xử lý mạng nơ-ron học sâu (Deep Learning) với 128 lõi GPU kiến trúc Maxwell.',
    descriptionVi:
      'NVIDIA Jetson Nano là máy tính nhúng AI nhỏ gọn nhưng cực kỳ mạnh mẽ, được trang bị GPU Maxwell 128 nhân có khả năng đạt 472 GFLOPS hiệu năng tính toán FP16. Bo mạch chạy hệ điều hành Ubuntu Linux với bộ công cụ NVIDIA JetPack (CUDA, cuDNN, TensorRT), cho phép chạy các mạng nơ-ron tích chập (CNN) như ResNet-18, MobileNet, YOLOv5 với tốc độ 40-60 khung hình/giây ngay trên robot mà không cần kết nối đám mây.',
    specs: {
      'GPU': '128-core NVIDIA Maxwell GPU @ 921 MHz (CUDA Cores)',
      'CPU': 'Quad-core ARM Cortex-A57 MPCore processor @ 1.43 GHz',
      'RAM': '4 GB 64-bit LPDDR4 25.6 GB/s',
      'Lưu trữ': 'Khe cắm thẻ nhớ MicroSD 64GB+ UHS-I',
      'Giao tiếp': 'Gigabit Ethernet, 4x USB 3.0, HDMI, DisplayPort, M.2 Key E',
      'Camera': '1x cổng MIPI CSI-2 15-pin ribbon interface',
      'Nguồn cấp': '5V 4A DC Barrel Jack (J48 jumper) hoặc 5V 2A Micro-USB',
      'Công suất': '5W (tiết kiệm) / 10W (tối đa công suất AI)',
    },
    pinConnections: [
      { pin: 'Pin 3 (I2C1_SDA)', functionVi: 'Đường truyền dữ liệu I2C Bus 1', protocol: 'I2C Data' },
      { pin: 'Pin 5 (I2C1_SCL)', functionVi: 'Xung nhịp đồng hồ I2C Bus 1', protocol: 'I2C Clock' },
      { pin: 'Pin 2 & 4 (5V)', functionVi: 'Nguồn cấp 5V DC hệ thống', protocol: 'Power 5V' },
      { pin: 'Pin 6 & 9 (GND)', functionVi: 'Chân nối mass chung', protocol: 'Ground' },
      { pin: 'CSI Connector', functionVi: 'Cáp dẹp camera MIPI CSI-2 2-lane', protocol: 'MIPI CSI-2' },
    ],
    educationalRoleVi:
      'Đóng vai trò là trung tâm tính toán của hệ thống robot (Edge AI Brain). Nơi tiếp nhận hình ảnh từ camera, chạy mô hình mạng nơ-ron ResNet-18 qua TensorRT, tính toán quyết định lái và gửi lệnh điều khiển tới mạch cầu H motor qua giao tiếp I2C.',
    explodePosition: [0, 0.09, 0],
  },
  {
    id: 'motor_driver',
    name: 'Adafruit Motor FeatherWing / PCA9685 Driver',
    nameVi: 'Mạch Điều Khiển Động Cơ Vi Sai I2C (PCA9685 + TB6612)',
    category: 'motor',
    summaryVi: 'Mạch giải mã I2C tạo 16 kênh PWM 12-bit và cầu H kép TB6612 điều khiển chiều và tốc độ motor.',
    descriptionVi:
      'Mạch điều khiển động cơ kết nối với Jetson Nano chỉ bằng 2 dây I2C (SDA và SCL). Bên trong tích hợp chíp PCA9685 với bộ đếm xung PWM 12-bit chuyên dụng hoạt động độc lập ở tần số 1600 Hz, giúp CPU của Jetson Nano không phải tốn tài nguyên tạo xung nhịp. Chip cầu H kép TB6612FNG điều khiển 2 động cơ DC với dòng tải liên tục 1.2A mỗi kênh (đỉnh 3.2A), hỗ trợ đầy đủ các chế độ quay thuận, quay nghịch, thắng điện và thả trôi.',
    specs: {
      'Giao tiếp': 'I2C Bus (Địa chỉ mặc định 0x60, có thể đổi sang 0x61-0x7F)',
      'Độ phân giải PWM': '12-bit (4096 mức điều chỉnh tốc độ mượt mà)',
      'Tần số PWM': 'Lên tới 1.6 kHz (không gây tiếng rít motor)',
      'Driver cầu H': 'Toshiba TB6612FNG Dual MOSFET H-Bridge',
      'Điện áp motor (VM)': '4.5V - 13.5V DC (từ bộ pin 7.4V)',
      'Dòng tải liên tục': '1.2A mỗi motor (3.2A peak trong vài mili-giây)',
    },
    pinConnections: [
      { pin: 'SDA', functionVi: 'Kết nối Pin 3 Jetson Nano', protocol: 'I2C Data' },
      { pin: 'SCL', functionVi: 'Kết nối Pin 5 Jetson Nano', protocol: 'I2C Clock' },
      { pin: 'Power In (VM)', functionVi: 'Nối cọc dương pin 7.4V Li-ion', protocol: '7.4V DC' },
      { pin: 'Motor 1 (+ / -)', functionVi: 'Nối động cơ bên Trái', protocol: 'PWM Output' },
      { pin: 'Motor 2 (+ / -)', functionVi: 'Nối động cơ bên Phải', protocol: 'PWM Output' },
    ],
    educationalRoleVi:
      'Giúp học sinh hiểu về nguyên lý cầu H (H-Bridge) trong việc đảo chiều dòng điện DC, phương pháp điều chế độ rộng xung PWM (Pulse Width Modulation) để điều chỉnh tốc độ, và ưu điểm của giao thức nối tiếp I2C trong việc giảm thiểu số chân dây dẫn.',
    explodePosition: [0, 0.045, 0],
  },
  {
    id: 'camera',
    name: 'Sony IMX219 160° Wide FOV Camera',
    nameVi: 'Camera Góc Rộng 160° Giao Tiếp MIPI CSI-2',
    category: 'vision',
    summaryVi: 'Mắt thần của robot: cảm biến 8 Megapixel góc siêu rộng truyền hình ảnh trực tiếp vào bộ nhớ GPU qua bus MIPI CSI.',
    descriptionVi:
      'Camera sử dụng cảm biến hình ảnh Sony IMX219 kích thước 1/4 inch, hỗ trợ ống kính góc rộng lên đến 160 độ để bao quát toàn bộ mặt đường và chướng ngại vật hai bên. Camera kết nối trực tiếp với bộ xử lý tín hiệu hình ảnh (ISP) của Jetson Nano qua cáp dẹp MIPI CSI-2 2 làn đường, truyền dữ liệu thô thẳng vào bộ nhớ CUDA thông qua đường ống phần cứng GStreamer NVMM với độ trễ cực thấp (dưới 15ms).',
    specs: {
      'Cảm biến': 'Sony IMX219 8-Megapixel CMOS Sensor',
      'Độ phân giải': '3280 x 2464 pixels (thực tế JetBot resize xuống 224x224 cho AI)',
      'Góc nhìn (FOV)': '160° Diagonal (Góc siêu rộng quan sát làn đường)',
      'Giao tiếp': '15-pin MIPI CSI-2 (Direct Memory Access vào ISP)',
      'Tốc độ khung hình': '1080p @ 30 FPS / 720p @ 60 FPS',
      'Ống kính': 'Tiêu cự cố định, có thể chỉnh vòng nét thủ công (Manual Focus)',
    },
    pinConnections: [
      { pin: 'MIPI CSI-2 Ribbon', functionVi: 'Cắm vào khe CAM0 trên Jetson Nano', protocol: 'MIPI CSI-2' },
    ],
    educationalRoleVi:
      'Là cơ quan thị giác cho các thuật toán Computer Vision. Giúp học sinh tìm hiểu về pipeline thu nhận hình ảnh thời gian thực, độ trễ xử lý (Latency), hiện tượng méo góc rộng (Fisheye distortion) và kỹ thuật tiền xử lý ảnh (Resize, Normalize) trước khi đưa vào mạng nơ-ron.',
    explodePosition: [0, 0.07, -0.065],
  },
  {
    id: 'oled',
    name: 'SSD1306 0.91" Monochrome OLED 128x32',
    nameVi: 'Màn Hình OLED Hiển Thị Thông Số & Địa Chỉ IP',
    category: 'display',
    summaryVi: 'Màn hình hiển thị trạng thái mạng, tải GPU và dung lượng pin không cần cắm màn hình rời.',
    descriptionVi:
      'Màn hình OLED sử dụng công nghệ tự phát sáng không cần đèn nền (Backlight), tiêu thụ điện năng cực thấp (khoảng 0.04W). Khi robot khởi động, một dịch vụ hệ thống chạy ngầm (`stats.service`) sẽ tự động đọc địa chỉ IP của giao diện mạng không dây `wlan0` và hiển thị lên màn hình, giúp người dùng dễ dàng mở laptop/điện thoại gõ địa chỉ IP để truy cập vào JupyterLab.',
    specs: {
      'Kích thước': '0.91 inch',
      'Độ phân giải': '128 x 32 pixels',
      'Màu sắc': 'Trắng xanh đơn sắc (Monochrome Blue/White)',
      'Giao tiếp': 'I2C Bus 1 (Địa chỉ hex: 0x3C)',
      'Điện áp hoạt động': '3.3V - 5.0V',
      'Góc nhìn': '> 160 độ cực rõ dưới ánh sáng ban ngày',
    },
    pinConnections: [
      { pin: 'VCC', functionVi: 'Nối nguồn 3.3V Pin 1', protocol: '3.3V DC' },
      { pin: 'GND', functionVi: 'Nối mass Pin 9', protocol: 'Ground' },
      { pin: 'SCL', functionVi: 'Nối I2C Clock Pin 5', protocol: 'I2C Clock' },
      { pin: 'SDA', functionVi: 'Nối I2C Data Pin 3', protocol: 'I2C Data' },
    ],
    educationalRoleVi:
      'Minh hoạ cách giao tiếp giữa vi xử lý và màn hình hiển thị qua giao thức I2C, cách sử dụng thư viện đồ hoạ PIL (Python Imaging Library) để vẽ văn bản và biểu đồ thông số phần cứng lên màn hình nhúng.',
    explodePosition: [0, 0.14, 0],
  },
  {
    id: 'motors',
    name: 'Dual TT DC Geared Motors',
    nameVi: 'Cặp Động Cơ Giảm Tốc TT Vàng (Tỉ số truyền 1:48)',
    category: 'motor',
    summaryVi: 'Cơ cấu chấp hành truyền lực chuyển động vi sai với hộp số giảm tốc bánh răng nhựa siêu bền.',
    descriptionVi:
      'Động cơ TT Gear Motor sử dụng động cơ điện DC 130 kết hợp hộp giảm tốc bánh răng kép tỉ số 1:48, biến tốc độ quay cao của động cơ nhỏ thành lực xoắn (Torque) mạnh mẽ đủ để đẩy toàn bộ trọng lượng robot (khoảng 700g) vượt qua chướng ngại vật và dốc nghiêng nhẹ.',
    specs: {
      'Tỉ số truyền': '1:48 (Gear Ratio)',
      'Điện áp làm việc': '3.0V - 6.0V DC',
      'Tốc độ không tải': '200 vòng/phút @ 6V, 130 vòng/phút @ 3V',
      'Mô-men xoắn': '0.8 kg.cm @ 4.5V',
      'Dòng không tải': '70 mA (Dòng kẹt tải tối đa 250 mA)',
    },
    pinConnections: [
      { pin: 'Dây Đỏ / Đen', functionVi: 'Hàn vào cọc motor và nối vào terminal Motor Driver', protocol: 'DC Power' },
    ],
    educationalRoleVi:
      'Bài học về cơ điện tử (Mechatronics), mô-men xoắn và vận tốc góc, tầm quan trọng của hộp giảm tốc trong kỹ thuật robot di động.',
    explodePosition: [0, -0.04, 0],
  },
  {
    id: 'wheels',
    name: 'Differential Drive Wheels (65mm Diameter)',
    nameVi: 'Cặp Bánh Xe Cao Su Vi Sai (Đường kính 65mm)',
    category: 'motor',
    summaryVi: 'Bánh xe cao su ma sát cao tạo lực bám tối ưu khi tăng tốc và ôm cua theo quỹ đạo.',
    descriptionVi:
      'Bánh xe bao gồm vành nhựa ABS màu xanh NVIDIA và lốp cao su dẻo có các rãnh gai chống trượt. Bằng cách điều khiển vận tốc $v_L$ của bánh trái và $v_R$ của bánh phải độc lập, robot có thể thực hiện mọi chuyển động: đi thẳng ($v_L = v_R$), cua vòng ($v_L \\neq v_R$) hoặc xoay tròn 360 độ quanh tâm ($v_L = -v_R$).',
    specs: {
      'Đường kính ngoài': '65 mm (0.065 m)',
      'Độ dày lốp': '26 mm',
      'Vật liệu lốp': 'Cao su tự nhiên có vân chống trượt',
      'Vật liệu vành': 'Nhựa ABS kỹ thuật màu xanh lá',
      'Trục lắp': 'Trục khuyết D-Shaft gắn vừa khít hộp số TT',
    },
    pinConnections: [
      { pin: 'D-Shaft', functionVi: 'Lắp cơ khí trực tiếp vào trục ra hộp số', protocol: 'Mechanical' },
    ],
    educationalRoleVi:
      'Cơ sở tính toán động học robot di động vi sai (Differential Drive Kinematics): quan hệ giữa bán kính bánh xe $r$, khoảng cách hai bánh $L$, và vận tốc dài/vận tốc góc của robot.',
    explodePosition: [0, 0, 0],
  },
  {
    id: 'front_caster',
    name: 'Front Omni-Directional Ball Caster',
    nameVi: 'Bánh Xe Xoay Đa Hướng Phía Trước (Front Caster Wheel)',
    category: 'chassis',
    summaryVi: 'Bánh xe bi kim loại xoay tự do 360 độ phía trước giúp xe giữ thăng bằng tuyệt đối khi tăng tốc.',
    descriptionVi:
      'Bánh xe xoay phía trước (Front Caster) sử dụng ổ bi lăn thép không gỉ mạ chrome chịu lực nằm trong ổ đỡ in 3D. Cho phép robot quay đầu tự do 360 độ theo mọi hướng với lực cản ma sát tối thiểu, ngăn chặn hoàn toàn hiện tượng xe bị chúc mũi xuống đất khi phanh gấp.',
    specs: {
      'Vị trí': 'Đầu xe (Trục trước Z = -0.078m)',
      'Đường kính bi': '15 mm',
      'Vật liệu bi': 'Thép không gỉ mạ chrome chịu lực cao',
      'Góc xoay': 'Tự do 360 độ (Omnidirectional)',
      'Khối lượng chịu tải': 'Tối đa 15 kg',
    },
    pinConnections: [
      { pin: 'Ổ đỡ Khung Trước', functionVi: 'Bắt vít trực tiếp vào ngàm trước chassis 3D', protocol: 'Mechanical' },
    ],
    educationalRoleVi:
      'Nguyên lý thăng bằng 4 điểm tựa động học: 2 bánh chủ động ở giữa + 1 bánh phụ trước + 1 bánh phụ sau tạo nên độ ổn định vượt trội trên mọi mặt phẳng.',
    explodePosition: [0, -0.055, -0.11],
  },
  {
    id: 'rear_caster',
    name: 'Rear Omni-Directional Ball Caster',
    nameVi: 'Bánh Xe Xoay Đa Hướng Phía Sau (Rear Caster Wheel)',
    category: 'chassis',
    summaryVi: 'Bánh xe bi kim loại xoay tự do 360 độ phía sau chống hiện tượng bốc đầu khi tăng tốc đột ngột.',
    descriptionVi:
      'Bánh xe xoay phía sau (Rear Caster) được bố trí đối xứng ở đuôi xe. Khi robot tăng tốc nhanh hoặc lên dốc, mô-men xoắn của hai động cơ TT có xu hướng nâng mũi và đè đuôi xe xuống. Bánh xe sau đóng vai trò là điểm tựa chống lật ngửa, đảm bảo robot luôn giữ thăng bằng phẳng lì.',
    specs: {
      'Vị trí': 'Đuôi xe (Trục sau Z = +0.078m)',
      'Đường kính bi': '15 mm',
      'Vật liệu bi': 'Thép không gỉ mạ chrome chịu lực cao',
      'Góc xoay': 'Tự do 360 độ (Omnidirectional)',
      'Khối lượng chịu tải': 'Tối đa 15 kg',
    },
    pinConnections: [
      { pin: 'Ổ đỡ Khung Sau', functionVi: 'Bắt vít trực tiếp vào ngàm sau chassis 3D', protocol: 'Mechanical' },
    ],
    educationalRoleVi:
      'Giúp học sinh phân tích trọng tâm (Center of Mass - CoM) và mô-men lực phản hồi quán tính trong thiết kế hệ thống truyền động xe tự hành.',
    explodePosition: [0, -0.055, 0.11],
  },
  {
    id: 'battery',
    name: 'Dual 18650 Li-ion Battery Pack',
    nameVi: 'Bộ Pin Li-ion 18650 Kép (7.4V - 8.4V)',
    category: 'power',
    summaryVi: 'Nguồn năng lượng độc lập cung cấp dòng xả cao cho động cơ và chíp xử lý AI.',
    descriptionVi:
      'Bộ pin gồm 2 cell Lithium-ion 18650 mắc nối tiếp (cấu hình 2S), cung cấp điện áp danh định 7.4V (đầy 8.4V). Bộ pin tích hợp mạch bảo vệ PCM (BMS) chống ngắn mạch, quá tải và xả kiệt pin. Điện áp 7.4V được cấp trực tiếp cho mạch công suất động cơ, đồng thời qua mạch giảm áp xung (Buck Converter) tạo ra dòng điện 5V 4A ổn định nuôi Jetson Nano.',
    specs: {
      'Cấu hình cell': '2S1P (2 cell mắc nối tiếp)',
      'Điện áp danh định': '7.4 V DC (Điện áp sạc đầy 8.4 V)',
      'Dung lượng': '2600 mAh - 3400 mAh',
      'Dòng xả liên tục': 'Tối đa 5A (đáp ứng tức thời dòng khởi động motor)',
      'Thời gian hoạt động': 'Khoảng 1.5 - 2 giờ chạy liên tục',
      'Mạch bảo vệ': 'Tích hợp BMS chống sạc quá áp, xả quá dòng và ngắt ngắn mạch',
    },
    pinConnections: [
      { pin: 'Dây Đỏ (+)', functionVi: 'Cực dương 7.4V cấp Motor Driver và Buck Converter', protocol: 'Power Positive' },
      { pin: 'Dây Đen (-)', functionVi: 'Cực âm (GND) chung hệ thống', protocol: 'Ground' },
    ],
    educationalRoleVi:
      'Bài học an toàn pin Lithium, quản lý nguồn điện cho thiết bị nhúng (Power Management), và tầm quan trọng của việc tách biệt nguồn động cơ gây nhiễu với nguồn nuôi vi xử lý AI.',
    explodePosition: [0, -0.075, 0],
  },
  {
    id: 'wifi_antennas',
    name: 'Intel AC-8265 Dual-Band Wi-Fi & Antennas',
    nameVi: 'Ăng-ten Kép & Card Mạng Không Dây Intel Wireless-AC',
    category: 'compute',
    summaryVi: 'Cầu nối không dây tốc độ cao cho phép stream video và lập trình JupyterLab từ xa.',
    descriptionVi:
      'Card mạng chuẩn M.2 Key E Intel Wireless-AC 8265 hỗ trợ 2 băng tần (2.4 GHz và 5 GHz) với công nghệ 2x2 MU-MIMO, đạt tốc độ lên tới 867 Mbps. Hai ăng-ten SMA dạng khớp xoay giúp định hướng sóng tốt nhất, đảm bảo đường truyền truyền hình ảnh camera 30 FPS mượt mà về giao diện web mà không bị rớt mạng.',
    specs: {
      'Băng tần': 'Dual-Band 2.4 GHz và 5 GHz',
      'Chuẩn Wi-Fi': 'IEEE 802.11ac / a / b / g / n (2x2 MU-MIMO)',
      'Tốc độ tối đa': '867 Mbps',
      'Bluetooth': 'Tích hợp Bluetooth 4.2 BLE (hỗ trợ gamepad không dây)',
      'Cổng cắm': 'M.2 2230 Key E trên bo mạch Jetson Nano',
      'Độ lợi ăng-ten': '3 dBi (SMA Omni-directional)',
    },
    pinConnections: [
      { pin: 'M.2 Slot', functionVi: 'Cắm dưới bo mạch Jetson Nano module', protocol: 'PCIe / USB' },
      { pin: 'Cáp IPEX-SMA', functionVi: 'Nối từ card ra 2 cọc ăng-ten ngoài', protocol: 'RF Coaxial' },
    ],
    educationalRoleVi:
      'Khái niệm về mạng máy tính không dây trong robotics (IoT, Teleoperation, WebSockets) và ảnh hưởng của băng thông đối với các ứng dụng truyền hình ảnh độ trễ thấp.',
    explodePosition: [0, 0.12, 0.06],
  },
  {
    id: 'chassis',
    name: '3D-Printed Custom Modular Chassis',
    nameVi: 'Khung Gầm In 3D Đa Năng (Màu Xanh Đặc Trưng NVIDIA)',
    category: 'chassis',
    summaryVi: 'Bộ khung gầm mở thiết kế bằng phần mềm CAD và in bằng máy in 3D công nghệ FDM.',
    descriptionVi:
      'Khung gầm của JetBot hoàn toàn là mã nguồn mở (Open Source Hardware), gồm các file STL có thể tải miễn phí về và in bằng vật liệu PLA hoặc PETG. Khung được thiết kế tối ưu với các rãnh giữ ốc mộng, ngàm kẹp động cơ chắc chắn không cần keo dán, khe đặt pin và hai ngàm gắn bánh xoay cân bằng trước/sau.',
    specs: {
      'Vật liệu in': 'Nhựa PETG hoặc PLA chống va đập',
      'Công nghệ sản xuất': 'FDM 3D Printing (Độ phân giải lớp 0.2mm, Infill 30%)',
      'Kích thước khung': '185 mm x 145 mm x 85 mm',
      'Khối lượng': 'Chỉ khoảng 125 g (siêu nhẹ)',
      'Khả năng mở rộng': 'Có sẵn các lỗ chờ bắt vít chuẩn M3 để gắn thêm cảm biến LiDAR, màn hình hoặc tay gắp',
    },
    pinConnections: [
      { pin: 'Khung Cơ khí', functionVi: 'Lắp ráp toàn bộ các linh kiện thành một khối thống nhất', protocol: 'Mechanical Frame' },
    ],
    educationalRoleVi:
      'Giáo dục STEM/Maker: học sinh học cách thiết kế CAD 3D, tối ưu hoá cấu trúc chịu lực, quy trình in 3D và tinh thần phần cứng mã nguồn mở.',
    explodePosition: [0, -0.01, 0],
  },
];
