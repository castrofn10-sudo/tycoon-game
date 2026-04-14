// ═══════════════════════════════════════════════════════════════════
//  MEGACORP — Historical Gaming Industry Progression System
//  Faithful to real industry timeline 1972–2100
// ═══════════════════════════════════════════════════════════════════

export type GamingEraId =
  | "dawn"       // 1970–1982
  | "recovery"   // 1983–1989
  | "expansion"  // 1990–1999
  | "online"     // 2000–2009
  | "modern"     // 2010–2019
  | "future";    // 2020+

export type GamingEra = {
  id: GamingEraId;
  name: string;
  subtitle: string;
  startYear: number;
  endYear: number;
  color: string;
  icon: string;
  description: string;
  marketSizeMult: number;
};

export const GAMING_ERAS: GamingEra[] = [
  {
    id: "dawn",
    name: "Aurora Digital",
    subtitle: "1972 – 1982",
    startYear: 1972, endYear: 1982,
    color: "#F5A623",
    icon: "monitor",
    description: "Os primeiros consoles. Atrion domina os arcades e o mercado doméstico nasce com o 2600.",
    marketSizeMult: 0.04,
  },
  {
    id: "recovery",
    name: "Crise & Reconstrução",
    subtitle: "1983 – 1989",
    startYear: 1983, endYear: 1989,
    color: "#FF4D6A",
    icon: "alert-triangle",
    description: "O crash de 83 quase destrói a indústria. A Nintaro ressuscita tudo com o NFX.",
    marketSizeMult: 0.12,
  },
  {
    id: "expansion",
    name: "Grande Expansão",
    subtitle: "1990 – 1999",
    startYear: 1990, endYear: 1999,
    color: "#A855F7",
    icon: "zap",
    description: "Super NFX, MegaDrive, StarPlay e Nintaro 64. A era 3D chega e o gaming vira cultura pop global.",
    marketSizeMult: 0.35,
  },
  {
    id: "online",
    name: "Era Online",
    subtitle: "2000 – 2009",
    startYear: 2000, endYear: 2009,
    color: "#4DA6FF",
    icon: "globe",
    description: "SP2, XStation, GamePlex. Internet transforma o gaming e o smartphone lança a revolução mobile.",
    marketSizeMult: 0.65,
  },
  {
    id: "modern",
    name: "Era Moderna",
    subtitle: "2010 – 2019",
    startYear: 2010, endYear: 2019,
    color: "#10B981",
    icon: "layers",
    description: "SP4, XStation One, Nintaro Flex. Indie, eSports e streaming moldam uma indústria de $150B.",
    marketSizeMult: 1.0,
  },
  {
    id: "future",
    name: "Futuro",
    subtitle: "2020+",
    startYear: 2020, endYear: 2100,
    color: "#7C3AED",
    icon: "star",
    description: "SP5, cloud gaming, VR/AR, IA em jogos. O metaverso e o gaming neural estão a chegar.",
    marketSizeMult: 1.8,
  },
];

export function getGamingEra(year: number): GamingEra {
  for (let i = GAMING_ERAS.length - 1; i >= 0; i--) {
    if (year >= GAMING_ERAS[i].startYear) return GAMING_ERAS[i];
  }
  return GAMING_ERAS[0];
}

export function getMarketSizeMultiplier(year: number): number {
  const era = getGamingEra(year);
  const eraNext = GAMING_ERAS[GAMING_ERAS.indexOf(era) + 1];
  if (!eraNext) return era.marketSizeMult;
  const t = (year - era.startYear) / (eraNext.startYear - era.startYear);
  return era.marketSizeMult + (eraNext.marketSizeMult - era.marketSizeMult) * Math.min(t, 1);
}

// ─── Hardware Year Gates ───────────────────────────────────────────────────────

export type PowerOption = {
  key: "low" | "medium" | "high";
  label: string;
  desc: string;
  color: string;
  costBase: number;
  minYear: number;
  historicalRef: string;
};

export const POWER_OPTIONS: PowerOption[] = [
  {
    key: "low",
    label: "Básico",
    desc: "Chips simples, público casual",
    color: "#10B981",
    costBase: 30_000,
    minYear: 1972,
    historicalRef: "Estilo Atrion 2600",
  },
  {
    key: "medium",
    label: "Médio",
    desc: "Equilíbrio performance/preço",
    color: "#F5A623",
    costBase: 80_000,
    minYear: 1985,
    historicalRef: "Estilo NES/Mega Drive",
  },
  {
    key: "high",
    label: "Alto",
    desc: "Hardware premium, early adopters",
    color: "#A855F7",
    costBase: 200_000,
    minYear: 1993,
    historicalRef: "Estilo StarPlay/Nintaro 64",
  },
];

export type MemoryOption = {
  valueGB: number;
  label: string;
  minYear: number;
  historicalRef: string;
};

export const MEMORY_OPTIONS: MemoryOption[] = [
  { valueGB: 0.000004, label: "4 KB",    minYear: 1972, historicalRef: "Atrion 2600" },
  { valueGB: 0.000032, label: "32 KB",   minYear: 1977, historicalRef: "Atrion 2600 Advanced" },
  { valueGB: 0.000064, label: "64 KB",   minYear: 1980, historicalRef: "Intellivision" },
  { valueGB: 0.000256, label: "256 KB",  minYear: 1983, historicalRef: "NFX/Famiclone" },
  { valueGB: 0.002,    label: "2 MB",    minYear: 1988, historicalRef: "MegaDrive/TurboGrafx" },
  { valueGB: 0.008,    label: "8 MB",    minYear: 1990, historicalRef: "Super NFX" },
  { valueGB: 0.032,    label: "32 MB",   minYear: 1994, historicalRef: "StarPlay" },
  { valueGB: 0.128,    label: "128 MB",  minYear: 1998, historicalRef: "DreamStation" },
  { valueGB: 0.512,    label: "512 MB",  minYear: 2001, historicalRef: "GamePlex/XStation" },
  { valueGB: 2,        label: "2 GB",    minYear: 2005, historicalRef: "XStation 360/SP3" },
  { valueGB: 8,        label: "8 GB",    minYear: 2010, historicalRef: "Tablet/SP4 era" },
  { valueGB: 16,       label: "16 GB",   minYear: 2013, historicalRef: "SP4/XStation One" },
  { valueGB: 32,       label: "32 GB",   minYear: 2018, historicalRef: "Nintaro Flex/SP5 era" },
  { valueGB: 64,       label: "64 GB",   minYear: 2025, historicalRef: "Próxima Geração" },
  { valueGB: 128,      label: "128 GB",  minYear: 2035, historicalRef: "Geração Futura" },
  { valueGB: 512,      label: "512 GB",  minYear: 2050, historicalRef: "Geração Neural" },
];

export function getAvailableMemory(year: number): MemoryOption[] {
  return MEMORY_OPTIONS.filter((m) => year >= m.minYear);
}

export function getAvailablePower(year: number): PowerOption[] {
  return POWER_OPTIONS.filter((p) => year >= p.minYear);
}

export function getExpectedMemoryGB(year: number): number {
  const avail = getAvailableMemory(year);
  if (avail.length === 0) return 0.000004;
  return avail[avail.length - 1].valueGB;
}

// ─── Research Node Year Requirements ──────────────────────────────────────────
// Map from research node ID to minimum unlock year

export const RESEARCH_MIN_YEARS: Record<string, number> = {
  // DESIGN
  design_A1: 1972,  design_A2: 1985,  design_A3: 1995,
  design_B1: 1978,  design_B2: 1992,  design_B3: 2002,
  design_C1: 1990,  design_C2: 2002,  design_C3: 2015,
  // TECH
  tech_A1: 1978,    tech_A2: 1993,    tech_A3: 2005,
  tech_B1: 1985,    tech_B2: 1997,    tech_B3: 2022,
  tech_C1: 2030,    tech_C2: 2050,    tech_C3: 2070,
  // HARDWARE (hw_*)
  hw_A1: 1975,      hw_A2: 1988,      hw_A3: 2000,
  hw_B1: 1989,      hw_B2: 2004,      hw_B3: 2017,
  hw_C1: 1995,      hw_C2: 2010,      hw_C3: 2022,
  hardware_A1: 1988, hardware_A2: 2000, hardware_A3: 2012,
  hardware_B1: 1994, hardware_B2: 2018, hardware_B3: 2032,
  hardware_C1: 2002, hardware_C2: 2028, hardware_C3: 2055,
  // GAMES
  games_A1: 1972,  games_A2: 1994,   games_A3: 2012,
  games_B1: 1985,  games_B2: 1997,   games_B3: 2022,
  games_C1: 2007,  games_C2: 2016,   games_C3: 2020,
  // BUSINESS
  biz_A1: 1975,    biz_A2: 1983,     biz_A3: 2000,
  biz_B1: 1980,    biz_B2: 1996,     biz_B3: 2010,
  biz_C1: 1985,    biz_C2: 2000,     biz_C3: 2015,
  biz_D1: 1985,    biz_D2: 1995,     biz_D3: 2000,
  business_A1: 1982, business_A2: 2012, business_A3: 2016,
  business_B1: 2000, business_B2: 2006, business_B3: 2018,
  business_C1: 1980, business_C2: 1996, business_C3: 2010,
  // ONLINE
  online_A1: 1990,  online_A2: 1998,  online_A3: 2006,
  online_B1: 1995,  online_B2: 2002,  online_B3: 2010,
  online_C1: 2003,  online_C2: 2010,  online_C3: 2015,
  // INNOVATION
  innov_A1: 2005,   innov_A2: 2013,   innov_A3: 2018,
  innov_B1: 2002,   innov_B2: 2010,   innov_B3: 2020,
  innov_C1: 2008,   innov_C2: 2015,   innov_C3: 2022,
  // SILICON
  sil_A1: 1975,     sil_A2: 1990,     sil_A3: 2005,
  sil_B1: 1980,     sil_B2: 1995,     sil_B3: 2010,
  sil_C1: 1985,     sil_C2: 2000,     sil_C3: 2015,
  // ENGINES
  engines_A1: 1980,  engines_A2: 1993,  engines_A3: 2005,
  engines_B1: 1990,  engines_B2: 2000,  engines_B3: 2013,
  engines_C1: 1988,  engines_C2: 2003,  engines_C3: 2018,
  // AUDIO
  audio_A1: 1972,   audio_A2: 1985,   audio_A3: 1998,
  audio_B1: 1978,   audio_B2: 1992,   audio_B3: 2005,
  audio_C1: 1990,   audio_C2: 2002,   audio_C3: 2015,
  // ERA EXPANSION — 1980s
  era80_A1: 1980,   era80_A2: 1982,   era80_A3: 1982,   era80_B1: 1981,
  // ERA EXPANSION — 1990s
  era90_A1: 1991,   era90_A2: 1989,   era90_A3: 1993,
  era90_B1: 1990,   era90_B2: 1993,
  // ERA EXPANSION — 2000s
  era2k_A1: 2002,   era2k_A2: 2005,   era2k_A3: 2003,   era2k_B1: 2003,
  // ERA EXPANSION — 2010s
  era10_A1: 2010,   era10_A2: 2013,   era10_A3: 2012,   era10_B1: 2012,
  // ERA EXPANSION — 2020s+
  era20_A1: 2020,   era20_A2: 2020,   era20_A3: 2022,
  era20_B1: 2020,   era20_B2: 2021,
};

// ─── Historical Events ─────────────────────────────────────────────────────────

export type HistoricalEvent = {
  id: string;
  year: number;
  month?: number;
  title: string;
  body: string;
  category: "tech" | "crisis" | "growth" | "launch" | "competitor";
  moneyDelta: number;
  fansDelta: number;
  reputationDelta: number;
  marketMult?: number;  // temporary market size multiplier
  once: true;          // only fires once
};

export const HISTORICAL_EVENTS: HistoricalEvent[] = [
  // 1972–1982: Aurora Digital
  {
    id: "evt_pong_1972", year: 1972, month: 11,
    title: "Pong Lança o Gaming!", category: "growth",
    body: "Atrion lança Pong. O mundo descobre que pode jogar em casa. Nasceu uma indústria de bilhões.",
    moneyDelta: 0, fansDelta: 500, reputationDelta: 5, once: true,
  },
  {
    id: "evt_atari2600_1977", year: 1977, month: 10,
    title: "Atrion 2600 Muda Tudo", category: "launch",
    body: "O Atrion 2600 leva os videogames para os lares de milhões. O mercado explode — e você pode ganhar com isso.",
    moneyDelta: 20_000, fansDelta: 1500, reputationDelta: 8, marketMult: 1.3, once: true,
  },
  {
    id: "evt_spaceinvaders_1978", year: 1978, month: 6,
    title: "Space Invaders — Febre Global", category: "growth",
    body: "Space Invaders vende 360.000 arcades. No Japão falta moedas de 100 ienes. Gaming virou fenómeno cultural.",
    moneyDelta: 0, fansDelta: 2000, reputationDelta: 6, once: true,
  },
  {
    id: "evt_pacman_1980", year: 1980, month: 5,
    title: "Pac-Man — Ícone da Cultura Pop", category: "growth",
    body: "Pac-Man transcende os videogames. Licenças em tudo, do cereal ao LP musical. O gaming chegou ao mainstream.",
    moneyDelta: 30_000, fansDelta: 3000, reputationDelta: 7, once: true,
  },
  {
    id: "evt_et_1982", year: 1982, month: 12,
    title: "E.T. — O Pior Jogo da História", category: "crisis",
    body: "Atrion lança E.T. às pressas. Crítica e público detonam. Milhões de cartuchos vão para um aterro no Novo México.",
    moneyDelta: -50_000, fansDelta: -1000, reputationDelta: -8, once: true,
  },

  // 1983–1989: Crise & Reconstrução
  {
    id: "evt_crash_1983", year: 1983, month: 1,
    title: "🚨 CRISE: Crash dos Videogames", category: "crisis",
    body: "O mercado americano de videogames colapsa. Vendas caem 97%. Investidores fogem. Só os mais fortes sobrevivem.",
    moneyDelta: -80_000, fansDelta: -3000, reputationDelta: -15, marketMult: 0.4, once: true,
  },
  {
    id: "evt_nes_1985", year: 1985, month: 10,
    title: "Nintaro Ressuscita os Videogames", category: "launch",
    body: "O NFX chega à América com um plataforma icónico. A Nintaro salva uma indústria inteira. A confiança volta.",
    moneyDelta: 60_000, fansDelta: 5000, reputationDelta: 12, marketMult: 1.5, once: true,
  },
  {
    id: "evt_zelda_1986", year: 1986, month: 2,
    title: "Zelda Inventa o RPG de Ação", category: "tech",
    body: "The Legend of Zelda lança mundos abertos exploráveis. Narrativa e imersão entram no vocabulário do gaming.",
    moneyDelta: 0, fansDelta: 2000, reputationDelta: 5, once: true,
  },
  {
    id: "evt_gameboy_1989", year: 1989, month: 7,
    title: "Game Pal — Gaming em Todo Lado", category: "launch",
    body: "Nintaro lança o Game Pal. Tetris vicia o planeta. O gaming portátil nasce e nunca mais para.",
    moneyDelta: 40_000, fansDelta: 4000, reputationDelta: 8, once: true,
  },

  // 1990–1999: Grande Expansão
  {
    id: "evt_megadrive_1990", year: 1990, month: 1,
    title: "Senga vs Nintaro — A Grande Guerra", category: "competitor",
    body: "MegaDrive desafia o Super NFX com Sonic o Ouriço. A console war começa. A competição eleva todo o setor.",
    moneyDelta: 0, fansDelta: 3000, reputationDelta: 0, once: true,
  },
  {
    id: "evt_doom_1993", year: 1993, month: 12,
    title: "DOOM — O FPS Explode", category: "launch",
    body: "iD Software lança DOOM. PCs tornam-se plataformas de gaming sérias. O FPS define uma nova era.",
    moneyDelta: 0, fansDelta: 4000, reputationDelta: 6, once: true,
  },
  {
    id: "evt_ps1_1994", year: 1994, month: 12,
    title: "StarPlay — A Revolução 3D", category: "launch",
    body: "Soniq lança o StarPlay. CD-ROM, gráficos 3D, marketing adulto. A indústria nunca mais seria a mesma.",
    moneyDelta: 100_000, fansDelta: 8000, reputationDelta: 15, marketMult: 1.6, once: true,
  },
  {
    id: "evt_n64_1996", year: 1996, month: 9,
    title: "Nintaro 64 — Analógico Muda Tudo", category: "launch",
    body: "Super Star 64 define o que é um jogo 3D. O analógico torna-se padrão. Toda a indústria copia.",
    moneyDelta: 80_000, fansDelta: 6000, reputationDelta: 10, once: true,
  },
  {
    id: "evt_ff7_1997", year: 1997, month: 1,
    title: "Final Fantasy VII — Epicidade Global", category: "growth",
    body: "FF7 leva o JRPG para o mundo. Cutscenes cinematográficas, narrativa adulta, 3 CDs. Jogos como arte.",
    moneyDelta: 50_000, fansDelta: 7000, reputationDelta: 8, once: true,
  },
  {
    id: "evt_pokemon_1998", year: 1998, month: 9,
    title: "Pokémon Conquista o Planeta", category: "growth",
    body: "PocketMon Red/Blue chegam à América. Merchandising explode. Game Pal fica sem estoque no mundo todo.",
    moneyDelta: 70_000, fansDelta: 10000, reputationDelta: 10, marketMult: 1.3, once: true,
  },

  // 2000–2009: Era Online
  {
    id: "evt_ps2_2000", year: 2000, month: 3,
    title: "PS2 — O Console Mais Vendido da História", category: "launch",
    body: "StarPlay 2 lança com DVD embutido. 155 milhões de unidades. A Soniq domina a geração completa.",
    moneyDelta: 150_000, fansDelta: 12000, reputationDelta: 12, marketMult: 1.4, once: true,
  },
  {
    id: "evt_xbox_2001", year: 2001, month: 11,
    title: "XStation Entra na Arena", category: "competitor",
    body: "Macrotech lança o XStation com Halo. A competição de 3 frentes começa. Mais rivalidade, mais crescimento.",
    moneyDelta: 0, fansDelta: 5000, reputationDelta: 0, once: true,
  },
  {
    id: "evt_gta3_2001", year: 2001, month: 10,
    title: "GTA III — Mundo Aberto Adulto", category: "growth",
    body: "Grand Theft Auto III choca e fascina. Open world, liberdade total, controvérsia. Vendas recordes.",
    moneyDelta: 80_000, fansDelta: 8000, reputationDelta: 5, once: true,
  },
  {
    id: "evt_xboxlive_2002", year: 2002, month: 11,
    title: "XStation Live — Online Muda o Gaming", category: "tech",
    body: "XStation Live lança o multiplayer online organizado. Pagar pelo online torna-se norma. O futuro chegou.",
    moneyDelta: 0, fansDelta: 6000, reputationDelta: 8, once: true,
  },
  {
    id: "evt_iphone_2007", year: 2007, month: 6,
    title: "🍎 iPhone — A Revolução Mobile", category: "launch",
    body: "Steve Jobs apresenta o iPhone. Em 2008 vem a App Store. O gaming mobile vai explodir. Posiciona-te.",
    moneyDelta: 0, fansDelta: 5000, reputationDelta: 5, marketMult: 1.25, once: true,
  },
  {
    id: "evt_appstore_2008", year: 2008, month: 7,
    title: "App Store — Bilhões de Novos Gamers", category: "growth",
    body: "App Store lança com jogos a $0.99. Angry Birds e Doodle Jump criam uma nova geração de jogadores.",
    moneyDelta: 100_000, fansDelta: 15000, reputationDelta: 10, marketMult: 1.5, once: true,
  },
  {
    id: "evt_financialcrash_2008", year: 2008, month: 10,
    title: "🚨 Crise Financeira Global", category: "crisis",
    body: "Lehman Brothers colapsa. Recessão global. Consumidores cortam gastos. Mercado de games afetado temporariamente.",
    moneyDelta: -60_000, fansDelta: -3000, reputationDelta: -5, once: true,
  },

  // 2010–2019: Era Moderna
  {
    id: "evt_minecraft_2011", year: 2011, month: 11,
    title: "Minecraft — Indie que Mudou Tudo", category: "growth",
    body: "Mojang vende Minecraft por $26. 54M cópias depois, é o jogo mais vendido de sempre. O indie explodiu.",
    moneyDelta: 80_000, fansDelta: 10000, reputationDelta: 8, once: true,
  },
  {
    id: "evt_ps4_2013", year: 2013, month: 11,
    title: "SP4/XStation One — 8ª Geração Começa", category: "launch",
    body: "Soniq e Macrotech lançam as próximas gerações. 4K, HDR e SSDs mudam o padrão de qualidade.",
    moneyDelta: 120_000, fansDelta: 10000, reputationDelta: 10, marketMult: 1.3, once: true,
  },
  {
    id: "evt_pokemongo_2016", year: 2016, month: 7,
    title: "Pokémon GO — AR Invade as Ruas", category: "growth",
    body: "Niantic lança Pokémon GO. 232M downloads. Augmented Reality prova ser viável. Gaming nas ruas.",
    moneyDelta: 0, fansDelta: 20000, reputationDelta: 8, once: true,
  },
  {
    id: "evt_switch_2017", year: 2017, month: 3,
    title: "Nintaro Flex — Híbrido Revolucionário", category: "launch",
    body: "Nintaro Flex vende 100M unidades. Home console e portátil ao mesmo tempo. A forma de jogar mudou.",
    moneyDelta: 100_000, fansDelta: 15000, reputationDelta: 12, once: true,
  },
  {
    id: "evt_fortnite_2017", year: 2017, month: 9,
    title: "Fortnite — Free-to-Play Domina", category: "growth",
    body: "Fortnite Battle Royale é grátis e fatura bilhões com skins. O modelo F2P tornou-se o padrão da indústria.",
    moneyDelta: 0, fansDelta: 18000, reputationDelta: 5, marketMult: 1.3, once: true,
  },

  // 2020+: Futuro
  {
    id: "evt_ps5_2020", year: 2020, month: 11,
    title: "SP5 — Nova Geração, SSD Instantâneo", category: "launch",
    body: "SP5 e XStation Series X lançam com SSDs ultrarrápidos. Tempos de carregamento zerados. 4K/120fps.",
    moneyDelta: 200_000, fansDelta: 20000, reputationDelta: 15, marketMult: 1.4, once: true,
  },
  {
    id: "evt_covid_gaming_2020", year: 2020, month: 4,
    title: "🏠 COVID Dispara o Gaming", category: "growth",
    body: "Pandemia fecha o mundo. Animal Crossing vende 31M em 3 meses. Gaming atinge audiência recorde global.",
    moneyDelta: 150_000, fansDelta: 25000, reputationDelta: 10, marketMult: 1.6, once: true,
  },
  {
    id: "evt_ai_games_2023", year: 2023, month: 3,
    title: "IA Revoluciona o Desenvolvimento", category: "tech",
    body: "GPT-4, Stable Diffusion, Midjourney. IA gera arte, código e narrativa. Dev de jogos acelera 10x.",
    moneyDelta: 0, fansDelta: 0, reputationDelta: 8, marketMult: 1.2, once: true,
  },
  {
    id: "evt_cloud_2024", year: 2024, month: 1,
    title: "Cloud Gaming — Consoles Opcionais", category: "tech",
    body: "XStation Cloud, GeForce Now e StarPlay Now servem jogos AAA direto ao ecrã. Hardware já não é barreira.",
    moneyDelta: 0, fansDelta: 10000, reputationDelta: 5, once: true,
  },
  {
    id: "evt_neural_2035", year: 2035, month: 6,
    title: "Interface Neural — Gaming Imersivo", category: "tech",
    body: "Primeiros headsets neurais comerciais. Jogar com o pensamento. Realidade e simulação começam a fundir.",
    moneyDelta: 0, fansDelta: 30000, reputationDelta: 15, marketMult: 2.0, once: true,
  },
  {
    id: "evt_metaverse_2040", year: 2040, month: 1,
    title: "Metaverso — A Nova Realidade", category: "growth",
    body: "O metaverso corporativo torna-se mainstream. Economias virtuais valem mais que muitos países reais.",
    moneyDelta: 500_000, fansDelta: 50000, reputationDelta: 20, marketMult: 3.0, once: true,
  },
];

export function getHistoricalEvent(year: number, month: number, firedEvents: string[]): HistoricalEvent | null {
  const matching = HISTORICAL_EVENTS.filter(
    (e) =>
      e.year === year &&
      (e.month === undefined || e.month === month) &&
      !firedEvents.includes(e.id)
  );
  if (matching.length === 0) return null;
  return matching[0];
}

// ─── Era-based random news pools ─────────────────────────────────────────────

export type EraNewsItem = {
  category: "tech" | "crisis" | "growth" | "competitor";
  title: string;
  body: string;
  m: number;  // money delta
  f: number;  // fans delta
  r: number;  // reputation delta
  p: number;  // probability
  minYear: number;
  maxYear: number;
};

export const ERA_NEWS_POOL: EraNewsItem[] = [
  // Dawn era news
  { minYear: 1972, maxYear: 1982, category: "growth", title: "Arcades Enchem Shoppings", body: "Filas enormes em todos os fliperamas. O público descobre os videogames.", m: 10_000, f: 500, r: 3, p: 0.08 },
  { minYear: 1972, maxYear: 1982, category: "tech", title: "Novos Chips de 8-bit Chegam", body: "Processadores 8-bit mais acessíveis abrem portas para novos consoles.", m: 0, f: 0, r: 2, p: 0.06 },
  { minYear: 1972, maxYear: 1985, category: "crisis", title: "Competição de Clones Baratos", body: "Cópias de Pong e Atrion inundam o mercado. Preços pressionados para baixo.", m: -20_000, f: -200, r: -3, p: 0.05 },

  // Recovery era news
  { minYear: 1983, maxYear: 1989, category: "crisis", title: "Pós-Crash: Lojas Devolvem Estoque", body: "Varejistas recusam novos títulos de videogame. Setor tenta reconstruir confiança.", m: -30_000, f: -800, r: -5, p: 0.08 },
  { minYear: 1983, maxYear: 1989, category: "growth", title: "Nintaro Recupera Confiança do Mercado", body: "Controle de qualidade rigoroso da Nintaro convence varejistas. Estoque começa a voltar.", m: 20_000, f: 1000, r: 5, p: 0.06 },
  { minYear: 1983, maxYear: 1989, category: "tech", title: "Cartuchos com Chips Especiais", body: "Novos cartuchos incluem processadores extras. Gráficos e som melhoram drasticamente.", m: 0, f: 500, r: 3, p: 0.05 },

  // Expansion era news
  { minYear: 1990, maxYear: 1999, category: "growth", title: "CD-ROM Chega aos Consoles", body: "CDs permitem jogos com FMV e trilhas orquestrais. Nova era do entretenimento.", m: 0, f: 2000, r: 5, p: 0.07 },
  { minYear: 1990, maxYear: 1999, category: "tech", title: "Gráficos 3D Dominam o Mercado", body: "Empresas sem 3D estão perdendo relevância rápidamente. O 2D está fora de moda.", m: 0, f: 0, r: 4, p: 0.06 },
  { minYear: 1990, maxYear: 1999, category: "competitor", title: "SEGA Dobra Aposta no Hardware", body: "SEGA lança novo add-on controverso. A console war esquenta.", m: 0, f: 1500, r: 0, p: 0.05 },
  { minYear: 1993, maxYear: 1999, category: "growth", title: "Internet Doméstica Cresce", body: "Modems discados conectam famílias. Gaming online na periferia, mas crescendo.", m: 0, f: 1000, r: 3, p: 0.06 },

  // Online era news
  { minYear: 2000, maxYear: 2009, category: "growth", title: "Banda Larga Expande o Online", body: "ADSL chega a milhões. Gaming online deixa de ser nicho.", m: 0, f: 3000, r: 4, p: 0.07 },
  { minYear: 2000, maxYear: 2009, category: "tech", title: "Motores 3D Licenciados Popularizam", body: "Unreal Engine e outros motores disponíveis a todos. Custo de dev cai.", m: 0, f: 0, r: 5, p: 0.06 },
  { minYear: 2000, maxYear: 2009, category: "crisis", title: "Crise de Identidade dos Portáteis", body: "SP Portátil e Game Pal Plus dividem o mercado. Qual plataforma vale mais o investimento?", m: 0, f: -500, r: -2, p: 0.05 },
  { minYear: 2007, maxYear: 2012, category: "growth", title: "Casual Gaming Atinge Novos Públicos", body: "Wiivo Sports e Brain Training trazem avós e crianças para o gaming.", m: 0, f: 5000, r: 5, p: 0.06 },

  // Modern era news
  { minYear: 2010, maxYear: 2019, category: "growth", title: "eSports Passa de Nicho a Indústria", body: "League of Legends World Championship tem 60M de espectadores. Gaming é desporto.", m: 0, f: 6000, r: 6, p: 0.07 },
  { minYear: 2010, maxYear: 2019, category: "tech", title: "VR/AR Atinge Consumidor", body: "Oculos, HTC Vive e StarPlay VR lançam. A realidade virtual virou produto real.", m: 0, f: 2000, r: 5, p: 0.05 },
  { minYear: 2010, maxYear: 2019, category: "growth", title: "Streaming de Jogos Explode", body: "Twitch, YouTube Gaming e Mixer competem por streamers. Visibilidade gratuita disponível.", m: 0, f: 8000, r: 4, p: 0.07 },
  { minYear: 2015, maxYear: 2019, category: "crisis", title: "Loot Boxes sob Regulação", body: "Governos europeus classificam loot boxes como jogo. Novo modelo de negócio necessário.", m: -40_000, f: -1000, r: -6, p: 0.04 },

  // Future era news
  { minYear: 2020, maxYear: 2100, category: "tech", title: "IA Gera Arte e Narrativa em Tempo Real", body: "Motores com IA criam mundos infinitos e personagens adaptativos. Dev muda para sempre.", m: 0, f: 0, r: 6, p: 0.06 },
  { minYear: 2020, maxYear: 2100, category: "growth", title: "Gaming Ultrapassa Cinema e Música", body: "Indústria de games vale $300B. Supera Hollywood e a indústria musical combinadas.", m: 0, f: 10000, r: 8, p: 0.05 },
  { minYear: 2025, maxYear: 2100, category: "tech", title: "Realidade Mista é o Novo Normal", body: "Óculos XR custam menos que smartphones. Gaming e realidade fundem-se completamente.", m: 0, f: 5000, r: 7, p: 0.05 },
  { minYear: 2035, maxYear: 2100, category: "growth", title: "Economias Virtuais Superam PIBs", body: "Moedas de jogos transacionam trilhões. Bens virtuais valem tanto quanto físicos.", m: 200_000, f: 20000, r: 10, p: 0.04 },

  // All-era generic news
  { minYear: 1972, maxYear: 2100, category: "growth", title: "Mercado Cresce Inesperadamente", body: "Analistas revisam previsões para cima. Momento de investir em novos produtos.", m: 0, f: 800, r: 3, p: 0.06 },
  { minYear: 1972, maxYear: 2100, category: "crisis", title: "Componentes em Falta", body: "Cadeia de suprimentos sob pressão. Custos de produção sobem globalmente.", m: -25_000, f: 0, r: -3, p: 0.05 },
  { minYear: 1972, maxYear: 2100, category: "tech", title: "Novos Chips Mais Eficientes", body: "Semicondutores de nova geração prometem 30% mais performance pelo mesmo custo.", m: 0, f: 0, r: 4, p: 0.06 },
  { minYear: 1972, maxYear: 2100, category: "growth", title: "Investidores Apostam em Games", body: "Fundos de capital de risco aportam no setor. Valuations sobem.", m: 50_000, f: 0, r: 4, p: 0.04 },
  { minYear: 1972, maxYear: 2100, category: "crisis", title: "Crise Econômica Regional", body: "Consumidores cortam gastos com entretenimento. Mercado retrair por 1–2 trimestres.", m: 0, f: -600, r: -4, p: 0.04 },

  // Stock market & company finance
  { minYear: 1990, maxYear: 2100, category: "growth", title: "Bolsa Favorece Empresas de Games", body: "Índice do setor de entretenimento digital sobe 12% na semana. Investidores otimistas.", m: 30_000, f: 0, r: 3, p: 0.04 },
  { minYear: 1990, maxYear: 2100, category: "crisis", title: "Correção nos Mercados Afeta Games", body: "Ações do setor de entretenimento digital recuam 15%. Analistas recomendam cautela.", m: -15_000, f: 0, r: -3, p: 0.04 },
  { minYear: 1985, maxYear: 2100, category: "growth", title: "Analistas Revêem Projeções para Cima", body: "Relatório trimestral surpreende positivamente. Valuation das líderes do setor dispara.", m: 25_000, f: 0, r: 4, p: 0.04 },
  { minYear: 1972, maxYear: 2100, category: "growth", title: "Boom de Fim de Ano no Varejo", body: "Natal e feriados geram pico histórico de vendas. Estoques esgotam em dias.", m: 60_000, f: 3000, r: 4, p: 0.04 },
  { minYear: 1972, maxYear: 2100, category: "crisis", title: "Desaceleração Pós-Feriados", body: "Mercado desacelera após pico sazonal. Demanda reprimida até o próximo trimestre.", m: -10_000, f: -300, r: -2, p: 0.04 },

  // Acquisitions & bankruptcies
  { minYear: 1985, maxYear: 2100, category: "competitor", title: "Estúdio Rival Fecha as Portas", body: "Uma empresa de médio porte declara falência após série de lançamentos fracassados. Talentos disponíveis no mercado.", m: 0, f: 500, r: 2, p: 0.04 },
  { minYear: 1990, maxYear: 2100, category: "competitor", title: "Aquisição Gigante Choca o Mercado", body: "Um conglomerado adquire estúdio independente por valor recorde. A consolidação do setor acelera.", m: 0, f: 0, r: -2, p: 0.03 },
  { minYear: 2000, maxYear: 2100, category: "growth", title: "Fusão Cria Novo Gigante do Setor", body: "Dois grandes estúdios se fundem para competir com líderes globais. Escala e recursos combinados mudam o cenário.", m: 0, f: 1000, r: 3, p: 0.03 },

  // Consumer trends & hype
  { minYear: 1985, maxYear: 2100, category: "growth", title: "Tendência Viral Impulsiona Interesse", body: "Um influenciador com milhões de seguidores promoveu gaming em grande escala. Demanda sobe inesperadamente.", m: 0, f: 2500, r: 3, p: 0.04 },
  { minYear: 2010, maxYear: 2100, category: "growth", title: "Geração Z Abraça o Gaming Clássico", body: "Retromania empurra demanda por consoles de estilo retro. Nicho lucrativo em expansão.", m: 0, f: 1500, r: 2, p: 0.04 },
  { minYear: 1985, maxYear: 2100, category: "growth", title: "Escassez Gera Demanda Reprimida", body: "Poucos bons produtos no mercado criam ansiedade nos consumidores. Momento estratégico para lançar.", m: 0, f: 1000, r: 2, p: 0.04 },
  { minYear: 1972, maxYear: 2100, category: "crisis", title: "Saturação do Mercado Pressiona Margens", body: "Demasiados títulos e consoles ao mesmo tempo. Consumidores esperam por opções de maior valor.", m: 0, f: -400, r: -2, p: 0.04 },

  // Research & tech breakthroughs
  { minYear: 1985, maxYear: 2100, category: "tech", title: "Pesquisa Revela Novo Método de Compressão", body: "Algoritmo de compressão reduz custos de armazenamento em 40%. Produção de jogos fica mais barata.", m: 5_000, f: 0, r: 3, p: 0.04 },
  { minYear: 2005, maxYear: 2100, category: "tech", title: "IA Entra no Pipeline de Desenvolvimento", body: "Ferramentas de IA aceleram design de personagens e ambientes. Equipes menores conseguem produzir mais.", m: 0, f: 0, r: 5, p: 0.04 },
  { minYear: 1990, maxYear: 2100, category: "tech", title: "Breakthrough em Baterias Muda Portáteis", body: "Nova tecnologia de bateria triplica autonomia em dispositivos portáteis. Mercado mobile aquece.", m: 0, f: 2000, r: 4, p: 0.04 },

  // Reputation & fan demand
  { minYear: 1985, maxYear: 2100, category: "growth", title: "Comunidade de Fãs em Expansão Acelerada", body: "Fóruns, eventos e grupos de discussão registram recorde de membros. Interesse orgânico crescendo sem campanha.", m: 0, f: 3000, r: 5, p: 0.04 },
  { minYear: 1972, maxYear: 2100, category: "crisis", title: "Onda de Críticas Online", body: "Consumidores organizam protestos nas redes sociais por falta de inovação no setor. Imagem das empresas sofre.", m: 0, f: -800, r: -5, p: 0.04 },

  // Investor pressure
  { minYear: 1990, maxYear: 2100, category: "crisis", title: "Investidores Exigem Resultados Imediatos", body: "Acionistas pressionam por margem de lucro mais alta e mais lançamentos. Cortes de custo cobrados.", m: 0, f: 0, r: -3, p: 0.03 },
];

export function getEraNewsItem(year: number): EraNewsItem | null {
  const pool = ERA_NEWS_POOL.filter((n) => year >= n.minYear && year <= n.maxYear);
  if (pool.length === 0) return null;
  let totalP = pool.reduce((s, n) => s + n.p, 0);
  let rand = Math.random() * totalP;
  for (const item of pool) {
    rand -= item.p;
    if (rand <= 0) return item;
  }
  return pool[pool.length - 1];
}

/** Same as getEraNewsItem but skips categories already seen recently. */
export function getEraNewsItemFiltered(year: number, skipCategories: string[]): EraNewsItem | null {
  const pool = ERA_NEWS_POOL.filter(
    (n) => year >= n.minYear && year <= n.maxYear && !skipCategories.includes(n.category)
  );
  if (pool.length === 0) return getEraNewsItem(year); // fall back if all filtered
  let totalP = pool.reduce((s, n) => s + n.p, 0);
  let rand = Math.random() * totalP;
  for (const item of pool) {
    rand -= item.p;
    if (rand <= 0) return item;
  }
  return pool[pool.length - 1];
}

export type StateNewsParams = {
  reputation: number;
  fans: number;
  marketShare: number;
  hasActiveConsole: boolean;
  hasReleasedGame: boolean;
  recentRevenueGrowth: number; // fraction e.g. 0.15 = 15% growth over last 3 months
  stockTrend: "rising" | "falling" | "stable" | "none";
  year: number;
  month: number;
};

/**
 * Returns a contextual EraNewsItem driven by the actual game state.
 * Only generates when conditions are truly interesting — returns null otherwise.
 */
export function generateStateAwareNewsItem(p: StateNewsParams): EraNewsItem | null {
  const base: Omit<EraNewsItem, "title" | "body" | "m" | "f" | "r" | "category"> = {
    p: 1, minYear: 1972, maxYear: 2100,
  };

  const candidates: (EraNewsItem & { weight: number })[] = [];

  if (p.reputation >= 80) {
    candidates.push({ ...base, weight: 3, category: "growth",
      title: "Imprensa Elogia Liderança do Setor",
      body: `Com reputação de ${Math.round(p.reputation)}/100, analistas destacam a empresa como referência de qualidade. Confiança dos consumidores em alta.`,
      m: 0, f: 2000, r: 2 });
  }
  if (p.reputation >= 90) {
    candidates.push({ ...base, weight: 2, category: "growth",
      title: "Reputação Impecável Atrai Parceiros Globais",
      body: "Distribuidoras e varejistas internacionais buscam parceria. Posição de mercado histórica.",
      m: 20_000, f: 3000, r: 3 });
  }
  if (p.reputation < 35) {
    candidates.push({ ...base, weight: 3, category: "crisis",
      title: "Reputação em Queda Preocupa Analistas",
      body: `Reputação caiu para ${Math.round(p.reputation)}/100. Consumidores desconfiam dos produtos. Momento crítico para reversão de imagem.`,
      m: 0, f: -800, r: -2 });
  }
  if (p.reputation < 20) {
    candidates.push({ ...base, weight: 2, category: "crisis",
      title: "Boicote de Consumidores Organizado Online",
      body: "Fãs insatisfeitos organizam campanha de boicote. Reputação historicamente baixa exige ação imediata.",
      m: -10_000, f: -1500, r: -3 });
  }
  if (p.marketShare >= 30) {
    candidates.push({ ...base, weight: 2, category: "growth",
      title: "Domínio de Mercado Reconhecido pela Mídia",
      body: `Com ${Math.round(p.marketShare)}% do mercado, analistas reconhecem liderança consolidada. Pressão dos rivais aumenta — e a exposição também.`,
      m: 20_000, f: 4000, r: 4 });
  }
  if (p.fans >= 1_000_000) {
    candidates.push({ ...base, weight: 2, category: "growth",
      title: "Base de Fãs Supera Marco de Milhão",
      body: `${(p.fans / 1_000_000).toFixed(1)}M de fãs ativos. A comunidade fiel é um dos maiores ativos da empresa — e o melhor canal de marketing.`,
      m: 0, f: 5000, r: 3 });
  }
  if (p.recentRevenueGrowth > 0.20) {
    candidates.push({ ...base, weight: 3, category: "growth",
      title: "Receita Acelera: Analistas Surpresos",
      body: "Crescimento de receita supera projeções trimestrais. Investidores aumentam participação no setor.",
      m: 40_000, f: 1000, r: 4 });
  }
  if (p.recentRevenueGrowth < -0.15) {
    candidates.push({ ...base, weight: 3, category: "crisis",
      title: "Queda na Receita Preocupa Stakeholders",
      body: "Receita caiu mais de 15% nos últimos meses. Analistas revêem projeções. Pressão por novos lançamentos.",
      m: -10_000, f: -500, r: -3 });
  }
  if (p.stockTrend === "rising" && p.year >= 1990) {
    candidates.push({ ...base, weight: 2, category: "growth",
      title: "Ações em Alta Consecutiva",
      body: "Preço das ações sobe pelo terceiro mês seguido. Mercado financeiro confia no desempenho operacional.",
      m: 0, f: 0, r: 4 });
  }
  if (p.stockTrend === "falling" && p.year >= 1990) {
    candidates.push({ ...base, weight: 2, category: "crisis",
      title: "Ações Sob Pressão de Venda",
      body: "Preço das ações cai consecutivamente. Investidores nervosos aguardam próximos resultados e lançamentos.",
      m: 0, f: 0, r: -3 });
  }
  if (p.hasActiveConsole && p.hasReleasedGame) {
    candidates.push({ ...base, weight: 1, category: "growth",
      title: "Ecossistema de Hardware e Software Elogiado",
      body: "Analistas de mercado destacam o equilíbrio entre hardware e jogos. Estratégia integrada valoriza a marca.",
      m: 0, f: 1500, r: 3 });
  }
  if (!p.hasReleasedGame && p.fans > 10_000) {
    candidates.push({ ...base, weight: 2, category: "crisis",
      title: "Fãs Frustrados com Falta de Jogos",
      body: "A base de fãs cobra novos lançamentos de software. Sem novos títulos, o engajamento cai gradualmente.",
      m: 0, f: -600, r: -2 });
  }

  if (candidates.length === 0) return null;

  const totalW = candidates.reduce((s, c) => s + c.weight, 0);
  let rand = Math.random() * totalW;
  for (const c of candidates) {
    rand -= c.weight;
    if (rand <= 0) return c;
  }
  return candidates[candidates.length - 1];
}
