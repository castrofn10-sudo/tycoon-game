import React, { useMemo } from "react";
import { View, Text, ScrollView, StyleSheet, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGameplay } from "@/context/GameplayContext";
import { useColors } from "@/hooks/useColors";
import { GridBackground } from "@/components/GridBackground";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ACHIEVEMENT_DEFS, AchievementDef, AchievementDifficulty } from "@/constants/achievements";
import { MONTHS_PT } from "@/constants/gameEngine";

const SHADOW_ID = "shadowquebrajogo";
const SHADOW_GOLD = "#C9943A";
const SHADOW_GOLD_LIGHT = "#F0C060";

// ── Difficulty badge ────────────────────────────────────────────────────────
const DIFF_STYLES: Record<AchievementDifficulty, { label: string; color: string; bg: string }> = {
  easy:      { label: "Fácil",     color: "#10B981", bg: "#10B98122" },
  medium:    { label: "Médio",     color: "#4DA6FF", bg: "#4DA6FF22" },
  hard:      { label: "Difícil",   color: "#F5A623", bg: "#F5A62322" },
  legendary: { label: "Lendário",  color: "#C9943A", bg: "#C9943A22" },
};

function DiffBadge({ difficulty }: { difficulty?: AchievementDifficulty }) {
  if (!difficulty) return null;
  const d = DIFF_STYLES[difficulty];
  return (
    <View style={{ backgroundColor: d.bg, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 }}>
      <Text style={{ fontSize: 9, fontFamily: "Inter_700Bold", color: d.color, letterSpacing: 0.5 }}>
        {d.label.toUpperCase()}
      </Text>
    </View>
  );
}

// ── Special (hidden) trophy card ────────────────────────────────────────────
function ShadowTrophyCard({
  def,
  isUnlocked,
  record,
}: {
  def: AchievementDef;
  isUnlocked: boolean;
  record?: { unlockedYear: number; unlockedMonth: number };
}) {
  const C = useColors();

  if (!isUnlocked) {
    return (
      <View style={[shadowStyles.lockedWrap, { backgroundColor: C.card, borderColor: C.border }]}>
        <View style={shadowStyles.lockedInner}>
          <View style={[shadowStyles.lockedIcon, { backgroundColor: C.secondary }]}>
            <Feather name="lock" size={18} color={C.mutedForeground} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[shadowStyles.lockedTitle, { color: C.mutedForeground }]}>??? Troféu Secreto</Text>
            <Text style={[shadowStyles.lockedDesc, { color: C.mutedForeground }]}>
              Continue evoluindo sua empresa para revelar este troféu especial.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={shadowStyles.glowWrap}>
      <LinearGradient
        colors={[SHADOW_GOLD + "33", "#070D1A", SHADOW_GOLD + "22"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={shadowStyles.card}
      >
        <View style={[shadowStyles.outerBorder, { borderColor: SHADOW_GOLD + "88" }]}>
          <View style={shadowStyles.topRow}>
            <View style={shadowStyles.iconWrap}>
              <LinearGradient
                colors={[SHADOW_GOLD_LIGHT + "55", SHADOW_GOLD + "33"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={shadowStyles.iconGradient}
              >
                <Feather name={def.icon as any} size={28} color={SHADOW_GOLD_LIGHT} />
              </LinearGradient>
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[shadowStyles.title, { color: SHADOW_GOLD_LIGHT }]}>{def.title}</Text>
              {record && (
                <Text style={[shadowStyles.date, { color: SHADOW_GOLD + "BB" }]}>
                  Desbloqueado em {MONTHS_PT[record.unlockedMonth - 1]} {record.unlockedYear}
                </Text>
              )}
            </View>
            <Feather name="check-circle" size={22} color={SHADOW_GOLD} />
          </View>
          <Text style={[shadowStyles.desc, { color: SHADOW_GOLD + "DD" }]}>{def.description}</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const shadowStyles = StyleSheet.create({
  glowWrap: { borderRadius: 14, overflow: "hidden", marginBottom: 8 },
  card: { borderRadius: 14, padding: 16 },
  outerBorder: { borderWidth: 1, borderRadius: 10, padding: 12 },
  lockedWrap: { borderRadius: 12, borderWidth: 1, marginBottom: 8, overflow: "hidden" },
  lockedInner: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  lockedIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  lockedTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  lockedDesc: { fontSize: 12, marginTop: 3, lineHeight: 17 },
  topRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  iconWrap: { borderRadius: 12, overflow: "hidden" },
  iconGradient: { width: 52, height: 52, alignItems: "center", justifyContent: "center", borderRadius: 12 },
  title: { fontSize: 16, fontFamily: "Inter_700Bold", letterSpacing: 0.3 },
  date: { fontSize: 11, marginTop: 3 },
  desc: { fontSize: 13, lineHeight: 19 },
});

// ── Category order & labels ─────────────────────────────────────────────────
const CAT_ORDER = ["production", "hardware", "finance", "reputation", "research", "management", "milestones", "special"];

const CAT_LABELS: Record<string, string> = {
  production:  "🎮 Jogos",
  hardware:    "🖥️ Consoles",
  finance:     "💰 Financeiro",
  reputation:  "⭐ Reputação & Fãs",
  research:    "🔬 Pesquisa",
  management:  "🏢 Gestão",
  milestones:  "🏁 Marcos & Mercado",
};

// ── Main screen ─────────────────────────────────────────────────────────────
export default function AchievementsScreen() {
  const { state } = useGameplay();
  const C = useColors();
  const insets = useSafeAreaInsets();
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const unlockedIds = useMemo(
    () => (state?.unlockedAchievements ?? []).map((a) => a.id),
    [state?.unlockedAchievements]
  );
  const unlocked = useMemo(
    () => (state?.unlockedAchievements ?? []),
    [state?.unlockedAchievements]
  );

  const regularDefs = useMemo(
    () => ACHIEVEMENT_DEFS.filter((d) => d.category !== "special"),
    []
  );
  const specialDefs = useMemo(
    () => ACHIEVEMENT_DEFS.filter((d) => d.category === "special" && d.id !== SHADOW_ID),
    []
  );
  const shadowDef = useMemo(
    () => ACHIEVEMENT_DEFS.find((d) => d.id === SHADOW_ID),
    []
  );

  const byCategory = useMemo(() => {
    const cats: Record<string, AchievementDef[]> = {};
    for (const def of regularDefs) {
      if (!cats[def.category]) cats[def.category] = [];
      cats[def.category].push(def);
    }
    return cats;
  }, [regularDefs]);

  const isShadowUnlocked = unlockedIds.includes(SHADOW_ID);
  const shadowRecord = unlocked.find((a) => a.id === SHADOW_ID);
  const totalVisible = ACHIEVEMENT_DEFS.filter((d) => !d.hidden).length;
  const unlockedVisible = unlockedIds.filter((id) => id !== SHADOW_ID).length + (isShadowUnlocked ? 1 : 0);
  const pct = Math.round((unlockedVisible / totalVisible) * 100);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    summaryBadge: {
      paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
      backgroundColor: C.secondary, borderWidth: 1, borderColor: C.border,
      flexDirection: "row", alignItems: "center", gap: 4,
    },
    summaryBold: { fontSize: 14, fontFamily: "Inter_700Bold", color: C.primary },
    summaryText: { fontSize: 13, color: C.mutedForeground },
    scrollContent: { padding: 16, paddingBottom: botPad + 40 },
    progressBar: {
      height: 8, backgroundColor: C.border, borderRadius: 4, marginBottom: 10,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%" as any, backgroundColor: C.primary, borderRadius: 4,
    },
    pctText: { fontSize: 12, color: C.mutedForeground, textAlign: "center", marginBottom: 16 },
    sectionTitle: {
      fontSize: 13, fontWeight: "700", color: C.mutedForeground, letterSpacing: 1,
      textTransform: "uppercase", marginBottom: 10, marginTop: 16,
    },
    card: {
      flexDirection: "row", alignItems: "center", gap: 12,
      backgroundColor: C.card, borderRadius: 10, padding: 14,
      marginBottom: 8, borderWidth: 1, borderColor: C.border,
    },
    cardUnlocked: { borderColor: C.primary },
    iconBox: {
      width: 40, height: 40, borderRadius: 10,
      alignItems: "center", justifyContent: "center",
    },
    cardContent: { flex: 1 },
    cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
    cardTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.foreground },
    cardDesc: { fontSize: 12, color: C.mutedForeground, marginTop: 2 },
    cardDate: { fontSize: 11, color: C.primary, marginTop: 3 },
    lockIcon: { opacity: 0.3 },
    specialSection: {
      marginTop: 24,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: SHADOW_GOLD + "44",
    },
    specialSectionLabel: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 12,
    },
    specialSectionText: {
      fontSize: 13,
      fontFamily: "Inter_700Bold",
      letterSpacing: 1,
      color: SHADOW_GOLD,
      textTransform: "uppercase",
    },
  });

  const rightElement = (
    <View style={styles.summaryBadge}>
      <Text style={styles.summaryBold}>{unlockedVisible}</Text>
      <Text style={styles.summaryText}>/ {totalVisible}</Text>
    </View>
  );

  const orderedCategories = CAT_ORDER.filter((cat) => byCategory[cat]?.length > 0);

  return (
    <View style={styles.container}>
      <GridBackground />
      <ScreenHeader title="Conquistas" rightElement={rightElement} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${pct}%` as any }]} />
        </View>
        <Text style={styles.pctText}>{pct}% completo</Text>

        {orderedCategories.map((cat) => {
          const defs = byCategory[cat] ?? [];
          return (
            <View key={cat}>
              <Text style={styles.sectionTitle}>{CAT_LABELS[cat] ?? cat}</Text>
              {defs.map((def) => {
                const isUnlocked = unlockedIds.includes(def.id);
                const record = unlocked.find((a) => a.id === def.id);
                return (
                  <View key={def.id} style={[styles.card, isUnlocked && styles.cardUnlocked]}>
                    <View style={[styles.iconBox, { backgroundColor: isUnlocked ? def.color + "22" : C.border }]}>
                      <Feather
                        name={def.icon as any}
                        size={20}
                        color={isUnlocked ? def.color : C.mutedForeground}
                        style={!isUnlocked ? styles.lockIcon : undefined}
                      />
                    </View>
                    <View style={styles.cardContent}>
                      <View style={styles.cardTitleRow}>
                        <Text style={[styles.cardTitle, !isUnlocked && { color: C.mutedForeground }]}>
                          {isUnlocked ? def.title : "???"}
                        </Text>
                        <DiffBadge difficulty={def.difficulty} />
                      </View>
                      <Text style={styles.cardDesc}>
                        {isUnlocked ? def.description : "Continue jogando para desbloquear."}
                      </Text>
                      {record && (
                        <Text style={styles.cardDate}>
                          Desbloqueado em {MONTHS_PT[(record.unlockedMonth ?? 1) - 1]} {record.unlockedYear}
                        </Text>
                      )}
                    </View>
                    {isUnlocked && (
                      <Feather name="check-circle" size={18} color={def.color} />
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}

        {/* ── Rare / Special section (non-hidden) ── */}
        {specialDefs.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text style={styles.sectionTitle}>✨ Especial / Raro</Text>
            {specialDefs.map((def) => {
              const isUnlocked = unlockedIds.includes(def.id);
              const record = unlocked.find((a) => a.id === def.id);
              return (
                <View key={def.id} style={[styles.card, isUnlocked && styles.cardUnlocked]}>
                  <View style={[styles.iconBox, { backgroundColor: isUnlocked ? def.color + "22" : C.border }]}>
                    <Feather
                      name={def.icon as any}
                      size={20}
                      color={isUnlocked ? def.color : C.mutedForeground}
                      style={!isUnlocked ? styles.lockIcon : undefined}
                    />
                  </View>
                  <View style={styles.cardContent}>
                    <View style={styles.cardTitleRow}>
                      <Text style={[styles.cardTitle, !isUnlocked && { color: C.mutedForeground }]}>
                        {isUnlocked ? def.title : "???"}
                      </Text>
                      <DiffBadge difficulty={def.difficulty} />
                    </View>
                    <Text style={styles.cardDesc}>
                      {isUnlocked ? def.description : "Continue jogando para desbloquear."}
                    </Text>
                    {record && (
                      <Text style={styles.cardDate}>
                        Desbloqueado em {MONTHS_PT[(record.unlockedMonth ?? 1) - 1]} {record.unlockedYear}
                      </Text>
                    )}
                  </View>
                  {isUnlocked && (
                    <Feather name="check-circle" size={18} color={def.color} />
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* ── Hidden / Easter egg trophy ── */}
        {shadowDef && (
          <View style={styles.specialSection}>
            <View style={styles.specialSectionLabel}>
              <Feather name="star" size={13} color={SHADOW_GOLD} />
              <Text style={styles.specialSectionText}>Troféu Especial</Text>
            </View>
            <ShadowTrophyCard
              def={shadowDef}
              isUnlocked={isShadowUnlocked}
              record={shadowRecord}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}
