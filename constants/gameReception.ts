import type { GameProject, GameGenre, BugLevel } from "./gameEngine";

export type StarRating = 1 | 2 | 3 | 4 | 5;
export type ReceptionSentiment = "flop" | "negative" | "mixed" | "positive" | "masterpiece";
export type ConsoleReceptionResult = {
  score: number;
  stars: StarRating;
  sentiment: ReceptionSentiment;
  comment: string;
};

export const SENTIMENT_LABELS: Record<ReceptionSentiment, string> = {
  flop: "Fracasso",
  negative: "Mal Recebido",
  mixed: "Dividiu Opiniões",
  positive: "Bem Recebido",
  masterpiece: "Obra-Prima",
};

export const SENTIMENT_COLORS: Record<ReceptionSentiment, string> = {
  flop: "#FF4D6A",
  negative: "#FF7043",
  mixed: "#F5A623",
  positive: "#4DA6FF",
  masterpiece: "#FFD700",
};

export const SENTIMENT_ICONS: Record<ReceptionSentiment, string> = {
  flop: "thumbs-down",
  negative: "frown",
  mixed: "meh",
  positive: "smile",
  masterpiece: "award",
};

const COMMENT_POOLS: Record<ReceptionSentiment, string[]> = {
  flop: [
    "Um lançamento para esquecer. O público mal notou a chegada.",
    "Fraco em todos os aspectos. Difícil encontrar algo positivo.",
    "O jogo foi amplamente ignorado, e com razão.",
    "Uma ideia sem execução. Decepcionou até os fãs mais leais.",
    "A crítica foi impiedosa, e o público concordou.",
    "Esse lançamento foi uma lição cara de aprender.",
    "Não estava pronto para o mercado. Parecia inacabado.",
    "Os fãs esperavam mais e foram profundamente decepcionados.",
    "O produto chegou quebrado. Uma mancha na reputação do estúdio.",
    "Um fracasso que vai custar caro para recuperar.",
  ],
  negative: [
    "A execução deixou muito a desejar.",
    "O público esperava mais polimento.",
    "Há boas ideias aqui, mas mal desenvolvidas.",
    "A crítica pegou pesado, mas viu potencial para o futuro.",
    "Abaixo do esperado para um estúdio com essa reputação.",
    "O lançamento foi apressado demais.",
    "O conceito era bom, mas a execução falhou.",
    "O mercado não respondeu como o esperado.",
    "Há qualidades claras, mas o produto parece inacabado.",
    "Uma decepção com raízes num conceito promissor.",
    "Os problemas técnicos mancharam o que poderia ter sido bom.",
  ],
  mixed: [
    "Esse lançamento dividiu opiniões, mas chamou atenção.",
    "Tem qualidades claras, mas não convenceu totalmente.",
    "O lançamento foi morno e pouco memorável.",
    "Um jogo decente, mas sem nada que o torne especial.",
    "Os fãs estão divididos, mas o produto tem seus méritos.",
    "Não é ruim, mas também não empolgou como esperado.",
    "O público foi neutro — comprou, jogou e seguiu em frente.",
    "Uma experiência mediana em um mercado competitivo.",
    "Funciona, mas não deixa saudade.",
    "A combinação de ideias foi interessante, mas irregular.",
    "Alguns adoraram, outros odiaram. Controvérsias são atenção.",
  ],
  positive: [
    "Um lançamento sólido que conquistou muitos fãs.",
    "O público aprovou e espera mais do estúdio.",
    "Uma adição bem-vinda ao catálogo da empresa.",
    "Bem recebido pela crítica e pelo público.",
    "Um bom jogo que sabe exatamente o que quer ser.",
    "Surpreendeu positivamente pela qualidade da entrega.",
    "A combinação de gêneros funcionou melhor do que o esperado.",
    "Os fãs adoraram e já estão pedindo mais.",
    "Um passo importante para o crescimento do estúdio.",
    "Lançamento consistente com alta qualidade de execução.",
    "A crítica elogiou. O público comprou. Missão cumprida.",
    "Uma obra que vai envelhecer bem. Base de fãs crescendo.",
  ],
  masterpiece: [
    "Os fãs adoraram a criatividade e já querem mais!",
    "Uma obra-prima! O mercado vai lembrar desse título por anos.",
    "Superou todas as expectativas. Jogo do ano em vista!",
    "Uma surpresa excelente que redefiniu o gênero.",
    "Um marco na história do estúdio e da indústria.",
    "O público ficou boca aberta. Vendas batendo recordes.",
    "A crítica foi unânime: obra-prima absoluta!",
    "Esse jogo conquistou uma base fiel rapidamente.",
    "Revolucionou o gênero e elevou o padrão da indústria.",
    "Raríssimo ver um lançamento tão completo e polido.",
    "Uma franquia nasceu. O público quer mais dessa série!",
    "A indústria inteira está falando. Lendário desde o dia 1.",
  ],
};

const GENRE_SYNERGY_MAP: Record<string, number> = {
  "rpg+action": 1.18,     "action+rpg": 1.18,
  "rpg+adventure": 1.12,  "adventure+rpg": 1.12,
  "rpg+strategy": 1.15,   "strategy+rpg": 1.15,
  "rpg+indie": 1.08,      "indie+rpg": 1.08,
  "action+shooter": 1.10, "shooter+action": 1.10,
  "action+horror": 1.14,  "horror+action": 1.14,
  "action+platformer": 1.09, "platformer+action": 1.09,
  "sandbox+sim": 1.15,    "sim+sandbox": 1.15,
  "sandbox+adventure": 1.12, "adventure+sandbox": 1.12,
  "sports+racing": 1.08,  "racing+sports": 1.08,
  "sports+sim": 1.07,     "sim+sports": 1.07,
  "adventure+platformer": 1.10, "platformer+adventure": 1.10,
  "adventure+puzzle": 1.08,    "puzzle+adventure": 1.08,
  "strategy+sim": 1.12,   "sim+strategy": 1.12,
  "strategy+indie": 1.05, "indie+strategy": 1.05,
  "indie+puzzle": 1.06,   "puzzle+indie": 1.06,
  "horror+puzzle": 1.10,  "puzzle+horror": 1.10,
  "horror+shooter": 1.11, "shooter+horror": 1.11,
};

const RISKY_COMBO_KEYS: string[] = [
  "horror+sports", "sports+horror",
  "racing+rpg", "rpg+racing",
  "puzzle+shooter", "shooter+puzzle",
  "sim+horror", "horror+sim",
  "indie+shooter", "shooter+indie",
  "sports+rpg", "rpg+sports",
  "racing+horror", "horror+racing",
  "puzzle+racing", "racing+puzzle",
];

export function computeGenreSynergy(genres: GameGenre[]): number {
  if (genres.length <= 1) return 1.0;
  let synergy = 1.0;
  for (let i = 0; i < genres.length; i++) {
    for (let j = i + 1; j < genres.length; j++) {
      const key = `${genres[i]}+${genres[j]}`;
      synergy *= GENRE_SYNERGY_MAP[key] ?? 0.97;
    }
  }
  if (genres.length === 3) synergy *= 1.04;
  return Math.round(synergy * 1000) / 1000;
}

export function isRiskyCombo(genres: GameGenre[]): boolean {
  if (genres.length < 2) return false;
  for (let i = 0; i < genres.length; i++) {
    for (let j = i + 1; j < genres.length; j++) {
      if (RISKY_COMBO_KEYS.includes(`${genres[i]}+${genres[j]}`)) return true;
    }
  }
  return false;
}

export function getMultiGenreScale(genreCount: number): { costMult: number; timeMult: number } {
  if (genreCount <= 1) return { costMult: 1.0, timeMult: 1.0 };
  if (genreCount === 2) return { costMult: 1.30, timeMult: 1.20 };
  return { costMult: 1.65, timeMult: 1.50 };
}

const GENRE_COMPLEXITY_WEIGHT: Partial<Record<GameGenre, number>> = {
  // LOW — fast to develop
  "puzzle": 0.82, "indie": 0.85, "minimalist": 0.80, "meme_game": 0.82,
  "absurd_comedy": 0.83, "interactive_story": 0.88, "chaos_sim": 0.85,
  "glitch_game": 0.83, "bankrupt_sim": 0.90, "bullet_hell": 0.92,
  "twin_stick": 0.90, "speedrun": 0.90, "parkour": 0.92,
  // MEDIUM — standard scope
  "action": 1.00, "platformer": 1.00, "racing": 0.95, "sports": 0.95,
  "shooter": 1.05, "horror": 1.05, "adventure": 1.00, "stealth": 1.08,
  "hack_slash": 1.00, "arena_brawler": 1.00, "destruction_sim": 0.95,
  "psychological_horror": 1.10, "tactical_shooter": 1.10, "detective": 1.12,
  "dream_sim": 0.90, "time_loop": 1.00, "parallel_universe": 1.00,
  "reality_distortion": 0.92, "influencer_sim": 0.90, "physics_game": 1.00,
  "extraction_shooter": 1.15, "dungeon_crawler": 1.18, "soulslike": 1.28,
  "streaming_sim": 1.10, "esports_manager": 1.15, "crime_sim": 1.15,
  "economic_crisis": 1.10, "cosmic_horror": 1.12,
  // HIGH — complex systems
  "rpg": 1.35, "strategy": 1.25, "sim": 1.20, "survival_hardcore": 1.25,
  "scifi_strategy": 1.30, "fantasy_strategy": 1.30, "political_sim": 1.25,
  "game_dev_sim": 1.20, "publisher_sim": 1.22,
  // VERY HIGH — deep, open, layered
  "sandbox": 1.58, "sandbox_criativo": 1.52, "city_builder": 1.40,
  "colony_management": 1.45, "automation": 1.48, "life_sim": 1.55,
  "space_exploration": 1.50,
};

/** Adjust development time based on genre complexity.
 *  Takes the base months already scaled by budget × multiGenreTimeMult,
 *  applies per-genre complexity weights, and clamps to [minMonths, maxMonths].
 *  Defaults: minMonths=4, maxMonths=20 — callers should pass tier-specific bounds
 *  (Indie: 4/8 · AA: 8/12 · AAA: 12/20) so complexity stays within each tier. */
export function computeGenreDevTime(
  genres: GameGenre[],
  scaledBaseMonths: number,
  minMonths: number = 4,
  maxMonths: number = 20,
): number {
  if (!genres.length) return Math.max(minMonths, Math.min(maxMonths, scaledBaseMonths));
  const weights = genres.map(g => GENRE_COMPLEXITY_WEIGHT[g] ?? 1.0);
  const avgWeight = weights.reduce((s, w) => s + w, 0) / weights.length;
  // Small extra bump when combining multiple heavy genres
  const interactionBonus = genres.length > 1 && avgWeight > 1.18 ? 1.08 : 1.0;
  const raw = Math.round(scaledBaseMonths * avgWeight * interactionBonus);
  return Math.max(minMonths, Math.min(maxMonths, raw));
}

export function computeGameReception(params: {
  quality: number;
  genres: GameGenre[];
  budget: number;
  reputation: number;
  hasMarketing: boolean;
  trendMult: number;
}): {
  score: number;
  stars: StarRating;
  sentiment: ReceptionSentiment;
  comment: string;
  fanDemandForSequel: boolean;
} {
  const { genres, hasMarketing, trendMult } = params;
  // Guard numeric inputs at entry — NaN quality/budget/reputation poisons the entire score
  const quality    = Number.isFinite(params.quality)    ? params.quality    : 5;
  const budget     = Number.isFinite(params.budget)     ? params.budget     : 0;
  const reputation = Number.isFinite(params.reputation) ? params.reputation : 1;

  const qualityBase = quality * 8;
  const repBonus = Math.min(10, Math.round(reputation * 0.10));
  const marketingBonus = hasMarketing ? 7 : 0;
  const synergy = computeGenreSynergy(genres);
  const synergyBonus = Math.round(Math.max(-6, Math.min(12, (synergy - 1.0) * 50)));
  const trendBonus = trendMult > 1.05 ? Math.round((trendMult - 1) * 18) : 0;
  const budgetBonus = budget >= 2_000_000 ? 3 : budget >= 500_000 ? 1 : 0;

  const isRisky = isRiskyCombo(genres);
  const varRange = 12 + genres.length * 4 + (isRisky ? 8 : 0);
  const variance = (Math.random() * 2 - 1) * varRange;
  const sleeperBonus = Math.random() < 0.03 ? 18 : 0;

  const rawScore = qualityBase + repBonus + marketingBonus + synergyBonus + trendBonus + budgetBonus + variance + sleeperBonus;
  const score = Math.round(Math.max(0, Math.min(100, rawScore)));

  let stars: StarRating;
  if (score >= 85) stars = 5;
  else if (score >= 70) stars = 4;
  else if (score >= 54) stars = 3;
  else if (score >= 38) stars = 2;
  else stars = 1;

  let sentiment: ReceptionSentiment;
  if (score >= 85) sentiment = "masterpiece";
  else if (score >= 70) sentiment = "positive";
  else if (score >= 50) sentiment = "mixed";
  else if (score >= 32) sentiment = "negative";
  else sentiment = "flop";

  const pool = COMMENT_POOLS[sentiment];
  const comment = pool[Math.floor(Math.random() * pool.length)];
  const fanDemandForSequel = stars >= 4 && score >= 70 && Math.random() < 0.45;

  return { score, stars, sentiment, comment, fanDemandForSequel };
}

const CONSOLE_COMMENT_POOLS: Record<ReceptionSentiment, string[]> = {
  flop: [
    "Um hardware esquecível que não impressionou ninguém.",
    "O público mal notou o lançamento. Uma estreia fraca demais.",
    "Problemas técnicos mancharam o que já era um produto medíocre.",
    "O console não convenceu nem os fãs mais leais da marca.",
    "Um lançamento constrangedor. Revisão urgente é necessária.",
    "O mercado foi impiedoso com esse hardware.",
    "Desempenho aquém das promessas. Decepção generalizada.",
    "Uma aposta cara que não compensou. O mercado não perdoa.",
    "Difícil encontrar alguma razão para escolher esse console.",
    "Um tropeço que vai custar caro para recuperar.",
  ],
  negative: [
    "O console tem potencial, mas a execução deixou a desejar.",
    "Hardware abaixo do esperado para esse nível de preço.",
    "Há boas ideias aqui, mas mal implementadas.",
    "O lançamento foi apressado. Faltou polish.",
    "A crítica especializada ficou pouco impressionada.",
    "Prometeu muito e entregou menos do que o esperado.",
    "Problemas técnicos diminuem o valor real do produto.",
    "O público esperava mais de um hardware dessa categoria.",
    "Uma geração atrás da concorrência em aspectos importantes.",
    "Tem seus méritos, mas não justifica o investimento total.",
    "O mercado está frio — a recepção foi abaixo do esperado.",
  ],
  mixed: [
    "Um console decente que não empolgou nem decepcionou.",
    "Opiniões divididas — tem seus pontos fortes e fracos.",
    "O público ficou neutro. Comprou, usou e seguiu em frente.",
    "Não é ruim, mas a concorrência oferece mais pelo mesmo preço.",
    "Uma adição competente, mas sem nada revolucionário.",
    "Funciona bem para o que promete, nada além disso.",
    "A comunidade está dividida sobre o real valor do hardware.",
    "Uma estreia morna em um mercado muito competitivo.",
    "O console tem qualidades, mas não define a geração.",
    "Alguns amaram, outros ficaram indiferentes.",
    "Neutro por ora — o tempo vai mostrar o real valor.",
  ],
  positive: [
    "Um console sólido que conquistou rapidamente sua base de fãs.",
    "Hardware bem recebido com performance acima da média.",
    "Os jogadores gostaram — vendas iniciais superam expectativas.",
    "A crítica elogiou a relação qualidade-preço.",
    "Um bom passo à frente para a empresa no mercado de hardware.",
    "Impressionou positivamente pela qualidade de construção.",
    "A comunidade está animada com o potencial da plataforma.",
    "Lançamento consistente que abre caminho para uma geração forte.",
    "O público aprovou e a base de desenvolvedores está crescendo.",
    "Um hardware que vai envelhecer bem com os anos.",
    "Boa estreia — os fãs já querem ver o próximo título.",
    "Uma plataforma com futuro promissor no mercado.",
  ],
  masterpiece: [
    "Um console lendário desde o dia 1. A indústria está de boca aberta!",
    "Hardware revolucionário que vai definir uma geração inteira!",
    "A crítica foi unânime: obra-prima absoluta do design de hardware!",
    "O público ficou impressionado. Fila nas lojas no dia de lançamento!",
    "Um marco tecnológico. Os concorrentes vão correr para alcançar.",
    "Superou todas as expectativas. Vendia acima do preço nas primeiras semanas!",
    "Esse hardware vai ser estudado por engenheiros por décadas.",
    "A indústria inteira está falando. Uma plataforma histórica nasceu.",
    "Raríssimo ver um hardware tão completo, polido e inovador.",
    "Uma geração começou aqui. Os fãs estão eufóricos!",
    "A concorrência vai levar anos para responder a esse nível.",
    "Um produto que transcende o mercado. Arte em forma de hardware.",
  ],
};

export function computeConsoleReception(params: {
  performanceScore: number;
  appealScore: number;
  reputation: number;
  hasMarketing: boolean;
  thermalOK: boolean;
  powerOK: boolean;
}): ConsoleReceptionResult {
  const { hasMarketing, thermalOK, powerOK } = params;
  // Guard numeric inputs — NaN performanceScore or appealScore produces NaN score
  const performanceScore = Number.isFinite(params.performanceScore) ? params.performanceScore : 50;
  const appealScore      = Number.isFinite(params.appealScore)      ? params.appealScore      : 5;
  const reputation       = Number.isFinite(params.reputation)       ? params.reputation       : 1;

  const perfBase = Math.round(performanceScore * 0.58);
  const appealBonus = Math.round(appealScore * 1.6);
  const repBonus = Math.min(10, Math.round(reputation * 0.09));
  const marketingBonus = hasMarketing ? 6 : 0;
  const thermalPenalty = thermalOK ? 0 : -14;
  const powerPenalty = powerOK ? 0 : -7;

  const variance = (Math.random() * 2 - 1) * 11;
  const sleeperBonus = Math.random() < 0.025 ? 16 : 0;

  const rawScore = perfBase + appealBonus + repBonus + marketingBonus + thermalPenalty + powerPenalty + variance + sleeperBonus;
  const score = Math.round(Math.max(0, Math.min(100, rawScore)));

  let stars: StarRating;
  if (score >= 85) stars = 5;
  else if (score >= 70) stars = 4;
  else if (score >= 54) stars = 3;
  else if (score >= 38) stars = 2;
  else stars = 1;

  let sentiment: ReceptionSentiment;
  if (score >= 85) sentiment = "masterpiece";
  else if (score >= 70) sentiment = "positive";
  else if (score >= 50) sentiment = "mixed";
  else if (score >= 32) sentiment = "negative";
  else sentiment = "flop";

  const pool = CONSOLE_COMMENT_POOLS[sentiment];
  const comment = pool[Math.floor(Math.random() * pool.length)];

  return { score, stars, sentiment, comment };
}

export function getSequelAdvice(prevProject: GameProject): {
  message: string;
  riskLevel: "low" | "medium" | "high";
  bonusMult: number;
} {
  const stars = prevProject.starRating ?? 3;
  const hasFanDemand = prevProject.fanDemandForSequel ?? false;
  const sequelCount = prevProject.sequelCount ?? 0;
  const fatigueMult = sequelCount >= 3 ? 0.80 : sequelCount === 2 ? 0.90 : sequelCount === 1 ? 0.95 : 1.0;

  if (stars <= 1) {
    return {
      message: "⚠️ Talvez seja melhor melhorar a fórmula antes de insistir em uma sequência. O título anterior não conquistou o público.",
      riskLevel: "high",
      bonusMult: 0.80 * fatigueMult,
    };
  } else if (stars === 2) {
    return {
      message: "⚠️ O público viu potencial, mas espera uma evolução real. Uma sequência apressada pode ser muito arriscada.",
      riskLevel: "high",
      bonusMult: 0.95 * fatigueMult,
    };
  } else if (stars === 3) {
    if (sequelCount >= 2) {
      return {
        message: "⚠️ Cuidado com a fadiga de franquia. Já há muitas sequências — uma nova IP pode ser melhor aposta.",
        riskLevel: "medium",
        bonusMult: 1.05 * fatigueMult,
      };
    }
    return {
      message: "💡 Os fãs enxergam potencial, mas esperam evolução real. Uma sequência com melhorias pode funcionar.",
      riskLevel: "medium",
      bonusMult: 1.10 * fatigueMult,
    };
  } else if (stars === 4) {
    if (hasFanDemand) {
      return {
        message: "🎯 Os fãs estão pedindo continuação! Esse título merece uma sequência com ainda mais ambição.",
        riskLevel: "low",
        bonusMult: 1.35 * fatigueMult,
      };
    }
    return {
      message: "✅ Um bom lançamento abre espaço para uma franquia forte. Uma sequência agora pode fortalecer sua marca.",
      riskLevel: "low",
      bonusMult: 1.28 * fatigueMult,
    };
  } else {
    if (hasFanDemand) {
      return {
        message: "🔥 Os fãs estão ansiosos! O sucesso anterior abre caminho para uma franquia lendária.",
        riskLevel: "low",
        bonusMult: 1.55 * fatigueMult,
      };
    }
    return {
      message: "⭐ Esse é um legado raro. Uma sequência com a mesma qualidade pode cimentar seu domínio no mercado.",
      riskLevel: "low",
      bonusMult: 1.48 * fatigueMult,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST-LAUNCH FEEDBACK SYSTEM
// Generates structured, dynamic feedback based on score, bugs, hype, and
// marketing. Purely presentational — does not affect any game state or balance.
// ─────────────────────────────────────────────────────────────────────────────

export type PostLaunchFeedback = {
  strengths: string[];
  weaknesses: string[];
  criticalAlerts: string[];
  suggestions: string[];
};

function _pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generatePostLaunchFeedback(params: {
  score: number;
  bugLevel: BugLevel;
  hypeLevel: number;
  hasMarketing: boolean;
}): PostLaunchFeedback {
  const { score, bugLevel, hypeLevel, hasMarketing } = params;

  const strengths:     string[] = [];
  const weaknesses:    string[] = [];
  const criticalAlerts: string[] = [];
  const suggestions:   string[] = [];

  const isGreat = score >= 80;
  const isMixed = score >= 60 && score < 80;

  const overHyped        = hypeLevel >= 50 && score < hypeLevel * 0.75;
  const goodAlignment    = hypeLevel >= 30 && !overHyped && score >= 65;

  // ── Strengths ──────────────────────────────────────────────────────────────
  if (score >= 80) {
    strengths.push(_pick([
      "Nota alta — o produto impressionou crítica e público.",
      "Excelente pontuação. A qualidade falou por si mesma.",
      "O jogo entregou além das expectativas da crítica.",
    ]));
  }
  if (bugLevel === "none") {
    strengths.push(_pick([
      "Lançamento sem bugs — experiência polida do início ao fim.",
      "Ausência de bugs técnicos elevou a percepção de qualidade.",
      "Produto estável e refinado na data de lançamento.",
    ]));
  }
  if (goodAlignment) {
    strengths.push(_pick([
      "O hype gerado estava alinhado com a qualidade entregue.",
      "Expectativas bem gerenciadas — os fãs não se sentiram enganados.",
      "A campanha de divulgação refletiu fielmente o produto final.",
    ]));
  }
  if (hasMarketing && score >= 70) {
    strengths.push(_pick([
      "O investimento em marketing ampliou o alcance do lançamento.",
      "A visibilidade gerada pelo marketing converteu em boas vendas.",
    ]));
  }

  // ── Weaknesses ─────────────────────────────────────────────────────────────
  if (score < 60) {
    weaknesses.push(_pick([
      "Nota baixa — o jogo não convenceu a maioria dos jogadores.",
      "A recepção crítica ficou abaixo do esperado para esse investimento.",
      "O produto não atingiu o padrão de qualidade esperado pelo mercado.",
    ]));
  }
  if (bugLevel === "medium") {
    weaknesses.push(_pick([
      "Bugs moderados prejudicaram a experiência e afetaram a nota.",
      "Problemas técnicos mancharam um lançamento que poderia ser melhor.",
      "A estabilidade do produto deixou a desejar no lançamento.",
    ]));
  }
  if (bugLevel === "severe") {
    weaknesses.push(_pick([
      "Bugs graves destruíram a credibilidade do lançamento.",
      "Problemas técnicos severos dominaram a conversa nas redes.",
      "O produto estava claramente inacabado ao chegar ao mercado.",
    ]));
  }
  if (overHyped) {
    weaknesses.push(_pick([
      "O hype gerado superou o que o produto final entregou.",
      "As expectativas criadas pela divulgação não foram correspondidas.",
      "A diferença entre hype e entrega real gerou decepção nos fãs.",
    ]));
  }
  if (!hasMarketing && score < 70) {
    weaknesses.push(_pick([
      "Falta de visibilidade limitou o alcance do lançamento.",
      "O jogo não recebeu a divulgação necessária para atingir seu público.",
    ]));
  }

  // ── Critical Alerts ────────────────────────────────────────────────────────
  if (bugLevel === "severe") {
    criticalAlerts.push("🔴 Bugs graves prejudicaram seriamente a recepção — corrija antes da próxima atualização.");
  }
  if (overHyped && score < 55) {
    criticalAlerts.push("🔴 As expectativas superaram a entrega — o público se sentiu enganado. Gerencie melhor o hype.");
  }
  if (!hasMarketing && score < 50) {
    criticalAlerts.push("🟡 Visibilidade insuficiente no lançamento. Invista em marketing no próximo projeto.");
  }

  // ── Suggestions ────────────────────────────────────────────────────────────
  if (isGreat) {
    suggestions.push(_pick([
      "Continue nessa trajetória — uma sequência forte pode cimentar sua reputação.",
      "Aproveite o momento positivo para expandir sua base de fãs.",
      "Considere uma campanha pós-lançamento para manter o momentum.",
    ]));
    if (bugLevel !== "none") {
      suggestions.push("Corrija os bugs restantes para preservar a boa avaliação a longo prazo.");
    }
  } else if (isMixed) {
    if (bugLevel !== "none") {
      suggestions.push(_pick([
        "Priorize a correção de bugs — um patch ainda pode recuperar parte da nota.",
        "Corrija os problemas técnicos antes que afetem as avaliações de longo prazo.",
      ]));
    }
    if (overHyped) {
      suggestions.push("Calibre o hype ao nível real de qualidade antes do próximo lançamento.");
    }
    if (!hasMarketing) {
      suggestions.push("Um investimento moderado em marketing pode fazer diferença na nota inicial.");
    }
    if (suggestions.length === 0) {
      suggestions.push("Identifique os pontos fracos e refine a qualidade no próximo projeto.");
    }
  } else {
    if (bugLevel === "severe" || bugLevel === "medium") {
      suggestions.push("Resolva problemas técnicos antes de lançar — bugs destroem avaliações rapidamente.");
    }
    if (overHyped) {
      suggestions.push("Reduza o hype se a qualidade não acompanhar — promessas não cumpridas custam caro.");
    }
    if (!hasMarketing) {
      suggestions.push("Invista em marketing para melhorar a visibilidade e a nota inicial do próximo jogo.");
    }
    if (suggestions.length === 0) {
      suggestions.push(_pick([
        "Revise o processo de desenvolvimento — qualidade e estabilidade são a base de uma boa recepção.",
        "Dedique mais tempo à fase de QA antes de lançar o próximo projeto.",
      ]));
    }
  }

  return { strengths, weaknesses, criticalAlerts, suggestions };
}
