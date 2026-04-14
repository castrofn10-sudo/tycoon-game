export type SpecPath = "hardware" | "games" | "online" | "premium" | "innovation" | "business";

export const SPEC_PATHS: SpecPath[] = ["hardware", "games", "online", "premium", "innovation", "business"];

// Which node-ID prefixes count toward each specialization
const PREFIX_TO_SPEC: Record<string, SpecPath> = {
  hw: "hardware",
  sil: "hardware",
  engines: "hardware",
  games: "games",
  audio: "games",
  online: "online",
  design: "premium",
  tech: "innovation",
  innov: "innovation",
  biz: "business",
};

export const SPEC_NAMES: Record<SpecPath, string> = {
  hardware: "Hardware",
  games: "Jogos",
  online: "Online",
  premium: "Premium",
  innovation: "Inovação",
  business: "Negócios",
};

export const SPEC_FULL_NAMES: Record<SpecPath, string> = {
  hardware: "Foco em Hardware",
  games: "Desenvolvimento de Jogos",
  online: "Ecossistema Online",
  premium: "Design Premium",
  innovation: "Tecnologia & Inovação",
  business: "Negócios & Publicação",
};

export const SPEC_ICONS: Record<SpecPath, string> = {
  hardware: "cpu",
  games: "play-circle",
  online: "wifi",
  premium: "award",
  innovation: "zap",
  business: "briefcase",
};

export const SPEC_COLORS: Record<SpecPath, string> = {
  hardware: "#4DA6FF",
  games: "#FF4D6A",
  online: "#10B981",
  premium: "#F5A623",
  innovation: "#A855F7",
  business: "#34D399",
};

export const SPEC_TRADE_OFFS: Record<SpecPath, string> = {
  hardware: "−receita de jogos",
  games: "−vendas de hardware",
  online: "+custos de infraestrutura",
  premium: "menor receita indie",
  innovation: "+volatilidade / risco",
  business: "sem penalidade",
};

export type SpecScores = Record<SpecPath, number>;

export type SpecBonuses = {
  ratingBonus: number;
  salesMult: number;
  costMult: number;
  campaignMult: number;
  repBonus: number;
  gameRevMult: number;
  riskMod: number;
};

function getSpecFromId(nodeId: string): SpecPath | null {
  const prefix = nodeId.split("_")[0];
  return PREFIX_TO_SPEC[prefix] ?? null;
}

export function computeSpecialization(researchedNodes: string[]): SpecScores {
  const scores: SpecScores = {
    hardware: 0, games: 0, online: 0, premium: 0, innovation: 0, business: 0,
  };
  for (const id of researchedNodes) {
    const spec = getSpecFromId(id);
    if (spec) scores[spec] += 1;
  }
  return scores;
}

export function getSpecLevel(score: number): 0 | 1 | 2 | 3 {
  if (score >= 18) return 3;
  if (score >= 9) return 2;
  if (score >= 3) return 1;
  return 0;
}

export const SPEC_LEVEL_NAMES = ["Iniciante", "Emergente", "Focada", "Mestre"];
export const SPEC_LEVEL_COLORS = ["#6B7280", "#4DA6FF", "#A855F7", "#F5A623"];

export function getTopSpecs(scores: SpecScores): [SpecPath, number][] {
  return (Object.entries(scores) as [SpecPath, number][])
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);
}

export function getSpecializationBonuses(scores: SpecScores): SpecBonuses {
  const b: SpecBonuses = {
    ratingBonus: 0, salesMult: 1, costMult: 1, campaignMult: 1,
    repBonus: 0, gameRevMult: 1, riskMod: 1,
  };

  const sorted = getTopSpecs(scores);
  for (let i = 0; i < Math.min(2, sorted.length); i++) {
    const [spec, score] = sorted[i];
    const weight = i === 0 ? 1.0 : 0.35;
    const level = getSpecLevel(score);
    if (level === 0) continue;
    const pts = Math.min(score, 24);

    switch (spec) {
      case "hardware":
        b.salesMult *= (1 + pts * 0.006 * weight);
        b.ratingBonus += pts * 0.09 * weight;
        if (i === 0 && pts >= 9) b.gameRevMult *= Math.max(0.85, 1 - pts * 0.004);
        break;
      case "games":
        b.gameRevMult *= (1 + pts * 0.009 * weight);
        b.ratingBonus += pts * 0.07 * weight;
        if (i === 0 && pts >= 9) b.salesMult *= Math.max(0.90, 1 - pts * 0.003);
        break;
      case "online":
        b.gameRevMult *= (1 + pts * 0.007 * weight);
        b.salesMult *= (1 + pts * 0.003 * weight);
        if (i === 0 && pts >= 9) b.costMult *= (1 + pts * 0.003);
        break;
      case "premium":
        b.repBonus += pts * 0.7 * weight;
        b.salesMult *= (1 + pts * 0.005 * weight);
        b.ratingBonus += pts * 0.06 * weight;
        break;
      case "innovation":
        b.ratingBonus += pts * 0.11 * weight;
        b.gameRevMult *= (1 + pts * 0.005 * weight);
        if (i === 0 && pts >= 9) b.riskMod *= (1 + pts * 0.005);
        break;
      case "business":
        b.campaignMult *= (1 + pts * 0.009 * weight);
        b.salesMult *= (1 + pts * 0.004 * weight);
        if (i === 0 && pts >= 9) b.costMult *= Math.max(0.85, 1 - pts * 0.004);
        break;
    }
  }
  return b;
}
