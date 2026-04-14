// ─────────────────────────────────────────────────────────────────────────────
// Achievement / Milestone System  (~100 achievements)
// ─────────────────────────────────────────────────────────────────────────────

import { DynamicEventStateSnapshot } from "./dynamicEvents";

export type AchievementDifficulty = "easy" | "medium" | "hard" | "legendary";

export type AchievementId =
  // ── Production / Games ──────────────────────────────────────────
  | "first_game" | "first_4star" | "five_star_game" | "five_star_five"
  | "three_five_star_games" | "bug_free_launch" | "five_bug_free"
  | "no_bugs_3_consecutive" | "no_bugs_ten" | "first_sequel"
  | "five_sequels" | "franchise_builder" | "quality_studio"
  | "flawless_studio" | "ten_consecutive_successes" | "seven_consecutive_stars"
  | "ten_games_released" | "fifteen_games_released" | "twenty_games_released"
  | "thirty_games_released"
  // ── Hardware / Consoles ─────────────────────────────────────────
  | "first_console" | "two_consoles" | "five_consoles_total"
  | "ten_consoles_total" | "three_active_consoles" | "premium_console_launch"
  | "console_high_rating" | "console_legendary_rating" | "console_million_sales"
  // ── Finance ─────────────────────────────────────────────────────
  | "million_revenue" | "ten_million_revenue" | "fifty_million_revenue"
  | "hundred_million_revenue" | "half_billion_revenue" | "billion_revenue"
  | "five_billion_revenue" | "ten_billion_revenue"
  | "cash_500k" | "cash_1m" | "cash_10m" | "cash_100m" | "billion_cash"
  | "survive_crisis" | "comeback_kid"
  | "first_stock_sell" | "first_stock_buy"
  | "five_investors" | "ten_investors"
  // ── Reputation & Fans ───────────────────────────────────────────
  | "rep_25" | "rep_50" | "rep_75" | "rep_90" | "rep_max"
  | "fans_10k" | "fans_50k" | "fans_100k" | "fans_500k" | "fans_1m" | "fans_10m"
  // ── Research ────────────────────────────────────────────────────
  | "research_category" | "research_master"
  | "rare_tech" | "exclusive_tech" | "fifty_research_nodes" | "seventy_research_nodes"
  | "max_tech_office"
  // ── Management ──────────────────────────────────────────────────
  | "hired_10" | "hired_25" | "hired_50" | "hired_100" | "hired_200"
  | "first_branch" | "three_branches" | "global_branches" | "ten_branches"
  | "global_expansion" | "ten_countries" | "global_twenty"
  // ── Milestones / Market ─────────────────────────────────────────
  | "market_share_5" | "market_share_10" | "market_share_20"
  | "industry_leader" | "market_share_45" | "market_dominator"
  | "first_award" | "first_trophy" | "trophy_collector" | "trophy_master"
  | "reached_decade" | "legendary_company" | "reach_year_2000" | "reach_year_2020"
  | "all_achievements"
  // ── Special / Rare ──────────────────────────────────────────────
  | "speed_mogul" | "legendary_studio" | "top_game_company" | "great_start"
  | "rare_achievement_20" | "rare_achievement_40"
  // ── Hidden ──────────────────────────────────────────────────────
  | "shadowquebrajogo";

export type Achievement = {
  id: AchievementId;
  unlockedYear?: number;
  unlockedMonth?: number;
};

export type AchievementDef = {
  id:           AchievementId;
  title:        string;
  description:  string;
  icon:         string;
  color:        string;
  category:     "production" | "hardware" | "finance" | "reputation" | "research" | "management" | "milestones" | "special";
  difficulty:   AchievementDifficulty;
  hidden?:      boolean;
  check:        (state: DynamicEventStateSnapshot) => boolean;
};

// ─── Helpers ────────────────────────────────────────────────────────────────
const released = (s: DynamicEventStateSnapshot) =>
  (s.gameProjects ?? []).filter((p) => p.phase === "released");

// Longest run of 4+ star released games (across all releases, not just last N)
function longestStarRun(s: DynamicEventStateSnapshot, minStars: number): number {
  const r = released(s);
  let best = 0, cur = 0;
  for (const p of r) {
    if ((p.starRating ?? 0) >= minStars) { cur++; best = Math.max(best, cur); }
    else cur = 0;
  }
  return best;
}

// Consecutive bug-free releases (last N)
function consecutiveBugFree(s: DynamicEventStateSnapshot): number {
  const r = released(s);
  let cur = 0;
  for (let i = r.length - 1; i >= 0; i--) {
    if ((r[i].bugLevel ?? "none") === "none") cur++;
    else break;
  }
  return cur;
}

export const ACHIEVEMENT_DEFS: AchievementDef[] = [

  // ═══════════════════════════════════════════════════════════════════════════
  // 🎮 PRODUÇÃO / JOGOS
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "first_game", difficulty: "easy",
    title: "Primeiro Jogo",
    description: "Lance seu primeiro jogo.",
    icon: "play-circle", color: "#4DA6FF", category: "production",
    check: (s) => released(s).length >= 1,
  },
  {
    id: "first_4star", difficulty: "easy",
    title: "Boa Impressão",
    description: "Lance um jogo com 4 ou mais estrelas.",
    icon: "star", color: "#4DA6FF", category: "production",
    check: (s) => released(s).some((p) => (p.starRating ?? 0) >= 4),
  },
  {
    id: "five_star_game", difficulty: "medium",
    title: "Obra-Prima",
    description: "Lance um jogo com 5 estrelas.",
    icon: "star", color: "#F5A623", category: "production",
    check: (s) => released(s).some((p) => (p.starRating ?? 0) >= 5),
  },
  {
    id: "five_star_five", difficulty: "hard",
    title: "Cinco de Cinco",
    description: "Lance 5 jogos com 5 estrelas.",
    icon: "star", color: "#F5A623", category: "production",
    check: (s) => released(s).filter((p) => (p.starRating ?? 0) >= 5).length >= 5,
  },
  {
    id: "three_five_star_games", difficulty: "hard",
    title: "Estúdio de Elite",
    description: "Lance 3 jogos com 5 estrelas.",
    icon: "award", color: "#F5A623", category: "production",
    check: (s) => released(s).filter((p) => (p.starRating ?? 0) >= 5).length >= 3,
  },
  {
    id: "bug_free_launch", difficulty: "easy",
    title: "Lançamento Impecável",
    description: "Lance um jogo completamente sem bugs.",
    icon: "check-circle", color: "#10B981", category: "production",
    check: (s) => released(s).some((p) => (p.bugLevel ?? "none") === "none"),
  },
  {
    id: "five_bug_free", difficulty: "medium",
    title: "Zero Defeitos",
    description: "Lance 5 jogos sem bugs.",
    icon: "shield", color: "#10B981", category: "production",
    check: (s) => released(s).filter((p) => (p.bugLevel ?? "none") === "none").length >= 5,
  },
  {
    id: "no_bugs_3_consecutive", difficulty: "hard",
    title: "Controle Total",
    description: "Lance 3 jogos consecutivos sem nenhum bug.",
    icon: "shield", color: "#10B981", category: "production",
    check: (s) => consecutiveBugFree(s) >= 3,
  },
  {
    id: "no_bugs_ten", difficulty: "hard",
    title: "Qualidade Absoluta",
    description: "Lance 10 jogos sem bugs no total.",
    icon: "shield", color: "#10B981", category: "production",
    check: (s) => released(s).filter((p) => (p.bugLevel ?? "none") === "none").length >= 10,
  },
  {
    id: "first_sequel", difficulty: "easy",
    title: "Continuação",
    description: "Lance a sequência de um jogo.",
    icon: "git-branch", color: "#A855F7", category: "production",
    check: (s) => released(s).some((p) => !!p.sequelOf),
  },
  {
    id: "five_sequels", difficulty: "medium",
    title: "Rei das Franquias",
    description: "Lance 5 sequências de jogos.",
    icon: "git-branch", color: "#A855F7", category: "production",
    check: (s) => released(s).filter((p) => !!p.sequelOf).length >= 5,
  },
  {
    id: "franchise_builder", difficulty: "medium",
    title: "Construtor de Franquias",
    description: "Construa uma franquia com 3 ou mais jogos.",
    icon: "layers", color: "#A855F7", category: "production",
    check: (s) => {
      const counts: Record<string, number> = {};
      for (const p of released(s)) {
        const root = p.sequelOf ?? p.id;
        counts[root] = (counts[root] ?? 1);
      }
      for (const p of released(s)) {
        if (p.sequelOf) counts[p.sequelOf] = (counts[p.sequelOf] ?? 0) + 1;
      }
      return Object.values(counts).some((v) => v >= 3);
    },
  },
  {
    id: "quality_studio", difficulty: "hard",
    title: "Estúdio de Qualidade",
    description: "Lance 10 jogos com 4 ou mais estrelas.",
    icon: "award", color: "#F5A623", category: "production",
    check: (s) => released(s).filter((p) => (p.starRating ?? 0) >= 4).length >= 10,
  },
  {
    id: "flawless_studio", difficulty: "legendary",
    title: "Estúdio Sem Igual",
    description: "Lance 15 ou mais jogos e todos com 4+ estrelas.",
    icon: "award", color: "#C9943A", category: "production",
    check: (s) => {
      const r = released(s);
      return r.length >= 15 && r.every((p) => (p.starRating ?? 0) >= 4);
    },
  },
  {
    id: "ten_consecutive_successes", difficulty: "legendary",
    title: "Incrível Sequência",
    description: "Lance 10 jogos com 4+ estrelas consecutivamente.",
    icon: "trending-up", color: "#C9943A", category: "production",
    check: (s) => longestStarRun(s, 4) >= 10,
  },
  {
    id: "seven_consecutive_stars", difficulty: "legendary",
    title: "Imparável",
    description: "Lance 7 jogos com 5 estrelas consecutivamente.",
    icon: "zap", color: "#C9943A", category: "production",
    check: (s) => longestStarRun(s, 5) >= 7,
  },
  {
    id: "ten_games_released", difficulty: "medium",
    title: "Veterano do Setor",
    description: "Publique 10 jogos ao total.",
    icon: "package", color: "#4DA6FF", category: "production",
    check: (s) => released(s).length >= 10,
  },
  {
    id: "fifteen_games_released", difficulty: "medium",
    title: "Dev Experiente",
    description: "Publique 15 jogos ao total.",
    icon: "package", color: "#4DA6FF", category: "production",
    check: (s) => released(s).length >= 15,
  },
  {
    id: "twenty_games_released", difficulty: "hard",
    title: "Fábrica de Hits",
    description: "Publique 20 jogos ao total.",
    icon: "package", color: "#A855F7", category: "production",
    check: (s) => released(s).length >= 20,
  },
  {
    id: "thirty_games_released", difficulty: "hard",
    title: "Estúdio Prolífico",
    description: "Publique 30 jogos ao total.",
    icon: "package", color: "#C9943A", category: "production",
    check: (s) => released(s).length >= 30,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🖥️ HARDWARE / CONSOLES
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "first_console", difficulty: "easy",
    title: "Primeiro Console",
    description: "Lance seu primeiro console no mercado.",
    icon: "monitor", color: "#A855F7", category: "hardware",
    check: (s) => s.consoles.length > 0,
  },
  {
    id: "two_consoles", difficulty: "easy",
    title: "Portfólio de Hardware",
    description: "Construa 2 consoles no total.",
    icon: "monitor", color: "#A855F7", category: "hardware",
    check: (s) => s.consoles.length >= 2,
  },
  {
    id: "five_consoles_total", difficulty: "medium",
    title: "Fabricante Experiente",
    description: "Construa 5 consoles no total.",
    icon: "monitor", color: "#A855F7", category: "hardware",
    check: (s) => s.consoles.length >= 5,
  },
  {
    id: "ten_consoles_total", difficulty: "hard",
    title: "Veterano do Hardware",
    description: "Construa 10 consoles no total.",
    icon: "monitor", color: "#F5A623", category: "hardware",
    check: (s) => s.consoles.length >= 10,
  },
  {
    id: "three_active_consoles", difficulty: "medium",
    title: "Ecossistema Completo",
    description: "Tenha 3 consoles ativos simultaneamente.",
    icon: "monitor", color: "#A855F7", category: "hardware",
    check: (s) => s.consoles.filter((c) => !c.isDiscontinued).length >= 3,
  },
  {
    id: "premium_console_launch", difficulty: "medium",
    title: "Alto Desempenho",
    description: "Lance um console de alto desempenho com tecnologia avançada.",
    icon: "cpu", color: "#A855F7", category: "hardware",
    check: (s) => (s.offices.tech ?? 0) >= 20 && s.consoles.some((c) => !c.isDiscontinued),
  },
  {
    id: "console_high_rating", difficulty: "medium",
    title: "Hardware Reconhecido",
    description: "Produza um console com avaliação 8.0 ou superior.",
    icon: "award", color: "#F5A623", category: "hardware",
    check: (s) => s.consoles.some((c) => (c.rating ?? 0) >= 8),
  },
  {
    id: "console_legendary_rating", difficulty: "hard",
    title: "Engenharia de Elite",
    description: "Produza um console com avaliação 9.5 ou superior.",
    icon: "award", color: "#C9943A", category: "hardware",
    check: (s) => s.consoles.some((c) => (c.rating ?? 0) >= 9.5),
  },
  {
    id: "console_million_sales", difficulty: "hard",
    title: "Console do Ano",
    description: "Venda 1 milhão de unidades de um único console.",
    icon: "trending-up", color: "#F5A623", category: "hardware",
    check: (s) => s.consoles.some((c) => (c.unitsSold ?? 0) >= 1_000_000),
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 💰 FINANCEIRO
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "million_revenue", difficulty: "easy",
    title: "Primeiro Milhão",
    description: "Alcance $1 milhão em receita total.",
    icon: "dollar-sign", color: "#10B981", category: "finance",
    check: (s) => s.totalRevenue >= 1_000_000,
  },
  {
    id: "ten_million_revenue", difficulty: "medium",
    title: "Dez Milhões",
    description: "Alcance $10 milhões em receita total.",
    icon: "trending-up", color: "#10B981", category: "finance",
    check: (s) => s.totalRevenue >= 10_000_000,
  },
  {
    id: "fifty_million_revenue", difficulty: "medium",
    title: "Cinquenta Milhões",
    description: "Alcance $50 milhões em receita total.",
    icon: "trending-up", color: "#10B981", category: "finance",
    check: (s) => s.totalRevenue >= 50_000_000,
  },
  {
    id: "hundred_million_revenue", difficulty: "medium",
    title: "Cem Milhões",
    description: "Alcance $100 milhões em receita total.",
    icon: "bar-chart-2", color: "#F5A623", category: "finance",
    check: (s) => s.totalRevenue >= 100_000_000,
  },
  {
    id: "half_billion_revenue", difficulty: "hard",
    title: "Meio Bilhão",
    description: "Alcance $500 milhões em receita total.",
    icon: "bar-chart-2", color: "#F5A623", category: "finance",
    check: (s) => s.totalRevenue >= 500_000_000,
  },
  {
    id: "billion_revenue", difficulty: "hard",
    title: "O Bilhão",
    description: "Alcance $1 bilhão em receita total.",
    icon: "zap", color: "#F5A623", category: "finance",
    check: (s) => s.totalRevenue >= 1_000_000_000,
  },
  {
    id: "five_billion_revenue", difficulty: "legendary",
    title: "Cinco Bilhões",
    description: "Alcance $5 bilhões em receita total.",
    icon: "zap", color: "#C9943A", category: "finance",
    check: (s) => s.totalRevenue >= 5_000_000_000,
  },
  {
    id: "ten_billion_revenue", difficulty: "legendary",
    title: "Império Financeiro",
    description: "Alcance $10 bilhões em receita total.",
    icon: "bar-chart-2", color: "#C9943A", category: "finance",
    check: (s) => s.totalRevenue >= 10_000_000_000,
  },
  {
    id: "cash_500k", difficulty: "easy",
    title: "Reserva Inicial",
    description: "Tenha $500 mil em caixa simultaneamente.",
    icon: "dollar-sign", color: "#10B981", category: "finance",
    check: (s) => s.money >= 500_000,
  },
  {
    id: "cash_1m", difficulty: "easy",
    title: "Caixa Sólido",
    description: "Tenha $1 milhão em caixa simultaneamente.",
    icon: "dollar-sign", color: "#10B981", category: "finance",
    check: (s) => s.money >= 1_000_000,
  },
  {
    id: "cash_10m", difficulty: "medium",
    title: "Tesouraria Forte",
    description: "Tenha $10 milhões em caixa simultaneamente.",
    icon: "dollar-sign", color: "#F5A623", category: "finance",
    check: (s) => s.money >= 10_000_000,
  },
  {
    id: "cash_100m", difficulty: "hard",
    title: "Reserva Corporativa",
    description: "Tenha $100 milhões em caixa simultaneamente.",
    icon: "dollar-sign", color: "#F5A623", category: "finance",
    check: (s) => s.money >= 100_000_000,
  },
  {
    id: "billion_cash", difficulty: "legendary",
    title: "Bilhão em Caixa",
    description: "Tenha $1 bilhão em caixa simultaneamente.",
    icon: "dollar-sign", color: "#C9943A", category: "finance",
    check: (s) => s.money >= 1_000_000_000,
  },
  {
    id: "survive_crisis", difficulty: "medium",
    title: "Sobrevivente",
    description: "Recupere-se de saldo negativo sem falência.",
    icon: "shield", color: "#FF4D6A", category: "finance",
    check: (s) => s.totalRevenue > 500_000 && s.money > 0,
  },
  {
    id: "comeback_kid", difficulty: "medium",
    title: "A Grande Virada",
    description: "Recupere-se de quase falência ($0 capital) para $500K+.",
    icon: "refresh-cw", color: "#FF4D6A", category: "finance",
    check: (s) => s.money >= 500_000 && s.totalRevenue > 1_000_000,
  },
  {
    id: "first_stock_sell", difficulty: "medium",
    title: "Abertura de Capital",
    description: "Venda ações da empresa pela primeira vez.",
    icon: "trending-down", color: "#F5A623", category: "finance",
    check: (s) => (s.totalShares ?? 10000) < 10000 || (s.investors ?? []).length > 0,
  },
  {
    id: "first_stock_buy", difficulty: "hard",
    title: "Recompra Estratégica",
    description: "Recompre ações da empresa do mercado.",
    icon: "trending-up", color: "#10B981", category: "finance",
    check: (s) => (s.playerShares ?? 0) === (s.totalShares ?? 10000) && (s.totalRevenue ?? 0) > 1_000_000,
  },
  {
    id: "five_investors", difficulty: "medium",
    title: "Confiança do Mercado",
    description: "Atraia 5 investidores para a empresa.",
    icon: "users", color: "#4DA6FF", category: "finance",
    check: (s) => (s.investors ?? []).length >= 5,
  },
  {
    id: "ten_investors", difficulty: "hard",
    title: "Empresa Pública",
    description: "Atraia 10 investidores para a empresa.",
    icon: "users", color: "#F5A623", category: "finance",
    check: (s) => (s.investors ?? []).length >= 10,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ⭐ REPUTAÇÃO & FÃS
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "rep_25", difficulty: "easy",
    title: "Reconhecimento",
    description: "Alcance 25% de reputação.",
    icon: "thumbs-up", color: "#4DA6FF", category: "reputation",
    check: (s) => s.reputation >= 25,
  },
  {
    id: "rep_50", difficulty: "easy",
    title: "Empresa Respeitada",
    description: "Alcance 50% de reputação.",
    icon: "thumbs-up", color: "#4DA6FF", category: "reputation",
    check: (s) => s.reputation >= 50,
  },
  {
    id: "rep_75", difficulty: "hard",
    title: "Ícone da Indústria",
    description: "Alcance 75% de reputação.",
    icon: "star", color: "#F5A623", category: "reputation",
    check: (s) => s.reputation >= 75,
  },
  {
    id: "rep_90", difficulty: "hard",
    title: "Empresa Icônica",
    description: "Alcance 90% de reputação.",
    icon: "star", color: "#F5A623", category: "reputation",
    check: (s) => s.reputation >= 90,
  },
  {
    id: "rep_max", difficulty: "legendary",
    title: "Lendário",
    description: "Alcance 100% de reputação.",
    icon: "zap", color: "#C9943A", category: "reputation",
    check: (s) => s.reputation >= 100,
  },
  {
    id: "fans_10k", difficulty: "easy",
    title: "10 Mil Fãs",
    description: "Conquiste 10.000 fãs.",
    icon: "users", color: "#4DA6FF", category: "reputation",
    check: (s) => (s.fans ?? 0) >= 10_000,
  },
  {
    id: "fans_50k", difficulty: "easy",
    title: "Comunidade Ativa",
    description: "Conquiste 50.000 fãs.",
    icon: "users", color: "#4DA6FF", category: "reputation",
    check: (s) => (s.fans ?? 0) >= 50_000,
  },
  {
    id: "fans_100k", difficulty: "easy",
    title: "100 Mil Fãs",
    description: "Conquiste 100.000 fãs.",
    icon: "users", color: "#4DA6FF", category: "reputation",
    check: (s) => (s.fans ?? 0) >= 100_000,
  },
  {
    id: "fans_500k", difficulty: "medium",
    title: "Comunidade Fiel",
    description: "Conquiste 500.000 fãs.",
    icon: "heart", color: "#FF4D6A", category: "reputation",
    check: (s) => (s.fans ?? 0) >= 500_000,
  },
  {
    id: "fans_1m", difficulty: "medium",
    title: "1 Milhão de Fãs",
    description: "Alcance 1 milhão de fãs.",
    icon: "heart", color: "#FF4D6A", category: "reputation",
    check: (s) => (s.fans ?? 0) >= 1_000_000,
  },
  {
    id: "fans_10m", difficulty: "hard",
    title: "Fenômeno Global",
    description: "Alcance 10 milhões de fãs.",
    icon: "heart", color: "#FF4D6A", category: "reputation",
    check: (s) => (s.fans ?? 0) >= 10_000_000,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔬 PESQUISA
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "research_category", difficulty: "medium",
    title: "Especialista",
    description: "Complete 15 pesquisas em qualquer categoria.",
    icon: "layers", color: "#A855F7", category: "research",
    check: (s) => (s.researchedNodes ?? []).length >= 15,
  },
  {
    id: "research_master", difficulty: "hard",
    title: "Mestre em Pesquisa",
    description: "Complete 30 ou mais pesquisas.",
    icon: "cpu", color: "#A855F7", category: "research",
    check: (s) => (s.researchedNodes ?? []).length >= 30,
  },
  {
    id: "rare_tech", difficulty: "medium",
    title: "Tecnologia Rara",
    description: "Desbloqueie 20 nós na árvore de pesquisa.",
    icon: "cpu", color: "#A855F7", category: "research",
    check: (s) => (s.researchedNodes ?? []).length >= 20,
  },
  {
    id: "exclusive_tech", difficulty: "hard",
    title: "Inovação Exclusiva",
    description: "Desbloqueie 40 tecnologias na árvore de pesquisa.",
    icon: "unlock", color: "#F5A623", category: "research",
    check: (s) => (s.researchedNodes ?? []).length >= 40,
  },
  {
    id: "fifty_research_nodes", difficulty: "hard",
    title: "Pesquisador Avançado",
    description: "Desbloqueie 50 tecnologias.",
    icon: "cpu", color: "#F5A623", category: "research",
    check: (s) => (s.researchedNodes ?? []).length >= 50,
  },
  {
    id: "seventy_research_nodes", difficulty: "legendary",
    title: "Tecnologia de Ponta",
    description: "Desbloqueie 70 tecnologias.",
    icon: "zap", color: "#C9943A", category: "research",
    check: (s) => (s.researchedNodes ?? []).length >= 70,
  },
  {
    id: "max_tech_office", difficulty: "hard",
    title: "Laboratório do Futuro",
    description: "Maximize o setor de Tecnologia do escritório (35+).",
    icon: "zap", color: "#A855F7", category: "research",
    check: (s) => (s.offices.tech ?? 0) >= 35,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🏢 GESTÃO
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "hired_10", difficulty: "easy",
    title: "Grande Equipe",
    description: "Tenha 10 ou mais funcionários simultaneamente.",
    icon: "users", color: "#4DA6FF", category: "management",
    check: (s) => (s.employees ?? []).length >= 10,
  },
  {
    id: "hired_25", difficulty: "easy",
    title: "Equipe Crescendo",
    description: "Tenha 25 ou mais funcionários simultaneamente.",
    icon: "users", color: "#4DA6FF", category: "management",
    check: (s) => (s.employees ?? []).length >= 25,
  },
  {
    id: "hired_50", difficulty: "medium",
    title: "Corporação",
    description: "Tenha 50 ou mais funcionários simultaneamente.",
    icon: "users", color: "#F5A623", category: "management",
    check: (s) => (s.employees ?? []).length >= 50,
  },
  {
    id: "hired_100", difficulty: "hard",
    title: "Grande Corporação",
    description: "Tenha 100 ou mais funcionários simultaneamente.",
    icon: "users", color: "#F5A623", category: "management",
    check: (s) => (s.employees ?? []).length >= 100,
  },
  {
    id: "hired_200", difficulty: "legendary",
    title: "Mega Corporação",
    description: "Tenha 200 ou mais funcionários simultaneamente.",
    icon: "users", color: "#C9943A", category: "management",
    check: (s) => (s.employees ?? []).length >= 200,
  },
  {
    id: "first_branch", difficulty: "easy",
    title: "Primeira Filial",
    description: "Abra uma filial em outro país.",
    icon: "map-pin", color: "#4DA6FF", category: "management",
    check: (s) => (s.branches ?? []).length >= 1,
  },
  {
    id: "three_branches", difficulty: "medium",
    title: "Rede Internacional",
    description: "Tenha filiais ativas em 3 países diferentes.",
    icon: "map", color: "#4DA6FF", category: "management",
    check: (s) => (s.branches ?? []).length >= 3,
  },
  {
    id: "global_branches", difficulty: "hard",
    title: "Corporação Global",
    description: "Tenha filiais ativas em 6 países diferentes.",
    icon: "globe", color: "#F5A623", category: "management",
    check: (s) => (s.branches ?? []).length >= 6,
  },
  {
    id: "ten_branches", difficulty: "hard",
    title: "Rede Mundial",
    description: "Tenha filiais ativas em 10 países diferentes.",
    icon: "globe", color: "#C9943A", category: "management",
    check: (s) => (s.branches ?? []).length >= 10,
  },
  {
    id: "global_expansion", difficulty: "medium",
    title: "Expansão Global",
    description: "Desbloqueie 5 ou mais países.",
    icon: "globe", color: "#4DA6FF", category: "management",
    check: (s) => (s.unlockedCountries ?? []).length >= 5,
  },
  {
    id: "ten_countries", difficulty: "hard",
    title: "Presença Global",
    description: "Desbloqueie 10 ou mais países.",
    icon: "globe", color: "#F5A623", category: "management",
    check: (s) => (s.unlockedCountries ?? []).length >= 10,
  },
  {
    id: "global_twenty", difficulty: "legendary",
    title: "Alcance Universal",
    description: "Desbloqueie 20 ou mais países.",
    icon: "globe", color: "#C9943A", category: "management",
    check: (s) => (s.unlockedCountries ?? []).length >= 20,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🏁 MARCOS & MERCADO
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "market_share_5", difficulty: "easy",
    title: "Entrando no Jogo",
    description: "Alcance 5% de participação de mercado.",
    icon: "bar-chart-2", color: "#4DA6FF", category: "milestones",
    check: (s) => s.marketShare >= 5,
  },
  {
    id: "market_share_10", difficulty: "easy",
    title: "Presença no Mercado",
    description: "Alcance 10% de participação de mercado.",
    icon: "bar-chart-2", color: "#4DA6FF", category: "milestones",
    check: (s) => s.marketShare >= 10,
  },
  {
    id: "market_share_20", difficulty: "medium",
    title: "Jogador Relevante",
    description: "Alcance 20% de participação de mercado.",
    icon: "bar-chart-2", color: "#4DA6FF", category: "milestones",
    check: (s) => s.marketShare >= 20,
  },
  {
    id: "industry_leader", difficulty: "hard",
    title: "Líder da Indústria",
    description: "Atinja mais de 35% de participação de mercado.",
    icon: "bar-chart-2", color: "#F5A623", category: "milestones",
    check: (s) => s.marketShare >= 35,
  },
  {
    id: "market_share_45", difficulty: "legendary",
    title: "Quase Monopólio",
    description: "Alcance 45% de participação de mercado.",
    icon: "bar-chart-2", color: "#C9943A", category: "milestones",
    check: (s) => s.marketShare >= 45,
  },
  {
    id: "market_dominator", difficulty: "legendary",
    title: "Dominador do Mercado",
    description: "Atinja mais de 60% de participação de mercado.",
    icon: "bar-chart-2", color: "#C9943A", category: "milestones",
    check: (s) => s.marketShare >= 60,
  },
  {
    id: "first_award", difficulty: "easy",
    title: "Primeiro Prêmio",
    description: "Ganhe seu primeiro prêmio.",
    icon: "award", color: "#F5A623", category: "milestones",
    check: (s) => (s.trophies ?? []).length > 0,
  },
  {
    id: "first_trophy", difficulty: "easy",
    title: "Sala de Troféus",
    description: "Ganhe 3 prêmios diferentes.",
    icon: "award", color: "#F5A623", category: "milestones",
    check: (s) => (s.trophies ?? []).length >= 3,
  },
  {
    id: "trophy_collector", difficulty: "medium",
    title: "Colecionador de Troféus",
    description: "Acumule 10 prêmios.",
    icon: "award", color: "#F5A623", category: "milestones",
    check: (s) => (s.trophies ?? []).length >= 10,
  },
  {
    id: "trophy_master", difficulty: "hard",
    title: "Mestre dos Troféus",
    description: "Acumule 20 prêmios.",
    icon: "award", color: "#F5A623", category: "milestones",
    check: (s) => (s.trophies ?? []).length >= 20,
  },
  {
    id: "reached_decade", difficulty: "easy",
    title: "Uma Década",
    description: "Sobreviva 10 anos no mercado.",
    icon: "clock", color: "#4DA6FF", category: "milestones",
    check: (s) => s.year >= 1982 && s.money > 0,
  },
  {
    id: "reach_year_2000", difficulty: "medium",
    title: "Virada do Milênio",
    description: "Chegue ao ano 2000 ainda operando.",
    icon: "clock", color: "#4DA6FF", category: "milestones",
    check: (s) => s.year >= 2000 && s.money > 0,
  },
  {
    id: "reach_year_2020", difficulty: "hard",
    title: "Era Digital",
    description: "Chegue ao ano 2020 ainda operando.",
    icon: "clock", color: "#F5A623", category: "milestones",
    check: (s) => s.year >= 2020 && s.money > 0,
  },
  {
    id: "legendary_company", difficulty: "hard",
    title: "Empresa Lendária",
    description: "Chegue ao ano 2010 ainda operando com sucesso.",
    icon: "flag", color: "#F5A623", category: "milestones",
    check: (s) => s.year >= 2010 && s.money > 0,
  },
  {
    id: "all_achievements", difficulty: "legendary",
    title: "Platina Total",
    description: "Desbloqueie pelo menos 50 conquistas.",
    icon: "star", color: "#C9943A", category: "milestones",
    check: (s) => (s.unlockedAchievements ?? []).length >= 50,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ✨ ESPECIAL / RARO
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "great_start", difficulty: "medium",
    title: "Grande Início",
    description: "Alcance reputação 50%, 50K fãs e $500K em caixa antes de 1985.",
    icon: "sunrise", color: "#FF4D6A", category: "special",
    check: (s) => s.year < 1985 && s.reputation >= 50 && (s.fans ?? 0) >= 50_000 && s.money >= 500_000,
  },
  {
    id: "speed_mogul", difficulty: "hard",
    title: "Magnata Veloz",
    description: "Alcance $100 milhões em receita total antes de 1990.",
    icon: "zap", color: "#FF4D6A", category: "special",
    check: (s) => s.year < 1990 && s.totalRevenue >= 100_000_000,
  },
  {
    id: "top_game_company", difficulty: "hard",
    title: "Melhor do Setor",
    description: "Alcance reputação 90%+ e 30%+ de participação de mercado simultaneamente.",
    icon: "trophy", color: "#F5A623", category: "special",
    check: (s) => s.reputation >= 90 && s.marketShare >= 30,
  },
  {
    id: "legendary_studio", difficulty: "legendary",
    title: "Estúdio Lendário",
    description: "Lance um jogo 5★, alcance 1M de fãs, 35% de mercado e $1B de receita.",
    icon: "award", color: "#C9943A", category: "special",
    check: (s) =>
      released(s).some((p) => (p.starRating ?? 0) >= 5) &&
      (s.fans ?? 0) >= 1_000_000 &&
      s.marketShare >= 35 &&
      s.totalRevenue >= 1_000_000_000,
  },
  {
    id: "rare_achievement_20", difficulty: "medium",
    title: "Colecionador",
    description: "Desbloqueie 20 conquistas.",
    icon: "grid", color: "#A855F7", category: "special",
    check: (s) => (s.unlockedAchievements ?? []).length >= 20,
  },
  {
    id: "rare_achievement_40", difficulty: "hard",
    title: "Dedicado",
    description: "Desbloqueie 40 conquistas.",
    icon: "grid", color: "#F5A623", category: "special",
    check: (s) => (s.unlockedAchievements ?? []).length >= 40,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 🔒 OCULTO / EASTER EGG
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "shadowquebrajogo", difficulty: "legendary",
    title: "shadowquebrajogo",
    description:
      "Homenagem ao primeiro tester real do jogo, que ajudou a encontrar falhas importantes e contribuiu para a evolução do projeto.",
    icon: "heart",
    color: "#C9943A",
    category: "special",
    hidden: true,
    check: (s) =>
      s.year >= 1997 &&
      s.totalRevenue >= 10_000_000 &&
      (s.fans ?? 0) >= 50_000 &&
      (s.trophies ?? []).length >= 1,
  },
];

export function checkNewAchievements(
  state: DynamicEventStateSnapshot,
  unlockedIds: string[],
): AchievementDef[] {
  return ACHIEVEMENT_DEFS.filter(
    (def) => !unlockedIds.includes(def.id) && def.check(state)
  );
}
