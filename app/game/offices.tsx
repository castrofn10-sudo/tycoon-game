import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Platform, Modal, Pressable, Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useGameplay } from "@/context/GameplayContext";
import { GridBackground } from "@/components/GridBackground";
import { ScreenHeader } from "@/components/ScreenHeader";
import { formatMoney, safeN } from "@/constants/gameEconomics";
import {
  TOTAL_SHARES,
  PERSONALITY_COLORS,
  PERSONALITY_LABELS,
  PERSONALITY_ICONS,
  detectInvestorConflicts,
  getMaxConflictLevel,
  getConflictNegotiationCost,
} from "@/constants/stockMarket";
import type { ActiveGameState, LegalContract, LegalTierId } from "@/constants/gameEngine";
import { LEGAL_CONTRACT_DURATIONS } from "@/constants/gameEngine";
import {
  OfficeSectorId,
  ALL_OFFICE_SECTORS,
  OFFICE_SECTOR_NAMES,
  OFFICE_SECTOR_COLORS,
  OFFICE_PHASES,
  getOfficeUpgradeCost,
  getOfficeMonthlyMaintenance,
  getOfficeSectorBonus,
  getUpgradeLabel,
  getAvailablePhase,
  OFFICE_MAX_UPGRADES,
  OFFICE_SECTOR_TAGLINES,
  getSectorImpactLines,
  getNextMilestoneInfo,
  getCurrentMilestoneLabel,
  OFFICE_PHASE_BENEFITS,
  OfficeFocusMode,
  OFFICE_FOCUS_CONFIGS,
} from "@/constants/officeSystem";

// ─── Sector icons ────────────────────────────────────────────────────────────
const SECTOR_ICONS: Record<OfficeSectorId, keyof typeof Feather.glyphMap> = {
  design:       "pen-tool",
  tech:         "cpu",
  marketing:    "volume-2",
  admin:        "briefcase",
  security:     "shield",
  executive:    "star",
  research_lab: "book-open",
  testing:      "check-circle",
};

// ─── Executive panel data ─────────────────────────────────────────────────────

type ExecSection  = "juridico" | "acionistas" | "holdings";
type ScreenTab    = "escritorios" | "executivo";

const LEGAL_TIERS: {
  id: LegalTierId; name: string; monthlyCost: number; protection: number;
  description: string; color: string; icon: keyof typeof Feather.glyphMap;
  perks: string[];
}[] = [
  {
    id: "basico", name: "Jurídico Básico", monthlyCost: 25_000, protection: 20,
    icon: "shield", color: "#10B981",
    description: "Cobertura jurídica essencial. Reduz o impacto de eventos negativos e protege contra fake news.",
    perks: ["~20% redução em impacto negativo", "Resposta lenta a crises", "Proteção contra eventos menores"],
  },
  {
    id: "profissional", name: "Jurídico Profissional", monthlyCost: 75_000, protection: 40,
    icon: "briefcase", color: "#F5A623",
    description: "Equipe especializada com experiência corporativa. Resposta ágil e mitigação robusta.",
    perks: ["~40% redução em impacto negativo", "Tempo de resposta médio", "Atenua perda de reputação em crises"],
  },
  {
    id: "elite", name: "Jurídico Elite", monthlyCost: 150_000, protection: 70,
    icon: "star", color: "#A855F7",
    description: "Escritório de topo com acesso a especialistas globais. Resposta rápida e recuperação ativa.",
    perks: ["~70% redução em impacto negativo", "Resposta rápida a crises", "Pequena recuperação de reputação passiva"],
  },
];

const SHAREHOLDER_DECISIONS: {
  id: string; label: string; description: string;
  icon: keyof typeof Feather.glyphMap; color: string; outcome: string; risk?: string;
}[] = [
  {
    id: "dividends", label: "Distribuir Dividendos",
    description: "Distribui parte dos lucros aos acionistas. Melhora satisfação, reduz caixa.",
    icon: "dollar-sign", color: "#10B981",
    outcome: "+2 reputação, -$500K imediato",
  },
  {
    id: "reinvest", label: "Reinvestir Lucros",
    description: "Mantém capital na empresa para crescimento futuro. Acionistas podem ficar impacientes.",
    icon: "trending-up", color: "#4DA6FF",
    outcome: "+1% eficiência futura, -1 satisfação no curto prazo",
  },
  {
    id: "promise", label: "Prometer Crescimento",
    description: "Apresenta projeções otimistas. Boost imediato de confiança com risco de penalidade.",
    icon: "bar-chart-2", color: "#F5A623",
    outcome: "+3 reputação imediato",
    risk: "Risco de penalidade se performance cair",
  },
];

const AVAILABLE_COMPANIES: {
  id: string; name: string; price: number; monthlyCost: number;
  effectLabel: string; tradeoff: string; description: string;
  icon: keyof typeof Feather.glyphMap; color: string;
  category: string; annualIncome?: number;
}[] = [
  // ── Existing holdings ──────────────────────────────────────────────────────
  {
    id: "investment_bank",
    name: "Banco Apex Capital",
    price: 6_000_000, monthlyCost: 120_000,
    effectLabel: "+$200K receita passiva por mês",
    tradeoff: "Custo fixo elevado — neutro em meses no azul, drena se lucratividade cair",
    description: "Braço financeiro que gera renda passiva consistente através de portfólios de investimento.",
    icon: "trending-up", color: "#10B981", category: "Banking",
  },
  {
    id: "law_firm",
    name: "Silva & Associados Jurídico",
    price: 2_000_000, monthlyCost: 70_000,
    effectLabel: "+2 reputação/mês enquanto há escândalos ativos",
    tradeoff: "Custo contínuo mesmo sem crises — zero efeito sem escândalos",
    description: "Equipe jurídica especializada que atenua ativamente escândalos em curso.",
    icon: "shield", color: "#A855F7", category: "Legal",
  },
  {
    id: "media_network",
    name: "Rede Pulse Comunicações",
    price: 2_500_000, monthlyCost: 55_000,
    effectLabel: "+2 reputação/mês durante campanhas de marketing ativas",
    tradeoff: "Sem efeito fora de campanhas — custo corre o tempo todo",
    description: "Rede de mídia própria que amplifica cobertura e reputação durante campanhas.",
    icon: "radio", color: "#F5A623", category: "Marketing",
  },
  {
    id: "ai_research_lab",
    name: "NeuralEdge AI Lab",
    price: 5_000_000, monthlyCost: 100_000,
    effectLabel: "Bug fix 2× mais rápido (2 meses reduzidos para 1)",
    tradeoff: "Alto custo mensal — inútil quando não há bugs ativos",
    description: "Laboratório de IA que acelera detecção e correção de bugs nos jogos.",
    icon: "cpu", color: "#4DA6FF", category: "Technology",
  },
  {
    id: "hardware_factory",
    name: "Fab Teknosfera Industrial",
    price: 4_000_000, monthlyCost: 90_000,
    effectLabel: "+8% progresso por mês em consoles em desenvolvimento",
    tradeoff: "Inútil sem consoles em desenvolvimento — custo fixo permanece",
    description: "Fábrica integrada que acelera prototipagem e montagem de hardware.",
    icon: "layers", color: "#F59E0B", category: "Manufacturing",
  },
  {
    id: "indie_incubator",
    name: "Viveiro Spark de Indies",
    price: 1_500_000, monthlyCost: 35_000,
    effectLabel: "15% chance/mês de hit viral: $80K–$250K + fãs",
    tradeoff: "Completamente imprevisível — pode não gerar nada por meses",
    description: "Incubadora de estúdios independentes com chance de lançar hits virais.",
    icon: "heart", color: "#EC4899", category: "Entertainment",
  },
  {
    id: "hedge_fund",
    name: "Fortis Capital Proteção",
    price: 8_000_000, monthlyCost: 180_000,
    effectLabel: "Cobre 25% dos prejuízos mensais (máx $500K)",
    tradeoff: "Em meses lucrativos $180K gastos sem benefício algum",
    description: "Fundo de hedge que amortece perdas em meses de crise financeira.",
    icon: "umbrella", color: "#06B6D4", category: "Banking",
  },
  {
    id: "crisis_firm",
    name: "RiskShield Gestão de Crises",
    price: 2_500_000, monthlyCost: 55_000,
    effectLabel: "Elimina penalidade de reputação por pressão do conselho",
    tradeoff: "Não evita notícias de crise — apenas bloqueia o dano à reputação",
    description: "Empresa especializada em gerenciar conflitos de governança e pressão de acionistas.",
    icon: "alert-circle", color: "#FF4D6A", category: "Security",
  },
  // ── New holdings ───────────────────────────────────────────────────────────
  {
    id: "apex_global_bank",
    name: "Apex Global Bank",
    price: 80_000_000, monthlyCost: 300_000,
    annualIncome: 5_000_000,
    effectLabel: "Receita anual: $5.000.000 (~$417K/mês)",
    tradeoff: "Alta exposição em crises econômicas globais — custo fixo elevado",
    description: "Banco global de investimentos com portfólio diversificado. Gera renda passiva consistente de grande porte.",
    icon: "dollar-sign", color: "#10B981", category: "Banking",
  },
  {
    id: "novacore_tech",
    name: "NovaCore Technologies",
    price: 40_000_000, monthlyCost: 150_000,
    effectLabel: "+1% qualidade de produto em todos os consoles",
    tradeoff: "Benefício pequeno mas permanente — custo elevado no curto prazo",
    description: "Empresa de tecnologia de ponta que eleva o padrão técnico de todos os produtos desenvolvidos.",
    icon: "monitor", color: "#4DA6FF", category: "Technology",
  },
  {
    id: "silicore_industries",
    name: "Silicore Industries",
    price: 60_000_000, monthlyCost: 200_000,
    effectLabel: "+1,5% velocidade de pesquisa e desenvolvimento",
    tradeoff: "Efeito acumulado é sutil — investimento elevado para retorno gradual",
    description: "Fabricante líder de chips de alto desempenho. Acelera ciclos de P&D em todos os projetos.",
    icon: "zap", color: "#F59E0B", category: "Chip Manufacturing",
  },
  {
    id: "shieldguard_insurance",
    name: "ShieldGuard Insurance",
    price: 30_000_000, monthlyCost: 100_000,
    effectLabel: "Reduz impacto de crises financeiras em 25%",
    tradeoff: "Sem efeito em cenários estáveis — custo contínuo independente de crises",
    description: "Seguradora corporativa de grande porte. Atenua perdas em eventos de crise e volatilidade econômica.",
    icon: "shield", color: "#A855F7", category: "Insurance",
  },
  {
    id: "pulse_marketing_group",
    name: "Pulse Marketing Group",
    price: 35_000_000, monthlyCost: 120_000,
    effectLabel: "+2% eficiência em todas as campanhas de marketing",
    tradeoff: "Benefício marginal — impacto mais visível em campanhas de alto volume",
    description: "Agência global de marketing estratégico. Amplifica o alcance e conversão de todas as campanhas.",
    icon: "bar-chart-2", color: "#F5A623", category: "Marketing",
  },
  {
    id: "ironwall_security",
    name: "IronWall Security",
    price: 25_000_000, monthlyCost: 80_000,
    effectLabel: "Proteção contra eventos de falência e colapso financeiro",
    tradeoff: "Efeito apenas em situações extremas — custo corre em período normal",
    description: "Empresa de segurança financeira corporativa. Activa protocolos automáticos em cenários de colapso.",
    icon: "lock", color: "#FF4D6A", category: "Security",
  },
];

const MAX_HOLDINGS = 4;
const SHAREHOLDER_COOLDOWN_MONTHS = 6;

// ─── Sub-components ───────────────────────────────────────────────────────────

function ExecSideMenu({
  active, onChange, colors,
}: {
  active: ExecSection;
  onChange: (s: ExecSection) => void;
  colors: ReturnType<typeof useColors>;
}) {
  const items: { id: ExecSection; label: string; icon: keyof typeof Feather.glyphMap; color: string }[] = [
    { id: "juridico",   label: "Jurídico",    icon: "shield",    color: "#A855F7" },
    { id: "acionistas", label: "Acionistas",  icon: "users",     color: "#4DA6FF" },
    { id: "holdings",   label: "Holdings",    icon: "briefcase", color: "#F5A623" },
  ];
  return (
    <View style={[execStyles.sideMenu, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {items.map((item) => {
        const isActive = active === item.id;
        return (
          <TouchableOpacity
            key={item.id}
            style={[execStyles.sideBtn, isActive && { backgroundColor: item.color + "20", borderColor: item.color }]}
            onPress={() => onChange(item.id)}
            activeOpacity={0.8}
          >
            <Feather name={item.icon} size={16} color={isActive ? item.color : colors.mutedForeground} />
            <Text style={[execStyles.sideBtnLabel, { color: isActive ? item.color : colors.mutedForeground }]}>
              {item.label}
            </Text>
            {isActive && <View style={[execStyles.sideActiveDot, { backgroundColor: item.color }]} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// Helper: compute months remaining on a contract
function contractMonthsLeft(contract: LegalContract, currentYear: number, currentMonth: number): number {
  const currentIdx = currentYear * 12 + currentMonth;
  return Math.max(0, contract.endMonthIdx - currentIdx);
}

function contractYearsMonthsLabel(monthsLeft: number): string {
  if (monthsLeft <= 0) return "Expirado";
  const y = Math.floor(monthsLeft / 12);
  const m = monthsLeft % 12;
  if (y > 0 && m > 0) return `${y} ano${y > 1 ? "s" : ""} e ${m} mês${m > 1 ? "es" : ""}`;
  if (y > 0) return `${y} ano${y > 1 ? "s" : ""}`;
  return `${m} mês${m > 1 ? "es" : ""}`;
}

// ─── Jurídico section ─────────────────────────────────────────────────────────
function JuridicoSection({
  legalContract, currentYear, currentMonth,
  hireLegalContract, cancelLegalContract, colors,
}: {
  legalContract: LegalContract | undefined;
  currentYear: number;
  currentMonth: number;
  hireLegalContract: (tierId: LegalTierId) => string | null;
  cancelLegalContract: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const [confirmTier, setConfirmTier] = useState<LegalTierId | null>(null);
  const [hireError, setHireError] = useState<string | null>(null);

  const currentMonthIdx = currentYear * 12 + currentMonth;
  const activeContract = legalContract && currentMonthIdx < legalContract.endMonthIdx ? legalContract : null;
  const activeTier = activeContract ? LEGAL_TIERS.find(t => t.id === activeContract.tierId) : null;
  const monthsLeft = activeContract ? contractMonthsLeft(activeContract, currentYear, currentMonth) : 0;

  const handleSelect = (id: LegalTierId) => {
    if (activeContract && activeContract.tierId === id) {
      Alert.alert(
        "Encerrar Contrato",
        "Deseja encerrar o contrato jurídico antecipadamente? A proteção será removida imediatamente.",
        [
          { text: "Não", style: "cancel" },
          { text: "Encerrar", style: "destructive", onPress: () => cancelLegalContract() },
        ]
      );
    } else if (activeContract) {
      Alert.alert(
        "Contrato Ativo",
        `Já existe um contrato com ${activeTier?.name ?? "uma equipe jurídica"} ativo por mais ${contractYearsMonthsLabel(monthsLeft)}. Aguarde o término ou encerre o contrato atual antes de contratar outra equipe.`,
        [{ text: "OK" }]
      );
    } else {
      setHireError(null);
      setConfirmTier(id);
    }
  };

  const confirmHire = () => {
    if (!confirmTier) return;
    const err = hireLegalContract(confirmTier);
    if (err) {
      setHireError(err);
    } else {
      setHireError(null);
    }
    setConfirmTier(null);
  };

  const totalDurationMonths = activeContract ? LEGAL_CONTRACT_DURATIONS[activeContract.tierId] : 0;
  const progressPct = totalDurationMonths > 0 ? Math.max(0, Math.min(1, monthsLeft / totalDurationMonths)) : 0;

  return (
    <View style={{ gap: 14 }}>
      {/* Intro */}
      <View style={[execStyles.introCard, { backgroundColor: "#A855F708", borderColor: "#A855F733" }]}>
        <LinearGradient colors={["#A855F714", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={[execStyles.introIcon, { backgroundColor: "#A855F722" }]}>
            <Feather name="shield" size={18} color="#A855F7" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[execStyles.introTitle, { color: "#A855F7" }]}>PROTEÇÃO JURÍDICA</Text>
            <Text style={[execStyles.introSub, { color: colors.mutedForeground }]}>
              Contrate uma equipe jurídica para proteção automática contra eventos negativos e crises de reputação.
            </Text>
          </View>
        </View>
        {activeTier && activeContract && (
          <View style={{ gap: 6, marginTop: 8 }}>
            <View style={[execStyles.activeIndicator, { backgroundColor: activeTier.color + "20", borderColor: activeTier.color + "55" }]}>
              <Feather name="check-circle" size={12} color={activeTier.color} />
              <Text style={[execStyles.activeIndicatorText, { color: activeTier.color }]}>
                {activeTier.name} ativo — {formatMoney(activeTier.monthlyCost)}/mês
              </Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Feather name="clock" size={12} color={colors.mutedForeground} />
              <Text style={[execStyles.activeIndicatorText, { color: colors.mutedForeground, fontSize: 11 }]}>
                Restam {contractYearsMonthsLabel(monthsLeft)} de contrato
              </Text>
            </View>
            {/* Progress bar */}
            <View style={{ height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: "hidden" }}>
              <View style={{ height: 4, borderRadius: 2, width: `${Math.round(progressPct * 100)}%`, backgroundColor: activeTier.color }} />
            </View>
          </View>
        )}
        {hireError && (
          <View style={{ marginTop: 8, padding: 8, backgroundColor: "#FF4D6A18", borderRadius: 6, borderWidth: 1, borderColor: "#FF4D6A44" }}>
            <Text style={{ color: "#FF4D6A", fontSize: 12 }}>{hireError}</Text>
          </View>
        )}
      </View>

      {/* Tier cards */}
      {LEGAL_TIERS.map((tier) => {
        const isActive = activeContract?.tierId === tier.id;
        const isBlocked = !isActive && activeContract != null;
        return (
          <TouchableOpacity
            key={tier.id}
            style={[execStyles.tierCard, {
              backgroundColor: isActive ? tier.color + "12" : isBlocked ? colors.card + "88" : colors.card,
              borderColor: isActive ? tier.color : colors.border,
              borderWidth: isActive ? 2 : 1,
              opacity: isBlocked ? 0.6 : 1,
            }]}
            onPress={() => handleSelect(tier.id)}
            activeOpacity={0.85}
          >
            {isActive && (
              <LinearGradient colors={[tier.color + "18", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            )}
            <View style={execStyles.tierHeader}>
              <View style={[execStyles.tierIcon, { backgroundColor: tier.color + "22" }]}>
                <Feather name={tier.icon} size={20} color={tier.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[execStyles.tierName, { color: isActive ? tier.color : colors.foreground }]}>{tier.name}</Text>
                <Text style={[execStyles.tierCost, { color: colors.mutedForeground }]}>{formatMoney(tier.monthlyCost)}/mês</Text>
              </View>
              {isActive ? (
                <View style={[execStyles.statusBadge, { backgroundColor: tier.color + "22", borderColor: tier.color + "66" }]}>
                  <Feather name="check" size={11} color={tier.color} />
                  <Text style={[execStyles.statusBadgeText, { color: tier.color }]}>Ativo</Text>
                </View>
              ) : (
                <View style={[execStyles.protBadge, { backgroundColor: tier.color + "15" }]}>
                  <Text style={[execStyles.protBadgeText, { color: tier.color }]}>-{tier.protection}%</Text>
                </View>
              )}
            </View>

            <Text style={[execStyles.tierDesc, { color: colors.mutedForeground }]}>{tier.description}</Text>

            <View style={{ gap: 5 }}>
              {tier.perks.map((perk, i) => (
                <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                  <View style={[execStyles.perkDot, { backgroundColor: tier.color }]} />
                  <Text style={[execStyles.perkText, { color: colors.mutedForeground }]}>{perk}</Text>
                </View>
              ))}
            </View>

            {!isActive && !isBlocked && (
              <View style={[execStyles.tierFooter, { borderTopColor: colors.border }]}>
                <TouchableOpacity
                  style={[execStyles.hireBtn, { backgroundColor: tier.color }]}
                  onPress={() => handleSelect(tier.id)}
                  activeOpacity={0.85}
                >
                  <Feather name="user-plus" size={14} color="#fff" />
                  <Text style={execStyles.hireBtnText}>Contratar</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        );
      })}

      {/* Confirm modal */}
      {confirmTier && (() => {
        const t = LEGAL_TIERS.find(x => x.id === confirmTier)!;
        const durationYears = LEGAL_CONTRACT_DURATIONS[t.id] / 12;
        return (
          <Modal transparent animationType="fade" visible statusBarTranslucent>
            <Pressable style={execStyles.overlay} onPress={() => setConfirmTier(null)}>
              <Pressable onPress={e => e.stopPropagation()}>
                <View style={[execStyles.modalBox, { backgroundColor: colors.card, borderColor: t.color }]}>
                  <LinearGradient colors={[t.color + "18", "transparent"]} style={StyleSheet.absoluteFill} />
                  <View style={[execStyles.modalIconBox, { backgroundColor: t.color + "22" }]}>
                    <Feather name={t.icon} size={28} color={t.color} />
                  </View>
                  <Text style={[execStyles.modalTitle, { color: colors.foreground }]}>Contratar Equipe Jurídica</Text>
                  <Text style={[execStyles.modalSub, { color: t.color }]}>{t.name}</Text>
                  <Text style={[execStyles.modalBody, { color: colors.mutedForeground }]}>{t.description}</Text>
                  <View style={[execStyles.modalCostRow, { borderColor: colors.border }]}>
                    <Text style={[execStyles.modalCostLabel, { color: colors.mutedForeground }]}>Custo mensal:</Text>
                    <Text style={[execStyles.modalCostValue, { color: "#F5A623" }]}>{formatMoney(t.monthlyCost)}</Text>
                  </View>
                  <View style={[execStyles.modalCostRow, { borderColor: colors.border }]}>
                    <Text style={[execStyles.modalCostLabel, { color: colors.mutedForeground }]}>Duração do contrato:</Text>
                    <Text style={[execStyles.modalCostValue, { color: t.color }]}>{durationYears} anos</Text>
                  </View>
                  <View style={execStyles.modalBtns}>
                    <TouchableOpacity style={[execStyles.modalCancel, { borderColor: colors.border }]} onPress={() => setConfirmTier(null)}>
                      <Text style={[execStyles.modalCancelText, { color: colors.mutedForeground }]}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[execStyles.modalConfirm, { backgroundColor: t.color }]} onPress={confirmHire}>
                      <Text style={execStyles.modalConfirmText}>Contratar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Pressable>
            </Pressable>
          </Modal>
        );
      })()}
    </View>
  );
}

// ─── Acionistas section ───────────────────────────────────────────────────────
function AcionistasSection({
  colors, state, shareholderMeetingDecision, negotiateGeoConflict,
}: {
  colors: ReturnType<typeof useColors>;
  state: ActiveGameState;
  shareholderMeetingDecision: (d: "dividends" | "reinvest" | "promise") => string | null;
  negotiateGeoConflict: () => string | null;
}) {
  const [meetingModal, setMeetingModal] = useState(false);
  const [outcome, setOutcome]           = useState<{ text: string; color: string } | null>(null);

  const investors     = state.investors ?? [];
  const playerShares  = state.playerShares ?? TOTAL_SHARES;
  const totalShares   = state.totalShares  ?? TOTAL_SHARES;
  const playerPct     = Math.round((playerShares / totalShares) * 100);
  const externalPct   = 100 - playerPct;
  const satisfaction  = state.shareholderSatisfaction ?? 70;
  const hasInvestors  = investors.length > 0;
  const conflictPairs = investors.length >= 2 ? detectInvestorConflicts(investors) : [];
  const conflictLevel = getMaxConflictLevel(conflictPairs);
  const conflictCost  = conflictLevel ? getConflictNegotiationCost(conflictLevel) : 0;
  const negotiationMonthsLeft = state.geoConflictNegotiationMonthsLeft ?? 0;
  const currentMonthIdx = state.year * 12 + state.month;
  const lastMeetingIdx  = state.lastShareholderMeetingMonthIdx ?? -999;
  const monthsSince     = currentMonthIdx - lastMeetingIdx;
  const canMeet         = hasInvestors && monthsSince >= SHAREHOLDER_COOLDOWN_MONTHS;
  const cooldownLeft    = Math.max(0, SHAREHOLDER_COOLDOWN_MONTHS - monthsSince);

  const satColor = satisfaction >= 70 ? "#10B981" : satisfaction >= 40 ? "#F5A623" : "#FF4D6A";

  const prevCompanyValue  = state.companyValue ?? 0;
  const investorOwnerPct  = externalPct / 100;
  const monthlyDividend   = prevCompanyValue > 0
    ? Math.round(prevCompanyValue * investorOwnerPct * (0.018 / 12))
    : 0;

  const handleDecision = (dec: "dividends" | "reinvest" | "promise") => {
    setMeetingModal(false);
    const err = shareholderMeetingDecision(dec);
    if (err) {
      Alert.alert("Reunião Bloqueada", err);
      return;
    }
    const resultMap: Record<string, { text: string; color: string }> = {
      dividends: { text: "Dividendos distribuídos! Satisfação +22 · Reputação +2", color: "#10B981" },
      reinvest:  { text: "Capital reinvestido. Acionistas registaram ligeira insatisfação no curto prazo.", color: "#4DA6FF" },
      promise:   { text: "Projeções otimistas apresentadas! Satisfação +15 · ⚠️ Cuidado se os lucros caírem.", color: "#F5A623" },
    };
    setOutcome(resultMap[dec]);
    setTimeout(() => setOutcome(null), 6000);
  };

  return (
    <View style={{ gap: 14 }}>
      {/* Header card */}
      <View style={[execStyles.introCard, { backgroundColor: "#4DA6FF08", borderColor: "#4DA6FF33" }]}>
        <LinearGradient colors={["#4DA6FF14", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={[execStyles.introIcon, { backgroundColor: "#4DA6FF22" }]}>
            <Feather name="users" size={18} color="#4DA6FF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[execStyles.introTitle, { color: "#4DA6FF" }]}>ACIONISTAS</Text>
            <Text style={[execStyles.introSub, { color: colors.mutedForeground }]}>
              {hasInvestors
                ? `${investors.length} acionista${investors.length !== 1 ? "s" : ""} externo${investors.length !== 1 ? "s" : ""} · ${externalPct}% da empresa`
                : "Sem acionistas externos — tens 100% do controlo"}
            </Text>
          </View>
        </View>
      </View>

      {/* No investors state */}
      {!hasInvestors && (
        <View style={[execStyles.decisionCard, { backgroundColor: colors.card, borderColor: colors.border, alignItems: "center", paddingVertical: 28, gap: 10 }]}>
          <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: "#4DA6FF15", alignItems: "center", justifyContent: "center" }}>
            <Feather name="lock" size={22} color="#4DA6FF88" />
          </View>
          <Text style={{ fontSize: 14, fontFamily: "Inter_700Bold", color: colors.foreground, textAlign: "center" }}>
            Sem Acionistas Externos
          </Text>
          <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground, textAlign: "center", maxWidth: 240 }}>
            Vende participações na tela de Finanças para obter capital e desbloquear reuniões com investidores.
          </Text>
        </View>
      )}

      {/* Satisfaction bar + stats (only when investors exist) */}
      {hasInvestors && (
        <>
          <View style={[execStyles.decisionCard, { backgroundColor: colors.card, borderColor: colors.border, gap: 12 }]}>
            {/* Satisfaction meter */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Feather name="heart" size={14} color={satColor} />
              <Text style={{ fontSize: 12, fontFamily: "Inter_700Bold", color: satColor, flex: 1 }}>
                SATISFAÇÃO DOS ACIONISTAS — {Math.round(satisfaction)}%
              </Text>
              {state.shareholderPromisePending && (
                <View style={{ backgroundColor: "#F5A62322", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                  <Text style={{ fontSize: 10, color: "#F5A623", fontFamily: "Inter_700Bold" }}>PROMESSA ATIVA ⚠️</Text>
                </View>
              )}
            </View>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: "hidden" }}>
              <View style={{ width: `${satisfaction}%`, height: "100%", borderRadius: 4, backgroundColor: satColor }} />
            </View>
            <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>
              {satisfaction >= 70
                ? "Os acionistas estão satisfeitos com a direção da empresa."
                : satisfaction >= 40
                ? "Satisfação moderada. Considera distribuir dividendos ou reinvestir."
                : "⚠️ Acionistas insatisfeitos — risco de saída ou pressão no conselho."}
            </Text>

            {/* Quick stats row */}
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={[acStyles.statChip, { backgroundColor: "#6B728022" }]}>
                <Feather name="percent" size={11} color={colors.mutedForeground} />
                <Text style={[acStyles.statChipText, { color: colors.foreground }]}>Controlo: {playerPct}%</Text>
              </View>
              {monthlyDividend > 0 && (
                <View style={[acStyles.statChip, { backgroundColor: "#FF4D6A15" }]}>
                  <Feather name="trending-down" size={11} color="#FF4D6A" />
                  <Text style={[acStyles.statChipText, { color: "#FF4D6A" }]}>{formatMoney(monthlyDividend)}/mês div.</Text>
                </View>
              )}
            </View>

            {/* Takeover warning */}
            {playerPct < 30 && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, padding: 8, borderRadius: 8, backgroundColor: "#FF4D6A12", borderWidth: 1, borderColor: "#FF4D6A44" }}>
                <Feather name="alert-triangle" size={14} color="#FF4D6A" />
                <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: "#FF4D6A", flex: 1 }}>
                  Controlo crítico ({playerPct}%). Vulnerável a aquisição hostil.
                </Text>
              </View>
            )}
          </View>

          {/* Investor list */}
          <Text style={[execStyles.subSectionLabel, { color: colors.mutedForeground }]}>ACIONISTAS ATUAIS</Text>
          {investors.map((inv) => {
            const pct   = Math.round((inv.sharesOwned / TOTAL_SHARES) * 100);
            const pColor = PERSONALITY_COLORS[inv.personality];
            const pIcon  = PERSONALITY_ICONS[inv.personality] as keyof typeof Feather.glyphMap;
            return (
              <View key={inv.id} style={[execStyles.decisionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: pColor + "20", alignItems: "center", justifyContent: "center" }}>
                    <Feather name={pIcon} size={16} color={pColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={{ fontSize: 13, fontFamily: "Inter_700Bold", color: colors.foreground }}>{inv.countryFlag} {inv.name}</Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                      <View style={{ backgroundColor: pColor + "22", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 }}>
                        <Text style={{ fontSize: 10, fontFamily: "Inter_700Bold", color: pColor }}>{PERSONALITY_LABELS[inv.personality]}</Text>
                      </View>
                      <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>{pct}% das ações</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontSize: 16, fontFamily: "Inter_700Bold", color: pColor }}>{pct}%</Text>
                    <Text style={{ fontSize: 10, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>{inv.sharesOwned.toLocaleString()} ações</Text>
                  </View>
                </View>
              </View>
            );
          })}

          {/* ── Geopolitical Conflict Card ──────────────────────────── */}
          {conflictLevel && (
            <View style={{
              borderRadius: 14, overflow: "hidden", borderWidth: 1,
              borderColor: conflictLevel === "high" ? "#FF4D6A55" : conflictLevel === "medium" ? "#F5A62355" : "#4DA6FF44",
              backgroundColor: conflictLevel === "high" ? "#FF4D6A0A" : conflictLevel === "medium" ? "#F5A6230A" : "#4DA6FF0A",
            }}>
              <LinearGradient
                colors={conflictLevel === "high" ? ["#FF4D6A14", "transparent"] : conflictLevel === "medium" ? ["#F5A62314", "transparent"] : ["#4DA6FF14", "transparent"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill}
              />
              <View style={{ padding: 14, gap: 10 }}>
                {/* Header */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View style={{
                    width: 34, height: 34, borderRadius: 9,
                    backgroundColor: conflictLevel === "high" ? "#FF4D6A20" : conflictLevel === "medium" ? "#F5A62320" : "#4DA6FF20",
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <Text style={{ fontSize: 16 }}>⚡</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontFamily: "Inter_700Bold", color: conflictLevel === "high" ? "#FF4D6A" : conflictLevel === "medium" ? "#F5A623" : "#4DA6FF" }}>
                      TENSÃO GEOPOLÍTICA
                    </Text>
                    <Text style={{ fontSize: 10, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>
                      {conflictLevel === "high" ? "Conflito severo entre acionistas" : conflictLevel === "medium" ? "Tensão moderada entre acionistas" : "Tensão leve entre acionistas"}
                    </Text>
                  </View>
                  <View style={{
                    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
                    backgroundColor: conflictLevel === "high" ? "#FF4D6A22" : conflictLevel === "medium" ? "#F5A62322" : "#4DA6FF22",
                  }}>
                    <Text style={{ fontSize: 10, fontFamily: "Inter_700Bold", color: conflictLevel === "high" ? "#FF4D6A" : conflictLevel === "medium" ? "#F5A623" : "#4DA6FF" }}>
                      {conflictLevel === "high" ? "SEVERO" : conflictLevel === "medium" ? "MÉDIO" : "BAIXO"}
                    </Text>
                  </View>
                </View>

                {/* Conflict pairs */}
                {conflictPairs.slice(0, 3).map((pair, i) => (
                  <View key={i} style={{
                    flexDirection: "row", alignItems: "center", gap: 8,
                    backgroundColor: colors.card + "88", borderRadius: 8, padding: 8,
                    borderWidth: 1, borderColor: colors.border,
                  }}>
                    <Text style={{ fontSize: 14 }}>{pair.flagA}</Text>
                    <Text style={{ fontSize: 11, fontFamily: "Inter_700Bold", color: colors.mutedForeground }}>vs</Text>
                    <Text style={{ fontSize: 14 }}>{pair.flagB}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: colors.foreground }}>
                        {pair.countryA} · {pair.countryB}
                      </Text>
                    </View>
                    <View style={{
                      paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5,
                      backgroundColor: pair.level === "high" ? "#FF4D6A20" : pair.level === "medium" ? "#F5A62320" : "#4DA6FF20",
                    }}>
                      <Text style={{ fontSize: 9, fontFamily: "Inter_700Bold", color: pair.level === "high" ? "#FF4D6A" : pair.level === "medium" ? "#F5A623" : "#4DA6FF" }}>
                        {pair.level === "high" ? "SEVERO" : pair.level === "medium" ? "MÉDIO" : "BAIXO"}
                      </Text>
                    </View>
                  </View>
                ))}

                {/* Active negotiation status OR negotiate button */}
                {negotiationMonthsLeft > 0 ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 8, backgroundColor: "#10B98115", borderWidth: 1, borderColor: "#10B98133" }}>
                    <Feather name="shield" size={14} color="#10B981" />
                    <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: "#10B981", flex: 1 }}>
                      Negociação em vigor — efeitos reduzidos a 50% por mais {negotiationMonthsLeft} mês{negotiationMonthsLeft !== 1 ? "es" : ""}.
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => {
                      const err = negotiateGeoConflict();
                      if (err) Alert.alert("Negociação Bloqueada", err);
                    }}
                    style={{
                      flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
                      paddingVertical: 10, borderRadius: 10,
                      backgroundColor: conflictLevel === "high" ? "#FF4D6A" : conflictLevel === "medium" ? "#F5A623" : "#4DA6FF",
                    }}
                    activeOpacity={0.8}
                  >
                    <Feather name="shield" size={14} color="#fff" />
                    <Text style={{ fontSize: 12, fontFamily: "Inter_700Bold", color: "#fff" }}>
                      Negociar · {formatMoney(conflictCost)}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Outcome notification */}
          {outcome && (
            <View style={[execStyles.outcomeCard, { backgroundColor: outcome.color + "15", borderColor: outcome.color + "44" }]}>
              <Feather name="check-circle" size={16} color={outcome.color} />
              <Text style={[execStyles.outcomeText, { color: outcome.color }]}>{outcome.text}</Text>
            </View>
          )}

          {/* Meeting button */}
          <TouchableOpacity
            style={[execStyles.meetingBtn, {
              backgroundColor: canMeet ? "#4DA6FF" : colors.card,
              borderColor: canMeet ? "#4DA6FF" : colors.border,
              opacity: canMeet ? 1 : 0.7,
            }]}
            onPress={() => canMeet && setMeetingModal(true)}
            activeOpacity={canMeet ? 0.85 : 1}
          >
            <Feather name={canMeet ? "play-circle" : "clock"} size={20} color={canMeet ? "#fff" : colors.mutedForeground} />
            <View style={{ flex: 1 }}>
              <Text style={[execStyles.meetingBtnTitle, { color: canMeet ? "#fff" : colors.foreground }]}>
                {canMeet ? "Convocar Reunião" : "Reunião em Cooldown"}
              </Text>
              <Text style={[execStyles.meetingBtnSub, { color: canMeet ? "#ffffff88" : colors.mutedForeground }]}>
                {canMeet
                  ? "Disponível agora — escolha a pauta estratégica"
                  : `Próxima reunião em ${cooldownLeft} mês${cooldownLeft !== 1 ? "es" : ""}`}
              </Text>
            </View>
            {!canMeet && (
              <View style={[execStyles.cooldownBadge, { backgroundColor: "#6B728022" }]}>
                <Text style={{ fontSize: 12, color: "#9CA3AF", fontFamily: "Inter_700Bold" }}>{cooldownLeft}m</Text>
              </View>
            )}
          </TouchableOpacity>
        </>
      )}

      {/* Decision modal */}
      <Modal transparent animationType="slide" visible={meetingModal} statusBarTranslucent onRequestClose={() => setMeetingModal(false)}>
        <Pressable style={execStyles.sheetOverlay} onPress={() => setMeetingModal(false)}>
          <Pressable onPress={e => e.stopPropagation()}>
            <View style={[execStyles.sheetBox, { backgroundColor: colors.card }]}>
              <View style={[execStyles.sheetHandle, { backgroundColor: colors.border }]} />
              <Text style={[execStyles.sheetTitle, { color: colors.foreground }]}>Reunião com Acionistas</Text>
              <Text style={[execStyles.sheetSub, { color: colors.mutedForeground }]}>
                Escolha a pauta. Cada decisão tem impacto real no jogo.
              </Text>
              <View style={{ gap: 10, marginTop: 8 }}>
                {SHAREHOLDER_DECISIONS.map((dec) => (
                  <TouchableOpacity
                    key={dec.id}
                    style={[execStyles.sheetOption, { backgroundColor: dec.color + "12", borderColor: dec.color + "44" }]}
                    onPress={() => handleDecision(dec.id as "dividends" | "reinvest" | "promise")}
                    activeOpacity={0.85}
                  >
                    <View style={[execStyles.sheetOptionIcon, { backgroundColor: dec.color + "22" }]}>
                      <Feather name={dec.icon} size={20} color={dec.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[execStyles.sheetOptionLabel, { color: colors.foreground }]}>{dec.label}</Text>
                      <Text style={[execStyles.sheetOptionDesc, { color: colors.mutedForeground }]}>{dec.description}</Text>
                      <Text style={[execStyles.sheetOptionOutcome, { color: dec.color }]}>{dec.outcome}</Text>
                    </View>
                    <Feather name="chevron-right" size={18} color={dec.color + "88"} />
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={[execStyles.sheetCancel, { borderColor: colors.border }]}
                onPress={() => setMeetingModal(false)}
              >
                <Text style={[execStyles.sheetCancelText, { color: colors.mutedForeground }]}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ─── Holdings section ─────────────────────────────────────────────────────────
const HOLDING_CATEGORIES = ["Todas", "Banking", "Technology", "Chip Manufacturing", "Insurance", "Marketing", "Security", "Legal", "Manufacturing", "Entertainment"];

function HoldingsSection({ colors }: { colors: ReturnType<typeof useColors> }) {
  const { state, buyLocalHolding, sellLocalHolding } = useGameplay();
  const ownedCompanies = state?.localHoldings ?? [];
  const playerMoney    = state?.money ?? 0;
  const [confirmBuy, setConfirmBuy] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("Todas");

  const handleBuy = (id: string) => {
    const c = AVAILABLE_COMPANIES.find(x => x.id === id)!;
    if (ownedCompanies.length >= MAX_HOLDINGS) {
      Alert.alert("Limite Atingido", `Você pode controlar no máximo ${MAX_HOLDINGS} empresas simultaneamente.`);
      return;
    }
    if (playerMoney < c.price) {
      Alert.alert("Dinheiro Insuficiente", `Você precisa de ${formatMoney(c.price)} para adquirir "${c.name}".`);
      return;
    }
    setConfirmBuy(id);
  };

  const handleSell = (id: string) => {
    const c = AVAILABLE_COMPANIES.find(x => x.id === id)!;
    Alert.alert("Desinvestir", `Encerrar participação em "${c.name}"? Os efeitos estratégicos serão desativados imediatamente.`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Desinvestir", style: "destructive", onPress: () => sellLocalHolding(id) },
    ]);
  };

  const confirmPurchase = () => {
    if (!confirmBuy) return;
    const c = AVAILABLE_COMPANIES.find(x => x.id === confirmBuy)!;
    const err = buyLocalHolding(confirmBuy, c.price);
    setConfirmBuy(null);
    if (err) Alert.alert("Erro", err);
  };

  const totalMonthlyCost = ownedCompanies.reduce((s, id) => {
    return s + (AVAILABLE_COMPANIES.find(c => c.id === id)?.monthlyCost ?? 0);
  }, 0);
  const totalAnnualIncome = ownedCompanies.reduce((s, id) => {
    return s + (AVAILABLE_COMPANIES.find(c => c.id === id)?.annualIncome ?? 0);
  }, 0);
  const availableFiltered = AVAILABLE_COMPANIES.filter(c =>
    !ownedCompanies.includes(c.id) &&
    (categoryFilter === "Todas" || c.category === categoryFilter)
  );
  const usedCategories = new Set(AVAILABLE_COMPANIES.filter(c => !ownedCompanies.includes(c.id)).map(c => c.category));
  const visibleCategories = HOLDING_CATEGORIES.filter(cat => cat === "Todas" || usedCategories.has(cat));

  return (
    <View style={{ gap: 14 }}>
      {/* Summary bar */}
      <View style={[execStyles.introCard, { backgroundColor: "#F5A62308", borderColor: "#F5A62333" }]}>
        <LinearGradient colors={["#F5A62314", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={[execStyles.introIcon, { backgroundColor: "#F5A62322" }]}>
            <Feather name="briefcase" size={18} color="#F5A623" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[execStyles.introTitle, { color: "#F5A623" }]}>PORTFOLIO DE HOLDINGS</Text>
            <Text style={[execStyles.introSub, { color: colors.mutedForeground }]}>
              Adquira empresas estratégicas para bônus passivos. Máximo {MAX_HOLDINGS} empresas.
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
          <View style={[execStyles.holdingStat, { backgroundColor: "#F5A62315" }]}>
            <Text style={[execStyles.holdingStatVal, { color: "#F5A623" }]}>{ownedCompanies.length}/{MAX_HOLDINGS}</Text>
            <Text style={[execStyles.holdingStatLabel, { color: colors.mutedForeground }]}>Empresas</Text>
          </View>
          {totalMonthlyCost > 0 && (
            <View style={[execStyles.holdingStat, { backgroundColor: "#FF4D6A15" }]}>
              <Text style={[execStyles.holdingStatVal, { color: "#FF4D6A" }]}>{formatMoney(totalMonthlyCost)}</Text>
              <Text style={[execStyles.holdingStatLabel, { color: colors.mutedForeground }]}>Manutenção/mês</Text>
            </View>
          )}
          {totalAnnualIncome > 0 && (
            <View style={[execStyles.holdingStat, { backgroundColor: "#10B98115" }]}>
              <Text style={[execStyles.holdingStatVal, { color: "#10B981" }]}>{formatMoney(totalAnnualIncome)}</Text>
              <Text style={[execStyles.holdingStatLabel, { color: colors.mutedForeground }]}>Receita anual</Text>
            </View>
          )}
        </View>
      </View>

      {/* Owned companies */}
      {ownedCompanies.length > 0 && (
        <>
          <Text style={[execStyles.subSectionLabel, { color: colors.mutedForeground }]}>EMPRESAS NO PORTFOLIO</Text>
          {ownedCompanies.map((id) => {
            const c = AVAILABLE_COMPANIES.find(x => x.id === id)!;
            return (
              <View key={id} style={[execStyles.ownedCard, { backgroundColor: c.color + "10", borderColor: c.color + "44" }]}>
                <LinearGradient colors={[c.color + "18", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                <View style={execStyles.ownedRow}>
                  <View style={[execStyles.ownedIcon, { backgroundColor: c.color + "22" }]}>
                    <Feather name={c.icon} size={18} color={c.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 1 }}>
                      <Text style={[execStyles.ownedName, { color: colors.foreground }]}>{c.name}</Text>
                      <View style={{ backgroundColor: c.color + "22", borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
                        <Text style={{ fontSize: 9, color: c.color, fontFamily: "Inter_600SemiBold" }}>{c.category}</Text>
                      </View>
                    </View>
                    <Text style={[execStyles.ownedEffect, { color: c.color }]}>{c.effectLabel}</Text>
                    {c.annualIncome != null && (
                      <Text style={{ fontSize: 11, color: "#10B981", fontFamily: "Inter_600SemiBold", marginTop: 1 }}>
                        Receita anual: {formatMoney(c.annualIncome)}
                      </Text>
                    )}
                    <Text style={[execStyles.ownedMaint, { color: colors.mutedForeground }]}>
                      {formatMoney(c.monthlyCost)}/mês manutenção
                    </Text>
                  </View>
                  <View style={[execStyles.ownedBadge, { backgroundColor: c.color + "22" }]}>
                    <Feather name="check-circle" size={12} color={c.color} />
                    <Text style={[execStyles.ownedBadgeText, { color: c.color }]}>Ativo</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[execStyles.sellBtn, { borderColor: "#FF4D6A55" }]}
                  onPress={() => handleSell(id)}
                  activeOpacity={0.8}
                >
                  <Feather name="trash-2" size={13} color="#FF4D6A" />
                  <Text style={execStyles.sellBtnText}>Desinvestir</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </>
      )}

      {/* Available companies */}
      <Text style={[execStyles.subSectionLabel, { color: colors.mutedForeground }]}>EMPRESAS DISPONÍVEIS</Text>

      {/* Category filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 2 }}>
        {visibleCategories.map((cat) => {
          const isActive = categoryFilter === cat;
          return (
            <TouchableOpacity
              key={cat}
              onPress={() => setCategoryFilter(cat)}
              style={{
                paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
                backgroundColor: isActive ? "#F5A623" : colors.card,
                borderWidth: 1, borderColor: isActive ? "#F5A623" : colors.border,
              }}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: isActive ? "#000" : colors.mutedForeground }}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {availableFiltered.length === 0 && (
        <View style={{ alignItems: "center", paddingVertical: 20 }}>
          <Text style={{ fontSize: 13, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
            Nenhuma empresa disponível nesta categoria.
          </Text>
        </View>
      )}

      {availableFiltered.map((c) => {
        const slotsLeft = MAX_HOLDINGS - ownedCompanies.length;
        const canBuy = slotsLeft > 0 && playerMoney >= c.price;
        return (
          <View key={c.id} style={[execStyles.companyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={execStyles.companyHeader}>
              <View style={[execStyles.companyIcon, { backgroundColor: c.color + "22" }]}>
                <Feather name={c.icon} size={20} color={c.color} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={[execStyles.companyName, { color: colors.foreground }]}>{c.name}</Text>
                  <View style={{ backgroundColor: c.color + "22", borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
                    <Text style={{ fontSize: 9, color: c.color, fontFamily: "Inter_600SemiBold" }}>{c.category}</Text>
                  </View>
                </View>
                <Text style={[execStyles.companyDesc, { color: colors.mutedForeground }]}>{c.description}</Text>
              </View>
            </View>
            <View style={{ gap: 4 }}>
              <View style={[execStyles.companyEffect, { backgroundColor: c.color + "12", borderColor: c.color + "33" }]}>
                <Feather name="zap" size={12} color={c.color} />
                <Text style={[execStyles.companyEffectText, { color: c.color }]}>{c.effectLabel}</Text>
              </View>
              {c.annualIncome != null && (
                <View style={[execStyles.companyEffect, { backgroundColor: "#10B98112", borderColor: "#10B98133" }]}>
                  <Feather name="trending-up" size={11} color="#10B981" />
                  <Text style={[execStyles.companyEffectText, { color: "#10B981" }]}>Receita anual: {formatMoney(c.annualIncome)}</Text>
                </View>
              )}
              <View style={[execStyles.companyEffect, { backgroundColor: "#FF4D6A08", borderColor: "#FF4D6A22" }]}>
                <Feather name="alert-triangle" size={11} color="#FF4D6A" />
                <Text style={[execStyles.companyEffectText, { color: "#FF4D6A99", fontSize: 11 }]}>{c.tradeoff}</Text>
              </View>
            </View>
            <View style={execStyles.companyFooter}>
              <View>
                <Text style={[execStyles.companyPrice, { color: "#F5A623" }]}>{formatMoney(c.price)}</Text>
                <Text style={[execStyles.companyMaint, { color: colors.mutedForeground }]}>{formatMoney(c.monthlyCost)}/mês</Text>
              </View>
              <TouchableOpacity
                style={[execStyles.buyBtn, { backgroundColor: canBuy ? c.color : "#6B7280", opacity: canBuy ? 1 : 0.5 }]}
                onPress={() => canBuy && handleBuy(c.id)}
                disabled={!canBuy}
                activeOpacity={0.85}
              >
                <Feather name="plus" size={14} color="#fff" />
                <Text style={execStyles.buyBtnText}>Adquirir</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

      {ownedCompanies.length >= MAX_HOLDINGS && (
        <View style={[execStyles.allOwnedBanner, { backgroundColor: "#F5A62315", borderColor: "#F5A62333" }]}>
          <Feather name="briefcase" size={16} color="#F5A623" />
          <Text style={{ fontSize: 13, color: "#F5A623", fontFamily: "Inter_600SemiBold" }}>
            Limite de {MAX_HOLDINGS} holdings atingido. Desinvista para liberar espaço.
          </Text>
        </View>
      )}

      {/* Buy confirm modal */}
      {confirmBuy && (() => {
        const c = AVAILABLE_COMPANIES.find(x => x.id === confirmBuy)!;
        return (
          <Modal transparent animationType="fade" visible statusBarTranslucent>
            <Pressable style={execStyles.overlay} onPress={() => setConfirmBuy(null)}>
              <Pressable onPress={e => e.stopPropagation()}>
                <View style={[execStyles.modalBox, { backgroundColor: colors.card, borderColor: c.color }]}>
                  <LinearGradient colors={[c.color + "18", "transparent"]} style={StyleSheet.absoluteFill} />
                  <View style={[execStyles.modalIconBox, { backgroundColor: c.color + "22" }]}>
                    <Feather name={c.icon} size={28} color={c.color} />
                  </View>
                  <Text style={[execStyles.modalTitle, { color: colors.foreground }]}>Adquirir Empresa</Text>
                  <Text style={[execStyles.modalSub, { color: c.color }]}>{c.name}</Text>
                  <Text style={[execStyles.modalBody, { color: colors.mutedForeground }]}>{c.description}</Text>
                  <View style={[execStyles.modalEffectRow, { backgroundColor: c.color + "12", borderColor: c.color + "33" }]}>
                    <Feather name="zap" size={13} color={c.color} />
                    <Text style={[execStyles.modalEffectText, { color: c.color }]}>{c.effectLabel}</Text>
                  </View>
                  <View style={[execStyles.modalEffectRow, { backgroundColor: "#FF4D6A08", borderColor: "#FF4D6A22", marginTop: 4 }]}>
                    <Feather name="alert-triangle" size={12} color="#FF4D6A" />
                    <Text style={[execStyles.modalEffectText, { color: "#FF4D6A99" }]}>{c.tradeoff}</Text>
                  </View>
                  <View style={[execStyles.modalCostRow, { borderColor: colors.border }]}>
                    <Text style={[execStyles.modalCostLabel, { color: colors.mutedForeground }]}>Preço:</Text>
                    <Text style={[execStyles.modalCostValue, { color: "#F5A623" }]}>{formatMoney(c.price)}</Text>
                  </View>
                  <View style={[execStyles.modalCostRow, { borderColor: colors.border, borderTopWidth: 0 }]}>
                    <Text style={[execStyles.modalCostLabel, { color: colors.mutedForeground }]}>Manutenção mensal:</Text>
                    <Text style={[execStyles.modalCostValue, { color: "#FF4D6A" }]}>{formatMoney(c.monthlyCost)}</Text>
                  </View>
                  <View style={execStyles.modalBtns}>
                    <TouchableOpacity style={[execStyles.modalCancel, { borderColor: colors.border }]} onPress={() => setConfirmBuy(null)}>
                      <Text style={[execStyles.modalCancelText, { color: colors.mutedForeground }]}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[execStyles.modalConfirm, { backgroundColor: c.color }]} onPress={confirmPurchase}>
                      <Text style={execStyles.modalConfirmText}>Adquirir</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Pressable>
            </Pressable>
          </Modal>
        );
      })()}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function OfficesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state, upgradeOffice, shareholderMeetingDecision, negotiateGeoConflict, hireLegalContract, cancelLegalContract } = useGameplay();
  const [selected, setSelected] = useState<OfficeSectorId>("tech");
  const [modal, setModal]       = useState<{ sector: OfficeSectorId; upgradeIdx: number } | null>(null);
  const [screenTab, setScreenTab] = useState<ScreenTab>("escritorios");
  const [execSection, setExecSection] = useState<ExecSection>("juridico");
  const [focusMode, setFocusMode] = useState<OfficeFocusMode>("balanced");
  const botPad = Platform.OS === "web" ? 24 : insets.bottom;

  if (!state) return null;

  const year = state.year;
  const availablePhase = getAvailablePhase(year);
  const money = state.money;

  const selectedUpgrades = state.offices[selected] ?? 0;
  const selectedColor    = OFFICE_SECTOR_COLORS[selected];
  const nextCost         = selectedUpgrades < OFFICE_MAX_UPGRADES ? getOfficeUpgradeCost(selectedUpgrades, year) : null;
  const nextPhase        = Math.floor(selectedUpgrades / 5) + 1;
  const maxByEra         = availablePhase * 5;
  const canUpgrade       = nextCost !== null && money >= nextCost && selectedUpgrades < maxByEra;
  const monthlyMaint     = getOfficeMonthlyMaintenance(selectedUpgrades, year);
  const bonus            = getOfficeSectorBonus(selected, selectedUpgrades);

  const totalOfficeMaint = ALL_OFFICE_SECTORS.reduce((s, sec) => s + getOfficeMonthlyMaintenance(state.offices[sec] ?? 0, year), 0);

  const handleUpgrade = () => {
    if (!canUpgrade) return;
    setModal({ sector: selected, upgradeIdx: selectedUpgrades });
  };

  const confirmUpgrade = () => {
    upgradeOffice(selected);
    setModal(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GridBackground />
      <ScreenHeader title="Escritório" />

      {/* ── Top-level tab bar ── */}
      <View style={[styles.topTabBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {([
          { id: "escritorios" as ScreenTab, label: "Escritórios", icon: "grid" as keyof typeof Feather.glyphMap },
          { id: "executivo"  as ScreenTab, label: "Executivo",   icon: "briefcase" as keyof typeof Feather.glyphMap },
        ]).map((tab) => {
          const isActive = screenTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.topTabBtn, isActive && { backgroundColor: "#4DA6FF20", borderColor: "#4DA6FF55" }]}
              onPress={() => setScreenTab(tab.id)}
              activeOpacity={0.8}
            >
              <Feather name={tab.icon} size={15} color={isActive ? "#4DA6FF" : colors.mutedForeground} />
              <Text style={[styles.topTabLabel, { color: isActive ? "#4DA6FF" : colors.mutedForeground }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── ESCRITÓRIOS TAB ── */}
      {screenTab === "escritorios" && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: botPad + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Summary Card */}
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <LinearGradient colors={["#4DA6FF10", "transparent"]} style={StyleSheet.absoluteFill} />
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: "#4DA6FF" }]}>
                  {ALL_OFFICE_SECTORS.reduce((s, sec) => s + (state.offices[sec] ?? 0), 0)}
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Total Upgrades</Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: "#FF4D6A" }]}>{formatMoney(totalOfficeMaint)}/mês</Text>
                <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Manutenção Total</Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: "#F5A623" }]}>Fase {availablePhase}</Text>
                <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Era Atual ({year})</Text>
              </View>
            </View>
          </View>

          {/* Phase Timeline */}
          <View style={[styles.phaseCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.phaseTitle, { color: colors.foreground }]}>Fases de Evolução</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.phaseRow}>
                {OFFICE_PHASES.map((p) => {
                  const unlocked = year >= p.unlockYear;
                  const current  = p.phase === availablePhase;
                  const benefit  = OFFICE_PHASE_BENEFITS[p.phase];
                  return (
                    <View key={p.phase} style={[styles.phaseItem, current && { backgroundColor: "#F5A62310", borderRadius: 10, paddingHorizontal: 4 }]}>
                      <View style={[styles.phaseDot, {
                        backgroundColor: current ? "#F5A623" : unlocked ? "#4DA6FF" : colors.border,
                        borderColor: current ? "#F5A623" : "transparent",
                      }]}>
                        <Text style={styles.phaseDotText}>{p.phase}</Text>
                      </View>
                      <Text style={[styles.phaseName, { color: unlocked ? colors.foreground : colors.mutedForeground }]}>
                        {p.name}
                      </Text>
                      <Text style={[styles.phaseYear, { color: colors.mutedForeground }]}>{p.unlockYear}</Text>
                      {benefit && (
                        <Text style={[styles.phaseBenefit, { color: current ? "#F5A623" : unlocked ? colors.mutedForeground : colors.border }]} numberOfLines={2}>
                          {benefit.short}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* Focus Mode Selector */}
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>FOCO ESTRATÉGICO</Text>
          <View style={[styles.focusRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {(Object.keys(OFFICE_FOCUS_CONFIGS) as OfficeFocusMode[]).map((mode) => {
              const cfg = OFFICE_FOCUS_CONFIGS[mode];
              const active = focusMode === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  activeOpacity={0.8}
                  onPress={() => setFocusMode(mode)}
                  style={[styles.focusBtn, active && { backgroundColor: cfg.color + "22", borderColor: cfg.color }]}
                >
                  <Feather name={cfg.icon as any} size={16} color={active ? cfg.color : colors.mutedForeground} />
                  <Text style={[styles.focusBtnLabel, { color: active ? cfg.color : colors.mutedForeground }]}>{cfg.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {focusMode !== "balanced" && (
            <View style={[styles.focusDesc, { backgroundColor: OFFICE_FOCUS_CONFIGS[focusMode].color + "12", borderColor: OFFICE_FOCUS_CONFIGS[focusMode].color + "44" }]}>
              <Feather name="info" size={12} color={OFFICE_FOCUS_CONFIGS[focusMode].color} />
              <Text style={[styles.focusDescText, { color: OFFICE_FOCUS_CONFIGS[focusMode].color }]}>
                {OFFICE_FOCUS_CONFIGS[focusMode].description} — Investe prioritariamente em: {OFFICE_FOCUS_CONFIGS[focusMode].boostedSectors.map(s => OFFICE_SECTOR_NAMES[s]).join(" e ")}
              </Text>
            </View>
          )}

          {/* Sector Grid */}
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>SETORES</Text>
          <View style={styles.sectorGrid}>
            {ALL_OFFICE_SECTORS.map((sec) => {
              const upgrades = state.offices[sec] ?? 0;
              const col = OFFICE_SECTOR_COLORS[sec];
              const isSelected = selected === sec;
              const phasePct = (upgrades / OFFICE_MAX_UPGRADES) * 100;
              const isBoosted = OFFICE_FOCUS_CONFIGS[focusMode].boostedSectors.includes(sec);
              const barColor = phasePct >= 66 ? "#10B981" : phasePct >= 33 ? "#F5A623" : phasePct > 0 ? "#FF4D6A" : colors.border;
              return (
                <TouchableOpacity
                  key={sec}
                  activeOpacity={0.8}
                  onPress={() => setSelected(sec)}
                  style={[styles.sectorCard, {
                    backgroundColor: isSelected ? col + "18" : colors.card,
                    borderColor: isSelected ? col : isBoosted ? OFFICE_FOCUS_CONFIGS[focusMode].color + "66" : colors.border,
                  }]}
                >
                  {isBoosted && (
                    <View style={[styles.sectorFocusBadge, { backgroundColor: OFFICE_FOCUS_CONFIGS[focusMode].color }]}>
                      <Feather name="zap" size={8} color="#fff" />
                    </View>
                  )}
                  <View style={[styles.sectorIcon, { backgroundColor: col + "28" }]}>
                    <Feather name={SECTOR_ICONS[sec]} size={18} color={col} />
                  </View>
                  <Text style={[styles.sectorName, { color: colors.foreground }]} numberOfLines={1}>
                    {OFFICE_SECTOR_NAMES[sec]}
                  </Text>
                  <Text style={[styles.sectorCount, { color: phasePct >= 66 ? "#10B981" : phasePct >= 33 ? "#F5A623" : col }]}>
                    {upgrades}/{OFFICE_MAX_UPGRADES}
                  </Text>
                  <View style={[styles.sectorBar, { backgroundColor: colors.border }]}>
                    <View style={[styles.sectorBarFill, { backgroundColor: barColor, width: `${phasePct}%` }]} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Selected Sector Detail */}
          <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: selectedColor }]}>
            <LinearGradient colors={[selectedColor + "18", "transparent"]} style={StyleSheet.absoluteFill} />
            <View style={styles.detailHeader}>
              <View style={[styles.detailIconBig, { backgroundColor: selectedColor + "28" }]}>
                <Feather name={SECTOR_ICONS[selected]} size={26} color={selectedColor} />
              </View>
              <View style={styles.detailHeaderText}>
                <Text style={[styles.detailTitle, { color: colors.foreground }]}>{OFFICE_SECTOR_NAMES[selected]}</Text>
                <Text style={[styles.detailSub, { color: colors.mutedForeground }]}>
                  {selectedUpgrades} de {OFFICE_MAX_UPGRADES} upgrades · Fase {Math.ceil(Math.max(1, selectedUpgrades) / 5)}
                </Text>
                <Text style={[styles.detailTagline, { color: selectedColor + "CC" }]} numberOfLines={1}>
                  {OFFICE_SECTOR_TAGLINES[selected]}
                </Text>
              </View>
            </View>

            {/* Color-coded progress bar */}
            {(() => {
              const pct = (selectedUpgrades / OFFICE_MAX_UPGRADES) * 100;
              const barCol = pct >= 66 ? "#10B981" : pct >= 33 ? "#F5A623" : pct > 0 ? "#FF4D6A" : colors.border;
              const effLabel = pct >= 66 ? "Alta eficiência" : pct >= 33 ? "Eficiência média" : pct > 0 ? "Baixa eficiência" : "Inativo";
              return (
                <>
                  <View style={[styles.detailBar, { backgroundColor: colors.border }]}>
                    <View style={[styles.detailBarFill, { backgroundColor: barCol, width: `${pct}%` }]} />
                  </View>
                  <Text style={[styles.effLabel, { color: barCol }]}>{effLabel} · {Math.round(pct)}%</Text>
                </>
              );
            })()}

            {/* Current impact lines */}
            <View style={[styles.impactBlock, { borderColor: selectedColor + "33", backgroundColor: selectedColor + "08" }]}>
              <Text style={[styles.impactTitle, { color: colors.mutedForeground }]}>IMPACTO ATUAL</Text>
              {getSectorImpactLines(selected, selectedUpgrades).map((line, i) => (
                <View key={i} style={styles.impactLine}>
                  <Feather name="check-circle" size={11} color={selectedUpgrades > 0 ? selectedColor : colors.mutedForeground} />
                  <Text style={[styles.impactText, { color: selectedUpgrades > 0 ? colors.foreground : colors.mutedForeground }]}>{line}</Text>
                </View>
              ))}
            </View>

            {/* Milestone info */}
            {(() => {
              const milestoneLabel = getCurrentMilestoneLabel(selected, selectedUpgrades);
              const nextMilestone  = getNextMilestoneInfo(selectedUpgrades);
              return (
                <>
                  {milestoneLabel && (
                    <View style={[styles.milestoneAchieved, { backgroundColor: selectedColor + "18", borderColor: selectedColor + "55" }]}>
                      <Feather name="award" size={13} color={selectedColor} />
                      <Text style={[styles.milestoneAchievedText, { color: selectedColor }]}>Marco atingido: {milestoneLabel}</Text>
                    </View>
                  )}
                  {nextMilestone && (
                    <View style={[styles.milestoneNext, { borderColor: colors.border }]}>
                      <Feather name="flag" size={11} color={colors.mutedForeground} />
                      <Text style={[styles.milestoneNextText, { color: colors.mutedForeground }]}>
                        Próximo marco: nível {nextMilestone.level} ({nextMilestone.level - selectedUpgrades} upgrades restantes)
                      </Text>
                    </View>
                  )}
                </>
              );
            })()}

            <View style={styles.bonusRow}>
              {bonus.ratingBonus > 0 && (
                <View style={[styles.bonusBadge, { backgroundColor: selectedColor + "22" }]}>
                  <Text style={[styles.bonusText, { color: selectedColor }]}>+{safeN(bonus.ratingBonus, 0).toFixed(1)} rating</Text>
                </View>
              )}
              {bonus.salesMult > 1 && (
                <View style={[styles.bonusBadge, { backgroundColor: selectedColor + "22" }]}>
                  <Text style={[styles.bonusText, { color: selectedColor }]}>+{Math.round((bonus.salesMult - 1) * 100)}% vendas</Text>
                </View>
              )}
              {bonus.costReduction > 0 && (
                <View style={[styles.bonusBadge, { backgroundColor: selectedColor + "22" }]}>
                  <Text style={[styles.bonusText, { color: selectedColor }]}>-{Math.round(bonus.costReduction * 100)}% custos</Text>
                </View>
              )}
              {bonus.reputationBonus > 0 && (
                <View style={[styles.bonusBadge, { backgroundColor: selectedColor + "22" }]}>
                  <Text style={[styles.bonusText, { color: selectedColor }]}>+{safeN(bonus.reputationBonus, 0).toFixed(2)} rep/mês</Text>
                </View>
              )}
              {bonus.researchSpeed > 1 && (
                <View style={[styles.bonusBadge, { backgroundColor: selectedColor + "22" }]}>
                  <Text style={[styles.bonusText, { color: selectedColor }]}>+{Math.round((bonus.researchSpeed - 1) * 100)}% pesquisa</Text>
                </View>
              )}
            </View>
            {monthlyMaint > 0 && (
              <View style={[styles.maintRow, { borderColor: colors.border }]}>
                <Feather name="dollar-sign" size={12} color="#FF4D6A" />
                <Text style={[styles.maintText, { color: "#FF4D6A" }]}>Manutenção: {formatMoney(monthlyMaint)}/mês</Text>
              </View>
            )}
            <Text style={[styles.upgradeListTitle, { color: colors.mutedForeground }]}>PRÓXIMAS MELHORIAS</Text>
            <View style={styles.upgradeList}>
              {Array.from({ length: Math.min(5, OFFICE_MAX_UPGRADES - selectedUpgrades) }, (_, i) => {
                const idx    = selectedUpgrades + i;
                const ph     = Math.floor(idx / 5) + 1;
                const locked = ph > availablePhase;
                const cost   = getOfficeUpgradeCost(idx, year);
                const label  = getUpgradeLabel(selected, idx);
                return (
                  <View key={idx} style={[styles.upgradeItem, {
                    backgroundColor: locked ? colors.muted : colors.secondary,
                    borderColor: i === 0 && !locked ? selectedColor : colors.border,
                    opacity: locked ? 0.5 : 1,
                  }]}>
                    <View style={styles.upgradeItemLeft}>
                      <View style={[styles.upgradeIdxBadge, { backgroundColor: selectedColor + "22" }]}>
                        <Text style={[styles.upgradeIdx, { color: selectedColor }]}>#{idx + 1}</Text>
                      </View>
                      <Text style={[styles.upgradeLabel, { color: locked ? colors.mutedForeground : colors.foreground }]} numberOfLines={2}>
                        {locked ? `🔒 Fase ${ph} — desbloqueio em ${OFFICE_PHASES[ph - 1]?.unlockYear}` : label}
                      </Text>
                    </View>
                    <Text style={[styles.upgradeCost, { color: locked ? colors.mutedForeground : selectedColor }]}>
                      {formatMoney(cost)}
                    </Text>
                  </View>
                );
              })}
            </View>
            {selectedUpgrades >= OFFICE_MAX_UPGRADES && (
              <View style={[styles.maxedBanner, { backgroundColor: selectedColor + "20", borderColor: selectedColor }]}>
                <Feather name="check-circle" size={16} color={selectedColor} />
                <Text style={[styles.maxedText, { color: selectedColor }]}>Setor totalmente desenvolvido!</Text>
              </View>
            )}
            {selectedUpgrades < OFFICE_MAX_UPGRADES && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleUpgrade}
                disabled={!canUpgrade}
                style={[styles.upgradeBtn, { backgroundColor: canUpgrade ? selectedColor : colors.muted, opacity: canUpgrade ? 1 : 0.5 }]}
              >
                {nextPhase > availablePhase ? (
                  <>
                    <Feather name="lock" size={16} color="#fff" />
                    <Text style={styles.upgradeBtnText}>Fase {nextPhase} bloqueada até {OFFICE_PHASES[nextPhase - 1]?.unlockYear}</Text>
                  </>
                ) : nextCost && money < nextCost ? (
                  <>
                    <Feather name="dollar-sign" size={16} color="#fff" />
                    <Text style={styles.upgradeBtnText}>Faltam {formatMoney(nextCost - money)}</Text>
                  </>
                ) : (
                  <>
                    <Feather name="arrow-up-circle" size={16} color="#fff" />
                    <Text style={styles.upgradeBtnText}>Upgrade #{selectedUpgrades + 1} — {nextCost ? formatMoney(nextCost) : "—"}</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      )}

      {/* ── EXECUTIVO TAB ── */}
      {screenTab === "executivo" && (
        <View style={styles.execContainer}>
          <ExecSideMenu active={execSection} onChange={setExecSection} colors={colors} />
          <ScrollView
            style={styles.execScroll}
            contentContainerStyle={[styles.execContent, { paddingBottom: botPad + 24 }]}
            showsVerticalScrollIndicator={false}
          >
            {execSection === "juridico" && (
              <JuridicoSection
                legalContract={state.legalContract}
                currentYear={state.year}
                currentMonth={state.month}
                hireLegalContract={hireLegalContract}
                cancelLegalContract={cancelLegalContract}
                colors={colors}
              />
            )}
            {execSection === "acionistas" && (
              <AcionistasSection
                colors={colors}
                state={state}
                shareholderMeetingDecision={shareholderMeetingDecision}
                negotiateGeoConflict={negotiateGeoConflict}
              />
            )}
            {execSection === "holdings" && (
              <HoldingsSection colors={colors} />
            )}
          </ScrollView>
        </View>
      )}

      {/* Confirm upgrade modal */}
      {modal && (
        <Modal transparent animationType="fade" visible onRequestClose={() => setModal(null)}>
          <Pressable style={styles.overlay} onPress={() => setModal(null)}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={[styles.modalBox, { backgroundColor: colors.card, borderColor: selectedColor }]}>
                <LinearGradient colors={[selectedColor + "18", "transparent"]} style={StyleSheet.absoluteFill} />
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>Confirmar Upgrade</Text>
                <Text style={[styles.modalSector, { color: selectedColor }]}>
                  {OFFICE_SECTOR_NAMES[modal.sector]} — #{modal.upgradeIdx + 1}
                </Text>
                <Text style={[styles.modalLabel, { color: colors.foreground }]}>
                  {getUpgradeLabel(modal.sector, modal.upgradeIdx)}
                </Text>
                <View style={[styles.modalCostRow, { borderColor: colors.border }]}>
                  <Text style={[styles.modalCostLabel, { color: colors.mutedForeground }]}>Custo:</Text>
                  <Text style={[styles.modalCostValue, { color: "#F5A623" }]}>
                    {formatMoney(getOfficeUpgradeCost(modal.upgradeIdx, year))}
                  </Text>
                </View>
                <View style={styles.modalBtns}>
                  <TouchableOpacity style={[styles.modalCancel, { borderColor: colors.border }]} onPress={() => setModal(null)}>
                    <Text style={[styles.modalCancelText, { color: colors.mutedForeground }]}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalConfirm, { backgroundColor: selectedColor }]} onPress={confirmUpgrade}>
                    <Text style={styles.modalConfirmText}>Confirmar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

// ─── Exec-specific styles ─────────────────────────────────────────────────────
const execStyles = StyleSheet.create({
  sideMenu: {
    paddingVertical: 8, paddingHorizontal: 6,
    borderRightWidth: 1, gap: 4,
  },
  sideBtn: {
    width: 80, alignItems: "center", paddingVertical: 12, paddingHorizontal: 4,
    borderRadius: 12, gap: 5, borderWidth: 1, borderColor: "transparent",
    position: "relative",
  },
  sideBtnLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  sideActiveDot: { position: "absolute", right: 4, top: "50%", width: 5, height: 5, borderRadius: 3 },

  introCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10, overflow: "hidden" },
  introIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  introTitle: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.8, textTransform: "uppercase" },
  introSub: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17, marginTop: 2 },
  activeIndicator: { flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 8, borderWidth: 1, padding: 8 },
  activeIndicatorText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },

  tierCard: { borderRadius: 14, padding: 14, gap: 10, overflow: "hidden" },
  tierHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  tierIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  tierName: { fontSize: 14, fontFamily: "Inter_700Bold" },
  tierCost: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  protBadge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8 },
  protBadgeText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  tierDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  perkDot: { width: 5, height: 5, borderRadius: 3 },
  perkText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  tierFooter: { borderTopWidth: 1, paddingTop: 10 },
  hireBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingVertical: 11, borderRadius: 11 },
  hireBtnText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#fff" },

  meetingBtn: {
    borderRadius: 14, borderWidth: 1, padding: 14,
    flexDirection: "row", alignItems: "center", gap: 12,
  },
  meetingBtnTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  meetingBtnSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  cooldownBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  outcomeCard: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, padding: 10 },
  outcomeText: { flex: 1, fontSize: 12, fontFamily: "Inter_500Medium", lineHeight: 18 },
  subSectionLabel: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.8, textTransform: "uppercase" },
  decisionCard: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 8 },
  decisionHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  decisionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  decisionLabel: { fontSize: 13, fontFamily: "Inter_700Bold" },
  decisionDesc: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2, lineHeight: 16 },
  decisionOutcome: { borderRadius: 8, borderWidth: 1, padding: 8 },
  decisionOutcomeText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  decisionRisk: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 8, borderWidth: 1, padding: 7 },
  decisionRiskText: { fontSize: 11, fontFamily: "Inter_400Regular" },

  sheetOverlay: { flex: 1, backgroundColor: "#00000088", justifyContent: "flex-end" },
  sheetBox: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 4, maxHeight: "88%" },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 12 },
  sheetTitle: { fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center" },
  sheetSub: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", marginBottom: 8, lineHeight: 19 },
  sheetOption: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
  sheetOptionIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  sheetOptionLabel: { fontSize: 14, fontFamily: "Inter_700Bold" },
  sheetOptionDesc: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2, lineHeight: 16 },
  sheetOptionOutcome: { fontSize: 11, fontFamily: "Inter_600SemiBold", marginTop: 3 },
  sheetCancel: { borderWidth: 1, borderRadius: 12, paddingVertical: 13, alignItems: "center", marginTop: 8 },
  sheetCancelText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },

  holdingStat: { flex: 1, alignItems: "center", borderRadius: 9, paddingVertical: 8 },
  holdingStatVal: { fontSize: 14, fontFamily: "Inter_700Bold" },
  holdingStatLabel: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 1 },
  ownedCard: { borderRadius: 14, borderWidth: 1.5, padding: 14, gap: 10, overflow: "hidden" },
  ownedRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  ownedIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  ownedName: { fontSize: 13, fontFamily: "Inter_700Bold" },
  ownedEffect: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginTop: 1 },
  ownedMaint: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  ownedBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7 },
  ownedBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  sellBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1, borderRadius: 9, paddingVertical: 8 },
  sellBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#FF4D6A" },
  companyCard: { borderRadius: 13, borderWidth: 1, padding: 14, gap: 10 },
  companyHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  companyIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  companyName: { fontSize: 14, fontFamily: "Inter_700Bold" },
  companyDesc: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2, lineHeight: 16 },
  companyEffect: { flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 8, borderWidth: 1, padding: 8 },
  companyEffectText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  companyFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  companyPrice: { fontSize: 16, fontFamily: "Inter_700Bold" },
  companyMaint: { fontSize: 11, fontFamily: "Inter_400Regular" },
  buyBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 11 },
  buyBtnText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#fff" },
  allOwnedBanner: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, padding: 12 },

  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", alignItems: "center", justifyContent: "center", padding: 20 },
  modalBox: { width: "100%", maxWidth: 380, borderRadius: 20, borderWidth: 1.5, padding: 24, gap: 12, overflow: "hidden" },
  modalIconBox: { width: 60, height: 60, borderRadius: 16, alignItems: "center", justifyContent: "center", alignSelf: "center" },
  modalTitle: { fontSize: 17, fontFamily: "Inter_700Bold", textAlign: "center" },
  modalSub: { fontSize: 14, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  modalBody: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 19 },
  modalEffectRow: { flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 8, borderWidth: 1, padding: 9 },
  modalEffectText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  modalCostRow: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, paddingTop: 12 },
  modalCostLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  modalCostValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  modalBtns: { flexDirection: "row", gap: 10, marginTop: 6 },
  modalCancel: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  modalCancelText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  modalConfirm: { flex: 1, padding: 14, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  modalConfirmText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff" },
});

const acStyles = StyleSheet.create({
  statChip:     { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8 },
  statChipText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
});

// ─── Shared styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 12, gap: 14 },

  topTabBar: {
    flexDirection: "row", marginHorizontal: 16, marginTop: 8, marginBottom: 4,
    borderRadius: 12, borderWidth: 1, padding: 4, gap: 4,
  },
  topTabBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 9, borderRadius: 9, borderWidth: 1, borderColor: "transparent",
  },
  topTabLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  execContainer: { flex: 1, flexDirection: "row" },
  execScroll: { flex: 1 },
  execContent: { padding: 14, gap: 14 },

  summaryCard: { borderRadius: 14, borderWidth: 1, padding: 14, overflow: "hidden" },
  summaryRow: { flexDirection: "row", alignItems: "center" },
  summaryItem: { flex: 1, alignItems: "center", gap: 4 },
  summaryValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  summaryLabel: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  summaryDivider: { width: 1, height: 30, marginHorizontal: 8 },

  phaseCard: { borderRadius: 14, borderWidth: 1, padding: 14 },
  phaseTitle: { fontSize: 12, fontFamily: "Inter_700Bold", marginBottom: 12 },
  phaseRow: { flexDirection: "row", gap: 12, paddingBottom: 4 },
  phaseItem: { alignItems: "center", gap: 5, width: 70 },
  phaseDot: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", borderWidth: 2 },
  phaseDotText: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#fff" },
  phaseName: { fontSize: 10, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  phaseYear: { fontSize: 10, fontFamily: "Inter_400Regular" },
  phaseBenefit: { fontSize: 9, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 13 },

  focusRow: { flexDirection: "row", borderRadius: 12, borderWidth: 1, padding: 4, gap: 4 },
  focusBtn: { flex: 1, alignItems: "center", gap: 4, padding: 8, borderRadius: 9, borderWidth: 1, borderColor: "transparent" },
  focusBtnLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  focusDesc: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, padding: 10 },
  focusDescText: { fontSize: 11, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 16 },

  sectionTitle: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1, textTransform: "uppercase" },

  sectorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  sectorCard: { width: "48%", borderRadius: 12, borderWidth: 1.5, padding: 12, gap: 6, position: "relative" },
  sectorIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  sectorName: { fontSize: 12, fontFamily: "Inter_700Bold" },
  sectorCount: { fontSize: 12, fontFamily: "Inter_700Bold" },
  sectorBar: { height: 4, borderRadius: 2, overflow: "hidden" },
  sectorBarFill: { height: "100%", borderRadius: 2 },
  sectorFocusBadge: { position: "absolute", top: 6, right: 6, width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center" },

  detailCard: { borderRadius: 16, borderWidth: 1.5, padding: 16, gap: 12, overflow: "hidden" },
  detailHeader: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  detailIconBig: { width: 50, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  detailHeaderText: { flex: 1 },
  detailTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  detailSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  detailTagline: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 3, fontStyle: "italic" },
  detailBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  detailBarFill: { height: "100%", borderRadius: 3 },
  effLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", marginTop: -4 },

  impactBlock: { borderRadius: 10, borderWidth: 1, padding: 10, gap: 6 },
  impactTitle: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 2 },
  impactLine: { flexDirection: "row", alignItems: "center", gap: 6 },
  impactText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },

  milestoneAchieved: { flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 9, borderWidth: 1, padding: 9 },
  milestoneAchievedText: { fontSize: 12, fontFamily: "Inter_600SemiBold", flex: 1 },
  milestoneNext: { flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 9, borderWidth: 1, padding: 8 },
  milestoneNextText: { fontSize: 11, fontFamily: "Inter_400Regular", flex: 1 },

  bonusRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  bonusBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 7 },
  bonusText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },

  maintRow: { flexDirection: "row", alignItems: "center", gap: 6, borderTopWidth: 1, paddingTop: 10 },
  maintText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  upgradeListTitle: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.8, textTransform: "uppercase" },
  upgradeList: { gap: 8 },
  upgradeItem: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderRadius: 10, borderWidth: 1, padding: 10,
  },
  upgradeItemLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  upgradeIdxBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  upgradeIdx: { fontSize: 10, fontFamily: "Inter_700Bold" },
  upgradeLabel: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
  upgradeCost: { fontSize: 12, fontFamily: "Inter_700Bold" },

  maxedBanner: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, padding: 12 },
  maxedText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  upgradeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 15, borderRadius: 13 },
  upgradeBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },

  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", alignItems: "center", justifyContent: "center", padding: 20 },
  modalBox: { width: "100%", maxWidth: 380, borderRadius: 20, borderWidth: 1.5, padding: 24, gap: 12, overflow: "hidden" },
  modalTitle: { fontSize: 17, fontFamily: "Inter_700Bold", textAlign: "center" },
  modalSector: { fontSize: 14, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  modalLabel: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  modalCostRow: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, paddingTop: 12 },
  modalCostLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  modalCostValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  modalBtns: { flexDirection: "row", gap: 10, marginTop: 6 },
  modalCancel: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  modalCancelText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  modalConfirm: { flex: 1, padding: 14, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  modalConfirmText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff" },
});
