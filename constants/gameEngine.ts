import { GAME_START_YEAR, GAME_END_YEAR, getInflationMultiplier, getSalaryInflationFactor, DIFFICULTY_CONFIG, safeN } from "./gameEconomics";
import {
  pickScandal, generateInfluencerEvent, pickMediaHeadline,
  RIVAL_SCANDALS, INFLUENCER_PROFILES,
} from "./scandals";
import type { ScandalDef, ScandalOption, InfluencerEvent, HiredInfluencer } from "./scandals";
import { OfficeSectorId, ALL_OFFICE_SECTORS, getOfficeMonthlyMaintenance, computeAllOfficeBonuses } from "./officeSystem";
import { getCharacterById, DEFAULT_CHARACTER_BONUSES, getFounderModifiers, FounderModifiers } from "./characters";
import { getEventsForYear } from "./history";
import { GLOBAL_EVENTS, getDecade, GlobalEvent } from "./globalEvents";
import { getRivalConsoleReleasesForYear, getRivalFranchiseReleasesForYear, getRivalCompanyName } from "./rival_history";
import type { TaxModifier } from "./globalMarket";
import { TAX_EVENT_DEFINITIONS } from "./globalMarket";
import { computePassiveBonuses, getNodeById } from "./strategyTree";
import { computeSpecialization, getSpecLevel } from "./specialization";
import { EXCLUSIVE_TECHS } from "./exclusiveTech";
import { computeEraUpgradeBonuses, getInitialAvailableUpgrades } from "./eraUpgrades";
import { pickDynamicEvent } from "./dynamicEvents";
import {
  validateEventContext,
  getEventProbabilityScale,
  inferDynEventCategory,
  inferScandalEventCategory,
  generateContextualEventNote,
  type EventValidationContext,
  type EventValidationCategory,
} from "./eventValidation";
import { checkNewAchievements, AchievementDef } from "./achievements";
import { generateRankingAndFlopNews, computeAnnualRankings } from "./rankings";
import {
  getHistoricalEvent,
  getEraNewsItem,
  getEraNewsItemFiltered,
  generateStateAwareNewsItem,
  getMarketSizeMultiplier,
  getExpectedMemoryGB,
} from "./historicalProgression";
import type { ConsoleComponentSpec, ConsoleCategory } from "./consoleComponents";
import { getConsolePriceFeedback, getConsoleCategoryById } from "./consoleComponents";
import type { CountryBranch, Country, BranchIncident } from "./globalMarket";
import { getCountryById, getCountryMarketSize, getCountryRevenueMult, getStoreRevenueMult, getRegionHasBranch, getExportRevenueMult, REGION_INVESTMENT_TIERS } from "./globalMarket";
import type { ActiveLoan, CreditRating } from "./finances";
import { calculateCreditRating, assessBankruptcyRisk } from "./finances";
import { getActiveTrends, getTrendMultiplier } from "./gameTrends";
import {
  computeGenreSynergy,
  computeGameReception,
} from "./gameReception";
import type { StarRating, ReceptionSentiment } from "./gameReception";
import {
  Investor, InvestorOffer, Acquisition, TOTAL_SHARES,
  StockListing, StockPricePoint,
  calculateCompanyValue, calculateSharePrice, generateInvestorOffer,
  generateStockBid,
  detectInvestorConflicts, getMaxConflictLevel, getConflictNegotiationCost,
  type ConflictLevel, type GeoConflictPair,
  SponsorshipOpportunity,
  computeAcquisitionMonthlyMultiplier,
  generateSponsorshipOpportunity,
} from "./stockMarket";

export type ConsolePower = "low" | "medium" | "high";
export type OfficeType = OfficeSectorId;
// ── Event category cooldown table ─────────────────────────────────────────────
// Minimum months between consecutive events of the same validation category.
// Enforced across both the scandal system and the dynamic event system so no
// single category can fire twice within the cooldown window.
const CATEGORY_COOLDOWN_MONTHS: Record<EventValidationCategory, number> = {
  NEGATIVE_PR: 12, // raised: min 12 months between negative PR events
  POSITIVE_PR:  6, // raised: min 6 months between positive PR events
  TECH:         9, // raised: min 9 months between tech events
  MARKET:       8, // raised: min 8 months between market events
  INTERNAL:     8, // raised: min 8 months between internal events
};

export type MarketingTier = "none" | "cheap" | "medium" | "aggressive";
export type NewsCategory = "launch" | "tech" | "crisis" | "growth" | "competitor" | "award";

export type GameConsole = {
  id: string;
  name: string;
  power: ConsolePower;
  memoryGB: number;
  quality: number;
  productionCost: number;
  price: number;
  unitsSold: number;
  totalRevenue: number;
  rating: number;
  popularity: number;
  launchYear: number;
  launchMonth: number;
  isDiscontinued: boolean;
  // Full component spec (new system)
  components?: ConsoleComponentSpec;
  // Component-derived stats
  performanceScore?: number;
  failureRiskPerYear?: number;
  appealScore?: number;
  onlineBonusMult?: number;
  // Reception fields (computed on launch)
  starRating?: import("./gameReception").StarRating;
  receptionScore?: number;
  receptionComment?: string;
  receptionSentiment?: import("./gameReception").ReceptionSentiment;
  exportRegions?: import("./globalMarket").ExportRegionData[];
  category?: ConsoleCategory;
  // Modular design system — applied at launch
  designSalesMult?: number;
  designRepBonus?: number;
  designFanBoost?: number;
  // Development queue — console is not yet on sale while isInDevelopment is true
  isInDevelopment?: boolean;  // true while under construction
  devProgress?: number;        // 0–100, % toward completion
  devTimeMonths?: number;      // total months required (set at build time)
  // Dynamic pricing system
  suggestedPrice?: number;              // baseline "fair" price (≈ 3.5× productionCost), set at build time
  pricingStrategy?: "premium" | "budget" | "balanced"; // strategic positioning
  // Production control
  isProductionPaused?: boolean;         // if true: no sales, no maintenance cost
  // Relaunch system
  relaunchCount?: number;               // how many times relaunched so far
  relaunchBonusMonthsLeft?: number;     // months of post-relaunch sales boost remaining
};

// Offices now tracks upgrade count (0–35) per sector across 8 departments.
// Legacy saves only have {design, marketing, tech, admin} — new fields default to 0.
export type Offices = {
  design:       number;  // 0–35
  marketing:    number;  // 0–35
  tech:         number;  // 0–35 (Desenvolvimento)
  admin:        number;  // 0–35 (Operações)
  security:     number;  // 0–35
  executive:    number;  // 0–35
  research_lab: number;  // 0–35
  testing:      number;  // 0–35
};

// OFFICE_MAX_LEVEL now re-exported from officeSystem for backwards compat
export { OFFICE_MAX_UPGRADES as OFFICE_MAX_LEVEL } from "./officeSystem";

// Legacy per-upgrade cost array (for GameplayContext compatibility) is now computed
// dynamically via getOfficeUpgradeCost from officeSystem. Export a shim here.
export { getOfficeUpgradeCost as OFFICE_UPGRADE_COST_FN } from "./officeSystem";

// Keep OFFICE_UPGRADE_COSTS as an empty stub to avoid breaking imports that
// reference it; each call should use getOfficeUpgradeCost(index, year) instead.
export const OFFICE_UPGRADE_COSTS: Partial<Record<OfficeType, number[]>> = {};

export const OFFICE_MONTHLY_COSTS: Partial<Record<OfficeType, number[]>> = {};

export { OFFICE_SECTOR_ICONS as OFFICE_ICONS, OFFICE_SECTOR_COLORS as OFFICE_COLORS } from "./officeSystem";

export const MARKETING_COSTS: Record<MarketingTier, number> = {
  none: 0,
  cheap: 25_000,
  medium: 100_000,
  aggressive: 400_000,
};

export const MARKETING_DURATION: Record<MarketingTier, number> = {
  none: 0,
  cheap: 3,
  medium: 6,
  aggressive: 12,
};

export const MARKETING_SALES_BOOST: Record<MarketingTier, number> = {
  none: 1.0,
  cheap: 1.15,
  medium: 1.4,
  aggressive: 1.9,
};

// ── Employee Traits ────────────────────────────────────────────────────────
export type EmployeeTrait =
  | "genius"            // +30% effectiveness but -5% bug protection
  | "loyal"             // never leaves, +5% effectiveness over time
  | "creative"          // +15% game quality, +10% dev speed
  | "disciplined"       // -15% bug risk, +10% effectiveness
  | "fast_sloppy"       // +25% dev speed, +15% bug risk
  | "leader"            // boosts entire team +5% when senior+
  | "marketing_natural" // +20% sales bonus when marketing type
  | "burnout_risk"      // +20% effectiveness for 12 months, then -30% after
  | "expensive_specialist" // +40% salary but +35% effectiveness
  | "prodigy";           // +50% effectiveness but extremely high hire cost

export const EMPLOYEE_TRAIT_LABELS: Record<EmployeeTrait, string> = {
  genius:              "Gênio Difícil",
  loyal:               "Leal e Estável",
  creative:            "Muito Criativo",
  disciplined:         "Extremamente Disciplinado",
  fast_sloppy:         "Rápido mas Descuidado",
  leader:              "Grande Líder",
  marketing_natural:   "Nato em Marketing",
  burnout_risk:        "Risco de Burnout",
  expensive_specialist:"Especialista Caro",
  prodigy:             "Prodígio Oculto",
};

export const EMPLOYEE_TRAIT_ICONS: Record<EmployeeTrait, string> = {
  genius: "zap", loyal: "heart", creative: "feather", disciplined: "shield",
  fast_sloppy: "wind", leader: "users", marketing_natural: "volume-2",
  burnout_risk: "alert-triangle", expensive_specialist: "star", prodigy: "eye",
};

export const EMPLOYEE_TRAIT_COLORS: Record<EmployeeTrait, string> = {
  genius: "#F5A623", loyal: "#10B981", creative: "#A855F7", disciplined: "#4DA6FF",
  fast_sloppy: "#FF8C42", leader: "#10B981", marketing_natural: "#F5A623",
  burnout_risk: "#FF4D6A", expensive_specialist: "#F5A623", prodigy: "#4DA6FF",
};

export const EMPLOYEE_TRAIT_DESC: Record<EmployeeTrait, string> = {
  genius:              "+30% produtividade, -5% proteção de bugs",
  loyal:               "Nunca sai, +5% eficiência com o tempo",
  creative:            "+15% qualidade de jogo, +10% velocidade",
  disciplined:         "-15% risco de bugs, +10% eficiência",
  fast_sloppy:         "+25% velocidade, +15% risco de bugs",
  leader:              "+5% eficiência para toda a equipe",
  marketing_natural:   "+20% bônus de vendas",
  burnout_risk:        "+20% por 12 meses, depois -30%",
  expensive_specialist:"+40% salário, +35% eficiência",
  prodigy:             "+50% eficiência, contratação cara",
};

const TRAIT_POOL: EmployeeTrait[] = [
  "genius", "loyal", "creative", "disciplined", "fast_sloppy",
  "leader", "marketing_natural", "burnout_risk", "expensive_specialist", "prodigy",
];

// ── Employee System ──────────────────────────────────────────────────────────
export type EmployeeType = "engineer" | "designer" | "marketing" | "sales" | "researcher";
export type EmployeeLevel = "junior" | "senior" | "principal";

export type Employee = {
  id: string;
  type: EmployeeType;
  level: EmployeeLevel;
  name: string;
  monthlySalary: number;
  hireYear: number;
  hireMonth: number;
  // Obsolescence tracking: year their tech skills were last "current"
  // Starts at hireYear; resets to currentYear when retrained.
  techEraYear?: number;
  // Personality trait
  trait?: EmployeeTrait;
  // How long this employee has been working (months, for burnout tracking)
  monthsWorked?: number;
};

export const EMPLOYEE_HIRE_COST: Record<EmployeeType, Record<EmployeeLevel, number>> = {
  engineer:   { junior: 40_000, senior: 100_000, principal: 250_000 },
  designer:   { junior: 30_000, senior: 80_000,  principal: 200_000 },
  marketing:  { junior: 25_000, senior: 70_000,  principal: 180_000 },
  sales:      { junior: 20_000, senior: 60_000,  principal: 150_000 },
  researcher: { junior: 50_000, senior: 120_000, principal: 300_000 },
};

export const EMPLOYEE_MONTHLY_SALARY: Record<EmployeeType, Record<EmployeeLevel, number>> = {
  engineer:   { junior: 5_000, senior: 12_000, principal: 28_000 },
  designer:   { junior: 4_000, senior: 10_000, principal: 22_000 },
  marketing:  { junior: 3_500, senior: 8_500,  principal: 19_000 },
  sales:      { junior: 3_000, senior: 7_000,  principal: 16_000 },
  researcher: { junior: 6_000, senior: 14_000, principal: 32_000 },
};

export const EMPLOYEE_LEVEL_BONUS: Record<EmployeeType, Record<EmployeeLevel, number>> = {
  engineer:   { junior: 0.02, senior: 0.04, principal: 0.07 },
  designer:   { junior: 0.02, senior: 0.04, principal: 0.07 },
  marketing:  { junior: 0.02, senior: 0.04, principal: 0.07 },
  sales:      { junior: 0.02, senior: 0.04, principal: 0.07 },
  researcher: { junior: 0.02, senior: 0.04, principal: 0.07 },
};

export const EMPLOYEE_TYPE_COLORS: Record<EmployeeType, string> = {
  engineer: "#4DA6FF",
  designer: "#A855F7",
  marketing: "#F5A623",
  sales: "#10B981",
  researcher: "#FF4D6A",
};

export const EMPLOYEE_TYPE_ICONS: Record<EmployeeType, string> = {
  engineer: "cpu",
  designer: "pen-tool",
  marketing: "volume-2",
  sales: "bar-chart-2",
  researcher: "thermometer",
};

export const EMPLOYEE_TYPE_NAMES: Record<EmployeeType, string> = {
  engineer: "Engenheiro",
  designer: "Designer",
  marketing: "Marketing",
  sales: "Vendas",
  researcher: "Pesquisador",
};

export const EMPLOYEE_LEVEL_NAMES: Record<EmployeeLevel, string> = {
  junior: "Júnior",
  senior: "Sênior",
  principal: "Principal",
};

const EMPLOYEE_NAMES: Record<EmployeeType, string[]> = {
  engineer:   ["Alex Chen", "Riku Tanaka", "Sofia Kovač", "Liam Brooks", "Maya Patel"],
  designer:   ["Aria Nova", "Lucas Melo", "Zara Kim", "Felix Müller", "Noa Levi"],
  marketing:  ["Jordan West", "Isabela Cruz", "Tom Reed", "Yuna Park", "Camila Ruiz"],
  sales:      ["Marco Silva", "Anna Berg", "Daniel Roy", "Priya Sharma", "Ben Carter"],
  researcher: ["Dr. Evelyn Lake", "Prof. Hiro Sato", "Dr. Clara Stein", "Dr. Omar Hassan", "Dr. Lin Wei"],
};

export function generateEmployee(type: EmployeeType, level: EmployeeLevel): Employee {
  const names = EMPLOYEE_NAMES[type];
  const name = names[Math.floor(Math.random() * names.length)];
  // 70% chance of getting a trait; principal level always gets one
  const hasTrait = level === "principal" || Math.random() < 0.70;
  const trait: EmployeeTrait | undefined = hasTrait
    ? TRAIT_POOL[Math.floor(Math.random() * TRAIT_POOL.length)]
    : undefined;

  // Expensive specialist and prodigy inflate salary
  let salary = EMPLOYEE_MONTHLY_SALARY[type][level];
  if (trait === "expensive_specialist") salary = Math.round(salary * 1.40);
  if (trait === "prodigy") salary = Math.round(salary * 1.60);
  if (trait === "burnout_risk") salary = Math.round(salary * 0.90);

  return {
    id: `emp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    type, level, name,
    monthlySalary: salary,
    hireYear: 0, hireMonth: 0,
    trait,
    monthsWorked: 0,
  };
}

// Compute trait effectiveness multiplier for an employee
export function getTraitEffectiveness(emp: Employee): {
  effectMult: number;
  bugRiskMod: number;
  devSpeedMod: number;
  salesMod: number;
} {
  const months = emp.monthsWorked ?? 0;
  switch (emp.trait) {
    case "genius":             return { effectMult: 1.30, bugRiskMod: 0.05,  devSpeedMod: 0,     salesMod: 0 };
    case "loyal":              return { effectMult: 1.0 + Math.min(months / 120, 0.20), bugRiskMod: 0, devSpeedMod: 0, salesMod: 0 };
    case "creative":           return { effectMult: 1.15, bugRiskMod: 0,     devSpeedMod: 0.10,  salesMod: 0 };
    case "disciplined":        return { effectMult: 1.10, bugRiskMod: -0.15, devSpeedMod: 0,     salesMod: 0 };
    case "fast_sloppy":        return { effectMult: 1.00, bugRiskMod: 0.15,  devSpeedMod: 0.25,  salesMod: 0 };
    case "leader":             return { effectMult: 1.10, bugRiskMod: 0,     devSpeedMod: 0.05,  salesMod: 0.05 };
    case "marketing_natural":  return { effectMult: 1.10, bugRiskMod: 0,     devSpeedMod: 0,     salesMod: 0.20 };
    case "burnout_risk":       return months < 12
      ? { effectMult: 1.20, bugRiskMod: 0, devSpeedMod: 0.10, salesMod: 0 }
      : { effectMult: 0.70, bugRiskMod: 0, devSpeedMod: -0.15, salesMod: 0 };
    case "expensive_specialist": return { effectMult: 1.35, bugRiskMod: 0,   devSpeedMod: 0,     salesMod: 0 };
    case "prodigy":            return { effectMult: 1.50, bugRiskMod: -0.10, devSpeedMod: 0.10,  salesMod: 0 };
    default:                   return { effectMult: 1.00, bugRiskMod: 0,     devSpeedMod: 0,     salesMod: 0 };
  }
}

// Obsolescence factor: effectiveness decays after 5+ years without retraining.
// Bottoms at 50% effectiveness (outdated employee still contributes, just less).
export function getObsolescenceFactor(emp: Employee, currentYear: number): number {
  const techEra = emp.techEraYear ?? emp.hireYear;
  const yearsOutdated = Math.max(0, currentYear - techEra - 5);
  return Math.max(0.50, 1 - yearsOutdated * 0.05);
}

// Retraining cost = 30% of the original hire cost
export function getRetrainCost(emp: Employee): number {
  return Math.round(EMPLOYEE_HIRE_COST[emp.type][emp.level] * 0.30);
}

// Monthly office maintenance tied to the team office level system.
// Scales with both the level (larger/better-equipped space) and headcount
// (more staff = more utilities, supplies, shared services).
// Formula: $3,000 × level + $150 × employees
export function getTeamOfficeMonthlyCost(officeLevel: number, empCount: number): number {
  const lvl = Math.max(1, officeLevel);
  return lvl * 3_000 + empCount * 150;
}

// Level sort order for diminishing-returns grouping (highest first)
const _LEVEL_SORT: Record<EmployeeLevel, number> = { principal: 2, senior: 1, junior: 0 };

export function computeEmployeeBonuses(employees: Employee[], currentYear: number = 2024): {
  ratingBonus: number;
  costMult: number;
  campaignMult: number;
  salesMult: number;
  researchSpeed: number;
} {
  let ratingBonus = 0;
  let costReduction = 0;
  let campaignAdd = 0;
  let salesAdd = 0;
  let researchAdd = 0;

  // Leadership trait: senior/principal leaders grant +5% to the whole team each
  const leaderCount = employees.filter(
    (e) => e.trait === "leader" && (e.level === "senior" || e.level === "principal")
  ).length;
  const leaderMult = 1 + leaderCount * 0.05;

  // Group by type; within each type sort strongest first so the first employee
  // (the most impactful one) always gets the full 100% credit.
  const byType: Partial<Record<EmployeeType, Employee[]>> = {};
  for (const emp of employees) {
    if (!byType[emp.type]) byType[emp.type] = [];
    byType[emp.type]!.push(emp);
  }

  const EMP_TYPES_ALL: EmployeeType[] = ["engineer", "designer", "marketing", "sales", "researcher"];
  for (const type of EMP_TYPES_ALL) {
    const group = (byType[type] ?? []).slice().sort(
      (a, b) => _LEVEL_SORT[b.level] - _LEVEL_SORT[a.level]
    );
    group.forEach((emp, idx) => {
      const baseBonus = EMPLOYEE_LEVEL_BONUS[emp.type][emp.level];
      const obsolescence = getObsolescenceFactor(emp, currentYear);
      const traitFx = getTraitEffectiveness(emp);
      // First employee of this type = 100%; every additional = 50%
      const drMult = idx === 0 ? 1.0 : 0.5;
      const bonus = baseBonus * obsolescence * traitFx.effectMult * leaderMult * drMult;
      switch (emp.type) {
        case "engineer":   ratingBonus   += bonus; break;
        case "designer":   costReduction += bonus; break;
        case "marketing":  campaignAdd   += bonus * (1 + traitFx.salesMod); break;
        case "sales":      salesAdd      += bonus * (1 + traitFx.salesMod); break;
        case "researcher": researchAdd   += bonus; break;
      }
    });
  }

  return {
    ratingBonus,
    costMult:      Math.max(0.4, 1 - costReduction),
    campaignMult:  1 + Math.min(campaignAdd, 1.5),
    salesMult:     1 + Math.min(salesAdd, 0.8),
    researchSpeed: Math.min(researchAdd, 2.0),
  };
}

// ── Game Projects ─────────────────────────────────────────────────────────────
export type GameGenre =
  | "rpg" | "action" | "adventure" | "racing" | "shooter"
  | "horror" | "puzzle" | "sandbox" | "platformer"
  | "sports" | "sim" | "strategy" | "indie"
  // ── Core expansion ─────────────────────────────────────────────────────────
  | "stealth" | "hack_slash" | "dungeon_crawler" | "tactical_shooter"
  | "extraction_shooter" | "survival_hardcore" | "sandbox_criativo"
  | "life_sim" | "city_builder" | "colony_management" | "automation"
  | "space_exploration" | "scifi_strategy" | "fantasy_strategy"
  | "political_sim" | "crime_sim" | "detective"
  | "psychological_horror" | "cosmic_horror" | "soulslike"
  | "bullet_hell" | "twin_stick" | "arena_brawler"
  | "physics_game" | "destruction_sim" | "parkour" | "speedrun"
  // ── Experimental ───────────────────────────────────────────────────────────
  | "chaos_sim" | "meme_game" | "absurd_comedy" | "reality_distortion"
  | "dream_sim" | "time_loop" | "parallel_universe" | "glitch_game"
  | "minimalist" | "interactive_story" | "influencer_sim"
  | "bankrupt_sim" | "economic_crisis"
  // ── Industry ───────────────────────────────────────────────────────────────
  | "game_dev_sim" | "streaming_sim" | "esports_manager" | "publisher_sim";

export type GamePhase = "development" | "qa" | "released" | "cancelled";

export type GamePlatform = "console" | "pc" | "mobile";
export type GameAudience = "kids" | "teens" | "adults" | "all";
export type GameAgeRating = "E" | "T" | "M" | "AO";

export type PostLaunchActionType =
  | "patch"
  | "content_update"
  | "expansion"
  | "enhanced_edition"
  | "next_gen_port";

export type UpdateOutcomeTier = "critico" | "sucesso" | "regular" | "fraco" | "fracasso";

export type OutcomeEffects = {
  lifespanExt:  number;
  revBoostAdd:  number;
  repBoost:     number;
  fanDelta:     number;
  label:        string;
  color:        string;
};

export const OUTCOME_TABLE: Record<PostLaunchActionType, Record<UpdateOutcomeTier, OutcomeEffects>> = {
  patch: {
    critico:  { lifespanExt: 10, revBoostAdd:  0.15, repBoost:  5, fanDelta:  3000, label: "Crítico! Jogadores adoraram o patch.",          color: "#F5A623" },
    sucesso:  { lifespanExt:  6, revBoostAdd:  0.08, repBoost:  2, fanDelta:  1000, label: "Sucesso. Patch corrigiu problemas relevantes.",   color: "#10B981" },
    regular:  { lifespanExt:  3, revBoostAdd:  0.02, repBoost:  0, fanDelta:   200, label: "Ok. Patch lançado, impacto discreto.",            color: "#4DA6FF" },
    fraco:    { lifespanExt:  1, revBoostAdd: -0.02, repBoost: -1, fanDelta:     0, label: "Fraco. Poucos notaram o patch.",                  color: "#F59E0B" },
    fracasso: { lifespanExt:  0, revBoostAdd: -0.06, repBoost: -4, fanDelta: -600,  label: "Fracasso! Patch introduziu novos bugs.",          color: "#FF4D6A" },
  },
  content_update: {
    critico:  { lifespanExt: 18, revBoostAdd:  0.35, repBoost:  8, fanDelta:  8000, label: "Crítico! Conteúdo vira tendência.",               color: "#F5A623" },
    sucesso:  { lifespanExt: 10, revBoostAdd:  0.18, repBoost:  4, fanDelta:  3000, label: "Sucesso. Jogadores voltam ao jogo.",               color: "#10B981" },
    regular:  { lifespanExt:  5, revBoostAdd:  0.05, repBoost:  1, fanDelta:   700, label: "Ok. Atualização bem recebida, sem alarde.",        color: "#4DA6FF" },
    fraco:    { lifespanExt:  2, revBoostAdd: -0.03, repBoost: -2, fanDelta:     0, label: "Fraco. Conteúdo não empolgou a base de fãs.",      color: "#F59E0B" },
    fracasso: { lifespanExt:  0, revBoostAdd: -0.10, repBoost: -6, fanDelta: -1200, label: "Fracasso! Conteúdo mal recebido, jogadores furiosos.", color: "#FF4D6A" },
  },
  expansion: {
    critico:  { lifespanExt: 28, revBoostAdd:  0.55, repBoost: 12, fanDelta: 15000, label: "Crítico! Expansão aclamada pela crítica.",         color: "#F5A623" },
    sucesso:  { lifespanExt: 16, revBoostAdd:  0.28, repBoost:  6, fanDelta:  6000, label: "Sucesso. Expansão bem avaliada e vendida.",         color: "#10B981" },
    regular:  { lifespanExt:  8, revBoostAdd:  0.09, repBoost:  2, fanDelta:  1500, label: "Ok. Expansão sólida, sem grandes elogios.",         color: "#4DA6FF" },
    fraco:    { lifespanExt:  3, revBoostAdd: -0.04, repBoost: -3, fanDelta:     0, label: "Fraco. Expansão abaixo da expectativa.",            color: "#F59E0B" },
    fracasso: { lifespanExt:  0, revBoostAdd: -0.18, repBoost: -9, fanDelta: -2500, label: "Fracasso! Expansão destruiu reputação do jogo.",    color: "#FF4D6A" },
  },
  enhanced_edition: {
    critico:  { lifespanExt: 40, revBoostAdd:  0.70, repBoost: 14, fanDelta: 25000, label: "Crítico! Edição definitiva — clássico instantâneo.", color: "#F5A623" },
    sucesso:  { lifespanExt: 24, revBoostAdd:  0.38, repBoost:  9, fanDelta: 10000, label: "Sucesso. Edição muito bem valorizada.",              color: "#10B981" },
    regular:  { lifespanExt: 10, revBoostAdd:  0.12, repBoost:  2, fanDelta:  2000, label: "Ok. Edição passou despercebida pelo mercado.",       color: "#4DA6FF" },
    fraco:    { lifespanExt:  3, revBoostAdd: -0.05, repBoost: -4, fanDelta:     0, label: "Fraco. Jogadores não se convenceram do valor.",      color: "#F59E0B" },
    fracasso: { lifespanExt:  0, revBoostAdd: -0.22, repBoost:-11, fanDelta: -3500, label: "Fracasso! Edição vista como exploração financeira.", color: "#FF4D6A" },
  },
  next_gen_port: {
    critico:  { lifespanExt: 60, revBoostAdd:  1.00, repBoost: 20, fanDelta: 50000, label: "Crítico! Clássico reinventado para nova geração.",  color: "#F5A623" },
    sucesso:  { lifespanExt: 30, revBoostAdd:  0.50, repBoost: 12, fanDelta: 20000, label: "Sucesso. Port bem executado, nova audiência.",       color: "#10B981" },
    regular:  { lifespanExt: 12, revBoostAdd:  0.16, repBoost:  3, fanDelta:  5000, label: "Ok. Port funcional, sem inovar.",                   color: "#4DA6FF" },
    fraco:    { lifespanExt:  4, revBoostAdd: -0.07, repBoost: -6, fanDelta:     0, label: "Fraco. Port com problemas técnicos visíveis.",       color: "#F59E0B" },
    fracasso: { lifespanExt:  0, revBoostAdd: -0.28, repBoost:-16, fanDelta: -6000, label: "Fracasso! Port destruiu o legado do jogo.",          color: "#FF4D6A" },
  },
};

export type PostLaunchUpdate = {
  type: PostLaunchActionType;
  year: number;
  month: number;
  costPaid: number;
  lifespanExtension: number;
  revBoostApplied: number;
  outcome: UpdateOutcomeTier;
  outcomeLabel: string;
  outcomeColor: string;
};

export type RelaunchResult =
  | "blockbuster"
  | "moderate"
  | "poor"
  | "nostalgia_hit"
  | "outdated_flop";

export type PostLaunchActionDef = {
  label: string;
  description: string;
  icon: string;
  color: string;
  budgetPct: number;
  minCostUSD: number;
  months: number;
  minYear?: number;
};

export const POST_LAUNCH_ACTIONS: Record<PostLaunchActionType, PostLaunchActionDef> = {
  patch: {
    label:       "Patch de Correção",
    description: "Corrige problemas e aumenta a vida útil do jogo. Resultado depende da qualidade original e reputação.",
    icon:        "tool",
    color:       "#4DA6FF",
    budgetPct:   0.08,
    minCostUSD:  75_000,
    months:      2,
  },
  content_update: {
    label:       "Atualização de Conteúdo",
    description: "Novo conteúdo atrai jogadores. Alta qualidade e boa reputação aumentam as chances de sucesso.",
    icon:        "plus-circle",
    color:       "#10B981",
    budgetPct:   0.15,
    minCostUSD:  250_000,
    months:      4,
  },
  expansion: {
    label:       "Expansão",
    description: "Nova história, mapas ou modos. Custo elevado; fracasso pode prejudicar a reputação seriamente.",
    icon:        "layers",
    color:       "#A855F7",
    budgetPct:   0.30,
    minCostUSD:  750_000,
    months:      7,
  },
  enhanced_edition: {
    label:       "Edição Melhorada",
    description: "Versão aprimorada com gráficos e conteúdo extra. Pode ser vista como exploração se mal executada.",
    icon:        "star",
    color:       "#F5A623",
    budgetPct:   0.45,
    minCostUSD:  1_500_000,
    months:      10,
  },
  next_gen_port: {
    label:       "Port Nova Geração",
    description: "Relançamento para hardware atual. Risco alto: fracasso destrói o legado. Disponível a partir de 1985.",
    icon:        "monitor",
    color:       "#FF4D6A",
    budgetPct:   0.60,
    minCostUSD:  3_000_000,
    months:      12,
    minYear:     1985,
  },
};

export function computePostLaunchCost(budget: number, actionType: PostLaunchActionType): number {
  const def = POST_LAUNCH_ACTIONS[actionType];
  return Math.round(Math.max(budget * def.budgetPct, def.minCostUSD));
}

export function computeUpdateQualityScore(
  proj: { starRating?: number; receptionScore?: number; effectiveLifespan?: number; launchYear?: number; launchMonth?: number; postLaunchUpdates?: unknown[] },
  currentYear: number,
  currentMonth: number,
  reputation: number,
): number {
  const stars = proj.starRating ?? 3;
  const qualityFromStars = (stars - 1) / 4;
  const qualityFromScore = proj.receptionScore != null ? proj.receptionScore / 100 : qualityFromStars;
  const quality = qualityFromStars * 0.6 + qualityFromScore * 0.4;

  const repScore = Math.min(100, Math.max(0, reputation)) / 100;

  const lifespan = proj.effectiveLifespan ?? 36;
  const ageMonths = (currentYear - (proj.launchYear ?? currentYear)) * 12 + (currentMonth - (proj.launchMonth ?? currentMonth));
  const fadeRatio = Math.max(0, 1 - ageMonths / lifespan);
  const timingBonus = fadeRatio > 0.4 ? 0.08 : fadeRatio > 0.15 ? 0 : -0.18;

  const updateCount = (proj.postLaunchUpdates ?? []).length;
  const diminishingPenalty = Math.min(0.55, updateCount * 0.13);

  return quality * 0.45 + repScore * 0.35 + timingBonus - diminishingPenalty;
}

export function rollUpdateOutcomeTier(qualityScore: number): UpdateOutcomeTier {
  const q = Math.max(0, Math.min(1, qualityScore));
  const r = Math.random();
  const tCritico  = q * 0.22;
  const tSucesso  = tCritico + q * 0.46;
  const tRegular  = tSucesso + 0.14;
  const tFraco    = tRegular + (1 - q) * 0.42;
  if (r < tCritico)  return "critico";
  if (r < tSucesso)  return "sucesso";
  if (r < tRegular)  return "regular";
  if (r < tFraco)    return "fraco";
  return "fracasso";
}

export const RELAUNCH_RESULT_LABELS: Record<RelaunchResult, string> = {
  blockbuster:    "Relançamento Blockbuster!",
  moderate:       "Retorno Moderado",
  poor:           "Recepção Fraca",
  nostalgia_hit:  "Sucesso de Nostalgia",
  outdated_flop:  "Flop Desatualizado",
};

export const RELAUNCH_RESULT_COLORS: Record<RelaunchResult, string> = {
  blockbuster:   "#F5A623",
  moderate:      "#10B981",
  poor:          "#F5A623",
  nostalgia_hit: "#4DA6FF",
  outdated_flop: "#FF4D6A",
};

export type BugLevel = "none" | "low" | "medium" | "severe";

export const BUG_LEVEL_LABELS: Record<BugLevel, string> = {
  none:   "Sem Bugs",
  low:    "Bugs Menores",
  medium: "Bugs Moderados",
  severe: "Bugs Graves",
};

export const BUG_LEVEL_COLORS: Record<BugLevel, string> = {
  none:   "#10B981",
  low:    "#F5A623",
  medium: "#FF8C42",
  severe: "#FF4D6A",
};

export const BUG_FIX_COST: Record<BugLevel, number> = {
  none:   0,
  low:    50_000,
  medium: 200_000,
  severe: 500_000,
};

export const BUG_FIX_MONTHS: Record<BugLevel, number> = {
  none:   0,
  low:    1,
  medium: 2,
  severe: 4,
};

export type GameProject = {
  id: string;
  name: string;
  genre: GameGenre;
  genres?: GameGenre[];
  budget: number;
  quality: number;
  monthsRequired: number;
  monthsElapsed: number;
  phase: GamePhase;
  monthlyRevenue: number;
  totalRevenue: number;
  launchYear: number;
  launchMonth: number;
  sequelOf?: string;
  sequelRevBonus?: number;
  sequelCount?: number;
  platform?: GamePlatform;
  targetAudience?: GameAudience;
  ageRating?: GameAgeRating;
  starRating?: StarRating;
  receptionScore?: number;
  receptionComment?: string;
  receptionSentiment?: ReceptionSentiment;
  fanDemandForSequel?: boolean;
  bugLevel?: BugLevel;
  bugFixInProgress?: boolean;
  bugFixMonthsLeft?: number;
  hypeLevel?: number;
  hypeCampaignActive?: boolean;
  hypeCampaignMonthsLeft?: number;
  exportRegions?: import("./globalMarket").ExportRegionData[];
  // Post-launch support
  effectiveLifespan?: number;
  revenueMultBonus?: number;
  pendingUpdateType?: PostLaunchActionType;
  updateMonthsLeft?: number;
  postLaunchUpdates?: PostLaunchUpdate[];
  relaunchCount?: number;
  // Launch quality protection & score recovery
  baseQualityScore?: number;        // deterministic score before variance (saved at launch)
  scoreRecoveryInProgress?: boolean;
  scoreRecoveryMonthsLeft?: number;
  scoreRecoveryAmount?: number;     // points to add on completion
  // Post-development decisions
  dlcCount?: number;               // number of DLCs released (max 3)
  supportActive?: boolean;         // false = support stopped, gradual fan drain
  gameOptimized?: boolean;         // one-time optimization boost performed
  sequelCreated?: boolean;         // a sequel has been started for this game
};

export const GAME_GENRE_ICONS: Record<GameGenre, string> = {
  // ── Original ───────────────────────────────────────────────────────────────
  rpg: "book-open",
  action: "zap",
  adventure: "compass",
  racing: "wind",
  shooter: "crosshair",
  horror: "eye-off",
  puzzle: "layers",
  sandbox: "map",
  platformer: "arrow-up-right",
  sports: "activity",
  sim: "globe",
  strategy: "grid",
  indie: "star",
  // ── Core expansion ─────────────────────────────────────────────────────────
  stealth:             "moon",
  hack_slash:          "scissors",
  dungeon_crawler:     "navigation-2",
  tactical_shooter:    "target",
  extraction_shooter:  "package",
  survival_hardcore:   "shield",
  sandbox_criativo:    "box",
  life_sim:            "heart",
  city_builder:        "home",
  colony_management:   "users",
  automation:          "settings",
  space_exploration:   "navigation",
  scifi_strategy:      "cpu",
  fantasy_strategy:    "flag",
  political_sim:       "briefcase",
  crime_sim:           "alert-circle",
  detective:           "search",
  psychological_horror:"alert-triangle",
  cosmic_horror:       "cloud",
  soulslike:           "anchor",
  bullet_hell:         "radio",
  twin_stick:          "circle",
  arena_brawler:       "shield",
  physics_game:        "triangle",
  destruction_sim:     "trash-2",
  parkour:             "chevrons-up",
  speedrun:            "fast-forward",
  // ── Experimental ───────────────────────────────────────────────────────────
  chaos_sim:           "zap",
  meme_game:           "smile",
  absurd_comedy:       "meh",
  reality_distortion:  "refresh-cw",
  dream_sim:           "moon",
  time_loop:           "repeat",
  parallel_universe:   "copy",
  glitch_game:         "alert-octagon",
  minimalist:          "minus",
  interactive_story:   "book",
  influencer_sim:      "video",
  bankrupt_sim:        "trending-down",
  economic_crisis:     "dollar-sign",
  // ── Industry ───────────────────────────────────────────────────────────────
  game_dev_sim:        "terminal",
  streaming_sim:       "wifi",
  esports_manager:     "award",
  publisher_sim:       "send",
};

export const GAME_GENRE_NAMES: Record<GameGenre, string> = {
  // ── Original ───────────────────────────────────────────────────────────────
  rpg: "RPG",
  action: "Ação",
  adventure: "Aventura",
  racing: "Corrida",
  shooter: "Shooter",
  horror: "Terror",
  puzzle: "Puzzle",
  sandbox: "Mundo Aberto",
  platformer: "Plataforma",
  sports: "Esportes",
  sim: "Simulação",
  strategy: "Estratégia",
  indie: "Indie",
  // ── Core expansion ─────────────────────────────────────────────────────────
  stealth:             "Stealth",
  hack_slash:          "Hack & Slash",
  dungeon_crawler:     "Dungeon Crawler",
  tactical_shooter:    "Tac Shooter",
  extraction_shooter:  "Extraction Shooter",
  survival_hardcore:   "Survival Hardcore",
  sandbox_criativo:    "Sandbox Criativo",
  life_sim:            "Life Simulator",
  city_builder:        "City Builder",
  colony_management:   "Colony Management",
  automation:          "Automação / Factory",
  space_exploration:   "Space Exploration",
  scifi_strategy:      "Sci-fi Strategy",
  fantasy_strategy:    "Fantasy Strategy",
  political_sim:       "Political Simulator",
  crime_sim:           "Crime Simulator",
  detective:           "Detective / Investigação",
  psychological_horror:"Horror Psicológico",
  cosmic_horror:       "Cosmic Horror",
  soulslike:           "Soulslike",
  bullet_hell:         "Bullet Hell",
  twin_stick:          "Twin-stick Shooter",
  arena_brawler:       "Arena Brawler",
  physics_game:        "Physics-based Game",
  destruction_sim:     "Destruction Simulator",
  parkour:             "Parkour / Movement",
  speedrun:            "Speedrun-focused",
  // ── Experimental ───────────────────────────────────────────────────────────
  chaos_sim:           "Chaos Simulator",
  meme_game:           "Meme Game",
  absurd_comedy:       "Absurd Comedy",
  reality_distortion:  "Reality Distortion",
  dream_sim:           "Dream Simulator",
  time_loop:           "Time Loop Game",
  parallel_universe:   "Parallel Universe",
  glitch_game:         "Glitch Game",
  minimalist:          "Minimalist Experience",
  interactive_story:   "Interactive Story Chaos",
  influencer_sim:      "Sim de Influencer",
  bankrupt_sim:        "Sim de Empresa Falida",
  economic_crisis:     "Sim de Crise Econômica",
  // ── Industry ───────────────────────────────────────────────────────────────
  game_dev_sim:        "Game Dev Simulator",
  streaming_sim:       "Streaming Simulator",
  esports_manager:     "eSports Manager",
  publisher_sim:       "Publisher Simulator",
};

// Base revenue multipliers per genre (before trend boost)
const GENRE_REVENUE_MULT: Record<GameGenre, number> = {
  // ── Original ──────────────────────────────────────────────────────────────
  shooter: 1.35,
  rpg: 1.30,
  sandbox: 1.25,
  action: 1.20,
  adventure: 1.15,
  sports: 1.10,
  horror: 1.08,
  sim: 1.05,
  strategy: 1.00,
  racing: 1.00,
  platformer: 0.95,
  puzzle: 0.88,
  indie: 0.80,
  // ── Core expansion ────────────────────────────────────────────────────────
  tactical_shooter:    1.30,
  extraction_shooter:  1.25,
  soulslike:           1.22,
  hack_slash:          1.18,
  survival_hardcore:   1.15,
  dungeon_crawler:     1.12,
  city_builder:        1.10,
  scifi_strategy:      1.10,
  fantasy_strategy:    1.08,
  sandbox_criativo:    1.08,
  space_exploration:   1.05,
  stealth:             1.05,
  colony_management:   1.03,
  arena_brawler:       1.02,
  bullet_hell:         1.00,
  twin_stick:          1.00,
  parkour:             0.98,
  detective:           0.97,
  life_sim:            0.97,
  psychological_horror:0.95,
  crime_sim:           0.95,
  political_sim:       0.92,
  automation:          0.90,
  cosmic_horror:       0.90,
  speedrun:            0.88,
  physics_game:        0.88,
  destruction_sim:     0.85,
  // ── Experimental ─────────────────────────────────────────────────────────
  chaos_sim:           1.15,
  meme_game:           0.95,
  absurd_comedy:       0.90,
  influencer_sim:      0.88,
  time_loop:           0.85,
  interactive_story:   0.85,
  dream_sim:           0.82,
  parallel_universe:   0.80,
  reality_distortion:  0.78,
  minimalist:          0.75,
  economic_crisis:     0.75,
  bankrupt_sim:        0.72,
  glitch_game:         0.70,
  // ── Industry ─────────────────────────────────────────────────────────────
  game_dev_sim:        1.05,
  esports_manager:     1.02,
  streaming_sim:       0.95,
  publisher_sim:       0.93,
};

const AUDIENCE_REVENUE_MULT: Record<GameAudience, number> = {
  kids:   0.75,
  teens:  1.00,
  adults: 1.20,
  all:    0.95,
};

const AGE_RATING_MULT: Record<GameAgeRating, number> = {
  E:  0.90,
  T:  1.00,
  M:  1.10,
  AO: 0.80,
};

function getPlatformMult(platform: GamePlatform | undefined, year: number): number {
  if (!platform || platform === "console") return 1.0;
  if (platform === "pc") {
    if (year < 1980) return 0.25;
    if (year < 1990) return 0.60;
    return 0.90;
  }
  // mobile
  if (year < 2007) return 0.05;
  const eraScale = Math.min(1.0, (year - 2007) / 13);
  return 0.55 + eraScale * 0.50;
}

export function calculateGameRevenue(
  project: GameProject,
  gameRevMult: number,
  trendMult: number = 1.0,
  receptionScore?: number
): number {
  // Guard inputs at the source — undefined/NaN budget or quality silently produce
  // NaN which propagates permanently into monthlyRevenue on every released game.
  const budget  = Number.isFinite(project.budget)  ? project.budget  : 0;
  const quality = Number.isFinite(project.quality) ? project.quality : 1;
  const base = budget * 0.5 * (quality / 10);
  const genres = project.genres && project.genres.length > 0 ? project.genres : [project.genre];
  const avgGenreMult = genres.reduce((s, g) => s + (GENRE_REVENUE_MULT[g] ?? 1.0), 0) / Math.max(1, genres.length);
  const synergy = computeGenreSynergy(genres);
  const genreMultiplier = avgGenreMult * synergy;
  const sequelMult = project.sequelRevBonus ?? 1.0;
  const platformMult = getPlatformMult(project.platform, project.launchYear);
  const audienceMult = AUDIENCE_REVENUE_MULT[project.targetAudience ?? "teens"];
  const ageMult = AGE_RATING_MULT[project.ageRating ?? "T"];
  const score = receptionScore ?? project.receptionScore;
  const receptionMult = score !== undefined ? 0.5 + score / 100 : 1.0;
  // Era-based market scaling: game revenue grows with the real-world gaming market.
  // Uses the same multiplier table as console sales (dawn=0.04 → future=1.8).
  // project.launchYear is always set at the call site ({ ...proj, launchYear: year }).
  const eraRevMult = getMarketSizeMultiplier(project.launchYear ?? 2010);
  const monthly = Math.round(
    base * genreMultiplier * (Number.isFinite(gameRevMult) ? gameRevMult : 1) * trendMult * sequelMult * platformMult * audienceMult * ageMult * receptionMult * eraRevMult
  );
  // Final guard: never return NaN — return 0 so the project still releases correctly
  return Number.isFinite(monthly) ? Math.max(0, monthly) : 0;
}

// ── Star-based Revenue ────────────────────────────────────────────────────────
// Replaces budget-based gross revenue. Revenue range is determined by star rating
// and scaled by the era multiplier. Position within the band is driven by quality
// execution factors (score within band, genre synergy, platform, audience).
function calculateStarBasedRevenue(
  stars: number,
  adjustedScore: number,
  project: GameProject,
  year: number
): number {
  // Monthly revenue bands before era scaling
  const STAR_BANDS: Record<number, [number, number]> = {
    1: [0,           300_000],
    2: [300_000,   1_200_000],
    3: [1_200_000, 3_400_000],
    4: [3_400_000, 8_000_000],
    5: [8_000_000, 14_000_000],
  };

  // Era multiplier table – linear interpolation between decade anchors
  const ERA_TABLE: [number, number][] = [
    [1970, 0.28], [1980, 0.42], [1990, 0.60],
    [2000, 0.82], [2010, 1.10], [2020, 1.45],
  ];
  let eraMult = ERA_TABLE[0][1];
  for (let i = 0; i < ERA_TABLE.length - 1; i++) {
    const [y0, m0] = ERA_TABLE[i];
    const [y1, m1] = ERA_TABLE[i + 1];
    if (year >= y0 && year <= y1) {
      eraMult = m0 + (m1 - m0) * ((year - y0) / (y1 - y0));
      break;
    }
    if (year > y1) eraMult = m1;
  }

  const clampedStars = Math.max(1, Math.min(5, Math.round(stars)));
  const [minRev, maxRev] = STAR_BANDS[clampedStars];

  // Score band boundaries matching starsFromScore thresholds
  const SCORE_BANDS: Record<number, [number, number]> = {
    1: [0,  37], 2: [38, 53], 3: [54, 69], 4: [70, 84], 5: [85, 100],
  };
  const [sMin, sMax] = SCORE_BANDS[clampedStars];
  const scorePos = Math.max(0, Math.min(1, (adjustedScore - sMin) / Math.max(1, sMax - sMin)));

  // Execution quality: genre synergy + platform + audience (normalised 0→1)
  const genres = project.genres && project.genres.length > 0 ? project.genres : [project.genre];
  const avgGenreMult = genres.reduce((s, g) => s + (GENRE_REVENUE_MULT[g] ?? 1.0), 0) / Math.max(1, genres.length);
  const synergy     = computeGenreSynergy(genres);
  const platMult    = getPlatformMult(project.platform, year);
  const audMult     = AUDIENCE_REVENUE_MULT[project.targetAudience ?? "teens"];
  const execFactor  = Math.min(2.0, Math.max(0.3, avgGenreMult * synergy * platMult * audMult));
  // Normalise execFactor [0.3 – 2.0] → [0 – 1]
  const execPos     = (execFactor - 0.3) / 1.7;

  // Final band position: 70% score quality, 30% execution
  const qualityPos  = scorePos * 0.70 + execPos * 0.30;
  const baseRev     = minRev + (maxRev - minRev) * qualityPos;

  return Math.round(baseRev * eraMult);
}

// ── News Item ─────────────────────────────────────────────────────────────────
export type NewsItem = {
  id: string;
  year: number;
  month: number;
  category: NewsCategory;
  title: string;
  body: string;
  moneyDelta: number;
  fansDelta: number;
  reputationDelta: number;
  isRead: boolean;
  // Rival attack response — only present on attack news items
  isAttack?: boolean;
  rivalId?: string;                        // id of the rival who attacked
  attackResponse?: "revidar" | "ignorar" | "auto"; // undefined = awaiting player choice; "auto" = resolved by law firm
};

export type CompetitorStyle = "tech_focused" | "mass_market" | "innovation_first" | "safe_profit" | "franchise_focused";

export type CompetitorFinancialHealth = "healthy" | "struggling" | "critical" | "bankrupt";

export type Competitor = {
  id: string;
  name: string;
  icon: string;
  color: string;
  marketShare: number;
  aggressiveness: number;   // 0-100
  lastConsole: string;
  reputation: number;
  style?: CompetitorStyle;
  recentLaunch?: string;
  launchMonthsAgo?: number;
  totalRevenue?: number;
  gamesLaunched?: number;
  // ── RivalCompany fields ───────────────────────────────────────────
  money?: number;           // rival's cash reserves
  innovation?: number;      // 0-100 — quality of rival's products
  alive?: boolean;          // false = went bankrupt
  bankruptYear?: number;    // year they went bankrupt (for display)
  bankruptMonth?: number;
  monthsInDebt?: number;    // consecutive months with negative money
  lastGameMonthIdx?: number; // monthIdx when this rival last released a game
  // ── Extended financial & acquisition fields ────────────────────────
  monthlyRevenue?: number;       // estimated monthly revenue
  marketValue?: number;          // computed company valuation
  financialHealth?: CompetitorFinancialHealth; // healthy/struggling/critical/bankrupt
  crisisMonths?: number;         // consecutive months in distressed state
  acquisitionPrice?: number;     // estimated buyout cost for the player
  isAcquirable?: boolean;        // player can currently attempt to buy
  acquiredByPlayer?: boolean;    // true once player has purchased
  // ── Legendary Revival fields ──────────────────────────────────────────
  revivalPhase?: "rebuilding" | "ascending" | "declined"; // current revival state
  revivalBoostMonths?: number;   // >0 = actively in revival boost period
  // ── Realistic dev cycle ───────────────────────────────────────────────
  nextGameDevDuration?: number;  // planned months for the next/current game in development
};

export const INITIAL_COMPETITORS: Competitor[] = [
  { id: "microcorp", name: "Microcorp", icon: "zap",     color: "#4DA6FF", marketShare: 28, aggressiveness: 70, lastConsole: "XCube Pro",     reputation: 72, style: "tech_focused",      totalRevenue: 5_000_000, gamesLaunched: 3, money: 8_000_000, innovation: 74, alive: true, monthsInDebt: 0 },
  { id: "soryn",     name: "Soryn",     icon: "cpu",     color: "#A855F7", marketShare: 22, aggressiveness: 50, lastConsole: "PlaySphere 5",  reputation: 68, style: "franchise_focused", totalRevenue: 4_200_000, gamesLaunched: 2, money: 6_500_000, innovation: 65, alive: true, monthsInDebt: 0 },
  { id: "nintaro",   name: "Nintaro",   icon: "monitor", color: "#F5A623", marketShare: 15, aggressiveness: 55, lastConsole: "Switcha Max",   reputation: 62, style: "franchise_focused", totalRevenue: 3_100_000, gamesLaunched: 2, money: 3_200_000, innovation: 58, alive: true, monthsInDebt: 0 },
  { id: "segon",     name: "Segon",     icon: "star",    color: "#10B981", marketShare: 10, aggressiveness: 40, lastConsole: "GenexisMini",   reputation: 55, style: "innovation_first",  totalRevenue: 1_800_000, gamesLaunched: 1, money: 2_100_000, innovation: 68, alive: true, monthsInDebt: 0 },
];

// ── Dynamic rival company name generator ──────────────────────────────────────
// Names are generated from phonetic syllable pools to produce original,
// brand-quality identities. No real-company names are used or stored.
const _RIVAL_NAME_HEADS = [
  "Neo", "Eon", "Arc", "Volt", "Apex", "Nova", "Zen", "Prism",
  "Titan", "Vex", "Flux", "Hyper", "Core", "Plex", "Dyn", "Oryx",
  "Cyber", "Syn", "Ion", "Mox", "Axi", "Cron", "Zenn", "Helix",
];
const _RIVAL_NAME_CORES = [
  "soft", "games", "tech", "play", "sys", "forge", "works", "lab",
  "net", "link", "wave", "byte", "form", "craft", "base", "mind",
  "code", "loft", "port", "cast", "arts", "ware", "data", "logic",
];
const _RIVAL_NAME_TAILS = [
  "", "x", "a", "ix", "on", "ex", "ar", "rix", "vox", "an", "ia", "ux", "yn",
];

function _nameRng(seed: number, offset: number): number {
  let x = ((seed + 1) * 1664525 + offset * 1013904223) | 0;
  x = (x ^ (x >>> 15)) | 0;
  x = ((x | 0) * 0x85ebca6b) | 0;
  x = (x ^ (x >>> 13)) | 0;
  return Math.abs(x);
}

function _generateRivalName(seed: number, existingNames: string[]): string {
  for (let attempt = 0; attempt < 80; attempt++) {
    const s = (seed + attempt * 41) & 0xFFFFFF;
    const h = _RIVAL_NAME_HEADS[_nameRng(s, 0) % _RIVAL_NAME_HEADS.length];
    const c = _RIVAL_NAME_CORES[_nameRng(s, 1) % _RIVAL_NAME_CORES.length];
    const t = _RIVAL_NAME_TAILS[_nameRng(s, 2) % _RIVAL_NAME_TAILS.length];
    const name = h + c[0].toUpperCase() + c.slice(1) + t;
    if (!existingNames.includes(name)) return name;
  }
  return `Studio${((seed % 900) + 100).toString()}`;
}

// Console name parts for dynamic rival console generation
const CONSOLE_NAME_PREFIXES = ["Play", "Game", "Neo", "Hyper", "Turbo", "Pixel", "Cyber", "Arc", "Star", "Vibe", "Nova", "Core"];
const CONSOLE_NAME_SUFFIXES = ["Sphere", "Box", "Deck", "Cube", "Wave", "Core", "Link", "Cast", "Pad", "Vista", "One", "Ultra"];
const RIVAL_ICONS   = ["activity", "layers", "globe", "package", "cpu", "monitor", "zap", "star"];
const RIVAL_COLORS  = ["#E11D48", "#8B5CF6", "#06B6D4", "#F97316", "#84CC16", "#EC4899", "#EAB308", "#14B8A6"];
const RIVAL_STYLES: CompetitorStyle[] = ["tech_focused", "mass_market", "innovation_first", "safe_profit", "franchise_focused"];

// ── Rival game name pools by style ─────────────────────────────────────────────
const RIVAL_GAME_NAMES: Record<string, string[]> = {
  tech_focused:       ["NeuralForge", "HyperCore X", "CyberPulse", "QuantumBreach", "SynthWave 2", "CoreLogic", "BinaryDawn", "NexusDrive"],
  mass_market:        ["Super Rally 3", "FunPark World", "Champions Cup", "Party Frenzy", "Beach Blast", "Mega Kart", "Family Quest", "Wild Rush"],
  innovation_first:   ["Dreamscape", "Ethereal", "Echo Paradox", "Liminal", "Solace", "Aperture Dreams", "Refract", "The Fold"],
  safe_profit:        ["Classic Quest IV", "Adventure Run 2", "Empire Builder", "City Legends", "Dungeon Crawl X", "Treasure Hunt 3", "Kingdom Rise"],
  franchise_focused:  ["Battle Heroes 5", "Combat Legends 3", "Strike Force 7", "War Epoch II", "Shadow Ops 4", "Space Saga 6", "Dragon Age 8", "Blade Masters 3"],
};
const RIVAL_GAME_NAMES_DEFAULT = ["Apex Surge", "Inferno Protocol", "Stellar Odyssey", "Chrome Phantom", "Iron Bastion", "Echo Chamber", "Prism Break"];

function getRivalGameName(style: string | undefined, usedNames: Set<string>): string {
  const pool = (style && RIVAL_GAME_NAMES[style]) ? RIVAL_GAME_NAMES[style] : RIVAL_GAME_NAMES_DEFAULT;
  const available = pool.filter(n => !usedNames.has(n));
  const source = available.length > 0 ? available : pool;
  return source[Math.floor(Math.random() * source.length)];
}

export function generateRival(existingNames: string[], spawnYear?: number): Competitor {
  const nameSeed = Math.floor(Math.random() * 0xFFFFFF);
  const name = _generateRivalName(nameSeed, existingNames);

  // Era-aware spawning: rivals entering in later years start stronger
  const eraProgress  = spawnYear ? Math.min(1.0, (spawnYear - 1972) / 40) : 0;
  const innovation   = Math.min(92, Math.floor(Math.random() * 60 + 20 + eraProgress * 22));
  const aggressiveness = Math.floor(Math.random() * 100);
  const money        = Math.floor(Math.random() * 1_000_000 + 500_000 + eraProgress * 4_000_000);
  const marketShare  = Math.random() * 8 + 2 + eraProgress * 5;      // 2-15% in late era
  const startRep     = Math.min(72, Math.floor(Math.random() * 30 + 20 + eraProgress * 22));

  return {
    id:            `rival_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    icon:          RIVAL_ICONS[Math.floor(Math.random() * RIVAL_ICONS.length)],
    color:         RIVAL_COLORS[Math.floor(Math.random() * RIVAL_COLORS.length)],
    marketShare:   Math.round(marketShare * 10) / 10,
    aggressiveness,
    lastConsole:   (() => {
      const pre = CONSOLE_NAME_PREFIXES[Math.floor(Math.random() * CONSOLE_NAME_PREFIXES.length)];
      const suf = CONSOLE_NAME_SUFFIXES[Math.floor(Math.random() * CONSOLE_NAME_SUFFIXES.length)];
      const num = Math.random() < 0.5 ? ` ${Math.floor(Math.random() * 4) + 2}` : "";
      return `${pre}${suf}${num}`;
    })(),
    reputation:    startRep,
    style:         RIVAL_STYLES[Math.floor(Math.random() * RIVAL_STYLES.length)],
    totalRevenue:  0,
    gamesLaunched: 0,
    money,
    innovation,
    alive:         true,
    monthsInDebt:  0,
  };
}

// ── AI Era Evolution factor ───────────────────────────────────────────────────
// Returns a 0.0→1.0 value representing how sophisticated AI behavior is in a
// given year. Applied as an additive layer on top of all existing AI formulas —
// nothing in the existing simulation is replaced, only scaled.
//   0.0 (1972): raw, inefficient, prone to bad decisions
//   0.5 (2001): balanced, competitive but still fallible
//   1.0 (2030): sharp but deliberately imperfect (controlled variance preserved)
export function getAIEraFactor(year: number): number {
  return Math.min(1.0, Math.max(0.0, (year - 1972) / 58));
}

// ── Rival market value formula ────────────────────────────────────────────────
// marketValue = (cash × 0.4) + (annual_revenue × 1.8) + (rep × $25k) + (share × $350k) + (innovation × $12k)
export function computeRivalMarketValue(c: Competitor): number {
  const cash = Math.max(0, c.money ?? 0);
  const monthly = c.monthlyRevenue ?? ((c.marketShare ?? 5) * 75_000);
  const annual = monthly * 12;
  const rep = (c.reputation ?? 50);
  const innov = (c.innovation ?? 50);
  const share = (c.marketShare ?? 5);
  return Math.max(0, Math.round(
    cash * 0.4 +
    annual * 1.8 +
    rep * 25_000 +
    share * 350_000 +
    innov * 12_000,
  ));
}

// ── Franchise System ──────────────────────────────────────────────────────────
export type Franchise = {
  id: string;          // root game id (first game in series)
  name: string;        // franchise name
  totalGames: number;
  avgScore: number;    // 0-100
  totalRevenue: number;
  fanDemand: number;   // 0-100 — how much fans want a sequel
  fatigueLevel: number; // 0-100 — too many bad sequels = fatigue
  awardsWon: number;
  lastGameYear: number;
  lastGameScore: number;
};

// ── Revenue History (sampled quarterly for charts) ────────────────────────────
export type RevenuePoint = {
  year: number;
  month: number;
  revenue: number;
  gameRevenue: number;
  consoleRevenue: number;
  reputation: number;
  fans: number;
};

// ── Achievement Record (unlocked state) ──────────────────────────────────────
export type AchievementRecord = {
  id: string;
  unlockedYear: number;
  unlockedMonth: number;
};

export type ActiveGameState = {
  saveId: string;
  companyName: string;
  year: number;
  month: number;
  money: number;
  fans: number;
  reputation: number;
  consoles: GameConsole[];
  offices: Offices;
  activeMarketing: MarketingTier;
  marketingMonthsLeft: number;
  news: NewsItem[];
  competitors: Competitor[];
  totalRevenue: number;
  marketShare: number;
  victoryMode: "sandbox" | "goals";
  selectedGoals: string[];
  difficulty: string;
  world: string;
  startingMoney: number;
  employees: Employee[];
  gameProjects: GameProject[];
  researchedNodes: string[];
  currentResearch: string | null;
  researchMonthsLeft: number;
  firedHistoricalEvents: string[];
  // Global market expansion
  unlockedCountries: string[];
  branches: CountryBranch[];
  // Financial system
  activeLoans: ActiveLoan[];
  creditRating: CreditRating;
  totalLoansPaid: number;
  // Stock market & ownership system
  totalShares: number;
  playerShares: number;
  investors: Investor[];
  pendingOffers: InvestorOffer[];
  companyValue: number;
  sharePrice: number;
  acquisitions: Acquisition[];
  // Sponsorship investment opportunities
  sponsorshipOpportunities?: SponsorshipOpportunity[];
  // Active sell listings (player-initiated, investors bid on these)
  stockListings?: StockListing[];
  // Share price history (last 24 data points)
  stockPriceHistory?: StockPricePoint[];
  // Dynamic tax system: per-country active tax events
  countryTaxModifiers?: Record<string, TaxModifier>;
  // Character selection
  characterId: string;
  // Home country (chosen at game start)
  homeCountry?: string;
  // Founder attribute modifiers — computed once at game start from founderAttrs
  founderModifiers?: FounderModifiers;
  // Trophy / awards gallery
  trophies?: Trophy[];
  // ── New advanced systems (v4) ─────────────────────────────────────────────
  // 3-Part Reputation
  techRep?: number;         // 0-100
  commercialRep?: number;   // 0-100
  fanRep?: number;          // 0-100
  // Dynamic events
  dynamicEventHistory?: string[];  // list of event ids fired (for cooldown tracking)
  // Temp buffs from events (cleared monthly)
  tempBugRiskBonus?: number;       // additive to bug risk (can be negative)
  tempDevSpeedBonus?: number;      // additive to devSpeed multiplier
  tempMarketDemandMult?: number;   // multiplies market revenue
  tempBonusMonthsLeft?: number;    // how many months temp effects last
  // Franchise system
  franchises?: Franchise[];
  // Achievements
  unlockedAchievements?: AchievementRecord[];
  // Revenue history for charts
  revenueHistory?: RevenuePoint[];
  // Near-failure tracking
  nearFailureCount?: number;       // times money went below $50K
  recoveredFromCrisis?: boolean;
  // Rival attack cooldown: absolute month index (year*12+month) when next attack is allowed
  nextRivalAttackMonth?: number;
  // Cooldown gate for random dynamic economy/tech/media events (4-8 month gap enforced)
  nextDynEventMonthIdx?: number;
  // Cooldown gate for rival product/struggle/milestone news events (separate from attacks)
  nextRivalEventMonthIdx?: number;
  // Cooldown gate for random world/market news (2-4 month minimum gap to reduce spam)
  nextRandomNewsMonthIdx?: number;
  // Category-level cooldown map: records the last absolute monthIdx each validation category fired.
  // Enforced across all event systems (scandal, dynamic, influencer) to prevent category spam.
  eventCategoryLastMonthIdx?: Record<string, number>;
  // ── Player offensive attack system ────────────────────────────────────────
  playerAttackCooldowns?: Partial<Record<import("./playerAttacks").PlayerAttackType, number>>; // absolute monthIdx per attack type
  pendingCounterAttacks?: import("./playerAttacks").PendingCounterAttack[];
  // ── Scandal / Media / Influencer system (v5) ──────────────────────────────
  activeScandals?: ActiveScandal[];     // scandals pending response OR escalation tracking
  scandalHistory?: string[];            // scandal IDs that have fired (prevents repeats)
  pendingInfluencers?: InfluencerEvent[]; // passive random influencer events (drain monthly)
  hiredInfluencers?: HiredInfluencer[]; // player-hired influencer campaigns (active)
  mediaPrestige?: number;               // 0-100, affects media coverage positively
  // Era upgrade system (dynamic non-linear upgrades)
  eraUpgradeUnlocked?: string[];
  eraUpgradeAvailable?: string[];
  // Revenue formula diagnostics (updated every tick, shown in UI)
  companyEfficiency?: number;     // 0.10–2.0  eficienciaEmpresa  (last tick)
  avgMarketSaturation?: number;   // 0.0–0.72  avg saturacaoMercado across released games (last tick)
  // Fan type breakdown (sum = fans; persisted for display and decay logic)
  fanBreakdown?: { casual: number; loyal: number; critical: number };
  // Shadow Investor system
  shadowInvestor?: ShadowInvestorState;
  // ── Financial history (monthly snapshots, last 24 months) ─────────────────
  financialHistory?: FinancialSnapshot[];
  // Running total of operating expenses (for accumulated balance sheet)
  totalExpensesAccum?: number;
  // ── Shareholder Satisfaction system ───────────────────────────────────────
  shareholderSatisfaction?: number;         // 0-100; only meaningful when investors.length > 0
  lastShareholderMeetingMonthIdx?: number;  // year*12+month of last meeting
  shareholderPromisePending?: boolean;      // player promised growth — penalised if unprofitable next month
  localHoldings?: string[];                 // strategic subsidiary company IDs owned by the player
  // ── Legal Contract system ──────────────────────────────────────────────────
  legalContract?: LegalContract;            // active legal protection contract (null = no contract)
  // ── Strategy options (positioning + campaign focus) ────────────────────────
  activeStrategyOptions?: ActiveStrategyOption[];
  // ── Financial Rescue System ───────────────────────────────────────────────
  rescueOffer?: RescueOfferState;           // pending rescue offer terms (nil = no pending offer)
  rescueContract?: ActiveRescueContract;    // active rescue deal in force
  // ── Office Capacity System ────────────────────────────────────────────────
  officeLevel?: number;                     // 1–8; each level adds +10 employee capacity slots
  // ── Geopolitical Shareholder Conflict ─────────────────────────────────────
  geoConflictNegotiationMonthsLeft?: number; // >0 = active negotiation (halved effects)
  // ── Global Economic Events ────────────────────────────────────────────────
  activeGlobalEvent?:    string | null;   // id of currently active global event (null = none)
  eventRemainingMonths?: number;          // months left before event expires
};

// Re-export conflict types for use in UI and context
export type { ConflictLevel, GeoConflictPair };
export { detectInvestorConflicts, getMaxConflictLevel, getConflictNegotiationCost };

// ─────────────────────────────────────────────────────────────────────────────
// STRATEGY OPTION TYPES
// ─────────────────────────────────────────────────────────────────────────────
export type StrategyCategory = "positioning" | "focus";
export type ActiveStrategyOption = {
  id: string;
  category: StrategyCategory;
  startMonthIdx: number;
  endMonthIdx: number;
};
export const STRATEGY_OPTION_DURATION_MONTHS = 24; // 2 in-game years

export type LegalTierId = "basico" | "profissional" | "elite";
export type LegalContract = {
  tierId: LegalTierId;
  startMonthIdx: number;    // year*12+month when contract was signed
  endMonthIdx: number;      // year*12+month when contract expires
  renewalPending?: boolean; // true once expiry news has been fired (prevents duplicate news)
};

export const LEGAL_CONTRACT_DURATIONS: Record<LegalTierId, number> = {
  basico:        120, // 10 years
  profissional:  144, // 12 years
  elite:         180, // 15 years
};
export const LEGAL_CONTRACT_MONTHLY_COST: Record<LegalTierId, number> = {
  basico:        25_000,
  profissional:  75_000,
  elite:        150_000,
};
export const LEGAL_CONTRACT_PROTECTION: Record<LegalTierId, number> = {
  basico:        0.20, // 20% reduction
  profissional:  0.40, // 40% reduction
  elite:         0.70, // 70% reduction
};

// ─────────────────────────────────────────────────────────────────────────────
// SHADOW INVESTOR TYPES
// ─────────────────────────────────────────────────────────────────────────────
export type ShadowDealType = "equity" | "debt" | "performance";
export type ShadowInvestorState = {
  pending: boolean;                 // waiting for player response
  collectionDue: boolean;          // follow-up collection event waiting
  dealType: ShadowDealType | null; // which deal was accepted
  bailoutAmount: number;           // amount injected
  debtAmount: number;              // for debt deal: amount to repay (bailout * 1.3)
  equityPercent: number;           // for equity deal: share % taken
  equityDrainPerMonth: number;     // for equity deal: monthly cash drain
  performanceMonthsLeft: number;   // for performance deal: months remaining
  cooldownUntilMonthIdx: number;   // year*12+month — no new offer before this
  usedCount: number;               // how many times player has accepted
  collectionTitle: string;         // title for collection event
};

// ─────────────────────────────────────────────────────────────────────────────
// FINANCIAL RESCUE SYSTEM TYPES
// ─────────────────────────────────────────────────────────────────────────────
export type RescueDealType = "bank" | "investor_equity" | "investor_revenue";

export type BankRescueContract = {
  dealType: "bank";
  amount: number;
  totalOwed: number;
  monthlyPayment: number;
  monthsTotal: number;
  monthsRemaining: number;
  missedPayments: number;
  collateralBranchIds: string[];
  collateralGameIds: string[];
  seized: boolean;
};
export type InvestorEquityRescueContract = {
  dealType: "investor_equity";
  amount: number;
  equityPercent: number;
  monthlyDrain: number;
};
export type InvestorRevenueRescueContract = {
  dealType: "investor_revenue";
  amount: number;
  revenueSharePercent: number;
  totalOwed: number;
  amountRepaid: number;
};
export type ActiveRescueContract =
  | BankRescueContract
  | InvestorEquityRescueContract
  | InvestorRevenueRescueContract;

export type RescueOfferState = {
  pending: boolean;
  amount: number;
  bankMonthlyPayment: number;
  bankTotalOwed: number;
  bankMonths: number;
  investorEquityPercent: number;
  investorEquityDrain: number;
  investorRevSharePercent: number;
  investorRevShareOwed: number;
  cooldownUntilMonthIdx: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// SCANDAL STATE TYPES (persisted in ActiveGameState)
// ─────────────────────────────────────────────────────────────────────────────
export type ActiveScandal = {
  scandalId: string;          // id from ScandalDef
  startYear: number;
  startMonth: number;
  resolved: boolean;          // player has chosen an option
  resolvedOptionId?: string;
  escalationChance: number;   // 0-1, updated by player choices
  monthsActive: number;
  hasEscalated: boolean;
  futureRepRisk?: number;     // 0-1 probability of backlash in later months
  futureRepRiskMonthsLeft?: number;
};

// Re-export for components
export type { ScandalDef, ScandalOption, InfluencerEvent, HiredInfluencer };

export type TrophyCategory = "game" | "console" | "company";

export type Trophy = {
  id: string;
  title: string;
  year: number;
  product: string;
  rank: number;        // 1, 2, or 3
  prizeUSD: number;
  category: TrophyCategory;
};

export type MonthSummary = {
  officeCost: number;
  adminSaving: number;
  consoleSales: number;
  consoleRevenue: number;
  salaryCost: number;
  maintenanceCost: number;
  netChange: number;
  newNews: NewsItem | null;
  monthlyDividend: number;
  newlyReleasedGames?: GameProject[];
  newlyUnlockedAchievements?: AchievementDef[];
};

// ── Financial history snapshot (recorded every month) ────────────────────────
export type FinancialSnapshot = {
  year: number;
  month: number;
  revenue: number;    // gross revenue: consoles + games + global market + acquisitions
  expenses: number;   // core operating expenses: offices + salaries + maintenance + overhead + branches + loans
  profit: number;     // revenue − expenses (pre-tax operating result)
  cash: number;       // cash balance at end of month after all deductions
};

// Console maintenance cost per month (percentage of production cost)
export const CONSOLE_MAINTENANCE_RATE: Record<ConsolePower, number> = {
  low:    0.005, // 0.5% of production cost per month
  medium: 0.008, // 0.8%
  high:   0.012, // 1.2%
};

// Base monthly overhead: utilities, rent, misc (scales with company activity)
export function getBaseOverhead(state: ActiveGameState): number {
  const activeConsoles = state.consoles.filter((c) => !c.isDiscontinued).length;
  const empCount = (state.employees ?? []).length;
  if (activeConsoles === 0 && empCount === 0) return 0; // pre-launch: no overhead
  const base = 2_000; // minimal overhead once company is active
  const perConsole = activeConsoles * 1_500;
  const perEmployee = empCount * 500;
  return base + perConsole + perEmployee;
}

export function createInitialGameState(save: {
  id: string;
  companyName: string;
  year: number;
  money: number;
  difficulty: string;
  world: string;
  victoryMode: "sandbox" | "goals";
  selectedGoals: string[];
  startingMoney: number;
  characterId?: string;
  homeCountry?: string;
  founderAttrs?: number[];
}): ActiveGameState {
  return {
    saveId: save.id,
    companyName: save.companyName,
    year: save.year,
    month: 1,
    money: save.money,
    fans: 0,
    fanBreakdown: { casual: 0, loyal: 0, critical: 0 },
    reputation: 1,
    consoles: [],
    offices: { design: 0, marketing: 0, tech: 0, admin: 0, security: 0, executive: 0, research_lab: 0, testing: 0 },
    activeMarketing: "none",
    marketingMonthsLeft: 0,
    news: [
      {
        id: "welcome",
        year: save.year,
        month: 1,
        category: "growth",
        title: `${save.companyName} entra no mercado`,
        body: `Em ${save.year}, o mercado de games está nascendo. A Atrion domina as arcades. É sua hora de construir o próximo grande império tecnológico.`,
        moneyDelta: 0,
        fansDelta: 0,
        reputationDelta: 0,
        isRead: false,
      },
    ],
    competitors: INITIAL_COMPETITORS,
    totalRevenue: 0,
    marketShare: 0,
    victoryMode: save.victoryMode,
    selectedGoals: save.selectedGoals,
    difficulty: save.difficulty,
    world: save.world,
    startingMoney: save.startingMoney,
    employees: [],
    gameProjects: [],
    researchedNodes: [],
    currentResearch: null,
    researchMonthsLeft: 0,
    firedHistoricalEvents: [],
    homeCountry: save.homeCountry ?? "usa",
    founderModifiers: save.founderAttrs ? getFounderModifiers(save.founderAttrs) : undefined,
    unlockedCountries: [save.homeCountry ?? "usa"],
    branches: [],
    activeLoans: [],
    creditRating: "BBB",
    totalLoansPaid: 0,
    totalShares: TOTAL_SHARES,
    playerShares: TOTAL_SHARES,
    investors: [],
    pendingOffers: [],
    companyValue: 0,
    sharePrice: 0,
    acquisitions: [],
    sponsorshipOpportunities: [],
    stockListings: [],
    stockPriceHistory: [],
    countryTaxModifiers: {},
    characterId: save.characterId ?? "strategist",
    trophies: [],
    eraUpgradeUnlocked: [],
    eraUpgradeAvailable: getInitialAvailableUpgrades(),
  };
}

// ── Stock market & acquisition unlock thresholds ──────────────────────────────
// These are the single source of truth used by both the engine and the UI.

export const STOCK_MARKET_UNLOCK = {
  minYear:        1977,
  minValue:       2_000_000,   // company valuation
  minReputation:  25,
} as const;

export const ACQUISITIONS_UNLOCK = {
  minYear:  1975,
  minValue: 800_000,           // company valuation
} as const;

export function isStockMarketUnlocked(state: ActiveGameState): boolean {
  return (
    state.year >= STOCK_MARKET_UNLOCK.minYear &&
    (state.companyValue ?? 0) >= STOCK_MARKET_UNLOCK.minValue &&
    state.reputation >= STOCK_MARKET_UNLOCK.minReputation
  );
}

export function isAcquisitionsUnlocked(state: ActiveGameState): boolean {
  return (
    state.year >= ACQUISITIONS_UNLOCK.minYear &&
    (state.companyValue ?? 0) >= ACQUISITIONS_UNLOCK.minValue
  );
}

export function calculateConsoleRating(
  power: ConsolePower,
  memoryGB: number,
  quality: number,
  year: number,
  techLevel: number
): number {
  const powerScore = ({ low: 2.5, medium: 5, high: 8 } as Record<string, number>)[power] ?? 2.5;
  // Use historically accurate expected memory for the current year
  const expectedMemory = getExpectedMemoryGB(year);
  // Guard memoryGB before division — if undefined/NaN (old save field), memScore becomes 0 not NaN
  const safeMem = Number.isFinite(memoryGB) ? memoryGB : 0;
  const memScore = Math.min(safeMem / Math.max(0.0001, expectedMemory), 2) * 3;
  const qualityScore = (Number.isFinite(quality) ? quality : 5) * 0.8;
  const techBonus = (Number.isFinite(techLevel) ? techLevel : 0) * 0.4;
  const raw = (powerScore + memScore + qualityScore + techBonus) / 2.8;
  const result = Math.round(raw * 10) / 10;
  return Number.isFinite(result) ? Math.max(1, Math.min(10, result)) : 5;
}

export function suggestPrice(
  productionCost: number,
  quality: number,
  power: ConsolePower
): number {
  const mult = { low: 1.6, medium: 2.4, high: 3.8 }[power];
  const raw = productionCost * mult * (1 + quality * 0.06);
  return Math.round(raw / 10) * 10;
}

// ── Fan Tier System ──────────────────────────────────────────────────────────
// Six tiers that gate brand-recognition bonuses.
// salesBoostMult — extra multiplier applied to marketBase in calculateMonthlySales
// mktEffMult     — multiplied with marketingBoost in advanceMonth
// repBonus       — flat rep/month added at major+ (prestige effect)
export const FAN_TIERS = [
  { id: "unknown",  label: "Desconhecida",    min: 0,          max: 1_000,      salesBoostMult: 0.80, mktEffMult: 0.65, repBonus: 0 },
  { id: "small",    label: "Pequena",          min: 1_000,      max: 10_000,     salesBoostMult: 0.90, mktEffMult: 0.80, repBonus: 0 },
  { id: "growing",  label: "Em Crescimento",   min: 10_000,     max: 100_000,    salesBoostMult: 1.00, mktEffMult: 1.00, repBonus: 0 },
  { id: "popular",  label: "Popular",          min: 100_000,    max: 1_000_000,  salesBoostMult: 1.18, mktEffMult: 1.20, repBonus: 0.05 },
  { id: "major",    label: "Grande",           min: 1_000_000,  max: 10_000_000, salesBoostMult: 1.40, mktEffMult: 1.40, repBonus: 0.10 },
  { id: "global",   label: "Global",           min: 10_000_000, max: Infinity,   salesBoostMult: 1.65, mktEffMult: 1.60, repBonus: 0.15 },
] as const;

export type FanTierId = (typeof FAN_TIERS)[number]["id"];
export type FanTier   = (typeof FAN_TIERS)[number];

export function getFanTier(fans: number): FanTier {
  for (let i = FAN_TIERS.length - 1; i >= 0; i--) {
    if (fans >= FAN_TIERS[i].min) return FAN_TIERS[i];
  }
  return FAN_TIERS[0];
}

export function calculateMonthlySales(
  console: GameConsole,
  state: ActiveGameState,
  marketingBoost: number
): number {
  // Production paused — no sales this month
  if (console.isProductionPaused) return 0;

  const ageMonths =
    (state.year - console.launchYear) * 12 + state.month - console.launchMonth;
  if (ageMonths < 0) return 0;
  // ageFactor is computed below, after qualityFactor is known (quality affects lifespan)
  // ── Category + era-aware pricing ──────────────────────────────────
  const cat = console.category ?? "standard";
  const priceFeedback = getConsolePriceFeedback(console.price, cat, state.year);
  const catDef = getConsoleCategoryById(cat);
  // demandMult: 0 if price is invalid (blocked at launch), otherwise 0.30–1.1
  const priceIndex = Math.max(0.05, priceFeedback.demandMult);
  // categoryVolumeMult: standard=1.0, premium=0.55, collector=0.08
  const categoryVolumeMult = catDef.salesVolumeMult;

  // Fan tier brand recognition: bigger fanbases sell hardware faster
  // Guard state.fans — calculateMonthlySales receives the original state object, not
  // the locally-guarded `fans` variable, so it must be hardened independently.
  const safeFans = Number.isFinite(state.fans) ? Math.max(0, state.fans) : 0;
  const fanTier = getFanTier(safeFans);
  const marketBase = (5_000 + safeFans * 0.005) * fanTier.salesBoostMult;
  const designBonus = 1 + state.offices.design * 0.15;
  const mktOfficeBonus = 1 + state.offices.marketing * 0.12;
  const diffMult =
    state.difficulty === "easy" ? 1.4
    : state.difficulty === "hard" ? 0.75
    : state.difficulty === "legendary" ? 0.5
    : 1.0;
  // Era market size — sales scale with the historical gaming market growth
  const eraMult = getMarketSizeMultiplier(state.year);

  // ── Quality-driven sales blend ─────────────────────────────────────
  // quality is 0-10 scale → normalise to 0-1.
  // popularity and reputation are both 0-100 → normalise to 0-1.
  const qualityFactor     = (Number.isFinite(console.quality)    ? console.quality    : 5) / 10;
  const popularityFactor  = (Number.isFinite(console.popularity) ? console.popularity : 10) / 100;
  const reputationFactor  = (Number.isFinite(state.reputation)   ? state.reputation   : 0) / 100;

  let blendedFactor = 0.5 * qualityFactor + 0.3 * popularityFactor + 0.2 * reputationFactor;

  // Low-quality penalties: poor hardware sells badly even with marketing/fans
  if (console.quality < 4)   blendedFactor *= 0.5;  // quality < 40 %
  if (console.quality < 2.5) blendedFactor *= 0.2;  // quality < 25 % (stacks)

  // ── Dynamic pricing: quality-vs-price interaction ─────────────────────────────
  // suggestedPrice is set at build time as ~3.5× productionCost.
  // Pricing strategy affects tolerances:
  //   "premium" → overpricing tolerance extends to qualityFactor < 0.40 threshold
  //   "budget"  → discount volume boost is amplified
  //   "balanced" / default → base behaviour
  const _sugg = console.suggestedPrice ?? Math.max(1, Math.round(console.productionCost * 3.5));
  if (_sugg > 0 && console.price > 0) {
    const _pRatio  = console.price / _sugg;          // 1.0 = exactly suggested
    const _isPrem  = console.pricingStrategy === "premium";
    const _isBudg  = console.pricingStrategy === "budget";
    const _qualThr = _isPrem ? 0.40 : 0.50;          // quality threshold for overprice penalty

    if (_pRatio > 1.0 && qualityFactor < _qualThr) {
      // Overpriced relative to quality → heavy sales penalty
      const _overcharge   = _pRatio - 1.0;
      const _qualDef      = _qualThr - qualityFactor;
      const _penaltyStrength = _isPrem ? 4.0 : 6.0;  // premium slightly less harsh
      blendedFactor *= Math.max(0.05, 1 - _overcharge * _qualDef * _penaltyStrength);
    } else if (_pRatio < 0.85) {
      // Discounted price → volume boost
      const _discountDepth = 0.85 - _pRatio;
      const _boostStr      = _isBudg ? 2.2 : 1.5;   // budget strategy amplifies volume
      blendedFactor *= Math.min(1.4, 1.0 + _discountDepth * _boostStr);
    }
  }

  // ── Relaunch sales boost (if applicable) ─────────────────────────────────────
  if ((console.relaunchBonusMonthsLeft ?? 0) > 0) {
    blendedFactor *= 1.30;  // +30% sales during post-relaunch window
  }

  // ── Hype, launch curve & decay ────────────────────────────────────────────────
  // hypeScore (0–1): excitement at launch driven by quality, reputation, and marketing
  const mktHypeBonus = Math.min(1.0, (marketingBoost - 1.0) / 0.9);
  const hypeScore = Math.min(1.0,
    0.50 * qualityFactor + 0.30 * reputationFactor + 0.20 * mktHypeBonus
  );
  // Launch window: first 4 months get a hype-driven sales spike (up to +50%), fading linearly
  const launchWindowMult = ageMonths < 4
    ? 1.0 + hypeScore * 0.5 * ((4 - ageMonths) / 4)
    : 1.0;
  // Quality-dependent decay lifespan: poor hardware fades faster (30–48 months)
  const decayLifespan = 30 + qualityFactor * 18;
  const ageFactor = Math.max(0, 1 - ageMonths / decayLifespan);
  // Flop penalty: products with low hype sell poorly even with good marketing/fans
  // hype < 0.30 → penalty 0.50–1.00; hype >= 0.30 → no penalty
  const flopPenalty = hypeScore < 0.30 ? 0.50 + hypeScore * (5 / 3) : 1.0;
  // Small random variance: ±12% so launches feel distinct and not perfectly predictable
  const randomVariance = 0.88 + Math.random() * 0.24;

  let sales =
    marketBase *
    blendedFactor *
    ageFactor *
    launchWindowMult *
    flopPenalty *
    randomVariance *
    priceIndex *
    categoryVolumeMult *
    marketingBoost *
    designBonus *
    mktOfficeBonus *
    diffMult *
    eraMult;
  const result = Math.round(sales);
  return Number.isFinite(result) ? Math.max(0, result) : 0;
}

/**
 * limiteGlobal — historical gaming market size (in-game USD).
 * Grows era by era, reflecting the real-world expansion of the games industry.
 * saturacaoMercado = patrimonio / limiteGlobal  (0 → 0.80)
 */
export function getGlobalMarketLimit(year: number): number {
  if (year < 1978) return    150_000_000;   // $150M  — pre-Atrion cottage industry
  if (year < 1983) return    600_000_000;   // $600M  — Atrion boom
  if (year < 1987) return  1_500_000_000;   // $1.5B  — NES era launches
  if (year < 1992) return  4_000_000_000;   // $4B    — 16-bit era
  if (year < 1997) return  9_000_000_000;   // $9B    — 3D revolution (PS1/N64)
  if (year < 2002) return 18_000_000_000;   // $18B   — PS2 golden age
  if (year < 2007) return 30_000_000_000;   // $30B   — online gaming takes off
  if (year < 2012) return 50_000_000_000;   // $50B   — mobile + HD consoles
  if (year < 2017) return 90_000_000_000;   // $90B   — smartphone explosion
  if (year < 2022) return 160_000_000_000;  // $160B  — streaming + esports
  return                  220_000_000_000;   // $220B  — 2022+
}

export function advanceMonth(state: ActiveGameState): {
  newState: ActiveGameState;
  summary: MonthSummary;
} {
  const year  = state.year;
  const month = state.month;

  // ── Root variable safety ─────────────────────────────────────────────────────
  // Guard ALL three root variables before any calculation happens.
  // If any of these are NaN (from old saves, corrupted state, or a prior bug),
  // every single downstream arithmetic operation this tick will also be NaN.
  // Clamping here is the single most impactful fix in the entire codebase.
  let money      = Number.isFinite(state.money)      ? state.money      : 0;
  let fans       = Number.isFinite(state.fans)        ? state.fans       : 0;
  let reputation = Number.isFinite(state.reputation)  ? state.reputation : 1;

  // ── Fan type locals (casual · loyal · critical) ───────────────────────────
  // Reconcile breakdown with fans at start of tick — scandals/events may have
  // changed `fans` directly last tick without touching the stored breakdown.
  // We scale proportionally so the breakdown sum always equals fans.
  let fanCasual   = 0;
  let fanLoyal    = 0;
  let fanCritical = 0;
  {
    const bd = state.fanBreakdown ?? {
      casual:   Math.round(fans * 0.70),
      loyal:    Math.round(fans * 0.25),
      critical: Math.round(fans * 0.05),
    };
    const bdTotal = bd.casual + bd.loyal + bd.critical;
    const ratio   = bdTotal > 0 ? fans / bdTotal : 1;
    fanCasual   = Math.round(bd.casual   * ratio);
    fanLoyal    = Math.round(bd.loyal    * ratio);
    fanCritical = Math.max(0, fans - fanCasual - fanLoyal);
  }

  // ── Fan-scaled reputation difficulty ─────────────────────────────────────────
  // The more fans you have, the harder it is to gain reputation (higher scrutiny).
  // Positive rep gains are multiplied by this factor; losses are unaffected.
  // Formula: 1 / (1 + fans / 20_000) → 0 fans=1.0×, 20K=0.50×, 100K=0.17×, min 0.05×
  // Steeper slope than before — reputation must be earned at all fan sizes
  // Use the locally-guarded `fans` variable (not state.fans) to avoid NaN propagation
  const fanRepScale = Math.max(0.05, 1 / (1 + fans / 20_000));

  // ── v4: 3-Part Reputation (carry forward with safe defaults) ─────────────────
  // Use locally-guarded `reputation` (not state.reputation) for NaN-safe fallbacks
  let techRep        = Number.isFinite(state.techRep)       ? state.techRep!       : Math.round(reputation * 0.6);
  let commercialRep  = Number.isFinite(state.commercialRep) ? state.commercialRep! : Math.round(reputation * 0.6);
  let fanRep         = Number.isFinite(state.fanRep)        ? state.fanRep!        : Math.round(reputation * 0.6);

  // ── v4: Apply persistent temp effects from previous dynamic events ─────────────
  let tempBugRiskBonus    = state.tempBugRiskBonus    ?? 0;
  let tempDevSpeedBonus   = state.tempDevSpeedBonus   ?? 0;
  let tempMarketDemandMult= state.tempMarketDemandMult ?? 1.0;
  let tempBonusMonthsLeft = state.tempBonusMonthsLeft ?? 0;
  if (tempBonusMonthsLeft > 0) {
    tempBonusMonthsLeft--;
    if (tempBonusMonthsLeft <= 0) {
      tempBugRiskBonus = 0;
      tempDevSpeedBonus = 0;
      tempMarketDemandMult = 1.0;
    }
  } else {
    tempBugRiskBonus = 0;
    tempDevSpeedBonus = 0;
    tempMarketDemandMult = 1.0;
  }

  // ── Local Holdings (strategic subsidiaries owned by the player) ────────────────
  const localHoldings = state.localHoldings ?? [];

  // ── Global Economic Event — resolve active modifiers ──────────────────────────
  const _activeEvtId   = state.activeGlobalEvent ?? null;
  const _activeEvt: GlobalEvent | null = _activeEvtId
    ? (GLOBAL_EVENTS.find(e => e.id === _activeEvtId) ?? null)
    : null;
  // Apply holdings mitigation to negative effects only
  const _hasInsurance = localHoldings.includes("shieldguard_insurance");
  const _hasBank      = localHoldings.includes("investment_bank") || localHoldings.includes("apex_global_bank");
  const _hasMktHolding = localHoldings.includes("pulse_marketing_group") || localHoldings.includes("media_network");
  function _mitigate(val: number, type: "income" | "marketing" | "other"): number {
    if (val >= 0) return val;
    let m = 1.0;
    if (_hasInsurance) m *= 0.70;                       // ShieldGuard: 30% reduction
    if (type === "income" && _hasBank) m *= 0.80;        // Bank: further 20% income reduction
    if (type === "marketing" && _hasMktHolding) m *= 0.80; // Mkt: further 20% marketing reduction
    return val * m;
  }
  const gev = {
    researchSpeed:       _mitigate(_activeEvt?.effect?.researchSpeed       ?? 0, "other"),
    marketingEfficiency: _mitigate(_activeEvt?.effect?.marketingEfficiency ?? 0, "marketing"),
    productQuality:      _mitigate(_activeEvt?.effect?.productQuality      ?? 0, "other"),
    sales:               _mitigate(_activeEvt?.effect?.sales               ?? 0, "other"),
    income:              _mitigate(_activeEvt?.effect?.income              ?? 0, "income"),
  };

  // ── v4: Near-failure tracking ─────────────────────────────────────────────────
  let nearFailureCount = state.nearFailureCount ?? 0;
  if (money < 50_000) nearFailureCount++;
  let recoveredFromCrisis = state.recoveredFromCrisis ?? false;
  if (!recoveredFromCrisis && nearFailureCount >= 1 && money >= 500_000) {
    recoveredFromCrisis = true;
  }

  // ── v4: Increment employee months worked ──────────────────────────────────────
  const updatedEmployees = (state.employees ?? []).map((e) => ({
    ...e,
    monthsWorked: (e.monthsWorked ?? 0) + 1,
  }));

  // ── Research bonuses ────────────────────────────────────────────────────────
  const researchBonuses = computePassiveBonuses(state.researchedNodes ?? []);
  const eraBonuses = computeEraUpgradeBonuses(state.eraUpgradeUnlocked ?? []);
  const empBonuses = computeEmployeeBonuses(state.employees ?? [], year);
  // ── Office bonuses (new 8-sector system) ─────────────────────────────────────
  const officeBonuses = computeAllOfficeBonuses(state.offices);

  // ── Company specialization identity (used throughout tick) ───────────────────
  // Scores are computed from raw research nodes (same source as computePassiveBonuses).
  // These drive spec-specific mechanics beyond the generic bonus multipliers.
  const specScores = computeSpecialization(state.researchedNodes ?? []);
  const hwSpecLevel   = getSpecLevel(specScores.hardware);   // 0-3: hardware longevity
  const onlineSpecLevel = getSpecLevel(specScores.online);   // 0-3: online revenue tail
  const gamesSpecLevel  = getSpecLevel(specScores.games);    // 0-3: game rev acceleration

  // ── Character bonuses ─────────────────────────────────────────────────────────
  const charBonuses = getCharacterById(state.characterId ?? "strategist")?.bonuses ?? DEFAULT_CHARACTER_BONUSES;
  // Founder influence — fixed snapshot computed at game start, never changes mid-session
  const fm = state.founderModifiers ?? { productQuality: 0, researchSpeed: 0, marketingEfficiency: 0 };

  // ── Branch type bonuses (computed early for use in combined multipliers) ────────
  // factory branches: -6% production cost each (max -30%)
  // dev_studio branches: +0.10 research speed each (max +0.60 months/mo)
  const allBranches = state.branches ?? [];
  const factoryBranchCount = allBranches.filter((b) => b.type === "factory").length;
  const devStudioBranchCount = allBranches.filter((b) => b.type === "dev_studio").length;
  const factoryCostBonus    = Math.min(0.30, factoryBranchCount * 0.06);
  const devStudioResearchBonus = Math.min(0.60, devStudioBranchCount * 0.10);

  // Combined bonuses (office + research + employee + character all stack)
  const combinedSalesMult = researchBonuses.salesMult * empBonuses.salesMult * officeBonuses.totalSalesMult * charBonuses.salesMult * eraBonuses.salesMult * (1 + gev.sales);
  // Factory branches reduce production costs on top of research + employee + character + era bonuses
  const combinedCostMult = researchBonuses.costMult * empBonuses.costMult * (1 - officeBonuses.totalCostReduction * 0.3) * (1 - factoryCostBonus) * charBonuses.costMult * eraBonuses.costMult;
  const combinedCampaignMult = researchBonuses.campaignMult * empBonuses.campaignMult * charBonuses.campaignMult * eraBonuses.campaignMult * (1 + fm.marketingEfficiency + (localHoldings.includes("pulse_marketing_group") ? 0.02 : 0) + gev.marketingEfficiency);
  const combinedGameRevMult = researchBonuses.gameRevMult * charBonuses.gameRevMult * eraBonuses.gameRevMult;

  // ── Acquisition synergy bonuses (real gameplay effects) ──────────────────────
  const acquisitions = state.acquisitions ?? [];
  const acqStudios          = acquisitions.filter((a) => a.type === "studio");
  const acqHardwareLabs     = acquisitions.filter((a) => a.type === "hardware_lab");
  const acqPublishers       = acquisitions.filter((a) => a.type === "publisher");
  const acqMarketingAgencies = acquisitions.filter((a) => a.type === "marketing_agency");
  // hardware_lab: +0.4 console rating bonus per lab (actual rating improvement every tick)
  const hardwareLabRatingBonus = acqHardwareLabs.length * 0.4;
  // publisher: +25% game revenue per publisher owned
  const publisherGameMult = 1 + acqPublishers.length * 0.25;
  // marketing_agency: +22% to marketing effectiveness per agency owned
  const marketingAgencyMult = 1 + acqMarketingAgencies.length * 0.22;
  // studio: extra research months per month per studio's researchBonus
  const studioResearchAccel = acqStudios.reduce((s, a) => s + a.researchBonus, 0);
  // Combined rating bonus now includes hardware labs, office bonuses, and character bonus
  const combinedRatingBonus = researchBonuses.ratingBonus + empBonuses.ratingBonus + hardwareLabRatingBonus + officeBonuses.totalRatingBonus + charBonuses.ratingBonus + eraBonuses.ratingBonus + fm.productQuality + (localHoldings.includes("novacore_tech") ? 0.01 : 0) + gev.productQuality;
  // Combined sales mult includes office marketing bonuses
  // (applied below where combinedSalesMult is used)

  // ── Fan tier (computed from current fans, before monthly update) ────────────
  // Used to gate brand-recognition bonuses in marketing and hardware sales.
  const fanTier = getFanTier(fans);

  // ── Marketing boost ─────────────────────────────────────────────────────────
  const baseMarketingBoost =
    state.marketingMonthsLeft > 0
      ? MARKETING_SALES_BOOST[state.activeMarketing]
      : MARKETING_SALES_BOOST.none;
  // marketing_agency acquisitions + fan tier amplify marketing reach
  const marketingBoost = baseMarketingBoost * combinedCampaignMult * marketingAgencyMult * fanTier.mktEffMult;
  const newMarkMonths = Math.max(0, state.marketingMonthsLeft - 1);
  const newActiveMkt: MarketingTier =
    newMarkMonths === 0 ? "none" : state.activeMarketing;

  // ── Strategy option expiry ─────────────────────────────────────────────────
  const _stratMonthIdx = year * 12 + month;
  const newActiveStrategyOptions = (state.activeStrategyOptions ?? []).filter(
    (opt) => _stratMonthIdx < opt.endMonthIdx
  );

  // Media Network holding: active marketing grants +2 rep/month via amplified coverage
  if (localHoldings.includes("media_network") && state.marketingMonthsLeft > 0) {
    reputation = Math.min(100, reputation + 2);
  }

  // ── Office costs (new 8-sector system) ────────────────────────────────────────
  // Sum maintenance for all sectors based on upgrade count
  const inflMult = getInflationMultiplier(year);
  const officeCost = ALL_OFFICE_SECTORS.reduce((sum, sector) => {
    const upgrades = state.offices[sector] ?? 0;
    return sum + getOfficeMonthlyMaintenance(upgrades, year);
  }, 0);
  // Admin cost reduction from admin sector bonus
  const adminSaving = Math.round(officeCost * officeBonuses.totalCostReduction * 0.3);
  money -= officeCost - adminSaving;
  // ── Team office maintenance (scales with office level + headcount) ─────────
  const _empHeadcount = (state.employees ?? []).length;
  const teamOfficeMaint = getTeamOfficeMonthlyCost(state.officeLevel ?? 1, _empHeadcount);
  money -= teamOfficeMaint;
  // Local Holdings monthly maintenance (deducted before income so net is clear)
  const HOLDINGS_MONTHLY_COST: Record<string, number> = {
    investment_bank:        120_000,
    law_firm:                70_000,
    media_network:           55_000,
    ai_research_lab:        100_000,
    hardware_factory:        90_000,
    indie_incubator:         35_000,
    hedge_fund:             180_000,
    crisis_firm:             55_000,
    // New holdings
    apex_global_bank:       300_000,
    novacore_tech:          150_000,
    silicore_industries:    200_000,
    shieldguard_insurance:  100_000,
    pulse_marketing_group:  120_000,
    ironwall_security:       80_000,
  };
  const localHoldingsMonthlyCost = localHoldings.reduce(
    (sum, id) => sum + (HOLDINGS_MONTHLY_COST[id] ?? 0), 0
  );
  money -= localHoldingsMonthlyCost;

  // ── Legal Contract: monthly cost + elite passive rep ────────────────────────
  const _legalMonthIdx = year * 12 + month;
  let newLegalContract = state.legalContract;
  let _legalJustExpired = false; // flag used below to insert expiry news after newsItems is declared
  if (newLegalContract) {
    const _legalExpired = _legalMonthIdx >= newLegalContract.endMonthIdx;
    if (!_legalExpired) {
      // Deduct monthly retainer while contract is active
      money -= LEGAL_CONTRACT_MONTHLY_COST[newLegalContract.tierId];
      // Elite tier: passive +1 reputation/month while active
      if (newLegalContract.tierId === "elite") {
        reputation = Math.min(100, reputation + 1);
      }
    } else if (!newLegalContract.renewalPending) {
      // Mark expiry once — news is inserted after newsItems is declared (below)
      newLegalContract = { ...newLegalContract, renewalPending: true };
      _legalJustExpired = true;
    }
  }

  // Investment Bank holding: $200K passive income each month
  if (localHoldings.includes("investment_bank")) {
    money += 200_000;
  }
  // Apex Global Bank holding: $5M annual income applied monthly
  if (localHoldings.includes("apex_global_bank")) {
    money += Math.round(5_000_000 / 12);
  }
  // Global Economic Event — income effect (negative only; capped at -3%)
  if (gev.income < 0 && money > 0) {
    const incomeHit = Math.round(money * Math.max(-0.03, gev.income));
    money += incomeHit; // incomeHit is negative
  }

  // ── Employee salaries (with per-employee inflation adjustment) ─────────────────
  const empSalaries = (state.employees ?? []).reduce((s, e) => {
    // Guard salary and hireYear — a single NaN employee would corrupt the entire sum
    const salary    = Number.isFinite(e.monthlySalary) ? e.monthlySalary : 0;
    const hireYear  = Number.isFinite(e.hireYear)      ? e.hireYear      : year;
    const inflation = getSalaryInflationFactor(hireYear, year);
    const inflated  = Math.round(salary * inflation);
    return s + (Number.isFinite(inflated) ? inflated : 0);
  }, 0);
  money -= empSalaries;

  // ── Console maintenance costs ─────────────────────────────────────────────────
  // Each active console costs a % of its production cost monthly (servers, QA, support)
  // Consoles still in development do not yet generate maintenance costs.
  const maintenanceCost = state.consoles
    .filter((c) => !c.isDiscontinued && !c.isInDevelopment)
    .reduce((s, c) => {
      // Guard both productionCost and power lookup — undefined power returns undefined rate → NaN
      const rate = CONSOLE_MAINTENANCE_RATE[c.power] ?? 0.02;
      const cost = Number.isFinite(c.productionCost) ? c.productionCost : 0;
      const monthly = Math.round(cost * rate);
      return s + (Number.isFinite(monthly) ? monthly : 0);
    }, 0);
  money -= maintenanceCost;

  // ── Base overhead (utilities, rent, misc) ─────────────────────────────────────
  const baseOverhead = getBaseOverhead(state);
  money -= baseOverhead;

  // ── Rival competitive pressure on sales ───────────────────────────────────────
  // The combined market share of alive rivals reduces player revenue proportionally.
  // Formula: each 1% of rival market share costs the player 0.3% of revenue (cap 45%).
  const aliveRivalsForPressure = state.competitors.filter((c) => c.alive !== false);
  const totalRivalSharePrev    = aliveRivalsForPressure.reduce((s, c) => s + c.marketShare, 0);
  const rivalPressureMult      = Math.max(0.55, 1 - (totalRivalSharePrev / 100) * 0.3);

  // ── Console development ticking ───────────────────────────────────────────────
  // Each month, consoles still in development advance their devProgress by
  // (100 / devTimeMonths). When they hit 100 they are released to the market.
  const newlyCompletedConsoleIds: string[] = [];
  const consolesAfterDev = state.consoles.map((c) => {
    if (!c.isInDevelopment) return c;
    const devTime  = Math.max(1, c.devTimeMonths ?? 18);
    // Hardware Factory holding: +8 flat progress points/month (accelerates dev timeline)
    const factoryBonus = localHoldings.includes("hardware_factory") ? 8 : 0;
    const progress = Math.min(100, (c.devProgress ?? 0) + (100 / devTime) + factoryBonus);
    if (progress >= 100) {
      newlyCompletedConsoleIds.push(c.id);
      return { ...c, isInDevelopment: false, devProgress: 100, launchYear: year, launchMonth: month };
    }
    return { ...c, devProgress: progress };
  });

  // ── Console sales ─────────────────────────────────────────────────────────────
  let totalSales = 0;
  let totalRevenue = 0;
  const updatedConsoles = consolesAfterDev.map((c) => {
    if (c.isDiscontinued) return c;
    if (c.isInDevelopment) return c;   // still under development — no sales yet
    // Apply research rating bonus — hardware-spec companies get a stronger per-month
    // quality maintenance boost (their engineering keeps old hardware relevant longer)
    const hwRatingBoost = hwSpecLevel >= 2 ? combinedRatingBonus * 0.16 : combinedRatingBonus * 0.1;
    const boostedConsole = { ...c, rating: Math.min(10, c.rating + hwRatingBoost) };

    // ── Hardware spec: longevity multiplier ──────────────────────────────────────
    // Hardware-Focada/Mestre companies maintain sales on older consoles better
    // because they iterate hardware quality more precisely. Consoles aged 18+ months
    // sell 8/16/24% better at level 1/2/3. This rewards building fewer, longer-lasting gens.
    const ageMonthsC = (year - c.launchYear) * 12 + (month - c.launchMonth);
    const hwLongevity = (hwSpecLevel > 0 && ageMonthsC >= 18)
      ? (1 + hwSpecLevel * 0.08)   // L1: +8%, L2: +16%, L3: +24% on hardware 18mo+
      : 1.0;

    // ── Online spec: digital distribution tail revenue ───────────────────────────
    // Online-focused companies capture more recurring digital revenue on older hardware.
    // This represents platform lock-in, subscription models and digital storefronts.
    // L1: +6%, L2: +12%, L3: +18% — distinct from salesMult (which covers new unit sales)
    const onlineTail = ageMonthsC >= 6 ? (1 + onlineSpecLevel * 0.06) : 1.0;

    // Design sales multiplier: full boost during launch window (first 6 months), decays to 1.0 by month 24
    const rawDesignMult = safeN(c.designSalesMult, 1);
    const designSalesMult = ageMonthsC < 6
      ? rawDesignMult
      : ageMonthsC < 24
        ? 1 + (rawDesignMult - 1) * Math.max(0, (24 - ageMonthsC) / 18)
        : 1;

    const rawUnits = calculateMonthlySales(boostedConsole, state, marketingBoost) * combinedSalesMult * hwLongevity * designSalesMult;
    const units = safeN(rawUnits, 0);
    const unitsRounded = Math.round(units);
    // Paused consoles: no revenue, no cost, no fans — but still persist in state
    const prodCostPerUnit = c.isProductionPaused ? 0 : safeN(c.productionCost, 0) * combinedCostMult;
    // Revenue gets the online tail applied separately from unit count (platform fees, digital)
    const rev = c.isProductionPaused ? 0 : safeN(Math.round(unitsRounded * safeN(c.price, 0) * rivalPressureMult * onlineTail), 0);
    const cost = c.isProductionPaused ? 0 : safeN(unitsRounded * prodCostPerUnit, 0);
    money += rev - cost;
    fans += Math.round(unitsRounded * 0.06 * charBonuses.fansPerLaunchMult);
    totalSales += unitsRounded;
    totalRevenue += rev;
    // Tick down relaunch boost
    const newRelaunchLeft = Math.max(0, (c.relaunchBonusMonthsLeft ?? 0) - 1);
    return {
      ...c,
      unitsSold: safeN(c.unitsSold, 0) + unitsRounded,
      totalRevenue: safeN(c.totalRevenue, 0) + rev,
      popularity: Math.min(100, safeN(c.popularity, 10) + unitsRounded * 0.001),
      relaunchBonusMonthsLeft: newRelaunchLeft > 0 ? newRelaunchLeft : undefined,
    };
  });

  if (state.consoles.filter((c) => !c.isDiscontinued && !c.isInDevelopment).length > 0) {
    const avg =
      state.consoles.filter((c) => !c.isDiscontinued && !c.isInDevelopment).reduce((s, c) => s + c.rating, 0) /
      state.consoles.filter((c) => !c.isDiscontinued && !c.isInDevelopment).length;
    const consoleDelta = (avg - 5) * 0.3;
    const scaledDelta = consoleDelta > 0 ? consoleDelta * fanRepScale : consoleDelta;
    reputation = Math.min(100, Math.max(0, reputation + scaledDelta));
  }

  // ── Trend calculation (deterministic per year+month) ─────────────────────────
  const activeTrends = getActiveTrends(year, month);

  // ── Office-based development speed (+ trait bonuses from fast/creative employees) ─
  // Higher tech/testing/design offices → faster game/console development
  const traitDevSpeedBonus = (state.employees ?? []).reduce((sum, emp) => {
    const fx = getTraitEffectiveness(emp);
    return sum + fx.devSpeedMod / Math.max(1, (state.employees ?? []).length);
  }, 0);
  const devSpeed = officeBonuses.totalDevSpeed + traitDevSpeedBonus + tempDevSpeedBonus;

  // ── Bug risk calculation helper ──────────────────────────────────────────────
  // Chance that a game launches with bugs; decreases with better offices + disciplined/prodigy employees
  const techPct    = Math.min(1, (state.offices.tech     ?? 0) / 35);
  const testingPct = Math.min(1, (state.offices.testing  ?? 0) / 35);
  const traitBugMod = (state.employees ?? []).reduce((sum, emp) => {
    const fx = getTraitEffectiveness(emp);
    return sum + fx.bugRiskMod / Math.max(1, (state.employees ?? []).length);
  }, 0);
  // riskMod > 1 for Innovation-spec / exclusive tech companies — they move fast and break things.
  // This is the ONLY penalty for Innovation focus: higher bug risk, but also higher rating ceiling.
  const bugBaseChance = Math.max(0.04,
    (0.60 - techPct * 0.30 - testingPct * 0.25 + traitBugMod + tempBugRiskBonus)
    * researchBonuses.riskMod
  );

  function rollBugLevel(extraRushBonus: number): BugLevel {
    const chance = Math.min(0.80, bugBaseChance + extraRushBonus);
    const r = Math.random();
    if (r >= chance) return "none";
    const severity = Math.random();
    if (severity < 0.55) return "low";
    if (severity < 0.85) return "medium";
    return "severe";
  }

  const BUG_SCORE_PENALTY: Record<BugLevel, number> = {
    // Rebalanced: none must always be 0 (bug-free games get no penalty).
    // light issues: 2–5 pts  medium: 5–9 pts  severe: 10–15 pts (rare).
    none: 0, low: 3, medium: 7, severe: 13,
  };
  const BUG_REV_MULT: Record<BugLevel, number> = {
    none: 1.0, low: 0.88, medium: 0.65, severe: 0.42,
  };

  // ── lucroFinal = receitaBase × (1 − saturacaoMercado) × eficienciaEmpresa ────
  //
  // eficienciaEmpresa — company-wide, computed once per tick
  //   • combinedGameRevMult  : research / character / era bonuses
  //   • employeeEff          : more staff → better output (0.65 → 1.15)
  //   • officeEff            : office investment → better output (1.0 → 1.25)
  //   • debtPenalty          : heavy debt drains efficiency (down to 0.50)
  const totalOfficeUpgrades = Object.values(state.offices ?? {}).reduce(
    (s, v) => s + (typeof v === "number" ? v : 0), 0
  );
  const employeeEff  = Math.min(1.15, 0.65 + (state.employees ?? []).length * 0.035);
  const officeEff    = 1.0 + Math.min(0.25, (totalOfficeUpgrades / 120) * 0.25);
  const debtPenalty  = money < 0 ? Math.max(0.50, 1.0 + money / 2_500_000) : 1.0;
  // Diminishing returns for large companies: management complexity reduces unit efficiency
  // -0.015% per $1M of company value; floor 0.65× at ~$2.3B+
  const companyValueM      = (state.companyValue ?? 0) / 1_000_000;
  const tamanhoEmpresaMult = Math.max(0.65, 1 - companyValueM * 0.00015);
  // Games-spec companies have optimized development pipelines that make each game
  // project more efficient — representing better tooling, engines and institutional knowledge.
  // L1: +4%, L2: +8%, L3: +12% to overall game revenue efficiency.
  const gamesSpecEff = 1 + gamesSpecLevel * 0.04;
  const eficienciaEmpresa = Math.max(0.10, Math.min(2.0,
    combinedGameRevMult * employeeEff * officeEff * debtPenalty * tamanhoEmpresaMult * gamesSpecEff
  ));

  // ── saturacaoMercado = patrimonio / limiteGlobal ─────────────────────────────
  //
  // Company-level (computed once per tick, applied to every released game).
  // patrimonio  = current company valuation (companyValue)
  // limiteGlobal = era-scaled total addressable gaming market
  //
  // Effect: a startup faces negligible saturation; a Mega Corp (>$1B valuation
  //         in a small-market era) is capped at 80% — its dominance compresses
  //         incremental revenue from each new title.
  const patrimonio  = state.companyValue ?? 0;
  const limiteGlobal = getGlobalMarketLimit(year);
  const saturacaoMercado = Math.min(0.80, patrimonio / limiteGlobal);

  // ── Game project progression ──────────────────────────────────────────────────
  let gameProjectRevenue = 0;
  const newlyReleasedGames: GameProject[] = [];
  const updatedProjects = (state.gameProjects ?? []).map((proj) => {
    if (proj.phase === "released") {
      const genres = proj.genres && proj.genres.length > 0 ? proj.genres : [proj.genre];
      const age = (year - proj.launchYear) * 12 + month - proj.launchMonth;
      const lifespan = proj.effectiveLifespan ?? 36;
      const score = proj.receptionScore ?? 50;

      // Reputation longevity bonus (0–+0.20): high-rep studios retain audiences longer
      const repLongevity = Math.min(0.20, reputation * 0.002);
      // DLC stability: each DLC released adds a small floor to popularity (+0.04 each, max 3)
      const dlcStability = Math.min(0.12, (proj.dlcCount ?? 0) * 0.04);
      // Active marketing temporarily lifts fade factor (moderate, not game-breaking)
      const marketingLift = (state.marketingMonthsLeft ?? 0) > 0 ? 0.07 : 0;

      let fadeFactor: number;
      if (score > 84) {
        // High-quality games: stable window where competition pressure drives decay, not just age.
        // stableMonths = how long the game keeps near-peak popularity before time-decay starts.
        const stableMonths = Math.round(28 + repLongevity * 100); // 28–48 months stable
        // rivalPressureMult is 0.55–1.0 (fewer/weaker rivals = higher value = less pressure)
        const peakFade = Math.min(1.0, rivalPressureMult + dlcStability + repLongevity + marketingLift);
        if (age <= stableMonths) {
          fadeFactor = peakFade;
        } else {
          // After stable window: gradual time-based decline layered on competition pressure
          const decayAge  = age - stableMonths;
          const decaySpan = Math.max(16, lifespan - stableMonths);
          const timeFade  = Math.max(0, 1 - decayAge / decaySpan);
          fadeFactor = Math.max(0, peakFade * timeFade + marketingLift * timeFade);
        }
      } else if (score >= 70) {
        // Good games: smooth S-curve decay, modestly extended by DLC/rep/marketing
        const base = Math.max(0, 1 - age / lifespan);
        fadeFactor = Math.min(1.0, Math.pow(base, 0.9) + (dlcStability + repLongevity) * base + marketingLift);
      } else {
        // Below 70: standard or slightly faster decay — no meaningful extension
        const base = Math.max(0, 1 - age / lifespan);
        fadeFactor = Math.max(0, Math.pow(base, 1.1));
      }
      fadeFactor = Math.max(0, Math.min(1.0, fadeFactor));

      const revMultBonus = proj.revenueMultBonus ?? 1.0;
      const trendMult = Math.max(...genres.map(g => getTrendMultiplier(g, activeTrends)));
      const bugMult = BUG_REV_MULT[proj.bugLevel ?? "none"];

      // receitaBase × (1 − saturacaoMercado) × eficienciaEmpresa
      const receitaBase = safeN(proj.monthlyRevenue, 0) * fadeFactor * revMultBonus * trendMult * publisherGameMult * bugMult;
      const rev = safeN(Math.round(receitaBase * (1 - saturacaoMercado) * eficienciaEmpresa), 0);
      money += rev;
      fans += Math.round(rev * 0.0002);
      gameProjectRevenue += rev;

      // ── Export region revenue ───────────────────────────────────────────────
      if (proj.exportRegions && proj.exportRegions.length > 0 && fadeFactor > 0) {
        for (const er of proj.exportRegions) {
          if (er.blocked || er.investment <= 0) continue;
          const tiers = REGION_INVESTMENT_TIERS[er.regionId];
          const maxInv = tiers[2] || 1;
          const invRatio = Math.min(1, er.investment / maxInv);
          const hasBranch = getRegionHasBranch(er.regionId, state.branches ?? []);
          const revMult = getExportRevenueMult(er.regionId, hasBranch);
          // Export markets are fresher — only half the home market saturation applies
          const safeMonthlyRev = Number.isFinite(proj.monthlyRevenue) ? proj.monthlyRevenue : 0;
          const exportRev = Math.round(
            safeMonthlyRev * 0.35 * invRatio * revMult * fadeFactor *
            (1 - saturacaoMercado * 0.5) * eficienciaEmpresa
          );
          money += exportRev;
          gameProjectRevenue += exportRev;
          fans += Math.round(exportRev * 0.0001);
        }
      }

      // Bug fix countdown
      // Fan loss from bad games: ≤2 stars or negative/very_negative reviews lose fans monthly
      const isBadGame =
        (proj.starRating !== undefined && proj.starRating <= 2) ||
        proj.receptionSentiment === "negative" ||
        proj.receptionSentiment === "flop";
      if (isBadGame && fadeFactor > 0) {
        const lossRate = (0.005 + Math.random() * 0.025) * fadeFactor; // 0.5–3.0% × fade (stronger)
        // Critical fans are most unforgiving (3×), casual fans moderate (1.5×), loyal stable (0.5×)
        fanCritical = Math.max(0, fanCritical - Math.round(fanCritical * lossRate * 3.0));
        fanCasual   = Math.max(0, fanCasual   - Math.round(fanCasual   * lossRate * 1.5));
        fanLoyal    = Math.max(0, fanLoyal    - Math.round(fanLoyal    * lossRate * 0.5));
        fans = fanCasual + fanLoyal + fanCritical;
      }

      // Support stopped: gradual fan drain (casual & critical fans leave first)
      if (proj.supportActive === false && fadeFactor > 0) {
        const drain = 50 + Math.round((proj.starRating ?? 3) * 20);
        fanCasual   = Math.max(0, fanCasual   - Math.round(drain * 0.6));
        fanCritical = Math.max(0, fanCritical - Math.round(drain * 0.4));
        fans = fanCasual + fanLoyal + fanCritical;
      }

      if (proj.bugFixInProgress && (proj.bugFixMonthsLeft ?? 0) > 0) {
        // AI Research Lab holding: bug fixes complete in half the time
        const bugDecrement = localHoldings.includes("ai_research_lab") ? 2 : 1;
        const newLeft = (proj.bugFixMonthsLeft ?? 1) - bugDecrement;
        if (newLeft <= 0) {
          // Patch released — restore the bug score penalty that was applied at launch,
          // capped at the game's deterministic baseQualityScore (no excess beyond deserved quality).
          const bugPenaltyRestored = BUG_SCORE_PENALTY[proj.bugLevel ?? "none"];
          const patchedScore = Math.min(
            proj.baseQualityScore ?? (proj.receptionScore ?? 0),
            (proj.receptionScore ?? 0) + bugPenaltyRestored
          );
          const patchedStars: StarRating = patchedScore >= 85 ? 5 : patchedScore >= 70 ? 4 : patchedScore >= 54 ? 3 : patchedScore >= 38 ? 2 : 1;
          reputation = Math.min(100, reputation + 3 * fanRepScale);
          fans += 200;
          return { ...proj, totalRevenue: safeN(proj.totalRevenue, 0) + rev, bugLevel: "none" as BugLevel, bugFixInProgress: false, bugFixMonthsLeft: 0, receptionScore: Math.round(patchedScore), starRating: patchedStars };
        }
        return { ...proj, totalRevenue: safeN(proj.totalRevenue, 0) + rev, bugFixMonthsLeft: newLeft };
      }

      // ── Score recovery countdown ────────────────────────────────────────────
      if (proj.scoreRecoveryInProgress && (proj.scoreRecoveryMonthsLeft ?? 0) > 0) {
        const newLeft = (proj.scoreRecoveryMonthsLeft ?? 1) - 1;
        if (newLeft <= 0) {
          // Recovery complete — boost public score, capped at original baseQualityScore
          const base    = proj.baseQualityScore ?? (proj.receptionScore ?? 0);
          const current = proj.receptionScore ?? 0;
          const amount  = proj.scoreRecoveryAmount ?? 0;
          const newScore = Math.min(base, Math.round(current + amount));
          const newStars: StarRating = newScore >= 85 ? 5 : newScore >= 70 ? 4 : newScore >= 54 ? 3 : newScore >= 38 ? 2 : 1;
          reputation = Math.min(100, reputation + 1 * fanRepScale);
          fans += 150;
          return {
            ...proj,
            totalRevenue: safeN(proj.totalRevenue, 0) + rev,
            receptionScore: newScore,
            starRating: newStars,
            scoreRecoveryInProgress: false,
            scoreRecoveryMonthsLeft: 0,
            scoreRecoveryAmount: 0,
          };
        }
        return { ...proj, totalRevenue: safeN(proj.totalRevenue, 0) + rev, scoreRecoveryMonthsLeft: newLeft };
      }

      // ── Post-launch update countdown ───────────────────────────────────────
      if (proj.pendingUpdateType && (proj.updateMonthsLeft ?? 0) > 0) {
        const newLeft = (proj.updateMonthsLeft ?? 1) - 1;
        if (newLeft <= 0) {
          // Roll outcome based on quality, reputation, timing, and diminishing returns
          const qScore = computeUpdateQualityScore(proj, year, month, reputation);
          const tier = rollUpdateOutcomeTier(qScore);
          const effects = OUTCOME_TABLE[proj.pendingUpdateType][tier];

          // Apply effects — revBoostAdd can be negative (failure damages the game)
          const newLifespan = (proj.effectiveLifespan ?? 36) + effects.lifespanExt;
          const rawRevMult = (proj.revenueMultBonus ?? 1.0) + effects.revBoostAdd;
          const newRevMult = Math.min(2.5, Math.max(0.1, rawRevMult));

          // Reputation and fan impact (scaled; failures truly hurt)
          reputation = Math.min(100, Math.max(0, reputation + effects.repBoost * fanRepScale));
          const fanChange = Math.round(effects.fanDelta);
          fanCasual   = Math.max(0, fanCasual   + Math.round(fanChange * 0.6));
          fanCritical = Math.max(0, fanCritical + Math.round(fanChange * 0.3));
          fanLoyal    = Math.max(0, fanLoyal    + Math.round(fanChange * 0.1));
          fans = fanCasual + fanLoyal + fanCritical;

          const completedUpdate: PostLaunchUpdate = {
            type: proj.pendingUpdateType,
            year: year,
            month: month,
            costPaid: computePostLaunchCost(proj.budget, proj.pendingUpdateType),
            lifespanExtension: effects.lifespanExt,
            revBoostApplied: effects.revBoostAdd,
            outcome: tier,
            outcomeLabel: effects.label,
            outcomeColor: effects.color,
          };
          return {
            ...proj,
            totalRevenue: safeN(proj.totalRevenue, 0) + rev,
            effectiveLifespan: newLifespan,
            revenueMultBonus: newRevMult,
            pendingUpdateType: undefined,
            updateMonthsLeft: 0,
            postLaunchUpdates: [...(proj.postLaunchUpdates ?? []), completedUpdate],
          };
        }
        return { ...proj, totalRevenue: safeN(proj.totalRevenue, 0) + rev, updateMonthsLeft: newLeft };
      }

      return { ...proj, totalRevenue: safeN(proj.totalRevenue, 0) + rev };
    }
    if (proj.phase === "cancelled") return proj;

    // Apply office dev speed: each month of game-time counts as devSpeed months of progress
    const newElapsed = proj.monthsElapsed + devSpeed;
    if (newElapsed >= proj.monthsRequired) {
      const genres = proj.genres && proj.genres.length > 0 ? proj.genres : [proj.genre];
      const trendMult = Math.max(...genres.map(g => getTrendMultiplier(g, activeTrends)));

      // Determine bug risk — rushed budgets increase it
      const budgetRatio = proj.budget / Math.max(1, proj.quality * 100_000);
      const rushBonus = budgetRatio < 2 ? 0.10 : 0;
      const bugLevel = rollBugLevel(rushBonus);
      const bugPenalty = BUG_SCORE_PENALTY[bugLevel];

      // Hype bonus: 0–8 score points and 0–30% revenue boost
      const hype = proj.hypeLevel ?? 0;
      const hypeScoreBonus = Math.round(hype * 0.08);
      const hypeRevMult = 1 + hype * 0.003;

      // Deterministic base quality: same formula as computeGameReception but without
      // random variance. Used to protect high-quality games from unfair score collapse.
      const hasMarketingAtLaunch = (state.marketingMonthsLeft ?? 0) > 0 || hype >= 20;
      const qBase = (Number.isFinite(proj.quality) ? proj.quality : 5) * 8;
      const repB  = Math.min(10, Math.round(reputation * 0.10));
      const mktB  = hasMarketingAtLaunch ? 7 : 0;
      const synAtLaunch = computeGenreSynergy(genres);
      const synB  = Math.round(Math.max(-6, Math.min(12, (synAtLaunch - 1.0) * 50)));
      const trendB = trendMult > 1.05 ? Math.round((trendMult - 1) * 18) : 0;
      const budgetB = proj.budget >= 2_000_000 ? 3 : proj.budget >= 500_000 ? 1 : 0;
      const baseQualityScore = Math.min(100, Math.max(0, qBase + repB + mktB + synB + trendB + budgetB));

      // Compute reception before revenue so reception score can adjust revenue
      const reception = computeGameReception({
        quality: proj.quality,
        genres,
        budget: proj.budget,
        reputation,
        hasMarketing: hasMarketingAtLaunch,
        trendMult,
      });

      // Expectation penalty: fans ÷ 1 000 000 = expectativa
      // notaFinal = notaBase − (expectativa × 0.2)
      // The more fans you have, the harder they are to impress.
      // 100K fans → −0.02 pts (negligible)   1M → −0.20   10M → −2.0   50M → −10.0
      const expectativa = fans / 1_000_000;
      const expectativaPenalty = Math.round(expectativa * 0.2);

      // Merge all score modifiers: hype bonus − bug penalty − expectation penalty
      const rawAdjustedScore = reception.score + hypeScoreBonus - bugPenalty - expectativaPenalty;

      // Launch protection: high-quality games are shielded from extreme random collapse.
      // Cap the total drop from the deterministic baseQualityScore:
      //   base ≥ 75 → max -10 pts   base 60–74 → max -12 pts   base 45–59 → max -15 pts
      //   base < 45 → max -20 pts (low-quality can still be volatile but not catastrophically so)
      const maxAllowedDrop = baseQualityScore >= 75 ? 10 : baseQualityScore >= 60 ? 12 : baseQualityScore >= 45 ? 15 : 20;
      const protectedScore  = Math.max(rawAdjustedScore, baseQualityScore - maxAllowedDrop);
      const adjustedScore   = Math.min(100, Math.max(0, protectedScore));

      // Re-derive star rating from the final score so every modifier is reflected uniformly
      const starsFromScore = (s: number): StarRating =>
        s >= 85 ? 5 : s >= 70 ? 4 : s >= 54 ? 3 : s >= 38 ? 2 : 1;
      const adjustedStars = starsFromScore(adjustedScore);

      // Star-based gross revenue: range determined by star tier, scaled by era,
      // with position within band driven by score quality + execution factors.
      // gameRevMult (founder/publisher bonuses), bug, hype, and rival pressure
      // are applied on top as independent modifiers.
      const baseMonthlyRev = calculateStarBasedRevenue(adjustedStars, adjustedScore, proj, year);
      const bugRevMult = BUG_REV_MULT[bugLevel];
      const monthlyRev = Math.round(
        baseMonthlyRev * bugRevMult * hypeRevMult * rivalPressureMult * combinedGameRevMult * publisherGameMult
      );
      money += monthlyRev;
      // Quality-gated fan impact on launch:
      // Excellent launches bring a real fan spike; bad launches cause immediate fan loss.
      // Revenue-scaling only matters for the top tiers — quality must be earned.
      // 5★ → big surge   4★ → solid gain   3★ → modest growth
      // 2★ → immediate fan loss   1★ → severe fan loss
      const launchFanBase =
        adjustedStars >= 5 ? monthlyRev * 0.006 + 6000  :
        adjustedStars >= 4 ? monthlyRev * 0.002 + 2000  :
        adjustedStars >= 3 ? monthlyRev * 0.0005 + 700  :
        adjustedStars >= 2 ?                     -3000  :
                                                 -7000;
      fans = Math.max(0, fans + Math.round(launchFanBase));
      // Reputation impact: wins are modest (must be earned over time),
      // losses are harsher — bad products damage trust more than good ones build it.
      const launchRepDelta =
        adjustedStars >= 3
          ? (adjustedStars - 3) * 1.5
          : (adjustedStars - 3) * 3.0;   // ×2 penalty multiplier for ≤2★
      reputation = Math.min(100, reputation + (launchRepDelta > 0 ? launchRepDelta * fanRepScale : launchRepDelta));
      // Bugs also hurt reputation on launch
      if (bugLevel === "medium") reputation = Math.max(0, reputation - 3);
      if (bugLevel === "severe") reputation = Math.max(0, reputation - 8);
      gameProjectRevenue += monthlyRev;
      // Quality-tiered lifespan:
      //   score > 84  → 60–84 months (5–7 years — top games stay relevant long)
      //   score 70–84 → 36–60 months (3–5 years — solid games have a comfortable tail)
      //   score < 70  → 2–30 months  (weak games fade quickly)
      let naturalLifespan: number;
      if (adjustedScore > 84) {
        const t = Math.min(1, (adjustedScore - 85) / 15); // 0 at score 85, 1 at score 100
        naturalLifespan = Math.round(60 + t * 24);         // 60–84 months
      } else if (adjustedScore >= 70) {
        const t = (adjustedScore - 70) / 14;               // 0 at score 70, 1 at score 84
        naturalLifespan = Math.round(36 + t * 24);         // 36–60 months
      } else {
        naturalLifespan = Math.max(2, Math.round(
          2 + Math.pow(Math.max(0, adjustedScore - 20) / 80, 1.8) * 28
        ));
      }
      const releasedProj: GameProject = {
        ...proj,
        monthsElapsed: newElapsed,
        phase: "released" as GamePhase,
        monthlyRevenue: monthlyRev,
        totalRevenue: proj.totalRevenue + monthlyRev,
        launchYear: year,
        launchMonth: month,
        starRating: adjustedStars,
        receptionScore: Math.round(adjustedScore),
        receptionComment: reception.comment,
        receptionSentiment: reception.sentiment,
        fanDemandForSequel: reception.fanDemandForSequel,
        bugLevel,
        effectiveLifespan: naturalLifespan,
        revenueMultBonus: 1.0,
        postLaunchUpdates: [],
        baseQualityScore,
      };
      newlyReleasedGames.push(releasedProj);
      return releasedProj;
    }
    // Tick hype campaign for projects still in development
    if (proj.hypeCampaignActive && (proj.hypeCampaignMonthsLeft ?? 0) > 0) {
      const newLeft = (proj.hypeCampaignMonthsLeft ?? 1) - 1;
      const newHype = Math.min(100, (proj.hypeLevel ?? 0) + 15);
      return {
        ...proj,
        monthsElapsed: newElapsed,
        hypeLevel: newHype,
        hypeCampaignMonthsLeft: newLeft,
        hypeCampaignActive: newLeft > 0,
      };
    }
    return { ...proj, monthsElapsed: newElapsed };
  });

  // ── Research progression ────────────────────────────────────────────────────
  let newResearchedNodes = [...(state.researchedNodes ?? [])];
  let newCurrentResearch = state.currentResearch;
  // Research speed stacks: studio acquisitions + dev_studio branches + research_lab office upgrades.
  // officeBonuses.totalResearchSpeed = 1 + additive bonus (up to 2.0 with full research_lab).
  const researchMonthsConsumed = (1 + studioResearchAccel + devStudioResearchBonus) * officeBonuses.totalResearchSpeed * (1 + fm.researchSpeed + (localHoldings.includes("silicore_industries") ? 0.015 : 0) + gev.researchSpeed);
  let newResearchMonths = Math.max(0, (state.researchMonthsLeft ?? 0) - researchMonthsConsumed);
  // Tracks any exclusive tech just completed this tick, used later for news + competitor shock.
  let justCompletedExcl: (typeof EXCLUSIVE_TECHS)[number] | null = null;
  if (state.currentResearch && newResearchMonths === 0) {
    const completedId = state.currentResearch;
    newResearchedNodes.push(completedId);
    newCurrentResearch = null;

    // ── Exclusive tech completion burst ─────────────────────────────────────
    const completedExcl = EXCLUSIVE_TECHS.find(e => e.id === completedId);
    if (completedExcl) {
      justCompletedExcl = completedExcl;
      const isLeg = completedExcl.rarity === "legendary";
      // Immediate reputation + techRep burst (much larger than a normal node)
      const repBurst    = isLeg ? 28 : 12;
      const techRepBurst = isLeg ? 20 : 10;
      reputation = Math.min(100, reputation + repBurst * fanRepScale);
      techRep    = Math.min(100, techRep + techRepBurst);
      // Immediate fan burst: 20% of the node's total fansBonus materialises on unlock.
      // The remaining 80% continues to drip via researchBonuses.fansBonus each month.
      fans += Math.round((completedExcl.bonus.fansBonus ?? 0) * 0.20);
    } else {
      // ── Regular node: tier-scaled reputation ──────────────────────────────
      // Completing a Tier-10 breakthrough should feel epic vs a Tier-1 commodity node.
      const completedNode = getNodeById(completedId);
      const tier = completedNode?.tier ?? 1;
      const repGain = tier >= 10 ? 10 : tier >= 7 ? 6 : tier >= 4 ? 4 : 2;
      reputation = Math.min(100, reputation + repGain * fanRepScale);
    }
  }

  // ── Global market revenue ─────────────────────────────────────────────────────
  // Per-country revenue is tracked for proportional taxation.
  // Branch type effects:
  //   sales_office → base 1.0x revMult (no extras)
  //   factory      → reduces global production cost by 6% per factory branch
  //   dev_studio   → boosts global research speed by 0.1 per dev studio
  // Store tier effects applied via getStoreRevenueMult (1.8x / 2.8x / 3.5x).
  // Import duty is deducted from gross country revenue.
  let globalMarketRevenue = 0;
  const perCountryRevenue: Record<string, number> = {};
  const unlockedCountries = state.unlockedCountries ?? [];

  if (unlockedCountries.length > 1 && totalSales > 0) {
    for (const countryId of unlockedCountries) {
      if (countryId === "usa") continue; // base market already counted
      const country = getCountryById(countryId);
      if (!country) continue;
      const branch = (state.branches ?? []).find((b) => b.countryId === countryId);
      // Revenue multiplier: use store-tier-aware multiplier if branch exists
      let revMult: number;
      if (branch) {
        revMult = getStoreRevenueMult(branch, country.pricingMultiplier);
      } else {
        revMult = 0.5 * country.pricingMultiplier; // no branch → reduced reach
      }
      const marketSize = getCountryMarketSize(country, year);
      const grossCountryRevenue = Math.round(totalRevenue * Math.min(0.3, (marketSize / 100000)) * revMult);
      // Import duty: cost of moving goods cross-border (deducted from gross)
      const afterDuty = Math.round(grossCountryRevenue * (1 - country.importDuty));
      money += afterDuty;
      globalMarketRevenue += afterDuty;
      perCountryRevenue[countryId] = afterDuty;
    }
  }

  // ── Branch operational costs + auto-expansion store growth ────────────────────
  const updatedBranches = (state.branches ?? []).map((branch) => {
    if (branch.storeExpansion !== "auto_expansion") return branch;
    // Auto-expansion: stores grow by 1–3 per month based on reputation + market
    const country = getCountryById(branch.countryId);
    const stabilityFactor = country?.riskLevel === "low" ? 1.2 : country?.riskLevel === "medium" ? 1.0 : 0.7;
    const repFactor = Math.max(0.3, reputation / 100);
    // Monthly growth: 0.5 – 3 stores per month depending on reputation + stability
    const growth = Math.max(0, Math.round((repFactor * stabilityFactor * 3) * (0.6 + Math.random() * 0.8)));
    const newCount = Math.min(250, (branch.storeCount ?? 5) + growth); // cap at 250 stores
    // Monthly cost scales as store count grows (auto-expansion is open-ended)
    const baseMonthlyCost = branch.monthlyCost;
    const storeCostFactor = Math.max(1, newCount / Math.max(1, branch.storeCount ?? 5));
    const newMonthlyCost = newCount > (branch.storeCount ?? 5)
      ? Math.round(baseMonthlyCost * storeCostFactor * 0.97) // slight economy of scale
      : baseMonthlyCost;
    return { ...branch, storeCount: newCount, monthlyCost: newMonthlyCost };
  });
  const branchCosts = updatedBranches.reduce((s, b) => s + b.monthlyCost, 0);
  money -= branchCosts;

  // ── Branch incident system ─────────────────────────────────────────────────
  // Minor/major incidents → stored in branch.incidentLog only (never to main newsItems).
  // Critical incidents (severe financial loss, closure risk) → main newsItems.
  const INCIDENT_TEMPLATES: Array<{
    type: BranchIncident["type"];
    severity: BranchIncident["severity"];
    desc: string;
    costBase: number;
    chanceByRisk: Record<string, number>;
  }> = [
    { type: "robbery",      severity: "minor",    desc: "Roubo menor na filial — segurança reforçada.",          costBase: 3_000,  chanceByRisk: { low: 0.01, medium: 0.03, high: 0.06, very_high: 0.10 } },
    { type: "robbery",      severity: "major",    desc: "Roubo significativo — mercadoria e equipamento perdidos.", costBase: 18_000, chanceByRisk: { low: 0.003, medium: 0.008, high: 0.015, very_high: 0.025 } },
    { type: "vandalism",    severity: "minor",    desc: "Ato de vandalismo na fachada — reparação necessária.",    costBase: 1_500,  chanceByRisk: { low: 0.02, medium: 0.04, high: 0.07, very_high: 0.12 } },
    { type: "vandalism",    severity: "major",    desc: "Vandalismo grave — operações interrompidas por 3 dias.",  costBase: 12_000, chanceByRisk: { low: 0.003, medium: 0.008, high: 0.012, very_high: 0.02 } },
    { type: "strike",       severity: "major",    desc: "Greve dos funcionários — produção reduzida por 2 semanas.", costBase: 25_000, chanceByRisk: { low: 0.005, medium: 0.010, high: 0.015, very_high: 0.02 } },
    { type: "strike",       severity: "critical", desc: "Greve prolongada — filial parada por um mês inteiro.",   costBase: 80_000, chanceByRisk: { low: 0.001, medium: 0.003, high: 0.006, very_high: 0.010 } },
    { type: "regulatory",   severity: "minor",    desc: "Notificação regulatória — taxa de conformidade aplicada.", costBase: 8_000,  chanceByRisk: { low: 0.01, medium: 0.02, high: 0.03, very_high: 0.04 } },
    { type: "regulatory",   severity: "major",    desc: "Autuação regulatória severa — processo em curso.",       costBase: 45_000, chanceByRisk: { low: 0.003, medium: 0.006, high: 0.010, very_high: 0.015 } },
    { type: "fire",         severity: "major",    desc: "Incêndio parcial — danos estruturais e perda de stock.", costBase: 60_000, chanceByRisk: { low: 0.001, medium: 0.003, high: 0.005, very_high: 0.008 } },
    { type: "fire",         severity: "critical", desc: "Incêndio grave — filial destruída. Reconstrução obrigatória.", costBase: 200_000, chanceByRisk: { low: 0.0002, medium: 0.001, high: 0.002, very_high: 0.004 } },
    { type: "power_outage", severity: "minor",    desc: "Corte de energia — serviços offline por 2 dias.",        costBase: 2_500,  chanceByRisk: { low: 0.015, medium: 0.025, high: 0.04, very_high: 0.06 } },
    { type: "power_outage", severity: "major",    desc: "Apagão prolongado — perda de dados e equipamento danificado.", costBase: 20_000, chanceByRisk: { low: 0.003, medium: 0.007, high: 0.012, very_high: 0.018 } },
  ];

  const branchIncidentNews: NewsItem[] = [];

  const processedBranches = updatedBranches.map((branch) => {
    const country = getCountryById(branch.countryId);
    if (!country) return branch;

    const riskLevel = country.riskLevel as "low" | "medium" | "high" | "very_high";
    let branchMoney = 0;
    let newRobberyCount = branch.robberyCount ?? 0;
    let newVandalismCount = branch.vandalismCount ?? 0;
    let newTotalIncidentCost = branch.totalIncidentCost ?? 0;
    const newIncidentLog: BranchIncident[] = [...(branch.incidentLog ?? [])];

    let hadCritical = false;
    let criticalDesc = "";
    let criticalCost = 0;

    for (const template of INCIDENT_TEMPLATES) {
      const chance = template.chanceByRisk[riskLevel] ?? 0;
      if (Math.random() >= chance) continue;

      const costVariance = 0.7 + Math.random() * 0.6;
      const cost = Math.round(template.costBase * costVariance);
      branchMoney += cost;
      newTotalIncidentCost += cost;

      if (template.type === "robbery")   newRobberyCount++;
      if (template.type === "vandalism") newVandalismCount++;

      const incident: BranchIncident = {
        id: `inc_${branch.countryId}_${year}_${month}_${template.type}`,
        year: year,
        month: month,
        type: template.type,
        severity: template.severity,
        description: template.desc,
        moneyCost: cost,
      };

      // Keep last 12 incidents
      newIncidentLog.unshift(incident);
      if (newIncidentLog.length > 12) newIncidentLog.pop();

      if (template.severity === "critical") {
        hadCritical = true;
        criticalDesc = template.desc;
        criticalCost = cost;
      }
    }

    money -= branchMoney;

    // Efficiency: inversely related to incident rate + risk score
    const totalIncidents = newRobberyCount + newVandalismCount;
    const incidentRate = Math.min(1, totalIncidents / Math.max(1, ((year - branch.openedYear) * 12 + month - branch.openedMonth)));
    const efficiencyBase = 100 - Math.round(incidentRate * 30) - (riskLevel === "very_high" ? 15 : riskLevel === "high" ? 8 : riskLevel === "medium" ? 3 : 0);
    const newEfficiency = Math.max(20, Math.min(100, efficiencyBase));

    // Risk score: country risk + recent incidents
    const riskBase = riskLevel === "very_high" ? 80 : riskLevel === "high" ? 60 : riskLevel === "medium" ? 35 : 15;
    const newRiskScore = Math.min(100, riskBase + Math.min(20, totalIncidents));

    // Estimated monthly revenue
    const revMult = getCountryRevenueMult(country, true);
    const estimatedRev = Math.round(branch.monthlyRevenueBonus * revMult * (newEfficiency / 100));

    const updatedBranch: CountryBranch = {
      ...branch,
      robberyCount: newRobberyCount,
      vandalismCount: newVandalismCount,
      totalIncidentCost: newTotalIncidentCost,
      incidentLog: newIncidentLog,
      monthlyEstimatedRevenue: estimatedRev,
      cumulativeRevenue: (branch.cumulativeRevenue ?? 0) + estimatedRev,
      cumulativeCost: (branch.cumulativeCost ?? 0) + branch.monthlyCost + branchMoney,
      efficiency: newEfficiency,
      riskScore: newRiskScore,
      lastIncidentYear: newIncidentLog.length > 0 ? newIncidentLog[0].year : branch.lastIncidentYear,
      lastIncidentMonth: newIncidentLog.length > 0 ? newIncidentLog[0].month : branch.lastIncidentMonth,
    };

    // Only critical incidents surface as main-screen news
    if (hadCritical) {
      const flag = country.flag;
      const countryName = country.name;
      branchIncidentNews.push({
        id: `branch_critical_${branch.countryId}_${year}_${month}`,
        year: year,
        month: month,
        category: "crisis" as const,
        title: `🚨 Crise Crítica — Filial em ${flag} ${countryName}`,
        body: `${criticalDesc}\n\nPrejuízo imediato: $${criticalCost.toLocaleString()}. Acede ao Mapa Global para gerir a situação.`,
        moneyDelta: -criticalCost,
        fansDelta: 0,
        reputationDelta: -1,
        isRead: false,
      });
    }

    return updatedBranch;
  });

  // branchIncidentNews will be merged into newsItems after newsItems is declared (below)

  // ── Acquisition revenue & expenses ───────────────────────────────────────────
  const acqNetMonthly = (state.acquisitions ?? []).reduce(
    (s, a) => s + a.revenueBonus - a.monthlyExpense, 0
  );
  if ((state.acquisitions ?? []).length > 0) {
    money += acqNetMonthly;
  }

  // ── Dynamic acquisition valuations (drift each month) ────────────────────────
  const updatedAcquisitions = (state.acquisitions ?? []).map((acq) => {
    const mult    = computeAcquisitionMonthlyMultiplier(acq.type, reputation, state.marketShare ?? 0);
    const newVal  = Math.max(
      Math.round(acq.purchasePrice * 0.30),
      Math.round(acq.currentValuation * mult),
    );
    return { ...acq, currentValuation: newVal };
  });

  // ── Sponsorship opportunities: generate new, expire old ───────────────────────
  const activeSponsorships = (state.sponsorshipOpportunities ?? []).filter((opp) => {
    if (opp.expiresYear < year) return false;
    if (opp.expiresYear === year && opp.expiresMonth <= month) return false;
    return true;
  });
  const newSponsorshipOpps: SponsorshipOpportunity[] = [...activeSponsorships];
  if (newSponsorshipOpps.length < 3 && Math.random() < 0.09) {
    const existingIds = newSponsorshipOpps.map((o) => o.id);
    const newOpp = generateSponsorshipOpportunity(year, month, existingIds);
    if (newOpp) newSponsorshipOpps.push(newOpp);
  }

  // ── Country taxes on gross revenue (with dynamic tax modifiers) ──────────────
  const taxModifiers: Record<string, TaxModifier> = { ...(state.countryTaxModifiers ?? {}) };

  // Tick down all active tax events (decrement monthsLeft, remove when expired)
  for (const countryId of Object.keys(taxModifiers)) {
    const tm = taxModifiers[countryId];
    if (tm.monthsLeft <= 1) {
      delete taxModifiers[countryId];
    } else {
      taxModifiers[countryId] = { ...tm, monthsLeft: tm.monthsLeft - 1 };
    }
  }

  // Random tax event generation: 2% chance per extra country per month
  const taxEventTypes = Object.keys(TAX_EVENT_DEFINITIONS) as (keyof typeof TAX_EVENT_DEFINITIONS)[];
  const extraCountriesForTax = (state.unlockedCountries ?? []).filter((id) => id !== "usa");
  for (const countryId of extraCountriesForTax) {
    if (taxModifiers[countryId]) continue; // already has an active event
    if (Math.random() < 0.02) {
      // Bias: negative events slightly more likely (60/40)
      const idx = Math.floor(Math.random() * taxEventTypes.length);
      const type = taxEventTypes[idx];
      const def = TAX_EVENT_DEFINITIONS[type];
      taxModifiers[countryId] = {
        type,
        modifier: def.modifier,
        monthsLeft: def.durationMonths,
        reason: `Evento fiscal: ${def.label}`,
      };
    }
  }

  const grossRevenue = safeN(totalRevenue, 0) + safeN(gameProjectRevenue, 0) + safeN(globalMarketRevenue, 0);
  if (grossRevenue > 0) {
    const diffConfig = DIFFICULTY_CONFIG[state.difficulty as keyof typeof DIFFICULTY_CONFIG] ?? DIFFICULTY_CONFIG.normal;
    // Base USA tax on core revenue (difficulty adjusts tax pressure)
    const usaTax = Math.round((totalRevenue + gameProjectRevenue) * 0.21 * diffConfig.taxPressure);
    money -= usaTax;

    // Additional country taxes on global market revenue, with dynamic modifiers.
    // Each country is taxed on the actual revenue it generated (perCountryRevenue),
    // not an even split — so store-heavy markets pay proportionally more tax.
    if (globalMarketRevenue > 0 && (state.unlockedCountries ?? []).length > 1) {
      const extraCountries = (state.unlockedCountries ?? []).filter((id) => id !== "usa");
      for (const countryId of extraCountries) {
        const country = getCountryById(countryId);
        if (!country) continue;
        const rev = perCountryRevenue[countryId] ?? 0;
        if (rev <= 0) continue;
        const taxModifier = taxModifiers[countryId]?.modifier ?? 1.0;
        const effectiveTaxRate = country.taxRate * taxModifier * diffConfig.taxPressure;
        const taxAmount = Math.round(rev * effectiveTaxRate);
        money -= taxAmount;
      }
    }
  }

  // ── Office executive & security sectors boost reputation every month ─────────
  // (executive = leadership vision, security = trust/brand protection)
  // Character reputation bonus applies once per year (scaled to monthly)
  const charRepPerMonth = charBonuses.reputationBonus / 12;
  reputation = Math.min(100, reputation + (officeBonuses.totalReputationBonus + charRepPerMonth) * fanRepScale);

  // ── Stagnation penalty: no consoles AND no active projects ─────────────────
  const hasActiveConsoles = state.consoles.filter((c) => !c.isDiscontinued).length > 0;
  const hasActiveProjects = (state.gameProjects ?? []).some(
    (p) => p.phase === "development" || p.phase === "qa" || p.phase === "released"
  );
  if (!hasActiveConsoles && !hasActiveProjects) {
    // Company is idle — reputation and fans erode
    reputation = Math.max(0, reputation - 1.5);
    fans = Math.max(0, fans - Math.round(fans * 0.015));
  }

  // ── Shadow Investor: equity drain ────────────────────────────────────────────
  const siInit: ShadowInvestorState = {
    pending: false, collectionDue: false, dealType: null,
    bailoutAmount: 0, debtAmount: 0, equityPercent: 0,
    equityDrainPerMonth: 0, performanceMonthsLeft: 0,
    cooldownUntilMonthIdx: 0, usedCount: 0, collectionTitle: "",
  };
  const si = state.shadowInvestor ?? siInit;
  const siMonthIdx = year * 12 + month;

  // 1. Apply equity drain each month when equity deal is active
  if (si.dealType === "equity" && si.equityDrainPerMonth > 0) {
    money -= Math.round(si.equityDrainPerMonth);
  }

  // 2. Tick down performance contract
  let siPerfLeft = si.performanceMonthsLeft;
  if (si.dealType === "performance" && siPerfLeft > 0) siPerfLeft = Math.max(0, siPerfLeft - 1);

  // 3. Debt collection trigger: fire when the company is recovering
  let siCollDue = si.collectionDue;
  let siCollTitle = si.collectionTitle;
  if (si.dealType === "debt" && !si.collectionDue && si.debtAmount > 0
      && money > Math.max(si.bailoutAmount * 1.5, 250_000)) {
    siCollDue = true;
    const titles = ["A Conta Chegou", "Cobrança Silenciosa", "Eles Voltaram", "Contrato Executado"];
    siCollTitle = titles[Math.floor(Math.random() * titles.length)];
  }

  // 4. Trigger new shadow offer when all crisis conditions are met
  let siPending = si.pending;
  const loansHeld = (state.activeLoans ?? []).length;
  const loanLimitReached = loansHeld >= 2;
  const inDebtCrisis = money < -150_000;
  const pastEarlyGame = year >= 1975;
  const noPendingShadow = !si.pending && !si.collectionDue && si.dealType === null;
  const cooldownOk = siMonthIdx >= si.cooldownUntilMonthIdx;
  if (inDebtCrisis && loanLimitReached && pastEarlyGame && noPendingShadow && cooldownOk
      && Math.random() < 0.04) {
    siPending = true;
  }

  const newShadowInvestor: ShadowInvestorState = {
    ...si,
    pending: siPending,
    collectionDue: siCollDue,
    performanceMonthsLeft: siPerfLeft,
    collectionTitle: siCollTitle,
  };

  // ── Loan repayments ───────────────────────────────────────────────────────────
  let loanPaymentTotal = 0;
  let totalLoansPaid = state.totalLoansPaid ?? 0;
  const updatedLoans: ActiveLoan[] = [];
  for (const loan of (state.activeLoans ?? [])) {
    const monthsLeft = Number.isFinite(loan.monthsRemaining) ? loan.monthsRemaining : 0;
    if (monthsLeft <= 0) continue;
    // Guard payment — a single NaN loan payment poisons the entire money variable
    const payment = Number.isFinite(loan.monthlyPayment) ? loan.monthlyPayment : 0;
    money -= payment;
    loanPaymentTotal += payment;
    totalLoansPaid += payment;
    const newRemaining = monthsLeft - 1;
    if (newRemaining > 0) {
      const nextM = loan.nextPaymentMonth === 12 ? 1 : (loan.nextPaymentMonth ?? 1) + 1;
      const nextY = loan.nextPaymentMonth === 12 ? (loan.nextPaymentYear ?? year) + 1 : (loan.nextPaymentYear ?? year);
      const prevRemaining = Number.isFinite(loan.remainingAmount) ? loan.remainingAmount : 0;
      updatedLoans.push({
        ...loan,
        remainingAmount: Math.max(0, prevRemaining - payment),
        monthsRemaining: newRemaining,
        nextPaymentMonth: nextM,
        nextPaymentYear: nextY,
      });
    }
  }

  // ── Monthly financial snapshot ────────────────────────────────────────────────
  // Revenue = all gross income sources (console + games + global market + acquisitions).
  // Expenses = deterministic operating costs (offices + salaries + maintenance + overhead
  //            + branches + loan payments). Excludes taxes and event-driven changes
  //            so the snapshot reflects the core operational P&L before random shocks.
  const monthlyRevTotal = safeN(grossRevenue, 0) + Math.max(0, safeN(acqNetMonthly, 0));
  const monthlyExpTotal = (officeCost - adminSaving)
    + teamOfficeMaint
    + empSalaries
    + maintenanceCost
    + baseOverhead
    + branchCosts
    + loanPaymentTotal;
  const newFinancialSnapshot: FinancialSnapshot = {
    year,
    month,
    revenue:  Math.round(monthlyRevTotal),
    expenses: Math.round(monthlyExpTotal),
    profit:   Math.round(monthlyRevTotal - monthlyExpTotal),
    cash:     Math.round(money),
  };
  const newFinancialHistory: FinancialSnapshot[] = [
    ...(state.financialHistory ?? []),
    newFinancialSnapshot,
  ].slice(-24); // rolling 24-month window

  // ── Credit rating update ──────────────────────────────────────────────────────
  let newCreditRating = calculateCreditRating(
    money,
    state.totalRevenue + totalRevenue,
    totalRevenue + (gameProjectRevenue ?? 0),
    updatedLoans,
    reputation,
  );

  // ── Investor mechanics: dividends, board pressure, takeover risk ────────────
  const playerSharesCurrent = state.playerShares ?? TOTAL_SHARES;
  const investorShareCount  = (state.totalShares ?? TOTAL_SHARES) - playerSharesCurrent;
  const investorOwnershipPct = investorShareCount / TOTAL_SHARES; // 0.0–1.0
  const investors = state.investors ?? [];
  let updatedInvestors: typeof investors = [...investors];

  // Monthly dividend outflow: investors collectively earn 1.8% annual on their share of company value.
  // This is a REAL recurring cost that grows as investors own more and the company grows in value.
  // Estimated value for dividend purposes uses previous state's value to avoid circular dependency.
  const prevCompanyValue = state.companyValue ?? 0;
  const monthlyDividend = prevCompanyValue > 0
    ? Math.round(prevCompanyValue * investorOwnershipPct * (0.018 / 12))
    : 0;
  if (monthlyDividend > 0) money -= monthlyDividend;

  // newsItems accumulates all news for this tick — declared here so board pressure
  // and takeover blocks (below) can prepend entries before the main news generation.
  let newsItems: NewsItem[] = [...state.news];

  // ── Legal Contract: expiry news (inserted here because newsItems is now declared) ──
  if (_legalJustExpired && newLegalContract) {
    const _legalTierNames: Record<LegalTierId, string> = {
      basico: "Jurídico Básico",
      profissional: "Jurídico Profissional",
      elite: "Jurídico Elite",
    };
    const _expiryNews: NewsItem = {
      id: `legal_expired_${year}_${month}`,
      year, month,
      category: "crisis",
      title: "⚖️ Contrato Jurídico Expirou",
      body: `Seu contrato com a equipe de ${_legalTierNames[newLegalContract.tierId]} chegou ao fim. Sua empresa não conta mais com proteção jurídica automática. Acesse Escritórios → Executivo → Jurídico para renovar ou contratar um novo plano.`,
      moneyDelta: 0, fansDelta: 0, reputationDelta: 0,
      isRead: false,
    };
    newsItems = [_expiryNews, ...newsItems];
  }

  // Merge critical branch incident news (generated earlier in processedBranches loop)
  if (branchIncidentNews.length > 0) {
    newsItems = [...branchIncidentNews, ...newsItems];
  }

  // ── Financial Rescue System ───────────────────────────────────────────────────
  const _rescMonthIdx = year * 12 + month;
  const _rcOfferInit: RescueOfferState = {
    pending: false, amount: 0,
    bankMonthlyPayment: 0, bankTotalOwed: 0, bankMonths: 36,
    investorEquityPercent: 0.20, investorEquityDrain: 0,
    investorRevSharePercent: 0.25, investorRevShareOwed: 0,
    cooldownUntilMonthIdx: 0,
  };
  let _rcOffer: RescueOfferState = { ..._rcOfferInit, ...(state.rescueOffer ?? {}) };
  let _rcContract: ActiveRescueContract | undefined = state.rescueContract;
  let _rescueSeizedBranchIds: string[] = [];
  let _rescueSeizedGameIds:   string[] = [];

  // 1. Apply effects of any active rescue contract
  if (_rcContract) {
    if (_rcContract.dealType === "bank" && _rcContract.monthsRemaining > 0 && !_rcContract.seized) {
      if (money >= _rcContract.monthlyPayment) {
        money -= _rcContract.monthlyPayment;
        const _bankLeft = _rcContract.monthsRemaining - 1;
        if (_bankLeft <= 0) {
          _rcContract = undefined;
          newsItems = [{
            id: `rescue_bank_paid_${_rescMonthIdx}`,
            year, month, category: "growth" as NewsCategory,
            title: "Resgate Bancário Quitado",
            body: "A empresa quitou integralmente o contrato de resgate bancário. Os ativos em garantia foram liberados.",
            moneyDelta: 0, fansDelta: 0, reputationDelta: 2, isRead: false,
          }, ...newsItems];
        } else {
          _rcContract = { ..._rcContract, monthsRemaining: _bankLeft, missedPayments: 0 };
        }
      } else {
        const _missed = _rcContract.missedPayments + 1;
        if (_missed >= 3) {
          _rescueSeizedBranchIds = [..._rcContract.collateralBranchIds];
          _rescueSeizedGameIds   = [..._rcContract.collateralGameIds];
          _rcContract = { ..._rcContract, missedPayments: _missed, seized: true, monthsRemaining: 0 };
          newsItems = [{
            id: `rescue_seized_${_rescMonthIdx}`,
            year, month, category: "crisis" as NewsCategory,
            title: "Ativos Confiscados pelo Banco Resgatador",
            body: "3 meses consecutivos sem pagamento. O banco executou as garantias: filiais e propriedades intelectuais foram confiscadas.",
            moneyDelta: 0, fansDelta: -500, reputationDelta: -8, isRead: false,
          }, ...newsItems];
        } else {
          _rcContract = { ..._rcContract, missedPayments: _missed };
        }
      }
    } else if (_rcContract.dealType === "investor_equity") {
      money -= Math.round(_rcContract.monthlyDrain);
    } else if (_rcContract.dealType === "investor_revenue") {
      if (_rcContract.amountRepaid < _rcContract.totalOwed && monthlyRevTotal > 0) {
        const _revDrain  = Math.round(monthlyRevTotal * _rcContract.revenueSharePercent);
        const _applied   = Math.min(_revDrain, Math.max(0, _rcContract.totalOwed - _rcContract.amountRepaid));
        money -= _applied;
        const _newRepaid = _rcContract.amountRepaid + _applied;
        if (_newRepaid >= _rcContract.totalOwed) {
          _rcContract = undefined;
          newsItems = [{
            id: `rescue_revshare_paid_${_rescMonthIdx}`,
            year, month, category: "growth" as NewsCategory,
            title: "Participação nos Lucros Quitada",
            body: "O investidor de resgate foi integralmente remunerado. A cota mensal de receita foi encerrada.",
            moneyDelta: 0, fansDelta: 0, reputationDelta: 1, isRead: false,
          }, ...newsItems];
        } else {
          _rcContract = { ..._rcContract, amountRepaid: _newRepaid };
        }
      }
    }
  }

  // 2. Check whether to trigger a new rescue offer
  const _rescueTrigger = (
    money < 0
    && monthlyRevTotal < monthlyExpTotal
    && year >= 1974
    && !_rcOffer.pending
    && !_rcContract
    && si.dealType === null && !si.pending && !siPending
    && _rescMonthIdx >= _rcOffer.cooldownUntilMonthIdx
  );
  if (_rescueTrigger) {
    const _rescAmt   = Math.min(50_000_000, Math.max(100_000, Math.round(Math.abs(money) + monthlyExpTotal * 3)));
    const _bRate     = 0.42;
    const _bMonths   = 36;
    const _bMR       = _bRate / 12;
    const _bPmt      = Math.round(_rescAmt * _bMR / (1 - Math.pow(1 + _bMR, -_bMonths)));
    const _bOwed     = _bPmt * _bMonths;
    const _eqDrain   = Math.round(_rescAmt * 0.005);
    const _rvOwed    = Math.round(_rescAmt * 1.35);
    _rcOffer = {
      pending:                  true,
      amount:                   _rescAmt,
      bankMonthlyPayment:       _bPmt,
      bankTotalOwed:            _bOwed,
      bankMonths:               _bMonths,
      investorEquityPercent:    0.20,
      investorEquityDrain:      _eqDrain,
      investorRevSharePercent:  0.25,
      investorRevShareOwed:     _rvOwed,
      cooldownUntilMonthIdx:    _rescMonthIdx + 18,
    };
  }

  const newRescueOffer: RescueOfferState        = _rcOffer;
  const newRescueContract: ActiveRescueContract | undefined = _rcContract;

  // ── Console development completions ───────────────────────────────────────────
  // When a console finishes development this tick, add a news item notifying the player.
  newlyCompletedConsoleIds.forEach((cid) => {
    const launched = consolesAfterDev.find((c) => c.id === cid);
    if (!launched) return;
    const devMonths = launched.devTimeMonths ?? 18;
    newsItems = [
      {
        id: `console_dev_done_${cid}_${year}_${month}`,
        year,
        month,
        category: "launch" as NewsCategory,
        title: `🎮 ${launched.name} concluído!`,
        body: `Após ${devMonths} meses de desenvolvimento, o ${launched.name} está pronto para o mercado!\n\nQualidade estimada: ${(launched.quality ?? 5).toFixed(1)}/10 · Avaliação: ${launched.receptionScore ?? "—"}/100`,
        moneyDelta: 0,
        fansDelta: 0,
        reputationDelta: 0,
        isRead: false,
      },
      ...newsItems,
    ];
  });

  // ── Console reception buzz (industry reaction — cosmetic, data-driven) ─────────
  // Fires only for consoles scored ≥85 (critical acclaim) or ≤50 (concern).
  // Separate from the dev-complete notification above — this is external media reaction.
  // Zero gameplay impact: all deltas zero.
  newlyCompletedConsoleIds.forEach((cid) => {
    const _launched = consolesAfterDev.find((c) => c.id === cid);
    if (!_launched) return;
    const _score = _launched.receptionScore ?? 0;
    if (_score >= 85) {
      newsItems = [{
        id: `console_acclaim_${cid}_${year}_${month}`,
        year, month,
        category: "award" as NewsCategory,
        title: `🏆 ${_launched.name} recebe aclamação da crítica`,
        body: `Com nota ${_score}/100, o ${_launched.name} é celebrado como um dos destaques da geração. Veículos especializados elogiam a qualidade e inovação do hardware.`,
        moneyDelta: 0, fansDelta: 0, reputationDelta: 0, isRead: false,
      }, ...newsItems];
    } else if (_score > 0 && _score <= 50) {
      newsItems = [{
        id: `console_concern_${cid}_${year}_${month}`,
        year, month,
        category: "crisis" as NewsCategory,
        title: `⚠️ ${_launched.name} recebe críticas negativas do mercado`,
        body: `Com nota de apenas ${_score}/100, o ${_launched.name} não correspondeu às expectativas. Analistas questionam as decisões de desenvolvimento e o futuro da linha.`,
        moneyDelta: 0, fansDelta: 0, reputationDelta: 0, isRead: false,
      }, ...newsItems];
    }
  });

  // ── Exclusive tech completion news ──────────────────────────────────────────
  // Exclusive techs are rare breakthroughs — they generate their own headline
  // that persists in the news feed as a permanent record of the milestone.
  if (justCompletedExcl) {
    const isLeg = justCompletedExcl.rarity === "legendary";
    const fanBurst = Math.round((justCompletedExcl.bonus.fansBonus ?? 0) * 0.20);
    const exclNews: NewsItem = {
      id: `excl_unlock_${justCompletedExcl.id}_${year}_${month}`,
      year: year,
      month: month,
      category: "tech" as NewsCategory,
      title: isLeg
        ? `MEGACORP desvela tecnologia lendária: "${justCompletedExcl.name}"`
        : `Novo marco: MEGACORP conclui pesquisa exclusiva "${justCompletedExcl.name}"`,
      body: `${justCompletedExcl.description} Efeito permanente desbloqueado: ${justCompletedExcl.effectLabel}.${isLeg ? " Rivais em alerta máximo." : ""}`,
      moneyDelta: 0,
      fansDelta: fanBurst,
      reputationDelta: isLeg ? 28 : 12,
      isRead: false,
    };
    newsItems = [exclNews, ...newsItems];
  }

  // Board pressure: if investors own >40% they can influence strategy,
  // causing reputation erosion — representing management conflicts, press coverage of disputes, etc.
  let boardPressureNews: NewsItem | null = null;
  if (investorOwnershipPct >= 0.40 && month % 3 === 0) {
    const pressureSeverity = investorOwnershipPct >= 0.60 ? "crítica" : "moderada";
    const repPenalty = investorOwnershipPct >= 0.60 ? 1.5 : 0.6;
    // Crisis Management Firm holding: nullifies board pressure reputation damage
    if (!localHoldings.includes("crisis_firm")) {
      reputation = Math.max(0, reputation - repPenalty);
    }
    if (investorOwnershipPct >= 0.60 || month === 3 || month === 9) {
      boardPressureNews = {
        id: `board_pressure_${year}_${month}`,
        year: year,
        month: month,
        category: "crisis" as const,
        title: `⚠️ Pressão do Conselho de Acionistas`,
        body: `Investidores externos controlam ${Math.round(investorOwnershipPct * 100)}% da empresa. A pressão ${pressureSeverity} do conselho está a afetar a reputação e a capacidade de decisão executiva. Considera recomprar ações para recuperar controlo.`,
        moneyDelta: 0,
        fansDelta: 0,
        reputationDelta: -repPenalty,
        isRead: false,
      };
      newsItems = [boardPressureNews, ...newsItems];
    }
  }

  // Predatory investor takeover threat: if a predatory investor holds ≥15% AND
  // player owns <30%, they issue a hostile takeover threat (news + morale hit).
  const hasPredatoryInvestor = investors.some((inv) => inv.personality === "predatory");
  const playerOwnershipPct = playerSharesCurrent / TOTAL_SHARES;
  if (hasPredatoryInvestor && playerOwnershipPct < 0.30 && month % 4 === 0) {
    const predatory = investors.find((inv) => inv.personality === "predatory")!;
    const predatoryPct = Math.round((predatory.sharesOwned / TOTAL_SHARES) * 100);
    const repLoss = 2.0;
    reputation = Math.max(0, reputation - repLoss);
    const takeoverNews: NewsItem = {
      id: `takeover_threat_${year}_${month}`,
      year: year,
      month: month,
      category: "crisis" as const,
      title: `🦈 Ameaça de Tomada Hostil — ${predatory.name}`,
      body: `${predatory.name} (${predatoryPct}% das ações) está a preparar uma oferta de aquisição hostil. Com apenas ${Math.round(playerOwnershipPct * 100)}% de controlo, a empresa está vulnerável. Recompra ações urgentemente ou encontra um investidor aliado para bloquear a manobra.`,
      moneyDelta: 0,
      fansDelta: 0,
      reputationDelta: -repLoss,
      isRead: false,
    };
    newsItems = [takeoverNews, ...newsItems];
  }

  // ── Shareholder Satisfaction monthly drift ────────────────────────────────
  let newShareholderSatisfaction = state.shareholderSatisfaction ?? 70;
  let shareholderPromisePending  = state.shareholderPromisePending ?? false;
  let exitedInvestorShares       = 0; // shares returned to player if an investor exits

  if (updatedInvestors.length > 0) {
    // Estimated monthly profit for this tick (rough — used only for drift signal)
    const estProfit = (totalRevenue + gameProjectRevenue) - (officeCost + branchCosts + empSalaries);

    // Profitability drift: investors love growing profits
    if      (estProfit > 2_000_000) newShareholderSatisfaction += 3;
    else if (estProfit > 500_000)   newShareholderSatisfaction += 2;
    else if (estProfit > 0)         newShareholderSatisfaction += 1;
    else if (estProfit < -500_000)  newShareholderSatisfaction -= 4;
    else                            newShareholderSatisfaction -= 2;

    // Board control: high external ownership → frustration at lack of full control
    if      (investorOwnershipPct >= 0.60) newShareholderSatisfaction -= 3;
    else if (investorOwnershipPct >= 0.40) newShareholderSatisfaction -= 1;

    // Reputation health signal
    if      (reputation >= 70) newShareholderSatisfaction += 1;
    else if (reputation < 40)  newShareholderSatisfaction -= 1;

    // Predatory investors always create instability & pressure
    if (hasPredatoryInvestor) newShareholderSatisfaction -= 2;

    // Broken promise: promised growth but lost money
    if (shareholderPromisePending) {
      if (estProfit <= 0) {
        newShareholderSatisfaction -= 12;
        reputation = Math.max(0, reputation - 2);
        newsItems = [
          {
            id: `shareholder_broken_promise_${year}_${month}`,
            year, month, category: "crisis" as NewsCategory,
            title: "💔 Promessa aos Acionistas Quebrada",
            body: "As projeções otimistas não se concretizaram. Os acionistas estão furiosos com a liderança. A confiança no conselho caiu.",
            moneyDelta: 0, fansDelta: 0, reputationDelta: -2,
            isRead: false,
          },
          ...newsItems,
        ];
      }
      shareholderPromisePending = false;
    }

    newShareholderSatisfaction = Math.max(0, Math.min(100, newShareholderSatisfaction));

    // Low satisfaction: public warning news every 2 months
    if (newShareholderSatisfaction < 28 && month % 2 === 0) {
      newsItems = [
        {
          id: `shareholder_dissatisfied_${year}_${month}`,
          year, month, category: "crisis" as NewsCategory,
          title: "😤 Acionistas Insatisfeitos",
          body: `A satisfação dos acionistas caiu para ${Math.round(newShareholderSatisfaction)}%. Os investidores estão ameaçando vender posições se os resultados não melhorarem.`,
          moneyDelta: 0, fansDelta: 0, reputationDelta: -1,
          isRead: false,
        },
        ...newsItems,
      ];
      reputation = Math.max(0, reputation - 1);
    }

    // Critical satisfaction: investor exits (25% chance when sat < 12)
    if (newShareholderSatisfaction < 12 && Math.random() < 0.25 && updatedInvestors.length > 0) {
      const leaving = [...updatedInvestors].sort((a, b) => a.sharesOwned - b.sharesOwned)[0];
      updatedInvestors = updatedInvestors.filter((i) => i.id !== leaving.id);
      exitedInvestorShares = leaving.sharesOwned; // shares returned to player
      const leavingPct = Math.round((leaving.sharesOwned / TOTAL_SHARES) * 100);
      newShareholderSatisfaction = 45; // reset after departure
      reputation = Math.max(0, reputation - 2);
      newsItems = [
        {
          id: `investor_exit_${year}_${month}`,
          year, month, category: "crisis" as NewsCategory,
          title: `🚪 ${leaving.name} Saiu da Empresa`,
          body: `Após meses de insatisfação crescente, ${leaving.name} (${leavingPct}%) vendeu toda a participação no mercado aberto. A saída repentina abalou a confiança dos acionistas remanescentes.`,
          moneyDelta: 0, fansDelta: 0, reputationDelta: -2,
          isRead: false,
        },
        ...newsItems,
      ];
    }
  }

  // ── Geopolitical Shareholder Conflict (monthly processing) ─────────────────
  // Detect country-pair tensions among current investors and apply probabilistic
  // effects — both negative (efficiency loss, rep damage) and positive (investment
  // bonus, market access). Players can negotiate to halve effects for 6 months.
  let newGeoNegotiationMonthsLeft = Math.max(0, (state.geoConflictNegotiationMonthsLeft ?? 0) - 1);

  if (updatedInvestors.length >= 2) {
    const _geoPairs = detectInvestorConflicts(updatedInvestors);
    const _geoMax   = getMaxConflictLevel(_geoPairs);

    if (_geoMax && _geoPairs.length > 0) {
      // Monthly trigger probability scales with conflict intensity
      const _triggerChance =
        _geoMax === "high"   ? 0.30 :
        _geoMax === "medium" ? 0.18 : 0.07;
      // Active negotiation halves the chance
      const _effectiveChance = newGeoNegotiationMonthsLeft > 0
        ? _triggerChance * 0.5
        : _triggerChance;

      if (Math.random() < _effectiveChance) {
        const _pair = _geoPairs[Math.floor(Math.random() * _geoPairs.length)];
        const _roll  = Math.random();

        if (_roll < 0.20) {
          // ── Positive: investment surge ────────────────────────────────────
          const _bonus = Math.round(Math.random() * 150_000 + 50_000);
          money += _bonus;
          newsItems = [{
            id: `geo_invest_${year}_${month}`,
            year, month, category: "growth" as NewsCategory,
            title: `💹 ${_pair.flagA}${_pair.flagB} Investidores Injetam Capital`,
            body: `Apesar das tensões geopolíticas entre ${_pair.countryA} e ${_pair.countryB}, ambos os acionistas concordaram numa injeção de capital adicional de $${(_bonus/1000).toFixed(0)}K para proteger os seus investimentos.`,
            moneyDelta: _bonus, fansDelta: 0, reputationDelta: 0, isRead: false,
          }, ...newsItems];
        } else if (_roll < 0.30) {
          // ── Positive: market access opportunity ──────────────────────────
          const _repGain = Math.round(Math.random() * 3 + 1);
          reputation = Math.min(100, reputation + _repGain);
          newsItems = [{
            id: `geo_mktaccess_${year}_${month}`,
            year, month, category: "growth" as NewsCategory,
            title: `🌐 ${_pair.flagA}${_pair.flagB} Acesso a Novos Mercados`,
            body: `A presença simultânea de acionistas de ${_pair.countryA} e ${_pair.countryB} abriu portas em mercados que seriam difíceis de aceder individualmente. Reputação +${_repGain}.`,
            moneyDelta: 0, fansDelta: 0, reputationDelta: _repGain, isRead: false,
          }, ...newsItems];
        } else if (_roll < 0.55) {
          // ── Negative: efficiency loss / internal friction ─────────────────
          const _extraCost = Math.round((_geoMax === "high" ? 80_000 : _geoMax === "medium" ? 40_000 : 15_000) * (Math.random() * 0.6 + 0.7));
          money -= _extraCost;
          const _negVariants = [
            { t: `⚡ ${_pair.flagA}${_pair.flagB} Conflito Interno Afeta Eficiência`, b: `Desentendimentos entre os acionistas de ${_pair.countryA} e ${_pair.countryB} geraram fricção interna. A equipa de gestão perdeu tempo e recursos a gerir o impasse. Custo extra: $${(_extraCost/1000).toFixed(0)}K.` },
            { t: `🏛️ ${_pair.flagA}${_pair.flagB} Tensão Geopolítica no Conselho`, b: `Pressão política entre ${_pair.countryA} e ${_pair.countryB} chegou à sala de reuniões. As decisões estratégicas atrasaram-se devido a vetos cruzados. Custo operacional: $${(_extraCost/1000).toFixed(0)}K.` },
          ];
          const _nv = _negVariants[Math.floor(Math.random() * _negVariants.length)];
          newsItems = [{
            id: `geo_friction_${year}_${month}`,
            year, month, category: "crisis" as NewsCategory,
            title: _nv.t, body: _nv.b,
            moneyDelta: -_extraCost, fansDelta: 0, reputationDelta: 0, isRead: false,
          }, ...newsItems];
        } else if (_roll < 0.75) {
          // ── Negative: reputation damage ────────────────────────────────────
          const _repLoss = Math.round((_geoMax === "high" ? 4 : _geoMax === "medium" ? 2.5 : 1.2) * (Math.random() * 0.5 + 0.75));
          reputation = Math.max(0, reputation - _repLoss);
          newsItems = [{
            id: `geo_rep_${year}_${month}`,
            year, month, category: "crisis" as NewsCategory,
            title: `📰 ${_pair.flagA}${_pair.flagB} Conflito Político Afeta Reputação`,
            body: `A imprensa destacou as divergências entre os investidores de ${_pair.countryA} e ${_pair.countryB} na empresa. A percepção pública de instabilidade na gestão reduziu a confiança do mercado. Reputação −${_repLoss.toFixed(1)}.`,
            moneyDelta: 0, fansDelta: 0, reputationDelta: -_repLoss, isRead: false,
          }, ...newsItems];
        } else {
          // ── Negative: project decision conflict (generates news + morale drain) ─
          const _activeProject = (state.gameProjects ?? []).find(p => p.phase === "development" || p.phase === "alpha");
          const _delayLabel = _activeProject ? `"${_activeProject.name}"` : "projetos em curso";
          const _moraleCost = _geoMax === "high" ? 30_000 : 15_000;
          money -= _moraleCost;
          newsItems = [{
            id: `geo_delay_${year}_${month}`,
            year, month, category: "crisis" as NewsCategory,
            title: `⏳ ${_pair.flagA}${_pair.flagB} Desentendimento Atrasa Decisões`,
            body: `Conflito de interesses entre os acionistas de ${_pair.countryA} e ${_pair.countryB} atrasou aprovações internas relativas a ${_delayLabel}. A gestão executiva dedicou tempo extra a mediar a crise. Custo extra: $${(_moraleCost/1000).toFixed(0)}K.`,
            moneyDelta: -_moraleCost, fansDelta: 0, reputationDelta: 0, isRead: false,
          }, ...newsItems];
        }
      }
    }
  }

  // Valuation-based credit floor: large companies earn better credit access.
  // A company worth $50M+ shouldn't be stuck at junk bond ratings from a bad month.
  const creditOrder: CreditRating[] = ["D", "CCC", "B", "BB", "BBB", "A", "AA", "AAA"];
  const creditFloor: CreditRating | null =
    prevCompanyValue >= 500_000_000 ? "AA"
    : prevCompanyValue >= 100_000_000 ? "A"
    : prevCompanyValue >= 50_000_000  ? "BBB"
    : prevCompanyValue >= 10_000_000  ? "BB"
    : null;
  if (creditFloor) {
    const floorIdx   = creditOrder.indexOf(creditFloor);
    const currentIdx = creditOrder.indexOf(newCreditRating);
    if (currentIdx < floorIdx) newCreditRating = creditFloor;
  }

  // ── Rival Company AI Simulation ──────────────────────────────────────────────
  // Each rival manages their own finances, innovates, and can go bankrupt.
  let bankruptNewsItem: NewsItem | null = null;
  let revivalOutcomeNews: NewsItem | null = null; // fires once when a revival period ends

  const updatedCompetitors: Competitor[] = state.competitors.map((c) => {
    // Dead rivals: slowly decay market share to zero, preserve acquisition data
    if (!c.alive) {
      return { ...c, marketShare: Math.max(0, (c.marketShare ?? 0) - 0.3) };
    }

    const innovation       = c.innovation ?? 60;
    const money            = c.money ?? 3_000_000;
    const currentCrisis    = c.crisisMonths ?? 0;

    // ── AI Era Evolution layer ───────────────────────────────────────────────
    // Thin multiplier applied on top of all existing calculations. Early eras
    // produce less efficient, more mistake-prone AI; late eras produce sharper
    // but still fallible behaviour. None of the base formulas are replaced.
    const _eraFactor = getAIEraFactor(year);           // 0.0 (1972) → 1.0 (2030)
    // Early AI wastes budget — overhead creep up to +8% of revenue in 1972
    const _earlyExpenseWaste = (1 - _eraFactor) * 0.08;
    // Early AI makes worse investment decisions — stronger downward shock bias
    const _shockBias = 0.40 + (1 - _eraFactor) * 0.10; // 0.50 in 1972 → 0.40 in 2030

    // ── Revenue & expense simulation ────────────────────────────────────────
    // Revenue scales with market share × innovation quality
    const estMonthlyRevenue = Math.max(0,
      (c.marketShare ?? 5) * 75_000 * (1 + innovation / 250),
    );
    // Expenses: 62% of revenue + fixed overhead; early-era AI burns more budget
    const monthlyExpenses = estMonthlyRevenue * (0.62 + _earlyExpenseWaste) + 25_000;

    // ── Proper monthly P&L (revenue - expenses + random shock) ──────────────
    // Replaces the previous pure-random formula; rivals now grow when profitable.
    const monthlyProfit = estMonthlyRevenue - monthlyExpenses;
    // Early-era shock has stronger downward bias — bad investments, poor timing
    const moneyShock = (Math.random() - _shockBias) * 60_000;
    const newMoney = money + monthlyProfit + moneyShock;

    // ── Reputation drift (innovation-guided, stronger signal) ────────────────
    const repTrend = innovation >= 70 ? 0.8 : innovation <= 35 ? -0.8 : 0.2;
    const newRep   = Math.max(0, Math.min(100,
      c.reputation + Math.random() * 8 - 3.5 + repTrend,
    ));

    // ── Innovation drift — style-specific variance (Parts 3-6) ─────────────────
    // Each style has its own risk/reward profile, creating genuinely different
    // company personalities and making rankings change organically over time.
    let innovDelta: number;
    switch (c.style) {
      case "innovation_first":
        // Boom-or-bust: occasional breakthroughs, occasional complete failures
        innovDelta = Math.random() < 0.15 ? Math.random() * 18 + 8    // 15%: breakthrough +8→+26
                   : Math.random() < 0.15 ? -(Math.random() * 14 + 6) // 15%: flop −6→−20
                   : Math.random() * 6 - 2;                            // 70%: normal −2→+4
        break;
      case "tech_focused":
        // Steady climber with occasional tech jumps; rarely crashes
        innovDelta = Math.random() < 0.12 ? Math.random() * 12 + 5    // 12%: tech leap +5→+17
                   : Math.random() * 5 - 1.2;                          // steady −1.2→+3.8
        break;
      case "franchise_focused":
        // Moderate variance driven by franchise cycles; safe but capped
        innovDelta = Math.random() * 5 - 1.5;                          // −1.5→+3.5
        break;
      case "safe_profit":
        // Low variance, conservative: rarely gains or loses much
        innovDelta = Math.random() * 3 - 1.8;                          // −1.8→+1.2 (slight neg bias)
        break;
      case "mass_market":
        // High variance and market-sensitive; swings both ways
        innovDelta = Math.random() * 10 - 4;                           // −4→+6
        break;
      default:
        innovDelta = Math.random() * 5 - 1.5;
    }
    // ── Era innovation noise (point 3 of era evolution layer) ───────────────
    // Early-era AI adds raw luck variance on top of style-driven delta —
    // amplifying both mistakes and lucky breaks without touching style logic.
    // Noise shrinks to ±0 by era 1.0, preserving late-era determinism.
    const _eraInnovNoise = (1 - _eraFactor) * (Math.random() * 7 - 2.5); // ±3.5 in 1972 → 0 in 2030
    const newInnovation = Math.max(10, Math.min(100, innovation + innovDelta + _eraInnovNoise));

    // ── Financial health & crisis tracking ───────────────────────────────────
    const newFinancialHealth: CompetitorFinancialHealth =
      newMoney < 0                    ? "bankrupt" :
      newMoney < monthlyExpenses      ? "critical" :
      newMoney < monthlyExpenses * 3  ? "struggling" :
      "healthy";

    // ── Era crisis recovery boost (point 4 of era evolution layer) ──────────
    // Late-era companies are better at restructuring and pulling out of crises.
    // In the final eras (factor ≥ 0.55), there's a probabilistic extra recovery
    // tick each healthy month — up to 40% chance per month at max era.
    const _extraRecovery =
      (_eraFactor >= 0.55 && currentCrisis > 0 &&
       (newFinancialHealth === "healthy" || newFinancialHealth === "struggling") &&
       Math.random() < (_eraFactor - 0.55) * 0.88)
        ? 1 : 0;

    // Crisis accumulates when distressed; recovers 1 month for every healthy month
    // (plus an extra tick in late-era when above threshold — see _extraRecovery)
    const newCrisisMonths =
      (newFinancialHealth === "critical" || newFinancialHealth === "bankrupt")
        ? currentCrisis + 1
        : Math.max(0, currentCrisis - 1 - _extraRecovery);

    // ── Bankruptcy: graduated (6+ crisis months) or deeply negative ─────────
    // Increased from 4 to 6 to give rivals more time to recover — rivals are resilient.
    const deeplyNegative = newMoney < -800_000;
    const crisisThreshold = newCrisisMonths >= 6;
    if ((deeplyNegative || crisisThreshold) && !bankruptNewsItem) {
      const mv = computeRivalMarketValue({ ...c, money: Math.round(newMoney), marketShare: c.marketShare });
      bankruptNewsItem = {
        id: `bankrupt_${c.id}_${year}_${month}`,
        year, month,
        category: "competitor",
        title: `💸 ${c.name} declarou falência`,
        body: `${c.name} não conseguiu recuperar das dificuldades financeiras e encerrou as operações. Podes comprar os seus ativos a preço de liquidação e absorver até ${(c.marketShare * 0.5).toFixed(1)}% da fatia de mercado.`,
        moneyDelta: 0, fansDelta: 0, reputationDelta: 0, isRead: false,
      };
      const assetPrice = Math.max(50_000, Math.round(mv * 0.25));
      return {
        ...c,
        alive: false,
        bankruptYear: year,
        bankruptMonth: month,
        money: Math.round(newMoney),
        marketShare: 0,
        reputation: Math.round(newRep * 10) / 10,
        financialHealth: "bankrupt" as CompetitorFinancialHealth,
        crisisMonths: newCrisisMonths,
        monthlyRevenue: 0,
        marketValue: 0,
        acquisitionPrice: assetPrice,
        isAcquirable: true,
      };
    }

    // ── Market share drift (innovation-weighted + dominance pressure) ───────────
    const innovationBonus = ((innovation - 50) / 100) * 1.5;
    // Breakthrough surge: ~2.5%/month chance when innovation ≥ 70
    const isSurgePeriod = innovation >= 70 && Math.random() < 0.025;
    const surgeBonus = isSurgePeriod ? (Math.random() * 3 + 1) * (innovation / 100) : 0;
    // Dominance pressure: large companies face competitive resistance from the field
    // preventing permanent single-company lock on the market (Part 5)
    const dominancePenalty = c.marketShare > 25 ? -(c.marketShare - 25) * 0.05 : 0;
    // ── Era share defense (point 5 of era evolution layer) ───────────────────
    // Late-era high-innovation companies defend their share better — they have
    // better market-reading, launch timing, and customer retention practices.
    // Capped at +0.45/month so it never guarantees growth (stays probabilistic).
    const _shareDefense = (_eraFactor >= 0.45 && innovation >= 60)
      ? (_eraFactor - 0.45) * 0.82                   // 0 → +0.45 across era 0.45–1.0
      : 0;
    const baseShare = c.marketShare + (Math.random() - 0.47) * 2.2 + innovationBonus + surgeBonus + dominancePenalty + _shareDefense;
    const legendaryShock = justCompletedExcl?.rarity === "legendary" ? 0.92 : 1.0;
    const newShare = Math.max(2, Math.min(50, baseShare * legendaryShock));

    // ── Strategic pivot (Part 4 — decision variation) ───────────────────────────
    // Companies that have been struggling for 2+ months may change strategy.
    // This keeps long-term AI behavior unpredictable — rivals won't be stuck forever.
    // ── Point 6 of era evolution layer: late-era companies pivot smarter ─────
    // At era ≥ 0.50, companies increasingly pick a pivot style that suits their
    // actual financial/innovation profile rather than choosing at random.
    // Randomness is still present at all eras — AI is never perfect.
    let newStyle = c.style;
    if (newCrisisMonths >= 2 && Math.random() < 0.025) {
      const styles: CompetitorStyle[] = ["tech_focused", "mass_market", "innovation_first", "safe_profit", "franchise_focused"];
      const alternatives = styles.filter(s => s !== c.style);
      const _smartPivotChance = _eraFactor >= 0.50 ? (_eraFactor - 0.50) * 1.6 : 0; // 0→0.80
      if (Math.random() < _smartPivotChance) {
        // Late-era: pick a pivot that aligns with the company's strongest asset
        const moneyBuffer = newMoney / Math.max(1, monthlyExpenses * 3);
        newStyle = newInnovation >= 68   ? "innovation_first"
                 : moneyBuffer > 1.5     ? "tech_focused"
                 : newRep >= 58          ? "franchise_focused"
                 : "safe_profit";
      } else {
        // Early-era (or random fallback): pivot is unpredictable
        newStyle = alternatives[Math.floor(Math.random() * alternatives.length)];
      }
    }

    // ── Compute market value & acquisition pricing ───────────────────────────
    const partialC = {
      ...c,
      money: Math.round(newMoney),
      marketShare: Math.round(newShare * 10) / 10,
      reputation: Math.round(newRep * 10) / 10,
      innovation: Math.round(newInnovation * 10) / 10,
      monthlyRevenue: Math.round(estMonthlyRevenue),
    };
    const mv = computeRivalMarketValue(partialC);

    // Healthy companies demand a premium; distressed companies accept less
    const acqMultiplier =
      newFinancialHealth === "critical"   ? 0.50 :
      newFinancialHealth === "struggling" ? 0.75 :
      1.35; // healthy — premium over market value
    const acqPrice = Math.max(100_000, Math.round(mv * acqMultiplier));

    // All alive rivals can be bid on; success chance and price vary by health
    const isAcquirable = true;

    // ── Legendary Revival boost ───────────────────────────────────────────────
    // Companies in a revival phase receive strong recovery buffs each month.
    // The boost period lasts 18 months; outcome is determined when it expires.
    const prevBoost = c.revivalBoostMonths ?? 0;
    const newRevivalBoostMonths = prevBoost > 0 ? prevBoost - 1 : 0;
    let newRevivalPhase = c.revivalPhase;

    // Recovery deltas applied on top of normal drift while boost is active
    const revR = (lo: number, hi: number) => Math.random() * (hi - lo) + lo;
    const innovBoost  = prevBoost > 0 ? revR(3, 11) : 0;  // +3 to +11 extra/month
    const repBoostDlt = prevBoost > 0 ? revR(1,  5) : 0;  // +1 to +5 extra/month
    const shareBoost  = prevBoost > 0 ? revR(0.5, 2) : 0; // +0.5 to +2 extra/month

    const finalInnovation = Math.min(100, newInnovation + innovBoost);
    const finalRep        = Math.min(100, newRep + repBoostDlt);
    const finalShare      = Math.min(50,  newShare + shareBoost);

    // When boost expires (just ticked from 1 → 0), lock in success or failure
    if (prevBoost === 1 && !revivalOutcomeNews) {
      const success = finalInnovation >= 55;
      newRevivalPhase = success ? "ascending" : "declined";
      revivalOutcomeNews = {
        id: `revival_outcome_${c.id}_${year}_${month}`,
        year, month, category: "competitor",
        title: success
          ? `🌟 ${c.name} completa uma reviravolta histórica!`
          : `😞 Reestruturação da ${c.name} não foi suficiente`,
        body: success
          ? `Depois de 18 meses de reestruturação, a ${c.name} emergiu como uma força renovada no mercado. O investimento valeu a pena — a empresa é agora um concorrente a levar a sério.`
          : `Apesar da aquisição e dos esforços de reestruturação, a ${c.name} não conseguiu sustentar a recuperação e volta a enfrentar dificuldades graves.`,
        moneyDelta: 0, fansDelta: 0, reputationDelta: 0, isRead: false,
      };
    }

    return {
      ...c,
      money:             Math.round(newMoney),
      reputation:        Math.round(finalRep * 10) / 10,
      marketShare:       Math.round(finalShare * 10) / 10,
      innovation:        Math.round(finalInnovation * 10) / 10,
      alive:             true,
      monthlyRevenue:    Math.round(estMonthlyRevenue),
      marketValue:       mv,
      financialHealth:   newFinancialHealth,
      crisisMonths:      newCrisisMonths,
      acquisitionPrice:  acqPrice,
      isAcquirable,
      revivalBoostMonths: newRevivalBoostMonths > 0 ? newRevivalBoostMonths : undefined,
      revivalPhase:       newRevivalPhase,
      style:              newStyle,
    };
  });

  // ── AI company behavior variation ────────────────────────────────────────────
  // Each alive competitor has an 8% monthly chance of experiencing a random event.
  // Events create news and alter the competitor's stats (both positive & negative)
  // so the game world feels dynamic — AI companies can fail, recover, and surprise.
  // At most 2 event-news items are injected per month to avoid flooding the feed.
  {
    const _aiNews: NewsItem[] = [];
    const _aiR = (lo: number, hi: number) => Math.round(Math.random() * (hi - lo) + lo);
    for (const c of updatedCompetitors) {
      if (!c.alive || Math.random() > 0.08) continue;
      const roll = Math.random();
      const _c = c as any; // safe mutation — these are fresh objects from the map above
      if (roll < 0.18) {
        // Bad game launch: reception tanks, reputation drops
        _c.innovation = Math.max(10, (c.innovation ?? 60) - _aiR(5, 14));
        _c.reputation = Math.max(0, (c.reputation ?? 50) - _aiR(4, 10));
        _aiNews.push({ id: `aiev_bl_${c.id}_${year}_${month}`, year, month, category: "competitor" as NewsCategory,
          title: `📉 ${c.name}: Lançamento Fracassado`,
          body: `O título mais recente da ${c.name} foi mal recebido por crítica e público. A empresa acusa impacto direto na reputação e revê a estratégia de lançamentos.`,
          moneyDelta: 0, fansDelta: 0, reputationDelta: 0, isRead: false });
      } else if (roll < 0.34) {
        // Major financial loss
        const loss = _aiR(200_000, 800_000);
        _c.money = (c.money ?? 3_000_000) - loss;
        _aiNews.push({ id: `aiev_fl_${c.id}_${year}_${month}`, year, month, category: "competitor" as NewsCategory,
          title: `💸 ${c.name}: Prejuízo Financeiro`,
          body: `A ${c.name} reportou perdas de $${(loss / 1_000).toFixed(0)}K este período, resultado de gastos excessivos e receitas abaixo do projetado. Analistas alertam para riscos futuros.`,
          moneyDelta: 0, fansDelta: 0, reputationDelta: 0, isRead: false });
      } else if (roll < 0.48) {
        // Studio layoffs: innovation hit + rep damage
        _c.innovation = Math.max(10, (c.innovation ?? 60) - _aiR(6, 14));
        _c.reputation = Math.max(0, (c.reputation ?? 50) - _aiR(5, 12));
        _aiNews.push({ id: `aiev_lf_${c.id}_${year}_${month}`, year, month, category: "competitor" as NewsCategory,
          title: `🔴 ${c.name}: Demissões em Massa`,
          body: `A ${c.name} anunciou corte significativo de pessoal após resultados frustrantes. A redução da equipa deve impactar a qualidade dos próximos projetos.`,
          moneyDelta: 0, fansDelta: 0, reputationDelta: 0, isRead: false });
      } else if (roll < 0.62) {
        // Critical bug backlash
        _c.reputation = Math.max(0, (c.reputation ?? 50) - _aiR(6, 14));
        _aiNews.push({ id: `aiev_bug_${c.id}_${year}_${month}`, year, month, category: "competitor" as NewsCategory,
          title: `🐛 ${c.name}: Bug Crítico Exposto`,
          body: `Um bug grave no produto mais recente da ${c.name} gerou revolta nas redes. A empresa prometeu correções urgentes, mas a reputação já sofreu danos significativos.`,
          moneyDelta: 0, fansDelta: 0, reputationDelta: 0, isRead: false });
      } else if (roll < 0.76) {
        // Poor strategic decisions
        _c.marketShare = Math.max(2, (c.marketShare ?? 5) - _aiR(1, 3));
        _c.innovation = Math.max(10, (c.innovation ?? 60) - _aiR(3, 9));
        _aiNews.push({ id: `aiev_st_${c.id}_${year}_${month}`, year, month, category: "competitor" as NewsCategory,
          title: `📊 ${c.name}: Decisão Estratégica Falhou`,
          body: `A ${c.name} apostou numa direção que não capturou o mercado esperado. Analistas criticam a falta de visão e a empresa perde terreno para os concorrentes.`,
          moneyDelta: 0, fansDelta: 0, reputationDelta: 0, isRead: false });
      } else {
        // Unexpected success: all stats improve
        _c.innovation = Math.min(100, (c.innovation ?? 60) + _aiR(5, 14));
        _c.reputation = Math.min(100, (c.reputation ?? 50) + _aiR(4, 10));
        _c.marketShare = Math.min(50, (c.marketShare ?? 5) + _aiR(1, 3));
        _aiNews.push({ id: `aiev_su_${c.id}_${year}_${month}`, year, month, category: "competitor" as NewsCategory,
          title: `🚀 ${c.name}: Sucesso Inesperado`,
          body: `A ${c.name} surpreendeu o mercado com um lançamento muito aclamado. A empresa ganha reputação, novos fãs e expande sua presença no mercado.`,
          moneyDelta: 0, fansDelta: 0, reputationDelta: 0, isRead: false });
      }
    }
    // Inject at most 2 AI event news per month to avoid flooding the feed
    if (_aiNews.length > 0) {
      newsItems = [..._aiNews.slice(0, 2), ...newsItems];
    }
  }

  // ── Redistribute bankrupt rival's market share ──
  // 40% to player, 60% split among remaining alive competitors
  const bankruptRivals = state.competitors.filter(
    (c) => c.alive !== false && updatedCompetitors.find((u) => u.id === c.id)?.alive === false
  );
  let bonusPlayerShare = 0;
  for (const dead of bankruptRivals) {
    const playerGain = dead.marketShare * 0.4;
    const rivalGain  = dead.marketShare * 0.6;
    bonusPlayerShare += playerGain;
    const aliveCount = updatedCompetitors.filter((u) => u.alive !== false && u.id !== dead.id).length;
    if (aliveCount > 0) {
      updatedCompetitors.forEach((u) => {
        if (u.alive !== false && u.id !== dead.id) {
          (u as any).marketShare = Math.min(50, (u.marketShare ?? 0) + rivalGain / aliveCount);
        }
      });
    }
  }

  // Inject bankruptcy news into feed
  if (bankruptNewsItem) {
    newsItems = [bankruptNewsItem, ...newsItems];
  }

  // Inject revival outcome news (fires once at the end of a revival period)
  if (revivalOutcomeNews) {
    newsItems = [revivalOutcomeNews, ...newsItems];
  }

  // ── Legendary Company Revival System ─────────────────────────────────────────
  // Crisis detection + rare acquisition trigger (max 2 active revivals at once).
  // Comeback progress news fires ~12% / month per actively reviving company.
  {
    // Count companies currently in their boost window
    const _activeRevivals = updatedCompetitors.filter(c => (c.revivalBoostMonths ?? 0) > 0).length;

    // ── Crisis detection + acquisition trigger ────────────────────────────────
    if (_activeRevivals < 2) {
      for (const c of updatedCompetitors) {
        if (!c.alive) continue;
        if ((c.revivalBoostMonths ?? 0) > 0) continue;       // already reviving
        if (c.revivalPhase === "declined") continue;           // failed before, skip
        if (c.revivalPhase === "ascending") continue;          // already succeeded

        // Crisis criteria: very low reputation + financially distressed + ≥3 crisis months
        const isCrisis =
          (c.reputation ?? 50) < 32 &&
          (c.crisisMonths ?? 0) >= 3 &&
          (c.financialHealth === "critical" || c.financialHealth === "struggling");
        if (!isCrisis) continue;

        // Rare trigger: ~4% chance per month per qualifying company
        if (Math.random() > 0.04) continue;

        // Acquisition fires — partially reset the company's stats
        const _c = c as any;
        _c.revivalBoostMonths = 18;           // 18-month recovery window
        _c.revivalPhase       = "rebuilding";
        _c.reputation         = Math.round(Math.random() * 15 + 25); // 25-40 (partial reset)
        _c.money              = Math.round(Math.random() * 1_000_000 + 1_500_000); // $1.5M-$2.5M
        _c.crisisMonths       = 0;
        _c.financialHealth    = "struggling";

        newsItems = [{
          id: `revival_acq_${c.id}_${year}_${month}`,
          year, month, category: "competitor" as NewsCategory,
          title: `🔄 ${c.name} adquirida após período de crise`,
          body: `Após meses de declínio financeiro e reputação em queda, a ${c.name} foi adquirida por um consórcio de investidores. A empresa entra agora numa fase de reestruturação profunda com foco na qualidade e inovação.`,
          moneyDelta: 0, fansDelta: 0, reputationDelta: 0, isRead: false,
        }, ...newsItems];

        break; // at most one acquisition per month
      }
    }

    // ── Comeback progress news (~12% / month per reviving company) ────────────
    for (const c of updatedCompetitors) {
      if (!c.alive || (c.revivalBoostMonths ?? 0) === 0) continue;
      if (c.revivalPhase !== "rebuilding") continue;
      if (Math.random() > 0.12) continue;

      const _comebackPicks = [
        { title: `🌱 ${c.name} está a fazer um comeback forte`, body: `Desde a reestruturação, a ${c.name} lançou produtos progressivamente mais sólidos. A imprensa começa a notar a transformação da empresa.` },
        { title: `🎮 Sucesso inesperado para ${c.name}`, body: `O mais recente título da ${c.name} superou as expectativas. A empresa parece ter encontrado a direção certa após meses difíceis.` },
        { title: `📈 ${c.name} recupera posição no mercado`, body: `Com nova gestão e foco renovado em inovação, a ${c.name} está a recuperar quota de mercado e a reconquistar a confiança dos jogadores.` },
      ];
      const _cp = _comebackPicks[Math.floor(Math.random() * _comebackPicks.length)];
      newsItems = [{
        id: `revival_comeback_${c.id}_${year}_${month}`,
        year, month, category: "competitor" as NewsCategory,
        title: _cp.title, body: _cp.body,
        moneyDelta: 0, fansDelta: 0, reputationDelta: 0, isRead: false,
      }, ...newsItems];
    }
  }

  // ── Dynamic rival spawning ────────────────────────────────────────────────
  // Every 24 months, if fewer than 6 alive rivals exist, a new studio may enter
  const aliveCount = updatedCompetitors.filter((c) => c.alive !== false).length;
  const monthsElapsed = (year - 1972) * 12 + month;
  const spawnWindow = monthsElapsed > 0 && monthsElapsed % 24 === 0;
  if (spawnWindow && aliveCount < 6 && Math.random() < 0.55) {
    const existingNames = updatedCompetitors.map((c) => c.name);
    const newRival = generateRival(existingNames, year);
    updatedCompetitors.push(newRival);
    const entryNews: NewsItem = {
      id: `entry_${newRival.id}`,
      year: year, month: month,
      category: "competitor",
      title: `🆕 ${newRival.name} entra no mercado`,
      body: `Um novo estúdio — ${newRival.name} — acaba de ser fundado com $${(newRival.money! / 1_000_000).toFixed(1)}M de capital. Inovação inicial: ${newRival.innovation}/100. Ficam de olho.`,
      moneyDelta: 0, fansDelta: 0, reputationDelta: 0, isRead: false,
    };
    newsItems = [entryNews, ...newsItems];
  }

  // ── Rival attacks ────────────────────────────────────────────────────────────
  // Attacks are context-gated: a rival may only attack when conditions are
  // realistically plausible (market proximity, recent launch, or marketing push).
  // canAttack returns true if ANY of the three competitive triggers is met.
  const currentMonthIdx = year * 12 + month;
  const playerMarketShare = state.marketShare ?? 0;

  const canAttack = (rival: typeof updatedCompetitors[0]): boolean => {
    const shareDiff = Math.abs(playerMarketShare - (rival.marketShare ?? 0));
    const recentlyLaunched = (rival.launchMonthsAgo ?? 99) <= 2;
    const hasMarketingPush = (rival.aggressiveness ?? 50) >= 65;
    return shareDiff <= 10 || recentlyLaunched || hasMarketingPush;
  };

  const nextAllowedAttack = state.nextRivalAttackMonth ?? 0;
  let newNextRivalAttackMonth = state.nextRivalAttackMonth;

  if (currentMonthIdx >= nextAllowedAttack) {
    for (const rival of updatedCompetitors) {
      if (!rival.alive) continue;
      // Context gate: only attack when conditions justify it
      if (!canAttack(rival)) continue;
      // Probability gate: aggressiveness/600 (max ~17%) then 20% second roll
      if (Math.random() > (rival.aggressiveness ?? 50) / 600) continue;
      if (Math.random() > 0.20) continue;

      // Pick one of three attack types; each has at most 2 penalties
      const attackType = Math.floor(Math.random() * 3);
      let attackTitle = "";
      let attackBody  = "";
      let repDelta    = 0;
      let shareDelta  = 0;
      let fanDelta    = 0;

      if (attackType === 0) {
        // Product comparison → market share loss (-1% to -3%) + minor fan loss
        const shareLoss = parseFloat((Math.random() * 2 + 1).toFixed(1));   // 1.0–3.0%
        const fanLoss   = Math.floor(Math.random() * 30 + 15);              // 15–44
        shareDelta = -shareLoss;
        fanDelta   = -fanLoss;
        attackTitle = `${rival.name} lança campanha comparativa`;
        attackBody  = `A ${rival.name} publicou anúncios comparando directamente os seus produtos com os vossos, destacando pontos fracos. A vossa fatia de mercado caiu ${shareLoss}% e perdeste ${fanLoss.toLocaleString()} fãs.`;
      } else if (attackType === 1) {
        // Technical critique → reputation loss only (-2 to -5)
        const repLoss = Math.floor(Math.random() * 4) + 2;                  // 2–5
        repDelta    = -repLoss;
        attackTitle = `${rival.name} publica crítica técnica`;
        attackBody  = `Especialistas financiados pela ${rival.name} publicaram uma análise técnica apontando falhas nos vossos produtos. Reputação −${repLoss}.`;
      } else {
        // Aggressive campaign → fan loss (-30 to -80)
        const fanLoss = Math.floor(Math.random() * 51) + 30;                // 30–80
        fanDelta    = -fanLoss;
        attackTitle = `${rival.name} intensifica campanha de marketing`;
        attackBody  = `A ${rival.name} lançou uma campanha agressiva atraindo consumidores indecisos. Perdeste ${fanLoss.toLocaleString()} fãs para a concorrência.`;
      }

      // Apply effects — law firm (holding) reduces damage by 50% and auto-resolves
      const hasLawFirm = localHoldings.includes("law_firm");
      const attackDmgRate = hasLawFirm ? 0.5 : 1.0;
      const resolvedFanDelta = fanDelta !== 0 ? Math.round(fanDelta * attackDmgRate) : 0;
      const resolvedRepDelta = repDelta !== 0 ? Math.round(repDelta * attackDmgRate) : 0;
      if (resolvedRepDelta !== 0) reputation = Math.max(0, reputation + resolvedRepDelta);
      if (resolvedFanDelta !== 0) fans       = Math.max(0, fans + resolvedFanDelta);
      if (shareDelta !== 0) { /* market share effect noted in news only — applied via next month's pressure calc */ }

      const attackBodyFull = hasLawFirm
        ? `${attackBody}\n\n🏛️ A Silva & Associados Jurídico respondeu automaticamente — danos reduzidos em 50%.`
        : attackBody;

      const attackNews: NewsItem = {
        id: `attack_${rival.id}_${year}_${month}`,
        year, month,
        category: "competitor",
        title: `⚔️ ${attackTitle}`,
        body: attackBodyFull,
        moneyDelta: 0,
        fansDelta:       resolvedFanDelta,
        reputationDelta: resolvedRepDelta,
        isRead: hasLawFirm,
        isAttack: true,
        attackResponse: hasLawFirm ? "auto" : undefined,
        rivalId: rival.id,
      };
      newsItems = [attackNews, ...newsItems];

      // Cooldown: 4–8 months before next attack
      const cooldown = 4 + Math.floor(Math.random() * 5);
      newNextRivalAttackMonth = currentMonthIdx + cooldown;

      // Only one attack per cooldown window
      break;
    }
  }

  // ── Per-rival game release simulation ────────────────────────────────────────
  // AI companies follow realistic dev time ranges matching the player's constraints:
  //   Indie  (mass_market / default) : 4–8 months
  //   AA     (franchise_focused / safe_profit) : 8–12 months
  //   AAA    (tech_focused / innovation_first) : 12–20 months
  // Each dev cycle may also roll for delay (+2–6m), cancellation, mediocre or flop.
  {
    const rivalGameNews: NewsItem[] = [];
    for (let ri = 0; ri < updatedCompetitors.length; ri++) {
      const rival = updatedCompetitors[ri];
      if (!rival.alive) continue;

      const rInnovation = rival.innovation ?? 60;
      const rMoney      = rival.money ?? 3_000_000;

      // Map style → game tier → dev time range
      const gameTier =
        rival.style === "tech_focused" || rival.style === "innovation_first" ? "AAA" :
        rival.style === "franchise_focused" || rival.style === "safe_profit"  ? "AA"  : "Indie";
      const [minDev, maxDev] =
        gameTier === "AAA" ? [12, 20] :
        gameTier === "AA"  ? [8,  12] : [4, 8];

      const lastGame = rival.lastGameMonthIdx ?? 0;

      // ── First-time initialization: place rival mid-development ──────────────
      // If nextGameDevDuration is unset and the rival has never launched
      // (lastGameMonthIdx is 0), begin a fresh cycle from the current month
      // at a random point through the planned dev time.
      if (rival.nextGameDevDuration === undefined) {
        const initialDev  = minDev + Math.floor(Math.random() * (maxDev - minDev + 1));
        const midProgress = Math.floor(Math.random() * initialDev); // random dev progress
        updatedCompetitors[ri] = {
          ...updatedCompetitors[ri],
          lastGameMonthIdx:   currentMonthIdx - midProgress,
          nextGameDevDuration: initialDev,
        };
        continue;
      }

      const devDuration = rival.nextGameDevDuration;

      // Still in development → skip this month
      if (currentMonthIdx < lastGame + devDuration) continue;

      // ── Delay check (15% chance): extend by +2–6 months ────────────────────
      if (Math.random() < 0.15) {
        const delay = 2 + Math.floor(Math.random() * 5);
        updatedCompetitors[ri] = {
          ...updatedCompetitors[ri],
          nextGameDevDuration: devDuration + delay,
        };
        continue;
      }

      // ── Cancellation check (10% chance): scrap and restart ──────────────────
      if (Math.random() < 0.10) {
        const newDev = minDev + Math.floor(Math.random() * (maxDev - minDev + 1));
        updatedCompetitors[ri] = {
          ...updatedCompetitors[ri],
          lastGameMonthIdx:    currentMonthIdx,
          nextGameDevDuration: newDev,
        };
        continue; // no news — silent cancellation
      }

      // ── Money constraint: can't afford to ship ──────────────────────────────
      if (rMoney < 400_000) continue;

      // ── Score calculation (era-aware, with mediocre / flop outcomes) ─────────
      const yearProgress = Math.max(0, Math.min(1, (year - 1972) / 40));
      const eraFloor = 35 + yearProgress * 30; // 35 → 65
      const eraCeil  = 62 + yearProgress * 33; // 62 → 95

      const qualityBase = eraFloor + (rInnovation / 100) * (eraCeil - eraFloor);

      const styleBonus =
        rival.style === "tech_focused"     ? 5 :
        rival.style === "innovation_first" ? (Math.random() < 0.45 ? 12 : -10) :
        rival.style === "franchise_focused"? 3 :
        rival.style === "safe_profit"      ? 2 :
        rival.style === "mass_market"      ? -4 : 0;

      const noise = (Math.random() - 0.5) * 18;
      let rivalScore = Math.round(
        Math.max(eraFloor - 12, Math.min(98, qualityBase + styleBonus + noise))
      );

      // 10% chance of flop (score < 60) — applied before mediocre cap
      if (Math.random() < 0.10) {
        rivalScore = Math.min(rivalScore, 35 + Math.floor(Math.random() * 25)); // 35–59
      }
      // 20% chance of mediocre result (score capped at 70)
      else if (Math.random() < 0.20) {
        rivalScore = Math.min(rivalScore, 50 + Math.floor(Math.random() * 21)); // 50–70
      }

      // ── Consequences by score tier ───────────────────────────────────────────
      let shareChange = 0, repChange = 0, moneyChange = 0, localFanLoss = 0;
      if (rivalScore >= 85) {
        shareChange  = +(Math.random() * 1.8 + 0.8);
        repChange    = +Math.floor(Math.random() * 4 + 2);
        localFanLoss = Math.floor(Math.random() * 120 + 60);
      } else if (rivalScore >= 70) {
        shareChange  = +(Math.random() * 0.8 + 0.2);
        repChange    = +Math.floor(Math.random() * 2 + 1);
        localFanLoss = Math.floor(Math.random() * 60 + 20);
      } else if (rivalScore >= 55) {
        shareChange  = +(Math.random() * 0.3 - 0.15);
        localFanLoss = Math.floor(Math.random() * 20);
      } else if (rivalScore >= 40) {
        shareChange  = -(Math.random() * 0.8 + 0.2);
        repChange    = -Math.floor(Math.random() * 2 + 1);
        moneyChange  = -250_000;
      } else {
        shareChange  = -(Math.random() * 1.5 + 0.5);
        repChange    = -Math.floor(Math.random() * 4 + 2);
        moneyChange  = -450_000;
      }
      fans = Math.max(0, fans - localFanLoss);

      const usedGameNames = new Set<string>(
        updatedCompetitors.map(c => c.recentLaunch ?? "").filter(Boolean)
      );
      const rivalGameName = getRivalGameName(rival.style, usedGameNames);

      // Next dev cycle: pick a fresh duration from the same tier range
      const nextDev = minDev + Math.floor(Math.random() * (maxDev - minDev + 1));

      updatedCompetitors[ri] = {
        ...updatedCompetitors[ri],
        recentLaunch:        rivalGameName,
        launchMonthsAgo:     0,
        gamesLaunched:       (rival.gamesLaunched ?? 0) + 1,
        marketShare:         Math.max(1, Math.min(50, (rival.marketShare ?? 5) + shareChange)),
        reputation:          Math.max(0, Math.min(100, (rival.reputation ?? 50) + repChange)),
        money:               Math.max(0, (rival.money ?? 0) + moneyChange),
        lastGameMonthIdx:    currentMonthIdx,
        nextGameDevDuration: nextDev,
      };

      const starRating =
        rivalScore >= 90 ? "★★★★★" :
        rivalScore >= 75 ? "★★★★☆" :
        rivalScore >= 60 ? "★★★☆☆" :
        rivalScore >= 45 ? "★★☆☆☆" : "★☆☆☆☆";

      const styleCtx =
        rival.style === "tech_focused"     ? "com tecnologia de ponta" :
        rival.style === "mass_market"      ? "com forte aposta em marketing" :
        rival.style === "innovation_first" ? "com mecânicas inovadoras" :
        rival.style === "franchise_focused"? "numa franquia estabelecida" :
        rival.style === "safe_profit"      ? "com fórmula segura e testada" : "";

      const newsTitle =
        rivalScore >= 85 ? `🚀 ${rival.name} lança hit: "${rivalGameName}"` :
        rivalScore >= 70 ? `🎮 ${rival.name} lança "${rivalGameName}"` :
        rivalScore < 45  ? `💀 ${rival.name}: flop com "${rivalGameName}"` :
        rivalScore < 60  ? `📉 ${rival.name} decepciona com "${rivalGameName}"` :
        `🎮 ${rival.name} lança "${rivalGameName}"`;

      const consequenceText =
        rivalScore >= 85
          ? `Ganharam +${shareChange.toFixed(1)}% de mercado e +${repChange} rep. Perdeste ${localFanLoss.toLocaleString()} fãs.`
          : rivalScore >= 70
          ? `Pequeno ganho de +${shareChange.toFixed(1)}% de mercado. Perdeste ${localFanLoss.toLocaleString()} fãs.`
          : rivalScore < 45
          ? `Perderam ${Math.abs(shareChange).toFixed(1)}% de mercado e ${Math.abs(repChange)} rep. Prejuízo de $${Math.abs(moneyChange / 1_000).toFixed(0)}K.`
          : rivalScore < 60
          ? `Pequena perda de ${Math.abs(shareChange).toFixed(1)}% de mercado.`
          : "Impacto mínimo no mercado.";

      rivalGameNews.push({
        id:              `rivalry_launch_${rival.id}_${year}_${month}`,
        year, month,
        category:        "competitor",
        title:           newsTitle,
        body:            `A ${rival.name} lançou "${rivalGameName}" ${styleCtx} (${gameTier}) com nota ${rivalScore}/100 ${starRating}. ${consequenceText}`,
        moneyDelta:      0,
        fansDelta:       -localFanLoss,
        reputationDelta: 0,
        isRead:          false,
      });
    }

    // Cap to 2 most impactful releases per month to avoid news spam
    if (rivalGameNews.length > 2) {
      rivalGameNews.sort((a, b) => Math.abs(b.fansDelta ?? 0) - Math.abs(a.fansDelta ?? 0));
      rivalGameNews.length = 2;
    }
    if (rivalGameNews.length > 0) {
      newsItems = [...rivalGameNews, ...newsItems];
    }
  }

  // ── Dynamic rival events ──────────────────────────────────────────────────────
  // Milestone/console/financial-struggle events are gated behind a shared 5-10
  // month cooldown so they don't pile on top of game release news.
  let newNextRivalEventMonthIdx = state.nextRivalEventMonthIdx ?? 0;
  let dynamicRivalEventFired    = false;
  const rivalEventReady = currentMonthIdx >= newNextRivalEventMonthIdx;

  if (rivalEventReady) {
    for (const rival of updatedCompetitors) {
      if (!rival.alive || dynamicRivalEventFired) break;

      const rInnovation = rival.innovation ?? 60;
      const rMoney      = rival.money ?? 3_000_000;

      // Event B: Rival struggling — reduced to 5% from 10%, informational only
      if (!dynamicRivalEventFired && rMoney < 800_000 && rMoney > 0 && Math.random() < 0.05) {
        newsItems = [{
          id: `rivalry_struggle_${rival.id}_${year}_${month}`,
          year: year, month: month, category: "competitor",
          title: `📉 ${rival.name} em dificuldades financeiras`,
          body: `Fontes internas indicam que a ${rival.name} tem menos de $${(rMoney / 1000).toFixed(0)}K em caixa. Os seus talentos podem estar disponíveis e a sua fatia de mercado é vulnerável.`,
          moneyDelta: 0, fansDelta: 0, reputationDelta: 0, isRead: false,
        }, ...newsItems];
        dynamicRivalEventFired = true;
      }

      // Event C: Rival innovation milestone — reduced to 2% from 4%
      if (!dynamicRivalEventFired && rInnovation >= 85 && Math.random() < 0.02) {
        const repBoost = Math.floor(Math.random() * 5) + 3;
        const rivalIdx = updatedCompetitors.findIndex((u) => u.id === rival.id);
        if (rivalIdx !== -1) {
          updatedCompetitors[rivalIdx] = {
            ...updatedCompetitors[rivalIdx],
            reputation: Math.min(100, (updatedCompetitors[rivalIdx].reputation ?? 60) + repBoost),
          };
        }
        newsItems = [{
          id: `rivalry_milestone_${rival.id}_${year}_${month}`,
          year: year, month: month, category: "competitor",
          title: `🏆 ${rival.name} atinge marco de inovação`,
          body: `A ${rival.name} atingiu inovação ${Math.round(rInnovation)}/100 e recebeu ampla cobertura da imprensa especializada. A reputação deles subiu +${repBoost} pontos — a competição está a ficar séria.`,
          moneyDelta: 0, fansDelta: 0, reputationDelta: 0, isRead: false,
        }, ...newsItems];
        dynamicRivalEventFired = true;
      }

      // Event D: Rival console launch — hardware release grows market share significantly
      if (!dynamicRivalEventFired && rInnovation > 60 && rMoney > 4_000_000 && Math.random() < 0.018) {
        const consoleSuffixes = ["Pro", "Ultra", "X2", "Neo", "Apex", "Prime", "Plus", "Edge"];
        const suffix = consoleSuffixes[Math.floor(Math.random() * consoleSuffixes.length)];
        const newConsoleName = `${rival.name.split(" ")[0]} ${suffix}`;
        const consoleScore = Math.min(96, Math.max(50, Math.round((rInnovation / 100) * 90 + (Math.random() - 0.5) * 20)));
        const consoleShareGain = Math.min(4, (consoleScore / 100) * 5 + Math.random() * 1.5);
        const consoleFanLoss = Math.floor(Math.random() * 80) + 30;
        fans = Math.max(0, fans - consoleFanLoss);
        const consoleLaunchIdx = updatedCompetitors.findIndex(c => c.id === rival.id);
        if (consoleLaunchIdx !== -1) {
          updatedCompetitors[consoleLaunchIdx] = {
            ...updatedCompetitors[consoleLaunchIdx],
            lastConsole: newConsoleName,
            marketShare: Math.min(50, (updatedCompetitors[consoleLaunchIdx].marketShare ?? 5) + consoleShareGain),
            money: Math.max(0, (updatedCompetitors[consoleLaunchIdx].money ?? 0) - 1_500_000),
          };
        }
        newsItems = [{
          id: `rival_console_${rival.id}_${year}_${month}`,
          year, month, category: "competitor",
          title: `🎮 ${rival.name} lança o "${newConsoleName}"`,
          body: `A ${rival.name} revelou o ${newConsoleName} com nota ${consoleScore}/100. O desenvolvimento custou $1.5M e ganhou +${consoleShareGain.toFixed(1)}% de mercado — perdeste ${consoleFanLoss.toLocaleString()} fãs para o lançamento.`,
          moneyDelta: 0, fansDelta: -consoleFanLoss, reputationDelta: 0, isRead: false,
        }, ...newsItems];
        dynamicRivalEventFired = true;
      }

    }

    // If any rival event fired, set cooldown: 5-10 months until next rival event
    if (dynamicRivalEventFired) {
      newNextRivalEventMonthIdx = currentMonthIdx + 5 + Math.floor(Math.random() * 6);
    }
  }

  // ── Player Offensive System: Counter-Attack Processing ───────────────────────
  // Counter-attacks set by executePlayerAttack() fire when their month arrives.
  const { COUNTER_ATTACK_STRENGTH } = require("./playerAttacks");
  let pendingCounterAttacks = [...(state.pendingCounterAttacks ?? [])];
  const dueCounterAttacks = pendingCounterAttacks.filter((ca) => currentMonthIdx >= ca.executeMonthIdx);
  pendingCounterAttacks   = pendingCounterAttacks.filter((ca) => currentMonthIdx < ca.executeMonthIdx);

  for (const ca of dueCounterAttacks) {
    const s = Math.max(1, Math.min(3, ca.strength));
    const strDef = COUNTER_ATTACK_STRENGTH[s];
    const rawRepDmg = Math.floor(Math.random() * (strDef.repDmg[1] - strDef.repDmg[0] + 1)) + strDef.repDmg[0];
    const rawFanDmg = Math.floor(Math.random() * (strDef.fanDmg[1] - strDef.fanDmg[0] + 1)) + strDef.fanDmg[0];
    const hasLawFirmCA = localHoldings.includes("law_firm");
    const caRate = hasLawFirmCA ? 0.5 : 1.0;
    const repDmg = Math.round(rawRepDmg * caRate);
    const fanDmg = Math.round(rawFanDmg * caRate);
    reputation = Math.min(100, Math.max(0, reputation + repDmg));
    fans = Math.max(0, fans + fanDmg);
    const caBody = hasLawFirmCA
      ? `Em retaliação ao seu ataque anterior, a ${ca.rivalName} ${strDef.label}. Reputação ${repDmg}, fãs ${fanDmg < 0 ? fanDmg.toLocaleString() : "+" + fanDmg.toLocaleString()}.\n\n🏛️ A Silva & Associados Jurídico absorveu parte do impacto — danos reduzidos em 50%.`
      : `Em retaliação ao seu ataque anterior, a ${ca.rivalName} ${strDef.label}. Reputação ${repDmg}, fãs ${fanDmg < 0 ? fanDmg.toLocaleString() : "+" + fanDmg.toLocaleString()}.`;
    newsItems = [{
      id:         `counter_${ca.rivalId}_${year}_${month}`,
      year:       year,
      month:      month,
      category:   "competitor" as NewsCategory,
      title:      `⚔️ ${ca.rivalName} ${strDef.label}`,
      body:       caBody,
      moneyDelta: 0, fansDelta: fanDmg, reputationDelta: repDmg,
      isRead:     hasLawFirmCA,
      isAttack:   true,
      attackResponse: hasLawFirmCA ? "auto" : undefined,
      rivalId:    ca.rivalId,
    }, ...newsItems];
  }

  // ── BUILD EVENT VALIDATION CONTEXT ───────────────────────────────────────────
  // Computed once per tick; passed to all event pickers this month.
  const _releasedGames  = (state.gameProjects ?? []).filter((p) => p.phase === "released");
  const _devGames       = (state.gameProjects ?? []).filter((p) => p.phase === "development");
  const _bugOrder: Record<string, number> = { none: 0, low: 1, medium: 2, severe: 3 };
  const _worstBug       = _releasedGames.reduce((worst, g) => {
    const lvl = g.bugLevel ?? "none";
    return (_bugOrder[lvl] ?? 0) > (_bugOrder[worst] ?? 0) ? lvl : worst;
  }, "none");
  const _avgScore       = _releasedGames.length > 0
    ? _releasedGames.reduce((s, g) => s + (g.receptionScore ?? 50), 0) / _releasedGames.length
    : 50;
  const _maxHype        = _devGames.reduce((mx, g) => Math.max(mx, g.hypeLevel ?? 0), 0);
  const _aliveRivals    = (state.competitors ?? []).filter((c) => c.alive !== false);
  const _currentMonthIdx = year * 12 + month;

  let _hadNegEvent = false;
  let _hadPosEvent = false;

  // ── Category-level cooldown gate ──────────────────────────────────────────
  // Mutable copy so we can update it as events fire this tick.
  let _catCooldowns: Record<string, number> = { ...(state.eventCategoryLastMonthIdx ?? {}) };

  /**
   * Returns true if the given validation category is still in cooldown —
   * i.e., it fired too recently to be allowed again.
   */
  const _catOnCooldown = (cat: EventValidationCategory): boolean => {
    const lastFired = _catCooldowns[cat] ?? -999;
    return (_currentMonthIdx - lastFired) < CATEGORY_COOLDOWN_MONTHS[cat];
  };

  /**
   * Call this once when an event of the given category fires. Updates both
   * the conflict flags and the cooldown map so later events in the same
   * tick respect the new state.
   */
  const _recordCategoryFired = (cat: EventValidationCategory): void => {
    _catCooldowns[cat] = _currentMonthIdx;
    if (cat === "NEGATIVE_PR") _hadNegEvent = true;
    else if (cat === "POSITIVE_PR") _hadPosEvent = true;
  };

  const _buildEvtCtx = (): EventValidationContext => ({
    year,
    monthIdx:                _currentMonthIdx,
    reputation,
    worstBugLevel:           _worstBug,
    avgReleasedScore:        Math.round(_avgScore),
    maxHypeLevel:            _maxHype,
    hasSales:                (state.totalRevenue ?? 0) > 0,
    employeeCount:           (state.employees ?? []).length,
    hasConsole:              (state.consoles ?? []).some((c) => !c.isDiscontinued),
    hasReleasedGame:         _releasedGames.length > 0,
    hasAliveRival:           _aliveRivals.length > 0,
    hadNegativeEventThisMonth: _hadNegEvent,
    hadPositiveEventThisMonth: _hadPosEvent,
  });

  // ── SCANDAL SYSTEM ────────────────────────────────────────────────────────────
  let updatedScandals: ActiveScandal[] = [...(state.activeScandals ?? [])];
  let scandalHistory = [...(state.scandalHistory ?? [])];
  let pendingInfluencers = [...(state.pendingInfluencers ?? [])];
  let mediaPrestige = state.mediaPrestige ?? 50;

  // 1. Evolve existing active scandals each month
  updatedScandals = updatedScandals.map((as) => {
    // Unresolved scandals can escalate
    if (!as.resolved) {
      if (Math.random() < as.escalationChance && !as.hasEscalated) {
        // Escalation! Apply additional damage
        const escalationDmg = Math.floor(Math.random() * 6) + 3;
        reputation = Math.max(0, reputation - escalationDmg);
        fans       = Math.max(0, fans - Math.floor(Math.random() * 100) + 30);
        newsItems = [{
          id: `scandal_escalation_${as.scandalId}_${year}_${month}`,
          year: year, month: month, category: "crisis" as const,
          title: `🔺 Escândalo em Escalada!`,
          body: `A situação não resolvida está a piorar. A imprensa está a amplificar o caso. Reputação −${escalationDmg}. Toma uma decisão urgente.`,
          moneyDelta: 0, fansDelta: -(Math.floor(Math.random() * 100) + 30), reputationDelta: -escalationDmg, isRead: false,
        }, ...newsItems];
        return { ...as, monthsActive: as.monthsActive + 1, hasEscalated: true, escalationChance: Math.min(0.85, as.escalationChance + 0.1) };
      }
    }
    // Future reputation risk fires
    if (as.resolved && (as.futureRepRisk ?? 0) > 0 && (as.futureRepRiskMonthsLeft ?? 0) > 0) {
      if (Math.random() < (as.futureRepRisk ?? 0)) {
        const backslashDmg = Math.floor(Math.random() * 5) + 2;
        reputation = Math.max(0, reputation - backslashDmg);
        newsItems = [{
          id: `scandal_backlash_${as.scandalId}_${year}_${month}`,
          year: year, month: month, category: "crisis" as const,
          title: `⏳ Consequências Tardias do Escândalo`,
          body: `A decisão tomada num escândalo passado voltou a assombrar a empresa. A imprensa revisitou o caso. Reputação −${backslashDmg}.`,
          moneyDelta: 0, fansDelta: 0, reputationDelta: -backslashDmg, isRead: false,
        }, ...newsItems];
      }
      return { ...as, monthsActive: as.monthsActive + 1, futureRepRiskMonthsLeft: (as.futureRepRiskMonthsLeft ?? 0) - 1 };
    }
    return { ...as, monthsActive: as.monthsActive + 1 };
  });

  // 2. Rival scandal events (every 18 months, 20% chance, requires alive rivals)
  const aliveRivals = updatedCompetitors.filter((c) => c.alive !== false);
  if ((year * 12 + month) % 18 === 0 && aliveRivals.length > 0 && Math.random() < 0.20) {
    const rivalTarget = aliveRivals[Math.floor(Math.random() * aliveRivals.length)];
    const tpl = RIVAL_SCANDALS[Math.floor(Math.random() * RIVAL_SCANDALS.length)];
    const rivalIdx = updatedCompetitors.findIndex((c) => c.id === rivalTarget.id);
    if (rivalIdx !== -1) {
      updatedCompetitors[rivalIdx] = {
        ...updatedCompetitors[rivalIdx],
        reputation: Math.max(0, (updatedCompetitors[rivalIdx].reputation ?? 60) + tpl.rivalRepDelta),
        money: Math.max(0, (updatedCompetitors[rivalIdx].money ?? 2_000_000) + tpl.rivalRepDelta * 50_000),
      };
    }
    newsItems = [{
      id: `rival_scandal_${rivalTarget.id}_${year}_${month}`,
      year: year, month: month, category: "competitor" as const,
      title: tpl.title.replace("{rival}", rivalTarget.name),
      body: (tpl.body + (tpl.opportunityText ? `\n\n💡 Oportunidade: ${tpl.opportunityText}` : "")).replace(/\{rival\}/g, rivalTarget.name),
      moneyDelta: 0, fansDelta: 0, reputationDelta: 0, isRead: false,
    }, ...newsItems];
  }

  // 2b. Rival success / milestone events (every 15 months, 30% chance, different rival than scandal)
  // Makes AI companies feel dynamic — they win awards, launch hits, recover, grow, or occasionally flop.
  const _RIVAL_MILESTONES: { id: string; title: string; body: string; repDelta: number; moneyDelta: number; type: "success" | "flop" | "recovery" }[] = [
    { id: "rm_hit_launch",   title: "🎮 {rival} lança título de sucesso",          body: "{rival} surpreendeu o mercado com um lançamento bem recebido. A empresa ganhou reputação e quota de mercado esta temporada.", repDelta: 6,   moneyDelta:  400_000, type: "success"  },
    { id: "rm_award",        title: "🏆 {rival} ganha prémio da indústria",         body: "{rival} recebeu reconhecimento público pela qualidade dos seus produtos. O reforço de marca pode pressionar a tua posição no mercado.", repDelta: 5,   moneyDelta:  150_000, type: "success"  },
    { id: "rm_growth",       title: "📈 {rival} reporta crescimento sólido",        body: "{rival} apresentou resultados financeiros acima das expectativas. A empresa está a expandir a sua base de utilizadores consistentemente.", repDelta: 3,   moneyDelta:  600_000, type: "success"  },
    { id: "rm_recovery",     title: "🔄 {rival} recupera após período difícil",     body: "{rival} voltou a crescer após meses de dificuldades. Nova liderança e reestruturação interna aparentam ter resultado.", repDelta: 8,   moneyDelta:  200_000, type: "recovery" },
    { id: "rm_expansion",    title: "🌍 {rival} expande para novos mercados",       body: "{rival} anunciou entrada em novos mercados internacionais. A presença global crescente pode intensificar a concorrência.", repDelta: 4,   moneyDelta:  300_000, type: "success"  },
    { id: "rm_flop",         title: "💔 Lançamento da {rival} decepciona",          body: "O produto mais recente da {rival} não correspondeu às expectativas do mercado. Vendas abaixo do previsto e críticas medianas.", repDelta: -5,  moneyDelta: -300_000, type: "flop"     },
    { id: "rm_loss",         title: "📉 {rival} reporta perdas no trimestre",       body: "{rival} anunciou resultados negativos. Custos elevados e queda de receita pressionam a sustentabilidade financeira da empresa.", repDelta: -3,  moneyDelta: -500_000, type: "flop"     },
    { id: "rm_partnership",  title: "🤝 {rival} fecha parceria estratégica",        body: "{rival} formalizou aliança com parceiro tecnológico. A colaboração pode acelerar o desenvolvimento dos próximos produtos.", repDelta: 4,   moneyDelta:  250_000, type: "success"  },
    { id: "rm_hype",         title: "📣 {rival} cria expetativa com próximo lançamento", body: "Campanha de marketing da {rival} gerou grande entusiasmo para o próximo produto. Os fãs estão animados.", repDelta: 3,   moneyDelta:  100_000, type: "success"  },
    { id: "rm_internal",     title: "🏢 Reestruturação interna na {rival}",         body: "{rival} anunciou mudanças significativas na estrutura da empresa. O processo criou incerteza mas pode resultar em maior eficiência.", repDelta: -2,  moneyDelta: -100_000, type: "flop"     },
  ];
  const _rivalMilestoneOffset = 7; // offset so it doesn't overlap exactly with scandal period
  if ((year * 12 + month + _rivalMilestoneOffset) % 15 === 0 && aliveRivals.length > 0 && Math.random() < 0.30) {
    // Pick a rival with enough history (avoid very new companies from dominating news)
    const _milestoneRivals = aliveRivals.filter((r) => (r.money ?? 0) > 100_000);
    const _milestoneTarget = _milestoneRivals.length > 0
      ? _milestoneRivals[Math.floor(Math.random() * _milestoneRivals.length)]
      : aliveRivals[Math.floor(Math.random() * aliveRivals.length)];
    const _milestoneTpl = _RIVAL_MILESTONES[Math.floor(Math.random() * _RIVAL_MILESTONES.length)];
    const _milestoneIdx = updatedCompetitors.findIndex((c) => c.id === _milestoneTarget.id);
    if (_milestoneIdx !== -1) {
      updatedCompetitors[_milestoneIdx] = {
        ...updatedCompetitors[_milestoneIdx],
        reputation: Math.max(0, Math.min(100, (updatedCompetitors[_milestoneIdx].reputation ?? 60) + _milestoneTpl.repDelta)),
        money: Math.max(0, (updatedCompetitors[_milestoneIdx].money ?? 2_000_000) + _milestoneTpl.moneyDelta),
      };
    }
    newsItems = [{
      id: `rival_milestone_${_milestoneTarget.id}_${_milestoneTpl.id}_${year}_${month}`,
      year, month, category: "competitor" as const,
      title: _milestoneTpl.title.replace(/\{rival\}/g, _milestoneTarget.name),
      body: _milestoneTpl.body.replace(/\{rival\}/g, _milestoneTarget.name),
      moneyDelta: 0, fansDelta: 0, reputationDelta: 0, isRead: false,
    }, ...newsItems];
  }

  // 3. New player scandal: base 4% chance per month; increases with low rep, many active consoles
  const hasConsole = state.consoles.some((c) => !c.isDiscontinued);
  const hasReleasedGame = (state.gameProjects ?? []).some((g) => g.phase === "released");
  const alreadyHasUnresolved = updatedScandals.some((s) => !s.resolved);
  // Base chance reduced from 4% → 2.5% to avoid scandal spam
  const scandalChance = Math.max(0, (0.025 + (reputation < 50 ? 0.015 : 0) + (hasConsole ? 0.005 : 0)) * (state.difficulty === "hard" ? 1.5 : 1));

  // Category cooldown gate: NEGATIVE_PR scandals respect the shared category cooldown.
  const scandalCatCooled = _catOnCooldown("NEGATIVE_PR");
  if (!alreadyHasUnresolved && !scandalCatCooled && Math.random() < scandalChance) {
    const _scandalCtx = _buildEvtCtx();
    const picked = pickScandal(year, scandalHistory, hasConsole, hasReleasedGame, _scandalCtx);
    if (picked) {
      const scandalValCat = inferScandalEventCategory(picked.category ?? "product");
      _recordCategoryFired(scandalValCat);
      const _whyNote = generateContextualEventNote(scandalValCat, _scandalCtx);

      // ── Legal protection: tiered auto-handling of scandals ────────────────
      const _scandalLegalActive = newLegalContract && currentMonthIdx < newLegalContract.endMonthIdx;
      const _scandalLegalTier = _scandalLegalActive ? newLegalContract!.tierId : null;

      if (_scandalLegalTier === "elite") {
        // Elite: fully auto-resolve — no decision required, minimal real impact
        // Add to history to prevent repeat, but do NOT create an active scandal
        scandalHistory = [picked.id, ...scandalHistory];
        const _eliteRepHit = Math.round((picked.initialRepDelta ?? 0) * 0.08); // 8% of original
        const _eliteFansHit = Math.round((picked.initialFansDelta ?? 0) * 0.08);
        if (_eliteRepHit < 0)  reputation = Math.max(0, reputation + _eliteRepHit);
        if (_eliteFansHit < 0) fans       = Math.max(0, fans       + _eliteFansHit);
        newsItems = [{
          id: `scandal_legal_elite_${picked.id}_${year}_${month}`,
          year, month, category: "growth" as const,
          title: `⚖️ Situação Jurídica Gerida Automaticamente`,
          body: `${picked.title} — A equipa jurídica Elite interceptou e resolveu a situação antes de se tornar pública. Impacto praticamente eliminado.`,
          moneyDelta: 0, fansDelta: _eliteFansHit, reputationDelta: _eliteRepHit, isRead: false,
        }, ...newsItems];

      } else if (_scandalLegalTier === "profissional") {
        // Professional: heavily reduce deltas (40%), lower escalation, add as resolved scandal (no player decision)
        const _profRate = LEGAL_CONTRACT_PROTECTION["profissional"]; // 0.40
        const _profRepDelta  = Math.round((picked.initialRepDelta ?? 0)  * (1 - _profRate));
        const _profFansDelta = Math.round((picked.initialFansDelta ?? 0) * (1 - _profRate));
        if (_profRepDelta < 0)  reputation = Math.max(0, reputation + _profRepDelta);
        if (_profFansDelta < 0) fans       = Math.max(0, fans       + _profFansDelta);
        // Mark as resolved immediately (no player input needed)
        const _resolvedScandal: ActiveScandal = {
          scandalId: picked.id, startYear: year, startMonth: month,
          resolved: true, escalationChance: 0, monthsActive: 0, hasEscalated: false,
        };
        updatedScandals = [_resolvedScandal, ...updatedScandals];
        scandalHistory  = [picked.id, ...scandalHistory];
        newsItems = [{
          id: `scandal_start_${picked.id}_${year}_${month}`,
          year, month, category: "crisis" as const,
          title: `⚖️ ${picked.title} (Gerido)`,
          body: `${picked.description} A equipa jurídica Profissional limitou os danos. Impacto reduzido em 40%. Reputação: ${_profRepDelta}.\n\n⚖️ Proteção jurídica Profissional auto-resolveu a situação.`,
          moneyDelta: 0, fansDelta: _profFansDelta, reputationDelta: _profRepDelta, isRead: false,
        }, ...newsItems];

      } else {
        // Basic legal or no legal: standard scandal flow
        const _basicRate = _scandalLegalTier === "basico" ? LEGAL_CONTRACT_PROTECTION["basico"] : 0; // 0.20 or 0
        const _repDelta  = Math.round((picked.initialRepDelta ?? 0)  * (1 - _basicRate));
        const _fansDelta = Math.round((picked.initialFansDelta ?? 0) * (1 - _basicRate));
        const _escalationMult = _scandalLegalTier === "basico" ? 0.75 : 1.0; // Basic also slightly lowers escalation
        reputation = Math.max(0, reputation + _repDelta);
        fans       = Math.max(0, fans       + _fansDelta);

        const newActiveScandal: ActiveScandal = {
          scandalId: picked.id, startYear: year, startMonth: month,
          resolved: false,
          escalationChance: picked.baseEscalationChance * _escalationMult,
          monthsActive: 0, hasEscalated: false,
        };
        updatedScandals = [newActiveScandal, ...updatedScandals];
        scandalHistory  = [picked.id, ...scandalHistory];

        const _legalScandalNote = _scandalLegalTier === "basico"
          ? `\n\n⚖️ Proteção jurídica Básica reduziu o impacto em 20%.` : "";
        const _scandalBody = `${picked.description} Impacto imediato: reputação ${_repDelta < 0 ? _repDelta : `+${_repDelta}`}. Decisão necessária.${_whyNote ? `\n\n📌 ${_whyNote}` : ""}${_legalScandalNote}`;
        newsItems = [{
          id: `scandal_start_${picked.id}_${year}_${month}`,
          year, month, category: "crisis" as const,
          title: `🚨 ${picked.title}`,
          body: _scandalBody,
          moneyDelta: 0, fansDelta: _fansDelta, reputationDelta: _repDelta, isRead: false,
        }, ...newsItems];
      }
    }
  }

  // Law Firm holding: +2 rep recovery per month when unresolved scandals are active
  if (localHoldings.includes("law_firm") && updatedScandals.some((s) => !s.resolved)) {
    reputation = Math.min(100, reputation + 2);
  }

  // 4. Influencer events: monthly application + decay
  pendingInfluencers = pendingInfluencers
    .map((inf) => {
      // Apply effect this month (scaled down — they were fully applied at spawn)
      // Only lingering rep effects month 2+
      if (inf.duration > 1) {
        reputation  = Math.max(0, Math.min(100, reputation + Math.round(inf.repDelta * 0.3)));
        fans        = Math.max(0, fans + Math.round(inf.fansDelta * 0.15));
      }
      return { ...inf, duration: inf.duration - 1 };
    })
    .filter((inf) => inf.duration > 0);

  // 5. Influencer random spawning: 7% per month when company has activity
  const companyActive = hasConsole || hasReleasedGame;
  if (companyActive && Math.random() < 0.07 && pendingInfluencers.length < 3) {
    const infEvent = generateInfluencerEvent("random", pendingInfluencers.map((i) => i.name));
    // Context validation: block negative influencer events when the company is doing well
    const infIsNeg = infEvent.stance === "negative";
    const infIsPos = infEvent.stance === "positive";
    const infCtx   = _buildEvtCtx();
    const infAllowed =
      infIsNeg ? validateEventContext("NEGATIVE_PR", infCtx) :
      infIsPos ? validateEventContext("POSITIVE_PR", infCtx) :
      true;
    const infValCat: EventValidationCategory = infIsNeg ? "NEGATIVE_PR" : infIsPos ? "POSITIVE_PR" : "MARKET";
    if (infAllowed && !_catOnCooldown(infValCat)) {
      _recordCategoryFired(infValCat);
      // Immediate effect
      reputation  = Math.max(0, Math.min(100, reputation + infEvent.repDelta));
      fans        = Math.max(0, fans + infEvent.fansDelta);
      mediaPrestige = Math.max(0, Math.min(100, mediaPrestige + (infIsPos ? 3 : infIsNeg ? -3 : 0)));

      pendingInfluencers = [...pendingInfluencers, infEvent];
      newsItems = [{
        id: infEvent.id,
        year: year, month: month, category: "crisis" as const,
        title: infEvent.title,
        body: infEvent.body,
        moneyDelta: 0, fansDelta: infEvent.fansDelta, reputationDelta: infEvent.repDelta, isRead: false,
      }, ...newsItems];
    }
  }

  // 5b. Process player-hired influencer campaigns
  let hiredInfluencers = [...(state.hiredInfluencers ?? [])];
  hiredInfluencers = hiredInfluencers.map((hi) => {
    if (hi.monthsLeft <= 0) return hi;
    const profile = INFLUENCER_PROFILES.find((p) => p.id === hi.profileId);
    if (!profile) return { ...hi, monthsLeft: hi.monthsLeft - 1 };

    // Monthly residual effects (20% of initial bonus per month)
    const monthlyFans = Math.round(profile.fanBonus * 0.20);
    const monthlyRep  = Math.round(profile.repBonus * 0.15);
    fans        = Math.max(0, fans + monthlyFans);
    reputation  = Math.max(0, Math.min(100, reputation + monthlyRep));
    mediaPrestige = Math.min(100, mediaPrestige + 1);

    return {
      ...hi,
      monthsLeft: hi.monthsLeft - 1,
      totalFansDelivered: hi.totalFansDelivered + monthlyFans,
    };
  }).filter((hi) => hi.monthsLeft > 0);

  // Scandal defense from active hired influencers
  // If a scandal just started (was added this tick), check if any active influencer defends
  const justStartedScandal = updatedScandals.find((s) => !s.resolved && s.monthsActive === 0);
  if (justStartedScandal) {
    for (const hi of hiredInfluencers) {
      const profile = INFLUENCER_PROFILES.find((p) => p.id === hi.profileId);
      if (!profile) continue;
      if (Math.random() < profile.scandalDefenseChance) {
        // Influencer defends! Reduce scandal damage
        const defenseRep = Math.floor(Math.random() * 3) + 2;
        reputation = Math.min(100, reputation + defenseRep);
        fans = Math.max(0, fans + Math.round(profile.fanBonus * 0.1));
        newsItems = [{
          id: `inf_defense_${hi.profileId}_${year}_${month}`,
          year: year, month: month, category: "crisis" as const,
          title: `🛡️ ${hi.name} defende a empresa!`,
          body: `${hi.name} publicou um vídeo a defender publicamente a empresa durante o escândalo. O impacto foi imediato: reputação +${defenseRep} e onda de suporte da comunidade.`,
          moneyDelta: 0, fansDelta: Math.round(profile.fanBonus * 0.1), reputationDelta: defenseRep, isRead: false,
        }, ...newsItems];
        break; // Only one defense per month
      }
    }
  }

  // Indie Incubator holding: 15% chance per month (8% when flush) of a viral windfall
  if (localHoldings.includes("indie_incubator")) {
    const richThreshold = money > 5_000_000;
    if (Math.random() < (richThreshold ? 0.08 : 0.15)) {
      const windfall = 80_000 + Math.floor(Math.random() * 170_000);
      const fanBoost = 2_000 + Math.floor(Math.random() * 6_000);
      money += windfall;
      fans = Math.round(fans + fanBoost);
      newsItems = [{
        id: `indie_hit_${year}_${month}`,
        year, month, category: "growth" as NewsCategory,
        title: "🎮 Hit Indie Surpresa!",
        body: `Um jogo indie do portfólio viralizou inesperadamente. Receita adicional: $${Math.round(windfall / 1_000)}K e ${fanBoost.toLocaleString()} novos fãs orgânicos.`,
        moneyDelta: windfall, fansDelta: fanBoost, reputationDelta: 0, isRead: false,
      }, ...newsItems];
    }
  }

  // 6. Press/media coverage: every 3 months, a media headline fires based on reputation
  if ((year * 12 + month) % 3 === 0 && companyActive) {
    const headline = pickMediaHeadline(reputation + mediaPrestige * 0.2);
    reputation  = Math.max(0, Math.min(100, reputation + headline.repDelta));
    fans        = Math.max(0, fans + (headline.fansDelta ?? 0));
    mediaPrestige = Math.max(0, Math.min(100, mediaPrestige + (headline.repDelta > 0 ? 1 : -1)));
    newsItems = [{
      id: `media_${year}_${month}`,
      year: year, month: month, category: "crisis" as const,
      title: headline.title,
      body: headline.body,
      moneyDelta: 0, fansDelta: headline.fansDelta ?? 0, reputationDelta: headline.repDelta, isRead: false,
    }, ...newsItems];
  }

  // ── applyMarketCompetition: reputation-weighted market share ─────────────────
  // player.marketShare = player.reputation / (totalRivalRep + player.reputation)
  // Only alive rivals contribute to the competitive pressure.
  const totalRivalRep = updatedCompetitors
    .filter((c) => c.alive !== false)
    .reduce((acc, r) => acc + r.reputation, 0);
  const mktShare = Math.min(60,
    (reputation / Math.max(1, totalRivalRep + reputation)) * 100
    + bonusPlayerShare * 0.4,   // bonus from bankrupt rivals' redistributed share
  );

  // ── Historical events fire first (priority over random news) ─────────────────
  const firedEvents = [...(state.firedHistoricalEvents ?? [])];
  const historicalEvent = getHistoricalEvent(year, month, firedEvents);
  let newFiredEvents = firedEvents;

  let newsForSummary: NewsItem | null = null;
  let newNextRandomNewsMonthIdx = state.nextRandomNewsMonthIdx ?? 0;

  if (historicalEvent) {
    newFiredEvents = [...firedEvents, historicalEvent.id];
    const hNewsItem: NewsItem = {
      id: historicalEvent.id,
      year: year,
      month: month,
      category: historicalEvent.category,
      title: `📅 ${historicalEvent.title}`,
      body: historicalEvent.body,
      moneyDelta: historicalEvent.moneyDelta,
      fansDelta: historicalEvent.fansDelta,
      reputationDelta: historicalEvent.reputationDelta,
      isRead: false,
    };
    newsItems = [hNewsItem, ...newsItems];
    money += historicalEvent.moneyDelta;
    fans += historicalEvent.fansDelta;
    reputation = Math.max(0, Math.min(100, reputation + historicalEvent.reputationDelta));
    newsForSummary = hNewsItem;
  } else {
    // ── Random world/market news — gated by a 2-4 month cooldown ──────────────
    if (currentMonthIdx >= newNextRandomNewsMonthIdx) {
      // Collect the 4 most recently prepended categories to suppress repeats
      const recentCats = newsItems.slice(0, 4).map((n) => n.category);

      let newNewsItem: NewsItem | null = null;

      // Path A: state-aware contextual news (6% chance, condition-gated — halved to reduce spam)
      if (!newNewsItem && Math.random() < 0.06) {
        const revHist = state.revenueHistory ?? [];
        const recentRevGrowth = revHist.length >= 3
          ? (revHist[revHist.length - 1]?.revenue ?? 0) /
            Math.max(1, revHist[revHist.length - 3]?.revenue ?? 1) - 1
          : 0;
        const stockHist = state.stockPriceHistory ?? [];
        const stockTrend: "rising" | "falling" | "stable" | "none" =
          stockHist.length >= 3
            ? stockHist[stockHist.length - 1].price > stockHist[stockHist.length - 3].price * 1.05
              ? "rising"
              : stockHist[stockHist.length - 1].price < stockHist[stockHist.length - 3].price * 0.95
                ? "falling"
                : "stable"
            : "none";

        const stateTemplate = generateStateAwareNewsItem({
          reputation,
          fans,
          marketShare: mktShare,
          hasActiveConsole: updatedConsoles.some((c) => !c.isDiscontinued),
          hasReleasedGame:  updatedProjects.some((p) => p.phase === "released"),
          recentRevenueGrowth: recentRevGrowth,
          stockTrend,
          year, month,
        });
        if (stateTemplate && !recentCats.includes(stateTemplate.category)) {
          newNewsItem = {
            id: `ctx_${year}_${month}_${Math.random().toString(36).slice(2, 5)}`,
            year, month,
            category: stateTemplate.category as NewsCategory,
            title: stateTemplate.title,
            body: stateTemplate.body,
            moneyDelta: stateTemplate.m,
            fansDelta: stateTemplate.f,
            reputationDelta: stateTemplate.r,
            isRead: false,
          };
        }
      }

      // Path B: era-aware random news fallback (4% chance — halved to reduce spam)
      if (!newNewsItem && Math.random() < 0.04) {
        const template = getEraNewsItemFiltered(year, recentCats);
        if (template && template.category !== "competitor") {
          newNewsItem = {
            id: `news_${year}_${month}_${template.category}_${Math.random().toString(36).slice(2, 5)}`,
            year, month,
            category: template.category as NewsCategory,
            title: template.title,
            body: template.body,
            moneyDelta: template.m,
            fansDelta: template.f,
            reputationDelta: template.r,
            isRead: false,
          };
        }
      }

      if (newNewsItem) {
        newsItems = [newNewsItem, ...newsItems];
        money += newNewsItem.moneyDelta;
        fans += newNewsItem.fansDelta;
        reputation = Math.max(0, Math.min(100, reputation + newNewsItem.reputationDelta));
        newsForSummary = newNewsItem;
        // Enforce 4-8 month gap before next random news can fire (increased from 2-4 to reduce spam)
        newNextRandomNewsMonthIdx = currentMonthIdx + 4 + Math.floor(Math.random() * 5);
      }
    }
  }

  // ── Player market-share milestones (cosmetic, once-per-threshold) ─────────────
  // Uses firedHistoricalEvents as dedup store — fires at most once per threshold per save.
  // Zero gameplay impact: all deltas zero.
  const _mktMilestones: { pct: number; key: string; title: string; body: string }[] = [
    { pct: 20, key: "player_mkt_20", title: "📈 MEGACORP alcança 20% de participação de mercado",    body: "A empresa ultrapassa a marca de 20% de market share. Analistas reconhecem a ascensão como notável dentro do setor." },
    { pct: 35, key: "player_mkt_35", title: "📈 MEGACORP se firma como gigante da indústria",        body: "Com 35% do mercado, a MEGACORP consolida sua posição entre as maiores forças do setor. Rivais revisam estratégias frente à pressão crescente." },
    { pct: 50, key: "player_mkt_50", title: "🏆 MEGACORP controla metade do mercado global",         body: "Marco histórico: a MEGACORP detém 50% de participação de mercado. A liderança da indústria é incontestável. Rivais em alerta máximo." },
  ];
  for (const _mm of _mktMilestones) {
    if (mktShare >= _mm.pct && !newFiredEvents.includes(_mm.key)) {
      newFiredEvents = [...newFiredEvents, _mm.key];
      newsItems = [{
        id: `${_mm.key}_${year}_${month}`,
        year, month,
        category: "growth" as NewsCategory,
        title: _mm.title,
        body: _mm.body,
        moneyDelta: 0, fansDelta: 0, reputationDelta: 0, isRead: false,
      }, ...newsItems];
      break; // at most one milestone per tick
    }
  }

  // ── Fan demand news for newly released hit games ───────────────────────────────
  for (const released of newlyReleasedGames) {
    if (released.fanDemandForSequel) {
      const fanDemandMessages = [
        `Os fãs estão pedindo uma continuação de "${released.name}"!`,
        `A comunidade quer ver o próximo capítulo de "${released.name}".`,
        `O público se apegou ao universo de "${released.name}" — sequência, por favor!`,
        `Há forte demanda dos fãs por uma sequência de "${released.name}".`,
        `"${released.name}" conquistou corações. Os fãs pedem mais!`,
      ];
      const msg = fanDemandMessages[Math.floor(Math.random() * fanDemandMessages.length)];
      const fanNews: NewsItem = {
        id: `fan_demand_${released.id}_${year}_${month}`,
        year: year,
        month: month,
        category: "award" as NewsCategory,
        title: `Fãs pedem sequência de "${released.name}"`,
        body: msg,
        moneyDelta: 0,
        fansDelta: Math.round(200 + released.receptionScore! * 5),
        reputationDelta: 2,
        isRead: false,
      };
      newsItems = [fanNews, ...newsItems];
      fans += fanNews.fansDelta;
      reputation = Math.min(100, reputation + 2 * fanRepScale);
      if (!newsForSummary) newsForSummary = fanNews;
    }
  }

  // Research + era upgrade passive fans/rep bonus
  fans += Math.round(researchBonuses.fansBonus * 0.01);
  reputation = Math.min(100, reputation + researchBonuses.repBonus * 0.01 * fanRepScale);
  fans += Math.round(eraBonuses.fansBonus * 0.01);
  reputation = Math.min(100, reputation + eraBonuses.repBonus * 0.01 * fanRepScale);

  // ── Fan growth formula (type-aware) ───────────────────────────────────────
  // novosFans  = qualidade × marketing × fatorMercado × BASE_FAN_RATE
  // Distributed into casual · loyal · critical based on avg game quality
  // Decay per type: casual −3% / loyal −1% / critical −2% per cycle
  {
    const releasedForFans = (state.gameProjects ?? []).filter(
      (p) => p.phase === "released"
    );

    // qualidade: weighted sum of star ratings (fade over 60 months)
    let weightedStarSum = 0;
    let weightedCount   = 0;
    releasedForFans.forEach((g) => {
      const ageMonths =
        (year - (g.launchYear ?? year)) * 12 +
        (month - (g.launchMonth ?? month));
      const w = Math.max(0, 1 - ageMonths / 60);
      weightedStarSum += (g.starRating ?? 3) * w;
      weightedCount   += w;
    });
    const qualidade       = weightedStarSum;
    const avgStarRating   = weightedCount > 0 ? weightedStarSum / weightedCount : 0;

    // fatorMercado: market headroom (saturacaoMercado capped at 0.80)
    const fatorMercado  = 1 - saturacaoMercado;

    const BASE_FAN_RATE = 150;
    const novosFans     = Math.round(qualidade * marketingBoost * fatorMercado * BASE_FAN_RATE);

    // Distribute novosFans by type based on average star rating of catalog
    // Masterpiece → more loyal + critical; low quality → only casual (if any)
    let casualFrac = 0.60, loyalFrac = 0.30, critFrac = 0.10;
    if      (avgStarRating >= 4.5) { casualFrac = 0.25; loyalFrac = 0.45; critFrac = 0.30; }
    else if (avgStarRating >= 4.0) { casualFrac = 0.40; loyalFrac = 0.42; critFrac = 0.18; }
    else if (avgStarRating >= 3.0) { casualFrac = 0.60; loyalFrac = 0.30; critFrac = 0.10; }
    else if (avgStarRating >= 2.0) { casualFrac = 0.80; loyalFrac = 0.18; critFrac = 0.02; }
    else                           { casualFrac = 1.00; loyalFrac = 0.00; critFrac = 0.00; }

    fanCasual   += Math.round(novosFans * casualFrac);
    fanLoyal    += Math.round(novosFans * loyalFrac);
    fanCritical += Math.round(novosFans * critFrac);

    // Type-specific monthly churn: casual lose fans fastest, loyal most stable
    fanCasual   = Math.max(0, fanCasual   - Math.round(fanCasual   * 0.03));
    fanLoyal    = Math.max(0, fanLoyal    - Math.round(fanLoyal    * 0.01));
    fanCritical = Math.max(0, fanCritical - Math.round(fanCritical * 0.02));

    fans = fanCasual + fanLoyal + fanCritical;
  }

  // ── No-release stagnation penalty ────────────────────────────────────────────
  // If the player has released no game in the last 9 months AND console sales
  // are minimal, fans slowly lose faith AND reputation stagnates/decays.
  // Stagnation rate grows with inactivity, up to a -2.5%/month cap.
  // Loyal fans resist longer than casual fans.
  {
    const releasedGames = (state.gameProjects ?? []).filter(p => p.phase === "released");
    const mostRecentReleaseAge = releasedGames.reduce((minAge, p) => {
      const age = (year - (p.launchYear ?? year)) * 12 +
                  (month - (p.launchMonth ?? 1));
      return Math.min(minAge, Math.max(0, age));
    }, Infinity);

    // Trigger: 9 months without a release (down from 12) and low console sales
    const isStagnant = mostRecentReleaseAge > 9 && totalSales < 500 && fans > 1_000;
    if (isStagnant) {
      // Rate grows 0.5%/month beyond the 9-month window, capped at 2.5%
      const extraMonths = Math.max(0, mostRecentReleaseAge - 9);
      const stagnationRate = Math.min(0.025, 0.003 + extraMonths * 0.0005);
      fanCasual   = Math.max(0, fanCasual   - Math.round(fanCasual   * stagnationRate * 1.8));
      fanLoyal    = Math.max(0, fanLoyal    - Math.round(fanLoyal    * stagnationRate * 0.5));
      fanCritical = Math.max(0, fanCritical - Math.round(fanCritical * stagnationRate * 1.2));
      fans = fanCasual + fanLoyal + fanCritical;
      // Reputation also decays during prolonged inactivity: -0.1 to -0.5 per month
      const repDecay = Math.min(0.5, 0.1 + extraMonths * 0.02);
      reputation = Math.max(0, reputation - repDecay);
    }
  }

  // ── Fan tier passive reputation bonus ─────────────────────────────────────────
  // Major and Global fanbases build brand prestige automatically each month.
  if (fanTier.repBonus > 0) {
    reputation = Math.min(100, reputation + fanTier.repBonus * fanRepScale);
  }

  // ── Annual Awards (fires every December) ──────────────────────────────────────
  let newTrophies: Trophy[] = [];
  if (month === 12) {
    const AWARD_PRIZES = [500_000, 250_000, 100_000];
    const AWARD_MEDALS = ["🥇 1º", "🥈 2º", "🥉 3º"];
    const AWARD_PRIZE_LABELS = ["$500K", "$250K", "$100K"];

    // ── Single source of truth for all December news ──────────────────────────
    // Compute rankings ONCE here; generateRankingAndFlopNews (called later)
    // uses the same function internally, so winner order is consistent.
    const annualRankings = computeAnnualRankings(
      state.gameProjects ?? [],
      state.consoles,
      updatedCompetitors,
      year,
      state.companyName ?? ""
    );

    // ── Game of the Year ──
    type AwardEntry = { name: string; score: number; isRival: boolean; rivalName?: string };

    // Use the shared gamesByRating list — same data used by the ranking news.
    const allGameEntries: AwardEntry[] = annualRankings.gamesByRating
      .slice(0, 5)
      .map(e => ({
        name: e.name,
        score: e.score,
        isRival: !e.isPlayer,
        rivalName: e.isPlayer ? undefined : e.ownerName,
      }));

    // Remap top-3 scores into competitive bands: 1st 86-100, 2nd 72-86, 3rd 52-74.
    // Ordering is preserved from gamesByRating; only the displayed score is banded.
    {
      const _r = (lo: number, hi: number) => Math.round(Math.random() * (hi - lo) + lo);
      if (allGameEntries[0]) allGameEntries[0].score = _r(86, 100);
      if (allGameEntries[1]) allGameEntries[1].score = _r(72, Math.max(72, Math.min(86, allGameEntries[0].score - 2)));
      if (allGameEntries[2]) allGameEntries[2].score = _r(52, Math.max(52, Math.min(74, allGameEntries[1].score - 2)));
    }

    if (allGameEntries.length > 0) {
      // Helper for random template selection
      const pickGame = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
      // Competition shape flags
      const topGameScore    = allGameEntries[0]?.score ?? 0;
      const secondGameScore = allGameEntries[1]?.score ?? 0;
      const isCloseGame     = allGameEntries.length >= 2 && (topGameScore - secondGameScore) <= 5;

      let gamePrize = 0;
      const gameLines: string[] = [];
      const playerCompanyTag = state.companyName ? ` (${state.companyName})` : "";
      allGameEntries.slice(0, 3).forEach((entry, i) => {
        const prize = AWARD_PRIZES[i] ?? 0;
        const label = entry.isRival
          ? `${entry.name} — ${entry.rivalName}`
          : `${entry.name}${playerCompanyTag}`;
        if (!entry.isRival) {
          gamePrize += prize;
          gameLines.push(`${AWARD_MEDALS[i]}: ${label} · nota ${entry.score}/100 · prêmio ${AWARD_PRIZE_LABELS[i]}`);
          newTrophies.push({
            id: `trophy_game_${year}_${i}`,
            title: `🏆 Jogo do Ano ${year}`,
            year: year,
            product: entry.name,
            rank: i + 1,
            prizeUSD: prize,
            category: "game",
          });
        } else {
          gameLines.push(`${AWARD_MEDALS[i]}: ${label} · nota ${entry.score}/100`);
        }
      });

      const topEntry = allGameEntries[0];
      const playerWonFirst = !topEntry.isRival;
      const playerHasAnyPrize = gamePrize > 0;
      const isSurpriseGame = !playerWonFirst && playerGameEntries.some(e => e.score >= 70);

      if (playerHasAnyPrize) {
        money += gamePrize;
        fans += Math.round(gamePrize * 0.002);
        reputation = Math.min(100, reputation + (playerWonFirst ? 6 : 3) * fanRepScale);
      } else {
        reputation = Math.max(0, reputation - 2);
      }

      const gameBodyPrefix = playerWonFirst
        ? pickGame([
            "🏆 Os teus jogos dominaram a gala! A crítica não deixou margem para dúvidas.\n\n",
            `🎮 Vitória absoluta em ${year}! O júri elegeu os teus títulos como os melhores do ano.\n\n`,
            "🏆 Um ano histórico — os vencedores foram seus! O mercado reconheceu a qualidade.\n\n",
          ])
        : isCloseGame
        ? pickGame([
            `⚔️ Corrida acirrada! A diferença entre o 1º e 2º lugar foi de apenas ${topGameScore - secondGameScore} pontos.\n\n`,
            "😤 A disputa foi intensa, mas os rivais levaram a melhor por uma margem mínima.\n\n",
          ])
        : isSurpriseGame
        ? pickGame([
            "😲 Surpresa do mercado! Um rival tomou o topo — mas os teus jogos ficaram perto.\n\n",
            `📊 O mercado de ${year} trouxe uma virada: um estúdio rival roubou o show.\n\n`,
          ])
        : pickGame([
            "😤 Os rivais dominaram o Jogo do Ano! Investe em qualidade para competir no próximo ano.\n\n",
            "🎯 Sem destaque próprio este ano. Os concorrentes levaram todos os prêmios da gala.\n\n",
            `📉 Uma gala difícil — os rivais estiveram em grande forma em ${year}.\n\n`,
          ]);

      const gameAwardTitle = playerWonFirst
        ? pickGame([`🏆 Premiação de Jogos ${year}`, `🎮 Melhor Jogo de ${year}`])
        : isCloseGame
        ? `⚔️ Premiação de Jogos ${year} — Corrida Acirrada!`
        : isSurpriseGame
        ? `😲 Premiação de Jogos ${year} — Virada Surpresa!`
        : `🥊 Premiação de Jogos ${year} — Rivais Vencem!`;

      newsItems = [
        {
          id: `award_game_${year}`,
          year: year,
          month: 12,
          category: "award" as NewsCategory,
          title: gameAwardTitle,
          body: `${gameBodyPrefix}${gameLines.join("\n")}${playerHasAnyPrize ? `\n\nPrêmio total recebido: $${gamePrize.toLocaleString()}` : "\n\nNenhum prêmio recebido este ano."}`,
          moneyDelta: gamePrize,
          fansDelta: playerHasAnyPrize ? Math.round(gamePrize * 0.002) : 0,
          reputationDelta: playerWonFirst ? 6 : (playerHasAnyPrize ? 3 : -2),
          isRead: false,
        },
        ...newsItems,
      ];
    } else {
      // No eligible games this year (none scored ≥ 55 or no recent releases)
      reputation = Math.max(0, reputation - 1);
      newsItems = [
        {
          id: `award_game_${year}`,
          year: year,
          month: 12,
          category: "award" as NewsCategory,
          title: `📋 Premiação de Jogos ${year} — Sem Vencedor`,
          body: `Nenhum jogo lançado em ${year} atingiu pontuação mínima (55/100) para concorrer ao Jogo do Ano. Investe em qualidade para competir na próxima gala.`,
          moneyDelta: 0,
          fansDelta: 0,
          reputationDelta: -1,
          isRead: false,
        },
        ...newsItems,
      ];
    }

    // ── Console of the Year ──
    // Use the shared consolesByScore list — same data used by the ranking news.
    type ConsoleAwardEntry = {
      name: string;
      unitsSold: number;
      score: number;
      isRival: boolean;
      rivalName?: string;
    };

    const allConsoleEntries: ConsoleAwardEntry[] = annualRankings.consolesByScore
      .slice(0, 5)
      .map(e => ({
        name: e.name,
        unitsSold: e.value,
        score: e.score,
        isRival: !e.isPlayer,
        rivalName: e.isPlayer ? undefined : e.ownerName,
      }));

    // Same competitive banding: 1st 86-100, 2nd 72-86, 3rd 52-74
    {
      const _r = (lo: number, hi: number) => Math.round(Math.random() * (hi - lo) + lo);
      if (allConsoleEntries[0]) allConsoleEntries[0].score = _r(86, 100);
      if (allConsoleEntries[1]) allConsoleEntries[1].score = _r(72, Math.max(72, Math.min(86, allConsoleEntries[0].score - 2)));
      if (allConsoleEntries[2]) allConsoleEntries[2].score = _r(52, Math.max(52, Math.min(74, allConsoleEntries[1].score - 2)));
    }

    if (allConsoleEntries.length > 0) {
      const pickConsole = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
      const topConsoleScore    = allConsoleEntries[0]?.score ?? 0;
      const secondConsoleScore = allConsoleEntries[1]?.score ?? 0;
      const isCloseConsole     = allConsoleEntries.length >= 2 && (topConsoleScore - secondConsoleScore) <= 5;

      let consolePrize = 0;
      const consoleLines: string[] = [];
      const playerConsoleTag = state.companyName ? ` (${state.companyName})` : "";
      allConsoleEntries.slice(0, 3).forEach((entry, i) => {
        const prize = AWARD_PRIZES[i] ?? 0;
        const salesLabel = entry.unitsSold.toLocaleString();
        if (!entry.isRival) {
          consolePrize += prize;
          consoleLines.push(`${AWARD_MEDALS[i]}: ${entry.name}${playerConsoleTag} · ${salesLabel} vendas · prêmio ${AWARD_PRIZE_LABELS[i]}`);
          newTrophies.push({
            id: `trophy_console_${year}_${i}`,
            title: `🏆 Console do Ano ${year}`,
            year: year,
            product: entry.name,
            rank: i + 1,
            prizeUSD: prize,
            category: "console",
          });
        } else {
          consoleLines.push(`${AWARD_MEDALS[i]}: ${entry.name} — ${entry.rivalName} · ${salesLabel} vendas estimadas`);
        }
      });

      const topConsole = allConsoleEntries[0];
      const playerWonConsole = !topConsole.isRival;
      const isSurpriseConsole = !playerWonConsole && playerConsoleEntries.some(e => e.score >= 40);

      if (consolePrize > 0) {
        money += consolePrize;
        fans += Math.round(consolePrize * 0.003);
        reputation = Math.min(100, reputation + (playerWonConsole ? 8 : 4) * fanRepScale);
      } else {
        reputation = Math.max(0, reputation - 3);
      }

      const consoleBodyPrefix = playerWonConsole
        ? pickConsole([
            "🏆 Os teus consoles dominaram o mercado! Os compradores escolheram o teu hardware.\n\n",
            `🎮 Vitória no hardware em ${year}! As vendas e a qualidade dos teus consoles foram imbatíveis.\n\n`,
            "🏆 O teu console é o mais querido do mercado este ano. Uma conquista enorme!\n\n",
          ])
        : isCloseConsole
        ? pickConsole([
            `⚔️ Corrida acirrada no hardware! O 1º lugar venceu por apenas ${topConsoleScore - secondConsoleScore} pontos de score.\n\n`,
            "😤 Que disputa! Os rivais levaram o Console do Ano por uma diferença mínima.\n\n",
          ])
        : isSurpriseConsole
        ? pickConsole([
            "😲 Surpresa nas prateleiras! Um rival dominou o mercado de hardware este ano.\n\n",
            `📊 O mercado de consoles em ${year} foi tomado por um rival — melhora o hardware para reconquistar!\n\n`,
          ])
        : pickConsole([
            "😤 Os rivais dominaram o Console do Ano! Aumenta as vendas e a qualidade do teu hardware.\n\n",
            "🎯 Sem destaque no hardware este ano. Os rivais venderam mais e melhor.\n\n",
            `📉 O mercado de ${year} pertenceu à concorrência no segmento de consoles.\n\n`,
          ]);

      const consoleAwardTitle = playerWonConsole
        ? pickConsole([`🏆 Premiação de Consoles ${year}`, `🎮 Melhor Console de ${year}`])
        : isCloseConsole
        ? `⚔️ Premiação de Consoles ${year} — Corrida Acirrada!`
        : isSurpriseConsole
        ? `😲 Premiação de Consoles ${year} — Virada Surpresa!`
        : `🥊 Premiação de Consoles ${year} — Rivais Vencem!`;

      newsItems = [
        {
          id: `award_console_${year}`,
          year: year,
          month: 12,
          category: "award" as NewsCategory,
          title: consoleAwardTitle,
          body: `${consoleBodyPrefix}${consoleLines.join("\n")}${consolePrize > 0 ? `\n\nPrêmio total recebido: $${consolePrize.toLocaleString()}` : "\n\nNenhum prêmio recebido este ano."}`,
          moneyDelta: consolePrize,
          fansDelta: consolePrize > 0 ? Math.round(consolePrize * 0.003) : 0,
          reputationDelta: playerWonConsole ? 8 : (consolePrize > 0 ? 4 : -3),
          isRead: false,
        },
        ...newsItems,
      ];
    } else {
      // No console qualified (all below era minimum threshold)
      reputation = Math.max(0, reputation - 2);
      newsItems = [
        {
          id: `award_console_${year}`,
          year: year,
          month: 12,
          category: "award" as NewsCategory,
          title: `📋 Premiação de Consoles ${year} — Sem Qualificados`,
          body: `Nenhum console qualificado encontrado em ${year}. Lança e vende consoles para competir na próxima gala.`,
          moneyDelta: 0,
          fansDelta: 0,
          reputationDelta: -2,
          isRead: false,
        },
        ...newsItems,
      ];
    }
  }

  // ── Annual Rankings & Flop Detection (fires every December) ────────────────
  if (month === 12) {
    const rankingNews = generateRankingAndFlopNews(
      state.gameProjects ?? [],
      state.consoles ?? [],
      updatedCompetitors,
      year,
      state.companyName ?? ""
    );
    if (rankingNews.length > 0) {
      newsItems = [...rankingNews, ...newsItems];
    }
  }

  // ── v4: 3-Part Reputation Updates ─────────────────────────────────────────────
  // techRep: high-quality launches (low bugs, high score), research completions
  if (newResearchedNodes.length > (state.researchedNodes ?? []).length) {
    techRep = Math.min(100, techRep + 3);
  }
  for (const g of newlyReleasedGames) {
    const score = g.receptionScore ?? 0;
    const bug   = g.bugLevel ?? "none";
    techRep       = Math.min(100, Math.max(0, techRep       + (score >= 75 ? 4 : score >= 50 ? 1 : -2) + (bug === "none" ? 2 : bug === "severe" ? -6 : -2)));
    fanRep        = Math.min(100, Math.max(0, fanRep         + ((g.starRating ?? 0) >= 4 ? 5 : (g.starRating ?? 0) >= 3 ? 1 : -3)));
    commercialRep = Math.min(100, Math.max(0, commercialRep  + (g.monthlyRevenue > 500_000 ? 3 : 1)));
  }
  // commercialRep: driven by revenue and marketing
  if (totalRevenue + gameProjectRevenue > 500_000)  commercialRep = Math.min(100, commercialRep + 1);
  if (totalRevenue + gameProjectRevenue > 2_000_000) commercialRep = Math.min(100, commercialRep + 1);
  if (state.activeMarketing !== "none") commercialRep = Math.min(100, commercialRep + 1);
  if ((state.branches ?? []).length > 3) commercialRep = Math.min(100, commercialRep + 1);
  // Natural slow convergence to 50 (avoids runaway extremes)
  techRep       += (50 - techRep)       * 0.003;
  commercialRep += (50 - commercialRep) * 0.003;
  fanRep        += (50 - fanRep)        * 0.003;
  // Clamp
  techRep       = Math.max(0, Math.min(100, Math.round(techRep)));
  commercialRep = Math.max(0, Math.min(100, Math.round(commercialRep)));
  fanRep        = Math.max(0, Math.min(100, Math.round(fanRep)));

  // ── v4: Franchise System ──────────────────────────────────────────────────────
  let updatedFranchises: Franchise[] = [...(state.franchises ?? [])];
  for (const g of newlyReleasedGames) {
    if (g.sequelOf) {
      // Find the franchise root
      const rootId = g.sequelOf;
      const idx = updatedFranchises.findIndex((f) => f.id === rootId);
      if (idx >= 0) {
        const f = updatedFranchises[idx];
        const newTotal = f.totalGames + 1;
        const newAvg   = Math.round((f.avgScore * f.totalGames + (g.receptionScore ?? 50)) / newTotal);
        const fatigueInc = newTotal > 3 ? (newAvg < 60 ? 15 : 5) : 0;
        // Strong sequels REDUCE fatigue (reward quality)
        const fatigueDec = (g.receptionScore ?? 0) >= 80 ? 10 : 0;
        const newFanDemand = Math.max(0, Math.min(100,
          (g.starRating ?? 0) >= 4 ? f.fanDemand + 15 : f.fanDemand - 10
        ));
        updatedFranchises[idx] = {
          ...f,
          totalGames:   newTotal,
          avgScore:     newAvg,
          totalRevenue: f.totalRevenue + g.monthlyRevenue * 12,
          fanDemand:    newFanDemand,
          fatigueLevel: Math.max(0, Math.min(100, f.fatigueLevel + fatigueInc - fatigueDec)),
          awardsWon:    f.awardsWon + (newTrophies.some((t) => t.product === g.name) ? 1 : 0),
          lastGameYear:  year,
          lastGameScore: g.receptionScore ?? 50,
        };
      } else {
        // Create franchise entry from root game
        const rootGame = updatedProjects.find((p) => p.id === rootId);
        if (rootGame) {
          updatedFranchises.push({
            id:           rootId,
            name:         rootGame.name,
            totalGames:   2,
            avgScore:     Math.round(((rootGame.receptionScore ?? 50) + (g.receptionScore ?? 50)) / 2),
            totalRevenue: g.monthlyRevenue * 12,
            fanDemand:    (g.starRating ?? 0) >= 4 ? 60 : 30,
            fatigueLevel: 0,
            awardsWon:    newTrophies.some((t) => t.product === g.name || t.product === rootGame.name) ? 1 : 0,
            lastGameYear:  year,
            lastGameScore: g.receptionScore ?? 50,
          });
        }
      }
    } else {
      // Brand new successful game — check if already a franchise root
      if ((g.starRating ?? 0) >= 4 && !updatedFranchises.find((f) => f.id === g.id)) {
        updatedFranchises.push({
          id:          g.id,
          name:        g.name,
          totalGames:  1,
          avgScore:    g.receptionScore ?? 50,
          totalRevenue: g.monthlyRevenue * 12,
          fanDemand:   (g.starRating ?? 0) >= 5 ? 70 : 50,
          fatigueLevel: 0,
          awardsWon:   0,
          lastGameYear:  year,
          lastGameScore: g.receptionScore ?? 50,
        });
      }
    }
  }
  // Monthly franchise passive updates: fanDemand grows slowly over time without a sequel
  updatedFranchises = updatedFranchises.map((f) => {
    const gapYears = year - f.lastGameYear;
    const demandBoost = gapYears >= 3 ? Math.min(5, gapYears) : 0;
    const fatigueDecay = Math.max(0, f.fatigueLevel - 0.5);
    return { ...f, fanDemand: Math.min(100, f.fanDemand + demandBoost), fatigueLevel: fatigueDecay };
  });

  // ── v4: Dynamic Event ─────────────────────────────────────────────────────────
  const eventHistory = state.dynamicEventHistory ?? [];
  let newDynEventHistory = [...eventHistory];
  let newTempBugRiskBonus    = 0;
  let newTempDevSpeedBonus   = 0;
  let newTempMarketDemandMult= 1.0;
  let newTempBonusMonthsLeft = 0;
  let newNextDynEventMonthIdx = state.nextDynEventMonthIdx ?? 0;

  // Dynamic event gate: enforce a hard 6-10 month minimum between global events.
  // Base chance is 5% (reduced from 8%) to make major world events feel special.
  // Early game (year < 1976) gets an additional 50% suppression so players can settle in.
  const dynEventReady = currentMonthIdx >= newNextDynEventMonthIdx;
  const dynEarlyPenalty = year < 1976 ? 0.5 : 1.0;
  const dynRepBoost     = reputation >= 70 ? 0.03 : reputation >= 50 ? 0.01 : 0;
  const recentRevGrowth = state.revenueHistory && state.revenueHistory.length >= 3
    ? (state.revenueHistory[state.revenueHistory.length - 1]?.value ?? 0) /
      Math.max(1, state.revenueHistory[state.revenueHistory.length - 3]?.value ?? 1) - 1
    : 0;
  const dynGrowthBoost  = recentRevGrowth > 0.15 ? 0.02 : 0;
  const dynEventChance  = (0.05 + dynRepBoost + dynGrowthBoost) * dynEarlyPenalty;

  if (dynEventReady && Math.random() < dynEventChance) {
    const dynEvent = pickDynamicEvent(
      {
        year: year, month: month, money, fans, reputation,
        totalRevenue: state.totalRevenue + totalRevenue + gameProjectRevenue,
        marketShare: Math.round(mktShare * 10) / 10,
        employees: state.employees ?? [],
        gameProjects: state.gameProjects ?? [],
        consoles: state.consoles,
        offices: state.offices,
        unlockedCountries: state.unlockedCountries ?? [],
        researchedNodes: state.researchedNodes ?? [],
        trophies: state.trophies ?? [],
      },
      eventHistory,
      _buildEvtCtx()
    );
    if (dynEvent) {
      const fx = dynEvent.effects;
      // Determine validation category and check cooldown
      const dynValCat = inferDynEventCategory(dynEvent.category, fx);
      if (!_catOnCooldown(dynValCat)) {
        _recordCategoryFired(dynValCat);
        // Contextual "why" note based on actual game state
        const _dynCtx = _buildEvtCtx();
        const _dynWhyNote = generateContextualEventNote(dynValCat, _dynCtx);

        // ── Legal Contract: auto-mitigate ALL negative dynamic events ────────
        // Extended coverage: legal + crisis (all tiers) + any NEGATIVE_PR event.
        // Elite and Profissional also cover broader NEGATIVE_PR dynamic events.
        const _activeLegal = newLegalContract && currentMonthIdx < newLegalContract.endMonthIdx;
        const _legalCoversEvent = _activeLegal && (
          dynEvent.category === "legal" ||
          dynEvent.category === "crisis" ||
          (dynValCat === "NEGATIVE_PR" && (newLegalContract!.tierId === "profissional" || newLegalContract!.tierId === "elite"))
        );
        const _legalProtRate = _activeLegal ? LEGAL_CONTRACT_PROTECTION[newLegalContract!.tierId] : 0;
        const _mitigate = (v: number | undefined): number | undefined => {
          if (!v || !_legalCoversEvent || v >= 0) return v;
          return Math.round(v * (1 - _legalProtRate));
        };
        const effectiveFx = _legalCoversEvent ? {
          ...fx,
          moneyDelta:       _mitigate(fx.moneyDelta),
          reputationDelta:  _mitigate(fx.reputationDelta),
          techRepDelta:     _mitigate(fx.techRepDelta),
          commercialRepDelta: _mitigate(fx.commercialRepDelta),
          fanRepDelta:      _mitigate(fx.fanRepDelta),
          fansDelta:        _mitigate(fx.fansDelta),
        } : fx;
        // Append legal shield note to news body when protection was applied
        const _legalNote = _legalCoversEvent
          ? `\n\n⚖️ Proteção jurídica ativa reduziu o impacto em ${Math.round(_legalProtRate * 100)}%.`
          : "";

        if (effectiveFx.moneyDelta)       money       = Math.max(0, money       + effectiveFx.moneyDelta);
        if (effectiveFx.fansDelta)        fans        = Math.max(0, fans        + effectiveFx.fansDelta);
        if (effectiveFx.reputationDelta)  reputation  = Math.max(0, Math.min(100, reputation  + effectiveFx.reputationDelta));
        if (effectiveFx.techRepDelta)     techRep     = Math.max(0, Math.min(100, techRep     + effectiveFx.techRepDelta));
        if (effectiveFx.commercialRepDelta) commercialRep = Math.max(0, Math.min(100, commercialRep + effectiveFx.commercialRepDelta));
        if (effectiveFx.fanRepDelta)      fanRep      = Math.max(0, Math.min(100, fanRep      + effectiveFx.fanRepDelta));
        // Set temp effects
        newTempBugRiskBonus     = effectiveFx.bugRiskDelta    ?? 0;
        newTempDevSpeedBonus    = effectiveFx.devSpeedDelta   ?? 0;
        newTempMarketDemandMult = effectiveFx.marketDemandMult ?? 1.0;
        newTempBonusMonthsLeft  = (effectiveFx.bugRiskDelta || effectiveFx.devSpeedDelta || effectiveFx.marketDemandMult) ? 3 : 0;
        // Record event as news (body includes contextual WHY note + legal shield note)
        const _dynBodyWithNote = dynEvent.body + (_dynWhyNote ? `\n\n📌 ${_dynWhyNote}` : "") + _legalNote;
        const dynNewsItem: NewsItem = {
          id: `dyn_${dynEvent.id}_${year}_${month}`,
          year: year,
          month: month,
          category: (
            dynEvent.category === "economy" || dynEvent.category === "crisis" ? "crisis"
            : dynEvent.category === "opportunity" ? "growth"
            : dynEvent.category === "tech" ? "tech"
            : dynEvent.category === "competitor" ? "competitor"
            : dynEvent.category === "media" ? "launch"
            : "growth"
          ) as NewsCategory,
          title: `⚡ ${dynEvent.title}`,
          body:  _dynBodyWithNote,
          moneyDelta:      effectiveFx.moneyDelta       ?? 0,
          fansDelta:       effectiveFx.fansDelta        ?? 0,
          reputationDelta: effectiveFx.reputationDelta  ?? 0,
          isRead: false,
        };
        newsItems = [dynNewsItem, ...newsItems];
        if (!newsForSummary) newsForSummary = dynNewsItem;
        newDynEventHistory = [...eventHistory, dynEvent.id];
        // Prune history to last 120 entries (10 years)
        if (newDynEventHistory.length > 120) newDynEventHistory = newDynEventHistory.slice(-120);
        // Set next allowed event to 8-14 months from now (further increased to reduce spam)
        newNextDynEventMonthIdx = currentMonthIdx + 8 + Math.floor(Math.random() * 7);
      } // end: !_catOnCooldown
    }
  }

  // ── v4: Achievement Checking ──────────────────────────────────────────────────
  const existingAchIds = (state.unlockedAchievements ?? []).map((a) => a.id);
  const newlyUnlocked = checkNewAchievements(
    {
      year: year, month: month, money, fans, reputation,
      totalRevenue: state.totalRevenue + totalRevenue + gameProjectRevenue,
      marketShare: Math.round(mktShare * 10) / 10,
      employees: updatedEmployees,
      gameProjects: updatedProjects,
      consoles: updatedConsoles,
      offices: state.offices,
      unlockedCountries: state.unlockedCountries ?? [],
      researchedNodes: newResearchedNodes,
      trophies: [...(state.trophies ?? []), ...newTrophies],
      branches: state.branches ?? [],
      totalShares: state.totalShares,
      playerShares: state.playerShares,
      investors: state.investors ?? [],
      unlockedAchievements: state.unlockedAchievements ?? [],
    },
    existingAchIds
  );
  const newAchievements: AchievementRecord[] = [
    ...(state.unlockedAchievements ?? []),
    ...newlyUnlocked.map((a) => ({
      id: a.id,
      unlockedYear: year,
      unlockedMonth: month,
    })),
  ];
  // Add news item for each newly unlocked achievement
  for (const ach of newlyUnlocked) {
    const achNews: NewsItem = {
      id: `ach_${ach.id}_${year}_${month}`,
      year: year,
      month: month,
      category: "award" as NewsCategory,
      title: `🏅 Conquista Desbloqueada: ${ach.title}`,
      body:  ach.description,
      moneyDelta: 0, fansDelta: 100, reputationDelta: 1,
      isRead: false,
    };
    newsItems = [achNews, ...newsItems];
    fans += 100;
    reputation = Math.min(100, reputation + 1 * fanRepScale);
  }

  // ── v4: Revenue History (sample every 3 months) ───────────────────────────────
  let newRevenueHistory = [...(state.revenueHistory ?? [])];
  if (month % 3 === 0) {
    newRevenueHistory.push({
      year:            year,
      month:           month,
      revenue:         Math.round(totalRevenue + gameProjectRevenue),
      gameRevenue:     Math.round(gameProjectRevenue),
      consoleRevenue:  Math.round(totalRevenue),
      reputation:      Math.round(reputation),
      fans,
    });
    // Keep last 4 years of samples (max 16 samples per 3-month interval)
    if (newRevenueHistory.length > 48) newRevenueHistory = newRevenueHistory.slice(-48);
  }

  let newMonth = month + 1;
  let newYear = year;
  if (newMonth > 12) {
    newMonth = 1;
    newYear++;
  }

  // ── Decade-based world events (cosmetic news only — zero gameplay impact) ─────
  // Fires once per year rollover. Queries fictional companies/consoles/franchises
  // from constants/history.ts. No formulas, no stats, no economy touched.
  if (newMonth === 1) {
    const worldEvts = getEventsForYear(newYear);
    if (worldEvts.consoles.length > 0 || worldEvts.franchises.length > 0) {
      const isDecade = newYear % 10 === 0;
      const consoleParts = worldEvts.consoles.map((c) => `${c.name} (${c.company})`);
      const franchiseParts = worldEvts.franchises.map((f) => `${f.name} — ${f.genre}`);
      const bodyParts: string[] = [];
      if (consoleParts.length) bodyParts.push(`Novos consoles: ${consoleParts.join(", ")}.`);
      if (franchiseParts.length) bodyParts.push(`Novas franquias: ${franchiseParts.join(", ")}.`);
      const worldNews: NewsItem = {
        id: `world_events_${newYear}`,
        year: newYear,
        month: 1,
        category: "competitor" as NewsCategory,
        title: isDecade
          ? `🌍 Nova década ${newYear}s — a indústria se transforma`
          : `🌍 ${newYear} — Movimentos no mercado global`,
        body: bodyParts.join(" "),
        moneyDelta: 0,
        fansDelta: 0,
        reputationDelta: 0,
        isRead: false,
      };
      newsItems = [worldNews, ...newsItems];
    }

    // ── Historical Rival Releases (consoles + franchises) ──────────────────────
    // Fires at year rollover. News only + tiny market share bump for high-buzz releases.
    // Core AI competitor system is NOT touched — only direct property nudge on match.
    const _rhConsoles    = getRivalConsoleReleasesForYear(newYear);
    const _rhFranchises  = getRivalFranchiseReleasesForYear(newYear);

    if (_rhConsoles.length > 0 || _rhFranchises.length > 0) {
      // Build combined news (max 2 items to avoid feed spam)
      const _consoleParts    = _rhConsoles.map(r => `${getRivalCompanyName(r.companyId)} lança ${r.consoleName}`);
      const _franchiseParts  = _rhFranchises.map(r => `${getRivalCompanyName(r.companyId)} estreia ${r.franchiseName} (${r.genre})`);
      const _allParts        = [..._consoleParts, ..._franchiseParts];

      if (_allParts.length > 0) {
        // First news item: consoles (if any), otherwise first 2 franchise items
        const _headline1Parts = _allParts.slice(0, 2);
        const _headline2Parts = _allParts.slice(2, 4);

        newsItems = [{
          id:            `rh_${newYear}_a`,
          year:          newYear,
          month:         1,
          category:      "competitor" as NewsCategory,
          title:         `🕹️ ${_headline1Parts[0]}${_headline1Parts.length > 1 ? ` — ${_headline1Parts[1]}` : ""}`,
          body:          _allParts.length > 2
            ? `Mais movimentos: ${_allParts.slice(2).join("; ")}.`
            : "A indústria segue aquecida com novos lançamentos dos rivais.",
          moneyDelta:    0, fansDelta: 0, reputationDelta: 0, isRead: false,
        }, ...newsItems];

        if (_headline2Parts.length > 0) {
          newsItems = [{
            id:            `rh_${newYear}_b`,
            year:          newYear,
            month:         1,
            category:      "competitor" as NewsCategory,
            title:         `🕹️ ${_headline2Parts[0]}${_headline2Parts.length > 1 ? ` — ${_headline2Parts[1]}` : ""}`,
            body:          "Rivais continuam movimentando o mercado com novos títulos e plataformas.",
            moneyDelta:    0, fansDelta: 0, reputationDelta: 0, isRead: false,
          }, ...newsItems];
        }
      }

      // Small market share bump for high-buzz console launches (buzz ≥ 60)
      // Only nudges live AI competitor if name matches — capped at +2% total
      for (const rel of _rhConsoles) {
        if (rel.marketBuzz < 60) continue;
        const _buzz = rel.marketBuzz;
        const _bump = Math.min(2.0, (_buzz - 58) * 0.04); // 0.08 per buzz point above 58, max 2%
        const _targetName = getRivalCompanyName(rel.companyId).toLowerCase();
        const _liveComp = updatedCompetitors.find(c => c.name.toLowerCase() === _targetName);
        if (_liveComp) {
          _liveComp.marketShare = Math.min(50, (_liveComp.marketShare ?? 5) + _bump);
        }
      }
    }
  }

  // ── Company valuation & share price ──────────────────────────────────────────
  const totalDebt = updatedLoans.reduce((s, l) => s + l.remainingAmount, 0);
  const activeConsoleCount = updatedConsoles.filter((c) => !c.isDiscontinued).length;
  const releasedGameCount = updatedProjects.filter((p) => p.phase === "released").length;
  const newCompanyValue = calculateCompanyValue({
    cash: money,
    monthlyRevenue: totalRevenue + gameProjectRevenue + acqNetMonthly,
    reputation,
    marketShare: Math.round(mktShare * 10) / 10,
    activeConsoles: activeConsoleCount,
    releasedGames: releasedGameCount,
    totalDebt,
    acquisitionsNetMonthly: acqNetMonthly,
  });
  const newSharePrice = calculateSharePrice(newCompanyValue);

  // ── Investor offer generation ─────────────────────────────────────────────────
  const playerShares = (state.playerShares ?? TOTAL_SHARES) + exitedInvestorShares;
  const playerPct = Math.round((playerShares / TOTAL_SHARES) * 100);
  const pendingOffers: InvestorOffer[] = (state.pendingOffers ?? [])
    .filter((o) => !(o.expiresYear < year || (o.expiresYear === year && o.expiresMonth < month)));
  const isDistressed = money < 0;
  const stockUnlocked = year >= STOCK_MARKET_UNLOCK.minYear
    && newCompanyValue >= STOCK_MARKET_UNLOCK.minValue
    && reputation >= STOCK_MARKET_UNLOCK.minReputation;
  const offerChance = isDistressed ? 0.25 : (stockUnlocked ? 0.09 : 0);
  if (offerChance > 0 && Math.random() < offerChance && pendingOffers.length < 3) {
    const newOffer = generateInvestorOffer(newCompanyValue, playerPct, year, month, isDistressed);
    if (newOffer) pendingOffers.push(newOffer);
  }

  // ── Stock price history update (24-point rolling window, with market volatility) ───
  const rawHistory = state.stockPriceHistory ?? [];
  const volatilityFactor = 1 + (Math.random() * 0.06 - 0.03); // ±3% random swing per month
  const marketSentimentFactor = (() => {
    if (reputation >= 80) return 1.02;
    if (reputation >= 60) return 1.01;
    if (reputation < 30)  return 0.98;
    return 1.00;
  })();
  const volatileSharePrice = Math.max(0.01, Math.round(newSharePrice * volatilityFactor * marketSentimentFactor * 100) / 100);
  const newStockPriceHistory: typeof rawHistory = [
    ...rawHistory,
    { year: year, month: month, price: volatileSharePrice },
  ].slice(-24); // keep last 24 months

  // ── Stock listing bid generation ───────────────────────────────────────────────
  // For each open sell listing, there's a chance of receiving a new investor bid
  const isCompanyProfitable = totalRevenue + gameProjectRevenue > officeCost + branchCosts + empSalaries;
  const updatedStockListings: StockListing[] = (state.stockListings ?? []).map((listing) => {
    // Expire old bids
    const activeBids = listing.bids.filter(
      (b) => !(b.expiresYear < newYear || (b.expiresYear === newYear && b.expiresMonth < newMonth))
    );
    // 30% chance per month to receive a new bid if fewer than 5 bids exist
    if (stockUnlocked && activeBids.length < 5 && Math.random() < 0.30) {
      const newBid = generateStockBid(listing, newCompanyValue, year, month, isCompanyProfitable);
      if (newBid) {
        return { ...listing, bids: [...activeBids, newBid] };
      }
    }
    return { ...listing, bids: activeBids };
  });

  // Hedge Fund holding: covers 25% of net monthly loss, capped at $500K
  if (localHoldings.includes("hedge_fund")) {
    const netSoFar = money - state.money;
    if (netSoFar < 0) {
      money += Math.min(500_000, Math.round(-netSoFar * 0.25));
    }
  }

  // ── Global Economic Events — tick lifecycle ────────────────────────────────
  let _newGlobalEventId: string | null   = state.activeGlobalEvent ?? null;
  let _newEventMonthsLeft: number        = state.eventRemainingMonths ?? 0;
  const _currentDecade = getDecade(year);

  if (_newGlobalEventId) {
    // Decrement active event
    _newEventMonthsLeft = Math.max(0, _newEventMonthsLeft - 1);
    if (_newEventMonthsLeft === 0) {
      // Event expired — fire notification
      const _expiredEvt = GLOBAL_EVENTS.find(e => e.id === _newGlobalEventId);
      if (_expiredEvt) {
        newsItems = [{
          id:           `gev_end_${_newGlobalEventId}_${year}_${month}`,
          year, month,
          category:     (_expiredEvt.type === "positive" ? "growth" : "tech") as NewsCategory,
          title:        `✅ Evento encerrado: "${_expiredEvt.label}" — efeitos normalizados`,
          body:         "O período de influência deste evento econômico global chegou ao fim.",
          moneyDelta:   0, fansDelta: 0, reputationDelta: 0, isRead: false,
        }, ...newsItems];
      }
      _newGlobalEventId = null;
    }
  } else {
    // 1.5% chance per month to trigger a new decade-appropriate event
    const _roll = Math.random();
    if (_roll < 0.015) {
      const _candidates = GLOBAL_EVENTS.filter(e => e.decade === _currentDecade);
      if (_candidates.length > 0) {
        const _triggered = _candidates[Math.floor(Math.random() * _candidates.length)];
        _newGlobalEventId   = _triggered.id;
        _newEventMonthsLeft = _triggered.durationMonths;
        newsItems = [{
          id:           `gev_start_${_triggered.id}_${year}_${month}`,
          year, month,
          category:     (_triggered.type === "positive" ? "growth" : "crisis") as NewsCategory,
          title:        _triggered.newsHeadline,
          body:         `Evento econômico global ativo por ${_triggered.durationMonths} meses. Holdings estratégicos podem reduzir impactos negativos.`,
          moneyDelta:   0, fansDelta: 0, reputationDelta: 0, isRead: false,
        }, ...newsItems];
      }
    }
  }

  const newState: ActiveGameState = {
    ...state,
    year: newYear,
    month: newMonth,
    money: Number.isFinite(money) ? money : 0,
    fans: Math.max(0, Number.isFinite(fans) ? fans : 0),
    // Reconcile fan breakdown: events/awards after the formula may have added to `fans`
    // directly — distribute any surplus 70/25/5 then persist the breakdown.
    fanBreakdown: (() => {
      const extra = Math.max(0, fans - (fanCasual + fanLoyal + fanCritical));
      const c = Math.max(0, fanCasual   + Math.round(extra * 0.70));
      const l = Math.max(0, fanLoyal    + Math.round(extra * 0.25));
      const k = Math.max(0, fanCritical + Math.round(extra * 0.05));
      return { casual: c, loyal: l, critical: k };
    })(),
    reputation: Math.round(reputation * 10) / 10,
    consoles: updatedConsoles,
    activeMarketing: newActiveMkt,
    marketingMonthsLeft: newMarkMonths,
    news: newsItems.slice(0, 60),
    competitors: updatedCompetitors,
    totalRevenue: state.totalRevenue + totalRevenue + gameProjectRevenue,
    marketShare: Math.round(mktShare * 10) / 10,
    employees: updatedEmployees,
    gameProjects: _rescueSeizedGameIds.length > 0
      ? updatedProjects.map((p) =>
          _rescueSeizedGameIds.includes(p.id) ? { ...p, phase: "cancelled" as const } : p
        )
      : updatedProjects,
    researchedNodes: newResearchedNodes,
    currentResearch: newCurrentResearch,
    researchMonthsLeft: newResearchMonths,
    firedHistoricalEvents: newFiredEvents,
    unlockedCountries: state.unlockedCountries ?? ["usa"],
    branches: _rescueSeizedBranchIds.length > 0
      ? processedBranches.filter((b) => !_rescueSeizedBranchIds.includes(b.id))
      : processedBranches,
    activeLoans: updatedLoans,
    creditRating: newCreditRating,
    totalLoansPaid,
    totalShares: state.totalShares ?? TOTAL_SHARES,
    playerShares,
    investors: updatedInvestors,
    pendingOffers,
    companyValue: newCompanyValue,
    sharePrice: newSharePrice,
    acquisitions: updatedAcquisitions,
    sponsorshipOpportunities: newSponsorshipOpps,
    countryTaxModifiers: taxModifiers,
    trophies: [...(state.trophies ?? []), ...newTrophies],
    // ── v4 new fields ────────────────────────────────────────────────────────
    techRep,
    commercialRep,
    fanRep,
    dynamicEventHistory: newDynEventHistory,
    tempBugRiskBonus:     newTempBugRiskBonus,
    tempDevSpeedBonus:    newTempDevSpeedBonus,
    tempMarketDemandMult: newTempMarketDemandMult,
    tempBonusMonthsLeft:  newTempBonusMonthsLeft,
    franchises: updatedFranchises,
    unlockedAchievements: newAchievements,
    revenueHistory: newRevenueHistory,
    nearFailureCount,
    nextRivalAttackMonth:    newNextRivalAttackMonth,
    nextDynEventMonthIdx:       newNextDynEventMonthIdx,
    nextRivalEventMonthIdx:     newNextRivalEventMonthIdx,
    nextRandomNewsMonthIdx:     newNextRandomNewsMonthIdx,
    eventCategoryLastMonthIdx:  _catCooldowns,
    playerAttackCooldowns: state.playerAttackCooldowns ?? {},
    pendingCounterAttacks,
    stockListings: updatedStockListings,
    stockPriceHistory: newStockPriceHistory,
    recoveredFromCrisis,
    activeScandals:    updatedScandals,
    scandalHistory,
    pendingInfluencers,
    hiredInfluencers,
    mediaPrestige,
    companyEfficiency:    Math.round(eficienciaEmpresa * 100) / 100,
    avgMarketSaturation:  Math.round(saturacaoMercado * 1000) / 1000,
    shadowInvestor: newShadowInvestor,
    financialHistory:     newFinancialHistory,
    totalExpensesAccum:   safeN(state.totalExpensesAccum, 0) + Math.round(monthlyExpTotal),
    shareholderSatisfaction:        newShareholderSatisfaction,
    lastShareholderMeetingMonthIdx: state.lastShareholderMeetingMonthIdx,
    shareholderPromisePending:      shareholderPromisePending,
    localHoldings:                  localHoldings,
    legalContract:                  newLegalContract,
    activeStrategyOptions:          newActiveStrategyOptions,
    rescueOffer:                    newRescueOffer,
    rescueContract:                 newRescueContract,
    geoConflictNegotiationMonthsLeft: newGeoNegotiationMonthsLeft > 0 ? newGeoNegotiationMonthsLeft : undefined,
    // ── Global Economic Events ─────────────────────────────────────────────
    activeGlobalEvent:    _newGlobalEventId,
    eventRemainingMonths: _newEventMonthsLeft > 0 ? _newEventMonthsLeft : undefined,
  };

  return {
    newState,
    summary: {
      officeCost,
      adminSaving,
      salaryCost: empSalaries,
      maintenanceCost: maintenanceCost + baseOverhead,
      consoleSales: totalSales,
      consoleRevenue: totalRevenue + gameProjectRevenue,
      netChange: money - state.money,
      newNews: newsForSummary,
      monthlyDividend,
      newlyReleasedGames: newlyReleasedGames.length > 0 ? newlyReleasedGames : undefined,
      newlyUnlockedAchievements: newlyUnlocked.length > 0 ? newlyUnlocked : undefined,
    },
  };
}

const CONSOLE_SUFFIXES = ["Pro", "Ultra", "Max", "Xtreme", "Turbo", "Elite", "Neo", "Vision", "X", "One"];

function generateRandomNews(year: number, month: number, _competitors: Competitor[]): NewsItem | null {
  // Reduced base chance: 15% per month (was 35%).
  // Competitor-type random news removed — real attacks/events handle competitor coverage.
  // Only era-aware industry/world news fires here.
  if (Math.random() > 0.15) return null;

  const template = getEraNewsItem(year);
  if (!template) return null;
  // Skip competitor-category templates to avoid duplicate competitor noise
  if (template.category === "competitor") return null;
  return {
    id: `news_${year}_${month}_${template.category}_${Math.random().toString(36).slice(2,5)}`,
    year, month,
    category: template.category,
    title: template.title,
    body: template.body,
    moneyDelta: template.m,
    fansDelta: template.f,
    reputationDelta: template.r,
    isRead: false,
  };
}

export const MONTHS_PT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
export const NEWS_CATEGORY_COLORS: Record<NewsCategory, string> = {
  launch: "#4DA6FF",
  tech: "#A855F7",
  crisis: "#FF4D6A",
  growth: "#10B981",
  competitor: "#F5A623",
  award: "#F5A623",
};
export const NEWS_CATEGORY_ICONS: Record<NewsCategory, string> = {
  launch: "package",
  tech: "cpu",
  crisis: "alert-triangle",
  growth: "trending-up",
  competitor: "users",
  award: "award",
};
