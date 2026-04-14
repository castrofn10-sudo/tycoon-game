// ─────────────────────────────────────────────────────────────────────────────
// Dynamic Events System — contextual, era-aware, situation-sensitive events
// ─────────────────────────────────────────────────────────────────────────────

import {
  validateEventContext,
  isHardBlockedEvent,
  inferDynEventCategory,
  getEventProbabilityScale,
  type EventValidationContext,
} from "./eventValidation";

// Minimal state snapshot to avoid circular imports with gameEngine.ts
export type DynamicEventStateSnapshot = {
  year: number;
  month: number;
  money: number;
  fans: number;
  reputation: number;
  totalRevenue: number;
  marketShare: number;
  employees: { type: string }[];
  gameProjects: { phase: string; starRating?: number; sequelOf?: string; id: string; bugLevel?: string; receptionScore?: number; genre?: string }[];
  consoles: { isDiscontinued?: boolean; rating?: number; unitsSold?: number; power?: string }[];
  offices: { tech?: number; testing?: number; [key: string]: number | undefined };
  unlockedCountries: string[];
  researchedNodes: string[];
  trophies?: { id: string }[];
  branches?: { countryId: string }[];
  totalShares?: number;
  playerShares?: number;
  investors?: { id: string }[];
  unlockedAchievements?: { id: string }[];
};

export type DynamicEventCategory =
  | "economy" | "market" | "tech" | "competitor" | "community"
  | "internal" | "crisis" | "opportunity" | "legal" | "media";

export type DynamicEventEffect = {
  moneyDelta?:       number;
  reputationDelta?:  number;
  fansDelta?:        number;
  bugRiskDelta?:     number;   // adds to next game's bug risk (0-1)
  devSpeedDelta?:    number;   // adds to devSpeed for 3 months
  techRepDelta?:     number;
  commercialRepDelta?: number;
  fanRepDelta?:      number;
  marketDemandMult?: number;   // applied for 2-4 months
  salesDelta?:       number;
};

export type DynamicEventDef = {
  id:          string;
  category:    DynamicEventCategory;
  title:       string;
  body:        string;
  effects:     DynamicEventEffect;
  minYear?:    number;
  maxYear?:    number;
  // Trigger condition
  condition?:  (state: DynamicEventStateSnapshot) => boolean;
  // How often this can repeat (months)
  cooldownMonths: number;
  // Base probability per eligible month
  baseProbability: number;
};

export const DYNAMIC_EVENT_DEFS: DynamicEventDef[] = [
  // ── Economy ───────────────────────────────────────────────────────────────
  {
    id: "global_recession",
    category: "economy",
    title: "Recessão Global",
    body: "Uma crise econômica mundial afeta o poder de compra dos consumidores. As vendas de entretenimento sofrem nas próximas semanas.",
    effects: { moneyDelta: -80_000, reputationDelta: -3, fansDelta: -300, commercialRepDelta: -4, marketDemandMult: 0.75 },
    cooldownMonths: 60,
    baseProbability: 0.004,
  },
  {
    id: "market_boom",
    category: "market",
    title: "Boom do Mercado de Jogos",
    body: "Uma tendência cultural eleva o interesse global em games. Consumidores estão gastando mais em entretenimento digital do que nunca!",
    effects: { moneyDelta: 50_000, fansDelta: 500, commercialRepDelta: 3, marketDemandMult: 1.30 },
    cooldownMonths: 48,
    baseProbability: 0.005,
  },
  {
    id: "inflation_spike",
    category: "economy",
    title: "Alta de Inflação",
    body: "A inflação subiu bruscamente. Custos de componentes e salários aumentam. Sua margem de lucro será pressionada este mês.",
    effects: { moneyDelta: -60_000, commercialRepDelta: -2 },
    cooldownMonths: 24,
    baseProbability: 0.007,
  },

  // ── Tech / Component ──────────────────────────────────────────────────────
  {
    id: "chip_shortage",
    category: "tech",
    title: "Escassez de Chips Semicondutores",
    body: "A produção global de chips foi interrompida por uma crise de fornecimento. Custos de hardware sobem e entregas atrasam.",
    effects: { moneyDelta: -120_000, techRepDelta: -2, devSpeedDelta: -0.15 },
    minYear: 1980,
    cooldownMonths: 48,
    baseProbability: 0.006,
  },
  {
    id: "tech_breakthrough",
    category: "tech",
    title: "Descoberta Tecnológica em P&D",
    body: "Sua equipe de pesquisa fez uma descoberta inesperada! O avanço pode acelerar desenvolvimentos futuros.",
    effects: { techRepDelta: 8, devSpeedDelta: 0.20, reputationDelta: 4, fansDelta: 200 },
    condition: (s) => (s.offices.tech ?? 0) >= 5,
    cooldownMonths: 36,
    baseProbability: 0.004,
  },
  {
    id: "new_media_format",
    category: "tech",
    title: "Novo Formato de Mídia em Ascensão",
    body: "Um novo formato de distribuição está ganhando popularidade. Empresas que adotarem cedo ganharão vantagem competitiva.",
    effects: { techRepDelta: 5, fansDelta: 300, moneyDelta: 30_000 },
    minYear: 1985,
    cooldownMonths: 60,
    baseProbability: 0.004,
  },

  // ── Competitor ────────────────────────────────────────────────────────────
  {
    id: "rival_surprise_launch",
    category: "competitor",
    title: "Lançamento Surpresa de Rival",
    body: "Um concorrente lançou um produto sem avisar, roubando atenção da mídia e fãs por semanas. Suas vendas sofrem temporariamente.",
    effects: { fansDelta: -400, commercialRepDelta: -3, marketDemandMult: 0.85 },
    cooldownMonths: 24,
    baseProbability: 0.013,
  },
  {
    id: "rival_scandal",
    category: "competitor",
    title: "Escândalo de Rival",
    body: "Um competidor está envolvido num escândalo público. A atenção se volta para a sua empresa como alternativa confiável.",
    effects: { fansDelta: 600, reputationDelta: 5, commercialRepDelta: 4, fanRepDelta: 3 },
    cooldownMonths: 30,
    baseProbability: 0.007,
  },

  // ── Community / Media ─────────────────────────────────────────────────────
  {
    id: "influencer_coverage",
    category: "media",
    title: "Cobertura Positiva de Influenciadores",
    body: "Influenciadores viralizaram conteúdo da sua empresa! Uma enxurrada de novos fãs descobriu seus produtos.",
    effects: { fansDelta: 1500, fanRepDelta: 6, commercialRepDelta: 3, moneyDelta: 25_000 },
    cooldownMonths: 18,
    baseProbability: 0.010,
  },
  {
    id: "community_backlash",
    category: "community",
    title: "Reação Negativa da Comunidade",
    body: "Decisões recentes irritaram a comunidade de fãs. Há protestos nas redes sociais e cancelamentos de pré-vendas.",
    effects: { fansDelta: -800, fanRepDelta: -8, reputationDelta: -5, moneyDelta: -30_000 },
    condition: (s) => s.fans > 2000,
    cooldownMonths: 30,
    baseProbability: 0.007,
  },
  {
    id: "fan_movement_sequel",
    category: "community",
    title: "Movimento de Fãs por Sequência",
    body: "Uma campanha viral de fãs exige uma sequência de um dos seus jogos mais amados. A pressão e a expectativa são enormes.",
    effects: { fansDelta: 800, fanRepDelta: 5 },
    condition: (s) => (s.gameProjects ?? []).some((p) => p.phase === "released" && (p.starRating ?? 0) >= 4),
    cooldownMonths: 24,
    baseProbability: 0.009,
  },
  {
    id: "piracy_surge",
    category: "community",
    title: "Surto de Pirataria",
    body: "Um grupo distribuiu versões piratas dos seus jogos. As vendas digitais caem e a sua receita sofre este mês.",
    effects: { moneyDelta: -70_000, reputationDelta: -3, commercialRepDelta: -4 },
    condition: (s) => (s.gameProjects ?? []).filter((p) => p.phase === "released").length >= 2,
    cooldownMonths: 30,
    baseProbability: 0.006,
  },
  {
    id: "console_modding_craze",
    category: "community",
    title: "Febre de Mods de Console",
    body: "A comunidade de modding explodiu ao redor dos seus consoles. Isso atrai atenção técnica, mas também discussões sobre suporte.",
    effects: { fansDelta: 600, techRepDelta: 4, fanRepDelta: 3 },
    condition: (s) => s.consoles.filter((c) => !c.isDiscontinued).length >= 1,
    cooldownMonths: 36,
    baseProbability: 0.007,
  },

  // ── Internal / Product ────────────────────────────────────────────────────
  {
    id: "product_leak",
    category: "internal",
    title: "Vazamento de Produto Antes do Lançamento",
    body: "Detalhes de um projeto em desenvolvimento vazaram online. O hype antecipado pode ser bom ou ruim dependendo da qualidade.",
    effects: { fansDelta: 400, fanRepDelta: -2, bugRiskDelta: 0.05 },
    condition: (s) => (s.gameProjects ?? []).some((p) => p.phase === "development"),
    cooldownMonths: 20,
    baseProbability: 0.009,
  },
  {
    id: "severe_bug_prelaunch",
    category: "internal",
    title: "Bug Grave Encontrado em Pré-Produção",
    body: "A equipe de QA descobriu um erro crítico antes do lançamento. A correção atrasará o projeto, mas salvará a reputação.",
    effects: { devSpeedDelta: -0.20, techRepDelta: 3, bugRiskDelta: -0.10 },
    condition: (s) => (s.gameProjects ?? []).some((p) => p.phase === "development"),
    cooldownMonths: 18,
    baseProbability: 0.007,
  },
  {
    id: "hardware_recall_risk",
    category: "crisis",
    title: "Risco de Recall de Hardware",
    body: "Relatos de superaquecimento num lote de consoles preocupam os consumidores. Uma investigação foi aberta.",
    effects: { moneyDelta: -150_000, reputationDelta: -6, techRepDelta: -5, fansDelta: -400 },
    condition: (s) => s.consoles.filter((c) => !c.isDiscontinued).length >= 1,
    cooldownMonths: 48,
    baseProbability: 0.004,
  },
  {
    id: "key_dev_leaves",
    category: "internal",
    title: "Desenvolvedor-Chave Deixa a Empresa",
    body: "Um engenheiro talentoso aceitou uma oferta de um rival. O moral da equipe está abalado e a velocidade de desenvolvimento cai.",
    effects: { devSpeedDelta: -0.15, reputationDelta: -2, techRepDelta: -3 },
    condition: (s) => (s.employees ?? []).filter((e) => e.type === "engineer").length >= 2,
    cooldownMonths: 24,
    baseProbability: 0.007,
  },

  // ── Legal ─────────────────────────────────────────────────────────────────
  {
    id: "lawsuit_plagiarism",
    category: "legal",
    title: "Ação Judicial — Plágio",
    body: "Um estúdio independente alega que um dos seus jogos copiou mecânicas protegidas. A batalha legal custará dinheiro e atenção.",
    effects: { moneyDelta: -200_000, reputationDelta: -5, fanRepDelta: -4, commercialRepDelta: -3 },
    condition: (s) => (s.gameProjects ?? []).filter((p) => p.phase === "released").length >= 2,
    cooldownMonths: 60,
    baseProbability: 0.004,
  },
  {
    id: "regulatory_fine",
    category: "legal",
    title: "Multa Regulatória",
    body: "Autoridades aplicaram uma multa por práticas comerciais questionáveis. Custos jurídicos e reputação sofreram.",
    effects: { moneyDelta: -100_000, commercialRepDelta: -5, reputationDelta: -3 },
    condition: (s) => s.totalRevenue > 5_000_000,
    cooldownMonths: 48,
    baseProbability: 0.004,
  },

  // ── Opportunity ───────────────────────────────────────────────────────────
  {
    id: "indie_phenomenon",
    category: "opportunity",
    title: "Fenômeno Indie Inesperado",
    body: "Um pequeno jogo indie criou um furor global, mostrando que experiências criativas superam grandes orçamentos. Inspirador!",
    effects: { fansDelta: 400, fanRepDelta: 4, techRepDelta: 2 },
    cooldownMonths: 30,
    baseProbability: 0.007,
  },
  {
    id: "global_awards_spotlight",
    category: "opportunity",
    title: "Destaque em Festival Global",
    body: "Sua empresa foi mencionada num grande festival internacional de games como uma das mais promissoras da indústria.",
    effects: { fansDelta: 800, reputationDelta: 6, commercialRepDelta: 5, fanRepDelta: 4 },
    condition: (s) => s.reputation >= 50,
    cooldownMonths: 36,
    baseProbability: 0.006,
  },
  {
    id: "strategic_partnership",
    category: "opportunity",
    title: "Proposta de Parceria Estratégica",
    body: "Uma empresa de distribuição global quer fazer parceria. Isso aumenta sua receita e visibilidade internacional.",
    effects: { moneyDelta: 200_000, commercialRepDelta: 6, fansDelta: 500 },
    condition: (s) => s.reputation >= 55 && s.totalRevenue > 2_000_000,
    cooldownMonths: 48,
    baseProbability: 0.005,
  },
  {
    id: "trend_shift",
    category: "market",
    title: "Mudança de Tendência de Mercado",
    body: "As preferências dos jogadores mudaram radicalmente. Um novo gênero domina as discussões. Quem se adaptar primeiro vai liderar.",
    effects: { fanRepDelta: -2, commercialRepDelta: -2 },
    cooldownMonths: 24,
    baseProbability: 0.009,
  },
  {
    id: "studio_scandal",
    category: "internal",
    title: "Escândalo Interno de Estúdio",
    body: "Acusações de má gestão dentro da empresa vieram a público. O moral está baixo e a reputação foi manchada.",
    effects: { reputationDelta: -7, fanRepDelta: -5, moneyDelta: -50_000, devSpeedDelta: -0.10 },
    condition: (s) => (s.employees ?? []).length >= 4,
    cooldownMonths: 48,
    baseProbability: 0.004,
  },

  // ── Vazamentos & Segurança ─────────────────────────────────────────────────
  {
    id: "employee_game_leak",
    category: "internal",
    title: "Funcionário Vaza Jogo Antes do Lançamento",
    body: "Um funcionário insatisfeito vazou assets e código-fonte de um projeto em desenvolvimento. A imprensa publicou tudo. As vendas futuras e a reputação da empresa sofreram um golpe duro.",
    effects: { moneyDelta: -200_000, reputationDelta: -8, fanRepDelta: -6, bugRiskDelta: 0.12, fansDelta: -600 },
    condition: (s) =>
      (s.gameProjects ?? []).some((p) => p.phase === "development") &&
      (s.employees ?? []).length >= 3,
    cooldownMonths: 48,
    baseProbability: 0.004,
  },
  {
    id: "hacker_breach_local",
    category: "crisis",
    title: "Ataque Hacker — Sede da Empresa",
    body: "Criminosos invadiram os servidores internos da sede. Dados de clientes foram expostos e o sistema ficou fora do ar por dias. O prejuízo operacional foi imediato.",
    effects: { moneyDelta: -150_000, techRepDelta: -5, reputationDelta: -5, commercialRepDelta: -3 },
    condition: (s) => (s.unlockedCountries ?? []).length <= 3,
    cooldownMonths: 42,
    baseProbability: 0.005,
  },
  {
    id: "hacker_breach_regional",
    category: "crisis",
    title: "Ataque Hacker — Filiais Regionais",
    body: "Um grupo organizado comprometeu as redes das suas filiais regionais. Dados financeiros e contratos foram roubados. A investigação e a recuperação custaram caro.",
    effects: { moneyDelta: -280_000, techRepDelta: -7, reputationDelta: -6, commercialRepDelta: -5, fansDelta: -400 },
    condition: (s) => (s.unlockedCountries ?? []).length >= 4 && (s.unlockedCountries ?? []).length <= 8,
    cooldownMonths: 42,
    baseProbability: 0.005,
  },
  {
    id: "hacker_breach_global",
    category: "crisis",
    title: "Ataque Hacker em Escala Global",
    body: "Um ataque coordenado atingiu simultaneamente suas filiais em múltiplos países. Pagamentos foram bloqueados, dados de milhares de clientes comprometidos e a imprensa internacional cobriu o incidente.",
    effects: { moneyDelta: -400_000, techRepDelta: -10, reputationDelta: -9, commercialRepDelta: -8, fansDelta: -800 },
    condition: (s) => (s.unlockedCountries ?? []).length >= 9,
    cooldownMonths: 42,
    baseProbability: 0.006,
  },
  {
    id: "internal_sabotage",
    category: "crisis",
    title: "Sabotagem Interna de Projeto",
    body: "Um ex-funcionário demitido sabotou deliberadamente um projeto antes de sair — apagando dados, introduzindo bugs e enviando código corrompido. O atraso e o prejuízo foram enormes.",
    effects: { moneyDelta: -220_000, devSpeedDelta: -0.30, bugRiskDelta: 0.15, reputationDelta: -6, techRepDelta: -4 },
    condition: (s) =>
      (s.employees ?? []).length >= 5 &&
      (s.gameProjects ?? []).some((p) => p.phase === "development"),
    cooldownMonths: 54,
    baseProbability: 0.004,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Event trigger logic
// ─────────────────────────────────────────────────────────────────────────────

export function pickDynamicEvent(
  state: DynamicEventStateSnapshot,
  firedEventIds: string[],
  ctx?: EventValidationContext,
): DynamicEventDef | null {
  const candidates = DYNAMIC_EVENT_DEFS.filter((def) => {
    if (def.minYear && state.year < def.minYear) return false;
    if (def.maxYear && state.year > def.maxYear) return false;
    if (def.condition && !def.condition(state)) return false;
    // Check cooldown: count recent firings of this event
    const lastFiredIdx = firedEventIds.lastIndexOf(def.id);
    if (lastFiredIdx >= 0) {
      const monthsSince = firedEventIds.length - 1 - lastFiredIdx;
      if (monthsSince < def.cooldownMonths) return false;
    }
    // ── Context validation ─────────────────────────────────────────────────
    if (ctx) {
      const valCat = inferDynEventCategory(def.category, def.effects);
      if (isHardBlockedEvent(valCat, ctx)) return false;
      if (!validateEventContext(valCat, ctx)) return false;
    }
    return true;
  });

  if (candidates.length === 0) return null;

  // Weighted random selection with context-driven probability scaling
  const scaledProbs = candidates.map((def) => {
    if (!ctx) return def.baseProbability;
    const valCat = inferDynEventCategory(def.category, def.effects);
    return def.baseProbability * getEventProbabilityScale(valCat, ctx);
  });

  const totalProb = scaledProbs.reduce((s, p) => s + p, 0);
  if (totalProb <= 0) return null;

  const roll = Math.random() * totalProb;
  let cum = 0;
  for (let i = 0; i < candidates.length; i++) {
    cum += scaledProbs[i];
    if (roll < cum) return candidates[i];
  }
  return null;
}
