import React, { useMemo, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useGameplay } from "@/context/GameplayContext";
import { GridBackground } from "@/components/GridBackground";
import { ScreenHeader } from "@/components/ScreenHeader";
import { formatMoney } from "@/constants/gameEconomics";
import { computeAnnualRankings, type RankedEntry } from "@/constants/rankings";

// ── Medal helpers ────────────────────────────────────────────────────────────
const MEDAL_COLORS = ["#FFD700", "#C0C0C0", "#CD7F32"];
const MEDAL_LABELS = ["🥇", "🥈", "🥉"];
function medalLabel(idx: number) { return idx < 3 ? MEDAL_LABELS[idx] : `#${idx + 1}`; }
function medalBg(idx: number)    { return idx < 3 ? MEDAL_COLORS[idx] + "20" : "#FFFFFF08"; }
function medalColor(idx: number) { return idx < 3 ? MEDAL_COLORS[idx] : "#8899BB"; }

// ── Flop detector ────────────────────────────────────────────────────────────
function isFlop(entry: RankedEntry, mode: "sales" | "rating") {
  if (mode === "rating" && entry.score <= 50) return true;
  return false;
}

// ── Single ranking row ───────────────────────────────────────────────────────
function RankRow({
  entry, idx, mode, maxVal, colors,
}: {
  entry: RankedEntry;
  idx: number;
  mode: "sales" | "rating";
  maxVal: number;
  colors: ReturnType<typeof useColors>;
}) {
  const barPct = maxVal > 0 ? Math.max(3, Math.round((mode === "sales" ? entry.value : entry.score) / maxVal * 100)) : 3;
  const flop = isFlop(entry, mode);
  const barColor = flop ? "#FF4D6A" : entry.isPlayer ? "#4DA6FF" : "#6B7280";
  const rowBg = entry.isPlayer ? "#4DA6FF08" : "transparent";
  const rowBorder = entry.isPlayer ? "#4DA6FF30" : "transparent";

  return (
    <View style={[styles.rankRow, { backgroundColor: rowBg, borderColor: rowBorder }]}>
      {/* Medal */}
      <View style={[styles.medalBadge, { backgroundColor: medalBg(idx) }]}>
        <Text style={[styles.medalText, { color: medalColor(idx) }]}>{medalLabel(idx)}</Text>
      </View>

      {/* Info */}
      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={[styles.entryName, { color: colors.foreground }]} numberOfLines={1}>
            {entry.name}
          </Text>
          {entry.isPlayer && (
            <View style={styles.playerBadge}>
              <Text style={styles.playerBadgeText}>TU</Text>
            </View>
          )}
          {flop && (
            <View style={styles.flopBadge}>
              <Text style={styles.flopBadgeText}>FLOP</Text>
            </View>
          )}
        </View>
        <Text style={[styles.entryOwner, { color: colors.mutedForeground }]} numberOfLines={1}>
          {entry.ownerName}
        </Text>
        {/* Mini bar */}
        <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
          <View style={[styles.barFill, { width: `${barPct}%`, backgroundColor: barColor }]} />
        </View>
      </View>

      {/* Value */}
      <View style={{ alignItems: "flex-end", gap: 2 }}>
        {mode === "sales" ? (
          <Text style={[styles.entryVal, { color: entry.isPlayer ? "#4DA6FF" : colors.foreground }]}>
            {formatMoney(entry.value)}
          </Text>
        ) : (
          <View style={[styles.scoreChip, { backgroundColor: entry.score >= 80 ? "#10B98120" : entry.score >= 60 ? "#F5A62320" : "#FF4D6A20" }]}>
            <Text style={[styles.scoreChipText, { color: entry.score >= 80 ? "#10B981" : entry.score >= 60 ? "#F5A623" : "#FF4D6A" }]}>
              {entry.score}/100
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ── Panel wrapper ────────────────────────────────────────────────────────────
function RankPanel({
  label, icon, iconColor, entries, mode, colors, emptyMsg,
}: {
  label: string;
  icon: string;
  iconColor: string;
  entries: RankedEntry[];
  mode: "sales" | "rating";
  colors: ReturnType<typeof useColors>;
  emptyMsg: string;
}) {
  const maxVal = useMemo(() => {
    if (entries.length === 0) return 1;
    return Math.max(...entries.map(e => mode === "sales" ? e.value : e.score), 1);
  }, [entries, mode]);

  return (
    <View style={[styles.panel, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
      {/* Panel header */}
      <View style={styles.panelHeader}>
        <View style={[styles.panelIcon, { backgroundColor: iconColor + "20" }]}>
          <Feather name={icon as any} size={13} color={iconColor} />
        </View>
        <Text style={[styles.panelLabel, { color: colors.foreground }]}>{label}</Text>
        <View style={[styles.countChip, { backgroundColor: colors.border }]}>
          <Text style={[styles.countChipText, { color: colors.mutedForeground }]}>TOP {entries.length}</Text>
        </View>
      </View>

      {/* Rows */}
      {entries.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="inbox" size={22} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{emptyMsg}</Text>
        </View>
      ) : (
        <View style={{ gap: 6 }}>
          {entries.map((e, i) => (
            <RankRow key={`${e.name}_${e.ownerName}_${i}`} entry={e} idx={i} mode={mode} maxVal={maxVal} colors={colors} />
          ))}
        </View>
      )}
    </View>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────
export default function RankingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state } = useGameplay();
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [tab, setTab] = useState<"games" | "consoles">("games");

  if (!state) return null;

  const rankings = useMemo(() => computeAnnualRankings(
    state.gameProjects ?? [],
    state.consoles ?? [],
    state.competitors ?? [],
    state.year ?? 1980,
    state.companyName ?? "Você"
  ), [state.gameProjects, state.consoles, state.competitors, state.year, state.companyName]);

  const year = state.year ?? 1980;

  // Flop summary
  const playerGames = (state.gameProjects ?? []).filter(g => g.phase === "released");
  const flopGames = playerGames.filter(g => (g.receptionScore ?? 50) <= 50 || g.bugLevel === "severe");
  const playerConsoles = (state.consoles ?? []).filter(c => !c.isDiscontinued);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GridBackground />
      <ScreenHeader title="Rankings" />

      {/* Tab bar */}
      <View style={[styles.tabBar, { backgroundColor: colors.secondary, borderBottomColor: colors.border }]}>
        {([
          { id: "games", label: "Jogos", icon: "package" },
          { id: "consoles", label: "Consoles", icon: "monitor" },
        ] as const).map(t => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tab, tab === t.id && { borderBottomColor: "#4DA6FF", borderBottomWidth: 2 }]}
            onPress={() => setTab(t.id)}
            activeOpacity={0.8}
          >
            <Feather name={t.icon} size={13} color={tab === t.id ? "#4DA6FF" : colors.mutedForeground} />
            <Text style={[styles.tabText, { color: tab === t.id ? "#4DA6FF" : colors.mutedForeground }]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: botPad + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Season banner ── */}
        <LinearGradient
          colors={["#1A2C4E", "#0D1B2E"]}
          style={[styles.banner, { borderColor: colors.border }]}
        >
          <Feather name="award" size={18} color="#F5A623" />
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Temporada {year}</Text>
            <Text style={styles.bannerSub}>Rankings atualizados em dezembro de cada ano</Text>
          </View>
          <View style={styles.liveChip}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>AO VIVO</Text>
          </View>
        </LinearGradient>

        {tab === "games" ? (
          <>
            <RankPanel
              label="Top 5 Jogos — Mais Vendidos"
              icon="trending-up"
              iconColor="#10B981"
              entries={rankings.gamesBySales}
              mode="sales"
              colors={colors}
              emptyMsg="Nenhum jogo lançado este ano ainda."
            />
            <RankPanel
              label="Top 5 Jogos — Melhor Avaliados"
              icon="star"
              iconColor="#F5A623"
              entries={rankings.gamesByRating}
              mode="rating"
              colors={colors}
              emptyMsg="Nenhum jogo avaliado este ano ainda."
            />

            {/* Flop warning */}
            {flopGames.length > 0 && (
              <View style={[styles.flopPanel, { backgroundColor: "#FF4D6A0A", borderColor: "#FF4D6A30" }]}>
                <View style={styles.flopPanelHeader}>
                  <Feather name="alert-triangle" size={13} color="#FF4D6A" />
                  <Text style={[styles.flopPanelTitle, { color: "#FF4D6A" }]}>
                    Fracassos Detetados ({flopGames.length})
                  </Text>
                </View>
                <View style={{ gap: 6 }}>
                  {flopGames.map(g => (
                    <View key={g.id} style={[styles.flopEntry, { borderColor: "#FF4D6A20" }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.flopName, { color: colors.foreground }]}>{g.name}</Text>
                        <Text style={[styles.flopReason, { color: "#FF4D6A" }]}>
                          {g.bugLevel === "severe" ? "Bugs graves" : `Nota ${g.receptionScore ?? 0}/100`}
                          {(g.receptionScore ?? 50) <= 50 && g.bugLevel === "severe" ? " • " : ""}
                          {(g.receptionScore ?? 50) <= 50 && g.bugLevel !== "severe" ? " — crítica negativa" : ""}
                        </Text>
                      </View>
                      <View style={[styles.scoreChip, { backgroundColor: "#FF4D6A20" }]}>
                        <Text style={[styles.scoreChipText, { color: "#FF4D6A" }]}>
                          {g.receptionScore ?? 0}/100
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        ) : (
          <>
            <RankPanel
              label="Top 5 Consoles — Mais Vendidos"
              icon="trending-up"
              iconColor="#10B981"
              entries={rankings.consolesBySales}
              mode="sales"
              colors={colors}
              emptyMsg="Nenhum console no mercado ainda."
            />
            <RankPanel
              label="Top 5 Consoles — Melhor Pontuados"
              icon="cpu"
              iconColor="#A855F7"
              entries={rankings.consolesByScore}
              mode="rating"
              colors={colors}
              emptyMsg="Nenhum console avaliado ainda."
            />

            {/* Console flop warning */}
            {playerConsoles.length === 0 && (
              <View style={[styles.flopPanel, { backgroundColor: "#F5A6230A", borderColor: "#F5A62330" }]}>
                <View style={styles.flopPanelHeader}>
                  <Feather name="info" size={13} color="#F5A623" />
                  <Text style={[styles.flopPanelTitle, { color: "#F5A623" }]}>Nenhum console ativo</Text>
                </View>
                <Text style={[styles.flopReason, { color: colors.mutedForeground }]}>
                  Cria e lança um console para aparecer no ranking.
                </Text>
              </View>
            )}
          </>
        )}

        {/* Legend */}
        <View style={[styles.legend, { borderColor: colors.border }]}>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: "#4DA6FF" }]} />
            <Text style={[styles.legendText, { color: colors.mutedForeground }]}>A tua empresa</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: "#6B7280" }]} />
            <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Concorrente IA</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: "#FF4D6A" }]} />
            <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Fracasso / Score ≤ 50</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },

  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  bannerTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#F5A623",
  },
  bannerSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#8899BB",
    marginTop: 1,
  },
  liveChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#10B98120",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  liveText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    color: "#10B981",
    letterSpacing: 0.5,
  },

  panel: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  panelIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  panelLabel: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
  },
  countChip: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  countChipText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },

  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 10,
    borderWidth: 1,
    padding: 9,
  },
  medalBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  medalText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  entryName: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  entryOwner: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
  entryVal: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  barTrack: {
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
  },
  barFill: {
    height: 3,
    borderRadius: 2,
  },
  playerBadge: {
    backgroundColor: "#4DA6FF25",
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  playerBadgeText: {
    fontSize: 8,
    fontFamily: "Inter_700Bold",
    color: "#4DA6FF",
    letterSpacing: 0.5,
  },
  flopBadge: {
    backgroundColor: "#FF4D6A20",
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  flopBadgeText: {
    fontSize: 8,
    fontFamily: "Inter_700Bold",
    color: "#FF4D6A",
    letterSpacing: 0.5,
  },
  scoreChip: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  scoreChipText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },

  emptyState: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 18,
  },
  emptyText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },

  flopPanel: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  flopPanelHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  flopPanelTitle: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  flopEntry: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    paddingBottom: 6,
  },
  flopName: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  flopReason: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },

  legend: {
    flexDirection: "row",
    gap: 16,
    borderTopWidth: 1,
    paddingTop: 12,
    flexWrap: "wrap",
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
});
