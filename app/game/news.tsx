import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList, Platform, Alert, ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useGameplay } from "@/context/GameplayContext";
import { GridBackground } from "@/components/GridBackground";
import { ScreenHeader } from "@/components/ScreenHeader";
import { formatMoney } from "@/constants/gameEconomics";
import {
  NewsItem,
  MONTHS_PT,
  NEWS_CATEGORY_COLORS,
  NEWS_CATEGORY_ICONS,
} from "@/constants/gameEngine";

const FILTER_CATEGORIES = [
  { id: "all", label: "Todas", icon: "list" },
  { id: "launch", label: "Lançamentos", icon: "package" },
  { id: "growth", label: "Crescimento", icon: "trending-up" },
  { id: "tech", label: "Tecnologia", icon: "cpu" },
  { id: "crisis", label: "Crises", icon: "alert-triangle" },
  { id: "competitor", label: "Rivais", icon: "users" },
  { id: "award", label: "Prêmios", icon: "award" },
] as const;

export default function NewsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state, markNewsRead, deleteNews, deleteReadNews, deleteAllNews, respondToAttack } = useGameplay();
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [activeFilter, setActiveFilter] = useState<string>("all");

  if (!state) return null;

  const news = [...state.news].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });

  // Pending attacks come first
  const pendingAttacks = news.filter((n) => n.isAttack && !n.attackResponse);
  const rest = news.filter((n) => !n.isAttack || n.attackResponse);
  const allSorted = [...pendingAttacks, ...rest];
  const sorted = activeFilter === "all"
    ? allSorted
    : allSorted.filter((n) => n.category === activeFilter);

  const unreadCount = news.filter((n) => !n.isRead).length;
  const readCount   = news.filter((n) => n.isRead).length;

  const handleClearRead = () => {
    if (readCount === 0) return;
    Alert.alert(
      "Limpar notificações lidas",
      `Apagar ${readCount} notificação${readCount !== 1 ? "ões" : ""} já lida${readCount !== 1 ? "s" : ""}?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Limpar", style: "destructive", onPress: () => deleteReadNews() },
      ]
    );
  };

  const handleClearAll = () => {
    if (news.length === 0) return;
    Alert.alert(
      "Apagar tudo",
      `Apagar todas as ${news.length} notificações? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Apagar tudo",
          style: "destructive",
          onPress: () => {
            deleteAllNews();
            setActiveFilter("all");
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GridBackground />
      <ScreenHeader title="Notícias & Eventos" />

      {/* Toolbar */}
      <View style={[styles.toolbar, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <View style={styles.toolbarLeft}>
          {unreadCount > 0 ? (
            <View style={[styles.unreadBadge, { backgroundColor: "#FF4D6A" }]}>
              <Text style={styles.unreadBadgeText}>{unreadCount} não lida{unreadCount !== 1 ? "s" : ""}</Text>
            </View>
          ) : (
            <Text style={[styles.allReadText, { color: colors.mutedForeground }]}>Tudo lido ✓</Text>
          )}
          <Text style={[styles.totalCount, { color: colors.mutedForeground }]}>
            {news.length} no total
          </Text>
        </View>
        <View style={styles.toolbarRight}>
          {readCount > 0 && (
            <TouchableOpacity
              onPress={handleClearRead}
              style={[styles.clearBtn, { backgroundColor: "#FF4D6A15", borderColor: "#FF4D6A44" }]}
              activeOpacity={0.8}
            >
              <Feather name="trash-2" size={13} color="#FF4D6A" />
              <Text style={styles.clearBtnText}>Lidas ({readCount})</Text>
            </TouchableOpacity>
          )}
          {news.length > 0 && (
            <TouchableOpacity
              onPress={handleClearAll}
              style={[styles.clearBtn, { backgroundColor: "#FF4D6A22", borderColor: "#FF4D6A66" }]}
              activeOpacity={0.8}
            >
              <Feather name="x" size={13} color="#FF4D6A" />
              <Text style={styles.clearBtnText}>Apagar tudo</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category filter strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.filterStrip, { borderBottomColor: colors.border }]}
        contentContainerStyle={styles.filterStripContent}
      >
        {FILTER_CATEGORIES.map((cat) => {
          const isActive = activeFilter === cat.id;
          const catColor = cat.id === "all" ? "#4DA6FF" : (NEWS_CATEGORY_COLORS as any)[cat.id] ?? "#4DA6FF";
          const count = cat.id === "all" ? news.length : news.filter((n) => n.category === cat.id).length;
          if (cat.id !== "all" && count === 0) return null;
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setActiveFilter(cat.id)}
              style={[styles.filterChip, {
                backgroundColor: isActive ? catColor + "22" : colors.secondary,
                borderColor: isActive ? catColor : colors.border,
              }]}
              activeOpacity={0.7}
            >
              <Feather name={cat.icon as any} size={12} color={isActive ? catColor : colors.mutedForeground} />
              <Text style={[styles.filterChipText, { color: isActive ? catColor : colors.mutedForeground }]}>
                {cat.label}
              </Text>
              {count > 0 && (
                <View style={[styles.filterCount, { backgroundColor: isActive ? catColor : colors.border }]}>
                  <Text style={[styles.filterCountText, { color: isActive ? "#fff" : colors.mutedForeground }]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList
        data={sorted}
        extraData={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: botPad + 24 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="bell-off" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Nenhuma notícia ainda</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Avance o tempo para ver eventos, prêmios e notícias do mercado!
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <NewsCard
            item={item}
            colors={colors}
            playerMoney={state.money}
            onRead={() => markNewsRead(item.id)}
            onDelete={() => deleteNews(item.id)}
            onRespondAttack={(choice) => {
              const err = respondToAttack(item.id, choice);
              if (err) Alert.alert("Erro", err);
            }}
          />
        )}
      />
    </View>
  );
}

function NewsCard({
  item,
  colors,
  playerMoney,
  onRead,
  onDelete,
  onRespondAttack,
}: {
  item: NewsItem;
  colors: any;
  playerMoney: number;
  onRead: () => void;
  onDelete: () => void;
  onRespondAttack: (choice: "revidar" | "ignorar") => void;
}) {
  const isAward   = item.category === "award";
  const isPending = item.isAttack && !item.attackResponse;
  const catColor  = isPending
    ? "#FF4D6A"
    : isAward
    ? "#F5A623"
    : NEWS_CATEGORY_COLORS[item.category] ?? "#4DA6FF";
  const catIcon   = isPending ? "shield-off" : NEWS_CATEGORY_ICONS[item.category] ?? "bell";
  const hasImpact = item.moneyDelta !== 0 || item.fansDelta !== 0 || item.reputationDelta !== 0;

  const handleDelete = () => {
    Alert.alert(
      "Apagar notificação",
      `Apagar "${item.title}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Apagar", style: "destructive", onPress: onDelete },
      ]
    );
  };

  const handleRevidar = () => {
    Alert.alert(
      "Revidar o ataque",
      "Gastas $50.000 numa contra-campanha de relações públicas. Reputação +5.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Confirmar", onPress: () => onRespondAttack("revidar") },
      ]
    );
  };

  // For pending attack cards the outer wrapper must be a plain View — on web,
  // a TouchableOpacity with onPress=undefined still creates a pressable hit zone
  // that swallows touch events before the inner Revidar/Ignorar buttons receive them.
  const CardOuter = (isPending ? View : TouchableOpacity) as typeof TouchableOpacity;
  const cardOuterProps = isPending
    ? {}
    : { onPress: item.isRead ? undefined : onRead, activeOpacity: item.isRead ? 1 : 0.85 };

  return (
    <CardOuter
      {...cardOuterProps}
      style={[
        styles.card,
        {
          backgroundColor: isPending ? "#FF4D6A08" : colors.card,
          borderColor: isPending ? "#FF4D6A55" : item.isRead ? colors.border : catColor + "66",
          borderLeftWidth: item.isRead && !isPending ? 1 : 4,
          borderLeftColor: isPending ? "#FF4D6A" : item.isRead ? colors.border : catColor,
        },
      ]}
    >
      {(!item.isRead || isPending) && (
        <LinearGradient
          colors={[catColor + (isAward ? "16" : isPending ? "12" : "0A"), "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}

      {isAward && (
        <LinearGradient
          colors={["#F5A62310", "#A855F710", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}

      {/* Header row */}
      <View style={styles.cardHeader}>
        <View style={[styles.catIcon, { backgroundColor: catColor + "22" }]}>
          <Feather name={catIcon as any} size={14} color={catColor} />
        </View>

        <View style={styles.cardMeta}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.cardTitle,
                { color: colors.foreground, opacity: item.isRead && !isPending ? 0.65 : 1 },
              ]}
              numberOfLines={2}
            >
              {item.title}
            </Text>
            {!item.isRead && !isPending && (
              <View style={[styles.unreadDot, { backgroundColor: catColor }]} />
            )}
            {isPending && (
              <View style={[styles.pendingBadge, { backgroundColor: "#FF4D6A22" }]}>
                <Text style={styles.pendingBadgeText}>RESPONDER</Text>
              </View>
            )}
          </View>
          <Text style={[styles.cardDate, { color: colors.mutedForeground }]}>
            {MONTHS_PT[item.month - 1]} {item.year}
            {isAward ? " · Premiação Anual" : ""}
          </Text>
        </View>

        {/* Top-right actions (only for non-pending) */}
        {!isPending && (
          <View style={styles.cardActions}>
            {!item.isRead && (
              <TouchableOpacity
                onPress={onRead}
                style={[styles.actionBtn, { backgroundColor: catColor + "22" }]}
                activeOpacity={0.8}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}
              >
                <Feather name="check" size={14} color={catColor} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleDelete}
              style={[styles.actionBtn, { backgroundColor: "#FF4D6A15" }]}
              activeOpacity={0.8}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
            >
              <Feather name="trash-2" size={14} color="#FF4D6A" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Body */}
      <Text
        style={[
          styles.cardBody,
          { color: item.isRead && !isPending ? colors.mutedForeground : colors.foreground },
        ]}
      >
        {item.body}
      </Text>

      {/* Impact chips */}
      {hasImpact && (
        <View style={styles.impactRow}>
          {item.moneyDelta !== 0 && (
            <ImpactChip icon="dollar-sign" value={`${item.moneyDelta >= 0 ? "+" : ""}${formatMoney(item.moneyDelta)}`} color={item.moneyDelta >= 0 ? "#10B981" : "#FF4D6A"} colors={colors} />
          )}
          {item.fansDelta !== 0 && (
            <ImpactChip icon="users" value={`${item.fansDelta >= 0 ? "+" : ""}${item.fansDelta.toLocaleString()}`} color={item.fansDelta >= 0 ? "#A855F7" : "#FF4D6A"} colors={colors} />
          )}
          {item.reputationDelta !== 0 && (
            <ImpactChip icon="star" value={`${item.reputationDelta >= 0 ? "+" : ""}${item.reputationDelta}%`} color={item.reputationDelta >= 0 ? "#F5A623" : "#FF4D6A"} colors={colors} />
          )}
        </View>
      )}

      {/* ── Attack response UI ─────────────────────────────────────────────────── */}
      {isPending && (
        <View style={[styles.attackBox, { borderColor: "#FF4D6A33", backgroundColor: "#FF4D6A08" }]}>
          <Text style={[styles.attackPrompt, { color: colors.foreground }]}>
            Como vais responder?
          </Text>
          <View style={styles.attackBtns}>
            <TouchableOpacity
              style={[styles.attackBtn, { backgroundColor: "#4DA6FF", opacity: playerMoney < 50_000 ? 0.4 : 1 }]}
              activeOpacity={0.8}
              onPress={() => {
                if (playerMoney < 50_000) {
                  Alert.alert("Saldo insuficiente", "Precisas de pelo menos $50.000 para lançar uma contra-campanha de PR.");
                  return;
                }
                handleRevidar();
              }}
            >
              <Feather name="shield" size={14} color="#fff" />
              <View>
                <Text style={styles.attackBtnLabel}>Revidar</Text>
                <Text style={styles.attackBtnSub}>−$50K · Rep +5</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.attackBtn, { backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border }]}
              activeOpacity={0.8}
              onPress={() => onRespondAttack("ignorar")}
            >
              <Feather name="eye-off" size={14} color={colors.mutedForeground} />
              <View>
                <Text style={[styles.attackBtnLabel, { color: colors.foreground }]}>Ignorar</Text>
                <Text style={[styles.attackBtnSub, { color: colors.mutedForeground }]}>Rep −2</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Resolved attack badge */}
      {item.isAttack && item.attackResponse && (
        <View style={styles.resolvedRow}>
          <Feather
            name={item.attackResponse === "revidar" ? "shield" : item.attackResponse === "auto" ? "shield" : "eye-off"}
            size={11}
            color={item.attackResponse === "revidar" ? "#4DA6FF" : item.attackResponse === "auto" ? "#A855F7" : colors.mutedForeground}
          />
          <Text style={[styles.resolvedText, { color: item.attackResponse === "revidar" ? "#4DA6FF" : item.attackResponse === "auto" ? "#A855F7" : colors.mutedForeground }]}>
            {item.attackResponse === "revidar"
              ? "Revidaste · −$50K · Rep +5"
              : item.attackResponse === "auto"
              ? "🏛️ Gerido automaticamente pela assessoria jurídica"
              : "Ignorado · Rep −2"}
          </Text>
        </View>
      )}

      {/* Read indicator (non-attack) */}
      {item.isRead && !item.isAttack && (
        <View style={styles.readIndicator}>
          <Feather name="check-circle" size={11} color={colors.mutedForeground} />
          <Text style={[styles.readIndicatorText, { color: colors.mutedForeground }]}>Lida</Text>
        </View>
      )}
    </CardOuter>
  );
}

function ImpactChip({ icon, value, color, colors }: { icon: keyof typeof Feather.glyphMap; value: string; color: string; colors: any }) {
  return (
    <View style={[styles.chip, { backgroundColor: color + "15", borderColor: color + "33" }]}>
      <Feather name={icon} size={10} color={color} />
      <Text style={[styles.chipText, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  toolbar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  toolbarLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  toolbarRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  unreadBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  unreadBadgeText: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#fff" },
  allReadText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  totalCount: { fontSize: 12, fontFamily: "Inter_400Regular" },
  clearBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1,
  },
  clearBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#FF4D6A" },
  list: { padding: 16, gap: 12 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, paddingTop: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12, overflow: "hidden" },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  catIcon: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center", marginTop: 1 },
  cardMeta: { flex: 1 },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, flexWrap: "wrap" },
  cardTitle: { flex: 1, fontSize: 14, fontFamily: "Inter_700Bold", lineHeight: 21 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  pendingBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  pendingBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#FF4D6A", letterSpacing: 0.5 },
  cardDate: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 3 },
  cardActions: { flexDirection: "row", alignItems: "center", gap: 6 },
  actionBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  cardBody: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 21 },
  impactRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20, borderWidth: 1,
  },
  chipText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  attackBox: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 12 },
  attackPrompt: { fontSize: 13, fontFamily: "Inter_600SemiBold", lineHeight: 20 },
  attackBtns: { flexDirection: "row", gap: 10 },
  attackBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 8,
    padding: 14, borderRadius: 12,
  },
  attackBtnLabel: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#fff" },
  attackBtnSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.75)", marginTop: 1 },
  resolvedRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  resolvedText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  readIndicator: { flexDirection: "row", alignItems: "center", gap: 4 },
  readIndicatorText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  filterStrip: { borderBottomWidth: 1, maxHeight: 56 },
  filterStripContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: "row" },
  filterChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1,
  },
  filterChipText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  filterCount: {
    minWidth: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 4,
  },
  filterCountText: { fontSize: 10, fontFamily: "Inter_700Bold" },
});
