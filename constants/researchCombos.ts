import type { NodeBonus } from "./strategyTree";

export type ResearchCombo = {
  id: string;
  name: string;
  description: string;
  effectLabel: string;
  requires: string[];
  bonus: NodeBonus;
  baseCost: number;
  baseTimeMonths: number;
  icon: string;
  color: string;
};

export function getComboTime(combo: ResearchCombo): number {
  return Math.max(1, Math.round(combo.baseTimeMonths * combo.requires.length * 1.1));
}

export function isComboAvailable(combo: ResearchCombo, researchedNodes: string[]): boolean {
  return combo.requires.every((r) => researchedNodes.includes(r));
}

export const RESEARCH_COMBOS: ResearchCombo[] = [
  {
    id: "combo_design_tech",
    name: "Motor Visual",
    description: "Design minimalista fundido com tecnologia de renderização avançada — a experiência visual torna-se a marca da empresa.",
    effectLabel: "+1.5 rating, +12% vendas",
    requires: ["design_A3", "tech_C3"],
    bonus: { ratingBonus: 1.5, salesMult: 1.12 },
    baseCost: 1_400_000,
    baseTimeMonths: 8,
    icon: "layers",
    color: "#A855F7",
  },
  {
    id: "combo_hw_games",
    name: "Plataforma Exclusiva",
    description: "Hardware especializado e software de elite criam um ecossistema de jogo fechado que os rivais não conseguem replicar.",
    effectLabel: "+2 rating, +15% receita de jogos",
    requires: ["hw_B3", "games_B3"],
    bonus: { ratingBonus: 2, gameRevMult: 1.15 },
    baseCost: 1_750_000,
    baseTimeMonths: 9,
    icon: "cpu",
    color: "#FF4D6A",
  },
  {
    id: "combo_sil_engines",
    name: "Processador Nativo",
    description: "Silício proprietário integrado diretamente no motor gráfico elimina a latência e reduz custos de produção.",
    effectLabel: "+2 rating, -10% custos",
    requires: ["sil_A3", "engines_B2"],
    bonus: { ratingBonus: 2, costMult: 0.9 },
    baseCost: 900_000,
    baseTimeMonths: 8,
    icon: "zap",
    color: "#4DA6FF",
  },
  {
    id: "combo_biz_design",
    name: "Campanha Inesquecível",
    description: "Estratégia comercial de elite encontra design icónico — cada lançamento vira evento cultural e mediático.",
    effectLabel: "+20% vendas, +8 reputação",
    requires: ["biz_A3", "design_A3"],
    bonus: { salesMult: 1.20, repBonus: 8 },
    baseCost: 1_100_000,
    baseTimeMonths: 7,
    icon: "trending-up",
    color: "#10B981",
  },
  {
    id: "combo_audio_games",
    name: "Obra de Arte Sonora",
    description: "Áudio imersivo de última geração fundido com design de jogo de elite — os jogadores nunca se esquecem da experiência.",
    effectLabel: "+2 rating, +10% receita de jogos, +2.000 fãs",
    requires: ["audio_A3", "games_C3"],
    bonus: { ratingBonus: 2, gameRevMult: 1.10, fansBonus: 2000 },
    baseCost: 1_400_000,
    baseTimeMonths: 9,
    icon: "volume-2",
    color: "#F5A623",
  },
  {
    id: "combo_engines_tech",
    name: "Renderização de Elite",
    description: "Motores de renderização de última geração alimentados por arquitetura técnica proprietária — visuais inimitáveis.",
    effectLabel: "+2.5 rating, +12% receita de jogos",
    requires: ["engines_A3", "tech_A3"],
    bonus: { ratingBonus: 2.5, gameRevMult: 1.12 },
    baseCost: 1_300_000,
    baseTimeMonths: 9,
    icon: "monitor",
    color: "#22D3EE",
  },
  {
    id: "combo_innov_engines",
    name: "Lab do Futuro",
    description: "Investigação de vanguarda aplicada diretamente ao motor de jogo — tecnologia sem precedentes que deixa a concorrência para trás.",
    effectLabel: "+15% receita de jogos, +10 reputação",
    requires: ["innov_A2", "engines_C3"],
    bonus: { gameRevMult: 1.15, repBonus: 10 },
    baseCost: 1_100_000,
    baseTimeMonths: 9,
    icon: "crosshair",
    color: "#6366F1",
  },
  {
    id: "combo_triple_silicon",
    name: "Silício Total",
    description: "Dominância completa em áudio, motores e processamento de silício — a plataforma mais poderosa alguma vez construída.",
    effectLabel: "+3 rating, +20% jogos, +20% vendas",
    requires: ["audio_C3", "engines_B3", "sil_B3"],
    bonus: { ratingBonus: 3, gameRevMult: 1.20, salesMult: 1.20 },
    baseCost: 2_500_000,
    baseTimeMonths: 8,
    icon: "star",
    color: "#F5A623",
  },
];
