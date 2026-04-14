// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL EVENT VALIDATION SYSTEM
// Provides contextual gating for ALL in-game events before they fire.
// No event definitions are modified — only trigger eligibility is controlled.
// ─────────────────────────────────────────────────────────────────────────────

// ── Category taxonomy ────────────────────────────────────────────────────────

export type EventValidationCategory =
  | "NEGATIVE_PR"   // scandals, bad news, crises, community backlash
  | "POSITIVE_PR"   // opportunities, good media, fan movement
  | "TECH"          // tech events, chip shortage, breakthroughs
  | "MARKET"        // economic, competitor, trend shifts
  | "INTERNAL";     // employee, studio, dev-speed events

// ── Context snapshot built once per advanceMonth tick ────────────────────────

export type EventValidationContext = {
  year: number;
  monthIdx: number;             // absolute month index (year * 12 + month)
  reputation: number;           // 0–100
  worstBugLevel: string;        // "none" | "low" | "medium" | "severe" — worst across released games
  avgReleasedScore: number;     // average receptionScore of released games (0–100); 50 if none
  maxHypeLevel: number;         // highest hypeLevel among in-dev projects (0–100)
  hasSales: boolean;            // totalRevenue > 0
  employeeCount: number;
  hasConsole: boolean;
  hasReleasedGame: boolean;
  hasAliveRival: boolean;
  hadNegativeEventThisMonth: boolean;
  hadPositiveEventThisMonth: boolean;
};

// ── Category inference helpers ────────────────────────────────────────────────

// Infer validation category from a DynamicEventDef's native category + effect signs.
// This avoids touching any event definitions.
export function inferDynEventCategory(
  nativeCategory: string,
  effects: { moneyDelta?: number; reputationDelta?: number; fansDelta?: number; devSpeedDelta?: number },
): EventValidationCategory {
  if (nativeCategory === "opportunity") return "POSITIVE_PR";
  if (nativeCategory === "media")       return "POSITIVE_PR";
  if (nativeCategory === "economy")     return "MARKET";
  if (nativeCategory === "market")      return "MARKET";
  if (nativeCategory === "competitor")  return "MARKET";
  if (nativeCategory === "tech")        return "TECH";

  // For internal / crisis / community / legal: infer from net effect sign
  const hasNegative =
    (effects.moneyDelta      ?? 0) < 0 ||
    (effects.reputationDelta ?? 0) < 0 ||
    (effects.fansDelta       ?? 0) < 0 ||
    (effects.devSpeedDelta   ?? 0) < 0;
  const hasPositive =
    (effects.moneyDelta      ?? 0) > 0 ||
    (effects.reputationDelta ?? 0) > 0 ||
    (effects.fansDelta       ?? 0) > 0 ||
    (effects.devSpeedDelta   ?? 0) > 0;

  if (nativeCategory === "internal") {
    return hasNegative ? "NEGATIVE_PR" : "INTERNAL";
  }
  if (hasNegative && !hasPositive) return "NEGATIVE_PR";
  if (!hasNegative && hasPositive) return "POSITIVE_PR";
  return "MARKET"; // mixed or neutral
}

// Map scandal ScandalCategory string → EventValidationCategory
export function inferScandalEventCategory(
  scandalCategory: string,
): EventValidationCategory {
  switch (scandalCategory) {
    case "internal":   return "INTERNAL";
    case "competitor": return "MARKET";
    default:           return "NEGATIVE_PR"; // product, financial, social, review, data
  }
}

// ── Core validation gate ──────────────────────────────────────────────────────

/**
 * Returns true if an event of the given category is ALLOWED to fire.
 * Called from pickScandal and pickDynamicEvent before adding a candidate.
 */
export function validateEventContext(
  category: EventValidationCategory,
  ctx: EventValidationContext,
): boolean {
  // ── 1. Early-game suppression: first 18 absolute months ──────────────────
  if (ctx.monthIdx < 18) {
    if (category === "NEGATIVE_PR") return false;
    if (category === "INTERNAL" && ctx.employeeCount < 3) return false;
  }

  // ── 2. Conflict prevention: no positive + negative in the same month tick ─
  if (category === "NEGATIVE_PR" && ctx.hadPositiveEventThisMonth) return false;
  if (category === "POSITIVE_PR" && ctx.hadNegativeEventThisMonth) return false;

  // ── 3. Category-specific context requirements ─────────────────────────────
  switch (category) {

    case "NEGATIVE_PR": {
      // Hard block: thriving company with no negative signals
      if (
        ctx.reputation >= 80 &&
        ctx.worstBugLevel === "none" &&
        ctx.avgReleasedScore >= 75
      ) return false;

      // Require at least one meaningful negative signal
      const lowRep   = ctx.reputation < 60;
      const hasBugs  = ctx.worstBugLevel !== "none";
      const lowScore = ctx.avgReleasedScore < 60;
      // Hype/performance mismatch: player hyped a game heavily but it scored poorly
      const hypeGap  = ctx.maxHypeLevel > 0 && ctx.maxHypeLevel > ctx.avgReleasedScore + 25;

      return lowRep || hasBugs || lowScore || hypeGap;
    }

    case "POSITIVE_PR":
      // Require positive signals — good scores or healthy rep with real sales
      return ctx.avgReleasedScore >= 70 || (ctx.reputation >= 65 && ctx.hasSales);

    case "TECH":
      // Tech events make sense only once the company has hardware or software output
      return ctx.hasConsole || ctx.hasReleasedGame;

    case "MARKET":
      // Market events require competition or sufficient time in the game
      return ctx.hasAliveRival || ctx.monthIdx >= 12;

    case "INTERNAL":
      // Internal events require a real team
      return ctx.employeeCount >= 2;

    default:
      return true;
  }
}

// ── Hard veto ────────────────────────────────────────────────────────────────

/**
 * Returns true if the event must be vetoed unconditionally, regardless of
 * probability rolls. Currently applied to NEGATIVE_PR when the company is
 * performing exceptionally well (reputation ≥ 80, no bugs, score ≥ 75).
 */
export function isHardBlockedEvent(
  category: EventValidationCategory,
  ctx: EventValidationContext,
): boolean {
  if (category === "NEGATIVE_PR") {
    return (
      ctx.reputation >= 80 &&
      ctx.worstBugLevel === "none" &&
      ctx.avgReleasedScore >= 75
    );
  }
  return false;
}

// ── Contextual "WHY" note generator ──────────────────────────────────────────

/**
 * Returns a short Portuguese sentence explaining WHY this event is occurring,
 * based on the actual game state that passed validation.
 * Appended to event news bodies so the player understands the cause.
 */
export function generateContextualEventNote(
  category: EventValidationCategory,
  ctx: EventValidationContext,
): string {
  switch (category) {

    case "NEGATIVE_PR": {
      if (ctx.worstBugLevel === "severe")
        return "Problemas técnicos graves minaram a confiança do público na empresa.";
      if (ctx.worstBugLevel === "medium")
        return "A instabilidade técnica recente reduziu a credibilidade dos seus lançamentos.";
      if (ctx.maxHypeLevel > 0 && ctx.maxHypeLevel > ctx.avgReleasedScore + 28)
        return "O marketing criou expectativas que a entrega final não conseguiu sustentar.";
      if (ctx.reputation < 40)
        return "Sua reputação fragilizada amplificou a repercussão negativa.";
      if (ctx.avgReleasedScore < 50)
        return "O histórico de lançamentos abaixo da média atrai maior escrutínio da mídia.";
      return "Condições desfavoráveis ampliaram a visibilidade dos problemas da empresa.";
    }

    case "POSITIVE_PR": {
      if (ctx.avgReleasedScore >= 88)
        return "Lançamentos excepcionais geram um boca-a-boca positivo difícil de ignorar.";
      if (ctx.avgReleasedScore >= 75)
        return "A qualidade consistente dos seus produtos atraiu atenção favorável da mídia.";
      if (ctx.reputation >= 80)
        return "Sua sólida reputação transformou bom desempenho em cobertura altamente positiva.";
      return "O histórico construtivo da empresa atraiu cobertura favorável do setor.";
    }

    case "TECH": {
      if (ctx.worstBugLevel !== "none")
        return "Problemas técnicos existentes tornaram a empresa alvo de análise especializada.";
      if (ctx.hasConsole)
        return "O contexto de hardware da empresa criou oportunidade de exposição técnica.";
      return "O cenário tecnológico do setor gerou repercussão direta no mercado.";
    }

    case "MARKET": {
      if (ctx.hasAliveRival)
        return "A presença de concorrentes ativos intensificou a pressão competitiva.";
      return "As condições de mercado criaram um novo cenário para a empresa.";
    }

    case "INTERNAL": {
      if (ctx.employeeCount >= 8)
        return "O crescimento acelerado da equipe gerou tensões internas difíceis de ignorar.";
      if (ctx.employeeCount >= 4)
        return "A pressão de múltiplos projetos simultâneos está afetando o ritmo da equipe.";
      return "A dinâmica interna da empresa está impactando a produtividade geral.";
    }

    default:
      return "";
  }
}

// ── Probability scaling ───────────────────────────────────────────────────────

/**
 * Returns a multiplier to apply to a base event probability.
 * Does NOT change the base probability constants — only scales them contextually.
 * Keeps the system non-spammy: low base × scale is still low.
 */
export function getEventProbabilityScale(
  category: EventValidationCategory,
  ctx: EventValidationContext,
): number {
  // Very early game: significantly reduced event rate
  if (ctx.monthIdx < 12) return 0.25;
  if (ctx.monthIdx < 24) return 0.60;

  switch (category) {
    case "NEGATIVE_PR":
      // Reduced scales to lower spam — legal protection handles residual impact separately
      if (ctx.reputation < 35) return 1.3;
      if (ctx.reputation < 50) return 0.9;
      if (ctx.reputation < 65) return 0.7;
      return 0.45;

    case "POSITIVE_PR":
      // Slightly reduced so good events feel earned not constant
      if (ctx.avgReleasedScore >= 88) return 1.2;
      if (ctx.avgReleasedScore >= 75) return 0.9;
      return 0.7;

    case "TECH":
      return 0.65;

    case "MARKET":
      return ctx.hasAliveRival ? 0.85 : 0.65;

    case "INTERNAL":
      if (ctx.employeeCount >= 8) return 1.1;
      if (ctx.employeeCount >= 4) return 0.80;
      return 0.55;

    default:
      return 0.85;
  }
}
