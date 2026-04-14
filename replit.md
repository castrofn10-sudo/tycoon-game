# MEGACORP - Tycoon Game

## Overview
MEGACORP is a mobile tycoon game built with Expo React Native. Players manage a game development company, building consoles, developing games, managing employees, and competing in the global market. The game features multiple eras of gaming history.

## Tech Stack
- **Framework**: Expo (SDK 54) with React Native
- **Routing**: Expo Router (file-based routing)
- **Language**: TypeScript
- **Package Manager**: pnpm
- **State Management**: React Context + AsyncStorage (for persistence)
- **Data Fetching**: @tanstack/react-query
- **Styling**: React Native StyleSheet

## Project Structure
```
app/                    # Expo Router screens
  _layout.tsx           # Root layout
  index.tsx             # Main menu
  intro.tsx             # Game intro
  new-game.tsx          # New game setup
  continue.tsx          # Continue game
  settings.tsx          # Settings
  tutorial.tsx          # Tutorial
  credits.tsx           # Credits
  game/                 # Main game screens
    index.tsx           # Game hub
    game-dev.tsx        # Game development
    consoles.tsx        # Console management
    console-builder.tsx # Build consoles
    employees.tsx       # Employee management
    finances.tsx        # Financial overview
    marketing.tsx       # Marketing
    market.tsx          # Market data
    research.tsx        # Research tree
    offices.tsx         # Office management
    metrics.tsx         # Game metrics
    achievements.tsx    # Achievements
    trophies.tsx        # Trophies
    history.tsx         # Company history
    news.tsx            # Industry news
    world-map.tsx       # Global offices map
  online/               # Online/multiplayer screens
components/             # Shared UI components
constants/              # Game constants and logic
  gameEngine.ts         # Core game engine
  gameEconomics.ts      # Economic calculations
  gameTrends.ts         # Market trend simulation
  strategyTree.ts       # Research/strategy tree
  finances.ts           # Financial systems
  employees.ts          # Employee systems
  consoleComponents.ts  # Console parts
  (and many more...)
context/                # React context providers
hooks/                  # Custom React hooks
assets/                 # Images and fonts
scripts/build.js        # Production build script
server/serve.js         # Production static server
```

## Running the App
- **Development**: `PORT=5000 pnpm dev` (starts Expo Metro on port 5000)
- **Production Build**: `node scripts/build.js`
- **Production Serve**: `node server/serve.js`

## Workflows
- **Start Frontend**: Runs `PORT=5000 pnpm dev` on port 5000 (webview)

## Deployment
- Build: `node scripts/build.js` (creates static-build/)
- Run: `node server/serve.js` (serves static build + landing page)
- Target: autoscale

## Key Features
- Multi-era game development simulation (Atari era → modern)
- Console design and manufacturing
- Employee hiring and management (capacity shown as employees/maxEmployees)
- R&D and strategy tree
- Global market competition with AI rivals that launch named games
- Financial management (Tech Acquisitions + Alternative Investments split)
- Achievements and trophies system
- Annual GOTY awards where rivals can win and beat the player
- Online multiplayer lobby
- Multilingual support (i18n)
- Dark space-themed UI

## Recent Improvements
- Fixed hiring bug (branches capacity calculation)
- Reduced dynamic event frequency (all base probabilities halved)
- Added save-before-exit modal with "Save and Exit" / "Exit without saving" / "Cancel"
- Added news category filter strip (Todas / Lançamentos / Crescimento / Tecnologia / Crises / Rivais / Prémios)
- Expanded acquisitions: 5 new types (movie_studio, sports_team, shopping_center, event_company, music_label)
- Finances screen splits acquisitions into "Aquisições Tecnológicas" vs "Investimentos Alternativos"
- Competitor AI: rivals now launch named games with scores based on their style and innovation level
- Award system: rival games compete in GOTY; player can lose if rival scores are higher
- Improved news system: state-aware contextual events, category dedup, 2–4 month cooldown gate, 60+ templates
- Expanded competitor market system: market value formula, financialHealth (healthy/struggling/critical/bankrupt), innovation drift by style, graduated bankruptcy (4+ crisis months), `computeRivalMarketValue()` export
- Rival acquisition system: `acquireRival()` in GameplayContext — buy struggling/critical/bankrupt rivals, success probability based on health + reputation + aggressiveness, full UI on Market screen (AcquisitionPanel, BankruptCard asset purchase, health badges, market value chips)
- Global Event Validation System: `validateEventContext`, `isHardBlockedEvent`, `getEventProbabilityScale`, `generateContextualEventNote` — context-gated events with Portuguese "why" notes; category-level cooldowns (CATEGORY_COOLDOWN_MONTHS) stored in `eventCategoryLastMonthIdx`
- Rival AI upgrade: per-rival independent release schedule (6–16 month cooldown by aggressiveness); era-aware score ranges (35–65 early, 65–98 late); style bonuses (tech_focused +5, innovation_first ±12, mass_market −4, etc.); 5-tier consequences (hit/good/average/weak/flop) with share/rep/money changes; news capped at 2 per month; old shared-cooldown Events A & E removed; `lastGameMonthIdx` added to Competitor type
- Era upgrade scaling: `computeEraUpgradeBonuses` now applies hyperbolic diminishing returns (`applyDiminishingReturns(raw, cap)`) to all percentage bonuses; soft caps: salesMult/gameRevMult/campaignMult →+150% max, devSpeedMult →+130%, costMult/riskMod reduction →80% max, ratingBonus →2.50; repBonus/fansBonus kept flat (unaffected); individual upgrade effectLabels unchanged; research tree caps untouched
- Holdings System v2: replaced 5 cosmetic holdings with 8 real-effect strategic subsidiaries (`investment_bank`, `law_firm`, `media_network`, `ai_research_lab`, `hardware_factory`, `indie_incubator`, `hedge_fund`, `crisis_firm`); each has a unique, non-stacking mechanical effect in `advanceMonth()`; monthly maintenance costs actually deducted (`HOLDINGS_MONTHLY_COST` map); purchase deducts price via `buyLocalHolding(id, price)` in GameplayContext; `localHoldings: string[]` persisted in `ActiveGameState`; UI shows effectLabel chip + tradeoff chip (warning style); buy button blocked if insufficient funds; max 4 limit banner updated; `HoldingsSection` now self-contained (calls `useGameplay()` internally, no parent state)
- Shareholder Satisfaction System: `shareholderSatisfaction` (0–100) added to `ActiveGameState`; monthly drift driven by profitability, board control pct, reputation, predatory investors, and broken promises (`shareholderPromisePending`); investor exit event at sat <12 (25% chance) — exiting investor's shares credited back to player via `exitedInvestorShares`; satisfaction warning news at sat <28 every 2 months; `shareholderMeetingDecision("dividends"|"reinvest"|"promise")` in GameplayContext applies real money/rep/satisfaction effects with 6-month cooldown; `AcionistasSection` in offices.tsx fully redesigned — shows real investor list with personality chips, satisfaction bar, monthly dividend display, control % warning, "no investors" empty state, and connected decision modal
- Global Map / International Expansion v2: Added strategic profile system to `globalMarket.ts` — `getCountryStrategicProfile()` derives 6 readable attributes (Market Size, Operational Cost, Tax Burden, Industrial Strength, Talent Base, Regulation Risk) as Low/Medium/High tiers from existing country data fields (no new Country fields = save-compatible); `getBranchMonthlyMaintenance(country, type, year)` applies era scaling (1.0× in 1975 → 1.8× in 2025) + operational cost tier modifier (±25%); `getBranchRecommendation(country, type)` returns advisory strings combining country profile × branch type; `BRANCH_TYPE_DESCRIPTIONS` object provides emoji, mainBenefit, secondaryBenefit, bestFor, explanation per branch type; `world-map.tsx` replaces Alert-based branch selection with a proper bottom-sheet Modal (animationType="fade", transparent overlay) showing country profile tags + 3 selectable branch type cards (each shows setup cost, era-scaled monthly maintenance, benefits, recommendation chip color-coded green/amber/red, and explanation); ProfileTag component renders colored attribute tags in both country expanded card and modal; GameplayContext.tsx updated so newly opened branches store era-scaled monthly cost + proportional revenue bonus; all changes are additive — existing branch logic, map tabs, operations/incidents views, and save format unchanged
- Post-Development System v1: Added 3 new post-launch decisions to released game cards in game-dev.tsx — (1) DLC System: `dlcCount` tracked on GameProject, max 3 DLCs per game, each costs 8% of original budget (min $40K), grants +fanGain, +0.08 revenueMultBonus, +4 months effectiveLifespan; DLC button hidden when count ≥ 3 or supportActive = false; (2) Stop Support: `supportActive` boolean on GameProject, `stopSupport()` in GameplayContext sets it to false, advanceMonth() applies gradual fan drain (casual + critical fans, 50–110/month × fade) when stopped; chip flips from "Parar Suporte" (amber) to "Sem Suporte" (red); (3) Optimize Game: `gameOptimized` boolean, `optimizeGame()` costs $120K, immediately grants +8 months lifespan + +0.08 revenueMultBonus, one-time only, chip shows "Otimizado ✓" after; all 3 actions added to the context interface, defaults, and provider value; action chips row now wraps: Sequência · Otimizar · Parar Suporte · Desativar; all new GameProject fields are optional (save-compatible)
- Final Polish Pass: history.tsx and achievements.tsx fully refactored — now use ScreenHeader + GridBackground for visual consistency, @/ path aliases instead of ../../ relative imports, useSafeAreaInsets for correct safe-area padding, and showsVerticalScrollIndicator=false; history.tsx also switched from local formatMoney to shared import, chart labels now show full year instead of 2-digit year, franchise row "nota last:" fixed to "nota média X/100 · último Y/100"; achievements.tsx shows count badge in header rightElement slot; Portuguese (PT-BR) language standardized: fixed "Prémios" → "Prêmios", "activos" → "ativos", "interactivo" → "interativo", "acoustica" → "acústica", "Áudio Reactivo" → "Áudio Reativo", "bónus" → "bônus" in all game screens and research node descriptions; alert dialogs updated: "Perderás" → "Você vai perder", "Tens a certeza" → "Tem certeza que deseja", "está a prejudicar" → "está prejudicando"; fixed double space in HYPE label; "adapatativas" typo corrected
- Team (Equipa) System Overhaul: employees.tsx fully redesigned with a 4-section 88px side navigation (Visão Geral, Recrutar, Escritório, Gestão); Overview shows real-time stats grid (team size, salaries, rating bonus, sales bonus) + type breakdown table with Jr/Sr/P tier pips + capacity progress bar; Recrutar section has horizontal role tabs, a role banner, a quantity selector (1/2/3/5/10 buttons), and hire cards that show total cost + total salary for the selected batch — uses new `bulkHireEmployee(type, level, count)` context function for batch hires, single `hireEmployee` for count=1; Escritório section shows current office level, per-level capacity chart (8 levels, +10 slots each), and an Expand button whose cost formula scales as `50_000 × level² × (1 + employees/15)` — uses new `upgradeOfficeCapacity()` context function; Gestão section shows filterable employee list with fire/retrain actions per role; `officeLevel?: number` added to `ActiveGameState` (default 1, saves backward-compatible); `hireEmployee` and `bulkHireEmployee` now both enforce capacity using `10 + (officeLevel-1)*10 + branches*5` formula; no existing mechanics changed
- Console Management Reorganization + Dynamic Pricing System: (1) GameConsole type extended with `suggestedPrice` (set at build time as 3.5× productionCost), `pricingStrategy` ("premium"/"budget"/"balanced"), `isProductionPaused`, `relaunchCount`, `relaunchBonusMonthsLeft`; (2) `calculateMonthlySales` enhanced — production pause short-circuits to 0 sales, quality-vs-price interaction penalty (overpriced + low quality → heavy penalty), volume discount boost (price < 85% of suggested → up to +40% volume), relaunch boost (+30% during active window); advanceMonth ticks `relaunchBonusMonthsLeft` down each month; (3) GameplayContext gains 4 new functions: `updateConsolePrice` (validates min/max bounds), `setConsolePricingStrategy`, `relaunchConsole` (cost = max($50K, productionCost×20), 6-month boost, max 3 relaunches), `setConsoleProductionState`; (4) consoles.tsx redesigned — active console cards are tappable and open a `ConsoleDetailModal` with a 90px left side-navigation (6 sections: Visão Geral, Melhorias, Relançar, Estratégia, Monetização, Produção); list cards gain pause/boost status badges and a "tap to manage" hint row
