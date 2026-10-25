import * as THREE from 'three';
import { JetBotMeshParts } from './JetBot3DModel';

export interface VisualLabOptions {
  showVisionField: boolean;
  showSignalFlow: boolean;
  showDynamicsVectors: boolean;
  showPullRings: boolean;
  showCallouts: boolean;
  isLightMode: boolean;
}

export interface CalloutAnchor {
  id: string;
  title: string;
  subTitle: string;
  category: string;
  badge: string;
  color: string;
  worldPos: THREE.Vector3;
  screenPos: { x: number; y: number; visible: boolean };
  componentId: string;
}

export class VisualLabEnvironment {
  scene: THREE.Scene;
  group: THREE.Group;
  parts: JetBotMeshParts | null = null;
  isLightMode: boolean = true;

  workbenchGroup: THREE.Group;
  visionFieldGroup: THREE.Group;
  signalFlowGroup: THREE.Group;
  dynamicsVectorsGroup: THREE.Group;
  pullRingsGroup: THREE.Group;

  ledGreenLight: THREE.PointLight | null = null;
  ledRedLight: THREE.PointLight | null = null;
  ledGreenMesh: THREE.Mesh | null = null;
  ledRedMesh: THREE.Mesh | null = null;
  motorDriverLed: THREE.PointLight | null = null;

  meterNeedle: THREE.Mesh | null = null;

  rollerLeft: THREE.Mesh | null = null;
  rollerRight: THREE.Mesh | null = null;

  visionCones: Array<{ mesh: THREE.Mesh; spline: THREE.CatmullRomCurve3; t: number; speed: number }> = [];
  signalPulses: Array<{ mesh: THREE.Mesh; spline: THREE.CatmullRomCurve3; t: number; speed: number }> = [];

  leftTorqueArc: THREE.Mesh | null = null;
  rightTorqueArc: THREE.Mesh | null = null;
  leftVelArrow: THREE.Group | null = null;
  rightVelArrow: THREE.Group | null = null;
  resultantVelArrow: THREE.Group | null = null;

  testObstacleGroup: THREE.Group | null = null;
  pullRings: Map<string, THREE.Group> = new Map();
  animTime = 0;

  constructor(scene: THREE.Scene, isLightMode = true) {
    this.scene = scene;
    this.isLightMode = isLightMode;
    this.group = new THREE.Group();
    this.group.name = 'VisualLabEnvironment';
    this.scene.add(this.group);

    this.workbenchGroup = new THREE.Group();
    this.visionFieldGroup = new THREE.Group();
    this.signalFlowGroup = new THREE.Group();
    this.dynamicsVectorsGroup = new THREE.Group();
    this.pullRingsGroup = new THREE.Group();

    this.group.add(this.workbenchGroup);
    this.group.add(this.signalFlowGroup);
    this.group.add(this.dynamicsVectorsGroup);
    this.group.add(this.pullRingsGroup);

    this.buildWorkbench();
    this.buildSignalFlow();
    this.buildDynamicsVectors();
  }

  public setParts(parts: JetBotMeshParts) {
    this.parts = parts;
    this.buildCameraVisionField(parts.camera);
    this.attachDynamicsVectorsToWheels(parts);
    this.buildPullRings(parts);

    const driverLedLight = new THREE.PointLight(0x10b981, 0.4, 0.15);
    driverLedLight.position.set(0, 0.015, 0);
    parts.motorDriver.add(driverLedLight);
    this.motorDriverLed = driverLedLight;

    this.updateOled(0);
  }

  private buildWorkbench() {
    const isLight = this.isLightMode;
    const tableW = 1.05;
    const tableD = 0.65;
    const tableH = 0.028;

    const tableTopGeom = new THREE.BoxGeometry(tableW, tableH, tableD);
    const tableTopMat = new THREE.MeshStandardMaterial({
      color: isLight ? 0xdfbe99 : 0x221a14,
      roughness: 0.55,
      metalness: 0.08,
    });
    const tableTop = new THREE.Mesh(tableTopGeom, tableTopMat);
    tableTop.position.set(0, -tableH / 2 - 0.002, 0);
    tableTop.receiveShadow = true;
    this.workbenchGroup.add(tableTop);

    const trimGeom = new THREE.BoxGeometry(tableW + 0.008, tableH + 0.004, tableD + 0.008);
    const trimMat = new THREE.MeshStandardMaterial({
      color: isLight ? 0x64748b : 0x0f172a,
      roughness: 0.3,
      metalness: 0.8,
    });
    const trim = new THREE.Mesh(trimGeom, trimMat);
    trim.position.copy(tableTop.position);
    trim.scale.set(1.002, 0.9, 1.002);
    this.workbenchGroup.add(trim);

    const legRadius = 0.015;
    const legHeight = 0.35;
    const legMat = new THREE.MeshStandardMaterial({
      color: isLight ? 0x334155 : 0x111827,
      metalness: 0.85,
      roughness: 0.25,
    });

    [
      [-tableW / 2 + 0.04, -tableH - legHeight / 2, -tableD / 2 + 0.04],
      [tableW / 2 - 0.04, -tableH - legHeight / 2, -tableD / 2 + 0.04],
      [-tableW / 2 + 0.04, -tableH - legHeight / 2, tableD / 2 - 0.04],
      [tableW / 2 - 0.04, -tableH - legHeight / 2, tableD / 2 - 0.04],
    ].forEach(([lx, ly, lz]) => {
      const legGeom = new THREE.CylinderGeometry(legRadius, legRadius, legHeight, 16);
      const leg = new THREE.Mesh(legGeom, legMat);
      leg.position.set(lx, ly, lz);
      leg.castShadow = true;
      this.workbenchGroup.add(leg);

      const foot = new THREE.Mesh(new THREE.CylinderGeometry(legRadius * 1.6, legRadius * 1.8, 0.01, 16), trimMat);
      foot.position.set(lx, ly - legHeight / 2, lz);
      this.workbenchGroup.add(foot);
    });

    const matGeom = new THREE.PlaneGeometry(0.46, 0.36);
    const esdMat = new THREE.MeshStandardMaterial({
      color: isLight ? 0x0284c7 : 0x075985,
      roughness: 0.85,
      metalness: 0.05,
    });
    const matMesh = new THREE.Mesh(matGeom, esdMat);
    matMesh.rotation.x = -Math.PI / 2;
    matMesh.position.set(0, 0.0005, 0.01);
    matMesh.receiveShadow = true;
    this.workbenchGroup.add(matMesh);

    const esdGrid = new THREE.GridHelper(0.44, 22, 0x38bdf8, 0x0369a1);
    esdGrid.position.set(0, 0.001, 0.01);
    this.workbenchGroup.add(esdGrid);

    const railRadius = 0.0045;
    const railLength = 0.48;
    const railMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.95, roughness: 0.15 });

    [-0.055, 0.055].forEach((rx) => {
      const railGeom = new THREE.CylinderGeometry(railRadius, railRadius, railLength, 24);
      const rail = new THREE.Mesh(railGeom, railMat);
      rail.rotation.x = Math.PI / 2;
      rail.position.set(rx, 0.007, -0.12);
      rail.castShadow = true;
      this.workbenchGroup.add(rail);

      [-railLength / 2 + 0.02, railLength / 2 - 0.02].forEach((rz) => {
        const block = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.01, 0.018), legMat);
        block.position.set(rx, 0.005, -0.12 + rz);
        this.workbenchGroup.add(block);
      });
    });

    // Dyno Rollers under the wheels
    const rollerMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.85, roughness: 0.3 });
    const rollerGeom = new THREE.CylinderGeometry(0.012, 0.012, 0.032, 24);

    const rollerL = new THREE.Mesh(rollerGeom, rollerMat);
    rollerL.rotation.z = Math.PI / 2;
    rollerL.position.set(-0.082, 0.001, 0);
    this.workbenchGroup.add(rollerL);
    this.rollerLeft = rollerL;

    const rollerR = new THREE.Mesh(rollerGeom, rollerMat);
    rollerR.rotation.z = Math.PI / 2;
    rollerR.position.set(0.082, 0.001, 0);
    this.workbenchGroup.add(rollerR);
    this.rollerRight = rollerR;

    this.buildScaleRuler();
    this.buildDualLedModule();
    this.buildGalvanometer();
    this.buildTestObstacle();
  }

  private buildScaleRuler() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
      ctx.fillStyle = '#eab308';
      ctx.fillRect(8, 8, canvas.width - 16, 4);

      const totalMm = 300;
      const startX = 32;
      const endX = canvas.width - 32;
      const stepX = (endX - startX) / totalMm;

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';

      for (let mm = 0; mm <= totalMm; mm++) {
        const x = startX + mm * stepX;
        let tickHeight = 12;

        if (mm % 10 === 0) {
          tickHeight = 36;
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          const cm = mm / 10;
          ctx.fillText(cm.toString(), x, 96);
          if (cm === 0) ctx.fillText('cm', x + 24, 96);
        } else if (mm % 5 === 0) {
          tickHeight = 22;
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 1.8;
        } else {
          tickHeight = 12;
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 1.0;
        }

        ctx.beginPath();
        ctx.moveTo(x, 20);
        ctx.lineTo(x, 20 + tickHeight);
        ctx.stroke();
      }

      ctx.font = 'bold 13px sans-serif';
      ctx.fillStyle = '#76b900';
      ctx.fillText('NVIDIA JETBOT • PRECISION SCALE 1:1 CALIBRATION RULER', canvas.width / 2, 118);
    }

    const rulerTexture = new THREE.CanvasTexture(canvas);
    rulerTexture.anisotropy = 8;

    const rulerW = 0.42;
    const rulerD = 0.045;
    const rulerGeom = new THREE.PlaneGeometry(rulerW, rulerD);
    const rulerMat = new THREE.MeshStandardMaterial({
      map: rulerTexture,
      roughness: 0.35,
      metalness: 0.15,
    });
    const rulerMesh = new THREE.Mesh(rulerGeom, rulerMat);
    rulerMesh.rotation.x = -Math.PI / 2;
    rulerMesh.position.set(0, 0.0015, 0.22);
    rulerMesh.receiveShadow = true;
    this.workbenchGroup.add(rulerMesh);
  }

  private buildDualLedModule() {
    const group = new THREE.Group();
    group.position.set(0.24, 0.001, -0.05);

    const baseGeom = new THREE.BoxGeometry(0.08, 0.015, 0.055);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5, metalness: 0.3 });
    const base = new THREE.Mesh(baseGeom, baseMat);
    base.position.y = 0.0075;
    group.add(base);

    const bezelMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.95, roughness: 0.1 });

    const bezelG = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.012, 0.006, 24), bezelMat);
    bezelG.position.set(-0.02, 0.015, 0);
    group.add(bezelG);

    const ledGGeom = new THREE.SphereGeometry(0.008, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2);
    const ledGMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.1,
      metalness: 0.2,
      emissive: 0x059669,
      emissiveIntensity: 0.8,
    });
    const ledGMesh = new THREE.Mesh(ledGGeom, ledGMat);
    ledGMesh.position.set(-0.02, 0.018, 0);
    group.add(ledGMesh);
    this.ledGreenMesh = ledGMesh;

    const ledGLight = new THREE.PointLight(0x10b981, 0.6, 0.25);
    ledGLight.position.set(-0.02, 0.03, 0);
    group.add(ledGLight);
    this.ledGreenLight = ledGLight;

    const bezelR = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.012, 0.006, 24), bezelMat);
    bezelR.position.set(0.02, 0.015, 0);
    group.add(bezelR);

    const ledRGeom = new THREE.SphereGeometry(0.008, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2);
    const ledRMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      roughness: 0.1,
      metalness: 0.2,
      emissive: 0xdc2626,
      emissiveIntensity: 0.8,
    });
    const ledRMesh = new THREE.Mesh(ledRGeom, ledRMat);
    ledRMesh.position.set(0.02, 0.018, 0);
    group.add(ledRMesh);
    this.ledRedMesh = ledRMesh;

    const ledRLight = new THREE.PointLight(0xef4444, 0.6, 0.25);
    ledRLight.position.set(0.02, 0.03, 0);
    group.add(ledRLight);
    this.ledRedLight = ledRLight;

    const wireMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.6 });
    const wireGeom = new THREE.CylinderGeometry(0.0015, 0.0015, 0.07, 12);
    const wire = new THREE.Mesh(wireGeom, wireMat);
    wire.rotation.z = Math.PI / 2;
    wire.position.set(-0.06, 0.005, 0);
    group.add(wire);

    this.workbenchGroup.add(group);
  }

  private buildGalvanometer() {
    const group = new THREE.Group();
    group.position.set(0.32, 0.001, -0.16);
    group.rotation.y = -0.35;

    const boxGeom = new THREE.BoxGeometry(0.12, 0.11, 0.08);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.3 });
    const box = new THREE.Mesh(boxGeom, boxMat);
    box.position.y = 0.055;
    box.castShadow = true;
    group.add(box);

    const faceGeom = new THREE.CylinderGeometry(0.045, 0.045, 0.004, 32);
    const faceMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
    const face = new THREE.Mesh(faceGeom, faceMat);
    face.rotation.x = Math.PI / 2;
    face.position.set(0, 0.06, 0.041);
    group.add(face);

    const dialCanvas = document.createElement('canvas');
    dialCanvas.width = 256;
    dialCanvas.height = 256;
    const ctx = dialCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 256, 256);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(128, 150, 95, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();

      for (let i = -5; i <= 5; i++) {
        const ang = Math.PI * 1.5 + (i / 5) * 0.9;
        const x1 = 128 + Math.cos(ang) * 90;
        const y1 = 150 + Math.sin(ang) * 90;
        const x2 = 128 + Math.cos(ang) * 76;
        const y2 = 150 + Math.sin(ang) * 76;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('DC VOLTS (G)', 128, 90);
      ctx.font = '16px monospace';
      ctx.fillText('-8V       0       +8V', 128, 120);
    }
    const dialTex = new THREE.CanvasTexture(dialCanvas);
    const dialMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.08, 0.08),
      new THREE.MeshBasicMaterial({ map: dialTex, transparent: true })
    );
    dialMesh.position.set(0, 0.06, 0.0435);
    group.add(dialMesh);

    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005, 0.005, 0.003, 16),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 })
    );
    hub.rotation.x = Math.PI / 2;
    hub.position.set(0, 0.045, 0.0445);
    group.add(hub);

    const needleGeom = new THREE.BoxGeometry(0.0015, 0.038, 0.001);
    const needleMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const needle = new THREE.Mesh(needleGeom, needleMat);
    needle.geometry.translate(0, 0.018, 0);
    needle.position.set(0, 0.045, 0.045);
    group.add(needle);
    this.meterNeedle = needle;

    const glass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.046, 0.046, 0.002, 32),
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.35,
        roughness: 0.05,
        transmission: 0.9,
      })
    );
    glass.rotation.x = Math.PI / 2;
    glass.position.set(0, 0.06, 0.047);
    group.add(glass);

    this.workbenchGroup.add(group);
  }

  private buildTestObstacle() {
    const group = new THREE.Group();
    group.position.set(0, 0.001, -0.26);

    const baseGeom = new THREE.BoxGeometry(0.045, 0.004, 0.045);
    const orangeMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4 });
    const base = new THREE.Mesh(baseGeom, orangeMat);
    base.position.y = 0.002;
    base.castShadow = true;
    group.add(base);

    const bodyGeom = new THREE.ConeGeometry(0.018, 0.065, 24);
    const body = new THREE.Mesh(bodyGeom, orangeMat);
    body.position.y = 0.0345;
    body.castShadow = true;
    group.add(body);

    const stripeGeom = new THREE.CylinderGeometry(0.009, 0.013, 0.015, 24);
    const stripe = new THREE.Mesh(stripeGeom, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 }));
    stripe.position.y = 0.034;
    group.add(stripe);

    const bboxGeom = new THREE.BoxGeometry(0.055, 0.075, 0.055);
    const bboxEdges = new THREE.EdgesGeometry(bboxGeom);
    const bboxLine = new THREE.LineSegments(
      bboxEdges,
      new THREE.LineBasicMaterial({ color: 0xef4444 })
    );
    bboxLine.position.y = 0.0375;
    group.add(bboxLine);

    this.testObstacleGroup = group;
    this.workbenchGroup.add(group);
  }

  private buildCameraVisionField(cameraGroup: THREE.Group) {
    this.visionCones = [];

    while (this.visionFieldGroup.children.length > 0) {
      this.visionFieldGroup.remove(this.visionFieldGroup.children[0]);
    }

    cameraGroup.add(this.visionFieldGroup);

    const lensLocal = new THREE.Vector3(0, 0.081, -0.088);
    const frustumLength = 0.24;
    const frustumW = 0.18;
    const frustumH = 0.14;

    const vertices: number[] = [];
    const indices: number[] = [];

    vertices.push(lensLocal.x, lensLocal.y, lensLocal.z);

    const baseZ = lensLocal.z - frustumLength * Math.cos(-0.22);
    const baseY = lensLocal.y + frustumLength * Math.sin(-0.22);

    vertices.push(-frustumW / 2, baseY + frustumH / 2, baseZ);
    vertices.push(frustumW / 2, baseY + frustumH / 2, baseZ);
    vertices.push(frustumW / 2, baseY - frustumH / 2, baseZ);
    vertices.push(-frustumW / 2, baseY - frustumH / 2, baseZ);

    indices.push(0, 1, 2);
    indices.push(0, 2, 3);
    indices.push(0, 3, 4);
    indices.push(0, 4, 1);
    indices.push(1, 4, 3);
    indices.push(1, 3, 2);

    const frustumGeom = new THREE.BufferGeometry();
    frustumGeom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    frustumGeom.setIndex(indices);
    frustumGeom.computeVertexNormals();

    const frustumMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const frustumMesh = new THREE.Mesh(frustumGeom, frustumMat);
    this.visionFieldGroup.add(frustumMesh);

    const edges = new THREE.EdgesGeometry(frustumGeom);
    const edgeLines = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.6 })
    );
    this.visionFieldGroup.add(edgeLines);

    const targetEndPoints = [
      new THREE.Vector3(0, baseY, baseZ),
      new THREE.Vector3(-frustumW / 2, baseY + frustumH / 2, baseZ),
      new THREE.Vector3(frustumW / 2, baseY + frustumH / 2, baseZ),
      new THREE.Vector3(frustumW / 2, baseY - frustumH / 2, baseZ),
      new THREE.Vector3(-frustumW / 2, baseY - frustumH / 2, baseZ),
      new THREE.Vector3((-frustumW / 2) * 0.6, baseY, baseZ),
      new THREE.Vector3((frustumW / 2) * 0.6, baseY, baseZ),
    ];

    const rayMat = new THREE.LineBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.5 });
    const coneGeom = new THREE.ConeGeometry(0.0035, 0.01, 12);
    coneGeom.rotateX(Math.PI / 2);
    const coneMat = new THREE.MeshStandardMaterial({
      color: 0x76b900,
      emissive: 0x34d399,
      emissiveIntensity: 0.9,
      roughness: 0.2,
    });

    targetEndPoints.forEach((endPt, idx) => {
      const midX = (lensLocal.x + endPt.x) / 2 + (idx % 2 === 0 ? 0.01 : -0.01);
      const midY = (lensLocal.y + endPt.y) / 2 + 0.008;
      const midZ = (lensLocal.z + endPt.z) / 2;
      const midPt = new THREE.Vector3(midX, midY, midZ);

      const spline = new THREE.CatmullRomCurve3([lensLocal, midPt, endPt]);
      const pts = spline.getPoints(24);
      const lineGeom = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(lineGeom, rayMat);
      this.visionFieldGroup.add(line);

      for (let c = 0; c < 2; c++) {
        const coneMesh = new THREE.Mesh(coneGeom, coneMat);
        this.visionFieldGroup.add(coneMesh);
        this.visionCones.push({
          mesh: coneMesh,
          spline,
          t: (c * 0.5 + idx * 0.15) % 1.0,
          speed: 0.35,
        });
      }
    });
  }

  private buildDynamicsVectors() {}

  private attachDynamicsVectorsToWheels(parts: JetBotMeshParts) {
    const arcRadius = 0.038;
    const arcGeom = new THREE.TorusGeometry(arcRadius, 0.002, 12, 32, Math.PI * 1.3);
    const arcMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.8,
    });

    const leftArc = new THREE.Mesh(arcGeom, arcMat);
    leftArc.rotation.y = Math.PI / 2;
    leftArc.position.set(-0.018, 0, 0);
    parts.leftWheel.add(leftArc);
    this.leftTorqueArc = leftArc;

    const rightArc = new THREE.Mesh(arcGeom, arcMat);
    rightArc.rotation.y = Math.PI / 2;
    rightArc.position.set(0.018, 0, 0);
    parts.rightWheel.add(rightArc);
    this.rightTorqueArc = rightArc;

    const createVelocityArrow = (colorHex: number) => {
      const group = new THREE.Group();
      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.002, 0.002, 0.06, 12),
        new THREE.MeshStandardMaterial({ color: colorHex, emissive: colorHex, emissiveIntensity: 0.6 })
      );
      shaft.rotation.x = Math.PI / 2;
      shaft.position.z = -0.03;
      group.add(shaft);

      const head = new THREE.Mesh(
        new THREE.ConeGeometry(0.005, 0.015, 12),
        new THREE.MeshStandardMaterial({ color: colorHex, emissive: colorHex, emissiveIntensity: 1.0 })
      );
      head.rotation.x = -Math.PI / 2;
      head.position.z = -0.068;
      group.add(head);

      return group;
    };

    const leftArrow = createVelocityArrow(0x10b981);
    leftArrow.position.set(-0.016, 0, 0);
    parts.leftWheel.add(leftArrow);
    this.leftVelArrow = leftArrow;

    const rightArrow = createVelocityArrow(0x10b981);
    rightArrow.position.set(0.016, 0, 0);
    parts.rightWheel.add(rightArrow);
    this.rightVelArrow = rightArrow;

    const centerArrow = createVelocityArrow(0x76b900);
    centerArrow.scale.set(1.3, 1.3, 1.3);
    centerArrow.position.set(0, 0.0325, -0.02);
    parts.chassis.add(centerArrow);
    this.resultantVelArrow = centerArrow;
  }

  private buildSignalFlow() {
    this.signalPulses = [];
    const pathways = [
      {
        name: 'CSI Video Data',
        color: 0x38bdf8,
        points: [
          new THREE.Vector3(0, 0.081, -0.076),
          new THREE.Vector3(0, 0.065, -0.05),
          new THREE.Vector3(0, 0.055, -0.02),
        ],
      },
      {
        name: 'I2C Bus',
        color: 0xfacc15,
        points: [
          new THREE.Vector3(0.025, 0.058, 0.01),
          new THREE.Vector3(0.035, 0.048, 0.01),
          new THREE.Vector3(0.015, 0.035, 0.005),
        ],
      },
      {
        name: 'Left Motor PWM',
        color: 0x10b981,
        points: [
          new THREE.Vector3(-0.015, 0.035, 0.01),
          new THREE.Vector3(-0.04, 0.025, 0.01),
          new THREE.Vector3(-0.065, 0.018, 0.0),
        ],
      },
      {
        name: 'Right Motor PWM',
        color: 0xef4444,
        points: [
          new THREE.Vector3(0.015, 0.035, 0.01),
          new THREE.Vector3(0.04, 0.025, 0.01),
          new THREE.Vector3(0.065, 0.018, 0.0),
        ],
      },
    ];

    pathways.forEach((path) => {
      const spline = new THREE.CatmullRomCurve3(path.points);
      const pts = spline.getPoints(24);
      const lineGeom = new THREE.BufferGeometry().setFromPoints(pts);
      const lineMat = new THREE.LineBasicMaterial({ color: path.color, transparent: true, opacity: 0.6 });
      const line = new THREE.Line(lineGeom, lineMat);
      this.signalFlowGroup.add(line);

      const pulseGeom = new THREE.SphereGeometry(0.0035, 12, 12);
      const pulseMat = new THREE.MeshStandardMaterial({
        color: path.color,
        emissive: path.color,
        emissiveIntensity: 1.5,
      });

      for (let p = 0; p < 2; p++) {
        const pulse = new THREE.Mesh(pulseGeom, pulseMat);
        this.signalFlowGroup.add(pulse);
        this.signalPulses.push({
          mesh: pulse,
          spline,
          t: p * 0.5,
          speed: 0.5,
        });
      }
    });
  }

  private buildPullRings(parts: JetBotMeshParts) {
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0xd97706,
      emissiveIntensity: 0.6,
    });

    const createPullRing = (name: string, targetPart: THREE.Group, offset: THREE.Vector3) => {
      const ringGroup = new THREE.Group();
      ringGroup.name = 'PullRing_' + name;

      const stemGeom = new THREE.CylinderGeometry(0.002, 0.002, 0.024, 16);
      const stem = new THREE.Mesh(stemGeom, ringMat);
      stem.position.y = 0.012;
      ringGroup.add(stem);

      const torusGeom = new THREE.TorusGeometry(0.012, 0.0025, 16, 32);
      const torus = new THREE.Mesh(torusGeom, ringMat);
      torus.position.y = 0.028;
      torus.castShadow = true;
      ringGroup.add(torus);

      const arrowGeom = new THREE.ConeGeometry(0.004, 0.008, 12);
      const arrow = new THREE.Mesh(arrowGeom, ringMat);
      arrow.position.y = 0.028;
      ringGroup.add(arrow);

      ringGroup.position.copy(offset);
      targetPart.add(ringGroup);
      this.pullRings.set(name, ringGroup);
    };

    createPullRing('camera', parts.camera, new THREE.Vector3(0, 0.098, -0.076));
    createPullRing('jetson', parts.jetsonNano, new THREE.Vector3(0, 0.092, 0.01));
    createPullRing('oled', parts.oled, new THREE.Vector3(0, 0.128, -0.045));
    createPullRing('motors', parts.chassis, new THREE.Vector3(0, 0.042, 0.045));
  }

  public updateOled(motorSpeed: number) {
    if (!this.parts) return;
    const canvas = this.parts.oledCanvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('NVIDIA JETBOT v2.0', 12, 24);

    ctx.fillStyle = '#ffffff';
    ctx.font = '16px monospace';
    ctx.fillText('IP: 192.168.1.105', 12, 48);

    const percent = Math.round(motorSpeed * 100);
    const sign = percent > 0 ? '+' : '';
    ctx.fillText('PWM: ' + sign + percent + '%  ' + (motorSpeed * 7.4).toFixed(1) + 'V', 12, 72);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(12, 82, 232, 16);

    const barW = Math.max(0, Math.min(228, Math.abs(motorSpeed) * 228));
    ctx.fillStyle = motorSpeed >= 0 ? '#10b981' : '#ef4444';
    ctx.fillRect(14, 84, barW, 12);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px monospace';
    const rpm = Math.round(Math.abs(motorSpeed) * 180);
    ctx.fillText('RPM: ' + rpm + '  AI: READY', 12, 118);

    this.parts.oledTexture.needsUpdate = true;
  }

  public update(dt: number, motorSpeed: number, options: VisualLabOptions) {
    this.animTime += dt;

    this.visionFieldGroup.visible = options.showVisionField;
    this.signalFlowGroup.visible = options.showSignalFlow;
    this.dynamicsVectorsGroup.visible = options.showDynamicsVectors;
    this.pullRingsGroup.visible = options.showPullRings;

    // 1. Dyno Rollers under wheels spin with contact friction
    if (this.rollerLeft && this.rollerRight && motorSpeed !== 0) {
      const rollerSpin = motorSpeed * dt * 16 * 2.7;
      this.rollerLeft.rotation.x -= rollerSpin;
      this.rollerRight.rotation.x -= rollerSpin;
    }

    // 2. Motor Driver Board LED PWM
    if (this.motorDriverLed) {
      this.motorDriverLed.intensity = 0.2 + Math.abs(motorSpeed) * 1.6;
    }

    // 3. Update OLED on JetBot car
    this.updateOled(motorSpeed);

    // 4. Vision Cones Animation
    if (options.showVisionField) {
      this.visionCones.forEach((cone) => {
        cone.t = (cone.t + dt * cone.speed) % 1.0;
        const pos = cone.spline.getPoint(cone.t);
        const tangent = cone.spline.getTangent(cone.t);
        cone.mesh.position.copy(pos);
        cone.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
      });
    }

    // 5. Signal Flow Animation
    if (options.showSignalFlow) {
      const pulseSpeedMult = 0.6 + Math.abs(motorSpeed) * 1.5;
      this.signalPulses.forEach((pulse) => {
        pulse.t = (pulse.t + dt * pulse.speed * pulseSpeedMult) % 1.0;
        const pos = pulse.spline.getPoint(pulse.t);
        pulse.mesh.position.copy(pos);
      });
    }

    // 6. D2 Dual LED Module
    if (this.ledGreenLight && this.ledRedLight && this.ledGreenMesh && this.ledRedMesh) {
      if (motorSpeed > 0.04) {
        this.ledGreenLight.intensity = 0.6 + motorSpeed * 1.8;
        this.ledRedLight.intensity = 0.05;
        (this.ledGreenMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.0 + motorSpeed * 1.5;
        (this.ledRedMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.1;
      } else if (motorSpeed < -0.04) {
        this.ledGreenLight.intensity = 0.05;
        this.ledRedLight.intensity = 0.6 + Math.abs(motorSpeed) * 1.8;
        (this.ledGreenMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.1;
        (this.ledRedMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.0 + Math.abs(motorSpeed) * 1.5;
      } else {
        this.ledGreenLight.intensity = 0.15;
        this.ledRedLight.intensity = 0.15;
        (this.ledGreenMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3;
        (this.ledRedMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3;
      }
    }

    // 7. Precision Galvanometer Needle
    if (this.meterNeedle) {
      const targetAngle = motorSpeed * 0.75;
      this.meterNeedle.rotation.z = THREE.MathUtils.lerp(this.meterNeedle.rotation.z, targetAngle, 0.12);
    }

    // 8. Dynamics Vectors
    if (options.showDynamicsVectors) {
      const scale = Math.max(0.12, Math.abs(motorSpeed));
      if (this.leftVelArrow && this.rightVelArrow && this.resultantVelArrow) {
        this.leftVelArrow.scale.set(1, 1, scale * 1.5);
        this.rightVelArrow.scale.set(1, 1, scale * 1.5);
        this.resultantVelArrow.scale.set(1.2, 1.2, scale * 1.6);

        if (motorSpeed < 0) {
          this.leftVelArrow.rotation.y = Math.PI;
          this.rightVelArrow.rotation.y = Math.PI;
          this.resultantVelArrow.rotation.y = Math.PI;
        } else {
          this.leftVelArrow.rotation.y = 0;
          this.rightVelArrow.rotation.y = 0;
          this.resultantVelArrow.rotation.y = 0;
        }
      }

      if (this.leftTorqueArc && this.rightTorqueArc) {
        this.leftTorqueArc.rotation.z += motorSpeed * dt * 8;
        this.rightTorqueArc.rotation.z += motorSpeed * dt * 8;
      }
    }

    this.pullRings.forEach((ring) => {
      ring.scale.setScalar(1.0 + Math.sin(this.animTime * 3) * 0.05);
    });
  }

  public getCalloutAnchors(camera: THREE.Camera, width: number, height: number): CalloutAnchor[] {
    const rawAnchors = [
      {
        id: 'camera',
        title: 'CAMERA AI CSI SONY IMX219 (8MP)',
        subTitle: 'Cảm biến góc rộng 160° FOV • Nhận diện tâm làn & vật cản',
        category: 'Thị Giác AI',
        badge: 'CSI 8MP',
        color: '#10b981',
        componentId: 'camera',
        pos: this.parts ? this.parts.camera.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.035, 0)) : new THREE.Vector3(0, 0.12, -0.076),
      },
      {
        id: 'jetson_nano',
        title: 'BỘ NÃO GPU NVIDIA JETSON NANO',
        subTitle: '128 nhân Maxwell CUDA • Xử lý Deep Learning TensorRT FP16 (35+ FPS)',
        category: 'Xử Lý Trung Tâm',
        badge: '128 CUDA',
        color: '#76b900',
        componentId: 'jetson_nano',
        pos: this.parts ? this.parts.jetsonNano.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.045, 0)) : new THREE.Vector3(0, 0.11, 0.015),
      },
      {
        id: 'motor_driver',
        title: 'DRIVER ĐỘNG CƠ PCA9685 I2C (0x60)',
        subTitle: '16 kênh PWM 12-bit • Điều khiển tốc độ vi sai 2 bánh độc lập',
        category: 'Điều Khiển Động Cơ',
        badge: 'I2C PWM',
        color: '#f59e0b',
        componentId: 'motor_driver',
        pos: this.parts ? this.parts.motorDriver.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0.04, 0.02, 0)) : new THREE.Vector3(0.04, 0.055, 0.01),
      },
      {
        id: 'motors',
        title: 'ĐỘNG CƠ DC VI SAI TT & BÁNH XE (65mm)',
        subTitle: 'Hệ vi sai tỉ số 1:48 • Vận tốc tối đa 0.65 m/s kèm 2 bánh caster',
        category: 'Cơ Cấu Chấp Hành',
        badge: 'TT 1:48',
        color: '#38bdf8',
        componentId: 'motors',
        pos: this.parts ? this.parts.leftWheel.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(-0.02, 0.03, 0)) : new THREE.Vector3(-0.09, 0.06, 0),
      },
      {
        id: 'oled',
        title: 'MÀN HÌNH OLED SSD1306 (128x32)',
        subTitle: 'Giao tiếp I2C 0x3C • Hiển thị IP WiFi, tải CPU/GPU, nhiệt độ pin',
        category: 'Hiển Thị Trạng Thái',
        badge: 'OLED I2C',
        color: '#a855f7',
        componentId: 'oled',
        pos: this.parts ? this.parts.oled.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.03, 0)) : new THREE.Vector3(0, 0.14, -0.045),
      },
      {
        id: 'battery',
        title: 'BỘ PIN NGUỒN LiPo / Li-Ion (7.4V - 2S)',
        subTitle: 'Dòng xả cao nuôi động cơ & mạch hạ áp BEC 5V/4A cấp nguồn Jetson',
        category: 'Nguồn Năng Lượng',
        badge: '7.4V 2S',
        color: '#ef4444',
        componentId: 'battery',
        pos: this.parts ? this.parts.battery.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, -0.02, 0.02)) : new THREE.Vector3(0, 0.02, 0.02),
      },
      {
        id: 'led_indicator',
        title: 'D2 ĐÈN LED CHỈ THỊ DÒNG ĐỘNG CƠ',
        subTitle: 'LED Xanh (Tiến) & LED Đỏ (Lùi) báo hiệu cực tính dòng điện PWM',
        category: 'Đo Lường & Chỉ Thị',
        badge: 'Dual LED',
        color: '#10b981',
        componentId: 'motors',
        pos: new THREE.Vector3(0.24, 0.035, -0.05),
      },
    ];

    const results: CalloutAnchor[] = [];

    rawAnchors.forEach((a) => {
      const v = a.pos.clone().project(camera);
      const isVisible = v.z < 1.0 && v.x >= -1.1 && v.x <= 1.1 && v.y >= -1.1 && v.y <= 1.1;
      const screenX = ((v.x + 1) * width) / 2;
      const screenY = ((-v.y + 1) * height) / 2;

      results.push({
        id: a.id,
        title: a.title,
        subTitle: a.subTitle,
        category: a.category,
        badge: a.badge,
        color: a.color,
        worldPos: a.pos,
        screenPos: { x: screenX, y: screenY, visible: isVisible },
        componentId: a.componentId,
      });
    });

    return results;
  }
}
