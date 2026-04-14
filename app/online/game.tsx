import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Pressable,
  Platform,
  Animated,
  Alert,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useOnline, type PlayerPublicStats } from "@/context/OnlineContext";
import { useColors } from "@/hooks/useColors";
import { useGameplay } from "@/context/GameplayContext";
import { useGame } from "@/context/GameContext";
import { formatMoney } from "@/constants/gameEconomics";
import { MONTHS_PT, type MonthSummary } from "@/constants/gameEngine";
import { useSound } from "@/context/SoundContext";
import { GridBackground } from "@/components/GridBackground";
import { LinearGradient } from "expo-linear-gradient";

const GAME_TABS = [
  { id: "hq", label: "QG", icon: "home" as const, route: "/game" },
  { id: "dev", label: "Dev", icon: "code" as const, route: "/game/game-dev" },
  { id: "market", label: "Rivais", icon: "target" as const, route: "/game/market" },
  { id: "research", label: "P&D", icon: "cpu" as const, route: "/game/research" },
  { id: "finances", label: "Finanças", icon: "bar-chart-2" as const, route: "/game/finances" },
];

export default function OnlineGameScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state, advanceTime, saveGame, pendingScandal } = useGameplay();
  const { settings } = useGame();
  const { playAdvance } = useSound();
  const {
    room, myId, status, chatMessages, serverTick, attackNotifications,
    sendStats, sendChat, setPause, setSpeed, leaveRoom,
  } = useOnline();

  const [summary, setSummary] = useState<MonthSummary | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [showPlayers, setShowPlayers] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [attackAlert, setAttackAlert] = useState<string | null>(null);

  const advancingRef = useRef(false);
  const advanceTimeRef = useRef(advanceTime);
  const prevTickRef = useRef(serverTick);
  const chatScrollRef = useRef<ScrollView>(null);
  const attackToastAnim = useRef(new Animated.Value(0)).current;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const isHost = room?.hostId === myId;
  const isPaused = room?.status === "paused";

  useEffect(() => { advanceTimeRef.current = advanceTime; }, [advanceTime]);

  // Redirect if no room
  useEffect(() => {
    if (!room) {
      router.replace("/online");
    }
  }, [room]);

  // Broadcast my stats whenever state changes
  useEffect(() => {
    if (!state) return;
    const stats: PlayerPublicStats = {
      money: state.money ?? 0,
      reputation: state.reputation ?? 0,
      fans: state.fans ?? 0,
      marketShare: state.marketShare ?? 0,
      year: state.year ?? 1972,
      month: state.month ?? 1,
      gameCount: state.releasedGames?.length ?? 0,
      consoleCount: state.releasedConsoles?.length ?? 0,
    };
    sendStats(stats);
  }, [state?.money, state?.year, state?.month]);

  // Server tick drives time advance
  useEffect(() => {
    if (serverTick === prevTickRef.current) return;
    prevTickRef.current = serverTick;
    if (isPaused || advancingRef.current) return;

    advancingRef.current = true;
    setAdvancing(true);
    const result = advanceTimeRef.current();
    advancingRef.current = false;
    setAdvancing(false);

    if (result) {
      playAdvance?.();
      setSummary(result);
      setShowSummary(true);
    }
  }, [serverTick, isPaused]);

  // Attack notifications
  useEffect(() => {
    const last = attackNotifications[attackNotifications.length - 1];
    if (!last) return;
    setAttackAlert(`${last.fromName} atacou você: ${last.attackType}`);
    attackToastAnim.setValue(0);
    Animated.sequence([
      Animated.timing(attackToastAnim, { toValue: 1, duration: 300, useNativeDriver: false }),
      Animated.delay(3000),
      Animated.timing(attackToastAnim, { toValue: 0, duration: 300, useNativeDriver: false }),
    ]).start(() => setAttackAlert(null));
  }, [attackNotifications.length]);

  const handleLeave = () => {
    Alert.alert("Sair do jogo?", "Você vai perder sua posição nesta partida.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: () => {
          leaveRoom();
          router.replace("/");
        },
      },
    ]);
  };

  const handleSendChat = () => {
    const msg = chatInput.trim();
    if (!msg) return;
    sendChat(msg);
    setChatInput("");
  };

  if (!room || !state) return null;

  const players = Object.values(room.players).sort((a, b) => b.stats.money - a.stats.money);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GridBackground />

      {/* Online Header Bar */}
      <LinearGradient
        colors={[colors.background, colors.background + "EE"]}
        style={[styles.onlineBar, { paddingTop: topPad + 4 }]}
      >
        <View style={styles.onlineBarInner}>
          {/* Left: connection + room */}
          <View style={styles.onlineLeft}>
            <TouchableOpacity onPress={handleLeave} style={styles.leaveBtn}>
              <Feather name="log-out" size={15} color={colors.destructive} />
            </TouchableOpacity>
            <View style={[styles.connDot, { backgroundColor: status === "connected" ? "#4DFF91" : "#FF4D6A" }]} />
            <Text style={[styles.roomCode, { color: colors.mutedForeground }]}>
              {room.code}
            </Text>
            {isPaused && (
              <View style={[styles.pauseBadge, { backgroundColor: "#F5A623" + "33" }]}>
                <Feather name="pause" size={10} color="#F5A623" />
                <Text style={[styles.pauseText, { color: "#F5A623" }]}>Pausado</Text>
              </View>
            )}
          </View>

          {/* Center: my stats */}
          <View style={styles.myStats}>
            <Text style={[styles.myStat, { color: colors.primary }]}>{formatMoney(state.money ?? 0)}</Text>
            <Text style={[styles.myStatDivider, { color: colors.border }]}>|</Text>
            <Text style={[styles.myStat, { color: colors.foreground }]}>
              {MONTHS_PT[state.month - 1]} {state.year}
            </Text>
            <Text style={[styles.myStatDivider, { color: colors.border }]}>|</Text>
            <Text style={[styles.myStat, { color: colors.foreground }]}>
              👥 {(state.fans ?? 0) >= 1000 ? `${((state.fans ?? 0) / 1000).toFixed(1)}K` : (state.fans ?? 0)}
            </Text>
          </View>

          {/* Right: controls */}
          <View style={styles.onlineRight}>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: colors.secondary }]}
              onPress={() => setShowPlayers(true)}
            >
              <Feather name="users" size={14} color={colors.foreground} />
              <Text style={[styles.iconBtnCount, { color: colors.foreground }]}>{players.length}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: colors.secondary }]}
              onPress={() => setShowChat(true)}
            >
              <Feather name="message-circle" size={14} color={colors.foreground} />
              {chatMessages.length > 0 && (
                <View style={[styles.chatDot, { backgroundColor: colors.primary }]} />
              )}
            </TouchableOpacity>
            {isHost && (
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: isPaused ? "#F5A623" + "33" : colors.secondary }]}
                onPress={() => setPause(!isPaused)}
              >
                <Feather name={isPaused ? "play" : "pause"} size={14} color={isPaused ? "#F5A623" : colors.foreground} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* Attack notification toast */}
      {attackAlert && (
        <Animated.View
          style={[
            styles.attackToast,
            {
              backgroundColor: colors.destructive + "EE",
              opacity: attackToastAnim,
              top: topPad + 60,
            },
          ]}
        >
          <Feather name="zap" size={14} color="#fff" />
          <Text style={styles.attackToastText}>{attackAlert}</Text>
        </Animated.View>
      )}

      {/* Main game content — show HQ stats inline */}
      <ScrollView style={styles.gameContent} contentContainerStyle={styles.gameContentInner}>
        {/* HQ Panel */}
        <HQPanel state={state} colors={colors} />

        {/* Online Rivals Panel */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            <Feather name="users" size={14} color={colors.primary} /> Rivais Online
          </Text>
          {players.map((player, rank) => {
            const isMe = player.id === myId;
            return (
              <View
                key={player.id}
                style={[
                  styles.rivalRow,
                  isMe && { backgroundColor: colors.primary + "11" },
                  { borderColor: colors.border },
                ]}
              >
                <Text style={[styles.rivalRank, { color: colors.mutedForeground }]}>#{rank + 1}</Text>
                <View style={[styles.rivalDot, { backgroundColor: player.color }]} />
                <View style={styles.rivalInfo}>
                  <Text style={[styles.rivalName, { color: isMe ? colors.primary : colors.foreground }]}>
                    {player.name}{isMe ? " (você)" : ""}
                  </Text>
                  <Text style={[styles.rivalSub, { color: colors.mutedForeground }]}>
                    {MONTHS_PT[(player.stats.month ?? 1) - 1]} {player.stats.year ?? 1972}
                    {!player.connected && "  ·  Desconectado"}
                  </Text>
                </View>
                <View style={styles.rivalStats}>
                  <Text style={[styles.rivalMoney, { color: colors.primary }]}>
                    {formatMoney(player.stats.money ?? 0)}
                  </Text>
                  <Text style={[styles.rivalFans, { color: colors.mutedForeground }]}>
                    👥 {(player.stats.fans ?? 0) >= 1000 ? `${((player.stats.fans ?? 0) / 1000).toFixed(1)}K` : player.stats.fans}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Quick nav to full game tabs */}
        <View style={styles.quickNav}>
          <Text style={[styles.quickNavLabel, { color: colors.mutedForeground }]}>NAVEGAR</Text>
          <View style={styles.quickNavBtns}>
            {GAME_TABS.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.navBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                onPress={() => router.push(tab.route as never)}
              >
                <Feather name={tab.icon} size={15} color={colors.primary} />
                <Text style={[styles.navBtnText, { color: colors.foreground }]}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {advancing && (
          <View style={[styles.advancingBar, { backgroundColor: colors.primary + "22" }]}>
            <Text style={[styles.advancingText, { color: colors.primary }]}>
              ⏱ Avançando tempo...
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Monthly Summary Modal */}
      <Modal visible={showSummary} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setShowSummary(false)}>
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.primary + "55" }]}>
            <Text style={[styles.summaryTitle, { color: colors.primary }]}>
              Resumo do Mês
            </Text>
            <View style={styles.summaryRows}>
              <SummaryRow label="Receita Consoles" value={formatMoney(summary?.consoleRevenue ?? 0)} color="#4DFF91" colors={colors} />
              <SummaryRow label="Salários" value={formatMoney(-(summary?.salaryCost ?? 0))} color="#FF4D6A" colors={colors} />
              <SummaryRow label="Manutenção" value={formatMoney(-(summary?.maintenanceCost ?? 0))} color="#FF8C4D" colors={colors} />
              <SummaryRow
                label="Resultado"
                value={`${(summary?.netChange ?? 0) >= 0 ? "+" : ""}${formatMoney(summary?.netChange ?? 0)}`}
                color={(summary?.netChange ?? 0) >= 0 ? "#4DFF91" : "#FF4D6A"}
                colors={colors}
              />
            </View>
            <TouchableOpacity style={styles.summaryClose} onPress={() => setShowSummary(false)}>
              <Text style={{ color: "#070D1A", fontFamily: "Inter_700Bold", fontSize: 14 }}>Continuar</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Players Sidebar Modal */}
      <Modal visible={showPlayers} transparent animationType="slide">
        <View style={styles.sidebarOverlay}>
          <TouchableOpacity style={styles.sidebarBackdrop} onPress={() => setShowPlayers(false)} />
          <View style={[styles.sidebar, { backgroundColor: colors.card }]}>
            <View style={[styles.sidebarHeader, { borderColor: colors.border }]}>
              <Text style={[styles.sidebarTitle, { color: colors.foreground }]}>Jogadores</Text>
              <TouchableOpacity onPress={() => setShowPlayers(false)}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            {isHost && (
              <View style={[styles.speedRow, { borderColor: colors.border }]}>
                <Text style={[styles.speedLabel, { color: colors.mutedForeground }]}>Velocidade</Text>
                <View style={styles.speedBtns}>
                  {([1, 2] as const).map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[
                        styles.speedBtn,
                        {
                          backgroundColor: room.speed === s ? colors.primary : colors.secondary,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() => setSpeed(s)}
                    >
                      <Text style={{ color: room.speed === s ? "#070D1A" : colors.foreground, fontFamily: "Inter_600SemiBold", fontSize: 12 }}>
                        {s}×
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            <ScrollView style={styles.sidebarContent}>
              {players.map((player, rank) => (
                <View key={player.id} style={[styles.sidebarPlayer, { borderColor: colors.border }]}>
                  <View style={[styles.sidebarAvatar, { backgroundColor: player.color }]}>
                    <Text style={styles.sidebarAvatarText}>{player.name.charAt(0)}</Text>
                  </View>
                  <View style={styles.sidebarPlayerInfo}>
                    <Text style={[styles.sidebarPlayerName, { color: player.id === myId ? colors.primary : colors.foreground }]}>
                      #{rank + 1} {player.name}
                    </Text>
                    <Text style={[styles.sidebarPlayerStats, { color: colors.mutedForeground }]}>
                      {formatMoney(player.stats.money)} · 👥 {(player.stats.fans ?? 0) >= 1000 ? `${((player.stats.fans ?? 0) / 1000).toFixed(1)}K` : player.stats.fans}
                    </Text>
                  </View>
                  {!player.connected && (
                    <Feather name="wifi-off" size={14} color={colors.mutedForeground} />
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Chat Modal */}
      <Modal visible={showChat} transparent animationType="slide">
        <View style={styles.sidebarOverlay}>
          <TouchableOpacity style={styles.sidebarBackdrop} onPress={() => setShowChat(false)} />
          <View style={[styles.sidebar, { backgroundColor: colors.card }]}>
            <View style={[styles.sidebarHeader, { borderColor: colors.border }]}>
              <Text style={[styles.sidebarTitle, { color: colors.foreground }]}>Chat</Text>
              <TouchableOpacity onPress={() => setShowChat(false)}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <ScrollView
              ref={chatScrollRef}
              style={styles.sidebarContent}
              onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}
            >
              {chatMessages.length === 0 && (
                <Text style={[styles.emptyChatText, { color: colors.mutedForeground }]}>
                  Nenhuma mensagem ainda.
                </Text>
              )}
              {chatMessages.map((msg, i) => (
                <View key={i} style={styles.chatMsgItem}>
                  <Text style={[styles.chatMsgFrom, { color: colors.primary }]}>{msg.fromName}</Text>
                  <Text style={[styles.chatMsgText, { color: colors.foreground }]}>{msg.message}</Text>
                </View>
              ))}
            </ScrollView>
            <View style={[styles.chatInputArea, { borderColor: colors.border }]}>
              <TextInput
                style={[styles.chatInputField, { backgroundColor: colors.secondary, color: colors.foreground }]}
                value={chatInput}
                onChangeText={setChatInput}
                placeholder="Mensagem..."
                placeholderTextColor={colors.mutedForeground}
                onSubmitEditing={handleSendChat}
                returnKeyType="send"
                maxLength={200}
              />
              <TouchableOpacity
                style={[styles.chatSendBtn, { backgroundColor: colors.primary }]}
                onPress={handleSendChat}
              >
                <Feather name="send" size={14} color="#070D1A" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function HQPanel({
  state,
  colors,
}: {
  state: ReturnType<typeof useGameplay>["state"];
  colors: ReturnType<typeof useColors>;
}) {
  if (!state) return null;
  return (
    <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        Sua Empresa — {state.companyName}
      </Text>
      <View style={styles.statsGrid}>
        <StatBox label="Dinheiro" value={formatMoney(state.money ?? 0)} color={colors.primary} colors={colors} />
        <StatBox label="Reputação" value={`${Math.round((state.reputation ?? 0) * 100)}%`} color="#F5A623" colors={colors} />
        <StatBox label="Fãs" value={(state.fans ?? 0) >= 1000 ? `${((state.fans ?? 0) / 1000).toFixed(1)}K` : `${state.fans ?? 0}`} color="#4DFF91" colors={colors} />
        <StatBox label="Funcionários" value={`${state.employees?.length ?? 0}`} color={colors.foreground} colors={colors} />
      </View>
    </View>
  );
}

function StatBox({ label, value, color, colors }: { label: string; value: string; color: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.statBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function SummaryRow({ label, value, color, colors }: { label: string; value: string; color: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  onlineBar: {
    borderBottomWidth: 1,
    borderBottomColor: "#1E3050",
    paddingBottom: 8,
  },
  onlineBarInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 10,
  },
  onlineLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  leaveBtn: { padding: 4 },
  connDot: { width: 8, height: 8, borderRadius: 4 },
  roomCode: { fontSize: 12, fontFamily: "Inter_700Bold", letterSpacing: 1.5 },
  pauseBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pauseText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  myStats: { flexDirection: "row", alignItems: "center", gap: 6 },
  myStat: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  myStatDivider: { fontSize: 12 },
  onlineRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  iconBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  iconBtnCount: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  chatDot: { width: 6, height: 6, borderRadius: 3 },
  attackToast: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 100,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  attackToastText: { color: "#fff", fontSize: 13, fontFamily: "Inter_600SemiBold", flex: 1 },
  gameContent: { flex: 1 },
  gameContentInner: { padding: 16, gap: 14, paddingBottom: 40 },
  section: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  sectionTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statBox: {
    flex: 1,
    minWidth: 120,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  statValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  rivalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
  },
  rivalRank: { fontSize: 12, fontFamily: "Inter_600SemiBold", width: 24, textAlign: "center" },
  rivalDot: { width: 10, height: 10, borderRadius: 5 },
  rivalInfo: { flex: 1 },
  rivalName: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  rivalSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  rivalStats: { alignItems: "flex-end" },
  rivalMoney: { fontSize: 13, fontFamily: "Inter_700Bold" },
  rivalFans: { fontSize: 11, fontFamily: "Inter_400Regular" },
  quickNav: { gap: 10 },
  quickNavLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  quickNavBtns: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  navBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  navBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  advancingBar: {
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  advancingText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  overlay: {
    flex: 1,
    backgroundColor: "#00000088",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  summaryCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    gap: 16,
  },
  summaryTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  summaryRows: { gap: 10 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  summaryValue: { fontSize: 14, fontFamily: "Inter_700Bold" },
  summaryClose: {
    backgroundColor: "#4DA6FF",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  sidebarOverlay: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  sidebarBackdrop: {
    flex: 1,
    backgroundColor: "#00000066",
  },
  sidebar: {
    width: 300,
    maxWidth: "85%",
    height: "100%",
  },
  sidebarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    paddingTop: 50,
  },
  sidebarTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  sidebarContent: { flex: 1, padding: 16 },
  sidebarPlayer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  sidebarAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  sidebarAvatarText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#070D1A" },
  sidebarPlayerInfo: { flex: 1 },
  sidebarPlayerName: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  sidebarPlayerStats: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  speedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  speedLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  speedBtns: { flexDirection: "row", gap: 8 },
  speedBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  emptyChatText: { fontSize: 13, fontFamily: "Inter_400Regular", fontStyle: "italic", textAlign: "center", marginTop: 20 },
  chatMsgItem: { marginBottom: 10 },
  chatMsgFrom: { fontSize: 11, fontFamily: "Inter_700Bold", marginBottom: 1 },
  chatMsgText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  chatInputArea: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    alignItems: "center",
  },
  chatInputField: {
    flex: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  chatSendBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
