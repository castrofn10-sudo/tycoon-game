import React, { useMemo } from "react";
import { View, Text, ScrollView, StyleSheet, Platform, Dimensions } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGameplay } from "@/context/GameplayContext";
import { useColors } from "@/hooks/useColors";
import { GridBackground } from "@/components/GridBackground";
import { ScreenHeader } from "@/components/ScreenHeader";
import { MONTHS_PT } from "@/constants/gameEngine";
import { formatMoney } from "@/constants/gameEconomics";

const SCREEN_W = Dimensions.get("window").width;

export default function HistoryScreen() {
  const { state } = useGameplay();
  const C = useColors();
  const insets = useSafeAreaInsets();
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const history = useMemo(() => state?.revenueHistory ?? [], [state?.revenueHistory]);
  const releasedGames = useMemo(
    () =>
      (state?.gameProjects ?? [])
        .filter((p) => p.phase === "released")
        .sort((a, b) => (b.receptionScore ?? 0) - (a.receptionScore ?? 0)),
    [state?.gameProjects]
  );
  const franchises = useMemo(() => state?.franchises ?? [], [state?.franchises]);

  const maxRevenue = useMemo(
    () => Math.max(1, ...history.map((h) => h.revenue)),
    [history]
  );

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    scrollContent: { padding: 16, paddingBottom: botPad + 40 },
    section: {
      backgroundColor: C.card, borderRadius: 12, padding: 16,
      marginBottom: 16, borderWidth: 1, borderColor: C.border,
    },
    sectionTitle: {
      fontSize: 13, fontWeight: "700", color: C.mutedForeground,
      letterSpacing: 1, textTransform: "uppercase", marginBottom: 14,
    },
    chartRow: { flexDirection: "row", alignItems: "flex-end", gap: 2, height: 80 },
    bar: { flex: 1, borderRadius: 3, backgroundColor: C.accent },
    chartLabels: {
      flexDirection: "row", gap: 2, marginTop: 4, overflow: "hidden",
    },
    chartLabel: { flex: 1, fontSize: 10, color: C.mutedForeground, textAlign: "center" },
    emptyText: { color: C.mutedForeground, fontSize: 13, textAlign: "center", padding: 24 },
    row: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border + "44",
    },
    rowLabel: { fontSize: 13, color: C.foreground, flex: 1 },
    rowValue: { fontSize: 13, fontWeight: "700", color: C.accent, marginLeft: 8 },
    rowSub: { fontSize: 11, color: C.mutedForeground, marginTop: 1 },
    starRow: { flexDirection: "row", gap: 2, marginTop: 2 },
    starTxt: { fontSize: 11, color: "#F5A623" },
    badge: {
      paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginLeft: 6,
      alignSelf: "center",
    },
    badgeText: { fontSize: 10, fontWeight: "700" },
    repCard: {
      flexDirection: "row", justifyContent: "space-between", marginBottom: 6,
      alignItems: "center",
    },
    repLabel: { fontSize: 12, color: C.foreground, flex: 1 },
    repBarWrap: {
      width: 140, height: 10, backgroundColor: C.border, borderRadius: 5,
      overflow: "hidden", alignSelf: "center",
    },
    repBarFill: { height: "100%" as any, borderRadius: 5 },
    repValue: { width: 34, textAlign: "right", fontSize: 12, fontWeight: "700" },
  });

  const repData = [
    { label: "Técnica", value: state?.techRep ?? 0, color: "#4DA6FF" },
    { label: "Comercial", value: state?.commercialRep ?? 0, color: "#10B981" },
    { label: "Fãs", value: state?.fanRep ?? 0, color: "#F5A623" },
  ];

  return (
    <View style={styles.container}>
      <GridBackground />
      <ScreenHeader title="Histórico" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Revenue Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Receita por Trimestre</Text>
          {history.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum dado ainda. Continue jogando!</Text>
          ) : (
            <>
              <View style={styles.chartRow}>
                {history.map((pt, i) => {
                  const safeRev = Number.isFinite(pt.revenue) ? pt.revenue : 0;
                  const barH = Math.max(4, (safeRev / maxRevenue) * 76);
                  const isGame = (pt.gameRevenue ?? 0) > (pt.consoleRevenue ?? 0);
                  return (
                    <View
                      key={i}
                      style={[styles.bar, { height: barH, backgroundColor: isGame ? "#A855F7" : C.accent }]}
                    />
                  );
                })}
              </View>
              <View style={styles.chartLabels}>
                {history.map((pt, i) => {
                  const showLabel = i === 0 || pt.year !== history[i - 1].year;
                  return (
                    <Text key={i} style={styles.chartLabel}>
                      {showLabel ? pt.year : ""}
                    </Text>
                  );
                })}
              </View>
              <View style={{ flexDirection: "row", gap: 16, marginTop: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: C.accent }} />
                  <Text style={{ fontSize: 10, color: C.mutedForeground }}>Console</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: "#A855F7" }} />
                  <Text style={{ fontSize: 10, color: C.mutedForeground }}>Jogos</Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border }}>
                <View>
                  <Text style={{ fontSize: 10, color: C.mutedForeground }}>Pico</Text>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: C.accent }}>{formatMoney(maxRevenue)}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ fontSize: 10, color: C.mutedForeground }}>Último</Text>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: C.foreground }}>{formatMoney(history[history.length - 1]?.revenue ?? 0)}</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* 3-Part Reputation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⭐ Reputação Multidimensional</Text>
          {repData.map((r) => (
            <View key={r.label} style={styles.repCard}>
              <Text style={styles.repLabel}>{r.label}</Text>
              <View style={styles.repBarWrap}>
                <View style={[styles.repBarFill, { width: `${r.value}%` as any, backgroundColor: r.color }]} />
              </View>
              <Text style={[styles.repValue, { color: r.color }]}>{r.value}</Text>
            </View>
          ))}
          <Text style={{ fontSize: 11, color: C.mutedForeground, marginTop: 8 }}>
            Técnica: P&D e qualidade  ·  Comercial: vendas e parceiros  ·  Fãs: comunidade
          </Text>
        </View>

        {/* Best-rated games */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎮 Melhores Jogos Lançados</Text>
          {releasedGames.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum jogo lançado ainda.</Text>
          ) : (
            releasedGames.slice(0, 10).map((g, i) => (
              <View key={g.id} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel}>#{i + 1} {g.name}</Text>
                  <View style={styles.starRow}>
                    {Array.from({ length: g.starRating ?? 0 }).map((_, si) => (
                      <Text key={si} style={styles.starTxt}>★</Text>
                    ))}
                  </View>
                  <Text style={styles.rowSub}>{g.launchYear} · {g.receptionComment ?? ""}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.rowValue}>{g.receptionScore ?? 0}/100</Text>
                  <Text style={{ fontSize: 10, color: C.mutedForeground }}>
                    {formatMoney(g.totalRevenue ?? 0)} total
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Franchises */}
        {franchises.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎬 Franquias</Text>
            {franchises.map((f) => (
              <View key={f.id} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel}>{f.name}</Text>
                  <Text style={styles.rowSub}>
                    {f.totalGames} jogos · nota média {f.avgScore}/100 · último {f.lastGameScore}/100
                  </Text>
                  <View style={{ flexDirection: "row", gap: 6, marginTop: 4 }}>
                    <View style={[styles.badge, { backgroundColor: "#4DA6FF22" }]}>
                      <Text style={[styles.badgeText, { color: "#4DA6FF" }]}>
                        Demanda {f.fanDemand}%
                      </Text>
                    </View>
                    {f.fatigueLevel > 40 && (
                      <View style={[styles.badge, { backgroundColor: "#FF4D6A22" }]}>
                        <Text style={[styles.badgeText, { color: "#FF4D6A" }]}>
                          Fadiga {f.fatigueLevel}%
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={styles.rowValue}>{formatMoney(f.totalRevenue)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Near-failure recovery badge */}
        {(state?.nearFailureCount ?? 0) > 0 && (
          <View style={[styles.section, { borderColor: state?.recoveredFromCrisis ? "#10B981" : "#FF4D6A" }]}>
            <Text style={styles.sectionTitle}>💪 Momentos Críticos</Text>
            <Text style={{ color: C.foreground, fontSize: 13 }}>
              Você sobreviveu a {state?.nearFailureCount} momento{(state?.nearFailureCount ?? 1) > 1 ? "s" : ""} de crise
              {state?.recoveredFromCrisis ? " e se recuperou com sucesso! 🏆" : "."}
            </Text>
          </View>
        )}

      </ScrollView>
    </View>
  );
}
