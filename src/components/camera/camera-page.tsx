"use client";
import React, { useEffect, useRef, useState } from "react";
import { useApp, clock } from "@/components/fit/app-state";
import { CameraViewWeb } from "@/pose/CameraView.web";
import { useDetection } from "@/pose/useDetection.web";
import { SKELETON_EDGES, JOINT_POINTS } from "@/pose/keypoints";
import type { Pose } from "@/pose/keypoints";
import { CloseIcon, BoltIcon, VolumeIcon, PauseIcon, PlayIcon } from "@/components/fit/icons";
import { colors } from "@/lib/theme/colors";

/** 骨架按视频 cover 的裁剪+缩放精确映射并镜像，贴合画面里的人。 */
function Skeleton({ pose, ok, cw, ch, vw, vh }: { pose: Pose; ok: boolean; cw: number; ch: number; vw: number; vh: number }) {
  const color = ok ? colors.lime : colors.orange;
  const vis = (i: number) => (pose[i]?.visibility ?? 1) > 0.3;
  const scale = Math.max(cw / vw, ch / vh);
  const dw = vw * scale;
  const dh = vh * scale;
  const ox = (cw - dw) / 2;
  const oy = (ch - dh) / 2;
  const X = (nx: number) => cw - (nx * dw + ox);
  const Y = (ny: number) => ny * dh + oy;
  return (
    <div className="absolute inset-0 z-[4] pointer-events-none">
      <svg width={cw} height={ch} viewBox={`0 0 ${cw} ${ch}`}>
        {SKELETON_EDGES.map(([a, b], i) =>
          vis(a) && vis(b) ? (
            <line key={`e${i}`} x1={X(pose[a].x)} y1={Y(pose[a].y)} x2={X(pose[b].x)} y2={Y(pose[b].y)} stroke={color} strokeWidth={4} strokeLinecap="round" />
          ) : null
        )}
        {JOINT_POINTS.map((j, i) => (vis(j) ? <circle key={`j${i}`} cx={X(pose[j].x)} cy={Y(pose[j].y)} r={5} fill={color} /> : null))}
      </svg>
    </div>
  );
}

function StatusOverlay({ status, message }: { status: string; message: string | null }) {
  const title = status === "loading" ? "正在加载识别模型…" : status === "denied" ? "需要摄像头权限" : "无法启动摄像头";
  const sub =
    status === "loading"
      ? "首次需联网下载模型，请稍候"
      : status === "denied"
        ? "请在浏览器允许摄像头访问后刷新"
        : message ?? "请检查摄像头设备";
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center px-9 text-center" style={{ background: "rgba(4,4,4,0.86)" }}>
      <span className="text-white text-[18px] font-extrabold">{title}</span>
      <span className="text-fit-muted text-[13px] mt-[10px] leading-[19px]">{sub}</span>
    </div>
  );
}

export function CameraPage() {
  const { navigate, setSummary } = useApp();
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const [vid, setVid] = useState({ w: 0, h: 0 });
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const { ui, onCameraError, finish } = useDetection(video, paused, muted);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const update = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onReady = (v: HTMLVideoElement) => {
    setVideo(v);
    const read = () => setVid({ w: v.videoWidth || 1280, h: v.videoHeight || 720 });
    if (v.videoWidth) read();
    else v.addEventListener("loadedmetadata", read, { once: true });
  };

  const exit = () => {
    setSummary(finish());
    navigate("session");
  };

  const corner = "absolute w-[28px] h-[28px] z-[6]";
  const cBorder = "rgba(196,240,0,0.4)";

  return (
    <div ref={boxRef} className="absolute inset-0 bg-[#040404] overflow-hidden anim-fadeIn">
      <CameraViewWeb onReady={onReady} onError={onCameraError} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "rgba(4,4,4,0.35)" }} />

      {/* 扫描线 */}
      <div className="absolute left-0 right-0 h-[1.5px] z-[5] pointer-events-none" style={{ top: 0, background: "rgba(196,240,0,0.5)", animation: "scanLine 3s linear infinite" }} />

      {/* 角标 */}
      <div className={corner} style={{ top: 70, left: 24, borderTop: `2px solid ${cBorder}`, borderLeft: `2px solid ${cBorder}`, borderTopLeftRadius: 4 }} />
      <div className={corner} style={{ top: 70, right: 24, borderTop: `2px solid ${cBorder}`, borderRight: `2px solid ${cBorder}`, borderTopRightRadius: 4 }} />
      <div className={corner} style={{ bottom: 155, left: 24, borderBottom: `2px solid ${cBorder}`, borderLeft: `2px solid ${cBorder}`, borderBottomLeftRadius: 4 }} />
      <div className={corner} style={{ bottom: 155, right: 24, borderBottom: `2px solid ${cBorder}`, borderRight: `2px solid ${cBorder}`, borderBottomRightRadius: 4 }} />

      {/* 骨架 */}
      {ui.personVisible && ui.pose && box.w > 0 && vid.w > 0 && (
        <Skeleton pose={ui.pose} ok={ui.formOk} cw={box.w} ch={box.h} vw={vid.w} vh={vid.h} />
      )}

      {/* 顶栏 */}
      <div className="absolute top-[56px] left-0 right-0 px-5 flex items-center justify-between z-10">
        <button data-control-id="camera-exit" onClick={exit} className="w-[38px] h-[38px] rounded-full flex items-center justify-center backdrop-blur" style={{ background: "rgba(255,255,255,0.1)" }}>
          <CloseIcon size={18} color="#fff" />
        </button>
        <span className="text-white text-[22px] font-bold tracking-[2px]">{clock(Math.floor(ui.elapsed))}</span>
        <span className="w-[38px] h-[38px] rounded-full flex items-center justify-center backdrop-blur" style={{ background: "rgba(255,255,255,0.1)" }}>
          <BoltIcon size={18} color="#fff" />
        </span>
      </div>

      {/* 检测徽章 */}
      <div
        className="absolute top-[108px] left-5 flex items-center gap-2 z-10 rounded-[30px] py-2 pl-[10px] pr-4 border"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(14px)", borderColor: "rgba(196,240,0,0.25)" }}
      >
        <span className="w-[9px] h-[9px] rounded-full anim-dotPulse" style={{ background: ui.formOk ? colors.lime : colors.orange }} />
        <span className="text-[14px] font-bold tracking-[1.2px]" style={{ color: ui.formOk ? colors.lime : colors.orange }}>
          {ui.exerciseName.toUpperCase()}
        </span>
        <span className="text-fit-dim text-[12px] ml-[6px]">
          Confidence <span style={{ color: "#ccc" }}>{Math.round(ui.confidence * 100)}%</span>
        </span>
      </div>

      {/* 实时反馈文字 */}
      {ui.formMessage ? (
        <div className="absolute top-[150px] left-5 z-10 rounded-[20px] py-[7px] px-[14px]" style={{ background: "rgba(229,82,10,0.92)" }}>
          <span className="text-white text-[13px] font-bold">{ui.formMessage}</span>
        </div>
      ) : null}

      {/* 计数 */}
      <div className="absolute bottom-[148px] left-0 right-0 text-center z-10">
        <div
          key={ui.count}
          className="text-white text-[108px] font-black leading-none"
          style={{ animation: "repPop .45s cubic-bezier(.36,.07,.19,.97)", textShadow: "0 0 50px rgba(255,255,255,.15)" }}
        >
          {ui.count}
        </div>
        <div className="text-fit-muted text-[12px] font-bold tracking-[4px] -mt-[2px]">{ui.unit}</div>
      </div>

      {/* 控制 */}
      <div className="absolute bottom-[60px] left-0 right-0 flex items-center justify-center gap-10 z-10">
        <div className="w-[38px]" />
        <button data-control-id="camera-pause-toggle" onClick={() => setPaused((p) => !p)} className="w-16 h-16 rounded-full bg-orange flex items-center justify-center anim-orangeGlow">
          {paused ? <PlayIcon size={28} color="#fff" /> : <PauseIcon size={28} color="#fff" />}
        </button>
        <button
          data-control-id="camera-mute-toggle"
          onClick={() => setMuted((m) => !m)}
          className="w-[38px] h-[38px] rounded-full flex items-center justify-center backdrop-blur"
          style={{ background: muted ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.12)" }}
        >
          <VolumeIcon size={18} color={muted ? colors.textMuted : "#fff"} />
        </button>
      </div>

      {ui.status !== "ready" && <StatusOverlay status={ui.status} message={ui.errorMessage} />}
    </div>
  );
}
