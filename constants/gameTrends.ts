// ─────────────────────────────────────────────────────────────────
// DYNAMIC TREND SYSTEM
// Genre trends shift every few months based on the gaming era.
// ─────────────────────────────────────────────────────────────────
import type { GameGenre } from "./gameEngine";

type GenreWeightMap = Partial<Record<GameGenre, number>>;

// Higher weight = more likely to be trending in that era
const ERA_GENRE_WEIGHTS: { fromYear: number; weights: GenreWeightMap }[] = [
  {
    fromYear: 1972,
    weights: {
      platformer: 40, action: 35, puzzle: 25, racing: 20, sports: 15,
      adventure: 10, shooter: 10, strategy: 8, rpg: 5,
      horror: 3, sim: 3, sandbox: 0, indie: 0,
    },
  },
  {
    fromYear: 1985,
    weights: {
      rpg: 40, platformer: 35, action: 30, sports: 25, strategy: 22,
      adventure: 20, puzzle: 18, racing: 15, shooter: 12,
      horror: 10, sim: 10, sandbox: 5, indie: 5,
    },
  },
  {
    fromYear: 1995,
    weights: {
      rpg: 40, action: 38, adventure: 30, shooter: 28, sports: 28,
      strategy: 25, racing: 22, horror: 18, sim: 18,
      platformer: 15, puzzle: 12, sandbox: 8, indie: 5,
    },
  },
  {
    fromYear: 2005,
    weights: {
      shooter: 45, action: 42, sports: 35, rpg: 30, sim: 28,
      sandbox: 25, strategy: 22, adventure: 20, racing: 18,
      horror: 20, puzzle: 12, platformer: 10, indie: 10,
      // Expansion genres begin appearing
      tactical_shooter: 18, hack_slash: 15, soulslike: 8,
      survival_hardcore: 12, city_builder: 10, scifi_strategy: 8,
    },
  },
  {
    fromYear: 2010,
    weights: {
      sandbox: 45, shooter: 40, indie: 35, rpg: 32, action: 30,
      horror: 28, sim: 25, strategy: 22, adventure: 20,
      sports: 18, puzzle: 18, racing: 12, platformer: 12,
      // Expansion genres more prominent
      extraction_shooter: 20, tactical_shooter: 22, soulslike: 18,
      survival_hardcore: 20, hack_slash: 16, dungeon_crawler: 14,
      city_builder: 15, sandbox_criativo: 18, colony_management: 10,
      game_dev_sim: 8, arena_brawler: 10, bullet_hell: 8,
    },
  },
  {
    fromYear: 2020,
    weights: {
      indie: 45, sandbox: 42, horror: 38, rpg: 35, shooter: 30,
      sim: 30, adventure: 28, action: 25, strategy: 25,
      puzzle: 22, platformer: 18, sports: 15, racing: 12,
      // Modern genre expansion
      extraction_shooter: 35, soulslike: 30, survival_hardcore: 28,
      tactical_shooter: 25, sandbox_criativo: 25, city_builder: 22,
      automation: 18, colony_management: 16, life_sim: 15,
      hack_slash: 18, dungeon_crawler: 16, psychological_horror: 20,
      game_dev_sim: 12, streaming_sim: 10, esports_manager: 10,
      chaos_sim: 8, meme_game: 8, parkour: 12, speedrun: 10,
    },
  },
  {
    fromYear: 2040,
    weights: {
      sim: 45, indie: 42, rpg: 40, adventure: 38, sandbox: 35,
      horror: 30, strategy: 30, puzzle: 28, action: 22,
      platformer: 20, shooter: 18, sports: 15, racing: 12,
      // Future-era genre trends
      space_exploration: 35, scifi_strategy: 30, automation: 28,
      soulslike: 25, sandbox_criativo: 25, life_sim: 22,
      parallel_universe: 15, cosmic_horror: 18, dream_sim: 12,
      game_dev_sim: 20, publisher_sim: 15, esports_manager: 18,
      minimalist: 10, time_loop: 12, reality_distortion: 10,
    },
  },
];

function getEraWeights(year: number): GenreWeightMap {  // Partial<Record<GameGenre, number>>
  let chosen = ERA_GENRE_WEIGHTS[0].weights;
  for (const entry of ERA_GENRE_WEIGHTS) {
    if (year >= entry.fromYear) chosen = entry.weights;
    else break;
  }
  return chosen;
}

// Deterministic seeded RNG (LCG)
function seededRandom(seed: number): () => number {
  let s = (seed ^ 0xdeadbeef) >>> 0;
  return () => {
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
    s ^= s >>> 16;
    return (s >>> 0) / 0xffffffff;
  };
}

// Returns 3 trending genres for this year/month — fully deterministic
export function getActiveTrends(year: number, month: number): GameGenre[] {
  const seed = year * 100 + month;
  const rng = seededRandom(seed);
  const weights = getEraWeights(year);

  // Weighted sampling without replacement
  const pool: { genre: GameGenre; weight: number }[] = (
    Object.entries(weights) as [GameGenre, number][]
  ).filter(([, w]) => w > 0).map(([genre, weight]) => ({ genre, weight }));

  const trending: GameGenre[] = [];
  for (let pick = 0; pick < 3 && pool.length > 0; pick++) {
    const total = pool.reduce((s, p) => s + p.weight, 0);
    let r = rng() * total;
    for (let j = 0; j < pool.length; j++) {
      r -= pool[j].weight;
      if (r <= 0) {
        trending.push(pool[j].genre);
        pool.splice(j, 1);
        break;
      }
    }
  }
  return trending;
}

// Revenue multiplier for a genre given current trending list
export function getTrendMultiplier(genre: GameGenre, trending: GameGenre[]): number {
  const idx = trending.indexOf(genre);
  if (idx === 0) return 1.5;  // 🔥 top trend: +50%
  if (idx === 1) return 1.3;  // 📈 growing: +30%
  if (idx === 2) return 1.15; // ⬆️ emerging: +15%
  return 1.0;
}

export const TREND_LABELS = ["🔥 Em Alta", "📈 Crescendo", "⬆️ Emergente"];
export const TREND_COLORS = ["#FF4D6A", "#F5A623", "#10B981"];

// How often trends refresh (in months)
export const TREND_REFRESH_INTERVAL = 3;
