import React, { useEffect, useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createJetBot3DModel, updateExplodeProgress, JetBotMeshParts } from "../../simulation/JetBot3DModel";
import { VisualLabEnvironment, CalloutAnchor } from "../../simulation/VisualLabEnvironment";
import { JETBOT_COMPONENTS } from "../../utils/hardwareComponents";
import { JetBotComponent } from "../../types/jetbot";
import { ComponentDetailsModal } from "./ComponentDetailsModal";
import { PinoutDiagramModal } from "./PinoutDiagramModal";
import { soundFx } from "../../utils/audio";
import {
  Layers,
  RotateCw,
  ZoomIn,
  Network,
  Sun,
  Moon,
  Info,
  Eye,
  Sliders,
  HelpCircle,
  Zap,
  Activity,
  Compass,
  Radio,
  Sparkles,
  ChevronRight,
  Maximize2,
  Gauge,
  Flame,
  Check,
} from "lucide-react";

export const HardwareLabView: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [explodeProgress, setExplodeProgress] = useState<number>(0);
  const [selectedComponent, setSelectedComponent] = useState<JetBotComponent | null>(null);
  const [hoveredComponentId, setHoveredComponentId] = useState<string | null>(null);
  const [isPinoutOpen, setIsPinoutOpen] = useState<boolean>(false);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [isLightMode, setIsLightMode] = useState<boolean>(true);

  // Visual Field Toggles (Matching the visual physics style from user reference image)
  const [showVisionField, setShowVisionField] = useState<boolean>(true);
  const [showSignalFlow, setShowSignalFlow] = useState<boolean>(true);
  const [showDynamicsVectors, setShowDynamicsVectors] = useState<boolean>(true);
  const [showPullRings, setShowPullRings] = useState<boolean>(true);
  const [showCallouts, setShowCallouts] = useState<boolean>(true);

  // Motor & Galvanometer live test speed (-1.0 to +1.0)
  const [motorTestSpeed, setMotorTestSpeed] = useState<number>(0.45);
  const [activeTab, setActiveTab] = useState<"visuals" | "motor" | "explode">("visuals");
  const [calloutAnchors, setCalloutAnchors] = useState<CalloutAnchor[]>([]);
  const [activeCalloutId, setActiveCalloutId] = useState<string | null>(null);

  const partsRef = useRef<JetBotMeshParts | null>(null);
  const visualLabRef = useRef<VisualLabEnvironment | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isLightMode ? 0xf8fafc : 0x080c12);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.05, 50);
    camera.position.set(0.42, 0.32, 0.52);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isLightMode ? 1.25 : 1.15;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0.05, 0);
    controls.maxDistance = 2.5;
    controls.minDistance = 0.12;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 0.8;
    controlsRef.current = controls;

    // Studio Lighting
    const ambLight = new THREE.AmbientLight(0xffffff, isLightMode ? 1.6 : 0.9);
    scene.add(ambLight);

    const mainSun = new THREE.DirectionalLight(0xffffff, isLightMode ? 1.8 : 1.4);
    mainSun.position.set(4, 8, 5);
    mainSun.castShadow = true;
    mainSun.shadow.mapSize.width = 2048;
    mainSun.shadow.mapSize.height = 2048;
    mainSun.shadow.camera.near = 0.5;
    mainSun.shadow.camera.far = 20;
    mainSun.shadow.bias = -0.0005;
    scene.add(mainSun);

    const fillCyan = new THREE.PointLight(0x06b6d4, isLightMode ? 0.6 : 1.6, 6);
    fillCyan.position.set(-3, 2, -2);
    scene.add(fillCyan);

    const fillGreen = new THREE.PointLight(0x76b900, isLightMode ? 0.5 : 1.4, 5);
    fillGreen.position.set(3, 1.5, -2);
    scene.add(fillGreen);

    // JetBot Detailed 3D Model with Casters
    const parts = createJetBot3DModel();
    partsRef.current = parts;
    scene.add(parts.root);

    // High-Tech Laboratory Workbench Environment with Ruler, LEDs, Galvanometer & Fields
    const visualLab = new VisualLabEnvironment(scene, isLightMode);
    visualLab.setParts(parts);
    visualLabRef.current = visualLab;

    // Raycaster for 3D interactions
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(parts.root.children, true);
      if (intersects.length > 0) {
        let foundId: string | null = null;
        for (const hit of intersects) {
          if (hit.object.userData && hit.object.userData.componentId) {
            foundId = hit.object.userData.componentId;
            break;
          }
        }
        setHoveredComponentId(foundId);
      } else {
        setHoveredComponentId(null);
      }
    };

    const handleClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(parts.root.children, true);
      if (intersects.length > 0) {
        for (const hit of intersects) {
          if (hit.object.name && hit.object.name.startsWith("PullRing_")) {
            soundFx.playTargetLock();
            setExplodeProgress((prev) => (prev > 0.4 ? 0 : 0.85));
            return;
          }
          if (hit.object.userData && hit.object.userData.componentId) {
            const comp = JETBOT_COMPONENTS.find((c) => c.id === hit.object.userData.componentId);
            if (comp) {
              soundFx.playClick();
              setSelectedComponent(comp);
              break;
            }
          }
        }
      }
    };

    renderer.domElement.addEventListener("mousemove", handlePointerMove);
    renderer.domElement.addEventListener("click", handleClick);

    // Animation Loop
    let animId: number;
    let lastTime = performance.now();
    let frameCount = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      frameCount++;

      controls.update();

      // Spin Wheels according to test motor speed
      if (partsRef.current && motorTestSpeed !== 0) {
        const wheelSpin = motorTestSpeed * dt * 16;
        partsRef.current.leftWheel.rotation.x += wheelSpin;
        partsRef.current.rightWheel.rotation.x += wheelSpin;
      }

      // Update Visual Lab Animations (Vision cone particles, I2C pulses, LEDs, meter needle)
      if (visualLabRef.current) {
        visualLabRef.current.update(dt, motorTestSpeed, {
          showVisionField,
          showSignalFlow,
          showDynamicsVectors,
          showPullRings,
          showCallouts,
          isLightMode,
        });

        // Compute 2D Screen-space coordinates for 3D Callout Badges
        if (showCallouts && frameCount % 2 === 0) {
          const w = mountRef.current?.clientWidth || width;
          const h = mountRef.current?.clientHeight || height;
          const anchors = visualLabRef.current.getCalloutAnchors(camera, w, h);
          setCalloutAnchors(anchors);
        }
      }

      renderer.render(scene, camera);
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
      renderer.domElement.removeEventListener("mousemove", handlePointerMove);
      renderer.domElement.removeEventListener("click", handleClick);
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isLightMode]);

  useEffect(() => {
    if (controlsRef.current) controlsRef.current.autoRotate = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    if (partsRef.current) updateExplodeProgress(partsRef.current, explodeProgress);
  }, [explodeProgress]);

  const toggleExplode = () => {
    soundFx.playClick();
    setExplodeProgress((prev) => (prev > 0.4 ? 0 : 0.9));
  };

  const resetCamera = () => {
    soundFx.playClick();
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(0.42, 0.32, 0.52);
      controlsRef.current.target.set(0, 0.05, 0);
    }
  };

  const handleFocusComponent = (comp: JetBotComponent) => {
    soundFx.playClick();
    setSelectedComponent(comp);
  };

  return (
    <div className={"relative w-full h-[calc(100vh-3.5rem)] flex flex-col md:flex-row overflow-hidden " + (isLightMode ? "bg-slate-50 text-slate-800" : "bg-[#06090e] text-gray-100") + " select-none"}>
      {/* Main 3D Viewport */}
      <div className="relative flex-1 h-full min-h-[420px] overflow-hidden" ref={mountRef}>
        {/* Top Floating Control Dock */}
        <div className="absolute top-3 left-3 right-3 sm:right-auto z-20 flex flex-wrap items-center gap-2 pointer-events-auto">
          {/* Explode Mode Button */}
          <button
            onClick={toggleExplode}
            className={"flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md border transition-all shadow-md " + (explodeProgress > 0.1 ? "bg-nvidia-green text-black border-nvidia-green font-bold" : "bg-cyber-surface/90 text-gray-200 border-cyber-border hover:border-gray-500")}
          >
            <Layers className="w-4 h-4" />
            <span>{explodeProgress > 0.1 ? "Đang Bóc Tách 3D" : "Bóc Tách 3D (Exploded View)"}</span>
          </button>

          {/* Auto Rotate */}
          <button
            onClick={() => {
              soundFx.playClick();
              setAutoRotate(!autoRotate);
            }}
            className={"flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs border backdrop-blur-md transition-colors " + (autoRotate ? "bg-cyber-accent/20 text-cyber-accent border-cyber-accent/40 font-bold" : "bg-cyber-surface/90 text-gray-400 border-cyber-border")}
          >
            <RotateCw className={"w-3.5 h-3.5 " + (autoRotate ? "animate-spin" : "")} />
            <span>Tự Xoay</span>
          </button>

          {/* Center View */}
          <button
            onClick={resetCamera}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs bg-cyber-surface/90 text-gray-300 border border-cyber-border hover:text-white backdrop-blur-md transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
            <span>Căn Giữa</span>
          </button>

          {/* Light / Dark Mode */}
          <button
            onClick={() => {
              soundFx.playClick();
              setIsLightMode(!isLightMode);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-cyber-surface/90 text-gray-300 border border-cyber-border hover:text-nvidia-green backdrop-blur-md transition-colors"
          >
            {isLightMode ? <Moon className="w-3.5 h-3.5 text-amber-500" /> : <Sun className="w-3.5 h-3.5 text-yellow-400" />}
            <span>{isLightMode ? "Nền Tối" : "Nền Sáng"}</span>
          </button>

          {/* Pinout Diagram */}
          <button
            onClick={() => {
              soundFx.playClick();
              setIsPinoutOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#16271a] text-nvidia-green border border-nvidia-green/40 hover:bg-nvidia-green hover:text-black backdrop-blur-md transition-all shadow"
          >
            <Network className="w-4 h-4" />
            <span>Sơ Đồ Đấu Dây Điện</span>
          </button>
        </div>

        {/* 3D FLOATING CALLOUT BADGES IN WORLD SPACE (Như trong ảnh mẫu) */}
        {showCallouts && (
          <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
            {calloutAnchors.map((anchor) => {
              if (!anchor.screenPos.visible) return null;
              const isHovered = hoveredComponentId === anchor.componentId || activeCalloutId === anchor.id;
              const comp = JETBOT_COMPONENTS.find((c) => c.id === anchor.componentId);

              return (
                <div
                  key={anchor.id}
                  className="absolute pointer-events-auto transition-transform duration-100"
                  style={{
                    left: `${anchor.screenPos.x}px`,
                    top: `${anchor.screenPos.y}px`,
                  }}
                  onMouseEnter={() => setActiveCalloutId(anchor.id)}
                  onMouseLeave={() => setActiveCalloutId(null)}
                >
                  {/* Glowing 3D Anchor Ring & Dot at exact component position */}
                  <div className="absolute -left-2 -top-2 w-4 h-4 flex items-center justify-center">
                    <span
                      className="absolute w-4 h-4 rounded-full animate-ping opacity-60"
                      style={{ backgroundColor: anchor.color }}
                    />
                    <span
                      className="relative w-2.5 h-2.5 rounded-full border border-white shadow-lg"
                      style={{ backgroundColor: anchor.color }}
                    />
                  </div>

                  {/* Vertical Neon Leader Line */}
                  <div
                    className="absolute left-0 bottom-2 w-[1.5px] h-9 -translate-x-1/2 shadow-lg"
                    style={{
                      background: `linear-gradient(to top, ${anchor.color}, transparent)`,
                    }}
                  />

                  {/* Floating Callout Card (Styled exactly like reference image badges) */}
                  <div
                    onClick={() => comp && handleFocusComponent(comp)}
                    className={"absolute -top-16 left-3 -translate-y-full cyber-panel px-3 py-2 rounded-xl border flex flex-col gap-0.5 shadow-2xl backdrop-blur-md cursor-pointer transition-all duration-200 select-none " + (isHovered ? "scale-105 border-white bg-black/95 z-30 ring-2 ring-nvidia-green shadow-nvidia-green/40" : "bg-[#090e17]/90 border-cyber-border hover:border-gray-400 opacity-90")}
                    style={{ minWidth: "220px", maxWidth: "280px" }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold font-mono tracking-wider uppercase text-gray-300">
                        <span className="text-nvidia-green">◀</span>
                        <span>{anchor.badge}</span>
                        <span className="text-nvidia-green">▶</span>
                      </div>
                      <span
                        className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold text-black"
                        style={{ backgroundColor: anchor.color }}
                      >
                        {anchor.category}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-white font-display leading-tight mt-0.5">
                      {anchor.title}
                    </div>

                    <div className="text-[10px] text-gray-300 leading-snug font-sans mt-0.5 line-clamp-2">
                      {anchor.subTitle}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* BOTTOM FLOATING EXPERIMENT DOCK (Bảng Thí Nghiệm Động Học & AI) */}
        <div className="absolute bottom-3 left-3 right-3 sm:left-6 sm:right-auto z-20 cyber-panel p-2.5 rounded-2xl border border-cyber-border shadow-2xl backdrop-blur-lg flex flex-col gap-2 max-w-xl pointer-events-auto">
          {/* Tab Headers */}
          <div className="flex items-center justify-between gap-1 border-b border-cyber-border/70 pb-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  soundFx.playClick();
                  setActiveTab("visuals");
                }}
                className={"flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all " + (activeTab === "visuals" ? "bg-nvidia-green text-black font-bold shadow" : "text-gray-300 hover:text-white hover:bg-cyber-surface")}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Lớp Trực Quan 3D</span>
              </button>

              <button
                onClick={() => {
                  soundFx.playClick();
                  setActiveTab("motor");
                }}
                className={"flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all " + (activeTab === "motor" ? "bg-nvidia-green text-black font-bold shadow" : "text-gray-300 hover:text-white hover:bg-cyber-surface")}
              >
                <Gauge className="w-3.5 h-3.5" />
                <span>Thử Nghiệm Động Cơ & Điện Kế</span>
              </button>

              <button
                onClick={() => {
                  soundFx.playClick();
                  setActiveTab("explode");
                }}
                className={"flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all " + (activeTab === "explode" ? "bg-nvidia-green text-black font-bold shadow" : "text-gray-300 hover:text-white hover:bg-cyber-surface")}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Bóc Tách 3D ({Math.round(explodeProgress * 100)}%)</span>
              </button>
            </div>
          </div>

          {/* TAB 1: VISUAL FIELD TOGGLES */}
          {activeTab === "visuals" && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
              <button
                onClick={() => {
                  soundFx.playClick();
                  setShowVisionField(!showVisionField);
                }}
                className={"flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-all " + (showVisionField ? "bg-emerald-950/80 border-emerald-500 text-emerald-300 shadow" : "bg-black/40 border-cyber-border text-gray-400")}
              >
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tia Thị Giác AI (Camera FOV)</span>
              </button>

              <button
                onClick={() => {
                  soundFx.playClick();
                  setShowSignalFlow(!showSignalFlow);
                }}
                className={"flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-all " + (showSignalFlow ? "bg-sky-950/80 border-sky-500 text-sky-300 shadow" : "bg-black/40 border-cyber-border text-gray-400")}
              >
                <Zap className="w-3.5 h-3.5 text-sky-400" />
                <span>Dòng Tín Hiệu I2C & Năng Lượng</span>
              </button>

              <button
                onClick={() => {
                  soundFx.playClick();
                  setShowDynamicsVectors(!showDynamicsVectors);
                }}
                className={"flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-all " + (showDynamicsVectors ? "bg-amber-950/80 border-amber-500 text-amber-300 shadow" : "bg-black/40 border-cyber-border text-gray-400")}
              >
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                <span>Véc-tơ Lực & Mô-men Bánh Xe</span>
              </button>

              <button
                onClick={() => {
                  soundFx.playClick();
                  setShowCallouts(!showCallouts);
                }}
                className={"flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-all " + (showCallouts ? "bg-purple-950/80 border-purple-500 text-purple-300 shadow" : "bg-black/40 border-cyber-border text-gray-400")}
              >
                <Radio className="w-3.5 h-3.5 text-purple-400" />
                <span>Thẻ Chú Thích 3D HUD</span>
              </button>
            </div>
          )}

          {/* TAB 2: MOTOR & GALVANOMETER EXPERIMENT */}
          {activeTab === "motor" && (
            <div className="flex flex-col gap-2 pt-1">
              <div className="flex items-center justify-between text-xs font-mono text-gray-300">
                <span className="flex items-center gap-1.5 text-cyber-accent">
                  <Activity className="w-3.5 h-3.5 text-nvidia-green" />
                  <span>Tốc Độ Băm Xung PWM:</span>
                  <strong className="text-white">{(motorTestSpeed * 100).toFixed(0)}%</strong>
                </span>

                <div className="flex items-center gap-3 text-[11px]">
                  <span className="text-amber-400">
                    Điện Áp: <strong>{(motorTestSpeed * 7.4).toFixed(1)}V</strong>
                  </span>
                  <span className="text-emerald-400">
                    Vận Tốc: <strong>{(Math.abs(motorTestSpeed) * 0.65).toFixed(2)} m/s</strong>
                  </span>
                  <span className={motorTestSpeed > 0 ? "text-emerald-400 font-bold" : motorTestSpeed < 0 ? "text-red-400 font-bold" : "text-gray-400"}>
                    D2 LED: {motorTestSpeed > 0 ? "Xanh Sáng" : motorTestSpeed < 0 ? "Đỏ Sáng" : "Nghỉ"}
                  </span>
                </div>
              </div>

              {/* Slider */}
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="-1.0"
                  max="1.0"
                  step="0.05"
                  value={motorTestSpeed}
                  onChange={(e) => setMotorTestSpeed(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-nvidia-green"
                />
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 text-xs">
                {[-0.8, -0.4, 0, 0.45, 0.8].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => {
                      soundFx.playClick();
                      setMotorTestSpeed(spd);
                    }}
                    className={"px-2.5 py-0.5 rounded text-[11px] font-mono font-bold transition-all " + (motorTestSpeed === spd ? "bg-nvidia-green text-black shadow" : "bg-black/50 text-gray-400 hover:text-white")}
                  >
                    {spd === 0 ? "Dừng (0%)" : (spd > 0 ? "+" : "") + Math.round(spd * 100) + "%"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: EXPLODE SLIDER */}
          {activeTab === "explode" && (
            <div className="flex flex-col gap-2 pt-1">
              <div className="flex justify-between text-xs font-mono text-gray-300">
                <span>Lắp Ráp Hoàn Chỉnh (0%)</span>
                <span className="text-nvidia-green font-bold">Tháo Rời Từng Linh Kiện ({Math.round(explodeProgress * 100)}%)</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={explodeProgress}
                onChange={(e) => setExplodeProgress(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-nvidia-green"
              />
              <div className="flex gap-1.5 text-xs">
                {[0, 0.5, 1.0].map((val) => (
                  <button
                    key={val}
                    onClick={() => {
                      soundFx.playClick();
                      setExplodeProgress(val);
                    }}
                    className={"px-3 py-1 rounded text-[11px] font-mono font-bold " + (explodeProgress === val ? "bg-nvidia-green text-black" : "bg-black/50 text-gray-300 hover:text-white")}
                  >
                    {val === 0 ? "Thu Gọn (0%)" : val === 0.5 ? "Bóc Tách Vừa (50%)" : "Bóc Tách Toàn Bộ (100%)"}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Hover Tooltip at Top Left */}
        {hoveredComponentId && (
          <div className="absolute top-16 left-4 z-20 pointer-events-none cyber-panel px-3.5 py-2 rounded-xl border border-nvidia-green text-xs font-mono text-nvidia-green flex items-center gap-2 shadow-2xl backdrop-blur-md animate-fade-in">
            <Eye className="w-4 h-4 text-nvidia-green" />
            <span>
              Bấm để xem chi tiết:{" "}
              <strong className="text-white text-sm font-display">
                {JETBOT_COMPONENTS.find((c) => c.id === hoveredComponentId)?.nameVi}
              </strong>
            </span>
          </div>
        )}
      </div>

      {/* Right Sidebar: Component Catalog */}
      <div className="w-full md:w-80 lg:w-96 h-72 md:h-full border-t md:border-t-0 md:border-l border-cyber-border bg-[#090d14] flex flex-col z-20">
        <div className="p-3.5 border-b border-cyber-border bg-[#0e141f] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white font-mono">
            <Layers className="w-4 h-4 text-nvidia-green" />
            <span>Cấu Tạo Chi Tiết JetBot</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-nvidia-green/20 text-nvidia-green font-mono">
            {JETBOT_COMPONENTS.length} Linh Kiện
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
          {JETBOT_COMPONENTS.map((comp) => {
            const isHovered = hoveredComponentId === comp.id;
            return (
              <div
                key={comp.id}
                onClick={() => handleFocusComponent(comp)}
                className={"p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 " + (isHovered ? "border-nvidia-green bg-[#122216] shadow-lg" : "border-cyber-border/70 bg-cyber-surface/50 hover:border-gray-500 hover:bg-cyber-surface")}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white font-display">{comp.nameVi}</span>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-cyber-card text-cyber-accent border border-cyber-border font-mono">
                    {comp.category}
                  </span>
                </div>
                <div className="text-[11px] text-gray-400 font-mono truncate">{comp.name}</div>
                <p className="text-[11px] text-gray-300 line-clamp-2 leading-relaxed mt-0.5">{comp.summaryVi}</p>
                <div className="mt-1 flex items-center justify-between text-[10px] text-nvidia-green font-mono">
                  <span>Xem thông số & chân nối →</span>
                  <Info className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ComponentDetailsModal component={selectedComponent} onClose={() => setSelectedComponent(null)} />
      <PinoutDiagramModal isOpen={isPinoutOpen} onClose={() => setIsPinoutOpen(false)} />
    </div>
  );
};
