import React, { useRef, useEffect, useMemo } from "react";
import { View, StyleSheet, Animated, Dimensions } from "react-native";
import Svg, { Line, Circle, Defs, LinearGradient as SvgGradient, Stop, Rect } from "react-native-svg";
import { useTheme, TIME_GLOW_COLORS } from "@/context/ThemeContext";
import { useGameplay } from "@/context/GameplayContext";

const { width: W, height: H } = Dimensions.get("window");

// ── Era-based gradient (matches the year's historical gaming period) ──────────

type EraColors = {
  top: string;
  mid: string;
  bot: string;
  glow1: string;
  glow2: string;
  grid: string;
  label: string;
};

// Snippet-derived hue anchors (darkened for dark-theme game aesthetic):
// Pre-1985  → warm amber  (#fef3c7/#fde68a hue, night-mode dark)
// 1985-2004 → indigo-blue (#dbeafe/#bfdbfe hue, night-mode dark)
// 2005+     → forest-green (#dcfce7/#bbf7d0 hue, night-mode dark)

function getEraColors(year: number | null): EraColors {
  if (year === null) {
    // No active game — use default (modern/night)
    return {
      top: "#070D1A", mid: "#0A1628", bot: "#040810",
      glow1: "#4DA6FF", glow2: "#F5A623",
      grid: "#1E3A6E", label: "—",
    };
  }

  // ── Pre-1985: Arcade era — warm amber/gold (snippet zone 1) ──
  if (year < 1985) {
    const t = Math.min(1, (year - 1972) / 13); // 0→1 across 1972-1985
    // Hue: amber (#fef3c7/#fde68a), dark-mode: deep amber-brown
    const rTop = Math.round(14 + t * 6);  // #0E → #14  (dark amber)
    const gTop = Math.round(9  + t * 4);  // #09 → #0D
    return {
      top: `#${rTop.toString(16).padStart(2,"0")}${gTop.toString(16).padStart(2,"0")}00`,
      mid: `#${(rTop+4).toString(16).padStart(2,"0")}${(gTop+2).toString(16).padStart(2,"0")}02`,
      bot: "#060300",
      glow1: "#FF8C00", glow2: "#FFD700",
      grid: "#3A2800", label: "Arcade",
    };
  }

  // ── 1985-2004: Digital era — deep indigo-blue (snippet zone 2) ──
  if (year < 2005) {
    const t = Math.min(1, (year - 1985) / 20); // 0→1 across 1985-2005
    // Hue: blue (#dbeafe/#bfdbfe), dark-mode: deep navy with growing blue channel
    const b = Math.round(20 + t * 14); // #14 → #22 (rich dark blue)
    const r = Math.round(4 + t * 3);
    const g = Math.round(8 + t * 8);
    return {
      top: `#${r.toString(16).padStart(2,"0")}${g.toString(16).padStart(2,"0")}${b.toString(16).padStart(2,"0")}`,
      mid: `#06${(g+2).toString(16).padStart(2,"0")}${(b+8).toString(16).padStart(2,"0")}`,
      bot: "#030408",
      glow1: "#4DA6FF", glow2: "#A855F7",
      grid: "#1A2E50", label: "Digital",
    };
  }

  // ── 2005-2024: HD era — teal-green (snippet zone 3 start) ──
  if (year < 2025) {
    const t = Math.min(1, (year - 2005) / 20); // 0→1 across 2005-2025
    // Hue: green (#dcfce7/#bbf7d0), dark-mode: dark teal-green
    const g = Math.round(14 + t * 10); // #0E → #18 (deep green channel)
    return {
      top: `#06${g.toString(16).padStart(2,"0")}0E`,
      mid: `#09${(g+5).toString(16).padStart(2,"0")}16`,
      bot: "#040A06",
      glow1: "#10B981", glow2: "#4DA6FF",
      grid: "#1A3828", label: "HD Era",
    };
  }

  // ── 2025-2059: AI era — vibrant forest-green (snippet zone 3 deep) ──
  if (year < 2060) {
    const t = Math.min(1, (year - 2025) / 35); // 0→1 across 2025-2060
    const g = Math.round(22 + t * 14); // #16 → #24 (rich forest green)
    return {
      top: `#05${g.toString(16).padStart(2,"0")}0E`,
      mid: `#08${(g+6).toString(16).padStart(2,"0")}16`,
      bot: "#030806",
      glow1: "#00FF88", glow2: "#22D3EE",
      grid: "#1A4030", label: "AI Era",
    };
  }

  // ── 2060-2100: Singularity era — violet/cyan (beyond snippet, futuristic) ──
  const t = Math.min(1, (year - 2060) / 40);
  const b = Math.round(22 + t * 14);
  return {
    top: `#08${Math.round(6 + t * 4).toString(16).padStart(2,"0")}${b.toString(16).padStart(2,"0")}`,
    mid: `#0C0A${(b+10).toString(16).padStart(2,"0")}`,
    bot: "#040408",
    glow1: "#C084FC", glow2: "#22D3EE",
    grid: "#1A1840", label: "Singularity",
  };
}

// ── Floating particles ────────────────────────────────────────────

type Particle = { x: number; y: number; size: number; opacity: number };

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    x: (i / count) * W + Math.random() * 40 - 20,
    y: Math.random() * H,
    size: 2 + Math.random() * 3,
    opacity: 0.2 + Math.random() * 0.5,
  }));
}

// ── Component ─────────────────────────────────────────────────────

export const GridBackground = React.memo(function GridBackground() {
  const { colors, themeId, timeOfDay } = useTheme();
  const { state } = useGameplay();
  const year = state?.year ?? null;

  const pulse = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const particles = useMemo(() => generateParticles(12), []);

  // Compute era colors (recomputed when year changes)
  const era = useMemo(() => getEraColors(year), [year]);

  // Merge: if theme is not "modern", use theme colors; if modern, use era colors
  const useEraGradient = themeId === "modern";
  const gradTop = useEraGradient ? era.top : colors.gradientStart;
  const gradMid = useEraGradient ? era.mid : colors.gradientMid;
  const gradBot = useEraGradient ? era.bot : colors.gradientEnd;
  const glow1Color = useEraGradient ? era.glow1 : colors.glowBlue;
  const glow2Color = useEraGradient ? era.glow2 : colors.glowGold;
  const gridColor = useEraGradient ? era.grid : colors.gridLine;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 8000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 8000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.05, 0.2] });
  const glowOpacity2 = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.03, 0.12] });
  const particleShift = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -24] });
  const particleOpacityAnim = floatAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.4, 1, 0.4] });

  const timeColors = TIME_GLOW_COLORS[timeOfDay];

  const gridSize = themeId === "retro" ? 40 : themeId === "minimalist" ? 80 : 60;
  const cols = Math.ceil(W / gridSize) + 1;
  const rows = Math.ceil(H / gridSize) + 1;

  const gridLines = useMemo(() => {
    const lines: React.ReactNode[] = [];
    const sw = themeId === "retro" ? "1" : "0.5";
    const dash = themeId === "minimalist" ? "4,8" : "0";
    for (let i = 0; i <= cols; i++) {
      lines.push(
        <Line key={`v${i}`} x1={i * gridSize} y1={0} x2={i * gridSize} y2={H}
          stroke={gridColor} strokeWidth={sw} />
      );
    }
    for (let i = 0; i <= rows; i++) {
      lines.push(
        <Line key={`h${i}`} x1={0} y1={i * gridSize} x2={W} y2={i * gridSize}
          stroke={gridColor} strokeWidth={sw} strokeDasharray={dash} />
      );
    }
    return lines;
  }, [cols, rows, gridColor, gridSize, themeId]);

  const dotPositions = useMemo(() => [
    { cx: W * 0.2, cy: H * 0.15 }, { cx: W * 0.8, cy: H * 0.25 },
    { cx: W * 0.5, cy: H * 0.5 }, { cx: W * 0.15, cy: H * 0.7 },
    { cx: W * 0.85, cy: H * 0.8 }, { cx: W * 0.6, cy: H * 0.1 },
    { cx: W * 0.35, cy: H * 0.9 },
  ], []);

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Svg width={W} height={H} style={StyleSheet.absoluteFillObject}>
        <Defs>
          <SvgGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={gradTop} stopOpacity="1" />
            <Stop offset="0.5" stopColor={gradMid} stopOpacity="1" />
            <Stop offset="1" stopColor={gradBot} stopOpacity="1" />
          </SvgGradient>
          <SvgGradient id="timeGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={timeColors.glow1} stopOpacity="0.03" />
            <Stop offset="1" stopColor={timeColors.glow2} stopOpacity="0.015" />
          </SvgGradient>
          <SvgGradient id="glowGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={glow1Color} stopOpacity="0.05" />
            <Stop offset="1" stopColor={glow2Color} stopOpacity="0.025" />
          </SvgGradient>
        </Defs>

        <Rect x={0} y={0} width={W} height={H} fill="url(#bgGrad)" />
        <Rect x={0} y={0} width={W} height={H} fill="url(#timeGrad)" />
        <Rect x={0} y={0} width={W} height={H} fill="url(#glowGrad)" />

        {gridLines}

        {dotPositions.map(({ cx, cy }, i) => (
          <Circle key={`dot${i}`} cx={cx} cy={cy} r={themeId === "retro" ? 2 : 3}
            fill={colors.gridDot} opacity={0.35} />
        ))}

        {/* Retro scanlines */}
        {themeId === "retro" && Array.from({ length: Math.ceil(H / 4) }).map((_, i) => (
          <Line key={`scan${i}`} x1={0} y1={i * 4} x2={W} y2={i * 4}
            stroke="#FFB347" strokeWidth="0.3" opacity={0.04} />
        ))}
      </Svg>

      {/* Pulsing glow orbs — colors shift with era */}
      <Animated.View
        style={[styles.glow1, { backgroundColor: glow1Color, opacity: glowOpacity }]}
        pointerEvents="none"
      />
      <Animated.View
        style={[styles.glow2, { backgroundColor: glow2Color, opacity: glowOpacity2 }]}
        pointerEvents="none"
      />
      <Animated.View
        style={[styles.timeGlow, { backgroundColor: timeColors.glow1, opacity: glowOpacity2 }]}
        pointerEvents="none"
      />

      {/* Floating particles */}
      {particles.map((p, i) => (
        <Animated.View
          key={`p${i}`}
          style={[
            styles.particle,
            {
              left: p.x, top: p.y,
              width: p.size, height: p.size,
              borderRadius: p.size / 2,
              backgroundColor: colors.particleColor,
              opacity: particleOpacityAnim,
              transform: [{ translateY: particleShift }],
            },
          ]}
          pointerEvents="none"
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  glow1: {
    position: "absolute", top: -80, left: -80,
    width: 340, height: 340, borderRadius: 170,
    transform: [{ scale: 1.5 }],
  },
  glow2: {
    position: "absolute", bottom: -60, right: -60,
    width: 260, height: 260, borderRadius: 130,
    transform: [{ scale: 1.5 }],
  },
  timeGlow: {
    position: "absolute", top: "30%", right: -100,
    width: 300, height: 300, borderRadius: 150,
    transform: [{ scale: 1.2 }],
  },
  particle: { position: "absolute" },
});
