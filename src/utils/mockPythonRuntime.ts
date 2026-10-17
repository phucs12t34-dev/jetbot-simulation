import { RobotState } from '../types/jetbot';
import { soundFx } from './audio';

export interface ExecutionResult {
  success: boolean;
  stdout: string;
  stderr?: string;
  outputWidget?: 'motion_sim' | 'gamepad' | 'sliders' | 'camera' | 'collision_sim' | 'road_sim' | 'oled_sim';
}

export class MockPythonRuntime {
  public async executeCode(code: string, robotState: RobotState): Promise<ExecutionResult> {
    soundFx.playExecuteCell();

    const lines = code
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('#'));

    const logs: string[] = [];
    const log = (msg: string) => logs.push(msg);

    try {
      // 1. Collision avoidance autonomous loop
      if (code.includes('prob_blocked') || code.includes('collision_avoidance') || code.includes('best_model_trt')) {
        robotState.autonomousMode = 'collision';
        log('[PyTorch 1.8.0 / TensorRT 7.1] Loading optimized engine: resnet18_trt.pth ...');
        log('CUDA device 0: NVIDIA Tegra X1 (Maxwell 128 CUDA cores)');
        log('Allocating TensorRT GPU memory context: 48.2 MB');
        log('Autonomous Collision Avoidance Loop started!');
        log('>>> Real-time inference running at ~45 FPS on Jetson Nano TensorRT FP16 engine');
        log('>>> Phân loại nhị phân: Free (Tiến) vs Blocked (Né vật cản)');
        return {
          success: true,
          stdout: logs.join('\n'),
          outputWidget: 'collision_sim',
        };
      }

      // 2. Road following autonomous loop
      if (code.includes('road_following') || code.includes('steering_gain') || code.includes('atan2')) {
        robotState.autonomousMode = 'road';
        log('[PyTorch / TensorRT] Loading Road Following Regression Engine: best_steering_model_xy_trt.pth');
        log('Warming up TensorRT execution context for 224x224 RGB input...');
        log('PID Controller initialized: Kp = 0.55, Kd = 0.12, base_speed = 0.35');
        log('Autonomous Road Following Loop started!');
        log('>>> Dự đoán toạ độ (x, y) trên vạch tim đường và điều khiển vi sai 2 bánh bám làn.');
        return {
          success: true,
          stdout: logs.join('\n'),
          outputWidget: 'road_sim',
        };
      }

      // 3. OLED stats demo
      if (code.includes('SSD1306') || code.includes('stats.py') || code.includes('disp.begin')) {
        robotState.oledText = [
          'NVIDIA JETBOT v2',
          `IP: 192.168.1.105`,
          `RAM: ${robotState.telemetry.ramUsedGb}G / 4.0G`,
          `GPU: ${robotState.telemetry.gpuLoad}% | ${robotState.telemetry.gpuTemp.toFixed(1)}C`,
        ];
        log('[SSD1306 OLED Display] I2C Bus 1 address 0x3C initialized.');
        log('Writing telemetry frames: IP, Memory, GPU stats to 128x32 OLED.');
        return {
          success: true,
          stdout: logs.join('\n'),
          outputWidget: 'oled_sim',
        };
      }

      // 4. Camera streaming widget
      if (code.includes('Camera.instance') || code.includes('widgets.Image')) {
        log('Camera instance initialized: Sony IMX219 (MIPI CSI-2 GStreamer pipeline)');
        log('Streaming 224x224 JPEG at 30 FPS via traitlets Image widget.');
        return {
          success: true,
          stdout: logs.join('\n'),
          outputWidget: 'camera',
        };
      }

      // 5. Gamepad controller widget
      if (code.includes('widgets.Controller') || code.includes('traitlets.dlink')) {
        log('Loaded ipywidgets.Controller(index=0)');
        log('Traitlets: Directional link established between Gamepad axes and Robot motor values.');
        log('Differential drive teleoperation active!');
        return {
          success: true,
          stdout: logs.join('\n'),
          outputWidget: 'gamepad',
        };
      }

      // 6. Stop command
      if (code.includes('robot.stop()')) {
        robotState.leftMotor.targetSpeed = 0;
        robotState.rightMotor.targetSpeed = 0;
        robotState.autonomousMode = 'none';
        log('robot.stop() -> Left Motor: 0.0, Right Motor: 0.0 [Stopped]');
        return {
          success: true,
          stdout: logs.join('\n'),
          outputWidget: 'motion_sim',
        };
      }

      // 7. Motion commands: forward, backward, left, right, set_motors
      if (code.includes('forward')) {
        const match = code.match(/forward\(\s*([0-9.]+)?\s*\)/);
        const speed = match && match[1] ? parseFloat(match[1]) : 0.4;
        robotState.leftMotor.targetSpeed = speed;
        robotState.rightMotor.targetSpeed = speed;
        log(`robot.forward(speed=${speed}) -> Left: ${speed}, Right: ${speed} [TIẾN]`);

        if (code.includes('sleep') && code.includes('stop')) {
          setTimeout(() => {
            robotState.leftMotor.targetSpeed = 0;
            robotState.rightMotor.targetSpeed = 0;
          }, 1500);
        }
        return {
          success: true,
          stdout: logs.join('\n'),
          outputWidget: 'motion_sim',
        };
      }

      if (code.includes('backward')) {
        const match = code.match(/backward\(\s*([0-9.]+)?\s*\)/);
        const speed = match && match[1] ? parseFloat(match[1]) : 0.4;
        robotState.leftMotor.targetSpeed = -speed;
        robotState.rightMotor.targetSpeed = -speed;
        log(`robot.backward(speed=${speed}) -> Left: -${speed}, Right: -${speed} [LÙI]`);
        if (code.includes('sleep') && code.includes('stop')) {
          setTimeout(() => {
            robotState.leftMotor.targetSpeed = 0;
            robotState.rightMotor.targetSpeed = 0;
          }, 1500);
        }
        return {
          success: true,
          stdout: logs.join('\n'),
          outputWidget: 'motion_sim',
        };
      }

      if (code.includes('left(')) {
        const match = code.match(/left\(\s*([0-9.]+)?\s*\)/);
        const speed = match && match[1] ? parseFloat(match[1]) : 0.35;
        robotState.leftMotor.targetSpeed = -speed;
        robotState.rightMotor.targetSpeed = speed;
        log(`robot.left(speed=${speed}) -> Left: -${speed}, Right: +${speed} [QUAY TRÁI]`);
        if (code.includes('sleep') && code.includes('stop')) {
          setTimeout(() => {
            robotState.leftMotor.targetSpeed = 0;
            robotState.rightMotor.targetSpeed = 0;
          }, 1200);
        }
        return {
          success: true,
          stdout: logs.join('\n'),
          outputWidget: 'motion_sim',
        };
      }

      if (code.includes('right(')) {
        const match = code.match(/right\(\s*([0-9.]+)?\s*\)/);
        const speed = match && match[1] ? parseFloat(match[1]) : 0.35;
        robotState.leftMotor.targetSpeed = speed;
        robotState.rightMotor.targetSpeed = -speed;
        log(`robot.right(speed=${speed}) -> Left: +${speed}, Right: -${speed} [QUAY PHẢI]`);
        if (code.includes('sleep') && code.includes('stop')) {
          setTimeout(() => {
            robotState.leftMotor.targetSpeed = 0;
            robotState.rightMotor.targetSpeed = 0;
          }, 1200);
        }
        return {
          success: true,
          stdout: logs.join('\n'),
          outputWidget: 'motion_sim',
        };
      }

      if (code.includes('set_motors')) {
        const match = code.match(/set_motors\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/);
        if (match) {
          const l = parseFloat(match[1]);
          const r = parseFloat(match[2]);
          robotState.leftMotor.targetSpeed = l;
          robotState.rightMotor.targetSpeed = r;
          log(`robot.set_motors(left=${l}, right=${r}) -> Điều khiển vi sai cung tròn.`);
          if (code.includes('sleep') && code.includes('stop')) {
            setTimeout(() => {
              robotState.leftMotor.targetSpeed = 0;
              robotState.rightMotor.targetSpeed = 0;
            }, 2000);
          }
          return {
            success: true,
            stdout: logs.join('\n'),
            outputWidget: 'motion_sim',
          };
        }
      }

      // Robot() instantiate
      if (code.includes('Robot()')) {
        log('Connecting to Adafruit Motor FeatherWing at I2C address 0x60...');
        log('PCA9685 16-channel PWM driver initialized @ 1600 Hz.');
        log('robot = Robot() instantiated successfully.');
        return {
          success: true,
          stdout: logs.join('\n'),
          outputWidget: 'motion_sim',
        };
      }

      log(`Executed ${lines.length} statement(s) successfully.`);
      lines.forEach((l) => {
        if (l.includes('print(')) {
          const match = l.match(/print\((.*)\)/);
          if (match) log(match[1].replace(/['"]/g, ''));
        }
      });
      return {
        success: true,
        stdout: logs.join('\n'),
        outputWidget: 'motion_sim',
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        stdout: logs.join('\n'),
        stderr: `Traceback (most recent call last):\n  File "<ipython-input>", line 1\nException: ${msg}`,
      };
    }
  }
}

export const pythonRuntime = new MockPythonRuntime();
