export const GAME_START_YEAR = 1972;
export const GAME_END_YEAR = 3000;
export const BASE_BUDGET = 50_000;

export type Difficulty = "easy" | "normal" | "hard" | "legendary";

// Difficulty no longer affects starting money — all players begin with the same
// base capital and grow it through production, expansion, and smart decisions.
// Difficulty instead governs competitor strength, event frequency, and tax pressure.
export const DIFFICULTY_MULTIPLIERS: Record<Difficulty, number> = {
  easy: 30,
  normal: 20,
  hard: 15,
  legendary: 10,
};

export type DifficultyConfig = {
  label: string;
  description: string;
  competitorAggression: number;   // 1.0 = baseline
  eventFrequency: number;         // chance multiplier for bad events
  taxPressure: number;            // multiplier on effective tax rates (1 = normal)
  loanInterestMod: number;        // additive % on loan interest
};

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: {
    label: "Fácil",
    description: "Competidores fracos, eventos raros, impostos reduzidos. Ideal para aprender.",
    competitorAggression: 0.6,
    eventFrequency: 0.5,
    taxPressure: 0.8,
    loanInterestMod: -0.01,
  },
  normal: {
    label: "Normal",
    description: "Experiência balanceada. Competidores moderados e eventos regulares.",
    competitorAggression: 1.0,
    eventFrequency: 1.0,
    taxPressure: 1.0,
    loanInterestMod: 0,
  },
  hard: {
    label: "Difícil",
    description: "Competidores agressivos, eventos frequentes, impostos elevados.",
    competitorAggression: 1.4,
    eventFrequency: 1.5,
    taxPressure: 1.15,
    loanInterestMod: 0.015,
  },
  legendary: {
    label: "Lendário",
    description: "Modo implacável. Cada decisão errada tem consequências severas.",
    competitorAggression: 1.8,
    eventFrequency: 2.0,
    taxPressure: 1.30,
    loanInterestMod: 0.025,
  },
};

// Starting capital by difficulty (affects early-game strategy significantly)
export const STARTING_CAPITAL: Record<Difficulty, number> = {
  easy:      1_500_000,
  normal:    1_000_000,
  hard:        500_000,
  legendary:   100_000,
};

export function getStartingMoney(difficulty?: Difficulty): number {
  if (!difficulty) return STARTING_CAPITAL.normal;
  return STARTING_CAPITAL[difficulty];
}

// ── Unified cost multiplier ────────────────────────────────────────────────────
// Compound 2% per year from the 1972 baseline.
// At 1972 (reference): 1.00×   At 1980: 1.17×   At 1990: 1.43×
// At 2000: 1.75×   At 2010: 2.13×   At 2020: 2.60×   At 2030: 3.17×
// Creates real cost pressure in later eras — marketing, hiring, and development
// all become meaningfully more expensive over time, matching industry realities.

export function getCostMultiplier(year: number): number {
  const years = Math.max(0, year - 1972);
  return Math.pow(1.02, years);
}

// Legacy alias — kept so existing call-sites in advanceMonth compile without change.
export function getInflationMultiplier(year: number): number {
  return getCostMultiplier(year);
}

/**
 * Era + technology cost multiplier for game and console development.
 *
 * Formula:  getCostMultiplier(year) + techPart, capped at 4.0
 *   getCostMultiplier = year / 1970          → 1.000 (1970)  … 1.025 (2020)
 *   techPart = researchedNodes × 0.015       → +0.30 at 20 nodes, +0.75 at 50 nodes
 *
 * Examples:
 *   1972,  0 nodes → 1.001×  (Indie≈$100K, AAA≈$2M)
 *   1985, 10 nodes → 1.158×  (Indie≈$116K, AAA≈$2.32M)
 *   2000, 25 nodes → 1.390×  (Indie≈$139K, AAA≈$2.78M)
 *   2020, 50 nodes → 1.775×  (Indie≈$178K, AAA≈$3.55M)
 */
export function getEraDevCostMultiplier(year: number, researchedNodes: string[]): number {
  const techPart = researchedNodes.length * 0.015;
  return Math.min(4.0, getCostMultiplier(year) + techPart);
}

// Era-based salary floor multiplier for hiring costs (newer eras → pricier talent)
export function getHireCostInflation(year: number): number {
  return getCostMultiplier(year);
}

// Salary inflation: 1.5% raise per year of employment.
// An employee hired in 1972 working until 1980 earns 1.12× their base salary.
// By year 20 they earn 1.30×; by year 30 they earn 1.45×.
// This reflects real cost-of-living and seniority adjustments without runaway scaling.
export function getSalaryInflationFactor(hireYear: number, currentYear: number): number {
  if (!Number.isFinite(hireYear) || hireYear <= 0) return 1;
  if (!Number.isFinite(currentYear) || currentYear <= 0) return 1;
  const years = Math.max(0, currentYear - hireYear);
  return 1 + years * 0.015;
}

/**
 * safeN — normalize any value to a finite number.
 * Converts undefined, null, NaN, Infinity, or non-numeric values to `fallback` (default 0).
 * This is the single safe numeric normalization layer used throughout the game.
 */
export function safeN(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * formatNum — format a raw number for UI display (count, units).
 * Normalizes NaN/undefined before formatting. Never shows "NaN".
 */
export function formatNum(v: unknown, fallback = 0): string {
  const n = safeN(v, fallback);
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return Math.round(n).toLocaleString();
}

/**
 * formatMemory — display memory/storage sizes with automatic unit selection.
 * Prevents raw 0.000001953125 GB from showing in UI.
 */
export function formatMemory(bytes: number): string {
  const gb = safeN(bytes, 0);
  if (gb <= 0) return "0 MB";
  if (gb >= 1) {
    const rounded = gb % 1 === 0 ? gb : parseFloat(gb.toFixed(1));
    return `${rounded} GB`;
  }
  const mb = gb * 1024;
  if (mb >= 1) return `${mb % 1 === 0 ? mb : parseFloat(mb.toFixed(0))} MB`;
  const kb = mb * 1024;
  if (kb >= 1) return `${kb % 1 === 0 ? kb : parseFloat(kb.toFixed(0))} KB`;
  return `${Math.round(kb * 1024)} B`;
}

export function formatMoney(amount: number): string {
  const n = (amount == null || isNaN(amount) || !isFinite(amount)) ? 0 : amount;
  if (n >= 1_000_000_000_000) return `$${(n / 1_000_000_000_000).toFixed(1)}T`;
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}

export type Era = {
  year: number;
  name: string;
  description: string;
  icon: string;
};

export const GAME_ERAS: Era[] = [
  { year: 1972, name: "Dawn of Digital", description: "Mainframes & first video games", icon: "monitor" },
  { year: 1980, name: "Personal Computer Revolution", description: "Apple II, Commodore, IBM PC", icon: "cpu" },
  { year: 1990, name: "Internet Boom", description: "The World Wide Web changes everything", icon: "globe" },
  { year: 2000, name: "Dot-com Era", description: "Tech IPOs & mobile phones rise", icon: "smartphone" },
  { year: 2010, name: "Social & Mobile Age", description: "Cloud, apps and social networks", icon: "share-2" },
  { year: 2020, name: "AI & Beyond", description: "Machine learning, metaverse, Web3", icon: "zap" },
  { year: 2050, name: "Post-Singularity", description: "AI-driven economies, space commerce", icon: "star" },
  { year: 2080, name: "Interplanetary Commerce", description: "Multi-planetary corporations", icon: "navigation" },
];

export function getCurrentEra(year: number): Era {
  let current = GAME_ERAS[0];
  for (const era of GAME_ERAS) {
    if (year >= era.year) current = era;
    else break;
  }
  return current;
}

export type GoalCategory = "economic" | "global" | "legacy";
export type VictoryMode = "sandbox" | "goals";

export type VictoryGoal = {
  id: string;
  category: GoalCategory;
  icon: string;
  color: string;
  difficulty: "achievable" | "challenging" | "extreme";
};

export const VICTORY_GOALS: VictoryGoal[] = [
  // Economic (5 options — choose 1)
  { id: "eco1", category: "economic", icon: "dollar-sign",  color: "#F5A623", difficulty: "achievable"  },
  { id: "eco2", category: "economic", icon: "trending-up",  color: "#F5A623", difficulty: "challenging" },
  { id: "eco3", category: "economic", icon: "bar-chart-2",  color: "#F5A623", difficulty: "challenging" },
  { id: "eco4", category: "economic", icon: "monitor",      color: "#F5A623", difficulty: "challenging" },
  { id: "eco5", category: "economic", icon: "zap",          color: "#F5A623", difficulty: "extreme"     },
  // Global (5 options — choose 1)
  { id: "glb1", category: "global",   icon: "map-pin",      color: "#4DA6FF", difficulty: "achievable"  },
  { id: "glb2", category: "global",   icon: "globe",        color: "#4DA6FF", difficulty: "challenging" },
  { id: "glb3", category: "global",   icon: "navigation",   color: "#4DA6FF", difficulty: "challenging" },
  { id: "glb4", category: "global",   icon: "bar-chart-2",  color: "#4DA6FF", difficulty: "extreme"     },
  { id: "glb5", category: "global",   icon: "map",          color: "#4DA6FF", difficulty: "extreme"     },
  // Legacy (5 options — choose 1)
  { id: "leg1", category: "legacy",   icon: "award",        color: "#A855F7", difficulty: "achievable"  },
  { id: "leg2", category: "legacy",   icon: "clock",        color: "#A855F7", difficulty: "challenging" },
  { id: "leg3", category: "legacy",   icon: "cpu",          color: "#A855F7", difficulty: "challenging" },
  { id: "leg4", category: "legacy",   icon: "flag",         color: "#A855F7", difficulty: "extreme"     },
  { id: "leg5", category: "legacy",   icon: "star",         color: "#A855F7", difficulty: "extreme"     },
];

export const GOAL_CATEGORIES: GoalCategory[] = ["economic", "global", "legacy"];
export const CATEGORY_ICONS: Record<GoalCategory, string> = {
  economic: "dollar-sign",
  global: "globe",
  legacy: "award",
};
export const CATEGORY_COLORS: Record<GoalCategory, string> = {
  economic: "#F5A623",
  global: "#4DA6FF",
  legacy: "#A855F7",
};
