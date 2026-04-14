import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  TextInput,
  Platform,
  Share,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useOnline } from "@/context/OnlineContext";
import { useColors } from "@/hooks/useColors";

export default function OnlineLobbyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    room,
    myId,
    status,
    chatMessages,
    setReady,
    startGame,
    kickPlayer,
    leaveRoom,
    sendChat,
  } = useOnline();

  const [chatInput, setChatInput] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const chatScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    if (!room) {
      router.replace("/online");
      return;
    }
    if (room.status === "playing") {
      router.replace("/online/game");
    }
  }, [room]);

  const handleLeave = () => {
    Alert.alert("Sair da sala?", "Você será removido desta sala.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: () => {
          leaveRoom();
          router.replace("/online");
        },
      },
    ]);
  };

  const handleShareCode = async () => {
    if (!room) return;
    try {
      await Share.share({ message: `Entre na sala MEGACORP: ${room.code}` });
    } catch {
      // ignore
    }
  };

  const handleSendChat = () => {
    const msg = chatInput.trim();
    if (!msg) return;
    sendChat(msg);
    setChatInput("");
  };

  if (!room) return null;

  const players = Object.values(room.players);
  const me = myId ? room.players[myId] : null;
  const isHost = room.hostId === myId;
  const allReady = players.filter((p) => p.id !== room.hostId).every((p) => p.ready);
  const canStart = isHost && players.length >= 2 && allReady;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: (Platform.OS === "web" ? 67 : insets.top) + 12 }]}>
        <TouchableOpacity onPress={handleLeave} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.roomName, { color: colors.foreground }]}>{room.name}</Text>
          <View style={styles.codeRow}>
            <Text style={[styles.codeLabel, { color: colors.mutedForeground }]}>Código:</Text>
            <Text style={[styles.code, { color: colors.primary }]}>{room.code}</Text>
            <TouchableOpacity onPress={handleShareCode}>
              <Feather name="share-2" size={14} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "55" }]}>
          <View style={[styles.statusDot, { backgroundColor: status === "connected" ? "#4DFF91" : colors.mutedForeground }]} />
          <Text style={[styles.statusText, { color: colors.mutedForeground }]}>
            {status === "connected" ? "Online" : "Reconectando..."}
          </Text>
        </View>
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <View style={styles.body}>
          {/* Left: Players */}
          <View style={styles.leftCol}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
              JOGADORES ({players.length}/{room.maxPlayers})
            </Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              {players.map((player) => {
                const isMe = player.id === myId;
                const isPlayerHost = player.id === room.hostId;
                return (
                  <View
                    key={player.id}
                    style={[
                      styles.playerCard,
                      {
                        backgroundColor: isMe ? colors.primary + "15" : colors.card,
                        borderColor: isMe ? colors.primary + "44" : colors.border,
                      },
                    ]}
                  >
                    <View style={[styles.playerAvatar, { backgroundColor: player.color }]}>
                      <Text style={styles.playerAvatarText}>{player.name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={styles.playerInfo}>
                      <View style={styles.playerNameRow}>
                        <Text style={[styles.playerName, { color: colors.foreground }]}>{player.name}</Text>
                        {isMe && (
                          <View style={[styles.badge, { backgroundColor: colors.primary + "33" }]}>
                            <Text style={[styles.badgeText, { color: colors.primary }]}>Você</Text>
                          </View>
                        )}
                        {isPlayerHost && (
                          <View style={[styles.badge, { backgroundColor: "#F5A623" + "33" }]}>
                            <Feather name="star" size={10} color="#F5A623" />
                            <Text style={[styles.badgeText, { color: "#F5A623" }]}>Host</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.readyRow}>
                        <View
                          style={[
                            styles.readyDot,
                            {
                              backgroundColor: isPlayerHost || player.ready
                                ? "#4DFF91"
                                : colors.mutedForeground + "66",
                            },
                          ]}
                        />
                        <Text style={[styles.readyText, { color: colors.mutedForeground }]}>
                          {isPlayerHost ? "Host" : player.ready ? "Pronto" : "Aguardando..."}
                        </Text>
                      </View>
                    </View>
                    {isHost && !isMe && (
                      <TouchableOpacity
                        onPress={() => {
                          Alert.alert("Expulsar jogador?", `Remover ${player.name} da sala?`, [
                            { text: "Cancelar", style: "cancel" },
                            { text: "Expulsar", style: "destructive", onPress: () => kickPlayer(player.id) },
                          ]);
                        }}
                        style={styles.kickBtn}
                      >
                        <Feather name="user-x" size={14} color={colors.destructive} />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
              {Array.from({ length: Math.max(0, room.maxPlayers - players.length) }).map((_, i) => (
                <View
                  key={`empty-${i}`}
                  style={[styles.playerCard, styles.emptySlot, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                >
                  <View style={[styles.playerAvatar, { backgroundColor: colors.border }]}>
                    <Feather name="user-plus" size={16} color={colors.mutedForeground} />
                  </View>
                  <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Aguardando jogador...</Text>
                </View>
              ))}
            </ScrollView>

            {/* Action buttons */}
            <View style={styles.actions}>
              {!isHost && (
                <TouchableOpacity
                  style={[
                    styles.readyBtn,
                    {
                      backgroundColor: me?.ready ? colors.secondary : colors.primary,
                      borderColor: me?.ready ? colors.border : colors.primary,
                    },
                  ]}
                  onPress={() => setReady(!me?.ready)}
                >
                  <Feather
                    name={me?.ready ? "x-circle" : "check-circle"}
                    size={18}
                    color={me?.ready ? colors.foreground : "#070D1A"}
                  />
                  <Text
                    style={[styles.readyBtnText, { color: me?.ready ? colors.foreground : "#070D1A" }]}
                  >
                    {me?.ready ? "Cancelar" : "Estou Pronto!"}
                  </Text>
                </TouchableOpacity>
              )}
              {isHost && (
                <TouchableOpacity
                  style={[styles.startBtn, { opacity: canStart ? 1 : 0.5 }]}
                  onPress={startGame}
                  disabled={!canStart}
                >
                  <Feather name="play" size={18} color="#070D1A" />
                  <Text style={styles.startBtnText}>
                    {players.length < 2 ? "Aguardando jogadores..." : !allReady ? "Aguardando prontos..." : "Iniciar Jogo!"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Right: Chat */}
          <View style={[styles.rightCol, { borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>CHAT</Text>
            <ScrollView
              ref={chatScrollRef}
              style={styles.chatScroll}
              onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}
            >
              {chatMessages.length === 0 && (
                <Text style={[styles.emptyChatText, { color: colors.mutedForeground }]}>
                  Nenhuma mensagem ainda. Diga olá!
                </Text>
              )}
              {chatMessages.map((msg, i) => (
                <View key={i} style={styles.chatMsg}>
                  <Text style={[styles.chatFrom, { color: colors.primary }]}>{msg.fromName}</Text>
                  <Text style={[styles.chatText, { color: colors.foreground }]}>{msg.message}</Text>
                </View>
              ))}
            </ScrollView>
            <View style={[styles.chatInputRow, { borderColor: colors.border }]}>
              <TextInput
                style={[styles.chatInput, { backgroundColor: colors.secondary, color: colors.foreground }]}
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
  roomName: { fontSize: 17, fontFamily: "Inter_700Bold" },
  codeRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  codeLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  code: { fontSize: 14, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  body: { flex: 1, flexDirection: "row", paddingHorizontal: 20, gap: 16, paddingBottom: 20 },
  leftCol: { flex: 1, gap: 12 },
  rightCol: { width: 260, borderLeftWidth: 1, paddingLeft: 16, gap: 10 },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1, textTransform: "uppercase" },
  playerCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 10,
  },
  emptySlot: { opacity: 0.5, borderStyle: "dashed" },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  playerAvatarText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#070D1A" },
  playerInfo: { flex: 1 },
  playerNameRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  playerName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  readyRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3 },
  readyDot: { width: 7, height: 7, borderRadius: 4 },
  readyText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  kickBtn: { padding: 6 },
  actions: { gap: 10 },
  readyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  readyBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#4DA6FF",
  },
  startBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#070D1A" },
  chatScroll: { flex: 1 },
  emptyChatText: { fontSize: 13, fontFamily: "Inter_400Regular", fontStyle: "italic", textAlign: "center", marginTop: 20 },
  chatMsg: { marginBottom: 8 },
  chatFrom: { fontSize: 11, fontFamily: "Inter_700Bold", marginBottom: 1 },
  chatText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  chatInputRow: {
    flexDirection: "row",
    gap: 8,
    borderTopWidth: 1,
    paddingTop: 10,
    alignItems: "center",
  },
  chatInput: {
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
