// ─────────────────────────────────────────────────────────────────────────────
// ERA UPGRADE SYSTEM — Dynamic non-linear upgrade pool
// 48 upgrades across 8 eras × 6 categories
// When player unlocks one upgrade, 2-3 random related ones become available.
// ─────────────────────────────────────────────────────────────────────────────

export type EraUpgradeCategory =
  | "tech"
  | "marketing"
  | "production"
  | "innovation"
  | "quality"
  | "business";

export type EraId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type StratPath = "tech" | "marketing" | "production";

export type EraUpgradeBonus = {
  ratingBonus?: number;
  salesMult?: number;
  costMult?: number;
  campaignMult?: number;
  repBonus?: number;
  fansBonus?: number;
  riskMod?: number;
  gameRevMult?: number;
  devSpeedMult?: number;
};

export type EraUpgrade = {
  id: string;
  name: string;
  description: string;
  category: EraUpgradeCategory;
  era: EraId;
  minYear: number;
  cost: number;
  effectLabel: string;
  bonus: EraUpgradeBonus;
  connections: string[];
  stratPath: StratPath;
};

export const ERA_NAMES: Record<EraId, string> = {
  1: "Pioneiros",
  2: "Arcade",
  3: "8-Bit",
  4: "16-Bit",
  5: "3D Revolution",
  6: "Era HD",
  7: "Digital",
  8: "NextGen",
};

export const ERA_MIN_YEARS: Record<EraId, number> = {
  1: 1972, 2: 1980, 3: 1986, 4: 1992,
  5: 1998, 6: 2005, 7: 2013, 8: 2020,
};

export const ERA_UPGRADE_CATEGORY_LIST: EraUpgradeCategory[] = [
  "tech", "marketing", "production", "innovation", "quality", "business",
];

export const ERA_CATEGORY_COLORS: Record<EraUpgradeCategory, string> = {
  tech: "#4DA6FF",
  marketing: "#F5A623",
  production: "#10B981",
  innovation: "#A855F7",
  quality: "#FF4D6A",
  business: "#22D3EE",
};

export const ERA_CATEGORY_ICONS: Record<EraUpgradeCategory, string> = {
  tech: "cpu",
  marketing: "megaphone",
  production: "tool",
  innovation: "zap",
  quality: "shield",
  business: "briefcase",
};

export const ERA_CATEGORY_NAMES: Record<EraUpgradeCategory, string> = {
  tech: "Tecnologia",
  marketing: "Marketing",
  production: "Produção",
  innovation: "Inovação",
  quality: "Qualidade",
  business: "Negócios",
};

const ADJACENT_CATEGORIES: Record<EraUpgradeCategory, EraUpgradeCategory[]> = {
  tech: ["innovation", "quality", "production"],
  marketing: ["business", "innovation"],
  production: ["business", "quality", "tech"],
  innovation: ["tech", "marketing", "quality"],
  quality: ["production", "tech", "innovation"],
  business: ["marketing", "production"],
};

export const ERA_UPGRADES: EraUpgrade[] = [
  // ── ERA 1: Pioneiros (1972-1979) ──────────────────────────────────────────
  {
    id: "eu1_tech", name: "Arquitetura 8-Bit", era: 1, minYear: 1972, category: "tech",
    description: "Estrutura de processamento inicial que define a confiabilidade técnica do hardware pioneiro.",
    effectLabel: "+0.10 rating, -2% custo operacional", cost: 40_000, stratPath: "tech",
    bonus: { ratingBonus: 0.10, costMult: 0.98 },
    connections: ["eu1_innov", "eu1_qual", "eu2_tech", "eu2_prod"],
  },
  {
    id: "eu1_mkt", name: "Publicidade Boca a Boca", era: 1, minYear: 1972, category: "marketing",
    description: "Estratégia de crescimento orgânico baseada em recomendações espontâneas dos primeiros adotantes.",
    effectLabel: "+2% vendas, +150 fãs iniciais", cost: 25_000, stratPath: "marketing",
    bonus: { salesMult: 1.02, fansBonus: 150 },
    connections: ["eu1_biz", "eu1_innov", "eu2_mkt", "eu2_biz"],
  },
  {
    id: "eu1_prod", name: "Montagem Manual", era: 1, minYear: 1972, category: "production",
    description: "Processo artesanal controlado que melhora a consistência e reduz falhas na montagem.",
    effectLabel: "-2% custo, -3% risco operacional", cost: 30_000, stratPath: "production",
    bonus: { costMult: 0.98, riskMod: 0.97 },
    connections: ["eu1_qual", "eu1_biz", "eu2_prod", "eu2_qual"],
  },
  {
    id: "eu1_innov", name: "Arte em Pixels", era: 1, minYear: 1972, category: "innovation",
    description: "Refinamento visual que estabelece identidade estética diferenciada para o produto.",
    effectLabel: "+0.08 rating, +100 fãs", cost: 35_000, stratPath: "tech",
    bonus: { ratingBonus: 0.08, fansBonus: 100 },
    connections: ["eu1_tech", "eu1_mkt", "eu2_innov", "eu2_tech"],
  },
  {
    id: "eu1_qual", name: "Testes Manuais Básicos", era: 1, minYear: 1972, category: "quality",
    description: "Verificação manual sistemática que reduz erros críticos e consolida a reputação inicial.",
    effectLabel: "+1 reputação, -3% risco de falhas", cost: 20_000, stratPath: "production",
    bonus: { repBonus: 1, riskMod: 0.97 },
    connections: ["eu1_prod", "eu1_tech", "eu2_qual", "eu2_tech"],
  },
  {
    id: "eu1_biz", name: "Lojas Locais", era: 1, minYear: 1972, category: "business",
    description: "Canal de distribuição inicial que estabelece presença física no mercado consumidor.",
    effectLabel: "+2% vendas, presença local consolidada", cost: 30_000, stratPath: "marketing",
    bonus: { salesMult: 1.02 },
    connections: ["eu1_mkt", "eu1_prod", "eu2_biz", "eu2_mkt"],
  },

  // ── ERA 2: Arcade (1980-1985) ─────────────────────────────────────────────
  {
    id: "eu2_tech", name: "Chips Arcade", era: 2, minYear: 1980, category: "tech",
    description: "Adaptação de chips de arcade ao contexto doméstico, melhorando performance com margem de custo controlada.",
    effectLabel: "+0.14 rating, +2% custo de componentes", cost: 100_000, stratPath: "tech",
    bonus: { ratingBonus: 0.14, costMult: 1.02 },
    connections: ["eu2_innov", "eu2_qual", "eu3_tech", "eu2_prod"],
  },
  {
    id: "eu2_mkt", name: "Anúncios na TV", era: 2, minYear: 1980, category: "marketing",
    description: "Campanhas televisivas que ampliam o reconhecimento da marca junto ao público familiar.",
    effectLabel: "+3% vendas, +300 fãs", cost: 80_000, stratPath: "marketing",
    bonus: { salesMult: 1.03, fansBonus: 300 },
    connections: ["eu2_biz", "eu2_innov", "eu3_mkt", "eu2_qual"],
  },
  {
    id: "eu2_prod", name: "Linha de Produção", era: 2, minYear: 1980, category: "production",
    description: "Padronização do processo produtivo que reduz desperdício e aumenta previsibilidade de custos.",
    effectLabel: "-3% custo de produção", cost: 90_000, stratPath: "production",
    bonus: { costMult: 0.97 },
    connections: ["eu2_qual", "eu2_biz", "eu3_prod", "eu2_tech"],
  },
  {
    id: "eu2_innov", name: "Scrolling Lateral", era: 2, minYear: 1980, category: "innovation",
    description: "Técnica de scrolling que expande o leque de mecânicas de jogo disponíveis.",
    effectLabel: "+0.14 rating, +3% receita de jogos", cost: 70_000, stratPath: "tech",
    bonus: { ratingBonus: 0.14, gameRevMult: 1.03 },
    connections: ["eu2_tech", "eu2_mkt", "eu3_innov", "eu2_qual"],
  },
  {
    id: "eu2_qual", name: "Playtesting Formal", era: 2, minYear: 1980, category: "quality",
    description: "Sessões de teste com utilizadores reais que identificam problemas antes do lançamento.",
    effectLabel: "+2 reputação, -4% risco de falhas", cost: 60_000, stratPath: "production",
    bonus: { repBonus: 2, riskMod: 0.96 },
    connections: ["eu2_prod", "eu2_tech", "eu3_qual", "eu2_innov"],
  },
  {
    id: "eu2_biz", name: "Redes de Varejo", era: 2, minYear: 1980, category: "business",
    description: "Acordos com redes varejistas que garantem distribuição sistemática e prateleira assegurada.",
    effectLabel: "+3% vendas, alcance nacional inicial", cost: 100_000, stratPath: "marketing",
    bonus: { salesMult: 1.03 },
    connections: ["eu2_mkt", "eu2_prod", "eu3_biz", "eu3_mkt"],
  },

  // ── ERA 3: 8-Bit (1986-1991) ──────────────────────────────────────────────
  {
    id: "eu3_tech", name: "CPU Z80 Melhorado", era: 3, minYear: 1986, category: "tech",
    description: "Otimização do processador principal que melhora fluidez e reduz custos de fabricação a médio prazo.",
    effectLabel: "+0.18 rating, -3% custo técnico", cost: 180_000, stratPath: "tech",
    bonus: { ratingBonus: 0.18, costMult: 0.97 },
    connections: ["eu3_innov", "eu3_qual", "eu4_tech", "eu3_prod"],
  },
  {
    id: "eu3_mkt", name: "Licenciamento de Marcas", era: 3, minYear: 1986, category: "marketing",
    description: "Acordos de licenciamento com propriedades de terceiros que ampliam o apelo comercial do catálogo.",
    effectLabel: "+4% vendas, +400 fãs via licença", cost: 150_000, stratPath: "marketing",
    bonus: { salesMult: 1.04, fansBonus: 400 },
    connections: ["eu3_biz", "eu3_innov", "eu4_mkt", "eu3_qual"],
  },
  {
    id: "eu3_prod", name: "Fornecedores Internacionais", era: 3, minYear: 1986, category: "production",
    description: "Parcerias com fornecedores de componentes que otimizam a cadeia de abastecimento.",
    effectLabel: "-4% custo de produção", cost: 160_000, stratPath: "production",
    bonus: { costMult: 0.96 },
    connections: ["eu3_qual", "eu3_biz", "eu4_prod", "eu3_tech"],
  },
  {
    id: "eu3_innov", name: "Áudio FM Sintético", era: 3, minYear: 1986, category: "innovation",
    description: "Tecnologia de síntese de áudio que melhora a qualidade sonora e o apelo dos títulos.",
    effectLabel: "+0.16 rating, +2 rep, +3% receita de jogos", cost: 120_000, stratPath: "tech",
    bonus: { ratingBonus: 0.16, repBonus: 2, gameRevMult: 1.03 },
    connections: ["eu3_tech", "eu3_mkt", "eu4_innov", "eu3_qual"],
  },
  {
    id: "eu3_qual", name: "QA Estruturado", era: 3, minYear: 1986, category: "quality",
    description: "Processos formais de controlo de qualidade que reduzem incidências e consolidam credibilidade.",
    effectLabel: "+2 reputação, -5% risco de defeitos", cost: 130_000, stratPath: "production",
    bonus: { repBonus: 2, riskMod: 0.95 },
    connections: ["eu3_prod", "eu3_tech", "eu4_qual", "eu3_innov"],
  },
  {
    id: "eu3_biz", name: "Distribuição Nacional", era: 3, minYear: 1986, category: "business",
    description: "Infraestrutura logística que cobre o mercado nacional e melhora a presença de software.",
    effectLabel: "+4% vendas, +3% receita de software", cost: 200_000, stratPath: "marketing",
    bonus: { salesMult: 1.04, gameRevMult: 1.03 },
    connections: ["eu3_mkt", "eu3_prod", "eu4_biz", "eu4_mkt"],
  },

  // ── ERA 4: 16-Bit (1992-1997) ─────────────────────────────────────────────
  {
    id: "eu4_tech", name: "CPU 16-Bit Dual Core", era: 4, minYear: 1992, category: "tech",
    description: "Arquitetura dual-core 16-bit que eleva a capacidade de processamento com impacto controlado nos custos.",
    effectLabel: "+0.22 rating, +3% custo de componentes", cost: 350_000, stratPath: "tech",
    bonus: { ratingBonus: 0.22, costMult: 1.03 },
    connections: ["eu4_innov", "eu4_qual", "eu5_tech", "eu4_prod"],
  },
  {
    id: "eu4_mkt", name: "Console Wars Marketing", era: 4, minYear: 1992, category: "marketing",
    description: "Posicionamento competitivo direto que aumenta a visibilidade e diferencia a proposta de valor.",
    effectLabel: "+4% vendas, +700 fãs, +3% eficiência campanha", cost: 280_000, stratPath: "marketing",
    bonus: { salesMult: 1.04, fansBonus: 700, campaignMult: 1.03 },
    connections: ["eu4_biz", "eu4_innov", "eu5_mkt", "eu4_qual"],
  },
  {
    id: "eu4_prod", name: "Otimização de Custos", era: 4, minYear: 1992, category: "production",
    description: "Revisão sistemática da cadeia de suprimentos que elimina ineficiências acumuladas.",
    effectLabel: "-4% custo total de produção", cost: 300_000, stratPath: "production",
    bonus: { costMult: 0.96 },
    connections: ["eu4_qual", "eu4_biz", "eu5_prod", "eu4_tech"],
  },
  {
    id: "eu4_innov", name: "Gráficos Pré-renderizados", era: 4, minYear: 1992, category: "innovation",
    description: "Técnica de pré-renderização que eleva a qualidade visual percebida e fortalece o apelo dos títulos.",
    effectLabel: "+0.22 rating, +4% receita jogos, +600 fãs", cost: 250_000, stratPath: "tech",
    bonus: { ratingBonus: 0.22, gameRevMult: 1.04, fansBonus: 600 },
    connections: ["eu4_tech", "eu4_mkt", "eu5_innov", "eu4_qual"],
  },
  {
    id: "eu4_qual", name: "Beta Testing Externo", era: 4, minYear: 1992, category: "quality",
    description: "Programa de testes externos que antecipa problemas e fortalece a percepção de qualidade.",
    effectLabel: "+3 rep, -5% risco de falhas, +2% vendas", cost: 220_000, stratPath: "production",
    bonus: { repBonus: 3, riskMod: 0.95, salesMult: 1.02 },
    connections: ["eu4_prod", "eu4_tech", "eu5_qual", "eu4_innov"],
  },
  {
    id: "eu4_biz", name: "Parcerias com Publishers", era: 4, minYear: 1992, category: "business",
    description: "Acordos com editoras de terceiros que enriquecem o catálogo e ampliam o alcance comercial.",
    effectLabel: "+4% receita jogos, +4% vendas", cost: 400_000, stratPath: "marketing",
    bonus: { gameRevMult: 1.04, salesMult: 1.04 },
    connections: ["eu4_mkt", "eu4_prod", "eu5_biz", "eu5_mkt"],
  },

  // ── ERA 5: 3D Revolution (1998-2004) ──────────────────────────────────────
  {
    id: "eu5_tech", name: "GPU 3D Dedicada", era: 5, minYear: 1998, category: "tech",
    description: "Chip gráfico especializado em renderização 3D que eleva significativamente a qualidade técnica.",
    effectLabel: "+0.28 rating, +3% custo de hardware", cost: 700_000, stratPath: "tech",
    bonus: { ratingBonus: 0.28, costMult: 1.03 },
    connections: ["eu5_innov", "eu5_qual", "eu6_tech", "eu5_prod"],
  },
  {
    id: "eu5_mkt", name: "Marketing Digital Básico", era: 5, minYear: 1998, category: "marketing",
    description: "Presença digital estruturada que melhora a eficiência das campanhas e alcança públicos online.",
    effectLabel: "+5% eficiência campanha, +1000 fãs", cost: 500_000, stratPath: "marketing",
    bonus: { campaignMult: 1.05, fansBonus: 1000 },
    connections: ["eu5_biz", "eu5_innov", "eu6_mkt", "eu5_qual"],
  },
  {
    id: "eu5_prod", name: "Integração Vertical", era: 5, minYear: 1998, category: "production",
    description: "Controlo ampliado da cadeia produtiva que reduz dependências e melhora as margens operacionais.",
    effectLabel: "-4% custo, +3% margem operacional", cost: 800_000, stratPath: "production",
    bonus: { costMult: 0.96, salesMult: 1.03 },
    connections: ["eu5_qual", "eu5_biz", "eu6_prod", "eu5_tech"],
  },
  {
    id: "eu5_innov", name: "Mundos 3D Abertos", era: 5, minYear: 1998, category: "innovation",
    description: "Ambientes tridimensionais exploráveis que redefinem as expectativas de design e alargam o mercado.",
    effectLabel: "+0.28 rating, +5% receita jogos, +1500 fãs", cost: 600_000, stratPath: "tech",
    bonus: { ratingBonus: 0.28, gameRevMult: 1.05, fansBonus: 1500 },
    connections: ["eu5_tech", "eu5_mkt", "eu6_innov", "eu5_qual"],
  },
  {
    id: "eu5_qual", name: "QA Automatizado", era: 5, minYear: 1998, category: "quality",
    description: "Automação de testes de regressão que aumenta a cobertura e liberta recursos para desenvolvimento.",
    effectLabel: "+4 rep, -6% risco, +3% velocidade dev", cost: 550_000, stratPath: "production",
    bonus: { repBonus: 4, riskMod: 0.94, devSpeedMult: 1.03 },
    connections: ["eu5_prod", "eu5_tech", "eu6_qual", "eu5_innov"],
  },
  {
    id: "eu5_biz", name: "Loja Online Própria", era: 5, minYear: 1998, category: "business",
    description: "Canal de venda direta que elimina intermediários e melhora as margens em software.",
    effectLabel: "+5% receita jogos, +4% vendas diretas", cost: 650_000, stratPath: "marketing",
    bonus: { gameRevMult: 1.05, salesMult: 1.04 },
    connections: ["eu5_mkt", "eu5_prod", "eu6_biz", "eu6_mkt"],
  },

  // ── ERA 6: HD Era (2005-2012) ─────────────────────────────────────────────
  {
    id: "eu6_tech", name: "GPU de Alta Definição", era: 6, minYear: 2005, category: "tech",
    description: "Capacidade gráfica de alta definição que reposiciona o produto no segmento premium.",
    effectLabel: "+0.30 rating, +4% custo de produção", cost: 1_200_000, stratPath: "tech",
    bonus: { ratingBonus: 0.30, costMult: 1.04 },
    connections: ["eu6_innov", "eu6_qual", "eu7_tech", "eu6_prod"],
  },
  {
    id: "eu6_mkt", name: "Marketing Viral Online", era: 6, minYear: 2005, category: "marketing",
    description: "Estratégia de conteúdo digital que potencia a distribuição orgânica e o engajamento de comunidade.",
    effectLabel: "+6% eficiência campanha, +2000 fãs", cost: 900_000, stratPath: "marketing",
    bonus: { campaignMult: 1.06, fansBonus: 2000 },
    connections: ["eu6_biz", "eu6_innov", "eu7_mkt", "eu6_qual"],
  },
  {
    id: "eu6_prod", name: "Manufatura Just-in-Time", era: 6, minYear: 2005, category: "production",
    description: "Alinhamento da produção com a procura real, reduzindo inventário excedente e perdas operacionais.",
    effectLabel: "-5% custo, -6% risco operacional", cost: 1_000_000, stratPath: "production",
    bonus: { costMult: 0.95, riskMod: 0.94 },
    connections: ["eu6_qual", "eu6_biz", "eu7_prod", "eu6_tech"],
  },
  {
    id: "eu6_innov", name: "Controles por Movimento", era: 6, minYear: 2005, category: "innovation",
    description: "Interface física inovadora que cria proposta de valor diferenciada e expande o público-alvo.",
    effectLabel: "+0.30 rating, +2500 fãs, +5% vendas", cost: 800_000, stratPath: "tech",
    bonus: { ratingBonus: 0.30, fansBonus: 2500, salesMult: 1.05 },
    connections: ["eu6_tech", "eu6_mkt", "eu7_innov", "eu6_qual"],
  },
  {
    id: "eu6_qual", name: "Certificação Internacional", era: 6, minYear: 2005, category: "quality",
    description: "Conformidade com padrões internacionais que abre novos mercados e reforça a credibilidade.",
    effectLabel: "+5 reputação, +4% alcance de mercado", cost: 750_000, stratPath: "production",
    bonus: { repBonus: 5, salesMult: 1.04 },
    connections: ["eu6_prod", "eu6_tech", "eu7_qual", "eu6_innov"],
  },
  {
    id: "eu6_biz", name: "Modelo DLC e Add-ons", era: 6, minYear: 2005, category: "business",
    description: "Modelo de conteúdo pós-lançamento que cria receita recorrente e mantém a base ativa.",
    effectLabel: "+6% receita jogos, +4% margem operacional", cost: 1_000_000, stratPath: "marketing",
    bonus: { gameRevMult: 1.06, salesMult: 1.04 },
    connections: ["eu6_mkt", "eu6_prod", "eu7_biz", "eu7_mkt"],
  },

  // ── ERA 7: Digital (2013-2019) ────────────────────────────────────────────
  {
    id: "eu7_tech", name: "Cloud Computing", era: 7, minYear: 2013, category: "tech",
    description: "Infraestrutura em nuvem que escala com a procura e reduz custos operacionais fixos.",
    effectLabel: "+0.30 rating, -6% custo operacional", cost: 2_000_000, stratPath: "tech",
    bonus: { ratingBonus: 0.30, costMult: 0.94 },
    connections: ["eu7_innov", "eu7_qual", "eu8_tech", "eu7_prod"],
  },
  {
    id: "eu7_mkt", name: "Marketing de Influencers", era: 7, minYear: 2013, category: "marketing",
    description: "Parcerias com criadores de conteúdo que ampliam o alcance orgânico e geram conversão qualificada.",
    effectLabel: "+7% eficiência campanha, +3000 fãs, +4% vendas", cost: 1_500_000, stratPath: "marketing",
    bonus: { campaignMult: 1.07, fansBonus: 3000, salesMult: 1.04 },
    connections: ["eu7_biz", "eu7_innov", "eu8_mkt", "eu7_qual"],
  },
  {
    id: "eu7_prod", name: "Manufatura Sustentável", era: 7, minYear: 2013, category: "production",
    description: "Processos de produção mais eficientes em recursos que reduzem custos e melhoram a percepção de marca.",
    effectLabel: "-6% custo, +4 reputação", cost: 1_800_000, stratPath: "production",
    bonus: { costMult: 0.94, repBonus: 4 },
    connections: ["eu7_qual", "eu7_biz", "eu8_prod", "eu7_tech"],
  },
  {
    id: "eu7_innov", name: "Realidade Virtual", era: 7, minYear: 2013, category: "innovation",
    description: "Plataforma de realidade virtual que posiciona o produto numa categoria emergente de alto crescimento.",
    effectLabel: "+0.32 rating, +3500 fãs, +7% receita jogos", cost: 1_500_000, stratPath: "tech",
    bonus: { ratingBonus: 0.32, fansBonus: 3500, gameRevMult: 1.07 },
    connections: ["eu7_tech", "eu7_mkt", "eu8_innov", "eu7_qual"],
  },
  {
    id: "eu7_qual", name: "Telemetria de Bugs", era: 7, minYear: 2013, category: "quality",
    description: "Sistema de telemetria que detecta e prioriza falhas em produção, acelerando a resolução.",
    effectLabel: "+5 rep, -8% risco, +2% vendas", cost: 1_200_000, stratPath: "production",
    bonus: { repBonus: 5, riskMod: 0.92, salesMult: 1.02 },
    connections: ["eu7_prod", "eu7_tech", "eu8_qual", "eu7_innov"],
  },
  {
    id: "eu7_biz", name: "Serviço de Assinatura", era: 7, minYear: 2013, category: "business",
    description: "Modelo de assinatura que transforma vendas unitárias em receita recorrente previsível.",
    effectLabel: "+7% receita jogos, +4000 fãs, +5% vendas", cost: 2_500_000, stratPath: "marketing",
    bonus: { gameRevMult: 1.07, fansBonus: 4000, salesMult: 1.05 },
    connections: ["eu7_mkt", "eu7_prod", "eu8_biz", "eu8_mkt"],
  },

  // ── ERA 8: NextGen (2020+) ────────────────────────────────────────────────
  {
    id: "eu8_tech", name: "IA Neural para Jogos", era: 8, minYear: 2020, category: "tech",
    description: "Sistemas de inteligência artificial que personalizam conteúdo e melhoram a qualidade percebida.",
    effectLabel: "+0.35 rating, +5000 fãs, +8% receita jogos", cost: 5_000_000, stratPath: "tech",
    bonus: { ratingBonus: 0.35, fansBonus: 5000, gameRevMult: 1.08 },
    connections: ["eu8_innov", "eu8_qual", "eu8_prod"],
  },
  {
    id: "eu8_mkt", name: "Marketing Imersivo", era: 8, minYear: 2020, category: "marketing",
    description: "Experiências de marketing interativo que criam ligação emocional com o produto e aumentam a conversão.",
    effectLabel: "+8% eficiência campanha, +6000 fãs, +6% vendas", cost: 4_000_000, stratPath: "marketing",
    bonus: { campaignMult: 1.08, fansBonus: 6000, salesMult: 1.06 },
    connections: ["eu8_biz", "eu8_innov"],
  },
  {
    id: "eu8_prod", name: "Automação Avançada", era: 8, minYear: 2020, category: "production",
    description: "Automação de processos que reduz custos variáveis e melhora a cadência de desenvolvimento.",
    effectLabel: "-7% custo total, +6% velocidade dev", cost: 6_000_000, stratPath: "production",
    bonus: { costMult: 0.93, devSpeedMult: 1.06 },
    connections: ["eu8_qual", "eu8_biz", "eu8_tech"],
  },
  {
    id: "eu8_innov", name: "Realidade Estendida (XR)", era: 8, minYear: 2020, category: "innovation",
    description: "Plataforma de realidade estendida que redefine a experiência de produto e abre novos segmentos.",
    effectLabel: "+0.35 rating, +7000 fãs, +7% vendas, +8% jogos", cost: 7_000_000, stratPath: "tech",
    bonus: { ratingBonus: 0.35, fansBonus: 7000, salesMult: 1.07, gameRevMult: 1.08 },
    connections: ["eu8_tech", "eu8_mkt", "eu8_qual"],
  },
  {
    id: "eu8_qual", name: "IA para QA", era: 8, minYear: 2020, category: "quality",
    description: "Inteligência artificial aplicada ao controlo de qualidade que detecta e categoriza problemas sistematicamente.",
    effectLabel: "+7 reputação, -8% risco, +4% vendas", cost: 4_500_000, stratPath: "production",
    bonus: { repBonus: 7, riskMod: 0.92, salesMult: 1.04 },
    connections: ["eu8_prod", "eu8_tech", "eu8_innov"],
  },
  {
    id: "eu8_biz", name: "Ecossistema Digital Integrado", era: 8, minYear: 2020, category: "business",
    description: "Plataforma integrada que centraliza distribuição, comunidade e receita digital num único ecossistema.",
    effectLabel: "+8% receita jogos, +8000 fãs, +7% vendas, +7 rep", cost: 8_000_000, stratPath: "marketing",
    bonus: { gameRevMult: 1.08, fansBonus: 8000, salesMult: 1.07, repBonus: 7 },
    connections: ["eu8_mkt", "eu8_prod"],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Controlled Randomness Algorithm
// ─────────────────────────────────────────────────────────────────────────────

function weightedRandom(items: { id: string; weight: number }[]): string | null {
  if (items.length === 0) return null;
  const total = items.reduce((s, x) => s + x.weight, 0);
  if (total <= 0) return items[0].id;
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item.id;
  }
  return items[items.length - 1].id;
}

/**
 * When a player unlocks an upgrade, this function picks 2-3 new upgrades
 * to become "available". Uses controlled randomness to:
 * - Prioritize direct connections
 * - Balance across categories
 * - Prefer same era (with slight reach into next era)
 * - Guarantee no dead ends
 */
export function getControlledUnlocks(
  justUnlockedId: string,
  allUnlocked: string[],
  allAvailable: string[],
): string[] {
  const justUnlocked = ERA_UPGRADES.find((u) => u.id === justUnlockedId);
  if (!justUnlocked) return [];

  const alreadyUsed = new Set([...allUnlocked, ...allAvailable, justUnlockedId]);

  // Late-game catch-up: if 75%+ of total upgrades unlocked, reveal everything remaining
  if (allUnlocked.length >= Math.floor(ERA_UPGRADES.length * 0.75)) {
    return ERA_UPGRADES.filter((u) => !alreadyUsed.has(u.id)).map((u) => u.id);
  }

  // Normal case: candidates from same era + 1 era ahead
  const candidates = ERA_UPGRADES.filter(
    (u) => !alreadyUsed.has(u.id) && u.era <= justUnlocked.era + 1
  );

  // Fallback to any era if no local candidates
  const pool = candidates.length > 0
    ? candidates
    : ERA_UPGRADES.filter((u) => !alreadyUsed.has(u.id));

  if (pool.length === 0) return [];

  // Count category usage in unlocked set for balance weighting
  const catCounts: Record<string, number> = {};
  for (const id of [...allUnlocked, justUnlockedId]) {
    const u = ERA_UPGRADES.find((x) => x.id === id);
    if (u) catCounts[u.category] = (catCounts[u.category] ?? 0) + 1;
  }

  const weighted = pool.map((c) => {
    let w = 2;
    if (justUnlocked.connections.includes(c.id)) w += 10;
    if (c.category === justUnlocked.category) w += 4;
    if (ADJACENT_CATEGORIES[justUnlocked.category].includes(c.category)) w += 2;
    if (c.era === justUnlocked.era) w += 2;
    const overRep = catCounts[c.category] ?? 0;
    w = Math.max(1, w - overRep * 2);
    return { id: c.id, weight: w };
  });

  // Pick 2-3 unique upgrades
  const count = Math.random() < 0.35 ? 3 : 2;
  const picks: string[] = [];
  const available = [...weighted];

  for (let i = 0; i < count && available.length > 0; i++) {
    const pick = weightedRandom(available);
    if (pick) {
      picks.push(pick);
      const idx = available.findIndex((x) => x.id === pick);
      if (idx >= 0) available.splice(idx, 1);
    }
  }

  return picks;
}

/**
 * Returns the 3 initial upgrades available at game start.
 * Uses the first 3 Era-1 upgrades from different strategic paths.
 */
export function getInitialAvailableUpgrades(): string[] {
  return ["eu1_tech", "eu1_mkt", "eu1_prod"];
}

/**
 * Hyperbolic soft-cap formula for diminishing returns.
 * Returns a value that approaches `cap` asymptotically:
 *   - First upgrades return nearly 100% of their face value (early game feels strong)
 *   - As the raw total grows, each addition contributes less (late game is controlled)
 *   - The result never exceeds `cap`, no matter how many upgrades are stacked
 *
 * Example with cap=1.5: raw 0.10→0.096 (96%), raw 0.50→0.43 (86%), raw 1.0→0.60 (60%), raw 2.0→0.86 (57% of 1.5)
 */
function applyDiminishingReturns(rawValue: number, cap: number): number {
  if (rawValue <= 0 || cap <= 0) return Math.max(0, rawValue);
  return rawValue / (1 + rawValue / cap);
}

/**
 * Compute aggregate bonuses from all unlocked era upgrades.
 * Applies diminishing returns so early upgrades feel strong and late-game
 * stacking is controlled. Individual upgrade display values (effectLabel)
 * are unaffected — only the internally applied totals are capped.
 *
 * Soft caps (approached asymptotically, never hit exactly):
 *   salesMult       → +150% max added  (mult approaches 2.50)
 *   gameRevMult     → +150% max added  (mult approaches 2.50)
 *   campaignMult    → +150% max added  (mult approaches 2.50)
 *   devSpeedMult    → +130% max added  (mult approaches 2.30)
 *   costMult        → 80% max reduction (mult never below 0.20)
 *   riskMod         → 80% max reduction (mult never below 0.20)
 *   ratingBonus     → approaches 2.50 (quality soft cap ~120% of mid-game peak)
 */
export function computeEraUpgradeBonuses(unlockedIds: string[]): {
  ratingBonus: number;
  salesMult: number;
  costMult: number;
  campaignMult: number;
  repBonus: number;
  fansBonus: number;
  riskMod: number;
  gameRevMult: number;
  devSpeedMult: number;
} {
  // Accumulate raw (face-value) contributions before applying DR
  let rawRatingBonus  = 0;
  let rawSalesPct     = 0; // sum of (salesMult - 1) per upgrade
  let rawCostRed      = 0; // sum of (1 - costMult) per upgrade
  let rawCampaignPct  = 0;
  let rawGameRevPct   = 0;
  let rawDevSpeedPct  = 0;
  let rawRiskRed      = 0; // sum of (1 - riskMod) per upgrade
  let repBonus        = 0; // flat; kept as-is (reputation is capped at 100)
  let fansBonus       = 0; // flat; kept as-is (applied at 1% per month)

  for (const id of unlockedIds) {
    const u = ERA_UPGRADES.find((x) => x.id === id);
    if (!u) continue;
    const b = u.bonus;
    rawRatingBonus  += b.ratingBonus   ?? 0;
    rawSalesPct     += (b.salesMult    ?? 1) - 1;
    rawCostRed      += 1 - (b.costMult ?? 1);
    rawCampaignPct  += (b.campaignMult ?? 1) - 1;
    rawGameRevPct   += (b.gameRevMult  ?? 1) - 1;
    rawDevSpeedPct  += (b.devSpeedMult ?? 1) - 1;
    rawRiskRed      += 1 - (b.riskMod  ?? 1);
    repBonus        += b.repBonus      ?? 0;
    fansBonus       += b.fansBonus     ?? 0;
  }

  // Apply diminishing returns with category-specific soft caps
  return {
    ratingBonus:  applyDiminishingReturns(rawRatingBonus, 2.50),
    salesMult:    1 + applyDiminishingReturns(rawSalesPct,    1.50),
    costMult:     1 - applyDiminishingReturns(rawCostRed,     0.80),
    campaignMult: 1 + applyDiminishingReturns(rawCampaignPct, 1.50),
    gameRevMult:  1 + applyDiminishingReturns(rawGameRevPct,  1.50),
    devSpeedMult: 1 + applyDiminishingReturns(rawDevSpeedPct, 1.30),
    riskMod:      1 - applyDiminishingReturns(rawRiskRed,     0.80),
    repBonus,
    fansBonus,
  };
}

/**
 * Get dominant strategic path from unlock history.
 * Tech path → better products, higher risk
 * Marketing path → higher sales, lower quality
 * Production path → lower cost, less innovation
 */
export function getStratPathProgress(unlockedIds: string[]): Record<StratPath, number> {
  const counts: Record<StratPath, number> = { tech: 0, marketing: 0, production: 0 };
  for (const id of unlockedIds) {
    const u = ERA_UPGRADES.find((x) => x.id === id);
    if (u) counts[u.stratPath]++;
  }
  return counts;
}
