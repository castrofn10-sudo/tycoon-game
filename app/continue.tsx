import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  Pressable,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

import { useColors } from "@/hooks/useColors";
import { useLanguage } from "@/context/LanguageContext";
import { useGame, SaveSlot } from "@/context/GameContext";
import { useGameplay } from "@/context/GameplayContext";
import { GridBackground } from "@/components/GridBackground";
import { ScreenHeader } from "@/components/ScreenHeader";
import { getCharacterById } from "@/constants/characters";
import { formatMoney } from "@/constants/gameEconomics";

export default function ContinueScreen() {
  const colors = useColors();
  const { t } = useLanguage();
  const { saves, deleteSave } = useGame();
  const { loadGame } = useGameplay();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const getDiffColor = (d: string) => {
    if (d === "easy") return "#4CAF50";
    if (d === "hard") return "#FF9800";
    if (d === "legendary") return "#F5A623";
    return "#4DA6FF";
  };

  const getDiffLabel = (d: string) => {
    if (d === "easy") return "Fácil";
    if (d === "hard") return "Difícil";
    if (d === "legendary") return "Lendário";
    return "Normal";
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GridBackground />
      <ScreenHeader title={t.continueTitle} />

      {saves.length === 0 ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
            <Feather name="inbox" size={40} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{t.noSaves}</Text>
          <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>{t.noSavesDesc}</Text>
          <TouchableOpacity
            onPress={() => { router.back(); router.push("/new-game"); }}
            style={[styles.emptyBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
            activeOpacity={0.8}
          >
            <Feather name="plus" size={16} color={colors.primary} />
            <Text style={[styles.emptyBtnText, { color: colors.primary }]}>{t.newGame}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={saves}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <SaveCard
              item={item}
              colors={colors}
              t={t}
              getDiffColor={getDiffColor}
              getDiffLabel={getDiffLabel}
              onDelete={() => setDeleteTarget(item.id)}
              onPress={async () => {
                await loadGame(item);
                router.push("/game");
              }}
            />
          )}
        />
      )}

      {/* Delete Confirm Modal */}
      <Modal
        visible={!!deleteTarget}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <Pressable style={styles.overlay} onPress={() => setDeleteTarget(null)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={[styles.deleteIcon, { backgroundColor: "#FF4D6A22" }]}>
              <Feather name="trash-2" size={28} color="#FF4D6A" />
            </View>
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>{t.confirmDelete}</Text>
            <Text style={[styles.sheetDesc, { color: colors.mutedForeground }]}>
              {t.confirmDeleteDesc}
            </Text>
            <View style={styles.sheetBtns}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.border, backgroundColor: colors.secondary }]}
                onPress={() => setDeleteTarget(null)}
              >
                <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => {
                  if (deleteTarget) deleteSave(deleteTarget);
                  setDeleteTarget(null);
                }}
              >
                <Text style={styles.deleteBtnText}>{t.confirm}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function SaveCard({
  item,
  colors,
  t,
  getDiffColor,
  getDiffLabel,
  onDelete,
  onPress,
}: {
  item: SaveSlot;
  colors: ReturnType<typeof useColors>;
  t: ReturnType<typeof useLanguage>["t"];
  getDiffColor: (d: string) => string;
  getDiffLabel: (d: string) => string;
  onDelete: () => void;
  onPress: () => void;
}) {
  const diffColor = getDiffColor(item.difficulty);
  const char = getCharacterById(item.characterId ?? "");
  const displayMoney = item.money ?? item.netWorth ?? item.startingMoney ?? 0;
  const displayYear = item.year ?? 1972;
  const products = item.products ?? 0;
  const researchCount = item.researchCount ?? 0;
  const employeeCount = item.employees ?? 0;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <LinearGradient
        colors={[diffColor + "08", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Top row: company name + difficulty + last played */}
      <View style={styles.cardTop}>
        <View style={[styles.cardIcon, { backgroundColor: diffColor + "22" }]}>
          <Feather name="briefcase" size={20} color={diffColor} />
        </View>
        <View style={styles.cardMeta}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            {item.companyName}
          </Text>
          <View style={styles.cardBadges}>
            <View style={[styles.diffBadge, { backgroundColor: diffColor + "22" }]}>
              <Text style={[styles.diffBadgeText, { color: diffColor }]}>
                {getDiffLabel(item.difficulty)}
              </Text>
            </View>
            <Text style={[styles.yearBadge, { color: "#F5A623" }]}>
              {displayYear}
            </Text>
            <Text style={[styles.lastPlayed, { color: colors.mutedForeground }]}>
              · {item.lastPlayed}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={onDelete} style={styles.deleteIconBtn} activeOpacity={0.7}>
          <Feather name="trash-2" size={16} color={colors.destructive} />
        </TouchableOpacity>
      </View>

      {/* Character row */}
      {char && (
        <View style={[styles.charRow, { backgroundColor: char.color + "10", borderTopColor: colors.border }]}>
          <View style={[styles.charIconBadge, { backgroundColor: char.color + "28" }]}>
            <Feather name={char.icon as keyof typeof Feather.glyphMap} size={13} color={char.color} />
          </View>
          <Text style={[styles.charName, { color: char.color }]}>{char.name}</Text>
          <Text style={[styles.charTitle, { color: colors.mutedForeground }]}>· {char.title}</Text>
          <View style={[styles.charPlayBadge, { backgroundColor: char.color + "18" }]}>
            <Text style={[styles.charPlayText, { color: char.color }]}>{char.archetype}</Text>
          </View>
        </View>
      )}

      {/* Stats row */}
      <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
        <Stat
          label="Capital"
          value={formatMoney(displayMoney)}
          valueColor={displayMoney >= item.startingMoney ? "#4CAF50" : "#FF4D6A"}
          colors={colors}
        />
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <Stat label="Produtos" value={String(products)} colors={colors} />
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <Stat label="Pesquisas" value={String(researchCount)} colors={colors} />
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <Stat label="Equipe" value={String(employeeCount)} colors={colors} />
      </View>
    </TouchableOpacity>
  );
}

function Stat({
  label,
  value,
  colors,
  valueColor,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
  valueColor?: string;
}) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: valueColor ?? colors.primary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 20, gap: 14 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center" },
  emptyDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  emptyBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },

  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  cardIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  cardMeta: { flex: 1 },
  cardTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 4 },
  cardBadges: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  diffBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  diffBadgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  yearBadge: { fontSize: 12, fontFamily: "Inter_700Bold" },
  lastPlayed: { fontSize: 10, fontFamily: "Inter_400Regular" },
  deleteIconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  charRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
    borderTopWidth: 1,
  },
  charIconBadge: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  charName: { fontSize: 12, fontFamily: "Inter_700Bold" },
  charTitle: { fontSize: 11, fontFamily: "Inter_400Regular", flex: 1 },
  charPlayBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  charPlayText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },

  statsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  stat: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 14, fontFamily: "Inter_700Bold", marginBottom: 2 },
  statLabel: { fontSize: 9, fontFamily: "Inter_400Regular", letterSpacing: 0.4, textTransform: "uppercase" },
  statDivider: { width: 1, marginHorizontal: 4 },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  sheet: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
  },
  deleteIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  sheetTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 8 },
  sheetDesc: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20, marginBottom: 24 },
  sheetBtns: { flexDirection: "row", gap: 12, width: "100%" },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  cancelText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  deleteBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#FF4D6A",
    alignItems: "center",
  },
  deleteBtnText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff" },
});
