import React, { useEffect, useRef } from "react";
// react-native-web 提供的逃生口：把任意 DOM 元素当作 RN 组件渲染。
import { unstable_createElement } from "react-native-web";

/**
 * Web 摄像头取流：渲染一个铺满的 <video>，通过 getUserMedia 接前置摄像头，
 * 就绪后把 video DOM 元素回传给上层（喂给 MediaPipe）。默认镜像显示（自拍视角）。
 */
export function CameraViewWeb({
  onReady,
  onError,
  mirror = true,
}: {
  onReady: (video: HTMLVideoElement) => void;
  onError: (kind: "denied" | "error", message: string) => void;
  mirror?: boolean;
}) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const v = ref.current;
        if (v) {
          v.srcObject = stream;
          await v.play();
          onReady(v);
        }
      } catch (e: any) {
        const denied = e?.name === "NotAllowedError" || e?.name === "SecurityError";
        const msg = e?.message || e?.name || (typeof e === "string" ? e : "摄像头不可用");
        onError(denied ? "denied" : "error", msg);
      }
    })();
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return unstable_createElement("video", {
    ref,
    autoPlay: true,
    playsInline: true,
    muted: true,
    style: {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
      transform: mirror ? "scaleX(-1)" : "none",
    },
  });
}
