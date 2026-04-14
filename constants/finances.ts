// ─────────────────────────────────────────────────────────────────
// FINANCIAL SYSTEM
// Loans, credit ratings, bankruptcy, interest rates
// ─────────────────────────────────────────────────────────────────

export type CreditRating = "AAA" | "AA" | "A" | "BBB" | "BB" | "B" | "CCC" | "D";

export const CREDIT_RATING_COLORS: Record<CreditRating, string> = {
  AAA: "#10B981",
  AA: "#22C55E",
  A: "#84CC16",
  BBB: "#EAB308",
  BB: "#F59E0B",
  B: "#F97316",
  CCC: "#FF4D6A",
  D: "#DC2626",
};

export const CREDIT_RATING_LABELS: Record<CreditRating, string> = {
  AAA: "Excelente — Taxa prime",
  AA: "Muito bom — Baixo risco",
  A: "Bom — Sólido",
  BBB: "Adequado — Risco moderado",
  BB: "Especulativo — Atenção",
  B: "Arriscado — Juros altos",
  CCC: "Em dificuldade — Risco crítico",
  D: "Default — Falência iminente",
};

export type LoanType = {
  id: string;
  name: string;
  description: string;
  maxAmount: number;       // Absolute cap
  revenueMultiplierMax: number; // Max = X times monthly revenue
  baseInterestRate: number; // Annual rate (0.05 = 5%)
  termMonths: number;      // Duration
  minCreditRating: CreditRating;
  collateralRequired: boolean;
  minYear: number;
  icon: string;
};

export const LOAN_TYPES: LoanType[] = [
  {
    id: "loan_micro",
    name: "Microcrédito",
    description: "Empréstimo pequeno para cobrir despesas operacionais imediatas",
    maxAmount: 50_000,
    revenueMultiplierMax: 2,
    baseInterestRate: 0.18,
    termMonths: 6,
    minCreditRating: "CCC",
    collateralRequired: false,
    minYear: 1972,
    icon: "dollar-sign",
  },
  {
    id: "loan_short_term",
    name: "Crédito de Curto Prazo",
    description: "Capital de giro para 12 meses. Aprovação rápida.",
    maxAmount: 250_000,
    revenueMultiplierMax: 3,
    baseInterestRate: 0.12,
    termMonths: 12,
    minCreditRating: "B",
    collateralRequired: false,
    minYear: 1972,
    icon: "calendar",
  },
  {
    id: "loan_medium_term",
    name: "Empréstimo Médio Prazo",
    description: "Financiamento para expansão ou novo produto. 2–3 anos.",
    maxAmount: 1_000_000,
    revenueMultiplierMax: 5,
    baseInterestRate: 0.09,
    termMonths: 24,
    minCreditRating: "BB",
    collateralRequired: false,
    minYear: 1975,
    icon: "trending-up",
  },
  {
    id: "loan_bank_facility",
    name: "Linha de Crédito Bancária",
    description: "Linha rotativa com banco. Flexível e renovável anualmente.",
    maxAmount: 5_000_000,
    revenueMultiplierMax: 8,
    baseInterestRate: 0.07,
    termMonths: 36,
    minCreditRating: "BBB",
    collateralRequired: true,
    minYear: 1980,
    icon: "credit-card",
  },
  {
    id: "loan_venture_debt",
    name: "Venture Debt",
    description: "Dívida de risco com fundo especializado. Para empresas em crescimento.",
    maxAmount: 10_000_000,
    revenueMultiplierMax: 12,
    baseInterestRate: 0.11,
    termMonths: 36,
    minCreditRating: "B",
    collateralRequired: false,
    minYear: 1990,
    icon: "zap",
  },
  {
    id: "loan_corporate_bond",
    name: "Debêntures Corporativas",
    description: "Emissão de título de dívida no mercado. Grandes volumes.",
    maxAmount: 50_000_000,
    revenueMultiplierMax: 20,
    baseInterestRate: 0.055,
    termMonths: 60,
    minCreditRating: "A",
    collateralRequired: false,
    minYear: 1995,
    icon: "bar-chart-2",
  },
];

export type ActiveLoan = {
  id: string;
  loanTypeId: string;
  name: string;
  originalAmount: number;
  remainingAmount: number;
  monthlyPayment: number;
  annualInterestRate: number;
  termMonths: number;
  monthsRemaining: number;
  takenYear: number;
  takenMonth: number;
  nextPaymentMonth: number;
  nextPaymentYear: number;
};

// ── Credit Rating Calculation ─────────────────────────────────────

export function calculateCreditRating(
  money: number,
  totalRevenue: number,
  monthlyRevenue: number,
  activeLoans: ActiveLoan[],
  reputation: number,
): CreditRating {
  // Debt-to-Income ratio
  const totalDebt = activeLoans.reduce((s, l) => s + l.remainingAmount, 0);
  const annualRevenue = monthlyRevenue * 12;
  const dti = annualRevenue > 0 ? totalDebt / annualRevenue : 99;

  // Cash cushion (months of expenses covered)
  const monthlyDebt = activeLoans.reduce((s, l) => s + l.monthlyPayment, 0);
  const cashCushion = monthlyDebt > 0 ? money / monthlyDebt : 24;

  // Score calculation
  let score = 800; // Start at AAA baseline

  // Debt-to-income penalty
  if (dti > 5) score -= 400;
  else if (dti > 3) score -= 200;
  else if (dti > 2) score -= 100;
  else if (dti > 1) score -= 50;

  // Cash cushion bonus/penalty
  if (cashCushion < 1) score -= 300;
  else if (cashCushion < 3) score -= 150;
  else if (cashCushion < 6) score -= 50;
  else if (cashCushion > 12) score += 50;

  // Reputation factor
  if (reputation > 80) score += 50;
  else if (reputation < 30) score -= 100;
  else if (reputation < 10) score -= 200;

  // Negative cash
  if (money < 0) score -= 500;

  if (score >= 750) return "AAA";
  if (score >= 680) return "AA";
  if (score >= 600) return "A";
  if (score >= 500) return "BBB";
  if (score >= 380) return "BB";
  if (score >= 250) return "B";
  if (score >= 100) return "CCC";
  return "D";
}

// ── Interest Rate Calculation ─────────────────────────────────────

export function calculateInterestRate(
  loanType: LoanType,
  creditRating: CreditRating,
  year: number,
): number {
  // Credit spread on top of base rate
  const spreads: Record<CreditRating, number> = {
    AAA: -0.02, AA: -0.01, A: 0, BBB: 0.01, BB: 0.03, B: 0.06, CCC: 0.12, D: 0.20,
  };

  // Historic base rates (simplified Federal Reserve style)
  const historicBaseRates: [number, number][] = [
    [1972, 0.05], [1980, 0.15], [1985, 0.10], [1990, 0.08],
    [2000, 0.065], [2008, 0.02], [2015, 0.005], [2022, 0.05],
    [2030, 0.03], [2050, 0.02],
  ];
  let baseRate = 0.05;
  for (let i = historicBaseRates.length - 1; i >= 0; i--) {
    if (year >= historicBaseRates[i][0]) {
      baseRate = historicBaseRates[i][1];
      break;
    }
  }

  const totalRate = loanType.baseInterestRate + spreads[creditRating] + (baseRate * 0.3);
  return Math.max(0.01, Math.round(totalRate * 1000) / 1000);
}

// ── Loan Calculation ──────────────────────────────────────────────

export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termMonths: number,
): number {
  if (annualRate === 0) return principal / termMonths;
  const r = annualRate / 12;
  return (principal * r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1);
}

export function createLoan(
  loanType: LoanType,
  amount: number,
  interestRate: number,
  year: number,
  month: number,
): ActiveLoan {
  const monthly = calculateMonthlyPayment(amount, interestRate, loanType.termMonths);
  return {
    id: `loan_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    loanTypeId: loanType.id,
    name: loanType.name,
    originalAmount: amount,
    remainingAmount: amount,
    monthlyPayment: Math.round(monthly),
    annualInterestRate: interestRate,
    termMonths: loanType.termMonths,
    monthsRemaining: loanType.termMonths,
    takenYear: year,
    takenMonth: month,
    nextPaymentMonth: month === 12 ? 1 : month + 1,
    nextPaymentYear: month === 12 ? year + 1 : year,
  };
}

// ── Bankruptcy Detection ──────────────────────────────────────────

export type BankruptcyRisk = "safe" | "watch" | "danger" | "critical" | "bankrupt";

export const BANKRUPTCY_RISK_COLORS: Record<BankruptcyRisk, string> = {
  safe: "#10B981",
  watch: "#F59E0B",
  danger: "#F97316",
  critical: "#FF4D6A",
  bankrupt: "#DC2626",
};

export const BANKRUPTCY_RISK_LABELS: Record<BankruptcyRisk, string> = {
  safe: "Saúde Financeira Estável",
  watch: "Atenção — Monitorar",
  danger: "Perigo — Ação Necessária",
  critical: "Crítico — Risco Iminente",
  bankrupt: "FALÊNCIA DECLARADA",
};

export function assessBankruptcyRisk(
  money: number,
  monthlyRevenue: number,
  activeLoans: ActiveLoan[],
  monthlyExpenses: number,
): BankruptcyRisk {
  const totalMonthlyDebt = activeLoans.reduce((s, l) => s + l.monthlyPayment, 0);
  const netMonthly = monthlyRevenue - monthlyExpenses - totalMonthlyDebt;
  const runway = money / Math.max(1, monthlyExpenses + totalMonthlyDebt - monthlyRevenue);

  if (money < 0 && monthlyRevenue < monthlyExpenses + totalMonthlyDebt) return "bankrupt";
  if (money < 0) return "critical";
  if (runway < 3 || netMonthly < -money * 0.5) return "critical";
  if (runway < 6 || netMonthly < 0) return "danger";
  if (runway < 12 || totalMonthlyDebt > monthlyRevenue * 0.5) return "watch";
  return "safe";
}

// ── Cash Flow Projection ──────────────────────────────────────────

export type CashFlowPoint = {
  month: number;
  year: number;
  projected: number;
};

export function projectCashFlow(
  currentMoney: number,
  monthlyRevenue: number,
  monthlyExpenses: number,
  activeLoans: ActiveLoan[],
  months: number = 12,
): CashFlowPoint[] {
  const points: CashFlowPoint[] = [];
  let cash = currentMoney;
  const now = new Date();
  let m = (now.getMonth() + 2) % 12 || 12;
  let y = now.getFullYear() + (now.getMonth() === 11 ? 1 : 0);

  for (let i = 0; i < months; i++) {
    const debtPayments = activeLoans
      .filter((l) => l.monthsRemaining > i)
      .reduce((s, l) => s + l.monthlyPayment, 0);
    cash += monthlyRevenue - monthlyExpenses - debtPayments;
    points.push({ month: m, year: y, projected: Math.round(cash) });
    m = m === 12 ? 1 : m + 1;
    if (m === 1) y++;
  }
  return points;
}
