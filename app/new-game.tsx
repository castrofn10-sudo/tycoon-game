import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useGame } from "@/context/GameContext";
import { useGameplay } from "@/context/GameplayContext";
import { GridBackground } from "@/components/GridBackground";
import {
  GAME_START_YEAR,
  getStartingMoney,
  formatMoney,
  VICTORY_GOALS,
  GOAL_CATEGORIES,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  type Difficulty,
  type VictoryMode,
  type GoalCategory,
} from "@/constants/gameEconomics";
import { COUNTRIES, REGION_NAMES, type Country } from "@/constants/globalMarket";
import { CHARACTERS, getCustomFounderLabels, type Character } from "@/constants/characters";

// ── Types ─────────────────────────────────────────────────────────────────────

type ContextOption = "classic" | "tech_boom" | "saturated" | "crisis";
type StepId = 1 | 2 | 3 | 4;

// ── Constants ─────────────────────────────────────────────────────────────────

const CONTEXT_CONFIG: Record<ContextOption, {
  label: string; desc: string; color: string; icon: keyof typeof Feather.glyphMap;
}> = {
  classic:    { label: "Clássico",          desc: "Mercado equilibrado",      color: "#4DA6FF", icon: "clock" },
  tech_boom:  { label: "Boom Tecnológico",  desc: "Inovação em alta",         color: "#10B981", icon: "zap" },
  saturated:  { label: "Saturado",          desc: "Competição intensa",       color: "#F5A623", icon: "trending-down" },
  crisis:     { label: "Crise",             desc: "Capital escasso",          color: "#FF4D6A", icon: "alert-triangle" },
};

const DIFF_CONFIG: Record<"easy" | "normal" | "hard", {
  label: string; capital: string; color: string; icon: keyof typeof Feather.glyphMap;
}> = {
  easy:   { label: "Fácil",   capital: "Alto",  color: "#4CAF50", icon: "sun" },
  normal: { label: "Normal",  capital: "Médio", color: "#4DA6FF", icon: "activity" },
  hard:   { label: "Difícil", capital: "Baixo", color: "#FF9800", icon: "zap" },
};

const ATTR_CONFIG = [
  { label: "Criatividade", color: "#A855F7", icon: "star" as const },
  { label: "Técnica",      color: "#4DA6FF", icon: "cpu" as const },
  { label: "Negócios",     color: "#10B981", icon: "briefcase" as const },
  { label: "Marketing",    color: "#FF6B35", icon: "trending-up" as const },
  { label: "Velocidade",   color: "#F5A623", icon: "zap" as const },
];

const TOTAL_POINTS = 10;
const ATTR_MAX = 4;

const RISK_COLORS: Record<string, string> = {
  low: "#10B981", medium: "#F5A623", high: "#FF8C00", very_high: "#FF4D6A",
};

const RISK_LABELS: Record<string, string> = {
  low: "Baixo", medium: "Médio", high: "Alto", very_high: "Muito Alto",
};

const GOAL_TITLES: Record<string, string> = {
  eco1: "Fortuna Inicial",       eco2: "Crescimento Sustentado", eco3: "Liderança de Mercado",
  eco4: "Monopólio Tecnológico", eco5: "Ultrarriqueza",
  glb1: "Presença Global",       glb2: "Expansão Continental",   glb3: "Domínio Regional",
  glb4: "Império Global",        glb5: "Mapa Completo",
  leg1: "Legado Cultural",       leg2: "Décadas de Relevância",  leg3: "Revolução Tecnológica",
  leg4: "Lenda do Setor",        leg5: "Nome Eterno",
};

const GOAL_DIFF_LABELS: Record<string, string> = {
  achievable: "Alcançável", challenging: "Desafiador", extreme: "Extremo",
};

const GOAL_DIFF_COLORS: Record<string, string> = {
  achievable: "#10B981", challenging: "#F5A623", extreme: "#FF4D6A",
};

function pickCharacter(attrs: number[]): string {
  const max = Math.max(...attrs);
  const dominated = attrs.filter(v => v === max);
  if (dominated.length > 1 || max <= 2) return "balanced";
  const idx = attrs.indexOf(max);
  return ["visionary", "engineer", "strategist", "marketer", "developer"][idx] ?? "balanced";
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function NewGameScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addSave } = useGame();
  const { loadGame } = useGameplay();

  const [step, setStep] = useState<StepId>(1);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Step 1
  const [selectedCountry, setSelectedCountry] = useState("usa");

  // Step 2
  const [difficulty, setDifficulty] = useState<"easy" | "normal" | "hard">("normal");
  const [context, setContext] = useState<ContextOption>("classic");

  // Step 3
  const [companyName, setCompanyName] = useState("");
  const [founderMode, setFounderMode] = useState<"preset" | "custom">("preset");
  const [selectedCharacterId, setSelectedCharacterId] = useState("balanced");
  const [founderName, setFounderName] = useState("");
  const [attrs, setAttrs] = useState<number[]>([2, 2, 2, 2, 2]);

  // Step 4
  const [victoryMode, setVictoryMode] = useState<VictoryMode>("sandbox");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const botPad = Platform.OS === "web" ? 34 : insets.bottom;
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const pointsUsed = attrs.reduce((s, v) => s + v, 0);
  const pointsLeft = TOTAL_POINTS - pointsUsed;
  const canStart = victoryMode === "sandbox" || selectedGoals.length === 3;

  const animateStep = (next: StepId) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 110, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
    setTimeout(() => setStep(next), 110);
  };

  const goBack = () => {
    if (step > 1) animateStep((step - 1) as StepId);
    else router.back();
  };

  const goNext = () => {
    if (step < 4) animateStep((step + 1) as StepId);
  };

  const adjustAttr = (i: number, delta: number) => {
    setAttrs(prev => {
      const next = [...prev];
      const newVal = next[i] + delta;
      const newUsed = pointsUsed + delta;
      if (newVal < 0 || newVal > ATTR_MAX || newUsed > TOTAL_POINTS || newUsed < 0) return prev;
      next[i] = newVal;
      return next;
    });
  };

  const toggleGoal = (id: string, category: GoalCategory) => {
    setSelectedGoals(prev => {
      const withoutCat = prev.filter(
        g => VICTORY_GOALS.find(vg => vg.id === g)?.category !== category
      );
      return [...withoutCat, id];
    });
  };

  const handleStart = async () => {
    const name = companyName.trim() || "Omega Corp";
    const money = getStartingMoney(difficulty as Difficulty);
    const characterId = founderMode === "preset" ? selectedCharacterId : pickCharacter(attrs);
    const save = addSave({
      slotNumber: Date.now(),
      companyName: name,
      netWorth: money,
      money,
      companies: 1,
      employees: 0,
      products: 0,
      researchCount: 0,
      lastPlayed: new Date().toLocaleDateString(),
      world: "origin",
      difficulty,
      year: GAME_START_YEAR,
      startingMoney: money,
      victoryMode,
      selectedGoals: victoryMode === "sandbox" ? [] : selectedGoals,
      characterId,
      homeCountry: selectedCountry,
      founderAttrs: founderMode === "custom" ? [...attrs] : undefined,
    });
    await loadGame(save);
    router.push("/game");
  };

  const STEP_LABELS = ["País", "Config.", "Empresa", "Modo"];

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <GridBackground />

      {/* Header */}
      <View style={[s.header, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={goBack} style={s.headerBack} activeOpacity={0.7}>
          <Feather name={step === 1 ? "x" : "arrow-left"} size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.foreground }]}>Nova Partida</Text>
        <Text style={[s.headerCounter, { color: colors.mutedForeground }]}>{step}/4</Text>
      </View>

      {/* Step indicator */}
      <View style={[s.stepRow, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {STEP_LABELS.map((label, i) => {
          const n = (i + 1) as StepId;
          const done = n < step;
          const active = n === step;
          return (
            <View key={n} style={s.stepItem}>
              {i > 0 && (
                <View style={[s.stepLine, { backgroundColor: done ? "#4DA6FF" : colors.border }]} />
              )}
              <View style={[
                s.stepDot,
                active && { backgroundColor: "#4DA6FF", borderColor: "#4DA6FF" },
                done && { backgroundColor: "#4DA6FF66", borderColor: "#4DA6FF" },
                !active && !done && { borderColor: colors.border },
              ]}>
                {done
                  ? <Feather name="check" size={9} color="#4DA6FF" />
                  : <Text style={[s.stepDotNum, { color: active ? "#fff" : colors.mutedForeground }]}>{n}</Text>
                }
              </View>
              <Text style={[s.stepLabel, { color: active ? "#4DA6FF" : done ? colors.mutedForeground : colors.border }]}>
                {label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Content */}
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingBottom: botPad + 104 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 && (
            <Step1
              selected={selectedCountry}
              onSelect={setSelectedCountry}
              colors={colors}
            />
          )}
          {step === 2 && (
            <Step2
              difficulty={difficulty}
              setDifficulty={setDifficulty}
              context={context}
              setContext={setContext}
              colors={colors}
            />
          )}
          {step === 3 && (
            <Step3
              companyName={companyName}
              setCompanyName={setCompanyName}
              founderMode={founderMode}
              setFounderMode={setFounderMode}
              selectedCharacterId={selectedCharacterId}
              setSelectedCharacterId={setSelectedCharacterId}
              founderName={founderName}
              setFounderName={setFounderName}
              attrs={attrs}
              adjustAttr={adjustAttr}
              pointsLeft={pointsLeft}
              colors={colors}
            />
          )}
          {step === 4 && (
            <Step4
              victoryMode={victoryMode}
              setVictoryMode={setVictoryMode}
              selectedGoals={selectedGoals}
              toggleGoal={toggleGoal}
              colors={colors}
            />
          )}
        </ScrollView>
      </Animated.View>

      {/* Bottom nav */}
      <View style={[s.bottomNav, {
        paddingBottom: botPad + 12,
        backgroundColor: colors.background,
        borderTopColor: colors.border,
      }]}>
        <TouchableOpacity
          onPress={goBack}
          activeOpacity={0.8}
          style={[s.navBack, { backgroundColor: colors.secondary, borderColor: colors.border }]}
        >
          <Feather name={step === 1 ? "x" : "arrow-left"} size={16} color={colors.mutedForeground} />
          <Text style={[s.navBackText, { color: colors.mutedForeground }]}>
            {step === 1 ? "Cancelar" : "Voltar"}
          </Text>
        </TouchableOpacity>

        {step < 4 ? (
          <TouchableOpacity onPress={goNext} activeOpacity={0.85} style={s.navNextWrapper}>
            <LinearGradient
              colors={["#4DA6FF", "#1E7CE0"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={s.navNext}
            >
              <Text style={s.navNextText}>Próximo</Text>
              <Feather name="arrow-right" size={16} color="#070D1A" />
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={canStart ? handleStart : undefined}
            activeOpacity={canStart ? 0.85 : 1}
            style={[s.navNextWrapper, !canStart && { opacity: 0.45 }]}
          >
            <LinearGradient
              colors={["#4DA6FF", "#1E7CE0"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={s.navNext}
            >
              <Feather name="play" size={16} color="#070D1A" />
              <Text style={s.navNextText}>Iniciar Partida</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ── Step 1: País ──────────────────────────────────────────────────────────────

function Step1({ selected, onSelect, colors }: {
  selected: string;
  onSelect: (id: string) => void;
  colors: any;
}) {
  const selectedData = COUNTRIES.find(c => c.id === selected);

  return (
    <>
      <Text style={[s.stepTitle, { color: colors.foreground }]}>País de Origem</Text>
      <Text style={[s.stepSubtitle, { color: colors.mutedForeground }]}>
        Define o mercado inicial e tributação.
      </Text>

      {/* Selected detail */}
      {selectedData && (
        <View style={[s.countryDetail, { backgroundColor: colors.card, borderColor: "#4DA6FF33" }]}>
          <LinearGradient
            colors={["#4DA6FF08", "transparent"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={s.countryDetailFlag}>{selectedData.flag}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[s.countryDetailName, { color: colors.foreground }]}>{selectedData.name}</Text>
            <View style={s.countryDetailTags}>
              <Tag
                icon="percent"
                label={`${Math.round(selectedData.taxRate * 100)}% imp.`}
                color="#10B981"
              />
              <Tag
                icon="shield"
                label={`Risco ${RISK_LABELS[selectedData.riskLevel]}`}
                color={RISK_COLORS[selectedData.riskLevel]}
              />
              <Tag
                icon="users"
                label={`${selectedData.population}M`}
                color="#A855F7"
              />
            </View>
          </View>
          <Feather name="check-circle" size={18} color="#4DA6FF" />
        </View>
      )}

      {/* Grid */}
      <View style={s.countryGrid}>
        {COUNTRIES.map(c => {
          const isSel = c.id === selected;
          const rc = RISK_COLORS[c.riskLevel];
          return (
            <TouchableOpacity
              key={c.id}
              onPress={() => onSelect(c.id)}
              activeOpacity={0.8}
              style={[
                s.countryCard,
                {
                  backgroundColor: isSel ? "#4DA6FF14" : colors.card,
                  borderColor: isSel ? "#4DA6FF" : colors.border,
                },
              ]}
            >
              <Text style={s.countryFlag}>{c.flag}</Text>
              <Text style={[s.countryName, { color: colors.foreground }]} numberOfLines={1}>{c.name}</Text>
              <Text style={[s.countryTax, { color: "#10B981" }]}>{Math.round(c.taxRate * 100)}% imp.</Text>
              <View style={[s.riskPill, { backgroundColor: rc + "22" }]}>
                <Text style={[s.riskPillText, { color: rc }]}>
                  {{ low: "Baixo", medium: "Médio", high: "Alto", very_high: "V.Alto" }[c.riskLevel]}
                </Text>
              </View>
              <Text style={[s.countryPop, { color: colors.mutedForeground }]}>{c.population}M</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );
}

// ── Step 2: Configuração ───────────────────────────────────────────────────────

function Step2({ difficulty, setDifficulty, context, setContext, colors }: {
  difficulty: "easy" | "normal" | "hard";
  setDifficulty: (d: "easy" | "normal" | "hard") => void;
  context: ContextOption;
  setContext: (c: ContextOption) => void;
  colors: any;
}) {
  const money = getStartingMoney(difficulty as Difficulty);
  const cfg = DIFF_CONFIG[difficulty];

  return (
    <>
      <Text style={[s.stepTitle, { color: colors.foreground }]}>Configuração</Text>
      <Text style={[s.stepSubtitle, { color: colors.mutedForeground }]}>
        Define o capital inicial e o nível de desafio.
      </Text>

      {/* Capital / Difficulty unified */}
      <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>NÍVEL DE JOGO</Text>

      <View style={[s.capitalPreview, { backgroundColor: colors.card, borderColor: cfg.color + "44" }]}>
        <LinearGradient
          colors={[cfg.color + "10", "transparent"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={{ flex: 1 }}>
          <Text style={[s.capitalLabel, { color: colors.mutedForeground }]}>Capital Inicial</Text>
          <Text style={[s.capitalAmount, { color: cfg.color }]}>{formatMoney(money)}</Text>
        </View>
        <View style={[s.capitalBadge, { backgroundColor: cfg.color + "22" }]}>
          <Feather name={cfg.icon} size={14} color={cfg.color} />
          <Text style={[s.capitalBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>

      <View style={s.diffRow}>
        {(["easy", "normal", "hard"] as const).map(d => {
          const dc = DIFF_CONFIG[d];
          const active = d === difficulty;
          return (
            <TouchableOpacity
              key={d}
              onPress={() => setDifficulty(d)}
              activeOpacity={0.8}
              style={[
                s.diffPill,
                {
                  backgroundColor: active ? dc.color + "18" : colors.secondary,
                  borderColor: active ? dc.color : colors.border,
                },
              ]}
            >
              <Feather name={dc.icon} size={14} color={active ? dc.color : colors.mutedForeground} />
              <Text style={[s.diffPillLabel, { color: active ? dc.color : colors.mutedForeground }]}>
                {dc.label}
              </Text>
              <Text style={[s.diffPillCapital, { color: active ? dc.color + "99" : colors.border }]}>
                {dc.capital}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Historical context */}
      <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>CONTEXTO HISTÓRICO</Text>

      <View style={s.contextGrid}>
        {(Object.keys(CONTEXT_CONFIG) as ContextOption[]).map(k => {
          const cc = CONTEXT_CONFIG[k];
          const active = context === k;
          return (
            <TouchableOpacity
              key={k}
              onPress={() => setContext(k)}
              activeOpacity={0.8}
              style={[
                s.contextCard,
                {
                  backgroundColor: active ? cc.color + "14" : colors.card,
                  borderColor: active ? cc.color : colors.border,
                },
              ]}
            >
              <View style={[s.contextIcon, { backgroundColor: cc.color + "20" }]}>
                <Feather name={cc.icon} size={16} color={cc.color} />
              </View>
              <Text style={[s.contextLabel, { color: active ? cc.color : colors.foreground }]}>
                {cc.label}
              </Text>
              <Text style={[s.contextDesc, { color: colors.mutedForeground }]}>
                {cc.desc}
              </Text>
              {active && (
                <View style={[s.contextCheck, { backgroundColor: cc.color }]}>
                  <Feather name="check" size={8} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );
}

// ── Step 3: Empresa e Fundador ────────────────────────────────────────────────

function Step3({
  companyName, setCompanyName,
  founderMode, setFounderMode,
  selectedCharacterId, setSelectedCharacterId,
  founderName, setFounderName,
  attrs, adjustAttr, pointsLeft,
  colors,
}: {
  companyName: string;
  setCompanyName: (v: string) => void;
  founderMode: "preset" | "custom";
  setFounderMode: (m: "preset" | "custom") => void;
  selectedCharacterId: string;
  setSelectedCharacterId: (id: string) => void;
  founderName: string;
  setFounderName: (v: string) => void;
  attrs: number[];
  adjustAttr: (i: number, delta: number) => void;
  pointsLeft: number;
  colors: any;
}) {
  const pointsColor = pointsLeft === 0 ? "#10B981" : pointsLeft <= 2 ? "#F5A623" : "#4DA6FF";
  const selectedChar = CHARACTERS.find(c => c.id === selectedCharacterId);

  // Derive archetype label from dominant attr for custom founder
  const customCharId = (() => {
    const max = Math.max(...attrs);
    const ties = attrs.filter(v => v === max);
    if (ties.length > 1 || max <= 2) return "balanced";
    const idx = attrs.indexOf(max);
    return ["visionary", "engineer", "strategist", "marketer", "developer"][idx] ?? "balanced";
  })();
  const customChar = CHARACTERS.find(c => c.id === customCharId);

  return (
    <>
      <Text style={[s.stepTitle, { color: colors.foreground }]}>Empresa e Fundador</Text>
      <Text style={[s.stepSubtitle, { color: colors.mutedForeground }]}>
        Personalize sua empresa e escolha o perfil do fundador.
      </Text>

      {/* Company name */}
      <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>NOME DA EMPRESA</Text>
      <View style={[s.inputRow, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <Feather name="briefcase" size={16} color={colors.primary} />
        <TextInput
          value={companyName}
          onChangeText={setCompanyName}
          placeholder="Ex: Omega Corp"
          placeholderTextColor={colors.mutedForeground}
          style={[s.input, { color: colors.foreground }]}
          maxLength={30}
        />
      </View>

      {/* Founder mode toggle */}
      <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>FUNDADOR</Text>
      <View style={[s.modeToggle, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        {(["preset", "custom"] as const).map(m => {
          const active = founderMode === m;
          return (
            <TouchableOpacity
              key={m}
              onPress={() => setFounderMode(m)}
              activeOpacity={0.8}
              style={[s.modeToggleBtn, active && { backgroundColor: "#4DA6FF14", borderColor: "#4DA6FF" }]}
            >
              <Feather
                name={m === "preset" ? "users" : "sliders"}
                size={14}
                color={active ? "#4DA6FF" : colors.mutedForeground}
              />
              <Text style={[s.modeToggleTxt, { color: active ? "#4DA6FF" : colors.mutedForeground }]}>
                {m === "preset" ? "Fundador Pronto" : "Criar Meu Fundador"}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* PRESET: character cards */}
      {founderMode === "preset" && (
        <>
          <View style={s.charGrid}>
            {CHARACTERS.map(c => {
              const sel = c.id === selectedCharacterId;
              return (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => setSelectedCharacterId(c.id)}
                  activeOpacity={0.8}
                  style={[
                    s.charCard,
                    {
                      backgroundColor: sel ? c.color + "14" : colors.card,
                      borderColor: sel ? c.color : colors.border,
                      borderWidth: sel ? 1.5 : 1,
                    },
                  ]}
                >
                  {sel && (
                    <View style={[s.charCheck, { backgroundColor: c.color }]}>
                      <Feather name="check" size={8} color="#fff" />
                    </View>
                  )}
                  <View style={[s.charIconBox, { backgroundColor: c.color + "22" }]}>
                    <Feather name={c.icon as keyof typeof Feather.glyphMap} size={18} color={c.color} />
                  </View>
                  <Text style={[s.charName, { color: sel ? c.color : colors.foreground }]}>{c.name}</Text>
                  <Text style={[s.charTitle, { color: colors.mutedForeground }]}>{c.title}</Text>
                  <View style={[s.charArchBadge, { backgroundColor: c.color + "18" }]}>
                    <Text style={[s.charArchText, { color: c.color }]}>{c.archetype}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Selected character detail */}
          {selectedChar && (
            <View style={[s.charDetail, { backgroundColor: colors.card, borderColor: selectedChar.color + "44" }]}>
              <LinearGradient
                colors={[selectedChar.color + "10", "transparent"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={s.charDetailHeader}>
                <View style={[s.charDetailIcon, { backgroundColor: selectedChar.color + "22" }]}>
                  <Feather name={selectedChar.icon as keyof typeof Feather.glyphMap} size={22} color={selectedChar.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.charDetailName, { color: colors.foreground }]}>{selectedChar.name}</Text>
                  <Text style={[s.charDetailStyle, { color: colors.mutedForeground }]} numberOfLines={2}>
                    {selectedChar.playstyle}
                  </Text>
                </View>
              </View>
              <View style={s.charDetailBonuses}>
                {selectedChar.bonusLabels.slice(0, 3).map((b, i) => (
                  <View key={i} style={s.charDetailBonus}>
                    <Feather name="arrow-up-right" size={11} color="#10B981" />
                    <Text style={[s.charDetailBonusTxt, { color: "#10B981" }]}>{b}</Text>
                  </View>
                ))}
                {selectedChar.penaltyLabels.slice(0, 1).map((p, i) => (
                  <View key={i} style={s.charDetailBonus}>
                    <Feather name="arrow-down-right" size={11} color="#FF4D6A" />
                    <Text style={[s.charDetailBonusTxt, { color: "#FF4D6A" }]}>{p}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </>
      )}

      {/* CUSTOM: name input + attributes */}
      {founderMode === "custom" && (
        <>
          <Text style={[s.sectionLabel, { color: colors.mutedForeground }]}>NOME DO FUNDADOR</Text>
          <View style={[s.inputRow, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
            <Feather name="user" size={16} color={colors.primary} />
            <TextInput
              value={founderName}
              onChangeText={setFounderName}
              placeholder="Ex: Alex Sterling"
              placeholderTextColor={colors.mutedForeground}
              style={[s.input, { color: colors.foreground }]}
              maxLength={30}
            />
          </View>

          <View style={s.attrHeader}>
            <Text style={[s.sectionLabel, { color: colors.mutedForeground, marginBottom: 0 }]}>
              ATRIBUTOS
            </Text>
            <View style={[s.pointsBadge, { backgroundColor: pointsColor + "18", borderColor: pointsColor + "44" }]}>
              <Text style={[s.pointsBadgeText, { color: pointsColor }]}>
                {pointsLeft} pt{pointsLeft !== 1 ? "s" : ""} restante{pointsLeft !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>
          <Text style={[s.attrHint, { color: colors.mutedForeground }]}>
            {TOTAL_POINTS} pontos · máx {ATTR_MAX}/attr · especializar em uma área penaliza as outras
          </Text>

          <View style={s.attrList}>
            {ATTR_CONFIG.map((a, i) => {
              const val = attrs[i];
              const pct = val / ATTR_MAX;
              const canInc = pointsLeft > 0 && val < ATTR_MAX;
              const canDec = val > 0;
              return (
                <View key={a.label} style={[s.attrRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[s.attrIcon, { backgroundColor: a.color + "20" }]}>
                    <Feather name={a.icon} size={14} color={a.color} />
                  </View>
                  <Text style={[s.attrLabel, { color: colors.foreground }]}>{a.label}</Text>
                  <View style={[s.attrBarTrack, { backgroundColor: colors.border }]}>
                    <View style={[s.attrBarFill, { width: `${pct * 100}%`, backgroundColor: a.color }]} />
                  </View>
                  <Text style={[s.attrValue, { color: a.color }]}>{val}</Text>
                  <View style={s.attrBtns}>
                    <TouchableOpacity
                      onPress={() => adjustAttr(i, -1)}
                      disabled={!canDec}
                      style={[s.attrBtn, { borderColor: colors.border, opacity: canDec ? 1 : 0.3 }]}
                      activeOpacity={0.7}
                    >
                      <Feather name="minus" size={12} color={colors.mutedForeground} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => adjustAttr(i, 1)}
                      disabled={!canInc}
                      style={[s.attrBtn, { borderColor: canInc ? a.color : colors.border, opacity: canInc ? 1 : 0.3 }]}
                      activeOpacity={0.7}
                    >
                      <Feather name="plus" size={12} color={canInc ? a.color : colors.mutedForeground} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Bonus/penalty preview */}
          {(() => {
            const { bonuses, penalties } = getCustomFounderLabels(attrs);
            const hasAny = bonuses.length > 0 || penalties.length > 0;
            if (!hasAny) return null;
            return (
              <View style={[s.effectsPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={s.effectsRow}>
                  <Feather name="trending-up" size={12} color="#10B981" />
                  <Text style={[s.effectsTitle, { color: "#10B981" }]}>BÔNUS</Text>
                </View>
                {bonuses.length > 0
                  ? bonuses.map((b, i) => (
                      <Text key={i} style={[s.effectLine, { color: "#10B981" }]}>{b}</Text>
                    ))
                  : <Text style={[s.effectLine, { color: colors.border }]}>Nenhum ainda</Text>
                }
                {penalties.length > 0 && (
                  <>
                    <View style={[s.effectsDivider, { backgroundColor: colors.border }]} />
                    <View style={s.effectsRow}>
                      <Feather name="trending-down" size={12} color="#FF4D6A" />
                      <Text style={[s.effectsTitle, { color: "#FF4D6A" }]}>PENALIDADES</Text>
                    </View>
                    {penalties.map((p, i) => (
                      <Text key={i} style={[s.effectLine, { color: "#FF4D6A" }]}>{p}</Text>
                    ))}
                  </>
                )}
                {customChar && (
                  <View style={[s.archetypeRow, { borderTopColor: colors.border }]}>
                    <View style={[{ width: 20, height: 20, borderRadius: 6, backgroundColor: customChar.color + "22", alignItems: "center", justifyContent: "center" }]}>
                      <Feather name={customChar.icon as keyof typeof Feather.glyphMap} size={11} color={customChar.color} />
                    </View>
                    <Text style={[s.archetypeLabel, { color: colors.mutedForeground }]}>Perfil: </Text>
                    <Text style={[s.archetypeName, { color: customChar.color }]}>{customChar.title}</Text>
                  </View>
                )}
              </View>
            );
          })()}
        </>
      )}
    </>
  );
}

// ── Step 4: Modo de Jogo ──────────────────────────────────────────────────────

function Step4({ victoryMode, setVictoryMode, selectedGoals, toggleGoal, colors }: {
  victoryMode: VictoryMode;
  setVictoryMode: (m: VictoryMode) => void;
  selectedGoals: string[];
  toggleGoal: (id: string, cat: GoalCategory) => void;
  colors: any;
}) {
  const MODES: { mode: VictoryMode; label: string; desc: string; icon: keyof typeof Feather.glyphMap; color: string }[] = [
    { mode: "sandbox", label: "Modo Livre",       desc: "Jogue sem condições de vitória. Construa no seu ritmo.", icon: "play-circle", color: "#4DA6FF" },
    { mode: "goals",   label: "Com Objetivos",    desc: "Escolha 3 metas (uma por categoria) e tente alcançá-las.", icon: "target",      color: "#A855F7" },
  ];

  return (
    <>
      <Text style={[s.stepTitle, { color: colors.foreground }]}>Modo de Jogo</Text>
      <Text style={[s.stepSubtitle, { color: colors.mutedForeground }]}>
        Como você quer encerrar a partida?
      </Text>

      <View style={s.modeList}>
        {MODES.map(({ mode, label, desc, icon, color }) => {
          const active = victoryMode === mode;
          return (
            <TouchableOpacity
              key={mode}
              onPress={() => setVictoryMode(mode)}
              activeOpacity={0.8}
              style={[
                s.modeCard,
                {
                  backgroundColor: active ? color + "14" : colors.card,
                  borderColor: active ? color : colors.border,
                },
              ]}
            >
              <View style={[s.modeIcon, { backgroundColor: color + "20" }]}>
                <Feather name={icon} size={20} color={color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.modeName, { color: active ? color : colors.foreground }]}>{label}</Text>
                <Text style={[s.modeDesc, { color: colors.mutedForeground }]}>{desc}</Text>
              </View>
              <View style={[s.modeRadio, { borderColor: active ? color : colors.border }]}>
                {active && <View style={[s.modeRadioInner, { backgroundColor: color }]} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Goal selection */}
      {victoryMode === "goals" && (
        <>
          <View style={s.goalsHeader}>
            <Text style={[s.sectionLabel, { color: colors.mutedForeground, marginBottom: 0 }]}>OBJETIVOS</Text>
            <View style={[
              s.goalsBadge,
              { backgroundColor: selectedGoals.length === 3 ? "#4CAF5022" : colors.secondary,
                borderColor: selectedGoals.length === 3 ? "#4CAF50" : colors.border },
            ]}>
              <Text style={[s.goalsBadgeText, { color: selectedGoals.length === 3 ? "#4CAF50" : colors.mutedForeground }]}>
                {selectedGoals.length}/3
              </Text>
            </View>
          </View>
          <Text style={[s.attrHint, { color: colors.mutedForeground }]}>
            Escolha 1 objetivo de cada categoria.
          </Text>

          {GOAL_CATEGORIES.map(cat => {
            const catColor = CATEGORY_COLORS[cat];
            const catGoals = VICTORY_GOALS.filter(g => g.category === cat);
            const catSelected = selectedGoals.find(g => VICTORY_GOALS.find(vg => vg.id === g)?.category === cat);
            const catLabel = cat === "economic" ? "Econômico" : cat === "global" ? "Global" : "Legado";
            return (
              <View key={cat} style={s.catBlock}>
                <View style={s.catHeader}>
                  <View style={[s.catDot, { backgroundColor: catColor }]} />
                  <Text style={[s.catName, { color: catColor }]}>{catLabel}</Text>
                  {catSelected && <Feather name="check-circle" size={14} color={catColor} style={{ marginLeft: "auto" }} />}
                </View>
                {catGoals.map(goal => {
                  const sel = selectedGoals.includes(goal.id);
                  const diffColor = GOAL_DIFF_COLORS[goal.difficulty];
                  return (
                    <TouchableOpacity
                      key={goal.id}
                      onPress={() => toggleGoal(goal.id, cat)}
                      activeOpacity={0.8}
                      style={[
                        s.goalRow,
                        {
                          backgroundColor: sel ? catColor + "12" : colors.card,
                          borderColor: sel ? catColor : colors.border,
                        },
                      ]}
                    >
                      <View style={[s.goalIconBox, { backgroundColor: goal.color + "20" }]}>
                        <Feather name={goal.icon as keyof typeof Feather.glyphMap} size={14} color={goal.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.goalTitle, { color: sel ? catColor : colors.foreground }]}>
                          {GOAL_TITLES[goal.id] ?? goal.id}
                        </Text>
                        <Text style={[s.goalDesc, { color: diffColor }]}>
                          {GOAL_DIFF_LABELS[goal.difficulty]}
                        </Text>
                      </View>
                      <View style={[s.goalRadio, { borderColor: sel ? catColor : colors.border }]}>
                        {sel && <View style={[s.goalRadioInner, { backgroundColor: catColor }]} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}
        </>
      )}
    </>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Tag({ icon, label, color }: { icon: keyof typeof Feather.glyphMap; label: string; color: string }) {
  return (
    <View style={[s.tag, { backgroundColor: color + "18", borderColor: color + "33" }]}>
      <Feather name={icon} size={10} color={color} />
      <Text style={[s.tagText, { color }]}>{label}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  headerBack: { padding: 4, marginRight: 12 },
  headerTitle: { flex: 1, fontSize: 17, fontFamily: "Inter_700Bold" },
  headerCounter: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  // Step indicator
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 0,
  },
  stepItem: {
    flex: 1, flexDirection: "row", alignItems: "center",
  },
  stepLine: { flex: 1, height: 1, marginHorizontal: 4 },
  stepDot: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 1.5,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "transparent",
  },
  stepDotNum: { fontSize: 10, fontFamily: "Inter_700Bold" },
  stepLabel: {
    fontSize: 10, fontFamily: "Inter_600SemiBold",
    marginLeft: 5, flexShrink: 1,
  },

  // Scroll
  scroll: { padding: 20, gap: 16 },

  // Step typography
  stepTitle: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  stepSubtitle: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19, marginTop: -8 },
  sectionLabel: {
    fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1,
    textTransform: "uppercase", marginBottom: 8,
  },

  // Step 1: Country
  countryDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    overflow: "hidden",
  },
  countryDetailFlag: { fontSize: 30 },
  countryDetailName: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 6 },
  countryDetailTags: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1,
  },
  tagText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  countryGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 8,
  },
  countryCard: {
    borderRadius: 12, borderWidth: 1.5, padding: 10,
    minWidth: "30%", flexGrow: 1, maxWidth: "32%",
  },
  countryFlag: { fontSize: 22, marginBottom: 4 },
  countryName: { fontSize: 11, fontFamily: "Inter_700Bold", marginBottom: 2 },
  countryTax: { fontSize: 10, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  riskPill: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6, alignSelf: "flex-start", marginBottom: 2 },
  riskPillText: { fontSize: 9, fontFamily: "Inter_700Bold" },
  countryPop: { fontSize: 10, fontFamily: "Inter_400Regular" },

  // Step 2: Config
  capitalPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    overflow: "hidden",
  },
  capitalLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 4 },
  capitalAmount: { fontSize: 26, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  capitalBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
  },
  capitalBadgeText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  diffRow: { flexDirection: "row", gap: 8 },
  diffPill: {
    flex: 1, alignItems: "center", gap: 4, paddingVertical: 12,
    borderRadius: 12, borderWidth: 1.5,
  },
  diffPillLabel: { fontSize: 13, fontFamily: "Inter_700Bold" },
  diffPillCapital: { fontSize: 10, fontFamily: "Inter_400Regular" },
  contextGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  contextCard: {
    width: "47%", flexGrow: 1, borderRadius: 12, borderWidth: 1,
    padding: 12, gap: 6, alignItems: "flex-start",
  },
  contextIcon: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  contextLabel: { fontSize: 13, fontFamily: "Inter_700Bold" },
  contextDesc: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 15 },
  contextCheck: {
    position: "absolute", top: 10, right: 10,
    width: 16, height: 16, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
  },

  // Step 3: Founder
  inputRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 50,
  },
  input: {
    flex: 1, fontSize: 15, fontFamily: "Inter_500Medium",
    ...(Platform.OS === "web" ? { outlineStyle: "none" } as any : {}),
  },

  // Founder mode toggle
  modeToggle: {
    flexDirection: "row", borderRadius: 12, borderWidth: 1,
    padding: 4, gap: 4,
  },
  modeToggleBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 7, paddingVertical: 10, borderRadius: 9, borderWidth: 1, borderColor: "transparent",
  },
  modeToggleTxt: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  // Character grid (preset)
  charGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 8,
  },
  charCard: {
    borderRadius: 12, padding: 12, gap: 6, alignItems: "flex-start",
    minWidth: "30%", flexGrow: 1, maxWidth: "32%",
  },
  charCheck: {
    position: "absolute", top: 8, right: 8,
    width: 16, height: 16, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
  },
  charIconBox: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  charName: { fontSize: 11, fontFamily: "Inter_700Bold" },
  charTitle: { fontSize: 10, fontFamily: "Inter_400Regular" },
  charArchBadge: {
    paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, marginTop: 2,
  },
  charArchText: { fontSize: 9, fontFamily: "Inter_700Bold" },

  // Character detail panel
  charDetail: {
    borderRadius: 14, borderWidth: 1, padding: 14, gap: 10, overflow: "hidden",
  },
  charDetailHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  charDetailIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  charDetailName: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 4 },
  charDetailStyle: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16 },
  charDetailBonuses: { gap: 4 },
  charDetailBonus: { flexDirection: "row", alignItems: "center", gap: 5 },
  charDetailBonusTxt: { fontSize: 11, fontFamily: "Inter_500Medium" },

  // Effects panel (custom founder preview)
  effectsPanel: {
    borderRadius: 12, borderWidth: 1, padding: 12, gap: 5,
  },
  effectsRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 2 },
  effectsTitle: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  effectLine: { fontSize: 12, fontFamily: "Inter_500Medium", paddingLeft: 17 },
  effectsDivider: { height: 1, marginVertical: 4 },
  archetypeRow: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginTop: 6, paddingTop: 8, borderTopWidth: 1,
  },
  archetypeLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  archetypeName: { fontSize: 12, fontFamily: "Inter_700Bold" },

  attrHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  pointsBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1,
  },
  pointsBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  attrHint: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18, marginTop: -8 },
  attrList: { gap: 8 },
  attrRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 12, borderWidth: 1, padding: 12,
  },
  attrIcon: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  attrLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", width: 88, flexShrink: 0 },
  attrBarTrack: {
    flex: 1, height: 5, borderRadius: 3, overflow: "hidden",
  },
  attrBarFill: { height: 5, borderRadius: 3 },
  attrValue: { fontSize: 14, fontFamily: "Inter_700Bold", width: 18, textAlign: "center" },
  attrBtns: { flexDirection: "row", gap: 6 },
  attrBtn: {
    width: 28, height: 28, borderRadius: 8, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },

  // Step 4: Mode
  modeList: { gap: 10 },
  modeCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    borderRadius: 14, borderWidth: 1.5, padding: 16,
  },
  modeIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  modeName: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 3 },
  modeDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  modeRadio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  modeRadioInner: { width: 8, height: 8, borderRadius: 4 },
  goalsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  goalsBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1,
  },
  goalsBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  catBlock: { gap: 6 },
  catHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  catDot: { width: 8, height: 8, borderRadius: 4 },
  catName: { fontSize: 12, fontFamily: "Inter_700Bold", letterSpacing: 0.3 },
  goalRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 10, borderWidth: 1, padding: 12,
  },
  goalIconBox: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  goalRadio: {
    width: 18, height: 18, borderRadius: 9, borderWidth: 2,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  goalRadioInner: { width: 8, height: 8, borderRadius: 4 },
  goalTitle: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  goalDesc: { fontSize: 11, fontFamily: "Inter_400Regular" },

  // Bottom nav
  bottomNav: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  navBack: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 18, paddingVertical: 14,
    borderRadius: 12, borderWidth: 1,
  },
  navBackText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  navNextWrapper: { flex: 1, borderRadius: 12, overflow: "hidden" },
  navNext: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 12,
  },
  navNextText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#070D1A" },
});
