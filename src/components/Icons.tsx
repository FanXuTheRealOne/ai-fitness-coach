import React from "react";
import Svg, { Path, Rect, Circle, G } from "react-native-svg";

type IconProps = { size?: number; color?: string };

export const CameraIcon = ({ size = 22, color = "#0c0c0c" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      fill={color}
      d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zM9 2L7.17 4H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9z"
    />
  </Svg>
);

export const ChevronRight = ({ size = 14, color = "#333" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path fill={color} d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" />
  </Svg>
);

export const ChevronLeft = ({ size = 16, color = "#fff" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path fill={color} d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
  </Svg>
);

export const CloseIcon = ({ size = 18, color = "#fff" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      fill={color}
      d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
    />
  </Svg>
);

export const BoltIcon = ({ size = 18, color = "#fff" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path fill={color} d="M7 2v11h3v9l7-12h-4l4-8z" />
  </Svg>
);

export const VolumeIcon = ({ size = 18, color = "#fff" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      fill={color}
      d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z"
    />
  </Svg>
);

export const PauseIcon = ({ size = 28, color = "#fff" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path fill={color} d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </Svg>
);

export const PlayIcon = ({ size = 28, color = "#fff" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path fill={color} d="M8 5v14l11-7z" />
  </Svg>
);

export const HomeIcon = ({ size = 23, color = "#383838" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path fill={color} d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
  </Svg>
);

export const HistoryIcon = ({ size = 23, color = "#383838" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      fill={color}
      d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"
    />
  </Svg>
);

export const LibraryIcon = ({ size = 23, color = "#383838" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      fill={color}
      d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"
    />
  </Svg>
);

export const StatsIcon = ({ size = 23, color = "#383838" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path fill={color} d="M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zm5.6 8H19v6h-2.8v-6z" />
  </Svg>
);

export const CalendarIcon = ({ size = 22, color = "#444" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      fill={color}
      d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"
    />
  </Svg>
);

export const ShareIcon = ({ size = 22, color = "#444" }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      fill={color}
      d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"
    />
  </Svg>
);

// Status bar glyphs
export const SignalIcon = () => (
  <Svg width={17} height={12} viewBox="0 0 17 12">
    <Rect x={0} y={8} width={3} height={4} rx={1} fill="white" />
    <Rect x={4.5} y={5} width={3} height={7} rx={1} fill="white" />
    <Rect x={9} y={2} width={3} height={10} rx={1} fill="white" />
    <Rect x={13.5} y={0} width={3} height={12} rx={1} fill="white" opacity={0.35} />
  </Svg>
);

export const WifiIcon = () => (
  <Svg width={16} height={12} viewBox="0 0 16 12" fill="none">
    <Circle cx={8} cy={10.5} r={1.8} fill="white" />
    <Path d="M4.5 7.5C5.8 6.2 6.9 5.7 8 5.7s2.2.5 3.5 1.8" stroke="white" strokeWidth={1.5} strokeLinecap="round" />
    <Path
      d="M1.5 4.5C3.5 2.5 5.6 1.5 8 1.5s4.5 1 6.5 3"
      stroke="white"
      strokeWidth={1.5}
      strokeLinecap="round"
      opacity={0.35}
    />
  </Svg>
);

export const BatteryIcon = () => (
  <Svg width={26} height={13} viewBox="0 0 26 13" fill="none">
    <Rect x={0.5} y={0.5} width={21} height={12} rx={3.5} stroke="rgba(255,255,255,.3)" />
    <Rect x={22} y={4} width={3} height={5} rx={1.5} fill="rgba(255,255,255,.35)" />
    <Rect x={2} y={2} width={17} height={9} rx={2} fill="white" />
  </Svg>
);
