// ─────────────────────────────────────────────────────────────────
// GLOBAL MARKET SYSTEM
// Countries, regions, economic data, pricing, and expansion
// ─────────────────────────────────────────────────────────────────

export type Region = "north_america" | "south_america" | "europe" | "east_asia" | "southeast_asia" | "middle_east" | "africa" | "oceania";

export type Country = {
  id: string;
  name: string;
  flag: string;
  region: Region;
  population: number;          // millions
  gdpPerCapita: number;        // USD (2024 baseline)
  gamingPenetration: number;   // 0–1 (fraction of pop who game)
  taxRate: number;             // 0–1 (effective tax on corporate profits)
  importDuty: number;          // 0–1 (tariff on imported electronics)
  pricingMultiplier: number;   // price relative to USD baseline
  unlockCostBase: number;      // USD to enter market (scales with year)
  branchCostMonthly: number;   // USD/month to maintain branch
  minYear: number;             // Earliest year this market matters
  riskLevel: "low" | "medium" | "high" | "very_high";
  currencySymbol: string;
  notes: string;
};

export const COUNTRIES: Country[] = [
  // ── North America ──────────────────────────────────────────────
  {
    id: "usa", name: "Estados Unidos", flag: "🇺🇸", region: "north_america",
    population: 335, gdpPerCapita: 76000, gamingPenetration: 0.70,
    taxRate: 0.21, importDuty: 0.02, pricingMultiplier: 1.0,
    unlockCostBase: 50000, branchCostMonthly: 8000, minYear: 1972,
    riskLevel: "low", currencySymbol: "$", notes: "Maior mercado de games do mundo",
  },
  {
    id: "canada", name: "Canadá", flag: "🇨🇦", region: "north_america",
    population: 38, gdpPerCapita: 55000, gamingPenetration: 0.68,
    taxRate: 0.265, importDuty: 0.03, pricingMultiplier: 0.95,
    unlockCostBase: 20000, branchCostMonthly: 4000, minYear: 1975,
    riskLevel: "low", currencySymbol: "CAD", notes: "Forte indústria tech em Vancouver/Toronto",
  },
  {
    id: "mexico", name: "México", flag: "🇲🇽", region: "north_america",
    population: 130, gdpPerCapita: 10800, gamingPenetration: 0.45,
    taxRate: 0.30, importDuty: 0.10, pricingMultiplier: 0.55,
    unlockCostBase: 15000, branchCostMonthly: 2000, minYear: 1980,
    riskLevel: "medium", currencySymbol: "MXN", notes: "Mercado emergente de rápido crescimento",
  },

  // ── South America ──────────────────────────────────────────────
  {
    id: "brazil", name: "Brasil", flag: "🇧🇷", region: "south_america",
    population: 215, gdpPerCapita: 8800, gamingPenetration: 0.55,
    taxRate: 0.34, importDuty: 0.60, pricingMultiplier: 0.70,
    unlockCostBase: 25000, branchCostMonthly: 3000, minYear: 1983,
    riskLevel: "medium", currencySymbol: "R$", notes: "Alta tributação (Lei de Informática). Mercado enorme mas preços inflacionados.",
  },
  {
    id: "argentina", name: "Argentina", flag: "🇦🇷", region: "south_america",
    population: 46, gdpPerCapita: 10300, gamingPenetration: 0.50,
    taxRate: 0.35, importDuty: 0.35, pricingMultiplier: 0.60,
    unlockCostBase: 10000, branchCostMonthly: 1500, minYear: 1985,
    riskLevel: "high", currencySymbol: "ARS", notes: "Risco cambial elevado. Mercado de PC/mobile forte.",
  },
  {
    id: "colombia", name: "Colômbia", flag: "🇨🇴", region: "south_america",
    population: 52, gdpPerCapita: 6800, gamingPenetration: 0.42,
    taxRate: 0.33, importDuty: 0.15, pricingMultiplier: 0.55,
    unlockCostBase: 8000, branchCostMonthly: 1200, minYear: 1990,
    riskLevel: "medium", currencySymbol: "COP", notes: "Mobile gaming dominante",
  },

  // ── Europe ─────────────────────────────────────────────────────
  {
    id: "uk", name: "Reino Unido", flag: "🇬🇧", region: "europe",
    population: 68, gdpPerCapita: 46300, gamingPenetration: 0.72,
    taxRate: 0.25, importDuty: 0.03, pricingMultiplier: 1.05,
    unlockCostBase: 30000, branchCostMonthly: 6000, minYear: 1975,
    riskLevel: "low", currencySymbol: "£", notes: "Segundo maior mercado europeu. Forte esports.",
  },
  {
    id: "germany", name: "Alemanha", flag: "🇩🇪", region: "europe",
    population: 84, gdpPerCapita: 48000, gamingPenetration: 0.65,
    taxRate: 0.30, importDuty: 0.03, pricingMultiplier: 1.08,
    unlockCostBase: 30000, branchCostMonthly: 6500, minYear: 1975,
    riskLevel: "low", currencySymbol: "€", notes: "Maior mercado de games da Europa continental",
  },
  {
    id: "france", name: "França", flag: "🇫🇷", region: "europe",
    population: 68, gdpPerCapita: 44000, gamingPenetration: 0.63,
    taxRate: 0.33, importDuty: 0.03, pricingMultiplier: 1.05,
    unlockCostBase: 25000, branchCostMonthly: 5500, minYear: 1975,
    riskLevel: "low", currencySymbol: "€", notes: "Berço de grandes publishers europeias — histórico gaming",
  },
  {
    id: "spain", name: "Espanha", flag: "🇪🇸", region: "europe",
    population: 48, gdpPerCapita: 30000, gamingPenetration: 0.60,
    taxRate: 0.28, importDuty: 0.03, pricingMultiplier: 0.95,
    unlockCostBase: 18000, branchCostMonthly: 4000, minYear: 1982,
    riskLevel: "low", currencySymbol: "€", notes: "Mobile e esports em crescimento",
  },
  {
    id: "russia", name: "Rússia", flag: "🇷🇺", region: "europe",
    population: 145, gdpPerCapita: 12200, gamingPenetration: 0.62,
    taxRate: 0.20, importDuty: 0.15, pricingMultiplier: 0.65,
    unlockCostBase: 20000, branchCostMonthly: 2500, minYear: 1991,
    riskLevel: "very_high", currencySymbol: "₽", notes: "Risco político/sanções elevadas. PC gaming dominante.",
  },
  {
    id: "poland", name: "Polônia", flag: "🇵🇱", region: "europe",
    population: 38, gdpPerCapita: 18500, gamingPenetration: 0.65,
    taxRate: 0.19, importDuty: 0.03, pricingMultiplier: 0.75,
    unlockCostBase: 12000, branchCostMonthly: 2000, minYear: 1993,
    riskLevel: "low", currencySymbol: "PLN", notes: "Projexis, BitForge — hub de dev europeu emergente",
  },

  // ── East Asia ──────────────────────────────────────────────────
  {
    id: "japan", name: "Japão", flag: "🇯🇵", region: "east_asia",
    population: 125, gdpPerCapita: 35000, gamingPenetration: 0.75,
    taxRate: 0.30, importDuty: 0.01, pricingMultiplier: 0.90,
    unlockCostBase: 80000, branchCostMonthly: 12000, minYear: 1972,
    riskLevel: "low", currencySymbol: "¥", notes: "Berço do videogame. Nintaro, Soniq, Senga. Mercado único e exigente.",
  },
  {
    id: "china", name: "China", flag: "🇨🇳", region: "east_asia",
    population: 1412, gdpPerCapita: 12500, gamingPenetration: 0.50,
    taxRate: 0.25, importDuty: 0.20, pricingMultiplier: 0.70,
    unlockCostBase: 100000, branchCostMonthly: 15000, minYear: 1990,
    riskLevel: "high", currencySymbol: "¥", notes: "Maior mercado absoluto. Regulação de conteúdo + licenças obrigatórias.",
  },
  {
    id: "south_korea", name: "Coreia do Sul", flag: "🇰🇷", region: "east_asia",
    population: 52, gdpPerCapita: 33000, gamingPenetration: 0.80,
    taxRate: 0.25, importDuty: 0.08, pricingMultiplier: 0.88,
    unlockCostBase: 35000, branchCostMonthly: 7000, minYear: 1985,
    riskLevel: "low", currencySymbol: "₩", notes: "Alta penetração gaming. Esports capital do mundo.",
  },
  {
    id: "taiwan", name: "Taiwan", flag: "🇹🇼", region: "east_asia",
    population: 23, gdpPerCapita: 32000, gamingPenetration: 0.70,
    taxRate: 0.20, importDuty: 0.05, pricingMultiplier: 0.80,
    unlockCostBase: 15000, branchCostMonthly: 3500, minYear: 1985,
    riskLevel: "medium", currencySymbol: "TWD", notes: "Hub global de manufatura de semicondutores",
  },

  // ── Southeast Asia ─────────────────────────────────────────────
  {
    id: "indonesia", name: "Indonésia", flag: "🇮🇩", region: "southeast_asia",
    population: 275, gdpPerCapita: 4800, gamingPenetration: 0.55,
    taxRate: 0.25, importDuty: 0.10, pricingMultiplier: 0.45,
    unlockCostBase: 15000, branchCostMonthly: 1800, minYear: 1995,
    riskLevel: "medium", currencySymbol: "Rp", notes: "Mobile gaming explosivo. 4o maior país do mundo.",
  },
  {
    id: "india", name: "Índia", flag: "🇮🇳", region: "southeast_asia",
    population: 1400, gdpPerCapita: 2500, gamingPenetration: 0.35,
    taxRate: 0.30, importDuty: 0.20, pricingMultiplier: 0.35,
    unlockCostBase: 20000, branchCostMonthly: 2000, minYear: 1990,
    riskLevel: "medium", currencySymbol: "₹", notes: "Mobile gaming boom. Preços muito baixos mas volume enorme.",
  },
  {
    id: "vietnam", name: "Vietnã", flag: "🇻🇳", region: "southeast_asia",
    population: 98, gdpPerCapita: 3500, gamingPenetration: 0.60,
    taxRate: 0.20, importDuty: 0.10, pricingMultiplier: 0.40,
    unlockCostBase: 8000, branchCostMonthly: 1000, minYear: 1995,
    riskLevel: "low", currencySymbol: "₫", notes: "Internet café e mobile gaming cultural",
  },
  {
    id: "thailand", name: "Tailândia", flag: "🇹🇭", region: "southeast_asia",
    population: 72, gdpPerCapita: 7200, gamingPenetration: 0.55,
    taxRate: 0.20, importDuty: 0.10, pricingMultiplier: 0.50,
    unlockCostBase: 10000, branchCostMonthly: 1500, minYear: 1993,
    riskLevel: "low", currencySymbol: "฿", notes: "Centro esports SEA",
  },

  // ── Middle East ────────────────────────────────────────────────
  {
    id: "saudi_arabia", name: "Arábia Saudita", flag: "🇸🇦", region: "middle_east",
    population: 36, gdpPerCapita: 27000, gamingPenetration: 0.70,
    taxRate: 0.20, importDuty: 0.05, pricingMultiplier: 0.90,
    unlockCostBase: 30000, branchCostMonthly: 6000, minYear: 2000,
    riskLevel: "low", currencySymbol: "SAR", notes: "Investimento saudita Vision 2030 em gaming/esports",
  },
  {
    id: "uae", name: "Emirados Árabes", flag: "🇦🇪", region: "middle_east",
    population: 10, gdpPerCapita: 45000, gamingPenetration: 0.72,
    taxRate: 0.09, importDuty: 0.05, pricingMultiplier: 1.0,
    unlockCostBase: 25000, branchCostMonthly: 7000, minYear: 2000,
    riskLevel: "low", currencySymbol: "AED", notes: "Hub financeiro. Free-zone facilita operações.",
  },

  // ── Africa ─────────────────────────────────────────────────────
  {
    id: "nigeria", name: "Nigéria", flag: "🇳🇬", region: "africa",
    population: 220, gdpPerCapita: 2100, gamingPenetration: 0.30,
    taxRate: 0.30, importDuty: 0.20, pricingMultiplier: 0.35,
    unlockCostBase: 8000, branchCostMonthly: 800, minYear: 2000,
    riskLevel: "high", currencySymbol: "₦", notes: "Mobile gaming explosivo. Maior economia africana.",
  },
  {
    id: "south_africa", name: "África do Sul", flag: "🇿🇦", region: "africa",
    population: 60, gdpPerCapita: 6200, gamingPenetration: 0.45,
    taxRate: 0.28, importDuty: 0.15, pricingMultiplier: 0.55,
    unlockCostBase: 12000, branchCostMonthly: 1500, minYear: 1995,
    riskLevel: "medium", currencySymbol: "R", notes: "Gateway África austral. Console gaming presente.",
  },

  // ── Oceania ────────────────────────────────────────────────────
  {
    id: "australia", name: "Austrália", flag: "🇦🇺", region: "oceania",
    population: 26, gdpPerCapita: 55000, gamingPenetration: 0.67,
    taxRate: 0.30, importDuty: 0.05, pricingMultiplier: 1.05,
    unlockCostBase: 20000, branchCostMonthly: 5000, minYear: 1978,
    riskLevel: "low", currencySymbol: "AUD", notes: "Mercado estável com preços premium",
  },
];

export type BranchType = "sales_office" | "factory" | "dev_studio";

// ── Dynamic tax events ─────────────────────────────────────────────────────────
export type TaxEventType =
  | "slight_increase"       // +15%, 24 months
  | "significant_increase"  // +30%, 12 months
  | "emergency_levy"        // +50%, 6 months — crisis event
  | "tech_incentive"        // -20%, 18 months — government program
  | "tax_holiday"           // -35%, 12 months — special deal
  | "stable";               // no modifier (default)

export type TaxModifier = {
  type: TaxEventType;
  modifier: number;    // multiplier on base tax rate (e.g. 1.30 = +30%)
  monthsLeft: number;
  reason: string;
};

export const TAX_EVENT_DEFINITIONS: Record<Exclude<TaxEventType, "stable">, {
  modifier: number; durationMonths: number; label: string; color: string;
}> = {
  slight_increase:       { modifier: 1.15, durationMonths: 24, label: "Aumento Moderado",   color: "#F5A623" },
  significant_increase:  { modifier: 1.30, durationMonths: 12, label: "Aumento Significativo", color: "#FF9800" },
  emergency_levy:        { modifier: 1.50, durationMonths: 6,  label: "Sobretaxa de Emergência", color: "#FF4D6A" },
  tech_incentive:        { modifier: 0.80, durationMonths: 18, label: "Incentivo Tecnológico", color: "#10B981" },
  tax_holiday:           { modifier: 0.65, durationMonths: 12, label: "Isenção Fiscal",       color: "#4DA6FF" },
};

// ── 3-tier store expansion ─────────────────────────────────────────────────────
export type StoreExpansionTier = "stores_30" | "stores_60" | "auto_expansion";

export type BranchIncident = {
  id: string;
  year: number;
  month: number;
  type: "robbery" | "vandalism" | "strike" | "regulatory" | "fire" | "power_outage";
  severity: "minor" | "major" | "critical";
  description: string;
  moneyCost: number;
};

export type CountryBranch = {
  countryId: string;
  type: BranchType;
  openedYear: number;
  openedMonth: number;
  monthlyCost: number;
  monthlyRevenueBonus: number;
  employeeCount: number;
  // Store expansion (optional — added when player expands beyond the base branch)
  storeExpansion?: StoreExpansionTier;
  storeCount?: number;      // current number of stores (auto_expansion grows this)
  storeExpandedYear?: number;
  // Incident tracking — persisted, displayed in world-map panel
  robberyCount?: number;
  vandalismCount?: number;
  totalIncidentCost?: number;
  incidentLog?: BranchIncident[];   // last 12 incidents stored
  // Operational stats — updated every month
  monthlyEstimatedRevenue?: number;
  cumulativeRevenue?: number;
  cumulativeCost?: number;
  efficiency?: number;              // 0–100
  riskScore?: number;               // 0–100 (higher = more incidents)
  lastIncidentYear?: number;
  lastIncidentMonth?: number;
};

export function getCountryById(id: string): Country | undefined {
  return COUNTRIES.find((c) => c.id === id);
}

export function getCountriesByRegion(region: Region): Country[] {
  return COUNTRIES.filter((c) => c.region === region);
}

export const REGION_NAMES: Record<Region, string> = {
  north_america: "América do Norte",
  south_america: "América do Sul",
  europe: "Europa",
  east_asia: "Leste Asiático",
  southeast_asia: "Sudeste Asiático",
  middle_east: "Oriente Médio",
  africa: "África",
  oceania: "Oceania",
};

export const REGION_COLORS: Record<Region, string> = {
  north_america: "#4DA6FF",
  south_america: "#10B981",
  europe: "#A855F7",
  east_asia: "#FF4D6A",
  southeast_asia: "#F5A623",
  middle_east: "#F59E0B",
  africa: "#EF4444",
  oceania: "#06B6D4",
};

export const RISK_COLORS = {
  low: "#10B981",
  medium: "#F5A623",
  high: "#FF4D6A",
  very_high: "#DC2626",
};

// Calculate market size (potential monthly sales units) for a country
export function getCountryMarketSize(country: Country, year: number): number {
  const yearProgress = Math.max(0, Math.min(1, (year - country.minYear) / 30));
  const basePop = country.population * 1_000_000;
  const gamers = basePop * country.gamingPenetration * yearProgress;
  // Assume 1% of gamers buy a new console per year → monthly sales
  return Math.round((gamers * 0.01) / 12);
}

// Calculate actual revenue boost from having a market unlocked
export function getCountryRevenueMult(country: Country, hasBranch: boolean): number {
  const base = hasBranch ? 1.0 : 0.5;
  return base * country.pricingMultiplier;
}

// Unlock cost scales with year (early = cheaper, modern = expensive)
export function getUnlockCost(country: Country, year: number): number {
  const yearScale = 1 + Math.max(0, (year - 1990) / 50);
  return Math.round(country.unlockCostBase * yearScale / 1000) * 1000;
}

// Branch establishment cost
export function getBranchCost(country: Country, type: BranchType): number {
  const multipliers: Record<BranchType, number> = {
    sales_office: 1,
    factory: 5,
    dev_studio: 3,
  };
  return country.branchCostMonthly * multipliers[type];
}

export const BRANCH_TYPE_NAMES: Record<BranchType, string> = {
  sales_office: "Escritório de Vendas",
  factory: "Fábrica",
  dev_studio: "Estúdio de Desenvolvimento",
};

export const BRANCH_TYPE_ICONS: Record<BranchType, string> = {
  sales_office: "briefcase",
  factory: "settings",
  dev_studio: "code",
};

// ── Store expansion costs & revenue multipliers ────────────────────────────────
// 30 stores: high one-time cost, fixed 30 stores, 1.8x revenue mult
// 60 stores: very high one-time cost, fixed 60 stores, 2.8x revenue mult
// Auto:      lower entry + monthly fee, grows to 200+ stores, up to 3.5x mult

export function getStoreExpansionCost(country: Country, tier: StoreExpansionTier): {
  oneTimeCost: number;
  monthlyExtra: number;
} {
  // Base the cost on GDP per capita to account for richer vs poorer markets.
  // Minimum floors ensure realism (spec: 30 stores > $1M, 60 stores >> $1M).
  const gdpBase = country.gdpPerCapita * country.population * 0.000004; // scaled market factor
  switch (tier) {
    case "stores_30": {
      const cost = Math.max(1_200_000, Math.round(gdpBase * 1.8));
      return { oneTimeCost: cost, monthlyExtra: Math.round(cost * 0.008) };
    }
    case "stores_60": {
      const cost = Math.max(3_500_000, Math.round(gdpBase * 4.5));
      return { oneTimeCost: cost, monthlyExtra: Math.round(cost * 0.007) };
    }
    case "auto_expansion": {
      const cost = Math.max(400_000, Math.round(gdpBase * 0.6));
      const monthly = Math.round(cost * 0.04); // 4% of entry cost per month + grows
      return { oneTimeCost: cost, monthlyExtra: monthly };
    }
  }
}

export function getStoreRevenueMult(branch: CountryBranch, pricingMult: number): number {
  const tier = branch.storeExpansion;
  if (!tier) return branch.type ? 1.0 * pricingMult : 0.5 * pricingMult;
  switch (tier) {
    case "stores_30":      return 1.8 * pricingMult;
    case "stores_60":      return 2.8 * pricingMult;
    case "auto_expansion": {
      const count = branch.storeCount ?? 0;
      const mult = 1.0 + Math.min(2.5, count / 80); // 0 stores → 1.0x, 200 stores → 3.5x
      return mult * pricingMult;
    }
  }
}

export const STORE_EXPANSION_NAMES: Record<StoreExpansionTier, string> = {
  stores_30:      "30 Lojas",
  stores_60:      "60 Lojas",
  auto_expansion: "Expansão Automática",
};

export const STORE_EXPANSION_DESCRIPTIONS: Record<StoreExpansionTier, string> = {
  stores_30:      "Abre 30 lojas físicas. Custo fixo elevado, 1.8× receita neste mercado.",
  stores_60:      "Abre 60 lojas físicas. Custo muito elevado, 2.8× receita neste mercado.",
  auto_expansion: "Expansão gradual automática. Custo de entrada + mensalidade crescente. Cresce conforme reputação e mercado. Até 3.5× receita.",
};

// ── International Export System ────────────────────────────────────────────────

export type ExportRegionData = {
  regionId: Region;
  investment: number;    // one-time launch investment chosen by player
  blocked: boolean;      // true if regional restriction applies
  blockReason?: string;  // displayed to player when blocked
};

// Relative demand weight per region (North America = home base, always in base revenue)
export const REGION_DEMAND_FACTORS: Record<Region, number> = {
  north_america:  1.00,
  europe:         0.82,
  east_asia:      0.88,
  south_america:  0.52,
  southeast_asia: 0.48,
  middle_east:    0.40,
  oceania:        0.28,
  africa:         0.22,
};

// Three investment tiers per region (low / standard / aggressive) in USD
// north_america is home base — export not applicable
export const REGION_INVESTMENT_TIERS: Record<Region, [number, number, number]> = {
  north_america:  [0, 0, 0],
  europe:         [40_000, 120_000, 300_000],
  east_asia:      [60_000, 180_000, 500_000],
  south_america:  [20_000,  60_000, 150_000],
  southeast_asia: [15_000,  45_000, 120_000],
  middle_east:    [30_000,  90_000, 250_000],
  oceania:        [20_000,  60_000, 150_000],
  africa:         [10_000,  30_000,  80_000],
};

export const REGION_INVESTMENT_LABELS: ["Básico", "Padrão", "Agressivo"] =
  ["Básico", "Padrão", "Agressivo"];

// Regions the player can export to (excludes home base north_america)
export const EXPORTABLE_REGIONS: Region[] = [
  "europe", "east_asia", "south_america", "southeast_asia",
  "middle_east", "oceania", "africa",
];

/**
 * Check whether a game or console is restricted from selling in a region.
 * Returns null if no restriction, or a human-readable reason string if blocked.
 */
export function checkRegionRestriction(
  genre: string,
  ageRating: string | undefined,
  year: number,
  reputation: number,
  regionId: Region,
): string | null {
  if (regionId === "east_asia") {
    if (ageRating === "AO") return "Classificação adulta (AO) é proibida nesta região.";
    if ((genre === "shooter" || genre === "horror") && (ageRating === "M" || ageRating === "AO") && year < 2000)
      return "Conteúdo violento extremo é bloqueado antes de 2000 nesta região.";
    if (genre === "strategy" && year < 1995)
      return "Jogos de estratégia com temas políticos são restritos antes de 1995.";
  }
  if (regionId === "middle_east") {
    if (ageRating === "AO") return "Conteúdo adulto (AO) não é aceito culturalmente nesta região.";
    if (genre === "horror" && ageRating === "M")
      return "Conteúdo de terror com classificação M não é distribuído nesta região.";
    if (year < 2000) return "Mercado de games não estabelecido antes de 2000.";
  }
  if (regionId === "africa") {
    if (year < 1990) return "Mercado tecnologicamente imaturo — disponível a partir de 1990.";
    if (reputation < 15) return "Reputação insuficiente para entrar neste mercado (mín. 15).";
  }
  if (regionId === "southeast_asia") {
    if (ageRating === "AO") return "Classificação adulta não é distribuída nesta região.";
    if (year < 1990) return "Mercado em desenvolvimento — disponível a partir de 1990.";
  }
  if (regionId === "south_america") {
    if (year < 1983) return "Mercado não desenvolvido antes de 1983.";
  }
  if (regionId === "oceania") {
    if (year < 1978) return "Mercado não disponível antes de 1978.";
  }
  if (regionId === "europe") {
    if (year < 1975) return "Mercado europeu de games ainda não estabelecido.";
  }
  return null;
}

/**
 * Returns true if the player has at least one branch in any country
 * belonging to the given region.
 */
export function getRegionHasBranch(
  regionId: Region,
  branches: CountryBranch[],
): boolean {
  const regionCountryIds = getCountriesByRegion(regionId).map((c) => c.id);
  return branches.some((b) => regionCountryIds.includes(b.countryId));
}

/**
 * Revenue multiplier for an export region.
 * - With a branch in the region: full demand factor (no penalty)
 * - Export only (no branch):     50 % penalty on the demand factor
 */
export function getExportRevenueMult(regionId: Region, hasBranch: boolean): number {
  const demand = REGION_DEMAND_FACTORS[regionId] ?? 0.25;
  return demand * (hasBranch ? 1.0 : 0.50);
}

/** Estimate monthly export revenue for a single region based on launch revenue. */
export function estimateExportMonthlyRevenue(
  baseLaunchMonthlyRev: number,
  regionId: Region,
  investment: number,
  hasBranch: boolean,
): number {
  const tiers = REGION_INVESTMENT_TIERS[regionId];
  const maxInv = tiers[2] || 1;
  const invRatio = Math.min(1, investment / maxInv);
  const revMult = getExportRevenueMult(regionId, hasBranch);
  return Math.round(baseLaunchMonthlyRev * 0.35 * invRatio * revMult);
}

// ─────────────────────────────────────────────────────────────────
// STRATEGIC PROFILE SYSTEM
// Derives readable country attributes from existing data fields.
// No new Country fields — fully save-compatible.
// ─────────────────────────────────────────────────────────────────

export type StrategicTier = "low" | "medium" | "high";

export type CountryStrategicProfile = {
  marketSize:        StrategicTier;
  operationalCost:   StrategicTier;
  taxBurden:         StrategicTier;
  industrialStrength: StrategicTier;
  talentBase:        StrategicTier;
  regulationRisk:    StrategicTier;
};

// Countries with known strong manufacturing capacity
const INDUSTRIAL_COUNTRIES = new Set([
  "china", "germany", "japan", "south_korea", "taiwan",
  "usa", "mexico", "india", "vietnam", "poland",
]);

// Countries with strong tech talent pools
const HIGH_TALENT_COUNTRIES = new Set([
  "usa", "canada", "uk", "germany", "japan", "south_korea",
  "taiwan", "australia", "france", "poland", "india", "russia",
]);

/**
 * Derives six strategic attribute tiers from existing country data.
 * All logic is based on existing Country fields — no new fields needed.
 */
export function getCountryStrategicProfile(country: Country): CountryStrategicProfile {
  // Market Size: pop × gaming penetration × pricing (proxy for addressable spend)
  const marketScore = country.population * country.gamingPenetration * country.pricingMultiplier;
  const marketSize: StrategicTier =
    marketScore > 60 ? "high" : marketScore > 15 ? "medium" : "low";

  // Operational Cost: monthly branch cost baseline
  const operationalCost: StrategicTier =
    country.branchCostMonthly >= 6000 ? "high" :
    country.branchCostMonthly >= 2500 ? "medium" : "low";

  // Tax Burden: corporate tax rate
  const taxBurden: StrategicTier =
    country.taxRate >= 0.32 ? "high" :
    country.taxRate >= 0.22 ? "medium" : "low";

  // Industrial Strength: known hubs + high GDP with low import duty
  const industrialStrength: StrategicTier =
    INDUSTRIAL_COUNTRIES.has(country.id) ? "high" :
    (country.gdpPerCapita >= 20000 && country.importDuty <= 0.05) ? "medium" : "low";

  // Talent Base: known tech hubs + GDP proxy for skilled workforce
  const talentBase: StrategicTier =
    HIGH_TALENT_COUNTRIES.has(country.id) ? "high" :
    country.gdpPerCapita >= 12000 ? "medium" : "low";

  // Regulation Risk: directly from riskLevel
  const regulationRisk: StrategicTier =
    country.riskLevel === "very_high" || country.riskLevel === "high" ? "high" :
    country.riskLevel === "medium" ? "medium" : "low";

  return { marketSize, operationalCost, taxBurden, industrialStrength, talentBase, regulationRisk };
}

// ─────────────────────────────────────────────────────────────────
// BRANCH TYPE DESCRIPTIONS
// ─────────────────────────────────────────────────────────────────

export type BranchTypeDescription = {
  emoji: string;
  mainBenefit: string;
  secondaryBenefit: string;
  bestFor: string;
  explanation: string;
};

export const BRANCH_TYPE_DESCRIPTIONS: Record<BranchType, BranchTypeDescription> = {
  sales_office: {
    emoji: "🏢",
    mainBenefit: "Aumenta alcance comercial e presença de marca local",
    secondaryBenefit: "Fortalece penetração de mercado e vendas regionais",
    bestFor: "Países com grande mercado consumidor",
    explanation: "Mais eficaz onde há alto potencial de mercado. Alta tributação reduz retorno líquido de longo prazo.",
  },
  factory: {
    emoji: "🏭",
    mainBenefit: "Melhora capacidade de manufatura e supply chain",
    secondaryBenefit: "Reduz gargalos de produção em mercados industrializados",
    bestFor: "Países com forte base industrial e custo operacional baixo",
    explanation: "Rende mais em países com força industrial consolidada. Custo operacional alto pode comprimir margens.",
  },
  dev_studio: {
    emoji: "💻",
    mainBenefit: "Aumenta capacidade de desenvolvimento regional",
    secondaryBenefit: "Melhora adaptação de produtos ao mercado local",
    bestFor: "Países com forte base de talento tecnológico",
    explanation: "Funciona melhor onde há talento técnico qualificado. Risco regulatório alto pode elevar custos operacionais.",
  },
};

// ─────────────────────────────────────────────────────────────────
// ERA-SCALED BRANCH MONTHLY MAINTENANCE
// Costs scale gently with era progression and country operational burden.
// Only affects NEW branches opened after this version.
// ─────────────────────────────────────────────────────────────────

/**
 * Computes era-scaled monthly maintenance for a new branch.
 * - Era factor grows from 1.0 (1975) to ~1.8 (2025), capped at 2.0.
 * - Operational cost tier applies a ±25% modifier.
 * - Result rounded to nearest $100.
 */
export function getBranchMonthlyMaintenance(country: Country, _type: BranchType, year: number): number {
  const profile = getCountryStrategicProfile(country);
  const eraFactor = 1.0 + Math.max(0, Math.min(1.0, (year - 1975) / 50));
  const opFactor  = profile.operationalCost === "high" ? 1.25 :
                    profile.operationalCost === "medium" ? 1.0 : 0.78;
  const raw = country.branchCostMonthly * eraFactor * opFactor;
  return Math.round(raw / 100) * 100;
}

// ─────────────────────────────────────────────────────────────────
// BRANCH STRATEGIC RECOMMENDATION
// Returns a short advisory string based on country profile × branch type.
// ─────────────────────────────────────────────────────────────────

/**
 * Returns a short recommendation string (or null if neutral).
 * Used inside the branch selection modal to guide player decisions.
 */
export function getBranchRecommendation(country: Country, type: BranchType): string | null {
  const p = getCountryStrategicProfile(country);

  if (type === "sales_office") {
    if (p.marketSize === "high" && p.taxBurden === "low")
      return "Ótimo para vendas — mercado grande e tributação baixa.";
    if (p.marketSize === "high" && p.taxBurden === "high")
      return "Alto potencial de mercado, mas tributação elevada reduz o retorno.";
    if (p.marketSize === "high")
      return "Recomendado — alto potencial de mercado neste país.";
    if (p.marketSize === "low" && p.taxBurden === "high")
      return "Mercado pequeno com tributação alta — retorno comercial limitado.";
    if (p.marketSize === "low")
      return "Mercado consumidor reduzido — considere expandir lojas para compensar.";
    if (p.taxBurden === "high")
      return "Alta tributação reduz lucratividade de longo prazo.";
    return null;
  }

  if (type === "factory") {
    if (p.industrialStrength === "high" && p.operationalCost === "low")
      return "Excelente para manufatura — indústria forte e custo operacional baixo.";
    if (p.industrialStrength === "high" && p.operationalCost === "high")
      return "Boa base industrial, mas custo operacional elevado comprime margens.";
    if (p.industrialStrength === "high")
      return "Boa base industrial para produção de larga escala.";
    if (p.industrialStrength === "low" && p.operationalCost === "high")
      return "Fraca base industrial e custo alto — não recomendado para fábrica.";
    if (p.industrialStrength === "low")
      return "Base industrial limitada — considere outro país para esta filial.";
    if (p.operationalCost === "high")
      return "Custo operacional elevado pode reduzir margem de produção.";
    return null;
  }

  if (type === "dev_studio") {
    if (p.talentBase === "high" && p.regulationRisk === "low")
      return "Excelente para P&D — talento qualificado e ambiente regulatório estável.";
    if (p.talentBase === "high" && p.regulationRisk === "high")
      return "Boa base de talento, mas risco regulatório pode dificultar operações.";
    if (p.talentBase === "high")
      return "Boa base de talento técnico disponível neste mercado.";
    if (p.talentBase === "low" && p.regulationRisk === "high")
      return "Talento limitado e risco regulatório alto — não recomendado para P&D.";
    if (p.talentBase === "low")
      return "Base de talento limitada — retorno de desenvolvimento será reduzido.";
    if (p.regulationRisk === "high")
      return "Risco regulatório alto pode aumentar custos e rotatividade.";
    return null;
  }

  return null;
}
