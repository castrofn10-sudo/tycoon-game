// ─────────────────────────────────────────────────────────────────────────────
// MEGACORP — Corporate Scandal / Media / Influencer / Fake-Review system
// ─────────────────────────────────────────────────────────────────────────────

import {
  validateEventContext,
  isHardBlockedEvent,
  inferScandalEventCategory,
  type EventValidationContext,
} from "./eventValidation";

export type ScandalCategory =
  | "internal"   // employee/culture issues
  | "product"    // bugs, defects, launches
  | "financial"  // fraud, investor issues
  | "social"     // public perception, PR
  | "competitor" // rival-related scandals
  | "review"     // fake review events
  | "data";      // data/security breaches

export type ScandalSeverity = "minor" | "major" | "critical";

export type ScandalOptionEffect = {
  moneyDelta?: number;
  repDelta?: number;
  techRepDelta?: number;
  commercialRepDelta?: number;
  fanRepDelta?: number;
  fansDelta?: number;
  escalationMod?: number; // negative = reduces future escalation, positive = increases it
  futureRepRisk?: number; // 0-1 chance of future backlash in 1-3 months
};

export type ScandalOption = {
  id: string;
  label: string;
  description: string;
  cost: number;
  effects: ScandalOptionEffect;
  riskTag?: "RISCO ALTO" | "RISCO MÉDIO" | "OPÇÃO SEGURA" | "ESTRATÉGIA ARRISCADA" | "TRANSPARÊNCIA";
};

export type ScandalDef = {
  id: string;
  title: string;
  description: string;
  category: ScandalCategory;
  severity: ScandalSeverity;
  initialRepDelta: number;
  initialFansDelta?: number;
  initialTechRepDelta?: number;
  canIgnore?: boolean; // if false, modal stays until decision
  baseEscalationChance: number; // 0-1 monthly
  options: ScandalOption[];
  minYear?: number; // only fire after this year
  requiresConsole?: boolean;
  requiresReleasedGame?: boolean;
  maxOccurrences?: number; // default 1 per run
};

// ─────────────────────────────────────────────────────────────────────────────
// SCANDAL DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────
export const ALL_SCANDALS: ScandalDef[] = [
  // ── PRODUCT ────────────────────────────────────────────────────────────────
  {
    id: "console_overheating",
    title: "🔥 Console Superaquecendo!",
    description:
      "Relatórios de consumidores indicam que o vosso console pode sobreaquecer e causar danos. A imprensa especializada está a cobrir o caso.",
    category: "product",
    severity: "major",
    initialRepDelta: -8,
    initialFansDelta: -120,
    initialTechRepDelta: -10,
    baseEscalationChance: 0.35,
    requiresConsole: true,
    options: [
      {
        id: "recall",
        label: "Recall total + correção",
        description: "Recolha todos os consoles e lança correção de hardware gratuita.",
        cost: 1_500_000,
        effects: { repDelta: +6, techRepDelta: +8, fanRepDelta: +5, escalationMod: -0.8 },
        riskTag: "OPÇÃO SEGURA",
      },
      {
        id: "patch",
        label: "Patch de firmware",
        description: "Lança atualização de software para mitigar o problema.",
        cost: 200_000,
        effects: { repDelta: +2, techRepDelta: +3, escalationMod: -0.3, futureRepRisk: 0.3 },
        riskTag: "RISCO MÉDIO",
      },
      {
        id: "deny",
        label: "Negar publicamente",
        description: "Nega os relatórios e culpa mau uso pelos consumidores.",
        cost: 0,
        effects: { repDelta: -5, fansDelta: -200, escalationMod: +0.4, futureRepRisk: 0.7 },
        riskTag: "RISCO ALTO",
      },
      {
        id: "compensate",
        label: "Compensar utilizadores afetados",
        description: "Oferece substituições gratuitas a quem reportou problemas.",
        cost: 750_000,
        effects: { repDelta: +4, fanRepDelta: +8, escalationMod: -0.5 },
        riskTag: "OPÇÃO SEGURA",
      },
    ],
  },
  {
    id: "game_launch_bugs",
    title: "🐛 Jogo Lançado com Bugs Graves",
    description:
      "O vosso último jogo tem bugs críticos que tornam certas secções injogáveis. A comunidade está a revoltar-se nas redes sociais.",
    category: "product",
    severity: "major",
    initialRepDelta: -6,
    initialFansDelta: -200,
    baseEscalationChance: 0.3,
    requiresReleasedGame: true,
    options: [
      {
        id: "emergency_patch",
        label: "Patch de emergência (1 semana)",
        description: "Mobiliza toda a equipa para lançar uma correção de emergência.",
        cost: 300_000,
        effects: { repDelta: +4, techRepDelta: +6, fanRepDelta: +4, escalationMod: -0.7 },
        riskTag: "OPÇÃO SEGURA",
      },
      {
        id: "refund",
        label: "Oferecer reembolso total",
        description: "Permite que qualquer jogador peça reembolso nas próximas 2 semanas.",
        cost: 500_000,
        effects: { repDelta: +3, fanRepDelta: +10, commercialRepDelta: -5, escalationMod: -0.6 },
        riskTag: "TRANSPARÊNCIA",
      },
      {
        id: "apologize",
        label: "Pedido de desculpas público",
        description: "CEO publica carta aberta reconhecendo os erros.",
        cost: 0,
        effects: { repDelta: +2, fanRepDelta: +3, escalationMod: -0.2 },
        riskTag: "RISCO MÉDIO",
      },
      {
        id: "blame_team",
        label: "Culpar equipa interna",
        description: "Despede publicamente os 'responsáveis' pelo QA.",
        cost: 0,
        effects: { repDelta: -3, commercialRepDelta: +2, escalationMod: -0.1, futureRepRisk: 0.5 },
        riskTag: "RISCO ALTO",
      },
    ],
  },
  {
    id: "false_advertising",
    title: "📢 Acusação de Propaganda Enganosa",
    description:
      "Uma associação de consumidores acusa a empresa de exagerar nas capacidades do produto anunciado. Processo judicial eminente.",
    category: "social",
    severity: "major",
    initialRepDelta: -7,
    initialFansDelta: -80,
    baseEscalationChance: 0.25,
    options: [
      {
        id: "settle",
        label: "Acordo extrajudicial",
        description: "Paga para encerrar o processo sem admitir culpa.",
        cost: 800_000,
        effects: { repDelta: +1, commercialRepDelta: -3, escalationMod: -0.8 },
        riskTag: "OPÇÃO SEGURA",
      },
      {
        id: "fight",
        label: "Contestar judicialmente",
        description: "Luta o processo em tribunal. Pode ganhar ou perder.",
        cost: 250_000,
        effects: { repDelta: 0, escalationMod: +0.2, futureRepRisk: 0.5 },
        riskTag: "ESTRATÉGIA ARRISCADA",
      },
      {
        id: "truth",
        label: "Admitir e reformular marketing",
        description: "Reconhece os exageros e promete transparência futura.",
        cost: 100_000,
        effects: { repDelta: +4, techRepDelta: +2, fanRepDelta: +3, escalationMod: -0.6 },
        riskTag: "TRANSPARÊNCIA",
      },
      {
        id: "ignore_lawsuit",
        label: "Ignorar por enquanto",
        description: "Aposta que o processo não vai a lado nenhum.",
        cost: 0,
        effects: { escalationMod: +0.5, futureRepRisk: 0.8 },
        riskTag: "RISCO ALTO",
      },
    ],
  },

  // ── INTERNAL ────────────────────────────────────────────────────────────────
  {
    id: "toxic_workplace",
    title: "🏢 Denúncia de Ambiente Tóxico",
    description:
      "Ex-funcionários publicaram testemunhos em redes sociais descrevendo um ambiente de trabalho abusivo e pressão extrema.",
    category: "internal",
    severity: "major",
    initialRepDelta: -9,
    initialFansDelta: -150,
    baseEscalationChance: 0.3,
    minYear: 1975,
    options: [
      {
        id: "reform",
        label: "Reforma interna + HR independente",
        description: "Contrata auditoria externa de RH e implementa novas políticas.",
        cost: 400_000,
        effects: { repDelta: +5, fanRepDelta: +6, techRepDelta: +3, escalationMod: -0.8 },
        riskTag: "OPÇÃO SEGURA",
      },
      {
        id: "dismiss",
        label: "Desacreditar os ex-funcionários",
        description: "Afirma que são ex-funcionários descontentes e sem credibilidade.",
        cost: 50_000,
        effects: { repDelta: -4, escalationMod: +0.4, futureRepRisk: 0.65 },
        riskTag: "RISCO ALTO",
      },
      {
        id: "apologize_internal",
        label: "Carta aberta de desculpas",
        description: "CEO publica carta reconhecendo falhas e prometendo melhorias.",
        cost: 0,
        effects: { repDelta: +3, fanRepDelta: +4, escalationMod: -0.4 },
        riskTag: "TRANSPARÊNCIA",
      },
      {
        id: "pay_silence",
        label: "Acordo de confidencialidade",
        description: "Paga os ex-funcionários para assinarem NDA e pararem de falar.",
        cost: 600_000,
        effects: { commercialRepDelta: -2, escalationMod: -0.6, futureRepRisk: 0.4 },
        riskTag: "ESTRATÉGIA ARRISCADA",
      },
    ],
  },
  {
    id: "internal_leak",
    title: "🔓 Vazamento Interno de Informações",
    description:
      "Documentos confidenciais sobre os próximos produtos foram vazados online. A concorrência e os media têm acesso às vossas estratégias.",
    category: "internal",
    severity: "minor",
    initialRepDelta: -4,
    baseEscalationChance: 0.2,
    options: [
      {
        id: "investigate",
        label: "Investigação interna",
        description: "Lança investigação para identificar a fonte do vazamento.",
        cost: 150_000,
        effects: { repDelta: +2, techRepDelta: +3, escalationMod: -0.5 },
        riskTag: "OPÇÃO SEGURA",
      },
      {
        id: "accelerate_launch",
        label: "Antecipar lançamento",
        description: "Lança o produto antes para recuperar vantagem competitiva.",
        cost: 500_000,
        effects: { commercialRepDelta: +3, fansDelta: +100, escalationMod: -0.3 },
        riskTag: "RISCO MÉDIO",
      },
      {
        id: "ignore_leak",
        label: "Ignorar e seguir em frente",
        description: "Minimiza o vazamento publicamente e avança com os planos.",
        cost: 0,
        effects: { escalationMod: +0.1 },
        riskTag: "RISCO MÉDIO",
      },
    ],
  },
  {
    id: "fraud_embezzlement",
    title: "💸 Suspeita de Fraude Interna",
    description:
      "Auditores externos sinalizaram irregularidades financeiras. Podem existir desvios de orçamento por parte de quadros internos.",
    category: "financial",
    severity: "critical",
    initialRepDelta: -12,
    initialFansDelta: -100,
    baseEscalationChance: 0.4,
    minYear: 1978,
    canIgnore: false,
    options: [
      {
        id: "full_audit",
        label: "Auditoria completa + transparência",
        description: "Publica os resultados da auditoria e despede os envolvidos.",
        cost: 500_000,
        effects: { repDelta: +6, commercialRepDelta: +5, techRepDelta: +3, escalationMod: -0.9 },
        riskTag: "TRANSPARÊNCIA",
      },
      {
        id: "cover_up",
        label: "Encobrir internamente",
        description: "Resolve internamente sem publicidade. Alto risco de descoberta futura.",
        cost: 200_000,
        effects: { repDelta: +1, escalationMod: -0.2, futureRepRisk: 0.8 },
        riskTag: "RISCO ALTO",
      },
      {
        id: "blame_cfo",
        label: "Despedir o CFO publicamente",
        description: "Faz do CFO o bode expiatório da situação.",
        cost: 300_000,
        effects: { repDelta: +2, commercialRepDelta: -2, escalationMod: -0.5, futureRepRisk: 0.35 },
        riskTag: "ESTRATÉGIA ARRISCADA",
      },
    ],
  },

  // ── SOCIAL / PR ─────────────────────────────────────────────────────────────
  {
    id: "influencer_exposé",
    title: "📱 Influenciador Expõe a Empresa",
    description:
      "Um influenciador com 5 milhões de seguidores publicou um vídeo extenso apontando falhas nos vossos produtos e práticas comerciais.",
    category: "social",
    severity: "major",
    initialRepDelta: -8,
    initialFansDelta: -300,
    baseEscalationChance: 0.2,
    minYear: 1980,
    options: [
      {
        id: "sponsor_bigger",
        label: "Contratar influenciador maior",
        description: "Paga um influenciador ainda maior para contra-narrativa positiva.",
        cost: 350_000,
        effects: { repDelta: +3, fansDelta: +200, escalationMod: -0.5 },
        riskTag: "ESTRATÉGIA ARRISCADA",
      },
      {
        id: "invite_tour",
        label: "Convidar para visita à empresa",
        description: "Convida o influenciador para ver os bastidores e dar resposta.",
        cost: 50_000,
        effects: { repDelta: +5, fanRepDelta: +6, fansDelta: +150, escalationMod: -0.7 },
        riskTag: "TRANSPARÊNCIA",
      },
      {
        id: "legal_threat",
        label: "Ameaça legal",
        description: "Ameaça processo judicial por difamação.",
        cost: 100_000,
        effects: { repDelta: -6, fansDelta: -400, escalationMod: +0.6, futureRepRisk: 0.6 },
        riskTag: "RISCO ALTO",
      },
      {
        id: "ignore_influencer",
        label: "Ignorar publicamente",
        description: "Não responde ao vídeo e deixa a polémica esfriar.",
        cost: 0,
        effects: { escalationMod: +0.15, futureRepRisk: 0.3 },
        riskTag: "RISCO MÉDIO",
      },
    ],
  },
  {
    id: "investor_crisis",
    title: "📉 Crise com Investidores",
    description:
      "Investidores principais estão exigindo uma reunião de emergência após uma série de resultados abaixo do esperado.",
    category: "financial",
    severity: "major",
    initialRepDelta: -6,
    baseEscalationChance: 0.3,
    canIgnore: false,
    options: [
      {
        id: "transparency_meeting",
        label: "Reunião de transparência",
        description: "Apresenta um plano detalhado e realista de recuperação.",
        cost: 50_000,
        effects: { repDelta: +4, commercialRepDelta: +6, escalationMod: -0.8 },
        riskTag: "TRANSPARÊNCIA",
      },
      {
        id: "aggressive_buyback",
        label: "Recompra agressiva de ações",
        description: "Usa capital para recomprar ações e sinalizar confiança.",
        cost: 2_000_000,
        effects: { commercialRepDelta: +8, repDelta: +3, escalationMod: -0.9 },
        riskTag: "OPÇÃO SEGURA",
      },
      {
        id: "spin_numbers",
        label: "Apresentar dados de forma favorável",
        description: "Apresenta métricas alternativas que pintam um quadro melhor.",
        cost: 0,
        effects: { commercialRepDelta: +2, escalationMod: -0.2, futureRepRisk: 0.5 },
        riskTag: "ESTRATÉGIA ARRISCADA",
      },
    ],
  },

  // ── DATA / SECURITY ─────────────────────────────────────────────────────────
  {
    id: "data_breach",
    title: "🔐 Vazamento de Dados de Utilizadores",
    description:
      "Uma vulnerabilidade de segurança expôs dados pessoais de milhares de utilizadores online.",
    category: "data",
    severity: "critical",
    initialRepDelta: -10,
    initialFansDelta: -200,
    initialTechRepDelta: -12,
    baseEscalationChance: 0.35,
    minYear: 1982,
    canIgnore: false,
    options: [
      {
        id: "notify_users",
        label: "Notificar utilizadores afetados",
        description: "Comunica proativamente e oferece monitoramento gratuito.",
        cost: 400_000,
        effects: { repDelta: +4, techRepDelta: +5, fanRepDelta: +5, escalationMod: -0.7 },
        riskTag: "TRANSPARÊNCIA",
      },
      {
        id: "patch_quietly",
        label: "Corrigir silenciosamente",
        description: "Resolve a falha sem anunciar publicamente.",
        cost: 100_000,
        effects: { techRepDelta: +2, escalationMod: -0.3, futureRepRisk: 0.7 },
        riskTag: "RISCO ALTO",
      },
      {
        id: "hire_security",
        label: "Contratar firma de cibersegurança",
        description: "Contrata experts externos para auditoria total de segurança.",
        cost: 700_000,
        effects: { techRepDelta: +10, repDelta: +3, escalationMod: -0.85 },
        riskTag: "OPÇÃO SEGURA",
      },
    ],
  },
  {
    id: "industrial_espionage",
    title: "🕵️ Suspeita de Espionagem Industrial",
    description:
      "Evidências sugerem que espiões industriais (possivelmente enviados por um rival) tiveram acesso a segredos da empresa.",
    category: "competitor",
    severity: "major",
    initialRepDelta: -5,
    baseEscalationChance: 0.2,
    options: [
      {
        id: "expose_rival",
        label: "Expor o rival publicamente",
        description: "Acusa publicamente o rival suspeito.",
        cost: 100_000,
        effects: { repDelta: +3, fansDelta: +100, escalationMod: +0.3, futureRepRisk: 0.4 },
        riskTag: "ESTRATÉGIA ARRISCADA",
      },
      {
        id: "legal_action",
        label: "Ação legal confidencial",
        description: "Processa o rival nos bastidores.",
        cost: 300_000,
        effects: { repDelta: +2, commercialRepDelta: +3, escalationMod: -0.5 },
        riskTag: "RISCO MÉDIO",
      },
      {
        id: "tighten_security",
        label: "Reforçar segurança interna",
        description: "Investe em protocolos de segurança sem publicidade.",
        cost: 200_000,
        effects: { techRepDelta: +5, escalationMod: -0.6 },
        riskTag: "OPÇÃO SEGURA",
      },
    ],
  },
  {
    id: "plagiarism_accusation",
    title: "⚖️ Acusação de Plágio",
    description:
      "Um estúdio indie acusa a empresa de ter copiado mecânicas e assets de um dos seus jogos independentes.",
    category: "social",
    severity: "minor",
    initialRepDelta: -5,
    initialFansDelta: -100,
    baseEscalationChance: 0.25,
    requiresReleasedGame: true,
    options: [
      {
        id: "settle_indie",
        label: "Acordo amigável + crédito",
        description: "Compensa o estúdio indie e credita a inspiração.",
        cost: 150_000,
        effects: { repDelta: +4, fanRepDelta: +5, escalationMod: -0.8 },
        riskTag: "TRANSPARÊNCIA",
      },
      {
        id: "fight_plagiarism",
        label: "Disputar em tribunal",
        description: "Contesta que as semelhanças são coincidência ou conceitos genéricos.",
        cost: 200_000,
        effects: { repDelta: -2, escalationMod: +0.1, futureRepRisk: 0.4 },
        riskTag: "ESTRATÉGIA ARRISCADA",
      },
      {
        id: "acquire_indie",
        label: "Adquirir o estúdio indie",
        description: "Faz uma oferta de aquisição para resolver o conflito.",
        cost: 1_000_000,
        effects: { repDelta: +6, commercialRepDelta: +4, fanRepDelta: +6, escalationMod: -0.9 },
        riskTag: "OPÇÃO SEGURA",
      },
    ],
  },

  // ── REVIEW / SOCIAL MEDIA ───────────────────────────────────────────────────
  {
    id: "review_manipulation",
    title: "⭐ Acusação de Manipulação de Reviews",
    description:
      "Jornalistas investigativos descobriram indícios de que a empresa pagou por reviews positivas em grande escala.",
    category: "review",
    severity: "major",
    initialRepDelta: -10,
    initialFansDelta: -250,
    baseEscalationChance: 0.35,
    requiresReleasedGame: true,
    options: [
      {
        id: "confess_reform",
        label: "Confessar e reformar práticas",
        description: "Admite irregularidades passadas e compromete-se a mudança.",
        cost: 0,
        effects: { repDelta: +3, fanRepDelta: +4, escalationMod: -0.6 },
        riskTag: "TRANSPARÊNCIA",
      },
      {
        id: "deny_manipulation",
        label: "Negar categoricamente",
        description: "Nega qualquer envolvimento na manipulação de reviews.",
        cost: 50_000,
        effects: { repDelta: -2, escalationMod: +0.3, futureRepRisk: 0.6 },
        riskTag: "RISCO ALTO",
      },
      {
        id: "pay_media",
        label: "Pagar media para enterrar a história",
        description: "Usa dinheiro para suprimir a cobertura jornalística.",
        cost: 500_000,
        effects: { commercialRepDelta: -3, escalationMod: -0.4, futureRepRisk: 0.5 },
        riskTag: "RISCO ALTO",
      },
    ],
  },
  {
    id: "review_bomb",
    title: "💣 Review Bomb Organizado",
    description:
      "Um grupo coordenado de utilizadores está a bombardear os vossos produtos com avaliações negativas por razões políticas ou de protesto.",
    category: "review",
    severity: "minor",
    initialRepDelta: -4,
    initialFansDelta: -400,
    baseEscalationChance: 0.15,
    requiresReleasedGame: true,
    options: [
      {
        id: "engage_community",
        label: "Diálogo aberto com a comunidade",
        description: "Cria um espaço de discussão e ouve as preocupações.",
        cost: 30_000,
        effects: { repDelta: +4, fanRepDelta: +7, fansDelta: +100, escalationMod: -0.6 },
        riskTag: "TRANSPARÊNCIA",
      },
      {
        id: "report_platform",
        label: "Reportar à plataforma",
        description: "Pede à plataforma que remova reviews coordenadas artificialmente.",
        cost: 0,
        effects: { repDelta: +1, escalationMod: -0.3 },
        riskTag: "OPÇÃO SEGURA",
      },
      {
        id: "influencer_response",
        label: "Mobilizar influenciadores de apoio",
        description: "Contrata influenciadores para defender o produto publicamente.",
        cost: 200_000,
        effects: { repDelta: +2, fansDelta: +200, escalationMod: -0.4 },
        riskTag: "RISCO MÉDIO",
      },
    ],
  },
  {
    id: "competitor_fake_reviews",
    title: "🤖 Rival Comprando Reviews Negativas",
    description:
      "Investigação da comunidade revelou que um concorrente está a pagar bots para publicar avaliações negativas sobre os vossos produtos.",
    category: "review",
    severity: "minor",
    initialRepDelta: -3,
    initialFansDelta: -150,
    baseEscalationChance: 0.1,
    requiresReleasedGame: true,
    options: [
      {
        id: "public_exposure",
        label: "Expor o esquema publicamente",
        description: "Publica as provas e expõe o rival nas redes sociais.",
        cost: 50_000,
        effects: { repDelta: +5, fanRepDelta: +6, fansDelta: +200, escalationMod: -0.5 },
        riskTag: "TRANSPARÊNCIA",
      },
      {
        id: "counter_bots",
        label: "Contra-ataque com bots próprios",
        description: "Usa a mesma táctica. Risco de ser descoberto.",
        cost: 150_000,
        effects: { fansDelta: +150, escalationMod: +0.2, futureRepRisk: 0.7 },
        riskTag: "RISCO ALTO",
      },
      {
        id: "report_quietly",
        label: "Reportar à plataforma discretamente",
        description: "Denuncia o esquema sem fazer publicidade.",
        cost: 0,
        effects: { repDelta: +1, escalationMod: -0.2 },
        riskTag: "OPÇÃO SEGURA",
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// INFLUENCER SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

export type InfluencerType = "tech" | "entertainer" | "controversial" | "trusted" | "niche" | "megastar";
export type InfluencerStance = "positive" | "negative" | "neutral";

export type InfluencerEvent = {
  id: string;
  name: string;
  type: InfluencerType;
  stance: InfluencerStance;
  audienceMultiplier: number; // 0.5 to 4.0, affects magnitude
  repDelta: number;
  fansDelta: number;
  techRepDelta?: number;
  commercialRepDelta?: number;
  duration: number; // months the effect lingers
  title: string;
  body: string;
};

const INFLUENCER_NAMES = [
  "TechMaster João", "GamingGuru Ana", "PixelQueen Sara", "ByteBoss Carlos",
  "RetroReviewer Mike", "HypeStation Leo", "ConsoleWars Eva", "BitCritic Rui",
  "NeonGamer Tiago", "DigitalDiva Marta", "ChipChaser Pedro", "VoxelVet Inês",
];

function pickName(exclude: string[] = []): string {
  const available = INFLUENCER_NAMES.filter((n) => !exclude.includes(n));
  return available[Math.floor(Math.random() * available.length)] ?? INFLUENCER_NAMES[0];
}

export function generateInfluencerEvent(
  type: "launch" | "scandal" | "random",
  existingNames: string[] = []
): InfluencerEvent {
  const influencerTypes: InfluencerType[] = ["tech", "entertainer", "controversial", "trusted", "niche", "megastar"];
  const infType = influencerTypes[Math.floor(Math.random() * influencerTypes.length)];
  const name = pickName(existingNames);

  const audienceMap: Record<InfluencerType, number> = {
    niche: 0.6,
    tech: 1.0,
    entertainer: 1.4,
    trusted: 1.2,
    controversial: 1.6,
    megastar: 3.0,
  };
  const aud = audienceMap[infType];

  // For launch events, 60% positive; for scandal, 70% negative; for random, 50/50
  const stanceRoll = Math.random();
  const stance: InfluencerStance =
    type === "launch"  ? (stanceRoll < 0.60 ? "positive" : stanceRoll < 0.85 ? "neutral" : "negative") :
    type === "scandal" ? (stanceRoll < 0.70 ? "negative" : stanceRoll < 0.90 ? "neutral" : "positive") :
                         (stanceRoll < 0.45 ? "positive" : stanceRoll < 0.70 ? "neutral" : "negative");

  const basePos = { repDelta: Math.round(3 * aud), fansDelta: Math.round(250 * aud), duration: 2 };
  const baseNeg = { repDelta: -Math.round(4 * aud), fansDelta: -Math.round(300 * aud), duration: 2 };
  const baseNeu = { repDelta: 0, fansDelta: Math.round(50 * aud), duration: 1 };

  const typeLabels: Record<InfluencerType, string> = {
    tech: "tech especializado", entertainer: "entertainer", controversial: "polémico",
    trusted: "jornalista de confiança", niche: "criador de nicho", megastar: "megaestrela",
  };
  const label = typeLabels[infType];

  let title: string;
  let body: string;
  let effects: { repDelta: number; fansDelta: number; duration: number };

  if (stance === "positive") {
    effects = basePos;
    title = `⭐ ${name} elogia a empresa`;
    body = `O ${label} ${name} publicou uma análise extremamente positiva. A audiência dele reagiu com entusiasmo: +${effects.fansDelta.toLocaleString()} novos fãs.`;
  } else if (stance === "negative") {
    effects = baseNeg;
    title = `🔴 ${name} critica duramente`;
    body = `O ${label} ${name} publicou um vídeo extenso criticando produtos e práticas da empresa. O impacto na comunidade foi imediato: ${effects.fansDelta.toLocaleString()} fãs.`;
  } else {
    effects = baseNeu;
    title = `📰 ${name} menciona a empresa`;
    body = `O ${label} ${name} mencionou brevemente a empresa numa análise de mercado. O efeito foi modesto mas positivo: +${effects.fansDelta.toLocaleString()} fãs.`;
  }

  // Tech influencers affect techRep, megastars affect commercialRep more
  const techRepDelta   = infType === "tech"      ? (stance === "positive" ? 4 : stance === "negative" ? -5 : 0) : 0;
  const comRepDelta    = infType === "megastar"   ? (stance === "positive" ? 5 : stance === "negative" ? -6 : 0) : 0;

  return {
    id: `inf_${type}_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
    name,
    type: infType,
    stance,
    audienceMultiplier: aud,
    repDelta:          effects.repDelta,
    fansDelta:         effects.fansDelta,
    techRepDelta,
    commercialRepDelta: comRepDelta,
    duration:          effects.duration,
    title,
    body,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MEDIA HEADLINES — dynamic press coverage
// ─────────────────────────────────────────────────────────────────────────────

export type MediaHeadlineType = "praise" | "criticism" | "neutral" | "hype" | "warning";

export type MediaHeadline = {
  type: MediaHeadlineType;
  title: string;
  body: string;
  repDelta: number;
  fansDelta?: number;
  techRepDelta?: number;
};

export const POSITIVE_HEADLINES: MediaHeadline[] = [
  { type: "praise",  title: "🏅 Imprensa elogia inovação tecnológica",  body: "A crítica especializada destacou os avanços tecnológicos da empresa como os mais significativos do ano.",        repDelta: +3, techRepDelta: +4 },
  { type: "hype",    title: "🔥 Hype máximo antes do próximo lançamento", body: "Publicações especializadas classificaram o próximo produto como 'o mais aguardado da indústria'.",              repDelta: +2, fansDelta: +150 },
  { type: "praise",  title: "🌟 Empresa premiada por práticas éticas",    body: "Uma associação do setor reconheceu as práticas laborais e ambientais da empresa com um prémio de excelência.", repDelta: +4, fansDelta: +80 },
  { type: "neutral", title: "📊 Analistas mantêm perspetiva positiva",    body: "Wall Street mantém recomendação de compra após resultados do trimestre em linha com as expectativas.",        repDelta: +1 },
];

export const NEGATIVE_HEADLINES: MediaHeadline[] = [
  { type: "criticism", title: "📉 Mercado reage mal à estratégia de preços",  body: "Comentadores de mercado criticam a nova política de preços como desconectada da realidade dos consumidores.", repDelta: -3, fansDelta: -80 },
  { type: "warning",   title: "⚠️ Jornalista levanta suspeitas sobre qualidade", body: "Artigo investigativo questiona os processos de controlo de qualidade após comparações com produtos rivais.", repDelta: -4, techRepDelta: -3 },
  { type: "criticism", title: "😤 Comunidade insatisfeita com falta de comunicação", body: "Fóruns e redes sociais expressam frustração com a ausência de atualizações sobre produtos prometidos.", repDelta: -2, fansDelta: -100 },
];

export const NEUTRAL_HEADLINES: MediaHeadline[] = [
  { type: "neutral", title: "🗞️ Empresa em destaque nas notícias do setor", body: "Publicações especializadas cobrem o crescimento da empresa como exemplo de percurso no setor.",  repDelta: +1 },
  { type: "neutral", title: "📱 Análise de mercado inclui empresa no ranking", body: "Um relatório de consultora de prestígio lista a empresa entre os principais players do mercado.", repDelta: +1, fansDelta: +40 },
];

export function pickMediaHeadline(repLevel: number): MediaHeadline {
  const roll = Math.random();
  if (repLevel >= 70) {
    return roll < 0.60
      ? POSITIVE_HEADLINES[Math.floor(Math.random() * POSITIVE_HEADLINES.length)]
      : NEUTRAL_HEADLINES[Math.floor(Math.random() * NEUTRAL_HEADLINES.length)];
  } else if (repLevel >= 40) {
    if (roll < 0.35) return POSITIVE_HEADLINES[Math.floor(Math.random() * POSITIVE_HEADLINES.length)];
    if (roll < 0.65) return NEUTRAL_HEADLINES[Math.floor(Math.random() * NEUTRAL_HEADLINES.length)];
    return NEGATIVE_HEADLINES[Math.floor(Math.random() * NEGATIVE_HEADLINES.length)];
  } else {
    return roll < 0.60
      ? NEGATIVE_HEADLINES[Math.floor(Math.random() * NEGATIVE_HEADLINES.length)]
      : NEUTRAL_HEADLINES[Math.floor(Math.random() * NEUTRAL_HEADLINES.length)];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RIVAL SCANDALS — simplified scandal events applied to rivals
// ─────────────────────────────────────────────────────────────────────────────

export type RivalScandalTemplate = {
  id: string;
  title: string;
  body: string;
  rivalRepDelta: number;
  playerOpportunity: "marketing" | "acquisition" | "none";
  opportunityText?: string;
};

export const RIVAL_SCANDALS: RivalScandalTemplate[] = [
  {
    id: "rival_toxic",
    title: "🏢 {rival} sob acusação de ambiente tóxico",
    body: "{rival} enfrenta acusações públicas de ambiente laboral abusivo. A reputação deles sofreu um golpe severo — potencial oportunidade para atrair talentos e quota de mercado.",
    rivalRepDelta: -12,
    playerOpportunity: "marketing",
    opportunityText: "Lançar marketing agressivo agora pode capturar fãs que perderam confiança na concorrência.",
  },
  {
    id: "rival_bugs",
    title: "🐛 Lançamento desastroso da {rival}",
    body: "O último produto da {rival} foi recebido com críticas devastadoras devido a bugs graves. Os fãs estão furiosos e a migração para outras plataformas está a aumentar.",
    rivalRepDelta: -10,
    playerOpportunity: "marketing",
    opportunityText: "Excelente momento para comparações diretas e promoções.",
  },
  {
    id: "rival_fraud",
    title: "💸 Suspeita de fraude financeira na {rival}",
    body: "Autoridades financeiras abriram investigação à {rival} por irregularidades contabilísticas. Investidores estão a abandonar o barco.",
    rivalRepDelta: -15,
    playerOpportunity: "acquisition",
    opportunityText: "Com a rival fragilizada, uma oferta de aquisição pode ser viável nos próximos meses.",
  },
  {
    id: "rival_data",
    title: "🔐 Vazamento de dados expõe {rival}",
    body: "Milhares de utilizadores da {rival} tiveram os seus dados expostos por falha de segurança. A confiança no rival está em mínimos históricos.",
    rivalRepDelta: -13,
    playerOpportunity: "marketing",
    opportunityText: "Campanha de segurança e privacidade pode diferenciar a vossa marca.",
  },
  {
    id: "rival_ceo",
    title: "👤 CEO da {rival} demite-se em escândalo",
    body: "O CEO da {rival} demitiu-se no meio de um escândalo que envolve comportamento impróprio e decisões questionáveis. A empresa está sem liderança clara.",
    rivalRepDelta: -8,
    playerOpportunity: "none",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SCANDAL POOL SELECTION — pick appropriate scandal given state
// ─────────────────────────────────────────────────────────────────────────────

export function pickScandal(
  year: number,
  scandalHistory: string[],
  hasConsole: boolean,
  hasReleasedGame: boolean,
  ctx?: EventValidationContext,
): ScandalDef | null {
  const eligible = ALL_SCANDALS.filter((s) => {
    // Check minYear
    if (s.minYear && year < s.minYear) return false;
    // Check requirements
    if (s.requiresConsole && !hasConsole) return false;
    if (s.requiresReleasedGame && !hasReleasedGame) return false;
    // Limit repetition (allow max 1 occurrence of same scandal per run unless maxOccurrences > 1)
    const limit = s.maxOccurrences ?? 1;
    const occurred = scandalHistory.filter((id) => id === s.id).length;
    if (occurred >= limit) return false;
    // ── Context validation ───────────────────────────────────────────────────
    if (ctx) {
      const valCat = inferScandalEventCategory(s.category);
      if (isHardBlockedEvent(valCat, ctx)) return false;
      if (!validateEventContext(valCat, ctx)) return false;
    }
    return true;
  });

  if (eligible.length === 0) return null;
  return eligible[Math.floor(Math.random() * eligible.length)];
}

// ─────────────────────────────────────────────────────────────────────────────
// PLAYER-CONTROLLED INFLUENCER HIRING
// ─────────────────────────────────────────────────────────────────────────────

export type InfluencerProfile = {
  id: InfluencerType;
  label: string;
  emoji: string;
  description: string;
  audience: string;
  cost: number;           // one-time hire cost
  durationMonths: number; // how long the campaign runs
  repBonus: number;       // reputation boost
  fanBonus: number;       // fans boost
  techRepBonus?: number;
  commercialRepBonus?: number;
  fanRepBonus?: number;
  riskTag: string;        // e.g. "Polémico" or "Seguro"
  riskColor: string;
  earlyAccessBonus?: number; // extra fans if tied to a game project
  // Scandal-defense: if a scandal fires while this influencer is active, its initial damage is reduced
  scandalDefenseChance: number; // 0-1 probability of defending player in a scandal
};

export const INFLUENCER_PROFILES: InfluencerProfile[] = [
  {
    id: "niche",
    label: "Criador de Nicho",
    emoji: "🎯",
    description: "Audiência pequena mas extremamente fiel. Ótimo para jogos especializados.",
    audience: "50K–200K seguidores",
    cost: 30_000,
    durationMonths: 2,
    repBonus: 2,
    fanBonus: 180,
    fanRepBonus: 4,
    riskTag: "Baixo Risco",
    riskColor: "#43A047",
    earlyAccessBonus: 120,
    scandalDefenseChance: 0.15,
  },
  {
    id: "tech",
    label: "Tech Especializado",
    emoji: "💻",
    description: "Criador técnico com audiência de entusiastas. Revisa hardware com rigor.",
    audience: "200K–800K seguidores",
    cost: 80_000,
    durationMonths: 2,
    repBonus: 4,
    fanBonus: 350,
    techRepBonus: 6,
    riskTag: "Seguro",
    riskColor: "#1E88E5",
    earlyAccessBonus: 250,
    scandalDefenseChance: 0.25,
  },
  {
    id: "entertainer",
    label: "Entertainer",
    emoji: "🎮",
    description: "Grande audiência casual. Gera hype massivo mas pouco aprofundamento técnico.",
    audience: "1M–5M seguidores",
    cost: 150_000,
    durationMonths: 3,
    repBonus: 3,
    fanBonus: 900,
    commercialRepBonus: 4,
    riskTag: "Médio Risco",
    riskColor: "#FB8C00",
    earlyAccessBonus: 600,
    scandalDefenseChance: 0.20,
  },
  {
    id: "trusted",
    label: "Jornalista de Confiança",
    emoji: "📰",
    description: "Jornalista veterano com credibilidade máxima. Impacto duradouro na reputação.",
    audience: "500K–2M seguidores",
    cost: 180_000,
    durationMonths: 3,
    repBonus: 7,
    fanBonus: 500,
    techRepBonus: 4,
    commercialRepBonus: 5,
    fanRepBonus: 5,
    riskTag: "Muito Seguro",
    riskColor: "#43A047",
    earlyAccessBonus: 400,
    scandalDefenseChance: 0.55,
  },
  {
    id: "controversial",
    label: "Criador Polémico",
    emoji: "🔥",
    description: "Audiência enorme e engajamento explosivo. Pode viralizar tudo — para o bem ou mal.",
    audience: "2M–10M seguidores",
    cost: 250_000,
    durationMonths: 2,
    repBonus: 1,
    fanBonus: 1800,
    riskTag: "ALTO RISCO",
    riskColor: "#E53935",
    earlyAccessBonus: 1200,
    scandalDefenseChance: 0.05, // quase nunca defende
  },
  {
    id: "megastar",
    label: "Megaestrela",
    emoji: "⭐",
    description: "Celebridade global. Transforma qualquer produto em fenómeno cultural.",
    audience: "+10M seguidores",
    cost: 600_000,
    durationMonths: 4,
    repBonus: 8,
    fanBonus: 4000,
    commercialRepBonus: 8,
    fanRepBonus: 6,
    riskTag: "Premium",
    riskColor: "#F5A623",
    earlyAccessBonus: 2500,
    scandalDefenseChance: 0.35,
  },
];

// Active hired influencer campaign (stored in game state)
export type HiredInfluencer = {
  profileId: InfluencerType;
  name: string;
  hiredYear: number;
  hiredMonth: number;
  monthsLeft: number;
  linkedGameId?: string; // project ID if early access was sent
  totalFansDelivered: number;
};

// Cooldown per profile type: can't rehire same type within X months
export const INFLUENCER_COOLDOWN_MONTHS: Record<InfluencerType, number> = {
  niche:         3,
  tech:          4,
  entertainer:   5,
  trusted:       6,
  controversial: 8,
  megastar:      10,
};

// Return months since last hire of a given profile type (Infinity if never hired)
export function getInfluencerCooldownLeft(
  profileId: InfluencerType,
  hiredInfluencers: HiredInfluencer[],
  currentYear: number,
  currentMonth: number,
): number {
  const lastHire = hiredInfluencers
    .filter((h) => h.profileId === profileId)
    .sort((a, b) => (b.hiredYear * 12 + b.hiredMonth) - (a.hiredYear * 12 + a.hiredMonth))[0];
  if (!lastHire) return 0;
  const monthsAgo = (currentYear - lastHire.hiredYear) * 12 + (currentMonth - lastHire.hiredMonth);
  const cooldown  = INFLUENCER_COOLDOWN_MONTHS[profileId];
  return Math.max(0, cooldown - monthsAgo);
}
