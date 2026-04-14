import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Platform, Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useGameplay } from "@/context/GameplayContext";
import { GridBackground } from "@/components/GridBackground";
import { ScreenHeader } from "@/components/ScreenHeader";
import { formatMoney, getHireCostInflation, safeN } from "@/constants/gameEconomics";
import {
  EmployeeType, EmployeeLevel,
  EMPLOYEE_HIRE_COST, EMPLOYEE_MONTHLY_SALARY,
  EMPLOYEE_TYPE_COLORS, EMPLOYEE_TYPE_ICONS, EMPLOYEE_TYPE_NAMES,
  EMPLOYEE_LEVEL_NAMES, EMPLOYEE_LEVEL_BONUS,
  computeEmployeeBonuses, getObsolescenceFactor, getRetrainCost,
  getTeamOfficeMonthlyCost,
  EMPLOYEE_TRAIT_LABELS, EMPLOYEE_TRAIT_COLORS, EMPLOYEE_TRAIT_ICONS, EMPLOYEE_TRAIT_DESC,
} from "@/constants/gameEngine";

const EMP_TYPES: EmployeeType[] = ["engineer", "designer", "marketing", "sales", "researcher"];
const EMP_LEVELS: EmployeeLevel[] = ["junior", "senior", "principal"];

const TIER_NUM: Record<EmployeeLevel, string> = { junior: "I", senior: "II", principal: "III" };
const TIER_LABEL: Record<EmployeeLevel, string> = { junior: "Jr", senior: "Sr", principal: "P" };

const TYPE_DESC: Record<EmployeeType, string> = {
  engineer:   "Aumenta o rating técnico dos seus consoles",
  designer:   "Reduz custos de produção de cada jogo",
  marketing:  "Amplifica a eficiência de campanhas",
  sales:      "Multiplica as vendas mensais de jogos",
  researcher: "Acelera o progresso na árvore de P&D",
};

const EMP_BENEFIT_LABELS: Record<EmployeeType, string> = {
  engineer:   "+{v}% rating nos consoles",
  designer:   "-{v}% custo de produção",
  marketing:  "+{v}% eficiência de campanhas",
  sales:      "+{v}% vendas mensais",
  researcher: "+{v}% velocidade de pesquisa",
};

function getBenefitLabel(type: EmployeeType, level: EmployeeLevel): string {
  const bonus = EMPLOYEE_LEVEL_BONUS[type][level];
  const label = EMP_BENEFIT_LABELS[type];
  const val = Math.round(safeN(bonus, 0) * 100).toString();
  return label.replace("{v}", val);
}

const MAX_OFFICE_LEVEL = 8;
const OFFICE_SECTORS_COUNT = 8; // one slot added per sector per upgrade

function getOfficeLevelCapacity(officeLevel: number, branchCount: number): number {
  return 10 + branchCount * 3 + (officeLevel - 1) * OFFICE_SECTORS_COUNT;
}

function getOfficeUpgradeCost(officeLevel: number, empCount: number): number {
  return Math.round(50_000 * Math.pow(officeLevel, 2) * (1 + empCount / 15));
}

type Section = "overview" | "recrutar" | "escritorio" | "gestao";

const SECTIONS: { id: Section; label: string; icon: string }[] = [
  { id: "overview",    label: "Visão\nGeral",   icon: "bar-chart-2" },
  { id: "recrutar",    label: "Recrutar",        icon: "user-plus" },
  { id: "escritorio",  label: "Escritório",      icon: "home" },
  { id: "gestao",      label: "Gestão",          icon: "users" },
];

export default function EmployeesScreen() {
  "use no memo"; // React Compiler: inner render-functions (renderGestao, etc.) close over
  // `employees` — opt out of auto-memoization so state updates always re-render.
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state, hireEmployee, fireEmployee, retrainEmployee, bulkHireEmployee, upgradeOfficeCapacity } = useGameplay();
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [section, setSection] = useState<Section>("overview");
  const [selectedType, setSelectedType] = useState<EmployeeType>("engineer");
  const [hireCount, setHireCount] = useState(1);

  if (!state) return null;

  const employees = state.employees ?? [];
  const empBonuses = computeEmployeeBonuses(employees, state.year);
  const totalSalaries = employees.reduce((s, e) => s + e.monthlySalary, 0);
  const salesBranchCount = (state.branches ?? []).filter(b => b.type === "sales_office").length;
  const officeLevel = state.officeLevel ?? 1;
  const maxEmployees = getOfficeLevelCapacity(officeLevel, salesBranchCount);
  const teamFull = employees.length >= maxEmployees;
  const upgradeCost = getOfficeUpgradeCost(officeLevel, employees.length);
  const canUpgrade = officeLevel < MAX_OFFICE_LEVEL;
  const color = EMPLOYEE_TYPE_COLORS[selectedType];

  const handleHire = (level: EmployeeLevel) => {
    const eraInflation = getHireCostInflation(state.year);
    const cost = Math.round(EMPLOYEE_HIRE_COST[selectedType][level] * eraInflation);
    const salary = EMPLOYEE_MONTHLY_SALARY[selectedType][level];
    const totalCost = cost * hireCount;
    const totalSal = salary * hireCount;
    const label = hireCount > 1 ? `${hireCount}× ` : "";

    const doHire = () => {
      const err = hireCount > 1
        ? bulkHireEmployee(selectedType, level, hireCount)
        : hireEmployee(selectedType, level);
      if (err) Alert.alert("Erro", err);
      else if (hireCount > 1) Alert.alert("Sucesso", `${hireCount} ${EMPLOYEE_TYPE_NAMES[selectedType].toLowerCase()}s contratados!`);
    };

    // Alert.alert is a no-op stub in react-native-web (static alert() {}).
    // On web use window.confirm so the confirmation actually fires.
    if (Platform.OS === "web") {
      const msg = `Contratar ${label}${EMPLOYEE_LEVEL_NAMES[level]}?\n\nCusto: ${formatMoney(totalCost)} · Salário: ${formatMoney(totalSal)}/mês`;
      const confirmed = typeof window !== "undefined" ? window.confirm(msg) : false;
      if (confirmed) doHire();
      return;
    }

    Alert.alert(
      `Contratar ${label}${EMPLOYEE_LEVEL_NAMES[level]}?`,
      `${EMPLOYEE_TYPE_NAMES[selectedType]} — ${EMPLOYEE_LEVEL_NAMES[level]}\n\nCusto total: ${formatMoney(totalCost)}\nSalário total/mês: +${formatMoney(totalSal)}\n\nEfeito por funcionário: ${getBenefitLabel(selectedType, level)}`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Contratar", onPress: doHire },
      ]
    );
  };

  const handleFire = (id: string, name: string) => {
    Alert.alert("Demitir Funcionário", `Tem certeza que deseja demitir ${name}?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Demitir", style: "destructive", onPress: () => fireEmployee(id) },
    ]);
  };

  const handleRetrain = (empId: string, name: string, cost: number, obsPercent: number) => {
    if ((state?.money ?? 0) < cost) {
      Alert.alert("Saldo Insuficiente", `Retreinar ${name} custa ${formatMoney(cost)}.`);
      return;
    }
    Alert.alert(
      `Retreinar ${name}`,
      `Este funcionário perdeu ${obsPercent}% da eficiência.\n\nCusto: ${formatMoney(cost)}`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Retreinar", onPress: () => { const err = retrainEmployee(empId); if (err) Alert.alert("Erro", err); else Alert.alert("Sucesso", `${name} foi retreinado!`); } },
      ]
    );
  };

  const handleOfficeUpgrade = () => {
    Alert.alert(
      `Expandir Escritório — Nível ${officeLevel + 1}`,
      `Custo: ${formatMoney(upgradeCost)}\n\nExpansão adiciona +${OFFICE_SECTORS_COUNT} vagas (1 por setor).\n\nNova capacidade: ${getOfficeLevelCapacity(officeLevel + 1, salesBranchCount)} funcionários`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Expandir",
          onPress: () => {
            const err = upgradeOfficeCapacity();
            if (err) Alert.alert("Erro", err);
          },
        },
      ]
    );
  };

  // ── OVERVIEW SECTION ─────────────────────────────────────────────────────
  const renderOverview = () => (
    <ScrollView style={styles.sectionContent} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: botPad + 100 }}>
      <View style={styles.statsGrid}>
        <MiniStat icon="users" label="Equipa" value={`${employees.length}/${maxEmployees}`}
          color={teamFull ? "#FF4D6A" : "#4DA6FF"} colors={colors} accent={teamFull} />
        <MiniStat icon="dollar-sign" label="Salários/mês" value={formatMoney(totalSalaries)}
          color="#FF4D6A" colors={colors} />
        <MiniStat icon="star" label="Rating Bonus" value={`+${safeN(empBonuses.ratingBonus, 0).toFixed(2)}`}
          color="#10B981" colors={colors} />
        <MiniStat icon="trending-up" label="Vendas Bonus" value={`+${Math.round((empBonuses.salesMult - 1) * 100)}%`}
          color="#F5A623" colors={colors} />
      </View>

      <View style={[styles.overviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.mutedForeground }]}>COMPOSIÇÃO DA EQUIPA</Text>
        {EMP_TYPES.map((t) => {
          const col = EMPLOYEE_TYPE_COLORS[t];
          const count = employees.filter((e) => e.type === t).length;
          const jrs = employees.filter((e) => e.type === t && e.level === "junior").length;
          const srs = employees.filter((e) => e.type === t && e.level === "senior").length;
          const pri = employees.filter((e) => e.type === t && e.level === "principal").length;
          return (
            <View key={t} style={styles.overviewRow}>
              <View style={[styles.overviewDot, { backgroundColor: col }]} />
              <View style={[styles.overviewIcon, { backgroundColor: col + "18" }]}>
                <Feather name={EMPLOYEE_TYPE_ICONS[t] as any} size={13} color={col} />
              </View>
              <Text style={[styles.overviewLabel, { color: colors.foreground }]}>{EMPLOYEE_TYPE_NAMES[t]}</Text>
              <View style={styles.overviewTiers}>
                {jrs > 0 && <View style={[styles.tierPip, { backgroundColor: "#6B728022" }]}><Text style={[styles.tierPipTxt, { color: "#6B7280" }]}>{jrs}Jr</Text></View>}
                {srs > 0 && <View style={[styles.tierPip, { backgroundColor: "#4DA6FF22" }]}><Text style={[styles.tierPipTxt, { color: "#4DA6FF" }]}>{srs}Sr</Text></View>}
                {pri > 0 && <View style={[styles.tierPip, { backgroundColor: "#A855F722" }]}><Text style={[styles.tierPipTxt, { color: "#A855F7" }]}>{pri}P</Text></View>}
                {count === 0 && <Text style={[styles.tierPipTxt, { color: colors.mutedForeground }]}>—</Text>}
              </View>
              <Text style={[styles.overviewCount, { color: col }]}>{count}</Text>
            </View>
          );
        })}
      </View>

      <View style={[styles.overviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.mutedForeground }]}>CAPACIDADE DO ESCRITÓRIO</Text>
        <View style={styles.capacityRow}>
          <View style={styles.capacityBar}>
            <View style={[styles.capacityFill, {
              width: `${Math.min(100, (employees.length / maxEmployees) * 100)}%`,
              backgroundColor: teamFull ? "#FF4D6A" : "#4DA6FF",
            }]} />
          </View>
          <Text style={[styles.capacityLabel, { color: teamFull ? "#FF4D6A" : "#4DA6FF" }]}>
            {employees.length}/{maxEmployees}
          </Text>
        </View>
        <Text style={[styles.capacityNote, { color: colors.mutedForeground }]}>
          Nível {officeLevel}{canUpgrade ? ` · +3 por filial · +${OFFICE_SECTORS_COUNT} por upgrade` : " · Nível máximo"}
        </Text>
      </View>
    </ScrollView>
  );

  // ── RECRUIT SECTION ────────────────────────────────────────────────────────
  const renderRecrutar = () => (
    <View style={styles.sectionContent}>
      {/* Role tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roleTabsWrap}
        contentContainerStyle={styles.roleTabsContent}>
        {EMP_TYPES.map((t) => {
          const col = EMPLOYEE_TYPE_COLORS[t];
          const cnt = employees.filter((e) => e.type === t).length;
          const isSel = selectedType === t;
          return (
            <TouchableOpacity key={t} onPress={() => { setSelectedType(t); setHireCount(1); }}
              activeOpacity={0.8}
              style={[styles.roleTab, { backgroundColor: isSel ? col : colors.card, borderColor: isSel ? col : colors.border }]}>
              <View style={[styles.roleTabIcon, { backgroundColor: isSel ? "rgba(255,255,255,0.15)" : col + "18" }]}>
                <Feather name={EMPLOYEE_TYPE_ICONS[t] as any} size={13} color={isSel ? "#fff" : col} />
              </View>
              <Text style={[styles.roleTabText, { color: isSel ? "#fff" : colors.mutedForeground }]}>
                {EMPLOYEE_TYPE_NAMES[t]}
              </Text>
              {cnt > 0 && (
                <View style={[styles.roleTabBadge, { backgroundColor: isSel ? "rgba(255,255,255,0.25)" : col + "22" }]}>
                  <Text style={[styles.roleTabBadgeTxt, { color: isSel ? "#fff" : col }]}>{cnt}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Role banner */}
      <View style={[styles.roleBanner, { backgroundColor: color + "12", borderColor: color + "30" }]}>
        <LinearGradient colors={[color + "20", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1.2, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={[styles.roleBannerIcon, { backgroundColor: color + "25", borderColor: color + "44" }]}>
          <Feather name={EMPLOYEE_TYPE_ICONS[selectedType] as any} size={22} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.roleBannerName, { color: colors.foreground }]}>{EMPLOYEE_TYPE_NAMES[selectedType]}</Text>
          <Text style={[styles.roleBannerDesc, { color: colors.mutedForeground }]}>{TYPE_DESC[selectedType]}</Text>
        </View>
        <Text style={[styles.roleBannerCount, { color }]}>{employees.filter(e => e.type === selectedType).length}</Text>
      </View>

      {/* Quantity selector */}
      <View style={[styles.qtyRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.qtyLabel, { color: colors.mutedForeground }]}>Quantidade:</Text>
        <View style={styles.qtyControls}>
          {[1, 2, 3, 5, 10].map((n) => (
            <TouchableOpacity key={n} onPress={() => setHireCount(n)}
              style={[styles.qtyBtn, { backgroundColor: hireCount === n ? color : colors.card, borderColor: hireCount === n ? color : colors.border }]}>
              <Text style={[styles.qtyBtnTxt, { color: hireCount === n ? "#fff" : colors.mutedForeground }]}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {teamFull && (
          <View style={styles.fullBadge}>
            <Text style={styles.fullBadgeTxt}>Lotado</Text>
          </View>
        )}
      </View>

      {/* Hire cards */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: botPad + 100 }}>
        {EMP_LEVELS.map((level, idx) => {
          const hireCost = EMPLOYEE_HIRE_COST[selectedType][level];
          const salary = EMPLOYEE_MONTHLY_SALARY[selectedType][level];
          const totalCost = hireCost * hireCount;
          const totalSal = salary * hireCount;
          const canAfford = state.money >= totalCost && !teamFull;
          const tierColors = ["#6B7280", "#4DA6FF", "#A855F7"] as const;
          const tierColor = tierColors[idx];
          return (
            <View key={level} style={[styles.hireCard, {
              backgroundColor: colors.card, borderColor: colors.border, opacity: canAfford ? 1 : 0.55,
            }]}>
              <View style={[styles.hireAccent, { backgroundColor: tierColor }]} />
              <View style={[styles.hireTierBadge, { backgroundColor: tierColor + "18", borderColor: tierColor + "44" }]}>
                <Text style={[styles.hireTierNum, { color: tierColor }]}>{TIER_NUM[level]}</Text>
                <Text style={[styles.hireTierLbl, { color: tierColor }]}>{TIER_LABEL[level]}</Text>
              </View>
              <View style={styles.hireMid}>
                <Text style={[styles.hireLevelName, { color: colors.foreground }]}>{EMPLOYEE_LEVEL_NAMES[level]}</Text>
                <View style={[styles.hireBenefitPill, { backgroundColor: color + "15", borderColor: color + "30" }]}>
                  <Feather name="zap" size={10} color={color} />
                  <Text style={[styles.hireBenefitTxt, { color }]}>{getBenefitLabel(selectedType, level)}</Text>
                </View>
                <View style={styles.hireCostRow}>
                  <Text style={[styles.hireSalary, { color: colors.mutedForeground }]}>
                    {hireCount > 1 ? `${formatMoney(totalSal)}/mês total` : `${formatMoney(salary)}/mês`}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => handleHire(level)} disabled={!canAfford} activeOpacity={0.85} style={styles.hireBtn}>
                <LinearGradient
                  colors={canAfford ? [color, color + "AA"] : [colors.secondary, colors.secondary]}
                  start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                  style={styles.hireBtnInner}
                >
                  <Feather name="user-plus" size={12} color={canAfford ? "#fff" : colors.mutedForeground} />
                  <Text style={[styles.hireBtnCost, { color: canAfford ? "#fff" : colors.mutedForeground }]}>
                    {formatMoney(totalCost)}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );

  // ── OFFICE SECTION ─────────────────────────────────────────────────────────
  const renderEscritorio = () => {
    const nextCapacity = getOfficeLevelCapacity(officeLevel + 1, salesBranchCount);
    const pct = employees.length / maxEmployees;
    return (
      <ScrollView style={styles.sectionContent} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: botPad + 100 }}>
        {/* Level display */}
        <View style={[styles.officeLevelCard, { backgroundColor: colors.card, borderColor: "#4DA6FF33" }]}>
          <LinearGradient colors={["#4DA6FF18", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <View style={styles.officeLevelHeader}>
            <View style={[styles.officeLevelIcon, { backgroundColor: "#4DA6FF22" }]}>
              <Feather name="home" size={22} color="#4DA6FF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.officeLevelTitle, { color: colors.foreground }]}>Escritório Nível {officeLevel}</Text>
              <Text style={[styles.officeLevelSub, { color: colors.mutedForeground }]}>
                {canUpgrade ? `Próx. nível: ${officeLevel + 1}/${MAX_OFFICE_LEVEL}` : "Nível máximo atingido"}
              </Text>
            </View>
            <View style={[styles.officeLevelBadge, { backgroundColor: canUpgrade ? "#4DA6FF22" : "#10B98122" }]}>
              <Text style={[styles.officeLevelBadgeTxt, { color: canUpgrade ? "#4DA6FF" : "#10B981" }]}>
                {canUpgrade ? `Lv${officeLevel}` : "MAX"}
              </Text>
            </View>
          </View>

          <View style={styles.capacityRow}>
            <View style={styles.capacityBar}>
              <View style={[styles.capacityFill, {
                width: `${Math.min(100, pct * 100)}%`,
                backgroundColor: pct >= 1 ? "#FF4D6A" : pct >= 0.8 ? "#F5A623" : "#4DA6FF",
              }]} />
            </View>
            <Text style={[styles.capacityLabel, { color: pct >= 1 ? "#FF4D6A" : "#4DA6FF" }]}>
              {employees.length}/{maxEmployees}
            </Text>
          </View>

          {/* Maintenance cost row */}
          <View style={[styles.maintRow, { borderTopColor: colors.border }]}>
            <View style={styles.maintLeft}>
              <Feather name="tool" size={12} color="#FF4D6A" />
              <Text style={[styles.maintLabel, { color: colors.mutedForeground }]}>Manutenção mensal</Text>
            </View>
            <Text style={[styles.maintValue, { color: "#FF4D6A" }]}>
              -{formatMoney(getTeamOfficeMonthlyCost(officeLevel, employees.length))}/mês
            </Text>
          </View>
          <Text style={[styles.maintNote, { color: colors.mutedForeground }]}>
            Nível {officeLevel} × $3.000 + {employees.length} func. × $150
          </Text>
        </View>

        {/* Level progression */}
        <View style={[styles.overviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.mutedForeground }]}>PROGRESSÃO DE NÍVEIS</Text>
          {Array.from({ length: MAX_OFFICE_LEVEL }, (_, i) => {
            const lvl = i + 1;
            const cap = getOfficeLevelCapacity(lvl, salesBranchCount);
            const isDone = lvl <= officeLevel;
            const isCurrent = lvl === officeLevel;
            return (
              <View key={lvl} style={[styles.levelRow, isCurrent && { backgroundColor: "#4DA6FF0A", borderRadius: 8, marginHorizontal: -4, paddingHorizontal: 4 }]}>
                <View style={[styles.levelDot, { backgroundColor: isDone ? "#4DA6FF" : colors.border }]}>
                  {isDone && <Feather name="check" size={9} color="#fff" />}
                </View>
                <Text style={[styles.levelRowLbl, { color: isCurrent ? "#4DA6FF" : isDone ? colors.foreground : colors.mutedForeground, fontFamily: isCurrent ? "Inter_700Bold" : "Inter_400Regular" }]}>
                  Nível {lvl}
                </Text>
                <Text style={[styles.levelRowCap, { color: isCurrent ? "#4DA6FF" : isDone ? "#10B981" : colors.mutedForeground }]}>
                  {cap} vagas{isCurrent ? " (atual)" : ""}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Upgrade card */}
        {canUpgrade ? (
          <View style={[styles.overviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.mutedForeground }]}>EXPANSÃO</Text>
            <View style={styles.upgradeInfoRow}>
              <View style={styles.upgradeInfoItem}>
                <Text style={[styles.upgradeInfoVal, { color: "#4DA6FF" }]}>{nextCapacity}</Text>
                <Text style={[styles.upgradeInfoLbl, { color: colors.mutedForeground }]}>Nova capacidade</Text>
              </View>
              <View style={[styles.upgradeArrow, { backgroundColor: colors.border }]} />
              <View style={styles.upgradeInfoItem}>
                <Text style={[styles.upgradeInfoVal, { color: "#10B981" }]}>+{OFFICE_SECTORS_COUNT}</Text>
                <Text style={[styles.upgradeInfoLbl, { color: colors.mutedForeground }]}>Novas vagas</Text>
              </View>
              <View style={[styles.upgradeArrow, { backgroundColor: colors.border }]} />
              <View style={styles.upgradeInfoItem}>
                <Text style={[styles.upgradeInfoVal, { color: "#FF4D6A" }]}>{formatMoney(upgradeCost)}</Text>
                <Text style={[styles.upgradeInfoLbl, { color: colors.mutedForeground }]}>Custo</Text>
              </View>
            </View>
            <View style={[styles.upgradeNote, { backgroundColor: "#F5A62311", borderColor: "#F5A62333" }]}>
              <Feather name="info" size={12} color="#F5A623" />
              <Text style={[styles.upgradeNoteTxt, { color: colors.mutedForeground }]}>
                Cada upgrade adiciona +1 vaga por setor ({OFFICE_SECTORS_COUNT} setores = +{OFFICE_SECTORS_COUNT} vagas). Filiais adicionam +3 vagas cada.
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleOfficeUpgrade}
              disabled={state.money < upgradeCost}
              style={[styles.upgradeBtn, { backgroundColor: state.money >= upgradeCost ? "#4DA6FF" : "#4DA6FF44" }]}
              activeOpacity={0.85}
            >
              <Feather name="arrow-up-circle" size={16} color={state.money >= upgradeCost ? "#fff" : "#4DA6FF"} />
              <Text style={[styles.upgradeBtnTxt, { color: state.money >= upgradeCost ? "#fff" : "#4DA6FF" }]}>
                Expandir para Nível {officeLevel + 1}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.overviewCard, { backgroundColor: "#10B98111", borderColor: "#10B98133" }]}>
            <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
              <Feather name="check-circle" size={18} color="#10B981" />
              <Text style={[styles.upgradeNoteTxt, { color: "#10B981", fontFamily: "Inter_700Bold" }]}>
                Escritório no nível máximo! Capacidade máxima atingida.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    );
  };

  // ── MANAGEMENT SECTION ─────────────────────────────────────────────────────
  const renderGestao = () => (
    <View style={styles.sectionContent}>
      {/* Role filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roleTabsWrap}
        contentContainerStyle={styles.roleTabsContent}>
        {EMP_TYPES.map((t) => {
          const col = EMPLOYEE_TYPE_COLORS[t];
          const cnt = employees.filter((e) => e.type === t).length;
          const isSel = selectedType === t;
          return (
            <TouchableOpacity key={t} onPress={() => setSelectedType(t)} activeOpacity={0.8}
              style={[styles.roleTab, { backgroundColor: isSel ? col : colors.card, borderColor: isSel ? col : colors.border }]}>
              <View style={[styles.roleTabIcon, { backgroundColor: isSel ? "rgba(255,255,255,0.15)" : col + "18" }]}>
                <Feather name={EMPLOYEE_TYPE_ICONS[t] as any} size={13} color={isSel ? "#fff" : col} />
              </View>
              <Text style={[styles.roleTabText, { color: isSel ? "#fff" : colors.mutedForeground }]}>
                {EMPLOYEE_TYPE_NAMES[t]}
              </Text>
              {cnt > 0 && (
                <View style={[styles.roleTabBadge, { backgroundColor: isSel ? "rgba(255,255,255,0.25)" : col + "22" }]}>
                  <Text style={[styles.roleTabBadgeTxt, { color: isSel ? "#fff" : col }]}>{cnt}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Employee list */}
      {(() => {
        const typeEmps = employees.filter((e) => e.type === selectedType);
        if (typeEmps.length === 0) {
          return (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.emptyIconWrap, { backgroundColor: color + "15" }]}>
                <Feather name={EMPLOYEE_TYPE_ICONS[selectedType] as any} size={28} color={color} style={{ opacity: 0.6 }} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                Sem {EMPLOYEE_TYPE_NAMES[selectedType].toLowerCase()}s
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
                Usa a aba Recrutar para contratar
              </Text>
            </View>
          );
        }
        return (
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: botPad + 100 }}>
            {typeEmps.map((emp) => {
              const obsFactor = getObsolescenceFactor(emp, state.year);
              const isObsolete = obsFactor < 1.0;
              const obsPercent = Math.round((1 - obsFactor) * 100);
              const retrainCost = getRetrainCost(emp);
              const empColor = EMPLOYEE_TYPE_COLORS[emp.type];
              return (
                <View key={emp.id}
                  style={[styles.empCard, { backgroundColor: colors.card, borderColor: isObsolete ? "#FF4D6A33" : colors.border }]}>
                  <View style={[styles.empAccent, { backgroundColor: isObsolete ? "#FF4D6A" : empColor }]} />
                  <View style={[styles.empAvatarWrap, { backgroundColor: isObsolete ? "#FF4D6A18" : empColor + "18" }]}>
                    <Feather name={EMPLOYEE_TYPE_ICONS[emp.type] as any} size={18} color={isObsolete ? "#FF4D6A" : empColor} />
                  </View>
                  <View style={styles.empBody}>
                    <View style={styles.empTopRow}>
                      <Text style={[styles.empName, { color: colors.foreground }]}>{emp.name}</Text>
                      <View style={[styles.levelPill, { backgroundColor: empColor + "20", borderColor: empColor + "44" }]}>
                        <Text style={[styles.levelPillText, { color: empColor }]}>{EMPLOYEE_LEVEL_NAMES[emp.level]}</Text>
                      </View>
                    </View>
                    <View style={styles.empBottomRow}>
                      <Text style={styles.empSalary}>
                        <Text style={[styles.empSalaryVal, { color: "#FF4D6A" }]}>{formatMoney(emp.monthlySalary)}</Text>
                        <Text style={{ color: colors.mutedForeground }}> / mês</Text>
                      </Text>
                      {isObsolete && (
                        <View style={styles.obsTag}>
                          <Feather name="alert-triangle" size={10} color="#F5A623" />
                          <Text style={styles.obsTagText}>-{obsPercent}% efic.</Text>
                        </View>
                      )}
                    </View>
                    {emp.trait && (
                      <View style={[styles.traitRow, { backgroundColor: EMPLOYEE_TRAIT_COLORS[emp.trait] + "12", borderColor: EMPLOYEE_TRAIT_COLORS[emp.trait] + "30" }]}>
                        <Feather name={EMPLOYEE_TRAIT_ICONS[emp.trait] as any} size={10} color={EMPLOYEE_TRAIT_COLORS[emp.trait]} />
                        <Text style={[styles.traitLabel, { color: EMPLOYEE_TRAIT_COLORS[emp.trait] }]}>{EMPLOYEE_TRAIT_LABELS[emp.trait]}</Text>
                        <Text style={[styles.traitDesc, { color: colors.mutedForeground }]}>{EMPLOYEE_TRAIT_DESC[emp.trait]}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.empActions}>
                    {isObsolete && (
                      <TouchableOpacity onPress={() => handleRetrain(emp.id, emp.name, retrainCost, obsPercent)}
                        style={[styles.actionBtn, { backgroundColor: "#F5A62318", borderColor: "#F5A62340" }]} activeOpacity={0.7}>
                        <Feather name="refresh-cw" size={14} color="#F5A623" />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => handleFire(emp.id, emp.name)}
                      style={[styles.actionBtn, { backgroundColor: "#FF4D6A18", borderColor: "#FF4D6A40" }]} activeOpacity={0.7}>
                      <Feather name="user-x" size={14} color="#FF4D6A" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        );
      })()}
    </View>
  );

  const renderSection = () => {
    switch (section) {
      case "overview":   return renderOverview();
      case "recrutar":   return renderRecrutar();
      case "escritorio": return renderEscritorio();
      case "gestao":     return renderGestao();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GridBackground />
      <ScreenHeader title="Equipa" />

      {/* Body: side nav + content */}
      <View style={styles.body}>
        {/* Side Navigation */}
        <View style={[styles.sideNav, { backgroundColor: colors.card, borderRightColor: colors.border }]}>
          {SECTIONS.map((s) => {
            const isActive = section === s.id;
            const sectionCount = s.id === "gestao" ? employees.length : s.id === "escritorio" ? officeLevel : undefined;
            return (
              <TouchableOpacity key={s.id} onPress={() => setSection(s.id)}
                style={[styles.sideNavItem, isActive && { backgroundColor: "#4DA6FF18", borderRightColor: "#4DA6FF", borderRightWidth: 3 }]}
                activeOpacity={0.7}>
                <Feather name={s.icon as any} size={15} color={isActive ? "#4DA6FF" : colors.mutedForeground} />
                <Text style={[styles.sideNavLabel, { color: isActive ? "#4DA6FF" : colors.mutedForeground }]} numberOfLines={2}>
                  {s.label}
                </Text>
                {sectionCount !== undefined && sectionCount > 0 && (
                  <View style={[styles.sideNavBadge, { backgroundColor: isActive ? "#4DA6FF" : colors.border }]}>
                    <Text style={[styles.sideNavBadgeTxt, { color: isActive ? "#fff" : colors.mutedForeground }]}>
                      {sectionCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Content */}
        <View style={styles.contentArea}>
          {renderSection()}
        </View>
      </View>
    </View>
  );
}

function MiniStat({ icon, label, value, color, colors, accent }: {
  icon: string; label: string; value: string; color: string; colors: any; accent?: boolean;
}) {
  return (
    <View style={[styles.miniStat, { backgroundColor: colors.card, borderColor: accent ? color + "55" : colors.border }]}>
      <View style={[styles.miniStatIcon, { backgroundColor: color + "18" }]}>
        <Feather name={icon as any} size={13} color={color} />
      </View>
      <Text style={[styles.miniStatValue, { color }]}>{value}</Text>
      <Text style={[styles.miniStatLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1, flexDirection: "row" },

  sideNav: { width: 88, borderRightWidth: 1, paddingVertical: 8 },
  sideNavItem: { paddingVertical: 13, paddingHorizontal: 6, alignItems: "center", gap: 5 },
  sideNavLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", textAlign: "center", lineHeight: 13 },
  sideNavBadge: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 8 },
  sideNavBadgeTxt: { fontSize: 10, fontFamily: "Inter_700Bold" },

  contentArea: { flex: 1 },
  sectionContent: { flex: 1, padding: 12 },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  miniStat: { flex: 1, minWidth: "44%", borderRadius: 12, borderWidth: 1, padding: 11, gap: 4 },
  miniStatIcon: { width: 26, height: 26, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  miniStatValue: { fontSize: 14, fontFamily: "Inter_700Bold" },
  miniStatLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },

  overviewCard: { borderRadius: 14, borderWidth: 1, padding: 13, gap: 8, marginBottom: 10, overflow: "hidden" },
  cardTitle: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 2 },
  overviewRow: { flexDirection: "row", alignItems: "center", gap: 7, paddingVertical: 4 },
  overviewDot: { width: 6, height: 6, borderRadius: 3 },
  overviewIcon: { width: 24, height: 24, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  overviewLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", flex: 1 },
  overviewTiers: { flexDirection: "row", gap: 4 },
  overviewCount: { fontSize: 14, fontFamily: "Inter_700Bold", minWidth: 18, textAlign: "right" },
  tierPip: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5 },
  tierPipTxt: { fontSize: 9, fontFamily: "Inter_700Bold" },

  capacityRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  capacityBar: { flex: 1, height: 6, borderRadius: 3, backgroundColor: "#1E3A5F55", overflow: "hidden" },
  capacityFill: { height: 6, borderRadius: 3 },
  capacityLabel: { fontSize: 12, fontFamily: "Inter_700Bold" },
  capacityNote: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 4 },

  roleTabsWrap: { flexGrow: 0, marginBottom: 8 },
  roleTabsContent: { paddingBottom: 4, gap: 6, flexDirection: "row" },
  roleTab: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  roleTabIcon: { width: 22, height: 22, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  roleTabText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  roleTabBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 9 },
  roleTabBadgeTxt: { fontSize: 10, fontFamily: "Inter_700Bold" },

  roleBanner: { borderRadius: 14, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 10, padding: 12, overflow: "hidden", marginBottom: 8 },
  roleBannerIcon: { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  roleBannerName: { fontSize: 14, fontFamily: "Inter_700Bold" },
  roleBannerDesc: { fontSize: 10, fontFamily: "Inter_400Regular", lineHeight: 14 },
  roleBannerCount: { fontSize: 22, fontFamily: "Inter_700Bold" },

  qtyRow: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, borderWidth: 1, padding: 10, marginBottom: 8, flexWrap: "wrap" },
  qtyLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  qtyControls: { flexDirection: "row", gap: 5, flex: 1 },
  qtyBtn: { width: 36, height: 30, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  qtyBtnTxt: { fontSize: 12, fontFamily: "Inter_700Bold" },
  fullBadge: { backgroundColor: "#FF4D6A22", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  fullBadgeTxt: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: "#FF4D6A" },

  hireCard: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, borderWidth: 1, padding: 12, overflow: "hidden", marginBottom: 8 },
  hireAccent: { position: "absolute", left: 0, top: 0, bottom: 0, width: 3 },
  hireTierBadge: { width: 46, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 1, marginLeft: 6, gap: 0 },
  hireTierNum: { fontSize: 12, fontFamily: "Inter_700Bold", lineHeight: 15 },
  hireTierLbl: { fontSize: 10, fontFamily: "Inter_600SemiBold", lineHeight: 13 },
  hireMid: { flex: 1, gap: 4 },
  hireLevelName: { fontSize: 13, fontFamily: "Inter_700Bold" },
  hireBenefitPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 7, borderWidth: 1, alignSelf: "flex-start" },
  hireBenefitTxt: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  hireCostRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  hireSalary: { fontSize: 10, fontFamily: "Inter_400Regular" },
  hireBtn: { borderRadius: 10, overflow: "hidden" },
  hireBtnInner: { alignItems: "center", paddingVertical: 10, paddingHorizontal: 12, gap: 3 },
  hireBtnCost: { fontSize: 11, fontFamily: "Inter_700Bold" },

  maintRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 10, marginTop: 4, borderTopWidth: 1 },
  maintLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  maintLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  maintValue: { fontSize: 12, fontFamily: "Inter_700Bold" },
  maintNote: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 2 },

  officeLevelCard: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 12, overflow: "hidden", marginBottom: 10 },
  officeLevelHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  officeLevelIcon: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  officeLevelTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  officeLevelSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  officeLevelBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  officeLevelBadgeTxt: { fontSize: 12, fontFamily: "Inter_700Bold" },

  levelRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 5 },
  levelDot: { width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  levelRowLbl: { flex: 1, fontSize: 12 },
  levelRowCap: { fontSize: 12, fontFamily: "Inter_600SemiBold" },

  upgradeInfoRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingVertical: 8 },
  upgradeInfoItem: { alignItems: "center", gap: 4 },
  upgradeInfoVal: { fontSize: 15, fontFamily: "Inter_700Bold" },
  upgradeInfoLbl: { fontSize: 10, fontFamily: "Inter_400Regular" },
  upgradeArrow: { width: 1, height: 36 },
  upgradeNote: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 10, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
  upgradeNoteTxt: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 17, flex: 1 },
  upgradeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, borderRadius: 12 },
  upgradeBtnTxt: { fontSize: 13, fontFamily: "Inter_700Bold" },

  empCard: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, borderWidth: 1, padding: 11, overflow: "hidden", marginBottom: 7 },
  empAccent: { position: "absolute", left: 0, top: 0, bottom: 0, width: 3 },
  empAvatarWrap: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center", marginLeft: 7 },
  empBody: { flex: 1, gap: 4 },
  empTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  empName: { fontSize: 12, fontFamily: "Inter_600SemiBold", flex: 1 },
  levelPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 7, borderWidth: 1 },
  levelPillText: { fontSize: 9, fontFamily: "Inter_700Bold" },
  empBottomRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  empSalary: { fontSize: 10, fontFamily: "Inter_400Regular" },
  empSalaryVal: { fontFamily: "Inter_600SemiBold" },
  obsTag: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#F5A62318", paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5 },
  obsTagText: { fontSize: 9, fontFamily: "Inter_600SemiBold", color: "#F5A623" },
  traitRow: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 7, borderWidth: 1, marginTop: 2 },
  traitLabel: { fontSize: 9, fontFamily: "Inter_700Bold" },
  traitDesc: { fontSize: 9, fontFamily: "Inter_400Regular", flex: 1 },
  empActions: { gap: 6 },
  actionBtn: { width: 32, height: 32, borderRadius: 9, borderWidth: 1, alignItems: "center", justifyContent: "center" },

  emptyCard: { borderRadius: 16, borderWidth: 1, paddingVertical: 32, alignItems: "center", gap: 8, marginTop: 8 },
  emptyIconWrap: { width: 56, height: 56, borderRadius: 17, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  emptySubtitle: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 20, lineHeight: 17 },
});
