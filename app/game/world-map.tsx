import React, { useState, useMemo, useCallback } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, Modal, Platform, LayoutAnimation, UIManager,
} from "react-native";

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useGameplay } from "@/context/GameplayContext";
import { GridBackground } from "@/components/GridBackground";
import { ScreenHeader } from "@/components/ScreenHeader";
import { formatMoney } from "@/constants/gameEconomics";
import {
  COUNTRIES, REGION_NAMES, REGION_COLORS, RISK_COLORS, BRANCH_TYPE_NAMES, BRANCH_TYPE_ICONS,
  getCountryMarketSize, getUnlockCost, getBranchCost, getCountryRevenueMult,
  getStoreExpansionCost, STORE_EXPANSION_NAMES, STORE_EXPANSION_DESCRIPTIONS,
  getCountryStrategicProfile, BRANCH_TYPE_DESCRIPTIONS, getBranchMonthlyMaintenance, getBranchRecommendation,
  Region, Country, BranchType, StoreExpansionTier, StrategicTier,
} from "@/constants/globalMarket";
import type { BranchIncident, CountryBranch } from "@/constants/globalMarket";

type MapTab = "map" | "operations" | "incidents";

const INCIDENT_ICONS: Record<BranchIncident["type"], string> = {
  robbery: "🔓",
  vandalism: "🪟",
  strike: "✊",
  regulatory: "📋",
  fire: "🔥",
  power_outage: "⚡",
};

const INCIDENT_LABELS: Record<BranchIncident["type"], string> = {
  robbery: "Roubo",
  vandalism: "Vandalismo",
  strike: "Greve",
  regulatory: "Multa",
  fire: "Incêndio",
  power_outage: "Apagão",
};

const SEVERITY_COLORS: Record<BranchIncident["severity"], string> = {
  minor: "#F5A623",
  major: "#FF4D6A",
  critical: "#DC2626",
};

const MONTH_NAMES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

export default function WorldMapScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state, unlockCountry, openBranch, closeBranch, expandStores } = useGameplay();
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [activeTab, setActiveTab] = useState<MapTab>("map");
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [expandedBranchId, setExpandedBranchId] = useState<string | null>(null);
  const [expandedCountryId, setExpandedCountryId] = useState<string | null>(null);
  const [branchModalCountry, setBranchModalCountry] = useState<Country | null>(null);
  const [selectedBranchType, setSelectedBranchType] = useState<BranchType | null>(null);

  if (!state) return null;

  const currentYear = state.year;
  const unlockedCountries = state.unlockedCountries ?? [];
  const branches = state.branches ?? [];

  const regions = useMemo(
    () => Array.from(new Set(COUNTRIES.map((c) => c.region))) as Region[],
    []
  );

  // ── Branch aggregate stats ────────────────────────────────────────────────
  const {
    totalBranchRevenue, totalBranchCost, totalBranchProfit,
    totalRobberies, totalVandalism, totalIncidentCost,
    avgEfficiency, avgRisk,
    allIncidents, bestBranch, worstBranch, mostIncidents, globalRevMult,
  } = useMemo(() => {
    const rev  = branches.reduce((s, b) => s + (b.monthlyEstimatedRevenue ?? b.monthlyRevenueBonus), 0);
    const cost = branches.reduce((s, b) => s + b.monthlyCost, 0);
    const robs = branches.reduce((s, b) => s + (b.robberyCount ?? 0), 0);
    const vand = branches.reduce((s, b) => s + (b.vandalismCount ?? 0), 0);
    const iCost= branches.reduce((s, b) => s + (b.totalIncidentCost ?? 0), 0);
    const eff  = branches.length > 0 ? Math.round(branches.reduce((s, b) => s + (b.efficiency ?? 80), 0) / branches.length) : 0;
    const risk = branches.length > 0 ? Math.round(branches.reduce((s, b) => s + (b.riskScore ?? 30), 0) / branches.length) : 0;

    const incidents: Array<BranchIncident & { countryId: string }> = [];
    for (const b of branches) {
      for (const inc of (b.incidentLog ?? [])) incidents.push({ ...inc, countryId: b.countryId });
    }
    incidents.sort((a, b) => b.year * 12 + b.month - (a.year * 12 + a.month));

    const byProfit = [...branches].sort((a, b) =>
      (b.monthlyEstimatedRevenue ?? b.monthlyRevenueBonus) - b.monthlyCost
      - ((a.monthlyEstimatedRevenue ?? a.monthlyRevenueBonus) - a.monthlyCost)
    );
    const byInc = [...branches].sort((a, b) =>
      ((b.robberyCount ?? 0) + (b.vandalismCount ?? 0)) - ((a.robberyCount ?? 0) + (a.vandalismCount ?? 0))
    );

    const revMult = unlockedCountries.reduce((s, id) => {
      const c = COUNTRIES.find((cc) => cc.id === id);
      if (!c || id === "usa") return s;
      const hasBranch = branches.some((bb) => bb.countryId === id);
      return s + getCountryRevenueMult(c, hasBranch) * 0.1;
    }, 1.0);

    return {
      totalBranchRevenue: rev,
      totalBranchCost: cost,
      totalBranchProfit: rev - cost,
      totalRobberies: robs,
      totalVandalism: vand,
      totalIncidentCost: iCost,
      avgEfficiency: eff,
      avgRisk: risk,
      allIncidents: incidents,
      bestBranch: byProfit[0],
      worstBranch: byProfit[byProfit.length - 1],
      mostIncidents: byInc[0],
      globalRevMult: revMult,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branches, unlockedCountries]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleUnlock = (country: Country) => {
    const cost = getUnlockCost(country, currentYear);
    Alert.alert(
      `Entrar em ${country.name} ${country.flag}`,
      `Custo de entrada: ${formatMoney(cost)}\n\nTaxa: ${Math.round(country.taxRate * 100)}% sobre lucros\nTarifa de importação: ${Math.round(country.importDuty * 100)}%\n\nRisco: ${country.riskLevel.toUpperCase()}\n\n${country.notes}`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: () => {
            const err = unlockCountry(country.id);
            if (err) Alert.alert("Erro", err);
            else Alert.alert("Sucesso", `${country.flag} ${country.name} desbloqueado!`);
          },
        },
      ]
    );
  };

  const handleOpenBranch = (country: Country) => {
    setSelectedBranchType(null);
    setBranchModalCountry(country);
  };

  const handleConfirmBranch = useCallback(() => {
    if (!branchModalCountry || !selectedBranchType) return;
    const err = openBranch(branchModalCountry.id, selectedBranchType);
    setBranchModalCountry(null);
    setSelectedBranchType(null);
    if (err) Alert.alert("Erro", err);
    else Alert.alert("Sucesso", `Filial aberta em ${branchModalCountry.flag} ${branchModalCountry.name}!`);
  }, [branchModalCountry, selectedBranchType, openBranch]);

  const handleCloseBranch = (country: Country) => {
    Alert.alert(
      `Fechar Filial em ${country.name}`,
      "Tem certeza? Você vai perder o bônus de receita local.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Fechar", style: "destructive", onPress: () => closeBranch(country.id) },
      ]
    );
  };

  const handleExpandStores = (country: Country) => {
    const tiers: StoreExpansionTier[] = ["stores_30", "stores_60", "auto_expansion"];
    const options = tiers.map((tier) => {
      const { oneTimeCost, monthlyExtra } = getStoreExpansionCost(country, tier);
      const canAfford = (state?.money ?? 0) >= oneTimeCost;
      return {
        text: `${STORE_EXPANSION_NAMES[tier]} — ${formatMoney(oneTimeCost)}${canAfford ? "" : " ⚠️"}`,
        onPress: () => {
          if (!canAfford) {
            Alert.alert("Saldo Insuficiente", `${STORE_EXPANSION_NAMES[tier]} custa ${formatMoney(oneTimeCost)}.`);
            return;
          }
          Alert.alert(
            STORE_EXPANSION_NAMES[tier],
            `${STORE_EXPANSION_DESCRIPTIONS[tier]}\n\nCusto único: ${formatMoney(oneTimeCost)}\nMensalidade extra: +${formatMoney(monthlyExtra)}/mês`,
            [
              { text: "Cancelar", style: "cancel" },
              {
                text: "Confirmar",
                onPress: () => {
                  const err = expandStores(country.id, tier);
                  if (err) Alert.alert("Erro", err);
                  else Alert.alert("Sucesso", `Expansão iniciada em ${country.flag} ${country.name}!`);
                },
              },
            ]
          );
        },
      };
    });
    Alert.alert(
      `Expandir Lojas — ${country.name}`,
      "Escolhe o modelo de expansão:",
      [...options, { text: "Cancelar", style: "cancel" } as any]
    );
  };

  const regionCountries = selectedRegion ? COUNTRIES.filter((c) => c.region === selectedRegion) : [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GridBackground />
      <ScreenHeader title="Mapa Global" />

      {/* Top stats chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsRow} bounces={false}>
        <StatChip icon="globe" value={`${unlockedCountries.length}`} label="Mercados" color="#4DA6FF" colors={colors} />
        <StatChip icon="briefcase" value={`${branches.length}`} label="Filiais" color="#A855F7" colors={colors} />
        <StatChip icon="trending-up" value={`×${globalRevMult.toFixed(2)}`} label="Mult. Receita" color="#10B981" colors={colors} />
        <StatChip icon="dollar-sign" value={formatMoney(totalBranchCost)} label="Custo/Mês" color="#FF4D6A" colors={colors} />
        {branches.length > 0 && (
          <StatChip
            icon="activity"
            value={`${avgEfficiency}%`}
            label="Eficiência"
            color={avgEfficiency >= 80 ? "#10B981" : avgEfficiency >= 60 ? "#F5A623" : "#FF4D6A"}
            colors={colors}
          />
        )}
      </ScrollView>

      {/* Tab bar */}
      <View style={[styles.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {(["map", "operations", "incidents"] as MapTab[]).map((tab) => {
          const labels: Record<MapTab, string> = { map: "Mapa", operations: "Operações", incidents: "Incidentes" };
          const icons: Record<MapTab, keyof typeof Feather.glyphMap> = { map: "map", operations: "bar-chart-2", incidents: "alert-triangle" };
          const isActive = activeTab === tab;
          const badgeCount = tab === "incidents" ? allIncidents.length : undefined;
          return (
            <TouchableOpacity key={tab} style={[styles.tab, isActive && { borderBottomColor: "#4DA6FF", borderBottomWidth: 2, backgroundColor: "#4DA6FF0D" }]} onPress={() => setActiveTab(tab)}>
              <Feather name={icons[tab]} size={14} color={isActive ? "#4DA6FF" : colors.mutedForeground} />
              <Text style={[styles.tabText, { color: isActive ? "#4DA6FF" : colors.mutedForeground }]}>{labels[tab]}</Text>
              {badgeCount != null && badgeCount > 0 && (
                <View style={styles.badge}><Text style={styles.badgeText}>{badgeCount > 99 ? "99+" : badgeCount}</Text></View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── TAB: MAP ─────────────────────────────────────────────────────────────── */}
      {activeTab === "map" && (
        <>
          {/* Region tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.regionTabs} contentContainerStyle={styles.regionTabsContent} bounces={false}>
            <TouchableOpacity
              onPress={() => { setSelectedRegion(null); setSelectedCountry(null); }}
              style={[styles.regionTab, {
                backgroundColor: selectedRegion === null ? "#4DA6FF22" : colors.secondary,
                borderColor: selectedRegion === null ? "#4DA6FF" : colors.border,
              }]}
            >
              <Feather name="globe" size={12} color={selectedRegion === null ? "#4DA6FF" : colors.mutedForeground} />
              <Text style={[styles.regionTabText, { color: selectedRegion === null ? "#4DA6FF" : colors.mutedForeground }]}>Todos</Text>
            </TouchableOpacity>
            {regions.map((region) => {
              const regionCol = REGION_COLORS[region];
              const isSelected = selectedRegion === region;
              const hasUnlocked = COUNTRIES.filter((c) => c.region === region).some((c) => unlockedCountries.includes(c.id));
              return (
                <TouchableOpacity
                  key={region}
                  onPress={() => { setSelectedRegion(region); setSelectedCountry(null); }}
                  style={[styles.regionTab, {
                    backgroundColor: isSelected ? regionCol + "22" : colors.secondary,
                    borderColor: isSelected ? regionCol : colors.border,
                  }]}
                >
                  {hasUnlocked && <View style={[styles.unlockedDot, { backgroundColor: "#10B981" }]} />}
                  <Text style={[styles.regionTabText, { color: isSelected ? regionCol : colors.mutedForeground }]}>
                    {REGION_NAMES[region]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 80 }]} showsVerticalScrollIndicator={false} removeClippedSubviews>
            {selectedRegion === null ? (
              regions.map((region) => {
                const regionCol = REGION_COLORS[region];
                const regionCountriesAll = COUNTRIES.filter((c) => c.region === region);
                const unlockedInRegion = regionCountriesAll.filter((c) => unlockedCountries.includes(c.id)).length;
                const branchesInRegion = regionCountriesAll.filter((c) => branches.some((b) => b.countryId === c.id)).length;
                const regionRevenue = branches
                  .filter((b) => regionCountriesAll.some((c) => c.id === b.countryId))
                  .reduce((s, b) => s + (b.monthlyEstimatedRevenue ?? b.monthlyRevenueBonus), 0);
                return (
                  <TouchableOpacity
                    key={region}
                    onPress={() => setSelectedRegion(region)}
                    style={[styles.regionCard, { backgroundColor: colors.card, borderColor: regionCol + "33" }]}
                    activeOpacity={0.85}
                  >
                    <LinearGradient colors={[regionCol + "10", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                    <View style={[styles.regionCardLeft, { backgroundColor: regionCol + "22" }]}>
                      <Feather name="globe" size={20} color={regionCol} />
                    </View>
                    <View style={styles.regionCardMid}>
                      <Text style={[styles.regionCardName, { color: colors.foreground }]}>{REGION_NAMES[region]}</Text>
                      <Text style={[styles.regionCardSub, { color: colors.mutedForeground }]}>
                        {regionCountriesAll.length} países · {unlockedInRegion} abertos · {branchesInRegion} filiais
                      </Text>
                      {regionRevenue > 0 && (
                        <Text style={[styles.regionCardRev, { color: "#10B981" }]}>
                          +{formatMoney(regionRevenue)}/mês estimado
                        </Text>
                      )}
                    </View>
                    <Feather name="chevron-right" size={16} color={regionCol + "AA"} />
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.countryList}>
                <TouchableOpacity onPress={() => setSelectedRegion(null)} style={styles.backBtn}>
                  <Feather name="arrow-left" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.backBtnText, { color: colors.mutedForeground }]}>Todas as regiões</Text>
                </TouchableOpacity>
                <Text style={[styles.regionHeader, { color: REGION_COLORS[selectedRegion] }]}>
                  {REGION_NAMES[selectedRegion]}
                </Text>
                {regionCountries.map((country) => {
                  const isUnlocked = unlockedCountries.includes(country.id);
                  const branch = branches.find((b) => b.countryId === country.id);
                  const unlockCost = getUnlockCost(country, currentYear);
                  const marketSize = getCountryMarketSize(country, currentYear);
                  const canAffordUnlock = state.money >= unlockCost;
                  const riskColor = RISK_COLORS[country.riskLevel];
                  const isExpanded = expandedBranchId === country.id;

                  const isCountryExpanded = expandedCountryId === country.id;

                  return (
                    <View key={country.id} style={[styles.countryCard, {
                      backgroundColor: colors.card,
                      borderColor: isUnlocked ? "#10B98133" : colors.border,
                      borderLeftWidth: isUnlocked ? 3 : 1,
                      borderLeftColor: isUnlocked ? "#10B981" : branch ? "#A855F7" : colors.border,
                    }]}>
                      <TouchableOpacity
                        onPress={() => {
                          LayoutAnimation.configureNext({
                            duration: 220,
                            create: { type: "easeInEaseOut", property: "opacity" },
                            update: { type: "easeInEaseOut" },
                            delete: { type: "easeInEaseOut", property: "opacity" },
                          });
                          setExpandedCountryId(isCountryExpanded ? null : country.id);
                        }}
                        activeOpacity={0.8}
                        style={styles.countryHeaderTouchable}
                      >
                        <Text style={styles.countryFlag}>{country.flag}</Text>
                        <View style={styles.countryHeaderText}>
                          <Text style={[styles.countryName, { color: colors.foreground }]}>{country.name}</Text>
                          <View style={styles.countryTags}>
                            <View style={[styles.riskTag, { backgroundColor: riskColor + "22" }]}>
                              <Text style={[styles.riskTagText, { color: riskColor }]}>{country.riskLevel}</Text>
                            </View>
                            {isUnlocked && (
                              <View style={[styles.riskTag, { backgroundColor: "#10B98122" }]}>
                                <Feather name="check-circle" size={9} color="#10B981" />
                                <Text style={[styles.riskTagText, { color: "#10B981" }]}>Desbloqueado</Text>
                              </View>
                            )}
                            {branch && (
                              <View style={[styles.riskTag, { backgroundColor: "#A855F722" }]}>
                                <Feather name={BRANCH_TYPE_ICONS[branch.type] as any} size={9} color="#A855F7" />
                                <Text style={[styles.riskTagText, { color: "#A855F7" }]}>{BRANCH_TYPE_NAMES[branch.type]}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <Feather
                          name={isCountryExpanded ? "chevron-up" : "chevron-down"}
                          size={16}
                          color={colors.mutedForeground}
                        />
                      </TouchableOpacity>

                      {!isCountryExpanded && (
                        <Text style={[styles.countryCollapsedHint, { color: colors.mutedForeground }]}>
                          {`${marketSize.toLocaleString()} un/mês · PIB $${(country.gdpPerCapita / 1000).toFixed(0)}k`}
                        </Text>
                      )}

                      {isCountryExpanded && (
                        <>
                      <View style={styles.countryStats}>
                        <CountryStat label="PIB per Capita" value={`$${(country.gdpPerCapita / 1000).toFixed(0)}k`} colors={colors} />
                        <CountryStat label="Gamers" value={`${Math.round(country.population * country.gamingPenetration)}M`} colors={colors} />
                        <CountryStat label="Imposto" value={`${Math.round(country.taxRate * 100)}%`} colors={colors} />
                        <CountryStat label="Tarifa" value={`${Math.round(country.importDuty * 100)}%`} colors={colors} />
                        <CountryStat label="Preço ×" value={`${country.pricingMultiplier.toFixed(2)}`} colors={colors} />
                        <CountryStat label="Mercado/Mês" value={`${marketSize.toLocaleString()} un`} colors={colors} />
                      </View>

                      <Text style={[styles.countryNotes, { color: colors.mutedForeground }]}>{country.notes}</Text>

                      {/* Strategic Profile */}
                      {(() => {
                        const profile = getCountryStrategicProfile(country);
                        const attrs: Array<{ key: keyof typeof profile; label: string; goodHigh: boolean }> = [
                          { key: "marketSize",        label: "Mercado",    goodHigh: true  },
                          { key: "operationalCost",   label: "Custo Op.",  goodHigh: false },
                          { key: "taxBurden",         label: "Impostos",   goodHigh: false },
                          { key: "industrialStrength",label: "Industrial", goodHigh: true  },
                          { key: "talentBase",        label: "Talento",    goodHigh: true  },
                          { key: "regulationRisk",    label: "Risco Reg.", goodHigh: false },
                        ];
                        return (
                          <View>
                            <Text style={[styles.profileSectionLabel, { color: colors.mutedForeground }]}>PERFIL ESTRATÉGICO</Text>
                            <View style={styles.profileGrid}>
                              {attrs.map((a) => (
                                <ProfileTag key={a.key} label={a.label} tier={profile[a.key]} goodHigh={a.goodHigh} />
                              ))}
                            </View>
                          </View>
                        );
                      })()}

                      {/* Branch detail section */}
                      {branch && (
                        <View>
                          <View style={[styles.branchInfo, { backgroundColor: "#A855F711", borderColor: "#A855F733" }]}>
                            <Feather name={BRANCH_TYPE_ICONS[branch.type] as any} size={13} color="#A855F7" />
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.branchName, { color: "#A855F7" }]}>{BRANCH_TYPE_NAMES[branch.type]}</Text>
                              <Text style={[styles.branchCost, { color: colors.mutedForeground }]}>
                                Custo: {formatMoney(branch.monthlyCost)}/mês · {branch.employeeCount} func.
                              </Text>
                              {branch.storeExpansion && (
                                <Text style={[styles.branchCost, { color: "#F5A623" }]}>
                                  🏪 {STORE_EXPANSION_NAMES[branch.storeExpansion]}
                                  {branch.storeExpansion === "auto_expansion" && branch.storeCount != null
                                    ? ` — ${branch.storeCount} lojas`
                                    : branch.storeExpansion === "stores_30" ? " — 30 lojas" : " — 60 lojas"}
                                </Text>
                              )}
                            </View>
                            <View style={styles.branchActions}>
                              <TouchableOpacity onPress={() => setExpandedBranchId(isExpanded ? null : country.id)} style={styles.expandBtn}>
                                <Feather name={isExpanded ? "chevron-up" : "bar-chart-2"} size={14} color="#A855F7" />
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => handleCloseBranch(country)}>
                                <Feather name="x-circle" size={16} color="#FF4D6A" />
                              </TouchableOpacity>
                            </View>
                          </View>

                          {/* Expanded branch stats */}
                          {isExpanded && (
                            <View style={[styles.branchStatsExpanded, { backgroundColor: colors.background, borderColor: colors.border }]}>
                              {/* Efficiency + Risk bars */}
                              <View style={styles.barRow}>
                                <View style={{ flex: 1 }}>
                                  <View style={styles.barLabelRow}>
                                    <Text style={[styles.barLabel, { color: colors.mutedForeground }]}>Eficiência</Text>
                                    <Text style={[styles.barValue, { color: branch.efficiency != null && branch.efficiency >= 80 ? "#10B981" : branch.efficiency != null && branch.efficiency >= 60 ? "#F5A623" : "#FF4D6A" }]}>
                                      {branch.efficiency ?? 80}%
                                    </Text>
                                  </View>
                                  <View style={[styles.barBg, { backgroundColor: colors.card }]}>
                                    <View style={[styles.barFill, { width: `${branch.efficiency ?? 80}%`, backgroundColor: branch.efficiency != null && branch.efficiency >= 80 ? "#10B981" : branch.efficiency != null && branch.efficiency >= 60 ? "#F5A623" : "#FF4D6A" }]} />
                                  </View>
                                </View>
                                <View style={{ width: 16 }} />
                                <View style={{ flex: 1 }}>
                                  <View style={styles.barLabelRow}>
                                    <Text style={[styles.barLabel, { color: colors.mutedForeground }]}>Risco</Text>
                                    <Text style={[styles.barValue, { color: (branch.riskScore ?? 30) >= 60 ? "#FF4D6A" : (branch.riskScore ?? 30) >= 35 ? "#F5A623" : "#10B981" }]}>
                                      {branch.riskScore ?? 30}/100
                                    </Text>
                                  </View>
                                  <View style={[styles.barBg, { backgroundColor: colors.card }]}>
                                    <View style={[styles.barFill, { width: `${branch.riskScore ?? 30}%`, backgroundColor: (branch.riskScore ?? 30) >= 60 ? "#FF4D6A" : (branch.riskScore ?? 30) >= 35 ? "#F5A623" : "#10B981" }]} />
                                  </View>
                                </View>
                              </View>

                              {/* Revenue / Cost / Net */}
                              <View style={styles.finRow}>
                                <FinChip label="Receita Est." value={formatMoney(branch.monthlyEstimatedRevenue ?? branch.monthlyRevenueBonus)} color="#10B981" />
                                <FinChip label="Custo" value={formatMoney(branch.monthlyCost)} color="#FF4D6A" />
                                <FinChip
                                  label="Lucro Líq."
                                  value={formatMoney((branch.monthlyEstimatedRevenue ?? branch.monthlyRevenueBonus) - branch.monthlyCost)}
                                  color={(branch.monthlyEstimatedRevenue ?? branch.monthlyRevenueBonus) >= branch.monthlyCost ? "#10B981" : "#FF4D6A"}
                                />
                              </View>

                              {/* Cumulative */}
                              {branch.cumulativeRevenue != null && (
                                <View style={styles.finRow}>
                                  <FinChip label="Receita Total" value={formatMoney(branch.cumulativeRevenue)} color="#4DA6FF" />
                                  <FinChip label="Custo Total" value={formatMoney(branch.cumulativeCost ?? 0)} color="#FF4D6A" />
                                  <FinChip
                                    label="Retorno"
                                    value={formatMoney((branch.cumulativeRevenue ?? 0) - (branch.cumulativeCost ?? 0))}
                                    color={(branch.cumulativeRevenue ?? 0) >= (branch.cumulativeCost ?? 0) ? "#10B981" : "#FF4D6A"}
                                  />
                                </View>
                              )}

                              {/* Incident summary */}
                              <View style={styles.incidentSummaryRow}>
                                <IncidentBadge icon="🔓" label="Roubos" count={branch.robberyCount ?? 0} />
                                <IncidentBadge icon="🪟" label="Vandalismos" count={branch.vandalismCount ?? 0} />
                                <IncidentBadge icon="💸" label="Custo Inc." count={0} money={branch.totalIncidentCost} />
                              </View>

                              {/* Recent incidents */}
                              {(branch.incidentLog ?? []).length > 0 && (
                                <View style={[styles.incidentLog, { borderColor: colors.border }]}>
                                  <Text style={[styles.logTitle, { color: colors.mutedForeground }]}>ÚLTIMOS INCIDENTES</Text>
                                  {(branch.incidentLog ?? []).slice(0, 4).map((inc, i) => (
                                    <View key={`${inc.year}-${inc.month}-${inc.type}-${i}`} style={[styles.logRow, { borderColor: colors.border }]}>
                                      <Text style={{ fontSize: 14 }}>{INCIDENT_ICONS[inc.type]}</Text>
                                      <View style={{ flex: 1 }}>
                                        <Text style={[styles.logDesc, { color: colors.foreground }]}>{inc.description}</Text>
                                        <Text style={[styles.logDate, { color: colors.mutedForeground }]}>
                                          {MONTH_NAMES[inc.month - 1]} {inc.year}
                                        </Text>
                                      </View>
                                      <View style={[styles.severityBadge, { backgroundColor: SEVERITY_COLORS[inc.severity] + "22" }]}>
                                        <Text style={[styles.severityText, { color: SEVERITY_COLORS[inc.severity] }]}>
                                          -{formatMoney(inc.moneyCost)}
                                        </Text>
                                      </View>
                                    </View>
                                  ))}
                                </View>
                              )}
                            </View>
                          )}
                        </View>
                      )}

                      {/* Action buttons */}
                      <View style={styles.countryActions}>
                        {!isUnlocked ? (
                          <TouchableOpacity
                            onPress={() => handleUnlock(country)}
                            style={[styles.actionBtn, {
                              backgroundColor: canAffordUnlock ? "#4DA6FF" : colors.secondary,
                              opacity: canAffordUnlock ? 1 : 0.6,
                            }]}
                          >
                            <Feather name="unlock" size={13} color={canAffordUnlock ? "#070D1A" : colors.mutedForeground} />
                            <Text style={[styles.actionBtnText, { color: canAffordUnlock ? "#070D1A" : colors.mutedForeground }]}>
                              Entrar — {formatMoney(unlockCost)}
                            </Text>
                          </TouchableOpacity>
                        ) : !branch ? (
                          <TouchableOpacity
                            onPress={() => handleOpenBranch(country)}
                            style={[styles.actionBtn, { backgroundColor: "#A855F7" }]}
                          >
                            <Feather name="plus-circle" size={13} color="#fff" />
                            <Text style={[styles.actionBtnText, { color: "#fff" }]}>Abrir Filial</Text>
                          </TouchableOpacity>
                        ) : branch && !branch.storeExpansion ? (
                          <View style={{ flexDirection: "row", gap: 8, flex: 1 }}>
                            <View style={[styles.actionBtnDisabled, { borderColor: "#10B98133", flex: 1 }]}>
                              <Feather name="check" size={13} color="#10B981" />
                              <Text style={[styles.actionBtnText, { color: "#10B981" }]}>Filial ativa</Text>
                            </View>
                            <TouchableOpacity
                              onPress={() => handleExpandStores(country)}
                              style={[styles.actionBtn, { backgroundColor: "#F5A623", flex: 1 }]}
                            >
                              <Feather name="shopping-bag" size={13} color="#070D1A" />
                              <Text style={[styles.actionBtnText, { color: "#070D1A" }]}>Expandir Lojas</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <View style={[styles.actionBtnDisabled, { borderColor: "#F5A62333", flex: 1 }]}>
                            <Feather name="shopping-bag" size={13} color="#F5A623" />
                            <Text style={[styles.actionBtnText, { color: "#F5A623" }]}>
                              {branch.storeExpansion ? STORE_EXPANSION_NAMES[branch.storeExpansion] : "Presença ativa"}
                            </Text>
                          </View>
                        )}
                      </View>
                        </>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </>
      )}

      {/* ── TAB: OPERATIONS ──────────────────────────────────────────────────────── */}
      {activeTab === "operations" && (
        <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 80 }]} showsVerticalScrollIndicator={false}>
          {branches.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="briefcase" size={36} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Sem filiais ativas</Text>
              <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
                Abre a aba Mapa, desbloqueia países e instala filiais para monitorar operações aqui.
              </Text>
            </View>
          ) : (
            <>
              {/* Financial summary */}
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>RESUMO FINANCEIRO</Text>
              <View style={styles.summaryGrid}>
                <SummaryCard label="Receita/Mês" value={formatMoney(totalBranchRevenue)} color="#10B981" icon="trending-up" colors={colors} />
                <SummaryCard label="Gastos/Mês" value={formatMoney(totalBranchCost)} color="#FF4D6A" icon="trending-down" colors={colors} />
                <SummaryCard
                  label="Lucro Líq."
                  value={formatMoney(totalBranchProfit)}
                  color={totalBranchProfit >= 0 ? "#10B981" : "#FF4D6A"}
                  icon={totalBranchProfit >= 0 ? "dollar-sign" : "alert-circle"}
                  colors={colors}
                />
                <SummaryCard label="Total Incid." value={formatMoney(totalIncidentCost)} color="#F5A623" icon="alert-triangle" colors={colors} />
              </View>

              {/* Operational metrics */}
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>MÉTRICAS OPERACIONAIS</Text>
              <View style={styles.summaryGrid}>
                <SummaryCard label="Efic. Média" value={`${avgEfficiency}%`} color={avgEfficiency >= 80 ? "#10B981" : avgEfficiency >= 60 ? "#F5A623" : "#FF4D6A"} icon="activity" colors={colors} />
                <SummaryCard label="Risco Médio" value={`${avgRisk}/100`} color={avgRisk <= 30 ? "#10B981" : avgRisk <= 60 ? "#F5A623" : "#FF4D6A"} icon="shield" colors={colors} />
                <SummaryCard label="Roubos" value={`${totalRobberies}`} color="#FF4D6A" icon="unlock" colors={colors} />
                <SummaryCard label="Vandalismo" value={`${totalVandalism}`} color="#F5A623" icon="tool" colors={colors} />
              </View>

              {/* Best / worst */}
              {bestBranch && (
                <View>
                  <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>DESTAQUES</Text>
                  <BranchHighlight branch={bestBranch} type="best" colors={colors} />
                  {worstBranch && worstBranch.countryId !== bestBranch.countryId && (
                    <BranchHighlight branch={worstBranch} type="worst" colors={colors} />
                  )}
                  {mostIncidents && (mostIncidents.robberyCount ?? 0) + (mostIncidents.vandalismCount ?? 0) > 0 && (
                    <BranchHighlight branch={mostIncidents} type="risky" colors={colors} />
                  )}
                </View>
              )}

              {/* Per-branch cards */}
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>FILIAIS INDIVIDUAIS</Text>
              {branches.map((branch) => {
                const country = COUNTRIES.find((c) => c.id === branch.countryId);
                if (!country) return null;
                const rev    = branch.monthlyEstimatedRevenue ?? branch.monthlyRevenueBonus;
                const profit = rev - branch.monthlyCost;
                const eff    = branch.efficiency ?? 80;
                const risk   = branch.riskScore ?? 30;
                const effColor = eff >= 80 ? "#10B981" : eff >= 60 ? "#F5A623" : "#FF4D6A";
                const riskColor = risk <= 30 ? "#10B981" : risk <= 60 ? "#F5A623" : "#FF4D6A";

                return (
                  <View key={branch.countryId} style={[styles.branchCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <LinearGradient colors={["#A855F710", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />

                    <View style={styles.branchCardHeader}>
                      <Text style={{ fontSize: 22 }}>{country.flag}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.branchCardName, { color: colors.foreground }]}>{country.name}</Text>
                        <Text style={[styles.branchCardType, { color: "#A855F7" }]}>
                          {BRANCH_TYPE_NAMES[branch.type]}{branch.storeExpansion ? ` · ${STORE_EXPANSION_NAMES[branch.storeExpansion]}` : ""}
                        </Text>
                      </View>
                      <View style={[styles.profitBadge, { backgroundColor: profit >= 0 ? "#10B98122" : "#FF4D6A22" }]}>
                        <Text style={[styles.profitBadgeText, { color: profit >= 0 ? "#10B981" : "#FF4D6A" }]}>
                          {profit >= 0 ? "+" : ""}{formatMoney(profit)}
                        </Text>
                      </View>
                    </View>

                    {/* Efficiency + Risk bars */}
                    <View style={styles.barRow}>
                      <View style={{ flex: 1 }}>
                        <View style={styles.barLabelRow}>
                          <Text style={[styles.barLabel, { color: colors.mutedForeground }]}>Eficiência</Text>
                          <Text style={[styles.barValue, { color: effColor }]}>{eff}%</Text>
                        </View>
                        <View style={[styles.barBg, { backgroundColor: colors.background }]}>
                          <View style={[styles.barFill, { width: `${eff}%`, backgroundColor: effColor }]} />
                        </View>
                      </View>
                      <View style={{ width: 12 }} />
                      <View style={{ flex: 1 }}>
                        <View style={styles.barLabelRow}>
                          <Text style={[styles.barLabel, { color: colors.mutedForeground }]}>Risco</Text>
                          <Text style={[styles.barValue, { color: riskColor }]}>{risk}/100</Text>
                        </View>
                        <View style={[styles.barBg, { backgroundColor: colors.background }]}>
                          <View style={[styles.barFill, { width: `${risk}%`, backgroundColor: riskColor }]} />
                        </View>
                      </View>
                    </View>

                    {/* Financial mini-grid */}
                    <View style={styles.finRow}>
                      <FinChip label="Receita" value={formatMoney(rev)} color="#10B981" />
                      <FinChip label="Custo" value={formatMoney(branch.monthlyCost)} color="#FF4D6A" />
                      <FinChip label="Incidentes" value={`${(branch.robberyCount ?? 0) + (branch.vandalismCount ?? 0)}`} color="#F5A623" />
                    </View>

                    {/* Cumulative return */}
                    {branch.cumulativeRevenue != null && (
                      <View style={[styles.cumulRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                        <Text style={[styles.cumulLabel, { color: colors.mutedForeground }]}>Retorno total acumulado:</Text>
                        <Text style={[styles.cumulValue, { color: (branch.cumulativeRevenue - (branch.cumulativeCost ?? 0)) >= 0 ? "#10B981" : "#FF4D6A" }]}>
                          {formatMoney(branch.cumulativeRevenue - (branch.cumulativeCost ?? 0))}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </>
          )}
        </ScrollView>
      )}

      {/* ── BRANCH SELECTION MODAL ───────────────────────────────────────────────── */}
      {branchModalCountry && (
        <Modal
          visible={!!branchModalCountry}
          transparent
          animationType="fade"
          onRequestClose={() => setBranchModalCountry(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
              {/* Header */}
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={styles.modalFlag}>{branchModalCountry.flag}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalTitle, { color: colors.foreground }]}>Abrir Filial</Text>
                  <Text style={[styles.modalCountryName, { color: colors.mutedForeground }]}>{branchModalCountry.name}</Text>
                </View>
                <TouchableOpacity onPress={() => setBranchModalCountry(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Feather name="x" size={20} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                {/* Country Strategic Profile */}
                {(() => {
                  const profile = getCountryStrategicProfile(branchModalCountry);
                  const attrs: Array<{ key: keyof typeof profile; label: string; goodHigh: boolean }> = [
                    { key: "marketSize",        label: "Mercado",    goodHigh: true  },
                    { key: "operationalCost",   label: "Custo Op.",  goodHigh: false },
                    { key: "taxBurden",         label: "Impostos",   goodHigh: false },
                    { key: "industrialStrength",label: "Industrial", goodHigh: true  },
                    { key: "talentBase",        label: "Talento",    goodHigh: true  },
                    { key: "regulationRisk",    label: "Risco Reg.", goodHigh: false },
                  ];
                  return (
                    <View style={[styles.modalSection, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <Text style={[styles.modalSectionLabel, { color: colors.mutedForeground }]}>PERFIL DO PAÍS</Text>
                      <View style={styles.modalProfileGrid}>
                        {attrs.map((a) => (
                          <ProfileTag key={a.key} label={a.label} tier={profile[a.key]} goodHigh={a.goodHigh} />
                        ))}
                      </View>
                    </View>
                  );
                })()}

                {/* Branch type cards */}
                <Text style={[styles.modalSectionLabel, { color: colors.mutedForeground, marginTop: 14, marginBottom: 8 }]}>TIPO DE FILIAL</Text>
                {(["sales_office", "factory", "dev_studio"] as BranchType[]).map((type) => {
                  const desc = BRANCH_TYPE_DESCRIPTIONS[type];
                  const isSelected = selectedBranchType === type;
                  const setupCost = getBranchCost(branchModalCountry, type);
                  const monthlyMaint = getBranchMonthlyMaintenance(branchModalCountry, type, currentYear);
                  const canAfford = (state?.money ?? 0) >= setupCost;
                  const rec = getBranchRecommendation(branchModalCountry, type);
                  const typeColor = type === "sales_office" ? "#4DA6FF" : type === "factory" ? "#F5A623" : "#A855F7";
                  return (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setSelectedBranchType(isSelected ? null : type)}
                      activeOpacity={0.82}
                      style={[styles.branchTypeCard, {
                        borderColor: isSelected ? typeColor : colors.border,
                        backgroundColor: isSelected ? typeColor + "12" : colors.background,
                        opacity: canAfford ? 1 : 0.65,
                      }]}
                    >
                      <View style={styles.branchTypeCardHeader}>
                        <Text style={styles.branchTypeEmoji}>{desc.emoji}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.branchTypeName, { color: isSelected ? typeColor : colors.foreground }]}>
                            {BRANCH_TYPE_NAMES[type]}
                          </Text>
                          <Text style={[styles.branchTypeCosts, { color: colors.mutedForeground }]}>
                            Setup: {formatMoney(setupCost)} · Manutenção: {formatMoney(monthlyMaint)}/mês
                            {!canAfford ? "  ⚠️" : ""}
                          </Text>
                        </View>
                        {isSelected && <Feather name="check-circle" size={18} color={typeColor} />}
                      </View>
                      <View style={styles.branchTypeBenefits}>
                        <Text style={[styles.branchTypeBenefit, { color: colors.foreground }]}>
                          {"+ "}{desc.mainBenefit}
                        </Text>
                        <Text style={[styles.branchTypeBenefit, { color: colors.mutedForeground }]}>
                          {"+ "}{desc.secondaryBenefit}
                        </Text>
                      </View>
                      {rec && (
                        <View style={[styles.recChip, {
                          backgroundColor: rec.startsWith("Excelente") || rec.startsWith("Ótimo") || rec.startsWith("Recomendado") || rec.startsWith("Boa")
                            ? "#10B98118" : rec.startsWith("Alta") || rec.startsWith("Fraca") || rec.startsWith("Talento limi") || rec.startsWith("Base de talento limi") || rec.startsWith("Não")
                            ? "#FF4D6A18" : "#F5A62318",
                          borderColor: rec.startsWith("Excelente") || rec.startsWith("Ótimo") || rec.startsWith("Recomendado") || rec.startsWith("Boa")
                            ? "#10B98140" : rec.startsWith("Alta") || rec.startsWith("Fraca") || rec.startsWith("Talento limi") || rec.startsWith("Base de talento limi") || rec.startsWith("Não")
                            ? "#FF4D6A40" : "#F5A62340",
                        }]}>
                          <Text style={[styles.recChipText, {
                            color: rec.startsWith("Excelente") || rec.startsWith("Ótimo") || rec.startsWith("Recomendado") || rec.startsWith("Boa")
                              ? "#10B981" : rec.startsWith("Alta") || rec.startsWith("Fraca") || rec.startsWith("Talento limi") || rec.startsWith("Base de talento limi") || rec.startsWith("Não")
                              ? "#FF4D6A" : "#F5A623",
                          }]}>
                            {rec}
                          </Text>
                        </View>
                      )}
                      <Text style={[styles.branchTypeExplain, { color: colors.mutedForeground }]}>{desc.explanation}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Buttons */}
              <View style={[styles.modalButtons, { borderTopColor: colors.border }]}>
                <TouchableOpacity
                  onPress={() => { setBranchModalCountry(null); setSelectedBranchType(null); }}
                  style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                >
                  <Text style={[styles.modalCancelText, { color: colors.mutedForeground }]}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleConfirmBranch}
                  disabled={!selectedBranchType}
                  style={[styles.modalConfirmBtn, {
                    backgroundColor: selectedBranchType === "sales_office" ? "#4DA6FF" : selectedBranchType === "factory" ? "#F5A623" : selectedBranchType === "dev_studio" ? "#A855F7" : "#4DA6FF55",
                    opacity: selectedBranchType ? 1 : 0.45,
                  }]}
                >
                  <Feather name="check" size={14} color="#fff" />
                  <Text style={styles.modalConfirmText}>Confirmar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ── TAB: INCIDENTS ───────────────────────────────────────────────────────── */}
      {activeTab === "incidents" && (
        <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 80 }]} showsVerticalScrollIndicator={false}>
          {allIncidents.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="shield" size={36} color="#10B981" />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Sem incidentes registados</Text>
              <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
                As tuas filiais estão a operar sem perturbações de momento. Mantém o risco baixo expandindo em regiões seguras.
              </Text>
            </View>
          ) : (
            <>
              {/* Summary pills */}
              <View style={styles.incidentPills}>
                {(["robbery", "vandalism", "strike", "regulatory", "fire", "power_outage"] as BranchIncident["type"][]).map((t) => {
                  const count = allIncidents.filter((i) => i.type === t).length;
                  if (count === 0) return null;
                  return (
                    <View key={t} style={[styles.incidentPill, { backgroundColor: "#4DA6FF18", borderColor: "#4DA6FF33" }]}>
                      <Text style={styles.incidentPillEmoji}>{INCIDENT_ICONS[t]}</Text>
                      <Text style={[styles.incidentPillLabel, { color: colors.mutedForeground }]}>{INCIDENT_LABELS[t]}</Text>
                      <Text style={[styles.incidentPillCount, { color: "#4DA6FF" }]}>{count}</Text>
                    </View>
                  );
                })}
              </View>

              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>HISTÓRICO COMPLETO</Text>

              {allIncidents.map((inc, i) => {
                const country = COUNTRIES.find((c) => c.id === inc.countryId);
                const sevColor = SEVERITY_COLORS[inc.severity];
                return (
                  <View key={`${inc.year}-${inc.month}-${inc.type}-${i}`} style={[styles.fullIncidentRow, { backgroundColor: colors.card, borderColor: sevColor + "33" }]}>
                    <LinearGradient colors={[sevColor + "08", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                    <Text style={{ fontSize: 22, marginTop: 1 }}>{INCIDENT_ICONS[inc.type]}</Text>
                    <View style={{ flex: 1 }}>
                      <View style={styles.incidentRowHeader}>
                        <Text style={[styles.incidentCountry, { color: colors.foreground }]}>
                          {country?.flag} {country?.name ?? inc.countryId}
                        </Text>
                        <View style={[styles.severityBadge, { backgroundColor: sevColor + "22" }]}>
                          <Text style={[styles.severityText, { color: sevColor }]}>{inc.severity}</Text>
                        </View>
                      </View>
                      <Text style={[styles.incidentDesc, { color: colors.mutedForeground }]} numberOfLines={3}>{inc.description}</Text>
                      <View style={styles.incidentMeta}>
                        <Text style={[styles.incidentDate, { color: colors.mutedForeground }]}>
                          {MONTH_NAMES[inc.month - 1]} {inc.year}
                        </Text>
                        <Text style={[styles.incidentCost, { color: "#FF4D6A" }]}>
                          -{formatMoney(inc.moneyCost)}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatChip({ icon, value, label, color, colors }: { icon: any; value: string; label: string; color: string; colors: any }) {
  return (
    <View style={[styles.statChip, { backgroundColor: color + "15", borderColor: color + "33" }]}>
      <Feather name={icon} size={11} color={color} />
      <Text style={[styles.statChipValue, { color }]}>{value}</Text>
      <Text style={[styles.statChipLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function CountryStat({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={styles.cStat}>
      <Text style={[styles.cStatLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.cStatValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

function ProfileTag({ label, tier, goodHigh }: { label: string; tier: StrategicTier; goodHigh: boolean }) {
  const tierLabel: Record<StrategicTier, string> = { low: "Baixo", medium: "Médio", high: "Alto" };
  const color =
    tier === "medium" ? "#F5A623" :
    (tier === "high" && goodHigh) || (tier === "low" && !goodHigh) ? "#10B981" : "#FF4D6A";
  return (
    <View style={[styles.profileTag, { backgroundColor: color + "15", borderColor: color + "33" }]}>
      <Text style={[styles.profileTagLabel, { color: "#9CA3AF" }]}>{label}</Text>
      <Text style={[styles.profileTagTier, { color }]}>{tierLabel[tier]}</Text>
    </View>
  );
}

function FinChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.finChip, { backgroundColor: color + "12", borderColor: color + "33" }]}>
      <Text style={[styles.finChipValue, { color }]}>{value}</Text>
      <Text style={[styles.finChipLabel, { color: color + "99" }]}>{label}</Text>
    </View>
  );
}

function IncidentBadge({ icon, label, count, money }: { icon: string; label: string; count: number; money?: number }) {
  return (
    <View style={styles.incidentBadgeContainer}>
      <Text style={{ fontSize: 14 }}>{icon}</Text>
      <Text style={styles.incidentBadgeLabel}>{label}</Text>
      <Text style={styles.incidentBadgeCount}>
        {money != null ? `-$${money.toLocaleString()}` : `${count}`}
      </Text>
    </View>
  );
}

function SummaryCard({ label, value, color, icon, colors }: { label: string; value: string; color: string; icon: keyof typeof Feather.glyphMap; colors: any }) {
  return (
    <View style={[styles.summaryCard, { backgroundColor: color + "10", borderColor: color + "33" }]}>
      <Feather name={icon} size={16} color={color} />
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

function BranchHighlight({ branch, type, colors }: { branch: CountryBranch; type: "best" | "worst" | "risky"; colors: any }) {
  const country = COUNTRIES.find((c) => c.id === branch.countryId);
  const rev = branch.monthlyEstimatedRevenue ?? branch.monthlyRevenueBonus;
  const profit = rev - branch.monthlyCost;

  const configs = {
    best: { color: "#10B981", icon: "trending-up" as const, label: "Filial Mais Lucrativa" },
    worst: { color: "#FF4D6A", icon: "trending-down" as const, label: "Filial Menos Lucrativa" },
    risky: { color: "#F5A623", icon: "alert-triangle" as const, label: "Filial com Mais Incidentes" },
  };
  const cfg = configs[type];

  return (
    <View style={[styles.highlightCard, { backgroundColor: cfg.color + "10", borderColor: cfg.color + "33" }]}>
      <Feather name={cfg.icon} size={16} color={cfg.color} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.highlightLabel, { color: cfg.color }]}>{cfg.label}</Text>
        <Text style={[styles.highlightCountry, { color: colors.foreground }]}>
          {country?.flag} {country?.name ?? branch.countryId} · {BRANCH_TYPE_NAMES[branch.type]}
        </Text>
        {type === "risky" ? (
          <Text style={[styles.highlightSub, { color: colors.mutedForeground }]}>
            {(branch.robberyCount ?? 0) + (branch.vandalismCount ?? 0)} incidentes · -{formatMoney(branch.totalIncidentCost ?? 0)} em custos
          </Text>
        ) : (
          <Text style={[styles.highlightSub, { color: colors.mutedForeground }]}>
            {profit >= 0 ? "+" : ""}{formatMoney(profit)}/mês · Eficiência {branch.efficiency ?? 80}%
          </Text>
        )}
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Stats row
  statsRow: { flexDirection: "row", gap: 8, paddingHorizontal: 14, paddingVertical: 10, minWidth: "100%" },
  statChip: { minWidth: 76, flex: 1, alignItems: "center", gap: 4, paddingVertical: 7, paddingHorizontal: 8, borderRadius: 11, borderWidth: 1 },
  statChipValue: { fontSize: 14, fontFamily: "Inter_700Bold" },
  statChipLabel: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center" },

  // Tab bar
  tabBar: { flexDirection: "row", borderBottomWidth: 1 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12 },
  tabText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  badge: { backgroundColor: "#FF4D6A", borderRadius: 9, minWidth: 18, height: 18, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  badgeText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#fff" },

  // Region tabs
  regionTabs: { flexGrow: 0, flexShrink: 0 },
  regionTabsContent: { paddingHorizontal: 14, gap: 7, flexDirection: "row", paddingBottom: 6, paddingTop: 6, alignItems: "center" },
  regionTab: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 18, borderWidth: 1, height: 32 },
  regionTabText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  unlockedDot: { width: 6, height: 6, borderRadius: 3 },

  // Scroll / sections
  scroll: { padding: 16, gap: 14 },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: -4 },

  // Region cards
  regionCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1, padding: 14, overflow: "hidden" },
  regionCardLeft: { width: 44, height: 44, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  regionCardMid: { flex: 1, gap: 3 },
  regionCardName: { fontSize: 15, fontFamily: "Inter_700Bold" },
  regionCardSub: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16 },
  regionCardRev: { fontSize: 11, fontFamily: "Inter_600SemiBold" },

  // Country list / cards
  countryList: { gap: 12 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  backBtnText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  regionHeader: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 8 },
  countryCard: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 8, overflow: "hidden" },
  countryHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  countryHeaderTouchable: { flexDirection: "row", alignItems: "center", gap: 10 },
  countryCollapsedHint: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: -2, paddingLeft: 42 },
  countryFlag: { fontSize: 26 },
  countryHeaderText: { flex: 1 },
  countryName: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 4 },
  countryTags: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  riskTag: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  riskTagText: { fontSize: 10, fontFamily: "Inter_700Bold", textTransform: "uppercase" },
  countryStats: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cStat: { minWidth: "30%", gap: 2 },
  cStatLabel: { fontSize: 10, fontFamily: "Inter_400Regular", textTransform: "uppercase", letterSpacing: 0.5 },
  cStatValue: { fontSize: 12, fontFamily: "Inter_700Bold" },
  countryNotes: { fontSize: 11, fontFamily: "Inter_400Regular", fontStyle: "italic" },

  // Branch info (in map tab)
  branchInfo: { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: 10, borderWidth: 1 },
  branchName: { fontSize: 12, fontFamily: "Inter_700Bold" },
  branchCost: { fontSize: 11, fontFamily: "Inter_400Regular" },
  branchActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  expandBtn: { padding: 4 },

  // Branch expanded stats
  branchStatsExpanded: { borderRadius: 10, borderWidth: 1, padding: 12, gap: 10, marginTop: 4 },

  // Bars
  barRow: { flexDirection: "row", alignItems: "flex-end", gap: 4 },
  barLabelRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  barLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  barValue: { fontSize: 12, fontFamily: "Inter_700Bold" },
  barBg: { height: 5, borderRadius: 3, overflow: "hidden" },
  barFill: { height: 5, borderRadius: 3 },

  // FinChips
  finRow: { flexDirection: "row", gap: 6 },
  finChip: { flex: 1, alignItems: "center", paddingVertical: 7, paddingHorizontal: 5, borderRadius: 9, borderWidth: 1, gap: 2 },
  finChipValue: { fontSize: 11, fontFamily: "Inter_700Bold", textAlign: "center" },
  finChipLabel: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center" },

  // Incident badge (expanded)
  incidentSummaryRow: { flexDirection: "row", gap: 8 },
  incidentBadgeContainer: { flex: 1, alignItems: "center", gap: 3 },
  incidentBadgeLabel: { fontSize: 10, fontFamily: "Inter_400Regular", color: "#9CA3AF", textAlign: "center" },
  incidentBadgeCount: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#F5A623" },

  // Incident log (expanded)
  incidentLog: { borderRadius: 10, borderWidth: 1, overflow: "hidden" },
  logTitle: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.8, textTransform: "uppercase", padding: 9 },
  logRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 9, borderTopWidth: 1 },
  logDesc: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
  logDate: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },

  // Severity
  severityBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, alignSelf: "flex-start" },
  severityText: { fontSize: 10, fontFamily: "Inter_700Bold", textTransform: "uppercase" },

  // Actions
  countryActions: { flexDirection: "row" },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 10, borderRadius: 12 },
  actionBtnDisabled: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  actionBtnText: { fontSize: 13, fontFamily: "Inter_700Bold" },

  // Empty state
  emptyState: { borderRadius: 16, borderWidth: 1, padding: 32, alignItems: "center", gap: 12 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  emptyDesc: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },

  // Summary grid (operations tab)
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  summaryCard: { width: "47%", borderRadius: 12, borderWidth: 1, padding: 12, gap: 6, alignItems: "center" },
  summaryValue: { fontSize: 15, fontFamily: "Inter_700Bold", textAlign: "center" },
  summaryLabel: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center" },

  // Highlight cards
  highlightCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 12, borderWidth: 1, padding: 12 },
  highlightLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5, textTransform: "uppercase" },
  highlightCountry: { fontSize: 13, fontFamily: "Inter_700Bold", marginTop: 2 },
  highlightSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },

  // Branch cards (operations tab)
  branchCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10, overflow: "hidden" },
  branchCardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  branchCardName: { fontSize: 14, fontFamily: "Inter_700Bold" },
  branchCardType: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  profitBadge: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
  profitBadgeText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  cumulRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 8, borderRadius: 8, borderWidth: 1 },
  cumulLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  cumulValue: { fontSize: 13, fontFamily: "Inter_700Bold" },

  // Incidents tab
  incidentPills: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  incidentPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  incidentPillEmoji: { fontSize: 14 },
  incidentPillLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  incidentPillCount: { fontSize: 12, fontFamily: "Inter_700Bold" },

  fullIncidentRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 12, borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  incidentRowHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 3 },
  incidentCountry: { fontSize: 13, fontFamily: "Inter_700Bold", flex: 1 },
  incidentDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  incidentMeta: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  incidentDate: { fontSize: 10, fontFamily: "Inter_400Regular" },
  incidentCost: { fontSize: 11, fontFamily: "Inter_700Bold" },

  // Strategic profile (in country card)
  profileSectionLabel: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 6, marginTop: 4 },
  profileGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  profileTag: { flexDirection: "column", alignItems: "center", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, minWidth: 70 },
  profileTagLabel: { fontSize: 9, fontFamily: "Inter_400Regular", textTransform: "uppercase", letterSpacing: 0.4 },
  profileTagTier: { fontSize: 11, fontFamily: "Inter_700Bold", marginTop: 1 },

  // Branch selection modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "90%", overflow: "hidden" },
  modalHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 18, borderBottomWidth: 1 },
  modalFlag: { fontSize: 30 },
  modalTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  modalCountryName: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  modalScroll: { padding: 16, gap: 0 },
  modalSection: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 4 },
  modalSectionLabel: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 },
  modalProfileGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  branchTypeCard: { borderRadius: 14, borderWidth: 1.5, padding: 14, marginBottom: 10, gap: 8 },
  branchTypeCardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  branchTypeEmoji: { fontSize: 24 },
  branchTypeName: { fontSize: 14, fontFamily: "Inter_700Bold" },
  branchTypeCosts: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  branchTypeBenefits: { gap: 3 },
  branchTypeBenefit: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  branchTypeExplain: { fontSize: 11, fontFamily: "Inter_400Regular", fontStyle: "italic", lineHeight: 16 },
  recChip: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  recChipText: { fontSize: 11, fontFamily: "Inter_600SemiBold", lineHeight: 16 },
  modalButtons: { flexDirection: "row", gap: 10, padding: 16, borderTopWidth: 1 },
  modalCancelBtn: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 13, borderRadius: 12, borderWidth: 1 },
  modalCancelText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  modalConfirmBtn: { flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 13, borderRadius: 12 },
  modalConfirmText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff" },
});
