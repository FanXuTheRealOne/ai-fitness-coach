import { PoseFrame } from "./keypoints";

/**
 * 平台无关的姿态推理接口。Web 实现见 PoseProvider.web.ts（MediaPipe）；
 * iOS 迁移时新增 PoseProvider.native.ts（vision-camera frame processor）。
 */
export interface PoseProvider {
  init(): Promise<void>;
  /** 对一帧视频做姿态检测，返回图像坐标 + 3D world 坐标；未检测到人时返回 null。 */
  detect(video: unknown, timestampMs: number): PoseFrame | null;
  close(): void;
}
