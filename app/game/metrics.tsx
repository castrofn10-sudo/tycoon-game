import React from "react";
import {
  View, Text, ScrollView, StyleSheet, Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useGameplay } from "@/context/GameplayContext";
import { GridBackground } from "@/components/GridBackground";
import { ScreenHeader } from "@/components/ScreenHeader";
import { formatMoney } from "@/constants/gameEconomics";
import { getGlobalMarketLimit, getFanTier, MONTHS_PT, type FinancialSnapshot } from "@/constants/gameEngine";
import { getCharacterById } from "@/constants/characters";
import { CollapsibleSection } from "@/components/CollapsibleSection";

export default function MetricsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;
  const { state } = useGameplay();

  if (!state) return null;

  const activeCharacter = getCharacterById(state.characterId ?? "strategist");
  const eff = state.companyEfficiency ?? 1.0;
  const sat = state.avgMarketSaturation ?? 0;
  const effPct = Math.min(100, Math.round((eff / 2.0) * 100));
  const satPct = Math.round(sat * 100);
  const effColor = eff >= 1.3 ? "#10B981" : eff >= 0.9 ? "#4DA6FF" : eff >= 0.6 ? "#F5A623" : "#FF4D6A";
  const satColor = sat >= 0.5 ? "#FF4D6A" : sat >= 0.25 ? "#F5A623" : "#10B981";
  const limGlobal = getGlobalMarketLimit(state.year);
  const patrimonio = state.companyValue ?? 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GridBackground />
      <ScreenHeader title="Análise da Empresa" />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 3-Part Reputation */}
        {(state.techRep !== undefined || state.commercialRep !== undefined || state.fanRep !== undefined) && (
          <CollapsibleSection title="Reputação Detalhada" accent="#4DA6FF">
            <View style={styles.repRow}>
              {[
                { label: "Técnica", value: state.techRep ?? 0, color: "#4DA6FF", icon: "cpu" as const },
                { label: "Comercial", value: state.commercialRep ?? 0, color: "#10B981", icon: "bar-chart-2" as const },
                { label: "Fãs", value: state.fanRep ?? 0, color: "#F5A623", icon: "heart" as const },
              ].map((r) => (
                <View key={r.label} style={styles.repItem}>
                  <Feather name={r.icon} size={14} color={r.color} />
                  <Text style={[styles.repLabel, { color: colors.mutedForeground }]}>{r.label}</Text>
                  <View style={[styles.repBar, { backgroundColor: colors.border }]}>
                    <View style={[styles.repBarFill, { width: `${r.value}%` as any, backgroundColor: r.color }]} />
                  </View>
                  <Text style={[styles.repValue, { color: r.color }]}>{r.value}</Text>
                </View>
              ))}
            </View>
          </CollapsibleSection>
        )}

        {/* Efficiency + Saturation */}
        <CollapsibleSection title="Eficiência e Saturação" accent={effColor}>
          <View style={styles.effRow}>
            <View style={styles.effItem}>
              <View style={styles.effHeader}>
                <Feather name="zap" size={14} color={effColor} />
                <Text style={[styles.effLabel, { color: colors.mutedForeground }]}>Eficiência</Text>
                <Text style={[styles.effValue, { color: effColor }]}>{(eff * 100).toFixed(0)}%</Text>
              </View>
              <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
                <View style={[styles.barFill, { width: `${effPct}%` as any, backgroundColor: effColor }]} />
              </View>
              <Text style={[styles.effSub, { color: colors.mutedForeground }]}>
                {eff >= 1.3 ? "Excelente — bônus de produtividade máximo" :
                 eff >= 0.9 ? "Boa — acima do limiar de rentabilidade" :
                 eff >= 0.6 ? "Moderada — melhorias de escritório recomendadas" :
                 "Baixa — eficiência está prejudicando a receita"}
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.effItem}>
              <View style={styles.effHeader}>
                <Feather name="globe" size={14} color={satColor} />
                <Text style={[styles.effLabel, { color: colors.mutedForeground }]}>Saturação</Text>
                <Text style={[styles.effValue, { color: satColor }]}>{satPct}%</Text>
              </View>
              <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
                <View style={[styles.barFill, { width: `${satPct}%` as any, backgroundColor: satColor }]} />
              </View>
              <Text style={[styles.effSub, { color: colors.mutedForeground }]}>
                {formatMoney(patrimonio)} / {formatMoney(limGlobal)}
              </Text>
            </View>
          </View>
        </CollapsibleSection>

        {/* Fan Type Breakdown */}
        {state.fanBreakdown && state.fans > 0 && (() => {
          const bd = state.fanBreakdown!;
          const total = Math.max(1, bd.casual + bd.loyal + bd.critical);
          const pCasual = Math.round((bd.casual / total) * 100);
          const pLoyal = Math.round((bd.loyal / total) * 100);
          const pCrit = Math.round((bd.critical / total) * 100);
          const tier = getFanTier(state.fans);
          const tierColors: Record<string, string> = {
            unknown: "#6B7280", small: "#4DA6FF", growing: "#10B981",
            popular: "#A855F7", major: "#F97316", global: "#F5A623",
          };
          const tierColor = tierColors[tier.id] ?? "#6B7280";
          const mktPct = Math.round((tier.mktEffMult - 1) * 100);
          return (
            <CollapsibleSection
              title="Tipos de Fãs"
              accent={tierColor}
              badge={tier.label}
              badgeColor={tierColor}
            >
              <View style={styles.tierRow}>
                <View style={[styles.tierBadge, { backgroundColor: tierColor + "22", borderColor: tierColor + "55" }]}>
                  <Text style={[styles.tierLabel, { color: tierColor }]}>{tier.label}</Text>
                </View>
                <Text style={[styles.mktLabel, { color: colors.mutedForeground }]}>
                  Marketing {mktPct >= 0 ? `+${mktPct}` : mktPct}%
                </Text>
              </View>
              <View style={[styles.stackBar, { backgroundColor: colors.border }]}>
                <View style={{ width: `${pCasual}%` as any, backgroundColor: "#4DA6FF", height: "100%" }} />
                <View style={{ width: `${pLoyal}%` as any, backgroundColor: "#10B981", height: "100%" }} />
                <View style={{ width: `${pCrit}%` as any, backgroundColor: "#F5A623", height: "100%" }} />
              </View>
              <View style={styles.fanLegend}>
                {[
                  { label: "Casual", count: bd.casual, pct: pCasual, color: "#4DA6FF", decay: "−3%/mês" },
                  { label: "Leal", count: bd.loyal, pct: pLoyal, color: "#10B981", decay: "−1%/mês" },
                  { label: "Crítico", count: bd.critical, pct: pCrit, color: "#F5A623", decay: "−2%/mês" },
                ].map(({ label, count, pct, color, decay }) => (
                  <View key={label} style={styles.fanItem}>
                    <View style={styles.fanItemHeader}>
                      <View style={[styles.fanDot, { backgroundColor: color }]} />
                      <Text style={[styles.fanItemLabel, { color }]}>{label}</Text>
                      <Text style={[styles.fanItemPct, { color }]}>{pct}%</Text>
                    </View>
                    <Text style={[styles.fanItemCount, { color: colors.foreground }]}>{count.toLocaleString()}</Text>
                    <Text style={[styles.fanItemDecay, { color: colors.mutedForeground }]}>{decay}</Text>
                  </View>
                ))}
              </View>
            </CollapsibleSection>
          );
        })()}

        {/* Executive / Character */}
        {activeCharacter && (
          <CollapsibleSection
            title="Executivo Ativo"
            accent={activeCharacter.color}
            badge={activeCharacter.archetype}
            badgeColor={activeCharacter.color}
          >
            <View style={styles.charRow}>
              <View style={[styles.charBadge, { backgroundColor: activeCharacter.color + "22", borderColor: activeCharacter.color + "44" }]}>
                <Text style={[styles.charBadgeText, { color: activeCharacter.color }]}>{activeCharacter.archetype}</Text>
              </View>
              <Text style={[styles.charName, { color: colors.foreground }]}>{activeCharacter.name}</Text>
            </View>
            <View style={styles.charBonuses}>
              {activeCharacter.bonuses.salesMult > 1 && (
                <View style={[styles.bonusChip, { backgroundColor: "#10B98120", borderColor: "#10B98144" }]}>
                  <Text style={[styles.bonusChipText, { color: "#10B981" }]}>+{Math.round((activeCharacter.bonuses.salesMult - 1) * 100)}% vendas</Text>
                </View>
              )}
              {activeCharacter.bonuses.gameRevMult > 1 && (
                <View style={[styles.bonusChip, { backgroundColor: "#4DA6FF20", borderColor: "#4DA6FF44" }]}>
                  <Text style={[styles.bonusChipText, { color: "#4DA6FF" }]}>+{Math.round((activeCharacter.bonuses.gameRevMult - 1) * 100)}% jogos</Text>
                </View>
              )}
              {activeCharacter.bonuses.ratingBonus > 0 && (
                <View style={[styles.bonusChip, { backgroundColor: "#F5A62320", borderColor: "#F5A62344" }]}>
                  <Text style={[styles.bonusChipText, { color: "#F5A623" }]}>+{activeCharacter.bonuses.ratingBonus} rating</Text>
                </View>
              )}
              {activeCharacter.bonuses.costMult < 1 && (
                <View style={[styles.bonusChip, { backgroundColor: "#10B98120", borderColor: "#10B98144" }]}>
                  <Text style={[styles.bonusChipText, { color: "#10B981" }]}>-{Math.round((1 - activeCharacter.bonuses.costMult) * 100)}% custo</Text>
                </View>
              )}
            </View>
          </CollapsibleSection>
        )}

        {/* ── Balanço Financeiro ── */}
        <BalancoFinanceiro history={state.financialHistory ?? []} totalRevenue={state.totalRevenue} totalExpensesAccum={state.totalExpensesAccum ?? 0} colors={colors} />

        {/* Company formula summary */}
        <CollapsibleSection title="Fórmula de Receita" accent="#A855F7" defaultOpen={false}>
          <Text style={[styles.formulaText, { color: colors.mutedForeground }]}>
            Receita Final = Receita Base × (1 − Saturação) × Eficiência
          </Text>
          <View style={styles.formulaValues}>
            <View style={styles.formulaRow}>
              <Text style={[styles.formulaKey, { color: colors.mutedForeground }]}>Eficiência atual</Text>
              <Text style={[styles.formulaVal, { color: effColor }]}>{(eff * 100).toFixed(0)}%</Text>
            </View>
            <View style={styles.formulaRow}>
              <Text style={[styles.formulaKey, { color: colors.mutedForeground }]}>Saturação atual</Text>
              <Text style={[styles.formulaVal, { color: satColor }]}>{satPct}%</Text>
            </View>
            <View style={[styles.formulaRow, { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 8, paddingTop: 8 }]}>
              <Text style={[styles.formulaKey, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Multiplicador final</Text>
              <Text style={[styles.formulaVal, { color: "#A855F7", fontFamily: "Inter_700Bold" }]}>
                ×{((1 - sat) * eff).toFixed(2)}
              </Text>
            </View>
          </View>
        </CollapsibleSection>
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Balanço Financeiro component
// ─────────────────────────────────────────────────────────────────────────────
function BalancoFinanceiro({
  history, totalRevenue, totalExpensesAccum, colors,
}: {
  history: FinancialSnapshot[];
  totalRevenue: number;
  totalExpensesAccum: number;
  colors: any;
}) {
  const last = history[history.length - 1] ?? null;
  const prev = history[history.length - 2] ?? null;
  const chart = history.slice(-12);

  // Trend: compare last 3 profit values
  const trend = (() => {
    if (history.length < 3) return "estável";
    const recent = history.slice(-3).map((s) => s.profit);
    const growing = recent[2] > recent[1] && recent[1] > recent[0];
    const falling = recent[2] < recent[1] && recent[1] < recent[0];
    if (growing) return "crescendo";
    if (falling) return "em queda";
    return "estável";
  })();
  const trendColor = trend === "crescendo" ? "#10B981" : trend === "em queda" ? "#FF4D6A" : "#F5A623";
  const trendIcon: "trending-up" | "trending-down" | "minus" =
    trend === "crescendo" ? "trending-up" : trend === "em queda" ? "trending-down" : "minus";

  // Profit margin (last month)
  const margin = last && last.revenue > 0
    ? Math.round((last.profit / last.revenue) * 100)
    : 0;
  const marginColor = margin > 20 ? "#10B981" : margin > 0 ? "#F5A623" : "#FF4D6A";

  // Month-over-month delta
  const revDelta  = last && prev ? last.revenue  - prev.revenue  : 0;
  const profDelta = last && prev ? last.profit   - prev.profit   : 0;

  // Chart: normalize bars
  const maxAbs = Math.max(...chart.map((s) => Math.abs(s.profit)), 1);

  if (!last) {
    return (
      <CollapsibleSection title="Balanço Financeiro" accent="#10B981">
        <View style={{ alignItems: "center", paddingVertical: 16, gap: 6 }}>
          <Feather name="bar-chart-2" size={32} color={colors.mutedForeground} />
          <Text style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: "Inter_500Medium" }}>
            Dados disponíveis após o primeiro mês
          </Text>
        </View>
      </CollapsibleSection>
    );
  }

  return (
    <CollapsibleSection title="Balanço Financeiro" accent="#10B981" badge={trend} badgeColor={trendColor} defaultOpen>
      {/* KPI cards — last month */}
      <View style={bStyles.kpiRow}>
        <BKpiCard label="Receita" value={last.revenue} delta={revDelta} icon="arrow-up-circle" color="#10B981" colors={colors} />
        <BKpiCard label="Despesas" value={last.expenses} icon="arrow-down-circle" color="#FF4D6A" colors={colors} />
        <BKpiCard label="Resultado" value={last.profit} delta={profDelta} icon="activity" color={last.profit >= 0 ? "#10B981" : "#FF4D6A"} colors={colors} />
      </View>

      {/* Cash + margin row */}
      <View style={[bStyles.cashRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={bStyles.cashItem}>
          <Text style={[bStyles.cashLabel, { color: colors.mutedForeground }]}>Caixa atual</Text>
          <Text style={[bStyles.cashValue, { color: last.cash >= 0 ? colors.foreground : "#FF4D6A" }]}>
            {formatMoney(last.cash)}
          </Text>
        </View>
        <View style={[bStyles.cashDivider, { backgroundColor: colors.border }]} />
        <View style={bStyles.cashItem}>
          <Text style={[bStyles.cashLabel, { color: colors.mutedForeground }]}>Margem</Text>
          <Text style={[bStyles.cashValue, { color: marginColor }]}>
            {margin > 0 ? "+" : ""}{margin}%
          </Text>
        </View>
        <View style={[bStyles.cashDivider, { backgroundColor: colors.border }]} />
        <View style={bStyles.cashItem}>
          <Text style={[bStyles.cashLabel, { color: colors.mutedForeground }]}>Tendência</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Feather name={trendIcon} size={12} color={trendColor} />
            <Text style={[bStyles.cashValue, { color: trendColor }]}>{trend}</Text>
          </View>
        </View>
      </View>

      {/* Accumulated totals */}
      <View style={[bStyles.accumRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={bStyles.accumItem}>
          <Text style={[bStyles.accumLabel, { color: colors.mutedForeground }]}>Receita acumulada</Text>
          <Text style={[bStyles.accumValue, { color: "#10B981" }]}>{formatMoney(totalRevenue)}</Text>
        </View>
        <View style={[bStyles.cashDivider, { backgroundColor: colors.border }]} />
        <View style={bStyles.accumItem}>
          <Text style={[bStyles.accumLabel, { color: colors.mutedForeground }]}>Despesas acumuladas</Text>
          <Text style={[bStyles.accumValue, { color: "#FF4D6A" }]}>{formatMoney(totalExpensesAccum)}</Text>
        </View>
        <View style={[bStyles.cashDivider, { backgroundColor: colors.border }]} />
        <View style={bStyles.accumItem}>
          <Text style={[bStyles.accumLabel, { color: colors.mutedForeground }]}>Lucro total</Text>
          <Text style={[bStyles.accumValue, { color: totalRevenue - totalExpensesAccum >= 0 ? "#10B981" : "#FF4D6A" }]}>
            {formatMoney(totalRevenue - totalExpensesAccum)}
          </Text>
        </View>
      </View>

      {/* Monthly profit chart (last 12 months) */}
      {chart.length >= 2 && (
        <View style={bStyles.chartWrap}>
          <Text style={[bStyles.chartTitle, { color: colors.mutedForeground }]}>
            Resultado mensal (últimos {chart.length} meses)
          </Text>
          <View style={bStyles.chartBars}>
            {chart.map((snap, i) => {
              const isPos = snap.profit >= 0;
              const barH = Math.max(4, Math.round((Math.abs(snap.profit) / maxAbs) * 56));
              const isLast = i === chart.length - 1;
              return (
                <View key={`${snap.year}-${snap.month}`} style={bStyles.barCol}>
                  <View style={{ height: 60, justifyContent: "flex-end" }}>
                    <View style={[bStyles.bar, {
                      height: barH,
                      backgroundColor: isPos ? "#10B981" : "#FF4D6A",
                      opacity: isLast ? 1 : 0.55 + (i / chart.length) * 0.45,
                    }]} />
                  </View>
                  {isLast && (
                    <Text style={[bStyles.barLast, { color: isPos ? "#10B981" : "#FF4D6A" }]}>
                      {MONTHS_PT[(snap.month - 1) % 12]}
                    </Text>
                  )}
                  {!isLast && (
                    <Text style={[bStyles.barLabel, { color: colors.mutedForeground }]}>
                      {i % 3 === 0 ? MONTHS_PT[(snap.month - 1) % 12] : ""}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
          <View style={bStyles.chartLegend}>
            <View style={bStyles.legendItem}>
              <View style={[bStyles.legendDot, { backgroundColor: "#10B981" }]} />
              <Text style={[bStyles.legendText, { color: colors.mutedForeground }]}>Lucro</Text>
            </View>
            <View style={bStyles.legendItem}>
              <View style={[bStyles.legendDot, { backgroundColor: "#FF4D6A" }]} />
              <Text style={[bStyles.legendText, { color: colors.mutedForeground }]}>Prejuízo</Text>
            </View>
          </View>
        </View>
      )}

      {/* Expense breakdown for last month */}
      <View style={[bStyles.breakdownBox, { borderColor: colors.border }]}>
        <Text style={[bStyles.breakdownTitle, { color: colors.mutedForeground }]}>Último mês</Text>
        <BRow label="Receita bruta" value={last.revenue} color="#10B981" colors={colors} />
        <BRow label="Despesas operacionais" value={-last.expenses} color="#FF4D6A" colors={colors} />
        <View style={[bStyles.totalLine, { borderTopColor: colors.border }]}>
          <Text style={[bStyles.totalLabel, { color: colors.foreground }]}>Resultado</Text>
          <Text style={[bStyles.totalVal, { color: last.profit >= 0 ? "#10B981" : "#FF4D6A" }]}>
            {last.profit >= 0 ? "+" : ""}{formatMoney(last.profit)}
          </Text>
        </View>
      </View>
    </CollapsibleSection>
  );
}

function BKpiCard({ label, value, delta, icon, color, colors }: {
  label: string; value: number; delta?: number; icon: string; color: string; colors: any;
}) {
  return (
    <View style={[bStyles.kpiCard, { backgroundColor: color + "12", borderColor: color + "35" }]}>
      <Feather name={icon as any} size={13} color={color} />
      <Text style={[bStyles.kpiLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[bStyles.kpiValue, { color }]}>{formatMoney(Math.abs(value))}</Text>
      {delta !== undefined && delta !== 0 && (
        <Text style={[bStyles.kpiDelta, { color: delta > 0 ? "#10B981" : "#FF4D6A" }]}>
          {delta > 0 ? "▲" : "▼"} {formatMoney(Math.abs(delta))}
        </Text>
      )}
    </View>
  );
}

function BRow({ label, value, color, colors }: { label: string; value: number; color: string; colors: any }) {
  return (
    <View style={bStyles.bRow}>
      <Text style={[bStyles.bRowLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[bStyles.bRowValue, { color }]}>
        {value >= 0 ? "+" : ""}{formatMoney(value)}
      </Text>
    </View>
  );
}

const bStyles = StyleSheet.create({
  kpiRow:          { flexDirection: "row", gap: 8, marginBottom: 10 },
  kpiCard:         { flex: 1, borderWidth: 1, borderRadius: 10, padding: 10, gap: 3, alignItems: "center" },
  kpiLabel:        { fontSize: 10, fontFamily: "Inter_500Medium", textAlign: "center" },
  kpiValue:        { fontSize: 13, fontFamily: "Inter_700Bold", textAlign: "center" },
  kpiDelta:        { fontSize: 9, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  cashRow:         { flexDirection: "row", borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 10, gap: 0 },
  cashItem:        { flex: 1, alignItems: "center", gap: 3 },
  cashLabel:       { fontSize: 10, fontFamily: "Inter_500Medium", textAlign: "center" },
  cashValue:       { fontSize: 13, fontFamily: "Inter_700Bold", textAlign: "center" },
  cashDivider:     { width: 1, marginVertical: 2 },
  accumRow:        { flexDirection: "row", borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 10, gap: 0 },
  accumItem:       { flex: 1, alignItems: "center", gap: 3 },
  accumLabel:      { fontSize: 9, fontFamily: "Inter_500Medium", textAlign: "center" },
  accumValue:      { fontSize: 12, fontFamily: "Inter_700Bold", textAlign: "center" },
  chartWrap:       { marginBottom: 10, gap: 6 },
  chartTitle:      { fontSize: 11, fontFamily: "Inter_500Medium", marginBottom: 4 },
  chartBars:       { flexDirection: "row", gap: 3, alignItems: "flex-end", height: 72 },
  barCol:          { flex: 1, alignItems: "center", gap: 2 },
  bar:             { width: "80%", borderRadius: 3, minHeight: 4 },
  barLabel:        { fontSize: 8, fontFamily: "Inter_400Regular", textAlign: "center" },
  barLast:         { fontSize: 8, fontFamily: "Inter_700Bold", textAlign: "center" },
  chartLegend:     { flexDirection: "row", gap: 12, justifyContent: "center" },
  legendItem:      { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot:       { width: 7, height: 7, borderRadius: 3.5 },
  legendText:      { fontSize: 10, fontFamily: "Inter_400Regular" },
  breakdownBox:    { borderWidth: 1, borderRadius: 10, padding: 12, gap: 6 },
  breakdownTitle:  { fontSize: 10, fontFamily: "Inter_500Medium", marginBottom: 2 },
  bRow:            { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  bRowLabel:       { fontSize: 12, fontFamily: "Inter_400Regular" },
  bRowValue:       { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  totalLine:       { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, paddingTop: 8, marginTop: 2 },
  totalLabel:      { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  totalVal:        { fontSize: 14, fontFamily: "Inter_700Bold" },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, gap: 12 },
  repRow: { gap: 12 },
  repItem: { gap: 6 },
  repLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  repBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  repBarFill: { height: "100%", borderRadius: 3 },
  repValue: { fontSize: 13, fontFamily: "Inter_700Bold", textAlign: "right" },
  effRow: { gap: 16 },
  effItem: { gap: 6 },
  effHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  effLabel: { flex: 1, fontSize: 12, fontFamily: "Inter_600SemiBold" },
  effValue: { fontSize: 14, fontFamily: "Inter_700Bold" },
  barTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 3 },
  effSub: { fontSize: 11, fontFamily: "Inter_400Regular" },
  divider: { height: 1 },
  tierRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  tierBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  tierLabel: { fontSize: 11, fontFamily: "Inter_700Bold" },
  mktLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  stackBar: { height: 8, borderRadius: 4, overflow: "hidden", flexDirection: "row", marginBottom: 12 },
  fanLegend: { flexDirection: "row", gap: 8 },
  fanItem: { flex: 1, gap: 2 },
  fanItemHeader: { flexDirection: "row", alignItems: "center", gap: 4 },
  fanDot: { width: 7, height: 7, borderRadius: 3.5 },
  fanItemLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", flex: 1 },
  fanItemPct: { fontSize: 10, fontFamily: "Inter_700Bold" },
  fanItemCount: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  fanItemDecay: { fontSize: 10, fontFamily: "Inter_400Regular" },
  charRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  charBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  charBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  charName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  charBonuses: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  bonusChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  bonusChipText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  formulaText: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 12, lineHeight: 20 },
  formulaValues: { gap: 6 },
  formulaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  formulaKey: { fontSize: 12, fontFamily: "Inter_500Medium" },
  formulaVal: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
