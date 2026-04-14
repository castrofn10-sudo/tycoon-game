import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Platform, Alert, Modal, Pressable, Animated, Easing,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useGameplay } from "@/context/GameplayContext";
import { GridBackground } from "@/components/GridBackground";
import { ScreenHeader } from "@/components/ScreenHeader";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { formatMoney, safeN } from "@/constants/gameEconomics";
import {
  RESEARCH_NODES, CATEGORIES, ResearchCategory,
  CATEGORY_COLORS, CATEGORY_NAMES, CATEGORY_ICONS,
  getNodesForCategory, getChosenPathForCategory, getNodeById, ResearchNode,
  computePassiveBonuses, getEraLabel,
} from "@/constants/strategyTree";
import { RESEARCH_MIN_YEARS } from "@/constants/historicalProgression";
import { getCharacterById } from "@/constants/characters";
import {
  ERA_UPGRADES, EraUpgrade, EraId, EraUpgradeCategory,
  ERA_NAMES, ERA_MIN_YEARS as ERA_YEAR_MAP, ERA_UPGRADE_CATEGORY_LIST,
  ERA_CATEGORY_COLORS, ERA_CATEGORY_ICONS, ERA_CATEGORY_NAMES,
  computeEraUpgradeBonuses, getStratPathProgress,
} from "@/constants/eraUpgrades";
import {
  computeSpecialization, getSpecializationBonuses, getSpecLevel,
  SPEC_PATHS, SPEC_NAMES, SPEC_FULL_NAMES, SPEC_ICONS, SPEC_COLORS,
  SPEC_LEVEL_NAMES, SPEC_LEVEL_COLORS, SPEC_TRADE_OFFS, getTopSpecs, SpecScores,
} from "@/constants/specialization";
import {
  EXCLUSIVE_TECHS, ExclusiveTech, checkExclusiveAvailable,
} from "@/constants/exclusiveTech";
import {
  RESEARCH_COMBOS, ResearchCombo, getComboTime, isComboAvailable,
} from "@/constants/researchCombos";

type MainTab = "research" | "exclusivos" | "upgrades" | "identity";

const ERA_IDS: EraId[] = [1, 2, 3, 4, 5, 6, 7, 8];

// ── Node rarity ──────────────────────────────────────────────────────────────
function getNodeRarity(tier: number): "common" | "advanced" | "breakthrough" | "elite" {
  if (tier <= 2) return "common";
  if (tier <= 5) return "advanced";
  if (tier <= 8) return "breakthrough";
  return "elite";
}

const RARITY_LABELS = {
  common: "Comum",
  advanced: "Avançado",
  breakthrough: "Inovação",
  elite: "Elite",
};
const RARITY_COLORS = {
  common: "#6B7280",
  advanced: "#4DA6FF",
  breakthrough: "#A855F7",
  elite: "#F5A623",
};

// ── Subcomponents ─────────────────────────────────────────────────────────────
function BonusChip({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <View style={[chipStyles.chip, { backgroundColor: color + "15", borderColor: color + "33" }]}>
      <Feather name={icon as any} size={11} color={color} />
      <Text style={[chipStyles.text, { color }]}>{label}</Text>
    </View>
  );
}
const chipStyles = StyleSheet.create({
  chip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, marginRight: 6 },
  text: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
});

function RarityBadge({ rarity }: { rarity: "common" | "advanced" | "breakthrough" | "elite" }) {
  if (rarity === "common") return null;
  const color = RARITY_COLORS[rarity];
  return (
    <View style={[rarityStyles.badge, { backgroundColor: color + "20", borderColor: color + "55" }]}>
      <Text style={[rarityStyles.text, { color }]}>{RARITY_LABELS[rarity]}</Text>
    </View>
  );
}
const rarityStyles = StyleSheet.create({
  badge: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, borderWidth: 1, alignSelf: "flex-start", marginTop: 3 },
  text: { fontFamily: "Inter_700Bold", fontSize: 9, letterSpacing: 0.5 },
});

// ── Animation helpers ─────────────────────────────────────────────────────────

function PulseDot({ color }: { color: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.9)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.6, duration: 900, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 900, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.9, duration: 0, useNativeDriver: true }),
        ]),
      ]),
    ).start();
  }, []);
  return (
    <View style={{ width: 8, height: 8, alignItems: "center", justifyContent: "center" }}>
      <Animated.View style={{
        width: 8, height: 8, borderRadius: 4,
        backgroundColor: color,
        transform: [{ scale }],
        opacity,
        position: "absolute",
      }} />
      <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: color }} />
    </View>
  );
}

function PulseRing({ color, size = 36 }: { color: string; size?: number }) {
  const opacity = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.25, duration: 750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
  }, []);
  return (
    <Animated.View style={{
      position: "absolute", top: -3, left: -3, right: -3, bottom: -3,
      borderRadius: size / 2 + 3, borderWidth: 2, borderColor: color,
      opacity,
    }} />
  );
}

function GlowBar({ color, pct }: { color: string; pct: number }) {
  const width = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(width, { toValue: pct, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [pct]);
  return (
    <View style={{ height: 3, borderRadius: 2, backgroundColor: color + "20", overflow: "hidden", marginTop: 4 }}>
      <Animated.View style={{ height: "100%", borderRadius: 2, backgroundColor: color, width: width.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }} />
    </View>
  );
}

function ActiveShimmer({ color }: { color: string }) {
  const slide = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(slide, { toValue: 1, duration: 1800, easing: Easing.linear, useNativeDriver: false }),
    ).start();
  }, []);
  const translateX = slide.interpolate({ inputRange: [0, 1], outputRange: ["-100%", "200%"] });
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: "hidden", borderRadius: 10 }]}>
      <Animated.View style={{
        position: "absolute", top: 0, bottom: 0, width: "40%",
        transform: [{ translateX: translateX as any }],
        backgroundColor: color + "14",
      }} />
    </Animated.View>
  );
}

function SpecPanel({ scores, currentYear }: { scores: SpecScores; currentYear: number }) {
  const colors = useColors();
  const top = getTopSpecs(scores);
  const topSpec = top[0];
  const bonuses = getSpecializationBonuses(scores);

  const hasSpec = topSpec && topSpec[1] >= 3;
  const maxScore = Math.max(...Object.values(scores), 1);

  return (
    <View style={[specStyles.panel, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={specStyles.panelTop}>
        <View style={specStyles.identityRow}>
          {hasSpec ? (
            <>
              <View style={[specStyles.identityIcon, { backgroundColor: SPEC_COLORS[topSpec[0]] + "20" }]}>
                <Feather name={SPEC_ICONS[topSpec[0]] as any} size={16} color={SPEC_COLORS[topSpec[0]]} />
              </View>
              <View>
                <Text style={[specStyles.identityLabel, { color: colors.mutedForeground }]}>Identidade da Empresa</Text>
                <Text style={[specStyles.identityName, { color: SPEC_COLORS[topSpec[0]] }]}>
                  {SPEC_FULL_NAMES[topSpec[0]]}
                </Text>
              </View>
              <View style={[specStyles.levelBadge, { backgroundColor: SPEC_LEVEL_COLORS[getSpecLevel(topSpec[1])] + "22", borderColor: SPEC_LEVEL_COLORS[getSpecLevel(topSpec[1])] + "55" }]}>
                <Text style={[specStyles.levelText, { color: SPEC_LEVEL_COLORS[getSpecLevel(topSpec[1])] }]}>
                  {SPEC_LEVEL_NAMES[getSpecLevel(topSpec[1])]}
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={[specStyles.identityIcon, { backgroundColor: colors.secondary }]}>
                <Feather name="help-circle" size={16} color={colors.mutedForeground} />
              </View>
              <View>
                <Text style={[specStyles.identityLabel, { color: colors.mutedForeground }]}>Identidade da Empresa</Text>
                <Text style={[specStyles.identityName, { color: colors.mutedForeground }]}>Não definida (pesquise mais)</Text>
              </View>
            </>
          )}
        </View>
        {/* Mini bonus chips */}
        {hasSpec && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={specStyles.bonusRow} contentContainerStyle={{ paddingRight: 8 }}>
            {bonuses.ratingBonus > 0.2 && <BonusChip icon="star" label={`+${safeN(bonuses.ratingBonus, 0).toFixed(1)} R`} color="#F5A623" />}
            {bonuses.salesMult > 1.01 && <BonusChip icon="trending-up" label={`+${Math.round((bonuses.salesMult - 1) * 100)}% V`} color="#10B981" />}
            {bonuses.gameRevMult > 1.01 && <BonusChip icon="play-circle" label={`+${Math.round((bonuses.gameRevMult - 1) * 100)}% J`} color="#FF4D6A" />}
            {bonuses.campaignMult > 1.01 && <BonusChip icon="volume-2" label={`+${Math.round((bonuses.campaignMult - 1) * 100)}% Mkt`} color="#A855F7" />}
            {bonuses.repBonus > 0.5 && <BonusChip icon="shield" label={`+${Math.round(bonuses.repBonus)} Rep`} color="#34D399" />}
          </ScrollView>
        )}
      </View>

      {/* Spec bars */}
      <View style={specStyles.barsGrid}>
        {SPEC_PATHS.map((spec) => {
          const score = scores[spec];
          const level = getSpecLevel(score);
          const col = SPEC_COLORS[spec];
          const pct = score / maxScore;
          return (
            <View key={spec} style={specStyles.barItem}>
              <View style={specStyles.barHeader}>
                <Feather name={SPEC_ICONS[spec] as any} size={10} color={score > 0 ? col : colors.mutedForeground} />
                <Text style={[specStyles.barLabel, { color: score > 0 ? col : colors.mutedForeground }]}>{SPEC_NAMES[spec]}</Text>
                {score > 0 && <Text style={[specStyles.barScore, { color: col }]}>{score}</Text>}
              </View>
              <View style={[specStyles.barBg, { backgroundColor: colors.secondary }]}>
                <View style={[specStyles.barFill, { backgroundColor: col, width: `${Math.max(pct * 100, score > 0 ? 6 : 0)}%` as any }]} />
              </View>
            </View>
          );
        })}
      </View>

      {/* Trade-off warning for dominant spec */}
      {hasSpec && getSpecLevel(topSpec[1]) >= 2 && (
        <View style={[specStyles.tradeOff, { borderColor: colors.border }]}>
          <Feather name="alert-circle" size={10} color={colors.mutedForeground} />
          <Text style={[specStyles.tradeOffText, { color: colors.mutedForeground }]}>
            Tradeoff: {SPEC_TRADE_OFFS[topSpec[0]]}
          </Text>
        </View>
      )}
    </View>
  );
}
const specStyles = StyleSheet.create({
  panel: { marginHorizontal: 12, marginBottom: 8, borderRadius: 10, borderWidth: 1, padding: 10 },
  panelTop: { marginBottom: 8 },
  identityRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  identityIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  identityLabel: { fontFamily: "Inter_400Regular", fontSize: 10, marginBottom: 1 },
  identityName: { fontFamily: "Inter_700Bold", fontSize: 13 },
  levelBadge: { marginLeft: "auto", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  levelText: { fontFamily: "Inter_700Bold", fontSize: 10 },
  bonusRow: { marginBottom: 4 },
  barsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  barItem: { width: "30%", minWidth: 90 },
  barHeader: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 3 },
  barLabel: { fontFamily: "Inter_500Medium", fontSize: 10, flex: 1 },
  barScore: { fontFamily: "Inter_700Bold", fontSize: 10 },
  barBg: { height: 4, borderRadius: 2, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 2 },
  tradeOff: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8, paddingTop: 7, borderTopWidth: 1 },
  tradeOffText: { fontFamily: "Inter_400Regular", fontSize: 10, fontStyle: "italic" },
});

// ── Identity data tables ──────────────────────────────────────────────────────

const NEXT_LEVEL_THRESHOLDS = [3, 9, 18];
function getNextLevelInfo(score: number): { label: string; needed: number } | null {
  for (let i = 0; i < NEXT_LEVEL_THRESHOLDS.length; i++) {
    if (score < NEXT_LEVEL_THRESHOLDS[i])
      return { label: ["Emergente", "Focada", "Mestre"][i], needed: NEXT_LEVEL_THRESHOLDS[i] - score };
  }
  return null;
}

const ARCHETYPE: Record<string, { name: string; icon: string; tagline: string }> = {
  hardware:   { name: "A Engenheira",    icon: "cpu",        tagline: "Tecnologia é a nossa arte" },
  games:      { name: "A Criativa",      icon: "play-circle",tagline: "Cada jogo é uma obra-prima" },
  online:     { name: "A Digital",       icon: "wifi",       tagline: "O futuro já chegou aqui" },
  premium:    { name: "A Esteta",        icon: "award",      tagline: "Qualidade sem compromisso" },
  innovation: { name: "A Visionária",    icon: "zap",        tagline: "Inventamos o que ainda não existe" },
  business:   { name: "A Estrategista",  icon: "briefcase",  tagline: "Dominamos o mercado com precisão" },
  none:       { name: "A Novata",        icon: "help-circle",tagline: "A identidade ainda está por escrever" },
};

type Trait = { label: string; icon: string; color: string; positive: boolean };
function computeTraits(scores: SpecScores, totalScore: number): Trait[] {
  const traits: Trait[] = [];
  if (scores.hardware >= 18)  traits.push({ label: "Engenheira de Elite", icon: "cpu",          color: "#4DA6FF", positive: true });
  else if (scores.hardware >= 9) traits.push({ label: "Confiável",         icon: "shield",       color: "#4DA6FF", positive: true });
  if (scores.games >= 18)     traits.push({ label: "Lendária em Jogos",    icon: "play-circle",  color: "#FF4D6A", positive: true });
  else if (scores.games >= 9) traits.push({ label: "Criativa",             icon: "feather",      color: "#FF4D6A", positive: true });
  if (scores.online >= 18)    traits.push({ label: "Pioneira Digital",     icon: "wifi",         color: "#10B981", positive: true });
  else if (scores.online >= 9) traits.push({ label: "Conectada",           icon: "globe",        color: "#10B981", positive: true });
  if (scores.premium >= 18)   traits.push({ label: "Ícone Premium",        icon: "award",        color: "#F5A623", positive: true });
  else if (scores.premium >= 9) traits.push({ label: "Sofisticada",        icon: "star",         color: "#F5A623", positive: true });
  if (scores.innovation >= 18) traits.push({ label: "Disruptora",          icon: "zap",          color: "#A855F7", positive: true });
  else if (scores.innovation >= 9) traits.push({ label: "Visionária",      icon: "eye",          color: "#A855F7", positive: true });
  if (scores.business >= 18)  traits.push({ label: "Dominante",            icon: "trending-up",  color: "#34D399", positive: true });
  else if (scores.business >= 9) traits.push({ label: "Eficiente",         icon: "briefcase",    color: "#34D399", positive: true });
  if (totalScore >= 50)       traits.push({ label: "Omnipresente",         icon: "globe",        color: "#F5A623", positive: true });
  else if (totalScore >= 30)  traits.push({ label: "Multifacetada",        icon: "layers",       color: "#4DA6FF", positive: true });
  // Negative traits
  const top = getTopSpecs(scores);
  const topSpec = top[0];
  if (topSpec && scores.innovation >= 9) traits.push({ label: "Volátil",        icon: "alert-triangle", color: "#F5A623", positive: false });
  if (topSpec && topSpec[1] >= 15 && top.length === 1) traits.push({ label: "Saturada",  icon: "minus-circle",   color: "#FF4D6A", positive: false });
  const zeroCount = (Object.values(scores) as number[]).filter(v => v === 0).length;
  if (zeroCount >= 4 && totalScore > 5) traits.push({ label: "Fragmentada",     icon: "git-branch",     color: "#6B7280", positive: false });
  if (scores.hardware >= 9 && scores.games < 3)  traits.push({ label: "Fraca em Jogos",    icon: "x-circle", color: "#6B7280", positive: false });
  if (scores.games >= 9 && scores.hardware < 3)  traits.push({ label: "Fraca em Hardware", icon: "x-circle", color: "#6B7280", positive: false });
  return traits;
}

const MARKET_PERCEPTION: Record<string, Record<number, string>> = {
  hardware: {
    1: "O mercado ainda não notou a sua aposta em hardware — continue construindo.",
    2: "Consumidores começam a associar o seu nome a consoles confiáveis.",
    3: "Rivais copiam as suas especificações. Os consumidores confiam na sua engenharia.",
  },
  games: {
    1: "Os fãs aguardam ansiosamente o seu próximo lançamento.",
    2: "Críticos destacam a qualidade dos seus títulos. A reputação cresce.",
    3: "O mercado considera os seus jogos obras de arte. Os fãs pagam qualquer preço.",
  },
  online: {
    1: "A presença digital começa a ser notada pelos utilizadores conectados.",
    2: "O ecossistema online atrai utilizadores que nunca largariam a subscrição.",
    3: "O mercado vê a sua plataforma como infraestrutura essencial. Rivais temem a dependência que criou.",
  },
  premium: {
    1: "Consumidores associam a sua marca a qualidade acima da média.",
    2: "O público premium paga mais pelos seus produtos sem questionar.",
    3: "O seu nome é sinónimo de luxo. Os clientes fazem fila para o novo lançamento.",
  },
  innovation: {
    1: "O mercado percebe que a sua empresa pensa diferente — os analistas ficam curiosos.",
    2: "Investidores fazem fila. Rivais tentam perceber o que vem a seguir.",
    3: "O mercado vê a sua empresa como um laboratório do futuro. Cada anúncio vira notícia.",
  },
  business: {
    1: "Parceiros comerciais reconhecem a sua estratégia sólida.",
    2: "Distribuidores preferem trabalhar consigo. A rede de negócios expande-se.",
    3: "Concorrentes estudam os seus movimentos como xadrez. Domínio comercial consolidado.",
  },
};

const FLAVOR_TEXT: Record<string, string> = {
  hardware:   "Os seus engenheiros vivem no limite da sanidade criativa — cada prototype é uma obra de arte.",
  games:      "A equipa de design dorme pouco e sonha muito — os personagens parecem ganhar vida própria.",
  online:     "A infraestrutura cresce como um organismo vivo — servidores que nunca dormem.",
  premium:    "O design department tem budget infinito para materiais — cada pixel é colocado com intenção.",
  innovation: "Os I&D engineers recusam ideias normais — apenas o impossível é bem-vindo.",
  business:   "O CFO conhece cada rival de cor — a estratégia está sempre 3 movimentos à frente.",
  none:       "A empresa ainda procura a sua voz. Os funcionários debatem a direção nos corredores.",
};

const EVOLUTION_STAGES = [
  { min: 0,  max: 4,  label: "Startup",           next: "Empresa Regional",   icon: "sunrise" },
  { min: 5,  max: 14, label: "Empresa Regional",  next: "Líder Nacional",     icon: "map-pin" },
  { min: 15, max: 29, label: "Líder Nacional",    next: "Gigante Regional",   icon: "flag" },
  { min: 30, max: 49, label: "Gigante Regional",  next: "Corporação Global",  icon: "globe" },
  { min: 50, max: 999,label: "Corporação Global", next: null,                 icon: "star" },
];
function getEvolutionStage(total: number) {
  return EVOLUTION_STAGES.find(s => total >= s.min && total <= s.max) ?? EVOLUTION_STAGES[0];
}

const EVOLUTION_PATH_TEXT: Record<string, string> = {
  hardware:   "Tendência: dominar o mercado de hardware por uma geração inteira",
  games:      "Caminho atual: tornar-se a produtora de jogos mais premiada do planeta",
  online:     "Tendência: construir o maior ecossistema digital do setor",
  premium:    "Caminho atual: definir o padrão premium para toda a indústria",
  innovation: "Tendência: liderar a próxima revolução tecnológica",
  business:   "Caminho atual: expandir até dominar todos os mercados-chave",
  none:       "O caminho ainda está por definir — cada decisão molda o destino",
};

// ── IdentityTab component ─────────────────────────────────────────────────────
function IdentityTab({ scores, researchedCount }: {
  scores: SpecScores; researchedCount: number;
}) {
  const colors = useColors();
  const top = getTopSpecs(scores);
  const topSpec = top[0];
  const bonuses = getSpecializationBonuses(scores);
  const hasSpec = topSpec && topSpec[1] >= 3;
  const maxScore = Math.max(...Object.values(scores), 1);
  const totalScore = Object.values(scores).reduce((s, v) => s + v, 0);
  const specLevel = hasSpec ? getSpecLevel(topSpec[1]) : 0;
  const nextLevel = hasSpec ? getNextLevelInfo(topSpec[1]) : null;
  const archetypeKey = hasSpec ? topSpec[0] : "none";
  const archetype = ARCHETYPE[archetypeKey];
  const traits = computeTraits(scores, totalScore);
  const positiveTraits = traits.filter(t => t.positive).slice(0, 4);
  const negativeTraits = traits.filter(t => !t.positive).slice(0, 2);
  const perception = hasSpec
    ? MARKET_PERCEPTION[topSpec[0]]?.[Math.min(specLevel, 3) as 1 | 2 | 3] ?? null
    : null;
  const flavorText = FLAVOR_TEXT[archetypeKey];
  const evoStage = getEvolutionStage(totalScore);
  const evoPathText = EVOLUTION_PATH_TEXT[archetypeKey];
  const weakSpecs = (Object.entries(scores) as [SpecPath, number][]).filter(([, v]) => v === 0).map(([s]) => s);
  const hasBonuses = bonuses.ratingBonus > 0.1 || bonuses.salesMult > 1.01 ||
    bonuses.gameRevMult > 1.01 || bonuses.campaignMult > 1.01 || bonuses.repBonus > 0.5;
  const topColor = hasSpec ? SPEC_COLORS[topSpec[0]] : "#6B7280";

  if (researchedCount === 0) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 14 }}>
        <View style={[{ width: 72, height: 72, borderRadius: 22, alignItems: "center", justifyContent: "center" }, { backgroundColor: colors.secondary }]}>
          <Feather name="compass" size={34} color={colors.mutedForeground} />
        </View>
        <Text style={{ fontSize: 17, fontFamily: "Inter_700Bold", color: colors.foreground, textAlign: "center" }}>
          Identidade por definir
        </Text>
        <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground, textAlign: "center", lineHeight: 20 }}>
          Pesquise nós na Árvore P&D para construir a personalidade e o legado da sua empresa.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={idStyles.scroll} showsVerticalScrollIndicator={false}>

      {/* ── HERO / ARCHETYPE CARD ──────────────────────────────── */}
      <View style={[idStyles.heroCard, { backgroundColor: topColor + "12", borderColor: topColor + "33" }]}>
        <LinearGradient
          colors={[topColor + "20", "transparent"]}
          start={{ x: 0, y: 0 }} end={{ x: 1.2, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={idStyles.heroRow}>
          <View style={[idStyles.heroIcon, { backgroundColor: topColor + "22", borderColor: topColor + "55" }]}>
            <Feather name={archetype.icon as any} size={26} color={topColor} />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={[idStyles.heroSub, { color: colors.mutedForeground }]}>ARQUÉTIPO</Text>
            <Text style={[idStyles.heroName, { color: topColor }]}>{archetype.name}</Text>
            <Text style={[idStyles.heroTagline, { color: colors.mutedForeground }]}>"{archetype.tagline}"</Text>
          </View>
          {hasSpec && (
            <View style={[idStyles.levelBadge, { backgroundColor: SPEC_LEVEL_COLORS[specLevel] + "25", borderColor: SPEC_LEVEL_COLORS[specLevel] + "55" }]}>
              <Text style={[idStyles.levelText, { color: SPEC_LEVEL_COLORS[specLevel] }]}>{SPEC_LEVEL_NAMES[specLevel]}</Text>
            </View>
          )}
        </View>

        {/* Dominant identity line */}
        <View style={[idStyles.identityLine, { backgroundColor: topColor + "18", borderColor: topColor + "33" }]}>
          <Feather name="eye" size={12} color={topColor} />
          <Text style={[idStyles.identityLineText, { color: colors.foreground }]}>
            {hasSpec ? SPEC_FULL_NAMES[topSpec[0]] : "Sem especialização dominante"}
            {top.length >= 2 && <Text style={{ color: colors.mutedForeground }}> + {SPEC_NAMES[top[1][0]]}</Text>}
          </Text>
          <View style={[idStyles.totalBadge, { backgroundColor: topColor + "20" }]}>
            <Text style={[idStyles.totalBadgeText, { color: topColor }]}>{totalScore} nós</Text>
          </View>
        </View>

        {/* Flavor text */}
        <Text style={[idStyles.heroFlavor, { color: colors.mutedForeground }]}>{flavorText}</Text>
      </View>

      {/* ── TRAITS ─────────────────────────────────────────────── */}
      {(positiveTraits.length > 0 || negativeTraits.length > 0) && (
        <View style={[idStyles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={idStyles.sectionHeader}>
            <Feather name="tag" size={13} color="#A855F7" />
            <Text style={[idStyles.sectionTitle, { color: colors.foreground }]}>Traços da Empresa</Text>
          </View>
          {positiveTraits.length > 0 && (
            <>
              <Text style={[idStyles.traitGroupLabel, { color: colors.mutedForeground }]}>PONTOS FORTES</Text>
              <View style={idStyles.traitGrid}>
                {positiveTraits.map(t => (
                  <View key={t.label} style={[idStyles.traitChip, { backgroundColor: t.color + "15", borderColor: t.color + "40" }]}>
                    <Feather name={t.icon as any} size={12} color={t.color} />
                    <Text style={[idStyles.traitChipText, { color: t.color }]}>{t.label}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
          {negativeTraits.length > 0 && (
            <>
              <Text style={[idStyles.traitGroupLabel, { color: colors.mutedForeground, marginTop: 6 }]}>FRAQUEZAS</Text>
              <View style={idStyles.traitGrid}>
                {negativeTraits.map(t => (
                  <View key={t.label} style={[idStyles.traitChip, { backgroundColor: t.color + "15", borderColor: t.color + "40" }]}>
                    <Feather name={t.icon as any} size={12} color={t.color} />
                    <Text style={[idStyles.traitChipText, { color: t.color }]}>{t.label}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
      )}

      {/* ── MARKET PERCEPTION ──────────────────────────────────── */}
      {perception && (
        <View style={[idStyles.perceptionCard, { backgroundColor: topColor + "0E", borderColor: topColor + "28" }]}>
          <LinearGradient
            colors={[topColor + "15", "transparent"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={idStyles.perceptionHeader}>
            <Feather name="users" size={14} color={topColor} />
            <Text style={[idStyles.perceptionTitle, { color: topColor }]}>Percepção de Mercado</Text>
          </View>
          <Text style={[idStyles.perceptionText, { color: colors.foreground }]}>"{perception}"</Text>
        </View>
      )}

      {/* ── ACTIVE BONUSES ─────────────────────────────────────── */}
      {hasBonuses && (
        <View style={[idStyles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={idStyles.sectionHeader}>
            <Feather name="zap" size={13} color="#F5A623" />
            <Text style={[idStyles.sectionTitle, { color: colors.foreground }]}>Bônus Ativos</Text>
          </View>
          <View style={idStyles.bonusGrid}>
            {bonuses.ratingBonus > 0.1 && <BonusTag icon="star" label={`+${safeN(bonuses.ratingBonus, 0).toFixed(1)} Rating`} color="#F5A623" />}
            {bonuses.salesMult > 1.01 && <BonusTag icon="trending-up" label={`+${Math.round((bonuses.salesMult - 1) * 100)}% Vendas`} color="#10B981" />}
            {bonuses.gameRevMult > 1.01 && <BonusTag icon="play-circle" label={`+${Math.round((bonuses.gameRevMult - 1) * 100)}% Jogos`} color="#FF4D6A" />}
            {bonuses.campaignMult > 1.01 && <BonusTag icon="volume-2" label={`+${Math.round((bonuses.campaignMult - 1) * 100)}% Mkt`} color="#A855F7" />}
            {bonuses.repBonus > 0.5 && <BonusTag icon="shield" label={`+${Math.round(bonuses.repBonus)} Rep`} color="#34D399" />}
          </View>
        </View>
      )}

      {/* ── COMPANY DNA ────────────────────────────────────────── */}
      <View style={[idStyles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={idStyles.sectionHeader}>
          <Feather name="bar-chart-2" size={13} color="#4DA6FF" />
          <Text style={[idStyles.sectionTitle, { color: colors.foreground }]}>ADN Corporativo</Text>
        </View>
        {SPEC_PATHS.map((spec) => {
          const score = scores[spec];
          const col = SPEC_COLORS[spec];
          const level = getSpecLevel(score);
          const pct = maxScore > 0 ? score / maxScore : 0;
          const nextInfo = getNextLevelInfo(score);
          return (
            <View key={spec} style={idStyles.dnaRow}>
              <View style={[idStyles.dnaIcon, { backgroundColor: score > 0 ? col + "18" : colors.secondary }]}>
                <Feather name={SPEC_ICONS[spec] as any} size={13} color={score > 0 ? col : colors.mutedForeground} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <View style={idStyles.dnaNameRow}>
                  <Text style={[idStyles.dnaName, { color: score > 0 ? colors.foreground : colors.mutedForeground }]}>{SPEC_NAMES[spec]}</Text>
                  {score > 0 && (
                    <View style={[idStyles.dnaLevelPill, { backgroundColor: SPEC_LEVEL_COLORS[level] + "20" }]}>
                      <Text style={[idStyles.dnaLevelText, { color: SPEC_LEVEL_COLORS[level] }]}>{SPEC_LEVEL_NAMES[level]}</Text>
                    </View>
                  )}
                  <Text style={[idStyles.dnaScore, { color: score > 0 ? col : colors.mutedForeground }]}>{score}</Text>
                </View>
                <View style={[idStyles.dnaBarBg, { backgroundColor: colors.secondary }]}>
                  <View style={[idStyles.dnaBarFill, { backgroundColor: col, width: `${Math.max(pct * 100, score > 0 ? 3 : 0)}%` as any }]} />
                </View>
                {score > 0 && nextInfo && (
                  <Text style={[idStyles.dnaHint, { color: colors.mutedForeground }]}>+{nextInfo.needed} nós → {nextInfo.label}</Text>
                )}
              </View>
            </View>
          );
        })}
        {weakSpecs.length > 0 && (
          <View style={[idStyles.weakRow, { borderTopColor: colors.border }]}>
            <Feather name="alert-circle" size={11} color={colors.mutedForeground} />
            <Text style={[idStyles.weakLabel, { color: colors.mutedForeground }]}>
              Ausente: {weakSpecs.map(s => SPEC_NAMES[s]).join(" · ")}
            </Text>
          </View>
        )}
      </View>

      {/* ── EVOLUTION PATH ─────────────────────────────────────── */}
      <View style={[idStyles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={idStyles.sectionHeader}>
          <Feather name="activity" size={13} color="#10B981" />
          <Text style={[idStyles.sectionTitle, { color: colors.foreground }]}>Trajetória de Evolução</Text>
        </View>
        <View style={idStyles.evoStages}>
          {EVOLUTION_STAGES.map((stage, i) => {
            const stageTotal = evoStage.label;
            const isCurrent = stage.label === stageTotal;
            const isPast = EVOLUTION_STAGES.indexOf(EVOLUTION_STAGES.find(s => s.label === stageTotal)!) > i;
            const col = isPast ? "#10B981" : isCurrent ? topColor : "#6B728040";
            return (
              <React.Fragment key={stage.label}>
                <View style={idStyles.evoNode}>
                  <View style={[idStyles.evoNodeCircle, {
                    backgroundColor: isCurrent ? topColor + "20" : isPast ? "#10B98120" : colors.secondary,
                    borderColor: isCurrent ? topColor : isPast ? "#10B981" : colors.border,
                  }]}>
                    <Feather name={stage.icon as any} size={12} color={col} />
                  </View>
                  <Text style={[idStyles.evoNodeLabel, { color: isCurrent ? topColor : isPast ? "#10B981" : colors.mutedForeground, fontFamily: isCurrent ? "Inter_700Bold" : "Inter_400Regular" }]} numberOfLines={2}>
                    {stage.label}
                  </Text>
                </View>
                {i < EVOLUTION_STAGES.length - 1 && (
                  <View style={[idStyles.evoLine, { backgroundColor: isPast ? "#10B98160" : colors.border }]} />
                )}
              </React.Fragment>
            );
          })}
        </View>
        {evoStage.next ? (
          <View style={[idStyles.evoHint, { backgroundColor: topColor + "10", borderColor: topColor + "25" }]}>
            <Feather name="arrow-right-circle" size={12} color={topColor} />
            <Text style={[idStyles.evoHintText, { color: colors.mutedForeground }]}>
              Próximo: <Text style={{ color: topColor, fontFamily: "Inter_700Bold" }}>{evoStage.next}</Text>
            </Text>
          </View>
        ) : (
          <View style={[idStyles.evoHint, { backgroundColor: "#F5A62310", borderColor: "#F5A62325" }]}>
            <Feather name="award" size={12} color="#F5A623" />
            <Text style={[idStyles.evoHintText, { color: "#F5A623" }]}>Nível máximo atingido — legado corporativo consolidado</Text>
          </View>
        )}
        <Text style={[idStyles.evoPath, { color: colors.mutedForeground }]}>{evoPathText}</Text>

        {/* Trade-off warning */}
        {hasSpec && specLevel >= 2 && (
          <View style={[idStyles.tradeOffInline, { borderTopColor: colors.border }]}>
            <Feather name="alert-triangle" size={11} color="#F5A623" />
            <Text style={[idStyles.tradeOffInlineText, { color: colors.mutedForeground }]}>
              Custo: {SPEC_TRADE_OFFS[topSpec[0]]}
            </Text>
          </View>
        )}

        {/* Next level hint */}
        {hasSpec && nextLevel && (
          <View style={[idStyles.nextLevelRow, { borderTopColor: colors.border }]}>
            <Feather name="chevrons-up" size={11} color={topColor} />
            <Text style={[idStyles.nextLevelText, { color: topColor }]}>
              +{nextLevel.needed} nós de {SPEC_NAMES[topSpec[0]]} → {nextLevel.label}
            </Text>
          </View>
        )}
      </View>

    </ScrollView>
  );
}

function BonusTag({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <View style={[idStyles.bonusTag, { backgroundColor: color + "15", borderColor: color + "30" }]}>
      <Feather name={icon as any} size={12} color={color} />
      <Text style={[idStyles.bonusTagText, { color }]}>{label}</Text>
    </View>
  );
}

const idStyles = StyleSheet.create({
  scroll: { padding: 14, gap: 12, paddingBottom: 100 },

  // Hero / Archetype
  heroCard: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 10, overflow: "hidden" },
  heroRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  heroIcon: { width: 54, height: 54, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  heroSub: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  heroName: { fontSize: 18, fontFamily: "Inter_700Bold" },
  heroTagline: { fontSize: 11, fontFamily: "Inter_400Regular", fontStyle: "italic" },
  levelBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  levelText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  identityLine: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  identityLineText: { flex: 1, fontSize: 12, fontFamily: "Inter_600SemiBold" },
  totalBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  totalBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  heroFlavor: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 17, fontStyle: "italic" },

  // Sections
  section: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 7 },
  sectionTitle: { fontSize: 13, fontFamily: "Inter_700Bold" },

  // Traits
  traitGroupLabel: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  traitGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  traitChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5 },
  traitChipText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },

  // Market Perception
  perceptionCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 8, overflow: "hidden" },
  perceptionHeader: { flexDirection: "row", alignItems: "center", gap: 7 },
  perceptionTitle: { fontSize: 12, fontFamily: "Inter_700Bold" },
  perceptionText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20, fontStyle: "italic" },

  // Bonuses
  bonusGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  bonusTag: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  bonusTagText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },

  // DNA bars
  dnaRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  dnaIcon: { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center", marginTop: 2 },
  dnaNameRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 5 },
  dnaName: { fontSize: 12, fontFamily: "Inter_600SemiBold", flex: 1 },
  dnaLevelPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  dnaLevelText: { fontSize: 9, fontFamily: "Inter_700Bold" },
  dnaScore: { fontSize: 13, fontFamily: "Inter_700Bold", minWidth: 22, textAlign: "right" },
  dnaBarBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  dnaBarFill: { height: "100%", borderRadius: 3 },
  dnaHint: { fontSize: 9, fontFamily: "Inter_400Regular" },
  weakRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingTop: 8, borderTopWidth: 1 },
  weakLabel: { fontSize: 10, fontFamily: "Inter_400Regular", flex: 1, fontStyle: "italic" },

  // Evolution
  evoStages: { flexDirection: "row", alignItems: "flex-start" },
  evoNode: { alignItems: "center", gap: 5, flex: 1, paddingHorizontal: 2 },
  evoNodeCircle: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
  evoNodeLabel: { fontSize: 9, textAlign: "center", lineHeight: 12 },
  evoLine: { height: 2, flex: 0.3, alignSelf: "flex-start", marginTop: 15 },
  evoHint: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, borderWidth: 1 },
  evoHintText: { fontSize: 11, fontFamily: "Inter_400Regular", flex: 1 },
  evoPath: { fontSize: 11, fontFamily: "Inter_400Regular", fontStyle: "italic", lineHeight: 16 },
  tradeOffInline: { flexDirection: "row", alignItems: "center", gap: 6, paddingTop: 8, borderTopWidth: 1 },
  tradeOffInlineText: { fontSize: 10, fontFamily: "Inter_400Regular", flex: 1 },
  nextLevelRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingTop: 8, borderTopWidth: 1 },
  nextLevelText: { fontSize: 10, fontFamily: "Inter_700Bold" },
});

// ── Sidebar short names ───────────────────────────────────────────────────────
const CAT_SHORT_NAMES: Record<string, string> = {
  design: "Design",
  tech: "Tecnol.",
  hardware: "Hardware",
  games: "Jogos",
  business: "Negócio",
  online: "Online",
  innovation: "Inovação",
  silicon: "Silicon",
  engines: "Engines",
  audio: "Áudio",
};

// ── Main Screen ──────────────────────────────────────────────────────────────
export default function ResearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state, startResearch, unlockEraUpgrade } = useGameplay();
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [mainTab, setMainTab] = useState<MainTab>("research");
  const [selectedCat, setSelectedCat] = useState<ResearchCategory>("design");
  const [preview, setPreview] = useState<ResearchNode | null>(null);
  const [exclPreview, setExclPreview] = useState<ExclusiveTech | null>(null);
  const [selectedEra, setSelectedEra] = useState<EraId>(1);
  const [upgradePreview, setUpgradePreview] = useState<EraUpgrade | null>(null);

  if (!state) return null;

  const researchedNodes = state.researchedNodes ?? [];
  const currentResearch = state.currentResearch;
  const currentNode = currentResearch
    ? getNodeById(currentResearch) ?? EXCLUSIVE_TECHS.find(e => e.id === currentResearch) ?? RESEARCH_COMBOS.find(c => c.id === currentResearch)
    : null;
  const currentNodeColor = currentNode && "category" in currentNode
    ? CATEGORY_COLORS[(currentNode as ResearchNode).category]
    : (currentNode as ExclusiveTech | undefined)?.color ?? (currentNode as ResearchCombo | undefined)?.color ?? "#4DA6FF";

  const chosenPath = getChosenPathForCategory(selectedCat, researchedNodes);
  const catNodes = getNodesForCategory(selectedCat);
  const paths = (["A", "B", "C"] as const).map((p) => ({
    path: p,
    name: catNodes.find((n) => n.path === p)?.pathName ?? "",
    nodes: catNodes.filter((n) => n.path === p).sort((a, b) => a.tier - b.tier),
  }));
  const bonuses = computePassiveBonuses(researchedNodes);
  const activeCharacter = getCharacterById(state.characterId ?? "visionary");
  const currentYear = state.year;

  // Specialization
  const specScores = computeSpecialization(researchedNodes);

  // Research combos
  const unlockedCombos = RESEARCH_COMBOS.filter((c) => researchedNodes.includes(c.id));
  const activeCombos = RESEARCH_COMBOS.filter((c) => currentResearch === c.id);
  const availableCombos = RESEARCH_COMBOS.filter(
    (c) => !researchedNodes.includes(c.id) && currentResearch !== c.id && isComboAvailable(c, researchedNodes),
  );
  const lockedCombos = RESEARCH_COMBOS.filter(
    (c) => !researchedNodes.includes(c.id) && currentResearch !== c.id && !isComboAvailable(c, researchedNodes),
  );

  const unlockedExcl = EXCLUSIVE_TECHS.filter(e => researchedNodes.includes(e.id));
  const availableExcl = EXCLUSIVE_TECHS.filter(e =>
    !researchedNodes.includes(e.id) &&
    e.id !== currentResearch &&
    checkExclusiveAvailable(e, currentYear, state.reputation ?? 0, state.money, researchedNodes, specScores)
  );

  // Era upgrade data
  const eraUnlocked = state.eraUpgradeUnlocked ?? [];
  const eraAvailable = state.eraUpgradeAvailable ?? [];
  const eraBonuses = computeEraUpgradeBonuses(eraUnlocked);
  const pathProgress = getStratPathProgress(eraUnlocked);
  const totalEraPath = Object.values(pathProgress).reduce((s, v) => s + v, 0);

  const currentEraNum = (() => {
    for (let e = 8; e >= 1; e--) {
      if (currentYear >= ERA_YEAR_MAP[e as EraId]) return e as EraId;
    }
    return 1 as EraId;
  })();

  const getNodeStatus = (node: ResearchNode) => {
    if (researchedNodes.includes(node.id)) return "done";
    if (currentResearch === node.id) return "active";
    if (chosenPath && chosenPath !== node.path) return "blocked";
    const minYear = RESEARCH_MIN_YEARS[node.id] ?? node.minYear;
    if (minYear && currentYear < minYear) return "year_locked";
    const missingReq = node.requires.find((r) => !researchedNodes.includes(r));
    if (missingReq) return "locked";
    if ((state.money ?? 0) < node.cost) return "no_money";
    return "available";
  };

  const getStatusColor = (status: string, catColor: string) => {
    if (status === "done") return "#10B98118";
    if (status === "active") return catColor + "28";
    if (status === "blocked") return "#FF4D6A0D";
    if (status === "locked") return colors.secondary;
    if (status === "year_locked") return "#F5A62311";
    if (status === "no_money") return "#F5A62318";
    return catColor + "1A";
  };

  const handleResearch = (nodeId: string) => {
    const err = startResearch(nodeId);
    if (err) Alert.alert("Não é possível pesquisar", err);
    else { setPreview(null); setExclPreview(null); }
  };

  const handleUnlockEra = (upgrade: EraUpgrade) => {
    const err = unlockEraUpgrade(upgrade.id);
    if (err) Alert.alert("Não é possível desbloquear", err);
    else setUpgradePreview(null);
  };

  const getEraUpgradeStatus = (upgrade: EraUpgrade): "unlocked" | "available" | "year_locked" | "locked" => {
    if (eraUnlocked.includes(upgrade.id)) return "unlocked";
    if (!eraAvailable.includes(upgrade.id)) return "locked";
    if (currentYear < upgrade.minYear) return "year_locked";
    return "available";
  };

  const exclTotal = unlockedExcl.length;
  const exclAvailCount = availableExcl.length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GridBackground />
      <ScreenHeader title="Pesquisa & Desenvolvimento" />

      {/* ── Main tab switcher ─────────────────────────────────────────────── */}
      <View style={[styles.mainTabRow, { borderColor: colors.border }]}>
        {([ 
          { id: "research", icon: "git-branch", label: "Árvore P&D", color: "#4DA6FF",
            badge: researchedNodes.filter(id => !id.startsWith("excl_") && !id.startsWith("combo_")).length || null },
          { id: "exclusivos", icon: "star", label: "Exclusivos", color: "#F5A623",
            badge: exclTotal > 0 ? exclTotal : exclAvailCount > 0 ? exclAvailCount : null,
            badgeColor: exclTotal > 0 ? "#F5A623" : "#A855F7" },
          { id: "upgrades", icon: "unlock", label: "Melhorias", color: "#10B981",
            badge: eraUnlocked.length || null },
          { id: "identity", icon: "shield", label: "Identidade", color: "#A855F7", badge: null },
        ] as const).map(({ id, icon, label, color, badge, badgeColor }: any) => {
          const isActive = mainTab === id;
          return (
            <TouchableOpacity
              key={id}
              style={[styles.mainTab, { borderColor: isActive ? color + "88" : colors.border, overflow: "hidden" }]}
              onPress={() => setMainTab(id as MainTab)} activeOpacity={0.8}
            >
              {isActive && (
                <LinearGradient
                  colors={[color + "25", color + "08"]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              )}
              <Feather name={icon} size={13} color={isActive ? color : colors.mutedForeground} />
              <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.mainTabText, { color: isActive ? color : colors.mutedForeground }]}>{label}</Text>
              {badge ? (
                <View style={[styles.mainTabBadge, { backgroundColor: badgeColor ?? color }]}>
                  <Text style={styles.mainTabBadgeText}>{badge}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── P&D TAB ─────────────────────────────────────────────────────────── */}
      {mainTab === "research" && (
        <>
          {/* Active research banner */}
          {currentNode && (
            <View style={[styles.activeBanner, {
              backgroundColor: currentNodeColor + "18",
              borderColor: currentNodeColor + "66",
              overflow: "hidden",
            }]}>
              <LinearGradient
                colors={[currentNodeColor + "28", "transparent"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <ActiveShimmer color={currentNodeColor} />
              <View style={[styles.activeBannerIconWrap, { backgroundColor: currentNodeColor + "28" }]}>
                <Feather name="cpu" size={13} color={currentNodeColor} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.activeBannerLabel, { color: currentNodeColor + "AA" }]}>EM PESQUISA</Text>
                <Text style={[styles.activeBannerText, { color: currentNodeColor }]} numberOfLines={1}>
                  {currentNode.name || "Tecnologia"}
                </Text>
              </View>
              <View style={[styles.activeBannerTimer, { backgroundColor: currentNodeColor + "20", borderColor: currentNodeColor + "44" }]}>
                <Feather name="clock" size={10} color={currentNodeColor} />
                <Text style={[styles.activeBannerTimerText, { color: currentNodeColor }]}>
                  {Math.round(state.researchMonthsLeft ?? 0)}m
                </Text>
              </View>
            </View>
          )}

          {/* Passive bonuses bar */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bonusBar} contentContainerStyle={styles.bonusBarContent}>
            {activeCharacter && activeCharacter.bonuses.ratingBonus > 0 && <BonusChip icon="user" label={`${activeCharacter.title}: +${activeCharacter.bonuses.ratingBonus} R`} color={activeCharacter.color} />}
            {bonuses.ratingBonus > 0 && <BonusChip icon="star" label={`+${safeN(bonuses.ratingBonus, 0).toFixed(1)} Rating`} color="#F5A623" />}
            {bonuses.salesMult > 1 && <BonusChip icon="trending-up" label={`+${Math.round((bonuses.salesMult - 1) * 100)}% Vendas`} color="#10B981" />}
            {bonuses.costMult < 1 && <BonusChip icon="dollar-sign" label={`-${Math.round((1 - bonuses.costMult) * 100)}% Custo`} color="#4DA6FF" />}
            {bonuses.campaignMult > 1 && <BonusChip icon="volume-2" label={`+${Math.round((bonuses.campaignMult - 1) * 100)}% Mkt`} color="#A855F7" />}
            {bonuses.gameRevMult > 1 && <BonusChip icon="play-circle" label={`+${Math.round((bonuses.gameRevMult - 1) * 100)}% Jogos`} color="#FF4D6A" />}
            {researchedNodes.length === 0 && <Text style={[styles.noBonusText, { color: colors.mutedForeground }]}>Pesquise para desbloquear bônus passivos</Text>}
          </ScrollView>

          {/* ── Sidebar + Content ──────────────────────────────────────── */}
          <View style={styles.researchBody}>

            {/* LEFT: vertical category sidebar */}
            <ScrollView
              style={[styles.catSidebar, { borderRightColor: colors.border }]}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.catSidebarInner}
            >
              {CATEGORIES.map((cat) => {
                const col = CATEGORY_COLORS[cat];
                const isSelected = selectedCat === cat;
                const count = RESEARCH_NODES.filter(n => n.category === cat && researchedNodes.includes(n.id)).length;
                const total = RESEARCH_NODES.filter(n => n.category === cat).length;
                const pct = total > 0 ? count / total : 0;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setSelectedCat(cat)}
                    style={[styles.catTab, {
                      backgroundColor: isSelected ? col + "1A" : "transparent",
                      borderRightWidth: 2,
                      borderRightColor: isSelected ? col : "transparent",
                    }]}
                    activeOpacity={0.75}
                  >
                    {isSelected && (
                      <LinearGradient
                        colors={[col + "18", "transparent"]}
                        start={{ x: 1, y: 0 }} end={{ x: 0, y: 0 }}
                        style={StyleSheet.absoluteFill}
                        pointerEvents="none"
                      />
                    )}
                    <View style={[styles.catTabIcon, { backgroundColor: isSelected ? col + "30" : col + "12" }]}>
                      <Feather name={CATEGORY_ICONS[cat] as any} size={14} color={isSelected ? col : colors.mutedForeground} />
                    </View>
                    <Text style={[styles.catTabName, { color: isSelected ? col : colors.mutedForeground }]} numberOfLines={1}>
                      {CAT_SHORT_NAMES[cat]}
                    </Text>
                    <View style={[styles.catTabBadge, { backgroundColor: count > 0 ? col : isSelected ? col + "55" : colors.border }]}>
                      <Text style={styles.catTabBadgeText}>{count > 0 ? `${count}/${total}` : total}</Text>
                    </View>
                    <View style={[styles.catTabBar, { backgroundColor: colors.secondary }]}>
                      {pct > 0 && (
                        <View style={[styles.catTabBarFill, { backgroundColor: col, width: `${Math.round(pct * 100)}%` as any }]} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* RIGHT: path headers + tree */}
            <View style={styles.catContent}>
              {/* Path column headers */}
              <View style={[styles.pathLegendRow, { marginHorizontal: 8 }]} pointerEvents="none">
                {paths.map(({ path, name, nodes }) => {
                  const isBlocked = !!chosenPath && chosenPath !== path;
                  const doneCount = nodes.filter(n => researchedNodes.includes(n.id)).length;
                  const catColor = CATEGORY_COLORS[selectedCat];
                  const isChosen = !!chosenPath && chosenPath === path;
                  return (
                    <View key={path} style={[styles.pathLegendCell, {
                      borderBottomWidth: 2,
                      borderBottomColor: isBlocked ? colors.border : doneCount > 0 ? catColor + "77" : catColor + "33",
                      paddingBottom: 5,
                      opacity: isBlocked ? 0.35 : 1,
                    }]}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <View style={[styles.pathLetterPill, {
                          backgroundColor: isBlocked ? colors.secondary : isChosen ? catColor + "30" : catColor + "18",
                          borderColor: isBlocked ? colors.border : catColor + "55",
                        }]}>
                          <Text style={[styles.pathLetterText, { color: isBlocked ? colors.mutedForeground : catColor }]}>{path}</Text>
                        </View>
                        <Text numberOfLines={1} style={[styles.pathLegendName, { color: isBlocked ? colors.mutedForeground : catColor }]}>
                          {name || CATEGORY_NAMES[selectedCat]}
                        </Text>
                      </View>
                      <Text numberOfLines={1} style={[styles.pathLegendProg, { color: doneCount > 0 ? catColor + "BB" : colors.mutedForeground }]}>
                        {doneCount}/{nodes.length} nós
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Research tree paths */}
              <ScrollView contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: botPad + 24 }} showsVerticalScrollIndicator={false}>
            <View style={styles.pathsGrid}>
              {paths.map(({ path, name, nodes }) => {
                const catColor = CATEGORY_COLORS[selectedCat];
                const isBlocked = !!chosenPath && chosenPath !== path;
                const doneCount = nodes.filter(n => researchedNodes.includes(n.id)).length;
                const hasAvailable = nodes.some(n => getNodeStatus(n) === "available");

                return (
                  <View key={path} style={[styles.pathCol, {
                    opacity: isBlocked ? 0.4 : 1,
                    borderColor: isBlocked ? colors.border : catColor + "33",
                    backgroundColor: isBlocked ? colors.secondary + "33" : catColor + "05",
                  }]}>
                    {nodes.map((node, i) => {
                      const status = getNodeStatus(node);
                      const isDone = status === "done";
                      const isActive = status === "active";
                      const isAvail = status === "available";
                      const isYearLocked = status === "year_locked";
                      const isLocked = status === "locked";
                      const minYear = RESEARCH_MIN_YEARS[node.id] ?? node.minYear;
                      const prevNode = nodes[i - 1];
                      const prevMinYear = prevNode ? (RESEARCH_MIN_YEARS[prevNode.id] ?? prevNode.minYear) : undefined;
                      const eraLabel = getEraLabel(minYear);
                      const prevEraLabel = getEraLabel(prevMinYear);
                      // Show era divider on era change, but never for the default "Primeiros Anos" heading
                      const showEraHeader = eraLabel !== prevEraLabel && eraLabel !== "Primeiros Anos";
                      const rarity = getNodeRarity(node.tier);
                      const prevDone = prevNode ? researchedNodes.includes(prevNode.id) : true;
                      const connectorActive = i > 0 && prevDone && !showEraHeader;

                      return (
                        <React.Fragment key={node.id}>
                          {showEraHeader && (
                            <View style={styles.eraHeader}>
                              <View style={[styles.eraHeaderLine, { backgroundColor: colors.border }]} />
                              <View style={[styles.eraHeaderBadge, {
                                backgroundColor: currentYear >= (minYear ?? 0) ? catColor + "22" : colors.secondary,
                                borderColor: currentYear >= (minYear ?? 0) ? catColor + "55" : colors.border,
                              }]}>
                                <Feather
                                  name={currentYear >= (minYear ?? 0) ? "unlock" : "lock"}
                                  size={9}
                                  color={currentYear >= (minYear ?? 0) ? catColor : colors.mutedForeground}
                                />
                                <Text style={[styles.eraHeaderText, {
                                  color: currentYear >= (minYear ?? 0) ? catColor : colors.mutedForeground,
                                }]}>{eraLabel}</Text>
                              </View>
                              <View style={[styles.eraHeaderLine, { backgroundColor: colors.border }]} />
                            </View>
                          )}
                          {i > 0 && !showEraHeader && (
                            <View style={styles.connector}>
                              {connectorActive ? (
                                <LinearGradient
                                  colors={[catColor + "22", catColor + "BB", catColor + "22"]}
                                  start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                                  style={[styles.connectorLine, { height: 14, width: 2, borderRadius: 1 }]}
                                />
                              ) : (
                                <View style={[styles.connectorLine, {
                                  backgroundColor: colors.border,
                                  height: 1, opacity: 0.3,
                                }]} />
                              )}
                            </View>
                          )}
                          <TouchableOpacity
                            onPress={() => {
                              if (status === "year_locked") {
                                Alert.alert("Bloqueado", `"${node.name || "Tecnologia"}" requer ${minYear}.\nEstás em ${currentYear} — faltam ${(minYear ?? 0) - currentYear} anos.`);
                              } else {
                                setPreview(node);
                              }
                            }}
                            disabled={isBlocked}
                            activeOpacity={0.75}
                            style={[styles.nodeCard, {
                              backgroundColor: getStatusColor(status, catColor),
                              borderColor: isDone ? "#10B98155" : isActive ? catColor + "DD" : isAvail ? catColor + "88" : isYearLocked ? "#F5A62333" : colors.border,
                              borderLeftWidth: 3,
                              borderLeftColor: isDone ? "#10B981" : isActive ? catColor : isAvail ? catColor : isYearLocked ? "#F5A623" : colors.border + "44",
                              opacity: isYearLocked ? 0.72 : isLocked ? 0.42 : 1,
                              shadowColor: isDone ? "#10B981" : isActive ? catColor : isAvail ? catColor : "transparent",
                              shadowOpacity: isDone ? 0.15 : isActive ? 0.3 : isAvail ? 0.12 : 0,
                              shadowRadius: isActive ? 8 : 4,
                              shadowOffset: { width: 0, height: 2 },
                              elevation: isActive ? 4 : isAvail ? 2 : 0,
                              overflow: "hidden",
                            }]}
                          >
                            {/* Gradient overlay for premium look */}
                            {(isDone || isActive || isAvail) && (
                              <LinearGradient
                                colors={isDone
                                  ? ["#10B98108", "transparent"]
                                  : [catColor + "10", "transparent"]}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                style={StyleSheet.absoluteFill}
                              />
                            )}
                            {isActive && <ActiveShimmer color={catColor} />}

                            {/* Frosted lock overlay */}
                            {(isLocked || (isBlocked)) && (
                              <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background + "44", borderRadius: 10, alignItems: "center", justifyContent: "center" }]} pointerEvents="none">
                                <View style={[{ width: 20, height: 20, borderRadius: 6, backgroundColor: colors.secondary, alignItems: "center", justifyContent: "center" }]}>
                                  <Feather name="lock" size={10} color={colors.mutedForeground} />
                                </View>
                              </View>
                            )}

                            {/* Header: status badge + badges row */}
                            <View style={styles.nodeTop}>
                              <View style={{ position: "relative" }}>
                                <View style={[styles.nodeTierBadge, {
                                  backgroundColor: isDone ? "#10B98125" : isActive ? catColor + "33" : isAvail ? catColor + "25" : isYearLocked ? "#F5A62320" : colors.secondary,
                                }]}>
                                  {isDone
                                    ? <Feather name="check" size={10} color="#10B981" />
                                    : isActive
                                      ? <Feather name="loader" size={10} color={catColor} />
                                      : isYearLocked
                                        ? <Feather name="calendar" size={10} color="#F5A623" />
                                        : <Text style={[styles.nodeTierText, { color: isAvail ? catColor : colors.mutedForeground }]}>T{node.tier}</Text>}
                                </View>
                                {isActive && <PulseRing color={catColor} size={22} />}
                              </View>
                              <View style={{ flex: 1 }} />
                              {rarity !== "common" && (
                                <View style={[styles.rarityDot, { backgroundColor: RARITY_COLORS[rarity] + (isDone ? "55" : "CC") }]} />
                              )}
                              {node.riskLabel && !isDone && (
                                <View style={[styles.riskBadge, { marginLeft: 3 }]}>
                                  <Feather name="alert-triangle" size={9} color="#FF4D6A" />
                                </View>
                              )}
                              {node.synergyId && isDone && (
                                <View style={[styles.synergyBadge, { marginLeft: 3 }]}>
                                  <Feather name="link" size={9} color="#F5A623" />
                                </View>
                              )}
                              {isAvail && !currentResearch && (
                                <View style={{ marginLeft: 3 }}>
                                  <PulseDot color={catColor} />
                                </View>
                              )}
                            </View>

                            <Text style={[styles.nodeName, {
                              color: isDone ? "#10B981CC" : isActive ? catColor : isYearLocked ? "#F5A623" : isAvail ? colors.foreground : colors.mutedForeground,
                            }]} numberOfLines={2}>{node.name}</Text>

                            {node.effectLabel ? (
                              <Text
                                style={[styles.nodeEffect, {
                                  color: isDone ? "#10B98155" : isActive ? catColor + "99" : isAvail ? catColor + "BB" : colors.mutedForeground + "66",
                                  marginTop: 4,
                                }]}
                                numberOfLines={2}
                              >
                                {node.effectLabel}
                              </Text>
                            ) : null}

                            {/* Footer */}
                            <View style={[styles.nodeFooter, { borderTopColor: (isDone ? "#10B981" : isActive ? catColor : colors.border) + "33" }]}>
                              {isYearLocked ? (
                                <View>
                                  <View style={styles.yearLockRow}>
                                    <Feather name="calendar" size={9} color="#F5A623" />
                                    <Text style={styles.yearLockText} numberOfLines={1}>Disponível em {minYear}</Text>
                                  </View>
                                  {((minYear ?? 0) - currentYear) > 0 && (
                                    <Text style={styles.yearLockSubText}>
                                      Faltam {(minYear ?? 0) - currentYear} {(minYear ?? 0) - currentYear === 1 ? "ano" : "anos"}
                                    </Text>
                                  )}
                                </View>
                              ) : isDone ? (
                                <View style={styles.doneRow}>
                                  <Feather name="check-circle" size={9} color="#10B981" />
                                  <Text style={[styles.nodeCost, { color: "#10B981" }]}>Aplicado</Text>
                                </View>
                              ) : isActive ? (
                                <View style={styles.yearLockRow}>
                                  <Feather name="loader" size={9} color={catColor} />
                                  <Text style={[styles.nodeCost, { color: catColor }]}>{Math.round(state.researchMonthsLeft ?? 0)}m restantes</Text>
                                </View>
                              ) : isLocked ? (
                                <View style={styles.yearLockRow}>
                                  <Feather name="lock" size={9} color={colors.mutedForeground} />
                                  <Text style={[styles.nodeCost, { color: colors.mutedForeground }]} numberOfLines={1}>
                                    Requer: {getNodeById(node.requires.find(r => !researchedNodes.includes(r)) ?? "")?.name ?? "nó anterior"}
                                  </Text>
                                </View>
                              ) : status === "no_money" ? (
                                <View style={styles.yearLockRow}>
                                  <Feather name="dollar-sign" size={9} color="#FF4D6A" />
                                  <Text style={[styles.nodeCost, { color: "#FF4D6A" }]} numberOfLines={1}>Sem fundos · {formatMoney(node.cost)}</Text>
                                </View>
                              ) : (
                                <View style={styles.yearLockRow}>
                                  <Feather name="circle" size={9} color={catColor} />
                                  <Text style={[styles.nodeCost, { color: catColor }]}>
                                    {formatMoney(node.cost)} · {node.timeMonths}m
                                  </Text>
                                </View>
                              )}
                            </View>
                          </TouchableOpacity>
                        </React.Fragment>
                      );
                    })}
                  </View>
                );
              })}
            </View>

            {/* ── Special Research Projects ─────────────────────────────── */}
            {(availableCombos.length > 0 || unlockedCombos.length > 0 || activeCombos.length > 0) && (
              <View style={styles.comboSection}>
                {/* Section header with premium feel */}
                <View style={[styles.comboSectionHeaderCard, { borderColor: "#A855F733", overflow: "hidden" }]}>
                  <LinearGradient
                    colors={["#A855F715", "#F5A62308", "transparent"]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.comboSectionHeader}>
                    <View style={styles.comboSectionIcon}>
                      <LinearGradient colors={["#A855F7", "#F5A623"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, { borderRadius: 9 }]} />
                      <Feather name="layers" size={14} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.comboSectionLabel, { color: "#A855F7" }]}>PROJETOS ESPECIAIS</Text>
                      <Text style={[styles.comboSectionTitle, { color: colors.foreground }]}>Pesquisa Avançada</Text>
                    </View>
                    {availableCombos.length > 0 && (
                      <View style={[styles.comboSectionBadge, { backgroundColor: "#A855F7" }]}>
                        <PulseDot color="#fff" />
                        <Text style={styles.comboSectionBadgeText}>{availableCombos.length} disponível</Text>
                      </View>
                    )}
                    {unlockedCombos.length > 0 && (
                      <View style={[styles.comboSectionBadge, { backgroundColor: "#10B98188" }]}>
                        <Text style={styles.comboSectionBadgeText}>{unlockedCombos.length} ativo</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.comboSectionDesc, { color: colors.mutedForeground }]}>
                    Projetos de alta complexidade que combinam múltiplas áreas de pesquisa para desbloquear sinergias exclusivas.
                  </Text>
                </View>

                {[...activeCombos, ...availableCombos, ...unlockedCombos].map((combo) => {
                  const isDone = researchedNodes.includes(combo.id);
                  const isActive = currentResearch === combo.id;
                  const isAvail = !isDone && !isActive;
                  const canStart = isAvail && !currentResearch && (state.money ?? 0) >= combo.baseCost;
                  const comboTime = getComboTime(combo);
                  const nodeCount = combo.requires.length;
                  const accentColor = isDone ? "#10B981" : combo.color;
                  return (
                    <View key={combo.id} style={[styles.comboCard, {
                      overflow: "hidden",
                      borderColor: isDone ? "#10B98133" : isActive ? combo.color + "88" : combo.color + "44",
                      shadowColor: isActive ? combo.color : isDone ? "#10B981" : combo.color,
                      shadowOpacity: isActive ? 0.25 : 0.08,
                      shadowRadius: isActive ? 10 : 4,
                      shadowOffset: { width: 0, height: 3 },
                      elevation: isActive ? 5 : 2,
                    }]}>
                      {/* Multi-layer gradient background */}
                      <LinearGradient
                        colors={isDone
                          ? ["#10B98112", "#10B98106", "transparent"]
                          : isActive
                            ? [combo.color + "20", combo.color + "08", "transparent"]
                            : [combo.color + "15", combo.color + "05", "transparent"]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                      />
                      {isActive && <ActiveShimmer color={combo.color} />}
                      {/* Gold/purple gradient border simulation (top bar) */}
                      <LinearGradient
                        colors={isDone ? ["#10B981", "#34D399"] : [combo.color, "#F5A623"]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={styles.comboTopBar}
                      />
                      {/* Content */}
                      <View style={styles.comboCardInner}>
                        {/* Project label */}
                        <View style={styles.comboProjectLabelRow}>
                          <View style={[styles.comboProjectTag, { backgroundColor: isDone ? "#10B98122" : combo.color + "20", borderColor: isDone ? "#10B98144" : combo.color + "44" }]}>
                            <Feather name="layers" size={9} color={accentColor} />
                            <Text style={[styles.comboProjectTagText, { color: accentColor }]}>PROJETO ESPECIAL</Text>
                          </View>
                          {isDone && (
                            <View style={[styles.comboStatusBadge, { backgroundColor: "#10B98122", borderColor: "#10B98144" }]}>
                              <Feather name="check-circle" size={13} color="#10B981" />
                              <Text style={[styles.comboStatusText, { color: "#10B981" }]}>Sinergia Ativa</Text>
                            </View>
                          )}
                          {isActive && (
                            <View style={[styles.comboStatusBadge, { backgroundColor: combo.color + "22", borderColor: combo.color + "44" }]}>
                              <Feather name="loader" size={13} color={combo.color} />
                              <Text style={[styles.comboStatusText, { color: combo.color }]}>Em Pesquisa</Text>
                            </View>
                          )}
                        </View>

                        {/* Header */}
                        <View style={styles.comboCardHeader}>
                          <View style={[styles.comboCardIcon, { backgroundColor: isDone ? "#10B98125" : combo.color + "25" }]}>
                            {isActive && <PulseRing color={combo.color} size={42} />}
                            <Feather name={combo.icon as any} size={20} color={isDone ? "#10B981" : combo.color} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.comboCardName, { color: isDone ? "#10B981" : isActive ? combo.color : colors.foreground }]}>
                              {combo.name}
                            </Text>
                            <Text style={[styles.comboCardDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                              {combo.description}
                            </Text>
                          </View>
                        </View>

                        {/* Effect box with gradient */}
                        <View style={[styles.comboEffectBox, { borderColor: accentColor + "44", overflow: "hidden" }]}>
                          <LinearGradient
                            colors={[accentColor + "18", accentColor + "06"]}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={StyleSheet.absoluteFill}
                          />
                          <Feather name="zap" size={12} color={accentColor} />
                          <Text style={[styles.comboEffectText, { color: accentColor }]}>{combo.effectLabel}</Text>
                        </View>

                        {/* Required nodes with visual fusion indicator */}
                        <View style={styles.comboReqSection}>
                          <View style={styles.comboReqHeader}>
                            <Feather name="git-merge" size={10} color={colors.mutedForeground} />
                            <Text style={[styles.comboReqLabel, { color: colors.mutedForeground }]}>Tecnologias base necessárias:</Text>
                          </View>
                          <View style={styles.comboReqChips}>
                            {combo.requires.map((reqId, rIdx) => {
                              const reqNode = getNodeById(reqId);
                              const reqDone = researchedNodes.includes(reqId);
                              return (
                                <React.Fragment key={reqId}>
                                  <View style={[styles.comboReqChip, {
                                    backgroundColor: reqDone ? "#10B98120" : colors.secondary,
                                    borderColor: reqDone ? "#10B98166" : colors.border,
                                  }]}>
                                    <Feather name={reqDone ? "check-circle" : "circle"} size={9} color={reqDone ? "#10B981" : colors.mutedForeground} />
                                    <Text style={[styles.comboReqChipText, { color: reqDone ? "#10B981" : colors.mutedForeground }]} numberOfLines={1}>
                                      {reqNode?.name ?? reqId}
                                    </Text>
                                  </View>
                                  {rIdx < combo.requires.length - 1 && (
                                    <Feather name="plus" size={8} color={colors.mutedForeground + "66"} />
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </View>
                        </View>

                        {/* Footer: time multiplier + cost + action */}
                        <View style={[styles.comboFooter, { borderTopColor: accentColor + "22" }]}>
                          <View style={styles.comboFooterLeft}>
                            <View style={[styles.comboTimeBadge, { backgroundColor: accentColor + "15", borderColor: accentColor + "33" }]}>
                              <Feather name="clock" size={10} color={accentColor} />
                              <Text style={[styles.comboTimeBadgeText, { color: accentColor }]}>
                                {comboTime}m · {nodeCount}× esforço
                              </Text>
                            </View>
                            {!isDone && !isActive && (
                              <Text style={[styles.comboCost, { color: (state.money ?? 0) >= combo.baseCost ? accentColor : "#FF4D6A" }]}>
                                {formatMoney(combo.baseCost)}
                              </Text>
                            )}
                            {isActive && (
                              <Text style={[styles.comboCost, { color: combo.color }]}>
                                {Math.round(state.researchMonthsLeft ?? 0)}m restantes
                              </Text>
                            )}
                          </View>
                          {!isDone && !isActive && (
                            <TouchableOpacity
                              onPress={() => {
                                const err = startResearch(combo.id);
                                if (err) Alert.alert("Não é possível pesquisar", err);
                              }}
                              disabled={!canStart}
                              style={[styles.comboStartBtn, { opacity: canStart ? 1 : 0.4, overflow: "hidden" }]}
                              activeOpacity={0.85}
                            >
                              {canStart && (
                                <LinearGradient
                                  colors={[combo.color, combo.color + "CC"]}
                                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                  style={StyleSheet.absoluteFill}
                                />
                              )}
                              {!canStart && <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.secondary }]} />}
                              <Feather name="play" size={11} color={canStart ? "#fff" : colors.mutedForeground} />
                              <Text style={[styles.comboStartBtnText, { color: canStart ? "#fff" : colors.mutedForeground }]}>Iniciar Projeto</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })}

                {/* Locked combos row */}
                {lockedCombos.length > 0 && (
                  <View style={[styles.comboLockedRow, { borderColor: colors.border, backgroundColor: colors.secondary + "44" }]}>
                    <Feather name="lock" size={11} color={colors.mutedForeground} />
                    <Text style={[styles.comboLockedText, { color: colors.mutedForeground }]}>
                      +{lockedCombos.length} projeto{lockedCombos.length > 1 ? "s" : ""} bloqueado{lockedCombos.length > 1 ? "s" : ""} — conclua as tecnologias base para desbloquear
                    </Text>
                  </View>
                )}
              </View>
            )}
              </ScrollView>
            </View>
          </View>
        </>
      )}

      {/* ── EXCLUSIVOS TAB ──────────────────────────────────────────────────── */}
      {mainTab === "exclusivos" && (
        <ScrollView contentContainerStyle={[styles.exclScroll, { paddingBottom: botPad + 24 }]} showsVerticalScrollIndicator={false}>
          {/* Unlocked exclusive header */}
          {unlockedExcl.length > 0 && (
            <CollapsibleSection
              title={`Tecnologias Desbloqueadas (${unlockedExcl.length})`}
              accent="#10B981"
              badge={`${unlockedExcl.length}`}
              badgeColor="#10B981"
              defaultOpen={false}
            >
              {unlockedExcl.map(tech => (
                <ExclCard key={tech.id} tech={tech} status="unlocked" onPress={() => setExclPreview(tech)} specScores={specScores} state={state} />
              ))}
            </CollapsibleSection>
          )}

          {/* Available exclusive banner */}
          {availableExcl.length > 0 && !currentResearch && (
            <View style={[styles.exclAvailBanner, { backgroundColor: "#A855F722", borderColor: "#A855F744" }]}>
              <Feather name="star" size={14} color="#A855F7" />
              <Text style={[styles.exclAvailText, { color: "#A855F7" }]}>
                {availableExcl.length} tecnologia{availableExcl.length > 1 ? "s" : ""} exclusiva{availableExcl.length > 1 ? "s" : ""} disponível{availableExcl.length > 1 ? "eis" : ""}!
              </Text>
            </View>
          )}

          {/* Rare section */}
          {(() => {
            const rareTechs = EXCLUSIVE_TECHS.filter(e => e.rarity === "rare");
            const rareAvail = rareTechs.filter(t => {
              const isUnlocked = researchedNodes.includes(t.id);
              const isResearching = currentResearch === t.id;
              return !isUnlocked && !isResearching && checkExclusiveAvailable(t, currentYear, state.reputation ?? 0, state.money, researchedNodes, specScores);
            }).length;
            return (
              <CollapsibleSection
                title="Tecnologias Raras"
                accent="#A855F7"
                badge={rareAvail > 0 ? `${rareAvail} disponível` : undefined}
                badgeColor="#A855F7"
              >
                <View style={styles.exclGrid}>
                  {rareTechs.map(tech => {
                    const isUnlocked = researchedNodes.includes(tech.id);
                    const isResearching = currentResearch === tech.id;
                    const isAvailable = !isUnlocked && !isResearching && checkExclusiveAvailable(tech, currentYear, state.reputation ?? 0, state.money, researchedNodes, specScores);
                    const status = isUnlocked ? "unlocked" : isResearching ? "active" : isAvailable ? "available" : "locked";
                    return <ExclCard key={tech.id} tech={tech} status={status} onPress={() => setExclPreview(tech)} specScores={specScores} state={state} />;
                  })}
                </View>
              </CollapsibleSection>
            );
          })()}

          {(() => {
            const legendaryTechs = EXCLUSIVE_TECHS.filter(e => e.rarity === "legendary");
            const legendAvail = legendaryTechs.filter(t => {
              const isUnlocked = researchedNodes.includes(t.id);
              const isResearching = currentResearch === t.id;
              return !isUnlocked && !isResearching && checkExclusiveAvailable(t, currentYear, state.reputation ?? 0, state.money, researchedNodes, specScores);
            }).length;
            return (
              <CollapsibleSection
                title="Tecnologias Lendárias"
                accent="#F5A623"
                badge={legendAvail > 0 ? `${legendAvail} disponível` : undefined}
                badgeColor="#F5A623"
              >
                <View style={styles.exclGrid}>
                  {legendaryTechs.map(tech => {
                    const isUnlocked = researchedNodes.includes(tech.id);
                    const isResearching = currentResearch === tech.id;
                    const isAvailable = !isUnlocked && !isResearching && checkExclusiveAvailable(tech, currentYear, state.reputation ?? 0, state.money, researchedNodes, specScores);
                    const status = isUnlocked ? "unlocked" : isResearching ? "active" : isAvailable ? "available" : "locked";
                    return <ExclCard key={tech.id} tech={tech} status={status} onPress={() => setExclPreview(tech)} specScores={specScores} state={state} />;
                  })}
                </View>
              </CollapsibleSection>
            );
          })()}
        </ScrollView>
      )}

      {/* ── MELHORIAS TAB ───────────────────────────────────────────────────── */}
      {mainTab === "upgrades" && (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bonusBar} contentContainerStyle={styles.bonusBarContent}>
            {eraBonuses.ratingBonus > 0 && <BonusChip icon="star" label={`+${eraBonuses.ratingBonus.toFixed(1)} Rating`} color="#F5A623" />}
            {eraBonuses.salesMult > 1 && <BonusChip icon="trending-up" label={`+${Math.round((eraBonuses.salesMult - 1) * 100)}% Vendas`} color="#10B981" />}
            {eraBonuses.costMult < 1 && <BonusChip icon="dollar-sign" label={`-${Math.round((1 - eraBonuses.costMult) * 100)}% Custo`} color="#4DA6FF" />}
            {eraBonuses.campaignMult > 1 && <BonusChip icon="volume-2" label={`+${Math.round((eraBonuses.campaignMult - 1) * 100)}% Mkt`} color="#A855F7" />}
            {eraBonuses.gameRevMult > 1 && <BonusChip icon="play-circle" label={`+${Math.round((eraBonuses.gameRevMult - 1) * 100)}% Jogos`} color="#FF4D6A" />}
            {eraUnlocked.length === 0 && <Text style={[styles.noBonusText, { color: colors.mutedForeground }]}>Desbloqueie melhorias para ganhar bônus extras</Text>}
          </ScrollView>

          {totalEraPath > 0 && (
            <View style={[styles.pathProgressCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.pathProgressTitle, { color: colors.foreground }]}>Caminho Estratégico</Text>
              <View style={styles.pathBars}>
                {(["tech", "marketing", "production"] as const).map((p) => {
                  const pct = totalEraPath > 0 ? pathProgress[p] / totalEraPath : 0;
                  const col = p === "tech" ? "#4DA6FF" : p === "marketing" ? "#F5A623" : "#10B981";
                  const label = p === "tech" ? "Tecnologia" : p === "marketing" ? "Marketing" : "Produção";
                  return (
                    <View key={p} style={styles.pathBarItem}>
                      <Text style={[styles.pathBarLabel, { color: col }]}>{label}</Text>
                      <View style={[styles.pathBarBg, { backgroundColor: colors.secondary }]}>
                        <View style={[styles.pathBarFill, { backgroundColor: col, width: `${Math.round(pct * 100)}%` as any }]} />
                      </View>
                      <Text style={[styles.pathBarCount, { color: colors.mutedForeground }]}>{pathProgress[p]}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs} contentContainerStyle={styles.tabsContent}>
            {ERA_IDS.map((era) => {
              const isSelected = selectedEra === era;
              const isCurrent = era === currentEraNum;
              const eraUpgrades = ERA_UPGRADES.filter((u) => u.era === era);
              const unlockedCount = eraUpgrades.filter((u) => eraUnlocked.includes(u.id)).length;
              const availCount = eraUpgrades.filter((u) => eraAvailable.includes(u.id) && !eraUnlocked.includes(u.id) && currentYear >= u.minYear).length;
              const isLocked = currentYear < ERA_YEAR_MAP[era];
              return (
                <TouchableOpacity key={era} onPress={() => setSelectedEra(era)} style={[styles.eraTab, {
                  backgroundColor: isSelected ? "#F5A62322" : colors.secondary,
                  borderColor: isSelected ? "#F5A623" : isCurrent ? "#F5A62344" : colors.border,
                  opacity: isLocked ? 0.45 : 1,
                }]} activeOpacity={0.8}>
                  {isCurrent && <View style={styles.eraCurrentDot} />}
                  <Text style={[styles.eraTabNum, { color: isSelected ? "#F5A623" : colors.mutedForeground }]}>Era {era}</Text>
                  <Text style={[styles.eraTabName, { color: isSelected ? "#F5A623" : colors.foreground }]} numberOfLines={1}>{ERA_NAMES[era]}</Text>
                  {unlockedCount > 0 && <View style={[styles.eraTabBadge, { backgroundColor: "#10B981" }]}><Text style={styles.eraTabBadgeText}>{unlockedCount}</Text></View>}
                  {availCount > 0 && unlockedCount === 0 && <View style={[styles.eraTabBadge, { backgroundColor: "#F5A623" }]}><Text style={styles.eraTabBadgeText}>{availCount}</Text></View>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={[styles.eraBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.eraBannerName, { color: "#F5A623" }]}>{ERA_NAMES[selectedEra]}</Text>
            <Text style={[styles.eraBannerYear, { color: colors.mutedForeground }]}>
              A partir de {ERA_YEAR_MAP[selectedEra]}
              {currentYear < ERA_YEAR_MAP[selectedEra] ? ` · ${ERA_YEAR_MAP[selectedEra] - currentYear} anos para desbloquear` : " · Era atual ou passada"}
            </Text>
          </View>

          <ScrollView contentContainerStyle={[styles.upgradeScroll, { paddingBottom: botPad + 24 }]} showsVerticalScrollIndicator={false}>
            <View style={styles.upgradeGrid}>
              {ERA_UPGRADE_CATEGORY_LIST.map((cat) => {
                const upgrade = ERA_UPGRADES.find((u) => u.era === selectedEra && u.category === cat);
                if (!upgrade) return null;
                const status = getEraUpgradeStatus(upgrade);
                const col = ERA_CATEGORY_COLORS[cat];
                const isUnlocked = status === "unlocked";
                const isAvailable = status === "available";
                const isYearLocked = status === "year_locked";
                return (
                  <TouchableOpacity key={upgrade.id} onPress={() => {
                    if (isYearLocked) { Alert.alert("Bloqueado", `"${upgrade.name}" requer ${upgrade.minYear}.`); return; }
                    if (status !== "locked") setUpgradePreview(upgrade);
                  }} activeOpacity={isUnlocked || status === "locked" ? 1 : 0.8} style={[styles.upgradeCard, {
                    backgroundColor: isUnlocked ? "#10B98114" : isAvailable ? col + "12" : colors.card,
                    borderColor: isUnlocked ? "#10B981" : isAvailable ? col + "88" : isYearLocked ? "#F5A62344" : colors.border,
                    borderWidth: isUnlocked || isAvailable ? 1.5 : 1,
                    opacity: status === "locked" ? 0.4 : 1,
                  }]}>
                    <View style={styles.upgradeCardTop}>
                      <View style={[styles.upgradeCatIcon, { backgroundColor: col + "22" }]}>
                        <Feather name={ERA_CATEGORY_ICONS[cat] as any} size={14} color={col} />
                      </View>
                      {isUnlocked ? <View style={[styles.upgradeStatusBadge, { backgroundColor: "#10B98122" }]}><Feather name="check-circle" size={12} color="#10B981" /></View>
                        : isAvailable ? <View style={[styles.upgradeStatusBadge, { backgroundColor: col + "22" }]}><Feather name="unlock" size={12} color={col} /></View>
                        : isYearLocked ? <View style={[styles.upgradeStatusBadge, { backgroundColor: "#F5A62322" }]}><Feather name="calendar" size={12} color="#F5A623" /></View>
                        : <View style={[styles.upgradeStatusBadge, { backgroundColor: colors.secondary }]}><Feather name="lock" size={12} color={colors.mutedForeground} /></View>}
                    </View>
                    <Text style={[styles.upgradeCatLabel, { color: isUnlocked ? "#10B981" : col }]}>{ERA_CATEGORY_NAMES[cat]}</Text>
                    <Text style={[styles.upgradeName, { color: isUnlocked ? "#10B981" : isAvailable ? colors.foreground : colors.mutedForeground }]} numberOfLines={2}>{upgrade.name}</Text>
                    {isAvailable && <Text style={[styles.upgradeCost, { color: col, marginTop: 6 }]}>{formatMoney(upgrade.cost)}</Text>}
                    {isYearLocked && <Text style={[styles.upgradeCost, { color: "#F5A623" }]}>Em {upgrade.minYear}</Text>}
                    {isUnlocked && <Text style={[styles.upgradeUnlockedLabel, { color: "#10B981" }]}>✓ Ativo</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </>
      )}

      {/* ── IDENTIDADE TAB ──────────────────────────────────────────────────── */}
      {mainTab === "identity" && (
        <IdentityTab scores={specScores} researchedCount={researchedNodes.length} />
      )}

      {/* ── Research Node Preview Modal ───────────────────────────────────── */}
      {preview && mainTab === "research" && (
        <Modal visible transparent animationType="fade" statusBarTranslucent>
          <Pressable style={styles.overlay} onPress={() => setPreview(null)}>
            <Pressable style={[styles.previewSheet, { backgroundColor: colors.card, borderColor: CATEGORY_COLORS[preview.category] + "66" }]}>
              <LinearGradient colors={[CATEGORY_COLORS[preview.category] + "15", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
              <View style={styles.previewHeader}>
                <View style={[styles.previewIcon, { backgroundColor: CATEGORY_COLORS[preview.category] + "22" }]}>
                  <Feather name={CATEGORY_ICONS[preview.category] as any} size={22} color={CATEGORY_COLORS[preview.category]} />
                </View>
                <View style={styles.previewMeta}>
                  <View style={styles.previewMetaRow}>
                    <Text numberOfLines={1} style={[styles.previewTier, { color: CATEGORY_COLORS[preview.category] }]}>
                      {CATEGORY_NAMES[preview.category] || "Pesquisa"} · {preview.pathName || "Caminho"} · T{preview.tier}
                    </Text>
                    <RarityBadge rarity={getNodeRarity(preview.tier)} />
                  </View>
                  <Text numberOfLines={2} style={[styles.previewName, { color: colors.foreground }]}>{preview.name || CATEGORY_NAMES[preview.category] || "Tecnologia"}</Text>
                </View>
              </View>
              <Text style={[styles.previewDesc, { color: colors.mutedForeground }]}>{preview.description || "Melhoria estratégica para o seu negócio."}</Text>
              <View style={[styles.effectBox, { backgroundColor: CATEGORY_COLORS[preview.category] + "10", borderColor: CATEGORY_COLORS[preview.category] + "33" }]}>
                <Feather name="zap" size={13} color={CATEGORY_COLORS[preview.category]} />
                <Text style={[styles.effectText, { color: CATEGORY_COLORS[preview.category] }]}>{preview.effectLabel}</Text>
              </View>
              {preview.riskLabel && (
                <View style={[styles.riskBox, { backgroundColor: "#FF4D6A11", borderColor: "#FF4D6A33" }]}>
                  <Feather name="alert-triangle" size={13} color="#FF4D6A" />
                  <Text style={[styles.riskText, { color: "#FF4D6A" }]}>{preview.riskLabel}</Text>
                </View>
              )}
              {preview.synergyId && (
                <View style={[styles.synergyBox, { backgroundColor: "#F5A62311", borderColor: "#F5A62333" }]}>
                  <Feather name="link" size={13} color="#F5A623" />
                  <Text style={[styles.synergyText, { color: "#F5A623" }]}>{preview.synergyLabel}</Text>
                </View>
              )}
              <View style={styles.previewFooter}>
                <View>
                  <Text style={[styles.previewCost, { color: CATEGORY_COLORS[preview.category] }]}>{formatMoney(preview.cost)}</Text>
                  <Text style={[styles.previewTime, { color: colors.mutedForeground }]}>{preview.timeMonths} meses</Text>
                </View>
                {(() => {
                  const status = getNodeStatus(preview);
                  if (status === "done") return <View style={styles.doneTag}><Feather name="check-circle" size={14} color="#10B981" /><Text style={styles.doneTagText}>Concluído</Text></View>;
                  if (status === "active") return <View style={[styles.activeTag, { backgroundColor: CATEGORY_COLORS[preview.category] + "22" }]}><Feather name="loader" size={14} color={CATEGORY_COLORS[preview.category]} /><Text style={[styles.activeTagText, { color: CATEGORY_COLORS[preview.category] }]}>Em andamento</Text></View>;
                  const canStart = status === "available" && !state.currentResearch;
                  return (
                    <TouchableOpacity onPress={() => handleResearch(preview.id)} disabled={!canStart} style={[styles.startBtn, { backgroundColor: CATEGORY_COLORS[preview.category], opacity: canStart ? 1 : 0.4 }]} activeOpacity={0.85}>
                      <Feather name="play" size={14} color="#fff" />
                      <Text style={styles.startBtnText}>Iniciar</Text>
                    </TouchableOpacity>
                  );
                })()}
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* ── Exclusive Tech Preview Modal ──────────────────────────────────── */}
      {exclPreview && (
        <Modal visible transparent animationType="fade" statusBarTranslucent>
          <Pressable style={styles.overlay} onPress={() => setExclPreview(null)}>
            <Pressable style={[styles.previewSheet, { backgroundColor: colors.card, borderColor: exclPreview.color + "66" }]}>
              <LinearGradient colors={[exclPreview.color + "18", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
              <View style={styles.previewHeader}>
                <View style={[styles.previewIcon, { backgroundColor: exclPreview.color + "22" }]}>
                  <Feather name={exclPreview.icon as any} size={22} color={exclPreview.color} />
                </View>
                <View style={styles.previewMeta}>
                  <View style={[styles.exclRarityBadge, {
                    backgroundColor: exclPreview.rarity === "legendary" ? "#F5A62322" : "#A855F722",
                    borderColor: exclPreview.rarity === "legendary" ? "#F5A62355" : "#A855F755",
                  }]}>
                    <Feather name="star" size={10} color={exclPreview.rarity === "legendary" ? "#F5A623" : "#A855F7"} />
                    <Text style={[styles.exclRarityText, { color: exclPreview.rarity === "legendary" ? "#F5A623" : "#A855F7" }]}>
                      {exclPreview.rarity === "legendary" ? "Lendária" : "Rara"}
                    </Text>
                  </View>
                  <Text style={[styles.previewName, { color: colors.foreground }]}>{exclPreview.name}</Text>
                </View>
              </View>
              <Text style={[styles.previewDesc, { color: colors.mutedForeground }]}>{exclPreview.description}</Text>
              <View style={[styles.effectBox, { backgroundColor: exclPreview.color + "10", borderColor: exclPreview.color + "33" }]}>
                <Feather name="zap" size={13} color={exclPreview.color} />
                <Text style={[styles.effectText, { color: exclPreview.color }]}>{exclPreview.effectLabel}</Text>
              </View>
              {exclPreview.tradeOffLabel && (
                <View style={[styles.riskBox, { backgroundColor: "#FF4D6A11", borderColor: "#FF4D6A33" }]}>
                  <Feather name="alert-triangle" size={13} color="#FF4D6A" />
                  <Text style={[styles.riskText, { color: "#FF4D6A" }]}>{exclPreview.tradeOffLabel}</Text>
                </View>
              )}
              <View style={[styles.conditionBox, { backgroundColor: exclPreview.color + "08", borderColor: exclPreview.color + "33" }]}>
                <Feather name="lock" size={12} color={exclPreview.color} />
                <Text style={[styles.conditionText, { color: colors.mutedForeground }]}>
                  Condições: {exclPreview.conditions.conditionLabel}
                </Text>
              </View>
              <View style={styles.previewFooter}>
                <View>
                  <Text style={[styles.previewCost, { color: exclPreview.color }]}>{formatMoney(exclPreview.cost)}</Text>
                  <Text style={[styles.previewTime, { color: colors.mutedForeground }]}>{exclPreview.timeMonths} meses</Text>
                </View>
                {(() => {
                  const isUnlocked = researchedNodes.includes(exclPreview.id);
                  const isActive = currentResearch === exclPreview.id;
                  if (isUnlocked) return <View style={styles.doneTag}><Feather name="check-circle" size={14} color="#10B981" /><Text style={styles.doneTagText}>Desbloqueado</Text></View>;
                  if (isActive) return <View style={[styles.activeTag, { backgroundColor: exclPreview.color + "22" }]}><Feather name="loader" size={14} color={exclPreview.color} /><Text style={[styles.activeTagText, { color: exclPreview.color }]}>Em andamento</Text></View>;
                  const isAvail = checkExclusiveAvailable(exclPreview, currentYear, state.reputation ?? 0, state.money, researchedNodes, specScores);
                  const canStart = isAvail && !state.currentResearch && state.money >= exclPreview.cost;
                  return (
                    <TouchableOpacity onPress={() => handleResearch(exclPreview.id)} disabled={!canStart} style={[styles.startBtn, { backgroundColor: exclPreview.color, opacity: canStart ? 1 : 0.4 }]} activeOpacity={0.85}>
                      <Feather name="play" size={14} color="#fff" />
                      <Text style={styles.startBtnText}>Iniciar</Text>
                    </TouchableOpacity>
                  );
                })()}
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* ── Era Upgrade Preview Modal ─────────────────────────────────────── */}
      {upgradePreview && mainTab === "upgrades" && (
        <Modal visible transparent animationType="fade" statusBarTranslucent>
          <Pressable style={styles.overlay} onPress={() => setUpgradePreview(null)}>
            <Pressable style={[styles.previewSheet, { backgroundColor: colors.card, borderColor: ERA_CATEGORY_COLORS[upgradePreview.category] + "66" }]}>
              <LinearGradient colors={[ERA_CATEGORY_COLORS[upgradePreview.category] + "15", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
              <View style={styles.previewHeader}>
                <View style={[styles.previewIcon, { backgroundColor: ERA_CATEGORY_COLORS[upgradePreview.category] + "22" }]}>
                  <Feather name={ERA_CATEGORY_ICONS[upgradePreview.category] as any} size={22} color={ERA_CATEGORY_COLORS[upgradePreview.category]} />
                </View>
                <View style={styles.previewMeta}>
                  <Text style={[styles.previewTier, { color: ERA_CATEGORY_COLORS[upgradePreview.category] }]}>
                    {ERA_NAMES[upgradePreview.era]} · {ERA_CATEGORY_NAMES[upgradePreview.category]}
                  </Text>
                  <Text style={[styles.previewName, { color: colors.foreground }]}>{upgradePreview.name}</Text>
                </View>
              </View>
              <Text style={[styles.previewDesc, { color: colors.mutedForeground }]}>{upgradePreview.description}</Text>
              <View style={[styles.effectBox, { backgroundColor: ERA_CATEGORY_COLORS[upgradePreview.category] + "10", borderColor: ERA_CATEGORY_COLORS[upgradePreview.category] + "33" }]}>
                <Feather name="zap" size={13} color={ERA_CATEGORY_COLORS[upgradePreview.category]} />
                <Text style={[styles.effectText, { color: ERA_CATEGORY_COLORS[upgradePreview.category] }]}>{upgradePreview.effectLabel}</Text>
              </View>
              <View style={styles.previewFooter}>
                <View>
                  <Text style={[styles.previewCost, { color: ERA_CATEGORY_COLORS[upgradePreview.category] }]}>{formatMoney(upgradePreview.cost)}</Text>
                  <Text style={[styles.previewTime, { color: colors.mutedForeground }]}>Permanente</Text>
                </View>
                {(() => {
                  const status = getEraUpgradeStatus(upgradePreview);
                  if (status === "unlocked") return <View style={styles.doneTag}><Feather name="check-circle" size={14} color="#10B981" /><Text style={styles.doneTagText}>Ativo</Text></View>;
                  const canUnlock = status === "available" && state.money >= upgradePreview.cost;
                  return (
                    <TouchableOpacity onPress={() => handleUnlockEra(upgradePreview)} disabled={!canUnlock} style={[styles.startBtn, { backgroundColor: ERA_CATEGORY_COLORS[upgradePreview.category], opacity: canUnlock ? 1 : 0.4 }]} activeOpacity={0.85}>
                      <Feather name="unlock" size={14} color="#fff" />
                      <Text style={styles.startBtnText}>Desbloquear</Text>
                    </TouchableOpacity>
                  );
                })()}
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

// ── Exclusive Tech Card ───────────────────────────────────────────────────────
function ExclCard({
  tech, status, onPress, specScores, state,
}: {
  tech: ExclusiveTech;
  status: "unlocked" | "active" | "available" | "locked";
  onPress: () => void;
  specScores: SpecScores;
  state: any;
}) {
  const colors = useColors();
  const isUnlocked = status === "unlocked";
  const isActive = status === "active";
  const isAvail = status === "available";
  const isLegendary = tech.rarity === "legendary";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[exclCardStyles.card, {
        backgroundColor: isUnlocked ? "#10B98110" : isAvail ? tech.color + "14" : colors.card,
        borderColor: isUnlocked ? "#10B981" : isAvail ? tech.color + "99" : isLegendary && !isAvail ? "#F5A62333" : colors.border,
        borderWidth: isUnlocked || isAvail ? 1.5 : 1,
        opacity: status === "locked" ? 0.55 : 1,
      }]}
    >
      <View style={exclCardStyles.top}>
        <View style={[exclCardStyles.icon, { backgroundColor: tech.color + "20" }]}>
          <Feather name={tech.icon as any} size={18} color={isUnlocked ? "#10B981" : tech.color} />
        </View>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <View style={exclCardStyles.nameLine}>
            <Text style={[exclCardStyles.name, { color: isUnlocked ? "#10B981" : isAvail ? colors.foreground : colors.mutedForeground }]} numberOfLines={1}>
              {tech.name}
            </Text>
            {isAvail && <View style={[exclCardStyles.availDot, { backgroundColor: tech.color }]} />}
          </View>
        </View>
        <View style={[exclCardStyles.statusIcon, {
          backgroundColor: isUnlocked ? "#10B98122" : isActive ? tech.color + "22" : isAvail ? tech.color + "22" : colors.secondary,
        }]}>
          <Feather
            name={isUnlocked ? "check-circle" : isActive ? "loader" : isAvail ? "unlock" : "lock"}
            size={12}
            color={isUnlocked ? "#10B981" : isActive ? tech.color : isAvail ? tech.color : colors.mutedForeground}
          />
        </View>
      </View>
      <View style={[exclCardStyles.conditionRow, { borderTopColor: colors.border }]}>
        <Feather name="info" size={10} color={colors.mutedForeground} />
        <Text style={[exclCardStyles.condition, { color: colors.mutedForeground }]} numberOfLines={2}>
          {tech.conditions.conditionLabel}
        </Text>
        {!isUnlocked && !isActive && (
          <Text style={[exclCardStyles.cost, { color: isAvail ? tech.color : colors.mutedForeground }]}>
            {formatMoney(tech.cost)} · {tech.timeMonths}m
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
const exclCardStyles = StyleSheet.create({
  card: { borderRadius: 10, borderWidth: 1, marginBottom: 8, padding: 10 },
  top: { flexDirection: "row", alignItems: "flex-start" },
  icon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  nameLine: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { fontFamily: "Inter_600SemiBold", fontSize: 13, flex: 1 },
  availDot: { width: 6, height: 6, borderRadius: 3 },
  effect: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 },
  statusIcon: { width: 24, height: 24, borderRadius: 6, alignItems: "center", justifyContent: "center", marginLeft: 6 },
  conditionRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8, paddingTop: 7, borderTopWidth: 1 },
  condition: { fontFamily: "Inter_400Regular", fontSize: 10, flex: 1 },
  cost: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
});

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  mainTabRow: { flexDirection: "row", marginHorizontal: 12, marginTop: 10, marginBottom: 12, borderRadius: 10, borderWidth: 1, padding: 3, gap: 3, zIndex: 10 },
  mainTab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 9, borderRadius: 8, borderWidth: 1, minHeight: 46 },
  mainTabText: { fontFamily: "Inter_600SemiBold", fontSize: 12, flexShrink: 1 },
  mainTabBadge: { minWidth: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center", paddingHorizontal: 4, flexShrink: 0 },
  mainTabBadgeText: { fontFamily: "Inter_700Bold", fontSize: 10, color: "#fff" },
  activeBanner: { marginHorizontal: 12, marginBottom: 8, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9, flexDirection: "row", alignItems: "center", gap: 8, zIndex: 5 },
  activeBannerIconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  activeBannerLabel: { fontFamily: "Inter_700Bold", fontSize: 9, letterSpacing: 0.8, marginBottom: 1 },
  activeBannerText: { fontFamily: "Inter_600SemiBold", fontSize: 13, flex: 1 },
  activeBannerTimer: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, flexShrink: 0 },
  activeBannerTimerText: { fontFamily: "Inter_700Bold", fontSize: 11 },
  bonusBar: { marginBottom: 10, marginTop: 4 },
  bonusBarContent: { paddingHorizontal: 12, paddingVertical: 5, flexDirection: "row", alignItems: "center" },
  noBonusText: { fontFamily: "Inter_400Regular", fontSize: 12, fontStyle: "italic" },
  tabs: { marginBottom: 10 },
  tabsContent: { paddingHorizontal: 12, flexDirection: "row", gap: 8, paddingVertical: 6 },
  tab: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, flexShrink: 0, minHeight: 44 },
  tabIconWrap: { width: 22, height: 22, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  tabText: { fontFamily: "Inter_600SemiBold", fontSize: 12, flexShrink: 0 },
  countBadge: { minWidth: 24, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  countText: { fontFamily: "Inter_700Bold", fontSize: 9, color: "#fff" },
  scroll: { paddingHorizontal: 12 },
  researchBody: { flex: 1, flexDirection: "row", overflow: "hidden" },
  catSidebar: { width: 80, borderRightWidth: 1 },
  catSidebarInner: { paddingVertical: 4 },
  catTab: { paddingHorizontal: 8, paddingVertical: 10, alignItems: "center", gap: 4, overflow: "hidden" },
  catTabIcon: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  catTabName: { fontFamily: "Inter_600SemiBold", fontSize: 9, textAlign: "center" },
  catTabBadge: { minWidth: 30, height: 14, borderRadius: 7, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  catTabBadgeText: { fontFamily: "Inter_700Bold", fontSize: 8, color: "#fff" },
  catTabBar: { width: "70%", height: 2, borderRadius: 1, overflow: "hidden", marginTop: 1 },
  catTabBarFill: { height: "100%", borderRadius: 1 },
  catContent: { flex: 1, minWidth: 0 },
  pathLegendRow: { flexDirection: "row", gap: 8, marginBottom: 12, marginTop: 4 },
  pathLegendCell: { flex: 1, minWidth: 0, gap: 3 },
  pathLetterPill: { width: 18, height: 18, borderRadius: 5, borderWidth: 1, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  pathLetterText: { fontFamily: "Inter_700Bold", fontSize: 9 },
  pathLegendName: { fontFamily: "Inter_600SemiBold", fontSize: 10, flex: 1 },
  pathLegendProg: { fontFamily: "Inter_400Regular", fontSize: 9, marginTop: 1 },
  pathsGrid: { flexDirection: "row", gap: 8 },
  pathCol: { flex: 1, minWidth: 0, borderRadius: 12, borderWidth: 1, padding: 10 },
  connector: { alignItems: "center", paddingVertical: 4 },
  connectorLine: { width: 2, height: 12, borderRadius: 1 },
  nodeCard: { borderRadius: 11, borderWidth: 1, padding: 12, marginBottom: 8 },
  nodeTop: { flexDirection: "row", alignItems: "center", marginBottom: 7 },
  nodeTierBadge: { width: 24, height: 22, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  nodeTierText: { fontFamily: "Inter_700Bold", fontSize: 9 },
  availDot: { width: 7, height: 7, borderRadius: 3.5 },
  rarityDot: { width: 7, height: 7, borderRadius: 3.5 },
  riskBadge: { width: 19, height: 19, borderRadius: 5, alignItems: "center", justifyContent: "center", backgroundColor: "#FF4D6A22" },
  synergyBadge: { width: 19, height: 19, borderRadius: 5, alignItems: "center", justifyContent: "center", backgroundColor: "#F5A62322" },
  nodeName: { fontFamily: "Inter_700Bold", fontSize: 13, lineHeight: 17 },
  nodeEffect: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 15 },
  nodeFooter: { marginTop: 9, paddingTop: 7, borderTopWidth: 1 },
  yearLockRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  yearLockText: { fontFamily: "Inter_600SemiBold", fontSize: 9, color: "#F5A623", flexShrink: 1 },
  yearLockSubText: { fontFamily: "Inter_400Regular", fontSize: 9, color: "#F5A62388", marginTop: 2 },
  doneRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  nodeCost: { fontFamily: "Inter_500Medium", fontSize: 10, flexShrink: 1 },
  eraHeader: { flexDirection: "row", alignItems: "center", gap: 4, marginVertical: 5 },
  eraHeaderLine: { flex: 1, height: 1 },
  eraHeaderBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  eraHeaderText: { fontFamily: "Inter_600SemiBold", fontSize: 9 },
  // Exclusivos tab
  exclScroll: { paddingHorizontal: 12, paddingTop: 8 },
  exclSection: { borderRadius: 10, borderWidth: 1, padding: 10, marginBottom: 10 },
  exclSectionHeader: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 8 },
  exclSectionTitle: { fontFamily: "Inter_700Bold", fontSize: 13 },
  exclAvailBanner: { borderRadius: 8, borderWidth: 1.5, padding: 10, flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  exclAvailText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  exclRarityHeader: { fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 1.5, marginBottom: 8 },
  exclGrid: { gap: 0 },
  exclRarityBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, borderWidth: 1, alignSelf: "flex-start", marginBottom: 4 },
  exclRarityText: { fontFamily: "Inter_700Bold", fontSize: 10 },
  conditionBox: { flexDirection: "row", alignItems: "flex-start", gap: 7, borderRadius: 8, borderWidth: 1, padding: 10, marginTop: 8 },
  conditionText: { fontFamily: "Inter_400Regular", fontSize: 12, flex: 1 },
  // Upgrades tab
  pathProgressCard: { marginHorizontal: 12, borderRadius: 10, borderWidth: 1, padding: 10, marginBottom: 6 },
  pathProgressTitle: { fontFamily: "Inter_600SemiBold", fontSize: 13, marginBottom: 8 },
  pathBars: { gap: 8 },
  pathBarItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  pathBarLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, width: 80 },
  pathBarBg: { flex: 1, height: 5, borderRadius: 3, overflow: "hidden" },
  pathBarFill: { height: "100%", borderRadius: 3 },
  pathBarCount: { fontFamily: "Inter_500Medium", fontSize: 11, width: 20, textAlign: "right" },
  eraTab: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, borderWidth: 1, minWidth: 72, alignItems: "center", position: "relative" },
  eraCurrentDot: { position: "absolute", top: 4, right: 4, width: 5, height: 5, borderRadius: 2.5, backgroundColor: "#F5A623" },
  eraTabNum: { fontFamily: "Inter_400Regular", fontSize: 9 },
  eraTabName: { fontFamily: "Inter_600SemiBold", fontSize: 11, marginTop: 1 },
  eraTabBadge: { position: "absolute", top: -3, right: -3, minWidth: 14, height: 14, borderRadius: 7, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  eraTabBadgeText: { fontFamily: "Inter_700Bold", fontSize: 9, color: "#fff" },
  eraBanner: { marginHorizontal: 12, borderRadius: 10, borderWidth: 1, padding: 10, marginBottom: 6 },
  eraBannerName: { fontFamily: "Inter_700Bold", fontSize: 14, marginBottom: 2 },
  eraBannerYear: { fontFamily: "Inter_400Regular", fontSize: 12 },
  upgradeScroll: { paddingHorizontal: 12 },
  upgradeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  upgradeCard: { width: "47%", borderRadius: 10, borderWidth: 1, padding: 10 },
  upgradeCardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  upgradeCatIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  upgradeStatusBadge: { width: 26, height: 26, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  upgradeCatLabel: { fontFamily: "Inter_600SemiBold", fontSize: 10, marginBottom: 3 },
  upgradeName: { fontFamily: "Inter_700Bold", fontSize: 13, marginBottom: 0, lineHeight: 17 },
  upgradeEffect: { fontFamily: "Inter_400Regular", fontSize: 10, lineHeight: 14 },
  upgradeCost: { fontFamily: "Inter_700Bold", fontSize: 11, marginTop: 5 },
  upgradeUnlockedLabel: { fontFamily: "Inter_600SemiBold", fontSize: 11, marginTop: 5 },
  // Modal
  overlay: { flex: 1, backgroundColor: "#00000088", justifyContent: "flex-end" },
  previewSheet: { marginHorizontal: 12, marginBottom: 24, borderRadius: 16, borderWidth: 1.5, padding: 16, overflow: "hidden" },
  previewHeader: { flexDirection: "row", gap: 12, marginBottom: 10 },
  previewIcon: { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  previewMeta: { flex: 1, justifyContent: "center" },
  previewMetaRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 },
  previewTier: { fontFamily: "Inter_500Medium", fontSize: 11, marginBottom: 4 },
  previewName: { fontFamily: "Inter_700Bold", fontSize: 16, lineHeight: 20 },
  previewDesc: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 18, marginBottom: 10 },
  effectBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 8, borderWidth: 1, padding: 10, marginBottom: 6 },
  effectText: { fontFamily: "Inter_600SemiBold", fontSize: 13, flex: 1 },
  riskBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 8, borderWidth: 1, padding: 10, marginBottom: 6 },
  riskText: { fontFamily: "Inter_500Medium", fontSize: 12, flex: 1 },
  synergyBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 8, borderWidth: 1, padding: 10, marginBottom: 6 },
  synergyText: { fontFamily: "Inter_500Medium", fontSize: 12, flex: 1 },
  previewFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  previewCost: { fontFamily: "Inter_700Bold", fontSize: 16 },
  previewTime: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  doneTag: { flexDirection: "row", alignItems: "center", gap: 6 },
  doneTagText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#10B981" },
  activeTag: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  activeTagText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  startBtn: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  startBtnText: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#fff" },
  // ── Research Combos / Special Projects ───────────────────────────────────
  comboSection: { marginTop: 20, gap: 10 },
  comboSectionHeaderCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  comboSectionHeader: { flexDirection: "row", alignItems: "center", gap: 9 },
  comboSectionIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  comboSectionLabel: { fontFamily: "Inter_700Bold", fontSize: 9, letterSpacing: 1 },
  comboSectionTitle: { fontFamily: "Inter_700Bold", fontSize: 15 },
  comboSectionBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  comboSectionBadgeText: { fontFamily: "Inter_700Bold", fontSize: 10, color: "#fff" },
  comboSectionDesc: { fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 16 },
  comboCard: { borderRadius: 16, borderWidth: 1, borderColor: "transparent" },
  comboTopBar: { height: 3, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  comboCardInner: { padding: 14, gap: 12 },
  comboProjectLabelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  comboProjectTag: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  comboProjectTagText: { fontFamily: "Inter_700Bold", fontSize: 9, letterSpacing: 0.5 },
  comboCardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  comboCardIcon: { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  comboCardName: { fontFamily: "Inter_700Bold", fontSize: 14, marginBottom: 3 },
  comboCardDesc: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 },
  comboStatusBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  comboStatusText: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
  comboEffectBox: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9 },
  comboEffectText: { fontFamily: "Inter_600SemiBold", fontSize: 13, flex: 1 },
  comboReqSection: { gap: 7 },
  comboReqHeader: { flexDirection: "row", alignItems: "center", gap: 5 },
  comboReqLabel: { fontFamily: "Inter_500Medium", fontSize: 10 },
  comboReqChips: { flexDirection: "row", flexWrap: "wrap", gap: 6, alignItems: "center" },
  comboReqChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7, borderWidth: 1 },
  comboReqChipText: { fontFamily: "Inter_500Medium", fontSize: 10 },
  comboFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTopWidth: 1, gap: 8 },
  comboFooterLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1, flexWrap: "wrap" },
  comboTimeBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  comboTimeBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
  comboCost: { fontFamily: "Inter_700Bold", fontSize: 12 },
  comboStartBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  comboStartBtnText: { fontFamily: "Inter_700Bold", fontSize: 12 },
  comboLockedRow: { flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9 },
  comboLockedText: { fontFamily: "Inter_400Regular", fontSize: 11, flex: 1, fontStyle: "italic" },
});
