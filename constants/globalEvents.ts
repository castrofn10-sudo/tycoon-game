// ── Global Economic Events ─────────────────────────────────────────────────
// Decade-based rare events that apply small temporary modifiers.
// Max effect ±3%. ONE active event at a time. No permanent effects.

export type GlobalEventEffect = {
  researchSpeed?:       number;
  marketingEfficiency?: number;
  productQuality?:      number;
  sales?:               number;
  income?:              number;
};

export type GlobalEvent = {
  id:             string;
  decade:         string;
  type:           "positive" | "negative";
  label:          string;
  newsHeadline:   string;
  effect:         GlobalEventEffect;
  durationMonths: number;
};

export function getDecade(year: number): string {
  if (year < 1990) return "80s";
  if (year < 2000) return "90s";
  if (year < 2010) return "2000s";
  if (year < 2020) return "2010s";
  return "2020s";
}

export const GLOBAL_EVENTS: GlobalEvent[] = [
  {
    id:             "tech_boom_90s",
    decade:         "90s",
    type:           "positive",
    label:          "Tech Boom dos Anos 90",
    newsHeadline:   "📈 Boom tecnológico acelera inovação no setor",
    effect:         { researchSpeed: 0.02, marketingEfficiency: 0.01 },
    durationMonths: 24,
  },
  {
    id:             "dotcom_crash",
    decade:         "2000s",
    type:           "negative",
    label:          "Crise das Ponto-com",
    newsHeadline:   "📉 Bolha das ponto-com estoura — mercado em turbulência",
    effect:         { marketingEfficiency: -0.02, sales: -0.015 },
    durationMonths: 18,
  },
  {
    id:             "financial_crisis",
    decade:         "2000s",
    type:           "negative",
    label:          "Crise Financeira Global",
    newsHeadline:   "⚠️ Crise financeira global impacta receitas do setor",
    effect:         { income: -0.03 },
    durationMonths: 12,
  },
  {
    id:             "nextgen_console_wave",
    decade:         "2010s",
    type:           "positive",
    label:          "Onda de Consoles Next-Gen",
    newsHeadline:   "🚀 Nova geração de consoles impulsiona vendas globais",
    effect:         { productQuality: 0.015, sales: 0.02 },
    durationMonths: 12,
  },
  {
    id:             "gaming_renaissance_80s",
    decade:         "80s",
    type:           "positive",
    label:          "Renascimento dos Games",
    newsHeadline:   "📈 Mercado de videogames explode — demanda em alta",
    effect:         { sales: 0.025, productQuality: 0.01 },
    durationMonths: 18,
  },
  {
    id:             "recession_2010s",
    decade:         "2010s",
    type:           "negative",
    label:          "Recessão Econômica",
    newsHeadline:   "📉 Recessão pressiona consumidores — vendas desaceleram",
    effect:         { income: -0.02, sales: -0.015 },
    durationMonths: 14,
  },
  {
    id:             "digital_revolution_2020s",
    decade:         "2020s",
    type:           "positive",
    label:          "Revolução Digital",
    newsHeadline:   "🚀 Revolução digital eleva padrões de qualidade e alcance",
    effect:         { researchSpeed: 0.025, marketingEfficiency: 0.02 },
    durationMonths: 20,
  },
  {
    id:             "supply_chain_crisis_2020s",
    decade:         "2020s",
    type:           "negative",
    label:          "Crise de Cadeia de Suprimentos",
    newsHeadline:   "⚠️ Crise de suprimentos eleva custos de produção",
    effect:         { income: -0.025, sales: -0.01 },
    durationMonths: 16,
  },
];
