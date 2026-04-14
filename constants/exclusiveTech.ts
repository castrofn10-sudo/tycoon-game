import type { SpecPath, SpecScores } from "./specialization";

export type ExclusiveCondition = {
  minYear?: number;
  minReputation?: number;
  minMoney?: number;
  requiredNodes?: string[];
  requiredSpec?: { path: SpecPath; minScore: number };
  conditionLabel: string;
};

export type ExclusiveTech = {
  id: string;
  name: string;
  description: string;
  effectLabel: string;
  tradeOffLabel?: string;
  cost: number;
  timeMonths: number;
  conditions: ExclusiveCondition;
  rarity: "rare" | "legendary";
  icon: string;
  color: string;
  bonus: {
    ratingBonus?: number;
    salesMult?: number;
    costMult?: number;
    campaignMult?: number;
    repBonus?: number;
    fansBonus?: number;
    gameRevMult?: number;
    riskMod?: number;
  };
};

export const EXCLUSIVE_TECHS: ExclusiveTech[] = [
  // ─── RARE ────────────────────────────────────────────────────────────────────
  {
    id: "excl_custom_os",
    name: "Sistema Operacional Proprietário",
    description: "Sistema operacional interno que integra hardware e software, melhorando a experiência e a retenção de utilizadores.",
    effectLabel: "+6% vendas, +5 reputação, +8% receita de jogos",
    tradeOffLabel: "+6% custos de manutenção",
    cost: 28_000_000,
    timeMonths: 18,
    rarity: "rare",
    icon: "monitor",
    color: "#4DA6FF",
    bonus: { salesMult: 1.06, repBonus: 5, gameRevMult: 1.08, costMult: 1.06 },
    conditions: {
      minYear: 1991,
      minReputation: 55,
      requiredSpec: { path: "hardware", minScore: 6 },
      conditionLabel: "1991+, rep≥55, foco em Hardware (6 nós)",
    },
  },
  {
    id: "excl_revolution_ctrl",
    name: "Controlador Revolucionário",
    description: "Controlador com design patenteado que redefine a ergonomia e cria diferenciação competitiva duradoura.",
    effectLabel: "+0.40 rating, +7% vendas, +5000 fãs",
    cost: 18_000_000,
    timeMonths: 14,
    rarity: "rare",
    icon: "radio",
    color: "#10B981",
    bonus: { ratingBonus: 0.40, salesMult: 1.07, fansBonus: 5000 },
    conditions: {
      minYear: 1994,
      requiredNodes: ["design_C3"],
      requiredSpec: { path: "hardware", minScore: 5 },
      conditionLabel: "1994+, Paradigma Novo desbloqueado, foco em Hardware (5 nós)",
    },
  },
  {
    id: "excl_custom_chip",
    name: "Chip Customizado de Nova Geração",
    description: "Silício desenhado internamente com especificações otimizadas que melhora performance e reduz dependência de terceiros.",
    effectLabel: "+0.45 rating, +8% vendas, -6% custo de produção",
    cost: 45_000_000,
    timeMonths: 20,
    rarity: "rare",
    icon: "cpu",
    color: "#A855F7",
    bonus: { ratingBonus: 0.45, salesMult: 1.08, costMult: 0.94 },
    conditions: {
      minYear: 2001,
      minReputation: 65,
      requiredNodes: ["sil_A3", "sil_B3"],
      conditionLabel: "2001+, rep≥65, Silicon A3 + B3 desbloqueados",
    },
  },
  {
    id: "excl_audio_engine",
    name: "Motor de Áudio Imersivo Exclusivo",
    description: "Motor de áudio proprietário que eleva a qualidade sonora e reforça a identidade técnica dos títulos.",
    effectLabel: "+8% receita de jogos, +0.35 rating, +6 reputação",
    cost: 22_000_000,
    timeMonths: 16,
    rarity: "rare",
    icon: "headphones",
    color: "#FF4D6A",
    bonus: { gameRevMult: 1.08, ratingBonus: 0.35, repBonus: 6 },
    conditions: {
      minYear: 1998,
      requiredSpec: { path: "games", minScore: 8 },
      requiredNodes: ["audio_A3", "audio_B3"],
      conditionLabel: "1998+, foco em Jogos (8 nós), Audio A3+B3",
    },
  },
  {
    id: "excl_game_engine",
    name: "Motor de Jogo Proprietário",
    description: "Engine proprietária que otimiza o pipeline de desenvolvimento e pode ser licenciada para receita adicional.",
    effectLabel: "+10% receita jogos, -7% custo de desenvolvimento, +7 reputação",
    cost: 38_000_000,
    timeMonths: 22,
    rarity: "rare",
    icon: "box",
    color: "#F97316",
    bonus: { gameRevMult: 1.10, costMult: 0.93, repBonus: 7 },
    conditions: {
      minYear: 2003,
      requiredNodes: ["engines_A3", "engines_B3"],
      requiredSpec: { path: "games", minScore: 7 },
      conditionLabel: "2003+, Engines A3+B3, foco em Jogos (7 nós)",
    },
  },
  {
    id: "excl_social_ecosystem",
    name: "Ecossistema Social de Jogos",
    description: "Plataforma social integrada que melhora a retenção e cria uma comunidade ativa em torno do produto.",
    effectLabel: "+7% receita jogos, +8000 fãs, +6 reputação",
    cost: 32_000_000,
    timeMonths: 18,
    rarity: "rare",
    icon: "users",
    color: "#10B981",
    bonus: { gameRevMult: 1.07, fansBonus: 8000, repBonus: 6 },
    conditions: {
      minYear: 2004,
      requiredNodes: ["online_A3", "biz_C3"],
      conditionLabel: "2004+, Esports desbloqueado, Ecossistema Fechado",
    },
  },
  {
    id: "excl_premium_pipeline",
    name: "Pipeline de Coleccionáveis Premium",
    description: "Linha de produtos premium com acabamento diferenciado que posiciona a marca no segmento de alto valor.",
    effectLabel: "+9 reputação, +8% margem operacional, +6000 fãs",
    cost: 25_000_000,
    timeMonths: 14,
    rarity: "rare",
    icon: "package",
    color: "#F5A623",
    bonus: { repBonus: 9, salesMult: 1.08, fansBonus: 6000 },
    conditions: {
      minYear: 2005,
      requiredSpec: { path: "premium", minScore: 7 },
      minReputation: 60,
      conditionLabel: "2005+, foco em Premium (7 nós), rep≥60",
    },
  },
  {
    id: "excl_digital_distribution",
    name: "Distribuição Digital Global",
    description: "Plataforma de distribuição direta que elimina intermediários e melhora as margens em mercados globais.",
    effectLabel: "+8% receita digital, +6% vendas, -5% custo",
    cost: 40_000_000,
    timeMonths: 20,
    rarity: "rare",
    icon: "download-cloud",
    color: "#34D399",
    bonus: { gameRevMult: 1.08, salesMult: 1.06, costMult: 0.95 },
    conditions: {
      minYear: 2008,
      requiredNodes: ["biz_C3", "online_B3"],
      requiredSpec: { path: "business", minScore: 6 },
      conditionLabel: "2008+, Ecossistema + Cloud Gaming, foco em Negócios (6 nós)",
    },
  },
  {
    id: "excl_cloud_platform",
    name: "Plataforma Cloud-Native",
    description: "Plataforma cloud-native que permite acesso instantâneo a jogos, com custos de infraestrutura proporcionais.",
    effectLabel: "+9% receita de jogos, +7% vendas, +8 reputação",
    tradeOffLabel: "+8% custos de infraestrutura",
    cost: 85_000_000,
    timeMonths: 24,
    rarity: "rare",
    icon: "cloud",
    color: "#4DA6FF",
    bonus: { gameRevMult: 1.09, salesMult: 1.07, repBonus: 8, costMult: 1.08 },
    conditions: {
      minYear: 2012,
      minReputation: 70,
      requiredNodes: ["online_B3"],
      requiredSpec: { path: "online", minScore: 8 },
      conditionLabel: "2012+, rep≥70, Cloud Gaming, foco Online (8 nós)",
    },
  },

  // ─── LEGENDARY ───────────────────────────────────────────────────────────────
  {
    id: "excl_adaptive_ai_engine",
    name: "Motor de IA Adaptativa",
    description: "Motor de inteligência artificial adaptativa que personaliza mundos e narrativas, criando vantagem competitiva duradoura.",
    effectLabel: "+0.55 rating, +12% receita jogos, +12000 fãs, +12 reputação",
    cost: 200_000_000,
    timeMonths: 28,
    rarity: "legendary",
    icon: "activity",
    color: "#A855F7",
    bonus: { ratingBonus: 0.55, gameRevMult: 1.12, fansBonus: 12000, repBonus: 12 },
    conditions: {
      minYear: 2015,
      minReputation: 75,
      requiredNodes: ["innov_B3", "innov_C3"],
      requiredSpec: { path: "innovation", minScore: 12 },
      conditionLabel: "2015+, rep≥75, IA Generativa + Procedural Total, Inovação (12 nós)",
    },
  },
  {
    id: "excl_advanced_vr_stack",
    name: "Pilha VR de Consumo Avançada",
    description: "Solução de realidade virtual integrada que posiciona a empresa na fronteira da experiência imersiva de consumo.",
    effectLabel: "+0.55 rating, +12% vendas, +15000 fãs, +12 reputação",
    cost: 250_000_000,
    timeMonths: 28,
    rarity: "legendary",
    icon: "eye",
    color: "#FF4D6A",
    bonus: { ratingBonus: 0.55, salesMult: 1.12, fansBonus: 15000, repBonus: 12 },
    conditions: {
      minYear: 2016,
      requiredNodes: ["innov_A3"],
      requiredSpec: { path: "innovation", minScore: 10 },
      minReputation: 70,
      conditionLabel: "2016+, AR Espacial desbloqueado, Inovação (10 nós), rep≥70",
    },
  },
  {
    id: "excl_realtime_raytracing",
    name: "Ray Tracing em Tempo Real",
    description: "Renderização em tempo real com ray tracing que eleva o fotorrealismo e diferencia tecnicamente o produto.",
    effectLabel: "+0.60 rating, +12% vendas, +14 reputação",
    cost: 180_000_000,
    timeMonths: 26,
    rarity: "legendary",
    icon: "sun",
    color: "#4DA6FF",
    bonus: { ratingBonus: 0.60, salesMult: 1.12, repBonus: 14 },
    conditions: {
      minYear: 2018,
      requiredNodes: ["sil_B3", "engines_B3"],
      requiredSpec: { path: "hardware", minScore: 14 },
      conditionLabel: "2018+, GPU Aceleração 3D + Pipeline Gráfico, Hardware (14 nós)",
    },
  },
  {
    id: "excl_neural_interface",
    name: "Interface Neural Gamer",
    description: "Interface de controlo cognitivo experimental que representa a fronteira tecnológica do setor, com riscos de implementação associados.",
    effectLabel: "+0.65 rating, +14% receita jogos, +20000 fãs, +15 rep",
    tradeOffLabel: "+10% risco técnico",
    cost: 500_000_000,
    timeMonths: 30,
    rarity: "legendary",
    icon: "zap",
    color: "#F5A623",
    bonus: { ratingBonus: 0.65, gameRevMult: 1.14, fansBonus: 20000, repBonus: 15, riskMod: 1.10 },
    conditions: {
      minYear: 2025,
      minReputation: 82,
      requiredNodes: ["innov_A3", "innov_B3"],
      requiredSpec: { path: "innovation", minScore: 16 },
      conditionLabel: "2025+, rep≥82, AR Espacial + IA Generativa, Inovação (16 nós)",
    },
  },
];

export function checkExclusiveAvailable(
  tech: ExclusiveTech,
  year: number,
  reputation: number,
  money: number,
  researchedNodes: string[],
  specScores: SpecScores,
): boolean {
  const c = tech.conditions;
  if (c.minYear && year < c.minYear) return false;
  if (c.minReputation && reputation < c.minReputation) return false;
  if (c.minMoney && money < c.minMoney) return false;
  if (c.requiredNodes) {
    for (const id of c.requiredNodes) {
      if (!researchedNodes.includes(id)) return false;
    }
  }
  if (c.requiredSpec) {
    if ((specScores[c.requiredSpec.path] ?? 0) < c.requiredSpec.minScore) return false;
  }
  return true;
}
