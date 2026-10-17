export type ViewMode = 'anatomy' | 'arena' | 'jupyter' | 'teleop';

export type ArenaId = 'road' | 'obstacles';

export type AutonomousMode = 'none' | 'road' | 'collision';

export interface MotorState {
  targetSpeed: number; // -1.0 to 1.0
  currentSpeed: number; // with inertia
  rpm: number;
}

export interface RobotPose {
  x: number; // meters in arena
  z: number; // meters in arena (y is up in Three.js)
  theta: number; // radians heading angle
}

export interface Telemetry {
  linearVelocity: number; // m/s
  angularVelocity: number; // rad/s
  headingDegrees: number;
  leftMotorRpm: number;
  rightMotorRpm: number;
  batteryVoltage: number; // Volts (nominal 7.4V, max 8.4V)
  batteryPercent: number; // %
  gpuTemp: number; // °C (e.g. 42.5°C)
  gpuLoad: number; // % (0-100%)
  cpuLoad: number; // %
  ramUsedGb: number; // e.g. 1.4
  ramTotalGb: number; // 4.0
  distanceTraveled: number; // meters
  fps: number;
  speedMultiplier: number; // 1x to 3x
}

export interface RobotState {
  connected: boolean;
  leftMotor: MotorState;
  rightMotor: MotorState;
  pose: RobotPose;
  telemetry: Telemetry;
  autonomousMode: AutonomousMode;
  oledText: string[];
  cameraFps: number;
  aiProbBlocked: number; // 0.0 to 1.0
  aiRoadSteering: number; // -1.0 to 1.0
  aiTargetPoint: { x: number; y: number }; // normalized -1..1, 0..1
  detectedObjects: Array<{ label: string; confidence: number; x: number; y: number; w: number; h: number }>;
}

export interface JetBotComponent {
  id: string;
  name: string;
  nameVi: string;
  category: 'compute' | 'motor' | 'vision' | 'power' | 'chassis' | 'display';
  summaryVi: string;
  descriptionVi: string;
  specs: { [key: string]: string };
  pinConnections: Array<{ pin: string; functionVi: string; protocol: string }>;
  educationalRoleVi: string;
  explodePosition: [number, number, number];
}

export type WidgetType =
  | 'motion_sim'
  | 'gamepad'
  | 'sliders'
  | 'camera'
  | 'collision_sim'
  | 'road_sim'
  | 'oled_sim'
  | string;

export interface NotebookCell {
  id: string;
  type: 'code' | 'markdown';
  source: string;
  output?: string;
  outputType?: 'text' | 'image' | 'error' | 'widget';
  widgetType?: WidgetType;
  outputWidget?: WidgetType;
  isRunning?: boolean;
  executionCount?: number | null;
}

export interface JupyterNotebook {
  id: string;
  title: string;
  titleVi: string;
  filename: string;
  descriptionVi: string;
  levelVi: string;
  cells: NotebookCell[];
}

export interface LessonSlide {
  id: number;
  titleVi: string;
  titleEn: string;
  categoryVi: string;
  summaryVi: string;
  bulletPointsVi: string[];
  formula?: {
    tex: string;
    explanationVi: string;
  };
  hardwareFocus?: string;
  jupyterLinkNotebookId?: string;
  teacherTipsVi: string;
}
