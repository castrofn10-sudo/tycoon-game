// ─────────────────────────────────────────────────────────────────────────────
// OFFICE UPGRADE SYSTEM — 8 Sectors × 7 Phases × 5 Upgrades = 35 per sector
// ─────────────────────────────────────────────────────────────────────────────
import { getCostMultiplier } from "./gameEconomics";

export type OfficeSectorId =
  | "design"
  | "tech"        // Development
  | "marketing"
  | "admin"       // Operations
  | "security"
  | "executive"
  | "research_lab"
  | "testing";

export const ALL_OFFICE_SECTORS: OfficeSectorId[] = [
  "design", "tech", "marketing", "admin",
  "security", "executive", "research_lab", "testing",
];

export const OFFICE_SECTOR_NAMES: Record<OfficeSectorId, string> = {
  design:       "Design",
  tech:         "Desenvolvimento",
  marketing:    "Marketing",
  admin:        "Operações",
  security:     "Segurança",
  executive:    "Executivo",
  research_lab: "Laboratório P&D",
  testing:      "Testes & QA",
};

export const OFFICE_SECTOR_ICONS: Record<OfficeSectorId, string> = {
  design:       "pen-tool",
  tech:         "cpu",
  marketing:    "megaphone",
  admin:        "briefcase",
  security:     "shield",
  executive:    "star",
  research_lab: "flask",       // will fallback to "book"
  testing:      "check-square",
};

export const OFFICE_SECTOR_COLORS: Record<OfficeSectorId, string> = {
  design:       "#A855F7",
  tech:         "#4DA6FF",
  marketing:    "#F5A623",
  admin:        "#10B981",
  security:     "#FF4D6A",
  executive:    "#F59E0B",
  research_lab: "#06B6D4",
  testing:      "#8B5CF6",
};

// ── Phase definitions ─────────────────────────────────────────────────────────
// 7 phases, each unlocking every ~10–15 years. Each has 5 upgrade slots.
export const OFFICE_PHASES = [
  { phase: 1, name: "Fundação",      unlockYear: 1972 },
  { phase: 2, name: "Expansão",      unlockYear: 1983 },
  { phase: 3, name: "Profissional",  unlockYear: 1995 },
  { phase: 4, name: "Corporativo",   unlockYear: 2005 },
  { phase: 5, name: "Avançado",      unlockYear: 2015 },
  { phase: 6, name: "Elite",         unlockYear: 2025 },
  { phase: 7, name: "Singularidade", unlockYear: 2040 },
] as const;

export const OFFICE_MAX_UPGRADES = 35; // 7 phases × 5 upgrades

// ── Upgrade cost formula ──────────────────────────────────────────────────────
// upgradeIndex: 0-based (0 = first upgrade in phase 1)
// Costs scale exponentially, with era inflation applied on top
export function getOfficeUpgradeCost(upgradeIndex: number, year: number): number {
  const phase = Math.floor(upgradeIndex / 5) + 1; // 1–7
  const posInPhase = (upgradeIndex % 5) + 1;       // 1–5

  // Base cost per phase (at 1972 prices)
  const PHASE_BASE: Record<number, number> = {
    1: 8_000,
    2: 50_000,
    3: 280_000,
    4: 1_200_000,
    5: 5_000_000,
    6: 20_000_000,
    7: 80_000_000,
  };

  const base = PHASE_BASE[phase] ?? PHASE_BASE[7];
  // Each step within a phase costs 25% more than the previous
  const stepMult = Math.pow(1.25, posInPhase - 1);
  // Inflation: costs scaled to the era (earlier eras cheaper, later expensive)
  const eraInflation = Math.pow(1.03, Math.max(0, year - 1972));

  return Math.round(base * stepMult * eraInflation);
}

// ── Monthly maintenance cost ──────────────────────────────────────────────────
// Each upgrade adds ongoing monthly overhead that scales with phase
export function getOfficeMonthlyMaintenance(totalUpgrades: number, year: number): number {
  if (totalUpgrades === 0) return 0;
  const phase = Math.ceil(totalUpgrades / 5);
  const PHASE_MONTHLY: Record<number, number> = {
    1: 500,
    2: 3_000,
    3: 15_000,
    4: 60_000,
    5: 250_000,
    6: 900_000,
    7: 3_500_000,
  };
  const base = PHASE_MONTHLY[phase] ?? PHASE_MONTHLY[7];
  return Math.round(base * getCostMultiplier(year));
}

// ── Phase availability ────────────────────────────────────────────────────────
export function getAvailablePhase(year: number): number {
  let phase = 1;
  for (const p of OFFICE_PHASES) {
    if (year >= p.unlockYear) phase = p.phase;
  }
  return phase;
}

// Highest upgrade index available given current year (0-based)
export function getMaxAvailableUpgrade(year: number): number {
  return getAvailablePhase(year) * 5 - 1;
}

// ── Per-upgrade effect labels ─────────────────────────────────────────────────
// Each sector has a benefit theme. Labels are computed per upgrade index.
export function getUpgradeLabel(sector: OfficeSectorId, upgradeIndex: number): string {
  const phase = Math.floor(upgradeIndex / 5) + 1;
  const pos   = (upgradeIndex % 5) + 1;

  const sectorLabels: Record<OfficeSectorId, string[][]> = {
    design: [
      // Phase 1 (upgrades 0-4)
      ["Design básico desbloqueado", "+8% qualidade visual dos produtos", "+15% atratividade de lançamento", "Paleta de cores premium", "Sistema de UI/UX interna"],
      // Phase 2
      ["Estúdio de design expandido", "+12% rating dos consoles", "Ferramentas de prototipagem", "+20% satisfação do cliente", "Design adaptativo por mercado"],
      // Phase 3
      ["Design team sênior", "+18% avaliação crítica", "Pipeline de assets acelerado", "+28% satisfação global", "Linguagem visual corporativa"],
      // Phase 4
      ["Laboratório de experiências", "+25% rating em todos os produtos", "Design inclusivo certificado", "+35% lealdade de fãs", "Identidade visual icônica"],
      // Phase 5
      ["Divisão criativa autônoma", "+32% rating de consoles", "Trends globais de design", "+45% satisfação do cliente", "Produtos potencialmente icônicos"],
      // Phase 6
      ["Agência de design interna", "+40% rating médio", "Parcerias com designers líderes", "+55% fidelidade dos fãs", "Design generativo com IA"],
      // Phase 7
      ["Divisão de arte pós-humana", "+50% rating garantido", "Estética transcendental", "+70% satisfação do cliente", "Obra-prima garantida por lançamento"],
    ],
    tech: [
      ["IDE e ferramentas básicas", "+0.3 pontos rating console", "Gestão de versões de código", "+0.5 eficiência de desenvolvimento", "Framework de desenvolvimento interno"],
      ["Cluster de servidores", "+0.6 pontos rating", "CI/CD pipeline automático", "Emulação de plataformas", "+10% velocidade de produção"],
      ["Motor gráfico proprietário", "+1.0 pontos rating", "API de desenvolvimento avançada", "+18% velocidade de produção", "Compatibilidade cross-platform"],
      ["Centro de inovação tech", "+1.5 pontos rating", "Machine learning integrado", "+25% velocidade de produção", "Hardware experimental"],
      ["Lab de próxima geração", "+2.0 pontos rating", "Prototipagem em dias", "+35% velocidade de produção", "Chips customizados"],
      ["Departamento de R&D avançado", "+2.5 pontos rating", "IA para otimização de código", "+45% velocidade de produção", "Acesso a tecnologias não-lançadas"],
      ["Instituto de Computação Quântica", "+3.5 pontos rating", "Processamento quântico", "+60% velocidade de produção", "Tecnologia de geração +2"],
    ],
    marketing: [
      ["Estratégia de marketing básica", "+8% em vendas mensais", "Newsletter e blog corporativo", "+12% alcance de audiência", "Métricas de campanha básicas"],
      ["Equipe de marketing expandida", "+15% vendas mensais", "Campanhas em redes sociais", "+20% alcance", "A/B testing de campanhas"],
      ["Gestão de marca corporativa", "+22% vendas mensais", "Parcerias com influenciadores", "+30% alcance global", "Segmentação avançada"],
      ["Centro de marketing integrado", "+30% vendas mensais", "Campanha multicanal", "+40% alcance", "Personalização por país"],
      ["Agência criativa interna", "+38% vendas mensais", "Virais e eventos globais", "+52% alcance", "Domínio de tendências de mercado"],
      ["Plataforma de marketing preditivo", "+48% vendas mensais", "IA de otimização de campanhas", "+65% alcance", "Influência em cultura pop"],
      ["Hiper-personalização quântica", "+60% vendas mensais", "Marketing de consciência cultural", "+80% alcance", "Domínio de mercado global"],
    ],
    admin: [
      ["Sistema de gestão básico", "-5% custos operacionais", "Contabilidade digital", "-8% custos de manutenção", "Gestão de contratos simples"],
      ["ERP corporativo", "-10% custos operacionais", "Automação de processos", "-14% custos de manutenção", "Gestão de fornecedores"],
      ["Centro de eficiência operacional", "-15% custos operacionais", "Outsourcing estratégico", "-20% custos de manutenção", "Auditoria de eficiência"],
      ["Hub de operações globais", "-20% custos operacionais", "Otimização de supply chain", "-26% todos os custos", "Gestão de risco integrada"],
      ["IA de otimização operacional", "-25% custos operacionais", "Automação de decisões de compras", "-32% todos os custos", "Operações 24/7 autônomas"],
      ["Centro de operações quase-autônomo", "-30% custos operacionais", "IA de previsão de falhas", "-40% todos os custos", "Operações zero-overhead"],
      ["Sistema de operações pós-humano", "-38% custos operacionais", "Otimização em tempo real", "-50% todos os custos", "Overhead quase eliminado"],
    ],
    security: [
      ["Firewall básico", "Proteção contra vazamentos", "+5% confiança corporativa", "Gestão de senhas", "Treinamento de segurança básico"],
      ["Centro de segurança dedicado", "Proteção contra espionagem", "+10% confiança", "Criptografia de dados", "Monitoramento 24/7"],
      ["Red team interno", "Detecção de intrusões", "+15% confiança corporativa", "Zero-trust parcial", "Proteção de IP"],
      ["Centro de cibersegurança avançado", "Defesa proativa", "+20% confiança", "Zero-trust completo", "Proteção de patentes globais"],
      ["Divisão de contrainteligência", "Imunidade a espionagem", "+28% confiança corporativa", "Criptografia quântica básica", "Monitoramento global de ameaças"],
      ["Instituto de segurança digital", "Proteção de ativos críticos", "+35% confiança", "Criptografia pós-quântica", "Inteligência sobre ameaças"],
      ["Escudo quântico corporativo", "Imunidade total a ataques", "+45% confiança corporativa", "Encriptação irreversível", "Defesa autônoma com IA"],
    ],
    executive: [
      ["Estrutura executiva básica", "+5% reputação corporativa", "Tomada de decisão ágil", "+8% eficiência geral", "Plano estratégico anual"],
      ["Conselho de administração", "+10% reputação", "Visão estratégica de médio prazo", "+14% eficiência geral", "Recrutamento de talentos premium"],
      ["CEO de nível A", "+15% reputação corporativa", "Rede de contatos elite", "+20% eficiência geral", "Partnerships estratégicas"],
      ["Comitê executivo global", "+22% reputação", "Visão de longo prazo 20 anos", "+28% eficiência geral", "Fusões e aquisições estratégicas"],
      ["Visão de legado corporativo", "+30% reputação corporativa", "Liderança de indústria", "+36% eficiência geral", "Influência em políticas públicas"],
      ["Ícone da indústria global", "+40% reputação", "Thought leadership reconhecido", "+45% eficiência geral", "Padrões da indústria definidos pela empresa"],
      ["Liderança histórica planetária", "+55% reputação corporativa", "Impacto civilizacional", "+60% eficiência geral", "Empresa definitória de era"],
    ],
    research_lab: [
      ["Biblioteca técnica", "+6% velocidade de pesquisa", "Acesso a journals científicos", "+10% qualidade de pesquisa", "Pesquisa exploratória básica"],
      ["Laboratório de P&D", "+12% velocidade de pesquisa", "Parceria com universidades", "+18% qualidade", "Patentes básicas"],
      ["Centro de inovação", "+20% velocidade de pesquisa", "Bolsas de pesquisa", "+28% qualidade de pesquisa", "Portfólio de patentes"],
      ["Instituto de pesquisa aplicada", "+28% velocidade de pesquisa", "Parcerias com institutos líderes", "+38% qualidade", "Licenciamento de tecnologia"],
      ["Laboratório de pesquisa avançada", "+38% velocidade de pesquisa", "Acesso a pesquisa classificada", "+50% qualidade de pesquisa", "Pesquisa interdisciplinar"],
      ["Centro de pesquisa futurista", "+50% velocidade de pesquisa", "Colaborações internacionais elite", "+65% qualidade", "Publicações em journals top-tier"],
      ["Instituto de Pesquisa Quântica", "+65% velocidade de pesquisa", "Física quântica aplicada", "+80% qualidade de pesquisa", "Breakthroughs civilizacionais"],
    ],
    testing: [
      ["QA básico manual", "-10% bugs no lançamento", "Checklist de testes", "-8% recalls de produto", "Feedback interno básico"],
      ["Suite de testes automatizados", "-18% bugs no lançamento", "Testes de regressão", "-15% recalls", "Beta testing interno"],
      ["Centro de QA dedicado", "-26% bugs no lançamento", "Testes de carga e stress", "-22% recalls de produto", "Beta testing externo"],
      ["Laboratório de usabilidade", "-34% bugs no lançamento", "Testes de acessibilidade", "-30% recalls", "Focus groups globais"],
      ["Plataforma de QA integrada", "-42% bugs no lançamento", "Testes de segurança", "-38% recalls de produto", "Certificações de qualidade"],
      ["Centro de excelência em qualidade", "-50% bugs no lançamento", "IA de detecção de bugs", "-46% recalls", "Padrão ISO interno"],
      ["QA pós-humano autônomo", "-60% bugs no lançamento", "Simulação quântica de cenários", "-55% recalls de produto", "Zero-defect garantido"],
    ],
  };

  const phaseLabels = sectorLabels[sector]?.[phase - 1];
  return phaseLabels?.[pos - 1] ?? `Melhoria ${upgradeIndex + 1}`;
}

// ── Bonus calculation ─────────────────────────────────────────────────────────
// Returns the bonus multiplier for a given upgrade count
export function getOfficeSectorBonus(sector: OfficeSectorId, upgrades: number): {
  ratingBonus: number;       // flat bonus to console rating (design, tech)
  salesMult: number;         // multiplier on sales (marketing)
  costReduction: number;     // fraction of cost saved (admin, testing)
  reputationBonus: number;   // added to reputation/month (executive, security)
  researchSpeed: number;     // research speed multiplier (research_lab)
} {
  const pct = Math.min(1, upgrades / OFFICE_MAX_UPGRADES);
  // Each sector scales differently; 35 upgrades = full benefit
  switch (sector) {
    case "design":
      return { ratingBonus: pct * 3.5, salesMult: 1 + pct * 0.3, costReduction: 0, reputationBonus: pct * 0.1, researchSpeed: 1 };
    case "tech":
      return { ratingBonus: pct * 5.0, salesMult: 1, costReduction: 0, reputationBonus: 0, researchSpeed: 1 + pct * 0.5 };
    case "marketing":
      return { ratingBonus: 0, salesMult: 1 + pct * 0.8, costReduction: 0, reputationBonus: pct * 0.05, researchSpeed: 1 };
    case "admin":
      return { ratingBonus: 0, salesMult: 1, costReduction: pct * 0.5, reputationBonus: 0, researchSpeed: 1 };
    case "security":
      return { ratingBonus: 0, salesMult: 1, costReduction: pct * 0.1, reputationBonus: pct * 0.15, researchSpeed: 1 };
    case "executive":
      return { ratingBonus: pct * 0.5, salesMult: 1 + pct * 0.2, costReduction: pct * 0.08, reputationBonus: pct * 0.3, researchSpeed: 1 };
    case "research_lab":
      return { ratingBonus: 0, salesMult: 1, costReduction: 0, reputationBonus: 0, researchSpeed: 1 + pct * 1.0 };
    case "testing":
      return { ratingBonus: 0, salesMult: 1 + pct * 0.15, costReduction: pct * 0.3, reputationBonus: 0, researchSpeed: 1 };
    default:
      return { ratingBonus: 0, salesMult: 1, costReduction: 0, reputationBonus: 0, researchSpeed: 1 };
  }
}

// ── Sector taglines ──────────────────────────────────────────────────────────
export const OFFICE_SECTOR_TAGLINES: Record<OfficeSectorId, string> = {
  design:       "Qualidade visual e avaliação crítica dos produtos",
  tech:         "Rating técnico de consoles e velocidade de produção",
  marketing:    "Eficiência de campanhas e fãs por lançamento",
  admin:        "Redução de custos e eficiência operacional",
  security:     "Proteção contra crises e estabilidade corporativa",
  executive:    "Reputação global e bônus estratégicos leves",
  research_lab: "Velocidade e profundidade de pesquisa tecnológica",
  testing:      "Redução de bugs e qualidade garantida no lançamento",
};

// ── Per-sector current impact lines ──────────────────────────────────────────
// Returns 2-3 human-readable impact lines based on current upgrade level
export function getSectorImpactLines(sector: OfficeSectorId, upgrades: number): string[] {
  const b = getOfficeSectorBonus(sector, upgrades);
  if (upgrades === 0) return ["Sem upgrades — nenhum bônus ativo"];
  switch (sector) {
    case "design":
      return [
        `+${b.ratingBonus.toFixed(1)} rating em consoles e jogos`,
        `+${Math.round((b.salesMult - 1) * 100)}% vendas por qualidade visual`,
      ];
    case "tech":
      return [
        `+${b.ratingBonus.toFixed(1)} rating técnico em consoles`,
        `+${Math.round((b.researchSpeed - 1) * 100)}% velocidade de desenvolvimento`,
      ];
    case "marketing":
      return [
        `+${Math.round((b.salesMult - 1) * 100)}% eficiência de campanhas`,
        `+${Math.round((b.salesMult - 1) * 100)}% fãs por lançamento`,
      ];
    case "admin":
      return [
        `-${Math.round(b.costReduction * 100)}% custos operacionais`,
        "Maior eficiência em contratos e produção",
      ];
    case "security":
      return [
        `-${Math.round(b.costReduction * 100)}% risco de eventos negativos`,
        `+${(b.reputationBonus * 12).toFixed(1)} reputação/ano (estabilidade)`,
      ];
    case "executive":
      return [
        `+${Math.round((b.salesMult - 1) * 100)}% eficiência em todas as áreas`,
        `+${(b.reputationBonus * 12).toFixed(1)} reputação/ano`,
        `-${Math.round(b.costReduction * 100)}% custos globais`,
      ];
    case "research_lab":
      return [
        `+${Math.round((b.researchSpeed - 1) * 100)}% velocidade de pesquisa`,
        "Acelera desbloqueio de tecnologias futuras",
      ];
    case "testing":
      return [
        `-${Math.round(b.costReduction * 100)}% taxa de bugs no lançamento`,
        `+${Math.round((b.salesMult - 1) * 100)}% qualidade garantida`,
      ];
    default:
      return [];
  }
}

// ── Milestone system ──────────────────────────────────────────────────────────
// Every 5 upgrades = a milestone with a named bonus
export const OFFICE_MILESTONE_LABELS: Record<OfficeSectorId, Record<number, string>> = {
  design:       { 5: "Estúdio criativo", 10: "Design avançado", 15: "Pipeline premium", 20: "Identidade icónica", 25: "Arte pós-industrial", 30: "Design generativo", 35: "Singularidade criativa" },
  tech:         { 5: "Stack de dev básico", 10: "Motor proprietário", 15: "Centro de inovação", 20: "Lab next-gen", 25: "R&D autónomo", 30: "Computação quântica", 35: "Singularidade técnica" },
  marketing:    { 5: "Equipa de marketing", 10: "Gestão de marca", 15: "Multicanal global", 20: "Virais e eventos", 25: "Marketing preditivo", 30: "IA de campanhas", 35: "Domínio cultural" },
  admin:        { 5: "Gestão digital", 10: "ERP corporativo", 15: "Hub global", 20: "Eficiência máxima", 25: "IA operacional", 30: "Automação total", 35: "Overhead zero" },
  security:     { 5: "Firewall avançado", 10: "Red team interno", 15: "Zero-trust parcial", 20: "Zero-trust total", 25: "Contrainteligência", 30: "Segurança pós-quântica", 35: "Escudo autónomo" },
  executive:    { 5: "Conselho de adm.", 10: "CEO nível A", 15: "Comité global", 20: "Legado corporativo", 25: "Ícone da indústria", 30: "Thought leadership", 35: "Liderança civilizacional" },
  research_lab: { 5: "Laboratório P&D", 10: "Centro de inovação", 15: "Instituto aplicado", 20: "Pesquisa avançada", 25: "Centro futurista", 30: "Colaborações elite", 35: "Instituto quântico" },
  testing:      { 5: "Suite de testes", 10: "QA dedicado", 15: "Lab de usabilidade", 20: "Plataforma integrada", 25: "Centro de excelência", 30: "IA de detecção", 35: "QA zero-defect" },
};

export function getNextMilestoneInfo(upgrades: number): { level: number; label: string } | null {
  const nextMilestone = Math.ceil((upgrades + 1) / 5) * 5;
  if (nextMilestone > OFFICE_MAX_UPGRADES) return null;
  return { level: nextMilestone, label: `Marco no nível ${nextMilestone}` };
}

export function getCurrentMilestoneLabel(sector: OfficeSectorId, upgrades: number): string | null {
  const lastMilestone = Math.floor(upgrades / 5) * 5;
  if (lastMilestone === 0) return null;
  return OFFICE_MILESTONE_LABELS[sector]?.[lastMilestone] ?? null;
}

// ── Phase benefit descriptions ────────────────────────────────────────────────
export const OFFICE_PHASE_BENEFITS: Record<number, { short: string; detail: string }> = {
  1: { short: "Fundação básica",         detail: "Estrutura inicial — limite de 5 upgrades por setor" },
  2: { short: "Expansão operacional",    detail: "Múltiplos projetos simultâneos desbloqueados" },
  3: { short: "Produção profissional",   detail: "+5% bônus global em velocidade de produção" },
  4: { short: "Escala corporativa",      detail: "+8% bônus geral em todas as áreas do escritório" },
  5: { short: "Liderança avançada",      detail: "+12% bônus global e acesso a tecnologias tardias" },
  6: { short: "Domínio elite",           detail: "+18% em todas as métricas — empresa de referência" },
  7: { short: "Singularidade",           detail: "+25% bônus total — domínio absoluto do mercado" },
};

// ── Office Focus Mode ─────────────────────────────────────────────────────────
export type OfficeFocusMode = "balanced" | "quality" | "speed" | "profit";

export const OFFICE_FOCUS_CONFIGS: Record<OfficeFocusMode, {
  label: string;
  description: string;
  icon: string;
  color: string;
  boostedSectors: OfficeSectorId[];
}> = {
  balanced: {
    label: "Equilibrado",
    description: "Todos os setores operam na sua capacidade padrão",
    icon: "sliders",
    color: "#4DA6FF",
    boostedSectors: [],
  },
  quality: {
    label: "Qualidade",
    description: "Design e Testes em foco — máxima qualidade de produto",
    icon: "award",
    color: "#A855F7",
    boostedSectors: ["design", "testing"],
  },
  speed: {
    label: "Velocidade",
    description: "Desenvolvimento e P&D — lançamentos mais rápidos",
    icon: "zap",
    color: "#00C896",
    boostedSectors: ["tech", "research_lab"],
  },
  profit: {
    label: "Lucro",
    description: "Operações e Marketing — máxima eficiência financeira",
    icon: "trending-up",
    color: "#F5A623",
    boostedSectors: ["admin", "marketing"],
  },
};

// ── Aggregate all office bonuses across all sectors ───────────────────────────
export function computeAllOfficeBonuses(offices: Partial<Record<OfficeSectorId, number>>): {
  totalRatingBonus: number;
  totalSalesMult: number;
  totalCostReduction: number;   // 0–1
  totalReputationBonus: number; // per month
  totalResearchSpeed: number;   // multiplier
  totalDevSpeed: number;        // months of progress per game-month (1.0 = normal)
} {
  let totalRatingBonus = 0;
  let salesMultAdd = 0;
  let totalCostReduction = 0;
  let totalReputationBonus = 0;
  let researchSpeedAdd = 0;

  for (const sector of ALL_OFFICE_SECTORS) {
    const upgrades = offices[sector] ?? 0;
    const b = getOfficeSectorBonus(sector, upgrades);
    totalRatingBonus    += b.ratingBonus;
    salesMultAdd        += (b.salesMult - 1);
    totalCostReduction  += b.costReduction;
    totalReputationBonus += b.reputationBonus;
    researchSpeedAdd    += (b.researchSpeed - 1);
  }

  const techPct     = Math.min(1, (offices.tech ?? 0)    / OFFICE_MAX_UPGRADES);
  const testingPct  = Math.min(1, (offices.testing ?? 0) / OFFICE_MAX_UPGRADES);
  const designPct   = Math.min(1, (offices.design ?? 0)  / OFFICE_MAX_UPGRADES);
  // tech drives most of dev speed; design and testing give smaller boosts
  const totalDevSpeed = 1.0 + techPct * 0.65 + testingPct * 0.25 + designPct * 0.10;

  return {
    totalRatingBonus,
    totalSalesMult:      1 + salesMultAdd,
    totalCostReduction:  Math.min(0.7, totalCostReduction),
    totalReputationBonus,
    totalResearchSpeed:  1 + researchSpeedAdd,
    totalDevSpeed,
  };
}
