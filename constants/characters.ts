export type CharacterBonuses = {
  salesMult: number;
  costMult: number;
  ratingBonus: number;
  researchSpeedMult: number;
  campaignMult: number;
  reputationBonus: number;
  gameRevMult: number;
  branchCostMult: number;
  loanInterestMod: number;
  hireCostMult: number;
  fansPerLaunchMult: number;
};

export type Character = {
  id: string;
  name: string;
  title: string;
  description: string;
  archetype: string;
  icon: string;
  color: string;
  bonuses: CharacterBonuses;
  bonusLabels: string[];
  penaltyLabels: string[];
  playstyle: string;
};

const DEFAULT_BONUSES: CharacterBonuses = {
  salesMult: 1,
  costMult: 1,
  ratingBonus: 0,
  researchSpeedMult: 1,
  campaignMult: 1,
  reputationBonus: 0,
  gameRevMult: 1,
  branchCostMult: 1,
  loanInterestMod: 0,
  hireCostMult: 1,
  fansPerLaunchMult: 1,
};

export const CHARACTERS: Character[] = [
  {
    id: "visionary",
    name: "Alex Sterling",
    title: "O Visionário",
    archetype: "Disruptor",
    description:
      "Um fundador obcecado com design e experiência do usuário. Seus produtos redefinem categorias inteiras — quando funcionam.",
    icon: "eye",
    color: "#A855F7",
    bonuses: {
      ...DEFAULT_BONUSES,
      salesMult: 1.06,
      ratingBonus: 0.3,
      fansPerLaunchMult: 1.08,
      costMult: 1.05,
    },
    bonusLabels: [
      "+6% vendas de lançamento",
      "+0.3 rating base em consoles",
      "+8% fãs por lançamento",
    ],
    penaltyLabels: ["+5% custo de produção"],
    playstyle: "Focado em produtos premium e domínio de mercado de alto preço.",
  },
  {
    id: "strategist",
    name: "Morgan Voss",
    title: "O Estrategista",
    archetype: "Executive",
    description:
      "Ex-consultor de gestão que transformou empresas deficitárias em líderes de mercado através de fusões, corte de custos e expansão global.",
    icon: "briefcase",
    color: "#4DA6FF",
    bonuses: {
      ...DEFAULT_BONUSES,
      costMult: 0.95,
      branchCostMult: 0.92,
      loanInterestMod: -0.005,
      ratingBonus: -0.15,
    },
    bonusLabels: [
      "-5% todos os custos",
      "-8% custo de filiais",
      "-0.5% juros em empréstimos",
    ],
    penaltyLabels: ["-0.15 rating de produto"],
    playstyle: "Mestre da eficiência operacional e expansão global agressiva.",
  },
  {
    id: "engineer",
    name: "Ryu Tanaka",
    title: "O Engenheiro",
    archetype: "Inventor",
    description:
      "Gênio técnico que projeta chips e arquiteturas do zero. Seus consoles batem benchmarks impossiveis — mas o marketing não é seu forte.",
    icon: "cpu",
    color: "#00C896",
    bonuses: {
      ...DEFAULT_BONUSES,
      ratingBonus: 0.4,
      costMult: 0.96,
      researchSpeedMult: 1.12,
      campaignMult: 0.92,
    },
    bonusLabels: [
      "+0.4 rating base em consoles",
      "-4% custo de produção",
      "+12% velocidade de pesquisa",
    ],
    penaltyLabels: ["-8% eficácia de campanhas de marketing"],
    playstyle: "Desbloqueie tecnologias avançadas mais rápido e domine o hardware.",
  },
  {
    id: "marketer",
    name: "Sloane Pierce",
    title: "O Guru do Marketing",
    archetype: "Influencer",
    description:
      "Criou algumas das campanhas mais memoráveis da história. Qualquer produto que lança vira desejo de consumo — mesmo que o hardware seja mediano.",
    icon: "trending-up",
    color: "#FF6B35",
    bonuses: {
      ...DEFAULT_BONUSES,
      campaignMult: 1.15,
      fansPerLaunchMult: 1.12,
      salesMult: 1.06,
      researchSpeedMult: 0.92,
    },
    bonusLabels: [
      "+15% eficácia de campanhas",
      "+12% fãs por lançamento",
      "+6% vendas globais",
    ],
    penaltyLabels: ["-8% velocidade de pesquisa"],
    playstyle: "Transforme produtos medianos em fenômenos culturais com marketing brutal.",
  },
  {
    id: "developer",
    name: "Kai Okafor",
    title: "O Game Developer",
    archetype: "Creator",
    description:
      "Designer de jogos lendário que sabe exatamente quais jogos os jogadores querem. Seu estúdio gera blockbusters enquanto ele dorme.",
    icon: "play",
    color: "#F5A623",
    bonuses: {
      ...DEFAULT_BONUSES,
      gameRevMult: 1.10,
      researchSpeedMult: 1.08,
      fansPerLaunchMult: 1.10,
      costMult: 1.04,
    },
    bonusLabels: [
      "+10% receita de jogos",
      "+8% velocidade de pesquisa",
      "+10% fãs por lançamento",
    ],
    penaltyLabels: ["+4% custo de produção de hardware"],
    playstyle: "Construa o ecosistema de jogos mais rico e prenda os jogadores à sua plataforma.",
  },
  {
    id: "balanced",
    name: "Jordan Park",
    title: "O Fundador Equilibrado",
    archetype: "Generalist",
    description:
      "Criou empresas em 3 indústrias diferentes. Sem pontos fracos graves, sem pontos fortes extremos — mas consistentemente vence no longo prazo.",
    icon: "shield",
    color: "#64748B",
    bonuses: {
      ...DEFAULT_BONUSES,
      salesMult: 1.08,
      costMult: 0.96,
      ratingBonus: 0.3,
      researchSpeedMult: 1.1,
      campaignMult: 1.1,
      gameRevMult: 1.08,
      reputationBonus: 3,
      branchCostMult: 0.95,
      fansPerLaunchMult: 1.1,
    },
    bonusLabels: [
      "+8% vendas globais",
      "-4% todos os custos",
      "+0.3 rating de produto",
      "+10% velocidade de pesquisa",
      "+10% campanhas de marketing",
    ],
    penaltyLabels: ["Sem bônus extremo em nenhuma área"],
    playstyle: "Cresce de forma sólida em todas as frentes — a melhor escolha para iniciantes.",
  },
];

export function getCharacterById(id: string): Character | undefined {
  return CHARACTERS.find((c) => c.id === id);
}

// ── Founder Modifiers ──────────────────────────────────────────────────────────
// Small, capped, one-time modifiers derived from custom founder attributes.
// Applied at game-start snapshot only; never recalculated during a session.

export type FounderModifiers = {
  productQuality:       number;  // additive ratingBonus delta  — capped ±0.02
  researchSpeed:        number;  // multiplicative factor delta — capped ±0.02
  marketingEfficiency:  number;  // multiplicative factor delta — capped ±0.02
};

const FM_CAP = 0.02;
const clampFM = (v: number) => Math.max(-FM_CAP, Math.min(FM_CAP, v));

/**
 * Pure function — no side effects, no game-system calls.
 * attrs order: [creativity, tech, business, marketing, speed]
 * Each point = +2% raw; trade-offs reduce effective values.
 * Hard cap: ±2% (0.02) per modifier.
 */
export function getFounderModifiers(attrs: number[]): FounderModifiers {
  if (!attrs || attrs.length < 5) {
    return { productQuality: 0, researchSpeed: 0, marketingEfficiency: 0 };
  }
  const [cri, tec, neg, mkt, vel] = attrs;
  return {
    productQuality:      clampFM((cri * 0.6 - vel * 0.3) * 0.005),
    researchSpeed:       clampFM((tec * 0.7 + vel * 0.3 - cri * 0.2) * 0.004),
    marketingEfficiency: clampFM((mkt * 0.7 - tec * 0.2) * 0.005),
  };
}

export const DEFAULT_CHARACTER_BONUSES: CharacterBonuses = { ...DEFAULT_BONUSES };

/**
 * Converts custom founder attr points [cri, tec, neg, mkt, vel] into CharacterBonuses.
 * Trade-off spec: 1 pt = +2% bonus; penalty = -1%/pt applied.
 *   Criatividade ↑ → Técnica ↓
 *   Técnica ↑ → Marketing ↓
 *   Negócios ↑ → Criatividade ↓
 *   Marketing ↑ → Técnica ↓
 *   Velocidade ↑ → Qualidade ↓
 * Hard limits: max +8%, min -6% per effective attribute.
 */
export function attrsToCharacterBonuses(attrs: number[]): CharacterBonuses {
  const [cri = 0, tec = 0, neg = 0, mkt = 0, vel = 0] = attrs;

  // Effective percentage after trade-offs
  const criPct  = Math.max(-6, Math.min(8, cri * 2 - neg));
  const tecPct  = Math.max(-6, Math.min(8, tec * 2 - cri - mkt));
  const negPct  = Math.min(8, neg * 2);
  const mktPct  = Math.max(-6, Math.min(8, mkt * 2 - tec));
  const velPct  = Math.min(8, vel * 2);
  const qualPenaltyPct = -(vel);   // -1% per speed point, affects rating

  return {
    salesMult:         1 + (mktPct * 0.008 + negPct * 0.005),
    costMult:          1 - negPct * 0.006 + Math.max(0, criPct) * 0.001,
    ratingBonus:       criPct * 0.065 + tecPct * 0.038 + qualPenaltyPct * 0.06,
    researchSpeedMult: 1 + tecPct * 0.025 + Math.max(0, velPct) * 0.018,
    campaignMult:      1 + mktPct * 0.036,
    reputationBonus:   Math.max(0, criPct) * 0.9 + Math.max(0, negPct) * 0.5,
    gameRevMult:       1 + Math.max(0, criPct) * 0.012,
    branchCostMult:    1 - Math.max(0, negPct) * 0.004,
    loanInterestMod:   -Math.max(0, negPct) * 0.0002,
    hireCostMult:      1 - Math.max(0, negPct) * 0.003,
    fansPerLaunchMult: 1 + mktPct * 0.024 + Math.max(0, criPct) * 0.010,
  };
}

/**
 * Returns human-readable bonus/penalty lines for the custom founder preview.
 * attrs: [cri, tec, neg, mkt, vel]
 */
export function getCustomFounderLabels(attrs: number[]): {
  bonuses: string[];
  penalties: string[];
} {
  const [cri = 0, tec = 0, neg = 0, mkt = 0, vel = 0] = attrs;
  const criPct = Math.max(-6, cri * 2 - neg);
  const tecPct = Math.max(-6, tec * 2 - cri - mkt);
  const negPct = Math.min(8, neg * 2);
  const mktPct = Math.max(-6, mkt * 2 - tec);
  const velPct = Math.min(8, vel * 2);
  const qualPenalty = vel;

  const bonuses: string[] = [];
  const penalties: string[] = [];

  if (criPct > 0)  bonuses.push(`+${criPct}% qualidade de produto`);
  if (tecPct > 0)  bonuses.push(`+${tecPct}% pesquisa e técnica`);
  if (negPct > 0)  bonuses.push(`+${negPct}% eficiência de negócios`);
  if (mktPct > 0)  bonuses.push(`+${mktPct}% impacto de marketing`);
  if (velPct > 0)  bonuses.push(`+${velPct}% velocidade de P&D`);

  if (criPct < 0)  penalties.push(`${criPct}% qualidade de produto`);
  if (tecPct < 0)  penalties.push(`${tecPct}% pesquisa e técnica`);
  if (mktPct < 0)  penalties.push(`${mktPct}% eficiência de marketing`);
  if (qualPenalty > 0) penalties.push(`-${qualPenalty}% qualidade final`);

  return { bonuses, penalties };
}
