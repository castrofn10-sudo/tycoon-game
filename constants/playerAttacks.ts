import type { Competitor } from "./gameEngine";

// ─────────────────────────────────────────────────────────────────────────────
// PLAYER OFFENSIVE ATTACK SYSTEM
// Each attack type has variable outcomes: critico / sucesso / fraco / fracasso
// Outcome is determined at execution by quality score = reputation + rival defense
// ─────────────────────────────────────────────────────────────────────────────

export type PlayerAttackType =
  | "comparative_campaign"
  | "aggressive_marketing"
  | "rumor_leak"
  | "market_exclusivity";

export type PlayerAttackOutcome = "critico" | "sucesso" | "fraco" | "fracasso";

export type PlayerAttackDef = {
  label: string;
  description: string;
  icon: string;
  color: string;
  cost: number;
  cooldownMonths: number;
  riskLevel: "low" | "medium" | "high";
  successChanceBase: number;
};

export const PLAYER_ATTACKS: Record<PlayerAttackType, PlayerAttackDef> = {
  comparative_campaign: {
    label:             "Campanha Comparativa",
    description:       "Publicidade que expõe fraquezas do rival. Backlash severo se fracassar.",
    icon:              "bar-chart-2",
    color:             "#4DA6FF",
    cost:              250_000,
    cooldownMonths:    4,
    riskLevel:         "medium",
    successChanceBase: 0.60,
  },
  aggressive_marketing: {
    label:             "Marketing Agressivo",
    description:       "Campanha massiva que rouba fãs e market share. Custo elevado.",
    icon:              "trending-up",
    color:             "#10B981",
    cost:              800_000,
    cooldownMonths:    6,
    riskLevel:         "medium",
    successChanceBase: 0.58,
  },
  rumor_leak: {
    label:             "Rumor / Vazamento",
    description:       "Risco altíssimo. Se rastreado até você, crise de reputação grave.",
    icon:              "eye-off",
    color:             "#F59E0B",
    cost:              75_000,
    cooldownMonths:    3,
    riskLevel:         "high",
    successChanceBase: 0.46,
  },
  market_exclusivity: {
    label:             "Exclusividade de Mercado",
    description:       "Bloqueia o rival de acesso a mercados ou parceiros-chave. Alto custo.",
    icon:              "lock",
    color:             "#A855F7",
    cost:              1_500_000,
    cooldownMonths:    8,
    riskLevel:         "high",
    successChanceBase: 0.52,
  },
};

export type PlayerAttackEffects = {
  rivalRepDelta:          number;
  rivalMarketShareDelta:  number;
  rivalMoneyDelta:        number;
  rivalInnovationDelta:   number;
  fanStealed:             number;
  playerRepDelta:         number;
  triggerCounterAttack:   boolean;
  counterAttackDelay:     number;
  counterAttackStrength:  number;
  label:                  string;
  color:                  string;
};

export const PLAYER_ATTACK_OUTCOMES: Record<
  PlayerAttackType,
  Record<PlayerAttackOutcome, PlayerAttackEffects>
> = {
  comparative_campaign: {
    critico:  {
      rivalRepDelta: -20, rivalMarketShareDelta: -3.0, rivalMoneyDelta: -200_000, rivalInnovationDelta: -5,
      fanStealed: 2000, playerRepDelta: +3,
      triggerCounterAttack: true, counterAttackDelay: 3, counterAttackStrength: 1,
      label: "Campanha devastadora! Rival humilhado publicamente.", color: "#F5A623",
    },
    sucesso:  {
      rivalRepDelta: -12, rivalMarketShareDelta: -1.5, rivalMoneyDelta: -100_000, rivalInnovationDelta: 0,
      fanStealed: 800, playerRepDelta: 0,
      triggerCounterAttack: true, counterAttackDelay: 2, counterAttackStrength: 1,
      label: "Campanha bem-sucedida. Rival reage com contramedidas.", color: "#10B981",
    },
    fraco:    {
      rivalRepDelta: -4, rivalMarketShareDelta: -0.5, rivalMoneyDelta: 0, rivalInnovationDelta: 0,
      fanStealed: 150, playerRepDelta: -3,
      triggerCounterAttack: true, counterAttackDelay: 1, counterAttackStrength: 1,
      label: "Campanha fraca. Impacto mínimo e rival irritado com você.", color: "#F59E0B",
    },
    fracasso: {
      rivalRepDelta: 0, rivalMarketShareDelta: 0, rivalMoneyDelta: 0, rivalInnovationDelta: 0,
      fanStealed: 0, playerRepDelta: -10,
      triggerCounterAttack: true, counterAttackDelay: 1, counterAttackStrength: 2,
      label: "Fracasso! Campanha virou PR negativo — mídia ataca você.", color: "#FF4D6A",
    },
  },
  aggressive_marketing: {
    critico:  {
      rivalRepDelta: -15, rivalMarketShareDelta: -5.0, rivalMoneyDelta: -500_000, rivalInnovationDelta: 0,
      fanStealed: 5000, playerRepDelta: +3,
      triggerCounterAttack: true, counterAttackDelay: 3, counterAttackStrength: 2,
      label: "Domínio total! Rival perde fatia significativa do mercado.", color: "#F5A623",
    },
    sucesso:  {
      rivalRepDelta: -8, rivalMarketShareDelta: -2.5, rivalMoneyDelta: -200_000, rivalInnovationDelta: 0,
      fanStealed: 2500, playerRepDelta: 0,
      triggerCounterAttack: true, counterAttackDelay: 2, counterAttackStrength: 1,
      label: "Marketing bem-sucedido. Você roubou fãs e market share.", color: "#10B981",
    },
    fraco:    {
      rivalRepDelta: -3, rivalMarketShareDelta: -0.8, rivalMoneyDelta: 0, rivalInnovationDelta: 0,
      fanStealed: 400, playerRepDelta: -2,
      triggerCounterAttack: true, counterAttackDelay: 1, counterAttackStrength: 1,
      label: "Resultado fraco. Custo alto, impacto baixo, rival irrita-se.", color: "#F59E0B",
    },
    fracasso: {
      rivalRepDelta: 0, rivalMarketShareDelta: +0.5, rivalMoneyDelta: 0, rivalInnovationDelta: +5,
      fanStealed: 0, playerRepDelta: -6,
      triggerCounterAttack: true, counterAttackDelay: 1, counterAttackStrength: 2,
      label: "Fracasso! Rival aproveitou para se promover às suas custas.", color: "#FF4D6A",
    },
  },
  rumor_leak: {
    critico:  {
      rivalRepDelta: -28, rivalMarketShareDelta: -4.5, rivalMoneyDelta: -800_000, rivalInnovationDelta: -8,
      fanStealed: 3500, playerRepDelta: +1,
      triggerCounterAttack: false, counterAttackDelay: 0, counterAttackStrength: 0,
      label: "Rumor viraliza! Rival em crise pública severa.", color: "#F5A623",
    },
    sucesso:  {
      rivalRepDelta: -16, rivalMarketShareDelta: -2.0, rivalMoneyDelta: -300_000, rivalInnovationDelta: 0,
      fanStealed: 1200, playerRepDelta: 0,
      triggerCounterAttack: true, counterAttackDelay: 2, counterAttackStrength: 1,
      label: "Vazamento bem-sucedido. Rival nega, mas o dano está feito.", color: "#10B981",
    },
    fraco:    {
      rivalRepDelta: -5, rivalMarketShareDelta: 0, rivalMoneyDelta: 0, rivalInnovationDelta: 0,
      fanStealed: 0, playerRepDelta: -6,
      triggerCounterAttack: true, counterAttackDelay: 1, counterAttackStrength: 2,
      label: "Rumor não convenceu. Suspeitas recaem sobre você.", color: "#F59E0B",
    },
    fracasso: {
      rivalRepDelta: 0, rivalMarketShareDelta: 0, rivalMoneyDelta: 0, rivalInnovationDelta: 0,
      fanStealed: 0, playerRepDelta: -18,
      triggerCounterAttack: true, counterAttackDelay: 1, counterAttackStrength: 3,
      label: "IDENTIFICADO! Crise de reputação severa — imprensa destrói você.", color: "#FF4D6A",
    },
  },
  market_exclusivity: {
    critico:  {
      rivalRepDelta: -12, rivalMarketShareDelta: -8.0, rivalMoneyDelta: -1_000_000, rivalInnovationDelta: -10,
      fanStealed: 4500, playerRepDelta: +5,
      triggerCounterAttack: true, counterAttackDelay: 4, counterAttackStrength: 2,
      label: "Exclusividade total! Rival bloqueado de mercado-chave por meses.", color: "#F5A623",
    },
    sucesso:  {
      rivalRepDelta: -6, rivalMarketShareDelta: -4.0, rivalMoneyDelta: -400_000, rivalInnovationDelta: 0,
      fanStealed: 2000, playerRepDelta: +2,
      triggerCounterAttack: true, counterAttackDelay: 3, counterAttackStrength: 2,
      label: "Exclusividade garantida. Rival perde acesso temporariamente.", color: "#10B981",
    },
    fraco:    {
      rivalRepDelta: -2, rivalMarketShareDelta: -1.0, rivalMoneyDelta: 0, rivalInnovationDelta: 0,
      fanStealed: 300, playerRepDelta: -4,
      triggerCounterAttack: true, counterAttackDelay: 2, counterAttackStrength: 1,
      label: "Exclusividade parcial. Rival encontrou alternativas rapidamente.", color: "#F59E0B",
    },
    fracasso: {
      rivalRepDelta: +5, rivalMarketShareDelta: +1.5, rivalMoneyDelta: 0, rivalInnovationDelta: 0,
      fanStealed: 0, playerRepDelta: -12,
      triggerCounterAttack: true, counterAttackDelay: 1, counterAttackStrength: 3,
      label: "Negociação vazou! Rival usou a publicidade para crescer.", color: "#FF4D6A",
    },
  },
};

export type PendingCounterAttack = {
  rivalId:           string;
  rivalName:         string;
  rivalColor:        string;
  strength:          number;
  executeMonthIdx:   number;
};

export function computePlayerAttackScore(
  attackType: PlayerAttackType,
  playerReputation: number,
  rival: Competitor,
): number {
  const base = PLAYER_ATTACKS[attackType].successChanceBase;
  const repBonus = (playerReputation - 50) / 200;
  const aggressivenessDefense = (rival.aggressiveness ?? 50) / 200;
  const innovationBonus = (rival.innovation ?? 60) > 72 ? -0.06 : 0;
  return base + repBonus - aggressivenessDefense + innovationBonus;
}

export function rollPlayerAttackOutcome(score: number): PlayerAttackOutcome {
  const q = Math.max(0, Math.min(1, score));
  const r = Math.random();
  const tCritico = q * 0.22;
  const tSucesso = tCritico + q * 0.48;
  const tFraco   = tSucesso + 0.15 + (1 - q) * 0.10;
  if (r < tCritico)  return "critico";
  if (r < tSucesso)  return "sucesso";
  if (r < tFraco)    return "fraco";
  return "fracasso";
}

export const COUNTER_ATTACK_STRENGTH: Record<number, { repDmg: [number, number]; fanDmg: [number, number]; label: string }> = {
  1: { repDmg: [-8,  -12], fanDmg: [-200,  -600],  label: "responde com campanha negativa" },
  2: { repDmg: [-13, -20], fanDmg: [-600, -1800],  label: "lança contraofensiva agressiva" },
  3: { repDmg: [-18, -28], fanDmg: [-1200,-3500], label: "mobiliza toda sua força contra você" },
};
