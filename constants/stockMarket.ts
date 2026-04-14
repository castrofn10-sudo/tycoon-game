// ─── Stock Market & Company Ownership System ──────────────────────────────────

export const TOTAL_SHARES = 10_000;

// ── Stock sell listing & bidding ──────────────────────────────────────────────

export type StockBid = {
  id: string;
  investorName: string;
  country: string;
  countryFlag: string;
  personality: InvestorPersonality;
  offerPerShare: number;
  totalOffer: number;
  conditions: string;
  expiresYear: number;
  expiresMonth: number;
};

export type StockListing = {
  id: string;
  percentForSale: number;
  minAskPerShare: number;
  listedYear: number;
  listedMonth: number;
  bids: StockBid[];
};

export type StockPricePoint = {
  year: number;
  month: number;
  price: number;
};

export type InvestorPersonality =
  | "conservative"
  | "aggressive"
  | "visionary"
  | "opportunistic"
  | "predatory";

export type Investor = {
  id: string;
  name: string;
  country: string;
  countryFlag: string;
  personality: InvestorPersonality;
  sharesOwned: number;
  dealYear: number;
  dealMonth: number;
};

export type InvestorOffer = {
  id: string;
  investorName: string;
  country: string;
  countryFlag: string;
  personality: InvestorPersonality;
  offerAmount: number;
  desiredSharePercent: number;
  conditions: string;
  expiresMonth: number;
  expiresYear: number;
  isDistressed: boolean;
};

export type Acquisition = {
  id: string;
  name: string;
  country: string;
  countryFlag: string;
  type: "studio" | "hardware_lab" | "publisher" | "marketing_agency" | "movie_studio" | "sports_team" | "shopping_center" | "event_company" | "music_label";
  purchasePrice: number;
  currentValuation: number;
  monthlyRevenue: number;
  monthlyExpense: number;
  synergySummary: string;
  revenueBonus: number;
  reputationBonus: number;
  researchBonus: number;
  availableFromYear: number;
  purchasedYear: number;
  purchasedMonth: number;
};

export type AcquirableCompany = Omit<Acquisition, "purchasedYear" | "purchasedMonth">;

// ── Display metadata ──────────────────────────────────────────────────────────

export const PERSONALITY_COLORS: Record<InvestorPersonality, string> = {
  conservative:  "#10B981",
  aggressive:    "#FF4D6A",
  visionary:     "#A855F7",
  opportunistic: "#F5A623",
  predatory:     "#FF2244",
};

export const PERSONALITY_LABELS: Record<InvestorPersonality, string> = {
  conservative:  "Conservador",
  aggressive:    "Agressivo",
  visionary:     "Visionário",
  opportunistic: "Oportunista",
  predatory:     "Predatório",
};

export const PERSONALITY_ICONS: Record<InvestorPersonality, string> = {
  conservative:  "shield",
  aggressive:    "zap",
  visionary:     "eye",
  opportunistic: "trending-up",
  predatory:     "alert-triangle",
};

export const ACQUISITION_TYPE_ICONS: Record<Acquisition["type"], string> = {
  studio:           "monitor",
  hardware_lab:     "cpu",
  publisher:        "book",
  marketing_agency: "radio",
  movie_studio:     "film",
  sports_team:      "activity",
  shopping_center:  "shopping-bag",
  event_company:    "calendar",
  music_label:      "music",
};

export const ACQUISITION_TYPE_COLORS: Record<Acquisition["type"], string> = {
  studio:           "#4DA6FF",
  hardware_lab:     "#A855F7",
  publisher:        "#F5A623",
  marketing_agency: "#10B981",
  movie_studio:     "#F59E0B",
  sports_team:      "#EF4444",
  shopping_center:  "#06B6D4",
  event_company:    "#8B5CF6",
  music_label:      "#EC4899",
};

export const ACQUISITION_TYPE_LABELS: Record<Acquisition["type"], string> = {
  studio:           "Estúdio de Games",
  hardware_lab:     "Laboratório de Hardware",
  publisher:        "Distribuidora",
  marketing_agency: "Agência de Marketing",
  movie_studio:     "Estúdio de Cinema",
  sports_team:      "Equipe Desportiva",
  shopping_center:  "Centro Comercial",
  event_company:    "Empresa de Eventos",
  music_label:      "Editora Musical",
};

// ── Investor profile pool ─────────────────────────────────────────────────────

type InvestorProfile = {
  name: string;
  country: string;
  flag: string;
  personality: InvestorPersonality;
};

export const INVESTOR_PROFILES: InvestorProfile[] = [
  { name: "Hiroshi Tanaka Capital",   country: "Japão",         flag: "🇯🇵", personality: "conservative" },
  { name: "Marcus Blackwell Holdings", country: "EUA",           flag: "🇺🇸", personality: "aggressive" },
  { name: "Elena Sokolova Ventures",  country: "Rússia",        flag: "🇷🇺", personality: "opportunistic" },
  { name: "Wei Zhang Group",          country: "China",         flag: "🇨🇳", personality: "aggressive" },
  { name: "Sophie Beaumont SA",       country: "França",        flag: "🇫🇷", personality: "visionary" },
  { name: "Raj Patel Partners",       country: "Índia",         flag: "🇮🇳", personality: "opportunistic" },
  { name: "Klaus Richter GmbH",       country: "Alemanha",      flag: "🇩🇪", personality: "conservative" },
  { name: "Omar Al-Rashid Fund",      country: "Emirados Árabes", flag: "🇦🇪", personality: "visionary" },
  { name: "Ivan Petrov Holdings",     country: "Rússia",        flag: "🇷🇺", personality: "predatory" },
  { name: "Gabriel Costa Fundo",      country: "Brasil",        flag: "🇧🇷", personality: "opportunistic" },
  { name: "Anya Kim Corp",            country: "Coreia do Sul", flag: "🇰🇷", personality: "conservative" },
  { name: "Nexus Capital Ltd",        country: "Reino Unido",   flag: "🇬🇧", personality: "aggressive" },
  { name: "SkyBridge Partners",       country: "EUA",           flag: "🇺🇸", personality: "visionary" },
  { name: "TechVault Capital",        country: "Canadá",        flag: "🇨🇦", personality: "conservative" },
  { name: "Apex Holdings",            country: "Singapura",     flag: "🇸🇬", personality: "predatory" },
];

// ── Companies available for acquisition ───────────────────────────────────────

export const ACQUIRABLE_COMPANIES: Omit<Acquisition, "purchasedYear" | "purchasedMonth">[] = [
  {
    id: "neonbrand_agency",
    name: "NeonBrand Agency",
    country: "Japão",
    countryFlag: "🇯🇵",
    type: "marketing_agency",
    purchasePrice:     4_000_000,
    currentValuation:  4_000_000,
    monthlyRevenue:     100_000,
    monthlyExpense:      50_000,
    synergySummary: "+30% eficiência de marketing · +5k fãs/mês",
    revenueBonus:       100_000,
    reputationBonus:    4,
    researchBonus:      0,
    availableFromYear:  1982,
  },
  {
    id: "pixelworks_studio",
    name: "PixelWorks Studio",
    country: "Irlanda",
    countryFlag: "🇮🇪",
    type: "studio",
    purchasePrice:     5_000_000,
    currentValuation:  5_000_000,
    monthlyRevenue:     150_000,
    monthlyExpense:      80_000,
    synergySummary: "+15% receita de jogos · +5 devs",
    revenueBonus:       150_000,
    reputationBonus:    3,
    researchBonus:      5,
    availableFromYear:  1985,
  },
  {
    id: "globalpress_media",
    name: "GlobalPress Media",
    country: "EUA",
    countryFlag: "🇺🇸",
    type: "publisher",
    purchasePrice:     8_000_000,
    currentValuation:  8_000_000,
    monthlyRevenue:     200_000,
    monthlyExpense:     100_000,
    synergySummary: "+25% receita global · distribuição em 5 novos mercados",
    revenueBonus:       200_000,
    reputationBonus:    8,
    researchBonus:      3,
    availableFromYear:  1988,
  },
  {
    id: "chipforce_labs",
    name: "ChipForce Labs",
    country: "Taiwan",
    countryFlag: "🇹🇼",
    type: "hardware_lab",
    purchasePrice:    12_000_000,
    currentValuation: 12_000_000,
    monthlyRevenue:      300_000,
    monthlyExpense:      180_000,
    synergySummary: "+20% qualidade de hardware · -10% custo de produção de consoles",
    revenueBonus:        300_000,
    reputationBonus:     5,
    researchBonus:      10,
    availableFromYear:  1990,
  },
  {
    id: "silicon_delta",
    name: "Silicon Delta",
    country: "Coreia do Sul",
    countryFlag: "🇰🇷",
    type: "hardware_lab",
    purchasePrice:    25_000_000,
    currentValuation: 25_000_000,
    monthlyRevenue:      800_000,
    monthlyExpense:      400_000,
    synergySummary: "+35% qualidade de hardware · +2 slots extras de P&D",
    revenueBonus:        800_000,
    reputationBonus:    10,
    researchBonus:      15,
    availableFromYear:  1995,
  },
  {
    id: "hyperflux_studios",
    name: "HyperFlux Studios",
    country: "Canadá",
    countryFlag: "🇨🇦",
    type: "studio",
    purchasePrice:    18_000_000,
    currentValuation: 18_000_000,
    monthlyRevenue:      600_000,
    monthlyExpense:      300_000,
    synergySummary: "+20% receita em projetos AAA · +15 devs de elite",
    revenueBonus:        600_000,
    reputationBonus:     7,
    researchBonus:       8,
    availableFromYear:  1998,
  },
  {
    id: "cloudstream_tech",
    name: "CloudStream Technologies",
    country: "EUA",
    countryFlag: "🇺🇸",
    type: "studio",
    purchasePrice:    50_000_000,
    currentValuation: 50_000_000,
    monthlyRevenue:    2_000_000,
    monthlyExpense:      800_000,
    synergySummary: "Infraestrutura online global · +streaming reach worldwide",
    revenueBonus:      2_000_000,
    reputationBonus:    15,
    researchBonus:      20,
    availableFromYear:  2005,
  },

  // ── Investimentos Alternativos ──────────────────────────────────────────────
  {
    id: "stellar_pictures",
    name: "Stellar Pictures",
    country: "EUA",
    countryFlag: "🇺🇸",
    type: "movie_studio",
    purchasePrice:     9_000_000,
    currentValuation:  9_000_000,
    monthlyRevenue:      280_000,
    monthlyExpense:      140_000,
    synergySummary: "Adaptações de jogos para cinema · +12 rep · +8k fãs/mês",
    revenueBonus:        280_000,
    reputationBonus:    12,
    researchBonus:       0,
    availableFromYear:  1985,
  },
  {
    id: "nova_films",
    name: "Nova Films International",
    country: "França",
    countryFlag: "🇫🇷",
    type: "movie_studio",
    purchasePrice:    28_000_000,
    currentValuation: 28_000_000,
    monthlyRevenue:      950_000,
    monthlyExpense:      450_000,
    synergySummary: "Produções AAA de cinema · +20 rep · +25k fãs/mês",
    revenueBonus:        950_000,
    reputationBonus:    20,
    researchBonus:       0,
    availableFromYear:  1995,
  },
  {
    id: "fc_digital",
    name: "FC Digital FC",
    country: "Espanha",
    countryFlag: "🇪🇸",
    type: "sports_team",
    purchasePrice:     6_000_000,
    currentValuation:  6_000_000,
    monthlyRevenue:      180_000,
    monthlyExpense:       90_000,
    synergySummary: "Marketing desportivo global · +8 rep · +5k fãs/mês",
    revenueBonus:        180_000,
    reputationBonus:     8,
    researchBonus:       0,
    availableFromYear:  1980,
  },
  {
    id: "neon_hawks",
    name: "NeonHawks Basketball",
    country: "EUA",
    countryFlag: "🇺🇸",
    type: "sports_team",
    purchasePrice:    15_000_000,
    currentValuation: 15_000_000,
    monthlyRevenue:      500_000,
    monthlyExpense:      250_000,
    synergySummary: "Equipe NBA · Patrocínios + esports crossover · +15 rep",
    revenueBonus:        500_000,
    reputationBonus:    15,
    researchBonus:       0,
    availableFromYear:  1988,
  },
  {
    id: "cityplaza_mall",
    name: "CityPlaza Shopping",
    country: "Brasil",
    countryFlag: "🇧🇷",
    type: "shopping_center",
    purchasePrice:     7_500_000,
    currentValuation:  7_500_000,
    monthlyRevenue:      220_000,
    monthlyExpense:       80_000,
    synergySummary: "Retail físico · quiosques de gaming · receita passiva estável",
    revenueBonus:        220_000,
    reputationBonus:     4,
    researchBonus:       0,
    availableFromYear:  1983,
  },
  {
    id: "grandmall_tokyo",
    name: "GrandMall Tokyo",
    country: "Japão",
    countryFlag: "🇯🇵",
    type: "shopping_center",
    purchasePrice:    20_000_000,
    currentValuation: 20_000_000,
    monthlyRevenue:      700_000,
    monthlyExpense:      280_000,
    synergySummary: "Shopping premium japonês · lojas dedicadas + arcades · +6 rep",
    revenueBonus:        700_000,
    reputationBonus:     6,
    researchBonus:       0,
    availableFromYear:  1992,
  },
  {
    id: "nexus_events",
    name: "Nexus Events Co.",
    country: "Alemanha",
    countryFlag: "🇩🇪",
    type: "event_company",
    purchasePrice:     4_500_000,
    currentValuation:  4_500_000,
    monthlyRevenue:      140_000,
    monthlyExpense:       60_000,
    synergySummary: "Feiras e lançamentos globais · +8 rep · +3k fãs por evento",
    revenueBonus:        140_000,
    reputationBonus:     8,
    researchBonus:       0,
    availableFromYear:  1979,
  },
  {
    id: "worldstage_live",
    name: "WorldStage Live",
    country: "Reino Unido",
    countryFlag: "🇬🇧",
    type: "event_company",
    purchasePrice:    12_000_000,
    currentValuation: 12_000_000,
    monthlyRevenue:      400_000,
    monthlyExpense:      170_000,
    synergySummary: "Conferências mundiais de gaming · E3 alternativa · +15 rep",
    revenueBonus:        400_000,
    reputationBonus:    15,
    researchBonus:       0,
    availableFromYear:  1990,
  },
  {
    id: "vibe_records",
    name: "Vibe Records",
    country: "EUA",
    countryFlag: "🇺🇸",
    type: "music_label",
    purchasePrice:     5_000_000,
    currentValuation:  5_000_000,
    monthlyRevenue:      160_000,
    monthlyExpense:       70_000,
    synergySummary: "Trilhas sonoras exclusivas · +10% rating dos jogos · +5 rep",
    revenueBonus:        160_000,
    reputationBonus:     5,
    researchBonus:       2,
    availableFromYear:  1982,
  },
];

// ── Valuation formula ─────────────────────────────────────────────────────────

export type ValuationInput = {
  cash: number;
  monthlyRevenue: number;
  reputation: number;
  marketShare: number;
  activeConsoles: number;
  releasedGames: number;
  totalDebt: number;
  acquisitionsNetMonthly: number;
};

function getMarketMultiplier(rep: number, mktShare: number, monthlyRev: number): number {
  const repScore = rep / 100;
  const mktScore = mktShare / 100;
  const revScore = Math.min(1, monthlyRev / 10_000_000);
  const composite = repScore * 0.45 + mktScore * 0.30 + revScore * 0.25;
  if (composite >= 0.65) return 4.0;
  if (composite >= 0.45) return 2.5;
  if (composite >= 0.30) return 1.8;
  if (composite >= 0.18) return 1.2;
  return 0.8;
}

export function calculateCompanyValue(input: ValuationInput): number {
  const mult = getMarketMultiplier(input.reputation, input.marketShare, input.monthlyRevenue);
  const revenueValue = input.monthlyRevenue * 12 * mult;
  const brandValue   = input.reputation * 80_000;
  const consoleValue = input.activeConsoles * 500_000;
  const gameLibValue = input.releasedGames * 200_000;
  const acqValue     = input.acquisitionsNetMonthly * 24;
  const debtPenalty  = input.totalDebt * 1.2;
  const raw = input.cash * 0.9 + revenueValue + brandValue + consoleValue + gameLibValue + acqValue - debtPenalty;
  return Math.max(100_000, Math.round(raw));
}

export function calculateSharePrice(companyValue: number): number {
  return Math.round((companyValue / TOTAL_SHARES) * 100) / 100;
}

export function getMarketTier(companyValue: number): { label: string; color: string } {
  if (companyValue >= 1_000_000_000) return { label: "Mega Corporação",      color: "#F5A623" };
  if (companyValue >= 500_000_000)   return { label: "Grande Empresa",       color: "#A855F7" };
  if (companyValue >= 100_000_000)   return { label: "Empresa Consolidada",  color: "#4DA6FF" };
  if (companyValue >= 10_000_000)    return { label: "PME em Crescimento",   color: "#10B981" };
  return                                    { label: "Startup",               color: "#F5A623" };
}

// ── Stock listing bid generation ──────────────────────────────────────────────

/**
 * Generates a bid for an open stock listing.
 * Returns null if the listing is unattractive (price too high for the investor's appetite).
 */
export function generateStockBid(
  listing: StockListing,
  companyValue: number,
  year: number,
  month: number,
  isProfit: boolean,
): StockBid | null {
  const marketPrice = calculateSharePrice(companyValue);
  if (marketPrice <= 0) return null;

  const profile = INVESTOR_PROFILES[Math.floor(Math.random() * INVESTOR_PROFILES.length)];

  // Each personality has a different willingness-to-pay relative to market
  const premiumFactors: Record<InvestorPersonality, number> = {
    conservative:  isProfit ? 1.05 : 0.90,
    aggressive:    isProfit ? 1.25 : 1.00,
    visionary:     isProfit ? 1.35 : 1.10,
    opportunistic: isProfit ? 0.95 : 0.80,
    predatory:     0.75,
  };

  const bidPerShare = Math.round(marketPrice * premiumFactors[profile.personality] * (0.95 + Math.random() * 0.15));

  // Predatory investors bid below minimum ask — won't match
  if (bidPerShare < listing.minAskPerShare) return null;

  const sharesToBuy = Math.round((listing.percentForSale / 100) * TOTAL_SHARES);
  const totalOffer = bidPerShare * sharesToBuy;

  const conditions: Record<InvestorPersonality, string> = {
    conservative:  "Sem interferência operacional. Relatórios anuais.",
    aggressive:    "Exige 1 assento no conselho de administração.",
    visionary:     "Quer colaborar em P&D para tecnologias futuras.",
    opportunistic: "Reserva-se o direito de revender a qualquer momento.",
    predatory:     "Exige cláusula de compra preferencial futura.",
  };

  const expiresMonth = month >= 10 ? (month - 9) : (month + 3);
  const expiresYear  = month >= 10 ? year + 1 : year;

  return {
    id: `bid_${year}_${month}_${Math.random().toString(36).slice(2, 7)}`,
    investorName:  profile.name,
    country:       profile.country,
    countryFlag:   profile.flag,
    personality:   profile.personality,
    offerPerShare: bidPerShare,
    totalOffer,
    conditions:    conditions[profile.personality],
    expiresYear,
    expiresMonth,
  };
}

// ── Buyback premium (dynamic based on profitability) ──────────────────────────

/**
 * Returns the premium multiplier investors demand to sell shares back.
 * If the company is highly profitable, investors are reluctant and demand more.
 *   base: 15%
 *   profitable (positive cash flow): +10-20% extra
 *   monthly profit > $500K: +15% extra
 *   monthly profit > $2M: +25% extra
 */
export function getBuybackPremium(monthlyProfit: number): number {
  if (monthlyProfit <= 0) return 1.10; // distressed — investors eager to get out
  if (monthlyProfit < 100_000) return 1.20;
  if (monthlyProfit < 500_000) return 1.30;
  if (monthlyProfit < 2_000_000) return 1.45;
  return 1.60; // very profitable company — investors won't budge easily
}

// ── Geopolitical Conflict System ──────────────────────────────────────────────

export type ConflictLevel = "high" | "medium" | "low";

export type GeoConflictPair = {
  investorA: string;   // investor name
  investorB: string;
  countryA: string;
  countryB: string;
  flagA: string;
  flagB: string;
  level: ConflictLevel;
};

// Conflict matrix: keys are lowercase Portuguese country name pairs
// Covers the investor pool: EUA, China, Rússia, Japão, Índia, Reino Unido, Coreia do Sul, etc.
const CONFLICT_MATRIX: Record<string, ConflictLevel> = {
  "eua:china":              "high",   "china:eua":              "high",
  "eua:rússia":             "high",   "rússia:eua":             "high",
  "china:japão":            "medium", "japão:china":            "medium",
  "rússia:japão":           "medium", "japão:rússia":           "medium",
  "china:índia":            "medium", "índia:china":            "medium",
  "rússia:reino unido":     "medium", "reino unido:rússia":     "medium",
  "china:coreia do sul":    "low",    "coreia do sul:china":    "low",
  "eua:emirados árabes":    "low",    "emirados árabes:eua":    "low",
  "rússia:alemanha":        "medium", "alemanha:rússia":        "medium",
  "china:reino unido":      "medium", "reino unido:china":      "medium",
};

export function detectInvestorConflicts(investors: Investor[]): GeoConflictPair[] {
  const pairs: GeoConflictPair[] = [];
  for (let i = 0; i < investors.length; i++) {
    for (let j = i + 1; j < investors.length; j++) {
      const a = investors[i];
      const b = investors[j];
      const keyAB = `${a.country.toLowerCase()}:${b.country.toLowerCase()}`;
      const keyBA = `${b.country.toLowerCase()}:${a.country.toLowerCase()}`;
      const level = CONFLICT_MATRIX[keyAB] ?? CONFLICT_MATRIX[keyBA];
      if (level) {
        pairs.push({
          investorA: a.name, investorB: b.name,
          countryA: a.country, countryB: b.country,
          flagA: a.countryFlag, flagB: b.countryFlag,
          level,
        });
      }
    }
  }
  return pairs;
}

export function getMaxConflictLevel(pairs: GeoConflictPair[]): ConflictLevel | null {
  if (pairs.length === 0) return null;
  const order: Record<ConflictLevel, number> = { low: 1, medium: 2, high: 3 };
  return pairs.reduce<ConflictLevel>((max, p) => order[p.level] > order[max] ? p.level : max, "low");
}

export function getConflictNegotiationCost(level: ConflictLevel): number {
  return level === "high" ? 200_000 : level === "medium" ? 100_000 : 50_000;
}

// ── Offer generation ──────────────────────────────────────────────────────────

export function generateInvestorOffer(
  companyValue: number,
  playerSharePercent: number,
  year: number,
  month: number,
  isDistressed: boolean,
): InvestorOffer | null {
  if (playerSharePercent <= 15) return null;

  const profile = INVESTOR_PROFILES[Math.floor(Math.random() * INVESTOR_PROFILES.length)];

  let minPct = isDistressed ? 15 : 5;
  let maxPct = isDistressed ? 35 : 20;
  if (profile.personality === "aggressive" || profile.personality === "predatory") {
    minPct += 5; maxPct += 10;
  }

  const desiredPct = Math.min(
    playerSharePercent - 10,
    Math.round(minPct + Math.random() * (maxPct - minPct)),
  );
  if (desiredPct <= 0) return null;

  const sharePrice   = calculateSharePrice(companyValue);
  const sharesToBuy  = Math.round((desiredPct / 100) * TOTAL_SHARES);
  const baseOffer    = sharesToBuy * sharePrice;

  const premiums: Record<InvestorPersonality, number> = {
    conservative:  1.12,
    aggressive:    1.18,
    visionary:     1.30,
    opportunistic: 0.90,
    predatory:     isDistressed ? 0.55 : 0.75,
  };
  const offerAmount = Math.round(baseOffer * (isDistressed ? 0.70 : premiums[profile.personality]));

  const conditions: Record<InvestorPersonality, string> = {
    conservative:  "Exige relatórios trimestrais. Sem interferência operacional.",
    aggressive:    "Exige 1 assento no conselho de administração.",
    visionary:     "Quer colaborar em P&D para tecnologias futuras.",
    opportunistic: "Reserva-se o direito de vender em qualquer momento.",
    predatory:     "Exige direito de aquisição preferencial no futuro.",
  };

  const expiresMonth = month >= 10 ? (month - 9) : (month + 3);
  const expiresYear  = month >= 10 ? year + 1 : year;

  return {
    id:                  `offer_${year}_${month}_${Math.random().toString(36).slice(2, 7)}`,
    investorName:        profile.name,
    country:             profile.country,
    countryFlag:         profile.flag,
    personality:         profile.personality,
    offerAmount,
    desiredSharePercent: desiredPct,
    conditions:          conditions[profile.personality],
    expiresMonth,
    expiresYear,
    isDistressed,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SPONSORSHIP SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

export type SponsorshipCategory = "tournament" | "tech_expo" | "gaming_event" | "cultural_festival" | "global_launch" | "award_show";
export type SponsorshipScale    = "local" | "regional" | "national" | "global";

export type SponsorshipOpportunity = {
  id:           string;
  templateId:   string;
  title:        string;
  description:  string;
  category:     SponsorshipCategory;
  scale:        SponsorshipScale;
  icon:         string;
  maxProfitPct: number;   // max possible gain as fraction (e.g. 0.12 = +12%)
  maxLossPct:   number;   // max possible loss as fraction (e.g. 0.30 = -30%)
  maxInvestment: number;
  winChanceBase: number;
  availableYear:  number;
  availableMonth: number;
  expiresYear:    number;
  expiresMonth:   number;
};

export type SponsorshipTemplate = {
  id:            string;
  title:         string;
  description:   string;
  category:      SponsorshipCategory;
  scale:         SponsorshipScale;
  icon:          string;
  maxProfitPct:  number;
  maxLossPct:    number;
  maxInvestment: number;
  minYear:       number;
  winChanceBase: number;
};

export const SPONSORSHIP_TEMPLATES: SponsorshipTemplate[] = [
  { id: "sp_indie_festival",   title: "Festival de Jogos Indie",             description: "Festival local de indie games. Custo baixo, risco mínimo.",                            category: "gaming_event",      scale: "local",    icon: "play-circle", maxProfitPct: 0.04, maxLossPct: 0.04, maxInvestment:  1_500_000, minYear: 1975, winChanceBase: 0.65 },
  { id: "sp_local_tourney",    title: "Torneio Regional de Gaming",           description: "Campeonato local. Baixo risco, retorno modesto.",                                       category: "tournament",        scale: "local",    icon: "award",       maxProfitPct: 0.04, maxLossPct: 0.05, maxInvestment:  2_000_000, minYear: 1975, winChanceBase: 0.62 },
  { id: "sp_sports_league",    title: "Patrocínio de Liga Esportiva",         description: "Liga regional emergente. Resultado imprevisível.",                                       category: "tournament",        scale: "regional", icon: "activity",    maxProfitPct: 0.05, maxLossPct: 0.14, maxInvestment:  6_000_000, minYear: 1977, winChanceBase: 0.54 },
  { id: "sp_tech_expo_reg",    title: "Expo Tecnológica Regional",            description: "Exposição regional. Boa para networking e visibilidade.",                               category: "tech_expo",         scale: "regional", icon: "cpu",         maxProfitPct: 0.05, maxLossPct: 0.08, maxInvestment:  5_000_000, minYear: 1978, winChanceBase: 0.58 },
  { id: "sp_cultural_nat",     title: "Festival Cultural de Entretenimento",  description: "Festival nacional. Retorno variável com risco moderado.",                               category: "cultural_festival", scale: "national", icon: "music",       maxProfitPct: 0.06, maxLossPct: 0.10, maxInvestment:  8_000_000, minYear: 1979, winChanceBase: 0.57 },
  { id: "sp_gaming_national",  title: "Convenção Nacional de Games",          description: "Grande evento com ampla cobertura de imprensa.",                                         category: "gaming_event",      scale: "national", icon: "monitor",     maxProfitPct: 0.07, maxLossPct: 0.12, maxInvestment: 10_000_000, minYear: 1980, winChanceBase: 0.55 },
  { id: "sp_award_national",   title: "Cerimônia Nacional de Prêmios",        description: "Premiação nacional de games. Reputação em jogo.",                                        category: "award_show",        scale: "national", icon: "star",        maxProfitPct: 0.07, maxLossPct: 0.11, maxInvestment: 12_000_000, minYear: 1983, winChanceBase: 0.56 },
  { id: "sp_cultural_global",  title: "Festival Internacional de Cultura Digital", description: "Evento cultural global com foco em entretenimento digital.",                        category: "cultural_festival", scale: "global",   icon: "globe",       maxProfitPct: 0.08, maxLossPct: 0.16, maxInvestment: 20_000_000, minYear: 1985, winChanceBase: 0.52 },
  { id: "sp_global_award",     title: "Gala Internacional de Prêmios",        description: "Premiação global de games. Exposição máxima, risco elevado.",                            category: "award_show",        scale: "global",   icon: "award",       maxProfitPct: 0.09, maxLossPct: 0.22, maxInvestment: 40_000_000, minYear: 1988, winChanceBase: 0.49 },
  { id: "sp_global_launch",    title: "Lançamento Global de Produto Tech",    description: "Co-patrocínio de lançamento global. Alto risco, retorno alto.",                          category: "global_launch",     scale: "global",   icon: "zap",         maxProfitPct: 0.10, maxLossPct: 0.25, maxInvestment: 30_000_000, minYear: 1990, winChanceBase: 0.48 },
  { id: "sp_esports_world",    title: "Campeonato Mundial de Esports",        description: "Torneio mundial. Exposição massiva, risco considerável.",                                 category: "tournament",        scale: "global",   icon: "zap",         maxProfitPct: 0.10, maxLossPct: 0.21, maxInvestment: 25_000_000, minYear: 1992, winChanceBase: 0.50 },
  { id: "sp_tech_expo_global", title: "Expo Tecnológica Global",              description: "Mega exposição internacional. Visibilidade máxima, risco muito elevado.",                category: "tech_expo",         scale: "global",   icon: "cpu",         maxProfitPct: 0.12, maxLossPct: 0.30, maxInvestment: 50_000_000, minYear: 1995, winChanceBase: 0.45 },
];

export const SCALE_LABELS: Record<SponsorshipScale, string> = {
  local: "Local", regional: "Regional", national: "Nacional", global: "Global",
};
export const SCALE_COLORS: Record<SponsorshipScale, string> = {
  local: "#10B981", regional: "#4DA6FF", national: "#F5A623", global: "#C9943A",
};
export const CATEGORY_LABELS: Record<SponsorshipCategory, string> = {
  tournament:        "Torneio",
  tech_expo:         "Expo Tech",
  gaming_event:      "Evento Gaming",
  cultural_festival: "Festival",
  global_launch:     "Lançamento Global",
  award_show:        "Premiação",
};

// ── Acquisition resale info ────────────────────────────────────────────────────

export type AcquisitionResaleInfo = {
  salePrice:   number;
  gainLoss:    number;
  gainLossPct: number;
  isProfit:    boolean;
  verdict:     "great" | "ok" | "small_loss" | "big_loss";
};

/**
 * Computes dynamic resale price and gain/loss based on current valuation,
 * holding period, market strength, and acquisition type liquidity.
 */
export function computeAcquisitionResaleInfo(
  acq: { purchasePrice: number; currentValuation: number; type: string; purchasedYear: number; revenueBonus: number; monthlyExpense: number },
  currentYear: number,
  reputation: number,
  marketShare: number,
): AcquisitionResaleInfo {
  const yearsHeld = Math.max(0, currentYear - acq.purchasedYear);
  const liquidityFactor  = Math.max(0.78, Math.min(1.0, 0.82 + yearsHeld * 0.025));
  const marketPremium    = 1 + Math.max(-0.08, Math.min(0.12, (reputation - 50) / 600 + (marketShare - 15) / 400));
  const netMonthly       = acq.revenueBonus - acq.monthlyExpense;
  const incomePremium    = netMonthly > 0 ? Math.min(0.08, netMonthly / 2_000_000 * 0.05) : 0;
  const typeFactors: Record<string, number> = {
    sports_team: 0.83, movie_studio: 0.88, music_label: 0.90,
    event_company: 0.86, shopping_center: 0.93, studio: 0.91,
    hardware_lab: 0.89, publisher: 0.92, marketing_agency: 0.91,
  };
  const typeFactor = typeFactors[acq.type] ?? 0.88;
  const salePrice = Math.max(
    Math.round(acq.purchasePrice * 0.35),
    Math.round(acq.currentValuation * liquidityFactor * marketPremium * typeFactor * (1 + incomePremium)),
  );
  const gainLoss    = salePrice - acq.purchasePrice;
  const gainLossPct = gainLoss / acq.purchasePrice;
  const verdict: AcquisitionResaleInfo["verdict"] =
    gainLossPct >= 0.10 ? "great" :
    gainLossPct >= 0    ? "ok" :
    gainLossPct >= -0.20 ? "small_loss" : "big_loss";
  return { salePrice, gainLoss, gainLossPct, isProfit: gainLoss >= 0, verdict };
}

/**
 * Monthly valuation drift multiplier for each acquisition type.
 * Called once per month per owned acquisition.
 */
export function computeAcquisitionMonthlyMultiplier(
  acqType: string,
  reputation: number,
  marketShare: number,
): number {
  const repFactor = (reputation - 50) / 1200;
  const mktFactor = (marketShare - 20) / 2400;
  const r = Math.random();
  let drift = 0;
  switch (acqType) {
    case "sports_team":      drift = (r > 0.50 ? 1 : -1) * Math.random() * 0.07  + repFactor * 1.5; break;
    case "movie_studio":     drift = (r > 0.46 ? 1 : -1) * Math.random() * 0.05  + repFactor;       break;
    case "shopping_center":  drift = 0.001 + (r > 0.42 ? 1 : -1) * Math.random() * 0.013;           break;
    case "event_company":    drift = (r > 0.46 ? 1 : -1) * Math.random() * 0.022 + repFactor * 0.5; break;
    case "hardware_lab":     drift = 0.002 + (r > 0.42 ? 1 : -1) * Math.random() * 0.018;           break;
    case "studio":           drift = (r > 0.46 ? 1 : -1) * Math.random() * 0.032 + repFactor * 1.5 + mktFactor; break;
    case "publisher":        drift = (r > 0.46 ? 1 : -1) * Math.random() * 0.028 + repFactor + mktFactor * 0.5; break;
    case "marketing_agency": drift = (r > 0.46 ? 1 : -1) * Math.random() * 0.022 + mktFactor * 2;   break;
    case "music_label":      drift = (r > 0.46 ? 1 : -1) * Math.random() * 0.022 + repFactor * 1.8; break;
    default:                 drift = (r > 0.50 ? 1 : -1) * Math.random() * 0.018;
  }
  return 1 + Math.max(-0.10, Math.min(0.10, drift));
}

/**
 * Generate a new sponsorship opportunity from the template pool.
 * Only templates unlocked for `year` are considered.
 */
export function generateSponsorshipOpportunity(
  year: number,
  month: number,
  existingIds: string[],
): SponsorshipOpportunity | null {
  const eligible = SPONSORSHIP_TEMPLATES.filter((t) => t.minYear <= year);
  if (eligible.length === 0) return null;
  const tpl = eligible[Math.floor(Math.random() * eligible.length)];
  // Expiry: 8 months from now
  const totalMonths = month + 8 - 1;
  const expiresYear  = year + Math.floor(totalMonths / 12);
  const expiresMonth = (totalMonths % 12) + 1;
  const id = `spons_${tpl.id}_${year}_${month}`;
  if (existingIds.includes(id)) return null;
  return {
    id,
    templateId:   tpl.id,
    title:        tpl.title,
    description:  tpl.description,
    category:     tpl.category,
    scale:        tpl.scale,
    icon:         tpl.icon,
    maxProfitPct: tpl.maxProfitPct,
    maxLossPct:   tpl.maxLossPct,
    maxInvestment: tpl.maxInvestment,
    winChanceBase: tpl.winChanceBase,
    availableYear:  year,
    availableMonth: month,
    expiresYear,
    expiresMonth,
  };
}
