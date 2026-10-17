import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createJetBot3DModel, updateExplodeProgress, JetBotMeshParts } from '../../simulation/JetBot3DModel';
import { JETBOT_COMPONENTS } from '../../utils/hardwareComponents';
import { JetBotComponent } from '../../types/jetbot';
import { ComponentDetailsModal } from './ComponentDetailsModal';
import { PinoutDiagramModal } from './PinoutDiagramModal';
import { soundFx } from '../../utils/audio';
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
} from 'lucide-react';

export const HardwareLabView: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [explodeProgress, setExplodeProgress] = useState<number>(0);
  const [selectedComponent, setSelectedComponent] = useState<JetBotComponent | null>(null);
  const [hoveredComponentId, setHoveredComponentId] = useState<string | null>(null);
  const [isPinoutOpen, setIsPinoutOpen] = useState<boolean>(false);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [isLightMode, setIsLightMode] = useState<boolean>(true); // Bright clean studio by default!

  const partsRef = useRef<JetBotMeshParts | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isLightMode ? 0xf8fafc : 0x0a0f16);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.05, 50);
    camera.position.set(0.38, 0.3, 0.48);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isLightMode ? 1.2 : 1.1;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0.06, 0);
    controls.maxDistance = 2.0;
    controls.minDistance = 0.15;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.0;
    controlsRef.current = controls;

    // Lights
    const ambLight = new THREE.AmbientLight(0xffffff, isLightMode ? 1.5 : 0.8);
    scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, isLightMode ? 1.8 : 1.4);
    dirLight.position.set(3, 5, 4);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    const fillLight = new THREE.PointLight(0x76b900, isLightMode ? 0.8 : 1.8, 6);
    fillLight.position.set(-2, 1, -2);
    scene.add(fillLight);

    // Pedestal
    const gridHelper = new THREE.GridHelper(1.2, 24, isLightMode ? 0x94a3b8 : 0x76b900, isLightMode ? 0xe2e8f0 : 0x1f293d);
    gridHelper.position.y = -0.005;
    scene.add(gridHelper);

    // JetBot Model with Front & Rear Casters
    const parts = createJetBot3DModel();
    partsRef.current = parts;
    scene.add(parts.root);

    // Raycaster
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

    renderer.domElement.addEventListener('mousemove', handlePointerMove);
    renderer.domElement.addEventListener('click', handleClick);

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
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
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousemove', handlePointerMove);
      renderer.domElement.removeEventListener('click', handleClick);
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
    setExplodeProgress((prev) => (prev > 0.5 ? 0 : 1));
  };

  const resetCamera = () => {
    soundFx.playClick();
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(0.38, 0.3, 0.48);
      controlsRef.current.target.set(0, 0.06, 0);
    }
  };

  return (
    <div className={`relative w-full h-[calc(100vh-3.5rem)] flex flex-col md:flex-row overflow-hidden ${isLightMode ? 'bg-slate-50 text-slate-800' : 'bg-[#0A0E13] text-gray-100'} select-none`}>
      {/* 3D Viewport */}
      <div className="relative flex-1 h-full min-h-[400px]" ref={mountRef}>
        {/* Floating Toolbar */}
        <div className="absolute top-3 left-3 right-3 sm:right-auto z-10 flex flex-wrap items-center gap-2">
          {/* Explode Mode Button */}
          <button
            onClick={toggleExplode}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-md border transition-all ${
              explodeProgress > 0.1
                ? 'bg-nvidia-green text-black border-nvidia-green shadow-lg'
                : 'bg-cyber-surface/90 text-gray-200 border-cyber-border hover:border-gray-500'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{explodeProgress > 0.1 ? 'Đang Tháo Rời 3D' : 'Xem Tháo Rời 3D (Exploded View)'}</span>
          </button>

          {/* Auto Rotate */}
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border backdrop-blur-md transition-colors ${
              autoRotate ? 'bg-cyber-accent/20 text-cyber-accent border-cyber-accent/40' : 'bg-cyber-surface/90 text-gray-400 border-cyber-border'
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
            <span>Tự Xoay</span>
          </button>

          {/* Center View */}
          <button
            onClick={resetCamera}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-cyber-surface/90 text-gray-300 border border-cyber-border hover:text-white backdrop-blur-md transition-colors"
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-cyber-surface/90 text-gray-300 border border-cyber-border hover:text-nvidia-green backdrop-blur-md transition-colors"
          >
            {isLightMode ? <Moon className="w-3.5 h-3.5 text-amber-500" /> : <Sun className="w-3.5 h-3.5 text-yellow-400" />}
            <span>{isLightMode ? 'Nền Tối' : 'Nền Sáng'}</span>
          </button>

          {/* Pinout Diagram */}
          <button
            onClick={() => {
              soundFx.playClick();
              setIsPinoutOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#16271a] text-nvidia-green border border-nvidia-green/40 hover:bg-nvidia-green hover:text-black backdrop-blur-md transition-all"
          >
            <Network className="w-4 h-4" />
            <span>Sơ Đồ Đấu Dây Điện</span>
          </button>
        </div>

        {/* Explode Slider Bar */}
        <div className="absolute bottom-4 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-80 z-10 cyber-panel p-2.5 rounded-xl flex items-center gap-3">
          <Sliders className="w-4 h-4 text-nvidia-green shrink-0" />
          <div className="flex-1 flex flex-col gap-1">
            <div className="flex justify-between text-[11px] font-mono text-gray-400">
              <span>Lắp Ráp (0%)</span>
              <span className="text-nvidia-green font-bold">Tháo Rời ({Math.round(explodeProgress * 100)}%)</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={explodeProgress}
              onChange={(e) => setExplodeProgress(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-nvidia-green"
            />
          </div>
        </div>

        {/* Hover Tooltip */}
        {hoveredComponentId && (
          <div className="absolute top-16 left-4 z-10 pointer-events-none cyber-panel px-3 py-1.5 rounded-md border border-nvidia-green/60 text-xs font-mono text-nvidia-green flex items-center gap-1.5 animate-pulse">
            <Eye className="w-3.5 h-3.5" />
            <span>
              Bấm để xem chi tiết:{' '}
              <strong className="text-white">
                {JETBOT_COMPONENTS.find((c) => c.id === hoveredComponentId)?.nameVi}
              </strong>
            </span>
          </div>
        )}

        {/* Helper Hint */}
        <div className="hidden lg:flex absolute bottom-4 left-4 z-10 items-center gap-2 text-[11px] text-gray-400 bg-black/60 px-3 py-1.5 rounded-lg border border-gray-800 backdrop-blur-sm pointer-events-none">
          <HelpCircle className="w-3.5 h-3.5 text-cyber-accent" />
          <span>Kéo chuột để xoay 360° • Bấm vào linh kiện bất kỳ để xem thông số kỹ thuật</span>
        </div>
      </div>

      {/* Right Sidebar: Component List */}
      <div className="w-full md:w-80 lg:w-96 h-72 md:h-full border-t md:border-t-0 md:border-l border-cyber-border bg-[#0C121A] flex flex-col z-20">
        <div className="p-3.5 border-b border-cyber-border bg-[#101824] flex items-center justify-between">
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
                onClick={() => {
                  soundFx.playClick();
                  setSelectedComponent(comp);
                }}
                className={`p-3 rounded-lg border transition-all cursor-pointer flex flex-col gap-1 ${
                  isHovered
                    ? 'border-nvidia-green bg-[#142618] shadow-md'
                    : 'border-cyber-border/80 bg-cyber-surface/60 hover:border-gray-500 hover:bg-cyber-surface'
                }`}
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
