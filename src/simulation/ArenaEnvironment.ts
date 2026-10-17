import * as THREE from 'three';
import { ArenaId } from '../types/jetbot';
import { PhysicsKinematics } from './PhysicsKinematics';

export class ArenaEnvironment {
  scene: THREE.Scene;
  physics: PhysicsKinematics;
  arenaGroup: THREE.Group;
  currentArenaId: ArenaId = 'road';
  isLightMode: boolean = true; // default to clean, bright modern lab!

  ambientLight: THREE.AmbientLight;
  sunLight: THREE.DirectionalLight;
  fillLight: THREE.DirectionalLight;

  constructor(scene: THREE.Scene, physics: PhysicsKinematics, isLightMode = true) {
    this.scene = scene;
    this.physics = physics;
    this.isLightMode = isLightMode;
    this.arenaGroup = new THREE.Group();
    this.arenaGroup.name = 'ArenaEnvironment';
    this.scene.add(this.arenaGroup);

    // Setup Lighting
    this.ambientLight = new THREE.AmbientLight(0xffffff, isLightMode ? 1.4 : 0.8);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xffffff, isLightMode ? 1.6 : 1.2);
    this.sunLight.position.set(6, 12, 6);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 30;
    this.sunLight.shadow.camera.left = -6;
    this.sunLight.shadow.camera.right = 6;
    this.sunLight.shadow.camera.top = 6;
    this.sunLight.shadow.camera.bottom = -6;
    this.scene.add(this.sunLight);

    this.fillLight = new THREE.DirectionalLight(0x76b900, isLightMode ? 0.4 : 0.8);
    this.fillLight.position.set(-6, 8, -6);
    this.scene.add(this.fillLight);

    this.buildArena('road');
  }

  public setTheme(isLight: boolean) {
    this.isLightMode = isLight;
    if (isLight) {
      this.scene.background = new THREE.Color(0xf1f5f9); // Clean slate-100 light
      this.ambientLight.intensity = 1.4;
      this.sunLight.intensity = 1.6;
      this.fillLight.color.setHex(0xe2e8f0);
      this.fillLight.intensity = 0.5;
    } else {
      this.scene.background = new THREE.Color(0x0a0f16); // Cyber dark
      this.ambientLight.intensity = 0.8;
      this.sunLight.intensity = 1.2;
      this.fillLight.color.setHex(0x76b900);
      this.fillLight.intensity = 0.8;
    }
    this.buildArena(this.currentArenaId);
  }

  public buildArena(arenaId: ArenaId) {
    this.currentArenaId = arenaId;
    this.physics.setArena(arenaId);

    // Clear previous meshes
    while (this.arenaGroup.children.length > 0) {
      const obj = this.arenaGroup.children[0];
      this.arenaGroup.remove(obj);
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    }

    // 1. Floor & Walls
    this.buildFloorAndWalls();

    // 2. Continuous Road Track Circuit
    this.buildRoadTrack();

    // 3. If obstacle course, place obstacles on the road!
    if (arenaId === 'obstacles') {
      this.buildTrackObstacles();
    }
  }

  private buildFloorAndWalls() {
    const isLight = this.isLightMode;
    const floorSize = 10;
    const floorGeom = new THREE.PlaneGeometry(floorSize, floorSize);

    // Modern light studio lab polished concrete vs dark carbon
    const floorMat = new THREE.MeshStandardMaterial({
      color: isLight ? 0xe2e8f0 : 0x0f1722,
      roughness: isLight ? 0.6 : 0.8,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeom, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.arenaGroup.add(floor);

    // Grid helper
    const gridHelper = new THREE.GridHelper(
      10,
      20,
      isLight ? 0x94a3b8 : 0x76b900,
      isLight ? 0xcbd5e1 : 0x1e293b
    );
    gridHelper.position.y = 0.002;
    this.arenaGroup.add(gridHelper);

    // Perimeter boundary walls
    const wallHeight = 0.3;
    const wallThickness = 0.08;
    const wallMat = new THREE.MeshStandardMaterial({
      color: isLight ? 0x94a3b8 : 0x1e293b,
      metalness: 0.4,
      roughness: 0.3,
    });
    const stripMat = new THREE.MeshBasicMaterial({ color: 0x76b900 });

    const createWall = (x: number, z: number, w: number, d: number) => {
      const wallGeom = new THREE.BoxGeometry(w, wallHeight, d);
      const wall = new THREE.Mesh(wallGeom, wallMat);
      wall.position.set(x, wallHeight / 2, z);
      wall.castShadow = true;
      wall.receiveShadow = true;
      this.arenaGroup.add(wall);

      // Glowing green top bumper
      const stripGeom = new THREE.BoxGeometry(w, 0.015, d);
      const strip = new THREE.Mesh(stripGeom, stripMat);
      strip.position.set(x, wallHeight + 0.007, z);
      this.arenaGroup.add(strip);
    };

    createWall(0, -4.8, 9.68, wallThickness); // North
    createWall(0, 4.8, 9.68, wallThickness); // South
    createWall(-4.8, 0, wallThickness, 9.68); // West
    createWall(4.8, 0, wallThickness, 9.68); // East

    // 4 Corner Pillars
    [-4.65, 4.65].forEach((cx) => {
      [-4.65, 4.65].forEach((cz) => {
        const pillarGeom = new THREE.CylinderGeometry(0.12, 0.14, 0.7, 16);
        const pillarMat = new THREE.MeshStandardMaterial({
          color: isLight ? 0x64748b : 0x1e293b,
          metalness: 0.5,
        });
        const pillar = new THREE.Mesh(pillarGeom, pillarMat);
        pillar.position.set(cx, 0.35, cz);
        this.arenaGroup.add(pillar);

        const lightGeom = new THREE.SphereGeometry(0.06, 16, 16);
        const light = new THREE.Mesh(lightGeom, new THREE.MeshBasicMaterial({ color: 0x76b900 }));
        light.position.set(cx, 0.72, cz);
        this.arenaGroup.add(light);
      });
    });
  }

  private buildRoadTrack() {
    const pts = this.physics.trackPath;
    if (pts.length < 3) return;

    const trackWidth = 1.0; // 1.0m wide track
    const halfWidth = trackWidth / 2;

    // Generate road surface triangle strip
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];

    const innerPoints: THREE.Vector3[] = [];
    const outerPoints: THREE.Vector3[] = [];

    for (let i = 0; i <= pts.length; i++) {
      const idx = i % pts.length;
      const p = pts[idx];

      // Inner point: p + normal * (-halfWidth)
      const inX = p.x - p.normalX * halfWidth;
      const inZ = p.z - p.normalZ * halfWidth;

      // Outer point: p + normal * (+halfWidth)
      const outX = p.x + p.normalX * halfWidth;
      const outZ = p.z + p.normalZ * halfWidth;

      innerPoints.push(new THREE.Vector3(inX, 0.006, inZ));
      outerPoints.push(new THREE.Vector3(outX, 0.006, outZ));
    }

    // Build quad triangles for road ribbon
    for (let i = 0; i < pts.length; i++) {
      const pIn1 = innerPoints[i];
      const pOut1 = outerPoints[i];
      const pIn2 = innerPoints[i + 1];
      const pOut2 = outerPoints[i + 1];

      // Tri 1: pIn1, pOut1, pIn2
      positions.push(pIn1.x, pIn1.y, pIn1.z);
      positions.push(pOut1.x, pOut1.y, pOut1.z);
      positions.push(pIn2.x, pIn2.y, pIn2.z);
      normals.push(0, 1, 0, 0, 1, 0, 0, 1, 0);
      uvs.push(0, i / pts.length, 1, i / pts.length, 0, (i + 1) / pts.length);

      // Tri 2: pOut1, pOut2, pIn2
      positions.push(pOut1.x, pOut1.y, pOut1.z);
      positions.push(pOut2.x, pOut2.y, pOut2.z);
      positions.push(pIn2.x, pIn2.y, pIn2.z);
      normals.push(0, 1, 0, 0, 1, 0, 0, 1, 0);
      uvs.push(1, i / pts.length, 1, (i + 1) / pts.length, 0, (i + 1) / pts.length);
    }

    const roadGeom = new THREE.BufferGeometry();
    roadGeom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    roadGeom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    roadGeom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

    // Dark grey tarmac
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x242c38,
      roughness: 0.85,
      metalness: 0.1,
    });
    const roadMesh = new THREE.Mesh(roadGeom, roadMat);
    roadMesh.receiveShadow = true;
    this.arenaGroup.add(roadMesh);

    // Inner & Outer Solid White Boundary Lines
    const edgeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const inLineGeom = new THREE.BufferGeometry().setFromPoints(innerPoints);
    const inLine = new THREE.Line(inLineGeom, edgeWhiteMat);
    const outLineGeom = new THREE.BufferGeometry().setFromPoints(outerPoints);
    const outLine = new THREE.Line(outLineGeom, edgeWhiteMat);
    this.arenaGroup.add(inLine, outLine);

    // Centerline Yellow Dashes
    const dashMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    for (let i = 0; i < pts.length; i += 5) {
      const p1 = pts[i];
      const p2 = pts[(i + 1) % pts.length];
      const midX = (p1.x + p2.x) / 2;
      const midZ = (p1.z + p2.z) / 2;
      const angle = Math.atan2(p2.z - p1.z, p2.x - p1.x);

      const dashGeom = new THREE.PlaneGeometry(0.18, 0.035);
      const dash = new THREE.Mesh(dashGeom, dashMat);
      dash.rotation.x = -Math.PI / 2;
      dash.rotation.z = -angle;
      dash.position.set(midX, 0.007, midZ);
      this.arenaGroup.add(dash);
    }

    // Checkered Start / Finish Line Banner
    const startLineGeom = new THREE.PlaneGeometry(trackWidth, 0.2);
    const startLineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const startLine = new THREE.Mesh(startLineGeom, startLineMat);
    startLine.rotation.x = -Math.PI / 2;
    startLine.position.set(-1.8, 0.008, -2.0);
    this.arenaGroup.add(startLine);

    // Start Gate Arch
    const gateMat = new THREE.MeshStandardMaterial({ color: 0x76b900, metalness: 0.8 });
    const pole1 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 16), gateMat);
    pole1.position.set(-1.8, 0.4, -2.0 - halfWidth);
    const pole2 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 16), gateMat);
    pole2.position.set(-1.8, 0.4, -2.0 + halfWidth);
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, trackWidth + 0.1), gateMat);
    beam.position.set(-1.8, 0.8, -2.0);
    this.arenaGroup.add(pole1, pole2, beam);
  }

  private buildTrackObstacles() {
    const isLight = this.isLightMode;

    const crateMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // wood orange brown
      roughness: 0.7,
      metalness: 0.1,
    });
    const coneMat = new THREE.MeshStandardMaterial({
      color: 0xf97316, // bright safety orange
      roughness: 0.4,
    });
    const barrelMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // industrial blue
      metalness: 0.6,
      roughness: 0.3,
    });

    for (const obs of this.physics.obstacles) {
      if (obs.type === 'box') {
        const size = obs.radius * 2;
        const geom = new THREE.BoxGeometry(size, size, size);
        const mesh = new THREE.Mesh(geom, crateMat);
        mesh.position.set(obs.x, size / 2 + 0.005, obs.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.arenaGroup.add(mesh);

        // Warning Hazard Ring on ground
        const ringGeom = new THREE.RingGeometry(obs.radius * 1.1, obs.radius * 1.25, 24);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xef4444,
          side: THREE.DoubleSide,
        });
        const ring = new THREE.Mesh(ringGeom, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(obs.x, 0.007, obs.z);
        this.arenaGroup.add(ring);
      } else if (obs.type === 'cone') {
        const coneGroup = new THREE.Group();
        const baseGeom = new THREE.BoxGeometry(obs.radius * 1.8, 0.02, obs.radius * 1.8);
        const base = new THREE.Mesh(baseGeom, coneMat);
        coneGroup.add(base);

        const bodyGeom = new THREE.ConeGeometry(obs.radius * 0.85, 0.45, 24);
        const body = new THREE.Mesh(bodyGeom, coneMat);
        body.position.y = 0.225;
        coneGroup.add(body);

        // Reflective white stripe
        const stripeGeom = new THREE.CylinderGeometry(obs.radius * 0.45, obs.radius * 0.6, 0.1, 24);
        const stripe = new THREE.Mesh(stripeGeom, new THREE.MeshBasicMaterial({ color: 0xffffff }));
        stripe.position.y = 0.22;
        coneGroup.add(stripe);

        coneGroup.position.set(obs.x, 0.008, obs.z);
        coneGroup.traverse((c) => {
          if (c instanceof THREE.Mesh) {
            c.castShadow = true;
            c.receiveShadow = true;
          }
        });
        this.arenaGroup.add(coneGroup);

        // Warning Hazard Ring on ground
        const ringGeom = new THREE.RingGeometry(obs.radius * 1.1, obs.radius * 1.25, 24);
        const ring = new THREE.Mesh(ringGeom, new THREE.MeshBasicMaterial({ color: 0xf97316, side: THREE.DoubleSide }));
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(obs.x, 0.007, obs.z);
        this.arenaGroup.add(ring);
      } else if (obs.type === 'barrel') {
        const height = 0.5;
        const geom = new THREE.CylinderGeometry(obs.radius, obs.radius, height, 24);
        const mesh = new THREE.Mesh(geom, barrelMat);
        mesh.position.set(obs.x, height / 2 + 0.005, obs.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.arenaGroup.add(mesh);

        // Warning Hazard Ring on ground
        const ringGeom = new THREE.RingGeometry(obs.radius * 1.1, obs.radius * 1.25, 24);
        const ring = new THREE.Mesh(ringGeom, new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide }));
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(obs.x, 0.007, obs.z);
        this.arenaGroup.add(ring);
      }
    }
  }

  public update(_dt: number) {
    // Dynamic updates if needed
  }
}
