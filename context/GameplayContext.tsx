import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  PlayerAttackType, PLAYER_ATTACKS, PLAYER_ATTACK_OUTCOMES,
  computePlayerAttackScore, rollPlayerAttackOutcome, PendingCounterAttack,
} from "@/constants/playerAttacks";
import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { getCharacterById } from "@/constants/characters";
import {
  ActiveGameState,
  GameConsole,
  MarketingTier,
  OfficeType,
  advanceMonth,
  createInitialGameState,
  MonthSummary,
  OFFICE_MAX_LEVEL,
  MARKETING_COSTS,
  MARKETING_DURATION,
  calculateConsoleRating,
  Employee,
  EmployeeType,
  EmployeeLevel,
  EMPLOYEE_HIRE_COST,
  generateEmployee,
  getRetrainCost,
  GameProject,
  BUG_FIX_COST,
  BUG_FIX_MONTHS,
  BugLevel,
  POST_LAUNCH_ACTIONS,
  PostLaunchActionType,
  computePostLaunchCost,
  LegalTierId,
  LegalContract,
  LEGAL_CONTRACT_DURATIONS,
  LEGAL_CONTRACT_MONTHLY_COST,
  ActiveStrategyOption,
  StrategyCategory,
  STRATEGY_OPTION_DURATION_MONTHS,
  RescueDealType,
  RescueOfferState,
  ActiveRescueContract,
  BankRescueContract,
  InvestorEquityRescueContract,
  InvestorRevenueRescueContract,
} from "@/constants/gameEngine";
import {
  ALL_SCANDALS,
  INFLUENCER_PROFILES,
  getInfluencerCooldownLeft,
} from "@/constants/scandals";
import type { InfluencerType, HiredInfluencer } from "@/constants/scandals";
import {
  getOfficeUpgradeCost,
  getMaxAvailableUpgrade,
  ALL_OFFICE_SECTORS,
} from "@/constants/officeSystem";
import { getNodeById, getChosenPathForCategory } from "@/constants/strategyTree";
import { RESEARCH_COMBOS, getComboTime } from "@/constants/researchCombos";
import { EXCLUSIVE_TECHS, checkExclusiveAvailable } from "@/constants/exclusiveTech";
import { computeSpecialization, getSpecLevel } from "@/constants/specialization";
import { ERA_UPGRADES, getControlledUnlocks } from "@/constants/eraUpgrades";
import { formatMoney, getCostMultiplier, getHireCostInflation, safeN } from "@/constants/gameEconomics";
import {
  getCountryById,
  getUnlockCost,
  getBranchCost,
  getBranchMonthlyMaintenance,
  CountryBranch,
  BranchType,
  StoreExpansionTier,
  getStoreExpansionCost,
} from "@/constants/globalMarket";
import { LOAN_TYPES, createLoan, calculateInterestRate, ActiveLoan } from "@/constants/finances";
import type { ShadowDealType, ShadowInvestorState } from "@/constants/gameEngine";
import { computeRivalMarketValue } from "@/constants/gameEngine";
import { computeConsoleReception, ConsoleReceptionResult } from "@/constants/gameReception";
import { validateConsoleComponents } from "@/constants/consoleComponents";
import {
  Investor, InvestorOffer, Acquisition,
  StockListing, StockBid,
  TOTAL_SHARES, ACQUIRABLE_COMPANIES,
  getBuybackPremium,
  detectInvestorConflicts, getMaxConflictLevel, getConflictNegotiationCost,
  computeAcquisitionResaleInfo,
} from "@/constants/stockMarket";
import { SaveSlot, useGame } from "./GameContext";

const GAMEPLAY_KEY = (id: string) => `@tycoon_gameplay_${id}`;

type GameplayContextType = {
  state: ActiveGameState | null;
  loadGame: (save: SaveSlot) => Promise<void>;
  unloadGame: () => void;
  advanceTime: () => MonthSummary | null;
  buildConsole: (spec: Omit<GameConsole, "id" | "unitsSold" | "totalRevenue" | "rating" | "popularity" | "isDiscontinued" | "launchYear" | "launchMonth" | "starRating" | "receptionScore" | "receptionComment" | "receptionSentiment">) => { error: string | null; reception?: ConsoleReceptionResult };
  discontinueConsole: (id: string) => void;
  cancelConsoleDev: (id: string) => void;
  upgradeOffice: (type: OfficeType) => boolean;
  launchMarketing: (tier: MarketingTier) => boolean;
  markNewsRead: (id: string) => void;
  deleteNews: (id: string) => void;
  deleteReadNews: () => void;
  deleteAllNews: () => void;
  respondToAttack: (newsId: string, choice: "revidar" | "ignorar") => string | null;
  respondToScandal: (scandalId: string, optionId: string) => string | null;
  hireInfluencer: (profileId: InfluencerType, gameProjectId?: string) => string | null;
  pendingScandal: import("@/constants/scandals").ScandalDef | null;
  saveGame: () => Promise<void>;
  hireEmployee: (type: EmployeeType, level: EmployeeLevel) => string | null;
  fireEmployee: (id: string) => void;
  retrainEmployee: (id: string) => string | null;
  startResearch: (nodeId: string) => string | null;
  unlockEraUpgrade: (id: string) => string | null;
  startGameProject: (project: Omit<GameProject, "id" | "monthsElapsed" | "phase" | "monthlyRevenue" | "totalRevenue" | "launchYear" | "launchMonth">) => string | null;
  cancelGameProject: (id: string) => void;
  fixBugs: (gameId: string) => string | null;
  startHypeCampaign: (projectId: string) => string | null;
  postLaunchAction: (projectId: string, actionType: PostLaunchActionType) => string | null;
  startScoreRecovery: (gameId: string, tier: "light" | "medium" | "strong") => string | null;
  releaseDLC: (gameId: string) => string | null;
  stopSupport: (gameId: string) => string | null;
  optimizeGame: (gameId: string) => string | null;
  executePlayerAttack: (rivalId: string, attackType: PlayerAttackType) => { error: string | null; outcomeLabel: string | null; outcomeColor: string | null };
  // Global market
  unlockCountry: (countryId: string) => string | null;
  openBranch: (countryId: string, type: BranchType) => string | null;
  closeBranch: (countryId: string) => void;
  expandStores: (countryId: string, tier: StoreExpansionTier) => string | null;
  // Financial
  takeLoan: (loanTypeId: string, amount: number) => string | null;
  // Stock market & acquisitions
  sellShares: (percent: number) => string | null;
  buyBackShares: (percent: number) => string | null;
  acceptOffer: (offerId: string) => string | null;
  rejectOffer: (offerId: string) => void;
  createStockListing: (percent: number, minAskPerShare: number) => string | null;
  cancelStockListing: (listingId: string) => void;
  acceptStockBid: (listingId: string, bidId: string) => string | null;
  rejectStockBid: (listingId: string, bidId: string) => void;
  buyAcquisition: (acquisitionId: string) => string | null;
  sellAcquisition: (acquisitionId: string) => void;
  acquireRival: (rivalId: string) => { success: boolean; error?: string };
  investInSponsorship: (opportunityId: string, amount: number) => { success: boolean; profit: number; message: string };
  // Shadow Investor
  pendingShadowOffer: boolean;
  pendingShadowCollection: { title: string; amount: number } | null;
  respondToShadowInvestor: (accept: boolean, dealType?: ShadowDealType) => void;
  dismissShadowCollection: () => void;
  // Shareholder meeting
  shareholderMeetingDecision: (decision: "dividends" | "reinvest" | "promise") => string | null;
  // Geopolitical conflict negotiation
  negotiateGeoConflict: () => string | null;
  // Local Holdings
  buyLocalHolding: (id: string, price: number) => string | null;
  sellLocalHolding: (id: string) => void;
  // Legal Contract
  hireLegalContract: (tierId: LegalTierId) => string | null;
  cancelLegalContract: () => void;
  // Strategy options
  setStrategyOption: (id: string, category: StrategyCategory) => string | null;
  clearStrategyOption: (category: StrategyCategory) => void;
  // Financial Rescue System
  pendingRescueOffer: boolean;
  rescueOffer: RescueOfferState | null;
  rescueContract: ActiveRescueContract | null;
  acceptRescueOffer: (dealType: RescueDealType) => void;
  dismissRescueOffer: () => void;
  // Console management
  updateConsolePrice: (id: string, newPrice: number) => string | null;
  setConsolePricingStrategy: (id: string, strategy: "premium" | "budget" | "balanced") => void;
  relaunchConsole: (id: string) => string | null;
  setConsoleProductionState: (id: string, paused: boolean) => void;
  // Team management
  bulkHireEmployee: (type: EmployeeType, level: EmployeeLevel, count: number) => string | null;
  upgradeOfficeCapacity: () => string | null;
};

const GameplayContext = createContext<GameplayContextType>({
  state: null,
  loadGame: async () => {},
  unloadGame: () => {},
  advanceTime: () => null,
  buildConsole: () => ({ error: null }),
  discontinueConsole: () => {},
  cancelConsoleDev: () => {},
  upgradeOffice: () => false,
  launchMarketing: () => false,
  markNewsRead: () => {},
  deleteNews: () => {},
  deleteReadNews: () => {},
  deleteAllNews: () => {},
  respondToAttack: () => null,
  respondToScandal: () => null,
  hireInfluencer: () => null,
  pendingScandal: null,
  saveGame: async () => {},
  hireEmployee: () => null,
  fireEmployee: () => {},
  retrainEmployee: () => null,
  startResearch: () => null,
  unlockEraUpgrade: () => null,
  startGameProject: () => null,
  cancelGameProject: () => {},
  fixBugs: () => null,
  startHypeCampaign: () => null,
  postLaunchAction: () => null,
  startScoreRecovery: () => null,
  releaseDLC: () => null,
  stopSupport: () => null,
  optimizeGame: () => null,
  executePlayerAttack: () => ({ error: "not initialized", outcomeLabel: null, outcomeColor: null }),
  unlockCountry: () => null,
  openBranch: () => null,
  closeBranch: () => {},
  expandStores: () => null,
  takeLoan: () => null,
  sellShares: () => null,
  buyBackShares: () => null,
  acceptOffer: () => null,
  rejectOffer: () => {},
  createStockListing: () => null,
  cancelStockListing: () => {},
  acceptStockBid: () => null,
  rejectStockBid: () => {},
  buyAcquisition: () => null,
  sellAcquisition: () => {},
  acquireRival: () => ({ success: false, error: "not initialized" }),
  investInSponsorship: () => ({ success: false, profit: 0, message: "not initialized" }),
  pendingShadowOffer: false,
  pendingShadowCollection: null,
  respondToShadowInvestor: () => {},
  dismissShadowCollection: () => {},
  shareholderMeetingDecision: () => null,
  negotiateGeoConflict: () => null,
  buyLocalHolding: () => null,
  sellLocalHolding: () => {},
  hireLegalContract: () => null,
  cancelLegalContract: () => {},
  setStrategyOption: () => null,
  clearStrategyOption: () => {},
  pendingRescueOffer: false,
  rescueOffer: null,
  rescueContract: null,
  acceptRescueOffer: () => {},
  dismissRescueOffer: () => {},
  updateConsolePrice: () => null,
  setConsolePricingStrategy: () => {},
  relaunchConsole: () => null,
  setConsoleProductionState: () => {},
  bulkHireEmployee: () => null,
  upgradeOfficeCapacity: () => null,
});

export function GameplayProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ActiveGameState | null>(null);
  // Always-current mirror of state — updated synchronously during every render
  // so that callbacks that fire AFTER a render (e.g. Alert.onPress) never see
  // a stale snapshot.
  const stateRef = useRef<ActiveGameState | null>(null);
  stateRef.current = state;
  const { updateSave } = useGame();

  const persist = useCallback(async (s: ActiveGameState) => {
    try {
      // Sanitize NaN/Infinity → 0 before serializing so JSON.stringify never
      // writes "null" in place of a numeric field (which would corrupt the save).
      const safe = JSON.stringify(s, (_key, val) => {
        if (typeof val === "number" && !Number.isFinite(val)) return 0;
        return val;
      });
      await AsyncStorage.setItem(GAMEPLAY_KEY(s.saveId), safe);
    } catch (err) {
      // Silent write failure — game continues, next persist attempt will retry.
      console.warn("[MEGACORP] persist failed:", err);
    }
  }, []);

  const syncSaveSlot = useCallback((s: ActiveGameState) => {
    updateSave(s.saveId, {
      money: s.money,
      netWorth: Math.round(s.money + (s.companyValue ?? 0)),
      year: s.year,
      employees: (s.employees ?? []).length,
      products: s.consoles.filter((c) => !c.isDiscontinued).length,
      researchCount: (s.researchedNodes ?? []).length,
      companies: 1 + (s.acquisitions ?? []).length,
    });
  }, [updateSave]);

  // ── Save data repair ──────────────────────────────────────────────────────────
  // Normalize all numeric fields in loaded state to prevent NaN from old saves.
  // Old save data can have undefined/null/NaN for fields added in later versions.
  const repairSave = (parsed: ActiveGameState): ActiveGameState => {
    const repairProject = (p: any) => ({
      ...p,
      monthlyRevenue:  safeN(p.monthlyRevenue, 0),
      totalRevenue:    safeN(p.totalRevenue, 0),
      budget:          safeN(p.budget, 0),
      quality:         safeN(p.quality, 5),
      receptionScore:  p.receptionScore != null ? safeN(p.receptionScore, 50) : undefined,
      hypeLevel:       safeN(p.hypeLevel, 0),
      monthsElapsed:   safeN(p.monthsElapsed, 0),
      monthsRequired:  safeN(p.monthsRequired, 1),
    });
    const repairConsole = (c: any) => ({
      ...c,
      unitsSold:       safeN(c.unitsSold, 0),
      totalRevenue:    safeN(c.totalRevenue, 0),
      price:           safeN(c.price, 0),
      productionCost:  safeN(c.productionCost, 0),
      quality:         safeN(c.quality, 5),
      rating:          safeN(c.rating, 5),
      popularity:      safeN(c.popularity, 10),
      power:           safeN(c.power, 1),
      memoryGB:        safeN(c.memoryGB, 0),
      appealScore:     safeN(c.appealScore, 5),
      onlineBonusMult: safeN(c.onlineBonusMult, 1),
    });
    const repairEmployee = (e: any) => ({
      ...e,
      monthlySalary:   safeN(e.monthlySalary, 0),
      hireYear:        safeN(e.hireYear, parsed.year ?? 1972),
    });
    const repairLoan = (l: any) => ({
      ...l,
      originalAmount:     safeN(l.originalAmount, 0),
      remainingAmount:    safeN(l.remainingAmount, 0),
      monthlyPayment:     safeN(l.monthlyPayment, 0),
      annualInterestRate: safeN(l.annualInterestRate, 0.08),
      monthsRemaining:    safeN(l.monthsRemaining, 0),
      termMonths:         safeN(l.termMonths, 12),
    });
    // ── v2 migration: reset inflated starting reputation ─────────────────────
    // Old saves created before the rebalance used reputation: 30 as default.
    // A company with no launched products must not carry inflated reputation.
    const hasLaunchedProducts =
      (parsed.consoles ?? []).length > 0 ||
      (parsed.gameProjects ?? []).some((p: any) => p.phase === "released");
    const rawRep = safeN(parsed.reputation, 1);
    const migratedRep = !hasLaunchedProducts ? Math.min(rawRep, 2) : rawRep;

    return {
      ...parsed,
      // ── Core financials ────────────────────────────────────────────────────
      money:                  safeN(parsed.money, 0),
      totalRevenue:           safeN(parsed.totalRevenue, 0),
      companyValue:           safeN(parsed.companyValue, 0),
      sharePrice:             safeN(parsed.sharePrice, 0),
      totalShares:            safeN(parsed.totalShares, 10000),
      playerShares:           safeN(parsed.playerShares, 10000),
      totalLoansPaid:         safeN(parsed.totalLoansPaid, 0),
      // ── Reputation & market ────────────────────────────────────────────────
      reputation:             migratedRep,
      fans:                   safeN(parsed.fans, 0),
      marketShare:            safeN(parsed.marketShare, 0),
      companyEfficiency:      safeN(parsed.companyEfficiency, 1),
      avgMarketSaturation:    safeN(parsed.avgMarketSaturation, 0),
      techRep:                safeN(parsed.techRep, 0),
      commercialRep:          safeN(parsed.commercialRep, 0),
      fanRep:                 safeN(parsed.fanRep, 0),
      // ── Marketing ─────────────────────────────────────────────────────────
      marketingMonthsLeft:    safeN(parsed.marketingMonthsLeft, 0),
      // ── Cooldowns ─────────────────────────────────────────────────────────
      nextRivalAttackMonth:   safeN(parsed.nextRivalAttackMonth, 0),
      docCooldownMonthsLeft:  safeN(parsed.docCooldownMonthsLeft, 0),
      // ── Game & console collections ────────────────────────────────────────
      gameProjects:           (parsed.gameProjects ?? []).map(repairProject),
      consoles:               (parsed.consoles ?? []).map(repairConsole),
      employees:              (parsed.employees ?? []).map(repairEmployee),
      activeLoans:            (parsed.activeLoans ?? []).map(repairLoan),
    };
  };

  const loadGame = useCallback(async (save: SaveSlot) => {
    let raw: string | null = null;
    try {
      raw = await AsyncStorage.getItem(GAMEPLAY_KEY(save.id));
    } catch { /* storage error — fall through to create fresh */ }
    if (raw) {
      let parsed: ActiveGameState;
      try {
        parsed = JSON.parse(raw) as ActiveGameState;
      } catch {
        // Corrupted JSON — create a fresh game instead of crashing
        const initial = createInitialGameState({
          id: save.id, companyName: save.companyName, year: save.year,
          money: save.startingMoney, difficulty: save.difficulty,
          world: save.world, victoryMode: save.victoryMode ?? "sandbox",
          selectedGoals: save.selectedGoals ?? [], startingMoney: save.startingMoney,
          characterId: save.characterId ?? "strategist",
          homeCountry: save.homeCountry,
          founderAttrs: save.founderAttrs,
        });
        setState(initial);
        await persist(initial);
        return;
      }
      const repaired = repairSave(parsed);
      setState({
        ...repaired,
        employees:             repaired.employees ?? [],
        gameProjects:          repaired.gameProjects ?? [],
        consoles:              repaired.consoles ?? [],
        activeLoans:           repaired.activeLoans ?? [],
        researchedNodes:       parsed.researchedNodes ?? [],
        currentResearch:       parsed.currentResearch ?? null,
        researchMonthsLeft:    safeN(parsed.researchMonthsLeft, 0),
        firedHistoricalEvents: parsed.firedHistoricalEvents ?? [],
        unlockedCountries:     parsed.unlockedCountries ?? ["usa"],
        branches:              parsed.branches ?? [],
        creditRating:          parsed.creditRating ?? "BBB",
        totalLoansPaid:        safeN(parsed.totalLoansPaid, 0),
        characterId:           parsed.characterId ?? save.characterId ?? "strategist",
      });
    } else {
      const initial = createInitialGameState({
        id: save.id,
        companyName: save.companyName,
        year: save.year,
        money: save.startingMoney,
        difficulty: save.difficulty,
        world: save.world,
        victoryMode: save.victoryMode ?? "sandbox",
        selectedGoals: save.selectedGoals ?? [],
        startingMoney: save.startingMoney,
        characterId: save.characterId ?? "strategist",
        homeCountry: save.homeCountry,
        founderAttrs: save.founderAttrs,
      });
      setState(initial);
      await persist(initial);
    }
  }, [persist]);

  const unloadGame = useCallback(() => setState(null), []);

  const saveGame = useCallback(async () => {
    if (state) {
      await persist(state);
      syncSaveSlot(state);
    }
  }, [state, persist, syncSaveSlot]);

  const advanceTime = useCallback((): MonthSummary | null => {
    if (!state) return null;
    // Pre-compute summary from closure state only for the return value.
    const { summary } = advanceMonth(state);
    // Functional setState: React calls the updater with the *actual* latest state,
    // so any concurrent mutation (hire, project create, etc.) is already present in prev.
    // persist and syncSaveSlot are called INSIDE the updater so they always receive
    // the same state object React will commit — never a stale pre-hire snapshot.
    setState(prev => {
      if (!prev) return prev;
      const { newState } = advanceMonth(prev);
      persist(newState);
      if (newState.month === 12) syncSaveSlot(newState);
      return newState;
    });
    return summary;
  }, [state, persist, syncSaveSlot]);

  const buildConsole = useCallback((
    spec: Omit<GameConsole, "id" | "unitsSold" | "totalRevenue" | "rating" | "popularity" | "isDiscontinued" | "launchYear" | "launchMonth" | "starRating" | "receptionScore" | "receptionComment" | "receptionSentiment">
  ): { error: string | null; reception?: ConsoleReceptionResult } => {
    if (!state) return { error: "Nenhum jogo ativo" };
    const buildCost = spec.productionCost * 50;
    const exportInvestment = (spec.exportRegions ?? []).reduce(
      (s, er) => s + (er.blocked ? 0 : er.investment), 0
    );
    const totalConsoleCost = buildCost + exportInvestment;
    if (state.money < totalConsoleCost) return { error: `Capital insuficiente (precisas de $${totalConsoleCost.toLocaleString()})` };

    // ── Specialization launch bonus ────────────────────────────────────────────
    // Company identity affects the initial QUALITY of hardware built — hardware-spec
    // companies engineer better silicon at launch; premium-spec commands higher appeal.
    // This creates a permanent asymmetry: two companies building the same console spec
    // WILL have different launch quality depending on their research identity.
    const launchSpecScores = computeSpecialization(state.researchedNodes ?? []);
    const hwLvl      = getSpecLevel(launchSpecScores.hardware);   // 0-3
    const premLvl    = getSpecLevel(launchSpecScores.premium);    // 0-3
    const onlineLvl  = getSpecLevel(launchSpecScores.online);     // 0-3
    // Hardware: +5%/+10%/+15% to quality (better engineering process)
    const hwQualityBoost   = 1 + hwLvl * 0.05;
    // Premium: +4%/+8%/+12% to appealScore (better design language + marketing perception)
    const premAppealBoost  = 1 + premLvl * 0.04;
    // Online: +0.15/+0.30/+0.45 to onlineBonusMult (online services bundled at launch)
    const onlineBonusAdd   = onlineLvl * 0.15;
    const boostedQuality   = Math.min(10, spec.quality * hwQualityBoost);
    const boostedAppeal    = Math.min(10, (spec.appealScore ?? 5) * premAppealBoost);
    const boostedOnlineMult = Math.min(3, (spec.onlineBonusMult ?? 1) + onlineBonusAdd);

    const rating = calculateConsoleRating(
      spec.power, spec.memoryGB, boostedQuality, state.year, state.offices.tech
    );
    const validation = spec.components
      ? validateConsoleComponents(spec.components, state.year)
      : null;
    const reception = computeConsoleReception({
      performanceScore: spec.performanceScore ?? Math.round(boostedQuality * 10),
      appealScore: boostedAppeal,
      reputation: state.reputation,
      hasMarketing: state.activeMarketing !== "none",
      thermalOK: validation ? validation.thermalOK : true,
      powerOK: validation ? validation.powerOK : true,
    });
    // ── Development time based on performance tier ────────────────────────────
    // Higher-performance hardware takes longer to engineer and manufacture.
    // Research upgrades do NOT reduce dev time — they only improve quality.
    const perfScore = spec.performanceScore ?? 50;
    const devTimeMonths =
      perfScore >= 70
        ? 30 + Math.floor(Math.random() * 7)   // 30–36 months — high-performance
        : perfScore >= 35
        ? 18 + Math.floor(Math.random() * 7)   // 18–24 months — standard
        : 12;                                   // 12 months — low-end

    const newConsole: GameConsole = {
      ...spec,
      quality: boostedQuality,
      appealScore: boostedAppeal,
      onlineBonusMult: boostedOnlineMult,
      id: `console_${Date.now()}`,
      unitsSold: 0,
      totalRevenue: 0,
      rating,
      popularity: 10 + state.reputation * 0.3,
      launchYear: 0,      // set by advanceMonth when development completes
      launchMonth: 0,     // set by advanceMonth when development completes
      isDiscontinued: false,
      starRating: reception.stars,
      receptionScore: reception.score,
      receptionComment: reception.comment,
      receptionSentiment: reception.sentiment,
      isInDevelopment: true,
      devProgress: 0,
      devTimeMonths,
      suggestedPrice: Math.round(spec.productionCost * 3.5),
      pricingStrategy: "balanced",
    };
    // Apply category reputation bonus on launch (premium: +3, collector: +7)
    const catRepBonus = spec.category === "collector" ? 7 : spec.category === "premium" ? 3 : 0;
    // Apply design system bonuses on launch (from modular design config)
    const designRep  = Math.round(spec.designRepBonus  ?? 0);
    const designFans = Math.round(spec.designFanBoost  ?? 0);
    const next: ActiveGameState = {
      ...state,
      money: state.money - totalConsoleCost,
      consoles: [...state.consoles, newConsole],
      reputation: Math.min(100, state.reputation + catRepBonus + designRep),
      fans: Math.max(0, (state.fans ?? 0) + designFans),
    };
    setState(next);
    persist(next);
    return { error: null, reception };
  }, [state, persist]);

  const discontinueConsole = useCallback((id: string) => {
    if (!state) return;
    const next: ActiveGameState = {
      ...state,
      consoles: state.consoles.map((c) => c.id === id ? { ...c, isDiscontinued: true } : c),
    };
    setState(next);
    persist(next);
  }, [state, persist]);

  const cancelConsoleDev = useCallback((id: string) => {
    if (!state) return;
    const dev = state.consoles.find((c) => c.id === id && c.isInDevelopment);
    if (!dev) return;
    // Refund 50% of the initial build cost
    const refund = Math.round((dev.productionCost ?? 0) * 50 * 0.5);
    const next: ActiveGameState = {
      ...state,
      money: state.money + refund,
      consoles: state.consoles.filter((c) => c.id !== id),
    };
    setState(next);
    persist(next);
  }, [state, persist]);

  const updateConsolePrice = useCallback((id: string, newPrice: number): string | null => {
    if (!state) return "Nenhum jogo ativo";
    const c = state.consoles.find((x) => x.id === id);
    if (!c) return "Console não encontrado";
    if (c.isDiscontinued || c.isInDevelopment) return "Console não está ativo";
    const sugg = c.suggestedPrice ?? Math.round(c.productionCost * 3.5);
    const minPrice = Math.max(1, c.productionCost + 1);
    const maxPrice = sugg + 200;
    if (newPrice < minPrice) return `Preço mínimo: $${minPrice}`;
    if (newPrice > maxPrice) return `Preço máximo: $${maxPrice} (sugerido + $200)`;
    const next: ActiveGameState = {
      ...state,
      consoles: state.consoles.map((x) => x.id === id ? { ...x, price: newPrice } : x),
    };
    setState(next);
    persist(next);
    return null;
  }, [state, persist]);

  const setConsolePricingStrategy = useCallback((id: string, strategy: "premium" | "budget" | "balanced") => {
    if (!state) return;
    const next: ActiveGameState = {
      ...state,
      consoles: state.consoles.map((c) => c.id === id ? { ...c, pricingStrategy: strategy } : c),
    };
    setState(next);
    persist(next);
  }, [state, persist]);

  const relaunchConsole = useCallback((id: string): string | null => {
    if (!state) return "Nenhum jogo ativo";
    const c = state.consoles.find((x) => x.id === id);
    if (!c) return "Console não encontrado";
    if (c.isDiscontinued || c.isInDevelopment) return "Console não está ativo";
    const relaunchCount = c.relaunchCount ?? 0;
    if (relaunchCount >= 3) return "Máximo de 3 relançamentos atingido";
    const cost = Math.max(50_000, c.productionCost * 20);
    if (state.money < cost) return `Capital insuficiente (precisas de ${formatMoney(cost)})`;
    const next: ActiveGameState = {
      ...state,
      money: state.money - cost,
      consoles: state.consoles.map((x) =>
        x.id === id
          ? { ...x, relaunchCount: relaunchCount + 1, relaunchBonusMonthsLeft: 6, isProductionPaused: false }
          : x
      ),
    };
    setState(next);
    persist(next);
    return null;
  }, [state, persist]);

  const setConsoleProductionState = useCallback((id: string, paused: boolean) => {
    if (!state) return;
    const next: ActiveGameState = {
      ...state,
      consoles: state.consoles.map((c) => c.id === id ? { ...c, isProductionPaused: paused } : c),
    };
    setState(next);
    persist(next);
  }, [state, persist]);

  const bulkHireEmployee = useCallback((type: EmployeeType, level: EmployeeLevel, count: number): string | null => {
    const s = stateRef.current;
    if (!s) return "Nenhum jogo ativo";
    if (count < 1) return "Quantidade inválida";
    const charBonuses = getCharacterById(s.characterId ?? "strategist")?.bonuses;
    const hireMult = charBonuses?.hireCostMult ?? 1;
    const hireCostEach = Math.round(EMPLOYEE_HIRE_COST[type][level] * hireMult * getHireCostInflation(s.year));
    const totalCost = hireCostEach * count;
    const officeLevel = s.officeLevel ?? 1;
    const salesBranchCount = (s.branches ?? []).filter(b => b.type === "sales_office").length;
    const maxCapacity = 10 + salesBranchCount * 3 + (officeLevel - 1) * ALL_OFFICE_SECTORS.length;
    const currentCount = (s.employees ?? []).length;
    if (currentCount + count > maxCapacity) {
      const available = maxCapacity - currentCount;
      if (available <= 0) return `Expande a sua empresa para contratar mais funcionários (limite: ${maxCapacity}).`;
      return `Só podes contratar mais ${available} funcionário${available === 1 ? "" : "s"} com a capacidade atual.`;
    }
    if (s.money < totalCost) return `Capital insuficiente — precisas de ${formatMoney(totalCost)} para ${count} contratações.`;
    const newEmps = Array.from({ length: count }, () => {
      const emp = generateEmployee(type, level);
      emp.hireYear = s.year;
      emp.hireMonth = s.month;
      return emp;
    });
    // Functional setState: apply bulk hire on top of ACTUAL latest state so it
    // is never silently overwritten by a concurrent advanceTime batch update.
    // persist inside the updater ensures it runs last, saving all employees.
    setState(prev => {
      if (!prev) return prev;
      const next: ActiveGameState = {
        ...prev,
        money: prev.money - totalCost,
        employees: [...(prev.employees ?? []), ...newEmps],
      };
      persist(next);
      return next;
    });
    return null;
  }, [persist]);

  const upgradeOfficeCapacity = useCallback((): string | null => {
    if (!state) return "Nenhum jogo ativo";
    const officeLevel = state.officeLevel ?? 1;
    const MAX_OFFICE_LEVEL = 8;
    if (officeLevel >= MAX_OFFICE_LEVEL) return `Nível máximo de escritório (${MAX_OFFICE_LEVEL}) já atingido`;
    const empCount = (state.employees ?? []).length;
    const upgradeCost = Math.round(50_000 * Math.pow(officeLevel, 2) * (1 + empCount / 15));
    if (state.money < upgradeCost) return `Capital insuficiente — precisas de ${formatMoney(upgradeCost)}`;
    const next: ActiveGameState = {
      ...state,
      money: state.money - upgradeCost,
      officeLevel: officeLevel + 1,
    };
    setState(next);
    persist(next);
    return null;
  }, [state, persist]);

  const upgradeOffice = useCallback((type: OfficeType): boolean => {
    if (!state) return false;
    const current = state.offices[type] ?? 0;
    // Check era-based max and absolute max (35 = 7 phases × 5)
    const maxByEra = getMaxAvailableUpgrade(state.year) + 1; // +1 because current is count, not index
    if (current >= OFFICE_MAX_LEVEL) return false;
    if (current >= maxByEra) return false;
    // Dynamic cost based on upgrade index and current year
    const cost = getOfficeUpgradeCost(current, state.year);
    if (state.money < cost) return false;
    const next: ActiveGameState = {
      ...state,
      money: state.money - cost,
      offices: { ...state.offices, [type]: current + 1 },
    };
    setState(next);
    persist(next);
    return true;
  }, [state, persist]);

  const retrainEmployee = useCallback((id: string): string | null => {
    if (!state) return "Estado inválido";
    const emp = (state.employees ?? []).find((e) => e.id === id);
    if (!emp) return "Funcionário não encontrado";
    const cost = getRetrainCost(emp);
    if (state.money < cost) return `Dinheiro insuficiente — custo: $${cost.toLocaleString()}`;
    const updatedEmployees = (state.employees ?? []).map((e) =>
      e.id === id ? { ...e, techEraYear: state.year } : e
    );
    const next: ActiveGameState = {
      ...state,
      money: state.money - cost,
      employees: updatedEmployees,
    };
    setState(next);
    persist(next);
    return null;
  }, [state, persist]);

  const expandStores = useCallback((countryId: string, tier: StoreExpansionTier): string | null => {
    if (!state) return "Estado inválido";
    const country = getCountryById(countryId);
    if (!country) return "País não encontrado";
    const branchIdx = (state.branches ?? []).findIndex((b) => b.countryId === countryId);
    if (branchIdx === -1) return "É necessário ter um escritório neste país primeiro";
    const branch = state.branches[branchIdx];
    if (branch.storeExpansion) return "Este mercado já possui lojas expandidas";
    const { oneTimeCost, monthlyExtra } = getStoreExpansionCost(country, tier);
    if (state.money < oneTimeCost) return `Dinheiro insuficiente — custo: $${oneTimeCost.toLocaleString()}`;
    const initialStoreCount = tier === "stores_30" ? 30 : tier === "stores_60" ? 60 : 5;
    const updatedBranches = [...state.branches];
    updatedBranches[branchIdx] = {
      ...branch,
      storeExpansion: tier,
      storeCount: initialStoreCount,
      storeExpandedYear: state.year,
      monthlyCost: branch.monthlyCost + monthlyExtra,
    };
    const next: ActiveGameState = {
      ...state,
      money: state.money - oneTimeCost,
      branches: updatedBranches,
    };
    setState(next);
    persist(next);
    return null;
  }, [state, persist]);

  const launchMarketing = useCallback((tier: MarketingTier): boolean => {
    if (!state) return false;
    if (tier === "none") return false;
    const cost = Math.round(MARKETING_COSTS[tier] * getCostMultiplier(state.year));
    if (state.money < cost) return false;
    const next: ActiveGameState = {
      ...state,
      money: state.money - cost,
      activeMarketing: tier,
      marketingMonthsLeft: MARKETING_DURATION[tier],
    };
    setState(next);
    persist(next);
    return true;
  }, [state, persist]);

  const markNewsRead = useCallback((id: string) => {
    setState(prev => {
      if (!prev) return prev;
      const next: ActiveGameState = {
        ...prev,
        news: prev.news.map((n) => n.id === id ? { ...n, isRead: true } : n),
      };
      persist(next);
      return next;
    });
  }, [persist]);

  const deleteNews = useCallback((id: string) => {
    setState(prev => {
      if (!prev) return prev;
      const next: ActiveGameState = {
        ...prev,
        news: prev.news.filter((n) => n.id !== id),
      };
      persist(next);
      return next;
    });
  }, [persist]);

  const deleteReadNews = useCallback(() => {
    setState(prev => {
      if (!prev) return prev;
      const next: ActiveGameState = {
        ...prev,
        news: prev.news.filter((n) => !n.isRead),
      };
      persist(next);
      return next;
    });
  }, [persist]);

  const deleteAllNews = useCallback(() => {
    // Use functional setState so this write is never silently clobbered by a
    // concurrent advanceTime functional-setState that React could flush after us.
    setState(prev => {
      if (!prev) return prev;
      const next: ActiveGameState = { ...prev, news: [] };
      persist(next);
      return next;
    });
  }, [persist]);

  const respondToAttack = useCallback((newsId: string, choice: "revidar" | "ignorar"): string | null => {
    // Use stateRef.current so this is safe when called from inside an Alert callback
    // (which is asynchronous and may fire after a re-render with different closure state).
    const cur = stateRef.current;
    if (!cur) return "Nenhum jogo ativo";
    const attackNews = cur.news.find((n) => n.id === newsId);
    if (!attackNews) return "Notícia não encontrada";
    if (attackNews.attackResponse) return "Já respondeste a este ataque";

    let newMoney      = cur.money;
    let newReputation = cur.reputation;

    let updatedCompetitors = cur.competitors;
    if (choice === "revidar") {
      if (cur.money < 50_000) return "Capital insuficiente para revidar (precisas de $50.000)";
      newMoney      -= 50_000;
      newReputation  = Math.min(100, newReputation + 5);
      const rivalId = attackNews.rivalId;
      if (rivalId) {
        const repLoss = Math.floor(Math.random() * 4) + 3;
        updatedCompetitors = cur.competitors.map((c) =>
          c.id === rivalId
            ? { ...c, reputation: Math.max(0, c.reputation - repLoss) }
            : c
        );
      }
    } else {
      newReputation = Math.max(0, newReputation - 2);
    }

    const next: ActiveGameState = {
      ...cur,
      money:       newMoney,
      reputation:  newReputation,
      competitors: updatedCompetitors,
      news: cur.news.map((n) =>
        n.id === newsId
          ? { ...n, isRead: true, attackResponse: choice }
          : n
      ),
    };
    setState(next);
    persist(next);
    return null;
  }, [persist]);

  const hireInfluencer = useCallback((profileId: InfluencerType, gameProjectId?: string): string | null => {
    if (!state) return "Nenhum jogo ativo";
    const profile = INFLUENCER_PROFILES.find((p) => p.id === profileId);
    if (!profile) return "Perfil de influenciador inválido";

    // Check cooldown
    const cooldown = getInfluencerCooldownLeft(profileId, state.hiredInfluencers ?? [], state.year, state.month);
    if (cooldown > 0) return `Precisas de esperar ${cooldown} mês(es) para contratar este perfil novamente.`;

    // Check active duplicate
    const alreadyActive = (state.hiredInfluencers ?? []).some((h) => h.profileId === profileId);
    if (alreadyActive) return "Já tens um influenciador deste tipo ativo.";

    // Check money
    if (state.money < profile.cost) return `Capital insuficiente. Esta campanha custa ${profile.cost.toLocaleString("pt-PT", { style: "currency", currency: "USD" })}.`;

    // Random name from pool
    const NAMES = [
      "TechMaster João", "GamingGuru Ana", "PixelQueen Sara", "ByteBoss Carlos",
      "RetroReviewer Mike", "HypeStation Leo", "ConsoleWars Eva", "BitCritic Rui",
      "NeonGamer Tiago", "DigitalDiva Marta", "ChipChaser Pedro", "VoxelVet Inês",
    ];
    const usedNames = (state.hiredInfluencers ?? []).map((h) => h.name);
    const available = NAMES.filter((n) => !usedNames.includes(n));
    const name = available[Math.floor(Math.random() * available.length)] ?? profile.label;

    // Immediate fans and rep bonus (50% upfront, 20%/month for remaining months)
    const upfrontFans = Math.round(profile.fanBonus * 0.50);
    const earlyBonus  = gameProjectId ? (profile.earlyAccessBonus ?? 0) : 0;
    const totalUpfrontFans = upfrontFans + earlyBonus;

    // For controversial type: 30% chance of immediate backlash instead of boost
    const isControversial = profileId === "controversial";
    const backlash = isControversial && Math.random() < 0.30;

    const fanChange  = backlash ? -Math.round(profile.fanBonus * 0.30) : totalUpfrontFans;
    const repChange  = backlash ? -2 : profile.repBonus;

    const newHired: HiredInfluencer = {
      profileId,
      name,
      hiredYear: state.year,
      hiredMonth: state.month,
      monthsLeft: profile.durationMonths,
      linkedGameId: gameProjectId,
      totalFansDelivered: Math.max(0, fanChange),
    };

    const next: ActiveGameState = {
      ...state,
      money:         state.money - profile.cost,
      fans:          Math.max(0, state.fans + fanChange),
      reputation:    Math.max(0, Math.min(100, state.reputation + repChange)),
      techRep:       Math.max(0, Math.min(100, (state.techRep ?? 50) + (profile.techRepBonus ?? 0))),
      commercialRep: Math.max(0, Math.min(100, (state.commercialRep ?? 50) + (profile.commercialRepBonus ?? 0))),
      fanRep:        Math.max(0, Math.min(100, (state.fanRep ?? 50)  + (profile.fanRepBonus ?? 0))),
      hiredInfluencers: [...(state.hiredInfluencers ?? []), newHired],
    };
    setState(next);
    persist(next);
    return null;
  }, [state, persist]);

  // pendingScandal: the first active unresolved scandal (to show modal)
  const pendingScandal = (() => {
    if (!state) return null;
    const unresolved = (state.activeScandals ?? []).find((s) => !s.resolved);
    if (!unresolved) return null;
    return ALL_SCANDALS.find((def) => def.id === unresolved.scandalId) ?? null;
  })();

  const respondToScandal = useCallback((scandalId: string, optionId: string): string | null => {
    if (!state) return "Nenhum jogo ativo";
    const scandalDef = ALL_SCANDALS.find((s) => s.id === scandalId);
    if (!scandalDef) return "Escândalo não encontrado";
    const option = scandalDef.options.find((o) => o.id === optionId);
    if (!option) return "Opção inválida";
    const activeScandal = (state.activeScandals ?? []).find((s) => s.scandalId === scandalId && !s.resolved);
    if (!activeScandal) return "Este escândalo já foi resolvido";

    // Apply the option effects immediately
    let newMoney       = state.money + (option.effects.moneyDelta ?? 0) - option.cost;
    let newReputation  = Math.max(0, Math.min(100, state.reputation      + (option.effects.repDelta ?? 0)));
    let newTechRep     = Math.max(0, Math.min(100, (state.techRep ?? 50) + (option.effects.techRepDelta ?? 0)));
    let newCommRep     = Math.max(0, Math.min(100, (state.commercialRep ?? 50) + (option.effects.commercialRepDelta ?? 0)));
    let newFanRep      = Math.max(0, Math.min(100, (state.fanRep ?? 50)  + (option.effects.fanRepDelta ?? 0)));
    let newFans        = Math.max(0, state.fans + (option.effects.fansDelta ?? 0));
    const newEscalationMod = (option.effects.escalationMod ?? 0);

    // Mark the scandal as resolved
    const updatedScandals = (state.activeScandals ?? []).map((as) => {
      if (as.scandalId !== scandalId) return as;
      return {
        ...as,
        resolved: true,
        resolvedOptionId: optionId,
        escalationChance: Math.max(0, Math.min(1, as.escalationChance + newEscalationMod)),
        futureRepRisk: option.effects.futureRepRisk ?? 0,
        futureRepRiskMonthsLeft: (option.effects.futureRepRisk ?? 0) > 0 ? 3 : 0,
      };
    });

    const next: ActiveGameState = {
      ...state,
      money:         newMoney,
      reputation:    newReputation,
      techRep:       newTechRep,
      commercialRep: newCommRep,
      fanRep:        newFanRep,
      fans:          newFans,
      activeScandals: updatedScandals,
    };
    setState(next);
    persist(next);
    return null;
  }, [state, persist]);

  const hireEmployee = useCallback((type: EmployeeType, level: EmployeeLevel): string | null => {
    const s = stateRef.current;
    if (!s) return "Nenhum jogo ativo";
    const officeLevel = s.officeLevel ?? 1;
    const salesBranchCount = (s.branches ?? []).filter(b => b.type === "sales_office").length;
    const maxCapacity = 10 + salesBranchCount * 3 + (officeLevel - 1) * ALL_OFFICE_SECTORS.length;
    if ((s.employees ?? []).length >= maxCapacity) {
      return `Expande a sua empresa para contratar mais funcionários (limite: ${maxCapacity}).`;
    }
    const charBonuses = getCharacterById(s.characterId ?? "strategist")?.bonuses;
    const hireMult = charBonuses?.hireCostMult ?? 1;
    const hireCost = Math.round(EMPLOYEE_HIRE_COST[type][level] * hireMult * getHireCostInflation(s.year));
    if (s.money < hireCost) return `Capital insuficiente (precisas de $${hireCost.toLocaleString()})`;
    const emp = generateEmployee(type, level);
    emp.hireYear = s.year;
    emp.hireMonth = s.month;
    setState(prev => {
      if (!prev) return prev;
      const next: ActiveGameState = {
        ...prev,
        money: prev.money - hireCost,
        employees: [...(prev.employees ?? []), emp],
      };
      persist(next);
      return next;
    });
    return null;
  }, [persist]);

  const fireEmployee = useCallback((id: string) => {
    if (!state) return;
    const next: ActiveGameState = {
      ...state,
      employees: (state.employees ?? []).filter((e) => e.id !== id),
    };
    setState(next);
    persist(next);
  }, [state, persist]);

  const unlockEraUpgrade = useCallback((id: string): string | null => {
    if (!state) return "Nenhum jogo ativo";
    const upgrade = ERA_UPGRADES.find((u) => u.id === id);
    if (!upgrade) return "Melhoria não encontrada";
    const unlocked = state.eraUpgradeUnlocked ?? [];
    const available = state.eraUpgradeAvailable ?? [];
    if (unlocked.includes(id)) return "Já desbloqueada";
    if (!available.includes(id)) return "Melhoria não disponível ainda";
    if (state.year < upgrade.minYear) return `Disponível a partir de ${upgrade.minYear} (estamos em ${state.year})`;
    if (state.money < upgrade.cost) return `Capital insuficiente (${formatMoney(upgrade.cost)} necessário)`;
    const newAvailable = getControlledUnlocks(id, unlocked, available);
    const next: ActiveGameState = {
      ...state,
      money: state.money - upgrade.cost,
      eraUpgradeUnlocked: [...unlocked, id],
      eraUpgradeAvailable: [...available.filter((a) => a !== id), ...newAvailable],
    };
    setState(next);
    persist(next);
    return null;
  }, [state, persist]);

  const startResearch = useCallback((nodeId: string): string | null => {
    if (!state) return "Nenhum jogo ativo";
    if (state.currentResearch) return "Já existe uma pesquisa em andamento";
    if ((state.researchedNodes ?? []).includes(nodeId)) return "Já pesquisado";

    // Check research combo
    const comboNode = RESEARCH_COMBOS.find((c) => c.id === nodeId);
    if (comboNode) {
      const missingReq = comboNode.requires.find((r) => !(state.researchedNodes ?? []).includes(r));
      if (missingReq) {
        const reqNode = getNodeById(missingReq);
        return `Requer tecnologia concluída: ${reqNode?.name ?? missingReq}`;
      }
      if (state.money < comboNode.baseCost) return `Capital insuficiente (${formatMoney(comboNode.baseCost)} necessário)`;
      const charResearchMult = getCharacterById(state.characterId ?? "strategist")?.bonuses?.researchSpeedMult ?? 1;
      const researchSpeed = charResearchMult * (1 + (state.employees ?? [])
        .filter((e) => e.type === "researcher")
        .reduce((s, e) => s + (e.level === "junior" ? 0.08 : e.level === "senior" ? 0.15 : 0.25), 0));
      const rawTime = getComboTime(comboNode);
      const adjustedTime = Math.max(1, Math.round(rawTime / researchSpeed));
      const next: ActiveGameState = {
        ...state,
        money: state.money - comboNode.baseCost,
        currentResearch: nodeId,
        researchMonthsLeft: adjustedTime,
      };
      setState(next);
      persist(next);
      return null;
    }

    // Check exclusive tech
    const exclNode = EXCLUSIVE_TECHS.find(e => e.id === nodeId);
    if (exclNode) {
      const specScores = computeSpecialization(state.researchedNodes ?? []);
      const available = checkExclusiveAvailable(
        exclNode, state.year, state.reputation ?? 0,
        state.money, state.researchedNodes ?? [], specScores,
      );
      if (!available) return `Condições não satisfeitas: ${exclNode.conditions.conditionLabel}`;
      if (state.money < exclNode.cost) return `Capital insuficiente (${formatMoney(exclNode.cost)} necessário)`;
      const charResearchMult = getCharacterById(state.characterId ?? "strategist")?.bonuses?.researchSpeedMult ?? 1;
      const researchSpeed = charResearchMult * (1 + (state.employees ?? [])
        .filter(e => e.type === "researcher")
        .reduce((s, e) => s + (e.level === "junior" ? 0.08 : e.level === "senior" ? 0.15 : 0.25), 0));
      const adjustedTime = Math.max(1, Math.round(exclNode.timeMonths / researchSpeed));
      const next: ActiveGameState = {
        ...state,
        money: state.money - exclNode.cost,
        currentResearch: nodeId,
        researchMonthsLeft: adjustedTime,
      };
      setState(next);
      persist(next);
      return null;
    }

    const node = getNodeById(nodeId);
    if (!node) return "Pesquisa não encontrada";
    if (node.minYear && state.year < node.minYear) return `Disponível a partir de ${node.minYear} (estamos em ${state.year})`;
    if (state.money < node.cost) return `Capital insuficiente (${formatMoney(node.cost)} necessário)`;
    const missingReq = node.requires.find((req) => !(state.researchedNodes ?? []).includes(req));
    if (missingReq) {
      const reqNode = getNodeById(missingReq);
      return `Requer: ${reqNode?.name ?? missingReq}`;
    }
    const chosenPath = getChosenPathForCategory(node.category, state.researchedNodes ?? []);
    if (chosenPath && chosenPath !== node.path) return "Este caminho foi bloqueado pela sua escolha anterior";
    const charResearch = getCharacterById(state.characterId ?? "strategist")?.bonuses;
    const charResearchMult = charResearch?.researchSpeedMult ?? 1;
    const researchSpeed = charResearchMult * (1 + (state.employees ?? [])
      .filter((e) => e.type === "researcher")
      .reduce((s, e) => s + (e.level === "junior" ? 0.08 : e.level === "senior" ? 0.15 : 0.25), 0));
    const adjustedTime = Math.max(1, Math.round(node.timeMonths / researchSpeed));
    const next: ActiveGameState = {
      ...state,
      money: state.money - node.cost,
      currentResearch: nodeId,
      researchMonthsLeft: adjustedTime,
    };
    setState(next);
    persist(next);
    return null;
  }, [state, persist]);

  const startGameProject = useCallback((
    project: Omit<GameProject, "id" | "monthsElapsed" | "phase" | "monthlyRevenue" | "totalRevenue" | "launchYear" | "launchMonth">
  ): string | null => {
    if (!state) return "Nenhum jogo ativo";
    const exportInvestment = (project.exportRegions ?? []).reduce(
      (s, er) => s + (er.blocked ? 0 : er.investment), 0
    );
    const totalCost = project.budget + exportInvestment;
    if (state.money < totalCost) {
      if (exportInvestment > 0)
        return `Capital insuficiente ($${totalCost.toLocaleString()} necessário — inclui $${exportInvestment.toLocaleString()} em exportação)`;
      return `Capital insuficiente ($${project.budget.toLocaleString()} necessário)`;
    }
    // Duplicate name check — originals only; sequels always get unique names like "Game 2"
    const trimmedName = project.name.trim().toLowerCase();
    const duplicate = (state.gameProjects ?? []).find(
      (p) => p.phase !== "cancelled" && p.name.trim().toLowerCase() === trimmedName
    );
    if (duplicate) return `Já existe um jogo chamado "${duplicate.name}". Crie uma continuação do jogo original em vez de recriá-lo.`;
    const newProject: GameProject = {
      ...project,
      id: `game_${Date.now()}`,
      monthsElapsed: 0,
      phase: "development",
      monthlyRevenue: 0,
      totalRevenue: 0,
      launchYear: 0,
      launchMonth: 0,
    };
    // Functional setState: adds the new project on top of whatever the CURRENT
    // React state is. If advanceTime ran concurrently and advanced the month,
    // the project is still appended to the advanced state instead of being lost.
    setState(prev => {
      if (!prev) return prev;
      let projects = prev.gameProjects ?? [];
      // If this is a sequel, track the sequel count on the original so
      // getSequelAdvice can warn about franchise fatigue.
      if (newProject.sequelOf) {
        projects = projects.map(p =>
          p.id === newProject.sequelOf
            ? { ...p, sequelCount: (p.sequelCount ?? 0) + 1 }
            : p
        );
      }
      return {
        ...prev,
        money: prev.money - totalCost,
        gameProjects: [...projects, newProject],
      };
    });
    // Persist approximate state from closure (close enough; next tick syncs exactly)
    const approxNext: ActiveGameState = {
      ...state,
      money: state.money - totalCost,
      gameProjects: [...(state.gameProjects ?? []), newProject],
    };
    persist(approxNext);
    return null;
  }, [state, persist]);

  const cancelGameProject = useCallback((id: string) => {
    if (!state) return;
    const next: ActiveGameState = {
      ...state,
      gameProjects: (state.gameProjects ?? []).map((p) =>
        p.id === id ? { ...p, phase: "cancelled" as const } : p
      ),
    };
    setState(next);
    persist(next);
  }, [state, persist]);

  const fixBugs = useCallback((gameId: string): string | null => {
    if (!state) return "Nenhum jogo ativo";
    const proj = (state.gameProjects ?? []).find((p) => p.id === gameId);
    if (!proj) return "Jogo não encontrado";
    if (proj.phase !== "released") return "O jogo ainda não foi lançado";
    const bug = (proj.bugLevel ?? "none") as BugLevel;
    if (bug === "none") return "Este jogo não tem bugs a corrigir";
    if (proj.bugFixInProgress) return "Correção já em andamento";
    const cost = BUG_FIX_COST[bug];
    if (state.money < cost) return `Capital insuficiente ($${cost.toLocaleString()} necessário)`;
    const months = BUG_FIX_MONTHS[bug];
    const next: ActiveGameState = {
      ...state,
      money: state.money - cost,
      gameProjects: (state.gameProjects ?? []).map((p) =>
        p.id === gameId
          ? { ...p, bugFixInProgress: true, bugFixMonthsLeft: months }
          : p
      ),
    };
    setState(next);
    persist(next);
    return null;
  }, [state, persist]);

  const SCORE_RECOVERY_TIERS = {
    light:  { amount: 3, months: 2, cost: 50_000  },
    medium: { amount: 5, months: 3, cost: 150_000 },
    strong: { amount: 8, months: 5, cost: 350_000 },
  } as const;

  const startScoreRecovery = useCallback((gameId: string, tier: "light" | "medium" | "strong"): string | null => {
    if (!state) return "Nenhum jogo ativo";
    const proj = (state.gameProjects ?? []).find((p) => p.id === gameId);
    if (!proj) return "Jogo não encontrado";
    if (proj.phase !== "released") return "O jogo ainda não foi lançado";
    if (proj.scoreRecoveryInProgress) return "Recuperação já em andamento";
    if (proj.bugFixInProgress) return "Correção de bugs em andamento — aguarda a conclusão";
    if (proj.pendingUpdateType) return "Atualização em andamento — aguarda a conclusão";
    const base = proj.baseQualityScore ?? (proj.receptionScore ?? 0);
    const current = proj.receptionScore ?? 0;
    if (current >= base) return "O jogo já está na pontuação máxima possível";
    const def = SCORE_RECOVERY_TIERS[tier];
    if (state.money < def.cost) return `Capital insuficiente ($${def.cost.toLocaleString()} necessário)`;
    const next: ActiveGameState = {
      ...state,
      money: state.money - def.cost,
      gameProjects: (state.gameProjects ?? []).map((p) =>
        p.id === gameId
          ? { ...p, scoreRecoveryInProgress: true, scoreRecoveryMonthsLeft: def.months, scoreRecoveryAmount: def.amount }
          : p
      ),
    };
    setState(next);
    persist(next);
    return null;
  }, [state, persist]);

  const releaseDLC = useCallback((gameId: string): string | null => {
    if (!state) return "Nenhum jogo ativo";
    const proj = (state.gameProjects ?? []).find((p) => p.id === gameId);
    if (!proj) return "Jogo não encontrado";
    if (proj.phase !== "released") return "O jogo ainda não foi lançado";
    if (proj.supportActive === false) return "Suporte encerrado — não é possível lançar DLC";
    const count = proj.dlcCount ?? 0;
    if (count >= 3) return "Limite de DLCs atingido (máx 3)";
    const cost = Math.max(40_000, Math.round((proj.budget ?? 0) * 0.08));
    if (state.money < cost) return `Capital insuficiente (${cost.toLocaleString()} necessário)`;
    const fanGain = 500 + (proj.starRating ?? 3) * 300;
    const revBoostAdd = 0.08;
    const lifespanExt = 4;
    const next: ActiveGameState = {
      ...state,
      money: state.money - cost,
      fans: (state.fans ?? 0) + fanGain,
      gameProjects: (state.gameProjects ?? []).map((p) =>
        p.id === gameId
          ? {
              ...p,
              dlcCount: count + 1,
              revenueMultBonus: parseFloat(((p.revenueMultBonus ?? 1.0) + revBoostAdd).toFixed(4)),
              effectiveLifespan: (p.effectiveLifespan ?? 36) + lifespanExt,
            }
          : p
      ),
    };
    setState(next);
    persist(next);
    return null;
  }, [state, persist]);

  const stopSupport = useCallback((gameId: string): string | null => {
    if (!state) return "Nenhum jogo ativo";
    const proj = (state.gameProjects ?? []).find((p) => p.id === gameId);
    if (!proj) return "Jogo não encontrado";
    if (proj.phase !== "released") return "O jogo ainda não foi lançado";
    if (proj.supportActive === false) return "Suporte já encerrado";
    const next: ActiveGameState = {
      ...state,
      gameProjects: (state.gameProjects ?? []).map((p) =>
        p.id === gameId ? { ...p, supportActive: false } : p
      ),
    };
    setState(next);
    persist(next);
    return null;
  }, [state, persist]);

  const optimizeGame = useCallback((gameId: string): string | null => {
    if (!state) return "Nenhum jogo ativo";
    const proj = (state.gameProjects ?? []).find((p) => p.id === gameId);
    if (!proj) return "Jogo não encontrado";
    if (proj.phase !== "released") return "O jogo ainda não foi lançado";
    if (proj.gameOptimized) return "O jogo já foi otimizado";
    if (proj.pendingUpdateType) return "Aguarda a conclusão da atualização em andamento";
    const cost = 120_000;
    if (state.money < cost) return `Capital insuficiente ($${cost.toLocaleString()} necessário)`;

    // Polish bonus: 3–5 pts depending on current score.
    // Can push up to 4 pts above baseQualityScore (extra polish beyond original estimate).
    const currentScore = proj.receptionScore ?? 0;
    const base = proj.baseQualityScore ?? currentScore;
    const polishBonus = currentScore >= 80 ? 3 : currentScore >= 65 ? 4 : 5;
    const newScore = Math.min(base + 4, Math.round(currentScore + polishBonus));
    const newStars = newScore >= 85 ? 5 : newScore >= 70 ? 4 : newScore >= 54 ? 3 : newScore >= 38 ? 2 : 1;

    const next: ActiveGameState = {
      ...state,
      money: state.money - cost,
      gameProjects: (state.gameProjects ?? []).map((p) =>
        p.id === gameId
          ? {
              ...p,
              gameOptimized: true,
              effectiveLifespan: (p.effectiveLifespan ?? 36) + 8,
              revenueMultBonus: parseFloat(((p.revenueMultBonus ?? 1.0) + 0.08).toFixed(4)),
              receptionScore: newScore,
              starRating: newStars as GameProject["starRating"],
            }
          : p
      ),
    };
    setState(next);
    persist(next);
    return null;
  }, [state, persist]);

  const startHypeCampaign = useCallback((projectId: string): string | null => {
    if (!state) return "Nenhum jogo ativo";
    const proj = (state.gameProjects ?? []).find((p) => p.id === projectId);
    if (!proj) return "Projeto não encontrado";
    if (proj.phase === "released" || proj.phase === "cancelled") return "O jogo já foi lançado ou cancelado";
    if (proj.hypeCampaignActive) return "Campanha de hype já em andamento";
    const HYPE_CAMPAIGN_COST = 150_000;
    if (state.money < HYPE_CAMPAIGN_COST) return `Capital insuficiente ($${HYPE_CAMPAIGN_COST.toLocaleString()} necessário)`;
    const next: ActiveGameState = {
      ...state,
      money: state.money - HYPE_CAMPAIGN_COST,
      gameProjects: (state.gameProjects ?? []).map((p) =>
        p.id === projectId
          ? { ...p, hypeCampaignActive: true, hypeCampaignMonthsLeft: 3 }
          : p
      ),
    };
    setState(next);
    persist(next);
    return null;
  }, [state, persist]);

  const postLaunchAction = useCallback((projectId: string, actionType: PostLaunchActionType): string | null => {
    if (!state) return "Nenhum jogo ativo";
    const proj = (state.gameProjects ?? []).find((p) => p.id === projectId);
    if (!proj) return "Jogo não encontrado";
    if (proj.phase !== "released") return "O jogo ainda não foi lançado";
    if (proj.pendingUpdateType) return "Atualização já em andamento";
    if (proj.bugFixInProgress) return "Correção de bugs em andamento — aguarda a conclusão";
    const def = POST_LAUNCH_ACTIONS[actionType];
    if (!def) return "Ação inválida";
    if (def.minYear && state.year < def.minYear) return `Disponível a partir de ${def.minYear}`;
    const cost = computePostLaunchCost(proj.budget, actionType);
    if (state.money < cost) return `Capital insuficiente (precisa de $${cost.toLocaleString()})`;
    const next: ActiveGameState = {
      ...state,
      money: state.money - cost,
      gameProjects: (state.gameProjects ?? []).map((p) =>
        p.id === projectId
          ? { ...p, pendingUpdateType: actionType, updateMonthsLeft: def.months }
          : p
      ),
    };
    setState(next);
    persist(next);
    return null;
  }, [state, persist]);

  // ── Global Market ──────────────────────────────────────────────────────────

  const unlockCountry = useCallback((countryId: string): string | null => {
    if (!state) return "Nenhum jogo ativo";
    const country = getCountryById(countryId);
    if (!country) return "País não encontrado";
    if ((state.unlockedCountries ?? []).includes(countryId)) return "País já desbloqueado";
    const cost = getUnlockCost(country, state.year);
    if (state.money < cost) return `Capital insuficiente. Custo: $${cost.toLocaleString()}`;
    const next: ActiveGameState = {
      ...state,
      money: state.money - cost,
      unlockedCountries: [...(state.unlockedCountries ?? ["usa"]), countryId],
    };
    setState(next);
    persist(next);
    return null;
  }, [state, persist]);

  const openBranch = useCallback((countryId: string, type: BranchType): string | null => {
    if (!state) return "Nenhum jogo ativo";
    const country = getCountryById(countryId);
    if (!country) return "País não encontrado";
    if (!(state.unlockedCountries ?? []).includes(countryId)) return "Desbloqueia este mercado primeiro";
    const existing = (state.branches ?? []).find((b) => b.countryId === countryId);
    if (existing) return "Já tens uma filial neste país";

    // Branch unlock prerequisites: reputation + basic progression milestones
    const reputationStars = Math.floor(state.reputation / 20); // 0-5 stars
    if (reputationStars < 2) {
      const needed = 2 * 20 - state.reputation;
      return `Reconhecimento insuficiente!\n\nNecessário: ★★ (nível 2 estrelas)\nAtual: ${reputationStars} estrela${reputationStars !== 1 ? "s" : ""} (${Math.round(state.reputation)}%)\nFaltam ${Math.ceil(needed)} pontos de reputação.`;
    }
    const gamesReleased  = (state.gameProjects ?? []).filter((p) => p.phase === "released").length;
    const consolesBuilt  = (state.consoles ?? []).length;
    const fansOk         = (state.fans ?? 0) >= 5_000;
    const progressOk     = gamesReleased >= 1 || consolesBuilt >= 1;
    if (!progressOk) {
      return `Precisas de lançar pelo menos 1 jogo ou 1 console antes de abrir filiais internacionais.`;
    }
    if (!fansOk) {
      const needed = 5_000 - (state.fans ?? 0);
      return `Base de fãs insuficiente.\n\nNecessário: 5.000 fãs\nAtual: ${(state.fans ?? 0).toLocaleString()}\nFaltam ${needed.toLocaleString()} fãs.`;
    }

    const charBonusesBranch = getCharacterById(state.characterId ?? "strategist")?.bonuses;
    const branchMult = charBonusesBranch?.branchCostMult ?? 1;
    const setupCost = Math.round(getBranchCost(country, type) * branchMult);
    if (state.money < setupCost) return `Capital insuficiente. Custo de setup: $${setupCost.toLocaleString()}`;
    const branch: CountryBranch = {
      countryId,
      type,
      openedYear: state.year,
      openedMonth: state.month,
      monthlyCost: getBranchMonthlyMaintenance(country, type, state.year),
      monthlyRevenueBonus: Math.round(getBranchMonthlyMaintenance(country, type, state.year) * 1.5),
      employeeCount: type === "factory" ? 50 : type === "dev_studio" ? 20 : 5,
    };
    const next: ActiveGameState = {
      ...state,
      money: state.money - setupCost,
      branches: [...(state.branches ?? []), branch],
    };
    setState(next);
    persist(next);
    return null;
  }, [state, persist]);

  const closeBranch = useCallback((countryId: string) => {
    if (!state) return;
    const next: ActiveGameState = {
      ...state,
      branches: (state.branches ?? []).filter((b) => b.countryId !== countryId),
    };
    setState(next);
    persist(next);
  }, [state, persist]);

  // ── Financial ─────────────────────────────────────────────────────────────

  const takeLoan = useCallback((loanTypeId: string, amount: number): string | null => {
    if (!state) return "Nenhum jogo ativo";
    const loanType = LOAN_TYPES.find((l) => l.id === loanTypeId);
    if (!loanType) return "Tipo de empréstimo inválido";
    if (loanType.minYear > state.year) return `Disponível a partir de ${loanType.minYear}`;
    if (amount > loanType.maxAmount) return `Valor máximo: $${loanType.maxAmount.toLocaleString()}`;
    if (amount <= 0) return "Valor inválido";
    // Credit rating check
    const ratingOrder: string[] = ["AAA", "AA", "A", "BBB", "BB", "B", "CCC", "D"];
    const minIdx = ratingOrder.indexOf(loanType.minCreditRating);
    const currentIdx = ratingOrder.indexOf(state.creditRating ?? "BBB");
    if (currentIdx > minIdx) return `Rating de crédito insuficiente (mínimo: ${loanType.minCreditRating}, atual: ${state.creditRating})`;
    // Revenue multiplier cap
    const monthlyRevEst = (state.totalRevenue / Math.max(1, (state.year - 1972) * 12 + state.month)) || 50000;
    const maxByRevenue = monthlyRevEst * 12 * loanType.revenueMultiplierMax;
    if (amount > maxByRevenue) return `Limite baseado em receita: $${Math.round(maxByRevenue).toLocaleString()}`;
    const baseRate = calculateInterestRate(loanType, state.creditRating ?? "BBB", state.year);
    const charLoanMod = getCharacterById(state.characterId ?? "strategist")?.bonuses?.loanInterestMod ?? 0;
    const rate = Math.max(0.001, baseRate + charLoanMod);
    const loan = createLoan(loanType, amount, rate, state.year, state.month);
    const next: ActiveGameState = {
      ...state,
      money: state.money + amount,
      activeLoans: [...(state.activeLoans ?? []), loan],
    };
    setState(next);
    persist(next);
    return null;
  }, [state, persist]);

  // ── Stock market & acquisitions ────────────────────────────────────────────

  const sellShares = useCallback((percent: number): string | null => {
    if (!state) return "Nenhum jogo ativo";
    if (percent <= 0 || percent > 100) return "Percentagem inválida";
    const sharesToSell = Math.round((percent / 100) * TOTAL_SHARES);
    const currentPlayerShares = state.playerShares ?? TOTAL_SHARES;
    if (sharesToSell > currentPlayerShares) return "Não tens ações suficientes para vender";
    const minPlayerShares = Math.round(TOTAL_SHARES * 0.10); // keep at least 10%
    if (currentPlayerShares - sharesToSell < minPlayerShares) return "Não podes vender menos de 10% da empresa. Deve manter controlo mínimo.";
    const saleValue = Math.round(sharesToSell * (state.sharePrice ?? 1));
    if (saleValue <= 0) return "Empresa ainda sem valor suficiente para vender ações";
    const next: ActiveGameState = {
      ...state,
      money: state.money + saleValue,
      playerShares: currentPlayerShares - sharesToSell,
    };
    setState(next);
    persist(next);
    return null;
  }, [state, persist]);

  const buyBackShares = useCallback((percent: number): string | null => {
    if (!state) return "Nenhum jogo ativo";
    const currentPlayerShares = state.playerShares ?? TOTAL_SHARES;
    const totalShares = state.totalShares ?? TOTAL_SHARES;
    const investorShares = totalShares - currentPlayerShares;
    if (investorShares <= 0) return "Já possuis 100% das ações";
    const sharesToBuy = Math.round((percent / 100) * totalShares);
    const actualBuy = Math.min(sharesToBuy, investorShares);
    // Dynamic premium: profitable companies demand higher buyback premium
    const approxMonthlyProfit = state.money > 0 ? Math.round(state.totalRevenue / Math.max(1, (state.year - 1972) * 12 + state.month)) : 0;
    const buybackPremium = getBuybackPremium(approxMonthlyProfit);
    const cost = Math.round(actualBuy * (state.sharePrice ?? 1) * buybackPremium);
    if (state.money < cost) return `Capital insuficiente. Custo de recompra: $${cost.toLocaleString()} (prémio ×${buybackPremium.toFixed(2)} por empresa lucrativa)`;
    const next: ActiveGameState = {
      ...state,
      money: state.money - cost,
      playerShares: currentPlayerShares + actualBuy,
    };
    setState(next);
    persist(next);
    return null;
  }, [state, persist]);

  const createStockListing = useCallback((percent: number, minAskPerShare: number): string | null => {
    if (!state) return "Nenhum jogo ativo";
    if (percent <= 0 || percent > 90) return "Percentagem deve ser entre 1% e 90%";
    const currentPlayerShares = state.playerShares ?? TOTAL_SHARES;
    const minRetain = Math.round(TOTAL_SHARES * 0.10);
    const sharesToList = Math.round((percent / 100) * TOTAL_SHARES);
    if (currentPlayerShares - sharesToList < minRetain) {
      return `Não podes listar estas ações — ficarias com menos de 10% de controlo`;
    }
    const existingListings = state.stockListings ?? [];
    const totalListedPct = existingListings.reduce((s, l) => s + l.percentForSale, 0);
    if (totalListedPct + percent > 80) return "Já tens demasiadas ações listadas para venda";
    if (existingListings.length >= 3) return "Máximo de 3 listagens simultâneas";
    const listing: StockListing = {
      id: `listing_${Date.now()}`,
      percentForSale: percent,
      minAskPerShare: Math.max(0.01, minAskPerShare),
      listedYear: state.year,
      listedMonth: state.month,
      bids: [],
    };
    const next: ActiveGameState = {
      ...state,
      stockListings: [...existingListings, listing],
    };
    setState(next);
    persist(next);
    return null;
  }, [state, persist]);

  const cancelStockListing = useCallback((listingId: string): void => {
    if (!state) return;
    const next: ActiveGameState = {
      ...state,
      stockListings: (state.stockListings ?? []).filter((l) => l.id !== listingId),
    };
    setState(next);
    persist(next);
  }, [state, persist]);

  const acceptStockBid = useCallback((listingId: string, bidId: string): string | null => {
    if (!state) return "Nenhum jogo ativo";
    const listing = (state.stockListings ?? []).find((l) => l.id === listingId);
    if (!listing) return "Listagem não encontrada";
    const bid = listing.bids.find((b) => b.id === bidId);
    if (!bid) return "Lance não encontrado";
    const currentPlayerShares = state.playerShares ?? TOTAL_SHARES;
    const sharesToSell = Math.round((listing.percentForSale / 100) * TOTAL_SHARES);
    const minPlayerShares = Math.round(TOTAL_SHARES * 0.10);
    if (currentPlayerShares - sharesToSell < minPlayerShares) {
      return "Aceitar este lance deixaria-te com menos de 10% da empresa";
    }
    // Create investor record
    const investor: Investor = {
      id: `inv_${Date.now()}`,
      name: bid.investorName,
      country: bid.country,
      countryFlag: bid.countryFlag,
      personality: bid.personality,
      sharesOwned: sharesToSell,
      dealYear: state.year,
      dealMonth: state.month,
    };
    const next: ActiveGameState = {
      ...state,
      money: state.money + bid.totalOffer,
      playerShares: currentPlayerShares - sharesToSell,
      investors: [...(state.investors ?? []), investor],
      // Remove the accepted listing; keep others
      stockListings: (state.stockListings ?? []).filter((l) => l.id !== listingId),
    };
    setState(next);
    persist(next);
    return null;
  }, [state, persist]);

  const rejectStockBid = useCallback((listingId: string, bidId: string): void => {
    if (!state) return;
    const next: ActiveGameState = {
      ...state,
      stockListings: (state.stockListings ?? []).map((l) => {
        if (l.id !== listingId) return l;
        return { ...l, bids: l.bids.filter((b) => b.id !== bidId) };
      }),
    };
    setState(next);
    persist(next);
  }, [state, persist]);

  const acceptOffer = useCallback((offerId: string): string | null => {
    if (!state) return "Nenhum jogo ativo";
    const offer = (state.pendingOffers ?? []).find((o) => o.id === offerId);
    if (!offer) return "Oferta não encontrada";
    const currentPlayerShares = state.playerShares ?? TOTAL_SHARES;
    const sharesToSell = Math.round((offer.desiredSharePercent / 100) * TOTAL_SHARES);
    if (sharesToSell > currentPlayerShares - Math.round(TOTAL_SHARES * 0.10)) {
      return "Aceitar esta oferta deixaria-te com menos de 10% da empresa";
    }
    const investor: Investor = {
      id:           `inv_${Date.now()}`,
      name:         offer.investorName,
      country:      offer.country,
      countryFlag:  offer.countryFlag,
      personality:  offer.personality,
      sharesOwned:  sharesToSell,
      dealYear:     state.year,
      dealMonth:    state.month,
    };
    const next: ActiveGameState = {
      ...state,
      money:          state.money + offer.offerAmount,
      playerShares:   currentPlayerShares - sharesToSell,
      investors:      [...(state.investors ?? []), investor],
      pendingOffers:  (state.pendingOffers ?? []).filter((o) => o.id !== offerId),
    };
    setState(next);
    persist(next);
    return null;
  }, [state, persist]);

  const rejectOffer = useCallback((offerId: string): void => {
    if (!state) return;
    const next: ActiveGameState = {
      ...state,
      pendingOffers: (state.pendingOffers ?? []).filter((o) => o.id !== offerId),
    };
    setState(next);
    persist(next);
  }, [state, persist]);

  const buyAcquisition = useCallback((acquisitionId: string): string | null => {
    if (!state) return "Nenhum jogo ativo";
    const already = (state.acquisitions ?? []).find((a) => a.id === acquisitionId);
    if (already) return "Já possuis esta empresa";
    const template = ACQUIRABLE_COMPANIES.find((c) => c.id === acquisitionId);
    if (!template) return "Empresa não encontrada";
    if (state.year < template.availableFromYear) return `Esta empresa só está disponível a partir de ${template.availableFromYear}`;
    if (state.money < template.purchasePrice) return `Capital insuficiente. Custo: $${template.purchasePrice.toLocaleString()}`;
    const acquisition: Acquisition = {
      ...template,
      purchasedYear:  state.year,
      purchasedMonth: state.month,
    };
    const next: ActiveGameState = {
      ...state,
      money:        state.money - template.purchasePrice,
      acquisitions: [...(state.acquisitions ?? []), acquisition],
      reputation:   Math.min(100, state.reputation + template.reputationBonus),
    };
    setState(next);
    persist(next);
    return null;
  }, [state, persist]);

  const sellAcquisition = useCallback((acquisitionId: string): void => {
    if (!state) return;
    const acq = (state.acquisitions ?? []).find((a) => a.id === acquisitionId);
    if (!acq) return;
    const { salePrice, gainLoss, isProfit } = computeAcquisitionResaleInfo(
      acq,
      state.year,
      state.reputation,
      state.marketShare ?? 0,
    );
    const gainStr = isProfit
      ? `Lucro de ${formatMoney(gainLoss)}`
      : `Prejuízo de ${formatMoney(Math.abs(gainLoss))}`;
    const saleNews = {
      id:             `sell_acq_${acquisitionId}_${state.year}_${state.month}`,
      year:           state.year,
      month:          state.month,
      category:       "growth" as const,
      title:          `📤 Empresa Vendida: ${acq.name}`,
      body:           `${acq.name} foi vendida por ${formatMoney(salePrice)}. ${gainStr} em relação ao preço de aquisição.`,
      moneyDelta:     salePrice,
      fansDelta:      0,
      reputationDelta: -Math.round(acq.reputationBonus * 0.4),
      isRead:         false,
    };
    const next: ActiveGameState = {
      ...state,
      money:        state.money + salePrice,
      acquisitions: (state.acquisitions ?? []).filter((a) => a.id !== acquisitionId),
      reputation:   Math.max(0, state.reputation - Math.round(acq.reputationBonus * 0.4)),
      newsItems:    [saleNews, ...(state.newsItems ?? [])].slice(0, 60),
    };
    setState(next);
    persist(next);
  }, [state, persist]);

  const investInSponsorship = useCallback((
    opportunityId: string,
    amount: number,
  ): { success: boolean; profit: number; message: string } => {
    if (!state) return { success: false, profit: 0, message: "Estado não disponível" };
    const opp = (state.sponsorshipOpportunities ?? []).find((o) => o.id === opportunityId);
    if (!opp) return { success: false, profit: 0, message: "Oportunidade não encontrada ou já expirada" };
    if (amount <= 0 || amount > opp.maxInvestment) return { success: false, profit: 0, message: `Valor inválido. Máximo: ${formatMoney(opp.maxInvestment)}` };
    if (state.money < amount) return { success: false, profit: 0, message: `Capital insuficiente. Necessário: ${formatMoney(amount)}` };

    // Win probability: base + reputation boost + market share boost
    const repBonus = (state.reputation - 50) * 0.003;
    const mktBonus = ((state.marketShare ?? 0) - 15) * 0.002;
    const winChance = Math.max(0.25, Math.min(0.75, opp.winChanceBase + repBonus + mktBonus));

    let profit = 0;
    let message = "";
    if (Math.random() < winChance) {
      // Win: +1% to maxProfitPct of investment
      const pct = 0.01 + Math.random() * (opp.maxProfitPct - 0.01);
      profit = Math.round(amount * pct);
      message = `✅ Patrocínio bem-sucedido! Retorno de ${formatMoney(profit)} (+${(pct * 100).toFixed(1)}%) no evento "${opp.title}".`;
    } else {
      // Loss: -1% to maxLossPct of investment
      const pct = 0.01 + Math.random() * (opp.maxLossPct - 0.01);
      profit = -Math.round(amount * pct);
      message = `❌ Patrocínio com resultado negativo. Perda de ${formatMoney(Math.abs(profit))} (${(pct * 100).toFixed(1)}%) no evento "${opp.title}".`;
    }

    const newsItem = {
      id:             `spons_result_${opportunityId}_${state.year}_${state.month}`,
      year:           state.year,
      month:          state.month,
      category:       profit >= 0 ? ("growth" as const) : ("crisis" as const),
      title:          profit >= 0 ? `💰 Patrocínio Lucrativo: ${opp.title}` : `📉 Patrocínio com Prejuízo: ${opp.title}`,
      body:           message,
      moneyDelta:     profit - amount,
      fansDelta:      profit >= 0 ? Math.floor(Math.random() * 200 + 50) : 0,
      reputationDelta: profit >= 0 ? 1 : -1,
      isRead:         false,
    };

    const next: ActiveGameState = {
      ...state,
      money: state.money - amount + profit,
      sponsorshipOpportunities: (state.sponsorshipOpportunities ?? []).filter((o) => o.id !== opportunityId),
      newsItems: [newsItem, ...(state.newsItems ?? [])].slice(0, 60),
    };
    setState(next);
    persist(next);
    return { success: true, profit, message };
  }, [state, persist]);

  // ── Rival company acquisition ─────────────────────────────────────────────
  const acquireRival = useCallback((rivalId: string): { success: boolean; error?: string } => {
    if (!state) return { success: false, error: "Estado não disponível" };

    const rival = (state.competitors ?? []).find((c) => c.id === rivalId);
    if (!rival) return { success: false, error: "Rival não encontrado" };
    if (rival.acquiredByPlayer) return { success: false, error: "Esta empresa já foi adquirida" };

    const isBankrupt = rival.alive === false;

    const price = rival.acquisitionPrice ?? 0;
    if (price <= 0) return { success: false, error: "Preço de aquisição não disponível" };
    if ((state.money ?? 0) < price) {
      return { success: false, error: `Fundos insuficientes. Precisas de ${formatMoney(price)}.` };
    }

    // Success probability: bankrupt = high, critical = medium, struggling = lower, healthy = hard
    const health = rival.financialHealth ?? (isBankrupt ? "bankrupt" : "healthy");
    const baseChance =
      health === "bankrupt"   ? 0.92 :
      health === "critical"   ? 0.72 :
      health === "struggling" ? 0.50 : 0.18;

    const repBonus     = (state.reputation - 50) / 500;              // ±0.1
    const aggrPenalty  = (rival.aggressiveness ?? 50) / 1000;        // 0–0.1
    const negotiFactor = (Math.random() - 0.5) * 0.20;               // ±0.1 random
    // Player market dominance makes rivals more nervous (easier to convince)
    const marketPressure = Math.max(-0.10, Math.min(0.15,
      ((state.marketShare ?? 0) - (rival.marketShare ?? 5)) / 80,
    ));
    // Flush with cash signals serious buying intent (slight bonus)
    const cashFactor = (state.money ?? 0) >= price * 2.5 ? 0.08 : 0;
    const finalChance  = Math.max(0.05, Math.min(0.95,
      baseChance + repBonus - aggrPenalty + negotiFactor + marketPressure + cashFactor,
    ));

    if (Math.random() >= finalChance) {
      return { success: false, error: `${rival.name} recusou a oferta. Tenta novamente ou espera que enfraqueçam mais.` };
    }

    // On success: absorb market share, gain innovation & reputation boost, mark as acquired
    const shareGain   = isBankrupt
      ? (rival.marketShare ?? 0) * 0.50
      : (rival.marketShare ?? 0) * 0.65;
    const innovGain   = Math.round((rival.innovation ?? 50) * 0.15);
    const repGain     = Math.round((rival.reputation  ?? 50) * 0.08);

    const acquisitionNews = {
      id: `acquire_${rivalId}_${state.year}_${state.month}`,
      year: state.year, month: state.month,
      category: "competitor" as const,
      title: `🤝 ${rival.name} adquirida com sucesso`,
      body: `A ${state.companyName} comprou ${rival.name} por ${formatMoney(price)}. Absorveste ${shareGain.toFixed(1)}% de mercado, +${innovGain} inovação e +${repGain} reputação.`,
      moneyDelta: 0, fansDelta: 0, reputationDelta: repGain, isRead: false,
    };

    const next: ActiveGameState = {
      ...state,
      money:      state.money - price,
      marketShare: Math.min(80, (state.marketShare ?? 0) + shareGain),
      reputation:  Math.min(100, (state.reputation  ?? 50) + repGain),
      news: [acquisitionNews, ...(state.news ?? [])],
      competitors: state.competitors.map((c) =>
        c.id === rivalId
          ? { ...c, alive: false, isAcquirable: false, acquiredByPlayer: true, marketShare: 0 }
          : c,
      ),
    };
    setState(next);
    persist(next);
    return { success: true };
  }, [state, persist]);

  const executePlayerAttack = useCallback((rivalId: string, attackType: PlayerAttackType): { error: string | null; outcomeLabel: string | null; outcomeColor: string | null } => {
    if (!state) return { error: "Nenhum jogo ativo", outcomeLabel: null, outcomeColor: null };

    // Unlock check: need ≥1 console OR ≥2 games released
    const consolesBuilt   = (state.consoles ?? []).length;
    const gamesReleased   = (state.gameProjects ?? []).filter((p) => p.phase === "released").length;
    if (consolesBuilt < 1 && gamesReleased < 2) {
      return { error: "Sistema de ataques bloqueado. Lance pelo menos 1 console ou 2 jogos primeiro.", outcomeLabel: null, outcomeColor: null };
    }

    const rival = (state.competitors ?? []).find((c) => c.id === rivalId);
    if (!rival) return { error: "Rival não encontrado", outcomeLabel: null, outcomeColor: null };
    if (!rival.alive) return { error: "Esta empresa já faliu", outcomeLabel: null, outcomeColor: null };

    const def = PLAYER_ATTACKS[attackType];
    if (!def) return { error: "Tipo de ataque inválido", outcomeLabel: null, outcomeColor: null };

    // Cooldown check
    const currentMonthIdx = state.year * 12 + state.month;
    const cooldowns = state.playerAttackCooldowns ?? {};
    const nextAllowed = cooldowns[attackType] ?? 0;
    if (currentMonthIdx < nextAllowed) {
      const monthsLeft = nextAllowed - currentMonthIdx;
      return { error: `Ataque em cooldown — disponível em ${monthsLeft} mês${monthsLeft !== 1 ? "es" : ""}`, outcomeLabel: null, outcomeColor: null };
    }

    // Cost check
    if (state.money < def.cost) {
      return { error: `Capital insuficiente (precisa de $${def.cost.toLocaleString()})`, outcomeLabel: null, outcomeColor: null };
    }

    // Roll outcome
    const score  = computePlayerAttackScore(attackType, state.reputation, rival);
    const tier   = rollPlayerAttackOutcome(score);
    const effects = PLAYER_ATTACK_OUTCOMES[attackType][tier];

    // Apply effects to rival
    const updatedCompetitors = (state.competitors ?? []).map((c) => {
      if (c.id !== rivalId) return c;
      return {
        ...c,
        reputation:  Math.min(100, Math.max(0, (c.reputation ?? 50) + effects.rivalRepDelta)),
        marketShare: Math.max(2, (c.marketShare ?? 10) + effects.rivalMarketShareDelta),
        money:       Math.max(0, (c.money ?? 1_000_000) + effects.rivalMoneyDelta),
        innovation:  Math.max(10, Math.min(100, (c.innovation ?? 60) + effects.rivalInnovationDelta)),
      };
    });

    // Apply effects to player
    const newRep   = Math.min(100, Math.max(0, state.reputation + effects.playerRepDelta));
    const newFans  = Math.max(0, state.fans + effects.fanStealed);

    // Schedule counter-attack if triggered and rival is aggressive enough
    const newPending = [...(state.pendingCounterAttacks ?? [])];
    if (effects.triggerCounterAttack && (rival.aggressiveness ?? 50) >= 45) {
      const counterStrength = effects.counterAttackStrength > 0
        ? Math.min(3, effects.counterAttackStrength + (rival.aggressiveness >= 80 ? 1 : 0))
        : 1;
      const counterAttack: PendingCounterAttack = {
        rivalId:         rival.id,
        rivalName:       rival.name,
        rivalColor:      rival.color,
        strength:        counterStrength,
        executeMonthIdx: currentMonthIdx + (effects.counterAttackDelay || 1),
      };
      newPending.push(counterAttack);
    }

    const next: ActiveGameState = {
      ...state,
      money:       state.money - def.cost,
      reputation:  newRep,
      fans:        newFans,
      competitors: updatedCompetitors,
      playerAttackCooldowns: {
        ...cooldowns,
        [attackType]: currentMonthIdx + def.cooldownMonths,
      },
      pendingCounterAttacks: newPending,
    };
    setState(next);
    persist(next);
    return { error: null, outcomeLabel: effects.label, outcomeColor: effects.color };
  }, [state, persist]);

  // ── Shadow Investor ───────────────────────────────────────────────────────────
  const pendingShadowOffer = !!(state?.shadowInvestor?.pending);
  const pendingShadowCollection: { title: string; amount: number } | null =
    state?.shadowInvestor?.collectionDue
      ? { title: state.shadowInvestor.collectionTitle || "A Conta Chegou", amount: state.shadowInvestor.debtAmount }
      : null;

  const respondToShadowInvestor = useCallback((accept: boolean, dealType?: ShadowDealType) => {
    if (!state) return;
    const si = state.shadowInvestor;
    if (!si?.pending) return;
    const currentMonthIdx = state.year * 12 + state.month;

    if (!accept) {
      const next = {
        ...state,
        shadowInvestor: {
          ...si,
          pending: false,
          cooldownUntilMonthIdx: currentMonthIdx + 6,
        } as ShadowInvestorState,
      };
      setState(next);
      persist(next);
      return;
    }

    const usedCount = si.usedCount + 1;
    const bailout = Math.round(Math.abs(state.money) + 400_000 + usedCount * 150_000);
    const chosenDeal: ShadowDealType = dealType ?? "debt";

    let equityPercent = 0;
    let equityDrainPerMonth = 0;
    let debtAmount = 0;
    let performanceMonthsLeft = 0;

    if (chosenDeal === "equity") {
      equityPercent = 15 + Math.floor(Math.random() * 16); // 15–30%
      equityDrainPerMonth = Math.round(bailout * 0.003);   // 0.3%/month
    } else if (chosenDeal === "debt") {
      debtAmount = Math.round(bailout * 1.3);              // 30% interest
    } else {
      performanceMonthsLeft = 12;
    }

    const next = {
      ...state,
      money: state.money + bailout,
      shadowInvestor: {
        ...si,
        pending: false,
        dealType: chosenDeal,
        bailoutAmount: bailout,
        debtAmount,
        equityPercent,
        equityDrainPerMonth,
        performanceMonthsLeft,
        usedCount,
        cooldownUntilMonthIdx: currentMonthIdx + 36,
      } as ShadowInvestorState,
    };
    setState(next);
    persist(next);
  }, [state, persist]);

  const dismissShadowCollection = useCallback(() => {
    if (!state) return;
    const si = state.shadowInvestor;
    if (!si?.collectionDue) return;
    const currentMonthIdx = state.year * 12 + state.month;
    const next = {
      ...state,
      money: Math.max(state.money - si.debtAmount, state.money * 0.1), // cap loss to 90%
      shadowInvestor: {
        ...si,
        collectionDue: false,
        dealType: null,
        debtAmount: 0,
        bailoutAmount: 0,
        cooldownUntilMonthIdx: currentMonthIdx + 30,
      } as ShadowInvestorState,
    };
    setState(next);
    persist(next);
  }, [state, persist]);

  const shareholderMeetingDecision = useCallback((decision: "dividends" | "reinvest" | "promise"): string | null => {
    if (!state) return "Estado de jogo não disponível.";
    const investors = state.investors ?? [];
    if (investors.length === 0) return "Não há acionistas externos. Venda participações antes de convocar reuniões.";
    const currentMonthIdx = state.year * 12 + state.month;
    const COOLDOWN_MONTHS = 6;
    const lastMeeting = state.lastShareholderMeetingMonthIdx ?? -999;
    if (currentMonthIdx - lastMeeting < COOLDOWN_MONTHS) {
      const remaining = COOLDOWN_MONTHS - (currentMonthIdx - lastMeeting);
      return `Reunião em cooldown. Próxima disponível em ${remaining} mês${remaining !== 1 ? "es" : ""}.`;
    }
    const investorOwnershipPct = ((state.totalShares ?? TOTAL_SHARES) - (state.playerShares ?? TOTAL_SHARES)) / TOTAL_SHARES;
    let moneyDelta  = 0;
    let repDelta    = 0;
    let satDelta    = 0;
    let promisePending = false;
    if (decision === "dividends") {
      const dividendCost = Math.max(200_000, Math.round((state.companyValue ?? 0) * investorOwnershipPct * 0.005));
      if (state.money < dividendCost) return `Caixa insuficiente para pagar dividendos. Necessário: ${Math.round(dividendCost / 1000)}K.`;
      moneyDelta = -dividendCost;
      repDelta   = 2;
      satDelta   = 22;
    } else if (decision === "reinvest") {
      repDelta = 1;
      satDelta = -5;
    } else if (decision === "promise") {
      repDelta      = 3;
      satDelta      = 15;
      promisePending = true;
    }
    const newSat = Math.max(0, Math.min(100, (state.shareholderSatisfaction ?? 70) + satDelta));
    const next: ActiveGameState = {
      ...state,
      money:                          state.money + moneyDelta,
      reputation:                     Math.min(100, Math.round((state.reputation + repDelta) * 10) / 10),
      shareholderSatisfaction:        newSat,
      lastShareholderMeetingMonthIdx: currentMonthIdx,
      shareholderPromisePending:      promisePending,
    };
    setState(next);
    persist(next);
    return null;
  }, [state, persist]);

  const negotiateGeoConflict = useCallback((): string | null => {
    if (!state) return "Estado de jogo não disponível.";
    const investors = state.investors ?? [];
    if (investors.length < 2) return "Sem conflitos geopolíticos ativos entre acionistas.";
    const pairs = detectInvestorConflicts(investors);
    const level = getMaxConflictLevel(pairs);
    if (!level) return "Não existem tensões geopolíticas entre os acionistas neste momento.";
    if ((state.geoConflictNegotiationMonthsLeft ?? 0) > 0)
      return `Negociação já em curso. Tempo restante: ${state.geoConflictNegotiationMonthsLeft} mês${(state.geoConflictNegotiationMonthsLeft ?? 0) !== 1 ? "es" : ""}.`;
    const cost = getConflictNegotiationCost(level);
    if (state.money < cost) return `Capital insuficiente para negociar. Necessário: $${Math.round(cost / 1000)}K.`;
    const months = level === "high" ? 6 : level === "medium" ? 4 : 2;
    const next: ActiveGameState = {
      ...state,
      money: state.money - cost,
      geoConflictNegotiationMonthsLeft: months,
    };
    setState(next);
    persist(next);
    return null;
  }, [state, persist]);

  const buyLocalHolding = useCallback((id: string, price: number): string | null => {
    if (!state) return "Estado inválido.";
    const current = state.localHoldings ?? [];
    if (current.includes(id)) return "Empresa já adquirida.";
    if (current.length >= 4) return "Limite de 4 holdings atingido.";
    if (state.money < price) return "Dinheiro insuficiente para esta aquisição.";
    let updatedNews = state.news;
    if (id === "law_firm") {
      updatedNews = state.news.map((n) =>
        n.isAttack && !n.attackResponse
          ? { ...n, isRead: true, attackResponse: "auto" as const,
              body: n.body + "\n\n🏛️ A Silva & Associados Jurídico geriu este ataque automaticamente após a contratação." }
          : n
      );
    }
    const next: ActiveGameState = { ...state, money: state.money - price, localHoldings: [...current, id], news: updatedNews };
    setState(next);
    persist(next);
    return null;
  }, [state, persist]);

  const sellLocalHolding = useCallback((id: string): void => {
    if (!state) return;
    const next: ActiveGameState = {
      ...state,
      localHoldings: (state.localHoldings ?? []).filter((h) => h !== id),
    };
    setState(next);
    persist(next);
  }, [state, persist]);

  const hireLegalContract = useCallback((tierId: LegalTierId): string | null => {
    if (!state) return "Estado do jogo não carregado.";
    const existing = state.legalContract;
    const monthIdx = state.year * 12 + state.month;
    if (existing && monthIdx < existing.endMonthIdx) {
      return "Já existe um contrato jurídico ativo. Aguarde o término para contratar um novo.";
    }
    const monthlyCost = LEGAL_CONTRACT_MONTHLY_COST[tierId];
    if (state.money < monthlyCost * 2) {
      return `Fundos insuficientes. Você precisa de pelo menos ${(monthlyCost * 2).toLocaleString("pt-BR", { style: "currency", currency: "USD" })} para iniciar o contrato.`;
    }
    const duration = LEGAL_CONTRACT_DURATIONS[tierId];
    const newContract: LegalContract = {
      tierId,
      startMonthIdx: monthIdx,
      endMonthIdx: monthIdx + duration,
      renewalPending: false,
    };
    const next: ActiveGameState = {
      ...state,
      money: state.money - monthlyCost,
      legalContract: newContract,
    };
    setState(next);
    persist(next);
    return null;
  }, [state, persist]);

  const cancelLegalContract = useCallback((): void => {
    if (!state) return;
    const next: ActiveGameState = { ...state, legalContract: undefined };
    setState(next);
    persist(next);
  }, [state, persist]);

  const setStrategyOption = useCallback((id: string, category: StrategyCategory): string | null => {
    if (!state) return "Estado não disponível";
    const existing = state.activeStrategyOptions ?? [];
    const totalActive = existing.length;
    const hasCategory = existing.some((o) => o.category === category);
    // Replacing the same category doesn't change total count, but adding a new one would
    if (!hasCategory && totalActive >= 2) {
      return "Limite de 2 opções estratégicas ativas atingido. Limpa uma antes de continuar.";
    }
    const monthIdx = state.year * 12 + state.month;
    const newOption: ActiveStrategyOption = {
      id,
      category,
      startMonthIdx: monthIdx,
      endMonthIdx: monthIdx + STRATEGY_OPTION_DURATION_MONTHS,
    };
    const updated = [
      ...existing.filter((o) => o.category !== category),
      newOption,
    ];
    const next: ActiveGameState = { ...state, activeStrategyOptions: updated };
    setState(next);
    persist(next);
    return null;
  }, [state, persist]);

  const clearStrategyOption = useCallback((category: StrategyCategory): void => {
    if (!state) return;
    const updated = (state.activeStrategyOptions ?? []).filter((o) => o.category !== category);
    const next: ActiveGameState = { ...state, activeStrategyOptions: updated };
    setState(next);
    persist(next);
  }, [state, persist]);

  // ── Financial Rescue System ─────────────────────────────────────────────────
  const pendingRescueOffer = !!(state?.rescueOffer?.pending);
  const rescueOffer: RescueOfferState | null = state?.rescueOffer ?? null;
  const rescueContract: ActiveRescueContract | null = state?.rescueContract ?? null;

  const acceptRescueOffer = useCallback((dealType: RescueDealType): void => {
    if (!state?.rescueOffer) return;
    const offer = state.rescueOffer;
    let contract: ActiveRescueContract;

    // Select collateral: up to 3 branch IDs + up to 2 released game IDs
    const collateralBranchIds = (state.branches ?? []).slice(0, 3).map((b) => b.id);
    const collateralGameIds   = (state.gameProjects ?? [])
      .filter((p) => p.phase === "released")
      .slice(0, 2)
      .map((p) => p.id);

    if (dealType === "bank") {
      const bankContract: BankRescueContract = {
        dealType: "bank",
        amount:          offer.amount,
        totalOwed:       offer.bankTotalOwed,
        monthlyPayment:  offer.bankMonthlyPayment,
        monthsTotal:     offer.bankMonths,
        monthsRemaining: offer.bankMonths,
        missedPayments:  0,
        collateralBranchIds,
        collateralGameIds,
        seized: false,
      };
      contract = bankContract;
    } else if (dealType === "investor_equity") {
      const eqContract: InvestorEquityRescueContract = {
        dealType: "investor_equity",
        amount:        offer.amount,
        equityPercent: offer.investorEquityPercent,
        monthlyDrain:  offer.investorEquityDrain,
      };
      contract = eqContract;
    } else {
      const rvContract: InvestorRevenueRescueContract = {
        dealType: "investor_revenue",
        amount:              offer.amount,
        revenueSharePercent: offer.investorRevSharePercent,
        totalOwed:           offer.investorRevShareOwed,
        amountRepaid:        0,
      };
      contract = rvContract;
    }

    const newMoney = state.money + offer.amount;
    const clearedOffer: RescueOfferState = { ...offer, pending: false };
    const next: ActiveGameState = {
      ...state,
      money:          newMoney,
      rescueOffer:    clearedOffer,
      rescueContract: contract,
    };
    setState(next);
    persist(next);
  }, [state, persist]);

  const dismissRescueOffer = useCallback((): void => {
    if (!state?.rescueOffer) return;
    const clearedOffer: RescueOfferState = { ...state.rescueOffer, pending: false };
    const next: ActiveGameState = { ...state, rescueOffer: clearedOffer };
    setState(next);
    persist(next);
  }, [state, persist]);

  return (
    <GameplayContext.Provider value={{
      state, loadGame, unloadGame, advanceTime,
      buildConsole, discontinueConsole, cancelConsoleDev, upgradeOffice,
      launchMarketing, markNewsRead, deleteNews, deleteReadNews, deleteAllNews, respondToAttack, respondToScandal, hireInfluencer, pendingScandal, saveGame,
      hireEmployee, fireEmployee, retrainEmployee,
      startResearch, unlockEraUpgrade, startGameProject, cancelGameProject, fixBugs, startHypeCampaign, postLaunchAction, startScoreRecovery,
      releaseDLC, stopSupport, optimizeGame,
      executePlayerAttack,
      unlockCountry, openBranch, closeBranch, expandStores,
      takeLoan,
      sellShares, buyBackShares, acceptOffer, rejectOffer,
      createStockListing, cancelStockListing, acceptStockBid, rejectStockBid,
      buyAcquisition, sellAcquisition, acquireRival, investInSponsorship,
      pendingShadowOffer, pendingShadowCollection, respondToShadowInvestor, dismissShadowCollection,
      shareholderMeetingDecision,
      negotiateGeoConflict,
      buyLocalHolding, sellLocalHolding,
      hireLegalContract, cancelLegalContract,
      setStrategyOption, clearStrategyOption,
      pendingRescueOffer, rescueOffer, rescueContract,
      acceptRescueOffer, dismissRescueOffer,
      updateConsolePrice, setConsolePricingStrategy, relaunchConsole, setConsoleProductionState,
      bulkHireEmployee, upgradeOfficeCapacity,
    }}>
      {children}
    </GameplayContext.Provider>
  );
}

export function useGameplay() {
  return useContext(GameplayContext);
}
