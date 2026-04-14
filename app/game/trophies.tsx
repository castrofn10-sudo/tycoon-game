import React from "react";
import {
  View, Text, StyleSheet, ScrollView, Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useGameplay } from "@/context/GameplayContext";
import { GridBackground } from "@/components/GridBackground";
import { ScreenHeader } from "@/components/ScreenHeader";
import { formatMoney } from "@/constants/gameEconomics";
import { Trophy, TrophyCategory } from "@/constants/gameEngine";

const RANK_LABELS = ["🥇 1.º Lugar", "🥈 2.º Lugar", "🥉 3.º Lugar"];
const RANK_COLORS = ["#F5A623", "#C0C0C0", "#CD7F32"];

const CATEGORY_LABELS: Record<TrophyCategory, string> = {
  game:    "🎮 Jogo do Ano",
  console: "🖥️ Console do Ano",
  company: "🏢 Empresa do Ano",
};

const CATEGORY_COLORS: Record<TrophyCategory, string> = {
  game:    "#4DA6FF",
  console: "#A855F7",
  company: "#10B981",
};

function TrophyCard({ trophy }: { trophy: Trophy }) {
  const colors = useColors();
  const rankColor = RANK_COLORS[trophy.rank - 1] ?? "#F5A623";
  const catColor  = CATEGORY_COLORS[trophy.category];

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <LinearGradient
        colors={[rankColor + "0A", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.cardTop}>
        <View style={[styles.trophyIcon, { backgroundColor: rankColor + "22" }]}>
          <Feather name="award" size={22} color={rankColor} />
        </View>
        <View style={styles.cardMeta}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>{trophy.title}</Text>
          <Text style={[styles.cardYear, { color: colors.mutedForeground }]}>{trophy.year}</Text>
        </View>
        <View style={[styles.rankBadge, { backgroundColor: rankColor + "22" }]}>
          <Text style={[styles.rankText, { color: rankColor }]}>{RANK_LABELS[trophy.rank - 1]}</Text>
        </View>
      </View>

      <View style={styles.cardDetails}>
        <View style={[styles.catBadge, { backgroundColor: catColor + "18" }]}>
          <Text style={[styles.catText, { color: catColor }]}>{CATEGORY_LABELS[trophy.category]}</Text>
        </View>
        <Text style={[styles.productName, { color: colors.foreground }]} numberOfLines={1}>
          {trophy.product}
        </Text>
      </View>

      <View style={[styles.prizeRow, { borderTopColor: colors.border }]}>
        <Feather name="dollar-sign" size={13} color="#10B981" />
        <Text style={[styles.prizeText, { color: "#10B981" }]}>
          Prêmio: {formatMoney(trophy.prizeUSD)}
        </Text>
      </View>
    </View>
  );
}

export default function TrophiesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state } = useGameplay();
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (!state) return null;

  const trophies = (state.trophies ?? []).slice().reverse();
  const totalPrize = trophies.reduce((s, t) => s + t.prizeUSD, 0);
  const gold   = trophies.filter((t) => t.rank === 1).length;
  const silver = trophies.filter((t) => t.rank === 2).length;
  const bronze = trophies.filter((t) => t.rank === 3).length;

  const byYear: Record<number, Trophy[]> = {};
  for (const t of trophies) {
    if (!byYear[t.year]) byYear[t.year] = [];
    byYear[t.year].push(t);
  }
  const years = Object.keys(byYear).map(Number).sort((a, b) => b - a);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GridBackground />
      <ScreenHeader title="Galeria de Troféus" />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary stats */}
        <View style={[styles.statBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>🥇</Text>
            <Text style={[styles.statValue, { color: "#F5A623" }]}>{gold}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Ouro</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>🥈</Text>
            <Text style={[styles.statValue, { color: "#C0C0C0" }]}>{silver}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Prata</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>🥉</Text>
            <Text style={[styles.statValue, { color: "#CD7F32" }]}>{bronze}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Bronze</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Feather name="dollar-sign" size={16} color="#10B981" />
            <Text style={[styles.statValue, { color: "#10B981" }]}>{formatMoney(totalPrize)}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Total</Text>
          </View>
        </View>

        {trophies.length === 0 && (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="award" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Nenhum prêmio ainda</Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              Lança jogos e consoles de sucesso para ganhar premiações anuais em dezembro.
            </Text>
          </View>
        )}

        {years.map((yr) => (
          <View key={yr}>
            <View style={styles.yearHeader}>
              <View style={[styles.yearLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.yearLabel, { color: colors.mutedForeground }]}>{yr}</Text>
              <View style={[styles.yearLine, { backgroundColor: colors.border }]} />
            </View>
            {byYear[yr].map((t) => (
              <TrophyCard key={t.id} trophy={t} />
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 12, gap: 14 },
  statBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-around",
    borderRadius: 16, borderWidth: 1, paddingVertical: 16, paddingHorizontal: 12, marginBottom: 4,
  },
  statItem: { alignItems: "center", gap: 5, flex: 1 },
  statEmoji: { fontSize: 20 },
  statValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  statDivider: { width: 1, height: 38, marginHorizontal: 2 },
  yearHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 4 },
  yearLine: { flex: 1, height: 1 },
  yearLabel: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1.2, textTransform: "uppercase" },
  card: {
    borderRadius: 16, borderWidth: 1, overflow: "hidden", gap: 0,
  },
  cardTop: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
  },
  trophyIcon: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  cardMeta: { flex: 1, gap: 3 },
  cardTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  cardYear: { fontSize: 12, fontFamily: "Inter_400Regular" },
  rankBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9 },
  rankText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  cardDetails: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 16, paddingBottom: 12,
  },
  catBadge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 9 },
  catText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  productName: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold" },
  prizeRow: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderTopWidth: 1, paddingHorizontal: 16, paddingVertical: 12,
  },
  prizeText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  empty: {
    borderRadius: 16, borderWidth: 1, padding: 36,
    alignItems: "center", gap: 14, marginTop: 24,
  },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptyDesc: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 21 },
});
