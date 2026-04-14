import type { GameProject, GameConsole, Competitor, NewsItem, NewsCategory } from "./gameEngine";
import { getMarketSizeMultiplier } from "./historicalProgression";

export type RankedEntry = {
  name: string;
  value: number;
  score: number;
  isPlayer: boolean;
  ownerName: string;
};

export type AnnualRankingNews = NewsItem[];

function estimateRivalGameRevenue(c: Competitor): number {
  const monthlyRev = c.monthlyRevenue ?? ((c.totalRevenue ?? 0) / Math.max(1, (c.gamesLaunched ?? 1) * 18));
  return Math.round(monthlyRev * 12 * 0.45);
}

function estimateRivalGameRating(c: Competitor): number {
  const inn = c.innovation ?? 50;
  const rep = c.reputation ?? 50;
  return Math.min(100, Math.round(inn * 0.8 + rep * 0.15 + (Math.random() - 0.5) * 10));
}

function estimateRivalConsoleSales(c: Competitor, year: number): number {
  const eraMult = getMarketSizeMultiplier(year);
  const totalMarketUnits = Math.max(10_000, Math.round(eraMult * 2_000_000));
  return Math.round(totalMarketUnits * ((c.marketShare ?? 5) / 100) * (1 + (c.innovation ?? 50) / 300));
}

function estimateRivalConsoleScore(c: Competitor): number {
  const inn = c.innovation ?? 50;
  const rep = c.reputation ?? 50;
  const share = c.marketShare ?? 5;
  return Math.min(100, Math.round(inn * 0.5 + rep * 0.25 + share * 0.25 + (Math.random() - 0.5) * 8));
}

export function computeAnnualRankings(
  playerGames: GameProject[],
  playerConsoles: GameConsole[],
  competitors: Competitor[],
  year: number,
  companyName: string
): {
  gamesBySales: RankedEntry[];
  gamesByRating: RankedEntry[];
  consolesBySales: RankedEntry[];
  consolesByScore: RankedEntry[];
} {
  const aliveRivals = competitors.filter(c => c.alive !== false);
  const tag = companyName || "Player";

  const releasedGames = playerGames.filter(
    p => p.phase === "released" && (year - (p.launchYear ?? year)) <= 1
  );

  const playerGameEntries: RankedEntry[] = releasedGames.map(g => ({
    name: g.name,
    value: Math.round((g.monthlyRevenue ?? 0) * 12),
    score: g.receptionScore ?? 0,
    isPlayer: true,
    ownerName: tag,
  }));

  const rivalGameEntries: RankedEntry[] = aliveRivals
    .filter(c => c.recentLaunch)
    .map(c => ({
      name: c.recentLaunch!,
      value: estimateRivalGameRevenue(c),
      score: estimateRivalGameRating(c),
      isPlayer: false,
      ownerName: c.name,
    }));

  const allGames = [...playerGameEntries, ...rivalGameEntries];

  const gamesBySales = [...allGames]
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const gamesByRating = [...allGames]
    .sort((a, b) => b.score - a.score || b.value - a.value)
    .slice(0, 5);

  const activeConsoles = playerConsoles.filter(c => !c.isDiscontinued);

  const playerConsoleEntries: RankedEntry[] = activeConsoles.map(c => ({
    name: c.name,
    value: c.unitsSold ?? 0,
    score: Math.min(100, Math.round(
      ((c.quality ?? 5) / 10) * 40 +
      Math.min(40, (c.unitsSold ?? 0) / Math.max(1, getMarketSizeMultiplier(year) * 50_000)) +
      ((c.rating ?? 5) / 10) * 20
    )),
    isPlayer: true,
    ownerName: tag,
  }));

  const rivalConsoleEntries: RankedEntry[] = aliveRivals
    .filter(c => c.lastConsole)
    .map(c => ({
      name: c.lastConsole!,
      value: estimateRivalConsoleSales(c, year),
      score: estimateRivalConsoleScore(c),
      isPlayer: false,
      ownerName: c.name,
    }));

  const allConsoles = [...playerConsoleEntries, ...rivalConsoleEntries];

  const consolesBySales = [...allConsoles]
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const consolesByScore = [...allConsoles]
    .sort((a, b) => b.score - a.score || b.value - a.value)
    .slice(0, 5);

  return { gamesBySales, gamesByRating, consolesBySales, consolesByScore };
}

export function generateRankingAndFlopNews(
  playerGames: GameProject[],
  playerConsoles: GameConsole[],
  competitors: Competitor[],
  year: number,
  companyName: string
): NewsItem[] {
  const rankings = computeAnnualRankings(playerGames, playerConsoles, competitors, year, companyName);
  const news: NewsItem[] = [];
  const tag = companyName || "A sua empresa";
  const MAX_NEWS = 3;

  const fmtMoney = (v: number) => {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
    return `$${v}`;
  };

  const formatRanking = (list: RankedEntry[], label: string) =>
    list.map((e, i) => `${i + 1}. ${e.name} (${e.ownerName}) — ${label === "rating" ? `${e.score}/100` : fmtMoney(e.value)}`).join("\n");

  const playerInGameSalesTop = rankings.gamesBySales.findIndex(e => e.isPlayer);
  if (playerInGameSalesTop >= 0 && playerInGameSalesTop < 3 && news.length < MAX_NEWS) {
    const entry = rankings.gamesBySales[playerInGameSalesTop];
    news.push({
      id: `rank_game_sales_${year}`,
      year,
      month: 12,
      category: "award" as NewsCategory,
      title: playerInGameSalesTop === 0
        ? `📊 ${entry.name} é o jogo mais vendido de ${year}!`
        : `📊 ${entry.name} no Top ${playerInGameSalesTop + 1} de vendas de ${year}`,
      body: `O teu jogo "${entry.name}" alcançou a posição #${playerInGameSalesTop + 1} no ranking de vendas anuais com receita de ${fmtMoney(entry.value)}.\n\n🏆 Top 5 Jogos Mais Vendidos de ${year}:\n${formatRanking(rankings.gamesBySales, "sales")}`,
      moneyDelta: 0,
      fansDelta: playerInGameSalesTop === 0 ? 500 : 200,
      reputationDelta: playerInGameSalesTop === 0 ? 3 : 1,
      isRead: false,
    });
  }

  const playerInGameRatingTop = rankings.gamesByRating.findIndex(e => e.isPlayer);
  if (playerInGameRatingTop >= 0 && playerInGameRatingTop < 3 && news.length < MAX_NEWS) {
    const entry = rankings.gamesByRating[playerInGameRatingTop];
    news.push({
      id: `rank_game_rating_${year}`,
      year,
      month: 12,
      category: "award" as NewsCategory,
      title: playerInGameRatingTop === 0
        ? `⭐ ${entry.name} é o jogo mais aclamado de ${year}!`
        : `⭐ ${entry.name} no Top ${playerInGameRatingTop + 1} em avaliações de ${year}`,
      body: `"${entry.name}" foi reconhecido pela crítica com nota ${entry.score}/100.\n\n⭐ Top 5 Jogos Melhor Avaliados de ${year}:\n${formatRanking(rankings.gamesByRating, "rating")}`,
      moneyDelta: 0,
      fansDelta: playerInGameRatingTop === 0 ? 400 : 150,
      reputationDelta: playerInGameRatingTop === 0 ? 2 : 1,
      isRead: false,
    });
  }

  const playerInConsoleSalesTop = rankings.consolesBySales.findIndex(e => e.isPlayer);
  if (playerInConsoleSalesTop >= 0 && playerInConsoleSalesTop < 3 && news.length < MAX_NEWS) {
    const entry = rankings.consolesBySales[playerInConsoleSalesTop];
    news.push({
      id: `rank_console_sales_${year}`,
      year,
      month: 12,
      category: "award" as NewsCategory,
      title: playerInConsoleSalesTop === 0
        ? `🎮 ${entry.name} lidera as vendas de consoles em ${year}!`
        : `🎮 ${entry.name} no Top ${playerInConsoleSalesTop + 1} de vendas de consoles`,
      body: `O teu console "${entry.name}" vendeu ${entry.value.toLocaleString()} unidades este ano.\n\n🎮 Top 5 Consoles Mais Vendidos de ${year}:\n${rankings.consolesBySales.map((e, i) => `${i + 1}. ${e.name} (${e.ownerName}) — ${e.value.toLocaleString()} un.`).join("\n")}`,
      moneyDelta: 0,
      fansDelta: playerInConsoleSalesTop === 0 ? 600 : 250,
      reputationDelta: playerInConsoleSalesTop === 0 ? 3 : 1,
      isRead: false,
    });
  }

  const releasedGames = playerGames.filter(
    p => p.phase === "released" && (p.launchYear ?? 0) === year
  );
  for (const g of releasedGames) {
    if (news.length >= MAX_NEWS) break;
    const score = g.receptionScore ?? 50;
    const isBuggy = g.bugLevel === "severe";
    const isLowScore = score <= 50;
    const isLowRevenue = (g.totalRevenue ?? 0) < 100_000 && (year - (g.launchYear ?? year)) >= 0;

    if (isLowScore || isBuggy) {
      const reasons: string[] = [];
      if (isLowScore) reasons.push(`nota baixa (${score}/100)`);
      if (isBuggy) reasons.push("bugs graves no lançamento");
      if (isLowRevenue) reasons.push("vendas muito abaixo do esperado");

      news.push({
        id: `flop_game_${year}_${g.id}`,
        year,
        month: 12,
        category: "crisis" as NewsCategory,
        title: `💥 "${g.name}" foi um fracasso comercial`,
        body: `O jogo "${g.name}" de ${tag} não atingiu as expetativas: ${reasons.join(", ")}. A crítica e o público ficaram desapontados.`,
        moneyDelta: 0,
        fansDelta: -300,
        reputationDelta: -3,
        isRead: false,
      });
    }
  }

  for (const c of playerConsoles) {
    if (news.length >= MAX_NEWS) break;
    if (c.isDiscontinued) continue;
    const eraMult = getMarketSizeMultiplier(year);
    const expectedMinSales = Math.round(eraMult * 15_000);
    if ((c.unitsSold ?? 0) < expectedMinSales && (year - c.launchYear) >= 1) {
      news.push({
        id: `flop_console_${year}_${c.id}`,
        year,
        month: 12,
        category: "crisis" as NewsCategory,
        title: `📉 Console "${c.name}" não ganhou tração no mercado`,
        body: `O console "${c.name}" vendeu apenas ${(c.unitsSold ?? 0).toLocaleString()} unidades — muito abaixo do mínimo esperado de ${expectedMinSales.toLocaleString()} para a era atual.`,
        moneyDelta: 0,
        fansDelta: -200,
        reputationDelta: -2,
        isRead: false,
      });
    }
  }

  const rivalDominatesGames = rankings.gamesBySales[0] && !rankings.gamesBySales[0].isPlayer;
  const rivalDominatesConsoles = rankings.consolesBySales[0] && !rankings.consolesBySales[0].isPlayer;

  if (rivalDominatesGames && rivalDominatesConsoles && news.length < MAX_NEWS) {
    const gLeader = rankings.gamesBySales[0];
    const cLeader = rankings.consolesBySales[0];
    news.push({
      id: `rival_dominance_${year}`,
      year,
      month: 12,
      category: "competitor" as NewsCategory,
      title: `🏴 Rivais dominam o mercado em ${year}`,
      body: `A concorrência liderou tanto em jogos (${gLeader.name} — ${gLeader.ownerName}) como em consoles (${cLeader.name} — ${cLeader.ownerName}). Investe em qualidade e marketing para recuperar terreno.`,
      moneyDelta: 0,
      fansDelta: 0,
      reputationDelta: -1,
      isRead: false,
    });
  } else if (rivalDominatesGames && news.length < MAX_NEWS) {
    const leader = rankings.gamesBySales[0];
    news.push({
      id: `rival_game_leader_${year}`,
      year,
      month: 12,
      category: "competitor" as NewsCategory,
      title: `📰 ${leader.ownerName} lidera o ranking de jogos de ${year}`,
      body: `"${leader.name}" da ${leader.ownerName} foi o jogo mais vendido do ano. A concorrência está forte — investe em qualidade para disputar o topo.`,
      moneyDelta: 0,
      fansDelta: 0,
      reputationDelta: 0,
      isRead: false,
    });
  }

  return news;
}
