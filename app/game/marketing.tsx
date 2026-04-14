import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Platform, Alert, Modal, Pressable,
} from "react-native";
import type { StrategyCategory } from "@/constants/gameEngine";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useGameplay } from "@/context/GameplayContext";
import { GridBackground } from "@/components/GridBackground";
import { ScreenHeader } from "@/components/ScreenHeader";
import { formatMoney } from "@/constants/gameEconomics";
import {
  MarketingTier,
  MARKETING_COSTS,
  MARKETING_DURATION,
  MARKETING_SALES_BOOST,
} from "@/constants/gameEngine";
import {
  INFLUENCER_PROFILES,
  getInfluencerCooldownLeft,
} from "@/constants/scandals";
import type { InfluencerType } from "@/constants/scandals";

// ─── Tab type ────────────────────────────────────────────────────────────────
type MarketingTab = "campanhas" | "influenciadores" | "estrategia";

// ─── Campaign definitions ─────────────────────────────────────────────────────
type CampaignDef = {
  tier: MarketingTier;
  name: string;
  desc: string;
  details: string[];
  color: string;
  icon: keyof typeof Feather.glyphMap;
};

const CAMPAIGNS: CampaignDef[] = [
  {
    tier: "cheap",
    name: "Campanha Básica",
    desc: "Anúncios locais e redes sociais",
    details: [
      "+15% vendas por 3 meses",
      "Redes sociais orgânicas",
      "Flyers e banners digitais",
      "Ótimo custo-benefício",
    ],
    color: "#10B981",
    icon: "volume-1",
  },
  {
    tier: "medium",
    name: "Campanha Padrão",
    desc: "TV, influencers e mídia digital",
    details: [
      "+40% vendas por 6 meses",
      "Spots em TV e rádio",
      "Parcerias com influencers",
      "Cobertura nacional",
    ],
    color: "#F5A623",
    icon: "volume-2",
  },
  {
    tier: "aggressive",
    name: "Campanha Agressiva",
    desc: "Domínio total de mídia global",
    details: [
      "+90% vendas por 12 meses",
      "Campanha global massiva",
      "Super Bowl, eventos mundiais",
      "Reconhecimento de marca máximo",
    ],
    color: "#FF4D6A",
    icon: "volume",
  },
];

// ─── Strategy positioning options ─────────────────────────────────────────────
type PositioningOption = {
  id: string;
  label: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  effects: string[];
  modifiers: { repMod?: number; fansMod?: number; salesMod?: number };
};

const POSITIONING_OPTIONS: PositioningOption[] = [
  {
    id: "premium",
    label: "Premium",
    description: "Foco em qualidade e percepção de marca. Menor alcance, maior valor percebido.",
    icon: "star",
    color: "#F5A623",
    effects: ["+2% reputação efetiva", "-1% alcance de fãs"],
    modifiers: { repMod: 0.02, fansMod: -0.01 },
  },
  {
    id: "casual",
    label: "Casual",
    description: "Amplo apelo popular. Maximiza alcance sacrificando percepção de exclusividade.",
    icon: "smile",
    color: "#10B981",
    effects: ["+2% alcance de fãs", "-1% reputação efetiva"],
    modifiers: { fansMod: 0.02, repMod: -0.01 },
  },
  {
    id: "hardcore",
    label: "Hardcore",
    description: "Posicionamento técnico para jogadores dedicados. Alta reputação, alcance menor.",
    icon: "zap",
    color: "#A855F7",
    effects: ["+2% reputação de nicho", "-1% conversão geral"],
    modifiers: { repMod: 0.02, salesMod: -0.01 },
  },
  {
    id: "indie",
    label: "Indie",
    description: "Identidade autêntica e nicho fiel. Eficiência em comunidades especializadas.",
    icon: "heart",
    color: "#EC4899",
    effects: ["+1% reputação", "+1% fãs de nicho"],
    modifiers: { repMod: 0.01, fansMod: 0.01 },
  },
  {
    id: "mainstream",
    label: "Mainstream",
    description: "Volume máximo de vendas. Maximiza conversão com menor diferenciação de marca.",
    icon: "trending-up",
    color: "#4DA6FF",
    effects: ["+3% conversão de vendas", "-1% reputação percebida"],
    modifiers: { salesMod: 0.03, repMod: -0.01 },
  },
];

// ─── Campaign focus options ───────────────────────────────────────────────────
type FocusOption = {
  id: string;
  label: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  effects: string[];
  modifiers: { fansMod?: number; salesMod?: number; repMod?: number };
};

const FOCUS_OPTIONS: FocusOption[] = [
  {
    id: "alcance",
    label: "Alcance",
    description: "Aumenta visibilidade, mas reduz eficiência de conversão.",
    icon: "radio",
    color: "#4DA6FF",
    effects: ["+2% alcance de fãs", "-1% conversão direta"],
    modifiers: { fansMod: 0.02, salesMod: -0.01 },
  },
  {
    id: "conversao",
    label: "Conversão",
    description: "Maximiza vendas diretas reduzindo esforço em audiência.",
    icon: "shopping-cart",
    color: "#10B981",
    effects: ["+2% vendas diretas", "-1% alcance de fãs"],
    modifiers: { salesMod: 0.02, fansMod: -0.01 },
  },
  {
    id: "reputacao",
    label: "Reputação",
    description: "Fortalece percepção da marca em detrimento do alcance imediato.",
    icon: "award",
    color: "#F5A623",
    effects: ["+2% reputação de marca", "-1% conversão imediata"],
    modifiers: { repMod: 0.02, salesMod: -0.01 },
  },
];

// ─── Helper: compute combined strategy modifier display ───────────────────────
function computeStrategyProjection(
  posId: string | null,
  focusId: string | null,
  baseSalesBoost: number,
): { label: string; value: string } | null {
  if (!posId && !focusId) return null;
  const pos   = POSITIONING_OPTIONS.find((p) => p.id === posId);
  const focus = FOCUS_OPTIONS.find((f) => f.id === focusId);
  const totalSalesMod = (pos?.modifiers.salesMod ?? 0) + (focus?.modifiers.salesMod ?? 0);
  const totalFansMod  = (pos?.modifiers.fansMod  ?? 0) + (focus?.modifiers.fansMod  ?? 0);
  const totalRepMod   = (pos?.modifiers.repMod   ?? 0) + (focus?.modifiers.repMod   ?? 0);

  const parts: string[] = [];
  if (totalSalesMod !== 0) parts.push(`vendas ${totalSalesMod > 0 ? "+" : ""}${Math.round(totalSalesMod * 100)}%`);
  if (totalFansMod  !== 0) parts.push(`fãs ${totalFansMod > 0 ? "+" : ""}${Math.round(totalFansMod * 100)}%`);
  if (totalRepMod   !== 0) parts.push(`rep ${totalRepMod > 0 ? "+" : ""}${Math.round(totalRepMod * 100)}%`);
  if (parts.length === 0) return null;
  return { label: "Ajuste estratégico", value: parts.join(", ") };
}

// ─── InfluencerHireModal ──────────────────────────────────────────────────────
type InfluencerHireModalProps = {
  profileId: InfluencerType;
  onClose: () => void;
  onConfirm: (gameProjectId?: string) => void;
  availableGames: { id: string; name: string }[];
  canAfford: boolean;
};

function InfluencerHireModal({ profileId, onClose, onConfirm, availableGames, canAfford }: InfluencerHireModalProps) {
  const colors   = useColors();
  const profile  = INFLUENCER_PROFILES.find((p) => p.id === profileId);
  const [selectedGameId, setSelectedGameId] = useState<string | undefined>(undefined);
  if (!profile) return null;

  return (
    <Modal transparent animationType="fade" statusBarTranslucent>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.hireModal, { backgroundColor: colors.card, borderColor: profile.riskColor + "88" }]} onPress={() => {}}>
          <View style={[styles.hireHeader, { borderBottomColor: colors.border }]}>
            <Text style={styles.hireEmoji}>{profile.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.hireTitle, { color: colors.foreground }]}>{profile.label}</Text>
              <Text style={[styles.hireAudience, { color: colors.mutedForeground }]}>{profile.audience}</Text>
            </View>
            <View style={[styles.riskBadge, { backgroundColor: profile.riskColor + "22", borderColor: profile.riskColor }]}>
              <Text style={[styles.riskBadgeText, { color: profile.riskColor }]}>{profile.riskTag}</Text>
            </View>
          </View>

          <ScrollView style={{ flexShrink: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={[styles.hireDesc, { color: colors.mutedForeground }]}>{profile.description}</Text>

            <View style={[styles.effectsBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.effectsTitle, { color: colors.mutedForeground }]}>EFEITOS DA CAMPANHA</Text>
              <View style={styles.effectsGrid}>
                <EffectChip label="Fãs" value={`+${profile.fanBonus.toLocaleString()}`} color="#4DA6FF" />
                <EffectChip label="Rep" value={`+${profile.repBonus}`} color="#10B981" />
                {profile.techRepBonus ? <EffectChip label="Rep Tech" value={`+${profile.techRepBonus}`} color="#8B5CF6" /> : null}
                {profile.commercialRepBonus ? <EffectChip label="Rep Comercial" value={`+${profile.commercialRepBonus}`} color="#F5A623" /> : null}
                {profile.fanRepBonus ? <EffectChip label="Rep Fãs" value={`+${profile.fanRepBonus}`} color="#FF4D6A" /> : null}
                <EffectChip label="Duração" value={`${profile.durationMonths}m`} color="#6B7280" />
              </View>
              {profile.earlyAccessBonus && (
                <View style={[styles.earlyAccessRow, { backgroundColor: "#4DA6FF11", borderColor: "#4DA6FF33" }]}>
                  <Text style={{ fontSize: 13, color: "#4DA6FF" }}>
                    🎮 Acesso Antecipado: +{profile.earlyAccessBonus.toLocaleString()} fãs extras se ligado a um jogo
                  </Text>
                </View>
              )}
              {profileId === "controversial" && (
                <View style={[styles.earlyAccessRow, { backgroundColor: "#E5393520", borderColor: "#E5393555" }]}>
                  <Text style={{ fontSize: 12, color: "#E53935" }}>
                    ⚠️ 30% de chance de backlash imediato ao contratar este perfil
                  </Text>
                </View>
              )}
            </View>

            {availableGames.length > 0 && profile.earlyAccessBonus && (
              <View style={styles.gameSection}>
                <Text style={[styles.effectsTitle, { color: colors.mutedForeground }]}>ACESSO ANTECIPADO (OPCIONAL)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                  <TouchableOpacity
                    style={[styles.gameChip, {
                      backgroundColor: !selectedGameId ? "#4DA6FF22" : colors.background,
                      borderColor:     !selectedGameId ? "#4DA6FF"   : colors.border,
                    }]}
                    onPress={() => setSelectedGameId(undefined)}
                  >
                    <Text style={[styles.gameChipText, { color: !selectedGameId ? "#4DA6FF" : colors.mutedForeground }]}>Sem jogo</Text>
                  </TouchableOpacity>
                  {availableGames.map((g) => (
                    <TouchableOpacity
                      key={g.id}
                      style={[styles.gameChip, {
                        backgroundColor: selectedGameId === g.id ? "#4DA6FF22" : colors.background,
                        borderColor:     selectedGameId === g.id ? "#4DA6FF"   : colors.border,
                      }]}
                      onPress={() => setSelectedGameId(g.id)}
                    >
                      <Text style={[styles.gameChipText, { color: selectedGameId === g.id ? "#4DA6FF" : colors.mutedForeground }]}>
                        🎮 {g.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            <View style={{ height: 4 }} />
          </ScrollView>

          <View style={[styles.hireFooter, { borderTopColor: colors.border }]}>
            <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={onClose}>
              <Text style={[styles.cancelBtnText, { color: colors.mutedForeground }]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmHireBtn, { backgroundColor: canAfford ? profile.riskColor : "#6B7280", opacity: canAfford ? 1 : 0.5 }]}
              disabled={!canAfford}
              onPress={() => onConfirm(selectedGameId)}
            >
              <Feather name="user-check" size={15} color="#fff" />
              <Text style={styles.confirmHireBtnText}>
                {canAfford ? `Contratar — ${formatMoney(profile.cost)}` : `Sem fundos — ${formatMoney(profile.cost)}`}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── EffectChip ───────────────────────────────────────────────────────────────
function EffectChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.effectChip, { backgroundColor: color + "18", borderColor: color + "44" }]}>
      <Text style={[styles.effectChipValue, { color }]}>{value}</Text>
      <Text style={[styles.effectChipLabel, { color: color + "BB" }]}>{label}</Text>
    </View>
  );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────
const TAB_DEFS: { id: MarketingTab; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { id: "campanhas",      label: "Campanhas",     icon: "volume-2" },
  { id: "influenciadores", label: "Influência",    icon: "users" },
  { id: "estrategia",    label: "Estratégia",    icon: "target" },
];

function MarketingTabBar({
  active, onChange, colors,
}: { active: MarketingTab; onChange: (t: MarketingTab) => void; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.tabBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {TAB_DEFS.map((t) => {
        const isActive = active === t.id;
        return (
          <TouchableOpacity
            key={t.id}
            style={[styles.tabBtn, isActive && { backgroundColor: "#4DA6FF22", borderColor: "#4DA6FF55" }]}
            onPress={() => onChange(t.id)}
            activeOpacity={0.8}
          >
            <Feather name={t.icon} size={14} color={isActive ? "#4DA6FF" : colors.mutedForeground} />
            <Text style={[styles.tabLabel, { color: isActive ? "#4DA6FF" : colors.mutedForeground }]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Estratégia Tab ───────────────────────────────────────────────────────────
function EstrategiaTab({
  positioning, posMonthsLeft,
  campaignFocus, focusMonthsLeft,
  totalActive,
  onSetStrategyOption, onClearStrategyOption,
  colors,
}: {
  positioning: string | null;
  posMonthsLeft: number;
  campaignFocus: string | null;
  focusMonthsLeft: number;
  totalActive: number;
  onSetStrategyOption: (id: string, category: StrategyCategory) => string | null;
  onClearStrategyOption: (category: StrategyCategory) => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={{ gap: 20 }}>

      {/* Intro card */}
      <View style={[styles.stratIntroCard, { backgroundColor: "#4DA6FF0A", borderColor: "#4DA6FF33" }]}>
        <LinearGradient colors={["#4DA6FF12", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={[styles.stratIntroIcon, { backgroundColor: "#4DA6FF22" }]}>
            <Feather name="target" size={18} color="#4DA6FF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.stratIntroTitle, { color: "#4DA6FF" }]}>ESTRATÉGIA DE MARKETING</Text>
            <Text style={[styles.stratIntroSub, { color: colors.mutedForeground }]}>
              Configure o posicionamento e foco das campanhas para decisões mais direcionadas.
            </Text>
          </View>
        </View>
        {(positioning || campaignFocus) && (
          <View style={[styles.activeStratSummary, { backgroundColor: "#4DA6FF18", borderColor: "#4DA6FF44" }]}>
            {positioning && (
              <View style={styles.summaryRow}>
                <Feather name="check-circle" size={12} color="#10B981" />
                <Text style={[styles.summaryText, { color: "#10B981" }]}>
                  Posicionamento: {POSITIONING_OPTIONS.find(p => p.id === positioning)?.label}
                </Text>
              </View>
            )}
            {campaignFocus && (
              <View style={styles.summaryRow}>
                <Feather name="check-circle" size={12} color="#10B981" />
                <Text style={[styles.summaryText, { color: "#10B981" }]}>
                  Foco: {FOCUS_OPTIONS.find(f => f.id === campaignFocus)?.label}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Section 1: Posicionamento de Marca */}
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={[styles.stratSectionLabel, { color: colors.mutedForeground }]}>POSICIONAMENTO DE MARCA</Text>
          {positioning && (
            <TouchableOpacity onPress={() => onClearStrategyOption("positioning")}>
              <Text style={{ fontSize: 10, color: "#FF4D6A", fontFamily: "Inter_600SemiBold" }}>Limpar</Text>
            </TouchableOpacity>
          )}
          {positioning && posMonthsLeft > 0 && (
            <Text style={{ fontSize: 10, color: "#9CA3AF", fontFamily: "Inter_400Regular", marginLeft: "auto" as any }}>
              {posMonthsLeft}m restantes
            </Text>
          )}
        </View>
        <Text style={[styles.stratSectionHint, { color: colors.mutedForeground }]}>
          Define como a marca é percebida pelo mercado. Ativa por 2 anos (24 meses).
        </Text>

        <View style={styles.posGrid}>
          {POSITIONING_OPTIONS.map((opt) => {
            const isActive = positioning === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.posCard, {
                  backgroundColor: isActive ? opt.color + "15" : colors.card,
                  borderColor:     isActive ? opt.color        : colors.border,
                  borderWidth:     isActive ? 2 : 1,
                }]}
                onPress={() => {
                  if (isActive) { onClearStrategyOption("positioning"); return; }
                  const err = onSetStrategyOption(opt.id, "positioning");
                  if (err) Alert.alert("Limite atingido", err);
                }}
                activeOpacity={0.85}
              >
                {isActive && (
                  <LinearGradient colors={[opt.color + "20", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                )}
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={[styles.posIconBox, { backgroundColor: opt.color + "22" }]}>
                    <Feather name={opt.icon} size={16} color={opt.color} />
                  </View>
                  {isActive && (
                    <View style={[styles.posActiveBadge, { backgroundColor: opt.color + "22" }]}>
                      <Feather name="check" size={10} color={opt.color} />
                      <Text style={[styles.posActiveBadgeText, { color: opt.color }]}>Ativo</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.posLabel, { color: isActive ? opt.color : colors.foreground }]}>{opt.label}</Text>
                <Text style={[styles.posDesc, { color: colors.mutedForeground }]} numberOfLines={2}>{opt.description}</Text>
                <View style={{ gap: 3, marginTop: 6 }}>
                  {opt.effects.map((e, i) => (
                    <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                      <View style={[styles.effectDot, { backgroundColor: i === 0 ? opt.color : "#FF4D6A66" }]} />
                      <Text style={[styles.posEffectText, { color: i === 0 ? opt.color : "#FF4D6A" }]}>{e}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Divider */}
      <View style={[styles.stratDivider, { backgroundColor: colors.border }]} />

      {/* Section 2: Foco de Campanha */}
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={[styles.stratSectionLabel, { color: colors.mutedForeground }]}>FOCO DE CAMPANHA</Text>
          {campaignFocus && (
            <TouchableOpacity onPress={() => onClearStrategyOption("focus")}>
              <Text style={{ fontSize: 10, color: "#FF4D6A", fontFamily: "Inter_600SemiBold" }}>Limpar</Text>
            </TouchableOpacity>
          )}
          {campaignFocus && focusMonthsLeft > 0 && (
            <Text style={{ fontSize: 10, color: "#9CA3AF", fontFamily: "Inter_400Regular", marginLeft: "auto" as any }}>
              {focusMonthsLeft}m restantes
            </Text>
          )}
        </View>
        <Text style={[styles.stratSectionHint, { color: colors.mutedForeground }]}>
          Direciona o esforço antes de lançar campanhas. Ativa por 2 anos (24 meses).
        </Text>

        <View style={{ gap: 10 }}>
          {FOCUS_OPTIONS.map((opt) => {
            const isActive = campaignFocus === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.focusCard, {
                  backgroundColor: isActive ? opt.color + "12" : colors.card,
                  borderColor:     isActive ? opt.color        : colors.border,
                  borderWidth:     isActive ? 2 : 1,
                }]}
                onPress={() => {
                  if (isActive) { onClearStrategyOption("focus"); return; }
                  const err = onSetStrategyOption(opt.id, "focus");
                  if (err) Alert.alert("Limite atingido", err);
                }}
                activeOpacity={0.85}
              >
                {isActive && (
                  <LinearGradient colors={[opt.color + "18", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                )}
                <View style={styles.focusRow}>
                  <View style={[styles.focusIconBox, { backgroundColor: opt.color + "22" }]}>
                    <Feather name={opt.icon} size={18} color={opt.color} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Text style={[styles.focusLabel, { color: isActive ? opt.color : colors.foreground }]}>{opt.label}</Text>
                      {isActive && (
                        <View style={[styles.focusActiveBadge, { backgroundColor: opt.color + "22" }]}>
                          <Feather name="check" size={10} color={opt.color} />
                          <Text style={[styles.focusActiveBadgeText, { color: opt.color }]}>Ativo</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.focusDesc, { color: colors.mutedForeground }]}>{opt.description}</Text>
                  </View>
                </View>
                <View style={[styles.focusEffectsRow, { borderTopColor: colors.border }]}>
                  {opt.effects.map((e, i) => (
                    <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                      <View style={[styles.effectDot, { backgroundColor: i === 0 ? opt.color : "#FF4D6A66" }]} />
                      <Text style={[styles.focusEffectText, { color: i === 0 ? opt.color : "#FF4D6A" }]}>{e}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={{ height: 8 }} />
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function MarketingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state, launchMarketing, hireInfluencer, setStrategyOption, clearStrategyOption } = useGameplay();
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [activeTab, setActiveTab]         = useState<MarketingTab>("campanhas");
  const [hiringProfile, setHiringProfile] = useState<InfluencerType | null>(null);

  if (!state) return null;

  const stratOptions    = state.activeStrategyOptions ?? [];
  const posOpt          = stratOptions.find((o) => o.category === "positioning");
  const focusOpt        = stratOptions.find((o) => o.category === "focus");
  const positioning     = posOpt?.id ?? null;
  const campaignFocus   = focusOpt?.id ?? null;
  const currentMonthIdx = state.year * 12 + state.month;
  const posMonthsLeft   = posOpt  ? Math.max(0, posOpt.endMonthIdx  - currentMonthIdx) : 0;
  const focusMonthsLeft = focusOpt ? Math.max(0, focusOpt.endMonthIdx - currentMonthIdx) : 0;
  const totalActive     = stratOptions.length;

  const handleLaunch = (campaign: CampaignDef) => {
    const cost = MARKETING_COSTS[campaign.tier];
    if (state.money < cost) {
      Alert.alert("Saldo Insuficiente", `Esta campanha custa ${formatMoney(cost)}.`);
      return;
    }
    const projection = computeStrategyProjection(positioning, campaignFocus, MARKETING_SALES_BOOST[campaign.tier]);
    const stratNote  = projection ? `\n\nAjuste estratégico: ${projection.value}` : "";

    if (state.activeMarketing !== "none") {
      Alert.alert(
        "Substituir Campanha?",
        `Já existe uma campanha ativa (${Math.round(state.marketingMonthsLeft ?? 0)} meses restantes). Substituir por "${campaign.name}"?${stratNote}`,
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Substituir", onPress: () => launchMarketing(campaign.tier) },
        ]
      );
    } else {
      Alert.alert(
        `Lançar "${campaign.name}"?`,
        `Custo: ${formatMoney(cost)}\nDuração: ${MARKETING_DURATION[campaign.tier]} meses${stratNote}`,
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Confirmar", onPress: () => launchMarketing(campaign.tier) },
        ]
      );
    }
  };

  const handleHireConfirm = (gameProjectId?: string) => {
    if (!hiringProfile) return;
    const err = hireInfluencer(hiringProfile, gameProjectId);
    setHiringProfile(null);
    if (err) Alert.alert("Não foi possível contratar", err);
  };

  const availableGames = (state.gameProjects ?? [])
    .filter((g) => g.phase === "development" || g.phase === "qa" || g.phase === "released")
    .map((g) => ({ id: g.id, name: g.name }));

  const activeHired = state.hiredInfluencers ?? [];
  const projection  = computeStrategyProjection(positioning, campaignFocus, 1);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GridBackground />
      <ScreenHeader title="Marketing" />

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 24 }]} showsVerticalScrollIndicator={false}>

        {/* Active Campaign banner (always visible) */}
        {state.activeMarketing !== "none" ? (
          <View style={[styles.activeCard, { backgroundColor: "#4DA6FF11", borderColor: "#4DA6FF44" }]}>
            <LinearGradient colors={["#4DA6FF15", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <View style={styles.activeHeader}>
              <View style={[styles.activeIcon, { backgroundColor: "#4DA6FF22" }]}>
                <Feather name="radio" size={20} color="#4DA6FF" />
              </View>
              <View style={styles.activeMeta}>
                <Text style={[styles.activeTitle, { color: "#4DA6FF" }]}>Campanha Ativa</Text>
                <Text style={[styles.activeName, { color: "#fff" }]}>
                  {CAMPAIGNS.find((c) => c.tier === state.activeMarketing)?.name ?? state.activeMarketing}
                </Text>
              </View>
              <View style={[styles.activeBadge, { backgroundColor: "#4DA6FF22" }]}>
                <Text style={[styles.activeBadgeText, { color: "#4DA6FF" }]}>
                  {Math.round(state.marketingMonthsLeft ?? 0)}m
                </Text>
              </View>
            </View>
            <View style={[styles.activeProgress, { backgroundColor: "#1E3A5F" }]}>
              <View style={[styles.activeProgressFill, {
                width: `${(state.marketingMonthsLeft / MARKETING_DURATION[state.activeMarketing]) * 100}%`,
                backgroundColor: "#4DA6FF",
              }]} />
            </View>
            <Text style={[styles.activeBoost, { color: "#4DA6FF" }]}>
              +{Math.round((MARKETING_SALES_BOOST[state.activeMarketing] - 1) * 100)}% de boost nas vendas
            </Text>
            {projection && (
              <View style={[styles.projectionRow, { borderTopColor: "#4DA6FF33" }]}>
                <Feather name="sliders" size={11} color="#4DA6FF88" />
                <Text style={[styles.projectionText, { color: "#4DA6FF88" }]}>
                  {projection.label}: {projection.value}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.noCampaign, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="volume-x" size={24} color={colors.mutedForeground} />
            <Text style={[styles.noCampaignText, { color: colors.mutedForeground }]}>
              Nenhuma campanha ativa. Inicie uma para boostar suas vendas!
            </Text>
          </View>
        )}

        {/* Office bonus */}
        {state.offices.marketing > 0 && (
          <View style={[styles.bonusRow, { backgroundColor: "#F5A62311", borderColor: "#F5A62333" }]}>
            <Feather name="briefcase" size={14} color="#F5A623" />
            <Text style={[styles.bonusText, { color: "#F5A623" }]}>
              Escritório de Marketing Lv{state.offices.marketing}: +{state.offices.marketing * 12}% eficiência
            </Text>
          </View>
        )}

        {/* Tab bar */}
        <MarketingTabBar active={activeTab} onChange={setActiveTab} colors={colors} />

        {/* ── CAMPANHAS TAB ──────────────────────────────────────────────── */}
        {activeTab === "campanhas" && (
          <View style={{ gap: 14 }}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CAMPANHAS DISPONÍVEIS</Text>
            {CAMPAIGNS.map((c) => {
              const isActive  = state.activeMarketing === c.tier;
              const canAfford = state.money >= MARKETING_COSTS[c.tier];
              const proj      = computeStrategyProjection(positioning, campaignFocus, MARKETING_SALES_BOOST[c.tier]);
              return (
                <View key={c.tier} style={[styles.campaignCard, {
                  backgroundColor: isActive ? c.color + "11" : colors.card,
                  borderColor: isActive ? c.color : colors.border,
                }]}>
                  <LinearGradient colors={[c.color + "10", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                  <View style={styles.campaignHeader}>
                    <View style={[styles.campaignIcon, { backgroundColor: c.color + "22" }]}>
                      <Feather name={c.icon} size={22} color={c.color} />
                    </View>
                    <View style={styles.campaignMeta}>
                      <Text style={[styles.campaignName, { color: colors.foreground }]}>{c.name}</Text>
                      <Text style={[styles.campaignDesc, { color: colors.mutedForeground }]}>{c.desc}</Text>
                    </View>
                    {isActive && (
                      <View style={[styles.activeTag, { backgroundColor: c.color + "22" }]}>
                        <Text style={[styles.activeTagText, { color: c.color }]}>Ativa</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.details}>
                    {c.details.map((d, i) => (
                      <View key={i} style={styles.detailRow}>
                        <View style={[styles.detailDot, { backgroundColor: c.color }]} />
                        <Text style={[styles.detailText, { color: colors.mutedForeground }]}>{d}</Text>
                      </View>
                    ))}
                  </View>
                  {proj && (
                    <View style={[styles.campaignProjRow, { borderTopColor: colors.border }]}>
                      <Feather name="sliders" size={11} color={c.color + "99"} />
                      <Text style={[styles.campaignProjText, { color: c.color + "99" }]}>
                        Estratégia: {proj.value}
                      </Text>
                    </View>
                  )}
                  <View style={styles.campaignFooter}>
                    <View>
                      <Text style={[styles.footerCost, { color: c.color }]}>{formatMoney(MARKETING_COSTS[c.tier])}</Text>
                      <Text style={[styles.footerDur, { color: colors.mutedForeground }]}>{MARKETING_DURATION[c.tier]} meses</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleLaunch(c)}
                      disabled={!canAfford}
                      activeOpacity={0.85}
                      style={[styles.launchBtn, { backgroundColor: c.color, opacity: canAfford ? 1 : 0.4 }]}
                    >
                      <Feather name="play" size={14} color="#fff" />
                      <Text style={styles.launchBtnText}>{isActive ? "Renovar" : "Lançar"}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── INFLUENCIADORES TAB ────────────────────────────────────────── */}
        {activeTab === "influenciadores" && (
          <View style={{ gap: 14 }}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>INFLUENCIADORES</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.mutedForeground }]}>
              Contrata criadores de conteúdo para amplificar produtos e proteger a reputação em crises.
            </Text>

            {activeHired.length > 0 && (
              <View style={[styles.activeHiredBox, { backgroundColor: "#4DA6FF08", borderColor: "#4DA6FF33" }]}>
                <Text style={[styles.activeHiredTitle, { color: "#4DA6FF" }]}>🎙 Campanhas Ativas</Text>
                {activeHired.map((hi) => {
                  const p = INFLUENCER_PROFILES.find((x) => x.id === hi.profileId);
                  return (
                    <View key={hi.profileId} style={[styles.activeHiredRow, { borderColor: colors.border }]}>
                      <Text style={{ fontSize: 20 }}>{p?.emoji ?? "⭐"}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.activeHiredName, { color: colors.foreground }]}>{hi.name}</Text>
                        <Text style={[styles.activeHiredMeta, { color: colors.mutedForeground }]}>
                          {p?.label} · {hi.monthsLeft}m restantes · {hi.totalFansDelivered.toLocaleString()} fãs entregues
                        </Text>
                        {hi.linkedGameId && (
                          <Text style={{ fontSize: 10, color: "#4DA6FF", marginTop: 2 }}>
                            🎮 Acesso antecipado: {(state.gameProjects ?? []).find((g) => g.id === hi.linkedGameId)?.name ?? "—"}
                          </Text>
                        )}
                      </View>
                      <View style={[styles.monthsLeftBadge, { backgroundColor: "#4DA6FF22" }]}>
                        <Text style={{ fontSize: 12, color: "#4DA6FF", fontWeight: "700" }}>{hi.monthsLeft}m</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            <View style={styles.influencerGrid}>
              {INFLUENCER_PROFILES.map((profile) => {
                const cooldown      = getInfluencerCooldownLeft(profile.id, state.hiredInfluencers ?? [], state.year, state.month);
                const alreadyActive = activeHired.some((h) => h.profileId === profile.id);
                const canAfford     = state.money >= profile.cost;
                const isDisabled    = alreadyActive || cooldown > 0;

                return (
                  <TouchableOpacity
                    key={profile.id}
                    style={[
                      styles.influencerCard,
                      {
                        backgroundColor: alreadyActive ? profile.riskColor + "15" : colors.card,
                        borderColor:     alreadyActive ? profile.riskColor : colors.border,
                        opacity:         isDisabled ? 0.65 : 1,
                      },
                    ]}
                    onPress={() => !isDisabled && setHiringProfile(profile.id)}
                    activeOpacity={isDisabled ? 1 : 0.85}
                  >
                    <View style={styles.infCardTop}>
                      <Text style={styles.infEmoji}>{profile.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.infLabel, { color: colors.foreground }]}>{profile.label}</Text>
                        <Text style={[styles.infAudience, { color: colors.mutedForeground }]}>{profile.audience}</Text>
                      </View>
                      <View style={[styles.infRiskBadge, { backgroundColor: profile.riskColor + "22", borderColor: profile.riskColor + "66" }]}>
                        <Text style={[styles.infRiskText, { color: profile.riskColor }]}>{profile.riskTag}</Text>
                      </View>
                    </View>
                    <Text style={[styles.infDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                      {profile.description}
                    </Text>
                    <View style={styles.infEffectsRow}>
                      <View style={[styles.infEffectChip, { backgroundColor: "#4DA6FF18" }]}>
                        <Text style={{ fontSize: 11, color: "#4DA6FF", fontWeight: "700" }}>
                          +{profile.fanBonus.toLocaleString()} fãs
                        </Text>
                      </View>
                      <View style={[styles.infEffectChip, { backgroundColor: "#10B98118" }]}>
                        <Text style={{ fontSize: 11, color: "#10B981", fontWeight: "700" }}>
                          Rep +{profile.repBonus}
                        </Text>
                      </View>
                      <View style={[styles.infEffectChip, { backgroundColor: "#6B728018" }]}>
                        <Text style={{ fontSize: 11, color: "#9CA3AF", fontWeight: "700" }}>
                          {profile.durationMonths}m
                        </Text>
                      </View>
                    </View>
                    <View style={styles.infFooter}>
                      <Text style={[styles.infCost, { color: canAfford ? profile.riskColor : "#6B7280" }]}>
                        {formatMoney(profile.cost)}
                      </Text>
                      {alreadyActive ? (
                        <View style={[styles.infStatusBadge, { backgroundColor: profile.riskColor + "22" }]}>
                          <Text style={[styles.infStatusText, { color: profile.riskColor }]}>✓ Ativo</Text>
                        </View>
                      ) : cooldown > 0 ? (
                        <View style={[styles.infStatusBadge, { backgroundColor: "#6B728022" }]}>
                          <Text style={[styles.infStatusText, { color: "#9CA3AF" }]}>⏳ {cooldown}m</Text>
                        </View>
                      ) : (
                        <View style={[styles.infStatusBadge, { backgroundColor: profile.riskColor + "22" }]}>
                          <Text style={[styles.infStatusText, { color: profile.riskColor }]}>Contratar</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ── ESTRATÉGIA TAB ─────────────────────────────────────────────── */}
        {activeTab === "estrategia" && (
          <EstrategiaTab
            positioning={positioning}     posMonthsLeft={posMonthsLeft}
            campaignFocus={campaignFocus} focusMonthsLeft={focusMonthsLeft}
            totalActive={totalActive}
            onSetStrategyOption={setStrategyOption}
            onClearStrategyOption={clearStrategyOption}
            colors={colors}
          />
        )}

        <View style={{ height: 8 }} />
      </ScrollView>

      {hiringProfile && (
        <InfluencerHireModal
          profileId={hiringProfile}
          onClose={() => setHiringProfile(null)}
          onConfirm={handleHireConfirm}
          availableGames={availableGames}
          canAfford={state.money >= (INFLUENCER_PROFILES.find((p) => p.id === hiringProfile)?.cost ?? 0)}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, gap: 14 },

  // Active campaign
  activeCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10, overflow: "hidden" },
  activeHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  activeIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  activeMeta: { flex: 1 },
  activeTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, textTransform: "uppercase" },
  activeName: { fontSize: 16, fontFamily: "Inter_700Bold", marginTop: 2 },
  activeBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  activeBadgeText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  activeProgress: { height: 4, borderRadius: 2, overflow: "hidden" },
  activeProgressFill: { height: 4, borderRadius: 2 },
  activeBoost: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  projectionRow: { flexDirection: "row", alignItems: "center", gap: 5, paddingTop: 6, borderTopWidth: 1 },
  projectionText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  noCampaign: { borderRadius: 14, borderWidth: 1, padding: 20, alignItems: "center", gap: 10 },
  noCampaignText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  bonusRow: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10, borderWidth: 1 },
  bonusText: { flex: 1, fontSize: 12, fontFamily: "Inter_500Medium" },

  // Tab bar
  tabBar: { flexDirection: "row", borderRadius: 12, borderWidth: 1, padding: 4, gap: 4 },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 8, borderRadius: 9, borderWidth: 1, borderColor: "transparent" },
  tabLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold" },

  // Campaign cards
  sectionLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, textTransform: "uppercase" },
  sectionSubtitle: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18, marginTop: -6 },
  campaignCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12, overflow: "hidden" },
  campaignHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  campaignIcon: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  campaignMeta: { flex: 1 },
  campaignName: { fontSize: 16, fontFamily: "Inter_700Bold" },
  campaignDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  activeTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  activeTagText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  details: { gap: 6 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  detailDot: { width: 5, height: 5, borderRadius: 3 },
  detailText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  campaignProjRow: { flexDirection: "row", alignItems: "center", gap: 5, paddingTop: 8, borderTopWidth: 1 },
  campaignProjText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  campaignFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  footerCost: { fontSize: 18, fontFamily: "Inter_700Bold" },
  footerDur: { fontSize: 11, fontFamily: "Inter_400Regular" },
  launchBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  launchBtnText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#fff" },

  // Influencer section
  influencerGrid: { gap: 10 },
  influencerCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  infCardTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  infEmoji: { fontSize: 24 },
  infLabel: { fontSize: 14, fontFamily: "Inter_700Bold" },
  infAudience: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  infRiskBadge: { borderWidth: 1, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3 },
  infRiskText: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  infDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  infEffectsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  infEffectChip: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 6 },
  infFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 6 },
  infCost: { fontSize: 18, fontFamily: "Inter_700Bold" },
  infStatusBadge: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  infStatusText: { fontSize: 12, fontFamily: "Inter_700Bold" },

  // Active hired influencers
  activeHiredBox: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 10 },
  activeHiredTitle: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.8, textTransform: "uppercase" },
  activeHiredRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingTop: 10, borderTopWidth: 1 },
  activeHiredName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  activeHiredMeta: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  monthsLeftBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "#00000088", justifyContent: "flex-end" },
  hireModal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 2, padding: 24, gap: 16, maxHeight: "88%" },
  hireHeader: { flexDirection: "row", alignItems: "center", gap: 12, paddingBottom: 16, borderBottomWidth: 1 },
  hireEmoji: { fontSize: 36 },
  hireTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  hireAudience: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  riskBadge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  riskBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  hireDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  effectsBox: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  effectsTitle: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, textTransform: "uppercase" },
  effectsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  effectChip: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, alignItems: "center", minWidth: 60 },
  effectChipValue: { fontSize: 14, fontFamily: "Inter_700Bold" },
  effectChipLabel: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 1 },
  earlyAccessRow: { borderRadius: 8, borderWidth: 1, padding: 10 },
  gameSection: { gap: 4 },
  gameChip: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, marginRight: 8 },
  gameChipText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  hireFooter: { flexDirection: "row", gap: 10, paddingTop: 16, borderTopWidth: 1 },
  cancelBtn: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  cancelBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  confirmHireBtn: { flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, paddingVertical: 13 },
  confirmHireBtnText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#fff" },

  // Estratégia tab
  stratIntroCard: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 12, overflow: "hidden" },
  stratIntroIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  stratIntroTitle: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.8, textTransform: "uppercase" },
  stratIntroSub: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18, marginTop: 2 },
  activeStratSummary: { borderRadius: 10, borderWidth: 1, padding: 10, gap: 5 },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  summaryText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  stratSectionLabel: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.8, textTransform: "uppercase" },
  stratSectionHint: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17, marginTop: -2 },
  stratDivider: { height: 1 },

  // Positioning grid
  posGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  posCard: { width: "47%", borderRadius: 14, padding: 12, gap: 6, overflow: "hidden", minHeight: 130 },
  posIconBox: { width: 32, height: 32, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  posActiveBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  posActiveBadgeText: { fontSize: 9, fontFamily: "Inter_700Bold" },
  posLabel: { fontSize: 13, fontFamily: "Inter_700Bold", marginTop: 2 },
  posDesc: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16 },
  posEffectText: { fontSize: 10, fontFamily: "Inter_500Medium" },
  effectDot: { width: 5, height: 5, borderRadius: 3 },

  // Focus cards
  focusCard: { borderRadius: 14, padding: 14, gap: 10, overflow: "hidden" },
  focusRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  focusIconBox: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  focusLabel: { fontSize: 15, fontFamily: "Inter_700Bold" },
  focusDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  focusActiveBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  focusActiveBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  focusEffectsRow: { flexDirection: "row", gap: 16, paddingTop: 8, borderTopWidth: 1 },
  focusEffectText: { fontSize: 11, fontFamily: "Inter_500Medium" },
});
