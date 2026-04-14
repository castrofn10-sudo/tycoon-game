/**
 * MEGACORP Research Tree — Deep Expansion
 * Adds tiers 4–10 to every A/B/C path across all 10 categories.
 * Each node is era-locked via minYear and costs scale with real-world complexity.
 *
 * Cost ladder (balanced):
 *   Tier 4 (~1983) : $1.3M–$2.2M  / 6 months
 *   Tier 5 (~1991) : $3.8M–$5.4M  / 8 months
 *   Tier 6 (~1999) : $12M–$16M    / 9 months
 *   Tier 7 (~2007) : $30M–$40M    / 11 months
 *   Tier 8 (~2016) : $75M–$100M   / 13 months
 *   Tier 9 (~2026) : $200M–$300M  / 16 months
 *   Tier 10 (~2042): $600M–$800M  / 22 months
 */

import { ResearchNode } from "./strategyTree";

export const RESEARCH_EXPANSION: ResearchNode[] = [

  // ══════════════════════════════════════════════════════════════════════════
  // DESIGN  — A: Minimalista
  // ══════════════════════════════════════════════════════════════════════════
  { id:"design_A4", category:"design", path:"A", pathName:"Minimalista", tier:4,
    name:"Paleta de Cores Adaptativa", description:"Sistema de cores responsivo ao ambiente e ao estado do jogador.",
    effectLabel:"-10% custo produção, +6% vendas", cost:1_700_000, timeMonths:6,
    requires:["design_A3"], bonus:{costMult:0.90, salesMult:1.06}, minYear:1983 },

  { id:"design_A5", category:"design", path:"A", pathName:"Minimalista", tier:5,
    name:"Interface WIMP", description:"Janelas, ícones, menus e ponteiros — paradigma de interface que dominou uma geração.",
    effectLabel:"+0.4 rating, +10% vendas", cost:4_500_000, timeMonths:8,
    requires:["design_A4"], bonus:{ratingBonus:0.4, salesMult:1.10}, minYear:1991 },

  { id:"design_A6", category:"design", path:"A", pathName:"Minimalista", tier:6,
    name:"UI Widescreen & HD", description:"Redesign total para 16:9 e alta resolução — nova geração visual.",
    effectLabel:"+0.5 rating, +12% vendas", cost:12_000_000, timeMonths:9,
    requires:["design_A5"], bonus:{ratingBonus:0.5, salesMult:1.12}, minYear:1999 },

  { id:"design_A7", category:"design", path:"A", pathName:"Minimalista", tier:7,
    name:"Design Touch-First", description:"Interface repensada para telas de toque — 2 bilhões de novos usuários.",
    effectLabel:"+0.6 rating, +18% vendas", cost:30_000_000, timeMonths:11,
    requires:["design_A6"], bonus:{ratingBonus:0.6, salesMult:1.18}, minYear:2007 },

  { id:"design_A8", category:"design", path:"A", pathName:"Minimalista", tier:8,
    name:"Design System Adaptativo", description:"Componentes de UI que se adaptam automaticamente a qualquer tela ou contexto.",
    effectLabel:"+0.8 rating, +22% vendas", cost:75_000_000, timeMonths:13,
    requires:["design_A7"], bonus:{ratingBonus:0.8, salesMult:1.22}, minYear:2016 },

  { id:"design_A9", category:"design", path:"A", pathName:"Minimalista", tier:9,
    name:"Interface Neural Preditiva", description:"A UI antecipa o que o utilizador quer antes de agir — zero fricção.",
    effectLabel:"+1.2 rating, +30% vendas, +10 reputação", cost:200_000_000, timeMonths:16,
    requires:["design_A8"], bonus:{ratingBonus:1.2, salesMult:1.30, repBonus:10}, minYear:2027 },

  { id:"design_A10", category:"design", path:"A", pathName:"Minimalista", tier:10,
    name:"UI Holográfica Ambiental", description:"Interface projetada no espaço — sem ecrã, sem limites.",
    effectLabel:"+2.0 rating, +45% vendas, +20 reputação", cost:600_000_000, timeMonths:22,
    requires:["design_A9"], bonus:{ratingBonus:2.0, salesMult:1.45, repBonus:20}, minYear:2043 },

  // ── DESIGN B: Premium ────────────────────────────────────────────────────
  { id:"design_B4", category:"design", path:"B", pathName:"Premium", tier:4,
    name:"Assinatura Visual da Marca", description:"Linguagem visual reconhecível instantaneamente — identidade premium.",
    effectLabel:"+5 reputação, +8% vendas", cost:2_150_000, timeMonths:6,
    requires:["design_B3"], bonus:{repBonus:5, salesMult:1.08}, minYear:1988 },

  { id:"design_B5", category:"design", path:"B", pathName:"Premium", tier:5,
    name:"Identidade Icónica", description:"Branding de nível MEGACORP ou NeoCorp — reconhecida por toda a gente.",
    effectLabel:"+10 reputação, +12% vendas", cost:5_400_000, timeMonths:8,
    requires:["design_B4"], bonus:{repBonus:10, salesMult:1.12}, minYear:1995 },

  { id:"design_B6", category:"design", path:"B", pathName:"Premium", tier:6,
    name:"Colaboração com Designer Estrela", description:"Parceria com ícone do design industrial — edição limitada noticiada mundialmente.",
    effectLabel:"+15 reputação, +18% vendas, +20k fãs", cost:15_000_000, timeMonths:9,
    requires:["design_B5"], bonus:{repBonus:15, salesMult:1.18, fansBonus:20000}, minYear:2003 },

  { id:"design_B7", category:"design", path:"B", pathName:"Premium", tier:7,
    name:"Edição Homenagem", description:"Série comemorativa do legado da empresa — apenas 10.000 unidades.",
    effectLabel:"+20 reputação, +25% vendas collector", cost:40_000_000, timeMonths:11,
    requires:["design_B6"], bonus:{repBonus:20, salesMult:1.25}, minYear:2012 },

  { id:"design_B8", category:"design", path:"B", pathName:"Premium", tier:8,
    name:"Hiper-Luxo Sustentável", description:"Materiais bio-certificados e acabamentos únicos por mão de obra artesanal.",
    effectLabel:"+28 reputação, +30% vendas, +50k fãs", cost:90_000_000, timeMonths:13,
    requires:["design_B7"], bonus:{repBonus:28, salesMult:1.30, fansBonus:50000}, minYear:2020 },

  { id:"design_B9", category:"design", path:"B", pathName:"Premium", tier:9,
    name:"Material Responsivo", description:"Superfícies que mudam de textura, cor e temperatura por toque ou comando de voz.",
    effectLabel:"+38 reputação, +38% vendas", cost:250_000_000, timeMonths:16,
    requires:["design_B8"], bonus:{repBonus:38, salesMult:1.38}, minYear:2033 },

  { id:"design_B10", category:"design", path:"B", pathName:"Premium", tier:10,
    name:"Design Bio-Integrado", description:"O console molda-se biologicamente ao utilizador — único e irrepetível.",
    effectLabel:"+55 reputação, +50% vendas, +200k fãs", cost:700_000_000, timeMonths:22,
    requires:["design_B9"], bonus:{repBonus:55, salesMult:1.50, fansBonus:200000}, minYear:2048 },

  // ── DESIGN C: Futurista ──────────────────────────────────────────────────
  { id:"design_C4", category:"design", path:"C", pathName:"Futurista", tier:4,
    name:"Controle por Movimento", description:"Giroscópio e acelerômetro — jogue com gestos naturais.",
    effectLabel:"+0.8 rating, +15% vendas", cost:1_550_000, timeMonths:6,
    requires:["design_C3"], bonus:{ratingBonus:0.8, salesMult:1.15}, minYear:1990 },

  { id:"design_C5", category:"design", path:"C", pathName:"Futurista", tier:5,
    name:"Feedback Háptico Avançado", description:"Actuadores de precisão criam sensações tácteis realistas.",
    effectLabel:"+1.2 rating, +18% vendas", cost:4_950_000, timeMonths:8,
    requires:["design_C4"], bonus:{ratingBonus:1.2, salesMult:1.18}, minYear:1998 },

  { id:"design_C6", category:"design", path:"C", pathName:"Futurista", tier:6,
    name:"Eye Tracking Integrado", description:"O jogo sabe para onde você está olhando — câmeras adaptativas e aiming natural.",
    effectLabel:"+1.5 rating, +20% vendas", cost:14_000_000, timeMonths:9,
    requires:["design_C5"], bonus:{ratingBonus:1.5, salesMult:1.20}, minYear:2006 },

  { id:"design_C7", category:"design", path:"C", pathName:"Futurista", tier:7,
    name:"Interface de Realidade Aumentada", description:"Sobreposição de gráficos no mundo real — gaming sem fronteiras.",
    effectLabel:"+2.0 rating, +25% vendas, +30k fãs", cost:35_000_000, timeMonths:11,
    requires:["design_C6"], bonus:{ratingBonus:2.0, salesMult:1.25, fansBonus:30000}, minYear:2015 },

  { id:"design_C8", category:"design", path:"C", pathName:"Futurista", tier:8,
    name:"Interface Cérebro-Computador", description:"Pensamento directo como input — não é ficção científica, é produto.",
    effectLabel:"+3.0 rating, +35% vendas, +60k fãs", cost:100_000_000, timeMonths:13,
    requires:["design_C7"], bonus:{ratingBonus:3.0, salesMult:1.35, fansBonus:60000, riskMod:1.20}, minYear:2026,
    riskLabel:"+20% volatilidade de reputação" },

  { id:"design_C9", category:"design", path:"C", pathName:"Futurista", tier:9,
    name:"Interface Mental Completa", description:"Full thought-to-game pipeline — nenhum periférico necessário.",
    effectLabel:"+4.5 rating, +50% vendas", cost:300_000_000, timeMonths:16,
    requires:["design_C8"], bonus:{ratingBonus:4.5, salesMult:1.50}, minYear:2040 },

  { id:"design_C10", category:"design", path:"C", pathName:"Futurista", tier:10,
    name:"Fusão Sensorial Total", description:"O jogador não distingue realidade de jogo — imersão absoluta.",
    effectLabel:"+7.0 rating, +70% vendas, +500k fãs", cost:800_000_000, timeMonths:22,
    requires:["design_C9"], bonus:{ratingBonus:7.0, salesMult:1.70, fansBonus:500000, riskMod:1.30}, minYear:2058,
    riskLabel:"+30% risco regulatório global" },

  // ══════════════════════════════════════════════════════════════════════════
  // TECH — A: Performance
  // ══════════════════════════════════════════════════════════════════════════
  { id:"tech_A4", category:"tech", path:"A", pathName:"Performance", tier:4,
    name:"CPUs 16-bit Dedicados", description:"Processadores 16-bit com coprocessadores de som e vídeo separados.",
    effectLabel:"+0.6 rating, +10% vendas", cost:1_850_000, timeMonths:6,
    requires:["tech_A3"], bonus:{ratingBonus:0.6, salesMult:1.10}, minYear:1984 },

  { id:"tech_A5", category:"tech", path:"A", pathName:"Performance", tier:5,
    name:"CPUs 32/64-bit", description:"Processadores de 32 e 64 bits — a era dos polígonos e do 3D real.",
    effectLabel:"+1.0 rating, +15% vendas", cost:4_950_000, timeMonths:8,
    requires:["tech_A4"], bonus:{ratingBonus:1.0, salesMult:1.15}, minYear:1993 },

  { id:"tech_A6", category:"tech", path:"A", pathName:"Performance", tier:6,
    name:"Multi-Core Processing", description:"4+ núcleos independentes — multitarefa real em tempo de jogo.",
    effectLabel:"+1.3 rating, +20% vendas, -8% custo", cost:16_000_000, timeMonths:9,
    requires:["tech_A5"], bonus:{ratingBonus:1.3, salesMult:1.20, costMult:0.92}, minYear:2001 },

  { id:"tech_A7", category:"tech", path:"A", pathName:"Performance", tier:7,
    name:"GPUs Ray Tracing em Tempo Real", description:"Iluminação global física — sombras, reflexos e difusão indistinguíveis da realidade.",
    effectLabel:"+1.8 rating, +25% vendas, +15 reputação", cost:38_000_000, timeMonths:11,
    requires:["tech_A6"], bonus:{ratingBonus:1.8, salesMult:1.25, repBonus:15}, minYear:2008 },

  { id:"tech_A8", category:"tech", path:"A", pathName:"Performance", tier:8,
    name:"NPU: Neural Processing Unit", description:"Chip dedicado exclusivamente a operações de IA — inferência local a 100 TOPS.",
    effectLabel:"+2.5 rating, +32% vendas, +20 reputação", cost:90_000_000, timeMonths:13,
    requires:["tech_A7"], bonus:{ratingBonus:2.5, salesMult:1.32, repBonus:20}, minYear:2017 },

  { id:"tech_A9", category:"tech", path:"A", pathName:"Performance", tier:9,
    name:"Arquitectura Neuromorfa", description:"Chips que imitam o cérebro humano — eficiência energética 1000× superior.",
    effectLabel:"+3.5 rating, +45% vendas, +30 reputação", cost:280_000_000, timeMonths:16,
    requires:["tech_A8"], bonus:{ratingBonus:3.5, salesMult:1.45, repBonus:30}, minYear:2030 },

  { id:"tech_A10", category:"tech", path:"A", pathName:"Performance", tier:10,
    name:"Computação Quântica Aplicada", description:"Qubits estáveis à temperatura ambiente — complexidade computacional irrelevante.",
    effectLabel:"+6.0 rating, +60% vendas, +50 reputação", cost:750_000_000, timeMonths:22,
    requires:["tech_A9"], bonus:{ratingBonus:6.0, salesMult:1.60, repBonus:50}, minYear:2048 },

  // ── TECH B: Eficiência ───────────────────────────────────────────────────
  { id:"tech_B4", category:"tech", path:"B", pathName:"Eficiência", tier:4,
    name:"Compiladores Optimizados", description:"Ferramentas de compilação que extraem 30% mais performance do mesmo hardware.",
    effectLabel:"-8% custo produção, +5% vendas", cost:1_350_000, timeMonths:6,
    requires:["tech_B3"], bonus:{costMult:0.92, salesMult:1.05}, minYear:1985 },

  { id:"tech_B5", category:"tech", path:"B", pathName:"Eficiência", tier:5,
    name:"Virtualização de Hardware", description:"Múltiplos jogos no mesmo hardware via hypervisor — retrocompatibilidade total.",
    effectLabel:"-12% custo, +8% vendas", cost:4_050_000, timeMonths:8,
    requires:["tech_B4"], bonus:{costMult:0.88, salesMult:1.08}, minYear:1993 },

  { id:"tech_B6", category:"tech", path:"B", pathName:"Eficiência", tier:6,
    name:"Computação em Nuvem Híbrida", description:"Processamento offload para nuvem — hardware barato com jogos cloud-enhanced.",
    effectLabel:"-18% custo, +12% vendas", cost:12_000_000, timeMonths:9,
    requires:["tech_B5"], bonus:{costMult:0.82, salesMult:1.12}, minYear:2000 },

  { id:"tech_B7", category:"tech", path:"B", pathName:"Eficiência", tier:7,
    name:"IA de Optimização de Runtime", description:"IA ajusta dinamicamente resolução, FPS e quality settings — sempre perfeito.",
    effectLabel:"-22% custo, +18% vendas", cost:32_000_000, timeMonths:11,
    requires:["tech_B6"], bonus:{costMult:0.78, salesMult:1.18}, minYear:2009 },

  { id:"tech_B8", category:"tech", path:"B", pathName:"Eficiência", tier:8,
    name:"Self-Optimizing Systems", description:"O sistema aprende os padrões de uso e reduz consumo energético em 40%.",
    effectLabel:"-28% custo, +25% vendas", cost:80_000_000, timeMonths:13,
    requires:["tech_B7"], bonus:{costMult:0.72, salesMult:1.25}, minYear:2018 },

  { id:"tech_B9", category:"tech", path:"B", pathName:"Eficiência", tier:9,
    name:"Computação Distribuída Global", description:"Rede global de nós de processamento — latência zero para qualquer jogador.",
    effectLabel:"-35% custo, +35% vendas", cost:220_000_000, timeMonths:16,
    requires:["tech_B8"], bonus:{costMult:0.65, salesMult:1.35}, minYear:2029 },

  { id:"tech_B10", category:"tech", path:"B", pathName:"Eficiência", tier:10,
    name:"Computação Autónoma", description:"Infra-estrutura que se auto-gere, optimiza e expande sem intervenção humana.",
    effectLabel:"-45% custo, +50% vendas", cost:650_000_000, timeMonths:22,
    requires:["tech_B9"], bonus:{costMult:0.55, salesMult:1.50}, minYear:2046 },

  // ── TECH C: Inovação ─────────────────────────────────────────────────────
  { id:"tech_C4", category:"tech", path:"C", pathName:"Inovação", tier:4,
    name:"Realidade Virtual 1ª Geração", description:"Headsets VHS-era com 320×200 — o primeiro passo para mundos virtuais.",
    effectLabel:"+0.5 rating, +10% receita jogos", cost:1_700_000, timeMonths:6,
    requires:["tech_C3"], bonus:{ratingBonus:0.5, gameRevMult:1.10}, minYear:1987 },

  { id:"tech_C5", category:"tech", path:"C", pathName:"Inovação", tier:5,
    name:"Aceleração 3D Dedicada", description:"Placas 3D específicas para jogos — fim do software rendering.",
    effectLabel:"+1.0 rating, +18% receita jogos", cost:4_500_000, timeMonths:8,
    requires:["tech_C4"], bonus:{ratingBonus:1.0, gameRevMult:1.18}, minYear:1995 },

  { id:"tech_C6", category:"tech", path:"C", pathName:"Inovação", tier:6,
    name:"Física em Tempo Real", description:"Simulação de corpos rígidos, fluidos e tecidos — o mundo responde ao jogador.",
    effectLabel:"+1.3 rating, +22% receita jogos", cost:13_000_000, timeMonths:9,
    requires:["tech_C5"], bonus:{ratingBonus:1.3, gameRevMult:1.22}, minYear:2003 },

  { id:"tech_C7", category:"tech", path:"C", pathName:"Inovação", tier:7,
    name:"Iluminação Global em RT", description:"Global Illumination por ray tracing — realismo antes só possível em cinema.",
    effectLabel:"+1.8 rating, +28% receita jogos, +12 rep", cost:36_000_000, timeMonths:11,
    requires:["tech_C6"], bonus:{ratingBonus:1.8, gameRevMult:1.28, repBonus:12}, minYear:2011 },

  { id:"tech_C8", category:"tech", path:"C", pathName:"Inovação", tier:8,
    name:"IA para Upscaling Gráfico", description:"IA transforma 1080p em 4K nativo — GPU budget, qualidade flagship.",
    effectLabel:"+2.5 rating, +35% receita jogos, +18 rep", cost:85_000_000, timeMonths:13,
    requires:["tech_C7"], bonus:{ratingBonus:2.5, gameRevMult:1.35, repBonus:18}, minYear:2020 },

  { id:"tech_C9", category:"tech", path:"C", pathName:"Inovação", tier:9,
    name:"Holografia Real-Time", description:"Projecção holográfica sem headset — jogos que existem no espaço real.",
    effectLabel:"+4.0 rating, +50% receita jogos, +25 rep", cost:270_000_000, timeMonths:16,
    requires:["tech_C8"], bonus:{ratingBonus:4.0, gameRevMult:1.50, repBonus:25, riskMod:1.15}, minYear:2032,
    riskLabel:"+15% complexidade regulatória" },

  { id:"tech_C10", category:"tech", path:"C", pathName:"Inovação", tier:10,
    name:"Interface Quântica", description:"Processamento quântico para renderização — realismo perfeito em tempo real.",
    effectLabel:"+7.0 rating, +70% receita jogos, +50 rep", cost:800_000_000, timeMonths:22,
    requires:["tech_C9"], bonus:{ratingBonus:7.0, gameRevMult:1.70, repBonus:50}, minYear:2050 },

  // ══════════════════════════════════════════════════════════════════════════
  // HARDWARE — A: Potência
  // ══════════════════════════════════════════════════════════════════════════
  { id:"hw_A4", category:"hardware", path:"A", pathName:"Potência", tier:4,
    name:"Cartuchos de Alta Capacidade", description:"ROMs de 8 Mbit — jogos maiores, gráficos mais ricos.",
    effectLabel:"+0.4 rating, +12% receita jogos", cost:1_300_000, timeMonths:6,
    requires:["hw_A3"], bonus:{ratingBonus:0.4, gameRevMult:1.12}, minYear:1985 },

  { id:"hw_A5", category:"hardware", path:"A", pathName:"Potência", tier:5,
    name:"Drive CD-ROM Integrado", description:"700 MB de armazenamento óptico — cutscenes FMV e trilha de áudio de CD.",
    effectLabel:"+0.8 rating, +20% receita jogos", cost:4_300_000, timeMonths:8,
    requires:["hw_A4"], bonus:{ratingBonus:0.8, gameRevMult:1.20}, minYear:1993 },

  { id:"hw_A6", category:"hardware", path:"A", pathName:"Potência", tier:6,
    name:"Drive Blu-ray Ultra HD", description:"50 GB por disco — texturas 4K e mundos sem loading screens.",
    effectLabel:"+1.2 rating, +25% receita jogos, +10 rep", cost:14_000_000, timeMonths:9,
    requires:["hw_A5"], bonus:{ratingBonus:1.2, gameRevMult:1.25, repBonus:10}, minYear:2001 },

  { id:"hw_A7", category:"hardware", path:"A", pathName:"Potência", tier:7,
    name:"SSD NVMe Custom", description:"1 TB de armazenamento de estado sólido — tempo de carregamento < 0.5 s.",
    effectLabel:"+1.6 rating, +30% vendas, -10% custo", cost:35_000_000, timeMonths:11,
    requires:["hw_A6"], bonus:{ratingBonus:1.6, salesMult:1.30, costMult:0.90}, minYear:2009 },

  { id:"hw_A8", category:"hardware", path:"A", pathName:"Potência", tier:8,
    name:"Memória Unificada de Elevada Largura de Banda", description:"RAM e VRAM unificadas a 1 TB/s — sem gargalo de memória algum.",
    effectLabel:"+2.2 rating, +38% vendas, +20 rep", cost:95_000_000, timeMonths:13,
    requires:["hw_A7"], bonus:{ratingBonus:2.2, salesMult:1.38, repBonus:20}, minYear:2017 },

  { id:"hw_A9", category:"hardware", path:"A", pathName:"Potência", tier:9,
    name:"Hardware Neuromorfo de Jogo", description:"Processamento inspirado no cérebro humano — IA nativa no hardware.",
    effectLabel:"+3.5 rating, +50% vendas, +30 rep", cost:260_000_000, timeMonths:16,
    requires:["hw_A8"], bonus:{ratingBonus:3.5, salesMult:1.50, repBonus:30}, minYear:2031 },

  { id:"hw_A10", category:"hardware", path:"A", pathName:"Potência", tier:10,
    name:"Processador Quântico de Jogo", description:"Qubits para simulação de mundos — complexidade de 100 universos em paralelo.",
    effectLabel:"+6.0 rating, +65% vendas, +50 rep", cost:750_000_000, timeMonths:22,
    requires:["hw_A9"], bonus:{ratingBonus:6.0, salesMult:1.65, repBonus:50}, minYear:2048 },

  // ── HARDWARE B: Portabilidade ────────────────────────────────────────────
  { id:"hw_B4", category:"hardware", path:"B", pathName:"Portabilidade", tier:4,
    name:"Ecrã LCD a Cores", description:"Tela colorida de 3,5 polegadas — o portátil finalmente com cor.",
    effectLabel:"+15% vendas, +8k fãs", cost:1_550_000, timeMonths:6,
    requires:["hw_B3"], bonus:{salesMult:1.15, fansBonus:8000}, minYear:1987 },

  { id:"hw_B5", category:"hardware", path:"B", pathName:"Portabilidade", tier:5,
    name:"Ecrã OLED de Alta Resolução", description:"Preto verdadeiro, contraste infinito e cores vibrantes na palma da mão.",
    effectLabel:"+22% vendas, +5 rep, +15k fãs", cost:4_700_000, timeMonths:8,
    requires:["hw_B4"], bonus:{salesMult:1.22, repBonus:5, fansBonus:15000}, minYear:1996 },

  { id:"hw_B6", category:"hardware", path:"B", pathName:"Portabilidade", tier:6,
    name:"Wi-Fi 802.11n Integrado", description:"Internet sem fios a bordo — downloads de jogos e multijogador portátil.",
    effectLabel:"+28% vendas, +25k fãs", cost:13_000_000, timeMonths:9,
    requires:["hw_B5"], bonus:{salesMult:1.28, fansBonus:25000}, minYear:2004 },

  { id:"hw_B7", category:"hardware", path:"B", pathName:"Portabilidade", tier:7,
    name:"4G LTE Gaming", description:"Módulo 4G integrado — multijogador em qualquer lugar com latência < 30ms.",
    effectLabel:"+35% vendas, +40k fãs, +10 rep", cost:32_000_000, timeMonths:11,
    requires:["hw_B6"], bonus:{salesMult:1.35, fansBonus:40000, repBonus:10}, minYear:2012 },

  { id:"hw_B8", category:"hardware", path:"B", pathName:"Portabilidade", tier:8,
    name:"5G + Cloud Gaming Portátil", description:"Streaming de jogos AAA sem hardware local — o console na nuvem.",
    effectLabel:"+45% vendas, +80k fãs, +20 rep", cost:85_000_000, timeMonths:13,
    requires:["hw_B7"], bonus:{salesMult:1.45, fansBonus:80000, repBonus:20}, minYear:2020 },

  { id:"hw_B9", category:"hardware", path:"B", pathName:"Portabilidade", tier:9,
    name:"Projecção Holográfica Pessoal", description:"Ecrã holográfico sem óculos — o jogo flutua no ar à tua frente.",
    effectLabel:"+55% vendas, +150k fãs, +30 rep", cost:240_000_000, timeMonths:16,
    requires:["hw_B8"], bonus:{salesMult:1.55, fansBonus:150000, repBonus:30}, minYear:2035 },

  { id:"hw_B10", category:"hardware", path:"B", pathName:"Portabilidade", tier:10,
    name:"Interface Neural Portátil", description:"Gaming directo no córtex visual — sem ecrã, sem atraso, sem limites.",
    effectLabel:"+75% vendas, +500k fãs, +50 rep", cost:700_000_000, timeMonths:22,
    requires:["hw_B9"], bonus:{salesMult:1.75, fansBonus:500000, repBonus:50}, minYear:2055 },

  // ── HARDWARE C: Durabilidade ─────────────────────────────────────────────
  { id:"hw_C4", category:"hardware", path:"C", pathName:"Durabilidade", tier:4,
    name:"Certificação Militar MIL-STD", description:"Testado para quedas, vibrações e temperaturas extremas.",
    effectLabel:"-20% risco defeito, +8 rep", cost:1_350_000, timeMonths:6,
    requires:["hw_C3"], bonus:{riskMod:0.80, repBonus:8}, minYear:1984 },

  { id:"hw_C5", category:"hardware", path:"C", pathName:"Durabilidade", tier:5,
    name:"Protecção IP67 Oficial", description:"Resistência a água e pó certificada — aventura sem limites.",
    effectLabel:"-28% risco defeito, +12 rep", cost:4_050_000, timeMonths:8,
    requires:["hw_C4"], bonus:{riskMod:0.72, repBonus:12}, minYear:1993 },

  { id:"hw_C6", category:"hardware", path:"C", pathName:"Durabilidade", tier:6,
    name:"Módulos Substituíveis pelo Utilizador", description:"Bateria, ecrã e joysticks substituíveis em casa — zero e-lixo.",
    effectLabel:"-35% risco defeito, +18 rep, +20k fãs", cost:12_000_000, timeMonths:9,
    requires:["hw_C5"], bonus:{riskMod:0.65, repBonus:18, fansBonus:20000}, minYear:2002 },

  { id:"hw_C7", category:"hardware", path:"C", pathName:"Durabilidade", tier:7,
    name:"Sistema de Auto-Diagnóstico", description:"O console detecta e isola falhas antes de causarem problemas.",
    effectLabel:"-42% risco defeito, +22 rep", cost:30_000_000, timeMonths:11,
    requires:["hw_C6"], bonus:{riskMod:0.58, repBonus:22}, minYear:2013 },

  { id:"hw_C8", category:"hardware", path:"C", pathName:"Durabilidade", tier:8,
    name:"Materiais de Engenharia Verde", description:"Ligas de titânio bio-recicladas — durável e sustentável.",
    effectLabel:"-50% risco defeito, +28 rep, +50k fãs", cost:80_000_000, timeMonths:13,
    requires:["hw_C7"], bonus:{riskMod:0.50, repBonus:28, fansBonus:50000}, minYear:2022 },

  { id:"hw_C9", category:"hardware", path:"C", pathName:"Durabilidade", tier:9,
    name:"Tecnologia Auto-Reparadora", description:"Micro-cápsulas de polímero que selam arranhões e microfissuras automaticamente.",
    effectLabel:"-60% risco defeito, +38 rep", cost:230_000_000, timeMonths:16,
    requires:["hw_C8"], bonus:{riskMod:0.40, repBonus:38}, minYear:2037 },

  { id:"hw_C10", category:"hardware", path:"C", pathName:"Durabilidade", tier:10,
    name:"Hardware Eterno", description:"Componentes auto-replicantes que nunca degradam — garantia vitalícia literal.",
    effectLabel:"-75% risco defeito, +60 rep, +300k fãs", cost:650_000_000, timeMonths:22,
    requires:["hw_C9"], bonus:{riskMod:0.25, repBonus:60, fansBonus:300000}, minYear:2055 },

  // ══════════════════════════════════════════════════════════════════════════
  // GAMES — A: Narrativa
  // ══════════════════════════════════════════════════════════════════════════
  { id:"games_A4", category:"games", path:"A", pathName:"Narrativa", tier:4,
    name:"Localização Multi-Idioma", description:"12 idiomas na launch — mercado global desde o dia 1.",
    effectLabel:"+18% vendas, +15k fãs", cost:1_550_000, timeMonths:6,
    requires:["games_A3"], bonus:{salesMult:1.18, fansBonus:15000}, minYear:1985 },

  { id:"games_A5", category:"games", path:"A", pathName:"Narrativa", tier:5,
    name:"Motion Capture de Actores", description:"Animações baseadas em captura real — expressões e movimento cinematográficos.",
    effectLabel:"+0.6 rating, +25% receita jogos", cost:4_500_000, timeMonths:8,
    requires:["games_A4"], bonus:{ratingBonus:0.6, gameRevMult:1.25}, minYear:1993 },

  { id:"games_A6", category:"games", path:"A", pathName:"Narrativa", tier:6,
    name:"Dublagem Profissional Completa", description:"Elenco de 200+ actores de voz — cada NPC tem voz única.",
    effectLabel:"+0.8 rating, +30% receita jogos, +8 rep", cost:14_000_000, timeMonths:9,
    requires:["games_A5"], bonus:{ratingBonus:0.8, gameRevMult:1.30, repBonus:8}, minYear:2001 },

  { id:"games_A7", category:"games", path:"A", pathName:"Narrativa", tier:7,
    name:"Narrativa Não-Linear Open World", description:"Mundos abertos com histórias que o jogador co-escreve pelas suas escolhas.",
    effectLabel:"+1.2 rating, +40% receita jogos, +20 rep", cost:36_000_000, timeMonths:11,
    requires:["games_A6"], bonus:{ratingBonus:1.2, gameRevMult:1.40, repBonus:20}, minYear:2009 },

  { id:"games_A8", category:"games", path:"A", pathName:"Narrativa", tier:8,
    name:"Narrativa Dinâmica com IA", description:"A história adapta-se em tempo real ao estado emocional do jogador.",
    effectLabel:"+1.8 rating, +50% receita jogos, +30 rep", cost:90_000_000, timeMonths:13,
    requires:["games_A7"], bonus:{ratingBonus:1.8, gameRevMult:1.50, repBonus:30}, minYear:2018 },

  { id:"games_A9", category:"games", path:"A", pathName:"Narrativa", tier:9,
    name:"Personagens com IA Autónoma", description:"NPCs com memória, objetivos e emoções próprias — relações genuínas.",
    effectLabel:"+3.0 rating, +65% receita jogos, +50 rep", cost:250_000_000, timeMonths:16,
    requires:["games_A8"], bonus:{ratingBonus:3.0, gameRevMult:1.65, repBonus:50}, minYear:2030 },

  { id:"games_A10", category:"games", path:"A", pathName:"Narrativa", tier:10,
    name:"Narrativa Infinita Gerada por IA", description:"História única para cada jogador, gerada em tempo real — replay eterno.",
    effectLabel:"+5.0 rating, +90% receita jogos, +80 rep", cost:750_000_000, timeMonths:22,
    requires:["games_A9"], bonus:{ratingBonus:5.0, gameRevMult:1.90, repBonus:80}, minYear:2048 },

  // ── GAMES B: Gameplay ────────────────────────────────────────────────────
  { id:"games_B4", category:"games", path:"B", pathName:"Gameplay", tier:4,
    name:"Co-op e Versus Local", description:"4 jogadores no mesmo ecrã — o gaming como evento social.",
    effectLabel:"+18% receita jogos, +12k fãs", cost:1_450_000, timeMonths:6,
    requires:["games_B3"], bonus:{gameRevMult:1.18, fansBonus:12000}, minYear:1984 },

  { id:"games_B5", category:"games", path:"B", pathName:"Gameplay", tier:5,
    name:"Multijogador Online Dedicado", description:"Servidores próprios para 32 jogadores — ping estável em todo o mundo.",
    effectLabel:"+28% receita jogos, +30k fãs", cost:4_950_000, timeMonths:8,
    requires:["games_B4"], bonus:{gameRevMult:1.28, fansBonus:30000}, minYear:1993 },

  { id:"games_B6", category:"games", path:"B", pathName:"Gameplay", tier:6,
    name:"Framework MMO", description:"Infra-estrutura para mundos persistentes com 10 000 jogadores simultâneos.",
    effectLabel:"+38% receita jogos, +60k fãs, +10 rep", cost:15_000_000, timeMonths:9,
    requires:["games_B5"], bonus:{gameRevMult:1.38, fansBonus:60000, repBonus:10}, minYear:2001 },

  { id:"games_B7", category:"games", path:"B", pathName:"Gameplay", tier:7,
    name:"Sistemas Battle Royale", description:"100 jogadores, 1 vencedor — o formato que redefiniu o gaming competitivo.",
    effectLabel:"+48% receita jogos, +100k fãs, +15 rep", cost:38_000_000, timeMonths:11,
    requires:["games_B6"], bonus:{gameRevMult:1.48, fansBonus:100000, repBonus:15}, minYear:2010 },

  { id:"games_B8", category:"games", path:"B", pathName:"Gameplay", tier:8,
    name:"Live Service & Season Pass", description:"Conteúdo contínuo — o jogo nunca está terminado, a receita nunca para.",
    effectLabel:"+60% receita jogos, +200k fãs, +20 rep", cost:90_000_000, timeMonths:13,
    requires:["games_B7"], bonus:{gameRevMult:1.60, fansBonus:200000, repBonus:20}, minYear:2019 },

  { id:"games_B9", category:"games", path:"B", pathName:"Gameplay", tier:9,
    name:"Metaverse Gaming", description:"Mundos virtuais persistentes com economia própria — o próximo passo social.",
    effectLabel:"+75% receita jogos, +500k fãs, +30 rep", cost:260_000_000, timeMonths:16,
    requires:["games_B8"], bonus:{gameRevMult:1.75, fansBonus:500000, repBonus:30}, minYear:2030 },

  { id:"games_B10", category:"games", path:"B", pathName:"Gameplay", tier:10,
    name:"Reality Blending Gameplay", description:"O jogo estende-se para o mundo real — missões físicas e sociais.",
    effectLabel:"+100% receita jogos, +1M fãs, +50 rep", cost:750_000_000, timeMonths:22,
    requires:["games_B9"], bonus:{gameRevMult:2.00, fansBonus:1000000, repBonus:50}, minYear:2050 },

  // ── GAMES C: Áudio ───────────────────────────────────────────────────────
  { id:"games_C4", category:"games", path:"C", pathName:"Áudio", tier:4,
    name:"Stereo Completo", description:"Dois canais de áudio independentes — posicionamento básico dos sons.",
    effectLabel:"+12% receita jogos, +5 rep", cost:1_300_000, timeMonths:6,
    requires:["games_C3"], bonus:{gameRevMult:1.12, repBonus:5}, minYear:1985 },

  { id:"games_C5", category:"games", path:"C", pathName:"Áudio", tier:5,
    name:"Qualidade de Áudio CD", description:"48 kHz / 16-bit PCM — música de jogo ao nível da discografia comercial.",
    effectLabel:"+18% receita jogos, +8 rep, +10k fãs", cost:3_800_000, timeMonths:8,
    requires:["games_C4"], bonus:{gameRevMult:1.18, repBonus:8, fansBonus:10000}, minYear:1993 },

  { id:"games_C6", category:"games", path:"C", pathName:"Áudio", tier:6,
    name:"Surround 5.1 & 7.1", description:"Posicionamento preciso de sons em 360° — ouves o inimigo antes de o ver.",
    effectLabel:"+25% receita jogos, +12 rep, +20k fãs", cost:12_000_000, timeMonths:9,
    requires:["games_C5"], bonus:{gameRevMult:1.25, repBonus:12, fansBonus:20000}, minYear:2001 },

  { id:"games_C7", category:"games", path:"C", pathName:"Áudio", tier:7,
    name:"Áudio Espacial Binaural", description:"HRTF personalizado — presença física total apenas com headphones.",
    effectLabel:"+32% receita jogos, +18 rep, +35k fãs", cost:32_000_000, timeMonths:11,
    requires:["games_C6"], bonus:{gameRevMult:1.32, repBonus:18, fansBonus:35000}, minYear:2010 },

  { id:"games_C8", category:"games", path:"C", pathName:"Áudio", tier:8,
    name:"Dolby Atmos & Soniq 360 Gaming", description:"Padrão industrial de áudio tridimensional — acima, abaixo, à volta.",
    effectLabel:"+40% receita jogos, +25 rep, +60k fãs", cost:82_000_000, timeMonths:13,
    requires:["games_C7"], bonus:{gameRevMult:1.40, repBonus:25, fansBonus:60000}, minYear:2018 },

  { id:"games_C9", category:"games", path:"C", pathName:"Áudio", tier:9,
    name:"Áudio Adaptativo com IA", description:"A música, efeitos e voice acting adaptam-se em tempo real ao contexto.",
    effectLabel:"+52% receita jogos, +35 rep, +100k fãs", cost:240_000_000, timeMonths:16,
    requires:["games_C8"], bonus:{gameRevMult:1.52, repBonus:35, fansBonus:100000}, minYear:2028 },

  { id:"games_C10", category:"games", path:"C", pathName:"Áudio", tier:10,
    name:"Imersão Auditiva Neural", description:"O som é gerado directamente nos centros auditivos — perfeição sensorial.",
    effectLabel:"+70% receita jogos, +55 rep, +300k fãs", cost:700_000_000, timeMonths:22,
    requires:["games_C9"], bonus:{gameRevMult:1.70, repBonus:55, fansBonus:300000}, minYear:2050 },

  // ══════════════════════════════════════════════════════════════════════════
  // BUSINESS — A: Marketing
  // ══════════════════════════════════════════════════════════════════════════
  { id:"biz_A4", category:"business", path:"A", pathName:"Marketing", tier:4,
    name:"Campanhas de TV em Horário Nobre", description:"Anúncios de 60 segundos durante os programas mais vistos da semana.",
    effectLabel:"+25% eficiência marketing, +20k fãs", cost:1_700_000, timeMonths:6,
    requires:["biz_A3"], bonus:{campaignMult:1.25, fansBonus:20000}, minYear:1983 },

  { id:"biz_A5", category:"business", path:"A", pathName:"Marketing", tier:5,
    name:"Marketing de Guerrilha", description:"Acções de rua, flash mobs e PR surpreendente que viraliza na imprensa.",
    effectLabel:"+35% eficiência marketing, +40k fãs", cost:4_950_000, timeMonths:8,
    requires:["biz_A4"], bonus:{campaignMult:1.35, fansBonus:40000}, minYear:1995 },

  { id:"biz_A6", category:"business", path:"A", pathName:"Marketing", tier:6,
    name:"Marketing Digital Programático", description:"Compra automatizada de média digital com targeting baseado em dados.",
    effectLabel:"+45% eficiência marketing, +80k fãs", cost:14_000_000, timeMonths:9,
    requires:["biz_A5"], bonus:{campaignMult:1.45, fansBonus:80000}, minYear:2003 },

  { id:"biz_A7", category:"business", path:"A", pathName:"Marketing", tier:7,
    name:"Ecossistema de Influenciadores", description:"Rede de 500+ criadores de conteúdo com contratos de longo prazo.",
    effectLabel:"+60% eficiência marketing, +200k fãs", cost:36_000_000, timeMonths:11,
    requires:["biz_A6"], bonus:{campaignMult:1.60, fansBonus:200000}, minYear:2011 },

  { id:"biz_A8", category:"business", path:"A", pathName:"Marketing", tier:8,
    name:"Campanha Omni-Canal com IA", description:"IA optimiza mensagem, timing e canal para cada segmento de público.",
    effectLabel:"+80% eficiência marketing, +400k fãs, +15 rep", cost:88_000_000, timeMonths:13,
    requires:["biz_A7"], bonus:{campaignMult:1.80, fansBonus:400000, repBonus:15}, minYear:2019 },

  { id:"biz_A9", category:"business", path:"A", pathName:"Marketing", tier:9,
    name:"Marketing Preditivo e Personalizado", description:"Mensagem certa, pessoa certa, momento certo — zero desperdício.",
    effectLabel:"+110% eficiência marketing, +800k fãs", cost:250_000_000, timeMonths:16,
    requires:["biz_A8"], bonus:{campaignMult:2.10, fansBonus:800000}, minYear:2028 },

  { id:"biz_A10", category:"business", path:"A", pathName:"Marketing", tier:10,
    name:"Marketing Neural Directo", description:"Experiências de marca injectadas directamente na memória — ética questionável.",
    effectLabel:"+160% eficiência marketing, +2M fãs", cost:700_000_000, timeMonths:22,
    requires:["biz_A9"], bonus:{campaignMult:2.60, fansBonus:2000000, riskMod:1.25}, minYear:2048,
    riskLabel:"+25% exposição a escândalos regulatórios" },

  // ── BUSINESS B: Contratos ────────────────────────────────────────────────
  { id:"biz_B4", category:"business", path:"B", pathName:"Contratos", tier:4,
    name:"Acordos de Licenciamento Regional", description:"Parcerias regionais para distribuição localizada em 10+ países.",
    effectLabel:"+20% vendas globais, +10k fãs", cost:1_850_000, timeMonths:6,
    requires:["biz_B3"], bonus:{salesMult:1.20, fansBonus:10000}, minYear:1984 },

  { id:"biz_B5", category:"business", path:"B", pathName:"Contratos", tier:5,
    name:"Fusões e Aquisições Selectivas", description:"Compra de estúdios independentes para expandir o catálogo.",
    effectLabel:"+30% receita jogos, +20% vendas", cost:5_400_000, timeMonths:8,
    requires:["biz_B4"], bonus:{gameRevMult:1.30, salesMult:1.20}, minYear:1995 },

  { id:"biz_B6", category:"business", path:"B", pathName:"Contratos", tier:6,
    name:"Publisher Global AAA", description:"Acordos de publicação com os maiores títulos do mundo.",
    effectLabel:"+40% receita jogos, +30% vendas, +15 rep", cost:16_000_000, timeMonths:9,
    requires:["biz_B5"], bonus:{gameRevMult:1.40, salesMult:1.30, repBonus:15}, minYear:2003 },

  { id:"biz_B7", category:"business", path:"B", pathName:"Contratos", tier:7,
    name:"Parcerias com Plataformas de Streaming", description:"Jogos disponíveis no Netflix, Disney+ e Amazon — alcance imediato.",
    effectLabel:"+50% receita jogos, +500k fãs", cost:38_000_000, timeMonths:11,
    requires:["biz_B6"], bonus:{gameRevMult:1.50, fansBonus:500000}, minYear:2012 },

  { id:"biz_B8", category:"business", path:"B", pathName:"Contratos", tier:8,
    name:"Contratos de Exclusividade Temporal Premium", description:"12 meses de exclusividade paga — a concorrência vende mas não tem.",
    effectLabel:"+65% receita jogos, +40% vendas, +20 rep", cost:90_000_000, timeMonths:13,
    requires:["biz_B7"], bonus:{gameRevMult:1.65, salesMult:1.40, repBonus:20}, minYear:2020 },

  { id:"biz_B9", category:"business", path:"B", pathName:"Contratos", tier:9,
    name:"Oligopólio de Distribuição", description:"Controlo de 3 das 5 maiores redes de distribuição global.",
    effectLabel:"+80% receita jogos, +55% vendas", cost:260_000_000, timeMonths:16,
    requires:["biz_B8"], bonus:{gameRevMult:1.80, salesMult:1.55}, minYear:2031 },

  { id:"biz_B10", category:"business", path:"B", pathName:"Contratos", tier:10,
    name:"Monopólio de Plataforma Global", description:"Uma plataforma para governar tudo — dominância total do mercado.",
    effectLabel:"+120% receita jogos, +80% vendas, +50 rep", cost:750_000_000, timeMonths:22,
    requires:["biz_B9"], bonus:{gameRevMult:2.20, salesMult:1.80, repBonus:50, riskMod:1.30}, minYear:2046,
    riskLabel:"+30% risco anti-trust e regulação" },

  // ── BUSINESS C: Loja Digital ─────────────────────────────────────────────
  { id:"biz_C4", category:"business", path:"C", pathName:"Loja Digital", tier:4,
    name:"Microtransacções Cosméticas", description:"DLCs de aparência opcional — receita extra sem pay-to-win.",
    effectLabel:"+25% receita jogos, +15k fãs", cost:1_700_000, timeMonths:6,
    requires:["biz_C3"], bonus:{gameRevMult:1.25, fansBonus:15000}, minYear:1986 },

  { id:"biz_C5", category:"business", path:"C", pathName:"Loja Digital", tier:5,
    name:"Modelos de Assinatura Mensal", description:"Receita recorrente previsível — o utilizador paga todos os meses.",
    effectLabel:"+35% receita jogos, +30k fãs", cost:5_200_000, timeMonths:8,
    requires:["biz_C4"], bonus:{gameRevMult:1.35, fansBonus:30000}, minYear:1995 },

  { id:"biz_C6", category:"business", path:"C", pathName:"Loja Digital", tier:6,
    name:"Loja de Itens Virtuais Globais", description:"Mercado de itens digitais com economia própria e preços de mercado.",
    effectLabel:"+45% receita jogos, +60k fãs, +10 rep", cost:14_000_000, timeMonths:9,
    requires:["biz_C5"], bonus:{gameRevMult:1.45, fansBonus:60000, repBonus:10}, minYear:2003 },

  { id:"biz_C7", category:"business", path:"C", pathName:"Loja Digital", tier:7,
    name:"Publicação de Jogos Independentes", description:"Plataforma aberta para criadores indie — long tail de conteúdo.",
    effectLabel:"+55% receita jogos, +120k fãs, +15 rep", cost:36_000_000, timeMonths:11,
    requires:["biz_C6"], bonus:{gameRevMult:1.55, fansBonus:120000, repBonus:15}, minYear:2011 },

  { id:"biz_C8", category:"business", path:"C", pathName:"Loja Digital", tier:8,
    name:"Ecossistema de Criadores", description:"Ferramentas para utilizadores criarem e venderem conteúdo dentro dos jogos.",
    effectLabel:"+70% receita jogos, +300k fãs, +25 rep", cost:88_000_000, timeMonths:13,
    requires:["biz_C7"], bonus:{gameRevMult:1.70, fansBonus:300000, repBonus:25}, minYear:2019 },

  { id:"biz_C9", category:"business", path:"C", pathName:"Loja Digital", tier:9,
    name:"Economia Virtual Descentralizada", description:"Blockchain sob a superfície — propriedade real dos itens digitais.",
    effectLabel:"+90% receita jogos, +600k fãs", cost:250_000_000, timeMonths:16,
    requires:["biz_C8"], bonus:{gameRevMult:1.90, fansBonus:600000}, minYear:2029 },

  { id:"biz_C10", category:"business", path:"C", pathName:"Loja Digital", tier:10,
    name:"Plataforma de Vida Digital Completa", description:"A tua plataforma é onde os utilizadores vivem, trabalham e jogam.",
    effectLabel:"+130% receita jogos, +2M fãs, +60 rep", cost:700_000_000, timeMonths:22,
    requires:["biz_C9"], bonus:{gameRevMult:2.30, fansBonus:2000000, repBonus:60}, minYear:2048 },

  // ══════════════════════════════════════════════════════════════════════════
  // ONLINE — A: Multiplayer
  // ══════════════════════════════════════════════════════════════════════════
  { id:"online_A4", category:"online", path:"A", pathName:"Multiplayer", tier:4,
    name:"Modem Dial-Up para Consoles", description:"Conexão a 56kbps — o primeiro multijogador remoto da história.",
    effectLabel:"+15% receita jogos, +10k fãs", cost:1_550_000, timeMonths:6,
    requires:["online_A3"], bonus:{gameRevMult:1.15, fansBonus:10000}, minYear:1984 },

  { id:"online_A5", category:"online", path:"A", pathName:"Multiplayer", tier:5,
    name:"Servidores Dedicados Globais", description:"12 datacenters em 4 continentes — latência < 50ms para todos.",
    effectLabel:"+28% receita jogos, +40k fãs, +10 rep", cost:4_500_000, timeMonths:8,
    requires:["online_A4"], bonus:{gameRevMult:1.28, fansBonus:40000, repBonus:10}, minYear:1995 },

  { id:"online_A6", category:"online", path:"A", pathName:"Multiplayer", tier:6,
    name:"Sistema de Ranking Competitivo", description:"ELO global, divisões e temporadas — jogadores de todo o mundo.",
    effectLabel:"+38% receita jogos, +80k fãs, +15 rep", cost:13_000_000, timeMonths:9,
    requires:["online_A5"], bonus:{gameRevMult:1.38, fansBonus:80000, repBonus:15}, minYear:2003 },

  { id:"online_A7", category:"online", path:"A", pathName:"Multiplayer", tier:7,
    name:"Plataforma Esports Profissional", description:"Liga mundial com transmissão ao vivo e prémios de $5M+.",
    effectLabel:"+50% receita jogos, +200k fãs, +22 rep", cost:35_000_000, timeMonths:11,
    requires:["online_A6"], bonus:{gameRevMult:1.50, fansBonus:200000, repBonus:22}, minYear:2011 },

  { id:"online_A8", category:"online", path:"A", pathName:"Multiplayer", tier:8,
    name:"Matchmaking com IA Neural", description:"IA emparelha jogadores por estilo de jogo e capacidade — sempre próximo.",
    effectLabel:"+62% receita jogos, +400k fãs, +28 rep", cost:85_000_000, timeMonths:13,
    requires:["online_A7"], bonus:{gameRevMult:1.62, fansBonus:400000, repBonus:28}, minYear:2019 },

  { id:"online_A9", category:"online", path:"A", pathName:"Multiplayer", tier:9,
    name:"Gaming Social Imersivo", description:"Avatares hápticos, voz espacial e presença física em ambientes partilhados.",
    effectLabel:"+80% receita jogos, +800k fãs, +38 rep", cost:250_000_000, timeMonths:16,
    requires:["online_A8"], bonus:{gameRevMult:1.80, fansBonus:800000, repBonus:38}, minYear:2030 },

  { id:"online_A10", category:"online", path:"A", pathName:"Multiplayer", tier:10,
    name:"Realidade Partilhada Global", description:"1 bilhão de jogadores no mesmo mundo persistente em tempo real.",
    effectLabel:"+120% receita jogos, +3M fãs, +60 rep", cost:750_000_000, timeMonths:22,
    requires:["online_A9"], bonus:{gameRevMult:2.20, fansBonus:3000000, repBonus:60}, minYear:2050 },

  // ── ONLINE B: Infraestrutura ─────────────────────────────────────────────
  { id:"online_B4", category:"online", path:"B", pathName:"Infraestrutura", tier:4,
    name:"Anti-Cheat com Machine Learning", description:"Detecção comportamental de trapaças — 99% de precisão.",
    effectLabel:"-30% risco incidentes, +12 rep, +20k fãs", cost:1_700_000, timeMonths:6,
    requires:["online_B3"], bonus:{riskMod:0.70, repBonus:12, fansBonus:20000}, minYear:1985 },

  { id:"online_B5", category:"online", path:"B", pathName:"Infraestrutura", tier:5,
    name:"CDN de Jogos Global", description:"Conteúdo distribuído em 200+ edge nodes — downloads a velocidade máxima.",
    effectLabel:"+20% vendas, +18 rep", cost:4_950_000, timeMonths:8,
    requires:["online_B4"], bonus:{salesMult:1.20, repBonus:18}, minYear:1995 },

  { id:"online_B6", category:"online", path:"B", pathName:"Infraestrutura", tier:6,
    name:"Infra-Estrutura de Alta Disponibilidade", description:"99.999% uptime garantido — o servidor nunca cai nas horas de pico.",
    effectLabel:"+28% vendas, +22 rep, +50k fãs", cost:14_000_000, timeMonths:9,
    requires:["online_B5"], bonus:{salesMult:1.28, repBonus:22, fansBonus:50000}, minYear:2003 },

  { id:"online_B7", category:"online", path:"B", pathName:"Infraestrutura", tier:7,
    name:"Nuvem de Jogo Elástica", description:"Auto-scaling em segundos — 100.000 jogadores para 10 milhões sem aviso.",
    effectLabel:"+38% vendas, +28 rep, +100k fãs", cost:36_000_000, timeMonths:11,
    requires:["online_B6"], bonus:{salesMult:1.38, repBonus:28, fansBonus:100000}, minYear:2012 },

  { id:"online_B8", category:"online", path:"B", pathName:"Infraestrutura", tier:8,
    name:"Edge Computing para Gaming", description:"Computação nos nós de rede — latência < 1ms em qualquer lugar.",
    effectLabel:"+50% vendas, +35 rep, +200k fãs", cost:88_000_000, timeMonths:13,
    requires:["online_B7"], bonus:{salesMult:1.50, repBonus:35, fansBonus:200000}, minYear:2020 },

  { id:"online_B9", category:"online", path:"B", pathName:"Infraestrutura", tier:9,
    name:"Rede Quântica de Gaming", description:"Entanglement quântico para comunicações — latência fisicamente zero.",
    effectLabel:"+65% vendas, +48 rep, +500k fãs", cost:260_000_000, timeMonths:16,
    requires:["online_B8"], bonus:{salesMult:1.65, repBonus:48, fansBonus:500000}, minYear:2035 },

  { id:"online_B10", category:"online", path:"B", pathName:"Infraestrutura", tier:10,
    name:"Infra-Estrutura Global Auto-Evolutiva", description:"Rede que se expande, optimiza e repara autonomamente — eterna.",
    effectLabel:"+90% vendas, +70 rep, +1M fãs", cost:700_000_000, timeMonths:22,
    requires:["online_B9"], bonus:{salesMult:1.90, repBonus:70, fansBonus:1000000}, minYear:2050 },

  // ── ONLINE C: Comunidade ─────────────────────────────────────────────────
  { id:"online_C4", category:"online", path:"C", pathName:"Comunidade", tier:4,
    name:"Fórum Oficial e Wiki", description:"Comunidade centralizada com documentação colaborativa.",
    effectLabel:"+12% receita jogos, +15k fãs", cost:1_350_000, timeMonths:6,
    requires:["online_C3"], bonus:{gameRevMult:1.12, fansBonus:15000}, minYear:1984 },

  { id:"online_C5", category:"online", path:"C", pathName:"Comunidade", tier:5,
    name:"Sistema de Guildas e Clãs", description:"Organizações de jogadores com hierarquia e missões colectivas.",
    effectLabel:"+22% receita jogos, +40k fãs", cost:4_300_000, timeMonths:8,
    requires:["online_C4"], bonus:{gameRevMult:1.22, fansBonus:40000}, minYear:1995 },

  { id:"online_C6", category:"online", path:"C", pathName:"Comunidade", tier:6,
    name:"Transmissão ao Vivo Integrada", description:"Streaming de gameplay directamente da plataforma para 10M espectadores.",
    effectLabel:"+32% receita jogos, +100k fãs, +12 rep", cost:14_000_000, timeMonths:9,
    requires:["online_C5"], bonus:{gameRevMult:1.32, fansBonus:100000, repBonus:12}, minYear:2003 },

  { id:"online_C7", category:"online", path:"C", pathName:"Comunidade", tier:7,
    name:"Plataforma de Criadores de Conteúdo", description:"Ferramentas de vídeo, edição e monetização — o YouTube do gaming.",
    effectLabel:"+45% receita jogos, +300k fãs, +20 rep", cost:36_000_000, timeMonths:11,
    requires:["online_C6"], bonus:{gameRevMult:1.45, fansBonus:300000, repBonus:20}, minYear:2011 },

  { id:"online_C8", category:"online", path:"C", pathName:"Comunidade", tier:8,
    name:"IA de Moderação Comunitária", description:"Ambiente seguro garantido por IA — zero toxicidade, 100% inclusivo.",
    effectLabel:"+58% receita jogos, +600k fãs, +28 rep", cost:88_000_000, timeMonths:13,
    requires:["online_C7"], bonus:{gameRevMult:1.58, fansBonus:600000, repBonus:28}, minYear:2019 },

  { id:"online_C9", category:"online", path:"C", pathName:"Comunidade", tier:9,
    name:"Comunidade Autogovernada", description:"DAO de jogadores que votam em features, regras e moderação.",
    effectLabel:"+75% receita jogos, +1M fãs, +40 rep", cost:250_000_000, timeMonths:16,
    requires:["online_C8"], bonus:{gameRevMult:1.75, fansBonus:1000000, repBonus:40}, minYear:2030 },

  { id:"online_C10", category:"online", path:"C", pathName:"Comunidade", tier:10,
    name:"Civilização Digital", description:"A tua plataforma tornou-se uma sociedade — leis, cultura e identidade próprias.",
    effectLabel:"+110% receita jogos, +5M fãs, +65 rep", cost:750_000_000, timeMonths:22,
    requires:["online_C9"], bonus:{gameRevMult:2.10, fansBonus:5000000, repBonus:65}, minYear:2050 },

  // ══════════════════════════════════════════════════════════════════════════
  // INNOVATION — A: VR / AR
  // ══════════════════════════════════════════════════════════════════════════
  { id:"innov_A4", category:"innovation", path:"A", pathName:"VR / AR", tier:4,
    name:"Periféricos de Realidade Virtual", description:"Luvas de dados e capacetes VR de primeira geração para o mercado.",
    effectLabel:"+1.0 rating, +18% receita jogos, +20k fãs", cost:1_850_000, timeMonths:6,
    requires:["innov_A3"], bonus:{ratingBonus:1.0, gameRevMult:1.18, fansBonus:20000}, minYear:1988 },

  { id:"innov_A5", category:"innovation", path:"A", pathName:"VR / AR", tier:5,
    name:"VR de Campo de Visão Total", description:"180° de campo de visão com foveated rendering — presença real.",
    effectLabel:"+1.8 rating, +28% receita jogos, +50k fãs", cost:4_950_000, timeMonths:8,
    requires:["innov_A4"], bonus:{ratingBonus:1.8, gameRevMult:1.28, fansBonus:50000}, minYear:1997 },

  { id:"innov_A6", category:"innovation", path:"A", pathName:"VR / AR", tier:6,
    name:"AR Sem Marcadores", description:"Rastreamento do mundo real em tempo real — objectos digitais integrados.",
    effectLabel:"+2.5 rating, +38% receita jogos, +80k fãs", cost:14_000_000, timeMonths:9,
    requires:["innov_A5"], bonus:{ratingBonus:2.5, gameRevMult:1.38, fansBonus:80000}, minYear:2005 },

  { id:"innov_A7", category:"innovation", path:"A", pathName:"VR / AR", tier:7,
    name:"Mixed Reality Sem Dispositivo", description:"Projecção ambiental de hologramas — gaming sem óculos nem headset.",
    effectLabel:"+3.5 rating, +50% receita jogos, +150k fãs, +20 rep", cost:36_000_000, timeMonths:11,
    requires:["innov_A6"], bonus:{ratingBonus:3.5, gameRevMult:1.50, fansBonus:150000, repBonus:20}, minYear:2015 },

  { id:"innov_A8", category:"innovation", path:"A", pathName:"VR / AR", tier:8,
    name:"Reality Synthesis", description:"Fusão de dados do mundo real em ambientes de jogo fotorealistas ao vivo.",
    effectLabel:"+5.0 rating, +65% receita jogos, +300k fãs, +30 rep", cost:90_000_000, timeMonths:13,
    requires:["innov_A7"], bonus:{ratingBonus:5.0, gameRevMult:1.65, fansBonus:300000, repBonus:30}, minYear:2025 },

  { id:"innov_A9", category:"innovation", path:"A", pathName:"VR / AR", tier:9,
    name:"Presença Física Total em Ambiente Virtual", description:"Feedback háptico de corpo inteiro — o jogador sente o jogo.",
    effectLabel:"+7.0 rating, +80% receita jogos, +600k fãs", cost:270_000_000, timeMonths:16,
    requires:["innov_A8"], bonus:{ratingBonus:7.0, gameRevMult:1.80, fansBonus:600000}, minYear:2038 },

  { id:"innov_A10", category:"innovation", path:"A", pathName:"VR / AR", tier:10,
    name:"Realidade Alternativa Completa", description:"Mundos virtuais indistinguíveis da realidade — ética e filosofia em debate.",
    effectLabel:"+10.0 rating, +100% receita jogos, +2M fãs, +50 rep", cost:800_000_000, timeMonths:22,
    requires:["innov_A9"], bonus:{ratingBonus:10.0, gameRevMult:2.00, fansBonus:2000000, repBonus:50}, minYear:2055 },

  // ── INNOVATION B: IA nos Jogos ───────────────────────────────────────────
  { id:"innov_B4", category:"innovation", path:"B", pathName:"IA nos Jogos", tier:4,
    name:"Pathfinding A* Avançado", description:"NPCs que navegam mundos complexos de forma inteligente e eficiente.",
    effectLabel:"+18% receita jogos, +5 rep", cost:1_600_000, timeMonths:6,
    requires:["innov_B3"], bonus:{gameRevMult:1.18, repBonus:5}, minYear:1986 },

  { id:"innov_B5", category:"innovation", path:"B", pathName:"IA nos Jogos", tier:5,
    name:"Redes Neurais para NPCs", description:"Personagens que aprendem com o comportamento do jogador e evoluem.",
    effectLabel:"+28% receita jogos, +12 rep, +30k fãs", cost:4_700_000, timeMonths:8,
    requires:["innov_B4"], bonus:{gameRevMult:1.28, repBonus:12, fansBonus:30000}, minYear:1996 },

  { id:"innov_B6", category:"innovation", path:"B", pathName:"IA nos Jogos", tier:6,
    name:"Director Dramático com IA", description:"IA gere o ritmo da narrativa — tensão, clímax e alivio no momento certo.",
    effectLabel:"+38% receita jogos, +20 rep, +60k fãs", cost:14_000_000, timeMonths:9,
    requires:["innov_B5"], bonus:{gameRevMult:1.38, repBonus:20, fansBonus:60000}, minYear:2004 },

  { id:"innov_B7", category:"innovation", path:"B", pathName:"IA nos Jogos", tier:7,
    name:"Sistemas de IA Emergente", description:"NPCs com objectivos próprios que criam histórias não programadas.",
    effectLabel:"+50% receita jogos, +30 rep, +100k fãs", cost:36_000_000, timeMonths:11,
    requires:["innov_B6"], bonus:{gameRevMult:1.50, repBonus:30, fansBonus:100000}, minYear:2013 },

  { id:"innov_B8", category:"innovation", path:"B", pathName:"IA nos Jogos", tier:8,
    name:"Large Language Models para Diálogo", description:"NPCs com conversação livre em linguagem natural — qualquer pergunta, resposta.",
    effectLabel:"+65% receita jogos, +45 rep, +250k fãs", cost:90_000_000, timeMonths:13,
    requires:["innov_B7"], bonus:{gameRevMult:1.65, repBonus:45, fansBonus:250000}, minYear:2022 },

  { id:"innov_B9", category:"innovation", path:"B", pathName:"IA nos Jogos", tier:9,
    name:"Consciência Artificial Simulada", description:"NPCs com modelo de self, emoções e memória de longo prazo.",
    effectLabel:"+85% receita jogos, +65 rep, +600k fãs", cost:260_000_000, timeMonths:16,
    requires:["innov_B8"], bonus:{gameRevMult:1.85, repBonus:65, fansBonus:600000}, minYear:2035 },

  { id:"innov_B10", category:"innovation", path:"B", pathName:"IA nos Jogos", tier:10,
    name:"IA como Co-Designer do Jogo", description:"IA gera, testa e melhora conteúdo de jogo em tempo real — autónoma.",
    effectLabel:"+120% receita jogos, +90 rep, +2M fãs", cost:750_000_000, timeMonths:22,
    requires:["innov_B9"], bonus:{gameRevMult:2.20, repBonus:90, fansBonus:2000000}, minYear:2050 },

  // ── INNOVATION C: Procedural ─────────────────────────────────────────────
  { id:"innov_C4", category:"innovation", path:"C", pathName:"Procedural", tier:4,
    name:"Dungeons Procedurais", description:"Masmorras infinitas com layout único a cada sessão — roguelike perfeito.",
    effectLabel:"+18% receita jogos, +10k fãs", cost:1_550_000, timeMonths:6,
    requires:["innov_C3"], bonus:{gameRevMult:1.18, fansBonus:10000}, minYear:1984 },

  { id:"innov_C5", category:"innovation", path:"C", pathName:"Procedural", tier:5,
    name:"Galáxias Procedurais", description:"Universos de billions de estrelas gerados matematicamente.",
    effectLabel:"+28% receita jogos, +30k fãs, +8 rep", cost:4_500_000, timeMonths:8,
    requires:["innov_C4"], bonus:{gameRevMult:1.28, fansBonus:30000, repBonus:8}, minYear:1994 },

  { id:"innov_C6", category:"innovation", path:"C", pathName:"Procedural", tier:6,
    name:"Cidades e Civilizações Procedurais", description:"Sociedades com economia, política e cultura geradas e evoluídas.",
    effectLabel:"+38% receita jogos, +60k fãs, +15 rep", cost:13_000_000, timeMonths:9,
    requires:["innov_C5"], bonus:{gameRevMult:1.38, fansBonus:60000, repBonus:15}, minYear:2003 },

  { id:"innov_C7", category:"innovation", path:"C", pathName:"Procedural", tier:7,
    name:"Arte e Música Procedurais", description:"Assets visuais e sonoros únicos gerados para cada jogador.",
    effectLabel:"+50% receita jogos, +100k fãs, +22 rep", cost:35_000_000, timeMonths:11,
    requires:["innov_C6"], bonus:{gameRevMult:1.50, fansBonus:100000, repBonus:22}, minYear:2013 },

  { id:"innov_C8", category:"innovation", path:"C", pathName:"Procedural", tier:8,
    name:"Narrativa e Personagens Procedurais", description:"Histórias e protagonistas únicos — nenhum jogador tem a mesma experiência.",
    effectLabel:"+65% receita jogos, +250k fãs, +35 rep", cost:88_000_000, timeMonths:13,
    requires:["innov_C7"], bonus:{gameRevMult:1.65, fansBonus:250000, repBonus:35}, minYear:2022 },

  { id:"innov_C9", category:"innovation", path:"C", pathName:"Procedural", tier:9,
    name:"Universo Jogável Procedural", description:"Realidade simulada completa com física, biologia e história emergentes.",
    effectLabel:"+85% receita jogos, +600k fãs, +50 rep", cost:260_000_000, timeMonths:16,
    requires:["innov_C8"], bonus:{gameRevMult:1.85, fansBonus:600000, repBonus:50}, minYear:2036 },

  { id:"innov_C10", category:"innovation", path:"C", pathName:"Procedural", tier:10,
    name:"Simulação de Realidade Completa", description:"Universo computacionalmente equivalente à realidade física.",
    effectLabel:"+120% receita jogos, +3M fãs, +80 rep", cost:800_000_000, timeMonths:22,
    requires:["innov_C9"], bonus:{gameRevMult:2.20, fansBonus:3000000, repBonus:80}, minYear:2055 },

  // ══════════════════════════════════════════════════════════════════════════
  // SILICON — A: Arquitetura CPU
  // ══════════════════════════════════════════════════════════════════════════
  { id:"sil_A4", category:"silicon", path:"A", pathName:"Arquitetura CPU", tier:4,
    name:"CPU 128-bit RISC", description:"Arquitectura RISC de 128 bits — base para os grandes consoles de 5ª geração.",
    effectLabel:"+1.5 rating, +25% vendas, +10 rep", cost:2_150_000, timeMonths:6,
    requires:["sil_A3"], bonus:{ratingBonus:1.5, salesMult:1.25, repBonus:10}, minYear:1984 },

  { id:"sil_A5", category:"silicon", path:"A", pathName:"Arquitetura CPU", tier:5,
    name:"SoC Integrado de 7nm", description:"CPU+GPU+Cache L3 num único chip de 7nm — eficiência e performance.",
    effectLabel:"+2.0 rating, +32% vendas, -12% custo, +15 rep", cost:5_400_000, timeMonths:8,
    requires:["sil_A4"], bonus:{ratingBonus:2.0, salesMult:1.32, costMult:0.88, repBonus:15}, minYear:1994 },

  { id:"sil_A6", category:"silicon", path:"A", pathName:"Arquitetura CPU", tier:6,
    name:"Processador de 4nm com Cache Inteligente", description:"Nó de 4nm com cache adaptativa — instruções de jogo em velocidade óptica.",
    effectLabel:"+2.8 rating, +40% vendas, -18% custo, +20 rep", cost:16_000_000, timeMonths:9,
    requires:["sil_A5"], bonus:{ratingBonus:2.8, salesMult:1.40, costMult:0.82, repBonus:20}, minYear:2004 },

  { id:"sil_A7", category:"silicon", path:"A", pathName:"Arquitetura CPU", tier:7,
    name:"CPU Photonics", description:"Comunicações inter-núcleo por fotões — latência de ciclo única.",
    effectLabel:"+4.0 rating, +50% vendas, +30 rep", cost:40_000_000, timeMonths:11,
    requires:["sil_A6"], bonus:{ratingBonus:4.0, salesMult:1.50, repBonus:30}, minYear:2015 },

  { id:"sil_A8", category:"silicon", path:"A", pathName:"Arquitetura CPU", tier:8,
    name:"Chips de 1nm Extremo UV", description:"Litografia extrema ultravioleta — 100 bilhões de transístores por cm².",
    effectLabel:"+5.5 rating, +62% vendas, -25% custo, +40 rep", cost:100_000_000, timeMonths:13,
    requires:["sil_A7"], bonus:{ratingBonus:5.5, salesMult:1.62, costMult:0.75, repBonus:40}, minYear:2024 },

  { id:"sil_A9", category:"silicon", path:"A", pathName:"Arquitetura CPU", tier:9,
    name:"Transistores de Nanotubo de Carbono", description:"Além do silício — nanotubos de carbono para processamento sub-ångström.",
    effectLabel:"+8.0 rating, +80% vendas, -35% custo, +55 rep", cost:280_000_000, timeMonths:16,
    requires:["sil_A8"], bonus:{ratingBonus:8.0, salesMult:1.80, costMult:0.65, repBonus:55}, minYear:2038 },

  { id:"sil_A10", category:"silicon", path:"A", pathName:"Arquitetura CPU", tier:10,
    name:"Processador Quântico Universal", description:"Qubits estáveis para computação universal — o fim da lei de Moore.",
    effectLabel:"+12.0 rating, +100% vendas, +80 rep", cost:800_000_000, timeMonths:22,
    requires:["sil_A9"], bonus:{ratingBonus:12.0, salesMult:2.00, repBonus:80}, minYear:2052 },

  // ── SILICON B: GPU & Gráficos ────────────────────────────────────────────
  { id:"sil_B4", category:"silicon", path:"B", pathName:"GPU & Gráficos", tier:4,
    name:"GPU de Shader Programável", description:"Vertex e pixel shaders — efeitos visuais limitados apenas pela criatividade.",
    effectLabel:"+1.2 rating, +22% vendas, +8 rep", cost:1_850_000, timeMonths:6,
    requires:["sil_B3"], bonus:{ratingBonus:1.2, salesMult:1.22, repBonus:8}, minYear:1985 },

  { id:"sil_B5", category:"silicon", path:"B", pathName:"GPU & Gráficos", tier:5,
    name:"GPU de Alta Definição", description:"1080p a 60fps estável — o padrão HD que mudou tudo.",
    effectLabel:"+1.8 rating, +30% vendas, +12 rep", cost:5_200_000, timeMonths:8,
    requires:["sil_B4"], bonus:{ratingBonus:1.8, salesMult:1.30, repBonus:12}, minYear:1995 },

  { id:"sil_B6", category:"silicon", path:"B", pathName:"GPU & Gráficos", tier:6,
    name:"GPU 4K Native", description:"Resolução 4K a 60fps — cada pixel perfeito, sem upscaling.",
    effectLabel:"+2.5 rating, +38% vendas, +18 rep", cost:16_000_000, timeMonths:9,
    requires:["sil_B5"], bonus:{ratingBonus:2.5, salesMult:1.38, repBonus:18}, minYear:2006 },

  { id:"sil_B7", category:"silicon", path:"B", pathName:"GPU & Gráficos", tier:7,
    name:"GPU Ray Tracing Hardware Dedicado", description:"Núcleos RT dedicados — GI, sombras e reflexos em tempo real perfeitos.",
    effectLabel:"+3.5 rating, +48% vendas, +25 rep", cost:40_000_000, timeMonths:11,
    requires:["sil_B6"], bonus:{ratingBonus:3.5, salesMult:1.48, repBonus:25}, minYear:2016 },

  { id:"sil_B8", category:"silicon", path:"B", pathName:"GPU & Gráficos", tier:8,
    name:"Renderização Neural em Hardware", description:"Chip dedicado para DLSS e upscaling neural — qualidade impossível para o raster.",
    effectLabel:"+5.0 rating, +60% vendas, +35 rep", cost:95_000_000, timeMonths:13,
    requires:["sil_B7"], bonus:{ratingBonus:5.0, salesMult:1.60, repBonus:35}, minYear:2025 },

  { id:"sil_B9", category:"silicon", path:"B", pathName:"GPU & Gráficos", tier:9,
    name:"GPU de Path Tracing Completo", description:"Todos os raios de luz simulados fisicamente — fotorrealismo absoluto.",
    effectLabel:"+7.5 rating, +75% vendas, +50 rep", cost:270_000_000, timeMonths:16,
    requires:["sil_B8"], bonus:{ratingBonus:7.5, salesMult:1.75, repBonus:50}, minYear:2038 },

  { id:"sil_B10", category:"silicon", path:"B", pathName:"GPU & Gráficos", tier:10,
    name:"Holographic Rendering Engine", description:"Síntese de luz holográfica em hardware — o display não existe, só a luz.",
    effectLabel:"+12.0 rating, +100% vendas, +80 rep", cost:800_000_000, timeMonths:22,
    requires:["sil_B9"], bonus:{ratingBonus:12.0, salesMult:2.00, repBonus:80}, minYear:2055 },

  // ── SILICON C: Storage & Controlo ────────────────────────────────────────
  { id:"sil_C4", category:"silicon", path:"C", pathName:"Storage & Controlo", tier:4,
    name:"HDD Interno de Alta Capacidade", description:"20 GB de armazenamento — saves, DLCs e patches sem cartão extra.",
    effectLabel:"+0.8 rating, +18% vendas, +5 rep", cost:1_550_000, timeMonths:6,
    requires:["sil_C3"], bonus:{ratingBonus:0.8, salesMult:1.18, repBonus:5}, minYear:1985 },

  { id:"sil_C5", category:"silicon", path:"C", pathName:"Storage & Controlo", tier:5,
    name:"Controlo Dual Shock com Analógicos", description:"Dois analógicos e feedback de vibração — o padrão definitivo de controlo.",
    effectLabel:"+1.2 rating, +22% vendas, +10 rep", cost:4_050_000, timeMonths:8,
    requires:["sil_C4"], bonus:{ratingBonus:1.2, salesMult:1.22, repBonus:10}, minYear:1995 },

  { id:"sil_C6", category:"silicon", path:"C", pathName:"Storage & Controlo", tier:6,
    name:"SSD de Alta Velocidade 1 TB", description:"Velocidades de 5 GB/s — loading screens eliminados da equação.",
    effectLabel:"+1.8 rating, +28% vendas, +15 rep", cost:14_000_000, timeMonths:9,
    requires:["sil_C5"], bonus:{ratingBonus:1.8, salesMult:1.28, repBonus:15}, minYear:2005 },

  { id:"sil_C7", category:"silicon", path:"C", pathName:"Storage & Controlo", tier:7,
    name:"Controlo Háptico Adaptativo", description:"Resistência e feedback variáveis — o gatilho sente a neve, a água, a arma.",
    effectLabel:"+2.5 rating, +35% vendas, +22 rep", cost:36_000_000, timeMonths:11,
    requires:["sil_C6"], bonus:{ratingBonus:2.5, salesMult:1.35, repBonus:22}, minYear:2014 },

  { id:"sil_C8", category:"silicon", path:"C", pathName:"Storage & Controlo", tier:8,
    name:"Armazenamento Holográfico", description:"Cristais holográficos de 1 PB — toda a história do gaming num único chip.",
    effectLabel:"+3.5 rating, +45% vendas, +30 rep", cost:90_000_000, timeMonths:13,
    requires:["sil_C7"], bonus:{ratingBonus:3.5, salesMult:1.45, repBonus:30}, minYear:2024 },

  { id:"sil_C9", category:"silicon", path:"C", pathName:"Storage & Controlo", tier:9,
    name:"Neural Controller Interface", description:"Leitura de intenção muscular — controlo sem toque, 0ms de latência.",
    effectLabel:"+5.5 rating, +60% vendas, +45 rep", cost:260_000_000, timeMonths:16,
    requires:["sil_C8"], bonus:{ratingBonus:5.5, salesMult:1.60, repBonus:45}, minYear:2038 },

  { id:"sil_C10", category:"silicon", path:"C", pathName:"Storage & Controlo", tier:10,
    name:"Memória Universal Fotónica", description:"Armazenamento e acesso a dados via fotões — velocidade da luz.",
    effectLabel:"+9.0 rating, +85% vendas, +70 rep", cost:750_000_000, timeMonths:22,
    requires:["sil_C9"], bonus:{ratingBonus:9.0, salesMult:1.85, repBonus:70}, minYear:2052 },

  // ══════════════════════════════════════════════════════════════════════════
  // ENGINES — A: Motor de Jogo
  // ══════════════════════════════════════════════════════════════════════════
  { id:"engines_A4", category:"engines", path:"A", pathName:"Motor de Jogo", tier:4,
    name:"Motor com Scripting Visual", description:"Ferramentas de nível de design acessíveis a todos — velocidade de produção 3×.",
    effectLabel:"+20% receita jogos, -12% custo, +10k fãs", cost:1_700_000, timeMonths:6,
    requires:["engines_A3"], bonus:{gameRevMult:1.20, costMult:0.88, fansBonus:10000}, minYear:1985 },

  { id:"engines_A5", category:"engines", path:"A", pathName:"Motor de Jogo", tier:5,
    name:"Motor Cross-Platform", description:"Um código, 5 plataformas — PC, consoles, mobile e web a partir do mesmo projeto.",
    effectLabel:"+30% receita jogos, -18% custo, +20k fãs", cost:4_950_000, timeMonths:8,
    requires:["engines_A4"], bonus:{gameRevMult:1.30, costMult:0.82, fansBonus:20000}, minYear:1996 },

  { id:"engines_A6", category:"engines", path:"A", pathName:"Motor de Jogo", tier:6,
    name:"Motor com Editor Colaborativo em Nuvem", description:"100 developers em simultâneo a editar o mesmo mundo — velocity máxima.",
    effectLabel:"+40% receita jogos, -25% custo, +40k fãs", cost:15_000_000, timeMonths:9,
    requires:["engines_A5"], bonus:{gameRevMult:1.40, costMult:0.75, fansBonus:40000}, minYear:2005 },

  { id:"engines_A7", category:"engines", path:"A", pathName:"Motor de Jogo", tier:7,
    name:"Motor com Nanite e Lumen", description:"Geometria sem limite de polígonos e iluminação global dinâmica.",
    effectLabel:"+52% receita jogos, +0.8 rating, +80k fãs, +15 rep", cost:38_000_000, timeMonths:11,
    requires:["engines_A6"], bonus:{gameRevMult:1.52, ratingBonus:0.8, fansBonus:80000, repBonus:15}, minYear:2014 },

  { id:"engines_A8", category:"engines", path:"A", pathName:"Motor de Jogo", tier:8,
    name:"Motor com IA Generativa Integrada", description:"Assets, texturas, sons e personagens gerados por IA durante o desenvolvimento.",
    effectLabel:"+65% receita jogos, +1.5 rating, -35% custo, +150k fãs", cost:90_000_000, timeMonths:13,
    requires:["engines_A7"], bonus:{gameRevMult:1.65, ratingBonus:1.5, costMult:0.65, fansBonus:150000}, minYear:2023 },

  { id:"engines_A9", category:"engines", path:"A", pathName:"Motor de Jogo", tier:9,
    name:"Motor de Mundos Persistentes à Escala da Terra", description:"Simulação completa de um planeta — física, meteo e ecologia reais.",
    effectLabel:"+85% receita jogos, +3.0 rating, +400k fãs, +30 rep", cost:260_000_000, timeMonths:16,
    requires:["engines_A8"], bonus:{gameRevMult:1.85, ratingBonus:3.0, fansBonus:400000, repBonus:30}, minYear:2034 },

  { id:"engines_A10", category:"engines", path:"A", pathName:"Motor de Jogo", tier:10,
    name:"Motor de Realidade Simulada Universal", description:"Engine que simula física quântica — a base de qualquer jogo imaginável.",
    effectLabel:"+120% receita jogos, +6.0 rating, +1M fãs, +60 rep", cost:800_000_000, timeMonths:22,
    requires:["engines_A9"], bonus:{gameRevMult:2.20, ratingBonus:6.0, fansBonus:1000000, repBonus:60}, minYear:2052 },

  // ── ENGINES B: Pipeline Gráfico ──────────────────────────────────────────
  { id:"engines_B4", category:"engines", path:"B", pathName:"Pipeline Gráfico", tier:4,
    name:"Shaders de Superfície Avançados", description:"PBR materials — metal, couro, pele e água fisicamente correctos.",
    effectLabel:"+0.6 rating, +18% receita jogos", cost:1_700_000, timeMonths:6,
    requires:["engines_B3"], bonus:{ratingBonus:0.6, gameRevMult:1.18}, minYear:1985 },

  { id:"engines_B5", category:"engines", path:"B", pathName:"Pipeline Gráfico", tier:5,
    name:"Sistema de Partículas GPU", description:"Milhões de partículas em tempo real — fogo, fumo e destroços perfeitos.",
    effectLabel:"+0.9 rating, +25% receita jogos, +5 rep", cost:4_950_000, timeMonths:8,
    requires:["engines_B4"], bonus:{ratingBonus:0.9, gameRevMult:1.25, repBonus:5}, minYear:1997 },

  { id:"engines_B6", category:"engines", path:"B", pathName:"Pipeline Gráfico", tier:6,
    name:"Animação Procedural com IK", description:"Cinemática inversa — personagens reagem ao terreno e ao ambiente naturalmente.",
    effectLabel:"+1.3 rating, +32% receita jogos, +10 rep", cost:14_000_000, timeMonths:9,
    requires:["engines_B5"], bonus:{ratingBonus:1.3, gameRevMult:1.32, repBonus:10}, minYear:2006 },

  { id:"engines_B7", category:"engines", path:"B", pathName:"Pipeline Gráfico", tier:7,
    name:"Fluid Simulation em Tempo Real", description:"Oceanos, lava e atmosferas simulados com física de fluidos completa.",
    effectLabel:"+2.0 rating, +40% receita jogos, +20 rep", cost:38_000_000, timeMonths:11,
    requires:["engines_B6"], bonus:{ratingBonus:2.0, gameRevMult:1.40, repBonus:20}, minYear:2015 },

  { id:"engines_B8", category:"engines", path:"B", pathName:"Pipeline Gráfico", tier:8,
    name:"Path Tracing em Tempo Real", description:"Todos os raios de luz simulados por frame — cinema interativo.",
    effectLabel:"+3.0 rating, +52% receita jogos, +30 rep", cost:90_000_000, timeMonths:13,
    requires:["engines_B7"], bonus:{ratingBonus:3.0, gameRevMult:1.52, repBonus:30}, minYear:2024 },

  { id:"engines_B9", category:"engines", path:"B", pathName:"Pipeline Gráfico", tier:9,
    name:"Neural Radiance Fields para Jogos", description:"Cenas 3D capturadas do mundo real e integradas no jogo — hiperrealismo.",
    effectLabel:"+5.0 rating, +68% receita jogos, +50 rep", cost:260_000_000, timeMonths:16,
    requires:["engines_B8"], bonus:{ratingBonus:5.0, gameRevMult:1.68, repBonus:50}, minYear:2036 },

  { id:"engines_B10", category:"engines", path:"B", pathName:"Pipeline Gráfico", tier:10,
    name:"Síntese de Realidade Completa", description:"O pipeline gráfico é indistinguível do olho humano — literalmente.",
    effectLabel:"+9.0 rating, +100% receita jogos, +80 rep", cost:800_000_000, timeMonths:22,
    requires:["engines_B9"], bonus:{ratingBonus:9.0, gameRevMult:2.00, repBonus:80}, minYear:2055 },

  // ── ENGINES C: Física & IA ───────────────────────────────────────────────
  { id:"engines_C4", category:"engines", path:"C", pathName:"Física & IA", tier:4,
    name:"Destruição Procedural", description:"Estruturas que colapsam fisicamente — cada explosão é única.",
    effectLabel:"+0.8 rating, +20% receita jogos, +5 rep", cost:1_700_000, timeMonths:6,
    requires:["engines_C3"], bonus:{ratingBonus:0.8, gameRevMult:1.20, repBonus:5}, minYear:1986 },

  { id:"engines_C5", category:"engines", path:"C", pathName:"Física & IA", tier:5,
    name:"Simulação de Corpo Mole", description:"Carne, tecido e superfícies deformáveis — física orgânica realista.",
    effectLabel:"+1.2 rating, +28% receita jogos, +10 rep", cost:4_950_000, timeMonths:8,
    requires:["engines_C4"], bonus:{ratingBonus:1.2, gameRevMult:1.28, repBonus:10}, minYear:1996 },

  { id:"engines_C6", category:"engines", path:"C", pathName:"Física & IA", tier:6,
    name:"Clima Dinâmico com Física Atmosférica", description:"Vento, chuva, neve e trovões simulados fisicamente — o mundo respira.",
    effectLabel:"+1.8 rating, +36% receita jogos, +18 rep", cost:14_000_000, timeMonths:9,
    requires:["engines_C5"], bonus:{ratingBonus:1.8, gameRevMult:1.36, repBonus:18}, minYear:2005 },

  { id:"engines_C7", category:"engines", path:"C", pathName:"Física & IA", tier:7,
    name:"Ecossistemas Vivos Simulados", description:"Fauna e flora com comportamentos ecológicos reais — predação, reprodução, evolução.",
    effectLabel:"+2.8 rating, +46% receita jogos, +28 rep, +100k fãs", cost:38_000_000, timeMonths:11,
    requires:["engines_C6"], bonus:{ratingBonus:2.8, gameRevMult:1.46, repBonus:28, fansBonus:100000}, minYear:2014 },

  { id:"engines_C8", category:"engines", path:"C", pathName:"Física & IA", tier:8,
    name:"Simulação Molecular de Materiais", description:"Interacções a nível atómico — materiais que reagem como na realidade.",
    effectLabel:"+4.0 rating, +58% receita jogos, +40 rep", cost:90_000_000, timeMonths:13,
    requires:["engines_C7"], bonus:{ratingBonus:4.0, gameRevMult:1.58, repBonus:40}, minYear:2024 },

  { id:"engines_C9", category:"engines", path:"C", pathName:"Física & IA", tier:9,
    name:"Física Quântica Simulada", description:"Superposição, entanglement e colapso de função de onda como mecânica de jogo.",
    effectLabel:"+6.5 rating, +75% receita jogos, +60 rep", cost:260_000_000, timeMonths:16,
    requires:["engines_C8"], bonus:{ratingBonus:6.5, gameRevMult:1.75, repBonus:60}, minYear:2038 },

  { id:"engines_C10", category:"engines", path:"C", pathName:"Física & IA", tier:10,
    name:"Simulação da Realidade Física Completa", description:"Cada fotão, cada átomo, cada força simulada — uma realidade dentro da realidade.",
    effectLabel:"+11.0 rating, +110% receita jogos, +100 rep", cost:800_000_000, timeMonths:22,
    requires:["engines_C9"], bonus:{ratingBonus:11.0, gameRevMult:2.10, repBonus:100}, minYear:2055 },

  // ══════════════════════════════════════════════════════════════════════════
  // AUDIO — A: Hardware de Áudio
  // ══════════════════════════════════════════════════════════════════════════
  { id:"audio_A4", category:"audio", path:"A", pathName:"Hardware de Áudio", tier:4,
    name:"DSP de Efeitos de Áudio", description:"Processador dedicado para reverb, delay e chorus em tempo real.",
    effectLabel:"+18% receita jogos, +0.4 rating, +8 rep", cost:1_700_000, timeMonths:6,
    requires:["audio_A3"], bonus:{gameRevMult:1.18, ratingBonus:0.4, repBonus:8}, minYear:1985 },

  { id:"audio_A5", category:"audio", path:"A", pathName:"Hardware de Áudio", tier:5,
    name:"Audio Processor de 48-bit", description:"Processamento de 48 bits com floating point — qualidade de estúdio profissional.",
    effectLabel:"+24% receita jogos, +0.6 rating, +12 rep", cost:4_950_000, timeMonths:8,
    requires:["audio_A4"], bonus:{gameRevMult:1.24, ratingBonus:0.6, repBonus:12}, minYear:1995 },

  { id:"audio_A6", category:"audio", path:"A", pathName:"Hardware de Áudio", tier:6,
    name:"Áudio Espacial Binaurais Personalizados", description:"Perfil HRTF único por utilizador — o teu ouvido, o teu espaço.",
    effectLabel:"+30% receita jogos, +0.9 rating, +18 rep, +30k fãs", cost:13_000_000, timeMonths:9,
    requires:["audio_A5"], bonus:{gameRevMult:1.30, ratingBonus:0.9, repBonus:18, fansBonus:30000}, minYear:2003 },

  { id:"audio_A7", category:"audio", path:"A", pathName:"Hardware de Áudio", tier:7,
    name:"Array de Microfones para Voice Acting IA", description:"Captura holográfica de voz para síntese em tempo real de qualquer emoção.",
    effectLabel:"+38% receita jogos, +1.2 rating, +25 rep, +60k fãs", cost:36_000_000, timeMonths:11,
    requires:["audio_A6"], bonus:{gameRevMult:1.38, ratingBonus:1.2, repBonus:25, fansBonus:60000}, minYear:2013 },

  { id:"audio_A8", category:"audio", path:"A", pathName:"Hardware de Áudio", tier:8,
    name:"Audio AI: Síntese de Voz Neural", description:"Qualquer personagem com qualquer voz, emoção e idioma — gerado em tempo real.",
    effectLabel:"+48% receita jogos, +1.8 rating, +35 rep, +120k fãs", cost:88_000_000, timeMonths:13,
    requires:["audio_A7"], bonus:{gameRevMult:1.48, ratingBonus:1.8, repBonus:35, fansBonus:120000}, minYear:2022 },

  { id:"audio_A9", category:"audio", path:"A", pathName:"Hardware de Áudio", tier:9,
    name:"Áudio Háptico de Corpo Inteiro", description:"Vibração de 200+ actuadores sincronizados — o trovão sente-se no peito.",
    effectLabel:"+62% receita jogos, +3.0 rating, +50 rep, +250k fãs", cost:260_000_000, timeMonths:16,
    requires:["audio_A8"], bonus:{gameRevMult:1.62, ratingBonus:3.0, repBonus:50, fansBonus:250000}, minYear:2035 },

  { id:"audio_A10", category:"audio", path:"A", pathName:"Hardware de Áudio", tier:10,
    name:"Estimulação Auditiva Neural Directa", description:"O som é gerado directamente no nervo auditivo — perfeição absoluta.",
    effectLabel:"+90% receita jogos, +5.0 rating, +80 rep, +800k fãs", cost:750_000_000, timeMonths:22,
    requires:["audio_A9"], bonus:{gameRevMult:1.90, ratingBonus:5.0, repBonus:80, fansBonus:800000}, minYear:2052 },

  // ── AUDIO B: Trilha Musical ──────────────────────────────────────────────
  { id:"audio_B4", category:"audio", path:"B", pathName:"Trilha Musical", tier:4,
    name:"Parceria com Compositor de Hollywood", description:"Trilha composta por nomes reconhecidos mundialmente — prestígio imediato.",
    effectLabel:"+22% receita jogos, +8 rep, +15k fãs", cost:1_850_000, timeMonths:6,
    requires:["audio_B3"], bonus:{gameRevMult:1.22, repBonus:8, fansBonus:15000}, minYear:1986 },

  { id:"audio_B5", category:"audio", path:"B", pathName:"Trilha Musical", tier:5,
    name:"Álbum de Banda Sonora Comercial", description:"OST publicada em todas as plataformas — receita extra e marketing orgânico.",
    effectLabel:"+28% receita jogos, +12 rep, +30k fãs", cost:4_950_000, timeMonths:8,
    requires:["audio_B4"], bonus:{gameRevMult:1.28, repBonus:12, fansBonus:30000}, minYear:1997 },

  { id:"audio_B6", category:"audio", path:"B", pathName:"Trilha Musical", tier:6,
    name:"Concertos Sinfónicos ao Vivo", description:"Tours mundiais com orquestra a interpretar as trilhas dos teus jogos.",
    effectLabel:"+35% receita jogos, +18 rep, +80k fãs", cost:14_000_000, timeMonths:9,
    requires:["audio_B5"], bonus:{gameRevMult:1.35, repBonus:18, fansBonus:80000}, minYear:2005 },

  { id:"audio_B7", category:"audio", path:"B", pathName:"Trilha Musical", tier:7,
    name:"Música Procedural por Gramática", description:"Sistemas musicais que compõem em tempo real — nunca a mesma música duas vezes.",
    effectLabel:"+44% receita jogos, +25 rep, +150k fãs", cost:36_000_000, timeMonths:11,
    requires:["audio_B6"], bonus:{gameRevMult:1.44, repBonus:25, fansBonus:150000}, minYear:2014 },

  { id:"audio_B8", category:"audio", path:"B", pathName:"Trilha Musical", tier:8,
    name:"IA Compositora em Tempo Real", description:"Modelo de IA que compõe música original adaptada à acção — momento a momento.",
    effectLabel:"+56% receita jogos, +35 rep, +300k fãs", cost:90_000_000, timeMonths:13,
    requires:["audio_B7"], bonus:{gameRevMult:1.56, repBonus:35, fansBonus:300000}, minYear:2022 },

  { id:"audio_B9", category:"audio", path:"B", pathName:"Trilha Musical", tier:9,
    name:"Experiência Musical Total Personalizada", description:"A música aprende os teus gostos e compõe exactamente o que precisas.",
    effectLabel:"+72% receita jogos, +50 rep, +600k fãs", cost:260_000_000, timeMonths:16,
    requires:["audio_B8"], bonus:{gameRevMult:1.72, repBonus:50, fansBonus:600000}, minYear:2035 },

  { id:"audio_B10", category:"audio", path:"B", pathName:"Trilha Musical", tier:10,
    name:"Sinfonia Neural Gerativa", description:"Música criada directamente para o perfil neurológico de cada ouvinte.",
    effectLabel:"+100% receita jogos, +80 rep, +2M fãs", cost:750_000_000, timeMonths:22,
    requires:["audio_B9"], bonus:{gameRevMult:2.00, repBonus:80, fansBonus:2000000}, minYear:2055 },

  // ── AUDIO C: Imersão & Voz ───────────────────────────────────────────────
  { id:"audio_C4", category:"audio", path:"C", pathName:"Imersão & Voz", tier:4,
    name:"Voice Acting com Elenco de Celebridades", description:"Actores de cinema no teu jogo — manchetes garantidas.",
    effectLabel:"+20% receita jogos, +10 rep, +20k fãs", cost:2_150_000, timeMonths:6,
    requires:["audio_C3"], bonus:{gameRevMult:1.20, repBonus:10, fansBonus:20000}, minYear:1987 },

  { id:"audio_C5", category:"audio", path:"C", pathName:"Imersão & Voz", tier:5,
    name:"Diálogo Dinâmico Contextual", description:"NPCs respondem diferente com base no estado do jogo e relação com o jogador.",
    effectLabel:"+28% receita jogos, +15 rep, +40k fãs", cost:5_200_000, timeMonths:8,
    requires:["audio_C4"], bonus:{gameRevMult:1.28, repBonus:15, fansBonus:40000}, minYear:1998 },

  { id:"audio_C6", category:"audio", path:"C", pathName:"Imersão & Voz", tier:6,
    name:"Áudio Reativo ao Ambiente", description:"O som muda com o espaço — a acústica de caverna é diferente da selva.",
    effectLabel:"+35% receita jogos, +22 rep, +70k fãs", cost:14_000_000, timeMonths:9,
    requires:["audio_C5"], bonus:{gameRevMult:1.35, repBonus:22, fansBonus:70000}, minYear:2006 },

  { id:"audio_C7", category:"audio", path:"C", pathName:"Imersão & Voz", tier:7,
    name:"Voice AI: Locução em Qualquer Idioma", description:"IA que localiza o voice acting em 50 idiomas sem actores adicionais.",
    effectLabel:"+45% receita jogos, +30 rep, +150k fãs", cost:38_000_000, timeMonths:11,
    requires:["audio_C6"], bonus:{gameRevMult:1.45, repBonus:30, fansBonus:150000}, minYear:2016 },

  { id:"audio_C8", category:"audio", path:"C", pathName:"Imersão & Voz", tier:8,
    name:"Presença Sonora Completa com Haptics", description:"Som e vibração sincronizados para experiência táctil — o barulho toca-se.",
    effectLabel:"+58% receita jogos, +42 rep, +300k fãs", cost:90_000_000, timeMonths:13,
    requires:["audio_C7"], bonus:{gameRevMult:1.58, repBonus:42, fansBonus:300000}, minYear:2025 },

  { id:"audio_C9", category:"audio", path:"C", pathName:"Imersão & Voz", tier:9,
    name:"Síntese Emocional de Voz em Tempo Real", description:"IA que sintetiza emoções vocais indistinguíveis de actores humanos reais.",
    effectLabel:"+75% receita jogos, +60 rep, +600k fãs", cost:260_000_000, timeMonths:16,
    requires:["audio_C8"], bonus:{gameRevMult:1.75, repBonus:60, fansBonus:600000}, minYear:2038 },

  { id:"audio_C10", category:"audio", path:"C", pathName:"Imersão & Voz", tier:10,
    name:"Imersão Sensorial Total por IA", description:"Todos os sentidos — som, tacto, olfacto e equilíbrio — gerados por IA neural.",
    effectLabel:"+110% receita jogos, +100 rep, +3M fãs", cost:800_000_000, timeMonths:22,
    requires:["audio_C9"], bonus:{gameRevMult:2.10, repBonus:100, fansBonus:3000000}, minYear:2058 },
];
