import React, { useMemo, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Platform, TouchableOpacity, Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useGameplay } from "@/context/GameplayContext";
import { GridBackground } from "@/components/GridBackground";
import { ScreenHeader } from "@/components/ScreenHeader";
import { formatMoney, safeN } from "@/constants/gameEconomics";
import type { Competitor } from "@/constants/gameEngine";
import { computeRivalMarketValue } from "@/constants/gameEngine";
import {
  PLAYER_ATTACKS, PlayerAttackType, PLAYER_ATTACK_OUTCOMES,
  computePlayerAttackScore, rollPlayerAttackOutcome,
} from "@/constants/playerAttacks";

// ── Financial health helpers ────────────────────────────────────────────────
function rivalHealthColor(h?: string): string {
  if (h === "struggling") return "#F5A623";
  if (h === "critical")   return "#FF4D6A";
  if (h === "bankrupt")   return "#EF4444";
  return "#10B981";
}
function rivalHealthLabel(h?: string): string {
  if (h === "struggling") return "Pressionada";
  if (h === "critical")   return "Em Crise";
  if (h === "bankrupt")   return "Falida";
  return "Saudável";
}

const RISK_COLORS: Record<string, string> = {
  low:    "#10B981",
  medium: "#F5A623",
  high:   "#FF4D6A",
};
const RISK_LABELS: Record<string, string> = {
  low:    "Risco baixo",
  medium: "Risco médio",
  high:   "Risco alto",
};

// ── Contract types ─────────────────────────────────────────────────────────────
type Contract = {
  id: string;
  rivalId: string;
  rivalName: string;
  rivalColor: string;
  platform: string;
  playerShare: number;
  signedYear: number;
  signedMonth: number;
  status: "active" | "accepted" | "rejected" | "expired";
};

function AttackPanel({
  rival, state, currentMonthIdx, unlocked, colors, onAttack,
}: {
  rival: Competitor;
  state: any;
  currentMonthIdx: number;
  unlocked: boolean;
  colors: any;
  onAttack: (type: PlayerAttackType) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cooldowns = state.playerAttackCooldowns ?? {};
  const attackEntries = Object.entries(PLAYER_ATTACKS) as [PlayerAttackType, typeof PLAYER_ATTACKS[PlayerAttackType]][];

  if (!unlocked) {
    return (
      <View style={[styles.attackPanel, { backgroundColor: "#FF4D6A08", borderColor: "#FF4D6A22" }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Feather name="lock" size={12} color="#FF4D6A" />
          <Text style={[styles.attackLockText, { color: "#FF4D6A" }]}>
            Ataques bloqueados — lance 1 console ou 2 jogos para desbloquear.
          </Text>
        </View>
      </View>
    );
  }

  const score = computePlayerAttackScore("comparative_campaign", state.reputation, rival);
  const successRate = Math.round(Math.max(5, Math.min(90, score * 100)));

  return (
    <View style={[styles.attackPanel, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)} style={styles.attackHeader} activeOpacity={0.8}>
        <Feather name="crosshair" size={13} color="#FF4D6A" />
        <Text style={[styles.attackHeaderTitle, { color: colors.foreground }]}>Ações Ofensivas</Text>
        <View style={[styles.attackSuccessChip, { backgroundColor: successRate >= 55 ? "#10B98120" : successRate >= 35 ? "#F5A62320" : "#FF4D6A20" }]}>
          <Text style={[styles.attackSuccessText, { color: successRate >= 55 ? "#10B981" : successRate >= 35 ? "#F5A623" : "#FF4D6A" }]}>
            ~{successRate}% sucesso
          </Text>
        </View>
        <Feather name={expanded ? "chevron-up" : "chevron-down"} size={14} color={colors.mutedForeground} />
      </TouchableOpacity>

      {expanded && (
        <View style={{ gap: 6, marginTop: 8 }}>
          {attackEntries.map(([type, def]) => {
            const nextAllowed = cooldowns[type] ?? 0;
            const onCooldown  = currentMonthIdx < nextAllowed;
            const monthsLeft  = onCooldown ? nextAllowed - currentMonthIdx : 0;
            const canAfford   = state.money >= def.cost;
            const disabled    = onCooldown || !canAfford;

            const typeScore = computePlayerAttackScore(type, state.reputation, rival);
            const typeSuccessRate = Math.round(Math.max(5, Math.min(90, typeScore * 100)));

            const successOutcome  = PLAYER_ATTACK_OUTCOMES[type].sucesso;
            const fracassoOutcome = PLAYER_ATTACK_OUTCOMES[type].fracasso;

            return (
              <TouchableOpacity
                key={type}
                onPress={() => !disabled && onAttack(type)}
                style={[
                  styles.attackBtn,
                  {
                    backgroundColor: disabled ? colors.border + "40" : def.color + "10",
                    borderColor: disabled ? colors.border : def.color + "40",
                    opacity: disabled ? 0.6 : 1,
                  },
                ]}
                activeOpacity={disabled ? 1 : 0.8}
              >
                <View style={[styles.attackBtnIcon, { backgroundColor: def.color + "20" }]}>
                  <Feather name={def.icon as any} size={13} color={disabled ? colors.mutedForeground : def.color} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={[styles.attackBtnName, { color: disabled ? colors.mutedForeground : def.color }]}>
                      {def.label}
                    </Text>
                    <View style={[styles.riskBadge, { backgroundColor: RISK_COLORS[def.riskLevel] + "20" }]}>
                      <Text style={[styles.riskBadgeText, { color: RISK_COLORS[def.riskLevel] }]}>
                        {RISK_LABELS[def.riskLevel]}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.attackBtnDesc, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {def.description}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <Text style={[styles.attackOutcomeHint, { color: "#10B981" }]}>
                      ✓ {successOutcome.rivalRepDelta} rep / {successOutcome.rivalMarketShareDelta > 0 ? "+" : ""}{successOutcome.rivalMarketShareDelta.toFixed(1)}% fatia / +{successOutcome.fanStealed.toLocaleString()} fãs
                    </Text>
                    {fracassoOutcome.playerRepDelta < 0 && (
                      <Text style={[styles.attackOutcomeHint, { color: "#FF4D6A" }]}>
                        ✗ você {fracassoOutcome.playerRepDelta} rep
                      </Text>
                    )}
                  </View>
                </View>
                <View style={{ alignItems: "flex-end", gap: 3, minWidth: 70 }}>
                  <Text style={[styles.attackBtnCost, { color: disabled ? colors.mutedForeground : def.color }]}>
                    {formatMoney(def.cost)}
                  </Text>
                  {onCooldown ? (
                    <View style={[styles.cooldownChip, { backgroundColor: "#F5A62320" }]}>
                      <Feather name="clock" size={9} color="#F5A623" />
                      <Text style={[styles.cooldownText, { color: "#F5A623" }]}>{monthsLeft}m</Text>
                    </View>
                  ) : (
                    <Text style={[styles.attackBtnRate, { color: disabled ? colors.mutedForeground : "#10B981" }]}>
                      ~{typeSuccessRate}%
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}

          <View style={[styles.attackWarning, { backgroundColor: "#FF4D6A08", borderColor: "#FF4D6A22" }]}>
            <Feather name="alert-triangle" size={10} color="#FF4D6A" />
            <Text style={[styles.attackWarningText, { color: colors.mutedForeground }]}>
              Rivais agressivos contra-atacam. Fracassos têm consequências reais — reputação e fãs em risco.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ── NegotiationPanel (expandable, no new screen) ───────────────────────────────
function NegotiationPanel({
  rival, state, colors, existingContract, onPropose,
}: {
  rival: Competitor;
  state: any;
  colors: any;
  existingContract: Contract | undefined;
  onPropose: (rivalId: string, playerShare: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [playerShare, setPlayerShare] = useState(50);

  const avgScore = useMemo(() => {
    const released = (state.gameProjects ?? []).filter((p: any) => p.phase === "released");
    if (released.length === 0) return 50;
    return Math.round(released.reduce((s: number, g: any) => s + (g.receptionScore ?? 50), 0) / released.length);
  }, [state.gameProjects]);

  const acceptanceChance = useMemo(() => {
    let base = 60;
    const rivalStrength = rival.marketShare ?? 10;
    const reputation = state.reputation ?? 50;
    base += (reputation - 50) * 0.4;
    base -= (playerShare - 50) * 1.2;
    base -= (rivalStrength - 10) * 0.5;
    base += (avgScore - 50) * 0.3;
    if (existingContract) base += 10;
    return Math.round(Math.max(5, Math.min(92, base)));
  }, [playerShare, state.reputation, rival.marketShare, avgScore, existingContract]);

  const chanceColor = acceptanceChance >= 60 ? "#10B981" : acceptanceChance >= 35 ? "#F5A623" : "#FF4D6A";

  const SHARE_STEPS = [20, 30, 40, 50, 60, 70, 80];

  if (existingContract) {
    return (
      <View style={[styles.ctNegPanel, { backgroundColor: "#10B98108", borderColor: "#10B98133" }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Feather name="check-circle" size={12} color="#10B981" />
          <Text style={[styles.ctNegPanelTitle, { color: "#10B981" }]}>Contrato ativo: {existingContract.playerShare}% para você</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.ctNegPanel, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)} style={styles.ctNegHeader} activeOpacity={0.8}>
        <Feather name="file-text" size={12} color="#4DA6FF" />
        <Text style={[styles.ctNegPanelTitle, { color: colors.foreground, flex: 1 }]}>Negociar Contrato</Text>
        <View style={[styles.ctChanceChip, { backgroundColor: chanceColor + "20" }]}>
          <Text style={[styles.ctChanceText, { color: chanceColor }]}>{acceptanceChance}% aceitação</Text>
        </View>
        <Feather name={expanded ? "chevron-up" : "chevron-down"} size={13} color={colors.mutedForeground} />
      </TouchableOpacity>

      {expanded && (
        <View style={{ gap: 10, marginTop: 10 }}>
          <View style={[styles.ctPlatformRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="monitor" size={12} color={rival.color} />
            <Text style={[styles.ctPlatformText, { color: colors.foreground }]}>
              Plataforma: {rival.lastConsole}
            </Text>
          </View>

          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={[styles.ctSliderLabel, { color: colors.mutedForeground }]}>Divisão de receita</Text>
              <Text style={[styles.ctSliderValue, { color: "#4DA6FF" }]}>
                Você {playerShare}% · {rival.name} {100 - playerShare}%
              </Text>
            </View>
            <View style={styles.ctShareSteps}>
              {SHARE_STEPS.map((step) => (
                <TouchableOpacity
                  key={step}
                  onPress={() => setPlayerShare(step)}
                  style={[
                    styles.ctShareStep,
                    {
                      backgroundColor: playerShare === step ? "#4DA6FF" : colors.card,
                      borderColor: playerShare === step ? "#4DA6FF" : colors.border,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.ctShareStepText, { color: playerShare === step ? "#fff" : colors.mutedForeground }]}>
                    {step}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.ctAcceptanceRow, { backgroundColor: chanceColor + "10", borderColor: chanceColor + "33" }]}>
            <Feather name="activity" size={12} color={chanceColor} />
            <Text style={[styles.ctAcceptanceText, { color: chanceColor }]}>
              Probabilidade de aceitação: {acceptanceChance}%
            </Text>
            <Text style={[styles.ctAcceptanceHint, { color: colors.mutedForeground }]}>
              Rep {Math.round(state.reputation ?? 0)} · Rival {Math.round(rival.marketShare ?? 0).toFixed(0)}% mercado
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.ctSendBtn, { backgroundColor: "#4DA6FF" }]}
            activeOpacity={0.85}
            onPress={() => {
              setExpanded(false);
              onPropose(rival.id, playerShare);
            }}
          >
            <Feather name="send" size={13} color="#fff" />
            <Text style={styles.ctSendBtnText}>Enviar Proposta</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ── AcquisitionPanel ──────────────────────────────────────────────────────────
function AcquisitionPanel({
  rival, playerMoney, colors, onAcquire,
}: {
  rival: Competitor;
  playerMoney: number;
  colors: any;
  onAcquire: (rivalId: string) => void;
}) {
  const isBankrupt    = rival.alive === false;
  const price         = rival.acquisitionPrice ?? 0;
  const canAfford     = playerMoney >= price;
  const health        = rival.financialHealth ?? (isBankrupt ? "bankrupt" : "healthy");
  const healthCol     = rivalHealthColor(health);
  const successGuide  =
    health === "bankrupt"   ? "~92%" :
    health === "critical"   ? "~72%" :
    health === "struggling" ? "~50%" : "~18%";
  const panelTitle    = isBankrupt ? "Comprar Ativos de Liquidação"
    : health === "healthy" ? "Oferta de Compra Hostil"
    : "Proposta de Aquisição";

  return (
    <View style={[styles.acqPanel, { backgroundColor: healthCol + "0A", borderColor: healthCol + "33" }]}>
      <View style={styles.acqHeader}>
        <View style={[styles.acqIconWrap, { backgroundColor: healthCol + "22" }]}>
          <Feather name="briefcase" size={13} color={healthCol} />
        </View>
        <Text style={[styles.acqTitle, { color: healthCol }]}>
          {panelTitle}
        </Text>
        <View style={[styles.acqChanceBadge, { backgroundColor: healthCol + "22" }]}>
          <Text style={[styles.acqChanceText, { color: healthCol }]}>{successGuide}</Text>
        </View>
      </View>

      <View style={styles.acqDetails}>
        <View style={[styles.acqDetailRow, { borderColor: colors.border }]}>
          <Feather name="dollar-sign" size={12} color={colors.mutedForeground} />
          <Text style={[styles.acqDetailLabel, { color: colors.mutedForeground }]}>Preço estimado</Text>
          <Text style={[styles.acqDetailValue, { color: canAfford ? "#10B981" : "#EF4444" }]}>
            {formatMoney(price)}
          </Text>
        </View>
        {rival.marketValue != null && rival.marketValue > 0 && (
          <View style={[styles.acqDetailRow, { borderColor: colors.border }]}>
            <Feather name="trending-up" size={12} color={colors.mutedForeground} />
            <Text style={[styles.acqDetailLabel, { color: colors.mutedForeground }]}>Valor de mercado</Text>
            <Text style={[styles.acqDetailValue, { color: colors.foreground }]}>
              {formatMoney(rival.marketValue)}
            </Text>
          </View>
        )}
        <View style={[styles.acqDetailRow, { borderColor: colors.border }]}>
          <Feather name="pie-chart" size={12} color={colors.mutedForeground} />
          <Text style={[styles.acqDetailLabel, { color: colors.mutedForeground }]}>Mercado a absorver</Text>
          <Text style={[styles.acqDetailValue, { color: "#4DA6FF" }]}>
            ~{((rival.marketShare ?? 0) * (isBankrupt ? 0.50 : 0.65)).toFixed(1)}%
          </Text>
        </View>
      </View>

      {!canAfford && (
        <View style={[styles.acqWarning, { borderColor: "#EF444433", backgroundColor: "#EF444408" }]}>
          <Feather name="alert-circle" size={11} color="#EF4444" />
          <Text style={[styles.acqWarningText, { color: "#EF4444" }]}>
            Fundos insuficientes — precisas de mais {formatMoney(price - playerMoney)}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.acqBtn,
          { backgroundColor: canAfford ? healthCol : colors.secondary, opacity: canAfford ? 1 : 0.5 },
        ]}
        activeOpacity={0.8}
        disabled={!canAfford}
        onPress={() => onAcquire(rival.id)}
      >
        <Feather name="briefcase" size={14} color="#fff" />
        <Text style={styles.acqBtnText}>
          {isBankrupt ? "Comprar Ativos" : "Fazer Proposta"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Aquisições helpers ─────────────────────────────────────────────────────────

type FinancialHealth = "healthy" | "struggling" | "critical" | "bankrupt";

function deriveHealth(c: Competitor): FinancialHealth {
  if (c.alive === false) return "bankrupt";
  return (c.financialHealth as FinancialHealth) ?? "healthy";
}

function acqNegotiationOpenness(h: FinancialHealth): { label: string; color: string } {
  if (h === "bankrupt")  return { label: "Alta",   color: "#10B981" };
  if (h === "critical")  return { label: "Alta",   color: "#10B981" };
  if (h === "struggling")return { label: "Média",  color: "#F5A623" };
  return                        { label: "Baixa",  color: "#EF4444" };
}

function acqStyleLabel(h: FinancialHealth, playerShare: number, rivalShare: number): string {
  if (h === "bankrupt")  return "Aquisição por Liquidação";
  if (h === "critical")  return "Aquisição em Crise";
  if (h === "struggling")return "Oferta Estratégica";
  return playerShare > rivalShare + 5 ? "Oferta Hostil" : "Oferta Amigável";
}

function computeAcqChance(
  h: FinancialHealth,
  offerPct: number,
  playerShare: number,
  rivalShare: number,
  playerRep: number,
): number {
  let base = h === "bankrupt" ? 84 : h === "critical" ? 62 : h === "struggling" ? 40 : 16;
  base += (offerPct - 100) * 0.55;
  base += (playerShare - rivalShare) * 0.3;
  base += (playerRep - 50) * 0.18;
  return Math.round(Math.max(3, Math.min(95, base)));
}

function acqBenefitLabel(c: Competitor): string {
  const s = c.style ?? "safe_profit";
  if (s === "tech_focused")       return "+1% inovação de produto";
  if (s === "mass_market")        return "+2% alcance de campanha";
  if (s === "innovation_first")   return "+1% rating de lançamento";
  if (s === "franchise_focused")  return "+1% retenção de fãs";
  return "-2% custo operacional";
}

const ACQ_OFFER_STEPS = [50, 75, 100, 125];

function AcqNegPanel({
  rival, playerShare, playerRep, playerMoney,
  colors, onBankruptAcquire, onAliveAcquire,
}: {
  rival: Competitor;
  playerShare: number;
  playerRep: number;
  playerMoney: number;
  colors: any;
  onBankruptAcquire: (id: string) => void;
  onAliveAcquire: (id: string, chance: number, offerAmount: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [offerPct, setOfferPct] = useState(100);

  const health       = deriveHealth(rival);
  const isBankrupt   = health === "bankrupt";
  const estimated    = rival.marketValue ?? computeRivalMarketValue(rival);
  const offerAmount  = Math.round(estimated * offerPct / 100);
  const canAfford    = playerMoney >= offerAmount;
  const chance       = computeAcqChance(health, offerPct, playerShare, rival.marketShare ?? 5, playerRep);
  const chanceColor  = chance >= 60 ? "#10B981" : chance >= 35 ? "#F5A623" : "#EF4444";
  const healthCol    = rivalHealthColor(health);

  const handlePropose = () => {
    if (!canAfford) return;
    if (isBankrupt) {
      onBankruptAcquire(rival.id);
    } else {
      onAliveAcquire(rival.id, chance, offerAmount);
    }
    setExpanded(false);
  };

  return (
    <View style={[aqStyles.negPanel, { backgroundColor: healthCol + "0A", borderColor: healthCol + "33" }]}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)} style={aqStyles.negHeader} activeOpacity={0.8}>
        <View style={[aqStyles.negIconWrap, { backgroundColor: healthCol + "22" }]}>
          <Feather name="briefcase" size={12} color={healthCol} />
        </View>
        <Text style={[aqStyles.negTitle, { color: healthCol }]}>Negociar Aquisição</Text>
        <View style={[aqStyles.negChancePill, { backgroundColor: chanceColor + "22" }]}>
          <Text style={[aqStyles.negChanceText, { color: chanceColor }]}>{chance}% aceitar</Text>
        </View>
        <Feather name={expanded ? "chevron-up" : "chevron-down"} size={13} color={colors.mutedForeground} />
      </TouchableOpacity>

      {expanded && (
        <View style={{ gap: 10, marginTop: 10 }}>
          {/* Estimated value row */}
          <View style={[aqStyles.negDataRow, { borderColor: colors.border }]}>
            <Feather name="trending-up" size={12} color={colors.mutedForeground} />
            <Text style={[aqStyles.negDataLabel, { color: colors.mutedForeground }]}>Valor estimado de mercado</Text>
            <Text style={[aqStyles.negDataValue, { color: colors.foreground }]}>{formatMoney(estimated)}</Text>
          </View>

          {/* Offer step picker */}
          {!isBankrupt && (
            <View style={{ gap: 6 }}>
              <Text style={[aqStyles.negOfferLabel, { color: colors.mutedForeground }]}>Oferta como % do valor estimado</Text>
              <View style={aqStyles.negSteps}>
                {ACQ_OFFER_STEPS.map(pct => (
                  <TouchableOpacity
                    key={pct}
                    style={[
                      aqStyles.negStep,
                      {
                        backgroundColor: offerPct === pct ? healthCol : colors.card,
                        borderColor: offerPct === pct ? healthCol : colors.border,
                      },
                    ]}
                    onPress={() => setOfferPct(pct)}
                    activeOpacity={0.8}
                  >
                    <Text style={[aqStyles.negStepText, { color: offerPct === pct ? "#fff" : colors.mutedForeground }]}>
                      {pct}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Offer amount */}
          <View style={[aqStyles.negDataRow, { borderColor: colors.border }]}>
            <Feather name="dollar-sign" size={12} color={colors.mutedForeground} />
            <Text style={[aqStyles.negDataLabel, { color: colors.mutedForeground }]}>
              {isBankrupt ? "Preço de liquidação" : `Oferta proposta (${offerPct}%)`}
            </Text>
            <Text style={[aqStyles.negDataValue, { color: canAfford ? "#10B981" : "#EF4444" }]}>
              {formatMoney(isBankrupt ? (rival.acquisitionPrice ?? estimated * 0.35) : offerAmount)}
            </Text>
          </View>

          {/* Acquisition style */}
          <View style={[aqStyles.negDataRow, { borderColor: colors.border }]}>
            <Feather name="flag" size={12} color={colors.mutedForeground} />
            <Text style={[aqStyles.negDataLabel, { color: colors.mutedForeground }]}>Tipo de aquisição</Text>
            <Text style={[aqStyles.negDataValue, { color: healthCol }]}>
              {acqStyleLabel(health, playerShare, rival.marketShare ?? 5)}
            </Text>
          </View>

          {/* Market absorption estimate */}
          <View style={[aqStyles.negDataRow, { borderColor: colors.border }]}>
            <Feather name="pie-chart" size={12} color={colors.mutedForeground} />
            <Text style={[aqStyles.negDataLabel, { color: colors.mutedForeground }]}>Fatia de mercado a absorver</Text>
            <Text style={[aqStyles.negDataValue, { color: "#4DA6FF" }]}>
              ~{((rival.marketShare ?? 0) * (isBankrupt ? 0.50 : 0.65)).toFixed(1)}%
            </Text>
          </View>

          {/* Chance row */}
          <View style={[aqStyles.negChanceRow, { backgroundColor: chanceColor + "10", borderColor: chanceColor + "33" }]}>
            <Feather name="activity" size={12} color={chanceColor} />
            <Text style={[aqStyles.negChanceRowText, { color: chanceColor }]}>
              Probabilidade de aceitação: {chance}%
            </Text>
          </View>

          {/* Insufficient funds warning */}
          {!canAfford && (
            <View style={[aqStyles.negWarning, { backgroundColor: "#EF444408", borderColor: "#EF444433" }]}>
              <Feather name="alert-circle" size={11} color="#EF4444" />
              <Text style={[aqStyles.negWarningText, { color: "#EF4444" }]}>
                Fundos insuficientes — faltam {formatMoney((isBankrupt ? (rival.acquisitionPrice ?? estimated * 0.35) : offerAmount) - playerMoney)}
              </Text>
            </View>
          )}

          {/* CTA */}
          <TouchableOpacity
            style={[aqStyles.negBtn, { backgroundColor: canAfford ? healthCol : colors.secondary, opacity: canAfford ? 1 : 0.5 }]}
            onPress={handlePropose}
            disabled={!canAfford}
            activeOpacity={0.85}
          >
            <Feather name="send" size={14} color="#fff" />
            <Text style={aqStyles.negBtnText}>
              {isBankrupt ? "Comprar Ativos de Liquidação" : "Enviar Proposta"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function MarketScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state, executePlayerAttack, acquireRival } = useGameplay();
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  // ── Tab state ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"overview" | "contracts" | "acquisitions">("overview");

  // ── Contract state (local; foundation for context integration) ────────────
  const [contracts, setContracts] = useState<Contract[]>([]);

  // ── Acquisitions state (fully local — alive rival buyouts) ────────────────
  const [acquiredAlive, setAcquiredAlive] = useState<string[]>([]); // rival IDs acquired by player (alive at time)

  // Derived values — computed before any early return so hooks are always called in the same order
  const aliveCompetitors  = state ? state.competitors.filter((c) => c.alive !== false) : [];
  const deadCompetitors   = state ? state.competitors.filter((c) => c.alive === false)  : [];

  const currentMonthIdx = state ? state.year * 12 + state.month : 0;
  const consolesBuilt   = state ? (state.consoles ?? []).length : 0;
  const gamesReleased   = state ? (state.gameProjects ?? []).filter((p) => p.phase === "released").length : 0;
  const attacksUnlocked = consolesBuilt >= 1 || gamesReleased >= 2;

  const allActive = useMemo(() => {
    if (!state) return [];
    return [
    {
      id: "_you",
      name: state.companyName,
      share: safeN(state.marketShare, 0),
      rep: state.reputation,
      color: "#4DA6FF",
      icon: "trending-up",
      lastProduct: state.consoles[state.consoles.length - 1]?.name ?? "—",
      isYou: true,
      money: state.money,
      innovation: null as number | null,
      alive: true,
    },
    ...aliveCompetitors.map((c) => ({
      id: c.id,
      name: c.name,
      share: safeN(c.marketShare, 0),
      rep: c.reputation,
      color: c.color,
      icon: c.icon,
      lastProduct: c.lastConsole,
      isYou: false,
      money: c.money ?? null,
      innovation: c.innovation ?? null,
      alive: true,
    })),
    ].sort((a, b) => b.share - a.share);
  },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [state, state?.marketShare, state?.reputation, state?.money, state?.companyName, state?.consoles, state?.competitors]);

  // Early return AFTER all hooks — safe to do here
  if (!state) return null;

  function handleAttack(rivalId: string, type: PlayerAttackType) {
    const rival = aliveCompetitors.find((c) => c.id === rivalId);
    if (!rival) return;
    const def = PLAYER_ATTACKS[type];

    Alert.alert(
      `Confirmar: ${def.label}`,
      `Atacar ${rival.name} com ${def.label}?\n\nCusto: $${def.cost.toLocaleString()}\nCooldown: ${def.cooldownMonths} meses após execução\n\nRisco: ${RISK_LABELS[def.riskLevel]}. O rival pode contra-atacar.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar Ataque",
          style: "destructive",
          onPress: () => {
            const result = executePlayerAttack(rivalId, type);
            if (result.error) {
              Alert.alert("Erro", result.error);
            } else {
              Alert.alert(
                "Ataque Executado",
                result.outcomeLabel ?? "Ação concluída.",
                [{ text: "OK" }],
              );
            }
          },
        },
      ],
    );
  }

  // ── Acquisition logic ──────────────────────────────────────────────────────
  function handleAcquire(rivalId: string) {
    const rival = state!.competitors.find((c) => c.id === rivalId);
    if (!rival) return;
    const price      = rival.acquisitionPrice ?? 0;
    const isBankrupt = rival.alive === false;

    Alert.alert(
      isBankrupt ? `Comprar Ativos: ${rival.name}` : `Adquirir ${rival.name}`,
      `${isBankrupt ? "Compra os ativos de liquidação de" : "Proposta de aquisição para"} ${rival.name}.\n\nPreço: ${formatMoney(price)}\nSaldo: ${formatMoney(state!.money ?? 0)}\n\n${isBankrupt ? "Absorverás parte da fatia de mercado e ativos." : "Esta empresa está em dificuldades e pode aceitar uma proposta."}`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: isBankrupt ? "Comprar Ativos" : "Fazer Proposta",
          onPress: () => {
            const result = acquireRival(rivalId);
            if (result.success) {
              Alert.alert("✅ Aquisição Concluída", `${rival.name} foi adquirida com sucesso!`, [{ text: "OK" }]);
            } else {
              Alert.alert("❌ Proposta Recusada", result.error ?? "A aquisição falhou.", [{ text: "OK" }]);
            }
          },
        },
      ],
    );
  }

  // ── Contract logic ─────────────────────────────────────────────────────────
  function handlePropose(rivalId: string, playerShare: number) {
    const rival = aliveCompetitors.find((c) => c.id === rivalId);
    if (!rival) return;

    const avgScore = (() => {
      const released = (state.gameProjects ?? []).filter((p: any) => p.phase === "released");
      if (released.length === 0) return 50;
      return Math.round(released.reduce((s: number, g: any) => s + (g.receptionScore ?? 50), 0) / released.length);
    })();

    const existingContract = contracts.find(c => c.rivalId === rivalId && c.status === "active");
    let base = 60;
    base += (state.reputation - 50) * 0.4;
    base -= (playerShare - 50) * 1.2;
    base -= ((rival.marketShare ?? 10) - 10) * 0.5;
    base += (avgScore - 50) * 0.3;
    if (existingContract) base += 10;
    const chance = Math.max(5, Math.min(92, base));
    const accepted = Math.random() * 100 < chance;

    const id = `contract_${rivalId}_${Date.now()}`;

    if (accepted) {
      const newContract: Contract = {
        id,
        rivalId,
        rivalName: rival.name,
        rivalColor: rival.color,
        platform: rival.lastConsole,
        playerShare,
        signedYear: state.year,
        signedMonth: state.month,
        status: "active",
      };
      setContracts(prev => [
        ...prev.filter(c => c.rivalId !== rivalId || c.status !== "active"),
        newContract,
      ]);
      Alert.alert(
        "✅ Proposta Aceite!",
        `${rival.name} aceitou o contrato.\n\nPlataforma: ${rival.lastConsole}\nDivisão: ${playerShare}% para você · ${100 - playerShare}% para ${rival.name}\n\nPodes agora lançar jogos na plataforma deles.`,
        [{ text: "Ótimo!" }],
      );
    } else {
      setContracts(prev => [
        ...prev,
        {
          id,
          rivalId,
          rivalName: rival.name,
          rivalColor: rival.color,
          platform: rival.lastConsole,
          playerShare,
          signedYear: state.year,
          signedMonth: state.month,
          status: "rejected",
        },
      ]);
      Alert.alert(
        "❌ Proposta Recusada",
        `${rival.name} recusou a proposta de ${playerShare}% para você.\n\nTenta melhorar a tua reputação ou oferecer uma divisão mais favorável para eles.`,
        [{ text: "Entendido" }],
      );
    }
  }

  function handleTerminate(contractId: string) {
    setContracts(prev =>
      prev.map(c => c.id === contractId ? { ...c, status: "expired" } : c),
    );
  }

  // ── Alive rival acquisition (local state only) ────────────────────────────
  function handleAcquireAlive(rivalId: string, chance: number, offerAmount: number) {
    const rival = aliveCompetitors.find(c => c.id === rivalId);
    if (!rival) return;
    Alert.alert(
      `Proposta: ${rival.name}`,
      `Enviar proposta de aquisição por ${formatMoney(offerAmount)}?\n\nProbabilidade de aceitação: ${chance}%\n\nTipo: ${acqStyleLabel(deriveHealth(rival), safeN(state?.marketShare, 0), rival.marketShare ?? 5)}`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Enviar Proposta",
          onPress: () => {
            const accepted = Math.random() * 100 < chance;
            if (accepted) {
              setAcquiredAlive(prev => [...prev, rivalId]);
              Alert.alert(
                "✅ Proposta Aceite",
                `${rival.name} aceitou a proposta.\n\nA empresa agora faz parte do seu portfolio como subsidiária.\n\nBenefício: ${acqBenefitLabel(rival)}`,
                [{ text: "Excelente!" }],
              );
            } else {
              Alert.alert(
                "❌ Proposta Recusada",
                `${rival.name} recusou a oferta de ${formatMoney(offerAmount)}.\n\nTenta uma oferta mais alta ou aguarda que a empresa entre em dificuldades.`,
                [{ text: "Entendido" }],
              );
            }
          },
        },
      ],
    );
  }

  const activeContracts  = contracts.filter(c => c.status === "active");
  const historyContracts = contracts.filter(c => c.status !== "active");

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GridBackground />
      <ScreenHeader title="Mercado" />

      {/* ── Tab selector ───────────────────────────────────────────────────── */}
      <View style={[styles.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "overview" && styles.tabBtnActive]}
          onPress={() => setActiveTab("overview")}
          activeOpacity={0.8}
        >
          <Feather name="bar-chart-2" size={13} color={activeTab === "overview" ? "#4DA6FF" : colors.mutedForeground} />
          <Text style={[styles.tabBtnText, { color: activeTab === "overview" ? "#4DA6FF" : colors.mutedForeground }]}>
            Visão Geral
          </Text>
          {activeTab === "overview" && <View style={styles.tabBtnUnderline} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "contracts" && styles.tabBtnActive]}
          onPress={() => setActiveTab("contracts")}
          activeOpacity={0.8}
        >
          <Feather name="file-text" size={13} color={activeTab === "contracts" ? "#10B981" : colors.mutedForeground} />
          <Text style={[styles.tabBtnText, { color: activeTab === "contracts" ? "#10B981" : colors.mutedForeground }]}>
            Contratos
          </Text>
          {activeContracts.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{activeContracts.length}</Text>
            </View>
          )}
          {activeTab === "contracts" && <View style={[styles.tabBtnUnderline, { backgroundColor: "#10B981" }]} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "acquisitions" && styles.tabBtnActive]}
          onPress={() => setActiveTab("acquisitions")}
          activeOpacity={0.8}
        >
          <Feather name="briefcase" size={13} color={activeTab === "acquisitions" ? "#A855F7" : colors.mutedForeground} />
          <Text style={[styles.tabBtnText, { color: activeTab === "acquisitions" ? "#A855F7" : colors.mutedForeground }]}>
            Aquisições
          </Text>
          {(() => {
            const bankrupt = state.competitors.filter(c => c.alive === false && c.isAcquirable && !c.acquiredByPlayer).length;
            return bankrupt > 0 ? (
              <View style={[styles.tabBadge, { backgroundColor: "#EF4444" }]}>
                <Text style={styles.tabBadgeText}>{bankrupt}</Text>
              </View>
            ) : null;
          })()}
          {activeTab === "acquisitions" && <View style={[styles.tabBtnUnderline, { backgroundColor: "#A855F7" }]} />}
        </TouchableOpacity>
      </View>

      {/* ── OVERVIEW TAB (existing content, untouched) ─────────────────────── */}
      {activeTab === "overview" && (
        <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 24 }]} showsVerticalScrollIndicator={false} removeClippedSubviews>

          {/* Market Overview */}
          <View style={[styles.overviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <LinearGradient colors={["#4DA6FF08", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <Text style={[styles.overviewTitle, { color: colors.foreground }]}>Visão Geral do Mercado</Text>
            <View style={styles.overviewStats}>
              <OverStat label="Sua Fatia" value={`${safeN(state.marketShare, 0).toFixed(1)}%`} color="#4DA6FF" colors={colors} />
              <OverStat label="Rivais Ativos" value={String(aliveCompetitors.length)} color="#A855F7" colors={colors} />
              <OverStat label="Falidos" value={String(deadCompetitors.length)} color="#EF4444" colors={colors} />
              <OverStat label="Reputação" value={`${Math.round(state.reputation)}%`} color="#F5A623" colors={colors} />
            </View>
            <View style={styles.shareBarWrap}>
              <View style={[styles.shareBar, { backgroundColor: colors.border }]}>
                <View style={[
                  styles.shareBarFill,
                  {
                    width: `${Math.min(100, state.marketShare)}%`,
                    backgroundColor: "#4DA6FF",
                    // @ts-ignore
                    transition: "width 0.6s ease",
                  },
                ]} />
              </View>
              <Text style={[styles.shareBarLabel, { color: colors.mutedForeground }]}>
                {safeN(state.marketShare, 0).toFixed(1)}% do mercado global
              </Text>
            </View>
          </View>

          {/* Attack unlock status */}
          {!attacksUnlocked && (
            <View style={[styles.unlockBanner, { backgroundColor: "#F5A62310", borderColor: "#F5A62330" }]}>
              <Feather name="lock" size={14} color="#F5A623" />
              <Text style={[styles.unlockText, { color: "#F5A623" }]}>
                Ações ofensivas desbloqueadas após lançar 1 console ou 2 jogos.
              </Text>
            </View>
          )}

          {/* Active Rankings */}
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>RANKING DE MERCADO</Text>
          {allActive.map((player, rank) => {
            const barWidth = Math.min(100, Math.max(0, player.share ?? 0));
            const innovTier = player.innovation === null
              ? null
              : player.innovation >= 75 ? { label: "Alta Inovação", color: "#10B981" }
              : player.innovation >= 55 ? { label: "Inovação Média", color: "#F5A623" }
              : { label: "Inovação Baixa", color: "#EF4444" };

            const rival = !player.isYou ? aliveCompetitors.find((c) => c.id === player.id) : null;

            return (
              <View
                key={player.id}
                style={[
                  styles.playerCard,
                  {
                    backgroundColor: player.isYou ? "#4DA6FF11" : colors.card,
                    borderColor: player.isYou ? "#4DA6FF44" : colors.border,
                  },
                ]}
              >
                {/* Header row */}
                <View style={styles.playerHeader}>
                  <View style={[styles.rankBadge, { backgroundColor: rank === 0 ? "#F5A62322" : colors.secondary }]}>
                    <Text style={[styles.rankNum, { color: rank === 0 ? "#F5A623" : colors.mutedForeground }]}>
                      #{rank + 1}
                    </Text>
                  </View>
                  <View style={[styles.playerIcon, { backgroundColor: player.color + "22" }]}>
                    <Feather name={player.icon as any} size={18} color={player.color} />
                  </View>
                  <View style={styles.playerMeta}>
                    <View style={styles.playerNameRow}>
                      <Text style={[styles.playerName, { color: colors.foreground }]}>{player.name}</Text>
                      {player.isYou && (
                        <View style={[styles.youTag, { backgroundColor: "#4DA6FF22" }]}>
                          <Text style={styles.youTagText}>Você</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.playerProduct, { color: colors.mutedForeground }]}>
                      Último: {player.lastProduct}
                    </Text>
                  </View>
                  <Text style={[styles.playerShare, { color: player.color }]}>
                    {player.share.toFixed(1)}%
                  </Text>
                </View>

                {/* Share bar */}
                <View style={[styles.shareTrack, { backgroundColor: colors.border }]}>
                  <View style={[
                    styles.shareFill,
                    {
                      width: `${barWidth}%`,
                      backgroundColor: player.color,
                      // @ts-ignore
                      transition: "width 0.6s ease",
                    },
                  ]} />
                </View>

                {/* Footer chips */}
                <View style={styles.playerFooter}>
                  <View style={[styles.chip, { backgroundColor: player.color + "15" }]}>
                    <Feather name="star" size={10} color={player.color} />
                    <Text style={[styles.chipText, { color: player.color }]}>Rep {Math.round(player.rep)}%</Text>
                  </View>

                  {player.money !== null && (
                    <View style={[styles.chip, { backgroundColor: player.money < 0 ? "#EF444420" : "#10B98120" }]}>
                      <Feather name="dollar-sign" size={10} color={player.money < 0 ? "#EF4444" : "#10B981"} />
                      <Text style={[styles.chipText, { color: player.money < 0 ? "#EF4444" : "#10B981" }]}>
                        {formatMoney(player.money)}
                      </Text>
                    </View>
                  )}

                  {innovTier && (
                    <View style={[styles.chip, { backgroundColor: innovTier.color + "20" }]}>
                      <Feather name="cpu" size={10} color={innovTier.color} />
                      <Text style={[styles.chipText, { color: innovTier.color }]}>
                        {innovTier.label} {Math.round(player.innovation!)}
                      </Text>
                    </View>
                  )}

                  {rival && (rival as Competitor).aggressiveness !== undefined && (
                    <View style={[styles.chip, { backgroundColor: (rival.aggressiveness ?? 0) >= 70 ? "#FF4D6A20" : "#F5A62320" }]}>
                      <Feather name="zap" size={10} color={(rival.aggressiveness ?? 0) >= 70 ? "#FF4D6A" : "#F5A623"} />
                      <Text style={[styles.chipText, { color: (rival.aggressiveness ?? 0) >= 70 ? "#FF4D6A" : "#F5A623" }]}>
                        Agressividade {rival.aggressiveness}
                      </Text>
                    </View>
                  )}

                  {/* Financial health badge (only when not healthy) */}
                  {rival && rival.financialHealth && rival.financialHealth !== "healthy" && (
                    <View style={[styles.chip, { backgroundColor: rivalHealthColor(rival.financialHealth) + "20" }]}>
                      <Feather name="alert-circle" size={10} color={rivalHealthColor(rival.financialHealth)} />
                      <Text style={[styles.chipText, { color: rivalHealthColor(rival.financialHealth) }]}>
                        {rivalHealthLabel(rival.financialHealth)}
                      </Text>
                    </View>
                  )}

                  {/* Market value */}
                  {rival && rival.marketValue != null && rival.marketValue > 0 && (
                    <View style={[styles.chip, { backgroundColor: "#A855F720" }]}>
                      <Feather name="briefcase" size={10} color="#A855F7" />
                      <Text style={[styles.chipText, { color: "#A855F7" }]}>Val. {formatMoney(rival.marketValue)}</Text>
                    </View>
                  )}
                </View>

                {/* Innovation bar (rivals only) */}
                {player.innovation !== null && (
                  <View style={styles.innovWrap}>
                    <View style={[styles.innovTrack, { backgroundColor: colors.border }]}>
                      <View
                        style={[
                          styles.innovFill,
                          {
                            width: `${player.innovation}%`,
                            backgroundColor:
                              player.innovation >= 75 ? "#10B981"
                              : player.innovation >= 55 ? "#F5A623"
                              : "#EF4444",
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.innovLabel, { color: colors.mutedForeground }]}>
                      Inovação {Math.round(player.innovation)}/100
                    </Text>
                  </View>
                )}

                {/* Attack Panel — only for rivals, never for the player */}
                {rival && (
                  <AttackPanel
                    rival={rival}
                    state={state}
                    currentMonthIdx={currentMonthIdx}
                    unlocked={attacksUnlocked}
                    colors={colors}
                    onAttack={(type) => handleAttack(rival.id, type)}
                  />
                )}

                {/* Acquisition Panel — shown for struggling or critical rivals */}
                {rival && rival.isAcquirable && rival.alive !== false && (
                  <AcquisitionPanel
                    rival={rival}
                    playerMoney={state.money ?? 0}
                    colors={colors}
                    onAcquire={handleAcquire}
                  />
                )}
              </View>
            );
          })}

          {/* Bankrupt Rivals */}
          {deadCompetitors.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>EMPRESAS FALIDAS</Text>
              {deadCompetitors.map((c) => (
                <BankruptCard key={c.id} rival={c} colors={colors} playerMoney={state.money ?? 0} onAcquire={handleAcquire} />
              ))}
            </>
          )}

          {/* Market Trends */}
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>TENDÊNCIAS</Text>
          <View style={[styles.trendsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {[
              { icon: "trending-up", label: "Jogos mobile em alta", color: "#10B981" },
              { icon: "cpu", label: "Hardware mais barato em 2024+", color: "#4DA6FF" },
              { icon: "globe", label: "Mercado asiático crescendo 22%", color: "#A855F7" },
              { icon: "wifi", label: "Cloud gaming ganha adeptos", color: "#F5A623" },
            ].map((t, i) => (
              <View key={i} style={[styles.trendRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                <View style={[styles.trendIcon, { backgroundColor: t.color + "22" }]}>
                  <Feather name={t.icon as any} size={14} color={t.color} />
                </View>
                <Text style={[styles.trendText, { color: colors.foreground }]}>{t.label}</Text>
                <Feather name="arrow-up-right" size={14} color={t.color} />
              </View>
            ))}
          </View>

        </ScrollView>
      )}

      {/* ── CONTRACTS TAB ─────────────────────────────────────────────────────── */}
      {activeTab === "contracts" && (
        <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 24 }]} showsVerticalScrollIndicator={false}>

          {/* A) Negotiation Center */}
          <View style={{ gap: 4 }}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CENTRO DE NEGOCIAÇÃO</Text>
            <Text style={[styles.ctSubLabel, { color: colors.mutedForeground }]}>
              Negocia contratos de distribuição com rivais para lançar jogos nas suas plataformas.
            </Text>
          </View>

          {aliveCompetitors.length === 0 && (
            <View style={[styles.ctEmptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="users" size={28} color={colors.mutedForeground} />
              <Text style={[styles.ctEmptyText, { color: colors.mutedForeground }]}>Sem rivais ativos para negociar</Text>
            </View>
          )}

          {aliveCompetitors.map((rival) => {
            const existingContract = activeContracts.find(c => c.rivalId === rival.id);
            const strengthTier = (rival.marketShare ?? 0) >= 25 ? "Alto" : (rival.marketShare ?? 0) >= 12 ? "Médio" : "Baixo";
            const strengthColor = (rival.marketShare ?? 0) >= 25 ? "#FF4D6A" : (rival.marketShare ?? 0) >= 12 ? "#F5A623" : "#10B981";
            const expectedRev = Math.round(50 * (1 - (rival.marketShare ?? 0) / 100));

            return (
              <View key={rival.id} style={[styles.ctRivalCard, { backgroundColor: colors.card, borderColor: existingContract ? "#10B98133" : colors.border }]}>
                <LinearGradient
                  colors={[rival.color + "08", "transparent"]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.ctRivalHeader}>
                  <View style={[styles.ctRivalIcon, { backgroundColor: rival.color + "22" }]}>
                    <Feather name={rival.icon as any} size={18} color={rival.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={[styles.ctRivalName, { color: colors.foreground }]}>{rival.name}</Text>
                      {existingContract && (
                        <View style={[styles.ctActiveBadge, { backgroundColor: "#10B98120" }]}>
                          <Text style={[styles.ctActiveBadgeText, { color: "#10B981" }]}>Contrato ativo</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.ctRivalPlatform, { color: colors.mutedForeground }]}>
                      📺 {rival.lastConsole}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 3 }}>
                    <Text style={[styles.ctRivalShare, { color: rival.color }]}>
                      {(rival.marketShare ?? 0).toFixed(1)}%
                    </Text>
                    <Text style={[styles.ctRivalShareLabel, { color: colors.mutedForeground }]}>mercado</Text>
                  </View>
                </View>

                <View style={styles.ctRivalChips}>
                  <View style={[styles.ctChip, { backgroundColor: rival.color + "15" }]}>
                    <Feather name="star" size={9} color={rival.color} />
                    <Text style={[styles.ctChipText, { color: rival.color }]}>Pop {Math.round(rival.reputation)}%</Text>
                  </View>
                  <View style={[styles.ctChip, { backgroundColor: strengthColor + "15" }]}>
                    <Feather name="shield" size={9} color={strengthColor} />
                    <Text style={[styles.ctChipText, { color: strengthColor }]}>Força {strengthTier}</Text>
                  </View>
                  <View style={[styles.ctChip, { backgroundColor: "#4DA6FF15" }]}>
                    <Feather name="percent" size={9} color="#4DA6FF" />
                    <Text style={[styles.ctChipText, { color: "#4DA6FF" }]}>Rev est. ~{expectedRev}%</Text>
                  </View>
                </View>

                <NegotiationPanel
                  rival={rival}
                  state={state}
                  colors={colors}
                  existingContract={existingContract}
                  onPropose={handlePropose}
                />
              </View>
            );
          })}

          {/* B) Active Contracts */}
          {activeContracts.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 4 }]}>CONTRATOS ATIVOS</Text>
              {activeContracts.map((contract) => (
                <View key={contract.id} style={[styles.ctActiveCard, { backgroundColor: colors.card, borderColor: "#10B98133" }]}>
                  <LinearGradient colors={["#10B98108", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                  <View style={styles.ctActiveHeader}>
                    <View style={[styles.ctStatusDot, { backgroundColor: "#10B981" }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.ctActiveName, { color: colors.foreground }]}>{contract.rivalName}</Text>
                      <Text style={[styles.ctActivePlatform, { color: colors.mutedForeground }]}>
                        {contract.platform} · Desde {String(contract.signedMonth).padStart(2, "0")}/{contract.signedYear}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 2 }}>
                      <Text style={[styles.ctActiveSplit, { color: "#10B981" }]}>{contract.playerShare}% / {100 - contract.playerShare}%</Text>
                      <Text style={[styles.ctActiveSplitLabel, { color: colors.mutedForeground }]}>você / rival</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 8 }}>
                    <TouchableOpacity
                      onPress={() => Alert.alert(
                        "Terminar Contrato",
                        `Terminar contrato com ${contract.rivalName}? Perdes acesso à plataforma ${contract.platform}.`,
                        [
                          { text: "Cancelar", style: "cancel" },
                          { text: "Terminar", style: "destructive", onPress: () => handleTerminate(contract.id) },
                        ],
                      )}
                      style={[styles.ctTerminateBtn, { borderColor: "#FF4D6A44" }]}
                      activeOpacity={0.8}
                    >
                      <Text style={{ color: "#FF4D6A", fontSize: 11, fontFamily: "Inter_600SemiBold" }}>Terminar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </>
          )}

          {/* C) Contract History */}
          {historyContracts.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 4 }]}>HISTÓRICO DE CONTRATOS</Text>
              {historyContracts.map((contract) => {
                const statusColor = contract.status === "accepted" ? "#10B981" : contract.status === "rejected" ? "#FF4D6A" : "#F5A623";
                const statusLabel = contract.status === "accepted" ? "Aceite" : contract.status === "rejected" ? "Recusado" : "Expirado";
                const statusIcon = contract.status === "accepted" ? "check-circle" : contract.status === "rejected" ? "x-circle" : "clock";
                return (
                  <View key={contract.id} style={[styles.ctHistoryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={[styles.ctHistoryIconWrap, { backgroundColor: statusColor + "18" }]}>
                      <Feather name={statusIcon as any} size={14} color={statusColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.ctHistoryName, { color: colors.foreground }]}>{contract.rivalName}</Text>
                      <Text style={[styles.ctHistoryDetail, { color: colors.mutedForeground }]}>
                        {contract.platform} · {contract.playerShare}% para você · {String(contract.signedMonth).padStart(2, "0")}/{contract.signedYear}
                      </Text>
                    </View>
                    <View style={[styles.ctHistoryBadge, { backgroundColor: statusColor + "18" }]}>
                      <Text style={[styles.ctHistoryBadgeText, { color: statusColor }]}>{statusLabel}</Text>
                    </View>
                  </View>
                );
              })}
            </>
          )}

          {contracts.length === 0 && (
            <View style={[styles.ctEmptyState, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 8 }]}>
              <Feather name="file-text" size={28} color={colors.mutedForeground} />
              <Text style={[styles.ctEmptyText, { color: colors.mutedForeground }]}>Nenhum contrato ainda</Text>
              <Text style={[styles.ctEmptySubText, { color: colors.mutedForeground }]}>Usa "Negociar Contrato" acima para enviar a primeira proposta</Text>
            </View>
          )}

        </ScrollView>
      )}

      {/* ── AQUISIÇÕES TAB ────────────────────────────────────────────────── */}
      {activeTab === "acquisitions" && (() => {
        const playerMoney  = state.money ?? 0;
        const playerShare  = safeN(state.marketShare, 0);
        const playerRep    = safeN(state.reputation, 50);

        // All rivals eligible to show: alive (not yet acquired locally) + bankrupt (acquirable, not yet acquired in engine)
        const acquirableAlive = aliveCompetitors.filter(c => !acquiredAlive.includes(c.id));
        const acquirableDead  = deadCompetitors.filter(c => c.isAcquirable && !c.acquiredByPlayer);
        // Already acquired by engine (acquiredByPlayer) and by local state
        const ownedLocally    = aliveCompetitors.filter(c => acquiredAlive.includes(c.id));
        const ownedByEngine   = deadCompetitors.filter(c => c.acquiredByPlayer);

        // Sort: bankrupt first, then critical, then struggling, then healthy
        const healthOrder: Record<string, number> = { bankrupt: 0, critical: 1, struggling: 2, healthy: 3 };
        const sortedTargets = [
          ...acquirableDead.map(c => ({ ...c, _health: "bankrupt" as FinancialHealth })),
          ...acquirableAlive.map(c => ({ ...c, _health: deriveHealth(c) })),
        ].sort((a, b) => (healthOrder[a._health] ?? 3) - (healthOrder[b._health] ?? 3));

        return (
          <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 24 }]} showsVerticalScrollIndicator={false}>

            {/* ── Summary ── */}
            <View style={[aqStyles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <LinearGradient colors={["#A855F714", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
              <View style={aqStyles.summaryRow}>
                <View style={aqStyles.summaryStat}>
                  <Text style={[aqStyles.summaryVal, { color: "#A855F7" }]}>{sortedTargets.length}</Text>
                  <Text style={[aqStyles.summaryLabel, { color: colors.mutedForeground }]}>Alvos</Text>
                </View>
                <View style={[aqStyles.summaryDiv, { backgroundColor: colors.border }]} />
                <View style={aqStyles.summaryStat}>
                  <Text style={[aqStyles.summaryVal, { color: "#EF4444" }]}>{acquirableDead.length}</Text>
                  <Text style={[aqStyles.summaryLabel, { color: colors.mutedForeground }]}>Falidas</Text>
                </View>
                <View style={[aqStyles.summaryDiv, { backgroundColor: colors.border }]} />
                <View style={aqStyles.summaryStat}>
                  <Text style={[aqStyles.summaryVal, { color: "#10B981" }]}>{ownedLocally.length + ownedByEngine.length}</Text>
                  <Text style={[aqStyles.summaryLabel, { color: colors.mutedForeground }]}>Adquiridas</Text>
                </View>
              </View>
            </View>

            {/* ── Owned companies (subsidiárias) ── */}
            {(ownedLocally.length > 0 || ownedByEngine.length > 0) && (
              <>
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>EMPRESAS ADQUIRIDAS</Text>
                {ownedLocally.map(c => (
                  <View key={c.id} style={[aqStyles.ownedCard, { backgroundColor: "#10B98110", borderColor: "#10B98133" }]}>
                    <LinearGradient colors={["#10B98118", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                    <View style={aqStyles.ownedRow}>
                      <View style={[aqStyles.ownedIcon, { backgroundColor: c.color + "22" }]}>
                        <Feather name={c.icon as any} size={18} color={c.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <Text style={[aqStyles.ownedName, { color: colors.foreground }]}>{c.name}</Text>
                          <View style={[aqStyles.subsidBadge, { backgroundColor: "#10B98122" }]}>
                            <Text style={[aqStyles.subsidBadgeText, { color: "#10B981" }]}>SUBSIDIÁRIA</Text>
                          </View>
                        </View>
                        <Text style={[aqStyles.ownedProduct, { color: colors.mutedForeground }]}>{c.lastConsole}</Text>
                      </View>
                    </View>
                    <View style={[aqStyles.ownedBenefit, { backgroundColor: c.color + "12", borderColor: c.color + "33" }]}>
                      <Feather name="zap" size={12} color={c.color} />
                      <Text style={[aqStyles.ownedBenefitText, { color: c.color }]}>{acqBenefitLabel(c)}</Text>
                    </View>
                  </View>
                ))}
                {ownedByEngine.map(c => (
                  <View key={c.id} style={[aqStyles.ownedCard, { backgroundColor: "#10B98110", borderColor: "#10B98133" }]}>
                    <LinearGradient colors={["#10B98118", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                    <View style={aqStyles.ownedRow}>
                      <View style={[aqStyles.ownedIcon, { backgroundColor: c.color + "22" }]}>
                        <Feather name={c.icon as any} size={18} color={c.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <Text style={[aqStyles.ownedName, { color: colors.foreground }]}>{c.name}</Text>
                          <View style={[aqStyles.subsidBadge, { backgroundColor: "#10B98122" }]}>
                            <Text style={[aqStyles.subsidBadgeText, { color: "#10B981" }]}>ADQUIRIDA</Text>
                          </View>
                        </View>
                        <Text style={[aqStyles.ownedProduct, { color: colors.mutedForeground }]}>
                          {c.bankruptYear ? `Adquirida após falência em ${c.bankruptYear}` : "Ativos de liquidação absorvidos"}
                        </Text>
                      </View>
                    </View>
                    <View style={[aqStyles.ownedBenefit, { backgroundColor: "#10B98112", borderColor: "#10B98133" }]}>
                      <Feather name="zap" size={12} color="#10B981" />
                      <Text style={[aqStyles.ownedBenefitText, { color: "#10B981" }]}>{acqBenefitLabel(c)}</Text>
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* ── Acquisition targets ── */}
            {sortedTargets.length > 0 && (
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ALVOS DE AQUISIÇÃO</Text>
            )}

            {sortedTargets.map(c => {
              const health     = c._health;
              const healthCol  = rivalHealthColor(health);
              const healthLbl  = rivalHealthLabel(health);
              const openness   = acqNegotiationOpenness(health);
              const estimated  = c.marketValue ?? computeRivalMarketValue(c);
              const isBankrupt = health === "bankrupt";

              return (
                <View key={c.id} style={[aqStyles.targetCard, {
                  backgroundColor: isBankrupt ? "#EF444408" : colors.card,
                  borderColor: isBankrupt ? "#EF444444" : colors.border,
                }]}>
                  {isBankrupt && (
                    <LinearGradient colors={["#EF444414", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                  )}

                  {/* Header */}
                  <View style={aqStyles.targetHeader}>
                    <View style={[aqStyles.targetIcon, { backgroundColor: c.color + "22" }]}>
                      <Feather name={c.icon as any} size={18} color={c.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <Text style={[aqStyles.targetName, { color: isBankrupt ? colors.mutedForeground : colors.foreground }]}>
                          {c.name}
                        </Text>
                        {isBankrupt && (
                          <View style={[aqStyles.opportunityTag, { backgroundColor: "#EF444422" }]}>
                            <Feather name="alert-triangle" size={9} color="#EF4444" />
                            <Text style={[aqStyles.opportunityTagText, { color: "#EF4444" }]}>OPORTUNIDADE</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[aqStyles.targetProduct, { color: colors.mutedForeground }]}>{c.lastConsole}</Text>
                    </View>
                    <Text style={[aqStyles.targetShare, { color: c.color }]}>
                      {safeN(c.marketShare, 0).toFixed(1)}%
                    </Text>
                  </View>

                  {/* Stats chips row */}
                  <View style={aqStyles.chipsRow}>
                    <View style={[aqStyles.chip, { backgroundColor: healthCol + "18" }]}>
                      <View style={[aqStyles.chipDot, { backgroundColor: healthCol }]} />
                      <Text style={[aqStyles.chipText, { color: healthCol }]}>{healthLbl}</Text>
                    </View>
                    <View style={[aqStyles.chip, { backgroundColor: openness.color + "18" }]}>
                      <Feather name="unlock" size={10} color={openness.color} />
                      <Text style={[aqStyles.chipText, { color: openness.color }]}>Abertura: {openness.label}</Text>
                    </View>
                    <View style={[aqStyles.chip, { backgroundColor: "#4DA6FF18" }]}>
                      <Feather name="trending-up" size={10} color="#4DA6FF" />
                      <Text style={[aqStyles.chipText, { color: "#4DA6FF" }]}>{formatMoney(estimated)}</Text>
                    </View>
                  </View>

                  {/* Acquisition type suggestion */}
                  <View style={[aqStyles.acqTypePill, { backgroundColor: healthCol + "12", borderColor: healthCol + "33" }]}>
                    <Feather name="flag" size={11} color={healthCol} />
                    <Text style={[aqStyles.acqTypePillText, { color: healthCol }]}>
                      {acqStyleLabel(health, playerShare, safeN(c.marketShare, 5))}
                    </Text>
                  </View>

                  {/* Negotiation panel */}
                  <AcqNegPanel
                    rival={c}
                    playerShare={playerShare}
                    playerRep={playerRep}
                    playerMoney={playerMoney}
                    colors={colors}
                    onBankruptAcquire={handleAcquire}
                    onAliveAcquire={handleAcquireAlive}
                  />
                </View>
              );
            })}

            {sortedTargets.length === 0 && (ownedLocally.length + ownedByEngine.length) === 0 && (
              <View style={[styles.ctEmptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="briefcase" size={28} color={colors.mutedForeground} />
                <Text style={[styles.ctEmptyText, { color: colors.mutedForeground }]}>Nenhum alvo disponível</Text>
                <Text style={[styles.ctEmptySubText, { color: colors.mutedForeground }]}>
                  Novos alvos surgem conforme rivais enfraquecem ou entram em crise
                </Text>
              </View>
            )}

          </ScrollView>
        );
      })()}

    </View>
  );
}

function BankruptCard({ rival, colors, playerMoney, onAcquire }: {
  rival: Competitor;
  colors: any;
  playerMoney: number;
  onAcquire: (rivalId: string) => void;
}) {
  const canBuy = rival.isAcquirable && !rival.acquiredByPlayer;

  return (
    <View style={[styles.playerCard, {
      backgroundColor: colors.card,
      borderColor: rival.acquiredByPlayer ? "#10B98133" : "#EF444433",
      opacity: rival.acquiredByPlayer ? 0.8 : 0.75,
    }]}>
      <View style={styles.playerHeader}>
        <View style={[styles.rankBadge, { backgroundColor: rival.acquiredByPlayer ? "#10B98120" : "#EF444420" }]}>
          <Feather name={rival.acquiredByPlayer ? "check" : "x"} size={14} color={rival.acquiredByPlayer ? "#10B981" : "#EF4444"} />
        </View>
        <View style={[styles.playerIcon, { backgroundColor: rival.acquiredByPlayer ? "#10B98120" : "#EF444420" }]}>
          <Feather name={rival.icon as any} size={18} color={rival.acquiredByPlayer ? "#10B981" : "#EF4444"} />
        </View>
        <View style={styles.playerMeta}>
          <View style={styles.playerNameRow}>
            <Text style={[styles.playerName, {
              color: colors.mutedForeground,
              textDecorationLine: rival.acquiredByPlayer ? "none" : "line-through",
            }]}>
              {rival.name}
            </Text>
            <View style={[styles.youTag, { backgroundColor: rival.acquiredByPlayer ? "#10B98122" : "#EF444422" }]}>
              <Text style={[styles.youTagText, { color: rival.acquiredByPlayer ? "#10B981" : "#EF4444" }]}>
                {rival.acquiredByPlayer ? "ADQUIRIDA" : "FALIU"}
              </Text>
            </View>
          </View>
          <Text style={[styles.playerProduct, { color: colors.mutedForeground }]}>
            {rival.acquiredByPlayer
              ? "Empresa adquirida — ativos absorvidos"
              : rival.bankruptYear
                ? `Falência em ${rival.bankruptMonth?.toString().padStart(2, "0")}/${rival.bankruptYear}`
                : "Empresa encerrada"}
          </Text>
        </View>
        <Text style={[styles.playerShare, { color: rival.acquiredByPlayer ? "#10B981" : "#EF4444" }]}>0%</Text>
      </View>

      {/* Asset purchase panel for bankrupt but not yet acquired companies */}
      {canBuy && (
        <AcquisitionPanel
          rival={rival}
          playerMoney={playerMoney}
          colors={colors}
          onAcquire={onAcquire}
        />
      )}
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

  // ── Tab bar ──────────────────────────────────────────────────────────────────
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginRight: 24,
    position: "relative",
  },
  tabBtnActive: {},
  tabBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  tabBtnUnderline: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#4DA6FF",
  },
  tabBadge: {
    backgroundColor: "#10B981",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  tabBadgeText: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#fff" },

  // ── Overview (existing) ──────────────────────────────────────────────────────
  overviewCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12, overflow: "hidden" },
  overviewTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  overviewStats: { flexDirection: "row", justifyContent: "space-between" },
  overStat: { alignItems: "center", gap: 4 },
  overStatValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
  overStatLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  shareBarWrap: { gap: 6 },
  shareBar: { height: 8, borderRadius: 4, overflow: "hidden" },
  shareBarFill: { height: 8, borderRadius: 4 },
  shareBarLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  unlockBanner: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, padding: 10 },
  unlockText: { flex: 1, fontSize: 11, fontFamily: "Inter_500Medium" },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, textTransform: "uppercase" },
  playerCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10, overflow: "hidden" },
  playerHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  rankBadge: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  rankNum: { fontSize: 12, fontFamily: "Inter_700Bold" },
  playerIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  playerMeta: { flex: 1 },
  playerNameRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  playerName: { fontSize: 14, fontFamily: "Inter_700Bold" },
  youTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  youTagText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#4DA6FF" },
  playerProduct: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  playerShare: { fontSize: 18, fontFamily: "Inter_700Bold" },
  shareTrack: { height: 8, borderRadius: 4, overflow: "hidden" },
  shareFill: { height: 8, borderRadius: 4 },
  playerFooter: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  chipText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  innovWrap: { gap: 4 },
  innovTrack: { height: 3, borderRadius: 2, overflow: "hidden" },
  innovFill: { height: 3, borderRadius: 2 },
  innovLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  trendsCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  trendRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  trendIcon: { width: 32, height: 32, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  trendText: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium" },
  // Attack panel
  attackPanel: { borderRadius: 10, borderWidth: 1, padding: 10, gap: 4 },
  attackLockText: { fontSize: 10, fontFamily: "Inter_400Regular", flex: 1 },
  attackHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  attackHeaderTitle: { flex: 1, fontSize: 12, fontFamily: "Inter_600SemiBold" },
  attackSuccessChip: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  attackSuccessText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  attackBtn: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 9, borderWidth: 1, padding: 9 },
  attackBtnIcon: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  attackBtnName: { fontSize: 11, fontFamily: "Inter_700Bold" },
  attackBtnDesc: { fontSize: 10, fontFamily: "Inter_400Regular" },
  attackOutcomeHint: { fontSize: 9, fontFamily: "Inter_400Regular" },
  attackBtnCost: { fontSize: 11, fontFamily: "Inter_700Bold" },
  attackBtnRate: { fontSize: 9, fontFamily: "Inter_600SemiBold" },
  riskBadge: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5 },
  riskBadgeText: { fontSize: 9, fontFamily: "Inter_600SemiBold" },
  cooldownChip: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  cooldownText: { fontSize: 9, fontFamily: "Inter_700Bold" },
  attackWarning: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 7, borderWidth: 1, padding: 7 },
  attackWarningText: { flex: 1, fontSize: 9, fontFamily: "Inter_400Regular" },

  // ── Contracts tab ─────────────────────────────────────────────────────────────
  ctSubLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2, marginBottom: 2 },
  ctEmptyState: { borderRadius: 14, borderWidth: 1, padding: 32, alignItems: "center", gap: 10 },
  ctEmptyText: { fontSize: 14, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  ctEmptySubText: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },

  // Rival negotiation card
  ctRivalCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10, overflow: "hidden" },
  ctRivalHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  ctRivalIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  ctRivalName: { fontSize: 14, fontFamily: "Inter_700Bold" },
  ctRivalPlatform: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  ctRivalShare: { fontSize: 16, fontFamily: "Inter_700Bold" },
  ctRivalShareLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  ctRivalChips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  ctChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  ctChipText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  ctActiveBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  ctActiveBadgeText: { fontSize: 9, fontFamily: "Inter_700Bold" },

  // Negotiation panel
  ctNegPanel: { borderRadius: 10, borderWidth: 1, padding: 10, gap: 4 },
  ctNegHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  ctNegPanelTitle: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  ctChanceChip: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  ctChanceText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  ctPlatformRow: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 8, borderWidth: 1, padding: 9 },
  ctPlatformText: { fontSize: 12, fontFamily: "Inter_500Medium", flex: 1 },
  ctSliderLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  ctSliderValue: { fontSize: 11, fontFamily: "Inter_700Bold" },
  ctShareSteps: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  ctShareStep: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  ctShareStepText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  ctAcceptanceRow: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 8, borderWidth: 1, padding: 9, flexWrap: "wrap" },
  ctAcceptanceText: { fontSize: 11, fontFamily: "Inter_600SemiBold", flex: 1 },
  ctAcceptanceHint: { fontSize: 10, fontFamily: "Inter_400Regular", width: "100%" },
  ctSendBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 10, paddingVertical: 11 },
  ctSendBtnText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#fff" },

  // Active contracts
  ctActiveCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 4, overflow: "hidden" },
  ctActiveHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  ctStatusDot: { width: 8, height: 8, borderRadius: 4 },
  ctActiveName: { fontSize: 14, fontFamily: "Inter_700Bold" },
  ctActivePlatform: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  ctActiveSplit: { fontSize: 14, fontFamily: "Inter_700Bold" },
  ctActiveSplitLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  ctTerminateBtn: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 6 },

  // History
  ctHistoryCard: { borderRadius: 12, borderWidth: 1, padding: 12, flexDirection: "row", alignItems: "center", gap: 10 },
  ctHistoryIconWrap: { width: 34, height: 34, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  ctHistoryName: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  ctHistoryDetail: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  ctHistoryBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  ctHistoryBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },

  // ── Acquisition panel ─────────────────────────────────────────────────────
  acqPanel: { borderRadius: 10, borderWidth: 1, padding: 11, gap: 8 },
  acqHeader: { flexDirection: "row", alignItems: "center", gap: 7 },
  acqIconWrap: { width: 26, height: 26, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  acqTitle: { flex: 1, fontSize: 12, fontFamily: "Inter_600SemiBold" },
  acqChanceBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  acqChanceText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  acqDetails: { gap: 1 },
  acqDetailRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 5, borderBottomWidth: 1 },
  acqDetailLabel: { flex: 1, fontSize: 11, fontFamily: "Inter_400Regular" },
  acqDetailValue: { fontSize: 11, fontFamily: "Inter_700Bold" },
  acqWarning: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 7, borderWidth: 1, padding: 7 },
  acqWarningText: { flex: 1, fontSize: 10, fontFamily: "Inter_400Regular" },
  acqBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 9, paddingVertical: 10 },
  acqBtnText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#fff" },
});

// ── Aquisições-specific styles ─────────────────────────────────────────────────
const aqStyles = StyleSheet.create({
  summaryCard: { borderRadius: 14, borderWidth: 1, padding: 14, overflow: "hidden" },
  summaryRow: { flexDirection: "row", alignItems: "center" },
  summaryStat: { flex: 1, alignItems: "center", gap: 3 },
  summaryVal: { fontSize: 20, fontFamily: "Inter_700Bold" },
  summaryLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  summaryDiv: { width: 1, height: 28, marginHorizontal: 8 },

  ownedCard: { borderRadius: 13, borderWidth: 1.5, padding: 13, gap: 9, overflow: "hidden" },
  ownedRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  ownedIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  ownedName: { fontSize: 14, fontFamily: "Inter_700Bold" },
  ownedProduct: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  subsidBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  subsidBadgeText: { fontSize: 9, fontFamily: "Inter_700Bold" },
  ownedBenefit: { flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 8, borderWidth: 1, padding: 8 },
  ownedBenefitText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },

  targetCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10, overflow: "hidden" },
  targetHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  targetIcon: { width: 40, height: 40, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  targetName: { fontSize: 14, fontFamily: "Inter_700Bold" },
  targetProduct: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  targetShare: { fontSize: 18, fontFamily: "Inter_700Bold" },
  opportunityTag: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  opportunityTagText: { fontSize: 9, fontFamily: "Inter_700Bold" },

  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  chipText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },

  acqTypePill: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 8, borderWidth: 1, padding: 8 },
  acqTypePillText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },

  negPanel: { borderRadius: 10, borderWidth: 1, padding: 10, gap: 4 },
  negHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  negIconWrap: { width: 24, height: 24, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  negTitle: { flex: 1, fontSize: 12, fontFamily: "Inter_600SemiBold" },
  negChancePill: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  negChanceText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  negDataRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 5, borderBottomWidth: 1 },
  negDataLabel: { flex: 1, fontSize: 11, fontFamily: "Inter_400Regular" },
  negDataValue: { fontSize: 11, fontFamily: "Inter_700Bold" },
  negOfferLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  negSteps: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  negStep: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 6 },
  negStepText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  negChanceRow: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 8, borderWidth: 1, padding: 9 },
  negChanceRowText: { flex: 1, fontSize: 11, fontFamily: "Inter_600SemiBold" },
  negWarning: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 7, borderWidth: 1, padding: 7 },
  negWarningText: { flex: 1, fontSize: 10, fontFamily: "Inter_400Regular" },
  negBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 10, paddingVertical: 11 },
  negBtnText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#fff" },
});
