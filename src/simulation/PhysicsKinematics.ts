import { RobotState, ArenaId } from '../types/jetbot';

export interface Obstacle {
  x: number;
  z: number;
  radius: number;
  type: 'box' | 'cone' | 'barrel';
  label: string;
  dodgeSide: number; // -1 for LEFT (-normal), +1 for RIGHT (+normal)
  trackDist: number; // arc length position along the racetrack
}

export interface PathWaypoint {
  x: number;
  z: number;
  tangentX: number;
  tangentZ: number;
  normalX: number;
  normalZ: number;
  distanceAlongTrack: number;
}

export class PhysicsKinematics {
  // Physical parameters
  readonly wheelRadius = 0.0325; // 32.5mm radius = 65mm wheel diameter
  readonly trackWidth = 0.16; // 16cm between left and right wheels
  readonly baseMaxSpeed = 0.55; // m/s at 1.0x

  // Wheel spin rotation angles (radians) for mesh animation
  leftWheelRotation = 0;
  rightWheelRotation = 0;

  // Arena boundaries (+/- 4.5m)
  arenaBounds = { minX: -4.5, maxX: 4.5, minZ: -4.5, maxZ: 4.5 };

  // Track waypoints loop
  trackPath: PathWaypoint[] = [];
  totalTrackLength = 0;

  // Active obstacles placed on the road
  obstacles: Obstacle[] = [];

  currentArenaId: ArenaId = 'road';

  // State tracker for smooth waypoint index tracking
  private lastClosestIdx = 0;

  constructor() {
    this.generateTrackPath();
  }

  // Generates a smooth, continuous closed racetrack circuit
  private generateTrackPath() {
    this.trackPath = [];
    const straightLen = 3.6;
    const R = 2.0;
    const straightHalf = straightLen / 2; // 1.8
    const straightPoints = 70;
    const curvePoints = 90;

    let accumulatedDist = 0;
    const rawPoints: { x: number; z: number; tX: number; tZ: number }[] = [];

    // 1. Top Straight: (-1.8, -R) -> (+1.8, -R), moving towards +X
    for (let i = 0; i < straightPoints; i++) {
      const t = i / straightPoints;
      const x = -straightHalf + t * straightLen;
      const z = -R;
      rawPoints.push({ x, z, tX: 1, tZ: 0 });
    }

    // 2. Right Curve: center at (1.8, 0), angle from -PI/2 to +PI/2
    for (let i = 0; i < curvePoints; i++) {
      const t = i / curvePoints;
      const angle = -Math.PI / 2 + t * Math.PI; // -90 deg to +90 deg
      const x = straightHalf + Math.cos(angle) * R;
      const z = Math.sin(angle) * R;
      // Tangent is perpendicular to radius: (-sin(angle), cos(angle))
      const tX = -Math.sin(angle);
      const tZ = Math.cos(angle);
      rawPoints.push({ x, z, tX, tZ });
    }

    // 3. Bottom Straight: (+1.8, +R) -> (-1.8, +R), moving towards -X
    for (let i = 0; i < straightPoints; i++) {
      const t = i / straightPoints;
      const x = straightHalf - t * straightLen;
      const z = R;
      rawPoints.push({ x, z, tX: -1, tZ: 0 });
    }

    // 4. Left Curve: center at (-1.8, 0), angle from +PI/2 to +3PI/2
    for (let i = 0; i < curvePoints; i++) {
      const t = i / curvePoints;
      const angle = Math.PI / 2 + t * Math.PI; // +90 deg to +270 deg
      const x = -straightHalf + Math.cos(angle) * R;
      const z = Math.sin(angle) * R;
      const tX = -Math.sin(angle);
      const tZ = Math.cos(angle);
      rawPoints.push({ x, z, tX, tZ });
    }

    for (let i = 0; i < rawPoints.length; i++) {
      const curr = rawPoints[i];
      const next = rawPoints[(i + 1) % rawPoints.length];
      const segLen = Math.hypot(next.x - curr.x, next.z - curr.z);

      // Normal vector is 90 deg clockwise from tangent: (-tZ, tX)
      const len = Math.hypot(curr.tX, curr.tZ) || 1;
      const normTX = curr.tX / len;
      const normTZ = curr.tZ / len;

      this.trackPath.push({
        x: curr.x,
        z: curr.z,
        tangentX: normTX,
        tangentZ: normTZ,
        normalX: -normTZ,
        normalZ: normTX,
        distanceAlongTrack: accumulatedDist,
      });

      accumulatedDist += segLen;
    }
    this.totalTrackLength = accumulatedDist;
  }

  public setArena(arenaId: ArenaId) {
    this.currentArenaId = arenaId;
    this.obstacles = [];

    if (arenaId === 'obstacles') {
      // 4 Realistic Obstacles spaced along the circuit
      const rawObstacles: Omit<Obstacle, 'trackDist'>[] = [
        // Obstacle 1: Crate on top straight, slightly right of yellow dashed line
        { x: 0.0, z: -1.82, radius: 0.18, type: 'box', label: 'Thùng Gỗ #1', dodgeSide: -1 },

        // Obstacle 2: Warning cone on apex of right curve, inside of curve
        { x: 3.65, z: 0.20, radius: 0.16, type: 'cone', label: 'Nón Tiêu #2', dodgeSide: -1 },

        // Obstacle 3: Industrial barrel on bottom straight, slightly right of track
        { x: 0.0, z: 1.82, radius: 0.18, type: 'barrel', label: 'Thùng Phuy #3', dodgeSide: -1 },

        // Obstacle 4: Warning cone on left curve apex, inside of curve
        { x: -3.65, z: -0.20, radius: 0.16, type: 'cone', label: 'Nón Tiêu #4', dodgeSide: -1 },
      ];

      // Pre-calculate track distance for each obstacle
      this.obstacles = rawObstacles.map((obs) => {
        let bestIdx = 0;
        let minDist = Infinity;
        for (let i = 0; i < this.trackPath.length; i++) {
          const pt = this.trackPath[i];
          const d = Math.hypot(obs.x - pt.x, obs.z - pt.z);
          if (d < minDist) {
            minDist = d;
            bestIdx = i;
          }
        }
        return {
          ...obs,
          trackDist: this.trackPath[bestIdx].distanceAlongTrack,
        };
      });
    }
  }

  public update(state: RobotState, dt: number): void {
    const speedMult = state.telemetry.speedMultiplier || 1.0;
    const currentMaxSpeed = this.baseMaxSpeed * speedMult;

    // 1. Motor Inertia Smoothing
    const inertia = Math.min(1.0, dt * 16);
    state.leftMotor.currentSpeed += (state.leftMotor.targetSpeed - state.leftMotor.currentSpeed) * inertia;
    state.rightMotor.currentSpeed += (state.rightMotor.targetSpeed - state.rightMotor.currentSpeed) * inertia;

    // Linear wheel speeds (m/s)
    const vL = state.leftMotor.currentSpeed * currentMaxSpeed;
    const vR = state.rightMotor.currentSpeed * currentMaxSpeed;

    // RPM calculations
    const maxRpm = Math.round(180 * speedMult);
    state.leftMotor.rpm = Math.round(state.leftMotor.currentSpeed * maxRpm);
    state.rightMotor.rpm = Math.round(state.rightMotor.currentSpeed * maxRpm);

    // Forward linear speed v (m/s)
    const v = (vL + vR) / 2;

    // Angular velocity omega (rad/s)
    // Turning right: vL > vR -> theta decreases (omega < 0)
    // Turning left: vR > vL -> theta increases (omega > 0)
    const omega = (vR - vL) / this.trackWidth;

    // 2. Pose Kinematics Integration
    state.pose.theta += omega * dt;

    // Normalize theta to [-PI, PI]
    while (state.pose.theta > Math.PI) state.pose.theta -= Math.PI * 2;
    while (state.pose.theta < -Math.PI) state.pose.theta += Math.PI * 2;

    // In 3D: forward direction along angle theta (theta = 0 points along -Z, theta = -PI/2 points along +X)
    const dx = -Math.sin(state.pose.theta) * v * dt;
    const dz = -Math.cos(state.pose.theta) * v * dt;

    let nextX = state.pose.x + dx;
    let nextZ = state.pose.z + dz;

    // 3. Physical Obstacle Collisions
    const robotRadius = 0.11;
    for (const obs of this.obstacles) {
      const dist = Math.hypot(nextX - obs.x, nextZ - obs.z);
      const minDist = robotRadius + obs.radius;
      if (dist < minDist) {
        // Push robot away gently
        const pushAngle = Math.atan2(nextZ - obs.z, nextX - obs.x);
        nextX = obs.x + Math.cos(pushAngle) * minDist;
        nextZ = obs.z + Math.sin(pushAngle) * minDist;
      }
    }

    // Boundary walls check (+/- 4.5m)
    nextX = Math.max(this.arenaBounds.minX + robotRadius, Math.min(this.arenaBounds.maxX - robotRadius, nextX));
    nextZ = Math.max(this.arenaBounds.minZ + robotRadius, Math.min(this.arenaBounds.maxZ - robotRadius, nextZ));

    state.pose.x = nextX;
    state.pose.z = nextZ;

    // 4. Wheel Meshes Rotation
    this.leftWheelRotation += (vL * dt) / this.wheelRadius;
    this.rightWheelRotation += (vR * dt) / this.wheelRadius;

    // 5. Update Telemetry
    state.telemetry.linearVelocity = v;
    state.telemetry.angularVelocity = omega;
    state.telemetry.headingDegrees = ((state.pose.theta * 180) / Math.PI + 360) % 360;
    state.telemetry.leftMotorRpm = state.leftMotor.rpm;
    state.telemetry.rightMotorRpm = state.rightMotor.rpm;
    state.telemetry.distanceTraveled += Math.abs(v * dt);

    // Battery & GPU stats
    if (Math.abs(v) > 0.01) {
      state.telemetry.gpuLoad = Math.min(95, Math.round(30 + Math.abs(v / currentMaxSpeed) * 55));
    } else {
      state.telemetry.gpuLoad = 22;
    }

    // 6. AI Perception & Autonomous Controller
    this.updateAIAndAutonomous(state, dt);
  }

  private updateAIAndAutonomous(state: RobotState, _dt: number) {
    if (this.trackPath.length === 0) return;

    // Robot orientation vectors in 3D world
    const forwardX = -Math.sin(state.pose.theta);
    const forwardZ = -Math.cos(state.pose.theta);
    const rightX = Math.cos(state.pose.theta);
    const rightZ = -Math.sin(state.pose.theta);

    const N = this.trackPath.length;

    // 1. Closest Waypoint Search
    // Local window search around lastClosestIdx to guarantee monotonic smooth progress
    let bestIdx = this.lastClosestIdx;
    let minDistSq = Infinity;

    for (let offset = -25; offset <= 35; offset++) {
      const idx = (this.lastClosestIdx + offset + N) % N;
      const pt = this.trackPath[idx];
      const distSq = (pt.x - state.pose.x) ** 2 + (pt.z - state.pose.z) ** 2;
      if (distSq < minDistSq) {
        minDistSq = distSq;
        bestIdx = idx;
      }
    }

    // Fallback: If robot is far off (> 1.2m), do a full global search
    if (minDistSq > 1.44) {
      for (let i = 0; i < N; i++) {
        const pt = this.trackPath[i];
        const distSq = (pt.x - state.pose.x) ** 2 + (pt.z - state.pose.z) ** 2;
        if (distSq < minDistSq) {
          minDistSq = distSq;
          bestIdx = i;
        }
      }
    }

    this.lastClosestIdx = bestIdx;
    const closestPt = this.trackPath[bestIdx];

    // 2. Obstacle Detection for Camera View & Collision Probability
    let nearestObstacleDist = 999.0;
    let visualObstacle: Obstacle | null = null;

    for (const obs of this.obstacles) {
      const toObsX = obs.x - state.pose.x;
      const toObsZ = obs.z - state.pose.z;
      const dist = Math.hypot(toObsX, toObsZ);

      // Check if obstacle is ahead within forward cone (dot > 0.1)
      const dot = (toObsX * forwardX + toObsZ * forwardZ) / (dist || 1);
      if (dot > 0.1 && dist < 2.0) {
        if (dist < nearestObstacleDist) {
          nearestObstacleDist = dist;
          visualObstacle = obs;
        }
      }
    }

    // Simulated ResNet-18 collision probability
    if (nearestObstacleDist < 0.85) {
      state.aiProbBlocked = Math.min(1.0, 0.45 + (0.85 - nearestObstacleDist) * 1.8);
    } else {
      state.aiProbBlocked = Math.max(0.02, 1.0 / (1.0 + nearestObstacleDist * 4.0));
    }

    // 3. Dynamic Lookahead Point on Track Path
    const currentSpeed = Math.abs(state.telemetry.linearVelocity) || 0.3;
    const lookaheadDistance = Math.max(0.34, Math.min(0.52, 0.28 + currentSpeed * 0.22));

    let targetIdx = bestIdx;
    let accumulatedDist = 0;
    while (accumulatedDist < lookaheadDistance) {
      const nextIdx = (targetIdx + 1) % N;
      const p1 = this.trackPath[targetIdx];
      const p2 = this.trackPath[nextIdx];
      accumulatedDist += Math.hypot(p2.x - p1.x, p2.z - p1.z);
      targetIdx = nextIdx;
    }

    const targetPt = this.trackPath[targetIdx];
    let targetX = targetPt.x;
    let targetZ = targetPt.z;

    // 4. Smooth Obstacle Avoidance Lateral Shift
    if (this.currentArenaId === 'obstacles' && this.obstacles.length > 0) {
      const currTrackDist = closestPt.distanceAlongTrack;

      for (const obs of this.obstacles) {
        let relDist = obs.trackDist - currTrackDist;
        if (relDist < -this.totalTrackLength / 2) relDist += this.totalTrackLength;
        if (relDist > this.totalTrackLength / 2) relDist -= this.totalTrackLength;

        // Influence zone: from 1.8m ahead down to -0.4m behind
        if (relDist >= -0.4 && relDist <= 1.8) {
          let smooth = 0;
          if (relDist > 0.4) {
            // Smooth sinusoidal approach ramp from 1.8m down to 0.4m
            const tRamp = (1.8 - relDist) / 1.4;
            smooth = Math.sin((tRamp * Math.PI) / 2);
          } else if (relDist >= -0.1) {
            // Full clearance while passing obstacle
            smooth = 1.0;
          } else {
            // Smooth ramp down from -0.1m to -0.4m after passing
            const tRamp = (relDist - -0.4) / 0.3;
            smooth = Math.sin((tRamp * Math.PI) / 2);
          }

          const dodgeAmount = 0.32 * smooth * obs.dodgeSide;
          targetX += targetPt.normalX * dodgeAmount;
          targetZ += targetPt.normalZ * dodgeAmount;
          break; // apply closest active obstacle
        }
      }
    }

    // 5. Target Point in Robot Local Frame
    const toTargetX = targetX - state.pose.x;
    const toTargetZ = targetZ - state.pose.z;

    const localForward = forwardX * toTargetX + forwardZ * toTargetZ;
    const localRight = rightX * toTargetX + rightZ * toTargetZ;

    // Normalized Camera Target Point: x in [-1, 1], y in [0, 1]
    const normX = Math.max(-1, Math.min(1, localRight / 0.45));
    const normY = Math.max(0.1, Math.min(1, localForward / 1.5));
    state.aiTargetPoint = { x: normX, y: normY };

    // 6. Pure Pursuit Steering Angle alpha
    const L = Math.hypot(localForward, localRight) || 0.01;
    const alpha = Math.atan2(localRight, Math.max(0.02, localForward));
    state.aiRoadSteering = Math.max(-1.0, Math.min(1.0, alpha / 0.8));

    // Detected objects for camera bounding boxes
    state.detectedObjects = [];
    if (this.currentArenaId === 'obstacles' && visualObstacle) {
      const d = Math.hypot(visualObstacle.x - state.pose.x, visualObstacle.z - state.pose.z);
      state.detectedObjects.push({
        label: visualObstacle.label,
        confidence: Math.round(92 + Math.random() * 7),
        x: (normX + 1) / 2,
        y: 0.55,
        w: Math.max(0.18, 0.42 / d),
        h: Math.max(0.18, 0.42 / d),
      });
    }

    // 7. AUTONOMOUS CONTROLLER DRIVE
    if (state.autonomousMode !== 'none') {
      // Differential drive Pure Pursuit curvature: kappa = 2*localRight / (L^2)
      // omega = v * kappa
      // steerTerm = (localRight * trackWidth) / (L^2)
      let steerTerm = (localRight * this.trackWidth) / (L * L);
      steerTerm = Math.max(-0.85, Math.min(0.85, steerTerm * 1.6));

      // Base cruise speed
      const baseCruise = 0.50;

      // Curve speed adaptation: gently slow down if turning sharply
      const turnSeverity = Math.min(1.0, Math.abs(alpha));
      const turnFactor = Math.max(0.65, 1.0 - turnSeverity * 0.45);
      const vCruise = baseCruise * turnFactor;

      // If target is behind robot (e.g. after manual spin), turn in-place towards track
      if (localForward < 0) {
        const turnDir = localRight >= 0 ? 0.5 : -0.5;
        state.leftMotor.targetSpeed = turnDir;
        state.rightMotor.targetSpeed = -turnDir;
      } else {
        // Normal Pure Pursuit differential drive
        state.leftMotor.targetSpeed = Math.max(-1.0, Math.min(1.0, vCruise * (1.0 + steerTerm)));
        state.rightMotor.targetSpeed = Math.max(-1.0, Math.min(1.0, vCruise * (1.0 - steerTerm)));
      }
    }
  }

  public resetRobot(state: RobotState, arenaId: ArenaId) {
    state.leftMotor.targetSpeed = 0;
    state.leftMotor.currentSpeed = 0;
    state.leftMotor.rpm = 0;
    state.rightMotor.targetSpeed = 0;
    state.rightMotor.currentSpeed = 0;
    state.rightMotor.rpm = 0;

    // Place robot at start of top straight (-1.8, -2.0) directly on yellow dashed line facing +X (theta = -PI/2)
    state.pose.x = -1.8;
    state.pose.z = -2.0;
    state.pose.theta = -Math.PI / 2; // facing right (+X direction, along the track)

    this.lastClosestIdx = 0;
    state.telemetry.linearVelocity = 0;
    state.telemetry.angularVelocity = 0;
    state.telemetry.distanceTraveled = 0;
    state.autonomousMode = 'none';
    this.setArena(arenaId);
  }
}
