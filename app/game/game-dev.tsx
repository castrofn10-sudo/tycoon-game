import React, { useState, useMemo } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Platform, Alert, TextInput, Modal, Pressable, useWindowDimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useGameplay } from "@/context/GameplayContext";
import { GridBackground } from "@/components/GridBackground";
import { ScreenHeader } from "@/components/ScreenHeader";
import { formatMoney, getEraDevCostMultiplier } from "@/constants/gameEconomics";
import {
  GameGenre, GameProject, GamePlatform, GameAudience, GameAgeRating,
  GAME_GENRE_ICONS, GAME_GENRE_NAMES,
  BUG_LEVEL_LABELS, BUG_LEVEL_COLORS, BUG_FIX_COST, BUG_FIX_MONTHS, BugLevel,
  POST_LAUNCH_ACTIONS, PostLaunchActionType, OUTCOME_TABLE,
  computePostLaunchCost, computeUpdateQualityScore,
} from "@/constants/gameEngine";
import { computePassiveBonuses } from "@/constants/strategyTree";
import { computeAllOfficeBonuses } from "@/constants/officeSystem";
import { getActiveTrends, TREND_LABELS, TREND_COLORS } from "@/constants/gameTrends";
import {
  computeGenreSynergy, isRiskyCombo, getMultiGenreScale, getSequelAdvice,
  computeGenreDevTime, SENTIMENT_LABELS, SENTIMENT_COLORS,
} from "@/constants/gameReception";
import {
  EXPORTABLE_REGIONS, REGION_NAMES, REGION_COLORS, REGION_INVESTMENT_TIERS,
  REGION_INVESTMENT_LABELS, checkRegionRestriction, getRegionHasBranch,
  estimateExportMonthlyRevenue, ExportRegionData, Region,
} from "@/constants/globalMarket";

type GenreCategory = { label: string; genres: GameGenre[] };
const GENRE_CATEGORIES: GenreCategory[] = [
  {
    label: "Clássicos",
    genres: ["shooter", "rpg", "action", "sandbox", "adventure", "sports", "racing", "sim", "strategy", "horror", "platformer", "puzzle", "indie"],
  },
  {
    label: "Expansão Principal",
    genres: [
      "stealth", "hack_slash", "dungeon_crawler", "tactical_shooter",
      "extraction_shooter", "survival_hardcore", "sandbox_criativo",
      "life_sim", "city_builder", "colony_management", "automation",
      "space_exploration", "scifi_strategy", "fantasy_strategy",
      "political_sim", "crime_sim", "detective",
      "psychological_horror", "cosmic_horror", "soulslike",
      "bullet_hell", "twin_stick", "arena_brawler",
      "physics_game", "destruction_sim", "parkour", "speedrun",
    ],
  },
  {
    label: "Experimental",
    genres: [
      "chaos_sim", "meme_game", "absurd_comedy", "reality_distortion",
      "dream_sim", "time_loop", "parallel_universe", "glitch_game",
      "minimalist", "interactive_story", "influencer_sim",
      "bankrupt_sim", "economic_crisis",
    ],
  },
  {
    label: "Indústria",
    genres: ["game_dev_sim", "streaming_sim", "esports_manager", "publisher_sim"],
  },
];
const ALL_GENRES: GameGenre[] = GENRE_CATEGORIES.flatMap(c => c.genres);

const BUDGET_TIERS = [
  { label: "Indie", cost: 100_000, months: 4,  quality: 5, icon: "star"   as const, color: "#A855F7", minMonths:  4, maxMonths:  8 },
  { label: "AA",   cost: 500_000, months: 8,  quality: 7, icon: "layers" as const, color: "#4DA6FF", minMonths:  8, maxMonths: 12 },
  { label: "AAA",  cost: 2_000_000, months: 12, quality: 9, icon: "award"  as const, color: "#F5A623", minMonths: 12, maxMonths: 20 },
];

const PHASE_COLORS: Record<string, string> = {
  development: "#4DA6FF",
  qa: "#F5A623",
  released: "#10B981",
  cancelled: "#FF4D6A",
};
const PHASE_LABELS: Record<string, string> = {
  development: "Em Desenvolvimento",
  qa: "QA",
  released: "Lançado",
  cancelled: "Cancelado",
};

function riskLabel(q: number): { text: string; color: string } {
  if (q >= 0.65) return { text: "Alta chance de sucesso",   color: "#10B981" };
  if (q >= 0.40) return { text: "Risco moderado",           color: "#F5A623" };
  if (q >= 0.15) return { text: "Risco elevado",            color: "#F59E0B" };
  return          { text: "Risco crítico — pode fracassar", color: "#FF4D6A" };
}

function PostLaunchPanel({
  proj, currentYear, currentMonth, reputation, colors, onAction,
}: {
  proj: GameProject;
  currentYear: number;
  currentMonth: number;
  reputation: number;
  colors: any;
  onAction: (a: PostLaunchActionType) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const lifespan = proj.effectiveLifespan ?? 36;
  const history = proj.postLaunchUpdates ?? [];
  const historyCount = history.length;
  const revMult = proj.revenueMultBonus ?? 1.0;

  const qScore = computeUpdateQualityScore(proj, currentYear, currentMonth, reputation);
  const risk = riskLabel(qScore);

  if (proj.pendingUpdateType) {
    const def = POST_LAUNCH_ACTIONS[proj.pendingUpdateType];
    const monthsLeft = proj.updateMonthsLeft ?? 0;
    return (
      <View style={[styles.plPanel, { backgroundColor: def.color + "11", borderColor: def.color + "44" }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Feather name={def.icon as any} size={14} color={def.color} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.plPendingTitle, { color: def.color }]}>{def.label} em andamento</Text>
            <Text style={[styles.plPendingMeta, { color: colors.mutedForeground }]}>
              {monthsLeft} {monthsLeft === 1 ? "mês" : "meses"} restante{monthsLeft === 1 ? "" : "s"} · resultado desconhecido até o fim
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={[{ fontSize: 10, color: risk.color, fontWeight: "600" }]}>{risk.text}</Text>
          </View>
        </View>
      </View>
    );
  }

  const actions = (Object.entries(POST_LAUNCH_ACTIONS) as [PostLaunchActionType, typeof POST_LAUNCH_ACTIONS[PostLaunchActionType]][])
    .filter(([, def]) => !def.minYear || currentYear >= def.minYear);

  return (
    <View style={[styles.plPanel, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)} style={styles.plHeader} activeOpacity={0.8}>
        <Feather name="refresh-cw" size={13} color="#10B981" />
        <Text style={[styles.plHeaderTitle, { color: colors.foreground }]}>Suporte Pós-Lançamento</Text>
        {historyCount > 0 && (
          <View style={[styles.plHistBadge, { backgroundColor: "#10B98122" }]}>
            <Text style={[styles.plHistBadgeText, { color: "#10B981" }]}>{historyCount} feito{historyCount !== 1 ? "s" : ""}</Text>
          </View>
        )}
        <View style={[styles.plLifeChip, { backgroundColor: "#4DA6FF18" }]}>
          <Text style={[styles.plLifeText, { color: "#4DA6FF" }]}>{lifespan}m · ×{revMult.toFixed(2)}</Text>
        </View>
        <Feather name={expanded ? "chevron-up" : "chevron-down"} size={14} color={colors.mutedForeground} />
      </TouchableOpacity>

      {expanded && (
        <View style={{ gap: 6, marginTop: 8 }}>
          <View style={[styles.plRiskRow, { backgroundColor: risk.color + "14", borderColor: risk.color + "33" }]}>
            <Feather name="alert-triangle" size={11} color={risk.color} />
            <Text style={[styles.plRiskText, { color: risk.color }]}>{risk.text}</Text>
            <Text style={[styles.plRiskSub, { color: colors.mutedForeground }]}>— baseado em qualidade, reputação e atualizações anteriores</Text>
          </View>

          {actions.map(([type, def]) => {
            const cost = computePostLaunchCost(proj.budget ?? 0, type);
            const outcomes = OUTCOME_TABLE[type];
            return (
              <TouchableOpacity
                key={type}
                onPress={() => onAction(type)}
                style={[styles.plActionBtn, { backgroundColor: def.color + "10", borderColor: def.color + "30" }]}
                activeOpacity={0.8}
              >
                <View style={[styles.plActionIcon, { backgroundColor: def.color + "22" }]}>
                  <Feather name={def.icon as any} size={12} color={def.color} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[styles.plActionName, { color: def.color }]}>{def.label}</Text>
                  <Text style={[styles.plActionDesc, { color: colors.mutedForeground }]} numberOfLines={1}>{def.description}</Text>
                  <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
                    <Text style={[styles.plOutcomeHint, { color: "#10B981" }]}>✓ +{outcomes.sucesso.lifespanExt}m/+{(outcomes.sucesso.revBoostAdd * 100).toFixed(0)}%</Text>
                    <Text style={[styles.plOutcomeHint, { color: "#FF4D6A" }]}>✗ {outcomes.fracasso.lifespanExt === 0 ? "sem ext." : `+${outcomes.fracasso.lifespanExt}m`}/{outcomes.fracasso.revBoostAdd < 0 ? (outcomes.fracasso.revBoostAdd * 100).toFixed(0) + "%" : "+0%"} rep{outcomes.fracasso.repBoost}</Text>
                  </View>
                </View>
                <View style={{ alignItems: "flex-end", gap: 2 }}>
                  <Text style={[styles.plActionCost, { color: def.color }]}>{formatMoney(cost)}</Text>
                  <Text style={[styles.plActionMeta, { color: colors.mutedForeground }]}>{def.months}m dev</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {historyCount > 0 && (
            <View style={[styles.plHistoryBox, { borderColor: colors.border }]}>
              <Text style={[styles.plHistoryTitle, { color: colors.mutedForeground }]}>Histórico de atualizações</Text>
              {history.slice().reverse().map((upd, i) => {
                const d = POST_LAUNCH_ACTIONS[upd.type];
                const outcomeColor = upd.outcomeColor ?? d.color;
                const revSign = (upd.revBoostApplied ?? 0) >= 0 ? "+" : "";
                return (
                  <View key={`${upd.type}-${upd.year}-${upd.month}-${i}`} style={[styles.plHistoryRow, { borderLeftColor: outcomeColor + "66", borderLeftWidth: 2, paddingLeft: 6 }]}>
                    <View style={{ flex: 1, gap: 1 }}>
                      <Text style={[styles.plHistoryText, { color: outcomeColor, fontWeight: "600" }]}>
                        {upd.outcomeLabel ?? d.label}
                      </Text>
                      <Text style={[styles.plHistoryMeta, { color: colors.mutedForeground }]}>
                        {d.label} · {upd.year}/{String(upd.month).padStart(2, "0")} · vida {upd.lifespanExtension > 0 ? `+${upd.lifespanExtension}m` : "sem extensão"} · rev {revSign}{((upd.revBoostApplied ?? 0) * 100).toFixed(0)}% · custo {formatMoney(upd.costPaid)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function StarRow({ stars, size = 13 }: { stars: number; size?: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Feather
          key={i}
          name="star"
          size={size}
          color={i <= stars ? "#F5A623" : "#33446644"}
        />
      ))}
    </View>
  );
}

export default function GameDevScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const { state, startGameProject, cancelGameProject, fixBugs, startHypeCampaign, postLaunchAction, startScoreRecovery, releaseDLC, stopSupport, optimizeGame } = useGameplay();
  const [hypeError, setHypeError] = useState<string | null>(null);
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;
  const sheetHeight = Platform.OS !== "web" ? Math.round(screenHeight * 0.91) : undefined;

  const [showNew, setShowNew] = useState(false);
  const [gameName, setGameName] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<GameGenre[]>(["rpg"]);
  const [budgetIdx, setBudgetIdx] = useState(0);
  const [sequelTarget, setSequelTarget] = useState<GameProject | null>(null);
  const [platform, setPlatform] = useState<GamePlatform>("console");
  const [audience, setAudience] = useState<GameAudience>("teens");
  const [ageRating, setAgeRating] = useState<GameAgeRating>("T");

  const [showAdvice, setShowAdvice] = useState(false);
  const [pendingSequel, setPendingSequel] = useState<GameProject | null>(null);
  const [activeTab, setActiveTab] = useState<"dev" | "released" | "history">("dev");

  const [modalStep, setModalStep] = useState<"step1" | "step2" | "step3" | "export">("step1");
  // exportSelections maps regionId → tier index (0=Básico, 1=Padrão, 2=Agressivo) or -1 = skip
  const [exportSelections, setExportSelections] = useState<Record<string, number>>({});

  // Pre-compute export investment total so the disabled check is accurate and
  // the export step can reuse the value without redundant inner-render computation.
  const exportInvestmentTotal = useMemo(() =>
    EXPORTABLE_REGIONS.reduce((sum, rid) => {
      const tierIdx = exportSelections[rid] ?? -1;
      if (tierIdx < 0) return sum;
      const tiers = REGION_INVESTMENT_TIERS[rid];
      return tiers ? sum + (tiers[tierIdx] ?? 0) : sum;
    }, 0),
  [exportSelections]);

  if (!state) return null;

  const projects = state.gameProjects ?? [];
  const active = projects.filter((p) => p.phase === "development" || p.phase === "qa");
  const released = projects.filter((p) => p.phase === "released");
  const cancelled = projects.filter((p) => p.phase === "cancelled");
  const bonuses = computePassiveBonuses(state.researchedNodes ?? []);

  const totalMonthlyGameRev = released.reduce((s, p) => {
    const age = (state.year - p.launchYear) * 12 + state.month - p.launchMonth;
    const fade = Math.max(0, 1 - age / (p.effectiveLifespan ?? 36));
    return s + Math.round(p.monthlyRevenue * fade * (p.revenueMultBonus ?? 1) * bonuses.gameRevMult);
  }, 0);

  const activeTrends = getActiveTrends(state.year, state.month);

  const currentYear = state.year;
  const pcAvailable = currentYear >= 1980;
  const mobileAvailable = currentYear >= 2007;

  const getPlatformWarning = (p: GamePlatform): string | null => {
    if (p === "pc" && !pcAvailable) return `PC games indisponíveis antes de ${1980}`;
    if (p === "mobile" && !mobileAvailable) return `Mobile indisponível antes de ${2007}`;
    return null;
  };

  const toggleGenre = (g: GameGenre) => {
    setSelectedGenres(prev => {
      if (prev.includes(g)) {
        if (prev.length === 1) return prev;
        return prev.filter(x => x !== g);
      }
      if (prev.length >= 3) return prev;
      return [...prev, g];
    });
  };

  const scale = getMultiGenreScale(selectedGenres.length);
  const budget = BUDGET_TIERS[budgetIdx];
  const eraCostMult = getEraDevCostMultiplier(state.year, state.researchedNodes ?? []);
  const scaledCost = Math.round(budget.cost * scale.costMult * eraCostMult);
  const scaledMonths = computeGenreDevTime(selectedGenres, Math.round(budget.months * scale.timeMult), budget.minMonths, budget.maxMonths);
  const synergy = computeGenreSynergy(selectedGenres);
  const risky = isRiskyCombo(selectedGenres);

  const closeNewModal = () => {
    setShowNew(false);
    setSequelTarget(null);
    setModalStep("step1");
    setExportSelections({});
  };

  const handleStart = () => {
    if (modalStep === "step1") {
      setModalStep("step2");
      return;
    }
    if (modalStep === "step2") {
      setModalStep("step3");
      return;
    }
    if (modalStep === "step3") {
      const warn = getPlatformWarning(platform);
      if (warn) { Alert.alert("Plataforma indisponível", warn); return; }
      if (state.money < scaledCost) { Alert.alert("Capital insuficiente", `Precisas de ${formatMoney(scaledCost)}`); return; }
      setModalStep("export");
      return;
    }

    // Export step — collect export regions from selections
    const primaryGenre = selectedGenres[0];
    const name = gameName.trim() || `${selectedGenres.map(g => GAME_GENRE_NAMES[g]).join(" + ")} ${state.year}`;
    const sequelBonus = sequelTarget ? getSequelAdvice(sequelTarget).bonusMult : undefined;

    const exportRegions: ExportRegionData[] = EXPORTABLE_REGIONS.map((regionId) => {
      const tierIdx = exportSelections[regionId] ?? -1;
      const restriction = checkRegionRestriction(primaryGenre, ageRating, state.year, state.reputation, regionId);
      if (restriction) {
        return { regionId, investment: 0, blocked: true, blockReason: restriction };
      }
      if (tierIdx < 0) {
        return { regionId, investment: 0, blocked: false };
      }
      const tiers = REGION_INVESTMENT_TIERS[regionId];
      return { regionId, investment: tiers[tierIdx], blocked: false };
    }).filter((er) => er.investment > 0 || er.blocked);

    const err = startGameProject({
      name,
      genre: primaryGenre,
      genres: selectedGenres,
      budget: scaledCost,
      quality: budget.quality,
      monthsRequired: scaledMonths,
      platform,
      targetAudience: audience,
      ageRating,
      exportRegions: exportRegions.length > 0 ? exportRegions : undefined,
      ...(sequelTarget ? { sequelOf: sequelTarget.id, sequelRevBonus: sequelBonus } : {}),
    });
    if (err) {
      Alert.alert("Erro", err);
    } else {
      closeNewModal();
      setGameName("");
      setSelectedGenres(["rpg"]);
      setAudience("teens");
      setAgeRating("T");
      setBudgetIdx(0);
    }
  };

  const handleCreateSequel = (orig: GameProject) => {
    const advice = getSequelAdvice(orig);
    setPendingSequel(orig);
    setShowAdvice(true);
    (advice as any).__orig = orig;
  };

  const confirmSequel = () => {
    if (!pendingSequel) return;
    setShowAdvice(false);
    setSequelTarget(pendingSequel);
    const origGenres = pendingSequel.genres ?? [pendingSequel.genre];
    setSelectedGenres(origGenres);
    const parts = pendingSequel.name.match(/^(.*?)(\s+(\d+))?$/);
    const base = parts?.[1] ?? pendingSequel.name;
    const num = parts?.[3] ? Number(parts[3]) + 1 : 2;
    setGameName(`${base} ${num}`);
    setShowNew(true);
    setPendingSequel(null);
  };

  const handleCancel = (proj: GameProject) => {
    Alert.alert("Cancelar Projeto", `Cancelar "${proj.name}"? Você vai perder o orçamento já investido.`, [
      { text: "Não", style: "cancel" },
      { text: "Cancelar Projeto", style: "destructive", onPress: () => cancelGameProject(proj.id) },
    ]);
  };

  const sequelAdviceData = pendingSequel ? getSequelAdvice(pendingSequel) : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GridBackground />
      <ScreenHeader title="Desenvolvimento de Jogos" />

      {hypeError && (
        <View style={[styles.hypeErrorToast, { backgroundColor: "#FF4D6A" }]}>
          <Feather name="alert-circle" size={13} color="#fff" />
          <Text style={styles.hypeErrorText}>{hypeError}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 80 }]} showsVerticalScrollIndicator={false}>
        {/* Overview */}
        {(() => {
          const officeBonuses = computeAllOfficeBonuses(state.offices);
          const devSpeedPct = Math.round((officeBonuses.totalDevSpeed - 1) * 100);
          return (
            <View style={[styles.overviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <LinearGradient colors={["#FF4D6A08", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
              <View style={styles.overviewStats}>
                <OverStat label="Em Dev" value={String(active.length)} color="#4DA6FF" colors={colors} />
                <OverStat label="Lançados" value={String(released.length)} color="#10B981" colors={colors} />
                <OverStat label="Receita/mês" value={formatMoney(totalMonthlyGameRev)} color="#F5A623" colors={colors} />
                <OverStat label="Vel. Dev" value={devSpeedPct > 0 ? `+${devSpeedPct}%` : "Base"} color={devSpeedPct > 0 ? "#10B981" : colors.mutedForeground} colors={colors} />
              </View>
            </View>
          );
        })()}

        {/* Tab Bar */}
        <View style={[styles.tabBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {([
            { key: "dev",      label: "Em Criação",   count: active.length,    color: "#4DA6FF" },
            { key: "released", label: "Lançados",     count: released.length,  color: "#10B981" },
            { key: "history",  label: "Histórico",    count: cancelled.length, color: "#9CA3AF" },
          ] as const).map(({ key, label, count, color }) => {
            const isActive = activeTab === key;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => setActiveTab(key)}
                style={[styles.tabItem, isActive && { borderBottomColor: color, borderBottomWidth: 2 }]}
                activeOpacity={0.75}
              >
                <Text style={[styles.tabLabel, { color: isActive ? color : colors.mutedForeground, fontWeight: isActive ? "700" : "400" }]}>
                  {label}
                </Text>
                {count > 0 && (
                  <View style={[styles.tabBadge, { backgroundColor: isActive ? color + "22" : colors.border }]}>
                    <Text style={[styles.tabBadgeText, { color: isActive ? color : colors.mutedForeground }]}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Active Projects */}
        {activeTab === "dev" && active.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>EM ANDAMENTO</Text>
            {active.map((proj) => {
              const progress = proj.monthsRequired > 0 ? proj.monthsElapsed / proj.monthsRequired : 0;
              const monthsLeft = proj.monthsRequired - proj.monthsElapsed;
              const phaseColor = PHASE_COLORS[proj.phase];
              const projGenres = proj.genres ?? [proj.genre];
              return (
                <View key={proj.id} style={[styles.projectCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <LinearGradient colors={[phaseColor + "10", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                  <View style={styles.projectHeader}>
                    <View style={[styles.projectIcon, { backgroundColor: phaseColor + "22" }]}>
                      <Feather name={GAME_GENRE_ICONS[projGenres[0]] as any} size={20} color={phaseColor} />
                    </View>
                    <View style={styles.projectMeta}>
                      <Text style={[styles.projectName, { color: colors.foreground }]}>{proj.name}</Text>
                      <View style={styles.projectTags}>
                        <View style={[styles.tag, { backgroundColor: phaseColor + "22" }]}>
                          <Text style={[styles.tagText, { color: phaseColor }]}>{PHASE_LABELS[proj.phase]}</Text>
                        </View>
                        <Text style={[styles.genreText, { color: colors.mutedForeground }]}>
                          {projGenres.map(g => GAME_GENRE_NAMES[g]).join(" + ")}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => handleCancel(proj)} style={styles.cancelBtn} activeOpacity={0.7}>
                      <Feather name="x" size={16} color="#FF4D6A" />
                    </TouchableOpacity>
                  </View>
                  <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                    <View style={[styles.progressFill, { width: `${Math.min(100, progress * 100)}%`, backgroundColor: phaseColor }]} />
                  </View>
                  <View style={styles.projectFooter}>
                    <Text style={[styles.progressText, { color: colors.mutedForeground }]}>
                      {Math.round(proj.monthsElapsed)}/{proj.monthsRequired} meses
                    </Text>
                    <Text style={[styles.monthsLeft, { color: phaseColor }]}>
                      {Math.round(monthsLeft) === 1 ? "Falta 1 mês" : `Faltam ${Math.round(monthsLeft)} meses`}
                    </Text>
                  </View>

                  {/* ── Hype Section ── */}
                  {(() => {
                    const hype = proj.hypeLevel ?? 0;
                    const isActive = proj.hypeCampaignActive;
                    const left = proj.hypeCampaignMonthsLeft ?? 0;
                    return (
                      <View style={[styles.hypeSection, { borderTopColor: colors.border }]}>
                        <View style={styles.hypeRow}>
                          <View style={styles.hypeLabelRow}>
                            <Feather name="trending-up" size={12} color="#FF6B35" />
                            <Text style={[styles.hypeLabel, { color: colors.mutedForeground }]}>
                              HYPE {hype}/100
                            </Text>
                            {isActive && (
                              <View style={styles.hypeBadge}>
                                <Text style={styles.hypeBadgeText}>📣 {left}m restantes</Text>
                              </View>
                            )}
                          </View>
                          {!isActive && (
                            <TouchableOpacity
                              style={[styles.hypeBtn, { borderColor: "#FF6B35" }]}
                              activeOpacity={0.8}
                              onPress={() => {
                                const err = startHypeCampaign(proj.id);
                                if (err) {
                                  setHypeError(err);
                                  setTimeout(() => setHypeError(null), 3000);
                                }
                              }}
                            >
                              <Feather name="radio" size={11} color="#FF6B35" />
                              <Text style={[styles.hypeBtnText, { color: "#FF6B35" }]}>
                                Campanha  $150K
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                        <View style={[styles.hypeTrack, { backgroundColor: colors.border }]}>
                          <View style={[
                            styles.hypeFill,
                            {
                              width: `${hype}%` as any,
                              backgroundColor: hype >= 80 ? "#FF4D6A" : hype >= 50 ? "#FF6B35" : "#F5A623",
                            }
                          ]} />
                        </View>
                        {hype > 0 && (
                          <Text style={[styles.hypeHint, { color: colors.mutedForeground }]}>
                            +{Math.round(hype * 0.08)} pts recepção · +{Math.round(hype * 0.3)}% receita lançamento
                          </Text>
                        )}
                      </View>
                    );
                  })()}
                </View>
              );
            })}
          </>
        )}

        {/* Released Games */}
        {activeTab === "released" && released.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>JOGOS LANÇADOS</Text>
            {released.map((proj) => {
              const age = (state.year - proj.launchYear) * 12 + state.month - proj.launchMonth;
              const lifespan = proj.effectiveLifespan ?? 36;
              const fade = Math.max(0, 1 - age / lifespan);
              const currentRev = Math.round((Number.isFinite(proj.monthlyRevenue) ? proj.monthlyRevenue : 0) * fade * (proj.revenueMultBonus ?? 1) * bonuses.gameRevMult);
              const projGenres = proj.genres ?? [proj.genre];
              const sentColor = proj.receptionSentiment ? SENTIMENT_COLORS[proj.receptionSentiment] : "#4DA6FF";
              const adviceData = getSequelAdvice(proj);
              const bonusPct = Math.round((adviceData.bonusMult - 1) * 100);
              return (
                <View key={proj.id} style={[styles.releasedCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <LinearGradient colors={["#10B98108", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                  <View style={styles.projectHeader}>
                    <View style={[styles.projectIcon, { backgroundColor: "#10B98122" }]}>
                      <Feather name={GAME_GENRE_ICONS[projGenres[0]] as any} size={20} color="#10B981" />
                    </View>
                    <View style={styles.projectMeta}>
                      <Text style={[styles.projectName, { color: colors.foreground }]}>{proj.name}</Text>
                      <Text style={[styles.genreText, { color: colors.mutedForeground }]}>
                        {projGenres.map(g => GAME_GENRE_NAMES[g]).join(" + ")} · {proj.launchYear}
                      </Text>
                    </View>
                    <View style={styles.revenueCol}>
                      <Text style={[styles.revenueAmount, { color: "#10B981" }]}>{formatMoney(currentRev)}</Text>
                      <Text style={[styles.revenueLabel, { color: colors.mutedForeground }]}>/mês</Text>
                    </View>
                  </View>

                  {/* Reception row */}
                  {proj.receptionScore !== undefined && (
                    <View style={[styles.receptionRow, { backgroundColor: sentColor + "11", borderColor: sentColor + "33" }]}>
                      <StarRow stars={proj.starRating ?? 3} />
                      <View style={[styles.sentimentBadge, { backgroundColor: sentColor + "22" }]}>
                        <Text style={[styles.sentimentText, { color: sentColor }]}>
                          {SENTIMENT_LABELS[proj.receptionSentiment ?? "mixed"]}
                        </Text>
                      </View>
                      <Text style={[styles.scoreText, { color: sentColor }]}>{proj.receptionScore}/100</Text>
                      {proj.fanDemandForSequel && (
                        <View style={styles.fanDemandBadge}>
                          <Text style={styles.fanDemandText}>🔥 Fãs pedem sequência</Text>
                        </View>
                      )}
                    </View>
                  )}
                  {proj.receptionComment && (
                    <Text style={[styles.receptionComment, { color: colors.mutedForeground }]}>
                      "{proj.receptionComment}"
                    </Text>
                  )}

                  <View style={styles.lifeBar}>
                    <View style={[styles.lifeTrack, { backgroundColor: colors.border }]}>
                      <View style={[styles.lifeFill, { width: `${fade * 100}%`, backgroundColor: fade > 0.5 ? "#10B981" : fade > 0.2 ? "#F5A623" : "#FF4D6A" }]} />
                    </View>
                    <Text style={[styles.lifeLabel, { color: colors.mutedForeground }]}>{Math.round(fade * 100)}% vida</Text>
                  </View>
                  <View style={styles.totalRevRow}>
                    <Text style={[styles.totalRevLabel, { color: colors.mutedForeground }]}>Receita total</Text>
                    <Text style={[styles.totalRevValue, { color: colors.foreground }]}>{formatMoney(proj.totalRevenue)}</Text>
                  </View>
                  {/* Bug status row */}
                  {(() => {
                    const bug = (proj.bugLevel ?? "none") as BugLevel;
                    const bugColor = BUG_LEVEL_COLORS[bug];
                    const bugLabel = BUG_LEVEL_LABELS[bug];
                    if (proj.bugFixInProgress) {
                      return (
                        <View style={[styles.bugRow, { backgroundColor: "#4DA6FF11", borderColor: "#4DA6FF33" }]}>
                          <Feather name="tool" size={13} color="#4DA6FF" />
                          <Text style={[styles.bugText, { color: "#4DA6FF" }]}>
                            Correção em andamento · {proj.bugFixMonthsLeft ?? 0} {(proj.bugFixMonthsLeft ?? 0) === 1 ? "mês" : "meses"} restante{(proj.bugFixMonthsLeft ?? 0) === 1 ? "" : "s"}
                          </Text>
                        </View>
                      );
                    }
                    if (bug !== "none") {
                      const fixCost = BUG_FIX_COST[bug];
                      const fixMonths = BUG_FIX_MONTHS[bug];
                      return (
                        <View style={{ gap: 6 }}>
                          <View style={[styles.bugRow, { backgroundColor: bugColor + "11", borderColor: bugColor + "33" }]}>
                            <Feather name="alert-triangle" size={13} color={bugColor} />
                            <Text style={[styles.bugText, { color: bugColor }]}>{bugLabel}</Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => {
                              const err = fixBugs(proj.id);
                              if (err) Alert.alert("Erro", err);
                            }}
                            style={[styles.fixBtn, { backgroundColor: bugColor + "18", borderColor: bugColor + "44" }]}
                            activeOpacity={0.8}
                          >
                            <Feather name="tool" size={13} color={bugColor} />
                            <Text style={[styles.fixBtnText, { color: bugColor }]}>
                              Corrigir Bugs · {formatMoney(fixCost)} · {fixMonths} {fixMonths === 1 ? "mês" : "meses"}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      );
                    }
                    return (
                      <View style={[styles.bugRow, { backgroundColor: "#10B98111", borderColor: "#10B98133" }]}>
                        <Feather name="check-circle" size={13} color="#10B981" />
                        <Text style={[styles.bugText, { color: "#10B981" }]}>Sem bugs</Text>
                      </View>
                    );
                  })()}

                  {/* ── Score Recovery ── */}
                  {(() => {
                    const base = proj.baseQualityScore ?? (proj.receptionScore ?? 0);
                    const current = proj.receptionScore ?? 0;
                    const hasRoom = current < base;
                    if (proj.scoreRecoveryInProgress) {
                      return (
                        <View style={[styles.bugRow, { backgroundColor: "#A855F711", borderColor: "#A855F733" }]}>
                          <Feather name="trending-up" size={13} color="#A855F7" />
                          <Text style={[styles.bugText, { color: "#A855F7" }]}>
                            Recuperação em andamento · {proj.scoreRecoveryMonthsLeft ?? 0} {(proj.scoreRecoveryMonthsLeft ?? 0) === 1 ? "mês" : "meses"} restante{(proj.scoreRecoveryMonthsLeft ?? 0) === 1 ? "" : "s"} · +{proj.scoreRecoveryAmount ?? 0} pts
                          </Text>
                        </View>
                      );
                    }
                    if (hasRoom && !proj.bugFixInProgress && !proj.pendingUpdateType) {
                      const tiers: Array<{ key: "light" | "medium" | "strong"; label: string; pts: number; months: number; cost: number; color: string }> = [
                        { key: "light",  label: "Leve",   pts: 3, months: 2, cost: 50_000,  color: "#4DA6FF" },
                        { key: "medium", label: "Médio",  pts: 5, months: 3, cost: 150_000, color: "#A855F7" },
                        { key: "strong", label: "Forte",  pts: 8, months: 5, cost: 350_000, color: "#F5A623" },
                      ];
                      return (
                        <View style={{ gap: 4 }}>
                          <View style={[styles.bugRow, { backgroundColor: "#A855F70A", borderColor: "#A855F720" }]}>
                            <Feather name="trending-up" size={13} color="#A855F7" />
                            <Text style={[styles.bugText, { color: "#A855F7" }]}>
                              Corrigir Problemas — nota atual {current}/100 · máx recuperável {base}/100
                            </Text>
                          </View>
                          <View style={{ flexDirection: "row", gap: 6 }}>
                            {tiers.map((t) => (
                              <TouchableOpacity
                                key={t.key}
                                onPress={() => {
                                  const err = startScoreRecovery(proj.id, t.key);
                                  if (err) Alert.alert("Erro", err);
                                }}
                                style={[styles.fixBtn, { flex: 1, backgroundColor: t.color + "14", borderColor: t.color + "40" }]}
                                activeOpacity={0.8}
                              >
                                <Text style={[styles.fixBtnText, { color: t.color, fontSize: 10 }]}>
                                  {t.label}{"\n"}+{t.pts}pts · {t.months}m{"\n"}{formatMoney(t.cost)}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      );
                    }
                    return null;
                  })()}

                  {/* ── DLC section ── */}
                  {(() => {
                    const dlcCount = proj.dlcCount ?? 0;
                    const dlcMax = 3;
                    const dlcCost = Math.max(40_000, Math.round((proj.budget ?? 0) * 0.08));
                    const dlcFanGain = 500 + (proj.starRating ?? 3) * 300;
                    const supportStopped = proj.supportActive === false;
                    return (
                      <View style={{ gap: 4 }}>
                        <View style={[styles.bugRow, { backgroundColor: "#4DA6FF0A", borderColor: "#4DA6FF22" }]}>
                          <Feather name="package" size={13} color="#4DA6FF" />
                          <Text style={[styles.bugText, { color: "#4DA6FF" }]}>
                            DLC — {dlcCount}/{dlcMax} lançado{dlcCount !== 1 ? "s" : ""}
                          </Text>
                          {supportStopped && (
                            <Text style={[styles.bugText, { color: "#9CA3AF", marginLeft: 4 }]}>· suporte encerrado</Text>
                          )}
                        </View>
                        {dlcCount < dlcMax && !supportStopped && (
                          <TouchableOpacity
                            onPress={() => {
                              const err = releaseDLC(proj.id);
                              if (err) Alert.alert("Erro", err);
                            }}
                            style={[styles.fixBtn, { backgroundColor: "#4DA6FF14", borderColor: "#4DA6FF40" }]}
                            activeOpacity={0.8}
                          >
                            <Feather name="package" size={13} color="#4DA6FF" />
                            <Text style={[styles.fixBtnText, { color: "#4DA6FF" }]}>
                              Lançar DLC · {formatMoney(dlcCost)} · +{dlcFanGain.toLocaleString()} fãs · +4m vida
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })()}

                  {/* ── Compact action chips ── */}
                  <View style={styles.actionChipRow}>
                    <TouchableOpacity
                      onPress={() => handleCreateSequel(proj)}
                      style={[styles.actionChip, { backgroundColor: "#A855F712", borderColor: "#A855F740" }]}
                      activeOpacity={0.8}
                    >
                      <Feather name="git-branch" size={12} color="#A855F7" />
                      <Text style={[styles.actionChipText, { color: "#A855F7" }]}>Sequência</Text>
                      <View style={[styles.actionChipBadge, { backgroundColor: "#A855F720" }]}>
                        <Text style={[styles.actionChipBadgeText, { color: "#A855F7" }]}>
                          {bonusPct > 0 ? `+${bonusPct}%` : `${bonusPct}%`}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    {!proj.gameOptimized ? (
                      <TouchableOpacity
                        onPress={() => {
                          const err = optimizeGame(proj.id);
                          if (err) Alert.alert("Erro", err);
                        }}
                        style={[styles.actionChip, { backgroundColor: "#10B9810D", borderColor: "#10B98133" }]}
                        activeOpacity={0.8}
                      >
                        <Feather name="sliders" size={12} color="#10B981" />
                        <Text style={[styles.actionChipText, { color: "#10B981" }]}>Otimizar</Text>
                        <View style={[styles.actionChipBadge, { backgroundColor: "#10B98120" }]}>
                          <Text style={[styles.actionChipBadgeText, { color: "#10B981" }]}>$120K</Text>
                        </View>
                      </TouchableOpacity>
                    ) : (
                      <View style={[styles.actionChip, { backgroundColor: "#10B98108", borderColor: "#10B98122" }]}>
                        <Feather name="check" size={12} color="#10B981" />
                        <Text style={[styles.actionChipText, { color: "#10B981" }]}>Otimizado</Text>
                      </View>
                    )}
                    {proj.supportActive !== false ? (
                      <TouchableOpacity
                        onPress={() => {
                          Alert.alert(
                            "Parar Suporte",
                            `Encerrar suporte de "${proj.name}" vai reduzir gradualmente a base de fãs. O jogo continua gerando receita mas sem novas atualizações.\n\nEsta ação não pode ser desfeita.`,
                            [
                              { text: "Cancelar", style: "cancel" },
                              { text: "Encerrar Suporte", style: "destructive", onPress: () => {
                                const err = stopSupport(proj.id);
                                if (err) Alert.alert("Erro", err);
                              }},
                            ]
                          );
                        }}
                        style={[styles.actionChip, { backgroundColor: "#F5A6230D", borderColor: "#F5A62333" }]}
                        activeOpacity={0.8}
                      >
                        <Feather name="pause-circle" size={12} color="#F5A623" />
                        <Text style={[styles.actionChipText, { color: "#F5A623" }]}>Parar Suporte</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={[styles.actionChip, { backgroundColor: "#FF4D6A08", borderColor: "#FF4D6A22" }]}>
                        <Feather name="pause" size={12} color="#FF4D6A" />
                        <Text style={[styles.actionChipText, { color: "#FF4D6A" }]}>Sem Suporte</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert(
                          "Desativar Jogo",
                          `Desativar "${proj.name}" removerá da lista ativa e encerrará a receita recorrente. Esta ação não pode ser desfeita.\n\nReceita total gerada: ${formatMoney(proj.totalRevenue)}`,
                          [
                            { text: "Cancelar", style: "cancel" },
                            { text: "Desativar", style: "destructive", onPress: () => cancelGameProject(proj.id) },
                          ]
                        );
                      }}
                      style={[styles.actionChip, { backgroundColor: "#FF4D6A0D", borderColor: "#FF4D6A33" }]}
                      activeOpacity={0.8}
                    >
                      <Feather name="archive" size={12} color="#FF4D6A" />
                      <Text style={[styles.actionChipText, { color: "#FF4D6A" }]}>Desativar</Text>
                    </TouchableOpacity>
                  </View>

                  {/* ── Post-launch support panel ──────────────────────── */}
                  <PostLaunchPanel
                    proj={proj}
                    currentYear={state.year}
                    currentMonth={state.month}
                    reputation={state.reputation}
                    colors={colors}
                    onAction={(actionType) => {
                      const err = postLaunchAction(proj.id, actionType);
                      if (err) Alert.alert("Erro", err);
                    }}
                  />
                </View>
              );
            })}
          </>
        )}

        {/* Histórico tab — cancelled/archived games */}
        {activeTab === "history" && (
          <>
            {cancelled.length === 0 ? (
              <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="archive" size={36} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Nenhum histórico ainda</Text>
                <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
                  Jogos cancelados ou desativados aparecerão aqui.
                </Text>
              </View>
            ) : (
              <>
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>HISTÓRICO</Text>
                {cancelled.map((proj) => {
                  const projGenres = proj.genres ?? [proj.genre];
                  return (
                    <View key={proj.id} style={[styles.releasedCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: 0.75 }]}>
                      <View style={styles.projectHeader}>
                        <View style={[styles.projectIcon, { backgroundColor: "#9CA3AF22" }]}>
                          <Feather name={GAME_GENRE_ICONS[projGenres[0]] as any} size={20} color="#9CA3AF" />
                        </View>
                        <View style={styles.projectMeta}>
                          <Text style={[styles.projectName, { color: colors.foreground }]}>{proj.name}</Text>
                          <Text style={[styles.genreText, { color: colors.mutedForeground }]}>
                            {projGenres.map(g => GAME_GENRE_NAMES[g]).join(" + ")}{proj.launchYear > 0 ? ` · ${proj.launchYear}` : ""}
                          </Text>
                        </View>
                        <View style={[styles.tag, { backgroundColor: "#FF4D6A18", alignSelf: "center" }]}>
                          <Text style={[styles.tagText, { color: "#FF4D6A" }]}>Cancelado</Text>
                        </View>
                      </View>
                      {(proj.totalRevenue ?? 0) > 0 && (
                        <View style={styles.totalRevRow}>
                          <Text style={[styles.totalRevLabel, { color: colors.mutedForeground }]}>Receita total gerada</Text>
                          <Text style={[styles.totalRevValue, { color: colors.foreground }]}>{formatMoney(proj.totalRevenue)}</Text>
                        </View>
                      )}
                      {proj.receptionScore !== undefined && (
                        <View style={[styles.receptionRow, { backgroundColor: "#9CA3AF11", borderColor: "#9CA3AF33" }]}>
                          <StarRow stars={proj.starRating ?? 0} />
                          <Text style={[styles.scoreText, { color: "#9CA3AF" }]}>{proj.receptionScore}/100</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </>
            )}
          </>
        )}

        {/* Empty state for dev / released tabs */}
        {activeTab === "dev" && active.length === 0 && (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="play-circle" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Nenhum jogo em criação</Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              Cria o teu primeiro jogo para gerar receita recorrente e aumentar a base de fãs.
            </Text>
          </View>
        )}
        {activeTab === "released" && released.length === 0 && (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="check-circle" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Nenhum jogo lançado ainda</Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              Desenvolve e lança jogos para vê-los aqui.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* New Game FAB — floating pill, bottom-right */}
      <TouchableOpacity
        onPress={() => setShowNew(true)}
        style={[styles.fab, { bottom: botPad + 20 }]}
        activeOpacity={0.85}
      >
        <LinearGradient colors={["#FF4D6A", "#CC2244"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.fabInner}>
          <Feather name="plus" size={16} color="#fff" />
          <Text style={styles.fabText}>Novo Jogo</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Sequel Advice Modal */}
      <Modal visible={showAdvice} transparent animationType="fade" statusBarTranslucent>
        <Pressable style={styles.overlay} onPress={() => { setShowAdvice(false); setPendingSequel(null); }}>
          <Pressable style={[styles.adviceSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.adviceHeader}>
              <Feather name="git-branch" size={20} color="#A855F7" />
              <Text style={[styles.adviceTitle, { color: colors.foreground }]}>Conselho de Sequência</Text>
            </View>
            {pendingSequel && (
              <>
                <View style={styles.adviceOrigRow}>
                  <StarRow stars={pendingSequel.starRating ?? 3} size={14} />
                  <Text style={[styles.adviceOrigName, { color: colors.mutedForeground }]}>{pendingSequel.name}</Text>
                </View>
                {sequelAdviceData && (
                  <>
                    <View style={[styles.adviceBox, {
                      backgroundColor: sequelAdviceData.riskLevel === "low" ? "#10B98111" : sequelAdviceData.riskLevel === "medium" ? "#F5A62311" : "#FF4D6A11",
                      borderColor: sequelAdviceData.riskLevel === "low" ? "#10B98133" : sequelAdviceData.riskLevel === "medium" ? "#F5A62333" : "#FF4D6A33",
                    }]}>
                      <Text style={[styles.adviceMsg, { color: colors.foreground }]}>{sequelAdviceData.message}</Text>
                    </View>
                    <View style={styles.adviceBonusRow}>
                      <Text style={[styles.adviceBonusLabel, { color: colors.mutedForeground }]}>Bônus de receita esperado:</Text>
                      <Text style={[styles.adviceBonusVal, {
                        color: sequelAdviceData.bonusMult >= 1.2 ? "#10B981" : sequelAdviceData.bonusMult >= 1.0 ? "#F5A623" : "#FF4D6A"
                      }]}>
                        {sequelAdviceData.bonusMult >= 1 ? "+" : ""}{Math.round((sequelAdviceData.bonusMult - 1) * 100)}%
                      </Text>
                    </View>
                  </>
                )}
              </>
            )}
            <View style={styles.adviceBtnRow}>
              <TouchableOpacity
                onPress={() => { setShowAdvice(false); setPendingSequel(null); }}
                style={[styles.adviceCancelBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
              >
                <Text style={[styles.adviceCancelText, { color: colors.mutedForeground }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmSequel} style={styles.adviceConfirmBtn} activeOpacity={0.85}>
                <LinearGradient colors={["#A855F7", "#7C3AED"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.adviceConfirmInner}>
                  <Feather name="arrow-right" size={14} color="#fff" />
                  <Text style={styles.adviceConfirmText}>Continuar</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* New Game Modal */}
      <Modal visible={showNew} transparent animationType="slide" statusBarTranslucent>
        <Pressable style={styles.overlay} onPress={closeNewModal}>
          <Pressable style={[styles.newGameSheet, { backgroundColor: colors.card, borderColor: colors.border, ...(sheetHeight ? { height: sheetHeight } : {}) }]}>

            {/* ── DRAG HANDLE ───────────────────────────────────────────────── */}
            <View style={styles.dragHandleContainer} pointerEvents="none">
              <View style={[styles.dragHandleBar, { backgroundColor: colors.mutedForeground }]} />
            </View>

            {/* ── FIXED HEADER (always visible, never scrolls) ──────────────── */}
            {(() => {
              const stepOrder = ["step1", "step2", "step3", "export"] as const;
              const stepIdx = stepOrder.indexOf(modalStep);
              const prevStep = stepIdx > 0 ? stepOrder[stepIdx - 1] : null;
              const stepNames = ["Gênero", "Público", "Plataforma", "Exportação"];
              return (
                <View style={[styles.sheetFixedHeader, { borderBottomColor: colors.border }]}>
                  <View style={styles.sheetHeaderRow}>
                    <TouchableOpacity
                      onPress={prevStep ? () => setModalStep(prevStep) : closeNewModal}
                      style={[styles.sheetBackBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                      activeOpacity={0.75}
                    >
                      <Feather name={prevStep ? "chevron-left" : "x"} size={18} color={colors.foreground} />
                    </TouchableOpacity>
                    <View style={styles.stepIndicator}>
                      {stepNames.map((name, i) => (
                        <React.Fragment key={name}>
                          <View style={[styles.stepDot, { backgroundColor: i <= stepIdx ? "#FF4D6A" : colors.border }]} />
                          {i < stepNames.length - 1 && (
                            <View style={[styles.stepLine, { backgroundColor: i < stepIdx ? "#FF4D6A" : colors.border }]} />
                          )}
                        </React.Fragment>
                      ))}
                    </View>
                    <Text style={[styles.stepLabel, { color: "#FF4D6A" }]}>
                      {stepIdx + 1}/{stepNames.length}
                    </Text>
                  </View>

                  <View style={styles.sheetTitleRow}>
                    <Text style={[styles.sheetTitle, { color: colors.foreground, marginBottom: 0 }]}>
                      {sequelTarget ? "Criar Sequência" :
                        modalStep === "step1" ? "Escolha os Gêneros" :
                        modalStep === "step2" ? "Público & Orçamento" :
                        modalStep === "step3" ? "Plataforma" :
                        "Mercados Internacionais"}
                    </Text>
                    {modalStep === "step1" && (
                      <View style={[styles.genreCounterBadge, {
                        backgroundColor: selectedGenres.length === 3 ? "#F5A62322" : "#4DA6FF22",
                        borderColor: selectedGenres.length === 3 ? "#F5A62366" : "#4DA6FF66",
                      }]}>
                        <Text style={[styles.genreCounterBadgeText, {
                          color: selectedGenres.length === 3 ? "#F5A623" : "#4DA6FF",
                        }]}>
                          {selectedGenres.length}/3
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })()}

            {/* ── SCROLLABLE CONTENT ───────────────────────────────────────── */}
            <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.sheetScrollContent}>
              {modalStep === "step1" && (<>
              {sequelTarget && sequelAdviceData && (
                <View style={[styles.sequelBanner, {
                  backgroundColor: sequelAdviceData.riskLevel === "low" ? "#10B98111" : "#F5A62311",
                  borderColor: sequelAdviceData.riskLevel === "low" ? "#10B98133" : "#F5A62333",
                }]}>
                  <Feather name="git-branch" size={14} color={sequelAdviceData.riskLevel === "low" ? "#10B981" : "#F5A623"} />
                  <Text style={[styles.sequelBannerText, { color: sequelAdviceData.riskLevel === "low" ? "#10B981" : "#F5A623" }]}>
                    {sequelAdviceData.message}
                  </Text>
                </View>
              )}

              <Text style={[styles.sheetLabel, { color: colors.mutedForeground }]}>Nome do Jogo</Text>
              <View style={[styles.nameInput, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                <TextInput
                  value={gameName}
                  onChangeText={setGameName}
                  placeholder={`Ex: Final Quest ${state.year}`}
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.nameInputText, { color: colors.foreground }]}
                />
              </View>

              {/* Trend legend */}
              <View style={styles.trendLegend}>
                {activeTrends.slice(0, 3).map((tg, ti) => (
                  <View key={tg} style={[styles.trendLegendItem, { backgroundColor: TREND_COLORS[ti] + "22" }]}>
                    <Text style={[styles.trendLegendText, { color: TREND_COLORS[ti] }]}>
                      {TREND_LABELS[ti]}: {GAME_GENRE_NAMES[tg]}
                    </Text>
                  </View>
                ))}
              </View>

              {GENRE_CATEGORIES.map((cat) => (
                <View key={cat.label} style={{ gap: 6 }}>
                  <Text style={[styles.genreCatLabel, { color: colors.mutedForeground }]}>{cat.label.toUpperCase()}</Text>
                  <View style={styles.genreGrid}>
                    {cat.genres.map((g) => {
                      const trendIdx = activeTrends.indexOf(g);
                      const isTrending = trendIdx >= 0;
                      const trendColor = isTrending ? TREND_COLORS[trendIdx] : null;
                      const isSelected = selectedGenres.includes(g);
                      const isDisabled = !isSelected && selectedGenres.length >= 3;
                      return (
                        <TouchableOpacity
                          key={g}
                          onPress={() => !isDisabled && toggleGenre(g)}
                          style={[styles.genreChip, {
                            backgroundColor: isSelected ? "#FF4D6A22" : isDisabled ? colors.muted : colors.secondary,
                            borderColor: isSelected ? "#FF4D6A" : isTrending ? (trendColor + "88") : colors.border,
                            opacity: isDisabled ? 0.4 : 1,
                          }]}
                          activeOpacity={isDisabled ? 1 : 0.7}
                        >
                          <Feather name={GAME_GENRE_ICONS[g] as any} size={13} color={isSelected ? "#FF4D6A" : isTrending ? trendColor! : colors.mutedForeground} />
                          <Text style={[styles.genreChipText, { color: isSelected ? "#FF4D6A" : isTrending ? trendColor! : colors.mutedForeground }]}>
                            {GAME_GENRE_NAMES[g]}
                          </Text>
                          {isTrending && !isSelected && (
                            <Text style={[styles.trendDot, { color: trendColor! }]}>
                              {trendIdx === 0 ? "🔥" : trendIdx === 1 ? "📈" : "⬆️"}
                            </Text>
                          )}
                          {isSelected && <Feather name="check" size={11} color="#FF4D6A" />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}

              {/* Synergy info for 2+ genres */}
              {selectedGenres.length >= 2 && (
                <View style={[styles.synergyBox, {
                  backgroundColor: risky ? "#FF4D6A11" : synergy >= 1.1 ? "#10B98111" : "#4DA6FF11",
                  borderColor: risky ? "#FF4D6A33" : synergy >= 1.1 ? "#10B98133" : "#4DA6FF33",
                }]}>
                  <View style={styles.synergyRow}>
                    <Text style={[styles.synergyLabel, { color: colors.mutedForeground }]}>Combinação:</Text>
                    <Text style={[styles.synergyVal, { color: colors.foreground }]}>
                      {selectedGenres.map(g => GAME_GENRE_NAMES[g]).join(" + ")}
                    </Text>
                  </View>
                  <View style={styles.synergyRow}>
                    <Text style={[styles.synergyLabel, { color: colors.mutedForeground }]}>Sinergia:</Text>
                    <Text style={[styles.synergyVal, {
                      color: synergy >= 1.1 ? "#10B981" : synergy >= 1.0 ? "#F5A623" : "#FF4D6A"
                    }]}>
                      {synergy >= 1.0 ? "+" : ""}{Math.round((synergy - 1) * 100)}%
                    </Text>
                  </View>
                  {risky && (
                    <Text style={styles.riskyWarning}>
                      ⚠️ Combinação experimental — alta variância, resultado imprevisível
                    </Text>
                  )}
                  {!risky && synergy >= 1.1 && (
                    <Text style={[styles.synergyGood, { color: "#10B981" }]}>
                      ✓ Combinação natural — sinergia comprovada pelo mercado
                    </Text>
                  )}
                </View>
              )}

              </>)}

              {/* ── Step 2: Público-alvo, Classificação Etária & Orçamento ── */}
              {modalStep === "step2" && (<>

              {/* Target Audience */}
              <Text style={[styles.sheetLabel, { color: colors.mutedForeground }]}>Público-alvo</Text>
              <View style={styles.pillRow}>
                {(["kids", "teens", "adults", "all"] as GameAudience[]).map((a) => {
                  const sel = audience === a;
                  const cfg: Record<GameAudience, { icon: string; label: string; color: string; mult: string }> = {
                    kids:   { icon: "smile",       label: "Crianças",  color: "#F5A623", mult: "×0.75" },
                    teens:  { icon: "user",         label: "Jovens",    color: "#4DA6FF", mult: "×1.00" },
                    adults: { icon: "briefcase",    label: "Adultos",   color: "#10B981", mult: "×1.20" },
                    all:    { icon: "users",         label: "Todos",     color: "#A855F7", mult: "×0.95" },
                  };
                  const c = cfg[a];
                  return (
                    <TouchableOpacity
                      key={a}
                      onPress={() => setAudience(a)}
                      style={[styles.audiencePill, {
                        backgroundColor: sel ? c.color + "22" : colors.secondary,
                        borderColor: sel ? c.color : colors.border,
                      }]}
                      activeOpacity={0.8}
                    >
                      <Feather name={c.icon as any} size={13} color={sel ? c.color : colors.mutedForeground} />
                      <View>
                        <Text style={[styles.audiencePillLabel, { color: sel ? c.color : colors.foreground }]}>{c.label}</Text>
                        <Text style={[styles.audiencePillMult, { color: sel ? c.color : colors.mutedForeground }]}>{c.mult}</Text>
                      </View>
                      {sel && <Feather name="check" size={11} color={c.color} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Age Rating */}
              <Text style={[styles.sheetLabel, { color: colors.mutedForeground }]}>Classificação Etária</Text>
              <View style={styles.ratingRow}>
                {(["E", "T", "M", "AO"] as GameAgeRating[]).map((r) => {
                  const sel = ageRating === r;
                  const cfg: Record<GameAgeRating, { label: string; sub: string; color: string; mult: string }> = {
                    E:  { label: "E",  sub: "Livre",    color: "#10B981", mult: "×0.90" },
                    T:  { label: "T",  sub: "12+",      color: "#4DA6FF", mult: "×1.00" },
                    M:  { label: "M",  sub: "16+",      color: "#F5A623", mult: "×1.10" },
                    AO: { label: "AO", sub: "18+",      color: "#FF4D6A", mult: "×0.80" },
                  };
                  const c = cfg[r];
                  return (
                    <TouchableOpacity
                      key={r}
                      onPress={() => setAgeRating(r)}
                      style={[styles.ratingPill, {
                        backgroundColor: sel ? c.color + "22" : colors.secondary,
                        borderColor: sel ? c.color : colors.border,
                      }]}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.ratingPillLabel, { color: sel ? c.color : colors.foreground }]}>{c.label}</Text>
                      <Text style={[styles.ratingPillSub, { color: sel ? c.color : colors.mutedForeground }]}>{c.sub}</Text>
                      <Text style={[styles.ratingPillMult, { color: sel ? c.color : colors.mutedForeground }]}>{c.mult}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Budget with scaled info */}
              <Text style={[styles.sheetLabel, { color: colors.mutedForeground }]}>Orçamento</Text>
              {/* Era cost banner — always visible */}
              <View style={[styles.multiGenreBanner, { backgroundColor: "#4DA6FF11", borderColor: "#4DA6FF33" }]}>
                <Feather name="clock" size={13} color="#4DA6FF" />
                <Text style={[styles.multiGenreBannerText, { color: "#4DA6FF" }]}>
                  Era {state.year} · {(state.researchedNodes ?? []).length} pesquisas → custo ×{eraCostMult.toFixed(2)}
                </Text>
              </View>
              {selectedGenres.length > 1 && (
                <View style={[styles.multiGenreBanner, { backgroundColor: "#F5A62311", borderColor: "#F5A62333" }]}>
                  <Feather name="info" size={13} color="#F5A623" />
                  <Text style={[styles.multiGenreBannerText, { color: "#F5A623" }]}>
                    {selectedGenres.length} gêneros: custo ×{scale.costMult.toFixed(2)} · tempo ×{scale.timeMult.toFixed(2)}
                  </Text>
                </View>
              )}
              {BUDGET_TIERS.map((tier, i) => {
                const sc = getMultiGenreScale(selectedGenres.length);
                const adjCost = Math.round(tier.cost * sc.costMult * eraCostMult);
                const adjMonths = computeGenreDevTime(selectedGenres, Math.round(tier.months * sc.timeMult), tier.minMonths, tier.maxMonths);
                return (
                  <TouchableOpacity key={i} onPress={() => setBudgetIdx(i)} style={[styles.budgetRow, {
                    backgroundColor: budgetIdx === i ? tier.color + "15" : colors.secondary,
                    borderColor: budgetIdx === i ? tier.color : colors.border,
                  }]}>
                    <View style={[styles.budgetIcon, { backgroundColor: tier.color + "22" }]}>
                      <Feather name={tier.icon} size={16} color={tier.color} />
                    </View>
                    <View style={styles.budgetMeta}>
                      <Text style={[styles.budgetLabel, { color: colors.foreground }]}>{tier.label}</Text>
                      <Text style={[styles.budgetDetail, { color: colors.mutedForeground }]}>
                        {adjMonths} meses · Qualidade {tier.quality}/10
                      </Text>
                    </View>
                    <Text style={[styles.budgetCost, { color: tier.color }]}>{formatMoney(adjCost)}</Text>
                    {budgetIdx === i && <Feather name="check-circle" size={16} color={tier.color} />}
                  </TouchableOpacity>
                );
              })}

              </>)}

              {/* ── Step 3: Plataforma ─────────────────────────────────────────── */}
              {modalStep === "step3" && (<>

              {sequelTarget && sequelAdviceData && (
                <View style={[styles.sequelBanner, {
                  backgroundColor: sequelAdviceData.riskLevel === "low" ? "#10B98111" : "#F5A62311",
                  borderColor: sequelAdviceData.riskLevel === "low" ? "#10B98133" : "#F5A62333",
                }]}>
                  <Feather name="git-branch" size={14} color={sequelAdviceData.riskLevel === "low" ? "#10B981" : "#F5A623"} />
                  <Text style={[styles.sequelBannerText, { color: sequelAdviceData.riskLevel === "low" ? "#10B981" : "#F5A623" }]}>
                    Sequência · {sequelTarget.name} → bônus {Math.round((sequelAdviceData.bonusMult - 1) * 100) >= 0 ? "+" : ""}{Math.round((sequelAdviceData.bonusMult - 1) * 100)}%
                  </Text>
                </View>
              )}

              <Text style={[styles.sheetLabel, { color: colors.mutedForeground }]}>Plataforma</Text>
              <View style={styles.pillRow}>
                {(["console", "pc", "mobile"] as GamePlatform[]).map((p) => {
                  const locked = getPlatformWarning(p) !== null;
                  const sel = platform === p;
                  const cfg: Record<GamePlatform, { icon: string; label: string; color: string; era: string }> = {
                    console: { icon: "monitor", label: "Console", color: "#4DA6FF", era: "1972+" },
                    pc:      { icon: "cpu",     label: "PC",      color: "#10B981", era: "1980+" },
                    mobile:  { icon: "smartphone", label: "Mobile", color: "#A855F7", era: "2007+" },
                  };
                  const c = cfg[p];
                  return (
                    <TouchableOpacity
                      key={p}
                      onPress={() => { if (!locked) setPlatform(p); }}
                      style={[styles.platformPill, {
                        backgroundColor: locked ? colors.muted : sel ? c.color + "22" : colors.secondary,
                        borderColor: locked ? colors.border : sel ? c.color : colors.border,
                        opacity: locked ? 0.4 : 1,
                      }]}
                      activeOpacity={locked ? 1 : 0.8}
                    >
                      <Feather name={c.icon as any} size={14} color={locked ? colors.mutedForeground : sel ? c.color : colors.mutedForeground} />
                      <View>
                        <Text style={[styles.platformPillLabel, { color: locked ? colors.mutedForeground : sel ? c.color : colors.foreground }]}>{c.label}</Text>
                        <Text style={[styles.platformPillEra, { color: locked ? colors.mutedForeground : c.color }]}>{locked ? "🔒 " + c.era : c.era}</Text>
                      </View>
                      {sel && <Feather name="check" size={12} color={c.color} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={[styles.multiGenreBanner, { backgroundColor: "#4DA6FF11", borderColor: "#4DA6FF33", marginTop: 10 }]}>
                <Feather name="info" size={13} color="#4DA6FF" />
                <Text style={[styles.multiGenreBannerText, { color: "#4DA6FF" }]}>
                  Custo total: {formatMoney(scaledCost)} · {scaledMonths} meses · Qualidade {budget.quality}/10
                </Text>
              </View>

              </>)}

              {/* ── Export Step ─────────────────────────────────────────────────── */}
              {modalStep === "export" && (() => {
                const primaryGenre = selectedGenres[0];
                return (
                  <View>
                    <View style={[styles.exportInfoBox, { backgroundColor: "#4DA6FF11", borderColor: "#4DA6FF33" }]}>
                      <Feather name="globe" size={13} color="#4DA6FF" />
                      <Text style={[styles.exportInfoText, { color: "#4DA6FF" }]}>
                        🏠 América do Norte já incluída. Investe em regiões adicionais para ampliar o alcance.
                      </Text>
                    </View>
                    <View style={[styles.exportInfoBox, { backgroundColor: "#10B98111", borderColor: "#10B98133", marginTop: 6 }]}>
                      <Feather name="info" size={12} color="#10B981" />
                      <Text style={[styles.exportInfoText, { color: "#10B981" }]}>
                        Filial aberta = 100% receita · Exportação sem filial = 50% receita
                      </Text>
                    </View>
                    {EXPORTABLE_REGIONS.map((regionId) => {
                      const restriction = checkRegionRestriction(primaryGenre, ageRating, state.year, state.reputation, regionId);
                      const hasBranch = getRegionHasBranch(regionId, state.branches ?? []);
                      const tierIdx = exportSelections[regionId] ?? -1;
                      const regionColor = REGION_COLORS[regionId];
                      const tiers = REGION_INVESTMENT_TIERS[regionId];
                      const isBlocked = !!restriction;
                      const estimatedRev = tierIdx >= 0 && !isBlocked
                        ? estimateExportMonthlyRevenue(scaledCost * 0.5 * (budget.quality / 10), regionId, tiers[tierIdx], hasBranch)
                        : 0;

                      return (
                        <View key={regionId} style={[styles.exportRegionCard, {
                          backgroundColor: isBlocked ? colors.secondary : tierIdx >= 0 ? regionColor + "11" : colors.card,
                          borderColor: isBlocked ? colors.border : tierIdx >= 0 ? regionColor + "66" : colors.border,
                          opacity: isBlocked ? 0.6 : 1,
                        }]}>
                          <View style={styles.exportRegionHeader}>
                            <View style={[styles.exportRegionBadge, { backgroundColor: regionColor + "22" }]}>
                              <Feather name="map-pin" size={12} color={regionColor} />
                            </View>
                            <View style={styles.exportRegionInfo}>
                              <Text style={[styles.exportRegionName, { color: isBlocked ? colors.mutedForeground : colors.foreground }]}>
                                {REGION_NAMES[regionId]}
                              </Text>
                              {isBlocked ? (
                                <Text style={[styles.exportBlockReason, { color: "#FF4D6A" }]}>
                                  🔒 {restriction}
                                </Text>
                              ) : (
                                <View style={styles.exportMetaRow}>
                                  {hasBranch && (
                                    <View style={[styles.exportBranchTag, { backgroundColor: "#10B98122" }]}>
                                      <Feather name="home" size={10} color="#10B981" />
                                      <Text style={[styles.exportBranchTagText, { color: "#10B981" }]}>Filial</Text>
                                    </View>
                                  )}
                                  {tierIdx >= 0 && (
                                    <Text style={[styles.exportEstRev, { color: "#10B981" }]}>
                                      ~{formatMoney(estimatedRev)}/mês
                                    </Text>
                                  )}
                                </View>
                              )}
                            </View>
                          </View>
                          {!isBlocked && (
                            <View style={styles.exportTierRow}>
                              <TouchableOpacity
                                onPress={() => setExportSelections(prev => ({ ...prev, [regionId]: -1 }))}
                                style={[styles.exportTierBtn, {
                                  backgroundColor: tierIdx === -1 ? "#6B728033" : colors.secondary,
                                  borderColor: tierIdx === -1 ? "#6B7280" : colors.border,
                                }]}
                                activeOpacity={0.8}
                              >
                                <Text style={[styles.exportTierBtnText, { color: tierIdx === -1 ? "#fff" : colors.mutedForeground }]}>Pular</Text>
                              </TouchableOpacity>
                              {([0, 1, 2] as const).map((ti) => (
                                <TouchableOpacity
                                  key={ti}
                                  onPress={() => setExportSelections(prev => ({ ...prev, [regionId]: ti }))}
                                  style={[styles.exportTierBtn, {
                                    backgroundColor: tierIdx === ti ? regionColor + "33" : colors.secondary,
                                    borderColor: tierIdx === ti ? regionColor : colors.border,
                                    flex: 1,
                                  }]}
                                  activeOpacity={0.8}
                                >
                                  <Text style={[styles.exportTierBtnText, { color: tierIdx === ti ? regionColor : colors.mutedForeground, fontSize: 10 }]}>
                                    {REGION_INVESTMENT_LABELS[ti]}
                                  </Text>
                                  <Text style={[styles.exportTierCost, { color: tierIdx === ti ? regionColor : colors.mutedForeground }]}>
                                    {formatMoney(tiers[ti])}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}
                        </View>
                      );
                    })}
                    {exportInvestmentTotal > 0 && (
                      <View style={[styles.exportTotalBox, { backgroundColor: "#F5A62311", borderColor: "#F5A62344" }]}>
                        <Text style={[styles.exportTotalLabel, { color: colors.mutedForeground }]}>Investimento total em exportação</Text>
                        <Text style={[styles.exportTotalVal, { color: "#F5A623" }]}>{formatMoney(exportInvestmentTotal)}</Text>
                      </View>
                    )}
                  </View>
                );
              })()}

              </View>{/* end sheetScrollContent */}
            </ScrollView>

            {/* ── STICKY FOOTER (always visible, never scrolls) ────────────── */}
            {(() => {
              const isExportDisabled = modalStep === "export" && state.money < scaledCost + exportInvestmentTotal;
              const isStep1Empty = modalStep === "step1" && selectedGenres.length === 0;
              const isDisabled = isExportDisabled || isStep1Empty;
              return (
                <View style={[styles.stickyFooter, { borderTopColor: colors.border, backgroundColor: colors.card, paddingBottom: Math.max(20, insets.bottom + 12) }]}>
                  {modalStep === "step1" && (
                    <View style={[styles.footerGenreChips, { gap: 6 }]}>
                      {selectedGenres.length === 0 ? (
                        <Text style={[styles.footerHint, { color: colors.mutedForeground }]}>Selecione ao menos 1 gênero</Text>
                      ) : (
                        selectedGenres.map(g => (
                          <TouchableOpacity
                            key={g}
                            onPress={() => toggleGenre(g)}
                            style={[styles.footerGenreTag, { backgroundColor: "#FF4D6A22", borderColor: "#FF4D6A66" }]}
                          >
                            <Feather name={GAME_GENRE_ICONS[g] as any} size={11} color="#FF4D6A" />
                            <Text style={[styles.footerGenreTagText, { color: "#FF4D6A" }]}>{GAME_GENRE_NAMES[g]}</Text>
                            <Feather name="x" size={10} color="#FF4D6A" />
                          </TouchableOpacity>
                        ))
                      )}
                    </View>
                  )}
                  <TouchableOpacity
                    onPress={handleStart}
                    disabled={isDisabled}
                    style={[styles.startProjBtn, { opacity: isDisabled ? 0.35 : 1, marginTop: 0 }]}
                    activeOpacity={0.85}
                  >
                    <LinearGradient colors={["#FF4D6A", "#CC2244"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.startProjBtnInner}>
                      <Feather
                        name={modalStep === "export" ? "play" : "arrow-right"}
                        size={15}
                        color="#fff"
                      />
                      <Text style={styles.startProjBtnText}>
                        {modalStep === "step1" ? "Próximo: Público & Orçamento" :
                         modalStep === "step2" ? "Próximo: Plataforma" :
                         modalStep === "step3" ? `Próximo: Exportação  (${formatMoney(scaledCost)})` :
                         "Lançar Projeto"}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              );
            })()}

          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function OverStat({ label, value, color, colors }: { label: string; value: string; color: string; colors: any }) {
  return (
    <View style={styles.overStat}>
      <Text style={[styles.overStatValue, { color }]}>{value}</Text>
      <Text style={[styles.overStatLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, gap: 14 },
  overviewCard: { borderRadius: 16, borderWidth: 1, padding: 16, overflow: "hidden" },
  overviewStats: { flexDirection: "row", justifyContent: "space-around" },
  overStat: { alignItems: "center", gap: 4 },
  overStatValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  overStatLabel: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.8, textTransform: "uppercase" },
  tabBar: { flexDirection: "row", borderRadius: 12, borderWidth: 1, marginBottom: 2, overflow: "hidden" },
  tabItem: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, paddingHorizontal: 4, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  tabBadge: { borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  tabBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  projectCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12, overflow: "hidden" },
  projectHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  projectIcon: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  projectMeta: { flex: 1 },
  projectName: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 5 },
  projectTags: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  tag: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 7 },
  tagText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  genreText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  cancelBtn: { padding: 10 },
  progressTrack: { height: 5, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 5, borderRadius: 3 },
  projectFooter: { flexDirection: "row", justifyContent: "space-between" },
  progressText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  monthsLeft: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  hypeSection: { borderTopWidth: 1, paddingTop: 12, gap: 7 },
  hypeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  hypeLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  hypeLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  hypeBadge: { backgroundColor: "#FF6B3522", borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3 },
  hypeBadgeText: { fontSize: 11, color: "#FF6B35", fontFamily: "Inter_600SemiBold" },
  hypeBtn: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  hypeBtnText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  hypeTrack: { height: 5, borderRadius: 3, overflow: "hidden" },
  hypeFill: { height: 5, borderRadius: 3 },
  hypeHint: { fontSize: 11, fontFamily: "Inter_400Regular" },
  hypeErrorToast: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginTop: 8, padding: 12, borderRadius: 10 },
  hypeErrorText: { fontSize: 12, color: "#fff", fontFamily: "Inter_600SemiBold", flex: 1 },
  releasedCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10, overflow: "hidden" },
  revenueCol: { alignItems: "flex-end" },
  revenueAmount: { fontSize: 16, fontFamily: "Inter_700Bold" },
  revenueLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  receptionRow: {
    flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap",
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1,
  },
  sentimentBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 7 },
  sentimentText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  scoreText: { fontSize: 12, fontFamily: "Inter_700Bold", marginLeft: "auto" },
  fanDemandBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 7, backgroundColor: "#F5A62322" },
  fanDemandText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#F5A623" },
  receptionComment: { fontSize: 12, fontFamily: "Inter_400Regular", fontStyle: "italic", lineHeight: 18, paddingHorizontal: 2 },
  lifeBar: { flexDirection: "row", alignItems: "center", gap: 8 },
  lifeTrack: { flex: 1, height: 5, borderRadius: 3, overflow: "hidden" },
  lifeFill: { height: 5, borderRadius: 3 },
  lifeLabel: { fontSize: 11, fontFamily: "Inter_400Regular", width: 52, textAlign: "right" },
  totalRevRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalRevLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  totalRevValue: { fontSize: 12, fontFamily: "Inter_700Bold" },
  sequelBanner: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1,
  },
  sequelBannerText: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold", lineHeight: 19 },
  bugRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1,
  },
  bugText: { fontSize: 12, fontFamily: "Inter_600SemiBold", flex: 1 },
  fixBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1,
  },
  fixBtnText: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold" },
  empty: { borderRadius: 14, borderWidth: 1, padding: 24, alignItems: "center", gap: 10 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  emptyDesc: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  // ── Floating action button (pill, bottom-right) ───────────────────────────
  fab: { position: "absolute", right: 18, borderRadius: 28, overflow: "hidden", elevation: 6, shadowColor: "#FF4D6A", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 8 },
  fabInner: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 13, paddingHorizontal: 18 },
  fabText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff" },
  // ── Compact action chips (sequel / deactivate) ────────────────────────────
  actionChipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  actionChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  actionChipText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  actionChipBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  actionChipBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "flex-end" },
  newGameSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, maxHeight: "92%", overflow: "hidden", flexDirection: "column" },
  sheetFixedHeader: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12, borderBottomWidth: 1, gap: 8 },
  sheetTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  sheetTitle: { fontSize: 18, fontFamily: "Inter_700Bold", flex: 1 },
  genreCounterBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1.5 },
  genreCounterBadgeText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  dragHandleContainer: { alignItems: "center", paddingTop: 10, paddingBottom: 4 },
  dragHandleBar: { width: 38, height: 4, borderRadius: 2, opacity: 0.4 },
  sheetScroll: { flex: 1 },
  sheetScrollContent: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 120, gap: 10 },
  stickyFooter: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20, borderTopWidth: 1, gap: 8 },
  footerGenreChips: { flexDirection: "row", flexWrap: "wrap", alignItems: "center" },
  footerGenreTag: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20, borderWidth: 1.5 },
  footerGenreTagText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  footerHint: { fontSize: 11, fontFamily: "Inter_400Regular", fontStyle: "italic" },
  sheetLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, textTransform: "uppercase", marginTop: 4 },
  nameInput: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  nameInputText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  genreLabelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  genreCounter: { fontSize: 11, fontFamily: "Inter_700Bold" },
  trendLegend: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 4 },
  trendLegendItem: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  trendLegendText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  genreCatLabel: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.8, marginTop: 6 },
  genreGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  genreChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5 },
  genreChipText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  trendDot: { fontSize: 10 },
  synergyBox: { borderRadius: 10, borderWidth: 1, padding: 12, gap: 6 },
  synergyRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  synergyLabel: { fontSize: 11, fontFamily: "Inter_400Regular", width: 70 },
  synergyVal: { fontSize: 12, fontFamily: "Inter_700Bold", flex: 1 },
  riskyWarning: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#FF4D6A", lineHeight: 16 },
  synergyGood: { fontSize: 11, fontFamily: "Inter_600SemiBold", lineHeight: 16 },
  pillRow: { flexDirection: "row", gap: 8 },
  platformPill: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 10, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  platformPillLabel: { fontSize: 12, fontFamily: "Inter_700Bold" },
  platformPillEra: { fontSize: 10, fontFamily: "Inter_400Regular" },
  audiencePill: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 8, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  audiencePillLabel: { fontSize: 11, fontFamily: "Inter_700Bold" },
  audiencePillMult: { fontSize: 10, fontFamily: "Inter_400Regular" },
  ratingRow: { flexDirection: "row", gap: 6 },
  ratingPill: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 12, borderWidth: 1, gap: 2 },
  ratingPillLabel: { fontSize: 16, fontFamily: "Inter_700Bold" },
  ratingPillSub: { fontSize: 10, fontFamily: "Inter_400Regular" },
  ratingPillMult: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  multiGenreBanner: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, marginBottom: 4 },
  multiGenreBannerText: { fontSize: 12, fontFamily: "Inter_600SemiBold", flex: 1 },
  budgetRow: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, padding: 12 },
  budgetIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  budgetMeta: { flex: 1 },
  budgetLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  budgetDetail: { fontSize: 11, fontFamily: "Inter_400Regular" },
  budgetCost: { fontSize: 13, fontFamily: "Inter_700Bold" },
  startProjBtn: { borderRadius: 14, overflow: "hidden", marginTop: 8, marginBottom: 8 },
  startProjBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15 },
  startProjBtnText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff" },
  adviceSheet: {
    marginHorizontal: 24, marginVertical: "auto", borderRadius: 20, borderWidth: 1,
    padding: 24, gap: 16, alignSelf: "center", width: "88%",
  },
  adviceHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  adviceTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  adviceOrigRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  adviceOrigName: { fontSize: 13, fontFamily: "Inter_400Regular" },
  adviceBox: { borderRadius: 12, borderWidth: 1, padding: 14 },
  adviceMsg: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  adviceBonusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  adviceBonusLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  adviceBonusVal: { fontSize: 18, fontFamily: "Inter_700Bold" },
  adviceBtnRow: { flexDirection: "row", gap: 12 },
  adviceCancelBtn: { flex: 1, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center", paddingVertical: 13 },
  adviceCancelText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  adviceConfirmBtn: { flex: 1, borderRadius: 12, overflow: "hidden" },
  adviceConfirmInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13 },
  adviceConfirmText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff" },
  // Sheet header with back button
  sheetHeaderRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  sheetBackBtn: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  // Step indicator
  stepIndicator: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  stepDot: { width: 8, height: 8, borderRadius: 4 },
  stepLine: { flex: 1, height: 2, borderRadius: 1 },
  stepLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  // Export step
  exportInfoBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  exportInfoText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  exportRegionCard: { borderRadius: 14, borderWidth: 1, padding: 12, gap: 10, marginTop: 8 },
  exportRegionHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  exportRegionBadge: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  exportRegionInfo: { flex: 1, gap: 4 },
  exportRegionName: { fontSize: 14, fontFamily: "Inter_700Bold" },
  exportBlockReason: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16 },
  exportMetaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  exportBranchTag: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  exportBranchTagText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  exportEstRev: { fontSize: 11, fontFamily: "Inter_700Bold" },
  exportTierRow: { flexDirection: "row", gap: 6 },
  exportTierBtn: { borderRadius: 9, borderWidth: 1, paddingVertical: 7, paddingHorizontal: 8, alignItems: "center", gap: 2 },
  exportTierBtnText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  exportTierCost: { fontSize: 10, fontFamily: "Inter_400Regular" },
  exportTotalBox: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderRadius: 12, borderWidth: 1, padding: 12, marginTop: 10 },
  exportTotalLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  exportTotalVal: { fontSize: 16, fontFamily: "Inter_700Bold" },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, borderWidth: 1, paddingVertical: 13, paddingHorizontal: 16, marginTop: 8 },
  backBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  // Post-launch panel
  plPanel: { borderRadius: 12, borderWidth: 1, padding: 10, gap: 2 },
  plHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  plHeaderTitle: { flex: 1, fontSize: 12, fontFamily: "Inter_600SemiBold" },
  plHistBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  plHistBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  plLifeChip: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  plLifeText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  plPendingTitle: { fontSize: 12, fontFamily: "Inter_700Bold" },
  plPendingMeta: { fontSize: 10, fontFamily: "Inter_400Regular" },
  plActionBtn: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, padding: 9 },
  plActionIcon: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  plActionName: { fontSize: 11, fontFamily: "Inter_700Bold" },
  plActionDesc: { fontSize: 10, fontFamily: "Inter_400Regular" },
  plActionCost: { fontSize: 11, fontFamily: "Inter_700Bold" },
  plActionMeta: { fontSize: 9, fontFamily: "Inter_400Regular" },
  plRiskRow: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 7, borderWidth: 1, padding: 7, flexWrap: "wrap" },
  plRiskText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  plRiskSub: { fontSize: 9, fontFamily: "Inter_400Regular", flex: 1 },
  plOutcomeHint: { fontSize: 9, fontFamily: "Inter_400Regular" },
  plHistoryBox: { borderTopWidth: 1, paddingTop: 6, gap: 6 },
  plHistoryTitle: { fontSize: 10, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5 },
  plHistoryRow: { gap: 2, borderRadius: 4, paddingVertical: 3 },
  plHistoryText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  plHistoryMeta: { fontSize: 9, fontFamily: "Inter_400Regular" },
});
