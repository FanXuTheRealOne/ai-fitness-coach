import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, Animated, Easing } from "react-native";
import Svg, { Line, Circle } from "react-native-svg";
import { colors } from "../theme/tokens";
import { PulsingDot, GlowPulse } from "../components/anim";
import { CloseIcon, BoltIcon, VolumeIcon, PauseIcon, PlayIcon } from "../components/Icons";
import { useApp, clock } from "../state/appState";
import { CameraViewWeb } from "../pose/CameraView.web";
import { useDetection } from "../pose/useDetection.web";
import { SKELETON_EDGES, JOINT_POINTS, Pose } from "../pose/keypoints";

export function CameraScreen() {
  const { isPaused, togglePause, navigate, setSummary } = useApp();
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const [vid, setVid] = useState({ w: 0, h: 0 }); // 视频固有分辨率
  const [box, setBox] = useState({ w: 0, h: 0 }); // 容器尺寸
  const [muted, setMuted] = useState(false);
  const { ui, onCameraError, finish } = useDetection(video, isPaused, muted);

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

  return (
    <View
      style={styles.root}
      onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      {/* 真实摄像头背景 */}
      <CameraViewWeb onReady={onReady} onError={onCameraError} />
      <View style={styles.darken} pointerEvents="none" />

      <ScanLine />

      {/* 角标 */}
      <View style={[styles.corner, styles.cTL]} />
      <View style={[styles.corner, styles.cTR]} />
      <View style={[styles.corner, styles.cBL]} />
      <View style={[styles.corner, styles.cBR]} />

      {/* 实时骨架（按 formOk 变色） */}
      {ui.personVisible && ui.pose && box.w > 0 && vid.w > 0 && (
        <Skeleton pose={ui.pose} ok={ui.formOk} cw={box.w} ch={box.h} vw={vid.w} vh={vid.h} />
      )}

      {/* 顶栏 */}
      <View style={styles.topBar}>
        <Pressable onPress={exit} style={styles.roundBtn}>
          <CloseIcon size={18} color="#fff" />
        </Pressable>
        <Text style={styles.timer}>{clock(Math.floor(ui.elapsed))}</Text>
        <View style={styles.roundBtn}>
          <BoltIcon size={18} color="#fff" />
        </View>
      </View>

      {/* 检测徽章：真实动作 + 置信度 */}
      <View style={styles.badge}>
        <PulsingDot size={9} color={ui.formOk ? colors.lime : colors.orange} duration={1000} />
        <Text style={[styles.badgeName, { color: ui.formOk ? colors.lime : colors.orange }]}>
          {ui.exerciseName.toUpperCase()}
        </Text>
        <Text style={styles.badgeConf}>
          Confidence <Text style={{ color: "#ccc" }}>{Math.round(ui.confidence * 100)}%</Text>
        </Text>
      </View>

      {/* 实时反馈文字 */}
      {ui.formMessage ? (
        <View style={styles.hint}>
          <Text style={styles.hintText}>{ui.formMessage}</Text>
        </View>
      ) : null}

      {/* 计数 */}
      <View style={styles.repWrap}>
        <RepBump value={ui.count} />
        <Text style={styles.repsLabel}>{ui.unit}</Text>
      </View>

      {/* 控制 */}
      <View style={styles.controls}>
        <View style={{ width: 38 }} />
        <GlowPulse
          color={colors.orange}
          minRadius={28}
          maxRadius={42}
          minOpacity={0.45}
          maxOpacity={0.8}
          duration={2000}
          offsetY={6}
          style={styles.pauseBtn}
        >
          <Pressable onPress={togglePause} style={styles.pauseInner}>
            {isPaused ? <PlayIcon size={28} color="#fff" /> : <PauseIcon size={28} color="#fff" />}
          </Pressable>
        </GlowPulse>
        <Pressable onPress={() => setMuted((m) => !m)} style={[styles.volBtn, muted && styles.volMuted]}>
          <VolumeIcon size={18} color={muted ? colors.textMuted : "#fff"} />
        </Pressable>
      </View>

      {/* 状态覆盖层（加载 / 权限 / 错误） */}
      {ui.status !== "ready" && <StatusOverlay status={ui.status} message={ui.errorMessage} />}
    </View>
  );
}

function StatusOverlay({ status, message }: { status: string; message: string | null }) {
  const title =
    status === "loading"
      ? "正在加载识别模型…"
      : status === "denied"
        ? "需要摄像头权限"
        : "无法启动摄像头";
  const sub =
    status === "loading"
      ? "首次需联网下载模型，请稍候"
      : status === "denied"
        ? "请在浏览器允许摄像头访问后刷新"
        : message ?? "请检查摄像头设备";
  return (
    <View style={styles.overlay}>
      <Text style={styles.overlayTitle}>{title}</Text>
      <Text style={styles.overlaySub}>{sub}</Text>
    </View>
  );
}

/**
 * 实时骨架。关键点是相对视频帧的归一化坐标，而视频以 object-fit: cover 显示，
 * 所以这里复刻 cover 的「等比放大 + 居中裁剪」变换，再做水平镜像，使骨架精确贴合
 * 画面里的人。cw/ch=容器尺寸，vw/vh=视频固有分辨率。
 */
function Skeleton({
  pose,
  ok,
  cw,
  ch,
  vw,
  vh,
}: {
  pose: Pose;
  ok: boolean;
  cw: number;
  ch: number;
  vw: number;
  vh: number;
}) {
  const color = ok ? colors.lime : colors.orange;
  const vis = (i: number) => (pose[i]?.visibility ?? 1) > 0.3;

  const scale = Math.max(cw / vw, ch / vh); // cover
  const dw = vw * scale;
  const dh = vh * scale;
  const ox = (cw - dw) / 2;
  const oy = (ch - dh) / 2;
  const X = (nx: number) => cw - (nx * dw + ox); // 映射到容器像素 + 水平镜像
  const Y = (ny: number) => ny * dh + oy;

  return (
    <View style={styles.skelWrap} pointerEvents="none">
      <Svg width={cw} height={ch} viewBox={`0 0 ${cw} ${ch}`}>
        {SKELETON_EDGES.map(([a, b], i) =>
          vis(a) && vis(b) ? (
            <Line
              key={`e${i}`}
              x1={X(pose[a].x)}
              y1={Y(pose[a].y)}
              x2={X(pose[b].x)}
              y2={Y(pose[b].y)}
              stroke={color}
              strokeWidth={4}
              strokeLinecap="round"
            />
          ) : null
        )}
        {JOINT_POINTS.map((j, i) =>
          vis(j) ? <Circle key={`j${i}`} cx={X(pose[j].x)} cy={Y(pose[j].y)} r={5} fill={color} /> : null
        )}
      </Svg>
    </View>
  );
}

/** 计数变化时弹一下（repPop）。 */
function RepBump({ value }: { value: number }) {
  const scale = useRef(new Animated.Value(1)).current;
  const prev = useRef(value);
  useEffect(() => {
    if (value === prev.current) return;
    prev.current = value;
    scale.setValue(1);
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.22, duration: 158, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 292, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, [value, scale]);
  return <Animated.Text style={[styles.repNum, { transform: [{ scale }] }]}>{value}</Animated.Text>;
}

function ScanLine() {
  const v = useRef(new Animated.Value(0)).current;
  const [h, setH] = useState(700);
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(v, { toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [v]);
  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [h * 0.08, h * 0.92] });
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={(e) => setH(e.nativeEvent.layout.height)}>
      <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#040404", overflow: "hidden" },
  darken: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(4,4,4,0.35)" },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 1.5,
    backgroundColor: "rgba(196,240,0,0.5)",
    zIndex: 5,
  },

  corner: { position: "absolute", width: 28, height: 28, borderColor: "rgba(196,240,0,0.4)", zIndex: 6 },
  cTL: { top: 70, left: 24, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 4 },
  cTR: { top: 70, right: 24, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 4 },
  cBL: { bottom: 155, left: 24, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 4 },
  cBR: { bottom: 155, right: 24, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 4 },

  skelWrap: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 4 },

  topBar: {
    position: "absolute",
    top: 56,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 10,
  },
  roundBtn: {
    width: 38,
    height: 38,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  timer: { color: "#fff", fontSize: 22, fontWeight: "700", letterSpacing: 2 },

  badge: {
    position: "absolute",
    top: 108,
    left: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 30,
    paddingVertical: 8,
    paddingLeft: 10,
    paddingRight: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 10,
    borderWidth: 1,
    borderColor: "rgba(196,240,0,0.25)",
  },
  badgeName: { fontSize: 14, fontWeight: "700", letterSpacing: 1.2 },
  badgeConf: { color: colors.textDim, fontSize: 12, marginLeft: 6 },

  hint: {
    position: "absolute",
    top: 150,
    left: 20,
    backgroundColor: "rgba(229,82,10,0.92)",
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 14,
    zIndex: 10,
  },
  hintText: { color: "#fff", fontSize: 13, fontWeight: "700" },

  repWrap: { position: "absolute", bottom: 148, left: 0, right: 0, alignItems: "center", zIndex: 10 },
  repNum: { color: "#fff", fontSize: 108, fontWeight: "900", lineHeight: 112, textShadowColor: "rgba(0,0,0,0.5)", textShadowRadius: 16 },
  repsLabel: { color: colors.textMuted, fontSize: 12, fontWeight: "700", letterSpacing: 4, marginTop: -2 },

  controls: {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 40,
    zIndex: 10,
  },
  pauseBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.orange },
  pauseInner: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  volBtn: {
    width: 38,
    height: 38,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  volMuted: { backgroundColor: "rgba(255,255,255,0.04)" },

  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(4,4,4,0.86)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 36,
    zIndex: 50,
  },
  overlayTitle: { color: "#fff", fontSize: 18, fontWeight: "800", textAlign: "center" },
  overlaySub: { color: colors.textMuted, fontSize: 13, marginTop: 10, textAlign: "center", lineHeight: 19 },
});
