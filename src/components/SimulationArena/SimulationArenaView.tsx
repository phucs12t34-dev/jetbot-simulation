import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createJetBot3DModel, JetBotMeshParts } from "../../simulation/JetBot3DModel";
import { ArenaEnvironment } from "../../simulation/ArenaEnvironment";
import { PhysicsKinematics } from "../../simulation/PhysicsKinematics";
import { RobotState, ArenaId } from "../../types/jetbot";
import { FPVCameraFeed } from "./FPVCameraFeed";
import { soundFx } from "../../utils/audio";
import {
  Play,
  Square,
  RotateCcw,
  Sun,
  Moon,
  Zap,
  Car,
  ShieldAlert,
  Gauge,
  Compass,
  Activity,
} from "lucide-react";

interface SimulationArenaViewProps {
  robotState: RobotState;
}

export const SimulationArenaView: React.FC<SimulationArenaViewProps> = ({ robotState }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [currentArena, setCurrentArena] = useState<ArenaId>("road");
  const [cameraMode, setCameraMode] = useState<"chase" | "orbit" | "top">("chase");
  const [isLightMode, setIsLightMode] = useState<boolean>(true);
  const [speedMult, setSpeedMult] = useState<number>(1.5);
  const [cteCm, setCteCm] = useState<number>(0);

  const cameraModeRef = useRef<"chase" | "orbit" | "top">("chase");
  cameraModeRef.current = cameraMode;

  const physicsRef = useRef<PhysicsKinematics>(new PhysicsKinematics());
  const arenaEnvRef = useRef<ArenaEnvironment | null>(null);
  const robotPartsRef = useRef<JetBotMeshParts | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Sync speed multiplier into robotState
  useEffect(() => {
    robotState.telemetry.speedMultiplier = speedMult;
  }, [speedMult, robotState]);

  // Main 3D Canvas initialization (runs only once on mount)
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isLightMode ? 0xf1f5f9 : 0x0a0f16);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 3.5, 4.5);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0, 0);
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    controlsRef.current = controls;

    // Build Arena Environment
    const arenaEnv = new ArenaEnvironment(scene, physicsRef.current, isLightMode);
    arenaEnvRef.current = arenaEnv;

    // Add Detailed JetBot Model with Wheels and Casters
    const robotParts = createJetBot3DModel();
    robotPartsRef.current = robotParts;
    scene.add(robotParts.root);

    // Reset initial pose
    physicsRef.current.resetRobot(robotState, currentArena);

    // Keyboard Drive Listener
    const activeKeys: { [key: string]: boolean } = {};
    const handleKeyDown = (e: KeyboardEvent) => {
      activeKeys[e.key.toLowerCase()] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      activeKeys[e.key.toLowerCase()] = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Animation Loop
    let animId: number;
    let lastTime = performance.now();
    let frameCount = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;
      frameCount++;

      // Process Keyboard controls if in manual mode
      if (robotState.autonomousMode === "none") {
        let forward = 0;
        let turn = 0;
        if (activeKeys["w"] || activeKeys["arrowup"]) forward += 0.55;
        if (activeKeys["s"] || activeKeys["arrowdown"]) forward -= 0.55;
        if (activeKeys["a"] || activeKeys["arrowleft"]) turn += 0.5;
        if (activeKeys["d"] || activeKeys["arrowright"]) turn -= 0.5;

        // Smooth stop when no keys pressed
        robotState.leftMotor.targetSpeed = Math.max(-1, Math.min(1, forward - turn));
        robotState.rightMotor.targetSpeed = Math.max(-1, Math.min(1, forward + turn));
      }

      // Physics Kinematics Integration
      physicsRef.current.update(robotState, dt);
      arenaEnv.update(dt);

      soundFx.updateMotorSound(robotState.leftMotor.currentSpeed, robotState.rightMotor.currentSpeed);

      // Update 3D Robot Pose
      robotParts.root.position.x = robotState.pose.x;
      robotParts.root.position.z = robotState.pose.z;
      robotParts.root.position.y = 0;
      robotParts.root.rotation.y = robotState.pose.theta;

      // Wheel Meshes Spin
      robotParts.leftWheel.rotation.x = physicsRef.current.leftWheelRotation;
      robotParts.rightWheel.rotation.x = physicsRef.current.rightWheelRotation;

      // Camera Following Modes
      const activeCamMode = cameraModeRef.current;
      if (activeCamMode === "chase") {
        const offsetDist = 0.95;
        const offsetHeight = 0.48;
        const behindX = robotState.pose.x + Math.sin(robotState.pose.theta) * offsetDist;
        const behindZ = robotState.pose.z + Math.cos(robotState.pose.theta) * offsetDist;

        camera.position.lerp(new THREE.Vector3(behindX, offsetHeight, behindZ), 0.12);
        controls.target.lerp(new THREE.Vector3(robotState.pose.x, 0.08, robotState.pose.z), 0.12);
      } else if (activeCamMode === "top") {
        camera.position.lerp(new THREE.Vector3(0, 8.5, 0.01), 0.1);
        controls.target.set(0, 0, 0);
      }

      controls.update();
      renderer.render(scene, camera);

      // Update HUD Cross-Track Error every 6 frames (~10Hz)
      if (frameCount % 6 === 0 && physicsRef.current.trackPath.length > 0) {
        let minD = Infinity;
        for (const pt of physicsRef.current.trackPath) {
          const d = Math.hypot(pt.x - robotState.pose.x, pt.z - robotState.pose.z);
          if (d < minD) minD = d;
        }
        setCteCm(Math.round(minD * 1000) / 10);
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
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update light/dark theme dynamically without recreating scene
  const handleToggleTheme = () => {
    soundFx.playClick();
    const newTheme = !isLightMode;
    setIsLightMode(newTheme);
    if (arenaEnvRef.current) {
      arenaEnvRef.current.setTheme(newTheme);
    }
  };

  // Handle Track change
  const handleChangeArena = (arenaId: ArenaId) => {
    soundFx.playClick();
    setCurrentArena(arenaId);
    if (arenaEnvRef.current) {
      arenaEnvRef.current.buildArena(arenaId);
    }
    physicsRef.current.resetRobot(robotState, arenaId);
  };

  const toggleAutonomous = () => {
    soundFx.playClick();
    if (robotState.autonomousMode !== "none") {
      robotState.autonomousMode = "none";
      robotState.leftMotor.targetSpeed = 0;
      robotState.rightMotor.targetSpeed = 0;
    } else {
      robotState.autonomousMode = currentArena === "road" ? "road" : "collision";
    }
  };

  const resetRobot = () => {
    soundFx.playClick();
    physicsRef.current.resetRobot(robotState, currentArena);
  };

  const isAutoActive = robotState.autonomousMode !== "none";

  return (
    <div className={"relative w-full h-[calc(100vh-3.5rem)] flex flex-col overflow-hidden " + (isLightMode ? "bg-slate-100 text-slate-800" : "bg-[#0A0E13] text-gray-100") + " select-none"}>
      {/* 3D Canvas */}
      <div className="flex-1 w-full h-full" ref={mountRef} />

      {/* Top Floating Control Dock */}
      <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 z-10 pointer-events-none">
        {/* Left: Track Switcher & Auto Pilot */}
        <div className="pointer-events-auto cyber-panel p-1.5 rounded-xl border border-cyber-border flex items-center gap-2 shadow-xl backdrop-blur-md">
          {/* 1. Road Following Track */}
          <button
            onClick={() => handleChangeArena("road")}
            className={"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all " + (currentArena === "road" ? "bg-nvidia-green text-black font-bold shadow-md" : "text-gray-300 hover:text-white hover:bg-cyber-card")}
          >
            <Car className="w-3.5 h-3.5" />
            <span>1. Bám Làn Đường</span>
          </button>

          {/* 2. Track with Obstacles */}
          <button
            onClick={() => handleChangeArena("obstacles")}
            className={"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all " + (currentArena === "obstacles" ? "bg-nvidia-green text-black font-bold shadow-md" : "text-gray-300 hover:text-white hover:bg-cyber-card")}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>2. Đường Có Vật Cản</span>
          </button>

          <div className="h-4 w-[1px] bg-cyber-border" />

          {/* Auto Pilot Toggle Button */}
          <button
            onClick={toggleAutonomous}
            className={"flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md " + (isAutoActive ? "bg-amber-600 text-white hover:bg-amber-500 animate-pulse" : "bg-emerald-600 text-white hover:bg-emerald-500")}
          >
            {isAutoActive ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isAutoActive ? "DỪNG TỰ LÁI AI" : "BẬT TỰ LÁI AI"}</span>
          </button>
        </div>

        {/* Right: Telemetry & Theme Controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Live Telemetry Pill */}
          <div className="cyber-panel px-3 py-1.5 rounded-xl border border-cyber-border flex items-center gap-3 text-xs font-mono shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-1 text-cyber-accent">
              <Gauge className="w-3.5 h-3.5" />
              <span>{(robotState.telemetry.linearVelocity * 100).toFixed(0)} cm/s</span>
            </div>
            <span className="text-gray-600">|</span>
            <div className="flex items-center gap-1 text-nvidia-green" title="Độ lệch tâm so với vạch vàng">
              <Activity className="w-3.5 h-3.5" />
              <span>Lệch: {cteCm.toFixed(1)} cm</span>
            </div>
            <span className="text-gray-600">|</span>
            <div className="flex items-center gap-1 text-amber-400">
              <Compass className="w-3.5 h-3.5" />
              <span>{Math.round(robotState.telemetry.headingDegrees)}°</span>
            </div>
            {currentArena === "obstacles" && (
              <>
                <span className="text-gray-600">|</span>
                <span className={"font-bold " + (robotState.aiProbBlocked >= 0.5 ? "text-red-400 animate-pulse" : "text-emerald-400")}>
                  Vật cản: {(robotState.aiProbBlocked * 100).toFixed(0)}%
                </span>
              </>
            )}
          </div>

          {/* Light / Dark Background Switcher */}
          <button
            onClick={handleToggleTheme}
            title={isLightMode ? "Chuyển sang nền tối Cyber" : "Chuyển sang nền sáng Studio Lab"}
            className="pointer-events-auto cyber-panel px-3 py-1.5 rounded-xl border border-cyber-border text-xs font-mono flex items-center gap-1.5 hover:text-nvidia-green transition-colors shadow-xl"
          >
            {isLightMode ? <Moon className="w-3.5 h-3.5 text-amber-500" /> : <Sun className="w-3.5 h-3.5 text-yellow-400" />}
            <span>{isLightMode ? "Nền Tối" : "Nền Sáng"}</span>
          </button>

          {/* Reset Robot */}
          <button
            onClick={resetRobot}
            title="Đưa xe về vị trí xuất phát"
            className="pointer-events-auto cyber-panel p-2 rounded-xl border border-cyber-border text-cyber-accent hover:text-white transition-colors shadow-xl"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Floating Control Bar (Speed Booster & Camera Angles) */}
      <div className="absolute bottom-4 left-3 right-3 sm:right-auto flex flex-wrap items-center gap-2 z-10 pointer-events-auto">
        {/* Speed Multiplier Booster Chips */}
        <div className="cyber-panel px-3 py-1.5 rounded-xl border border-cyber-border flex items-center gap-2 text-xs font-mono shadow-xl backdrop-blur-md">
          <span className="flex items-center gap-1 text-yellow-400 font-bold">
            <Zap className="w-3.5 h-3.5" /> Tốc độ:
          </span>
          <div className="flex gap-1">
            {[1.0, 1.5, 2.0, 3.0].map((spd) => (
              <button
                key={spd}
                onClick={() => {
                  soundFx.playClick();
                  setSpeedMult(spd);
                }}
                className={"px-2 py-0.5 rounded text-xs font-bold transition-all " + (speedMult === spd ? "bg-nvidia-green text-black shadow" : "bg-cyber-card text-gray-300 hover:text-white")}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Camera Angles */}
        <div className="cyber-panel p-1 rounded-xl border border-cyber-border flex items-center gap-1 text-xs font-mono shadow-xl backdrop-blur-md">
          <button
            onClick={() => setCameraMode("chase")}
            className={"px-2.5 py-1 rounded-lg " + (cameraMode === "chase" ? "bg-cyber-accent text-black font-bold" : "text-gray-300 hover:text-white")}
          >
            Đuôi Xe
          </button>
          <button
            onClick={() => setCameraMode("orbit")}
            className={"px-2.5 py-1 rounded-lg " + (cameraMode === "orbit" ? "bg-cyber-accent text-black font-bold" : "text-gray-300 hover:text-white")}
          >
            Toàn Cảnh 3D
          </button>
          <button
            onClick={() => setCameraMode("top")}
            className={"px-2.5 py-1 rounded-lg " + (cameraMode === "top" ? "bg-cyber-accent text-black font-bold" : "text-gray-300 hover:text-white")}
          >
            Trên Cao
          </button>
        </div>
      </div>

      {/* Floating FPV Camera Feed (Bottom-Right) */}
      <div className="absolute bottom-4 right-3 z-20 hidden md:block">
        <FPVCameraFeed robotState={robotState} />
      </div>

      {/* Keyboard driving hint */}
      <div className="hidden lg:flex absolute bottom-18 left-3 z-10 items-center gap-2 text-[11px] font-mono text-gray-400 bg-black/60 px-2.5 py-1 rounded border border-cyber-border/40 pointer-events-none">
        <span className="text-nvidia-green font-bold">[W / A / S / D]</span>
        <span>hoặc phím mũi tên để lái thử robot bất cứ lúc nào</span>
      </div>
    </div>
  );
};
