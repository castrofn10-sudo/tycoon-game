// ── Historical Rival Release System ───────────────────────────────────────────
// Pure data layer — no imports from game systems, no side effects.
// Used only to inject cosmetic news + tiny market-pressure events at year rollover.

export type RivalCompany = {
  id:        string;
  name:      string;
  archetype: string;
};

export type RivalConsoleRelease = {
  id:          string;
  companyId:   string;
  consoleName: string;
  year:        number;
  powerTier:   number; // 1 (weak) – 5 (leading-edge)
  marketBuzz:  number; // 0–100; drives small market-share bump if ≥60
};

export type RivalFranchiseRelease = {
  id:           string;
  companyId:    string;
  franchiseName: string;
  genre:        string;
  year:         number;
  qualityRange: [number, number]; // e.g. [75, 90]
  popularity:   number;           // 0–100
};

// ── Rival Companies ────────────────────────────────────────────────────────────
export const RIVAL_COMPANIES: RivalCompany[] = [
  { id: "nintaro",   name: "Nintaro",   archetype: "family-friendly platformers & handhelds" },
  { id: "sonex",     name: "Sonex",     archetype: "multimedia entertainment & prestige exclusives" },
  { id: "microhard", name: "Microhard", archetype: "PC crossover & online gaming ecosystem" },
  { id: "segato",    name: "Segato",    archetype: "arcade-to-home pioneer, speed-focused mascots" },
  { id: "capkron",   name: "Capkron",   archetype: "competitive fighting & action games" },
  { id: "konex",     name: "Konex",     archetype: "fantasy RPG & story-driven adventures" },
  { id: "ubigame",   name: "Ubigame",   archetype: "open-world & sandbox experiences" },
  { id: "eonarts",   name: "EonArts",   archetype: "sports simulations & narrative games" },
];

// ── Historical Console Releases ────────────────────────────────────────────────
export const RIVAL_CONSOLE_RELEASES: RivalConsoleRelease[] = [
  // 1980s — early era, arcade-home bridge
  { id: "rc_001", companyId: "nintaro",   consoleName: "FunSystem",       year: 1983, powerTier: 1, marketBuzz: 70 },
  { id: "rc_002", companyId: "segato",    consoleName: "MegaBlaze",       year: 1988, powerTier: 2, marketBuzz: 65 },
  { id: "rc_003", companyId: "nintaro",   consoleName: "GamePal",         year: 1989, powerTier: 1, marketBuzz: 55 },
  // 1990s — console wars
  { id: "rc_004", companyId: "sonex",     consoleName: "PlayZone",        year: 1994, powerTier: 3, marketBuzz: 90 },
  { id: "rc_005", companyId: "segato",    consoleName: "BlazeStar 32",    year: 1994, powerTier: 2, marketBuzz: 60 },
  { id: "rc_006", companyId: "nintaro",   consoleName: "NeoCube 64",      year: 1996, powerTier: 3, marketBuzz: 85 },
  { id: "rc_007", companyId: "sonex",     consoleName: "PlayZone 2",      year: 1999, powerTier: 4, marketBuzz: 88 },
  // 2000s — 3D/online boom
  { id: "rc_008", companyId: "microhard", consoleName: "XSphere",         year: 2001, powerTier: 4, marketBuzz: 80 },
  { id: "rc_009", companyId: "nintaro",   consoleName: "GameCubit",       year: 2001, powerTier: 3, marketBuzz: 62 },
  { id: "rc_010", companyId: "sonex",     consoleName: "PlayZone 3",      year: 2006, powerTier: 5, marketBuzz: 92 },
  { id: "rc_011", companyId: "microhard", consoleName: "XSphere 360",     year: 2005, powerTier: 4, marketBuzz: 85 },
  { id: "rc_012", companyId: "nintaro",   consoleName: "MotionCube",      year: 2006, powerTier: 3, marketBuzz: 95 },
  // 2010s — online heavy, hybrid
  { id: "rc_013", companyId: "sonex",     consoleName: "PlayZone 4",      year: 2013, powerTier: 5, marketBuzz: 95 },
  { id: "rc_014", companyId: "microhard", consoleName: "XSphere One",     year: 2013, powerTier: 5, marketBuzz: 80 },
  { id: "rc_015", companyId: "nintaro",   consoleName: "SwitchUp",        year: 2017, powerTier: 4, marketBuzz: 98 },
  { id: "rc_016", companyId: "sonex",     consoleName: "PlayZone 5",      year: 2020, powerTier: 5, marketBuzz: 90 },
  // 2020s — cloud/digital era
  { id: "rc_017", companyId: "microhard", consoleName: "XSphere Series X",year: 2020, powerTier: 5, marketBuzz: 85 },
  { id: "rc_018", companyId: "nintaro",   consoleName: "SwitchUp 2",      year: 2024, powerTier: 4, marketBuzz: 88 },
];

// ── Historical Franchise Releases ──────────────────────────────────────────────
export const RIVAL_FRANCHISE_RELEASES: RivalFranchiseRelease[] = [
  // 1980s — platformers & arcade
  { id: "rf_001", companyId: "nintaro",   franchiseName: "Super Plumber Bros",  genre: "Platform",  year: 1985, qualityRange: [80, 92], popularity: 90 },
  { id: "rf_002", companyId: "nintaro",   franchiseName: "Legend of Zenda",     genre: "Adventure", year: 1986, qualityRange: [82, 94], popularity: 88 },
  { id: "rf_003", companyId: "segato",    franchiseName: "Speed Hog",           genre: "Platform",  year: 1991, qualityRange: [78, 90], popularity: 85 },
  { id: "rf_004", companyId: "capkron",   franchiseName: "Street Brawl",        genre: "Fighting",  year: 1987, qualityRange: [75, 88], popularity: 82 },
  // 1990s — franchise wars
  { id: "rf_005", companyId: "konex",     franchiseName: "Final Legend",        genre: "RPG",       year: 1990, qualityRange: [85, 96], popularity: 92 },
  { id: "rf_006", companyId: "capkron",   franchiseName: "Monster Tamer",       genre: "RPG",       year: 1996, qualityRange: [88, 97], popularity: 95 },
  { id: "rf_007", companyId: "sonex",     franchiseName: "Metal Guard",         genre: "Action",    year: 1998, qualityRange: [84, 95], popularity: 88 },
  { id: "rf_008", companyId: "ubigame",   franchiseName: "Creed of Assassins",  genre: "Action",    year: 1999, qualityRange: [80, 92], popularity: 82 },
  // 2000s — 3D/shooter boom
  { id: "rf_009", companyId: "microhard", franchiseName: "Battle Duty",         genre: "Shooter",   year: 2003, qualityRange: [82, 93], popularity: 90 },
  { id: "rf_010", companyId: "eonarts",   franchiseName: "GalaxSport",          genre: "Sports",    year: 2001, qualityRange: [78, 88], popularity: 80 },
  { id: "rf_011", companyId: "ubigame",   franchiseName: "Open Frontier",       genre: "Sandbox",   year: 2007, qualityRange: [80, 91], popularity: 84 },
  { id: "rf_012", companyId: "konex",     franchiseName: "Dragon's Reach",      genre: "RPG",       year: 2009, qualityRange: [86, 96], popularity: 88 },
  // 2010s — blockbuster era
  { id: "rf_013", companyId: "ubigame",   franchiseName: "DivisionWatch",       genre: "Online",    year: 2016, qualityRange: [78, 90], popularity: 85 },
  { id: "rf_014", companyId: "microhard", franchiseName: "Battle Duty: Warzone",genre: "Shooter",   year: 2019, qualityRange: [82, 92], popularity: 92 },
  { id: "rf_015", companyId: "eonarts",   franchiseName: "Ultimate Pitch",      genre: "Sports",    year: 2012, qualityRange: [76, 87], popularity: 78 },
  { id: "rf_016", companyId: "nintaro",   franchiseName: "Star Odyssey",        genre: "Adventure", year: 2017, qualityRange: [90, 98], popularity: 94 },
  // 2020s — live-service era
  { id: "rf_017", companyId: "sonex",     franchiseName: "HorizonVerse",        genre: "Open-World",year: 2021, qualityRange: [85, 95], popularity: 88 },
  { id: "rf_018", companyId: "capkron",   franchiseName: "Street Brawl 6",      genre: "Fighting",  year: 2022, qualityRange: [84, 93], popularity: 86 },
];

// ── Helper functions ───────────────────────────────────────────────────────────
export function getRivalConsoleReleasesForYear(year: number): RivalConsoleRelease[] {
  return RIVAL_CONSOLE_RELEASES.filter(r => r.year === year);
}

export function getRivalFranchiseReleasesForYear(year: number): RivalFranchiseRelease[] {
  return RIVAL_FRANCHISE_RELEASES.filter(r => r.year === year);
}

export function getRivalCompanyName(companyId: string): string {
  return RIVAL_COMPANIES.find(c => c.id === companyId)?.name ?? companyId;
}
