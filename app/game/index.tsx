import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Modal, Pressable, Platform, Animated,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useGameplay } from "@/context/GameplayContext";
import { useGame } from "@/context/GameContext";
import { ScandalModal } from "@/components/ScandalModal";
import { GridBackground } from "@/components/GridBackground";
import { formatMoney } from "@/constants/gameEconomics";
import { MONTHS_PT, MonthSummary, GameProject } from "@/constants/gameEngine";
import { AchievementDef } from "@/constants/achievements";
import { pickDocPhrase, DOC_MIN_COOLDOWN, DOC_MAX_COOLDOWN, DOC_APPEAR_CHANCE, DOC_CONTEXTUAL_CHANCE, DOC_CONTEXTUAL_MIN_COOLDOWN, DOC_RECENT_MEMORY } from "@/constants/docCharacter";
import { SENTIMENT_LABELS, SENTIMENT_COLORS, generatePostLaunchFeedback, type PostLaunchFeedback } from "@/constants/gameReception";
import { getGamingEra } from "@/constants/historicalProgression";
import { useSound } from "@/context/SoundContext";

// Speed options: 0 = paused, 1 = 1x (20s), 2 = 2x (10s), 3 = 3x (5s)
const SPEED_INTERVALS = [0, 20000, 10000, 5000];
const SPEED_LABELS = ["⏸", "1×", "2×", "3×"];

export default function GameHubScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state, advanceTime, saveGame, pendingScandal, respondToScandal,
          pendingShadowOffer, pendingShadowCollection,
          respondToShadowInvestor, dismissShadowCollection,
          pendingRescueOffer, rescueOffer,
          acceptRescueOffer, dismissRescueOffer } = useGameplay();
  const { settings } = useGame();
  const { playAdvance, playClick } = useSound();
  const [summary, setSummary] = useState<MonthSummary | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [speed, setSpeed] = useState(0); // 0=paused, 1=1x, 2=2x, 3=5x
  const [lastChange, setLastChange] = useState<string | null>(null);
  const [receptionQueue, setReceptionQueue] = useState<GameProject[]>([]);
  const [showReception, setShowReception] = useState(false);
  const [achievementQueue, setAchievementQueue] = useState<AchievementDef[]>([]);
  const [achievementToast, setAchievementToast] = useState<AchievementDef | null>(null);
  const achievementToastAnim = useRef(new Animated.Value(0)).current;
  const [docToast, setDocToast] = useState<string | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const docAnim = useRef(new Animated.Value(0)).current;
  // Start with a short 0-3 month initial cooldown so Doc can appear early in the session
  const docCooldownRef = useRef(Math.floor(Math.random() * 4));
  const docRecentRef = useRef<number[]>([]);
  const docActiveRef = useRef(false);
  const [selectedShadowDeal, setSelectedShadowDeal] = useState<"equity"|"debt"|"performance"|null>(null);
  const [selectedRescueDeal, setSelectedRescueDeal] = useState<"bank"|"investor_equity"|"investor_revenue"|null>(null);
  const advancingRef = useRef(false);
  const advanceTimeRef = useRef(advanceTime);
  const speedPulse = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  // Computed early so hooks can reference it safely
  const isGameOver = (state?.year ?? 0) > 2100;

  // Keep advanceTimeRef always pointing to the latest advanceTime (avoids stale closure in timer)
  useEffect(() => {
    advanceTimeRef.current = advanceTime;
  }, [advanceTime]);

  // Keep settingsRef fresh so the interval callback always reads current notification prefs
  const settingsRef = useRef(settings);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  // Keep stateRef fresh so the interval callback can read live game state for Doc triggers
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  // ── Achievement toast dequeue: show one at a time for 3.5 s ──
  useEffect(() => {
    if (achievementToast !== null || achievementQueue.length === 0) return;
    const [next, ...rest] = achievementQueue;
    setAchievementToast(next);
    setAchievementQueue(rest);
    achievementToastAnim.setValue(0);
    Animated.sequence([
      Animated.timing(achievementToastAnim, { toValue: 1, duration: 300, useNativeDriver: false }),
      Animated.delay(2800),
      Animated.timing(achievementToastAnim, { toValue: 0, duration: 300, useNativeDriver: false }),
    ]).start(() => setAchievementToast(null));
  }, [achievementQueue, achievementToast]);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  // ── Pulsing animation when auto-advancing ──
  useEffect(() => {
    if (speed > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(speedPulse, { toValue: 0.7, duration: 500, useNativeDriver: true }),
          Animated.timing(speedPulse, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      speedPulse.stopAnimation();
      speedPulse.setValue(1);
    }
  }, [speed]);

  // ── Auto-advance timer ──
  useEffect(() => {
    if (speed === 0 || isGameOver) return;
    const interval = SPEED_INTERVALS[speed];

    const timer = setInterval(() => {
      if (advancingRef.current) return;
      advancingRef.current = true;
      setAdvancing(true);
      setTimeout(() => {
        const s = advanceTimeRef.current();
        const cfg = settingsRef.current;
        if (s) {
          const sign = (s.netChange ?? 0) >= 0 ? "+" : "";
          setLastChange(`${sign}${formatMoney(s.netChange ?? 0)}`);
          const _exp = (s.officeCost ?? 0) + (s.salaryCost ?? 0) + (s.maintenanceCost ?? 0) - (s.adminSaving ?? 0);
          setMonthlyExpenses(Math.max(0, _exp));
          setMonthlyRevenue(Math.max(0, (s.netChange ?? 0) + _exp));
          // Financial crisis alert — gated on notifMarket
          if ((s.netChange ?? 0) < -500000 && cfg.notifMarket) {
            setSummary(s);
            setShowSummary(true);
            setSpeed(0);
          }
          // Game release reception — gated on notifPopups
          if (s.newlyReleasedGames && s.newlyReleasedGames.length > 0 && cfg.notifPopups) {
            setReceptionQueue(s.newlyReleasedGames);
            setShowReception(true);
            setSpeed(0);
          }
          // Achievement toasts — gated on notifAchievements
          if (s.newlyUnlockedAchievements && s.newlyUnlockedAchievements.length > 0 && cfg.notifAchievements) {
            setAchievementQueue(prev => [...prev, ...s.newlyUnlockedAchievements!]);
          }
          // ── Doc appearance ─────────────────────────────────────────────────────
          // Two trigger paths: contextual (responds to game events) and random.
          // Both are gated on cfg.docEnabled and the shared docCooldownRef so Doc
          // can never appear twice in quick succession.
          if (cfg.docEnabled && !docActiveRef.current) {
            docCooldownRef.current -= 1;

            const curState = stateRef.current;

            // ── Path A: contextual triggers ─────────────────────────────────────
            // Fires when a meaningful game event happens AND the cooldown is low enough.
            // Uses a higher 60% chance so Doc reacts to important moments reliably.
            let docCategoryHint: import("@/constants/docCharacter").DocPhrase["category"] | undefined;
            let contextualTriggered = false;
            if (docCooldownRef.current <= DOC_CONTEXTUAL_MIN_COOLDOWN) {
              const isCrisis        = (s.netChange ?? 0) < -300_000;
              const isBigWin        = (s.netChange ?? 0) > 500_000;
              const isGameRelease   = (s.newlyReleasedGames?.length ?? 0) > 0;
              const isAchievement   = (s.newlyUnlockedAchievements?.length ?? 0) > 0;
              const isLowMoney      = (curState?.money ?? Infinity) < 100_000;
              const isCompPressure  = (curState?.news ?? []).some(
                (n) => n.isAttack && !n.attackResponse && n.month === (curState?.month ?? 0)
              );

              if      (isCrisis       && Math.random() < DOC_CONTEXTUAL_CHANCE) { docCategoryHint = "advice";    contextualTriggered = true; }
              else if (isBigWin       && Math.random() < DOC_CONTEXTUAL_CHANCE) { docCategoryHint = "signature"; contextualTriggered = true; }
              else if (isGameRelease  && Math.random() < DOC_CONTEXTUAL_CHANCE) { docCategoryHint = "market";    contextualTriggered = true; }
              else if (isAchievement  && Math.random() < DOC_CONTEXTUAL_CHANCE) { docCategoryHint = "signature"; contextualTriggered = true; }
              else if (isLowMoney     && Math.random() < DOC_CONTEXTUAL_CHANCE) { docCategoryHint = "advice";    contextualTriggered = true; }
              else if (isCompPressure && Math.random() < DOC_CONTEXTUAL_CHANCE) { docCategoryHint = "market";    contextualTriggered = true; }
            }

            // ── Path B: random trigger ──────────────────────────────────────────
            // Fires 20% of the time once the normal cooldown (4–8 months) expires.
            const randomTriggered = !contextualTriggered && docCooldownRef.current <= 0 && Math.random() < DOC_APPEAR_CHANCE;

            if (contextualTriggered || randomTriggered) {
              const { text, index } = pickDocPhrase(docRecentRef.current, docCategoryHint);
              docRecentRef.current = [...docRecentRef.current.slice(-(DOC_RECENT_MEMORY - 1)), index];
              // Reset cooldown: 4-8 months for contextual, standard range for random
              docCooldownRef.current = Math.floor(Math.random() * (DOC_MAX_COOLDOWN - DOC_MIN_COOLDOWN + 1)) + DOC_MIN_COOLDOWN;
              const holdMs = Math.floor(Math.random() * 2000) + 3000; // 3–5 s (slightly longer for readability)
              docActiveRef.current = true;
              setDocToast(text);
              docAnim.setValue(0);
              Animated.sequence([
                Animated.timing(docAnim, { toValue: 1, duration: 400, useNativeDriver: false }),
                Animated.delay(holdMs),
                Animated.timing(docAnim, { toValue: 0, duration: 400, useNativeDriver: false }),
              ]).start(() => { setDocToast(null); docActiveRef.current = false; });
            }
          }
        }
        advancingRef.current = false;
        setAdvancing(false);
      }, 200);
    }, interval);

    return () => clearInterval(timer);
  }, [speed, isGameOver]);

  if (!state) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <GridBackground />
        <View style={styles.emptyWrap}>
          <Feather name="loader" size={40} color={colors.primary} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Carregando jogo...
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={[styles.backBtnText, { color: colors.primary }]}>← Voltar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const unreadCount = settings.notifNews ? state.news.filter((n) => !n.isRead).length : 0;
  const activeConsoles = state.consoles.filter((c) => !c.isDiscontinued).length;
  const currentEra = getGamingEra(state.year);

  // Manual advance (only when paused)
  const handleAdvance = () => {
    if (advancing || speed > 0) return;
    playAdvance();
    setAdvancing(true);
    setTimeout(() => {
      const s = advanceTime();
      if (s) {
        const _exp = (s.officeCost ?? 0) + (s.salaryCost ?? 0) + (s.maintenanceCost ?? 0) - (s.adminSaving ?? 0);
        setMonthlyExpenses(Math.max(0, _exp));
        setMonthlyRevenue(Math.max(0, (s.netChange ?? 0) + _exp));
        if (settings.notifPopups) { setSummary(s); setShowSummary(true); }
        if (s.newlyUnlockedAchievements?.length && settings.notifAchievements) {
          setAchievementQueue(prev => [...prev, ...s.newlyUnlockedAchievements!]);
        }
      }
      setAdvancing(false);
    }, 300);
  };

  const handleSpeedChange = (s: number) => {
    playClick();
    setSpeed(s);
    if (s > 0) setLastChange(null); // clear last change when resuming
  };


  const getDiffColor = () => {
    if (state.difficulty === "easy") return "#4CAF50";
    if (state.difficulty === "hard") return "#FF9800";
    if (state.difficulty === "legendary") return "#F5A623";
    return colors.primary;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GridBackground />

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {/* ── HUD Header ── */}
        <LinearGradient
          colors={["#070D1A", "#0A1628"]}
          style={[styles.hud, { paddingTop: topPad + 8 }]}
        >
          <View style={styles.hudTop}>
            <View>
              <Text style={styles.hudCompany}>{state.companyName}</Text>
              <Text style={styles.hudPeriod}>
                {MONTHS_PT[state.month - 1]} {state.year}
              </Text>
            </View>
            <View style={styles.hudRight}>
              {/* Era badge */}
              <View style={[styles.eraBadge, { backgroundColor: currentEra.color + "22", borderColor: currentEra.color + "44" }]}>
                <Feather name={currentEra.icon as any} size={10} color={currentEra.color} />
                <Text style={[styles.eraBadgeText, { color: currentEra.color }]} numberOfLines={1}>
                  {currentEra.name.split(" ")[0]}
                </Text>
              </View>
              <View style={[styles.diffBadge, { backgroundColor: getDiffColor() + "22" }]}>
                <Text style={[styles.diffBadgeText, { color: getDiffColor() }]}>
                  {state.difficulty.charAt(0).toUpperCase() + state.difficulty.slice(1)}
                </Text>
              </View>
              <TouchableOpacity onPress={() => { setSpeed(0); setShowExitModal(true); }} style={styles.exitBtn}>
                <Feather name="log-out" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Money */}
          <Text style={styles.hudMoney}>{formatMoney(state.money)}</Text>

          {/* Stats row */}
          <View style={styles.hudStats}>
            <HudStat icon="users" value={(Number.isFinite(state.fans) ? state.fans : 0).toLocaleString()} label="Fãs" color="#A855F7" />
            <HudStat icon="star" value={`${Math.round(Number.isFinite(state.reputation) ? state.reputation : 0)}%`} label="Reputação" color="#F5A623" />
            <HudStat icon="pie-chart" value={`${(Number.isFinite(state.marketShare) ? state.marketShare : 0).toFixed(1)}%`} label="Market Share" color="#4DA6FF" />
            <View style={[styles.hudStat, { gap: 1 }]}>
              <Feather name="activity" size={11} color="#22c55e" />
              <Text style={{ fontSize: 12, fontFamily: "Inter_700Bold", color: "#22c55e" }} numberOfLines={1} adjustsFontSizeToFit>
                {monthlyRevenue > 0 ? `+${formatMoney(monthlyRevenue)}` : "+$0"}
              </Text>
              <Text style={{ fontSize: 10, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.35)", lineHeight: 12 }}>/</Text>
              <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: "#ef4444" }} numberOfLines={1} adjustsFontSizeToFit>
                {monthlyExpenses > 0 ? `-${formatMoney(monthlyExpenses)}` : "-$0"}
              </Text>
            </View>
          </View>

          {/* Compact efficiency/saturation mini-strip — full details in Métricas */}
          {(state.companyEfficiency !== undefined) && (() => {
            const eff = state.companyEfficiency ?? 1.0;
            const sat = state.avgMarketSaturation ?? 0;
            const effColor = eff >= 1.3 ? "#10B981" : eff >= 0.9 ? "#4DA6FF" : eff >= 0.6 ? "#F5A623" : "#FF4D6A";
            const satColor = sat >= 0.5 ? "#FF4D6A" : sat >= 0.25 ? "#F5A623" : "#10B981";
            return (
              <View style={{
                flexDirection: "row", gap: 12, marginTop: 8,
                backgroundColor: colors.card + "60", borderRadius: 8,
                paddingVertical: 7, paddingHorizontal: 12,
                borderWidth: 1, borderColor: colors.border,
              }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5, flex: 1 }}>
                  <Feather name="zap" size={10} color={effColor} />
                  <Text style={{ fontSize: 10, fontFamily: "Inter_500Medium", color: colors.mutedForeground }}>Efic.</Text>
                  <Text style={{ fontSize: 11, fontFamily: "Inter_700Bold", color: effColor }}>{(eff * 100).toFixed(0)}%</Text>
                </View>
                <View style={{ width: 1, backgroundColor: colors.border }} />
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5, flex: 1 }}>
                  <Feather name="globe" size={10} color={satColor} />
                  <Text style={{ fontSize: 10, fontFamily: "Inter_500Medium", color: colors.mutedForeground }}>Sat.</Text>
                  <Text style={{ fontSize: 11, fontFamily: "Inter_700Bold", color: satColor }}>{Math.round(sat * 100)}%</Text>
                </View>
                <View style={{ width: 1, backgroundColor: colors.border }} />
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5, flex: 1 }}>
                  <Feather name="users" size={10} color="#A855F7" />
                  <Text style={{ fontSize: 10, fontFamily: "Inter_500Medium", color: colors.mutedForeground }}>Fãs</Text>
                  <Text style={{ fontSize: 11, fontFamily: "Inter_700Bold", color: "#A855F7" }}>
                    {(state.fans ?? 0) >= 1000 ? `${((state.fans ?? 0) / 1000).toFixed(1)}K` : String(state.fans ?? 0)}
                  </Text>
                </View>
              </View>
            );
          })()}

          {/* Progress bar toward 2100 */}
          <View style={styles.timelineBar}>
            <Text style={styles.timelineLabel}>1972</Text>
            <View style={styles.timelineTrack}>
              <View
                style={[
                  styles.timelineFill,
                  {
                    width: `${Math.min(100, ((state.year - 1972) / (2100 - 1972)) * 100)}%`,
                    backgroundColor: "#4DA6FF",
                  },
                ]}
              />
            </View>
            <Text style={styles.timelineLabel}>2100</Text>
          </View>
        </LinearGradient>

        {/* ── Dashboard Cards ── */}
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 72 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.grid}>
            <DashCard
              icon="monitor"
              title="Meus Consoles"
              subtitle={`${activeConsoles} ativo${activeConsoles !== 1 ? "s" : ""}`}
              color="#4DA6FF"
              onPress={() => router.push("/game/consoles" as any)}
              colors={colors}
              badge={activeConsoles === 0 ? "!" : undefined}
            />
            <DashCard
              icon="briefcase"
              title="Escritórios"
              subtitle={`Design ${state.offices.design} · Tech ${state.offices.tech}`}
              color="#10B981"
              onPress={() => router.push("/game/offices")}
              colors={colors}
            />
            <DashCard
              icon="globe"
              title="Mercado"
              subtitle={`${state.competitors.length} rivais ativos`}
              color="#A855F7"
              onPress={() => router.push("/game/market")}
              colors={colors}
            />
            <DashCard
              icon="bell"
              title="Notícias"
              subtitle={`${unreadCount} não lida${unreadCount !== 1 ? "s" : ""}`}
              color="#F5A623"
              onPress={() => router.push("/game/news")}
              colors={colors}
              badge={unreadCount > 0 ? String(unreadCount) : undefined}
            />
            <DashCard
              icon="radio"
              title="Marketing"
              subtitle={state.activeMarketing !== "none" ? `${state.marketingMonthsLeft} meses restantes` : "Sem campanha ativa"}
              color="#FF4D6A"
              onPress={() => router.push("/game/marketing")}
              colors={colors}
              badge={state.activeMarketing !== "none" ? "●" : undefined}
            />
            <DashCard
              icon="cpu"
              title="Pesquisa"
              subtitle={state.currentResearch ? `${Math.round(state.researchMonthsLeft ?? 0)}m restantes` : `${(state.researchedNodes ?? []).length} nós desbloqueados`}
              color="#A855F7"
              onPress={() => router.push("/game/research")}
              colors={colors}
              badge={state.currentResearch ? "●" : undefined}
            />
            <DashCard
              icon="bar-chart-2"
              title="Métricas"
              subtitle={`Efic. ${Math.round((state.companyEfficiency ?? 1) * 100)}% · ${state.characterId ?? "estrategista"}`}
              color="#A855F7"
              onPress={() => router.push("/game/metrics" as any)}
              colors={colors}
            />
            <DashCard
              icon="users"
              title="Equipa"
              subtitle={`${(state.employees ?? []).length} funcionário${(state.employees ?? []).length !== 1 ? "s" : ""}`}
              color="#10B981"
              onPress={() => router.push("/game/employees")}
              colors={colors}
            />
            <DashCard
              icon="play-circle"
              title="Meus Jogos"
              subtitle={`${(state.gameProjects ?? []).filter(p => p.phase === "development").length} em dev · ${(state.gameProjects ?? []).filter(p => p.phase === "released").length} lançados`}
              color="#FF4D6A"
              onPress={() => router.push("/game/game-dev")}
              colors={colors}
              badge={(state.gameProjects ?? []).filter(p => p.phase === "released").length > 0 ? String((state.gameProjects ?? []).filter(p => p.phase === "released").length) : undefined}
            />
            <DashCard
              icon="map"
              title="Mapa Global"
              subtitle={`${(state.unlockedCountries ?? []).length} mercados · ${(state.branches ?? []).length} filiais`}
              color="#10B981"
              onPress={() => router.push("/game/world-map")}
              colors={colors}
            />
            <DashCard
              icon="trending-up"
              title="Finanças"
              subtitle={`Rating ${state.creditRating ?? "BBB"} · ${(state.activeLoans ?? []).length} empréstimo${(state.activeLoans ?? []).length !== 1 ? "s" : ""}`}
              color="#F5A623"
              onPress={() => router.push("/game/finances")}
              colors={colors}
              badge={(state.activeLoans ?? []).length > 0 ? String((state.activeLoans ?? []).length) : undefined}
            />
            <DashCard
              icon="award"
              title="Troféus"
              subtitle={`${(state.trophies ?? []).length} prêmio${(state.trophies ?? []).length !== 1 ? "s" : ""} conquistado${(state.trophies ?? []).length !== 1 ? "s" : ""}`}
              color="#F5A623"
              onPress={() => router.push("/game/trophies" as any)}
              colors={colors}
              badge={(state.trophies ?? []).length > 0 ? String((state.trophies ?? []).length) : undefined}
            />
            <DashCard
              icon="check-circle"
              title="Conquistas"
              subtitle={`${(state.unlockedAchievements ?? []).length} desbloqueada${(state.unlockedAchievements ?? []).length !== 1 ? "s" : ""}`}
              color="#10B981"
              onPress={() => router.push("/game/achievements" as any)}
              colors={colors}
              badge={(state.unlockedAchievements ?? []).length > 0 ? String((state.unlockedAchievements ?? []).length) : undefined}
            />
            <DashCard
              icon="bar-chart-2"
              title="Histórico"
              subtitle={`${(state.revenueHistory ?? []).length} pontos · ${(state.franchises ?? []).length} franquia${(state.franchises ?? []).length !== 1 ? "s" : ""}`}
              color="#A855F7"
              onPress={() => router.push("/game/history" as any)}
              colors={colors}
            />
            <DashCard
              icon="package"
              title="Novo Console"
              subtitle="Criar e lançar"
              color="#FF4D6A"
              onPress={() => router.push("/game/console-builder")}
              colors={colors}
              highlight
            />
          </View>

          {/* ── Meus Consoles Section ── */}
          <View style={[styles.quickSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.quickSectionHeader}>
              <View style={styles.quickSectionLeft}>
                <View style={[styles.quickSectionIcon, { backgroundColor: "#4DA6FF22" }]}>
                  <Feather name="monitor" size={16} color="#4DA6FF" />
                </View>
                <Text style={[styles.quickSectionTitle, { color: colors.foreground }]}>Meus Consoles</Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push("/game/consoles" as any)}
                style={[styles.quickSectionBtn, { backgroundColor: "#4DA6FF22", borderColor: "#4DA6FF44" }]}
                activeOpacity={0.8}
              >
                <Text style={styles.quickSectionBtnText}>Ver Todos</Text>
                <Feather name="chevron-right" size={13} color="#4DA6FF" />
              </TouchableOpacity>
            </View>

            {state.consoles.filter(c => !c.isDiscontinued).length > 0 ? (
              state.consoles.filter((c) => !c.isDiscontinued).slice(0, 3).map((c) => {
                const rColor = c.rating >= 7 ? "#10B981" : c.rating >= 5 ? "#F5A623" : "#FF4D6A";
                return (
                  <View key={c.id} style={[styles.quickRow, { borderTopColor: colors.border }]}>
                    <View style={[styles.quickRowIcon, { backgroundColor: rColor + "22" }]}>
                      <Feather name="monitor" size={14} color={rColor} />
                    </View>
                    <View style={styles.quickRowMeta}>
                      <Text style={[styles.quickRowName, { color: colors.foreground }]}>{c.name}</Text>
                      <Text style={[styles.quickRowSub, { color: colors.mutedForeground }]}>
                        {(Number.isFinite(c.unitsSold) ? c.unitsSold : 0).toLocaleString()} vendas · ${Number.isFinite(c.price) ? c.price : 0}
                      </Text>
                    </View>
                    <View style={[styles.quickRating, { backgroundColor: rColor + "22" }]}>
                      <Text style={[styles.quickRatingText, { color: rColor }]}>{(Number.isFinite(c.rating) ? c.rating : 0).toFixed(1)}</Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <TouchableOpacity
                onPress={() => router.push("/game/console-builder")}
                style={[styles.quickEmptyBtn, { backgroundColor: "#4DA6FF11", borderColor: "#4DA6FF33" }]}
                activeOpacity={0.8}
              >
                <Feather name="plus-circle" size={15} color="#4DA6FF" />
                <Text style={[styles.quickEmptyText, { color: "#4DA6FF" }]}>Criar primeiro console</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ── Meus Jogos Section ── */}
          <View style={[styles.quickSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.quickSectionHeader}>
              <View style={styles.quickSectionLeft}>
                <View style={[styles.quickSectionIcon, { backgroundColor: "#FF4D6A22" }]}>
                  <Feather name="play-circle" size={16} color="#FF4D6A" />
                </View>
                <Text style={[styles.quickSectionTitle, { color: colors.foreground }]}>Meus Jogos</Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push("/game/game-dev")}
                style={[styles.quickSectionBtn, { backgroundColor: "#FF4D6A22", borderColor: "#FF4D6A44" }]}
                activeOpacity={0.8}
              >
                <Text style={[styles.quickSectionBtnText, { color: "#FF4D6A" }]}>Ver Todos</Text>
                <Feather name="chevron-right" size={13} color="#FF4D6A" />
              </TouchableOpacity>
            </View>

            {(state.gameProjects ?? []).filter(p => p.phase === "released" || p.phase === "development").length > 0 ? (
              (state.gameProjects ?? [])
                .filter(p => p.phase === "released" || p.phase === "development")
                .slice(0, 3)
                .map((proj) => {
                  const isDev = proj.phase === "development";
                  const pColor = isDev ? "#F5A623" : "#10B981";
                  const phaseLabel = isDev ? `Dev ${proj.monthsElapsed}/${proj.monthsRequired}m` : "Lançado";
                  return (
                    <View key={proj.id} style={[styles.quickRow, { borderTopColor: colors.border }]}>
                      <View style={[styles.quickRowIcon, { backgroundColor: pColor + "22" }]}>
                        <Feather name="play" size={14} color={pColor} />
                      </View>
                      <View style={styles.quickRowMeta}>
                        <Text style={[styles.quickRowName, { color: colors.foreground }]}>{proj.name}</Text>
                        <Text style={[styles.quickRowSub, { color: colors.mutedForeground }]}>{phaseLabel}</Text>
                      </View>
                      {proj.phase === "released" && (
                        <Text style={[styles.quickRevText, { color: "#10B981" }]}>
                          {formatMoney(proj.monthlyRevenue)}/m
                        </Text>
                      )}
                    </View>
                  );
                })
            ) : (
              <TouchableOpacity
                onPress={() => router.push("/game/game-dev")}
                style={[styles.quickEmptyBtn, { backgroundColor: "#FF4D6A11", borderColor: "#FF4D6A33" }]}
                activeOpacity={0.8}
              >
                <Feather name="plus-circle" size={15} color="#FF4D6A" />
                <Text style={[styles.quickEmptyText, { color: "#FF4D6A" }]}>Criar primeiro jogo</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        {/* ── Speed Control Bar ── */}
        <View style={[styles.advanceBar, { paddingBottom: botPad + 10 }]}>
          {isGameOver ? (
            <View style={[styles.gameOverBanner, { backgroundColor: "#F5A62322", borderColor: "#F5A62344" }]}>
              <Feather name="flag" size={18} color="#F5A623" />
              <Text style={styles.gameOverText}>Jogo concluído — 2100!</Text>
            </View>
          ) : (
            <View style={[styles.speedPill, { backgroundColor: colors.card + "F5", borderColor: colors.border }]}>
              {SPEED_LABELS.map((label, i) => {
                const active = speed === i;
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => handleSpeedChange(i)}
                    activeOpacity={0.75}
                    style={[styles.speedBtn, {
                      backgroundColor: active ? colors.primary : "transparent",
                    }]}
                  >
                    <Text style={[styles.speedBtnText, {
                      color: active ? colors.primaryForeground : colors.mutedForeground,
                    }]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {lastChange !== null && speed > 0 && (
                <Text style={[styles.speedTicker, {
                  color: (lastChange ?? "").startsWith("+") ? "#22c55e" : "#ef4444",
                }]} numberOfLines={1}>
                  {lastChange}
                </Text>
              )}
            </View>
          )}
        </View>
      </Animated.View>

      {/* Month Summary Modal */}
      <Modal visible={showSummary} transparent animationType="fade" statusBarTranslucent>
        <Pressable style={styles.overlay} onPress={() => setShowSummary(false)}>
          <Pressable style={[styles.summarySheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.summaryHeader}>
              <Feather name="calendar" size={20} color="#4DA6FF" />
              <Text style={[styles.summaryTitle, { color: colors.foreground }]}>
                Resumo do Mês
              </Text>
            </View>
            {summary && (
              <>
                {summary.officeCost > 0 && (
                  <SummaryRow label="Escritórios" value={`-${formatMoney(summary.officeCost)}`} color="#FF4D6A" colors={colors} />
                )}
                {summary.adminSaving > 0 && (
                  <SummaryRow label="Economia (Admin)" value={`+${formatMoney(summary.adminSaving)}`} color="#10B981" colors={colors} />
                )}
                {summary.salaryCost > 0 && (
                  <SummaryRow label="Salários" value={`-${formatMoney(summary.salaryCost)}`} color="#F59E0B" colors={colors} />
                )}
                {summary.maintenanceCost > 0 && (
                  <SummaryRow label="Manutenção & Overhead" value={`-${formatMoney(summary.maintenanceCost)}`} color="#A855F7" colors={colors} />
                )}
                {summary.consoleSales > 0 && (
                  <SummaryRow label={`Vendas (${summary.consoleSales.toLocaleString()} un.)`} value={`+${formatMoney(summary.consoleRevenue)}`} color="#4DA6FF" colors={colors} />
                )}
                <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
                <SummaryRow
                  label="Variação líquida"
                  value={`${summary.netChange >= 0 ? "+" : ""}${formatMoney(summary.netChange)}`}
                  color={summary.netChange >= 0 ? "#10B981" : "#FF4D6A"}
                  colors={colors}
                  bold
                />
                {summary.newNews && (
                  <View style={[styles.summaryNews, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                    <Feather name="bell" size={12} color="#F5A623" />
                    <Text style={[styles.summaryNewsText, { color: colors.mutedForeground }]}>
                      {summary.newNews.title}
                    </Text>
                  </View>
                )}
              </>
            )}
            <TouchableOpacity
              onPress={() => setShowSummary(false)}
              style={[styles.summaryBtn, { backgroundColor: "#4DA6FF" }]}
            >
              <Text style={styles.summaryBtnText}>Continuar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Game Reception Modal */}
      <Modal visible={showReception && receptionQueue.length > 0} transparent animationType="slide" statusBarTranslucent>
        <Pressable style={styles.overlay} onPress={() => {}}>
          <View style={[styles.receptionSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {receptionQueue.length > 0 && (() => {
              const proj = receptionQueue[0];
              const sentColor = proj.receptionSentiment ? SENTIMENT_COLORS[proj.receptionSentiment] : "#4DA6FF";
              const stars = proj.starRating ?? 3;
              const projGenres = (proj.genres && proj.genres.length > 0 ? proj.genres : [proj.genre]);
              return (
                <>
                  <View style={[styles.receptionBanner, { backgroundColor: sentColor + "15" }]}>
                    <Feather name="package" size={18} color={sentColor} />
                    <Text style={[styles.receptionBannerText, { color: sentColor }]}>LANÇAMENTO!</Text>
                  </View>
                  <Text style={[styles.receptionGameName, { color: colors.foreground }]}>{proj.name}</Text>
                  <Text style={[styles.receptionGenres, { color: colors.mutedForeground }]}>
                    {projGenres.map((g: any) => {
                      const GAME_GENRE_NAMES_LOCAL: Record<string, string> = {
                        rpg: "RPG", action: "Ação", adventure: "Aventura", racing: "Corrida",
                        shooter: "Shooter", horror: "Terror", puzzle: "Puzzle", sandbox: "Mundo Aberto",
                        platformer: "Plataforma", sports: "Esportes", sim: "Simulação",
                        strategy: "Estratégia", indie: "Indie",
                      };
                      return GAME_GENRE_NAMES_LOCAL[g] ?? g;
                    }).join(" + ")}
                  </Text>

                  {/* Stars + Score */}
                  <View style={styles.receptionStarRow}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <Feather key={i} name="star" size={28} color={i <= stars ? "#F5A623" : "#33446644"} />
                    ))}
                    <View style={[styles.receptionScoreBadge, { backgroundColor: sentColor + "22" }]}>
                      <Text style={[styles.receptionScoreNum, { color: sentColor }]}>{Math.round(proj.receptionScore ?? 0)}</Text>
                      <Text style={[styles.receptionScoreDen, { color: sentColor }]}>/100</Text>
                    </View>
                  </View>

                  {/* Sentiment Badge */}
                  <View style={[styles.receptionSentimentBadge, { backgroundColor: sentColor + "22", borderColor: sentColor + "44" }]}>
                    <Text style={[styles.receptionSentimentText, { color: sentColor }]}>
                      {proj.receptionSentiment ? SENTIMENT_LABELS[proj.receptionSentiment] : "Lançado"}
                    </Text>
                  </View>

                  {/* Comment */}
                  {proj.receptionComment && (
                    <View style={[styles.receptionCommentBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                      <Text style={[styles.receptionCommentText, { color: colors.foreground }]}>
                        "{proj.receptionComment}"
                      </Text>
                    </View>
                  )}

                  {/* Post-launch feedback panel */}
                  {(() => {
                    const fb = generatePostLaunchFeedback({
                      score:        proj.receptionScore ?? 50,
                      bugLevel:     (proj.bugLevel ?? "none") as "none" | "low" | "medium" | "severe",
                      hypeLevel:    proj.hypeLevel ?? 0,
                      hasMarketing: (proj.hypeLevel ?? 0) >= 20,
                    });
                    const lines: { icon: string; text: string; color: string }[] = [
                      ...(fb.strengths.slice(0, 2).map(t => ({ icon: "✅", text: t, color: "#10B981" }))),
                      ...(fb.criticalAlerts.slice(0, 2).map(t => ({ icon: "", text: t, color: t.startsWith("🔴") ? "#FF4D6A" : "#F5A623" }))),
                      ...(fb.weaknesses.slice(0, 1).filter(() => fb.criticalAlerts.length === 0).map(t => ({ icon: "⚠️", text: t, color: "#F5A623" }))),
                      ...(fb.suggestions.slice(0, 2).map(t => ({ icon: "💡", text: t, color: "#4DA6FF" }))),
                    ];
                    if (lines.length === 0) return null;
                    return (
                      <View style={[styles.feedbackCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                        <Text style={[styles.feedbackTitle, { color: colors.mutedForeground }]}>ANÁLISE DO LANÇAMENTO</Text>
                        {lines.map((l) => (
                          <View key={l.text} style={styles.feedbackRow}>
                            {l.icon ? <Text style={styles.feedbackIcon}>{l.icon}</Text> : null}
                            <Text style={[styles.feedbackText, { color: l.color }]}>{l.text}</Text>
                          </View>
                        ))}
                      </View>
                    );
                  })()}

                  {/* Fan demand */}
                  {proj.fanDemandForSequel && (
                    <View style={[styles.fanDemandBox, { backgroundColor: "#F5A62311", borderColor: "#F5A62333" }]}>
                      <Text style={styles.fanDemandIcon}>🔥</Text>
                      <Text style={[styles.fanDemandText, { color: "#F5A623" }]}>
                        Os fãs já estão pedindo uma sequência!
                      </Text>
                    </View>
                  )}

                  {/* Revenue */}
                  <View style={styles.receptionRevRow}>
                    <Text style={[styles.receptionRevLabel, { color: colors.mutedForeground }]}>Receita mensal estimada:</Text>
                    <Text style={[styles.receptionRevVal, { color: "#10B981" }]}>{formatMoney(proj.monthlyRevenue)}/mês</Text>
                  </View>

                  {receptionQueue.length > 1 && (
                    <Text style={[styles.receptionMore, { color: colors.mutedForeground }]}>
                      +{receptionQueue.length - 1} mais lançamento{receptionQueue.length > 2 ? "s" : ""}
                    </Text>
                  )}

                  <TouchableOpacity
                    onPress={() => {
                      const remaining = receptionQueue.slice(1);
                      if (remaining.length > 0) {
                        setReceptionQueue(remaining);
                      } else {
                        setShowReception(false);
                        setReceptionQueue([]);
                      }
                    }}
                    style={[styles.receptionBtn, { backgroundColor: sentColor }]}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.receptionBtnText}>
                      {receptionQueue.length > 1 ? "Próximo" : "Continuar"}
                    </Text>
                  </TouchableOpacity>
                </>
              );
            })()}
          </View>
        </Pressable>
      </Modal>

      {/* ── Shadow Investor: Offer Modal ──────────────────────────────────── */}
      <Modal visible={pendingShadowOffer && !isGameOver} transparent animationType="fade" statusBarTranslucent>
        <View style={siStyles.overlay}>
          <View style={siStyles.sheet}>
            {/* top accent line */}
            <View style={siStyles.topAccent} />

            {/* header */}
            <View style={siStyles.headerRow}>
              <View style={siStyles.iconWrap}>
                <Feather name="eye-off" size={26} color="#C084FC" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={siStyles.eyebrow}>ENTIDADE DESCONHECIDA</Text>
                <Text style={siStyles.title}>Proposta Anônima</Text>
              </View>
            </View>

            {/* flavor text block */}
            <View style={siStyles.flavorBlock}>
              {[
                "Uma entidade desconhecida entrou em contacto.",
                "Nenhum nome. Nenhum rosto. Só números.",
                "Eles sabem que a sua empresa está à beira do colapso.",
              ].map((line, i) => (
                <Text key={i} style={siStyles.flavorLine}>— {line}</Text>
              ))}
            </View>

            <Text style={siStyles.subLabel}>ESCOLHA O ACORDO</Text>

            {/* Deal option: Equity */}
            <TouchableOpacity
              style={[siStyles.dealOption, selectedShadowDeal === "equity" && siStyles.dealSelected]}
              onPress={() => setSelectedShadowDeal("equity")}
              activeOpacity={0.8}
            >
              <View style={[siStyles.dealIconWrap, { backgroundColor: "#A855F720" }]}>
                <Feather name="pie-chart" size={18} color="#A855F7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[siStyles.dealTitle, { color: "#A855F7" }]}>Participação Acionária</Text>
                <Text style={siStyles.dealDesc}>Tomam 15–30% da empresa. Drenagem mensal permanente nos seus lucros.</Text>
              </View>
              {selectedShadowDeal === "equity" && <Feather name="check-circle" size={16} color="#A855F7" />}
            </TouchableOpacity>

            {/* Deal option: Debt */}
            <TouchableOpacity
              style={[siStyles.dealOption, selectedShadowDeal === "debt" && siStyles.dealSelected]}
              onPress={() => setSelectedShadowDeal("debt")}
              activeOpacity={0.8}
            >
              <View style={[siStyles.dealIconWrap, { backgroundColor: "#F5A62320" }]}>
                <Feather name="dollar-sign" size={18} color="#F5A623" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[siStyles.dealTitle, { color: "#F5A623" }]}>Dívida Oculta +30%</Text>
                <Text style={siStyles.dealDesc}>Registam o resgate como dívida. Cobrarão quando a empresa se recuperar — com 30% de juros.</Text>
              </View>
              {selectedShadowDeal === "debt" && <Feather name="check-circle" size={16} color="#F5A623" />}
            </TouchableOpacity>

            {/* Deal option: Performance */}
            <TouchableOpacity
              style={[siStyles.dealOption, selectedShadowDeal === "performance" && siStyles.dealSelected]}
              onPress={() => setSelectedShadowDeal("performance")}
              activeOpacity={0.8}
            >
              <View style={[siStyles.dealIconWrap, { backgroundColor: "#FF4D6A20" }]}>
                <Feather name="activity" size={18} color="#FF4D6A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[siStyles.dealTitle, { color: "#FF4D6A" }]}>Contrato de Performance</Text>
                <Text style={siStyles.dealDesc}>12 meses sob vigilância. Falhar metas aplica penalidades mensais nos ganhos.</Text>
              </View>
              {selectedShadowDeal === "performance" && <Feather name="check-circle" size={16} color="#FF4D6A" />}
            </TouchableOpacity>

            <Text style={siStyles.warningLine}>
              "O dinheiro entra em segundos. O preço virá depois."
            </Text>

            {/* Actions */}
            <TouchableOpacity
              style={[siStyles.acceptBtn, !selectedShadowDeal && { opacity: 0.4 }]}
              disabled={!selectedShadowDeal}
              activeOpacity={0.85}
              onPress={() => {
                if (selectedShadowDeal) {
                  respondToShadowInvestor(true, selectedShadowDeal);
                  setSelectedShadowDeal(null);
                }
              }}
            >
              <Feather name="check" size={16} color="#fff" />
              <Text style={siStyles.acceptBtnText}>Aceitar Proposta</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={siStyles.refuseBtn}
              activeOpacity={0.8}
              onPress={() => {
                respondToShadowInvestor(false);
                setSelectedShadowDeal(null);
              }}
            >
              <Text style={siStyles.refuseBtnText}>Recusar — Enfrentar as Consequências</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Shadow Investor: Collection Modal ─────────────────────────────── */}
      <Modal visible={!!pendingShadowCollection && !isGameOver} transparent animationType="fade" statusBarTranslucent>
        <View style={siStyles.overlay}>
          <View style={[siStyles.sheet, siStyles.collSheet]}>
            <View style={[siStyles.topAccent, { backgroundColor: "#FF4D6A" }]} />

            <View style={siStyles.headerRow}>
              <View style={[siStyles.iconWrap, { backgroundColor: "#FF4D6A18" }]}>
                <Feather name="alert-octagon" size={26} color="#FF4D6A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={siStyles.eyebrow}>INVESTIDOR SOMBRIO</Text>
                <Text style={[siStyles.title, { color: "#FF4D6A" }]}>{pendingShadowCollection?.title ?? "A Conta Chegou"}</Text>
              </View>
            </View>

            <View style={siStyles.flavorBlock}>
              {[
                "Eles não esquecem.",
                "A sua empresa recuperou. Era o sinal que esperavam.",
                "Algumas dívidas não ficam no balanço. Ficam na sombra.",
              ].map((line, i) => (
                <Text key={i} style={siStyles.flavorLine}>— {line}</Text>
              ))}
            </View>

            <View style={siStyles.collAmountBox}>
              <Feather name="credit-card" size={20} color="#FF4D6A" />
              <View style={{ flex: 1 }}>
                <Text style={siStyles.collAmountLabel}>Montante a pagar</Text>
                <Text style={siStyles.collAmountValue}>
                  {formatMoney(pendingShadowCollection?.amount ?? 0)}
                </Text>
              </View>
            </View>

            <Text style={siStyles.warningLine}>
              "Você foi salvo. Talvez esse tenha sido o erro."
            </Text>

            <TouchableOpacity
              style={[siStyles.acceptBtn, { backgroundColor: "#FF4D6A" }]}
              activeOpacity={0.85}
              onPress={() => dismissShadowCollection()}
            >
              <Feather name="send" size={16} color="#fff" />
              <Text style={siStyles.acceptBtnText}>Pagar e Encerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Financial Rescue Offer Modal ─────────────────────────────────── */}
      <Modal visible={pendingRescueOffer && !isGameOver} transparent animationType="fade" statusBarTranslucent>
        <View style={siStyles.overlay}>
          <View style={[siStyles.sheet, rescStyles.sheet]}>
            <View style={[siStyles.topAccent, { backgroundColor: "#EF4444" }]} />

            <View style={siStyles.headerRow}>
              <View style={[siStyles.iconWrap, { backgroundColor: "#EF444418", borderColor: "#EF444440" }]}>
                <Feather name="alert-triangle" size={26} color="#EF4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[siStyles.eyebrow, { color: "#EF4444" }]}>CRISE FINANCEIRA</Text>
                <Text style={[siStyles.title, { color: "#FEF2F2" }]}>Resgate de Emergência</Text>
              </View>
            </View>

            <View style={[siStyles.flavorBlock, { backgroundColor: "#1C0A0A", borderColor: "#7F1D1D" }]}>
              <Text style={[siStyles.flavorLine, { color: "#FCA5A5" }]}>— A empresa está em colapso financeiro.</Text>
              <Text style={[siStyles.flavorLine, { color: "#FCA5A5" }]}>— Saldo negativo. Receita insuficiente para sustentar operações.</Text>
              <Text style={[siStyles.flavorLine, { color: "#FCA5A5" }]}>— Escolha um resgate agora, ou enfrente as consequências.</Text>
              {rescueOffer && (
                <Text style={[siStyles.flavorLine, { color: "#F87171", fontFamily: "Inter_700Bold", fontStyle: "normal", marginTop: 4 }]}>
                  Injeção disponível: {formatMoney(rescueOffer.amount)}
                </Text>
              )}
            </View>

            <Text style={siStyles.subLabel}>ESCOLHA O ACORDO DE RESGATE</Text>

            {/* Option A: Bank Rescue */}
            <TouchableOpacity
              style={[siStyles.dealOption, selectedRescueDeal === "bank" && rescStyles.dealSelected]}
              onPress={() => setSelectedRescueDeal("bank")}
              activeOpacity={0.8}
            >
              <View style={[siStyles.dealIconWrap, { backgroundColor: "#3B82F620" }]}>
                <Feather name="shield" size={18} color="#3B82F6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[siStyles.dealTitle, { color: "#3B82F6" }]}>Resgate Bancário (42% a.a.)</Text>
                <Text style={siStyles.dealDesc}>
                  {rescueOffer
                    ? `${formatMoney(rescueOffer.bankMonthlyPayment)}/mês · ${rescueOffer.bankMonths} meses · Total: ${formatMoney(rescueOffer.bankTotalOwed)}`
                    : "Pagamento fixo mensal por 36 meses com juros elevados."}
                </Text>
                <Text style={[siStyles.dealDesc, { color: "#EF4444", marginTop: 3 }]}>
                  Risco: filiais e jogos como garantia. Inadimplência = confisco de ativos.
                </Text>
              </View>
              {selectedRescueDeal === "bank" && <Feather name="check-circle" size={16} color="#3B82F6" />}
            </TouchableOpacity>

            {/* Option B: Investor – Equity */}
            <TouchableOpacity
              style={[siStyles.dealOption, selectedRescueDeal === "investor_equity" && rescStyles.dealSelected]}
              onPress={() => setSelectedRescueDeal("investor_equity")}
              activeOpacity={0.8}
            >
              <View style={[siStyles.dealIconWrap, { backgroundColor: "#F59E0B20" }]}>
                <Feather name="pie-chart" size={18} color="#F59E0B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[siStyles.dealTitle, { color: "#F59E0B" }]}>Investidor Agressivo — 20% Equity</Text>
                <Text style={siStyles.dealDesc}>
                  {rescueOffer
                    ? `Cede 20% da empresa. Drenagem: ${formatMoney(rescueOffer.investorEquityDrain)}/mês permanente.`
                    : "Cede 20% da empresa em troca de injeção imediata. Drenagem mensal permanente."}
                </Text>
                <Text style={[siStyles.dealDesc, { color: "#EF4444", marginTop: 3 }]}>
                  Risco: redução permanente dos lucros sem possibilidade de resgate.
                </Text>
              </View>
              {selectedRescueDeal === "investor_equity" && <Feather name="check-circle" size={16} color="#F59E0B" />}
            </TouchableOpacity>

            {/* Option C: Investor – Revenue Share */}
            <TouchableOpacity
              style={[siStyles.dealOption, selectedRescueDeal === "investor_revenue" && rescStyles.dealSelected]}
              onPress={() => setSelectedRescueDeal("investor_revenue")}
              activeOpacity={0.8}
            >
              <View style={[siStyles.dealIconWrap, { backgroundColor: "#10B98120" }]}>
                <Feather name="trending-down" size={18} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[siStyles.dealTitle, { color: "#10B981" }]}>Investidor Agressivo — 25% Receita</Text>
                <Text style={siStyles.dealDesc}>
                  {rescueOffer
                    ? `25% da receita mensal até quitar ${formatMoney(rescueOffer.investorRevShareOwed)}.`
                    : "25% da receita bruta mensal é retida até a dívida ser quitada (135% do valor)."}
                </Text>
                <Text style={[siStyles.dealDesc, { color: "#F59E0B", marginTop: 3 }]}>
                  Recuperável se a empresa crescer — termina ao quitar o total.
                </Text>
              </View>
              {selectedRescueDeal === "investor_revenue" && <Feather name="check-circle" size={16} color="#10B981" />}
            </TouchableOpacity>

            <Text style={siStyles.warningLine}>
              "Qualquer caminho tem um preço. Recusar significa navegar sozinho no abismo."
            </Text>

            <TouchableOpacity
              style={[siStyles.acceptBtn, { backgroundColor: "#DC2626" }, !selectedRescueDeal && { opacity: 0.4 }]}
              disabled={!selectedRescueDeal}
              activeOpacity={0.85}
              onPress={() => {
                if (selectedRescueDeal) {
                  acceptRescueOffer(selectedRescueDeal);
                  setSelectedRescueDeal(null);
                }
              }}
            >
              <Feather name="check" size={16} color="#fff" />
              <Text style={siStyles.acceptBtnText}>Aceitar Resgate</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={siStyles.refuseBtn}
              activeOpacity={0.8}
              onPress={() => {
                dismissRescueOffer();
                setSelectedRescueDeal(null);
              }}
            >
              <Text style={siStyles.refuseBtnText}>Recusar — Assumir o Risco</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Scandal Modal (highest priority overlay, gated on notifEvents) ── */}
      {pendingScandal && !isGameOver && settings.notifEvents && (
        <ScandalModal
          scandal={pendingScandal}
          onRespond={(optionId) => {
            if (optionId !== "__dismiss__") {
              respondToScandal(pendingScandal.id, optionId);
            }
          }}
          canIgnore={pendingScandal.canIgnore !== false}
        />
      )}

      {/* ── Save Before Exit Modal ── */}
      <Modal visible={showExitModal} transparent animationType="fade" onRequestClose={() => setShowExitModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowExitModal(false)}>
          <Pressable style={[styles.exitModalBox, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => {}}>
            <View style={[styles.exitModalIconWrap, { backgroundColor: "#4DA6FF22" }]}>
              <Feather name="save" size={28} color="#4DA6FF" />
            </View>
            <Text style={[styles.exitModalTitle, { color: colors.foreground }]}>Sair do jogo?</Text>
            <Text style={[styles.exitModalBody, { color: colors.mutedForeground }]}>
              O jogo será guardado antes de saíres. Podes continuar mais tarde a partir deste ponto.
            </Text>
            <TouchableOpacity
              style={[styles.exitModalBtn, { backgroundColor: "#4DA6FF" }]}
              onPress={async () => {
                setShowExitModal(false);
                await saveGame();
                router.back();
              }}
              activeOpacity={0.85}
            >
              <Feather name="save" size={16} color="#fff" />
              <Text style={styles.exitModalBtnText}>Guardar e Sair</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.exitModalBtn, { backgroundColor: "#FF4D6A22", borderWidth: 1, borderColor: "#FF4D6A44" }]}
              onPress={() => {
                setShowExitModal(false);
                router.back();
              }}
              activeOpacity={0.85}
            >
              <Feather name="x" size={16} color="#FF4D6A" />
              <Text style={[styles.exitModalBtnText, { color: "#FF4D6A" }]}>Sair sem Guardar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowExitModal(false)} style={{ marginTop: 4, padding: 8 }}>
              <Text style={[{ fontSize: 13, fontFamily: "Inter_500Medium", color: colors.mutedForeground }]}>Cancelar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Doc Easter Egg (bottom-left floating whisper) ── */}
      {docToast && (
        <Animated.View
          style={[
            styles.docToast,
            {
              opacity: docAnim,
              transform: [{ translateY: docAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
              bottom: botPad + 86,
            },
          ]}
        >
          <View style={styles.docAvatar}>
            <Text style={styles.docAvatarText}>?</Text>
          </View>
          <View style={styles.docBubble}>
            <Text style={styles.docName}>Doc</Text>
            <Text style={styles.docText}>{docToast}</Text>
          </View>
        </Animated.View>
      )}

      {/* ── Achievement Toast (bottom banner, gated on notifAchievements) ── */}
      {achievementToast && (
        <Animated.View
          style={[
            styles.achievementToast,
            {
              backgroundColor: colors.card,
              borderColor: "#F5A623",
              opacity: achievementToastAnim,
              transform: [{ translateY: achievementToastAnim.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) }],
              bottom: botPad + 80,
            },
          ]}
        >
          <View style={styles.achievementToastIcon}>
            <Feather name="award" size={18} color="#F5A623" />
          </View>
          <View style={styles.achievementToastText}>
            <Text style={[styles.achievementToastLabel, { color: colors.mutedForeground }]}>Conquista Desbloqueada</Text>
            <Text style={[styles.achievementToastTitle, { color: colors.foreground }]} numberOfLines={1}>
              {achievementToast.title}
            </Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

function HudStat({ icon, value, label, color }: { icon: keyof typeof Feather.glyphMap; value: string; label: string; color: string }) {
  return (
    <View style={styles.hudStat}>
      <Feather name={icon} size={11} color={color} />
      <Text style={[styles.hudStatValue, { color }]}>{value}</Text>
      <Text style={styles.hudStatLabel}>{label}</Text>
    </View>
  );
}

function DashCard({ icon, title, subtitle, color, onPress, colors, badge, highlight }: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  color: string;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
  badge?: string;
  highlight?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const { playClick } = useSound();

  const handlePressIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  const handlePressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 4 }).start();

  return (
    <Animated.View style={{ transform: [{ scale }], width: "48%" }}>
    <TouchableOpacity
      onPress={() => { playClick(); onPress(); }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      style={[
        styles.dashCard,
        { backgroundColor: highlight ? color + "22" : colors.card, borderColor: highlight ? color : colors.border },
      ]}
    >
      <LinearGradient
        colors={[color + "10", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.dashCardTop}>
        <View style={[styles.dashCardIcon, { backgroundColor: color + "22" }]}>
          <Feather name={icon} size={20} color={color} />
        </View>
        {badge && (
          <View style={[styles.badge, { backgroundColor: color }]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.dashCardTitle, { color: colors.foreground }]} numberOfLines={1}>{title}</Text>
      <Text style={[styles.dashCardSub, { color: colors.mutedForeground }]} numberOfLines={2}>{subtitle}</Text>
    </TouchableOpacity>
    </Animated.View>
  );
}

function SummaryRow({ label, value, color, colors, bold }: {
  label: string; value: string; color: string;
  colors: ReturnType<typeof useColors>; bold?: boolean;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, { color: colors.mutedForeground, fontFamily: bold ? "Inter_600SemiBold" : "Inter_400Regular" }]}>{label}</Text>
      <Text style={[styles.summaryValue, { color, fontFamily: bold ? "Inter_700Bold" : "Inter_600SemiBold" }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 20 },
  emptyText: { fontSize: 16, fontFamily: "Inter_400Regular" },
  backBtn: { padding: 12 },
  backBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  hud: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1E3A5F55",
  },
  hudTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 },
  hudCompany: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: 0.3 },
  hudPeriod: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#4DA6FF", marginTop: 3 },
  hudRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  eraBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  eraBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold", maxWidth: 70 },
  diffBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  diffBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  exitBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: "#FFFFFF10" },
  hudMoney: { fontSize: 34, fontFamily: "Inter_700Bold", color: "#fff", marginBottom: 12, letterSpacing: -0.5 },
  hudStats: { flexDirection: "row", gap: 4, marginBottom: 10 },
  hudStat: { flex: 1, alignItems: "center", gap: 3 },
  hudStatValue: { fontSize: 12, fontFamily: "Inter_700Bold" },
  hudStatLabel: { fontSize: 10, fontFamily: "Inter_400Regular", color: "#8899BB", textAlign: "center" },
  timelineBar: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  timelineLabel: { fontSize: 10, fontFamily: "Inter_500Medium", color: "#8899BB" },
  timelineTrack: { flex: 1, height: 4, backgroundColor: "#1E3A5F", borderRadius: 2 },
  timelineFill: { height: 4, borderRadius: 2 },
  scroll: { paddingHorizontal: 16, paddingTop: 16, gap: 14 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  dashCard: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    overflow: "hidden",
    gap: 4,
  },
  dashCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  dashCardIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  badge: { minWidth: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 },
  badgeText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#070D1A" },
  dashCardTitle: { fontSize: 14, fontFamily: "Inter_700Bold", lineHeight: 20 },
  dashCardSub: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 17 },
  quickSection: {
    borderRadius: 18, borderWidth: 1, padding: 18, gap: 12,
  },
  quickSectionHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  quickSectionLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  quickSectionIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  quickSectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  quickSectionBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1,
  },
  quickSectionBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#4DA6FF" },
  quickRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 12, borderTopWidth: 1 },
  quickRowIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  quickRowMeta: { flex: 1 },
  quickRowName: { fontSize: 13, fontFamily: "Inter_600SemiBold", lineHeight: 19 },
  quickRowSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  quickRating: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9 },
  quickRatingText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  quickRevText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  quickEmptyBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 16, borderRadius: 13, borderWidth: 1,
  },
  quickEmptyText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  advanceBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 8,
    alignItems: "center",
  },
  speedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderRadius: 26,
    borderWidth: 1,
  },
  speedBtn: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 44,
  },
  speedBtnText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  speedTicker: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  gameOverBanner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, padding: 18, borderRadius: 16, borderWidth: 1 },
  gameOverText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#F5A623" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
  summarySheet: { width: "100%", maxWidth: 420, borderRadius: 24, borderWidth: 1, padding: 26 },
  summaryHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  summaryTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  summaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 7 },
  summaryLabel: { fontSize: 13, lineHeight: 19 },
  summaryValue: { fontSize: 13, lineHeight: 19 },
  summaryDivider: { height: 1, marginVertical: 10 },
  summaryNews: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, marginTop: 10 },
  summaryNewsText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  summaryBtn: { borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 18 },
  summaryBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#070D1A" },
  receptionSheet: {
    width: "100%", borderTopLeftRadius: 30, borderTopRightRadius: 30, borderWidth: 1,
    padding: 28, paddingBottom: 36, gap: 16, position: "absolute", bottom: 0,
  },
  receptionBanner: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 14 },
  receptionBannerText: { fontSize: 13, fontFamily: "Inter_700Bold", letterSpacing: 1.5 },
  receptionGameName: { fontSize: 22, fontFamily: "Inter_700Bold", lineHeight: 30 },
  receptionGenres: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  receptionStarRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  receptionScoreBadge: { marginLeft: "auto", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, flexDirection: "row", alignItems: "baseline", gap: 2 },
  receptionScoreNum: { fontSize: 26, fontFamily: "Inter_700Bold" },
  receptionScoreDen: { fontSize: 14, fontFamily: "Inter_400Regular" },
  receptionSentimentBadge: { alignSelf: "flex-start", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  receptionSentimentText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  receptionCommentBox: { borderRadius: 14, borderWidth: 1, padding: 16 },
  receptionCommentText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 21, fontStyle: "italic" },
  fanDemandBox: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  fanDemandIcon: { fontSize: 18 },
  fanDemandText: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold", lineHeight: 19 },
  receptionRevRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  receptionRevLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  receptionRevVal: { fontSize: 16, fontFamily: "Inter_700Bold" },
  receptionMore: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center" },
  receptionBtn: { borderRadius: 16, paddingVertical: 17, alignItems: "center", marginTop: 4 },
  receptionBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
  feedbackCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  feedbackTitle: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1.2, marginBottom: 2 },
  feedbackRow: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  feedbackIcon: { fontSize: 13, lineHeight: 20 },
  feedbackText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 19 },
  docToast: {
    position: "absolute", left: 14, right: 14,
    flexDirection: "row", alignItems: "flex-end", gap: 10,
    pointerEvents: "none" as const,
  },
  docAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#1A1F2E", borderWidth: 1.5, borderColor: "#4DA6FF55",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#4DA6FF", shadowOpacity: 0.4, shadowRadius: 8,
  },
  docAvatarText: {
    fontSize: 16, fontFamily: "Inter_700Bold", color: "#4DA6FF",
  },
  docBubble: {
    flex: 1, backgroundColor: "#0D1525EE",
    borderRadius: 16, borderWidth: 1, borderColor: "#4DA6FF33",
    paddingHorizontal: 14, paddingVertical: 10,
    shadowColor: "#4DA6FF", shadowOpacity: 0.15, shadowRadius: 10,
  },
  docName: {
    fontSize: 10, fontFamily: "Inter_700Bold", color: "#4DA6FF",
    letterSpacing: 1.5, textTransform: "uppercase" as const, marginBottom: 3,
  },
  docText: {
    fontSize: 13, fontFamily: "Inter_400Regular", color: "#C8D8F0",
    lineHeight: 19, fontStyle: "italic" as const,
  },
  achievementToast: {
    position: "absolute", left: 16, right: 16, flexDirection: "row", alignItems: "center",
    gap: 12, borderRadius: 18, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 14,
    shadowColor: "#F5A623", shadowOpacity: 0.3, shadowRadius: 12, elevation: 10,
    pointerEvents: "none" as const,
  },
  achievementToastIcon: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: "#F5A62322",
    alignItems: "center", justifyContent: "center",
  },
  achievementToastText: { flex: 1 },
  achievementToastLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1, textTransform: "uppercase", marginBottom: 2 },
  achievementToastTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },
  exitModalBox: {
    width: "100%", maxWidth: 360, borderRadius: 24, borderWidth: 1,
    padding: 28, alignItems: "center", gap: 14,
  },
  exitModalIconWrap: { width: 60, height: 60, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  exitModalTitle: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center" },
  exitModalBody: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22, textAlign: "center" },
  exitModalBtn: {
    width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, borderRadius: 14, paddingVertical: 15,
  },
  exitModalBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
});

const siStyles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.88)",
    justifyContent: "center", alignItems: "center",
    paddingHorizontal: 18,
  },
  sheet: {
    width: "100%", maxWidth: 440,
    backgroundColor: "#0D0D14",
    borderRadius: 22, borderWidth: 1, borderColor: "#3B1F6B",
    paddingBottom: 22, overflow: "hidden", gap: 0,
  },
  collSheet: { borderColor: "#7F1D1D" },
  topAccent: { height: 3, backgroundColor: "#C084FC", width: "100%" },
  headerRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8,
  },
  iconWrap: {
    width: 52, height: 52, borderRadius: 15,
    backgroundColor: "#C084FC18", borderWidth: 1, borderColor: "#C084FC40",
    alignItems: "center", justifyContent: "center",
  },
  eyebrow: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#C084FC", letterSpacing: 1.5 },
  title: { fontSize: 19, fontFamily: "Inter_700Bold", color: "#F3E8FF", marginTop: 2 },
  flavorBlock: {
    marginHorizontal: 20, marginBottom: 14,
    padding: 14, borderRadius: 12,
    backgroundColor: "#1A0A2E", borderWidth: 1, borderColor: "#3B1F6B",
    gap: 6,
  },
  flavorLine: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#A78BCA", lineHeight: 18, fontStyle: "italic" },
  subLabel: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#6B7280", letterSpacing: 1.2, marginHorizontal: 20, marginBottom: 8 },
  dealOption: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    marginHorizontal: 20, marginBottom: 8,
    padding: 12, borderRadius: 14,
    backgroundColor: "#13111A", borderWidth: 1.5, borderColor: "#2A2040",
  },
  dealSelected: { borderColor: "#C084FC", backgroundColor: "#1E0F38" },
  dealIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  dealTitle: { fontSize: 13, fontFamily: "Inter_700Bold", marginBottom: 3 },
  dealDesc: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#9CA3AF", lineHeight: 16 },
  warningLine: {
    fontSize: 11, fontFamily: "Inter_400Regular", color: "#6B7280",
    fontStyle: "italic", textAlign: "center",
    marginHorizontal: 20, marginBottom: 12, marginTop: 4,
  },
  acceptBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    marginHorizontal: 20, backgroundColor: "#7C3AED",
    borderRadius: 14, paddingVertical: 14, marginBottom: 8,
  },
  acceptBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
  refuseBtn: {
    paddingVertical: 10, marginHorizontal: 20, alignItems: "center",
  },
  refuseBtnText: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#4B5563" },
  collAmountBox: {
    flexDirection: "row", alignItems: "center", gap: 14,
    marginHorizontal: 20, marginBottom: 12,
    padding: 16, borderRadius: 14,
    backgroundColor: "#1A0000", borderWidth: 1, borderColor: "#7F1D1D",
  },
  collAmountLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#9CA3AF", marginBottom: 3 },
  collAmountValue: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#FF4D6A" },
});

const rescStyles = StyleSheet.create({
  sheet: {
    borderColor: "#7F1D1D",
    backgroundColor: "#0F0505",
  },
  dealSelected: {
    borderColor: "#EF4444",
    backgroundColor: "#1C0505",
  },
});
