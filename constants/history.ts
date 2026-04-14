// ── Decade-Based Historical World Events ──────────────────────────────────────
// Pure data layer. No imports from game systems. No side effects.
// Used only to generate cosmetic news items when years advance in-game.

export type GameCompany = {
  name: string;
  archetype: string;
};

export type GameConsole = {
  name: string;
  company: string;
  releaseYear: number;
  powerLevel: number;
};

export type GameFranchise = {
  name: string;
  genre: string;
  firstReleaseYear: number;
  popularity: number;
};

export type WorldEventSet = {
  consoles: GameConsole[];
  franchises: GameFranchise[];
};

// ── Fictional Companies ────────────────────────────────────────────────────────

export const GAME_COMPANIES: GameCompany[] = [
  { name: "Nintaro",   archetype: "family-friendly platformers & handhelds" },
  { name: "Sonex",     archetype: "multimedia entertainment & prestige exclusives" },
  { name: "Microhard", archetype: "PC crossover & online gaming ecosystem" },
  { name: "Segato",    archetype: "arcade-to-home pioneer, speed-focused mascots" },
  { name: "Polarris",  archetype: "niche RPG & story-driven specialist" },
  { name: "Kapcon",    archetype: "competitive fighting & arcade ports" },
];

// ── Fictional Consoles ─────────────────────────────────────────────────────────

export const GAME_CONSOLES: GameConsole[] = [
  // 1970s
  { name: "Segato ArcadeHome 2600",  company: "Segato",    releaseYear: 1977, powerLevel: 1 },
  // 1980s
  { name: "Nintaro EnterSystem",     company: "Nintaro",   releaseYear: 1983, powerLevel: 2 },
  { name: "Segato MasterMachine",    company: "Segato",    releaseYear: 1985, powerLevel: 2 },
  { name: "Nintaro SuperPlay",       company: "Nintaro",   releaseYear: 1990, powerLevel: 3 },
  { name: "Segato BlastDrive",       company: "Segato",    releaseYear: 1989, powerLevel: 3 },
  // 1990s
  { name: "Sonex PlayBox",           company: "Sonex",     releaseYear: 1994, powerLevel: 4 },
  { name: "Segato Saturn3",          company: "Segato",    releaseYear: 1994, powerLevel: 4 },
  { name: "Nintaro Ultra64",         company: "Nintaro",   releaseYear: 1996, powerLevel: 4 },
  { name: "Sonex PlayBox 2",         company: "Sonex",     releaseYear: 2000, powerLevel: 5 },
  // 2000s
  { name: "Microhard XCube",         company: "Microhard", releaseYear: 2001, powerLevel: 5 },
  { name: "Nintaro GameCube+",       company: "Nintaro",   releaseYear: 2001, powerLevel: 5 },
  { name: "Microhard XCube 360",     company: "Microhard", releaseYear: 2005, powerLevel: 6 },
  { name: "Sonex PlayBox 3",         company: "Sonex",     releaseYear: 2006, powerLevel: 6 },
  { name: "Nintaro Wii Motion",      company: "Nintaro",   releaseYear: 2006, powerLevel: 5 },
  // 2010s
  { name: "Sonex PlayBox 4",         company: "Sonex",     releaseYear: 2013, powerLevel: 7 },
  { name: "Microhard XBox Edge",     company: "Microhard", releaseYear: 2013, powerLevel: 7 },
  { name: "Nintaro Fusion",          company: "Nintaro",   releaseYear: 2017, powerLevel: 7 },
  // 2020s
  { name: "Sonex PlayBox 5",         company: "Sonex",     releaseYear: 2020, powerLevel: 9 },
  { name: "Microhard XBox Nexus",    company: "Microhard", releaseYear: 2020, powerLevel: 9 },
  { name: "Nintaro Fusion 2",        company: "Nintaro",   releaseYear: 2024, powerLevel: 8 },
];

// ── Fictional Franchises ───────────────────────────────────────────────────────

export const GAME_FRANCHISES: GameFranchise[] = [
  { name: "Super Plumber Bros",    genre: "plataforma",  firstReleaseYear: 1985, popularity: 98 },
  { name: "Legend of Zenda",       genre: "aventura",    firstReleaseYear: 1986, popularity: 95 },
  { name: "Speed Racer X",         genre: "corrida",     firstReleaseYear: 1988, popularity: 82 },
  { name: "Street Kombat",         genre: "luta",        firstReleaseYear: 1991, popularity: 90 },
  { name: "Sonic Boom Hedgehog",   genre: "plataforma",  firstReleaseYear: 1991, popularity: 88 },
  { name: "Battle Duty",           genre: "ação",        firstReleaseYear: 1992, popularity: 93 },
  { name: "Final Chapter",         genre: "RPG",         firstReleaseYear: 1994, popularity: 91 },
  { name: "Metal Solid",           genre: "furtivo",     firstReleaseYear: 1998, popularity: 87 },
  { name: "Grand Theft Wheels",    genre: "mundo aberto",firstReleaseYear: 2001, popularity: 96 },
  { name: "Horde",                 genre: "ação",        firstReleaseYear: 2001, popularity: 89 },
  { name: "God of Thunder",        genre: "ação",        firstReleaseYear: 2005, popularity: 92 },
  { name: "Assassins Crux",        genre: "ação",        firstReleaseYear: 2007, popularity: 86 },
  { name: "Craft & Mine",          genre: "sandbox",     firstReleaseYear: 2011, popularity: 94 },
  { name: "Destiny Space",         genre: "shooter",     firstReleaseYear: 2014, popularity: 80 },
  { name: "Battle Royale Zone",    genre: "battle royale",firstReleaseYear: 2017, popularity: 85 },
  { name: "Eternal Veil Online",   genre: "MMORPG",      firstReleaseYear: 2022, popularity: 78 },
];

// ── Timeline Query Function ────────────────────────────────────────────────────

/**
 * Pure function. Returns consoles and franchises associated with the given year.
 * No side effects. No game system calls.
 */
export function getEventsForYear(year: number): WorldEventSet {
  return {
    consoles:   GAME_CONSOLES.filter((c) => c.releaseYear === year),
    franchises: GAME_FRANCHISES.filter((f) => f.firstReleaseYear === year),
  };
}
