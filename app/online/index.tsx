import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useOnline } from "@/context/OnlineContext";
import { useColors } from "@/hooks/useColors";
import { useGame } from "@/context/GameContext";

const PLAYER_COLORS = [
  "#4DA6FF", "#F5A623", "#FF4D6A", "#4DFF91",
  "#C04DFF", "#FF6B4D", "#4DFFED", "#FFD700",
];

export default function OnlineEntryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { saves } = useGame();
  const { status, room, error, connect, createRoom, joinRoom, clearError } = useOnline();

  const [tab, setTab] = useState<"create" | "join">("create");
  const [roomName, setRoomName] = useState("Minha Sala");
  const [joinCode, setJoinCode] = useState("");
  const [selectedColor, setSelectedColor] = useState(PLAYER_COLORS[0]);

  const companyName = saves[0]?.companyName ?? "Minha Empresa";

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    if (!room) return;
    router.replace("/online/lobby");
  }, [room]);

  const handleCreate = () => {
    if (status === "disconnected") {
      connect();
      setTimeout(() => createRoom(roomName.trim() || "Sala", companyName, selectedColor), 600);
    } else {
      createRoom(roomName.trim() || "Sala", companyName, selectedColor);
    }
  };

  const handleJoin = () => {
    const code = joinCode.trim().toUpperCase();
    if (!code || code.length < 4) return;
    if (status === "disconnected") {
      connect();
      setTimeout(() => joinRoom(code, companyName, selectedColor), 600);
    } else {
      joinRoom(code, companyName, selectedColor);
    }
  };

  const isConnecting = status === "connecting";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: (Platform.OS === "web" ? 67 : insets.top) + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Feather name="wifi" size={18} color={colors.primary} />
          <Text style={[styles.title, { color: colors.foreground }]}>Modo Online</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Error */}
          {error && (
            <View style={[styles.errorBanner, { backgroundColor: colors.destructive + "22", borderColor: colors.destructive }]}>
              <Feather name="alert-circle" size={14} color={colors.destructive} />
              <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
              <TouchableOpacity onPress={clearError}>
                <Feather name="x" size={14} color={colors.destructive} />
              </TouchableOpacity>
            </View>
          )}

          {/* Player identity card */}
          <View style={[styles.identityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Sua empresa</Text>
            <Text style={[styles.identityName, { color: colors.foreground }]}>{companyName}</Text>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 12 }]}>Cor do jogador</Text>
            <View style={styles.colorRow}>
              {PLAYER_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorDot,
                    { backgroundColor: c, borderColor: c === selectedColor ? "#fff" : "transparent" },
                  ]}
                  onPress={() => setSelectedColor(c)}
                />
              ))}
            </View>
          </View>

          {/* Tab selector */}
          <View style={[styles.tabRow, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.tabBtn, tab === "create" && { backgroundColor: colors.primary }]}
              onPress={() => setTab("create")}
            >
              <Feather name="plus-circle" size={14} color={tab === "create" ? "#070D1A" : colors.mutedForeground} />
              <Text style={[styles.tabText, { color: tab === "create" ? "#070D1A" : colors.mutedForeground }]}>Criar Sala</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, tab === "join" && { backgroundColor: colors.primary }]}
              onPress={() => setTab("join")}
            >
              <Feather name="log-in" size={14} color={tab === "join" ? "#070D1A" : colors.mutedForeground} />
              <Text style={[styles.tabText, { color: tab === "join" ? "#070D1A" : colors.mutedForeground }]}>Entrar em Sala</Text>
            </TouchableOpacity>
          </View>

          {/* Create Tab */}
          {tab === "create" && (
            <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Nome da sala</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground }]}
                value={roomName}
                onChangeText={setRoomName}
                placeholder="Ex: Sala do CEO"
                placeholderTextColor={colors.mutedForeground}
                maxLength={30}
              />
              <View style={[styles.infoBadge, { backgroundColor: colors.secondary }]}>
                <Feather name="info" size={12} color={colors.mutedForeground} />
                <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                  Até 4 jogadores. O host controla o ritmo do jogo.
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.primaryBtn, { opacity: isConnecting ? 0.6 : 1 }]}
                onPress={handleCreate}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <ActivityIndicator size="small" color="#070D1A" />
                ) : (
                  <Feather name="plus" size={18} color="#070D1A" />
                )}
                <Text style={styles.primaryBtnText}>Criar Sala</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Join Tab */}
          {tab === "join" && (
            <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Código da sala</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.secondary, borderColor: colors.border, color: colors.foreground }]}
                value={joinCode}
                onChangeText={(v) => setJoinCode(v.toUpperCase())}
                placeholder="Ex: A3B7"
                placeholderTextColor={colors.mutedForeground}
                maxLength={4}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={[styles.primaryBtn, { opacity: isConnecting || joinCode.length < 4 ? 0.6 : 1 }]}
                onPress={handleJoin}
                disabled={isConnecting || joinCode.length < 4}
              >
                {isConnecting ? (
                  <ActivityIndicator size="small" color="#070D1A" />
                ) : (
                  <Feather name="log-in" size={18} color="#070D1A" />
                )}
                <Text style={styles.primaryBtnText}>Entrar</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Info section */}
          <View style={[styles.infoSection, { borderColor: colors.border }]}>
            <Text style={[styles.infoTitle, { color: colors.foreground }]}>Como funciona?</Text>
            {[
              { icon: "clock", text: "O servidor controla o relógio — todos avançam juntos" },
              { icon: "users", text: "Veja as estatísticas dos rivais em tempo real" },
              { icon: "zap", text: "Ataques e sabotagens vão diretamente para o alvo" },
              { icon: "award", text: "Sandbox infinito — sem condição de vitória, o melhor CEO vence" },
            ].map((item, i) => (
              <View key={i} style={styles.infoRow}>
                <Feather name={item.icon as never} size={14} color={colors.primary} />
                <Text style={[styles.infoRowText, { color: colors.mutedForeground }]}>{item.text}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 18, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  scroll: { padding: 20, gap: 16, paddingBottom: 60 },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  errorText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  identityCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  identityName: { fontSize: 18, fontFamily: "Inter_700Bold", marginTop: 4 },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_500Medium", letterSpacing: 0.8, textTransform: "uppercase" },
  colorRow: { flexDirection: "row", gap: 10, marginTop: 10, flexWrap: "wrap" },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
  },
  tabRow: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    padding: 4,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 9,
  },
  tabText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  formCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  infoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  infoText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#4DA6FF",
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#070D1A" },
  infoSection: {
    borderTopWidth: 1,
    paddingTop: 16,
    gap: 10,
  },
  infoTitle: { fontSize: 14, fontFamily: "Inter_700Bold", marginBottom: 4 },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  infoRowText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 18 },
});
