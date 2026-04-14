// ─────────────────────────────────────────────────────────────────
// CONSOLE COMPONENT LIBRARY
// Full hardware component system with historical year gates
// Brand names are fictional — inspired by real-world but legally distinct
// ─────────────────────────────────────────────────────────────────

export type ComponentQuality = "budget" | "standard" | "premium" | "ultra";

// ── CPU ──────────────────────────────────────────────────────────
export type CPUOption = {
  id: string;
  name: string;
  cores: number;
  ghzBase: number;
  performanceScore: number;  // 1–100
  tdpWatts: number;
  costUSD: number;
  minYear: number;
  historicalRef: string;
  architecture: string;
};

export const CPU_OPTIONS: CPUOption[] = [
  { id: "cpu_mos6502",    name: "MOS 6502",                  cores: 1,  ghzBase: 0.001, performanceScore: 2,   tdpWatts: 1,   costUSD: 15,  minYear: 1972, historicalRef: "Atrion/NFX era (1975–1985)",             architecture: "8-bit" },
  { id: "cpu_z80",        name: "Zilog Z80",                  cores: 1,  ghzBase: 0.004, performanceScore: 4,   tdpWatts: 1.5, costUSD: 20,  minYear: 1976, historicalRef: "Game Pal / Master Console",               architecture: "8-bit" },
  { id: "cpu_68000",      name: "Mortola M-68000",            cores: 1,  ghzBase: 0.008, performanceScore: 10,  tdpWatts: 2,   costUSD: 40,  minYear: 1981, historicalRef: "MegaDrive / Era 16-bit (1985–1993)",                   architecture: "16-bit" },
  { id: "cpu_mips_r3000", name: "MIPS R3000A",                cores: 1,  ghzBase: 0.033, performanceScore: 22,  tdpWatts: 3,   costUSD: 55,  minYear: 1994, historicalRef: "StarPlay 1 era (1994)",                   architecture: "32-bit RISC" },
  { id: "cpu_ppc_gecko",  name: "PowerPC Gekko",              cores: 1,  ghzBase: 0.485, performanceScore: 42,  tdpWatts: 10,  costUSD: 90,  minYear: 2001, historicalRef: "GamePlex era (2001)",                     architecture: "32-bit PPC" },
  { id: "cpu_cell",       name: "Cell Broadband Engine",      cores: 9,  ghzBase: 3.2,   performanceScore: 70,  tdpWatts: 90,  costUSD: 230, minYear: 2006, historicalRef: "StarPlay 3 era (2006)",                   architecture: "64-bit PPC" },
  { id: "cpu_x86_quad",   name: "Apex Jaguar x86 (8-core)",  cores: 8,  ghzBase: 1.6,   performanceScore: 60,  tdpWatts: 80,  costUSD: 150, minYear: 2013, historicalRef: "SP4 / XStation One era (2013)",           architecture: "x86-64 APU" },
  { id: "cpu_zen2",       name: "Apex Zen 2 (8-core)",        cores: 8,  ghzBase: 3.5,   performanceScore: 88,  tdpWatts: 65,  costUSD: 280, minYear: 2019, historicalRef: "SP5 / XStation Spectrum era (2020)",      architecture: "7nm Zen 2" },
  { id: "cpu_arm_a78",    name: "ARC Cortex-A78 (4-core)",   cores: 4,  ghzBase: 2.8,   performanceScore: 50,  tdpWatts: 8,   costUSD: 95,  minYear: 2020, historicalRef: "Mobile gaming SoC (2020+)",               architecture: "64-bit ARC" },
  { id: "cpu_quantum",    name: "Quantum Core X1",            cores: 32, ghzBase: 6.0,   performanceScore: 100, tdpWatts: 120, costUSD: 800, minYear: 2050, historicalRef: "Near-future architecture (2050+)",         architecture: "Quantum-classical hybrid" },
];

// ── GPU ──────────────────────────────────────────────────────────
export type GPUOption = {
  id: string;
  name: string;
  tflops: number;
  vramGB: number;
  performanceScore: number;
  tdpWatts: number;
  costUSD: number;
  minYear: number;
  historicalRef: string;
  api: string;
};

export const GPU_OPTIONS: GPUOption[] = [
  { id: "gpu_none",         name: "Sem GPU (CPU+Tiles)",         tflops: 0.0001, vramGB: 0,     performanceScore: 1,   tdpWatts: 0,   costUSD: 0,    minYear: 1972, historicalRef: "Atrion / NFX era — tile-based",          api: "Custom" },
  { id: "gpu_vdp1",         name: "Senga VDP 16-bit",            tflops: 0.0005, vramGB: 0.0001,performanceScore: 5,   tdpWatts: 3,   costUSD: 25,   minYear: 1985, historicalRef: "MegaDrive era (1988)",                    api: "Custom" },
  { id: "gpu_sgfx",         name: "SuperFX GSU-1",               tflops: 0.002,  vramGB: 0.0005,performanceScore: 12,  tdpWatts: 5,   costUSD: 60,   minYear: 1993, historicalRef: "Super NFX Chip era (1993)",               api: "Custom" },
  { id: "gpu_rcp_rdp",      name: "Reality Co-Processor (RCP)",  tflops: 0.05,   vramGB: 0.004, performanceScore: 28,  tdpWatts: 8,   costUSD: 90,   minYear: 1996, historicalRef: "Nintaro 64 era (1996)",                   api: "Custom" },
  { id: "gpu_gte_gpu",      name: "GPU (32-bit 3D)",             tflops: 0.08,   vramGB: 0.001, performanceScore: 22,  tdpWatts: 7,   costUSD: 75,   minYear: 1994, historicalRef: "StarPlay 1 era (1994)",                   api: "Custom" },
  { id: "gpu_geforce3",     name: "NV20 (Vertex Shader Gen 3)",  tflops: 0.08,   vramGB: 0.064, performanceScore: 38,  tdpWatts: 22,  costUSD: 110,  minYear: 2001, historicalRef: "XStation era (2001) — first T&L GPU",     api: "DirectX 8" },
  { id: "gpu_rsx",          name: "RSX Reality Synthesizer",     tflops: 1.8,    vramGB: 0.256, performanceScore: 65,  tdpWatts: 60,  costUSD: 200,  minYear: 2006, historicalRef: "StarPlay 3 era (2006)",                   api: "OpenGL 3.0" },
  { id: "gpu_gcn_polaris",  name: "Apex GCN 1.1 (Polaris)",      tflops: 1.84,   vramGB: 8,     performanceScore: 72,  tdpWatts: 120, costUSD: 220,  minYear: 2013, historicalRef: "SP4 / XStation One GPU era (2013)",       api: "DirectX 11.1" },
  { id: "gpu_rdna2",        name: "Apex RDNA2 (10.28 TFLOPS)",   tflops: 10.28,  vramGB: 16,    performanceScore: 96,  tdpWatts: 200, costUSD: 480,  minYear: 2020, historicalRef: "SP5 / XStation Spectrum GPU era (2020)",  api: "DirectX 12 Ultimate" },
  { id: "gpu_neural_render",name: "Neural Render Engine",        tflops: 100,    vramGB: 64,    performanceScore: 100, tdpWatts: 150, costUSD: 1200, minYear: 2040, historicalRef: "AI-accelerated future GPU (2040+)",       api: "Neural API 2.0" },
];

// ── MEMORY ───────────────────────────────────────────────────────
export type MemoryComponent = {
  id: string;
  name: string;
  capacityMB: number;
  bandwidthGBs: number;
  type: string;
  costUSD: number;
  minYear: number;
  historicalRef: string;
};

export const MEMORY_COMPONENTS: MemoryComponent[] = [
  { id: "mem_2kb",   name: "2 KB RAM",       capacityMB: 0.002,  bandwidthGBs: 0.000005, type: "SRAM",  costUSD: 5,   minYear: 1972, historicalRef: "Atrion 2600 era (1977)" },
  { id: "mem_8kb",   name: "8 KB RAM",       capacityMB: 0.008,  bandwidthGBs: 0.00002,  type: "DRAM",  costUSD: 8,   minYear: 1978, historicalRef: "Atrion 5200 era (1982)" },
  { id: "mem_64kb",  name: "64 KB RAM",      capacityMB: 0.064,  bandwidthGBs: 0.0001,   type: "DRAM",  costUSD: 12,  minYear: 1983, historicalRef: "NFX era (1983)" },
  { id: "mem_2mb",   name: "2 MB RAM",       capacityMB: 2,      bandwidthGBs: 0.025,    type: "EDO DRAM", costUSD: 25, minYear: 1992, historicalRef: "Super NFX / MegaDrive era" },
  { id: "mem_32mb",  name: "32 MB RAM",      capacityMB: 32,     bandwidthGBs: 0.3,      type: "RDRAM", costUSD: 55,  minYear: 1996, historicalRef: "Nintaro 64 era (1996)" },
  { id: "mem_128mb", name: "128 MB RAM",     capacityMB: 128,    bandwidthGBs: 3.2,      type: "RDRAM", costUSD: 80,  minYear: 2000, historicalRef: "StarPlay 2 era (2000)" },
  { id: "mem_512mb", name: "512 MB RAM",     capacityMB: 512,    bandwidthGBs: 25.6,     type: "GDDR3", costUSD: 120, minYear: 2005, historicalRef: "XStation 360 / SP3 era (2005–6)" },
  { id: "mem_8gb",   name: "8 GB GDDR5",     capacityMB: 8192,   bandwidthGBs: 176,      type: "GDDR5", costUSD: 190, minYear: 2013, historicalRef: "SP4 / XStation One era (2013)" },
  { id: "mem_16gb",  name: "16 GB GDDR6",    capacityMB: 16384,  bandwidthGBs: 448,      type: "GDDR6", costUSD: 280, minYear: 2020, historicalRef: "SP5 / XStation Spectrum era (2020)" },
  { id: "mem_32gb",  name: "32 GB HBM3",     capacityMB: 32768,  bandwidthGBs: 1000,     type: "HBM3",  costUSD: 600, minYear: 2030, historicalRef: "Next-gen HBM memory (2030+)" },
];

// ── STORAGE ──────────────────────────────────────────────────────
export type StorageOption = {
  id: string;
  name: string;
  capacityGB: number;
  speedMBs: number;
  type: "cartridge" | "floppy" | "cd" | "dvd" | "bluray" | "hdd" | "ssd" | "nvme" | "holographic";
  costUSD: number;
  minYear: number;
  historicalRef: string;
};

export const STORAGE_OPTIONS: StorageOption[] = [
  { id: "stor_cart_2mb",    name: "Cartucho 2 MB",           capacityGB: 0.002,  speedMBs: 5,     type: "cartridge",   costUSD: 20,  minYear: 1972, historicalRef: "Atrion 2600 cartridge" },
  { id: "stor_floppy",      name: "Disquete 1.44 MB",        capacityGB: 0.00144,speedMBs: 0.5,   type: "floppy",      costUSD: 12,  minYear: 1977, historicalRef: "Atrion / Era Pioneira (1977)" },
  { id: "stor_cart_16mb",   name: "Cartucho 16 MB",          capacityGB: 0.016,  speedMBs: 10,    type: "cartridge",   costUSD: 35,  minYear: 1988, historicalRef: "MegaDrive / NFX cartridge" },
  { id: "stor_cart_64mb",   name: "Cartucho 64 MB",          capacityGB: 0.064,  speedMBs: 15,    type: "cartridge",   costUSD: 55,  minYear: 1994, historicalRef: "Super NFX / Game Pal 64MB" },
  { id: "stor_cd",          name: "CD-ROM (650 MB)",         capacityGB: 0.65,   speedMBs: 1.5,   type: "cd",          costUSD: 30,  minYear: 1994, historicalRef: "StarPlay 1 / Saturn era (1994)" },
  { id: "stor_dvd",         name: "DVD (4.7 GB)",            capacityGB: 4.7,    speedMBs: 11,    type: "dvd",         costUSD: 40,  minYear: 2000, historicalRef: "StarPlay 2 / GamePlex era (2000)" },
  { id: "stor_hdd_8gb",     name: "HDD 8 GB",                capacityGB: 8,      speedMBs: 30,    type: "hdd",         costUSD: 45,  minYear: 2002, historicalRef: "XStation (2001) built-in HDD" },
  { id: "stor_bluray",      name: "Blu-ray (50 GB)",         capacityGB: 50,     speedMBs: 54,    type: "bluray",      costUSD: 50,  minYear: 2006, historicalRef: "SP3 / XStation One era" },
  { id: "stor_ssd_256gb",   name: "SSD 256 GB",              capacityGB: 256,    speedMBs: 550,   type: "ssd",         costUSD: 70,  minYear: 2013, historicalRef: "SP4 / XStation One SSD era" },
  { id: "stor_nvme_1tb",    name: "NVMe SSD 1 TB",           capacityGB: 1000,   speedMBs: 5500,  type: "nvme",        costUSD: 120, minYear: 2020, historicalRef: "SP5 / XStation Spectrum NVMe" },
  { id: "stor_holographic", name: "Disco Holográfico 100 TB",capacityGB: 100000, speedMBs: 50000, type: "holographic", costUSD: 400, minYear: 2040, historicalRef: "Holographic storage (future)" },
];

// ── COOLING ──────────────────────────────────────────────────────
export type CoolingOption = {
  id: string;
  name: string;
  maxTDP: number;
  noiseLevel: number;
  failureRisk: number;
  costUSD: number;
  minYear: number;
  historicalRef: string;
};

export const COOLING_OPTIONS: CoolingOption[] = [
  { id: "cool_passive",       name: "Resfriamento Passivo",           maxTDP: 5,    noiseLevel: 0, failureRisk: 0.02,  costUSD: 3,   minYear: 1972, historicalRef: "Consoles simples sem ventilador" },
  { id: "cool_small_fan",     name: "Ventilador Pequeno",             maxTDP: 20,   noiseLevel: 3, failureRisk: 0.06,  costUSD: 8,   minYear: 1983, historicalRef: "NFX / MegaDrive fan" },
  { id: "cool_heatsink_fan",  name: "Dissipador + Ventilador",        maxTDP: 50,   noiseLevel: 4, failureRisk: 0.05,  costUSD: 18,  minYear: 1994, historicalRef: "StarPlay 1 / Nintaro 64 heatsink" },
  { id: "cool_dual_fan",      name: "Sistema Duplo (2 ventiladores)", maxTDP: 100,  noiseLevel: 5, failureRisk: 0.04,  costUSD: 30,  minYear: 2001, historicalRef: "XStation / GamePlex era (2001)" },
  { id: "cool_vapor_chamber", name: "Câmara de Vapor",                maxTDP: 180,  noiseLevel: 3, failureRisk: 0.02,  costUSD: 55,  minYear: 2006, historicalRef: "SP3 vapor chamber (after YLOD)" },
  { id: "cool_liquid",        name: "Resfriamento Líquido",           maxTDP: 300,  noiseLevel: 2, failureRisk: 0.015, costUSD: 90,  minYear: 2013, historicalRef: "High-end PC cooling (2013+)" },
  { id: "cool_immersion",     name: "Imersão em Dielétrico",          maxTDP: 1000, noiseLevel: 0, failureRisk: 0.005, costUSD: 250, minYear: 2030, historicalRef: "Data center immersion cooling (future)" },
];

// ── CONTROLLER ───────────────────────────────────────────────────
export type ControllerOption = {
  id: string;
  name: string;
  buttons: number;
  hasAnalog: boolean;
  hasRumble: boolean;
  hasMotion: boolean;
  hasTouchpad: boolean;
  hasHaptics: boolean;
  comfortScore: number;
  costUSD: number;
  minYear: number;
  historicalRef: string;
};

export const CONTROLLER_OPTIONS: ControllerOption[] = [
  { id: "ctrl_joystick",    name: "Joystick (1 botão)",           buttons: 1,  hasAnalog: false, hasRumble: false, hasMotion: false, hasTouchpad: false, hasHaptics: false, comfortScore: 3,  costUSD: 8,  minYear: 1972, historicalRef: "Atrion 2600 Joystick era (1977)" },
  { id: "ctrl_dpad_2btn",   name: "D-Pad + 2 Botões",             buttons: 2,  hasAnalog: false, hasRumble: false, hasMotion: false, hasTouchpad: false, hasHaptics: false, comfortScore: 5,  costUSD: 12, minYear: 1983, historicalRef: "NFX Controller era (1983)" },
  { id: "ctrl_6btn",        name: "Controle 6 Botões",            buttons: 6,  hasAnalog: false, hasRumble: false, hasMotion: false, hasTouchpad: false, hasHaptics: false, comfortScore: 7,  costUSD: 15, minYear: 1990, historicalRef: "Super NFX Controller era (1990)" },
  { id: "ctrl_dual_analog", name: "Dual Analog (2 sticks)",       buttons: 10, hasAnalog: true,  hasRumble: false, hasMotion: false, hasTouchpad: false, hasHaptics: false, comfortScore: 8,  costUSD: 22, minYear: 1996, historicalRef: "Soniq DualAnalog / Nintaro 64 (1997)" },
  { id: "ctrl_dualshock",   name: "DualStrike (vibração)",        buttons: 12, hasAnalog: true,  hasRumble: true,  hasMotion: false, hasTouchpad: false, hasHaptics: false, comfortScore: 9,  costUSD: 28, minYear: 1998, historicalRef: "DualStrike 1 era (1998)" },
  { id: "ctrl_motion",      name: "Controle Motion (giroscópio)", buttons: 10, hasAnalog: true,  hasRumble: true,  hasMotion: true,  hasTouchpad: false, hasHaptics: false, comfortScore: 7,  costUSD: 35, minYear: 2006, historicalRef: "Wiivo Remote / SixPad era (2006)" },
  { id: "ctrl_touchpad",    name: "DualStrike 4 (touchpad)",      buttons: 14, hasAnalog: true,  hasRumble: true,  hasMotion: true,  hasTouchpad: true,  hasHaptics: false, comfortScore: 9,  costUSD: 45, minYear: 2013, historicalRef: "DualStrike 4 / XStation One era (2013)" },
  { id: "ctrl_haptic",      name: "HapticPad (háptica adaptativa)",buttons: 14, hasAnalog: true,  hasRumble: true,  hasMotion: true,  hasTouchpad: true,  hasHaptics: true,  comfortScore: 10, costUSD: 70, minYear: 2020, historicalRef: "HapticPad SP5 era (2020)" },
];

// ── CONTROLLER CONFIGURATION ATTRIBUTES ──────────────────────────
export type ControllerMaterial = "plastic" | "rubberized" | "aluminum";
export type ControllerButtons = "basic" | "standard" | "tactile";
export type ControllerAnalog = "none" | "basic" | "hall_effect";
export type ControllerHaptics = "none" | "rumble" | "adaptive";
export type ControllerWireless = "wired" | "bt4" | "bt5";

export type ControllerConfig = {
  material: ControllerMaterial;
  buttons: ControllerButtons;
  analog: ControllerAnalog;
  haptics: ControllerHaptics;
  wireless: ControllerWireless;
};

export const DEFAULT_CONTROLLER_CONFIG: ControllerConfig = {
  material: "plastic",
  buttons: "basic",
  analog: "none",
  haptics: "none",
  wireless: "wired",
};

type ControllerAttributeOption<T> = {
  id: T;
  label: string;
  description: string;
  extraCostUSD: number;
  comfortBonus: number;
  qualityScore: number;
  minYear: number;
};

export const CTRL_MATERIAL_OPTIONS: ControllerAttributeOption<ControllerMaterial>[] = [
  { id: "plastic",    label: "Plástico ABS",       description: "Material padrão, leve e barato",               extraCostUSD: 0,  comfortBonus: 0,   qualityScore: 3,  minYear: 1972 },
  { id: "rubberized", label: "Plástico Borrachado", description: "Textura antiderrapante, melhor ergonomia",      extraCostUSD: 8,  comfortBonus: 1.5, qualityScore: 6,  minYear: 1985 },
  { id: "aluminum",   label: "Liga de Alumínio",    description: "Premium e durável, sensação tátil superior",    extraCostUSD: 22, comfortBonus: 2.5, qualityScore: 9,  minYear: 2000 },
];

export const CTRL_BUTTON_OPTIONS: ControllerAttributeOption<ControllerButtons>[] = [
  { id: "basic",    label: "Botões Básicos",       description: "Membrana simples, resposta mediana",             extraCostUSD: 0,  comfortBonus: 0,   qualityScore: 3,  minYear: 1972 },
  { id: "standard", label: "Botões Standard",      description: "Dome de borracha, click satisfatório",           extraCostUSD: 6,  comfortBonus: 0.8, qualityScore: 6,  minYear: 1983 },
  { id: "tactile",  label: "Botões Tácteis/Hall",  description: "Resposta mecânica precisa, sem desgaste",        extraCostUSD: 18, comfortBonus: 1.8, qualityScore: 10, minYear: 2000 },
];

export const CTRL_ANALOG_OPTIONS: ControllerAttributeOption<ControllerAnalog>[] = [
  { id: "none",        label: "Sem Analógico",          description: "Controle D-pad apenas — era cartuchos",         extraCostUSD: 0,  comfortBonus: 0,   qualityScore: 0,  minYear: 1972 },
  { id: "basic",       label: "Analógico Potenciôm.",   description: "Dual-stick potenciométrico clássico",            extraCostUSD: 12, comfortBonus: 1.2, qualityScore: 6,  minYear: 1996 },
  { id: "hall_effect", label: "Hall Effect (sem drift)", description: "Sensor magnético — precisão perfeita, sem drift",extraCostUSD: 28, comfortBonus: 2.0, qualityScore: 10, minYear: 2015 },
];

export const CTRL_HAPTICS_OPTIONS: ControllerAttributeOption<ControllerHaptics>[] = [
  { id: "none",     label: "Sem Vibração",         description: "Controle sem retorno háptico",                   extraCostUSD: 0,  comfortBonus: 0,   qualityScore: 0,  minYear: 1972 },
  { id: "rumble",   label: "Rumble Clássico",       description: "Motores de vibração — imersão básica",           extraCostUSD: 10, comfortBonus: 0.5, qualityScore: 5,  minYear: 1997 },
  { id: "adaptive", label: "Háptica Adaptativa",    description: "Resistência variável e vibração de alta fidelidade", extraCostUSD: 40, comfortBonus: 1.5, qualityScore: 10, minYear: 2020 },
];

export const CTRL_WIRELESS_OPTIONS: ControllerAttributeOption<ControllerWireless>[] = [
  { id: "wired", label: "Cabo USB",                description: "Latência zero, sem bateria para carregar",        extraCostUSD: 0,  comfortBonus: 0,   qualityScore: 4,  minYear: 1972 },
  { id: "bt4",   label: "Bluetooth 4.0",           description: "Sem fios com latência aceitável — 15h bateria",   extraCostUSD: 15, comfortBonus: 1.0, qualityScore: 7,  minYear: 2010 },
  { id: "bt5",   label: "Bluetooth 5.0 Low-Lat.",  description: "Sem fios com latência < 1ms — 25h bateria",       extraCostUSD: 25, comfortBonus: 1.5, qualityScore: 10, minYear: 2019 },
];

export function computeControllerConfigStats(cfg: ControllerConfig): {
  extraCostUSD: number;
  comfortBonus: number;
  qualityScore: number;
} {
  const mat = CTRL_MATERIAL_OPTIONS.find((o) => o.id === cfg.material)!;
  const btn = CTRL_BUTTON_OPTIONS.find((o) => o.id === cfg.buttons)!;
  const anl = CTRL_ANALOG_OPTIONS.find((o) => o.id === cfg.analog)!;
  const hpt = CTRL_HAPTICS_OPTIONS.find((o) => o.id === cfg.haptics)!;
  const wrl = CTRL_WIRELESS_OPTIONS.find((o) => o.id === cfg.wireless)!;
  const extraCostUSD = (mat?.extraCostUSD ?? 0) + (btn?.extraCostUSD ?? 0) + (anl?.extraCostUSD ?? 0) + (hpt?.extraCostUSD ?? 0) + (wrl?.extraCostUSD ?? 0);
  const comfortBonus = (mat?.comfortBonus ?? 0) + (btn?.comfortBonus ?? 0) + (anl?.comfortBonus ?? 0) + (hpt?.comfortBonus ?? 0) + (wrl?.comfortBonus ?? 0);
  const qualityScore = ((mat?.qualityScore ?? 0) + (btn?.qualityScore ?? 0) + (anl?.qualityScore ?? 0) + (hpt?.qualityScore ?? 0) + (wrl?.qualityScore ?? 0)) / 5;
  return { extraCostUSD, comfortBonus, qualityScore };
}

// ── DESIGN (legacy — kept for saved console records) ─────────────
export type DesignOption = {
  id: string;
  name: string;
  appealScore: number;
  productionComplexity: number;
  costUSD: number;
  minYear: number;
  style: string;
};

export const DESIGN_OPTIONS: DesignOption[] = [
  { id: "design_box",        name: "Caixa Simples (plástico)",  appealScore: 3,  productionComplexity: 2, costUSD: 10, minYear: 1972, style: "Vintage" },
  { id: "design_woodgrain",  name: "Acabamento Wood Grain",     appealScore: 5,  productionComplexity: 3, costUSD: 18, minYear: 1977, style: "Retro" },
  { id: "design_classic_gray",name: "Cinza Clássico",           appealScore: 6,  productionComplexity: 3, costUSD: 15, minYear: 1983, style: "Classic" },
  { id: "design_curved",     name: "Curvilíneo Ergonômico",     appealScore: 7,  productionComplexity: 5, costUSD: 25, minYear: 1994, style: "Modern" },
  { id: "design_black_gloss",name: "Preto Brilhante Premium",   appealScore: 8,  productionComplexity: 6, costUSD: 35, minYear: 2000, style: "Sleek" },
  { id: "design_transparent",name: "Corpo Transparente",        appealScore: 8,  productionComplexity: 7, costUSD: 40, minYear: 2001, style: "Futuristic" },
  { id: "design_led_rgb",    name: "RGB LED Customizável",      appealScore: 9,  productionComplexity: 8, costUSD: 60, minYear: 2013, style: "Gaming" },
  { id: "design_minimalist", name: "Minimalista Slim",          appealScore: 10, productionComplexity: 9, costUSD: 80, minYear: 2020, style: "Premium" },
];

// ── MODULAR DESIGN CONFIG SYSTEM ─────────────────────────────────
// Each of the 7 categories adds cost, appeal, rep, sales multiplier, and fan boost.
// Combined they make every console's launch profile unique.

export type CaseModel = "compact" | "standard" | "large" | "premium";
export type CaseMaterial = "plastic" | "reinforced" | "metal" | "alloy";
export type ConsoleColorStyle = "gray" | "black" | "white" | "custom" | "limited";
export type ConsoleControllerBundle = 1 | 2 | 4;
export type BundleGames = "none" | "one" | "bundle";
export type LicensedBundle = "none" | "basic" | "premium";
export type ConsoleDesignStyle = "minimalist" | "retro" | "futuristic" | "aggressive";

export type ConsoleDesignConfig = {
  caseModel: CaseModel;
  material: CaseMaterial;
  colorStyle: ConsoleColorStyle;
  controllerCount: ConsoleControllerBundle;
  bundleGames: BundleGames;
  licensedBundle: LicensedBundle;
  designStyle: ConsoleDesignStyle;
};

export const DEFAULT_CONSOLE_DESIGN_CONFIG: ConsoleDesignConfig = {
  caseModel: "standard",
  material: "plastic",
  colorStyle: "gray",
  controllerCount: 1,
  bundleGames: "none",
  licensedBundle: "none",
  designStyle: "retro",
};

type DesignConfigOption<T> = {
  id: T;
  label: string;
  description: string;
  extraCostUSD: number;
  appealBonus: number;
  repBonus: number;
  salesMult: number;
  fanBoost: number;
  minYear: number;
  icon: string;
};

export const CASE_MODEL_OPTIONS: DesignConfigOption<CaseModel>[] = [
  { id: "compact",  label: "Compacto",         description: "Pequeno e portátil, fácil de transportar e armazenar",   extraCostUSD: 0,  appealBonus: 0.5, repBonus: 0, salesMult: 1.00, fanBoost: 0,   minYear: 1972, icon: "minimize-2" },
  { id: "standard", label: "Standard",          description: "Tamanho equilibrado — boa ventilação e presença de mercado", extraCostUSD: 10, appealBonus: 1.0, repBonus: 1, salesMult: 1.05, fanBoost: 0,   minYear: 1972, icon: "monitor" },
  { id: "large",    label: "Grande / Torre",    description: "Espaço interno amplo, airflow superior — para hardcores",  extraCostUSD: 22, appealBonus: 0.8, repBonus: 2, salesMult: 1.00, fanBoost: 100, minYear: 1983, icon: "server" },
  { id: "premium",  label: "Premium Edition",   description: "Acabamento especial e presença na sala — faz parte do show", extraCostUSD: 55, appealBonus: 2.5, repBonus: 5, salesMult: 1.12, fanBoost: 200, minYear: 2000, icon: "award" },
];

export const CASE_MATERIAL_OPTIONS: DesignConfigOption<CaseMaterial>[] = [
  { id: "plastic",    label: "Plástico ABS",                 description: "Barato e leve — solução padrão da indústria",          extraCostUSD: 0,  appealBonus: 0,   repBonus: 0, salesMult: 1.00, fanBoost: 0,   minYear: 1972, icon: "box" },
  { id: "reinforced", label: "Plástico Reforçado",           description: "Mais resistente a impactos — durabilidade aprimorada",  extraCostUSD: 12, appealBonus: 0.5, repBonus: 2, salesMult: 1.03, fanBoost: 0,   minYear: 1983, icon: "shield" },
  { id: "metal",      label: "Alumínio Escovado",            description: "Look premium, dissipação térmica superior",             extraCostUSD: 40, appealBonus: 1.5, repBonus: 5, salesMult: 1.06, fanBoost: 100, minYear: 2000, icon: "tool" },
  { id: "alloy",      label: "Liga Premium (Ti/Mg)",         description: "Ultraleve e ultraresistente — prestígio máximo",        extraCostUSD: 90, appealBonus: 3.0, repBonus: 8, salesMult: 1.10, fanBoost: 300, minYear: 2015, icon: "star" },
];

export const CONSOLE_COLOR_OPTIONS: DesignConfigOption<ConsoleColorStyle>[] = [
  { id: "gray",    label: "Cinza Clássico",     description: "Neutro e atemporal — funciona em qualquer ambiente",     extraCostUSD: 0,  appealBonus: 0.0, repBonus: 0, salesMult: 1.00, fanBoost: 0,   minYear: 1972, icon: "square" },
  { id: "black",   label: "Preto Brilhante",    description: "Visual elegante e premium — domina a sala de estar",     extraCostUSD: 5,  appealBonus: 0.8, repBonus: 1, salesMult: 1.02, fanBoost: 0,   minYear: 1983, icon: "moon" },
  { id: "white",   label: "Branco / Glacial",   description: "Clean e moderno — apela a públicos mais amplos",         extraCostUSD: 5,  appealBonus: 0.8, repBonus: 1, salesMult: 1.03, fanBoost: 50,  minYear: 1990, icon: "sun" },
  { id: "custom",  label: "Cor da Marca",       description: "Cor exclusiva da empresa — reforça identidade visual",   extraCostUSD: 15, appealBonus: 1.5, repBonus: 2, salesMult: 1.05, fanBoost: 100, minYear: 1994, icon: "droplet" },
  { id: "limited", label: "Edição Limitada",    description: "Colorway especial coleccionável — mania garantida",      extraCostUSD: 30, appealBonus: 3.0, repBonus: 4, salesMult: 1.08, fanBoost: 500, minYear: 2000, icon: "zap" },
];

export const CONTROLLER_COUNT_OPTIONS: DesignConfigOption<ConsoleControllerBundle>[] = [
  { id: 1, label: "1 Controle (Base)",         description: "Custo mínimo — experiência solo",                        extraCostUSD: 0, appealBonus: 0.0, repBonus: 0, salesMult: 1.00, fanBoost: 0,   minYear: 1972, icon: "user" },
  { id: 2, label: "2 Controles (Recomendado)", description: "Multijogador imediato — padrão de mercado",              extraCostUSD: 0, appealBonus: 0.8, repBonus: 2, salesMult: 1.08, fanBoost: 150, minYear: 1976, icon: "users" },
  { id: 4, label: "4 Controles (Party)",       description: "Sessões de festa — apelo familiar e casual",             extraCostUSD: 0, appealBonus: 1.5, repBonus: 3, salesMult: 1.14, fanBoost: 400, minYear: 1990, icon: "users" },
];

export const BUNDLE_GAMES_OPTIONS: DesignConfigOption<BundleGames>[] = [
  { id: "none",   label: "Sem Jogo",              description: "Menor custo — jogador compra jogos separado",          extraCostUSD: 0,   appealBonus: 0.0, repBonus: 0, salesMult: 1.00, fanBoost: 0,    minYear: 1972, icon: "x" },
  { id: "one",    label: "1 Jogo First-Party",    description: "Título âncora exclusivo incluído — killer app",        extraCostUSD: 80,  appealBonus: 2.0, repBonus: 5, salesMult: 1.18, fanBoost: 800,  minYear: 1983, icon: "play" },
  { id: "bundle", label: "Bundle 2+ Jogos",       description: "Pacote irresistível — máximo appeal no lançamento",   extraCostUSD: 150, appealBonus: 3.0, repBonus: 8, salesMult: 1.30, fanBoost: 1500, minYear: 1990, icon: "package" },
];

export const LICENSE_BUNDLE_OPTIONS: DesignConfigOption<LicensedBundle>[] = [
  { id: "none",    label: "Sem Licença",                description: "Sem acordos externos — custo zero",                  extraCostUSD: 0,   appealBonus: 0.0, repBonus: 0,  salesMult: 1.00, fanBoost: 0,    minYear: 1972, icon: "x" },
  { id: "basic",   label: "Licença Básica (1 parceiro)",description: "Parceria com estúdio terceiro — título extra",       extraCostUSD: 120, appealBonus: 1.5, repBonus: 4,  salesMult: 1.10, fanBoost: 500,  minYear: 1988, icon: "link" },
  { id: "premium", label: "Licença Premium (2+ AAA)",   description: "Parceria com múltiplos estúdios AAA — evento mundial",extraCostUSD: 280, appealBonus: 3.5, repBonus: 10, salesMult: 1.22, fanBoost: 1200, minYear: 2000, icon: "star" },
];

export const DESIGN_STYLE_OPTIONS: DesignConfigOption<ConsoleDesignStyle>[] = [
  { id: "minimalist", label: "Minimalista",          description: "Clean, sem excessos — apela ao público adulto e mainstream",  extraCostUSD: 0,  appealBonus: 1.0, repBonus: 3, salesMult: 1.02, fanBoost: 0,   minYear: 1994, icon: "minus-circle" },
  { id: "retro",      label: "Retrô / Nostálgico",   description: "Inspirado em eras passadas — fanbase fiel e nostálgica",       extraCostUSD: 15, appealBonus: 1.5, repBonus: 2, salesMult: 1.05, fanBoost: 300, minYear: 1972, icon: "clock" },
  { id: "futuristic", label: "Futurista",             description: "Linhas agressivas e sci-fi — apelo ao público tech",          extraCostUSD: 25, appealBonus: 2.0, repBonus: 4, salesMult: 1.08, fanBoost: 200, minYear: 2001, icon: "zap" },
  { id: "aggressive", label: "Gamer Agressivo",       description: "RGB, ângulos extremos — domina o nicho hardcore",             extraCostUSD: 40, appealBonus: 2.5, repBonus: 2, salesMult: 1.12, fanBoost: 600, minYear: 2010, icon: "crosshair" },
];

export type DesignConfigStats = {
  extraCostUSD: number;
  extraCtrlCostUSD: number;
  appealBonus: number;
  repBonus: number;
  salesMult: number;
  fanBoost: number;
};

export function computeDesignConfigStats(
  cfg: ConsoleDesignConfig,
  controllerUnitCostUSD: number = 0
): DesignConfigStats {
  const cm  = CASE_MODEL_OPTIONS.find((o) => o.id === cfg.caseModel)      ?? CASE_MODEL_OPTIONS[1];
  const mat = CASE_MATERIAL_OPTIONS.find((o) => o.id === cfg.material)    ?? CASE_MATERIAL_OPTIONS[0];
  const col = CONSOLE_COLOR_OPTIONS.find((o) => o.id === cfg.colorStyle)  ?? CONSOLE_COLOR_OPTIONS[0];
  const cc  = CONTROLLER_COUNT_OPTIONS.find((o) => o.id === cfg.controllerCount) ?? CONTROLLER_COUNT_OPTIONS[0];
  const bg  = BUNDLE_GAMES_OPTIONS.find((o) => o.id === cfg.bundleGames)  ?? BUNDLE_GAMES_OPTIONS[0];
  const lb  = LICENSE_BUNDLE_OPTIONS.find((o) => o.id === cfg.licensedBundle) ?? LICENSE_BUNDLE_OPTIONS[0];
  const ds  = DESIGN_STYLE_OPTIONS.find((o) => o.id === cfg.designStyle)  ?? DESIGN_STYLE_OPTIONS[0];

  // Extra controller units: controller count adds (count-1) additional controller units
  const extraCtrlCostUSD = ((cfg.controllerCount ?? 1) - 1) * controllerUnitCostUSD;

  const extraCostUSD =
    cm.extraCostUSD + mat.extraCostUSD + col.extraCostUSD +
    bg.extraCostUSD + lb.extraCostUSD + ds.extraCostUSD;

  const appealBonus =
    cm.appealBonus + mat.appealBonus + col.appealBonus +
    cc.appealBonus + bg.appealBonus + lb.appealBonus + ds.appealBonus;

  const repBonus =
    cm.repBonus + mat.repBonus + col.repBonus +
    cc.repBonus + bg.repBonus + lb.repBonus + ds.repBonus;

  const salesMult =
    cm.salesMult * mat.salesMult * col.salesMult *
    cc.salesMult * bg.salesMult * lb.salesMult * ds.salesMult;

  const fanBoost =
    cm.fanBoost + mat.fanBoost + col.fanBoost +
    cc.fanBoost + bg.fanBoost + lb.fanBoost + ds.fanBoost;

  return { extraCostUSD, extraCtrlCostUSD, appealBonus, repBonus, salesMult, fanBoost };
}

// ── CONNECTIVITY ─────────────────────────────────────────────────
export type ConnectivityOption = {
  id: string;
  name: string;
  hasLAN: boolean;
  hasWiFi: boolean;
  hasBluetooth: boolean;
  hasOnlineServices: boolean;
  hasCloudSave: boolean;
  has5G: boolean;
  onlineMultiplierBonus: number;
  costUSD: number;
  minYear: number;
  historicalRef: string;
};

export const CONNECTIVITY_OPTIONS: ConnectivityOption[] = [
  { id: "conn_none",         name: "Sem Conectividade",            hasLAN: false, hasWiFi: false, hasBluetooth: false, hasOnlineServices: false, hasCloudSave: false, has5G: false, onlineMultiplierBonus: 0,    costUSD: 0,   minYear: 1972, historicalRef: "Consoles pré-internet" },
  { id: "conn_lan",          name: "LAN (Ethernet 10Mbps)",        hasLAN: true,  hasWiFi: false, hasBluetooth: false, hasOnlineServices: false, hasCloudSave: false, has5G: false, onlineMultiplierBonus: 0.1,  costUSD: 12,  minYear: 1995, historicalRef: "NetYaroze / Senga NovaCast (1998)" },
  { id: "conn_online_basic", name: "Online Básico (dial-up)",      hasLAN: true,  hasWiFi: false, hasBluetooth: false, hasOnlineServices: true,  hasCloudSave: false, has5G: false, onlineMultiplierBonus: 0.2,  costUSD: 20,  minYear: 1999, historicalRef: "NovaCast NetConnect (1999)" },
  { id: "conn_lan_wifi",     name: "LAN + Wi-Fi 802.11b",          hasLAN: true,  hasWiFi: true,  hasBluetooth: false, hasOnlineServices: true,  hasCloudSave: false, has5G: false, onlineMultiplierBonus: 0.35, costUSD: 35,  minYear: 2002, historicalRef: "GamePlex / XStation Live (2002)" },
  { id: "conn_wifi_bt",      name: "Wi-Fi + Bluetooth",            hasLAN: true,  hasWiFi: true,  hasBluetooth: true,  hasOnlineServices: true,  hasCloudSave: false, has5G: false, onlineMultiplierBonus: 0.5,  costUSD: 50,  minYear: 2006, historicalRef: "Wiivo / SP3 / XStation 360 (2006)" },
  { id: "conn_full_cloud",   name: "Wi-Fi + Cloud Save + Online",  hasLAN: true,  hasWiFi: true,  hasBluetooth: true,  hasOnlineServices: true,  hasCloudSave: true,  has5G: false, onlineMultiplierBonus: 0.7,  costUSD: 70,  minYear: 2013, historicalRef: "SP4 SPN / XStation One Live (2013)" },
  { id: "conn_5g_cloud",     name: "5G + Cloud Gaming + IA",       hasLAN: true,  hasWiFi: true,  hasBluetooth: true,  hasOnlineServices: true,  hasCloudSave: true,  has5G: true,  onlineMultiplierBonus: 1.0,  costUSD: 110, minYear: 2023, historicalRef: "Next-gen 5G cloud gaming" },
];

// ── POWER UNIT ───────────────────────────────────────────────────
export type PowerUnit = {
  id: string;
  name: string;
  maxWatts: number;
  efficiency: number;
  formFactor: "internal" | "external" | "usb-c";
  costUSD: number;
  minYear: number;
  historicalRef: string;
  isEmergency?: boolean;
  qualityPenalty?: number;
};

export const POWER_UNITS: PowerUnit[] = [
  // ── 1970s era ────────────────────────────────────────────────────
  { id: "pwr_5w",            name: "Fonte 5W (adaptador simples)", maxWatts: 5,    efficiency: 0.65, formFactor: "external", costUSD: 5,   minYear: 1972, historicalRef: "Consoles Atrion era — hardware de baixíssimo consumo" },
  { id: "pwr_10w",           name: "Fonte 10W",                    maxWatts: 10,   efficiency: 0.68, formFactor: "external", costUSD: 8,   minYear: 1972, historicalRef: "Consoles simples década de 70" },
  // ── 1980s era ────────────────────────────────────────────────────
  { id: "pwr_20w",           name: "Fonte 20W",                    maxWatts: 20,   efficiency: 0.72, formFactor: "internal", costUSD: 12,  minYear: 1978, historicalRef: "Atrion / Intellix era (1978–1982)" },
  { id: "pwr_30w",           name: "Fonte 30W",                    maxWatts: 30,   efficiency: 0.75, formFactor: "internal", costUSD: 15,  minYear: 1983, historicalRef: "NFX / MegaDrive" },
  // ── 1990s era ────────────────────────────────────────────────────
  { id: "pwr_50w",           name: "Fonte 50W",                    maxWatts: 50,   efficiency: 0.77, formFactor: "internal", costUSD: 18,  minYear: 1990, historicalRef: "Super NFX / Game Pal era (1990–1993)" },
  { id: "pwr_100w",          name: "Fonte 100W",                   maxWatts: 100,  efficiency: 0.78, formFactor: "internal", costUSD: 22,  minYear: 1994, historicalRef: "StarPlay 1 / GenexaStar era (1994)" },
  // ── 2000s era ────────────────────────────────────────────────────
  { id: "pwr_200w",          name: "Fonte 200W Eficiente",         maxWatts: 200,  efficiency: 0.82, formFactor: "internal", costUSD: 32,  minYear: 2001, historicalRef: "GamePlex / XStation (2001)" },
  { id: "pwr_380w",          name: "Fonte 380W (SP3/XSt360)",      maxWatts: 380,  efficiency: 0.84, formFactor: "internal", costUSD: 58,  minYear: 2005, historicalRef: "SP3 (380W) / XStation 360 (203W)" },
  // ── 2010s+ era ───────────────────────────────────────────────────
  { id: "pwr_350w_efficient",name: "Fonte 350W 80 Plus Gold",      maxWatts: 350,  efficiency: 0.90, formFactor: "internal", costUSD: 48,  minYear: 2013, historicalRef: "SP4 / XStation One (2013)" },
  { id: "pwr_usbc_65w",      name: "USB-C 65W GaN",                maxWatts: 65,   efficiency: 0.96, formFactor: "usb-c",    costUSD: 28,  minYear: 2019, historicalRef: "Nintaro Flex / era portátil híbrida (2019+)" },
  // ── Future ───────────────────────────────────────────────────────
  { id: "pwr_1000w_modular", name: "Fonte Modular 1000W",          maxWatts: 1000, efficiency: 0.94, formFactor: "internal", costUSD: 155, minYear: 2030, historicalRef: "Next-gen high-TDP systems" },
  // ── Emergency fallback (always available — guarantees buildability) ──
  { id: "pwr_emergency",     name: "Fonte Emergência (25W)",       maxWatts: 25,   efficiency: 0.58, formFactor: "external", costUSD: 45,  minYear: 1972, historicalRef: "Fonte de contingência — alto custo, baixa eficiência", isEmergency: true, qualityPenalty: 5 },
];

// ── AUDIO CHIP ────────────────────────────────────────────────────
export type AudioChipOption = {
  id: string;
  name: string;
  channels: number;
  bitDepth: number;
  performanceScore: number;
  costUSD: number;
  minYear: number;
  historicalRef: string;
};

export const AUDIO_CHIP_OPTIONS: AudioChipOption[] = [
  { id: "audio_beeper",     name: "Beeper Mono (1 canal)",       channels: 1, bitDepth: 1,  performanceScore: 5,   costUSD: 0,  minYear: 1972, historicalRef: "NFX / Atrion era — beeps icónicos" },
  { id: "audio_psg_stereo", name: "PSG Estéreo 4 canais",        channels: 4, bitDepth: 8,  performanceScore: 22,  costUSD: 15, minYear: 1980, historicalRef: "MegaDrive / Game Pal PSG (1980+)" },
  { id: "audio_pcm_stereo", name: "PCM Estéreo 16-bit",          channels: 8, bitDepth: 16, performanceScore: 52,  costUSD: 35, minYear: 1994, historicalRef: "StarPlay 1 / Saturn SPU era (1994)" },
  { id: "audio_dolby_51",   name: "Dolby Digital 5.1 Surround",  channels: 6, bitDepth: 24, performanceScore: 78,  costUSD: 60, minYear: 2001, historicalRef: "GamePlex / XStation era (2001)" },
  { id: "audio_atmos_71",   name: "Dolby Atmos 7.1 + 3D Audio", channels: 8, bitDepth: 32, performanceScore: 100, costUSD: 95, minYear: 2020, historicalRef: "SP5 / XStation Spectrum era (2020)" },
];

// ── RESEARCH → COMPONENT UNLOCK MAP ──────────────────────────────
// Maps research node ID → component IDs it unlocks in the console builder.
// Components NOT listed here require only the year gate (no research needed).
export const RESEARCH_UNLOCK_MAP: Record<string, string[]> = {
  sil_A2: ["cpu_68000"],
  sil_A3: ["cpu_mips_r3000", "cpu_ppc_gecko", "cpu_cell", "cpu_x86_quad", "cpu_zen2", "cpu_arm_a78"],
  sil_B1: ["gpu_vdp1", "gpu_sgfx"],
  sil_B2: ["gpu_rcp_rdp", "gpu_gte_gpu", "gpu_geforce3", "gpu_rsx", "gpu_gcn_polaris"],
  sil_B3: ["gpu_rdna2"],
  sil_C1: ["stor_cart_16mb", "stor_cart_64mb"],
  sil_C2: ["stor_cd", "stor_dvd", "stor_hdd_8gb"],
  sil_C3: ["stor_bluray", "stor_ssd_256gb", "stor_nvme_1tb"],
  online_A1: ["conn_lan"],
  online_A2: ["conn_online_basic", "conn_lan_wifi"],
  online_A3: ["conn_wifi_bt", "conn_full_cloud", "conn_5g_cloud"],
  audio_A1: ["audio_psg_stereo"],
  audio_A2: ["audio_pcm_stereo"],
  audio_A3: ["audio_dolby_51", "audio_atmos_71"],
};

const COMPONENT_REQUIRES_RESEARCH: Record<string, string> = Object.entries(RESEARCH_UNLOCK_MAP)
  .flatMap(([nodeId, compIds]) => compIds.map((c): [string, string] => [c, nodeId]))
  .reduce<Record<string, string>>((acc, [c, n]) => { acc[c] = n; return acc; }, {});

/** Returns the set of component IDs unlocked by the given researched nodes. */
export function getResearchUnlockedIds(researchedNodes: string[]): Set<string> {
  const unlocked = new Set<string>();
  for (const nodeId of researchedNodes) {
    const comps = RESEARCH_UNLOCK_MAP[nodeId];
    if (comps) comps.forEach((c) => unlocked.add(c));
  }
  return unlocked;
}

/** Returns true if the component is available (no research gate, or research completed). */
export function isComponentAvailable(componentId: string, unlockedIds: Set<string>): boolean {
  const required = COMPONENT_REQUIRES_RESEARCH[componentId];
  if (!required) return true;
  return unlockedIds.has(componentId);
}

/** Returns the research node ID that unlocks a component, or null if no research is required. */
export function getComponentResearchRequirement(componentId: string): string | null {
  return COMPONENT_REQUIRES_RESEARCH[componentId] ?? null;
}

// ── COMPONENT VALIDATION ─────────────────────────────────────────
export type ConsoleComponentSpec = {
  cpuId: string;
  gpuId: string;
  memoryId: string;
  storageId: string;
  coolingId: string;
  controllerId: string;
  controllerConfig?: ControllerConfig;
  designId: string;
  designConfig?: ConsoleDesignConfig;
  connectivityId: string;
  powerUnitId: string;
  audioChipId?: string;
};

export type ComponentValidationResult = {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  thermalOK: boolean;
  powerOK: boolean;
  totalCostUSD: number;
  performanceScore: number;
  failureRiskPerYear: number;
  appealScore: number;
  onlineBonusMult: number;
  designSalesMult: number;
  designRepBonus: number;
  designFanBoost: number;
  designExtraCostUSD: number;
  qualityPenalty: number;
};

export function validateConsoleComponents(
  spec: ConsoleComponentSpec,
  currentYear: number,
  researchedNodes?: string[]
): ComponentValidationResult {
  const cpu         = CPU_OPTIONS.find((c) => c.id === spec.cpuId);
  const gpu         = GPU_OPTIONS.find((g) => g.id === spec.gpuId);
  const memory      = MEMORY_COMPONENTS.find((m) => m.id === spec.memoryId);
  const storage     = STORAGE_OPTIONS.find((s) => s.id === spec.storageId);
  const cooling     = COOLING_OPTIONS.find((c) => c.id === spec.coolingId);
  const controller  = CONTROLLER_OPTIONS.find((c) => c.id === spec.controllerId);
  const design      = DESIGN_OPTIONS.find((d) => d.id === spec.designId);
  const connectivity= CONNECTIVITY_OPTIONS.find((c) => c.id === spec.connectivityId);
  const power       = POWER_UNITS.find((p) => p.id === spec.powerUnitId);
  const audioChip   = AUDIO_CHIP_OPTIONS.find((a) => a.id === (spec.audioChipId ?? "audio_beeper"))
                      ?? AUDIO_CHIP_OPTIONS[0];

  if (!cpu || !gpu || !memory || !storage || !cooling || !controller || !design || !connectivity || !power) {
    return {
      isValid: false, warnings: [], errors: ["Componentes inválidos"],
      thermalOK: false, powerOK: false, totalCostUSD: 0,
      performanceScore: 0, failureRiskPerYear: 1, appealScore: 0, onlineBonusMult: 0,
      designSalesMult: 1, designRepBonus: 0, designFanBoost: 0, designExtraCostUSD: 0,
      qualityPenalty: 0,
    };
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  if (researchedNodes) {
    const unlockedIds = getResearchUnlockedIds(researchedNodes);
    const researchChecks: Array<{ id: string; name: string }> = [
      { id: cpu.id,          name: cpu.name },
      { id: gpu.id,          name: gpu.name },
      { id: storage.id,      name: storage.name },
      { id: connectivity.id, name: connectivity.name },
      { id: audioChip.id,    name: audioChip.name },
    ];
    researchChecks.forEach(({ id, name }) => {
      if (!isComponentAvailable(id, unlockedIds)) {
        const required = getComponentResearchRequirement(id);
        errors.push(`${name} requer pesquisa: ${required}`);
      }
    });
  }

  const components = [cpu, gpu, memory, storage, cooling, controller, design, connectivity, power];
  components.forEach((comp) => {
    if (comp.minYear > currentYear) {
      errors.push(`${(comp as any).name} requer ano ${comp.minYear} (atual: ${currentYear})`);
    }
  });

  const totalTDP = cpu.tdpWatts + gpu.tdpWatts;
  const thermalOK = cooling.maxTDP >= totalTDP;
  if (!thermalOK) {
    warnings.push(`Resfriamento insuficiente! CPU+GPU: ${totalTDP}W, sistema suporta: ${cooling.maxTDP}W`);
  }

  // Progressive formula: 1.3× TDP + 5W system overhead (early-era friendly, no artificial 20W floor)
  const requiredWatts = totalTDP * 1.3 + 5;
  const powerOK = power.maxWatts >= requiredWatts;
  if (!powerOK) {
    warnings.push(`Fonte insuficiente! Sistema precisa ≥${Math.round(requiredWatts)}W, fonte: ${power.maxWatts}W`);
  }
  if (power.isEmergency) {
    warnings.push(`Fonte de emergência — eficiência baixa (${Math.round(power.efficiency * 100)}%). Qualidade do hardware reduzida em ${power.qualityPenalty ?? 5} pts.`);
  }

  const coolingRatio = thermalOK ? cooling.maxTDP / Math.max(1, totalTDP) : 0.5;
  const thermalFailureRisk = thermalOK
    ? cooling.failureRisk / Math.min(coolingRatio, 2)
    : cooling.failureRisk * 2;

  const ctrlCfg   = spec.controllerConfig ?? DEFAULT_CONTROLLER_CONFIG;
  const ctrlStats = computeControllerConfigStats(ctrlCfg);
  const effectiveComfort = Math.min(10, controller.comfortScore + ctrlStats.comfortBonus);

  // Design config stats
  const designCfg = spec.designConfig ?? DEFAULT_CONSOLE_DESIGN_CONFIG;
  const designStats = computeDesignConfigStats(designCfg, controller.costUSD + ctrlStats.extraCostUSD);

  // ── Validate design config era gates ──────────────────────────
  const DESIGN_ERA_GATES: Partial<Record<CaseMaterial | ConsoleColorStyle | ConsoleDesignStyle | BundleGames | LicensedBundle, number>> = {
    metal: 2000, alloy: 2015, limited: 2000, custom: 1994, futuristic: 2001, aggressive: 2010,
    one: 1983, bundle: 1990, basic: 1988, premium: 2000,
  };
  Object.entries(designCfg).forEach(([key, val]) => {
    const gate = DESIGN_ERA_GATES[val as keyof typeof DESIGN_ERA_GATES];
    if (gate && gate > currentYear) {
      warnings.push(`Opção de design "${val}" disponível a partir de ${gate}`);
    }
  });

  // Total cost: base components + audio chip + controller config upgrades + design config extras
  const baseCost = components.reduce((sum, c) => sum + (c as any).costUSD, 0);
  const totalCostUSD = baseCost + audioChip.costUSD + ctrlStats.extraCostUSD + designStats.extraCostUSD + designStats.extraCtrlCostUSD;

  const perf =
    (cpu.performanceScore * 0.30) +
    (gpu.performanceScore * 0.35) +
    (Math.min(100, (memory.capacityMB / 16384) * 100) * 0.15) +
    (Math.min(100, (storage.speedMBs / 5500) * 100) * 0.10) +
    (effectiveComfort * 10 * 0.10);

  const ctrlAppealBonus = (ctrlStats.qualityScore / 10) * 1.5;
  const baseAppeal = (design.appealScore * 4 + effectiveComfort * 3 + ctrlAppealBonus + (connectivity.hasOnlineServices ? 1.5 : 0)) / 10;
  const finalAppeal = Math.min(10, baseAppeal + designStats.appealBonus * 0.3);

  const qualityPenalty = power.isEmergency ? (power.qualityPenalty ?? 5) : 0;
  const adjustedPerf = Math.max(0, Math.round(perf) - qualityPenalty);

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
    thermalOK,
    powerOK,
    totalCostUSD,
    performanceScore: adjustedPerf,
    failureRiskPerYear: Math.min(0.5, thermalFailureRisk),
    appealScore: Math.round(finalAppeal * 10) / 10,
    onlineBonusMult: connectivity.onlineMultiplierBonus,
    designSalesMult: designStats.salesMult,
    designRepBonus: designStats.repBonus,
    designFanBoost: designStats.fanBoost,
    designExtraCostUSD: designStats.extraCostUSD + designStats.extraCtrlCostUSD,
    qualityPenalty,
  };
}

// ─────────────────────────────────────────────────────────────────
// CONSOLE CATEGORY & ERA-BASED PRICING SYSTEM
// ─────────────────────────────────────────────────────────────────

export type ConsoleCategory = "standard" | "premium" | "collector";

export type ConsolePriceEra = {
  fromYear: number;
  idealMin: number;
  idealMax: number;
  maxAllowed: number;
};

export type ConsoleCategoryPricing = {
  id: ConsoleCategory;
  label: string;
  description: string;
  icon: string;
  color: string;
  salesVolumeMult: number;
  reputationBonus: number;
  eras: ConsolePriceEra[];
};

export const CONSOLE_CATEGORY_PRICING: ConsoleCategoryPricing[] = [
  {
    id: "standard",
    label: "Console Padrão",
    description: "Produto de massa. Maior volume de vendas, margem menor. Estratégia mais segura.",
    icon: "monitor",
    color: "#4DA6FF",
    salesVolumeMult: 1.0,
    reputationBonus: 0,
    eras: [
      { fromYear: 1972, idealMin: 80,  idealMax: 250, maxAllowed: 300 },
      { fromYear: 1980, idealMin: 100, idealMax: 300, maxAllowed: 400 },
      { fromYear: 1990, idealMin: 150, idealMax: 400, maxAllowed: 500 },
      { fromYear: 2000, idealMin: 180, idealMax: 500, maxAllowed: 600 },
      { fromYear: 2010, idealMin: 200, idealMax: 600, maxAllowed: 700 },
      { fromYear: 2020, idealMin: 250, idealMax: 700, maxAllowed: 800 },
    ],
  },
  {
    id: "premium",
    label: "Console Premium",
    description: "Hardware avançado e branding forte. Menor volume, maior margem. Risco/recompensa equilibrado.",
    icon: "star",
    color: "#A855F7",
    salesVolumeMult: 0.55,
    reputationBonus: 3,
    eras: [
      { fromYear: 1972, idealMin: 200, idealMax: 400,  maxAllowed: 500  },
      { fromYear: 1980, idealMin: 250, idealMax: 500,  maxAllowed: 600  },
      { fromYear: 1990, idealMin: 300, idealMax: 700,  maxAllowed: 800  },
      { fromYear: 2000, idealMin: 400, idealMax: 900,  maxAllowed: 1000 },
      { fromYear: 2010, idealMin: 500, idealMax: 1100, maxAllowed: 1200 },
      { fromYear: 2020, idealMin: 600, idealMax: 1300, maxAllowed: 1500 },
    ],
  },
  {
    id: "collector",
    label: "Edição Colecionador",
    description: "Luxo e raridade. Vendas muito baixas, mas enorme prestígio e lucro por unidade.",
    icon: "award",
    color: "#F5A623",
    salesVolumeMult: 0.08,
    reputationBonus: 7,
    eras: [
      { fromYear: 1972, idealMin: 300,  idealMax: 800,  maxAllowed: 1000 },
      { fromYear: 1980, idealMin: 400,  idealMax: 1000, maxAllowed: 1200 },
      { fromYear: 1990, idealMin: 500,  idealMax: 1500, maxAllowed: 2000 },
      { fromYear: 2000, idealMin: 700,  idealMax: 2000, maxAllowed: 2500 },
      { fromYear: 2010, idealMin: 900,  idealMax: 3000, maxAllowed: 4000 },
      { fromYear: 2020, idealMin: 1200, idealMax: 4000, maxAllowed: 5000 },
    ],
  },
];

export function getConsoleCategoryById(id: ConsoleCategory): ConsoleCategoryPricing {
  return CONSOLE_CATEGORY_PRICING.find((c) => c.id === id) ?? CONSOLE_CATEGORY_PRICING[0];
}

export function getConsolePriceEra(category: ConsoleCategory, year: number): ConsolePriceEra {
  const cat = getConsoleCategoryById(category);
  const sorted = [...cat.eras].sort((a, b) => b.fromYear - a.fromYear);
  return sorted.find((e) => year >= e.fromYear) ?? cat.eras[0];
}

export type ConsolePriceFeedback = {
  status: "ideal" | "above_ideal" | "risky" | "invalid";
  label: string;
  color: string;
  demandMult: number;
};

export function getConsolePriceFeedback(
  price: number,
  category: ConsoleCategory,
  year: number
): ConsolePriceFeedback {
  const era = getConsolePriceEra(category, year);
  if (price > era.maxAllowed) {
    return { status: "invalid", label: "Preço inviável — lançamento bloqueado", color: "#EF4444", demandMult: 0 };
  }
  if (price > era.idealMax) {
    const excess = (price - era.idealMax) / (era.maxAllowed - era.idealMax);
    if (excess > 0.5) {
      return { status: "risky", label: "Preço muito acima do mercado — demanda muito baixa", color: "#F5A623", demandMult: 0.30 };
    }
    return { status: "above_ideal", label: "Preço acima do esperado — demanda reduzida", color: "#F5A623", demandMult: 0.65 };
  }
  if (price < era.idealMin) {
    return { status: "above_ideal", label: "Preço abaixo da faixa — margem muito baixa", color: "#F5A623", demandMult: 1.1 };
  }
  return { status: "ideal", label: "Preço excelente para esta era", color: "#10B981", demandMult: 1.0 };
}

export function getDefaultComponents(year: number): ConsoleComponentSpec {
  const getLatest = <T extends { minYear: number }>(opts: T[]): T =>
    opts.filter((o) => o.minYear <= year).slice(-1)[0] ?? opts[0];

  return {
    cpuId: getLatest(CPU_OPTIONS).id,
    gpuId: getLatest(GPU_OPTIONS).id,
    memoryId: getLatest(MEMORY_COMPONENTS).id,
    storageId: getLatest(STORAGE_OPTIONS).id,
    coolingId: getLatest(COOLING_OPTIONS).id,
    controllerId: getLatest(CONTROLLER_OPTIONS).id,
    designId: getLatest(DESIGN_OPTIONS).id,
    designConfig: { ...DEFAULT_CONSOLE_DESIGN_CONFIG },
    connectivityId: getLatest(CONNECTIVITY_OPTIONS).id,
    powerUnitId: getLatest(POWER_UNITS).id,
    audioChipId: getLatest(AUDIO_CHIP_OPTIONS).id,
  };
}
