import { Pose, PoseFrame } from "./keypoints";
import { PoseProvider } from "./PoseProvider";

type LandmarkLike = { x: number; y: number; z?: number; visibility?: number };
type VisionModule = {
  FilesetResolver: {
    forVisionTasks(url: string): Promise<unknown>;
  };
  PoseLandmarker: {
    createFromOptions(fileset: unknown, options: unknown): Promise<PoseLandmarkerLike>;
  };
};
type PoseLandmarkerLike = {
  detectForVideo(video: HTMLVideoElement, timestampMs: number): {
    landmarks?: LandmarkLike[][];
    worldLandmarks?: LandmarkLike[][];
  };
  close(): void;
};

const toPose = (lm: LandmarkLike[]): Pose =>
  lm.map((p) => ({ x: p.x, y: p.y, z: p.z, visibility: p.visibility }));

const VERSION = "0.10.35";
const CDN = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VERSION}`;
const WASM_URL = `${CDN}/wasm`;
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

// MediaPipe 的 ESM bundle 含 Metro 无法静态分析的动态 import，因此不通过打包引入，
// 改为运行时从 CDN 动态加载。用 Function 包裹 import() 以绕过 Metro 的依赖收集。
// （类型仍来自 npm 包的 `import type`，会在编译期被擦除，不进 bundle。）
let visionPromise: Promise<VisionModule> | null = null;
function loadVision(): Promise<VisionModule> {
  if (!visionPromise) {
    const url = `${CDN}/vision_bundle.mjs`;
    const dynamicImport = new Function("u", "return import(u)") as (u: string) => Promise<VisionModule>;
    visionPromise = dynamicImport(url);
  }
  return visionPromise;
}

/** Web 端姿态推理：MediaPipe PoseLandmarker（BlazePose lite，VIDEO 模式，单人）。 */
export function createPoseProvider(): PoseProvider {
  let landmarker: PoseLandmarkerLike | null = null;

  return {
    async init() {
      const vision = await loadVision();
      const fileset = await vision.FilesetResolver.forVisionTasks(WASM_URL);
      const make = (delegate: "GPU" | "CPU") =>
        vision.PoseLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate },
          runningMode: "VIDEO",
          numPoses: 1,
        });
      // 优先 GPU（WebGL），不可用时回退 CPU（无 WebGL 的环境也能跑）。
      try {
        landmarker = await make("GPU");
      } catch {
        landmarker = await make("CPU");
      }
    },

    detect(video: unknown, timestampMs: number): PoseFrame | null {
      if (!landmarker) return null;
      const res = landmarker.detectForVideo(video as HTMLVideoElement, timestampMs);
      const img = res.landmarks?.[0];
      const world = res.worldLandmarks?.[0];
      if (!img || !world) return null;
      return { landmarks: toPose(img), world: toPose(world) };
    },

    close() {
      landmarker?.close();
      landmarker = null;
    },
  };
}
