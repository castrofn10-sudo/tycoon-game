import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, TextInput, Platform, Modal, KeyboardAvoidingView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useGameplay } from "@/context/GameplayContext";
import { GridBackground } from "@/components/GridBackground";
import { ScreenHeader } from "@/components/ScreenHeader";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { formatMoney } from "@/constants/gameEconomics";
import {
  MONTHS_PT,
  STOCK_MARKET_UNLOCK,
  ACQUISITIONS_UNLOCK,
  isStockMarketUnlocked,
  isAcquisitionsUnlocked,
} from "@/constants/gameEngine";
import {
  LOAN_TYPES,
  CREDIT_RATING_COLORS,
  CREDIT_RATING_LABELS,
  BANKRUPTCY_RISK_COLORS,
  BANKRUPTCY_RISK_LABELS,
  calculateInterestRate,
  calculateMonthlyPayment,
  assessBankruptcyRisk,
  projectCashFlow,
  ActiveLoan,
  CreditRating,
} from "@/constants/finances";
import {
  ACQUIRABLE_COMPANIES,
  AcquirableCompany,
  StockListing, StockBid,
  getBuybackPremium,
  PERSONALITY_LABELS, PERSONALITY_COLORS, PERSONALITY_ICONS,
  computeAcquisitionResaleInfo,
  SCALE_LABELS, SCALE_COLORS, CATEGORY_LABELS,
} from "@/constants/stockMarket";

type Tab = "overview" | "loans" | "new_loan" | "empresa" | "acquisicoes";

export default function FinancesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    state, takeLoan, sellShares, buyBackShares,
    acceptOffer, rejectOffer,
    createStockListing, cancelStockListing, acceptStockBid, rejectStockBid,
    buyAcquisition, sellAcquisition, investInSponsorship,
  } = useGameplay();
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [tab, setTab] = useState<Tab>("overview");
  const [selectedLoanType, setSelectedLoanType] = useState<string | null>(null);
  const [loanAmount, setLoanAmount] = useState("");

  // Stock listing modal state
  const [showListingModal, setShowListingModal] = useState(false);
  const [listingPercent, setListingPercent] = useState("10");
  const [listingMinAsk, setListingMinAsk] = useState("");

  // Buyback modal state
  const [showBuybackModal, setShowBuybackModal] = useState(false);
  const [buybackPercent, setBuybackPercent] = useState("5");

  // Sponsorship investment amounts (keyed by opportunity id)
  const [sponsorAmounts, setSponsorAmounts] = useState<Record<string, number>>({});

  if (!state) return null;

  const ACQ_TYPE_LABEL: Record<string, string> = {
    studio:           "Estúdio de Desenvolvimento",
    hardware_lab:     "Laboratório de Hardware",
    publisher:        "Distribuidora",
    marketing_agency: "Agência de Marketing",
    movie_studio:     "Estúdio de Cinema",
    sports_team:      "Equipe Desportiva",
    shopping_center:  "Centro Comercial",
    event_company:    "Empresa de Eventos",
    music_label:      "Editora Musical",
  };

  const TECH_ACQ_TYPES = ["studio", "hardware_lab", "publisher", "marketing_agency"];
  const ALT_ACQ_TYPES  = ["movie_studio", "sports_team", "shopping_center", "event_company", "music_label"];

  // Unlock gate states — single source of truth from gameEngine constants
  const stockUnlocked = isStockMarketUnlocked(state);
  const acqUnlocked   = isAcquisitionsUnlocked(state);

  const activeLoans = state.activeLoans ?? [];
  const creditRating = state.creditRating ?? "BBB";
  const ratingColor = CREDIT_RATING_COLORS[creditRating];

  const safeTotalRevenue = Number.isFinite(state.totalRevenue) ? state.totalRevenue : 0;
  const monthlyRevEstimate = safeTotalRevenue / Math.max(1, (state.year - 1972) * 12 + state.month);
  const monthlyLoanCost = activeLoans.reduce((s, l) => s + (Number.isFinite(l.monthlyPayment) ? l.monthlyPayment : 0), 0);
  const totalDebt = activeLoans.reduce((s, l) => s + (Number.isFinite(l.remainingAmount) ? l.remainingAmount : 0), 0);
  const monthlyOfficeCost = 5000 * (state.offices.design + state.offices.marketing + state.offices.tech + state.offices.admin);
  const monthlySalaryCost = (state.employees ?? []).reduce((s, e) => s + (Number.isFinite(e.monthlySalary) ? e.monthlySalary : 0), 0);
  const branchCosts = (state.branches ?? []).reduce((s, b) => s + b.monthlyCost, 0);
  const totalMonthlyExpenses = monthlyOfficeCost + monthlySalaryCost + branchCosts;

  const bankruptcyRisk = assessBankruptcyRisk(state.money, monthlyRevEstimate, activeLoans, totalMonthlyExpenses);
  const riskColor = BANKRUPTCY_RISK_COLORS[bankruptcyRisk];

  const cashFlow = projectCashFlow(state.money, monthlyRevEstimate, totalMonthlyExpenses, activeLoans, 12);

  const selectedLoanTypeObj = LOAN_TYPES.find((l) => l.id === selectedLoanType);
  const parsedAmount = parseFloat(loanAmount.replace(/[^0-9.]/g, "")) || 0;
  const previewRate = selectedLoanTypeObj
    ? calculateInterestRate(selectedLoanTypeObj, creditRating, state.year)
    : 0;
  const previewMonthly = (selectedLoanTypeObj && parsedAmount > 0)
    ? calculateMonthlyPayment(parsedAmount, previewRate, selectedLoanTypeObj.termMonths)
    : 0;

  const handleTakeLoan = () => {
    if (!selectedLoanType || parsedAmount <= 0) {
      Alert.alert("Erro", "Seleciona um tipo e insere um valor válido");
      return;
    }
    Alert.alert(
      "Confirmar Empréstimo",
      `Valor: ${formatMoney(parsedAmount)}\nTaxa anual: ${(previewRate * 100).toFixed(2)}%\nParcela mensal: ${formatMoney(Math.round(previewMonthly))}\n\nTotal a pagar: ${formatMoney(Math.round(previewMonthly * (selectedLoanTypeObj?.termMonths ?? 12)))}`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: () => {
            const err = takeLoan(selectedLoanType, parsedAmount);
            if (err) Alert.alert("Erro", err);
            else {
              Alert.alert("Empréstimo concedido!", `${formatMoney(parsedAmount)} adicionado ao seu saldo.`);
              setTab("loans");
              setLoanAmount("");
              setSelectedLoanType(null);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GridBackground />
      <ScreenHeader title="Gestão Financeira" />

      {/* Tabs */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabRowContent}
          bounces={false}
        >
          {([
            { id: "overview",    label: "Visão Geral", icon: "bar-chart-2",  locked: false },
            { id: "loans",       label: "Empréstimos", icon: "credit-card",  locked: false },
            { id: "new_loan",    label: "Solicitar",   icon: "plus-circle",  locked: false },
            { id: "empresa",     label: "Empresa",     icon: "pie-chart",    locked: !stockUnlocked },
            { id: "acquisicoes", label: "Aquisições",  icon: "briefcase",    locked: !acqUnlocked },
          ] as const).map((t) => {
            const active = tab === t.id;
            const fg = t.locked ? colors.mutedForeground + "66" : active ? "#4DA6FF" : colors.mutedForeground;
            return (
              <TouchableOpacity
                key={t.id}
                onPress={() => { if (!t.locked) setTab(t.id); }}
                style={[styles.tab, {
                  borderBottomColor: active ? "#4DA6FF" : "transparent",
                  opacity: t.locked ? 0.5 : 1,
                }]}
                activeOpacity={t.locked ? 1 : 0.7}
              >
                {t.locked
                  ? <Feather name="lock" size={11} color={fg} />
                  : <Feather name={t.icon} size={13} color={fg} />}
                <Text style={[styles.tabText, { color: fg }]} numberOfLines={1}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 80 }]} showsVerticalScrollIndicator={false}>

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <View style={styles.section}>
            {/* Credit Rating Card */}
            <View style={[styles.ratingCard, { backgroundColor: colors.card, borderColor: ratingColor + "44" }]}>
              <LinearGradient colors={[ratingColor + "18", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
              <View style={styles.ratingLeft}>
                <Text style={[styles.ratingScore, { color: ratingColor }]}>{creditRating}</Text>
                <Text style={[styles.ratingLabel, { color: colors.mutedForeground }]}>Rating</Text>
              </View>
              <View style={styles.ratingRight}>
                <Text style={[styles.ratingTitle, { color: colors.foreground }]}>Classificação de Crédito</Text>
                <Text style={[styles.ratingDesc, { color: ratingColor }]}>{CREDIT_RATING_LABELS[creditRating]}</Text>
              </View>
            </View>

            {/* Bankruptcy Risk */}
            <View style={[styles.riskCard, { backgroundColor: riskColor + "11", borderColor: riskColor + "44" }]}>
              <Feather name={bankruptcyRisk === "safe" ? "shield" : "alert-triangle"} size={18} color={riskColor} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.riskTitle, { color: riskColor }]}>{BANKRUPTCY_RISK_LABELS[bankruptcyRisk]}</Text>
                <Text style={[styles.riskSub, { color: colors.mutedForeground }]}>
                  Caixa: {formatMoney(state.money)} · Despesas/mês: {formatMoney(totalMonthlyExpenses + monthlyLoanCost)}
                </Text>
              </View>
            </View>

            {/* Key metrics */}
            <View style={styles.metricsGrid}>
              <MetricCard label="Dívida Total" value={formatMoney(totalDebt)} icon="trending-down" color="#FF4D6A" colors={colors} />
              <MetricCard label="Parcelas/Mês" value={formatMoney(monthlyLoanCost)} icon="calendar" color="#F5A623" colors={colors} />
              <MetricCard label="Receita Est./Mês" value={formatMoney(Math.round(monthlyRevEstimate))} icon="trending-up" color="#10B981" colors={colors} />
              <MetricCard label="Total Pago" value={formatMoney(state.totalLoansPaid ?? 0)} icon="check-circle" color="#4DA6FF" colors={colors} />
            </View>

            {/* Cash flow projection */}
            <CollapsibleSection
              title="Projeção de Caixa (12 meses)"
              accent="#10B981"
              badge={`${formatMoney(cashFlow[cashFlow.length - 1]?.projected ?? 0)}`}
              badgeColor={(cashFlow[cashFlow.length - 1]?.projected ?? 0) >= 0 ? "#10B981" : "#FF4D6A"}
            >
              <View style={styles.cashFlowChart}>
                {cashFlow.map((point, i) => {
                  const maxVal = Math.max(...cashFlow.map((p) => Math.abs(p.projected)), 1);
                  const barH = Math.min(80, Math.round((Math.abs(point.projected) / maxVal) * 80));
                  const isPos = point.projected >= 0;
                  return (
                    <View key={i} style={styles.cashFlowBar}>
                      <View style={[styles.cashBarFill, {
                        height: barH,
                        backgroundColor: isPos ? "#10B981" : "#FF4D6A",
                        opacity: 0.7 + (i / cashFlow.length) * 0.3,
                      }]} />
                      <Text style={[styles.cashBarLabel, { color: colors.mutedForeground }]}>
                        {MONTHS_PT[point.month - 1]}
                      </Text>
                    </View>
                  );
                })}
              </View>
              <View style={styles.cashFlowLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: "#10B981" }]} />
                  <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Saldo positivo</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: "#FF4D6A" }]} />
                  <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Saldo negativo</Text>
                </View>
              </View>
            </CollapsibleSection>

            {/* Monthly expenses breakdown */}
            <CollapsibleSection
              title="Despesas Mensais"
              accent="#FF4D6A"
              badge={formatMoney(totalMonthlyExpenses + monthlyLoanCost)}
              badgeColor="#FF4D6A"
            >
              <ExpRow label="Escritórios" value={monthlyOfficeCost} icon="home" color="#4DA6FF" colors={colors} />
              <ExpRow label="Salários" value={monthlySalaryCost} icon="users" color="#A855F7" colors={colors} />
              <ExpRow label="Filiais" value={branchCosts} icon="globe" color="#10B981" colors={colors} />
              <ExpRow label="Empréstimos" value={monthlyLoanCost} icon="credit-card" color="#FF4D6A" colors={colors} />
              <View style={[styles.expTotal, { borderTopColor: colors.border }]}>
                <Text style={[styles.expTotalLabel, { color: colors.foreground }]}>Total</Text>
                <Text style={[styles.expTotalValue, { color: "#FF4D6A" }]}>{formatMoney(totalMonthlyExpenses + monthlyLoanCost)}</Text>
              </View>
            </CollapsibleSection>

            {/* Upcoming unlock progress — only shown when not yet unlocked */}
            {(!stockUnlocked || !acqUnlocked) && (() => {
              const cv = state.companyValue ?? 0;
              const stockItems = [
                { label: `Ano ≥ ${STOCK_MARKET_UNLOCK.minYear}`, done: state.year >= STOCK_MARKET_UNLOCK.minYear, detail: `atual: ${state.year}` },
                { label: `Valorização ≥ ${formatMoney(STOCK_MARKET_UNLOCK.minValue)}`, done: cv >= STOCK_MARKET_UNLOCK.minValue, detail: `atual: ${formatMoney(cv)}`, pct: Math.min(1, cv / STOCK_MARKET_UNLOCK.minValue) },
                { label: `Reputação ≥ ${STOCK_MARKET_UNLOCK.minReputation}`, done: state.reputation >= STOCK_MARKET_UNLOCK.minReputation, detail: `atual: ${Math.round(state.reputation)}` },
              ];
              const acqItems = [
                { label: `Ano ≥ ${ACQUISITIONS_UNLOCK.minYear}`, done: state.year >= ACQUISITIONS_UNLOCK.minYear, detail: `atual: ${state.year}` },
                { label: `Valorização ≥ ${formatMoney(ACQUISITIONS_UNLOCK.minValue)}`, done: cv >= ACQUISITIONS_UNLOCK.minValue, detail: `atual: ${formatMoney(cv)}`, pct: Math.min(1, cv / ACQUISITIONS_UNLOCK.minValue) },
              ];
              return (
                <View style={styles.section}>
                  {!acqUnlocked && (
                    <UnlockProgressCard
                      title="🔒 Mercado de Aquisições"
                      subtitle="Compra empresas que amplificam as tuas capacidades"
                      items={acqItems}
                      colors={colors}
                    />
                  )}
                  {!stockUnlocked && (
                    <UnlockProgressCard
                      title="🔒 Mercado de Capitais"
                      subtitle="Investidores, ações, dividendos e pressão do conselho"
                      items={stockItems}
                      colors={colors}
                    />
                  )}
                </View>
              );
            })()}
          </View>
        )}

        {/* ── ACTIVE LOANS ── */}
        {tab === "loans" && (
          <View style={styles.section}>
            {activeLoans.length === 0 ? (
              <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="check-circle" size={32} color="#10B981" />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Sem dívidas ativas</Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  A tua empresa está livre de empréstimos. Solicita financiamento para acelerar o crescimento.
                </Text>
                <TouchableOpacity onPress={() => setTab("new_loan")} style={styles.emptyBtn}>
                  <Text style={styles.emptyBtnText}>Solicitar Empréstimo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              activeLoans.map((loan) => (
                <LoanCard key={loan.id} loan={loan} colors={colors} />
              ))
            )}
          </View>
        )}

        {/* ── NEW LOAN ── */}
        {tab === "new_loan" && (
          <View style={styles.section}>
            {/* Credit rating reminder */}
            <View style={[styles.creditReminder, { backgroundColor: ratingColor + "11", borderColor: ratingColor + "33" }]}>
              <Text style={[styles.creditReminderText, { color: ratingColor }]}>
                Rating atual: {creditRating} — {CREDIT_RATING_LABELS[creditRating]}
              </Text>
            </View>

            <Text style={[styles.sectionTitle, { color: "#4DA6FF88" }]}>TIPO DE FINANCIAMENTO</Text>
            {LOAN_TYPES.filter((l) => l.minYear <= state.year).map((loanType) => {
              const isSelected = selectedLoanType === loanType.id;
              const rate = calculateInterestRate(loanType, creditRating, state.year);
              const ratingOrder = ["AAA", "AA", "A", "BBB", "BB", "B", "CCC", "D"];
              const minIdx = ratingOrder.indexOf(loanType.minCreditRating);
              const currentIdx = ratingOrder.indexOf(creditRating);
              const isAvail = currentIdx <= minIdx;

              return (
                <TouchableOpacity
                  key={loanType.id}
                  onPress={() => isAvail ? setSelectedLoanType(loanType.id) : null}
                  activeOpacity={isAvail ? 0.8 : 1}
                  style={[styles.loanTypeCard, {
                    backgroundColor: isSelected ? "#4DA6FF11" : colors.card,
                    borderColor: isSelected ? "#4DA6FF" : colors.border,
                    opacity: isAvail ? 1 : 0.45,
                  }]}
                >
                  <View style={[styles.loanTypeIcon, { backgroundColor: isAvail ? "#4DA6FF22" : colors.secondary }]}>
                    <Feather name={loanType.icon as any} size={18} color={isAvail ? "#4DA6FF" : colors.mutedForeground} />
                  </View>
                  <View style={styles.loanTypeInfo}>
                    <View style={styles.loanTypeHeader}>
                      <Text style={[styles.loanTypeName, { color: isAvail ? colors.foreground : colors.mutedForeground }]}>
                        {loanType.name}
                      </Text>
                      {!isAvail && (
                        <View style={[styles.lockBadge, { backgroundColor: "#FF4D6A22" }]}>
                          <Feather name="lock" size={9} color="#FF4D6A" />
                          <Text style={styles.lockBadgeText}>Rating {loanType.minCreditRating}+</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.loanTypeDesc, { color: colors.mutedForeground }]}>{loanType.description}</Text>
                    <View style={styles.loanTypeStats}>
                      <Text style={[styles.loanTypeStat, { color: "#10B981" }]}>
                        Máx: {formatMoney(loanType.maxAmount)}
                      </Text>
                      <Text style={[styles.loanTypeStat, { color: "#F5A623" }]}>
                        {(rate * 100).toFixed(1)}% a.a.
                      </Text>
                      <Text style={[styles.loanTypeStat, { color: "#4DA6FF" }]}>
                        {loanType.termMonths}m
                      </Text>
                    </View>
                  </View>
                  {isSelected && <Feather name="check-circle" size={18} color="#4DA6FF" />}
                </TouchableOpacity>
              );
            })}

            {selectedLoanType && selectedLoanTypeObj && (
              <>
                <Text style={[styles.sectionTitle, { color: "#4DA6FF88", marginTop: 12 }]}>VALOR SOLICITADO</Text>
                <View style={[styles.amountInput, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                  <Feather name="dollar-sign" size={16} color={colors.primary} />
                  <TextInput
                    value={loanAmount}
                    onChangeText={setLoanAmount}
                    keyboardType="numeric"
                    placeholder={`Máx: ${formatMoney(selectedLoanTypeObj.maxAmount)}`}
                    placeholderTextColor={colors.mutedForeground}
                    style={[styles.amountInputText, { color: colors.foreground }]}
                  />
                </View>

                {parsedAmount > 0 && (
                  <View style={[styles.loanPreview, { backgroundColor: "#4DA6FF11", borderColor: "#4DA6FF33" }]}>
                    <Text style={[styles.previewTitle, { color: "#4DA6FF" }]}>Simulação</Text>
                    <PreviewRow label="Valor solicitado" value={formatMoney(parsedAmount)} colors={colors} />
                    <PreviewRow label="Taxa anual" value={`${(previewRate * 100).toFixed(2)}%`} colors={colors} />
                    <PreviewRow label="Prazo" value={`${selectedLoanTypeObj.termMonths} meses`} colors={colors} />
                    <PreviewRow label="Parcela mensal" value={formatMoney(Math.round(previewMonthly))} colors={colors} col="#FF4D6A" />
                    <PreviewRow label="Total a pagar" value={formatMoney(Math.round(previewMonthly * selectedLoanTypeObj.termMonths))} colors={colors} col="#F5A623" />
                  </View>
                )}

                <TouchableOpacity
                  onPress={handleTakeLoan}
                  style={[styles.takeLoanBtn, { opacity: parsedAmount > 0 ? 1 : 0.45 }]}
                  disabled={parsedAmount <= 0}
                >
                  <LinearGradient colors={["#10B981", "#059669"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.takeLoanBtnInner}>
                    <Feather name="check-circle" size={16} color="#fff" />
                    <Text style={styles.takeLoanBtnText}>Solicitar Empréstimo</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* ── EMPRESA (locked gate) ── */}
        {tab === "empresa" && !stockUnlocked && (() => {
          const cv = state.companyValue ?? 0;
          return (
            <View style={styles.section}>
              <LockedTabScreen
                icon="pie-chart"
                title="Mercado de Capitais"
                description={"Desbloqueia o sistema de ações, investidores e dividendos. Investidores institucionais começam a notar empresas com valorização real e reputação estabelecida.\n\nUma vez desbloqueado, podes vender participações para obter capital, aceitar ou recusar propostas de investimento, e gerir o conselho de acionistas."}
                items={[
                  { label: `Ano ≥ ${STOCK_MARKET_UNLOCK.minYear}`, done: state.year >= STOCK_MARKET_UNLOCK.minYear, detail: state.year < STOCK_MARKET_UNLOCK.minYear ? `faltam ${STOCK_MARKET_UNLOCK.minYear - state.year} anos` : "✓" },
                  { label: `Valorização ≥ ${formatMoney(STOCK_MARKET_UNLOCK.minValue)}`, done: cv >= STOCK_MARKET_UNLOCK.minValue, pct: Math.min(1, cv / STOCK_MARKET_UNLOCK.minValue), detail: `${formatMoney(cv)} / ${formatMoney(STOCK_MARKET_UNLOCK.minValue)}` },
                  { label: `Reputação ≥ ${STOCK_MARKET_UNLOCK.minReputation}`, done: state.reputation >= STOCK_MARKET_UNLOCK.minReputation, detail: `${Math.round(state.reputation)} / ${STOCK_MARKET_UNLOCK.minReputation}` },
                ]}
                colors={colors}
              />
            </View>
          );
        })()}

        {/* ── EMPRESA ── */}
        {tab === "empresa" && stockUnlocked && (() => {
          const TOTAL_SH = state.totalShares ?? 10000;
          const playerSh = state.playerShares ?? TOTAL_SH;
          const playerPct = Math.round((playerSh / TOTAL_SH) * 100);
          const investorSh = TOTAL_SH - playerSh;
          const investorPct = 100 - playerPct;
          const companyVal = state.companyValue ?? 0;
          const sharePrice = state.sharePrice ?? 0;
          const pendingOffers = state.pendingOffers ?? [];
          const investors = state.investors ?? [];

          // Real calculated consequences
          const monthlyDividend = companyVal > 0
            ? Math.round(companyVal * (investorSh / TOTAL_SH) * (0.018 / 12))
            : 0;
          const hasPredatoryInvestor = investors.some((inv) => inv.personality === "predatory");
          const isBoardPressured = investorPct >= 40;
          const isTakeoverRisk = hasPredatoryInvestor && playerPct < 30;
          const pressSeverityLabel = investorPct >= 60 ? "CRÍTICA" : investorPct >= 40 ? "MODERADA" : null;
          const pressSeverityColor = investorPct >= 60 ? "#FF4D6A" : "#F5A623";

          const PERSONALITY_LABELS_LOCAL: Record<string, string> = {
            conservative: "Conservador — prefere estabilidade",
            aggressive: "Agressivo — exige crescimento rápido",
            visionary: "Visionário — apoia inovação",
            opportunistic: "Oportunista — pode virar a qualquer momento",
            predatory: "Predatório — pode tentar tomada hostil",
          };

          return (
            <View style={styles.section}>
              {/* Takeover / board pressure alert */}
              {(isTakeoverRisk || isBoardPressured) && (
                <View style={[styles.alertBanner, { backgroundColor: (isTakeoverRisk ? "#FF4D6A" : pressSeverityColor) + "18", borderColor: (isTakeoverRisk ? "#FF4D6A" : pressSeverityColor) + "55" }]}>
                  <Feather name={isTakeoverRisk ? "alert-octagon" : "alert-triangle"} size={16} color={isTakeoverRisk ? "#FF4D6A" : pressSeverityColor} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.alertTitle, { color: isTakeoverRisk ? "#FF4D6A" : pressSeverityColor }]}>
                      {isTakeoverRisk ? "⚠️ RISCO DE TOMADA HOSTIL" : `PRESSÃO DO CONSELHO — ${pressSeverityLabel}`}
                    </Text>
                    <Text style={[styles.alertDesc, { color: colors.mutedForeground }]}>
                      {isTakeoverRisk
                        ? `Investidor predatório detectado. Com apenas ${playerPct}% de controlo, estás vulnerável. Recompra ações urgentemente.`
                        : `Investidores externos controlam ${investorPct}%. Cada trimestre sofres penalidade de reputação e dividendos obrigatórios de ${formatMoney(monthlyDividend)}/mês.`}
                    </Text>
                  </View>
                </View>
              )}

              {/* Valuation card */}
              <View style={[styles.sectionBox, { backgroundColor: colors.card, borderColor: "#4DA6FF33", overflow: "hidden" }]}>
                <LinearGradient colors={["#4DA6FF11", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                <Text style={[styles.boxTitle, { color: "#4DA6FF" }]}>Valorização da Empresa</Text>
                <Text style={[styles.bigValue, { color: colors.foreground }]}>{formatMoney(companyVal)}</Text>
                <Text style={[styles.subLabel, { color: colors.mutedForeground }]}>
                  Preço por ação: {formatMoney(sharePrice)} · {TOTAL_SH.toLocaleString()} ações no total
                </Text>
                <View style={styles.dividendRow}>
                  <Feather name="arrow-up-right" size={13} color="#10B981" />
                  <Text style={[styles.dividendLabel, { color: colors.mutedForeground }]}>Dividendos pagos a investidores:</Text>
                  <Text style={[styles.dividendAmount, { color: monthlyDividend > 0 ? "#FF4D6A" : colors.mutedForeground }]}>
                    {monthlyDividend > 0 ? `-${formatMoney(monthlyDividend)}/mês` : "Nenhum (sem acionistas)"}
                  </Text>
                </View>
                {companyVal > 0 && (
                  <View style={styles.creditBoostRow}>
                    <Feather name="shield" size={12} color="#F5A623" />
                    <Text style={[styles.creditBoostText, { color: colors.mutedForeground }]}>
                      {companyVal >= 500_000_000 ? "Valorização garante rating mínimo AA"
                        : companyVal >= 100_000_000 ? "Valorização garante rating mínimo A"
                        : companyVal >= 50_000_000 ? "Valorização garante rating mínimo BBB"
                        : companyVal >= 10_000_000 ? "Valorização garante rating mínimo BB"
                        : "Valorização ainda abaixo do patamar de crédito garantido"}
                    </Text>
                  </View>
                )}
              </View>

              {/* Ownership bar */}
              <CollapsibleSection
                title="Estrutura de Capital"
                accent="#4DA6FF"
                badge={`${playerPct}% seu`}
                badgeColor={playerPct < 30 ? "#FF4D6A" : playerPct < 60 ? "#F5A623" : "#10B981"}
              >
                <View style={styles.ownershipBar}>
                  <View style={{ flex: playerPct || 1, backgroundColor: "#4DA6FF", borderRadius: 4 }} />
                  {investorPct > 0 && <View style={{ flex: investorPct, backgroundColor: isBoardPressured ? "#FF4D6A" : "#F5A623", borderRadius: 4 }} />}
                </View>
                <View style={styles.ownershipLegend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: "#4DA6FF" }]} />
                    <Text style={[styles.legendText, { color: colors.foreground }]}>Tu: {playerPct}% ({playerSh.toLocaleString()} ações)</Text>
                  </View>
                  {investorPct > 0 && (
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: isBoardPressured ? "#FF4D6A" : "#F5A623" }]} />
                      <Text style={[styles.legendText, { color: colors.foreground }]}>Investidores: {investorPct}% ({investorSh.toLocaleString()} ações)</Text>
                    </View>
                  )}
                </View>
                {/* Danger zone thresholds */}
                <View style={styles.thresholdRow}>
                  <View style={[styles.threshold, { left: `${100 - 40}%` as any }]}>
                    <View style={[styles.thresholdLine, { backgroundColor: "#F5A623" }]} />
                    <Text style={styles.thresholdLabel}>40% pressão</Text>
                  </View>
                  <View style={[styles.threshold, { left: `${100 - 70}%` as any }]}>
                    <View style={[styles.thresholdLine, { backgroundColor: "#FF4D6A" }]} />
                    <Text style={[styles.thresholdLabel, { color: "#FF4D6A" }]}>70% controlo perdido</Text>
                  </View>
                </View>
              </CollapsibleSection>

              {/* Stock price history mini chart */}
              {(() => {
                const history = state.stockPriceHistory ?? [];
                if (history.length < 2) return null;
                const prices = history.map((h) => h.price);
                const maxP = Math.max(...prices, 0.01);
                const minP = Math.min(...prices, 0);
                const range = maxP - minP || 1;
                const trend = prices[prices.length - 1] - prices[0];
                const trendColor = trend >= 0 ? "#10B981" : "#FF4D6A";
                return (
                  <CollapsibleSection
                    title="Preço das Ações (24m)"
                    accent={trendColor}
                    badge={`${trend >= 0 ? "+" : ""}${((trend / (prices[0] || 1)) * 100).toFixed(1)}%`}
                    badgeColor={trendColor}
                  >
                    <View style={styles.stockChartRow}>
                      {history.map((pt, i) => {
                        const normH = Math.max(4, Math.round(((pt.price - minP) / range) * 52));
                        const isLast = i === history.length - 1;
                        return (
                          <View key={i} style={styles.stockBarWrap}>
                            <View style={[styles.stockBar, {
                              height: normH,
                              backgroundColor: isLast ? "#F5A623" : (pt.price >= (prices[i - 1] ?? pt.price) ? "#10B981" : "#FF4D6A"),
                              opacity: 0.6 + (i / history.length) * 0.4,
                            }]} />
                          </View>
                        );
                      })}
                    </View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={{ color: colors.mutedForeground, fontSize: 10 }}>Mín: {formatMoney(minP)}</Text>
                      <Text style={{ color: colors.foreground, fontSize: 11, fontFamily: "Inter_600SemiBold" }}>
                        Atual: {formatMoney(sharePrice)}
                      </Text>
                      <Text style={{ color: colors.mutedForeground, fontSize: 10 }}>Máx: {formatMoney(maxP)}</Text>
                    </View>
                  </CollapsibleSection>
                );
              })()}

              {/* Sell / Buy-back shares — new action row */}
              {(() => {
                const approxMonthlyProfit = state.money > 0
                  ? Math.round(safeTotalRevenue / Math.max(1, (state.year - 1972) * 12 + state.month))
                  : 0;
                const buybackPremium = getBuybackPremium(approxMonthlyProfit);
                return (
                  <View style={styles.shareActionsRow}>
                    <TouchableOpacity
                      style={[styles.shareBtn, { backgroundColor: "#FF4D6A11", borderColor: "#FF4D6A44" }]}
                      onPress={() => {
                        setListingMinAsk(sharePrice > 0 ? sharePrice.toFixed(2) : "");
                        setShowListingModal(true);
                      }}
                    >
                      <Feather name="tag" size={15} color="#FF4D6A" />
                      <Text style={[styles.shareBtnText, { color: "#FF4D6A" }]}>Listar para Venda</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.shareBtn, { backgroundColor: "#10B98111", borderColor: "#10B98144" }]}
                      onPress={() => setShowBuybackModal(true)}
                      disabled={investorPct === 0}
                    >
                      <Feather name="trending-up" size={15} color={investorPct === 0 ? colors.mutedForeground : "#10B981"} />
                      <Text style={[styles.shareBtnText, { color: investorPct === 0 ? colors.mutedForeground : "#10B981" }]}>
                        Recomprar ({buybackPremium.toFixed(0)}% prém.)
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })()}

              {/* Open sell listings with bids */}
              {(() => {
                const listings = state.stockListings ?? [];
                if (listings.length === 0) return null;
                return (
                  <View style={[styles.sectionBox, { backgroundColor: colors.card, borderColor: "#F5A62333" }]}>
                    <Text style={[styles.boxTitle, { color: "#F5A623" }]}>
                      Listagens de Venda Ativas ({listings.length})
                    </Text>
                    {listings.map((listing) => {
                      const listingValue = Math.round((listing.percentForSale / 100) * (state.companyValue ?? 0));
                      const sortedBids = [...listing.bids].sort((a, b) => b.offerPerShare - a.offerPerShare);
                      return (
                        <View key={listing.id} style={[styles.offerCard, { borderColor: "#F5A62333", marginTop: 8 }]}>
                          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                            <View>
                              <Text style={[styles.offerName, { color: colors.foreground }]}>
                                {listing.percentForSale}% da empresa
                              </Text>
                              <Text style={[styles.offerCountry, { color: colors.mutedForeground }]}>
                                Mín: {formatMoney(listing.minAskPerShare)}/ação · Val: {formatMoney(listingValue)}
                              </Text>
                              <Text style={[styles.offerCountry, { color: colors.mutedForeground }]}>
                                Listada em {MONTHS_PT[listing.listedMonth - 1]}/{listing.listedYear}
                              </Text>
                            </View>
                            <TouchableOpacity
                              onPress={() => {
                                Alert.alert(
                                  "Cancelar Listagem",
                                  "Tem certeza que deseja cancelar esta listagem? Todos os lances serão descartados.",
                                  [
                                    { text: "Manter", style: "cancel" },
                                    { text: "Cancelar Listagem", style: "destructive", onPress: () => cancelStockListing(listing.id) },
                                  ]
                                );
                              }}
                              style={[styles.offerBtn, { backgroundColor: "#FF4D6A11", borderColor: "#FF4D6A33" }]}
                            >
                              <Text style={{ color: "#FF4D6A", fontSize: 11, fontWeight: "600" }}>Cancelar</Text>
                            </TouchableOpacity>
                          </View>

                          {sortedBids.length === 0 ? (
                            <View style={[styles.noBidsBanner, { borderColor: colors.border }]}>
                              <Feather name="clock" size={13} color={colors.mutedForeground} />
                              <Text style={[styles.noBidsText, { color: colors.mutedForeground }]}>
                                A aguardar propostas de investidores… (aprox. 1-3 meses)
                              </Text>
                            </View>
                          ) : (
                            <>
                              <Text style={[{ color: "#4DA6FF", fontSize: 11, fontFamily: "Inter_600SemiBold", marginTop: 8 }]}>
                                {sortedBids.length} proposta{sortedBids.length !== 1 ? "s" : ""} recebida{sortedBids.length !== 1 ? "s" : ""}
                              </Text>
                              {sortedBids.map((bid, bi) => {
                                const isBest = bi === 0;
                                const pColor = PERSONALITY_COLORS[bid.personality] ?? "#4DA6FF";
                                const dividend = Math.round((state.companyValue ?? 0) * (listing.percentForSale / 100) * (0.018 / 12));
                                return (
                                  <View key={bid.id} style={[styles.bidRow, {
                                    borderColor: isBest ? "#10B98155" : colors.border,
                                    backgroundColor: isBest ? "#10B98108" : colors.secondary,
                                  }]}>
                                    {isBest && (
                                      <View style={styles.bestBadge}>
                                        <Text style={styles.bestBadgeText}>MELHOR</Text>
                                      </View>
                                    )}
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                      <Text style={styles.offerFlag}>{bid.countryFlag}</Text>
                                      <View style={{ flex: 1 }}>
                                        <Text style={[styles.offerName, { color: colors.foreground, fontSize: 13 }]}>
                                          {bid.investorName}
                                        </Text>
                                        <Text style={[{ fontSize: 11, color: pColor, fontFamily: "Inter_600SemiBold" }]}>
                                          {PERSONALITY_LABELS[bid.personality]}
                                        </Text>
                                      </View>
                                      <View style={{ alignItems: "flex-end" }}>
                                        <Text style={[styles.offerAmount, { color: "#10B981" }]}>
                                          {formatMoney(bid.totalOffer)}
                                        </Text>
                                        <Text style={[{ color: colors.mutedForeground, fontSize: 10 }]}>
                                          {formatMoney(bid.offerPerShare)}/ação
                                        </Text>
                                      </View>
                                    </View>
                                    <Text style={[styles.offerTerms, { color: "#F5A623", marginTop: 4 }]}>
                                      Condições: {bid.conditions}
                                    </Text>
                                    {dividend > 0 && (
                                      <Text style={[{ color: "#FF4D6A", fontSize: 11 }]}>
                                        Dividendo: -{formatMoney(dividend)}/mês
                                      </Text>
                                    )}
                                    <Text style={[{ color: colors.mutedForeground, fontSize: 10 }]}>
                                      Expira: {MONTHS_PT[bid.expiresMonth - 1]}/{bid.expiresYear}
                                    </Text>
                                    <View style={[styles.offerBtns, { marginTop: 6 }]}>
                                      <TouchableOpacity
                                        style={[styles.offerBtn, { backgroundColor: "#10B98120", borderColor: "#10B98144" }]}
                                        onPress={() => {
                                          Alert.alert(
                                            "Aceitar Lance",
                                            `${bid.investorName} oferece ${formatMoney(bid.totalOffer)} por ${listing.percentForSale}% da empresa.\n\nDividendos mensais: ${formatMoney(dividend)}/mês\n\nCondições: ${bid.conditions}\n\nConfirmar?`,
                                            [
                                              { text: "Cancelar", style: "cancel" },
                                              {
                                                text: "Aceitar",
                                                onPress: () => {
                                                  const err = acceptStockBid(listing.id, bid.id);
                                                  if (err) Alert.alert("Erro", err);
                                                  else Alert.alert("Lance aceite!", `${bid.investorName} tornou-se acionista com ${listing.percentForSale}% da empresa. ${formatMoney(bid.totalOffer)} adicionados ao caixa.`);
                                                },
                                              },
                                            ]
                                          );
                                        }}
                                      >
                                        <Text style={{ color: "#10B981", fontWeight: "600", fontSize: 12 }}>Aceitar Lance</Text>
                                      </TouchableOpacity>
                                      <TouchableOpacity
                                        style={[styles.offerBtn, { backgroundColor: "#FF4D6A11", borderColor: "#FF4D6A33" }]}
                                        onPress={() => rejectStockBid(listing.id, bid.id)}
                                      >
                                        <Text style={{ color: "#FF4D6A", fontWeight: "600", fontSize: 12 }}>Recusar</Text>
                                      </TouchableOpacity>
                                    </View>
                                  </View>
                                );
                              })}
                            </>
                          )}
                        </View>
                      );
                    })}
                  </View>
                );
              })()}

              {/* Pending offers */}
              {pendingOffers.length > 0 && (
                <CollapsibleSection
                  title={`Propostas de Investimento (${pendingOffers.length})`}
                  accent="#F5A623"
                  badge={`${pendingOffers.length} pendente${pendingOffers.length > 1 ? "s" : ""}`}
                  badgeColor="#F5A623"
                >
                  {pendingOffers.map((offer) => {
                    const offerDividend = companyVal > 0
                      ? Math.round(companyVal * (offer.desiredSharePercent / 100) * (0.018 / 12))
                      : 0;
                    const PERSONALITY_RISK: Record<string, { label: string; color: string }> = {
                      conservative:  { label: "Baixo risco", color: "#10B981" },
                      aggressive:    { label: "Risco médio — exige crescimento", color: "#F5A623" },
                      visionary:     { label: "Baixo risco — apoia inovação", color: "#4DA6FF" },
                      opportunistic: { label: "Risco alto — pode vender a qualquer momento", color: "#F5A623" },
                      predatory:     { label: "RISCO CRÍTICO — pode tentar tomada hostil", color: "#FF4D6A" },
                    };
                    const risk = PERSONALITY_RISK[offer.personality] ?? { label: "Desconhecido", color: colors.mutedForeground };
                    return (
                      <View key={offer.id} style={[styles.offerCard, { borderColor: "#F5A62333" }]}>
                        <View style={styles.offerHeader}>
                          <Text style={styles.offerFlag}>{offer.countryFlag}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.offerName, { color: colors.foreground }]}>{offer.investorName}</Text>
                            <Text style={[styles.offerCountry, { color: colors.mutedForeground }]}>{offer.country}</Text>
                          </View>
                          <Text style={[styles.offerAmount, { color: "#10B981" }]}>{formatMoney(offer.offerAmount)}</Text>
                        </View>
                        <Text style={[{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: risk.color }]}>{risk.label}</Text>
                        <Text style={[styles.offerDesc, { color: colors.mutedForeground }]}>
                          Quer {offer.desiredSharePercent}% das ações por {formatMoney(offer.offerAmount)}.
                          {offerDividend > 0 ? ` Criará dividendo de ${formatMoney(offerDividend)}/mês.` : ""}
                          {" "}Expira: {MONTHS_PT[offer.expiresMonth - 1]}/{offer.expiresYear}
                        </Text>
                        {offer.conditions && offer.conditions.length > 0 && (
                          <Text style={[styles.offerTerms, { color: "#F5A623" }]}>Condições: {offer.conditions}</Text>
                        )}
                        <View style={styles.offerBtns}>
                          <TouchableOpacity
                            style={[styles.offerBtn, { backgroundColor: "#10B98120", borderColor: "#10B98144" }]}
                            onPress={() => {
                              const err = acceptOffer(offer.id);
                              if (err) Alert.alert("Erro", err);
                              else Alert.alert("Investimento aceite!", `${offer.investorName} investiu ${formatMoney(offer.offerAmount)}.\n\nDividendos mensais: ${formatMoney(offerDividend)}/mês.\nMonitoriza a pressão do conselho.`);
                            }}
                          >
                            <Text style={{ color: "#10B981", fontWeight: "600" }}>Aceitar</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.offerBtn, { backgroundColor: "#FF4D6A11", borderColor: "#FF4D6A33" }]}
                            onPress={() => rejectOffer(offer.id)}
                          >
                            <Text style={{ color: "#FF4D6A", fontWeight: "600" }}>Recusar</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </CollapsibleSection>
              )}

              {/* Current investors with personality impact */}
              {investors.length > 0 && (
                <CollapsibleSection
                  title={`Acionistas Atuais (${investors.length})`}
                  accent={isBoardPressured ? "#FF4D6A" : "#A855F7"}
                  badge={`${investorPct}% externo`}
                  badgeColor={isBoardPressured ? "#FF4D6A" : "#A855F7"}
                >
                  {investors.map((inv) => {
                    const invPct = Math.round((inv.sharesOwned / TOTAL_SH) * 100);
                    const invDividend = companyVal > 0
                      ? Math.round(companyVal * (inv.sharesOwned / TOTAL_SH) * (0.018 / 12))
                      : 0;
                    const personalityDesc = PERSONALITY_LABELS_LOCAL[inv.personality] ?? inv.personality;
                    const isDangerous = inv.personality === "predatory" || inv.personality === "opportunistic";
                    return (
                      <View key={inv.id} style={[styles.investorRow, { borderTopColor: colors.border }]}>
                        <Text style={styles.offerFlag}>{inv.countryFlag}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.offerName, { color: isDangerous ? "#FF4D6A" : colors.foreground }]}>{inv.name}</Text>
                          <Text style={[styles.offerCountry, { color: colors.mutedForeground }]}>{personalityDesc}</Text>
                          <Text style={[styles.offerCountry, { color: "#FF4D6A" }]}>
                            -{formatMoney(invDividend)}/mês em dividendos
                          </Text>
                        </View>
                        <Text style={[styles.offerAmount, { color: "#4DA6FF" }]}>{invPct}%</Text>
                      </View>
                    );
                  })}
                </CollapsibleSection>
              )}
            </View>
          );
        })()}

        {/* ── AQUISIÇÕES (locked gate) ── */}
        {tab === "acquisicoes" && !acqUnlocked && (() => {
          const cv = state.companyValue ?? 0;
          return (
            <View style={styles.section}>
              <LockedTabScreen
                icon="briefcase"
                title="Mercado de Aquisições"
                description={"Compra estúdios, laboratórios de hardware, distribuidoras e agências de marketing. Cada aquisição tem efeitos reais no jogo — pesquisa mais rápida, melhor rating de consolas, mais receita de jogos, marketing mais eficaz.\n\nO mercado abre quando tens capital suficiente para o risco."}
                items={[
                  { label: `Ano ≥ ${ACQUISITIONS_UNLOCK.minYear}`, done: state.year >= ACQUISITIONS_UNLOCK.minYear, detail: state.year < ACQUISITIONS_UNLOCK.minYear ? `faltam ${ACQUISITIONS_UNLOCK.minYear - state.year} anos` : "✓" },
                  { label: `Valorização ≥ ${formatMoney(ACQUISITIONS_UNLOCK.minValue)}`, done: cv >= ACQUISITIONS_UNLOCK.minValue, pct: Math.min(1, cv / ACQUISITIONS_UNLOCK.minValue), detail: `${formatMoney(cv)} / ${formatMoney(ACQUISITIONS_UNLOCK.minValue)}` },
                ]}
                colors={colors}
              />
            </View>
          );
        })()}

        {/* ── AQUISIÇÕES ── */}
        {tab === "acquisicoes" && acqUnlocked && (() => {
          const owned = state.acquisitions ?? [];
          const ownedIds = new Set(owned.map((a) => a.id));
          const available = ACQUIRABLE_COMPANIES.filter((c) => c.availableFromYear <= state.year && !ownedIds.has(c.id));
          const locked = ACQUIRABLE_COMPANIES.filter((c) => c.availableFromYear > state.year);

          const sponsorOpps = (state.sponsorshipOpportunities ?? []).filter((o) => {
            if (o.expiresYear < state.year) return false;
            if (o.expiresYear === state.year && o.expiresMonth <= state.month) return false;
            return true;
          });

          return (
            <View style={styles.section}>

              {/* ── Sponsorship Opportunities ── */}
              {sponsorOpps.length > 0 && (
                <View style={[styles.sectionBox, { backgroundColor: colors.card, borderColor: "#F59E0B33" }]}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <Feather name="trending-up" size={15} color="#F59E0B" />
                    <Text style={[styles.boxTitle, { color: "#F59E0B", marginBottom: 0 }]}>Patrocínios Disponíveis ({sponsorOpps.length})</Text>
                  </View>
                  <Text style={{ fontSize: 11, color: colors.mutedForeground, marginBottom: 8 }}>
                    Investe em eventos externos. Retorno variável — risco proporcional ao porte do evento.
                  </Text>
                  {sponsorOpps.map((opp) => {
                    const PRESET_AMOUNTS = [500_000, 1_000_000, 5_000_000, 10_000_000, 25_000_000, 50_000_000]
                      .filter((a) => a <= opp.maxInvestment && a <= state.money);
                    const selectedAmt = sponsorAmounts[opp.id] ?? PRESET_AMOUNTS[0] ?? 0;
                    const scaleColor  = SCALE_COLORS[opp.scale] ?? "#4DA6FF";
                    const monthsLeft = (opp.expiresYear - state.year) * 12 + (opp.expiresMonth - state.month);
                    const expiresIn  = monthsLeft <= 1 ? "este mês" : monthsLeft < 12 ? `${monthsLeft} meses` : `${opp.expiresYear - state.year} ano(s)`;
                    return (
                      <View key={opp.id} style={[styles.sponsorCard, { borderColor: `${scaleColor}33` }]}>
                        <LinearGradient colors={[`${scaleColor}09`, "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                        {/* Header */}
                        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                          <View style={[styles.sponsorIconCircle, { backgroundColor: `${scaleColor}22` }]}>
                            <Feather name={opp.icon as any} size={16} color={scaleColor} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.acqName, { color: colors.foreground }]}>{opp.title}</Text>
                            <Text style={[styles.acqSector, { color: colors.mutedForeground }]}>
                              {CATEGORY_LABELS[opp.category] ?? opp.category} · {SCALE_LABELS[opp.scale]}
                            </Text>
                          </View>
                          <View style={[styles.scaleBadge, { backgroundColor: `${scaleColor}22`, borderColor: `${scaleColor}44` }]}>
                            <Text style={{ fontSize: 10, fontFamily: "Inter_700Bold", color: scaleColor }}>{SCALE_LABELS[opp.scale].toUpperCase()}</Text>
                          </View>
                        </View>
                        {/* Description */}
                        <Text style={[styles.acqDesc, { color: colors.mutedForeground }]}>{opp.description}</Text>
                        {/* Risk/reward info */}
                        <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            <Feather name="arrow-up-right" size={12} color="#10B981" />
                            <Text style={{ fontSize: 11, color: "#10B981", fontFamily: "Inter_600SemiBold" }}>
                              até +{(opp.maxProfitPct * 100).toFixed(0)}%
                            </Text>
                          </View>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            <Feather name="arrow-down-right" size={12} color="#FF4D6A" />
                            <Text style={{ fontSize: 11, color: "#FF4D6A", fontFamily: "Inter_600SemiBold" }}>
                              até -{(opp.maxLossPct * 100).toFixed(0)}%
                            </Text>
                          </View>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            <Feather name="clock" size={11} color={colors.mutedForeground} />
                            <Text style={{ fontSize: 10, color: colors.mutedForeground }}>expira em {expiresIn}</Text>
                          </View>
                        </View>
                        {/* Amount picker */}
                        {PRESET_AMOUNTS.length > 0 ? (
                          <>
                            <Text style={{ fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_600SemiBold" }}>
                              Valor do investimento (máx. {formatMoney(opp.maxInvestment)}):
                            </Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -2 }}>
                              <View style={{ flexDirection: "row", gap: 6, paddingHorizontal: 2, paddingVertical: 2 }}>
                                {PRESET_AMOUNTS.map((amt) => (
                                  <TouchableOpacity
                                    key={amt}
                                    style={[styles.amtBtn, {
                                      backgroundColor: selectedAmt === amt ? scaleColor : `${scaleColor}18`,
                                      borderColor: `${scaleColor}55`,
                                    }]}
                                    onPress={() => setSponsorAmounts((prev) => ({ ...prev, [opp.id]: amt }))}
                                  >
                                    <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: selectedAmt === amt ? "#fff" : scaleColor }}>
                                      {formatMoney(amt)}
                                    </Text>
                                  </TouchableOpacity>
                                ))}
                              </View>
                            </ScrollView>
                            <TouchableOpacity
                              style={[styles.sponsorInvestBtn, { backgroundColor: scaleColor, opacity: selectedAmt > 0 ? 1 : 0.4 }]}
                              disabled={selectedAmt <= 0}
                              onPress={() => Alert.alert(
                                "Confirmar Patrocínio",
                                `Investir ${formatMoney(selectedAmt)} em "${opp.title}"?\n\nPotencial de lucro: até +${(opp.maxProfitPct * 100).toFixed(0)}%\nRisco de perda: até -${(opp.maxLossPct * 100).toFixed(0)}%\n\nO resultado é determinado por condições de mercado e performance do evento.`,
                                [
                                  { text: "Cancelar", style: "cancel" },
                                  {
                                    text: "Investir",
                                    onPress: () => {
                                      const result = investInSponsorship(opp.id, selectedAmt);
                                      if (!result.success) {
                                        Alert.alert("Erro", result.message);
                                      } else {
                                        setSponsorAmounts((prev) => { const n = { ...prev }; delete n[opp.id]; return n; });
                                        Alert.alert(
                                          result.profit >= 0 ? "💰 Patrocínio Lucrativo" : "📉 Resultado Negativo",
                                          result.message,
                                        );
                                      }
                                    },
                                  },
                                ]
                              )}
                            >
                              <Feather name="dollar-sign" size={13} color="#fff" />
                              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>Investir {formatMoney(selectedAmt)}</Text>
                            </TouchableOpacity>
                          </>
                        ) : (
                          <Text style={{ fontSize: 11, color: "#FF4D6A" }}>
                            Capital insuficiente para investir neste evento (mín. {formatMoney(500_000)}).
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Owned */}
              {owned.length > 0 && (
                <View style={[styles.sectionBox, { backgroundColor: colors.card, borderColor: "#10B98133" }]}>
                  <Text style={[styles.boxTitle, { color: "#10B981" }]}>Empresas Adquiridas ({owned.length})</Text>
                  {owned.map((acq) => {
                    const netMonthly = acq.revenueBonus - acq.monthlyExpense;
                    return (
                      <View key={acq.id} style={[styles.acqCard, { borderColor: "#10B98133" }]}>
                        <LinearGradient colors={["#10B98108", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                        <View style={styles.acqHeader}>
                          <Text style={styles.acqFlag}>{acq.countryFlag}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.acqName, { color: colors.foreground }]}>{acq.name}</Text>
                            <Text style={[styles.acqSector, { color: colors.mutedForeground }]}>{ACQ_TYPE_LABEL[acq.type] ?? acq.type} · adquirida em {acq.purchasedYear}</Text>
                          </View>
                          <View style={{ alignItems: "flex-end" }}>
                            <Text style={[styles.acqNetMonthly, { color: netMonthly >= 0 ? "#10B981" : "#FF4D6A" }]}>
                              {netMonthly >= 0 ? "+" : ""}{formatMoney(netMonthly)}/mês
                            </Text>
                          </View>
                        </View>
                        {(() => {
                            const resale = computeAcquisitionResaleInfo(acq, state.year, state.reputation, state.marketShare ?? 0);
                            const gainColor = resale.isProfit ? "#10B981" : "#FF4D6A";
                            const gainSign  = resale.isProfit ? "+" : "";
                            const pctStr    = `${gainSign}${(resale.gainLossPct * 100).toFixed(1)}%`;
                            return (
                              <View style={{ gap: 4 }}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                  <Text style={{ fontSize: 11, color: colors.mutedForeground }}>Valor actual estimado:</Text>
                                  <Text style={{ fontSize: 12, fontFamily: "Inter_700Bold", color: colors.foreground }}>{formatMoney(resale.salePrice)}</Text>
                                  <Text style={{ fontSize: 11, color: gainColor }}>({pctStr})</Text>
                                </View>
                                <TouchableOpacity
                                  style={[styles.acqSellBtn, { borderColor: `${gainColor}44` }]}
                                  onPress={() => Alert.alert(
                                    "Vender Empresa",
                                    `Vender ${acq.name} por ${formatMoney(resale.salePrice)}?\n\n${resale.isProfit ? `Lucro estimado: ${formatMoney(resale.gainLoss)} (${pctStr})` : `Perda estimada: ${formatMoney(Math.abs(resale.gainLoss))} (${pctStr})`}\n\nO preço reflecte condições actuais de mercado.`,
                                    [
                                      { text: "Cancelar", style: "cancel" },
                                      { text: "Vender", style: "destructive", onPress: () => sellAcquisition(acq.id) },
                                    ]
                                  )}
                                >
                                  <Text style={{ color: gainColor, fontSize: 12 }}>Vender por {formatMoney(resale.salePrice)}</Text>
                                </TouchableOpacity>
                              </View>
                            );
                          })()}
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Available for purchase */}
              {available.length > 0 && (
                <View>
                  {/* Tech acquisitions */}
                  {available.filter(c => TECH_ACQ_TYPES.includes(c.type)).length > 0 && (
                    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Aquisições Tecnológicas</Text>
                  )}
                  {available.filter(c => ALT_ACQ_TYPES.includes(c.type)).length > 0 && available.filter(c => TECH_ACQ_TYPES.includes(c.type)).length > 0 && null}
                  {available.map((comp) => {
                    const canAfford = state.money >= comp.purchasePrice;
                    const isAltHeader = ALT_ACQ_TYPES.includes(comp.type);
                    const isFirstAlt = available.find(c => ALT_ACQ_TYPES.includes(c.type))?.id === comp.id;
                    const ACQ_GAMEPLAY_EFFECTS: Record<string, string> = {
                      studio:           `+${comp.researchBonus} meses de pesquisa/mês (pesquisa ${comp.researchBonus}× mais rápida)`,
                      hardware_lab:     "+0.4 rating de consola/mês (melhoria real de hardware)",
                      publisher:        "+25% receita de todos os jogos publicados",
                      marketing_agency: "+22% eficiência de marketing (boost real de vendas)",
                      movie_studio:     `+${comp.reputationBonus} reputação · fãs extra mensais via crossover`,
                      sports_team:      `+${comp.reputationBonus} reputação · brand visibility global`,
                      shopping_center:  `+${formatMoney(comp.revenueBonus - comp.monthlyExpense)} lucro líquido/mês (investimento passivo)`,
                      event_company:    `+${comp.reputationBonus} reputação · eventos de lançamento premium`,
                      music_label:      `Trilhas exclusivas · +${comp.reputationBonus} rep · melhoria de rating dos jogos`,
                    };
                    return (
                      <View key={comp.id}>
                        {isFirstAlt && (
                          <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 8 }]}>Investimentos Alternativos</Text>
                        )}
                      <View style={[styles.acqCard, { borderColor: canAfford ? (isAltHeader ? "#F59E0B33" : "#4DA6FF33") : colors.border, backgroundColor: colors.card }]}>
                        <LinearGradient colors={[canAfford ? (isAltHeader ? "#F59E0B08" : "#4DA6FF08") : "transparent", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                        <View style={styles.acqHeader}>
                          <Text style={styles.acqFlag}>{comp.countryFlag}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.acqName, { color: colors.foreground }]}>{comp.name}</Text>
                            <Text style={[styles.acqSector, { color: colors.mutedForeground }]}>{ACQ_TYPE_LABEL[comp.type] ?? comp.type} · {comp.country}</Text>
                          </View>
                          <Text style={[styles.acqPrice, { color: canAfford ? "#10B981" : "#FF4D6A" }]}>{formatMoney(comp.purchasePrice)}</Text>
                        </View>
                        <Text style={[styles.acqDesc, { color: colors.mutedForeground }]}>{comp.synergySummary}</Text>
                        {/* Real gameplay effect highlighted */}
                        <View style={[styles.synergyBadge, { borderColor: isAltHeader ? "#F59E0B44" : "#4DA6FF44" }]}>
                          <Feather name="zap" size={11} color={isAltHeader ? "#F59E0B" : "#4DA6FF"} />
                          <Text style={[styles.synergyText, { color: isAltHeader ? "#F59E0B" : "#4DA6FF" }]}>{ACQ_GAMEPLAY_EFFECTS[comp.type] ?? comp.type}</Text>
                        </View>
                        <View style={styles.acqStats}>
                          <Text style={{ color: "#10B981", fontSize: 12 }}>+{formatMoney(comp.revenueBonus)}/mês</Text>
                          <Text style={{ color: "#FF4D6A", fontSize: 12 }}>-{formatMoney(comp.monthlyExpense)}/mês</Text>
                          <Text style={{ color: "#4DA6FF", fontSize: 12 }}>+{comp.reputationBonus} rep</Text>
                        </View>
                        <TouchableOpacity
                          style={[styles.acqBuyBtn, { opacity: canAfford ? 1 : 0.45 }]}
                          disabled={!canAfford}
                          onPress={() => Alert.alert(
                            "Confirmar Aquisição",
                            `Adquirir ${comp.name} por ${formatMoney(comp.purchasePrice)}?`,
                            [
                              { text: "Cancelar", style: "cancel" },
                              {
                                text: "Adquirir",
                                onPress: () => {
                                  const err = buyAcquisition(comp.id);
                                  if (err) Alert.alert("Erro", err);
                                  else Alert.alert("Aquisição concluída!", `${comp.name} agora faz parte do seu portfolio.`);
                                },
                              },
                            ]
                          )}
                        >
                          <LinearGradient colors={["#4DA6FF", "#2980b9"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.acqBuyBtnInner}>
                            <Feather name="plus" size={14} color="#fff" />
                            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>Adquirir</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Locked */}
              {locked.length > 0 && (
                <View>
                  <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Em Breve</Text>
                  {locked.map((comp) => (
                    <View key={comp.id} style={[styles.acqCard, { borderColor: colors.border, opacity: 0.5, backgroundColor: colors.card }]}>
                      <View style={styles.acqHeader}>
                        <Text style={styles.acqFlag}>{comp.countryFlag}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.acqName, { color: colors.foreground }]}>{comp.name}</Text>
                          <Text style={[styles.acqSector, { color: colors.mutedForeground }]}>{ACQ_TYPE_LABEL[comp.type] ?? comp.type}</Text>
                        </View>
                        <View style={styles.lockedBadge}>
                          <Feather name="lock" size={11} color={colors.mutedForeground} />
                          <Text style={{ color: colors.mutedForeground, fontSize: 11, marginLeft: 4 }}>{comp.availableFromYear}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {owned.length === 0 && available.length === 0 && (
                <View style={styles.emptyState}>
                  <Feather name="briefcase" size={36} color={colors.mutedForeground} />
                  <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Nenhuma empresa disponível ainda</Text>
                  <Text style={[styles.emptySubText, { color: colors.mutedForeground }]}>Expande a empresa e volta mais tarde</Text>
                </View>
              )}
            </View>
          );
        })()}

      </ScrollView>

      {/* ── Create Listing Modal ── */}
      <Modal visible={showListingModal} transparent animationType="slide" onRequestClose={() => setShowListingModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalDismiss} onPress={() => setShowListingModal(false)} activeOpacity={1} />
          <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: "#FF4D6A44" }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: "#FF4D6A" }]}>Listar Ações para Venda</Text>
            <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
              Define quanto queres vender e o preço mínimo por ação. Investidores farão lances — tu escolhes qual aceitar.
            </Text>

            {/* Current share price info */}
            <View style={[styles.modalInfoRow, { backgroundColor: "#4DA6FF11", borderColor: "#4DA6FF33" }]}>
              <Feather name="info" size={13} color="#4DA6FF" />
              <Text style={[{ color: "#4DA6FF", fontSize: 12, flex: 1 }]}>
                Preço atual: {formatMoney(state.sharePrice ?? 0)}/ação · Tens {Math.round((state.playerShares ?? 0) / (state.totalShares ?? 1) * 100)}% da empresa
              </Text>
            </View>

            <Text style={[styles.modalLabel, { color: colors.foreground }]}>% a vender</Text>
            <View style={[styles.amountInput, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Feather name="percent" size={16} color={colors.primary} />
              <TextInput
                value={listingPercent}
                onChangeText={setListingPercent}
                keyboardType="numeric"
                placeholder="Ex: 10"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.amountInputText, { color: colors.foreground }]}
              />
            </View>

            <Text style={[styles.modalLabel, { color: colors.foreground }]}>Preço mínimo por ação ($)</Text>
            <View style={[styles.amountInput, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Feather name="dollar-sign" size={16} color={colors.primary} />
              <TextInput
                value={listingMinAsk}
                onChangeText={setListingMinAsk}
                keyboardType="numeric"
                placeholder={`Mín sugerido: ${formatMoney(state.sharePrice ?? 0)}`}
                placeholderTextColor={colors.mutedForeground}
                style={[styles.amountInputText, { color: colors.foreground }]}
              />
            </View>

            {/* Preview */}
            {(() => {
              const pct = parseFloat(listingPercent) || 0;
              const ask = parseFloat(listingMinAsk) || 0;
              const shares = Math.round((pct / 100) * (state.totalShares ?? 10000));
              const estVal = shares * (state.sharePrice ?? 0);
              const minVal = shares * ask;
              if (pct > 0) return (
                <View style={[styles.loanPreview, { backgroundColor: "#FF4D6A11", borderColor: "#FF4D6A33" }]}>
                  <Text style={[styles.previewTitle, { color: "#FF4D6A" }]}>Simulação</Text>
                  <PreviewRow label="Ações a listar" value={`${shares.toLocaleString()} ações (${pct}%)`} colors={colors} />
                  <PreviewRow label="Valor a preço de mercado" value={formatMoney(estVal)} colors={colors} col="#4DA6FF" />
                  {ask > 0 && <PreviewRow label="Mínimo aceitável (total)" value={formatMoney(minVal)} colors={colors} col="#F5A623" />}
                  <PreviewRow label="Dividendo mensal resultante" value={`-${formatMoney(Math.round((state.companyValue ?? 0) * (pct / 100) * (0.018 / 12)))}/mês`} colors={colors} col="#FF4D6A" />
                </View>
              );
              return null;
            })()}

            <TouchableOpacity
              style={[styles.takeLoanBtn, { marginTop: 12, opacity: parseFloat(listingPercent) > 0 ? 1 : 0.45 }]}
              disabled={parseFloat(listingPercent) <= 0}
              onPress={() => {
                const pct = parseFloat(listingPercent);
                const ask = parseFloat(listingMinAsk) || (state.sharePrice ?? 0) * 0.8;
                if (!pct || pct <= 0) return;
                const err = createStockListing(pct, ask);
                if (err) { Alert.alert("Erro", err); return; }
                setShowListingModal(false);
                Alert.alert(
                  "Listagem criada!",
                  `${pct}% das ações listadas para venda a mínimo de ${formatMoney(ask)}/ação.\n\nInvestidores começarão a enviar propostas. Volta regularmente para comparar e aceitar o melhor lance.`
                );
              }}
            >
              <LinearGradient colors={["#FF4D6A", "#CC2244"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.takeLoanBtnInner}>
                <Feather name="tag" size={16} color="#fff" />
                <Text style={styles.takeLoanBtnText}>Criar Listagem</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Buyback Modal ── */}
      <Modal visible={showBuybackModal} transparent animationType="slide" onRequestClose={() => setShowBuybackModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalDismiss} onPress={() => setShowBuybackModal(false)} activeOpacity={1} />
          <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: "#10B98144" }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: "#10B981" }]}>Recomprar Ações</Text>
            {(() => {
              const approxMonthlyProfit = state.money > 0
                ? Math.round(safeTotalRevenue / Math.max(1, (state.year - 1972) * 12 + state.month))
                : 0;
              const premium = getBuybackPremium(approxMonthlyProfit);
              const investorPct2 = Math.round(((state.totalShares ?? 10000) - (state.playerShares ?? 10000)) / (state.totalShares ?? 10000) * 100);
              return (
                <>
                  <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
                    Investidores têm {investorPct2}% das ações. Recomprar reduz dividendos e elimina pressão do conselho.
                  </Text>
                  {/* Premium warning */}
                  <View style={[styles.modalInfoRow, { backgroundColor: "#F5A62311", borderColor: "#F5A62333" }]}>
                    <Feather name="alert-triangle" size={13} color="#F5A623" />
                    <Text style={[{ color: "#F5A623", fontSize: 12, flex: 1 }]}>
                      Prémio de recompra: ×{premium.toFixed(2)} — {
                        approxMonthlyProfit > 2_000_000 ? "empresa muito lucrativa, investidores relutantes"
                        : approxMonthlyProfit > 500_000 ? "empresa lucrativa, prémio elevado"
                        : approxMonthlyProfit > 0 ? "empresa em crescimento"
                        : "empresa em dificuldade — prémio reduzido"
                      }
                    </Text>
                  </View>
                  <Text style={[styles.modalLabel, { color: colors.foreground }]}>% a recomprar</Text>
                  <View style={[styles.amountInput, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                    <Feather name="percent" size={16} color={colors.primary} />
                    <TextInput
                      value={buybackPercent}
                      onChangeText={setBuybackPercent}
                      keyboardType="numeric"
                      placeholder="Ex: 5"
                      placeholderTextColor={colors.mutedForeground}
                      style={[styles.amountInputText, { color: colors.foreground }]}
                    />
                  </View>
                  {(() => {
                    const pct = parseFloat(buybackPercent) || 0;
                    if (pct <= 0) return null;
                    const shares = Math.round((pct / 100) * (state.totalShares ?? 10000));
                    const cost = Math.round(shares * (state.sharePrice ?? 1) * premium);
                    return (
                      <View style={[styles.loanPreview, { backgroundColor: "#10B98111", borderColor: "#10B98133" }]}>
                        <Text style={[styles.previewTitle, { color: "#10B981" }]}>Simulação</Text>
                        <PreviewRow label="Ações a recomprar" value={`${shares.toLocaleString()} ações`} colors={colors} />
                        <PreviewRow label="Preço de mercado" value={formatMoney(Math.round(shares * (state.sharePrice ?? 1)))} colors={colors} col="#4DA6FF" />
                        <PreviewRow label={`Prémio (×${premium.toFixed(2)})`} value={formatMoney(Math.round(shares * (state.sharePrice ?? 1) * (premium - 1)))} colors={colors} col="#F5A623" />
                        <PreviewRow label="Custo total" value={formatMoney(cost)} colors={colors} col="#FF4D6A" />
                        <PreviewRow label="Capital disponível" value={formatMoney(state.money)} colors={colors} col={state.money >= cost ? "#10B981" : "#FF4D6A"} />
                      </View>
                    );
                  })()}
                  <TouchableOpacity
                    style={[styles.takeLoanBtn, { marginTop: 12, opacity: parseFloat(buybackPercent) > 0 ? 1 : 0.45 }]}
                    disabled={parseFloat(buybackPercent) <= 0}
                    onPress={() => {
                      const pct = parseFloat(buybackPercent);
                      if (!pct || pct <= 0) return;
                      const err = buyBackShares(pct);
                      if (err) { Alert.alert("Erro", err); return; }
                      setShowBuybackModal(false);
                      Alert.alert("Ações recompradas!", `Recompraste ${pct}% das ações. Controlo de volta para ${Math.min(100, Math.round((state.playerShares ?? 10000) / (state.totalShares ?? 10000) * 100) + pct)}%.`);
                    }}
                  >
                    <LinearGradient colors={["#10B981", "#059669"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.takeLoanBtnInner}>
                      <Feather name="trending-up" size={16} color="#fff" />
                      <Text style={styles.takeLoanBtnText}>Confirmar Recompra</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              );
            })()}
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}

type GateItem = { label: string; done: boolean; detail?: string; pct?: number };

function LockedTabScreen({
  icon, title, description, items, colors,
}: { icon: string; title: string; description: string; items: GateItem[]; colors: any }) {
  return (
    <View style={[styles.gateCard, { backgroundColor: colors.card, borderColor: "#4DA6FF22" }]}>
      <LinearGradient colors={["#4DA6FF0A", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={styles.gateHeader}>
        <View style={styles.gateLockCircle}>
          <Feather name="lock" size={22} color="#4DA6FF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.gateTitle, { color: colors.foreground }]}>{title}</Text>
          <Text style={[styles.gateSubtitle, { color: colors.mutedForeground }]}>Funcionalidade bloqueada</Text>
        </View>
      </View>
      <Text style={[styles.gateDesc, { color: colors.mutedForeground }]}>{description}</Text>
      <View style={[styles.gateDivider, { backgroundColor: colors.border }]} />
      <Text style={[styles.gateReqTitle, { color: colors.foreground }]}>Requisitos para desbloquear</Text>
      {items.map((item, i) => (
        <View key={i} style={styles.gateReqRow}>
          <Feather name={item.done ? "check-circle" : "circle"} size={16} color={item.done ? "#10B981" : "#4DA6FF"} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.gateReqLabel, { color: item.done ? "#10B981" : colors.foreground }]}>{item.label}</Text>
            {item.detail ? <Text style={[styles.gateReqDetail, { color: colors.mutedForeground }]}>{item.detail}</Text> : null}
            {item.pct !== undefined && !item.done && (
              <View style={[styles.gateBar, { backgroundColor: colors.border }]}>
                <View style={[styles.gateBarFill, { width: `${Math.round(item.pct * 100)}%` as any, backgroundColor: "#4DA6FF" }]} />
              </View>
            )}
          </View>
          {item.done && <Feather name="check" size={14} color="#10B981" />}
        </View>
      ))}
    </View>
  );
}

function UnlockProgressCard({ title, subtitle, items, colors }: { title: string; subtitle: string; items: GateItem[]; colors: any }) {
  const allDone = items.every((i) => i.done);
  if (allDone) return null;
  return (
    <View style={[styles.unlockCard, { backgroundColor: colors.card, borderColor: "#F5A62333" }]}>
      <LinearGradient colors={["#F5A62308", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
      <View style={styles.unlockCardHeader}>
        <Feather name="lock" size={13} color="#F5A623" />
        <View style={{ flex: 1 }}>
          <Text style={[styles.unlockCardTitle, { color: colors.foreground }]}>{title}</Text>
          <Text style={[styles.unlockCardSubtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
        </View>
      </View>
      {items.map((item, i) => (
        <View key={i} style={styles.unlockRow}>
          <Feather name={item.done ? "check-circle" : "circle"} size={13} color={item.done ? "#10B981" : "#F5A623"} />
          <Text style={[styles.unlockRowLabel, { color: item.done ? "#10B981" : colors.foreground }]}>{item.label}</Text>
          {item.detail && !item.done && <Text style={[styles.unlockRowDetail, { color: colors.mutedForeground }]}>{item.detail}</Text>}
        </View>
      ))}
      {items.find((i) => i.pct !== undefined && !i.done) && (
        <View style={[styles.gateBar, { backgroundColor: colors.border, marginTop: 4 }]}>
          <View style={[styles.gateBarFill, {
            width: `${Math.round((items.find((i) => i.pct !== undefined)!.pct! * 100))}%` as any,
            backgroundColor: "#F5A623",
          }]} />
        </View>
      )}
    </View>
  );
}

function MetricCard({ label, value, icon, color, colors }: { label: string; value: string; icon: any; color: string; colors: any }) {
  return (
    <View style={[styles.metricCard, { backgroundColor: color + "11", borderColor: color + "33" }]}>
      <Feather name={icon} size={14} color={color} />
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function ExpRow({ label, value, icon, color, colors }: { label: string; value: number; icon: any; color: string; colors: any }) {
  return (
    <View style={styles.expRow}>
      <Feather name={icon} size={13} color={color} />
      <Text style={[styles.expLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.expValue, { color }]}>{formatMoney(value)}</Text>
    </View>
  );
}

function PreviewRow({ label, value, colors, col }: { label: string; value: string; colors: any; col?: string }) {
  return (
    <View style={styles.previewRow}>
      <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.previewValue, { color: col ?? colors.foreground }]}>{value}</Text>
    </View>
  );
}

function LoanCard({ loan, colors }: { loan: ActiveLoan; colors: any }) {
  const progress = 1 - (loan.monthsRemaining / loan.termMonths);
  const paidAmount = loan.originalAmount - loan.remainingAmount;

  return (
    <View style={[styles.loanCard, { backgroundColor: colors.card, borderColor: "#F5A62333" }]}>
      <LinearGradient colors={["#F5A62308", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
      <View style={styles.loanCardHeader}>
        <View style={[styles.loanIcon, { backgroundColor: "#F5A62322" }]}>
          <Feather name="credit-card" size={16} color="#F5A623" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.loanName, { color: colors.foreground }]}>{loan.name}</Text>
          <Text style={[styles.loanMeta, { color: colors.mutedForeground }]}>
            Taxa: {(loan.annualInterestRate * 100).toFixed(2)}% a.a. · {loan.monthsRemaining}m restantes
          </Text>
        </View>
        <Text style={[styles.loanMonthly, { color: "#FF4D6A" }]}>{formatMoney(loan.monthlyPayment)}/mês</Text>
      </View>
      <View style={styles.loanProgress}>
        <View style={[styles.loanProgressTrack, { backgroundColor: colors.secondary }]}>
          <View style={[styles.loanProgressFill, { width: `${Math.round(progress * 100)}%`, backgroundColor: "#F5A623" }]} />
        </View>
        <Text style={[styles.loanProgressText, { color: colors.mutedForeground }]}>
          Pago: {formatMoney(Math.round(paidAmount))} de {formatMoney(loan.originalAmount)} ({Math.round(progress * 100)}%)
        </Text>
      </View>
      <View style={styles.loanStats}>
        <Text style={[styles.loanStatItem, { color: colors.mutedForeground }]}>
          Restante: <Text style={{ color: "#FF4D6A" }}>{formatMoney(loan.remainingAmount)}</Text>
        </Text>
        <Text style={[styles.loanStatItem, { color: colors.mutedForeground }]}>
          Próx. parcela: {loan.nextPaymentMonth}/{loan.nextPaymentYear}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBar: { borderBottomWidth: 1 },
  tabRowContent: { flexDirection: "row", paddingHorizontal: 8 },
  tab: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 2.5, minWidth: 88 },
  tabText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  scroll: { padding: 16, gap: 12 },
  section: { gap: 12 },
  ratingCard: { flexDirection: "row", alignItems: "center", gap: 16, borderRadius: 16, borderWidth: 1, padding: 16, overflow: "hidden" },
  ratingLeft: { alignItems: "center", minWidth: 56 },
  ratingScore: { fontSize: 34, fontFamily: "Inter_700Bold" },
  ratingLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  ratingRight: { flex: 1 },
  ratingTitle: { fontSize: 14, fontFamily: "Inter_700Bold", marginBottom: 4 },
  ratingDesc: { fontSize: 12, fontFamily: "Inter_500Medium" },
  riskCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  riskTitle: { fontSize: 13, fontFamily: "Inter_700Bold", marginBottom: 2 },
  riskSub: { fontSize: 11, fontFamily: "Inter_400Regular" },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metricCard: { width: "48%", padding: 12, borderRadius: 12, borderWidth: 1, gap: 4, alignItems: "center" },
  metricValue: { fontSize: 15, fontFamily: "Inter_700Bold" },
  metricLabel: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  sectionBox: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  boxTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  cashFlowChart: { flexDirection: "row", alignItems: "flex-end", height: 90, gap: 4 },
  cashFlowBar: { flex: 1, alignItems: "center", gap: 3 },
  cashBarFill: { width: "100%", borderRadius: 3, minHeight: 4 },
  cashBarLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  cashFlowLegend: { flexDirection: "row", gap: 16 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  cashFlowNote: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  expRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  expLabel: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular" },
  expValue: { fontSize: 13, fontFamily: "Inter_700Bold" },
  expTotal: { flexDirection: "row", justifyContent: "space-between", paddingTop: 8, borderTopWidth: 1 },
  expTotalLabel: { fontSize: 13, fontFamily: "Inter_700Bold" },
  expTotalValue: { fontSize: 14, fontFamily: "Inter_700Bold" },
  emptyBox: { borderRadius: 16, borderWidth: 1, padding: 30, alignItems: "center", gap: 12 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center" },
  emptyBtn: { backgroundColor: "#4DA6FF", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  emptyBtnText: { color: "#070D1A", fontSize: 13, fontFamily: "Inter_700Bold" },
  loanCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10, overflow: "hidden" },
  loanCardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  loanIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  loanName: { fontSize: 14, fontFamily: "Inter_700Bold" },
  loanMeta: { fontSize: 11, fontFamily: "Inter_400Regular" },
  loanMonthly: { fontSize: 14, fontFamily: "Inter_700Bold" },
  loanProgress: { gap: 4 },
  loanProgressTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  loanProgressFill: { height: "100%", borderRadius: 3 },
  loanProgressText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  loanStats: { flexDirection: "row", justifyContent: "space-between" },
  loanStatItem: { fontSize: 11, fontFamily: "Inter_400Regular" },
  creditReminder: { padding: 10, borderRadius: 10, borderWidth: 1 },
  creditReminderText: { fontSize: 12, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, textTransform: "uppercase" },
  loanTypeCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1, padding: 14, overflow: "hidden" },
  loanTypeIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  loanTypeInfo: { flex: 1 },
  loanTypeHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  loanTypeName: { fontSize: 14, fontFamily: "Inter_700Bold", flex: 1 },
  lockBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  lockBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#FF4D6A" },
  loanTypeDesc: { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 4 },
  loanTypeStats: { flexDirection: "row", gap: 10 },
  loanTypeStat: { fontSize: 11, fontFamily: "Inter_700Bold" },
  amountInput: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  amountInputText: { flex: 1, fontSize: 16, fontFamily: "Inter_400Regular" },
  loanPreview: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 8 },
  previewTitle: { fontSize: 13, fontFamily: "Inter_700Bold", marginBottom: 4 },
  previewRow: { flexDirection: "row", justifyContent: "space-between" },
  previewLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  previewValue: { fontSize: 13, fontFamily: "Inter_700Bold" },
  takeLoanBtn: { borderRadius: 14, overflow: "hidden" },
  takeLoanBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15 },
  takeLoanBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
  // Alerts / warnings
  alertBanner: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: 14, borderWidth: 1 },
  alertTitle: { fontSize: 13, fontFamily: "Inter_700Bold", marginBottom: 3 },
  alertDesc: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16 },
  // Dividend / credit
  dividendRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  dividendLabel: { fontSize: 11, fontFamily: "Inter_400Regular", flex: 1 },
  dividendAmount: { fontSize: 12, fontFamily: "Inter_700Bold" },
  creditBoostRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  creditBoostText: { fontSize: 11, fontFamily: "Inter_400Regular", flex: 1 },
  // Threshold markers
  thresholdRow: { position: "relative", height: 20, marginTop: 4 },
  threshold: { position: "absolute", alignItems: "center" },
  thresholdLine: { width: 1.5, height: 8 },
  thresholdLabel: { fontSize: 10, fontFamily: "Inter_400Regular", color: "#F5A623", marginTop: 1 },
  // Synergy badge
  synergyBadge: { flexDirection: "row", alignItems: "center", gap: 6, padding: 7, borderRadius: 8, borderWidth: 1, backgroundColor: "#4DA6FF09" },
  synergyText: { fontSize: 11, fontFamily: "Inter_600SemiBold", flex: 1 },
  // Empresa / Stock
  bigValue: { fontSize: 28, fontFamily: "Inter_700Bold" },
  subLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  ownershipBar: { flexDirection: "row", height: 20, borderRadius: 10, overflow: "hidden", gap: 2 },
  ownershipLegend: { flexDirection: "row", gap: 16, flexWrap: "wrap" },
  shareActionsRow: { flexDirection: "row", gap: 10 },
  shareBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, borderWidth: 1, paddingVertical: 12 },
  shareBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  offerCard: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 8, marginTop: 8 },
  offerHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  offerFlag: { fontSize: 22 },
  offerName: { fontSize: 13, fontFamily: "Inter_700Bold" },
  offerCountry: { fontSize: 11, fontFamily: "Inter_400Regular" },
  offerAmount: { fontSize: 14, fontFamily: "Inter_700Bold" },
  offerDesc: { fontSize: 11, fontFamily: "Inter_400Regular" },
  offerTerms: { fontSize: 11, fontFamily: "Inter_600SemiBold", fontStyle: "italic" },
  offerBtns: { flexDirection: "row", gap: 10 },
  offerBtn: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  investorRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#ffffff11" },
  // Sponsorship cards
  sponsorCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 9, overflow: "hidden", marginBottom: 8 },
  sponsorIconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  scaleBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  amtBtn: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 6 },
  sponsorInvestBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 12, paddingVertical: 10, marginTop: 2 },
  // Acquisitions
  acqCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8, overflow: "hidden", marginBottom: 6 },
  acqHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  acqFlag: { fontSize: 24 },
  acqName: { fontSize: 14, fontFamily: "Inter_700Bold" },
  acqSector: { fontSize: 11, fontFamily: "Inter_400Regular" },
  acqNetMonthly: { fontSize: 13, fontFamily: "Inter_700Bold" },
  acqDesc: { fontSize: 11, fontFamily: "Inter_400Regular" },
  acqStats: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  acqPrice: { fontSize: 14, fontFamily: "Inter_700Bold" },
  acqBuyBtn: { borderRadius: 12, overflow: "hidden", marginTop: 4 },
  acqBuyBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 10 },
  acqSellBtn: { alignSelf: "flex-start", borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, marginTop: 4 },
  lockedBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: "#ffffff11" },
  emptyState: { alignItems: "center", gap: 10, paddingVertical: 40 },
  emptySubText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  // Gate screens
  gateCard: { borderRadius: 18, borderWidth: 1, padding: 20, gap: 14, overflow: "hidden" },
  gateHeader: { flexDirection: "row", alignItems: "center", gap: 14 },
  gateLockCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#4DA6FF18", alignItems: "center", justifyContent: "center" },
  gateTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  gateSubtitle: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  gateDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  gateDivider: { height: 1, marginVertical: 2 },
  gateReqTitle: { fontSize: 12, fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  gateReqRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  gateReqLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  gateReqDetail: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  gateBar: { height: 6, borderRadius: 3, overflow: "hidden", marginTop: 6 },
  gateBarFill: { height: 6, borderRadius: 3 },
  // Unlock progress card (on overview tab)
  unlockCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8, overflow: "hidden" },
  unlockCardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  unlockCardTitle: { fontSize: 13, fontFamily: "Inter_700Bold" },
  unlockCardSubtitle: { fontSize: 11, fontFamily: "Inter_400Regular" },
  unlockRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  unlockRowLabel: { fontSize: 12, fontFamily: "Inter_500Medium", flex: 1 },
  unlockRowDetail: { fontSize: 11, fontFamily: "Inter_400Regular" },
  // Stock chart
  stockChartRow: { flexDirection: "row", alignItems: "flex-end", height: 60, gap: 2, marginVertical: 8 },
  stockBarWrap: { flex: 1, alignItems: "center", justifyContent: "flex-end", height: 60 },
  stockBar: { width: "80%", borderRadius: 2 },
  // Bid rows
  bidRow: { borderRadius: 10, borderWidth: 1, padding: 10, marginTop: 8, gap: 4, position: "relative" },
  bestBadge: { position: "absolute", top: -8, right: 8, backgroundColor: "#10B981", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  bestBadgeText: { color: "#fff", fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  noBidsBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 8, borderWidth: 1, marginTop: 8 },
  noBidsText: { fontSize: 11, fontFamily: "Inter_400Regular", flex: 1 },
  // Modals
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalDismiss: { ...StyleSheet.absoluteFillObject, backgroundColor: "#00000088" },
  modalSheet: {
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderWidth: 1, padding: 20, paddingBottom: 36,
    gap: 10,
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#ffffff30", alignSelf: "center", marginBottom: 8 },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  modalSub: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  modalLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginTop: 6 },
  modalInfoRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 10, borderRadius: 10, borderWidth: 1 },
});
