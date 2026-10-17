import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import confetti from 'canvas-confetti';
import { RobotState } from '../../types/jetbot';
import { createJetBot3DModel, JetBotMeshParts } from '../../simulation/JetBot3DModel';
import { soundFx } from '../../utils/audio';
import {
  Gamepad2,
  Trophy,
  RotateCcw,
  Sun,
  Moon,
  Clock,
  Compass,
  Zap,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Square,
  Crosshair,
  Camera,
  Eye,
  Video,
} from 'lucide-react';

interface FlightDeckViewProps {
  robotState: RobotState;
}

interface SandboxObstacle {
  x: number;
  z: number;
  radius: number;
  type: 'box' | 'cone' | 'barrel';
}

export const FlightDeckView: React.FC<FlightDeckViewProps> = ({ robotState }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [cameraView, setCameraView] = useState<'chase' | 'overhead' | 'fpv'>('chase');
  const [isLightMode, setIsLightMode] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.5);

  // Mission Game State (Điểm A -> Điểm B)
  const startPoint = { x: -3.0, z: 3.0 };
  const goalPoint = { x: 3.0, z: -3.0 };
  const [isMissionCompleted, setIsMissionCompleted] = useState<boolean>(false);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [collisionCount, setCollisionCount] = useState<number>(0);

  // Live pose state for React UI & Mini-Map reactivity
  const [livePose, setLivePose] = useState({ x: -3.0, z: 3.0, theta: -Math.PI / 4, speed: 0 });

  // Active key state for UI visual feedback
  const [activeKeys, setActiveKeys] = useState<{ [key: string]: boolean }>({});

  // Obstacles placed in the sandbox between A and B
  const obstaclesRef = useRef<SandboxObstacle[]>([
    { x: -1.6, z: 2.2, radius: 0.35, type: 'box' },
    { x: -0.6, z: 2.6, radius: 0.28, type: 'cone' },
    { x: -2.3, z: 0.6, radius: 0.35, type: 'barrel' },
    { x: -1.0, z: 0.8, radius: 0.4, type: 'box' },
    { x: 0.6, z: 1.4, radius: 0.3, type: 'cone' },
    { x: -0.2, z: -0.6, radius: 0.35, type: 'barrel' },
    { x: 1.4, z: 0.2, radius: 0.4, type: 'box' },
    { x: 2.2, z: -1.2, radius: 0.3, type: 'cone' },
    { x: 0.8, z: -1.8, radius: 0.35, type: 'box' },
    { x: 1.7, z: -2.3, radius: 0.35, type: 'barrel' },
  ]);

  // Motion physics variables in ref so they update every frame
  const motionRef = useRef({
    x: startPoint.x,
    z: startPoint.z,
    theta: -Math.PI / 4,
    targetSpeedL: 0,
    targetSpeedR: 0,
    currentSpeedL: 0,
    currentSpeedR: 0,
    leftRot: 0,
    rightRot: 0,
  });

  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const distToGoal = Math.hypot(livePose.x - goalPoint.x, livePose.z - goalPoint.z);

  // Timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTimerRunning && !isMissionCompleted) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 0.1);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, isMissionCompleted]);

  // Check victory arrival
  useEffect(() => {
    if (distToGoal < 0.6 && !isMissionCompleted && (motionRef.current.x !== startPoint.x || motionRef.current.z !== startPoint.z)) {
      setIsMissionCompleted(true);
      setIsTimerRunning(false);
      motionRef.current.targetSpeedL = 0;
      motionRef.current.targetSpeedR = 0;
      soundFx.playSuccess();

      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
      });
    }
  }, [distToGoal, isMissionCompleted]);

  // 3D Scene Setup
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isLightMode ? 0xf8fafc : 0x0a0f16);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 50);
    camera.position.set(startPoint.x + 1.2, 2.0, startPoint.z + 1.8);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(startPoint.x, 0.1, startPoint.z);
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    controlsRef.current = controls;

    // Lighting
    const ambLight = new THREE.AmbientLight(0xffffff, isLightMode ? 1.4 : 0.8);
    scene.add(ambLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, isLightMode ? 1.6 : 1.2);
    sunLight.position.set(6, 12, 6);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    // Arena Floor (8m x 8m)
    const floorSize = 8;
    const floorGeom = new THREE.PlaneGeometry(floorSize, floorSize);
    const floorMat = new THREE.MeshStandardMaterial({
      color: isLightMode ? 0xe2e8f0 : 0x0f1722,
      roughness: 0.6,
    });
    const floor = new THREE.Mesh(floorGeom, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Floor Grid
    const grid = new THREE.GridHelper(8, 16, isLightMode ? 0x94a3b8 : 0x76b900, isLightMode ? 0xcbd5e1 : 0x1e293b);
    grid.position.y = 0.002;
    scene.add(grid);

    // Perimeter walls
    const wallHeight = 0.35;
    const wallThickness = 0.08;
    const wallMat = new THREE.MeshStandardMaterial({ color: isLightMode ? 0x94a3b8 : 0x1e293b });
    const createWall = (x: number, z: number, w: number, d: number) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, wallHeight, d), wallMat);
      mesh.position.set(x, wallHeight / 2, z);
      scene.add(mesh);
    };
    createWall(0, -4, 8, wallThickness);
    createWall(0, 4, 8, wallThickness);
    createWall(-4, 0, wallThickness, 8);
    createWall(4, 0, wallThickness, 8);

    // START POINT A (Green Zone)
    const startZone = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.6, 0.015, 32),
      new THREE.MeshStandardMaterial({ color: 0x10b981 })
    );
    startZone.position.set(startPoint.x, 0.008, startPoint.z);
    scene.add(startZone);

    // GOAL POINT B (Gold Target Zone)
    const goalZone = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.6, 0.015, 32),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b })
    );
    goalZone.position.set(goalPoint.x, 0.008, goalPoint.z);
    scene.add(goalZone);

    // Goal Floating Beacon Ring
    const goalRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.55, 0.035, 16, 32),
      new THREE.MeshBasicMaterial({ color: 0xf59e0b })
    );
    goalRing.rotation.x = Math.PI / 2;
    goalRing.position.set(goalPoint.x, 0.45, goalPoint.z);
    scene.add(goalRing);

    // Obstacles meshes
    const crateMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 });
    const coneMat = new THREE.MeshStandardMaterial({ color: 0xf97316 });
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6 });

    obstaclesRef.current.forEach((obs) => {
      if (obs.type === 'box') {
        const size = obs.radius * 2;
        const box = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), crateMat);
        box.position.set(obs.x, size / 2, obs.z);
        box.castShadow = true;
        scene.add(box);
      } else if (obs.type === 'cone') {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(obs.radius, 0.45, 16), coneMat);
        cone.position.set(obs.x, 0.225, obs.z);
        cone.castShadow = true;
        scene.add(cone);
      } else {
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(obs.radius, obs.radius, 0.5, 16), barrelMat);
        barrel.position.set(obs.x, 0.25, obs.z);
        barrel.castShadow = true;
        scene.add(barrel);
      }
    });

    // Detailed JetBot 3D Model with Front & Rear Casters
    const robotParts = createJetBot3DModel();
    scene.add(robotParts.root);

    // Initial position
    motionRef.current.x = startPoint.x;
    motionRef.current.z = startPoint.z;
    motionRef.current.theta = -Math.PI / 4;
    robotParts.root.position.set(startPoint.x, 0, startPoint.z);
    robotParts.root.rotation.y = motionRef.current.theta;

    // Keyboard listener
    const keysDown: { [key: string]: boolean } = {};
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keysDown[k] = true;
      setActiveKeys({ ...keysDown });
      if (!isTimerRunning && !isMissionCompleted) setIsTimerRunning(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keysDown[k] = false;
      setActiveKeys({ ...keysDown });
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Animation Loop
    let animId: number;
    let lastTime = performance.now();
    let frameCount = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min(0.08, (now - lastTime) / 1000);
      lastTime = now;
      frameCount++;

      goalRing.rotation.z += 0.02;

      const m = motionRef.current;

      // Keyboard drive input
      let forward = 0;
      let turn = 0;
      if (keysDown['w'] || keysDown['arrowup']) forward += 0.65 * speedMultiplier;
      if (keysDown['s'] || keysDown['arrowdown']) forward -= 0.65 * speedMultiplier;
      if (keysDown['a'] || keysDown['arrowleft']) turn += 0.55 * speedMultiplier;
      if (keysDown['d'] || keysDown['arrowright']) turn -= 0.55 * speedMultiplier;

      if (forward !== 0 || turn !== 0) {
        m.targetSpeedL = forward - turn;
        m.targetSpeedR = forward + turn;
      } else if (!isKeysDown(keysDown)) {
        // If no keys pressed, keep whatever is in targetSpeed (e.g. from D-pad click)
      }

      // CRITICAL FIX: Smoothly ramp currentSpeed towards targetSpeed!
      const inertia = Math.min(1.0, dt * 15);
      m.currentSpeedL += (m.targetSpeedL - m.currentSpeedL) * inertia;
      m.currentSpeedR += (m.targetSpeedR - m.currentSpeedR) * inertia;

      // Wheel velocities (m/s)
      const vL = m.currentSpeedL * 0.75 * speedMultiplier;
      const vR = m.currentSpeedR * 0.75 * speedMultiplier;
      const v = (vL + vR) / 2;
      const omega = (vR - vL) / 0.15; // rad/s

      // Update pose
      m.theta += omega * dt;
      let nextX = m.x - Math.sin(m.theta) * v * dt;
      let nextZ = m.z - Math.cos(m.theta) * v * dt;

      // Obstacle collision resolution
      const rRad = 0.12;
      for (const obs of obstaclesRef.current) {
        const d = Math.hypot(nextX - obs.x, nextZ - obs.z);
        if (d < rRad + obs.radius) {
          setCollisionCount((c) => c + 1);
          soundFx.playCollisionAlert();
          const ang = Math.atan2(nextZ - obs.z, nextX - obs.x);
          nextX = obs.x + Math.cos(ang) * (rRad + obs.radius);
          nextZ = obs.z + Math.sin(ang) * (rRad + obs.radius);
        }
      }

      // Wall boundaries
      nextX = Math.max(-3.85, Math.min(3.85, nextX));
      nextZ = Math.max(-3.85, Math.min(3.85, nextZ));

      m.x = nextX;
      m.z = nextZ;

      // Wheel rotations
      m.leftRot += (vL * dt) / 0.0325;
      m.rightRot += (vR * dt) / 0.0325;
      robotParts.leftWheel.rotation.x = m.leftRot;
      robotParts.rightWheel.rotation.x = m.rightRot;

      // Update 3D Mesh
      robotParts.root.position.set(m.x, 0, m.z);
      robotParts.root.rotation.y = m.theta;

      // Sound
      soundFx.updateMotorSound(m.currentSpeedL, m.currentSpeedR);

      // Camera views
      if (cameraView === 'chase') {
        const offsetDist = 1.1;
        const offsetHeight = 0.55;
        const behindX = m.x + Math.sin(m.theta) * offsetDist;
        const behindZ = m.z + Math.cos(m.theta) * offsetDist;
        camera.position.lerp(new THREE.Vector3(behindX, offsetHeight, behindZ), 0.12);
        controls.target.lerp(new THREE.Vector3(m.x, 0.08, m.z), 0.12);
      } else if (cameraView === 'overhead') {
        camera.position.lerp(new THREE.Vector3(0, 7.5, 0.01), 0.1);
        controls.target.lerp(new THREE.Vector3(0, 0, 0), 0.1);
      } else if (cameraView === 'fpv') {
        // Cockpit camera right on front camera mount
        const camX = m.x - Math.sin(m.theta) * 0.08;
        const camZ = m.z - Math.cos(m.theta) * 0.08;
        const lookX = m.x - Math.sin(m.theta) * 2.5;
        const lookZ = m.z - Math.cos(m.theta) * 2.5;
        camera.position.set(camX, 0.09, camZ);
        controls.target.set(lookX, 0.07, lookZ);
      }

      controls.update();
      renderer.render(scene, camera);

      // Throttled React state update for Mini-Map & HUD (every 3 frames ~ 20 FPS)
      if (frameCount % 3 === 0) {
        setLivePose({ x: m.x, z: m.z, theta: m.theta, speed: v });
      }
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isLightMode, cameraView, speedMultiplier]);

  const isKeysDown = (kd: { [key: string]: boolean }) => {
    return kd['w'] || kd['s'] || kd['a'] || kd['d'] || kd['arrowup'] || kd['arrowdown'] || kd['arrowleft'] || kd['arrowright'];
  };

  // D-Pad drive actions
  const startDrive = (l: number, r: number) => {
    if (!isTimerRunning && !isMissionCompleted) setIsTimerRunning(true);
    motionRef.current.targetSpeedL = l * speedMultiplier;
    motionRef.current.targetSpeedR = r * speedMultiplier;
  };

  const stopDrive = () => {
    motionRef.current.targetSpeedL = 0;
    motionRef.current.targetSpeedR = 0;
  };

  const restartMission = () => {
    soundFx.playClick();
    setIsMissionCompleted(false);
    setElapsedTime(0);
    setIsTimerRunning(false);
    setCollisionCount(0);
    const m = motionRef.current;
    m.x = startPoint.x;
    m.z = startPoint.z;
    m.theta = -Math.PI / 4;
    m.targetSpeedL = 0;
    m.targetSpeedR = 0;
    m.currentSpeedL = 0;
    m.currentSpeedR = 0;
    setLivePose({ x: startPoint.x, z: startPoint.z, theta: -Math.PI / 4, speed: 0 });
  };

  return (
    <div className={`w-full h-[calc(100vh-3.5rem)] flex flex-col md:flex-row overflow-hidden ${isLightMode ? 'bg-slate-100 text-slate-800' : 'bg-[#0A0E13] text-gray-100'} select-none`}>
      {/* Main 3D Mission Sandbox Viewport */}
      <div className="relative flex-1 h-full min-h-[400px]">
        <div className="w-full h-full" ref={mountRef} />

        {/* Top Mission HUD Banner */}
        <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none z-10">
          {/* Mission Progress Card */}
          <div className="pointer-events-auto cyber-panel px-3.5 py-2 rounded-xl border border-cyber-border flex items-center gap-4 text-xs font-mono shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-white">Nhiệm Vụ: Lái Điểm A → B</span>
            </div>

            <div className="h-4 w-[1px] bg-cyber-border" />

            <div className="flex items-center gap-1.5 text-gray-300">
              <Compass className="w-3.5 h-3.5 text-cyber-accent" />
              <span>Khoảng cách:</span>
              <span className="font-bold text-emerald-400">{distToGoal.toFixed(2)} m</span>
            </div>

            <div className="h-4 w-[1px] bg-cyber-border hidden sm:block" />

            <div className="hidden sm:flex items-center gap-1.5 text-gray-300">
              <Clock className="w-3.5 h-3.5 text-yellow-400" />
              <span>Thời gian:</span>
              <span className="font-bold text-white">{elapsedTime.toFixed(1)}s</span>
            </div>
          </div>

          {/* Camera View Switcher & Settings */}
          <div className="pointer-events-auto flex items-center gap-2">
            <div className="cyber-panel p-1 rounded-xl border border-cyber-border flex items-center gap-1 text-xs font-mono shadow-xl">
              <button
                onClick={() => setCameraView('chase')}
                className={`px-2.5 py-1 rounded-lg ${cameraView === 'chase' ? 'bg-nvidia-green text-black font-bold' : 'text-gray-300 hover:text-white'}`}
              >
                Đuôi Xe
              </button>
              <button
                onClick={() => setCameraView('fpv')}
                className={`px-2.5 py-1 rounded-lg ${cameraView === 'fpv' ? 'bg-nvidia-green text-black font-bold' : 'text-gray-300 hover:text-white'}`}
              >
                Góc Nhìn FPV
              </button>
              <button
                onClick={() => setCameraView('overhead')}
                className={`px-2.5 py-1 rounded-lg ${cameraView === 'overhead' ? 'bg-nvidia-green text-black font-bold' : 'text-gray-300 hover:text-white'}`}
              >
                Toàn Cảnh
              </button>
            </div>

            <button
              onClick={() => setIsLightMode(!isLightMode)}
              className="cyber-panel px-3 py-1.5 rounded-xl border border-cyber-border text-xs font-mono flex items-center gap-1.5 shadow-xl hover:text-nvidia-green transition-colors"
            >
              {isLightMode ? <Moon className="w-3.5 h-3.5 text-amber-500" /> : <Sun className="w-3.5 h-3.5 text-yellow-400" />}
              <span>{isLightMode ? 'Nền Tối' : 'Nền Sáng'}</span>
            </button>

            <button
              onClick={restartMission}
              className="cyber-panel px-3 py-1.5 rounded-xl border border-cyber-border text-xs font-mono flex items-center gap-1.5 text-cyber-accent hover:text-white shadow-xl transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Chơi Lại</span>
            </button>
          </div>
        </div>

        {/* FPV Crosshairs Overlay when in FPV mode */}
        {cameraView === 'fpv' && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <Crosshair className="w-12 h-12 text-nvidia-green/40 animate-pulse" />
            <div className="absolute top-16 bg-black/60 px-3 py-1 rounded-full text-xs font-mono text-emerald-400 border border-emerald-500/30">
              BUỒNG LÁI CAMERA FPV (224x224 SONY IMX219)
            </div>
          </div>
        )}

        {/* Victory Celebration Modal */}
        {isMissionCompleted && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-30 flex items-center justify-center p-4 animate-fade-in">
            <div className="max-w-md w-full p-6 rounded-2xl bg-[#0E1520] border-2 border-nvidia-green shadow-2xl text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-nvidia-green/20 border-2 border-nvidia-green flex items-center justify-center mx-auto text-nvidia-green">
                <Trophy className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-extrabold text-white font-display">CHÚC MỪNG BẠN ĐÃ ĐẾN ĐÍCH B!</h2>
              <p className="text-xs text-gray-300 font-mono">
                Bạn đã khéo léo lái xe JetBot vượt qua các thùng hàng và chướng ngại vật từ Điểm A về Đích B an toàn!
              </p>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#141e2b] border border-cyber-border text-xs font-mono">
                <div>
                  <span className="text-gray-400">Thời gian hoàn thành:</span>
                  <div className="text-base font-bold text-nvidia-green mt-0.5">{elapsedTime.toFixed(1)} giây</div>
                </div>
                <div>
                  <span className="text-gray-400">Số lần va chạm:</span>
                  <div className="text-base font-bold text-yellow-400 mt-0.5">{collisionCount} lần</div>
                </div>
              </div>

              <button
                onClick={restartMission}
                className="w-full py-3 rounded-xl bg-nvidia-green text-black font-bold text-xs hover:bg-[#86d600] transition-colors shadow-lg"
              >
                Chơi Lại Nhiệm Vụ Mới →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar: Radar Mini-Map & Virtual Gamepad */}
      <div className="w-full md:w-80 lg:w-96 border-t md:border-t-0 md:border-l border-cyber-border bg-[#0C121A] flex flex-col p-4 gap-4 z-20 select-none">
        {/* Radar Mini-Map 2D Overview */}
        <div className="cyber-panel p-3 rounded-xl border border-cyber-border space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-gray-300 pb-1 border-b border-cyber-border">
            <span className="font-bold text-nvidia-green flex items-center gap-1.5">
              <Compass className="w-4 h-4" />
              BẢN ĐỒ RADAR (MINI-MAP)
            </span>
            <span className="text-[10px] text-gray-400">Tỉ lệ 8m x 8m</span>
          </div>

          <div className="relative aspect-square w-full rounded-lg bg-[#070c12] border border-cyber-border overflow-hidden">
            <svg className="w-full h-full" viewBox="-4 -4 8 8">
              {/* Radar concentric rings */}
              <circle cx="0" cy="0" r="1.5" fill="none" stroke="#1f293d" strokeWidth="0.05" />
              <circle cx="0" cy="0" r="3.0" fill="none" stroke="#1f293d" strokeWidth="0.05" />
              <line x1="-4" y1="0" x2="4" y2="0" stroke="#1f293d" strokeWidth="0.04" />
              <line x1="0" y1="-4" x2="0" y2="4" stroke="#1f293d" strokeWidth="0.04" />

              {/* Start Point A */}
              <circle cx={startPoint.x} cy={startPoint.z} r="0.5" fill="#10b981" opacity="0.3" />
              <circle cx={startPoint.x} cy={startPoint.z} r="0.22" fill="#10b981" />
              <text x={startPoint.x} y={startPoint.z + 0.12} fill="#fff" fontSize="0.4" textAnchor="middle" fontWeight="bold">A</text>

              {/* Goal Point B */}
              <circle cx={goalPoint.x} cy={goalPoint.z} r="0.5" fill="#f59e0b" opacity="0.3" />
              <circle cx={goalPoint.x} cy={goalPoint.z} r="0.22" fill="#f59e0b" />
              <text x={goalPoint.x} y={goalPoint.z + 0.12} fill="#fff" fontSize="0.4" textAnchor="middle" fontWeight="bold">B</text>

              {/* Obstacles dots */}
              {obstaclesRef.current.map((obs, i) => (
                <circle key={i} cx={obs.x} cy={obs.z} r={obs.radius} fill="#d97706" opacity="0.8" />
              ))}

              {/* Dashed line to goal */}
              <line
                x1={livePose.x}
                y1={livePose.z}
                x2={goalPoint.x}
                y2={goalPoint.z}
                stroke="#76b900"
                strokeWidth="0.05"
                strokeDasharray="0.12 0.12"
              />

              {/* Live JetBot Position & Orientation */}
              <g transform={`translate(${livePose.x}, ${livePose.z}) rotate(${(-livePose.theta * 180) / Math.PI})`}>
                <polygon points="0,-0.35 0.25,0.25 -0.25,0.25" fill="#00e5ff" />
                <circle cx="0" cy="0" r="0.16" fill="#ffffff" />
              </g>
            </svg>
          </div>
        </div>

        {/* Speed Chips */}
        <div className="cyber-panel p-3 rounded-xl border border-cyber-border space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-gray-300">
            <span className="font-bold flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              Tốc Độ Lái:
            </span>
            <span className="text-nvidia-green font-bold">{speedMultiplier.toFixed(1)}x</span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {[1.0, 1.5, 2.0, 2.5].map((spd) => (
              <button
                key={spd}
                onClick={() => {
                  soundFx.playClick();
                  setSpeedMultiplier(spd);
                }}
                className={`py-1 rounded text-xs font-mono font-bold transition-all ${
                  speedMultiplier === spd
                    ? 'bg-nvidia-green text-black shadow-md'
                    : 'bg-cyber-card text-gray-300 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Big Responsive Virtual D-Pad Gamepad */}
        <div className="cyber-panel p-3.5 rounded-xl border border-cyber-border flex flex-col items-center justify-center gap-2">
          <div className="text-[11px] font-mono text-gray-400 mb-1 flex items-center gap-1">
            <Gamepad2 className="w-3.5 h-3.5 text-nvidia-green" />
            <span>Cần Lái Gamepad Ảo</span>
          </div>

          {/* Forward */}
          <button
            onMouseDown={() => startDrive(0.55, 0.55)}
            onMouseUp={stopDrive}
            onTouchStart={() => startDrive(0.55, 0.55)}
            onTouchEnd={stopDrive}
            className={`w-16 h-12 rounded-xl border flex items-center justify-center font-bold text-xs active:scale-95 transition-all ${
              activeKeys['w'] || activeKeys['arrowup']
                ? 'bg-nvidia-green text-black border-nvidia-green shadow-md'
                : 'bg-cyber-card hover:bg-nvidia-green hover:text-black border-cyber-border'
            }`}
          >
            <ArrowUp className="w-5 h-5" />
          </button>

          {/* Left, Brake, Right */}
          <div className="flex gap-2">
            <button
              onMouseDown={() => startDrive(-0.5, 0.5)}
              onMouseUp={stopDrive}
              onTouchStart={() => startDrive(-0.5, 0.5)}
              onTouchEnd={stopDrive}
              className={`w-16 h-12 rounded-xl border flex items-center justify-center font-bold text-xs active:scale-95 transition-all ${
                activeKeys['a'] || activeKeys['arrowleft']
                  ? 'bg-nvidia-green text-black border-nvidia-green shadow-md'
                  : 'bg-cyber-card hover:bg-nvidia-green hover:text-black border-cyber-border'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <button
              onClick={stopDrive}
              className="w-12 h-12 rounded-xl bg-red-700 hover:bg-red-600 text-white flex items-center justify-center font-bold text-xs active:scale-95 transition-all shadow-md"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>

            <button
              onMouseDown={() => startDrive(0.5, -0.5)}
              onMouseUp={stopDrive}
              onTouchStart={() => startDrive(0.5, -0.5)}
              onTouchEnd={stopDrive}
              className={`w-16 h-12 rounded-xl border flex items-center justify-center font-bold text-xs active:scale-95 transition-all ${
                activeKeys['d'] || activeKeys['arrowright']
                  ? 'bg-nvidia-green text-black border-nvidia-green shadow-md'
                  : 'bg-cyber-card hover:bg-nvidia-green hover:text-black border-cyber-border'
              }`}
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Backward */}
          <button
            onMouseDown={() => startDrive(-0.55, -0.55)}
            onMouseUp={stopDrive}
            onTouchStart={() => startDrive(-0.55, -0.55)}
            onTouchEnd={stopDrive}
            className={`w-16 h-12 rounded-xl border flex items-center justify-center font-bold text-xs active:scale-95 transition-all ${
              activeKeys['s'] || activeKeys['arrowdown']
                ? 'bg-nvidia-green text-black border-nvidia-green shadow-md'
                : 'bg-cyber-card hover:bg-nvidia-green hover:text-black border-cyber-border'
            }`}
          >
            <ArrowDown className="w-5 h-5" />
          </button>

          <div className="text-[10px] font-mono text-gray-500 mt-1">
            Nhấn phím <strong className="text-nvidia-green">W / A / S / D</strong> trên bàn phím để lái mượt mà
          </div>
        </div>
      </div>
    </div>
  );
};
