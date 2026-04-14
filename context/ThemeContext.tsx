import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type ThemeId = "modern" | "retro" | "nature" | "minimalist";

export type ColorPalette = {
  text: string;
  tint: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  gradientStart: string;
  gradientMid: string;
  gradientEnd: string;
  glowBlue: string;
  glowGold: string;
  buttonPrimary: string;
  buttonPrimaryText: string;
  buttonSecondary: string;
  buttonSecondaryText: string;
  buttonSecondaryBorder: string;
  // grid
  gridLine: string;
  gridDot: string;
  particleColor: string;
  radius: number;
};

// ── Theme Palettes ────────────────────────────────────────────────

const MODERN: ColorPalette = {
  text: "#E8EDF5",
  tint: "#4DA6FF",
  background: "#070D1A",
  foreground: "#E8EDF5",
  card: "#0D1829",
  cardForeground: "#E8EDF5",
  primary: "#4DA6FF",
  primaryForeground: "#070D1A",
  secondary: "#1A2840",
  secondaryForeground: "#9BB8D4",
  muted: "#111E32",
  mutedForeground: "#6B8CAE",
  accent: "#F5A623",
  accentForeground: "#070D1A",
  destructive: "#FF4D6A",
  destructiveForeground: "#ffffff",
  border: "#1E3050",
  input: "#1A2840",
  gradientStart: "#070D1A",
  gradientMid: "#0A1628",
  gradientEnd: "#040810",
  glowBlue: "#4DA6FF",
  glowGold: "#F5A623",
  buttonPrimary: "#4DA6FF",
  buttonPrimaryText: "#070D1A",
  buttonSecondary: "#1A2840",
  buttonSecondaryText: "#E8EDF5",
  buttonSecondaryBorder: "#2B4570",
  gridLine: "#1E3A6E",
  gridDot: "#4DA6FF",
  particleColor: "#4DA6FF",
  radius: 12,
};

const RETRO: ColorPalette = {
  text: "#FFD700",
  tint: "#FFB347",
  background: "#0D0A00",
  foreground: "#FFD700",
  card: "#1A1400",
  cardForeground: "#FFD700",
  primary: "#FFB347",
  primaryForeground: "#0D0A00",
  secondary: "#2A2000",
  secondaryForeground: "#AA8833",
  muted: "#1E1800",
  mutedForeground: "#7A6030",
  accent: "#39FF14",
  accentForeground: "#0D0A00",
  destructive: "#FF3300",
  destructiveForeground: "#ffffff",
  border: "#3A2E00",
  input: "#2A2000",
  gradientStart: "#0D0A00",
  gradientMid: "#161100",
  gradientEnd: "#080600",
  glowBlue: "#FFB347",
  glowGold: "#39FF14",
  buttonPrimary: "#FFB347",
  buttonPrimaryText: "#0D0A00",
  buttonSecondary: "#2A2000",
  buttonSecondaryText: "#FFD700",
  buttonSecondaryBorder: "#4A3A00",
  gridLine: "#3A2E00",
  gridDot: "#FFB347",
  particleColor: "#39FF14",
  radius: 4,
};

const NATURE: ColorPalette = {
  text: "#C8E6C9",
  tint: "#4CAF50",
  background: "#0A1510",
  foreground: "#C8E6C9",
  card: "#0F2017",
  cardForeground: "#C8E6C9",
  primary: "#4CAF50",
  primaryForeground: "#0A1510",
  secondary: "#142B1C",
  secondaryForeground: "#81C784",
  muted: "#0D1E15",
  mutedForeground: "#4E8055",
  accent: "#8BC34A",
  accentForeground: "#0A1510",
  destructive: "#F44336",
  destructiveForeground: "#ffffff",
  border: "#1E4028",
  input: "#142B1C",
  gradientStart: "#0A1510",
  gradientMid: "#0C1C14",
  gradientEnd: "#070F0B",
  glowBlue: "#4CAF50",
  glowGold: "#8BC34A",
  buttonPrimary: "#4CAF50",
  buttonPrimaryText: "#0A1510",
  buttonSecondary: "#142B1C",
  buttonSecondaryText: "#C8E6C9",
  buttonSecondaryBorder: "#2E5A38",
  gridLine: "#1A3D22",
  gridDot: "#4CAF50",
  particleColor: "#8BC34A",
  radius: 16,
};

const MINIMALIST: ColorPalette = {
  text: "#212529",
  tint: "#1A1A2E",
  background: "#F8F9FA",
  foreground: "#212529",
  card: "#FFFFFF",
  cardForeground: "#212529",
  primary: "#1A1A2E",
  primaryForeground: "#FFFFFF",
  secondary: "#F1F3F5",
  secondaryForeground: "#495057",
  muted: "#E9ECEF",
  mutedForeground: "#868E96",
  accent: "#E94560",
  accentForeground: "#FFFFFF",
  destructive: "#FA5252",
  destructiveForeground: "#ffffff",
  border: "#DEE2E6",
  input: "#F1F3F5",
  gradientStart: "#F8F9FA",
  gradientMid: "#F1F3F5",
  gradientEnd: "#E9ECEF",
  glowBlue: "#1A1A2E",
  glowGold: "#E94560",
  buttonPrimary: "#1A1A2E",
  buttonPrimaryText: "#FFFFFF",
  buttonSecondary: "#F1F3F5",
  buttonSecondaryText: "#212529",
  buttonSecondaryBorder: "#CED4DA",
  gridLine: "#DEE2E6",
  gridDot: "#868E96",
  particleColor: "#CED4DA",
  radius: 20,
};

export const THEME_PALETTES: Record<ThemeId, ColorPalette> = {
  modern: MODERN,
  retro: RETRO,
  nature: NATURE,
  minimalist: MINIMALIST,
};

export const THEME_NAMES: Record<ThemeId, string> = {
  modern: "Corporativo Moderno",
  retro: "Terminal Retrô",
  nature: "Floresta Digital",
  minimalist: "Minimalista",
};

export const THEME_ICONS: Record<ThemeId, string> = {
  modern: "🏙",
  retro: "🖥",
  nature: "🌿",
  minimalist: "⬜",
};

export const THEME_DESCRIPTIONS: Record<ThemeId, string> = {
  modern: "Interface corporativa azul-elétrico com estética sci-fi",
  retro: "Terminal de âmbar como nos anos 80, com verde-néon",
  nature: "Verde floresta com tons suaves e orgânicos",
  minimalist: "Limpo, branco e sem distrações",
};

// ── Time of Day ───────────────────────────────────────────────────

export type TimeOfDay = "dawn" | "morning" | "afternoon" | "sunset" | "night";

export function getTimeOfDay(): TimeOfDay {
  const h = new Date().getHours();
  if (h >= 5 && h < 8) return "dawn";
  if (h >= 8 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 20) return "sunset";
  return "night";
}

export const TIME_GLOW_COLORS: Record<TimeOfDay, { glow1: string; glow2: string; label: string; icon: string }> = {
  dawn: { glow1: "#FF8C69", glow2: "#FFD1A1", label: "Amanhecer", icon: "🌅" },
  morning: { glow1: "#87CEEB", glow2: "#FFE680", label: "Manhã", icon: "☀️" },
  afternoon: { glow1: "#5B9BD5", glow2: "#F4C842", label: "Tarde", icon: "🌤" },
  sunset: { glow1: "#FF6B6B", glow2: "#9B59B6", label: "Entardecer", icon: "🌆" },
  night: { glow1: "#4DA6FF", glow2: "#F5A623", label: "Noite", icon: "🌙" },
};

// ── Context ───────────────────────────────────────────────────────

const THEME_KEY = "@megacorp_theme";

type ThemeContextType = {
  themeId: ThemeId;
  colors: ColorPalette;
  timeOfDay: TimeOfDay;
  setTheme: (id: ThemeId) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  themeId: "modern",
  colors: MODERN,
  timeOfDay: "night",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>("modern");
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(getTimeOfDay());

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((v) => {
      if (v && v in THEME_PALETTES) setThemeId(v as ThemeId);
    });
    // Update time of day every 5 minutes
    const interval = setInterval(() => setTimeOfDay(getTimeOfDay()), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const setTheme = useCallback((id: ThemeId) => {
    setThemeId(id);
    AsyncStorage.setItem(THEME_KEY, id);
  }, []);

  return (
    <ThemeContext.Provider value={{ themeId, colors: THEME_PALETTES[themeId], timeOfDay, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
