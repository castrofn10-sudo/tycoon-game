import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Modal,
  Pressable,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useLanguage } from "@/context/LanguageContext";
import { useGame } from "@/context/GameContext";
import { GridBackground } from "@/components/GridBackground";
import { ScreenHeader } from "@/components/ScreenHeader";
import { LanguageModal } from "@/components/LanguageModal";
import { useTheme, THEME_PALETTES, THEME_NAMES, THEME_ICONS, THEME_DESCRIPTIONS, ThemeId, TIME_GLOW_COLORS, getTimeOfDay } from "@/context/ThemeContext";
import { useSound } from "@/context/SoundContext";

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { settings, updateSettings, resetAll } = useGame();
  const { themeId, setTheme, timeOfDay } = useTheme();
  const { playClick, playSuccess } = useSound();
  const [showLangModal, setShowLangModal] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const QUALITIES = ["low", "medium", "high"] as const;
  const qualityLabels: Record<string, string> = {
    low: t.qualityLow,
    medium: t.qualityMed,
    high: t.qualityHigh,
  };

  const timeInfo = TIME_GLOW_COLORS[timeOfDay];

  const SectionTitle = ({ label }: { label: string }) => (
    <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{label}</Text>
  );

  const RowSwitch = ({
    icon,
    label,
    value,
    onChange,
  }: {
    icon: keyof typeof Feather.glyphMap;
    label: string;
    value: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <View style={[styles.row, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
      <View style={[styles.rowIcon, { backgroundColor: colors.muted }]}>
        <Feather name={icon} size={17} color={colors.primary} />
      </View>
      <Text style={[styles.rowLabel, { color: colors.foreground }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.primary + "66" }}
        thumbColor={value ? colors.primary : colors.mutedForeground}
      />
    </View>
  );


  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GridBackground />
      <ScreenHeader title={t.settingsTitle} />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Tema Visual ── */}
        <SectionTitle label="Tema Visual" />
        {/* Time of day indicator */}
        <View style={[styles.timeBadge, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Text style={styles.timeIcon}>{timeInfo.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.timeLabel, { color: colors.foreground }]}>{timeInfo.label}</Text>
            <Text style={[styles.timeDesc, { color: colors.mutedForeground }]}>
              O fundo adapta-se automaticamente ao horário do dia
            </Text>
          </View>
        </View>

        <View style={styles.themeGrid}>
          {(Object.keys(THEME_PALETTES) as ThemeId[]).map((id) => {
            const active = themeId === id;
            const p = THEME_PALETTES[id];
            return (
              <TouchableOpacity
                key={id}
                onPress={() => { playSuccess(); setTheme(id); }}
                activeOpacity={0.8}
                style={[
                  styles.themeCard,
                  {
                    backgroundColor: p.card,
                    borderColor: active ? p.primary : p.border,
                    borderWidth: active ? 2 : 1,
                  },
                ]}
              >
                {/* Mini preview */}
                <View style={[styles.themePreview, { backgroundColor: p.background }]}>
                  <View style={[styles.themeBar, { backgroundColor: p.primary, width: "60%" }]} />
                  <View style={[styles.themeBar, { backgroundColor: p.accent, width: "40%" }]} />
                  <View style={[styles.themeBarThin, { backgroundColor: p.gridLine }]} />
                  <View style={[styles.themeBarThin, { backgroundColor: p.gridLine }]} />
                </View>
                <Text style={styles.themeIcon}>{THEME_ICONS[id]}</Text>
                <Text style={[styles.themeName, { color: p.foreground }]}>{THEME_NAMES[id]}</Text>
                <Text style={[styles.themeDesc, { color: p.mutedForeground }]} numberOfLines={2}>
                  {THEME_DESCRIPTIONS[id]}
                </Text>
                {active && (
                  <View style={[styles.activeCheck, { backgroundColor: p.primary }]}>
                    <Feather name="check" size={10} color={p.primaryForeground} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Gráficos ── */}
        <SectionTitle label={t.graphics} />
        <View style={styles.group}>
          <View style={[styles.row, styles.rowColumn, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <View style={styles.rowTopLine}>
              <View style={[styles.rowIcon, { backgroundColor: colors.muted }]}>
                <Feather name="monitor" size={17} color={colors.primary} />
              </View>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>{t.quality}</Text>
            </View>
            <View style={styles.qualityBtns}>
              {QUALITIES.map((q) => {
                const selected = settings.quality === q;
                return (
                  <TouchableOpacity
                    key={q}
                    onPress={() => { playClick(); updateSettings({ quality: q }); }}
                    activeOpacity={0.8}
                    style={[
                      styles.qualityBtn,
                      {
                        backgroundColor: selected ? colors.primary + "22" : colors.muted,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.qualityBtnText, { color: selected ? colors.primary : colors.mutedForeground }]}>
                      {qualityLabels[q]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* ── Idioma ── */}
        <SectionTitle label={t.language} />
        <View style={styles.group}>
          <TouchableOpacity
            onPress={() => { playClick(); setShowLangModal(true); }}
            activeOpacity={0.8}
            style={[styles.row, { backgroundColor: colors.secondary, borderColor: colors.border }]}
          >
            <View style={[styles.rowIcon, { backgroundColor: colors.muted }]}>
              <Feather name="globe" size={17} color={colors.primary} />
            </View>
            <Text style={[styles.rowLabel, { color: colors.foreground }]}>{t.selectLanguage}</Text>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* ── Notificações ── */}
        <SectionTitle label={t.notifications} />
        <View style={styles.group}>
          <RowSwitch icon="zap" label="Pop-ups de gameplay"
            value={settings.notifPopups ?? true}
            onChange={(v) => updateSettings({ notifPopups: v })} />
          <RowSwitch icon="award" label="Pop-ups de conquistas"
            value={settings.notifAchievements ?? true}
            onChange={(v) => updateSettings({ notifAchievements: v })} />
          <RowSwitch icon="bell" label={t.notifNews}
            value={settings.notifNews}
            onChange={(v) => updateSettings({ notifNews: v })} />
          <RowSwitch icon="trending-up" label="Alertas de mercado & finanças"
            value={settings.notifMarket ?? true}
            onChange={(v) => updateSettings({ notifMarket: v })} />
          <RowSwitch icon="calendar" label={t.notifEvents}
            value={settings.notifEvents}
            onChange={(v) => updateSettings({ notifEvents: v })} />
        </View>

        {/* ── Gameplay ── */}
        <SectionTitle label={t.gameplay} />
        <View style={styles.group}>
          <RowSwitch icon="save" label={t.autoSave} value={settings.autoSave}
            onChange={(v) => updateSettings({ autoSave: v })} />
          <RowSwitch icon="info" label={t.showTips} value={settings.showTips}
            onChange={(v) => updateSettings({ showTips: v })} />
          <RowSwitch icon="user" label="Ajudante"
            value={settings.docEnabled}
            onChange={(v) => updateSettings({ docEnabled: v })} />
        </View>

        {/* ── Zona de Perigo ── */}
        <SectionTitle label={t.resetProgress} />
        <TouchableOpacity
          onPress={() => setShowReset(true)}
          activeOpacity={0.85}
          style={[styles.resetBtn, { borderColor: "#FF4D6A66", backgroundColor: "#FF4D6A11" }]}
        >
          <Feather name="alert-triangle" size={17} color="#FF4D6A" />
          <Text style={styles.resetBtnText}>{t.resetProgress}</Text>
        </TouchableOpacity>
      </ScrollView>

      <LanguageModal visible={showLangModal} onClose={() => setShowLangModal(false)} />

      {/* Reset Confirm */}
      <Modal visible={showReset} transparent animationType="fade" statusBarTranslucent>
        <Pressable style={styles.overlay} onPress={() => setShowReset(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.sheetIcon, { backgroundColor: "#FF4D6A22" }]}>
              <Feather name="alert-triangle" size={28} color="#FF4D6A" />
            </View>
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>{t.resetConfirm}</Text>
            <Text style={[styles.sheetDesc, { color: colors.mutedForeground }]}>{t.resetConfirmDesc}</Text>
            <View style={styles.sheetBtns}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.border, backgroundColor: colors.secondary }]}
                onPress={() => setShowReset(false)}
              >
                <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={() => { resetAll(); setShowReset(false); }}
              >
                <Text style={styles.confirmText}>{t.resetBtn}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 20 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 10,
    marginTop: 4,
    marginLeft: 4,
  },
  group: { marginBottom: 24, gap: 2 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
    marginBottom: 2,
  },
  rowColumn: { flexDirection: "column", alignItems: "stretch", gap: 0 },
  rowTopLine: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  rowIcon: {
    width: 36, height: 36, borderRadius: 9,
    alignItems: "center", justifyContent: "center",
  },
  rowLabel: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  sliderValue: { fontSize: 13, fontFamily: "Inter_700Bold" },
  sliderTrack: {
    height: 4,
    backgroundColor: "transparent",
    borderRadius: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    position: "relative",
    marginHorizontal: 4,
  },
  sliderFill: { position: "absolute", left: 0, top: 0, height: 4, borderRadius: 2 },
  sliderDot: { width: 14, height: 14, borderRadius: 7, zIndex: 1 },
  qualityBtns: { flexDirection: "row", gap: 8, marginTop: 4 },
  qualityBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1.5, alignItems: "center",
  },
  qualityBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  // Time badge
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  timeIcon: { fontSize: 24 },
  timeLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  timeDesc: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },

  // Theme grid
  themeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  themeCard: {
    width: "47%",
    borderRadius: 14,
    padding: 12,
    gap: 6,
    position: "relative",
    overflow: "hidden",
  },
  themePreview: {
    height: 48,
    borderRadius: 8,
    marginBottom: 4,
    padding: 8,
    gap: 4,
    overflow: "hidden",
  },
  themeBar: { height: 6, borderRadius: 3 },
  themeBarThin: { height: 2, borderRadius: 1, opacity: 0.4 },
  themeIcon: { fontSize: 20, textAlign: "center" },
  themeName: { fontSize: 12, fontFamily: "Inter_700Bold", textAlign: "center" },
  themeDesc: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 14 },
  activeCheck: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  // Danger zone
  resetBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 15, borderRadius: 12, borderWidth: 1.5, marginBottom: 8,
  },
  resetBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#FF4D6A" },

  // Modal
  overlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center", alignItems: "center", paddingHorizontal: 24,
  },
  sheet: {
    width: "100%", maxWidth: 380, borderRadius: 20, borderWidth: 1,
    padding: 24, alignItems: "center",
  },
  sheetIcon: {
    width: 64, height: 64, borderRadius: 18,
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  sheetTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 8 },
  sheetDesc: {
    fontSize: 13, fontFamily: "Inter_400Regular",
    textAlign: "center", lineHeight: 20, marginBottom: 24,
  },
  sheetBtns: { flexDirection: "row", gap: 12, width: "100%" },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, alignItems: "center",
  },
  cancelText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  confirmBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    backgroundColor: "#FF4D6A", alignItems: "center",
  },
  confirmText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff" },
});
