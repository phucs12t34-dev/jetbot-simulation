import * as THREE from 'three';

export interface JetBotMeshParts {
  root: THREE.Group;
  chassis: THREE.Group;
  leftWheel: THREE.Group;
  rightWheel: THREE.Group;
  frontCaster: THREE.Group;
  rearCaster: THREE.Group;
  motors: THREE.Group;
  motorDriver: THREE.Group;
  jetsonNano: THREE.Group;
  camera: THREE.Group;
  oled: THREE.Group;
  battery: THREE.Group;
  antennas: THREE.Group;
  oledCanvas: HTMLCanvasElement;
  oledTexture: THREE.CanvasTexture;
  selectableMeshes: Map<THREE.Object3D, string>;
}

export function createJetBot3DModel(): JetBotMeshParts {
  const root = new THREE.Group();
  root.name = 'JetBotRoot';

  const selectableMeshes = new Map<THREE.Object3D, string>();

  const registerPart = (obj: THREE.Object3D, componentId: string) => {
    obj.userData = { componentId };
    selectableMeshes.set(obj, componentId);
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.userData = { componentId };
        selectableMeshes.set(child, componentId);
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  };

  // ==========================================
  // REALISTIC PBR MATERIALS
  // Exact NVIDIA JetBot Colors (Cyan 3D print + Jetson Nano Dark PCB & Heatsink)
  // ==========================================
  // Authentic 3D-printed chassis cyan/teal (seen in NVIDIA JetBot reference photos)
  const jetbotCyanMat = new THREE.MeshStandardMaterial({
    color: 0x00a896, // Vibrant JetBot Teal/Cyan
    roughness: 0.38,
    metalness: 0.12,
  });

  const jetbotCyanAccent = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.3,
    metalness: 0.2,
  });

  const nvidiaGreenMat = new THREE.MeshStandardMaterial({
    color: 0x76b900, // Official NVIDIA Green
    roughness: 0.25,
    metalness: 0.3,
  });

  const darkPlasticMat = new THREE.MeshStandardMaterial({
    color: 0x181e26,
    roughness: 0.6,
    metalness: 0.2,
  });

  const yellowGearMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b, // Yellow TT DC Gearbox
    roughness: 0.35,
    metalness: 0.1,
  });

  const rubberTireMat = new THREE.MeshStandardMaterial({
    color: 0x14181f,
    roughness: 0.95,
    metalness: 0.05,
  });

  const chromeMetalMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.12,
    metalness: 0.96,
  });

  const brushedMetalMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.35,
    metalness: 0.85,
  });

  const goldBrassMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.25,
    metalness: 0.9,
  });

  const pcbDarkGreenMat = new THREE.MeshStandardMaterial({
    color: 0x064e3b, // Dark green Jetson Nano PCB
    roughness: 0.4,
    metalness: 0.2,
  });

  const pcbBlueMat = new THREE.MeshStandardMaterial({
    color: 0x1d4ed8,
    roughness: 0.4,
    metalness: 0.2,
  });

  const heatsinkBlackMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a, // Anodized black aluminum heatsink
    roughness: 0.3,
    metalness: 0.88,
  });

  const batteryBlueMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.5,
    metalness: 0.15,
  });

  // ==========================================
  // 1. CHASSIS - AUTHENTIC CIRCULAR DISC BASE
  // (Hình tròn nguyên mẫu, KHÔNG CÓ nửa hình tròn / nắp bánh xe)
  // ==========================================
  const chassis = new THREE.Group();
  chassis.name = 'Chassis';

  // Flat Circular 3D-Printed Base Plate (radius 82mm, height 7mm)
  const circularPlateGeom = new THREE.CylinderGeometry(0.082, 0.082, 0.007, 64);
  const circularPlate = new THREE.Mesh(circularPlateGeom, jetbotCyanMat);
  circularPlate.position.set(0, 0.035, 0.0);
  chassis.add(circularPlate);

  // Decorative Chassis Bevel Ring & Lip
  const bevelRingGeom = new THREE.TorusGeometry(0.081, 0.0018, 16, 64);
  const bevelRing = new THREE.Mesh(bevelRingGeom, jetbotCyanAccent);
  bevelRing.rotation.x = Math.PI / 2;
  bevelRing.position.set(0, 0.0385, 0.0);
  chassis.add(bevelRing);

  // Chassis Center Wire Pass-through Cutout
  const cutoutGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.009, 32);
  const cutoutRing = new THREE.Mesh(cutoutGeom, darkPlasticMat);
  cutoutRing.position.set(0, 0.035, 0.0);
  chassis.add(cutoutRing);

  // 4x Brass Standoff Posts supporting Jetson Nano upper deck
  for (const sx of [-0.042, 0.042]) {
    for (const sz of [-0.036, 0.036]) {
      const standoffGeom = new THREE.CylinderGeometry(0.003, 0.003, 0.024, 16);
      const standoff = new THREE.Mesh(standoffGeom, goldBrassMat);
      standoff.position.set(sx, 0.047, sz);
      chassis.add(standoff);

      // Top mounting screw cap
      const screwGeom = new THREE.CylinderGeometry(0.0035, 0.0035, 0.002, 12);
      const screw = new THREE.Mesh(screwGeom, chromeMetalMat);
      screw.position.set(sx, 0.06, sz);
      chassis.add(screw);
    }
  }

  // Motor Under-Mounting Brackets (underneath the circular disc)
  for (const mx of [-0.045, 0.045]) {
    const mMountGeom = new THREE.BoxGeometry(0.012, 0.022, 0.05);
    const mMount = new THREE.Mesh(mMountGeom, jetbotCyanMat);
    mMount.position.set(mx, 0.024, 0.0);
    chassis.add(mMount);
  }

  registerPart(chassis, 'chassis');
  root.add(chassis);

  // ==========================================
  // 2. DUAL OMNIDIRECTIONAL BALL CASTERS
  // (Xe có 2 bánh xoay đa hướng: 1 bánh TRƯỚC và 1 bánh SAU)
  // ==========================================
  const makeCaster = (zPos: number, isFront: boolean) => {
    const casterGroup = new THREE.Group();
    casterGroup.name = isFront ? 'FrontCaster' : 'RearCaster';

    // 3D-printed cyan mounting bracket on circular chassis
    const mountPlateGeom = new THREE.BoxGeometry(0.028, 0.005, 0.028);
    const mountPlate = new THREE.Mesh(mountPlateGeom, jetbotCyanMat);
    mountPlate.position.set(0, 0.031, 0);
    casterGroup.add(mountPlate);

    // Chrome spherical bearing housing cup
    const cupGeom = new THREE.CylinderGeometry(0.015, 0.017, 0.015, 24);
    const cup = new THREE.Mesh(cupGeom, darkPlasticMat);
    cup.position.set(0, 0.023, 0);
    casterGroup.add(cup);

    // Polished chrome ball bearing (touches the ground)
    const ballGeom = new THREE.SphereGeometry(0.0125, 32, 32);
    const ball = new THREE.Mesh(ballGeom, chromeMetalMat);
    ball.position.set(0, 0.0125, 0);
    casterGroup.add(ball);

    // Retention ring
    const ringGeom = new THREE.TorusGeometry(0.012, 0.002, 12, 24);
    const ring = new THREE.Mesh(ringGeom, chromeMetalMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 0.016, 0);
    casterGroup.add(ring);

    casterGroup.position.set(0, 0, zPos);
    return casterGroup;
  };

  // 1 Front Ball Caster at z = -0.065m
  const frontCaster = makeCaster(-0.065, true);
  registerPart(frontCaster, 'front_caster');
  root.add(frontCaster);

  // 1 Rear Ball Caster at z = +0.065m
  const rearCaster = makeCaster(0.065, false);
  registerPart(rearCaster, 'rear_caster');
  root.add(rearCaster);

  // ==========================================
  // 3. DUAL TT DC MICRO GEARMOTORS (Underneath)
  // ==========================================
  const motors = new THREE.Group();
  motors.name = 'Motors';

  const makeMotor = (xPos: number, isLeft: boolean) => {
    const mGroup = new THREE.Group();

    // Yellow TT Gearbox
    const bodyGeom = new THREE.BoxGeometry(0.022, 0.022, 0.062);
    const body = new THREE.Mesh(bodyGeom, yellowGearMat);
    mGroup.add(body);

    // Rear metal DC motor can
    const canGeom = new THREE.CylinderGeometry(0.009, 0.009, 0.028, 16);
    const can = new THREE.Mesh(canGeom, brushedMetalMat);
    can.rotation.x = Math.PI / 2;
    can.position.set(0, 0, -0.04);
    mGroup.add(can);

    // Output drive axle shaft
    const shaftGeom = new THREE.CylinderGeometry(0.0035, 0.0035, 0.028, 16);
    const shaft = new THREE.Mesh(shaftGeom, chromeMetalMat);
    shaft.rotation.z = Math.PI / 2;
    shaft.position.set(isLeft ? -0.018 : 0.018, 0, 0.012);
    mGroup.add(shaft);

    mGroup.position.set(xPos, 0.025, 0.0);
    return mGroup;
  };

  const leftMotor = makeMotor(-0.046, true);
  const rightMotor = makeMotor(0.046, false);
  motors.add(leftMotor, rightMotor);
  registerPart(motors, 'motors');
  root.add(motors);

  // ==========================================
  // 4. MAIN DRIVE WHEELS (Left & Right, Fully Exposed, No Fenders!)
  // ==========================================
  const makeMainWheel = (isLeft: boolean) => {
    const wGroup = new THREE.Group();
    wGroup.name = isLeft ? 'LeftWheel' : 'RightWheel';

    // Outer Treaded Rubber Tire (diameter 65mm = radius 32.5mm)
    const tireGeom = new THREE.CylinderGeometry(0.0325, 0.0325, 0.026, 36);
    const tire = new THREE.Mesh(tireGeom, rubberTireMat);
    tire.rotation.z = Math.PI / 2;
    wGroup.add(tire);

    // Tread Grooves simulation
    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2;
      const treadBarGeom = new THREE.BoxGeometry(0.024, 0.002, 0.003);
      const treadBar = new THREE.Mesh(treadBarGeom, darkPlasticMat);
      treadBar.position.set(0, Math.cos(angle) * 0.0328, Math.sin(angle) * 0.0328);
      treadBar.rotation.x = angle;
      wGroup.add(treadBar);
    }

    // Inner Molded Rim (Cyan to match authentic JetBot)
    const rimGeom = new THREE.CylinderGeometry(0.022, 0.022, 0.027, 24);
    const rim = new THREE.Mesh(rimGeom, jetbotCyanMat);
    rim.rotation.z = Math.PI / 2;
    wGroup.add(rim);

    // 5-Spoke Wheel Pattern
    for (let i = 0; i < 5; i++) {
      const spAngle = (i / 5) * Math.PI * 2;
      const spokeGeom = new THREE.BoxGeometry(0.0275, 0.004, 0.018);
      const spoke = new THREE.Mesh(spokeGeom, darkPlasticMat);
      spoke.position.set(isLeft ? -0.001 : 0.001, Math.cos(spAngle) * 0.012, Math.sin(spAngle) * 0.012);
      spoke.rotation.x = spAngle;
      wGroup.add(spoke);
    }

    // Center Chrome Lug Nut
    const nutGeom = new THREE.CylinderGeometry(0.004, 0.004, 0.03, 6);
    const nut = new THREE.Mesh(nutGeom, chromeMetalMat);
    nut.rotation.z = Math.PI / 2;
    wGroup.add(nut);

    return wGroup;
  };

  const leftWheel = makeMainWheel(true);
  leftWheel.position.set(-0.082, 0.0325, 0.0);
  registerPart(leftWheel, 'wheels');
  root.add(leftWheel);

  const rightWheel = makeMainWheel(false);
  rightWheel.position.set(0.082, 0.0325, 0.0);
  registerPart(rightWheel, 'wheels');
  root.add(rightWheel);

  // ==========================================
  // 5. MOTOR DRIVER BOARD (Adafruit PCA9685)
  // ==========================================
  const motorDriver = new THREE.Group();
  motorDriver.name = 'MotorDriver';

  const driverPcbGeom = new THREE.BoxGeometry(0.052, 0.003, 0.062);
  const driverPcb = new THREE.Mesh(driverPcbGeom, pcbBlueMat);
  driverPcb.position.set(0, 0.046, 0.0);
  motorDriver.add(driverPcb);

  // Green Screw Terminals
  for (const tx of [-0.019, 0.019]) {
    const termGeom = new THREE.BoxGeometry(0.009, 0.012, 0.022);
    const termBlock = new THREE.Mesh(termGeom, new THREE.MeshStandardMaterial({ color: 0x10b981 }));
    termBlock.position.set(tx, 0.052, 0.015);
    motorDriver.add(termBlock);

    for (const sz of [-0.005, 0.005]) {
      const screwGeom = new THREE.CylinderGeometry(0.0018, 0.0018, 0.002, 10);
      const screw = new THREE.Mesh(screwGeom, goldBrassMat);
      screw.position.set(tx, 0.058, 0.015 + sz);
      motorDriver.add(screw);
    }
  }

  // Capacitor
  const capGeom = new THREE.CylinderGeometry(0.0045, 0.0045, 0.014, 18);
  const cap = new THREE.Mesh(capGeom, heatsinkBlackMat);
  cap.position.set(0, 0.054, 0.022);
  motorDriver.add(cap);

  registerPart(motorDriver, 'motor_driver');
  root.add(motorDriver);

  // ==========================================
  // 6. BATTERY PACK (3S 18650 Li-Ion)
  // ==========================================
  const battery = new THREE.Group();
  battery.name = 'Battery';

  const cradleGeom = new THREE.BoxGeometry(0.052, 0.008, 0.076);
  const cradle = new THREE.Mesh(cradleGeom, darkPlasticMat);
  cradle.position.set(0, 0.018, 0.0);
  battery.add(cradle);

  for (const bx of [-0.013, 0.013]) {
    const cellGeom = new THREE.CylinderGeometry(0.0095, 0.0095, 0.068, 24);
    const cell = new THREE.Mesh(cellGeom, batteryBlueMat);
    cell.rotation.x = Math.PI / 2;
    cell.position.set(bx, 0.022, 0.0);
    battery.add(cell);

    const tipGeom = new THREE.CylinderGeometry(0.003, 0.003, 0.002, 16);
    const tip = new THREE.Mesh(tipGeom, goldBrassMat);
    tip.rotation.x = Math.PI / 2;
    tip.position.set(bx, 0.022, -0.035);
    battery.add(tip);
  }

  registerPart(battery, 'battery');
  root.add(battery);

  // ==========================================
  // 7. NVIDIA JETSON NANO DEV KIT BOARD
  // ==========================================
  const jetsonNano = new THREE.Group();
  jetsonNano.name = 'JetsonNano';

  // 100x80mm Dark Green Carrier PCB
  const nanoPcbGeom = new THREE.BoxGeometry(0.102, 0.003, 0.082);
  const nanoPcb = new THREE.Mesh(nanoPcbGeom, pcbDarkGreenMat);
  nanoPcb.position.set(0, 0.062, 0.0);
  jetsonNano.add(nanoPcb);

  // Finned Anodized Black Aluminum Heatsink
  const heatsinkBaseGeom = new THREE.BoxGeometry(0.062, 0.018, 0.052);
  const heatsinkBase = new THREE.Mesh(heatsinkBaseGeom, heatsinkBlackMat);
  heatsinkBase.position.set(0, 0.072, 0.005);
  jetsonNano.add(heatsinkBase);

  // 12 Distinct Vertical Cooling Fins
  for (let i = -5; i <= 5; i++) {
    const finGeom = new THREE.BoxGeometry(0.06, 0.009, 0.002);
    const fin = new THREE.Mesh(finGeom, heatsinkBlackMat);
    fin.position.set(0, 0.083, 0.005 + i * 0.0048);
    jetsonNano.add(fin);
  }

  // Official NVIDIA Green Badge on Top of Heatsink
  const plaqueGeom = new THREE.BoxGeometry(0.032, 0.001, 0.012);
  const plaque = new THREE.Mesh(plaqueGeom, nvidiaGreenMat);
  plaque.position.set(0, 0.088, 0.005);
  jetsonNano.add(plaque);

  // 40-Pin GPIO Header
  const gpioGeom = new THREE.BoxGeometry(0.056, 0.009, 0.006);
  const gpio = new THREE.Mesh(gpioGeom, goldBrassMat);
  gpio.position.set(0, 0.067, -0.034);
  jetsonNano.add(gpio);

  // 4x USB 3.0 Ports Stack
  const usbGeom = new THREE.BoxGeometry(0.017, 0.017, 0.028);
  const usb = new THREE.Mesh(usbGeom, brushedMetalMat);
  usb.position.set(0.043, 0.071, 0.022);
  jetsonNano.add(usb);

  // RJ45 Ethernet Metal Jack
  const ethGeom = new THREE.BoxGeometry(0.017, 0.015, 0.018);
  const eth = new THREE.Mesh(ethGeom, chromeMetalMat);
  eth.position.set(0.043, 0.07, -0.006);
  jetsonNano.add(eth);

  // HDMI Port
  const hdmiGeom = new THREE.BoxGeometry(0.016, 0.009, 0.015);
  const hdmi = new THREE.Mesh(hdmiGeom, brushedMetalMat);
  hdmi.position.set(0.043, 0.067, -0.025);
  jetsonNano.add(hdmi);

  // DC Power Barrel Jack
  const dcGeom = new THREE.CylinderGeometry(0.005, 0.005, 0.012, 16);
  const dc = new THREE.Mesh(dcGeom, darkPlasticMat);
  dc.rotation.z = Math.PI / 2;
  dc.position.set(-0.045, 0.067, -0.025);
  jetsonNano.add(dc);

  registerPart(jetsonNano, 'jetson_nano');
  root.add(jetsonNano);

  // ==========================================
  // 8. DUAL WI-FI ANTENNAS
  // ==========================================
  const antennas = new THREE.Group();
  antennas.name = 'Antennas';

  const makeAntenna = (xPos: number, angleZ: number) => {
    const aGroup = new THREE.Group();

    // Gold SMA Connector
    const smaGeom = new THREE.CylinderGeometry(0.0035, 0.0035, 0.008, 12);
    const sma = new THREE.Mesh(smaGeom, goldBrassMat);
    aGroup.add(sma);

    // Swivel Knuckle
    const swivelGeom = new THREE.CylinderGeometry(0.004, 0.004, 0.01, 12);
    const swivel = new THREE.Mesh(swivelGeom, darkPlasticMat);
    swivel.position.y = 0.008;
    aGroup.add(swivel);

    // Rubber Duck Mast (angled up and backward)
    const mastGeom = new THREE.CylinderGeometry(0.003, 0.0018, 0.095, 12);
    const mast = new THREE.Mesh(mastGeom, darkPlasticMat);
    mast.position.y = 0.054;
    mast.rotation.z = angleZ;
    mast.rotation.x = -0.25;
    aGroup.add(mast);

    aGroup.position.set(xPos, 0.068, 0.038);
    return aGroup;
  };

  const antLeft = makeAntenna(-0.036, -0.42);
  const antRight = makeAntenna(0.036, 0.42);
  antennas.add(antLeft, antRight);
  registerPart(antennas, 'wifi_antennas');
  root.add(antennas);

  // ==========================================
  // 9. OLED SSD1306 128x32 I2C DISPLAY
  // ==========================================
  const oled = new THREE.Group();
  oled.name = 'OledDisplay';

  const oledCanvas = document.createElement('canvas');
  oledCanvas.width = 256;
  oledCanvas.height = 128;
  const oledCtx = oledCanvas.getContext('2d')!;
  oledCtx.fillStyle = '#050c14';
  oledCtx.fillRect(0, 0, 256, 128);
  oledCtx.fillStyle = '#00e5ff';
  oledCtx.font = 'bold 22px monospace';
  oledCtx.fillText('NVIDIA JETBOT v2', 15, 32);
  oledCtx.fillStyle = '#76b900';
  oledCtx.font = '17px monospace';
  oledCtx.fillText('IP: 192.168.1.105', 15, 62);
  oledCtx.fillText('BAT: 98% [====]', 15, 88);
  oledCtx.fillText('AI: RUNNING (30FPS)', 15, 114);

  const oledTexture = new THREE.CanvasTexture(oledCanvas);
  oledTexture.minFilter = THREE.LinearFilter;

  // Blue PCB
  const oledPcbGeom = new THREE.BoxGeometry(0.038, 0.002, 0.024);
  const oledPcb = new THREE.Mesh(oledPcbGeom, pcbBlueMat);
  oledPcb.position.set(0, 0.088, -0.025);
  oledPcb.rotation.x = -Math.PI / 6;
  oled.add(oledPcb);

  // Screen Glass
  const screenGeom = new THREE.PlaneGeometry(0.032, 0.016);
  const screenMat = new THREE.MeshBasicMaterial({ map: oledTexture, toneMapped: false });
  const screen = new THREE.Mesh(screenGeom, screenMat);
  screen.position.set(0, 0.0895, -0.025);
  screen.rotation.x = -Math.PI / 6 - Math.PI / 2;
  screen.rotation.z = Math.PI;
  oled.add(screen);

  registerPart(oled, 'oled');
  root.add(oled);

  // ==========================================
  // 10. FRONT CSI WIDE-ANGLE CAMERA
  // ==========================================
  const camera = new THREE.Group();
  camera.name = 'Camera';

  // 3D-Printed Cyan Camera Mount Tower (matching real JetBot cyan 3D print)
  const mountTowerGeom = new THREE.BoxGeometry(0.032, 0.046, 0.022);
  const mountTower = new THREE.Mesh(mountTowerGeom, jetbotCyanMat);
  mountTower.position.set(0, 0.066, -0.065);
  mountTower.rotation.x = -0.22;
  camera.add(mountTower);

  // Camera Sensor Red PCB
  const camPcbGeom = new THREE.BoxGeometry(0.025, 0.025, 0.002);
  const camPcb = new THREE.Mesh(camPcbGeom, new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.4 }));
  camPcb.position.set(0, 0.082, -0.076);
  camPcb.rotation.x = -0.22;
  camera.add(camPcb);

  // Black Cylindrical Lens Barrel (tilted 15-20 deg down)
  const lensBarrelGeom = new THREE.CylinderGeometry(0.0075, 0.0075, 0.011, 24);
  const lensBarrel = new THREE.Mesh(lensBarrelGeom, darkPlasticMat);
  lensBarrel.rotation.x = Math.PI / 2 - 0.22;
  lensBarrel.position.set(0, 0.082, -0.082);
  camera.add(lensBarrel);

  // Lens Glass
  const lensGlassGeom = new THREE.CylinderGeometry(0.006, 0.006, 0.002, 24);
  const lensGlass = new THREE.Mesh(
    lensGlassGeom,
    new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.85,
      ior: 1.52,
    })
  );
  lensGlass.rotation.x = Math.PI / 2 - 0.22;
  lensGlass.position.set(0, 0.081, -0.088);
  camera.add(lensGlass);

  // MIPI CSI Ribbon Cable
  const ribbonGeom = new THREE.BoxGeometry(0.016, 0.001, 0.032);
  const ribbon = new THREE.Mesh(ribbonGeom, new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 }));
  ribbon.position.set(0, 0.064, -0.048);
  ribbon.rotation.x = 0.28;
  camera.add(ribbon);

  registerPart(camera, 'camera');
  root.add(camera);

  return {
    root,
    chassis,
    leftWheel,
    rightWheel,
    frontCaster,
    rearCaster,
    motors,
    motorDriver,
    jetsonNano,
    camera,
    oled,
    battery,
    antennas,
    oledCanvas,
    oledTexture,
    selectableMeshes,
  };
}

// Smoothly interpolate exploded view with both front and rear casters
export function updateExplodeProgress(parts: JetBotMeshParts, t: number) {
  // Chassis stays near base
  parts.chassis.position.y = THREE.MathUtils.lerp(0, -0.01, t);

  // Motors drop down slightly
  parts.motors.position.y = THREE.MathUtils.lerp(0, -0.04, t);

  // Battery drops down lower
  parts.battery.position.y = THREE.MathUtils.lerp(0, -0.075, t);

  // Wheels slide outward left and right
  parts.leftWheel.position.x = THREE.MathUtils.lerp(-0.082, -0.17, t);
  parts.rightWheel.position.x = THREE.MathUtils.lerp(0.082, 0.17, t);

  // FRONT Caster drops down and moves forward
  parts.frontCaster.position.y = THREE.MathUtils.lerp(0, -0.055, t);
  parts.frontCaster.position.z = THREE.MathUtils.lerp(-0.065, -0.11, t);

  // REAR Caster drops down and moves backward
  parts.rearCaster.position.y = THREE.MathUtils.lerp(0, -0.055, t);
  parts.rearCaster.position.z = THREE.MathUtils.lerp(0.065, 0.11, t);

  // Motor Driver lifts up
  parts.motorDriver.position.y = THREE.MathUtils.lerp(0, 0.045, t);

  // Jetson Nano lifts higher
  parts.jetsonNano.position.y = THREE.MathUtils.lerp(0, 0.09, t);

  // Camera lifts forward & up
  parts.camera.position.z = THREE.MathUtils.lerp(0, -0.065, t);
  parts.camera.position.y = THREE.MathUtils.lerp(0, 0.07, t);

  // OLED lifts up highest
  parts.oled.position.y = THREE.MathUtils.lerp(0, 0.14, t);

  // Antennas move backward and up
  parts.antennas.position.y = THREE.MathUtils.lerp(0, 0.12, t);
  parts.antennas.position.z = THREE.MathUtils.lerp(0, 0.06, t);
}
