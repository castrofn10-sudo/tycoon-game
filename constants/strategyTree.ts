import { RESEARCH_EXPANSION } from "./strategyTreeExpansion";
import { computeSpecialization, getSpecializationBonuses } from "./specialization";
import { EXCLUSIVE_TECHS } from "./exclusiveTech";
import { RESEARCH_COMBOS } from "./researchCombos";

export type ResearchCategory = "design" | "tech" | "hardware" | "games" | "business" | "online" | "innovation" | "silicon" | "engines" | "audio";
export type ResearchPath = "A" | "B" | "C";
export type ResearchTier = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type NodeBonus = {
  ratingBonus?: number;
  salesMult?: number;
  costMult?: number;
  campaignMult?: number;
  repBonus?: number;
  fansBonus?: number;
  riskMod?: number;
  gameRevMult?: number;
};

export type ResearchNode = {
  id: string;
  category: ResearchCategory;
  path: ResearchPath;
  pathName: string;
  tier: ResearchTier;
  name: string;
  description: string;
  effectLabel: string;
  cost: number;
  timeMonths: number;
  requires: string[];
  bonus: NodeBonus;
  riskLabel?: string;
  synergyId?: string;
  synergyLabel?: string;
  minYear?: number;
};

export const RESEARCH_NODES: ResearchNode[] = [
  // ────────────────────────────────────────
  // DESIGN — A: Minimalista
  // ────────────────────────────────────────
  {
    id: "design_A1", category: "design", path: "A", pathName: "Minimalista", tier: 1,
    name: "Design Limpo", description: "Interface epurada que reduz custos e aumenta acessibilidade.",
    effectLabel: "-15% custo produção, +5% popularidade", cost: 80_000, timeMonths: 2,
    requires: [], bonus: { costMult: 0.85, fansBonus: 200 },
  },
  {
    id: "design_A2", category: "design", path: "A", pathName: "Minimalista", tier: 2,
    name: "Interface Intuitiva", description: "UX amigável que converte mais usuários casuais.",
    effectLabel: "+0.4 rating, +8% vendas", cost: 180_000, timeMonths: 3,
    requires: ["design_A1"], bonus: { ratingBonus: 0.4, salesMult: 1.08 },
  },
  {
    id: "design_A3", category: "design", path: "A", pathName: "Minimalista", tier: 3,
    name: "Ícone Cultural", description: "O console se torna símbolo de uma geração.",
    effectLabel: "+25% fãs, +10 reputação", cost: 500_000, timeMonths: 6,
    requires: ["design_A2"], bonus: { fansBonus: 3000, repBonus: 10 },
    synergyId: "business_A3", synergyLabel: "Com Campanha Viral: +50% spike de vendas",
  },
  // ────────────────────────────────────────
  // DESIGN — B: Premium
  // ────────────────────────────────────────
  {
    id: "design_B1", category: "design", path: "B", pathName: "Premium", tier: 1,
    name: "Materiais Premium", description: "Liga de alumínio, vidro temperado e acabamentos de alta qualidade.",
    effectLabel: "+20% qualidade percebida, +15% preço tolerado", cost: 120_000, timeMonths: 3,
    requires: [], bonus: { ratingBonus: 0.5, costMult: 1.12 },
  },
  {
    id: "design_B2", category: "design", path: "B", pathName: "Premium", tier: 2,
    name: "Acabamento Luxo", description: "Detalhes artesanais que justificam preços elevados.",
    effectLabel: "+0.6 rating, +5 reputação", cost: 300_000, timeMonths: 4,
    requires: ["design_B1"], bonus: { ratingBonus: 0.6, repBonus: 5 },
  },
  {
    id: "design_B3", category: "design", path: "B", pathName: "Premium", tier: 3,
    name: "Coleção de Elite", description: "Edições limitadas exclusivas para colecionadores.",
    effectLabel: "+30% margem de lucro, +15 reputação", cost: 800_000, timeMonths: 5,
    requires: ["design_B2"], bonus: { salesMult: 1.15, repBonus: 15, costMult: 0.92 },
    synergyId: "hardware_A3", synergyLabel: "Com Supercomputador: bundle premium +40%",
  },
  // ────────────────────────────────────────
  // DESIGN — C: Futurista
  // ────────────────────────────────────────
  {
    id: "design_C1", category: "design", path: "C", pathName: "Futurista", tier: 1,
    name: "Conceito Visionário", description: "Design radical que divide opiniões mas cria evangelistas.",
    effectLabel: "+1 rating, risco de recepção mista", cost: 150_000, timeMonths: 3,
    requires: [], bonus: { ratingBonus: 1.0, riskMod: 1.15 },
    riskLabel: "+15% chance de evento negativo",
  },
  {
    id: "design_C2", category: "design", path: "C", pathName: "Futurista", tier: 2,
    name: "Tecnologia Experimental", description: "Hologramas, haptic avançado, interface por gestos.",
    effectLabel: "+1.2 rating, risco de bugs no lançamento", cost: 400_000, timeMonths: 5,
    requires: ["design_C1"], bonus: { ratingBonus: 1.2, riskMod: 1.25 },
    riskLabel: "+25% chance de bug no lançamento",
  },
  {
    id: "design_C3", category: "design", path: "C", pathName: "Futurista", tier: 3,
    name: "Paradigma Novo", description: "O console define uma nova categoria de produto.",
    effectLabel: "+2 rating, +40% vendas longo prazo", cost: 1_200_000, timeMonths: 8,
    requires: ["design_C2"], bonus: { ratingBonus: 2.0, salesMult: 1.4, riskMod: 1.3 },
    synergyId: "tech_C3", synergyLabel: "Com Tecnologia do Futuro: combo lendário +3 rating",
  },

  // ────────────────────────────────────────
  // TECH — A: Performance
  // ────────────────────────────────────────
  {
    id: "tech_A1", category: "tech", path: "A", pathName: "Performance", tier: 1,
    name: "CPUs Overclock", description: "Processadores operando no limite para performance máxima.",
    effectLabel: "+0.5 rating, +10% custo produção", cost: 100_000, timeMonths: 2,
    requires: [], bonus: { ratingBonus: 0.5, costMult: 1.1 },
  },
  {
    id: "tech_A2", category: "tech", path: "A", pathName: "Performance", tier: 2,
    name: "GPU de Ponta", description: "Placa gráfica dedicada de última geração.",
    effectLabel: "+0.8 rating, +15% custo", cost: 250_000, timeMonths: 4,
    requires: ["tech_A1"], bonus: { ratingBonus: 0.8, costMult: 1.15 },
  },
  {
    id: "tech_A3", category: "tech", path: "A", pathName: "Performance", tier: 3,
    name: "Arquitetura Proprietária", description: "Chip custom desenvolvido internamente.",
    effectLabel: "+1.5 rating, +12% custo, +20% reputação", cost: 2_000_000, timeMonths: 10,
    requires: ["tech_A2"], bonus: { ratingBonus: 1.5, costMult: 1.12, repBonus: 20 },
    synergyId: "hardware_A3", synergyLabel: "Com Supercomputador: +2.5 rating total",
  },
  // ────────────────────────────────────────
  // TECH — B: Eficiência
  // ────────────────────────────────────────
  {
    id: "tech_B1", category: "tech", path: "B", pathName: "Eficiência", tier: 1,
    name: "Otimização de Código", description: "Software otimizado reduz exigências de hardware.",
    effectLabel: "-12% custo de produção", cost: 70_000, timeMonths: 2,
    requires: [], bonus: { costMult: 0.88 },
  },
  {
    id: "tech_B2", category: "tech", path: "B", pathName: "Eficiência", tier: 2,
    name: "Chips Integrados", description: "SoC que combina CPU+GPU num único chip de baixo custo.",
    effectLabel: "-18% custo, -0.2 rating", cost: 200_000, timeMonths: 3,
    requires: ["tech_B1"], bonus: { costMult: 0.82, ratingBonus: -0.2 },
  },
  {
    id: "tech_B3", category: "tech", path: "B", pathName: "Eficiência", tier: 3,
    name: "SoC Eficiente", description: "Chip 100% eficiente fabricado para a sua empresa.",
    effectLabel: "-30% custo total, +10% margem", cost: 900_000, timeMonths: 7,
    requires: ["tech_B2"], bonus: { costMult: 0.7, salesMult: 1.1 },
    synergyId: "design_A3", synergyLabel: "Com Ícone Cultural: custo total -40%",
  },
  // ────────────────────────────────────────
  // TECH — C: Inovação
  // ────────────────────────────────────────
  {
    id: "tech_C1", category: "tech", path: "C", pathName: "Inovação", tier: 1,
    name: "R&D Avançado", description: "Laboratório dedicado a pesquisas de próxima geração.",
    effectLabel: "+0.3 rating/ano, desbloqueios futuros", cost: 200_000, timeMonths: 3,
    requires: [], bonus: { ratingBonus: 0.3 },
  },
  {
    id: "tech_C2", category: "tech", path: "C", pathName: "Inovação", tier: 2,
    name: "Protótipo Disruptivo", description: "Tecnologia que não existe ainda no mercado.",
    effectLabel: "+1 rating, 20% chance de bugs", cost: 600_000, timeMonths: 6,
    requires: ["tech_C1"], bonus: { ratingBonus: 1.0, riskMod: 1.2 },
    riskLabel: "+20% risco de bugs no lançamento",
  },
  {
    id: "tech_C3", category: "tech", path: "C", pathName: "Inovação", tier: 3,
    name: "Tecnologia do Futuro", description: "10 anos à frente da concorrência.",
    effectLabel: "+2 rating, alta volatilidade", cost: 2_200_000, timeMonths: 9,
    requires: ["tech_C2"], bonus: { ratingBonus: 2.0, riskMod: 1.35, salesMult: 1.3 },
    riskLabel: "+35% chance de eventos de crise",
    synergyId: "design_C3", synergyLabel: "Com Paradigma Novo: combo lendário",
  },

  // ────────────────────────────────────────
  // HARDWARE — A: Potência
  // ────────────────────────────────────────
  {
    id: "hw_A1", category: "hardware", path: "A", pathName: "Potência", tier: 1,
    name: "Processador Dedicado", description: "CPU específico para jogos de alto desempenho.",
    effectLabel: "+0.4 rating em consoles high-end", cost: 90_000, timeMonths: 2,
    requires: [], bonus: { ratingBonus: 0.4 },
  },
  {
    id: "hw_A2", category: "hardware", path: "A", pathName: "Potência", tier: 2,
    name: "Cooling System Avançado", description: "Refrigeração líquida silenciosa que permite overclocking.",
    effectLabel: "+0.6 rating, +5% custo", cost: 220_000, timeMonths: 3,
    requires: ["hw_A1"], bonus: { ratingBonus: 0.6, costMult: 1.05 },
  },
  {
    id: "hw_A3", category: "hardware", path: "A", pathName: "Potência", tier: 3,
    name: "Supercomputador de Mesa", description: "O console mais poderoso da história.",
    effectLabel: "+1.5 rating, +20% vendas premium", cost: 1_500_000, timeMonths: 9,
    requires: ["hw_A2"], bonus: { ratingBonus: 1.5, salesMult: 1.2 },
  },
  // ────────────────────────────────────────
  // HARDWARE — B: Portabilidade
  // ────────────────────────────────────────
  {
    id: "hw_B1", category: "hardware", path: "B", pathName: "Portabilidade", tier: 1,
    name: "Design Compacto", description: "Console que cabe no bolso sem perder qualidade.",
    effectLabel: "+15% vendas, acesso ao mercado mobile", cost: 80_000, timeMonths: 2,
    requires: [], bonus: { salesMult: 1.15, fansBonus: 500 },
  },
  {
    id: "hw_B2", category: "hardware", path: "B", pathName: "Portabilidade", tier: 2,
    name: "Bateria Estendida", description: "20 horas de autonomia com uso intenso.",
    effectLabel: "+20% satisfação, +10% fãs mobile", cost: 200_000, timeMonths: 3,
    requires: ["hw_B1"], bonus: { salesMult: 1.1, fansBonus: 1000, repBonus: 5 },
  },
  {
    id: "hw_B3", category: "hardware", path: "B", pathName: "Portabilidade", tier: 3,
    name: "Handheld Premium", description: "Cria um segmento de mercado inteiramente novo.",
    effectLabel: "+35% vendas totais, novo público", cost: 1_000_000, timeMonths: 8,
    requires: ["hw_B2"], bonus: { salesMult: 1.35, fansBonus: 5000, repBonus: 10 },
    synergyId: "games_B3", synergyLabel: "Com Gameplay Viciante: +50% retenção mobile",
  },
  // ────────────────────────────────────────
  // HARDWARE — C: Durabilidade
  // ────────────────────────────────────────
  {
    id: "hw_C1", category: "hardware", path: "C", pathName: "Durabilidade", tier: 1,
    name: "Componentes Industriais", description: "Materiais certificados para resistência extrema.",
    effectLabel: "-20% chance de defeito, +8% reputação", cost: 100_000, timeMonths: 2,
    requires: [], bonus: { riskMod: 0.8, repBonus: 8 },
  },
  {
    id: "hw_C2", category: "hardware", path: "C", pathName: "Durabilidade", tier: 2,
    name: "Garantia Estendida", description: "5 anos de garantia que gera confiança e lealdade.",
    effectLabel: "+12 reputação, +10% retenção de fãs", cost: 250_000, timeMonths: 3,
    requires: ["hw_C1"], bonus: { repBonus: 12, fansBonus: 1500 },
  },
  {
    id: "hw_C3", category: "hardware", path: "C", pathName: "Durabilidade", tier: 3,
    name: "Legado Duradouro", description: "Console projetado para durar décadas, criando legado de marca.",
    effectLabel: "+25% vendas longo prazo, -25% risco", cost: 800_000, timeMonths: 6,
    requires: ["hw_C2"], bonus: { salesMult: 1.25, riskMod: 0.75, repBonus: 20 },
  },

  // ────────────────────────────────────────
  // GAMES — A: Narrativa
  // ────────────────────────────────────────
  {
    id: "games_A1", category: "games", path: "A", pathName: "Narrativa", tier: 1,
    name: "Roteiristas Contratados", description: "Escritores renomados criam histórias épicas.",
    effectLabel: "+20% qualidade dos jogos internos", cost: 120_000, timeMonths: 2,
    requires: [], bonus: { gameRevMult: 1.2 },
  },
  {
    id: "games_A2", category: "games", path: "A", pathName: "Narrativa", tier: 2,
    name: "Universo Expandido", description: "Franquias com lore profundo criam fãs dedicados.",
    effectLabel: "+35% receita de jogos, +10% fãs", cost: 350_000, timeMonths: 4,
    requires: ["games_A1"], bonus: { gameRevMult: 1.35, fansBonus: 2000 },
  },
  {
    id: "games_A3", category: "games", path: "A", pathName: "Narrativa", tier: 3,
    name: "Obra-Prima Narrativa", description: "Jogo premiado que eleva toda a indústria.",
    effectLabel: "+20 reputação, +50% receita de jogos", cost: 1_000_000, timeMonths: 8,
    requires: ["games_A2"], bonus: { repBonus: 20, gameRevMult: 1.5 },
    synergyId: "design_B3", synergyLabel: "Com Coleção de Elite: edição especial coletora",
  },
  // ────────────────────────────────────────
  // GAMES — B: Gameplay
  // ────────────────────────────────────────
  {
    id: "games_B1", category: "games", path: "B", pathName: "Gameplay", tier: 1,
    name: "Mecânicas Refinadas", description: "Loop de gameplay polido que vicia desde o primeiro minuto.",
    effectLabel: "+15% vendas de jogos, +5% retenção", cost: 100_000, timeMonths: 2,
    requires: [], bonus: { gameRevMult: 1.15, salesMult: 1.05 },
  },
  {
    id: "games_B2", category: "games", path: "B", pathName: "Gameplay", tier: 2,
    name: "Sistema de Progressão", description: "RPG elements e rewards que mantêm players engajados.",
    effectLabel: "+25% receita de jogos, +8% vendas console", cost: 280_000, timeMonths: 4,
    requires: ["games_B1"], bonus: { gameRevMult: 1.25, salesMult: 1.08 },
  },
  {
    id: "games_B3", category: "games", path: "B", pathName: "Gameplay", tier: 3,
    name: "Gameplay Viciante", description: "Títulos que definem gerações inteiras de jogadores.",
    effectLabel: "+40% receita, +15% vendas console", cost: 750_000, timeMonths: 7,
    requires: ["games_B2"], bonus: { gameRevMult: 1.4, salesMult: 1.15, fansBonus: 3000 },
    synergyId: "hw_B3", synergyLabel: "Com Handheld Premium: experiência perfeita mobile",
  },
  // ────────────────────────────────────────
  // GAMES — C: Áudio
  // ────────────────────────────────────────
  {
    id: "games_C1", category: "games", path: "C", pathName: "Áudio", tier: 1,
    name: "Trilha Orquestral", description: "Música ao vivo gravada com orquestra sinfônica.",
    effectLabel: "+15% qualidade percebida dos jogos", cost: 90_000, timeMonths: 2,
    requires: [], bonus: { gameRevMult: 1.15, repBonus: 3 },
  },
  {
    id: "games_C2", category: "games", path: "C", pathName: "Áudio", tier: 2,
    name: "Sound Design Imersivo", description: "Áudio binaural 3D que cria presença total.",
    effectLabel: "+25% reviews positivas, +10 reputação", cost: 250_000, timeMonths: 3,
    requires: ["games_C1"], bonus: { gameRevMult: 1.25, repBonus: 10 },
  },
  {
    id: "games_C3", category: "games", path: "C", pathName: "Áudio", tier: 3,
    name: "Experiência Auditiva Total", description: "O padrão de áudio da indústria para décadas.",
    effectLabel: "+20 reputação, +30% receita de jogos", cost: 600_000, timeMonths: 6,
    requires: ["games_C2"], bonus: { repBonus: 20, gameRevMult: 1.3 },
  },

  // ────────────────────────────────────────
  // BUSINESS — A: Marketing
  // ────────────────────────────────────────
  {
    id: "biz_A1", category: "business", path: "A", pathName: "Marketing", tier: 1,
    name: "Análise de Mercado", description: "Dados precisos sobre seu público para campanhas certeiras.",
    effectLabel: "+20% eficiência de campanhas", cost: 60_000, timeMonths: 1,
    requires: [], bonus: { campaignMult: 1.2 },
  },
  {
    id: "biz_A2", category: "business", path: "A", pathName: "Marketing", tier: 2,
    name: "Parceria com Influencers", description: "Criadores de conteúdo promovem seus produtos autenticamente.",
    effectLabel: "+35% eficiência, +10% fãs por campanha", cost: 180_000, timeMonths: 3,
    requires: ["biz_A1"], bonus: { campaignMult: 1.35, fansBonus: 1000 },
  },
  {
    id: "biz_A3", category: "business", path: "A", pathName: "Marketing", tier: 3,
    name: "Campanha Viral", description: "Estratégias de marketing orgânico que explodem nas redes.",
    effectLabel: "+60% eficiência, spike de fãs enorme", cost: 500_000, timeMonths: 5,
    requires: ["biz_A2"], bonus: { campaignMult: 1.6, fansBonus: 5000 },
    synergyId: "design_A3", synergyLabel: "Com Ícone Cultural: campanha +100% alcance",
  },
  // ────────────────────────────────────────
  // BUSINESS — B: Contratos
  // ────────────────────────────────────────
  {
    id: "biz_B1", category: "business", path: "B", pathName: "Contratos", tier: 1,
    name: "Contratos de Distribuição", description: "Acordos com distribuidores globais aumentam alcance.",
    effectLabel: "+20% alcance de mercado, +10% vendas", cost: 100_000, timeMonths: 2,
    requires: [], bonus: { salesMult: 1.1 },
  },
  {
    id: "biz_B2", category: "business", path: "B", pathName: "Contratos", tier: 2,
    name: "Exclusividade Temporal", description: "Títulos exclusivos por 6 meses impulsionam vendas de console.",
    effectLabel: "+25% vendas no período de exclusividade", cost: 400_000, timeMonths: 4,
    requires: ["biz_B1"], bonus: { salesMult: 1.25, gameRevMult: 1.2 },
  },
  {
    id: "biz_B3", category: "business", path: "B", pathName: "Contratos", tier: 3,
    name: "Parceria Estratégica", description: "Joint ventures com grandes publishers e fabricantes.",
    effectLabel: "+40% receita total, -15% custos operacionais", cost: 1_200_000, timeMonths: 8,
    requires: ["biz_B2"], bonus: { salesMult: 1.4, costMult: 0.85, gameRevMult: 1.3 },
  },
  // ────────────────────────────────────────
  // BUSINESS — C: Loja
  // ────────────────────────────────────────
  {
    id: "biz_C1", category: "business", path: "C", pathName: "Loja Digital", tier: 1,
    name: "Loja Digital Própria", description: "Plataforma de venda direta sem intermediários.",
    effectLabel: "+15% receita de jogos, sem comissão", cost: 150_000, timeMonths: 3,
    requires: [], bonus: { gameRevMult: 1.15 },
  },
  {
    id: "biz_C2", category: "business", path: "C", pathName: "Loja Digital", tier: 2,
    name: "Subscrição de Jogos", description: "Modelo de assinatura mensal com catálogo crescente.",
    effectLabel: "+30% receita recorrente de jogos", cost: 500_000, timeMonths: 5,
    requires: ["biz_C1"], bonus: { gameRevMult: 1.3, fansBonus: 2000 },
  },
  {
    id: "biz_C3", category: "business", path: "C", pathName: "Loja Digital", tier: 3,
    name: "Ecossistema Fechado", description: "Plataforma completa: loja, nuvem, comunidade.",
    effectLabel: "+50% receita, +20 reputação, fidelização total", cost: 1_800_000, timeMonths: 9,
    requires: ["biz_C2"], bonus: { gameRevMult: 1.5, repBonus: 20, salesMult: 1.2 },
    synergyId: "games_B3", synergyLabel: "Com Gameplay Viciante: ecossistema perfeito",
  },

  // ────────────────────────────────────────
  // ONLINE — A: Multiplayer
  // ────────────────────────────────────────
  {
    id: "online_A1", category: "online", path: "A", pathName: "Multiplayer", tier: 1,
    name: "Multijogador Local", description: "Suporte completo para co-op e versus na mesma tela.",
    effectLabel: "+15% receita de jogos, +5% vendas", cost: 90_000, timeMonths: 2,
    requires: [], bonus: { gameRevMult: 1.15, salesMult: 1.05 },
  },
  {
    id: "online_A2", category: "online", path: "A", pathName: "Multiplayer", tier: 2,
    name: "Multijogador Online", description: "Infraestrutura de servidores para partidas online globais.",
    effectLabel: "+30% receita de jogos, +10% vendas, +2k fãs", cost: 300_000, timeMonths: 4,
    requires: ["online_A1"], bonus: { gameRevMult: 1.3, salesMult: 1.1, fansBonus: 2000 },
  },
  {
    id: "online_A3", category: "online", path: "A", pathName: "Multiplayer", tier: 3,
    name: "Esports & Torneios", description: "Plataforma oficial de competições com premiações.",
    effectLabel: "+20 reputação, +50% receita, +10k fãs", cost: 1_500_000, timeMonths: 8,
    requires: ["online_A2"], bonus: { repBonus: 20, gameRevMult: 1.5, fansBonus: 10000 },
    synergyId: "biz_A3", synergyLabel: "Com Campanha Viral: torneios viralizados +80%",
  },

  // ────────────────────────────────────────
  // ONLINE — B: Infraestrutura
  // ────────────────────────────────────────
  {
    id: "online_B1", category: "online", path: "B", pathName: "Infraestrutura", tier: 1,
    name: "Anti-Cheat Básico", description: "Sistema de detecção de trapaças reduz abandono de jogadores.",
    effectLabel: "+8 reputação, -15% risco de eventos negativos", cost: 70_000, timeMonths: 2,
    requires: [], bonus: { repBonus: 8, riskMod: 0.85 },
  },
  {
    id: "online_B2", category: "online", path: "B", pathName: "Infraestrutura", tier: 2,
    name: "Servidores Globais", description: "Data centers em 5 regiões garantem latência mínima.",
    effectLabel: "+25% receita online, +12 reputação", cost: 500_000, timeMonths: 5,
    requires: ["online_B1"], bonus: { gameRevMult: 1.25, repBonus: 12 },
  },
  {
    id: "online_B3", category: "online", path: "B", pathName: "Infraestrutura", tier: 3,
    name: "Cloud Gaming", description: "Jogue instantaneamente em qualquer dispositivo — sem hardware.",
    effectLabel: "+40% receita, +20% vendas, elimina barreiras de entrada", cost: 2_000_000, timeMonths: 10,
    requires: ["online_B2"], bonus: { gameRevMult: 1.4, salesMult: 1.2, fansBonus: 5000 },
    synergyId: "tech_C3", synergyLabel: "Com Tecnologia do Futuro: streaming perfeito",
  },

  // ────────────────────────────────────────
  // ONLINE — C: Comunidade
  // ────────────────────────────────────────
  {
    id: "online_C1", category: "online", path: "C", pathName: "Comunidade", tier: 1,
    name: "Perfis e Conquistas", description: "Sistema de troféus e perfil público aumentam engajamento.",
    effectLabel: "+10% fidelização, +5% receita de jogos", cost: 60_000, timeMonths: 2,
    requires: [], bonus: { gameRevMult: 1.05, fansBonus: 500 },
  },
  {
    id: "online_C2", category: "online", path: "C", pathName: "Comunidade", tier: 2,
    name: "Loja de Conteúdo", description: "DLCs, skins e expansões vendidas diretamente na plataforma.",
    effectLabel: "+35% receita de jogos, +2k fãs", cost: 400_000, timeMonths: 5,
    requires: ["online_C1"], bonus: { gameRevMult: 1.35, fansBonus: 2000 },
  },
  {
    id: "online_C3", category: "online", path: "C", pathName: "Comunidade", tier: 3,
    name: "Metaverso Proprietário", description: "Mundo virtual persistente integrado à sua plataforma.",
    effectLabel: "+25 reputação, +50% receita, +15k fãs", cost: 3_000_000, timeMonths: 11,
    requires: ["online_C2"], bonus: { repBonus: 25, gameRevMult: 1.5, fansBonus: 15000, salesMult: 1.25 },
    synergyId: "biz_C3", synergyLabel: "Com Ecossistema Fechado: plataforma total",
  },

  // ────────────────────────────────────────
  // INNOVATION — A: VR / AR
  // ────────────────────────────────────────
  {
    id: "innov_A1", category: "innovation", path: "A", pathName: "VR / AR", tier: 1,
    name: "VR Básico", description: "Suporte a headsets de entrada para experiências imersivas.",
    effectLabel: "+0.8 rating, +15% receita de jogos", cost: 200_000, timeMonths: 4,
    requires: [], bonus: { ratingBonus: 0.8, gameRevMult: 1.15 },
  },
  {
    id: "innov_A2", category: "innovation", path: "A", pathName: "VR / AR", tier: 2,
    name: "VR Premium", description: "Eye-tracking, 120fps e haptic suit suportados nativamente.",
    effectLabel: "+1.5 rating, +25% vendas, +10 reputação", cost: 800_000, timeMonths: 7,
    requires: ["innov_A1"], bonus: { ratingBonus: 1.5, salesMult: 1.25, repBonus: 10 },
  },
  {
    id: "innov_A3", category: "innovation", path: "A", pathName: "VR / AR", tier: 3,
    name: "AR Espacial", description: "Mixed reality sem headset — projeção holográfica ambiental.",
    effectLabel: "+2.5 rating, +40% receita, +20 reputação", cost: 3_000_000, timeMonths: 10,
    requires: ["innov_A2"], bonus: { ratingBonus: 2.5, gameRevMult: 1.4, repBonus: 20 },
    synergyId: "design_C3", synergyLabel: "Com Paradigma Novo: experiência inesquecível",
  },

  // ────────────────────────────────────────
  // INNOVATION — B: IA
  // ────────────────────────────────────────
  {
    id: "innov_B1", category: "innovation", path: "B", pathName: "IA nos Jogos", tier: 1,
    name: "IA de NPCs", description: "Personagens com comportamento adaptativo e diálogos naturais.",
    effectLabel: "+20% receita de jogos, +5 reputação", cost: 150_000, timeMonths: 3,
    requires: [], bonus: { gameRevMult: 1.2, repBonus: 5 },
  },
  {
    id: "innov_B2", category: "innovation", path: "B", pathName: "IA nos Jogos", tier: 2,
    name: "IA Adaptativa", description: "O jogo aprende o estilo do jogador e ajusta dificuldade em tempo real.",
    effectLabel: "+35% receita de jogos, +15% vendas, +8 reputação", cost: 600_000, timeMonths: 6,
    requires: ["innov_B1"], bonus: { gameRevMult: 1.35, salesMult: 1.15, repBonus: 8 },
  },
  {
    id: "innov_B3", category: "innovation", path: "B", pathName: "IA nos Jogos", tier: 3,
    name: "IA Generativa", description: "Mundos, missões e personagens criados em tempo real pela IA.",
    effectLabel: "+20 reputação, +50% receita, +20k fãs", cost: 2_500_000, timeMonths: 10,
    requires: ["innov_B2"], bonus: { repBonus: 20, gameRevMult: 1.5, fansBonus: 20000 },
    synergyId: "innov_C3", synergyLabel: "Com Geração Procedural Total: universo infinito",
  },

  // ────────────────────────────────────────
  // INNOVATION — C: Procedural
  // ────────────────────────────────────────
  {
    id: "innov_C1", category: "innovation", path: "C", pathName: "Procedural", tier: 1,
    name: "Geração de Mapas", description: "Níveis e mundos gerados algoritmicamente — replay infinito.",
    effectLabel: "+15% receita de jogos, +3k fãs", cost: 120_000, timeMonths: 3,
    requires: [], bonus: { gameRevMult: 1.15, fansBonus: 3000 },
  },
  {
    id: "innov_C2", category: "innovation", path: "C", pathName: "Procedural", tier: 2,
    name: "Mundos Infinitos", description: "Ecossistemas procedurais com física simulada e histórias emergentes.",
    effectLabel: "+30% receita de jogos, +5k fãs, +10 reputação", cost: 700_000, timeMonths: 7,
    requires: ["innov_C1"], bonus: { gameRevMult: 1.3, fansBonus: 5000, repBonus: 10 },
  },
  {
    id: "innov_C3", category: "innovation", path: "C", pathName: "Procedural", tier: 3,
    name: "Geração Procedural Total", description: "O jogo cria a si mesmo — narrativa, arte e som gerados.",
    effectLabel: "+25 reputação, +45% receita, +30k fãs", cost: 3_000_000, timeMonths: 11,
    requires: ["innov_C2"], bonus: { repBonus: 25, gameRevMult: 1.45, fansBonus: 30000, salesMult: 1.2 },
    synergyId: "innov_B3", synergyLabel: "Com IA Generativa: universo infinito",
  },

  // ════════════════════════════════════════
  // SILICON — A: Arquitetura CPU
  // ════════════════════════════════════════
  {
    id: "sil_A1", category: "silicon", path: "A", pathName: "Arquitetura CPU", tier: 1,
    name: "CPU 8-bit", description: "Processador de 8 bits para os primeiros consoles domésticos. A base de tudo.",
    effectLabel: "+0.3 rating, desbloqueio de era 8-bit", cost: 50_000, timeMonths: 2,
    requires: [], bonus: { ratingBonus: 0.3 },
  },
  {
    id: "sil_A2", category: "silicon", path: "A", pathName: "Arquitetura CPU", tier: 2,
    name: "CPU 16-bit", description: "Processadores de 16 bits com capacidade gráfica e sonora muito superior.",
    effectLabel: "+0.6 rating, +10% vendas", cost: 180_000, timeMonths: 3,
    requires: ["sil_A1"], bonus: { ratingBonus: 0.6, salesMult: 1.1 },
  },
  {
    id: "sil_A3", category: "silicon", path: "A", pathName: "Arquitetura CPU", tier: 3,
    name: "CPU 32/64-bit Multi-Core", description: "Arquitetura moderna de 32/64 bits com múltiplos núcleos para games complexos.",
    effectLabel: "+1.2 rating, +20% vendas, +8 reputação", cost: 600_000, timeMonths: 5,
    requires: ["sil_A2"], bonus: { ratingBonus: 1.2, salesMult: 1.2, repBonus: 8 },
    synergyId: "engines_B2", synergyLabel: "Com Renderização 3D: plataforma perfeita para 3D",
  },

  // ════════════════════════════════════════
  // SILICON — B: GPU & Gráficos
  // ════════════════════════════════════════
  {
    id: "sil_B1", category: "silicon", path: "B", pathName: "GPU & Gráficos", tier: 1,
    name: "2D Sprite Engine", description: "Chip dedicado para renderizar sprites 2D coloridos em alta velocidade.",
    effectLabel: "+0.4 rating, +8% vendas", cost: 70_000, timeMonths: 2,
    requires: [], bonus: { ratingBonus: 0.4, salesMult: 1.08 },
  },
  {
    id: "sil_B2", category: "silicon", path: "B", pathName: "GPU & Gráficos", tier: 2,
    name: "GPU 3D Acelerada", description: "Placa gráfica dedicada para polígonos 3D texturizados em tempo real.",
    effectLabel: "+0.9 rating, +15% vendas, +5 reputação", cost: 300_000, timeMonths: 4,
    requires: ["sil_B1"], bonus: { ratingBonus: 0.9, salesMult: 1.15, repBonus: 5 },
  },
  {
    id: "sil_B3", category: "silicon", path: "B", pathName: "GPU & Gráficos", tier: 3,
    name: "GPU Ray Tracing", description: "Iluminação global em tempo real. O salto visual mais importante da história.",
    effectLabel: "+1.8 rating, +25% vendas, +12 reputação", cost: 1_200_000, timeMonths: 8,
    requires: ["sil_B2"], bonus: { ratingBonus: 1.8, salesMult: 1.25, repBonus: 12 },
    synergyId: "tech_A3", synergyLabel: "Com Arquitetura Proprietária: combo de potência +2 rating",
  },

  // ════════════════════════════════════════
  // SILICON — C: Armazenamento & Controlo
  // ════════════════════════════════════════
  {
    id: "sil_C1", category: "silicon", path: "C", pathName: "Storage & Controlo", tier: 1,
    name: "Cartucho ROM", description: "Jogos em cartucho de acesso instantâneo — durável e simples.",
    effectLabel: "-8% custo produção, +0.2 rating", cost: 40_000, timeMonths: 1,
    requires: [], bonus: { costMult: 0.92, ratingBonus: 0.2 },
  },
  {
    id: "sil_C2", category: "silicon", path: "C", pathName: "Storage & Controlo", tier: 2,
    name: "CD-ROM + Controlo Wireless", description: "Mídia óptica de alta capacidade e controlo sem fios pela primeira vez.",
    effectLabel: "+0.6 rating, +12% vendas, +4 reputação", cost: 220_000, timeMonths: 3,
    requires: ["sil_C1"], bonus: { ratingBonus: 0.6, salesMult: 1.12, repBonus: 4 },
  },
  {
    id: "sil_C3", category: "silicon", path: "C", pathName: "Storage & Controlo", tier: 3,
    name: "SSD + Haptic Suite", description: "SSD ultrarrápido com tempo de carregamento zero e controlo háptico avançado.",
    effectLabel: "+1.0 rating, +18% vendas, +10 reputação", cost: 700_000, timeMonths: 6,
    requires: ["sil_C2"], bonus: { ratingBonus: 1.0, salesMult: 1.18, repBonus: 10 },
    synergyId: "hw_B3", synergyLabel: "Com Handheld Premium: controlo perfeito +extra vendas",
  },

  // ════════════════════════════════════════
  // ENGINES — A: Motor de Jogo
  // ════════════════════════════════════════
  {
    id: "engines_A1", category: "engines", path: "A", pathName: "Motor de Jogo", tier: 1,
    name: "Motor 2D Básico", description: "Primeiro motor de jogo interno com suporte completo a sprites e colisão 2D.",
    effectLabel: "+15% receita jogos, -10% custo produção jogos", cost: 90_000, timeMonths: 2,
    requires: [], bonus: { gameRevMult: 1.15, costMult: 0.9 },
  },
  {
    id: "engines_A2", category: "engines", path: "A", pathName: "Motor de Jogo", tier: 2,
    name: "Motor 3D Avançado", description: "Engine completa com suporte a modelos 3D, iluminação dinâmica e câmera livre.",
    effectLabel: "+25% receita jogos, +0.5 rating, +5 reputação", cost: 350_000, timeMonths: 5,
    requires: ["engines_A1"], bonus: { gameRevMult: 1.25, ratingBonus: 0.5, repBonus: 5 },
  },
  {
    id: "engines_A3", category: "engines", path: "A", pathName: "Motor de Jogo", tier: 3,
    name: "Motor Proprietário", description: "Engine completamente desenvolvida in-house, otimizada exclusivamente para o hardware próprio.",
    effectLabel: "+40% receita jogos, -20% custo total, +10 reputação", cost: 1_500_000, timeMonths: 10,
    requires: ["engines_A2"], bonus: { gameRevMult: 1.4, costMult: 0.8, repBonus: 10 },
    synergyId: "tech_A3", synergyLabel: "Com Arquitetura Proprietária: sinergia perfeita +2 rating",
  },

  // ════════════════════════════════════════
  // ENGINES — B: Pipeline Gráfico
  // ════════════════════════════════════════
  {
    id: "engines_B1", category: "engines", path: "B", pathName: "Pipeline Gráfico", tier: 1,
    name: "Sprites HD", description: "Sistema otimizado para sprites 2D coloridos em alta resolução com animações fluidas.",
    effectLabel: "+0.3 rating, +10% receita jogos", cost: 60_000, timeMonths: 2,
    requires: [], bonus: { ratingBonus: 0.3, gameRevMult: 1.1 },
  },
  {
    id: "engines_B2", category: "engines", path: "B", pathName: "Pipeline Gráfico", tier: 2,
    name: "Renderização 3D", description: "Suporte completo a polígonos 3D, texturas mapeadas UV e perspectiva real.",
    effectLabel: "+0.8 rating, +18% receita jogos, +5 reputação", cost: 280_000, timeMonths: 4,
    requires: ["engines_B1"], bonus: { ratingBonus: 0.8, gameRevMult: 1.18, repBonus: 5 },
  },
  {
    id: "engines_B3", category: "engines", path: "B", pathName: "Pipeline Gráfico", tier: 3,
    name: "Realismo Fotográfico", description: "GI, volumetric lighting e path tracing — indistinguível da realidade.",
    effectLabel: "+1.6 rating, +30% vendas, +15 reputação", cost: 2_000_000, timeMonths: 12,
    requires: ["engines_B2"], bonus: { ratingBonus: 1.6, salesMult: 1.3, repBonus: 15 },
    synergyId: "sil_B3", synergyLabel: "Com GPU Ray Tracing: combo visual definitivo",
  },

  // ════════════════════════════════════════
  // ENGINES — C: Física & IA
  // ════════════════════════════════════════
  {
    id: "engines_C1", category: "engines", path: "C", pathName: "Física & IA", tier: 1,
    name: "Física Básica", description: "Colisão, gravidade e ricochete realistas para plataformas e jogos 2D.",
    effectLabel: "+10% receita jogos, +0.2 rating", cost: 80_000, timeMonths: 2,
    requires: [], bonus: { gameRevMult: 1.1, ratingBonus: 0.2 },
  },
  {
    id: "engines_C2", category: "engines", path: "C", pathName: "Física & IA", tier: 2,
    name: "Física Avançada + IA Básica", description: "Destruição destrutível, fluidos simulados, e NPCs com pathfinding inteligente.",
    effectLabel: "+22% receita jogos, +0.6 rating, +5 reputação", cost: 400_000, timeMonths: 5,
    requires: ["engines_C1"], bonus: { gameRevMult: 1.22, ratingBonus: 0.6, repBonus: 5 },
  },
  {
    id: "engines_C3", category: "engines", path: "C", pathName: "Física & IA", tier: 3,
    name: "IA Adaptativa", description: "Personagens que aprendem com o jogador, dificuldade dinâmica e comportamento emergente.",
    effectLabel: "+38% receita jogos, +15% vendas, +8 reputação", cost: 1_200_000, timeMonths: 9,
    requires: ["engines_C2"], bonus: { gameRevMult: 1.38, salesMult: 1.15, repBonus: 8 },
    synergyId: "innov_B2", synergyLabel: "Com IA Adaptativa: dupla sinergia — IA perfeita",
  },

  // ════════════════════════════════════════
  // AUDIO — A: Hardware de Áudio
  // ════════════════════════════════════════
  {
    id: "audio_A1", category: "audio", path: "A", pathName: "Hardware de Áudio", tier: 1,
    name: "Beeper Mono", description: "Chip de áudio mono 1-canal — o início de tudo. Beeps icônicos que definiram uma era.",
    effectLabel: "+5% receita jogos, +0.1 rating", cost: 25_000, timeMonths: 1,
    requires: [], bonus: { gameRevMult: 1.05, ratingBonus: 0.1 },
  },
  {
    id: "audio_A2", category: "audio", path: "A", pathName: "Hardware de Áudio", tier: 2,
    name: "Stereo PCM 16-bit", description: "Áudio stereo de alta fidelidade com samples reais. Músicas que ficam na cabeça.",
    effectLabel: "+12% receita jogos, +0.3 rating, +3 reputação", cost: 120_000, timeMonths: 2,
    requires: ["audio_A1"], bonus: { gameRevMult: 1.12, ratingBonus: 0.3, repBonus: 3 },
  },
  {
    id: "audio_A3", category: "audio", path: "A", pathName: "Hardware de Áudio", tier: 3,
    name: "Surround 7.1 Dolby", description: "Sistema de som surround completo com 7.1 canais para imersão cinematográfica total.",
    effectLabel: "+20% receita jogos, +0.6 rating, +8 reputação", cost: 400_000, timeMonths: 4,
    requires: ["audio_A2"], bonus: { gameRevMult: 1.2, ratingBonus: 0.6, repBonus: 8 },
    synergyId: "games_C3", synergyLabel: "Com Experiência Auditiva Total: +extra 12 reputação",
  },

  // ════════════════════════════════════════
  // AUDIO — B: Trilha Musical
  // ════════════════════════════════════════
  {
    id: "audio_B1", category: "audio", path: "B", pathName: "Trilha Musical", tier: 1,
    name: "BGM Sintético", description: "Músicas de fundo em chip 8-bit — melódicas, icônicas e memorizáveis.",
    effectLabel: "+8% receita jogos, +2 reputação", cost: 40_000, timeMonths: 1,
    requires: [], bonus: { gameRevMult: 1.08, repBonus: 2 },
  },
  {
    id: "audio_B2", category: "audio", path: "B", pathName: "Trilha Musical", tier: 2,
    name: "Trilha Orquestral Digital", description: "Orquestra sinfônica gravada em estúdio premium para trilhas épicas.",
    effectLabel: "+18% receita jogos, +5 reputação, +2k fãs", cost: 220_000, timeMonths: 3,
    requires: ["audio_B1"], bonus: { gameRevMult: 1.18, repBonus: 5, fansBonus: 2000 },
  },
  {
    id: "audio_B3", category: "audio", path: "B", pathName: "Trilha Musical", tier: 3,
    name: "Música Adaptativa", description: "A trilha muda dinamicamente com as ações e emoções do jogador em tempo real.",
    effectLabel: "+30% receita jogos, +10 reputação, +5k fãs", cost: 700_000, timeMonths: 6,
    requires: ["audio_B2"], bonus: { gameRevMult: 1.3, repBonus: 10, fansBonus: 5000 },
    synergyId: "innov_C2", synergyLabel: "Com Mundos Infinitos: música procedural perfeita",
  },

  // ════════════════════════════════════════
  // AUDIO — C: Imersão & Voice Acting
  // ════════════════════════════════════════
  {
    id: "audio_C1", category: "audio", path: "C", pathName: "Imersão & Voz", tier: 1,
    name: "Dublagem Básica", description: "Personagens com voz humana — imersão narrativa muito maior.",
    effectLabel: "+12% receita jogos, +3 reputação", cost: 80_000, timeMonths: 2,
    requires: [], bonus: { gameRevMult: 1.12, repBonus: 3 },
  },
  {
    id: "audio_C2", category: "audio", path: "C", pathName: "Imersão & Voz", tier: 2,
    name: "Áudio Binaural 3D", description: "Som posicional 360° — o jogador ouve exatamente de onde vem cada som.",
    effectLabel: "+22% receita jogos, +8 reputação, +3k fãs", cost: 350_000, timeMonths: 4,
    requires: ["audio_C1"], bonus: { gameRevMult: 1.22, repBonus: 8, fansBonus: 3000 },
  },
  {
    id: "audio_C3", category: "audio", path: "C", pathName: "Imersão & Voz", tier: 3,
    name: "Haptic Audio + Presença Total", description: "Vibração e som sincronizados para imersão física total no ambiente do jogo.",
    effectLabel: "+32% receita jogos, +15 reputação, +12% vendas", cost: 1_000_000, timeMonths: 7,
    requires: ["audio_C2"], bonus: { gameRevMult: 1.32, repBonus: 15, salesMult: 1.12 },
    synergyId: "innov_A2", synergyLabel: "Com VR Premium: experiência sensorial completa",
  },

  // ════════════════════════════════════════
  // BUSINESS extra — Distribuição Física
  // ════════════════════════════════════════
  {
    id: "biz_D1", category: "business", path: "A", pathName: "Marketing", tier: 2,
    name: "Distribuição Física Global", description: "Rede de distribuição física em grandes redes de varejo mundiais.",
    effectLabel: "+20% vendas, +8% alcance de mercado", cost: 300_000, timeMonths: 4,
    requires: ["biz_B1"], bonus: { salesMult: 1.2 },
  },
  {
    id: "biz_D2", category: "business", path: "B", pathName: "Contratos", tier: 2,
    name: "Licenciamento de Marca", description: "Licencie o IP da empresa para brinquedos, filmes e merchandise.",
    effectLabel: "+25% receita de jogos, +10k fãs, +8 reputação", cost: 500_000, timeMonths: 5,
    requires: ["biz_B1"], bonus: { gameRevMult: 1.25, fansBonus: 10000, repBonus: 8 },
  },
  {
    id: "biz_D3", category: "business", path: "C", pathName: "Loja Digital", tier: 2,
    name: "Publishing Deals", description: "Acordos de publicação com estúdios third-party — catálogo mais rico.",
    effectLabel: "+35% receita de jogos, +15% vendas console", cost: 800_000, timeMonths: 6,
    requires: ["biz_C1"], bonus: { gameRevMult: 1.35, salesMult: 1.15 },
  },

  // ════════════════════════════════════════
  // ERA EXPANSION: 1980s — Home Console Revolution
  // ════════════════════════════════════════
  {
    id: "era80_A1", category: "tech", path: "A", pathName: "Performance", tier: 2,
    name: "Cartuchos de 8-bit", description: "Memória ROM expansível em cartucho — jogos maiores com mais conteúdo.",
    effectLabel: "+0.6 rating, +12% receita de jogos", cost: 140_000, timeMonths: 3,
    requires: ["tech_A1"], bonus: { ratingBonus: 0.6, gameRevMult: 1.12 },
    minYear: 1980,
  },
  {
    id: "era80_A2", category: "hardware", path: "A", pathName: "Potência", tier: 2,
    name: "Botão de Turbo", description: "Controle com botão de turbo automático — feature amada pelos jogadores.",
    effectLabel: "+5k fãs, +8% vendas", cost: 80_000, timeMonths: 2,
    requires: ["hw_A1"], bonus: { fansBonus: 5000, salesMult: 1.08 },
    minYear: 1982,
  },
  {
    id: "era80_A3", category: "games", path: "A", pathName: "Arcade", tier: 2,
    name: "Ports de Arcade", description: "Trazer os sucessos de arcade para o console de casa — sucesso garantido.",
    effectLabel: "+25% receita de jogos, +8k fãs", cost: 200_000, timeMonths: 3,
    requires: ["games_A1"], bonus: { gameRevMult: 1.25, fansBonus: 8000 },
    minYear: 1982,
    synergyId: "biz_A2", synergyLabel: "Com Campanhas de TV: popularidade arcade +40%",
  },
  {
    id: "era80_B1", category: "design", path: "A", pathName: "Minimalista", tier: 2,
    name: "Embalagem Icônica", description: "Design de embalagem que destaca o produto nas prateleiras das lojas.",
    effectLabel: "+10% vendas, +4k fãs, +3 reputação", cost: 100_000, timeMonths: 2,
    requires: ["design_A1"], bonus: { salesMult: 1.1, fansBonus: 4000, repBonus: 3 },
    minYear: 1981,
  },

  // ════════════════════════════════════════
  // ERA EXPANSION: 1990s — 16-bit & CD-ROM
  // ════════════════════════════════════════
  {
    id: "era90_A1", category: "tech", path: "B", pathName: "Eficiência", tier: 2,
    name: "CD-ROM Drive", description: "Armazenamento óptico com 700MB — jogos cinematográficos com cutscenes.",
    effectLabel: "+0.8 rating, +20% receita de jogos", cost: 350_000, timeMonths: 5,
    requires: ["tech_B1"], bonus: { ratingBonus: 0.8, gameRevMult: 1.2 },
    minYear: 1991,
  },
  {
    id: "era90_A2", category: "hardware", path: "B", pathName: "Portabilidade", tier: 2,
    name: "Console Portátil LCD", description: "Console de bolso com tela LCD — o mercado móvel antes dos smartphones.",
    effectLabel: "+15% vendas, +20k fãs, novo segmento de mercado", cost: 600_000, timeMonths: 6,
    requires: ["hw_B1"], bonus: { salesMult: 1.15, fansBonus: 20000 },
    minYear: 1989,
    synergyId: "design_A2", synergyLabel: "Com Interface Intuitiva: portátil perfeito +20% fãs",
  },
  {
    id: "era90_A3", category: "games", path: "B", pathName: "RPG", tier: 2,
    name: "RPGs de Mundo Aberto", description: "Jogos de 40+ horas com mundos imensos — o jogador que sai de casa não para.",
    effectLabel: "+35% receita de jogos, +15k fãs", cost: 700_000, timeMonths: 6,
    requires: ["games_B1"], bonus: { gameRevMult: 1.35, fansBonus: 15000 },
    minYear: 1993,
  },
  {
    id: "era90_B1", category: "online", path: "A", pathName: "Local Multiplayer", tier: 2,
    name: "Cabo Link Multiplayer", description: "Conecte dois consoles — batalhas locais que criaram gerações de memórias.",
    effectLabel: "+15% vendas, +10k fãs", cost: 150_000, timeMonths: 3,
    requires: ["online_A1"], bonus: { salesMult: 1.15, fansBonus: 10000 },
    minYear: 1990,
  },
  {
    id: "era90_B2", category: "silicon", path: "A", pathName: "CPUs Dedicados", tier: 2,
    name: "Processador de 32-bit", description: "Salto geracional para 32-bit — gráficos 3D poligonais são possíveis.",
    effectLabel: "+1.2 rating, +12% vendas, +8 reputação", cost: 1_200_000, timeMonths: 8,
    requires: ["sil_A1"], bonus: { ratingBonus: 1.2, salesMult: 1.12, repBonus: 8 },
    minYear: 1993,
  },

  // ════════════════════════════════════════
  // ERA EXPANSION: 2000s — Online & HD
  // ════════════════════════════════════════
  {
    id: "era2k_A1", category: "online", path: "B", pathName: "Online Premium", tier: 2,
    name: "Online Matchmaking", description: "Sistema de emparelhamento competitivo com ranking global.",
    effectLabel: "+25% receita, +30k fãs, +10 reputação", cost: 900_000, timeMonths: 7,
    requires: ["online_B1"], bonus: { gameRevMult: 1.25, fansBonus: 30000, repBonus: 10 },
    minYear: 2002,
    synergyId: "online_A2", synergyLabel: "Com Online Cooperativo: ecosistema online completo +50% retenção",
  },
  {
    id: "era2k_A2", category: "tech", path: "A", pathName: "Performance", tier: 3,
    name: "GPU HD 1080p", description: "Renderização Full HD em 60fps — a geração High Definition chegou.",
    effectLabel: "+1.5 rating, +18% vendas, +12 reputação", cost: 2_500_000, timeMonths: 10,
    requires: ["tech_A2", "sil_A2"], bonus: { ratingBonus: 1.5, salesMult: 1.18, repBonus: 12 },
    minYear: 2005,
  },
  {
    id: "era2k_A3", category: "games", path: "C", pathName: "FPS", tier: 2,
    name: "Motor de FPS Avançado", description: "Motor de jogo otimizado para shooters em primeira pessoa — gênero dominante.",
    effectLabel: "+30% receita de jogos, +20k fãs, +0.5 rating", cost: 600_000, timeMonths: 5,
    requires: ["games_C1"], bonus: { gameRevMult: 1.3, fansBonus: 20000, ratingBonus: 0.5 },
    minYear: 2003,
  },
  {
    id: "era2k_B1", category: "business", path: "B", pathName: "Contratos", tier: 3,
    name: "Loja Digital de Jogos", description: "Plataforma de distribuição digital — fim do CD físico como único canal.",
    effectLabel: "+40% receita de jogos, -10% custo produção", cost: 1_500_000, timeMonths: 8,
    requires: ["biz_B2"], bonus: { gameRevMult: 1.4, costMult: 0.9 },
    minYear: 2003,
    synergyId: "biz_D3", synergyLabel: "Com Publishing Deals: monopolio digital +30% margem",
  },

  // ════════════════════════════════════════
  // ERA EXPANSION: 2010s — Mobile & Social
  // ════════════════════════════════════════
  {
    id: "era10_A1", category: "online", path: "C", pathName: "Cloud Gaming", tier: 2,
    name: "Social Gaming Platform", description: "Feed de atividade, conquistas compartilhadas e perfis de jogador públicos.",
    effectLabel: "+20% fãs por mês, +15% retenção de jogadores", cost: 700_000, timeMonths: 6,
    requires: ["online_C1"], bonus: { fansBonus: 15000, salesMult: 1.15 },
    minYear: 2010,
  },
  {
    id: "era10_A2", category: "innovation", path: "A", pathName: "VR/AR", tier: 3,
    name: "Headset VR Consumer", description: "Realidade Virtual para o consumidor final — a próxima fronteira do gaming.",
    effectLabel: "+2 rating, +25% receita de jogos, +20 reputação", cost: 4_000_000, timeMonths: 14,
    requires: ["innov_A2"], bonus: { ratingBonus: 2.0, gameRevMult: 1.25, repBonus: 20 },
    minYear: 2013,
    synergyId: "engines_B2", synergyLabel: "Com Engines de VR: imersão total +1.5 rating",
  },
  {
    id: "era10_A3", category: "games", path: "A", pathName: "Arcade", tier: 3,
    name: "Free-to-Play com Cosméticos", description: "Modelo sem custo de entrada com itens visuais premium — receita massiva.",
    effectLabel: "+45% receita de jogos, +50k fãs, risco de reputação", cost: 1_200_000, timeMonths: 8,
    requires: ["games_A2"], bonus: { gameRevMult: 1.45, fansBonus: 50000, riskMod: 1.2 },
    minYear: 2012,
    riskLabel: "+20% chance de reação negativa da comunidade",
  },
  {
    id: "era10_B1", category: "silicon", path: "B", pathName: "Eficiência Térmica", tier: 3,
    name: "SoC ARC Mobile Gaming", description: "Chip ARC ultra-eficiente para handheld gaming com bateria de longa duração.",
    effectLabel: "-20% custo, +1 rating handhelds, +18% vendas mobile", cost: 1_800_000, timeMonths: 9,
    requires: ["sil_B2"], bonus: { costMult: 0.8, ratingBonus: 1.0, salesMult: 1.18 },
    minYear: 2012,
  },

  // ════════════════════════════════════════
  // ERA EXPANSION: 2020s+ — AI & Cloud
  // ════════════════════════════════════════
  {
    id: "era20_A1", category: "tech", path: "C", pathName: "Inovação", tier: 3,
    name: "AI Neural Rendering", description: "IA gera frames intermediários — 60fps viram 120fps sem custo de GPU extra.",
    effectLabel: "+2.5 rating, -15% custo GPU, +25% reputação", cost: 5_000_000, timeMonths: 14,
    requires: ["tech_C2"], bonus: { ratingBonus: 2.5, costMult: 0.85, repBonus: 25 },
    minYear: 2020,
    synergyId: "sil_A3", synergyLabel: "Com Silicon Premium: combo next-gen +3 rating total",
  },
  {
    id: "era20_A2", category: "online", path: "C", pathName: "Cloud Gaming", tier: 3,
    name: "Cloud Gaming 5G", description: "Streaming de jogos via rede 5G — sem hardware dedicado, jogue em qualquer tela.",
    effectLabel: "+30% vendas, +40% receita de jogos, novo segmento", cost: 6_000_000, timeMonths: 16,
    requires: ["online_C2"], bonus: { salesMult: 1.3, gameRevMult: 1.4 },
    minYear: 2020,
    synergyId: "tech_C3", synergyLabel: "Com Tecnologia do Futuro: cloud next-gen perfeito",
  },
  {
    id: "era20_A3", category: "innovation", path: "B", pathName: "AI & Blockchain", tier: 3,
    name: "Geração Procedural com IA", description: "IA gera mundos infinitos, NPCs adaptativos e narrativas únicas para cada jogador.",
    effectLabel: "+35% receita de jogos, +30 reputação, +100k fãs", cost: 8_000_000, timeMonths: 18,
    requires: ["innov_B2"], bonus: { gameRevMult: 1.35, repBonus: 30, fansBonus: 100000 },
    minYear: 2022,
    synergyId: "engines_C2", synergyLabel: "Com Arquitetura de Engine Modular: mundos infinitos +50% receita",
  },
  {
    id: "era20_B1", category: "engines", path: "A", pathName: "Motores Clássicos", tier: 3,
    name: "Game Engine Proprietária 2.0", description: "Segunda geração da engine — renderização ray-traced em tempo real e física neural.",
    effectLabel: "+2 rating, +20% receita de jogos, +15 reputação", cost: 4_500_000, timeMonths: 12,
    requires: ["engines_A2"], bonus: { ratingBonus: 2.0, gameRevMult: 1.2, repBonus: 15 },
    minYear: 2020,
    synergyId: "era20_A1", synergyLabel: "Com AI Neural Rendering: pipeline técnico perfeito +3 rating",
  },
  {
    id: "era20_B2", category: "design", path: "C", pathName: "Futurista", tier: 3,
    name: "Identidade Visual Generativa", description: "IA cria assets visuais únicos para cada usuário — personalização em escala.",
    effectLabel: "+15% vendas, +25k fãs, +0.8 rating", cost: 2_500_000, timeMonths: 10,
    requires: ["design_C2"], bonus: { salesMult: 1.15, fansBonus: 25000, ratingBonus: 0.8 },
    minYear: 2021,
  },

  // ── Deep Expansion: Tiers 4–10 (era-locked, scaling costs) ───────────────
  ...RESEARCH_EXPANSION,
];

export const CATEGORY_COLORS: Record<ResearchCategory, string> = {
  design: "#A855F7",
  tech: "#4DA6FF",
  hardware: "#10B981",
  games: "#FF4D6A",
  business: "#F5A623",
  online: "#22D3EE",
  innovation: "#FF8C00",
  silicon: "#06B6D4",
  engines: "#6366F1",
  audio: "#EC4899",
};

export const CATEGORY_NAMES: Record<ResearchCategory, string> = {
  design: "Design",
  tech: "Tecnologia",
  hardware: "Hardware",
  games: "Jogos",
  business: "Negócio",
  online: "Online",
  innovation: "Inovação",
  silicon: "Silicon",
  engines: "Game Engines",
  audio: "Áudio",
};

export const CATEGORY_ICONS: Record<ResearchCategory, string> = {
  design: "pen-tool",
  tech: "cpu",
  hardware: "hard-drive",
  games: "play-circle",
  business: "briefcase",
  online: "wifi",
  innovation: "zap",
  silicon: "server",
  engines: "code",
  audio: "volume-2",
};

export const CATEGORIES: ResearchCategory[] = [
  "design", "tech", "hardware", "games", "business", "online", "innovation",
  "silicon", "engines", "audio",
];

export function getNodeById(id: string): ResearchNode | undefined {
  return RESEARCH_NODES.find((n) => n.id === id);
}

export function getNodesForCategory(cat: ResearchCategory): ResearchNode[] {
  return RESEARCH_NODES.filter((n) => n.category === cat);
}

export function getChosenPathForCategory(
  cat: ResearchCategory,
  unlockedIds: string[]
): ResearchPath | null {
  const unlocked = RESEARCH_NODES.filter(
    (n) => n.category === cat && unlockedIds.includes(n.id)
  );
  return unlocked.length > 0 ? unlocked[0].path : null;
}

export function computePassiveBonuses(unlockedIds: string[]): {
  ratingBonus: number;
  salesMult: number;
  costMult: number;
  campaignMult: number;
  repBonus: number;
  fansBonus: number;
  riskMod: number;
  gameRevMult: number;
} {
  const totals = {
    ratingBonus: 0,
    salesMult: 1,
    costMult: 1,
    campaignMult: 1,
    repBonus: 0,
    fansBonus: 0,
    riskMod: 1,
    gameRevMult: 1,
  };
  for (const id of unlockedIds) {
    const node = getNodeById(id);
    if (!node) continue;
    const b = node.bonus;
    totals.ratingBonus += b.ratingBonus ?? 0;
    totals.salesMult *= b.salesMult ?? 1;
    totals.costMult *= b.costMult ?? 1;
    totals.campaignMult *= b.campaignMult ?? 1;
    totals.repBonus += b.repBonus ?? 0;
    totals.fansBonus += b.fansBonus ?? 0;
    totals.riskMod *= b.riskMod ?? 1;
    totals.gameRevMult *= b.gameRevMult ?? 1;
  }
  // Synergy bonuses — original
  if (unlockedIds.includes("design_C3") && unlockedIds.includes("tech_C3")) {
    totals.ratingBonus += 3;
  }
  if (unlockedIds.includes("design_A3") && unlockedIds.includes("biz_A3")) {
    totals.salesMult *= 1.5;
  }
  if (unlockedIds.includes("hw_B3") && unlockedIds.includes("games_B3")) {
    totals.salesMult *= 1.5;
  }
  // Synergy bonuses — new categories
  if (unlockedIds.includes("sil_A3") && unlockedIds.includes("engines_B2")) {
    totals.ratingBonus += 2;
    totals.salesMult *= 1.18;
  }
  if (unlockedIds.includes("sil_B3") && unlockedIds.includes("tech_A3")) {
    totals.ratingBonus += 2;
  }
  if (unlockedIds.includes("engines_A3") && unlockedIds.includes("tech_A3")) {
    totals.ratingBonus += 2;
    totals.costMult *= 0.85;
  }
  if (unlockedIds.includes("engines_B3") && unlockedIds.includes("sil_B3")) {
    totals.ratingBonus += 2.5;
    totals.salesMult *= 1.2;
  }
  if (unlockedIds.includes("audio_A3") && unlockedIds.includes("games_C3")) {
    totals.repBonus += 12;
    totals.gameRevMult *= 1.15;
  }
  if (unlockedIds.includes("audio_C3") && unlockedIds.includes("innov_A2")) {
    totals.gameRevMult *= 1.2;
    totals.salesMult *= 1.1;
  }
  if (unlockedIds.includes("engines_C3") && unlockedIds.includes("innov_B2")) {
    totals.gameRevMult *= 1.25;
    totals.salesMult *= 1.12;
  }

  // ── Deep-tier synergies (tiers 7–10) ────────────────────────────────────
  // Silicon + Tech mastery
  if (unlockedIds.includes("sil_A8") && unlockedIds.includes("tech_A8")) {
    totals.ratingBonus += 5;
    totals.salesMult *= 1.25;
  }
  // Quantum computing trifecta
  if (unlockedIds.includes("sil_A10") && unlockedIds.includes("tech_A10") && unlockedIds.includes("engines_A10")) {
    totals.ratingBonus += 15;
    totals.salesMult *= 2.0;
    totals.gameRevMult *= 2.0;
    totals.repBonus += 100;
  }
  // AI + Procedural mastery
  if (unlockedIds.includes("innov_B8") && unlockedIds.includes("innov_C8")) {
    totals.gameRevMult *= 1.40;
    totals.fansBonus += 500000;
    totals.repBonus += 40;
  }
  // Full audio stack
  if (unlockedIds.includes("audio_A8") && unlockedIds.includes("audio_B8") && unlockedIds.includes("audio_C8")) {
    totals.gameRevMult *= 1.30;
    totals.repBonus += 30;
    totals.fansBonus += 300000;
  }
  // Business empire (tier 8+)
  if (unlockedIds.includes("biz_A8") && unlockedIds.includes("biz_B8") && unlockedIds.includes("biz_C8")) {
    totals.salesMult *= 1.50;
    totals.gameRevMult *= 1.50;
    totals.repBonus += 50;
  }
  // Online global domination
  if (unlockedIds.includes("online_A8") && unlockedIds.includes("online_B8") && unlockedIds.includes("online_C8")) {
    totals.salesMult *= 1.40;
    totals.gameRevMult *= 1.40;
    totals.fansBonus += 1000000;
  }
  // VR + Neural interface
  if (unlockedIds.includes("innov_A8") && unlockedIds.includes("design_C8")) {
    totals.ratingBonus += 6;
    totals.salesMult *= 1.30;
    totals.fansBonus += 200000;
  }
  // Engines + Silicon perfection
  if (unlockedIds.includes("engines_B8") && unlockedIds.includes("sil_B8")) {
    totals.ratingBonus += 8;
    totals.salesMult *= 1.35;
  }
  // Ultimate: all tier 10 (legendary company bonus)
  const tier10Ids = [
    "design_A10","design_B10","design_C10","tech_A10","tech_B10","tech_C10",
    "hw_A10","hw_B10","hw_C10","games_A10","games_B10","games_C10",
    "biz_A10","biz_B10","biz_C10","online_A10","online_B10","online_C10",
    "innov_A10","innov_B10","innov_C10","sil_A10","sil_B10","sil_C10",
    "engines_A10","engines_B10","engines_C10","audio_A10","audio_B10","audio_C10",
  ];
  const tier10Count = tier10Ids.filter(id => unlockedIds.includes(id)).length;
  if (tier10Count >= 5) {
    totals.ratingBonus += tier10Count * 2;
    totals.salesMult *= 1 + tier10Count * 0.05;
    totals.repBonus += tier10Count * 5;
  }

  // ── Exclusive tech bonuses ────────────────────────────────────────────────
  for (const id of unlockedIds) {
    const excl = EXCLUSIVE_TECHS.find(e => e.id === id);
    if (!excl) continue;
    const b = excl.bonus;
    totals.ratingBonus += b.ratingBonus ?? 0;
    totals.salesMult *= b.salesMult ?? 1;
    totals.costMult *= b.costMult ?? 1;
    totals.campaignMult *= b.campaignMult ?? 1;
    totals.repBonus += b.repBonus ?? 0;
    totals.fansBonus += b.fansBonus ?? 0;
    totals.riskMod *= b.riskMod ?? 1;
    totals.gameRevMult *= b.gameRevMult ?? 1;
  }

  // ── Company specialization bonuses ────────────────────────────────────────
  const specScores = computeSpecialization(unlockedIds);
  const specBonuses = getSpecializationBonuses(specScores);
  totals.ratingBonus += specBonuses.ratingBonus;
  totals.salesMult *= specBonuses.salesMult;
  totals.costMult *= specBonuses.costMult;
  totals.campaignMult *= specBonuses.campaignMult;
  totals.repBonus += specBonuses.repBonus;
  totals.gameRevMult *= specBonuses.gameRevMult;
  totals.riskMod *= specBonuses.riskMod;

  // ── Research combination bonuses ──────────────────────────────────────────
  for (const id of unlockedIds) {
    const combo = RESEARCH_COMBOS.find((c) => c.id === id);
    if (!combo) continue;
    const b = combo.bonus;
    totals.ratingBonus += b.ratingBonus ?? 0;
    totals.salesMult *= b.salesMult ?? 1;
    totals.costMult *= b.costMult ?? 1;
    totals.campaignMult *= b.campaignMult ?? 1;
    totals.repBonus += b.repBonus ?? 0;
    totals.fansBonus += b.fansBonus ?? 0;
    totals.riskMod *= b.riskMod ?? 1;
    totals.gameRevMult *= b.gameRevMult ?? 1;
  }

  return totals;
}

// ── Era label utility ─────────────────────────────────────────────────────────
// Single source of truth for era names.  Lives here (data layer) so that UI
// components never need to reimplement the mapping.
export function getEraLabel(minYear?: number): string {
  if (!minYear || minYear <= 1979) return "Primeiros Anos";
  if (minYear <= 1989) return "Anos 1980";
  if (minYear <= 1999) return "Anos 1990";
  if (minYear <= 2009) return "Anos 2000";
  if (minYear <= 2019) return "Anos 2010";
  if (minYear <= 2029) return "Anos 2020";
  if (minYear <= 2039) return "Anos 2030";
  if (minYear <= 2049) return "2040s";
  return "Futuro";
}

// ── Data integrity guard ──────────────────────────────────────────────────────
// Runs once at module initialisation (dev + prod).  Throws with a precise
// message so a broken node is caught as soon as the module loads — long before
// any UI renders blank text.
(function validateResearchNodes() {
  const REQUIRED_STRING_FIELDS: (keyof ResearchNode)[] = [
    "id", "name", "description", "effectLabel", "pathName",
  ];
  const errors: string[] = [];

  for (const node of RESEARCH_NODES) {
    for (const field of REQUIRED_STRING_FIELDS) {
      const v = node[field] as unknown;
      if (v === undefined || v === null || (typeof v === "string" && v.trim() === "")) {
        errors.push(`node "${node.id}" has empty/missing field "${field}"`);
      }
    }
    if (!node.category) errors.push(`node "${node.id}" missing "category"`);
    if (!node.path)     errors.push(`node "${node.id}" missing "path"`);
    if (!(node.tier >= 1 && node.tier <= 10)) errors.push(`node "${node.id}" invalid tier ${node.tier}`);
    if (!(node.cost > 0))      errors.push(`node "${node.id}" invalid cost ${node.cost}`);
    if (!(node.timeMonths > 0)) errors.push(`node "${node.id}" invalid timeMonths ${node.timeMonths}`);
  }

  if (errors.length > 0) {
    const msg = `[strategyTree] RESEARCH_NODES data integrity failure:\n` + errors.map(e => `  • ${e}`).join("\n");
    // In a native/web environment we cannot throw synchronously without crashing
    // the app, so we log loudly and surface as a console error so it's visible
    // in all environments (Metro bundler, web, native debugger).
    console.error(msg);
    if (__DEV__) throw new Error(msg);
  }
})();
