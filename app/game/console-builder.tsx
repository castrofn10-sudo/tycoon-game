import React, { useState, useMemo } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Platform, Alert, Modal, Pressable,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useGameplay } from "@/context/GameplayContext";
import { GridBackground } from "@/components/GridBackground";
import { ScreenHeader } from "@/components/ScreenHeader";
import { formatMoney, getEraDevCostMultiplier } from "@/constants/gameEconomics";
import {
  EXPORTABLE_REGIONS, REGION_NAMES, REGION_COLORS, REGION_INVESTMENT_TIERS,
  REGION_INVESTMENT_LABELS, checkRegionRestriction, getRegionHasBranch,
  estimateExportMonthlyRevenue, ExportRegionData,
} from "@/constants/globalMarket";
import type { Region } from "@/constants/globalMarket";
import { getGamingEra } from "@/constants/historicalProgression";
import {
  ConsoleReceptionResult, SENTIMENT_LABELS, SENTIMENT_COLORS,
} from "@/constants/gameReception";
import type { GameConsole } from "@/constants/gameEngine";
import {
  CPU_OPTIONS, GPU_OPTIONS, MEMORY_COMPONENTS, STORAGE_OPTIONS,
  COOLING_OPTIONS, CONTROLLER_OPTIONS, DESIGN_OPTIONS, CONNECTIVITY_OPTIONS, POWER_UNITS,
  AUDIO_CHIP_OPTIONS,
  ConsoleComponentSpec, getDefaultComponents, validateConsoleComponents,
  ControllerConfig, DEFAULT_CONTROLLER_CONFIG,
  CTRL_MATERIAL_OPTIONS, CTRL_BUTTON_OPTIONS, CTRL_ANALOG_OPTIONS,
  CTRL_HAPTICS_OPTIONS, CTRL_WIRELESS_OPTIONS, computeControllerConfigStats,
  ControllerMaterial, ControllerButtons, ControllerAnalog, ControllerHaptics, ControllerWireless,
  ConsoleCategory, CONSOLE_CATEGORY_PRICING, getConsolePriceEra, getConsolePriceFeedback,
  ConsoleDesignConfig, DEFAULT_CONSOLE_DESIGN_CONFIG, computeDesignConfigStats,
  CASE_MODEL_OPTIONS, CASE_MATERIAL_OPTIONS, CONSOLE_COLOR_OPTIONS,
  CONTROLLER_COUNT_OPTIONS, BUNDLE_GAMES_OPTIONS, LICENSE_BUNDLE_OPTIONS, DESIGN_STYLE_OPTIONS,
  CaseModel, CaseMaterial, ConsoleColorStyle, ConsoleControllerBundle,
  BundleGames, LicensedBundle, ConsoleDesignStyle,
  getResearchUnlockedIds, isComponentAvailable, getComponentResearchRequirement,
} from "@/constants/consoleComponents";

type WizardStep = "name" | "category" | "cpu" | "gpu" | "memory" | "storage" | "audio" | "cooling" | "controller" | "design" | "connectivity" | "power" | "export" | "review";

const STEPS: WizardStep[] = ["name", "category", "cpu", "gpu", "memory", "storage", "audio", "cooling", "controller", "design", "connectivity", "power", "export", "review"];
const STEP_LABELS: Record<WizardStep, string> = {
  name: "Nome",
  category: "Categoria",
  cpu: "CPU",
  gpu: "GPU",
  memory: "Memória",
  storage: "Storage",
  audio: "Áudio",
  cooling: "Refrigeração",
  controller: "Controle",
  design: "Design",
  connectivity: "Conectividade",
  power: "Fonte",
  export: "Exportação",
  review: "Revisão",
};
const STEP_ICONS: Record<WizardStep, string> = {
  name: "edit-3",
  category: "layers",
  cpu: "cpu",
  gpu: "monitor",
  memory: "database",
  storage: "hard-drive",
  audio: "volume-2",
  cooling: "wind",
  controller: "play-circle",
  design: "feather",
  connectivity: "wifi",
  power: "zap",
  export: "globe",
  review: "check-circle",
};
const STEP_COLORS: Record<WizardStep, string> = {
  name: "#4DA6FF",
  category: "#F5A623",
  cpu: "#FF4D6A",
  gpu: "#A855F7",
  memory: "#10B981",
  storage: "#F5A623",
  audio: "#0EA5E9",
  cooling: "#06B6D4",
  controller: "#EF4444",
  design: "#EC4899",
  connectivity: "#8B5CF6",
  power: "#F59E0B",
  export: "#4DA6FF",
  review: "#10B981",
};

export default function ConsoleBuilderScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state, buildConsole } = useGameplay();
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const currentYear = state?.year ?? 1972;
  const era = getGamingEra(currentYear);
  const defaults = getDefaultComponents(currentYear);
  const researchedNodes = state?.researchedNodes ?? [];
  const unlockedIds = useMemo(() => getResearchUnlockedIds(researchedNodes), [researchedNodes]);

  function splitByResearch<T extends { id: string; minYear: number }>(all: T[]): { available: T[]; yearLocked: T[]; researchLocked: T[] } {
    const available: T[] = [], yearLocked: T[] = [], researchLocked: T[] = [];
    for (const o of all) {
      if (o.minYear > currentYear) yearLocked.push(o);
      else if (!isComponentAvailable(o.id, unlockedIds)) researchLocked.push(o);
      else available.push(o);
    }
    return { available, yearLocked, researchLocked };
  }

  const [showWizard, setShowWizard] = useState(false);
  const [consoleReception, setConsoleReception] = useState<ConsoleReceptionResult | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ConsoleCategory>("standard");
  const [spec, setSpec] = useState<ConsoleComponentSpec>({ ...defaults, controllerConfig: DEFAULT_CONTROLLER_CONFIG, designConfig: { ...DEFAULT_CONSOLE_DESIGN_CONFIG } });
  const [price, setPrice] = useState("");
  const [exportSelections, setExportSelections] = useState<Record<string, number>>({});

  const step = STEPS[stepIndex];
  const stepColor = STEP_COLORS[step];

  const validation = useMemo(() => validateConsoleComponents(spec, currentYear, researchedNodes), [spec, currentYear, researchedNodes]);

  // Era + research cost multiplier for manufacturing
  const eraCostMult = getEraDevCostMultiplier(currentYear, state?.researchedNodes ?? []);

  // Suggested price based on component cost + margin
  const suggestedPrice = Math.round(validation.totalCostUSD * 3.5 / 5) * 5 || 199;
  const finalPrice = parseInt(price) || suggestedPrice;
  const buildCost = Math.round(validation.totalCostUSD * 50 * eraCostMult);
  const canAfford = (state?.money ?? 0) >= buildCost;

  // Estimated console rating (out of 10)
  const estimatedRating = Math.max(1, Math.min(10,
    (validation.performanceScore / 100 * 6) +
    (validation.appealScore * 0.4) +
    (validation.onlineBonusMult * 0.5) +
    (validation.thermalOK ? 0.5 : -1) +
    (validation.powerOK ? 0.5 : -0.5)
  ));

  const handleBuild = () => {
    if (!name.trim()) { Alert.alert("Erro", "Dá um nome ao teu console!"); return; }
    if (!validation.isValid) {
      Alert.alert("Hardware inválido", validation.errors.join("\n"));
      return;
    }
    if (!canAfford) {
      Alert.alert("Capital insuficiente", `Precisas de ${formatMoney(buildCost)} para a produção inicial.`);
      return;
    }
    // Validate price against era + category
    const priceFeedback = getConsolePriceFeedback(finalPrice, category, currentYear);
    if (priceFeedback.status === "invalid") {
      const era = getConsolePriceEra(category, currentYear);
      Alert.alert(
        "Preço inviável",
        `O preço $${finalPrice} ultrapassa o máximo permitido ($${era.maxAllowed}) para um console ${
          category === "standard" ? "Padrão" : category === "premium" ? "Premium" : "Colecionador"
        } nesta era. Reduz o preço para lançar.`
      );
      return;
    }
    const memComp = MEMORY_COMPONENTS.find((m) => m.id === spec.memoryId)!;

    const exportRegionsData: ExportRegionData[] = [];
    EXPORTABLE_REGIONS.forEach((rid) => {
      const tierIdx = exportSelections[rid] ?? -1;
      if (tierIdx < 0) return;
      const restriction = checkRegionRestriction("action", "T", currentYear, state?.reputation ?? 0, rid);
      if (restriction) return;
      exportRegionsData.push({
        regionId: rid as Region,
        investment: REGION_INVESTMENT_TIERS[rid][tierIdx],
        blocked: false,
      });
    });

    const result = buildConsole({
      name: name.trim(),
      power: "high",
      memoryGB: memComp.capacityMB / 1024,
      quality: Math.round(validation.performanceScore / 10),
      price: finalPrice,
      productionCost: Math.round(validation.totalCostUSD),
      components: spec,
      performanceScore: validation.performanceScore,
      failureRiskPerYear: validation.failureRiskPerYear,
      appealScore: validation.appealScore,
      onlineBonusMult: validation.onlineBonusMult,
      exportRegions: exportRegionsData.length > 0 ? exportRegionsData : undefined,
      category,
      designSalesMult: validation.designSalesMult,
      designRepBonus: validation.designRepBonus,
      designFanBoost: validation.designFanBoost,
    });
    if (result.error) { Alert.alert("Erro", result.error); return; }
    if (result.reception) {
      setConsoleReception(result.reception);
    }
    setShowWizard(false);
    setStepIndex(0);
    setName("");
    setCategory("standard");
    setSpec({ ...defaults, controllerConfig: DEFAULT_CONTROLLER_CONFIG, designConfig: { ...DEFAULT_CONSOLE_DESIGN_CONFIG } });
    setPrice("");
    setExportSelections({});
  };

  const goNext = () => {
    if (step === "name" && !name.trim()) {
      Alert.alert("Atenção", "Insere o nome do console antes de continuar");
      return;
    }
    if (stepIndex < STEPS.length - 1) setStepIndex(stepIndex + 1);
  };
  const goBack = () => {
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
    else setShowWizard(false);
  };

  const renderStepContent = () => {
    if (step === "name") return <NameStep name={name} setName={setName} era={era} year={currentYear} colors={colors} />;
    if (step === "category") return (
      <CategoryStep
        category={category}
        setCategory={setCategory}
        currentYear={currentYear}
        colors={colors}
      />
    );
    if (step === "cpu") {
      const s = splitByResearch(CPU_OPTIONS);
      return (
        <ComponentPicker
          label="Processador (CPU)"
          options={s.available}
          lockedOptions={s.yearLocked}
          researchLockedOptions={s.researchLocked}
          selectedId={spec.cpuId}
          onSelect={(id) => setSpec({ ...spec, cpuId: id })}
          renderStats={(o) => [
            { label: "Cores", value: `${o.cores}` },
            { label: "Clock", value: `${o.ghzBase >= 1 ? o.ghzBase.toFixed(1) + " GHz" : Math.round(o.ghzBase * 1000) + " MHz"}` },
            { label: "Performance", value: `${o.performanceScore}/100` },
            { label: "TDP", value: `${o.tdpWatts}W` },
            { label: "Arquitetura", value: o.architecture },
            { label: "Custo", value: `$${o.costUSD}` },
          ]}
          ref_key="historicalRef"
          currentYear={currentYear}
          color={stepColor}
          colors={colors}
        />
      );
    }
    if (step === "gpu") {
      const s = splitByResearch(GPU_OPTIONS);
      return (
        <ComponentPicker
          label="Processador Gráfico (GPU)"
          options={s.available}
          lockedOptions={s.yearLocked}
          researchLockedOptions={s.researchLocked}
          selectedId={spec.gpuId}
          onSelect={(id) => setSpec({ ...spec, gpuId: id })}
          renderStats={(o) => [
            { label: "TFLOPS", value: o.tflops >= 1 ? o.tflops.toFixed(1) : o.tflops.toFixed(4) },
            { label: "VRAM", value: o.vramGB >= 1 ? `${o.vramGB} GB` : `${Math.round(o.vramGB * 1024)} MB` },
            { label: "Performance", value: `${o.performanceScore}/100` },
            { label: "TDP", value: `${o.tdpWatts}W` },
            { label: "API", value: o.api },
            { label: "Custo", value: `$${o.costUSD}` },
          ]}
          ref_key="historicalRef"
          currentYear={currentYear}
          color={stepColor}
          colors={colors}
        />
      );
    }
    if (step === "memory") {
      const s = splitByResearch(MEMORY_COMPONENTS);
      return (
        <ComponentPicker
          label="Memória RAM"
          options={s.available}
          lockedOptions={s.yearLocked}
          researchLockedOptions={s.researchLocked}
          selectedId={spec.memoryId}
          onSelect={(id) => setSpec({ ...spec, memoryId: id })}
          renderStats={(o) => [
            { label: "Capacidade", value: o.capacityMB >= 1024 ? `${(o.capacityMB / 1024).toFixed(0)} GB` : o.capacityMB >= 1 ? `${o.capacityMB} MB` : `${Math.round(o.capacityMB * 1024)} KB` },
            { label: "Bandwidth", value: o.bandwidthGBs >= 1 ? `${o.bandwidthGBs} GB/s` : `${Math.round(o.bandwidthGBs * 1000)} MB/s` },
            { label: "Tipo", value: o.type },
            { label: "Custo", value: `$${o.costUSD}` },
          ]}
          ref_key="historicalRef"
          currentYear={currentYear}
          color={stepColor}
          colors={colors}
        />
      );
    }
    if (step === "storage") {
      const s = splitByResearch(STORAGE_OPTIONS);
      return (
        <ComponentPicker
          label="Armazenamento"
          options={s.available}
          lockedOptions={s.yearLocked}
          researchLockedOptions={s.researchLocked}
          selectedId={spec.storageId}
          onSelect={(id) => setSpec({ ...spec, storageId: id })}
          renderStats={(o) => [
            { label: "Capacidade", value: o.capacityGB >= 1 ? `${o.capacityGB} GB` : `${Math.round(o.capacityGB * 1024)} MB` },
            { label: "Velocidade", value: o.speedMBs >= 1000 ? `${(o.speedMBs / 1000).toFixed(1)} GB/s` : `${o.speedMBs} MB/s` },
            { label: "Tipo", value: o.type },
            { label: "Custo", value: `$${o.costUSD}` },
          ]}
          ref_key="historicalRef"
          currentYear={currentYear}
          color={stepColor}
          colors={colors}
        />
      );
    }
    if (step === "audio") {
      const s = splitByResearch(AUDIO_CHIP_OPTIONS);
      return (
        <ComponentPicker
          label="Chip de Áudio"
          options={s.available}
          lockedOptions={s.yearLocked}
          researchLockedOptions={s.researchLocked}
          selectedId={spec.audioChipId ?? "audio_beeper"}
          onSelect={(id) => setSpec({ ...spec, audioChipId: id })}
          renderStats={(o) => [
            { label: "Canais", value: `${o.channels}` },
            { label: "Bit Depth", value: `${o.bitDepth}-bit` },
            { label: "Qualidade", value: `${o.performanceScore}/100` },
            { label: "Custo", value: `$${o.costUSD}` },
          ]}
          ref_key="historicalRef"
          currentYear={currentYear}
          color={stepColor}
          colors={colors}
        />
      );
    }
    if (step === "cooling") {
      const s = splitByResearch(COOLING_OPTIONS);
      return (
        <ComponentPicker
          label="Sistema de Refrigeração"
          options={s.available}
          lockedOptions={s.yearLocked}
          researchLockedOptions={s.researchLocked}
          selectedId={spec.coolingId}
          onSelect={(id) => setSpec({ ...spec, coolingId: id })}
          renderStats={(o) => [
            { label: "Max TDP", value: `${o.maxTDP}W` },
            { label: "Ruído", value: `${o.noiseLevel}/10` },
            { label: "Risco Falha/Ano", value: `${Math.round(o.failureRisk * 100)}%` },
            { label: "Custo", value: `$${o.costUSD}` },
          ]}
          ref_key="historicalRef"
          currentYear={currentYear}
          color={stepColor}
          colors={colors}
          badge={(() => {
            const cpu = CPU_OPTIONS.find((c) => c.id === spec.cpuId);
            const gpu = GPU_OPTIONS.find((g) => g.id === spec.gpuId);
            const tdp = (cpu?.tdpWatts ?? 0) + (gpu?.tdpWatts ?? 0);
            return `TDP atual CPU+GPU: ${tdp}W`;
          })()}
        />
      );
    }
    if (step === "controller") return (
      <View style={{ gap: 12 }}>
        {/* Base controller type */}
        <ComponentPicker
          label="Tipo de Controle (Forma)"
          options={CONTROLLER_OPTIONS.filter((o) => o.minYear <= currentYear)}
          lockedOptions={CONTROLLER_OPTIONS.filter((o) => o.minYear > currentYear)}
          selectedId={spec.controllerId}
          onSelect={(id) => setSpec({ ...spec, controllerId: id })}
          renderStats={(o) => [
            { label: "Botões", value: `${o.buttons}` },
            { label: "Analógico", value: o.hasAnalog ? "Sim" : "Não" },
            { label: "Vibração", value: o.hasRumble ? "Sim" : "Não" },
            { label: "Conforto Base", value: `${o.comfortScore}/10` },
            { label: "Custo", value: `$${o.costUSD}` },
          ]}
          ref_key="historicalRef"
          currentYear={currentYear}
          color={stepColor}
          colors={colors}
        />
        {/* Configurable attributes */}
        <ControllerAttributePicker
          cfg={spec.controllerConfig ?? DEFAULT_CONTROLLER_CONFIG}
          onChange={(cfg) => setSpec({ ...spec, controllerConfig: cfg })}
          currentYear={currentYear}
          color={stepColor}
          colors={colors}
        />
      </View>
    );
    if (step === "design") return (
      <ConsoleDesignPicker
        designConfig={spec.designConfig ?? { ...DEFAULT_CONSOLE_DESIGN_CONFIG }}
        onChange={(dc) => setSpec({ ...spec, designConfig: dc })}
        currentYear={currentYear}
        color={stepColor}
        colors={colors}
        validation={validation}
      />
    );
    if (step === "connectivity") {
      const s = splitByResearch(CONNECTIVITY_OPTIONS);
      return (
        <ComponentPicker
          label="Conectividade"
          options={s.available}
          lockedOptions={s.yearLocked}
          researchLockedOptions={s.researchLocked}
          selectedId={spec.connectivityId}
          onSelect={(id) => setSpec({ ...spec, connectivityId: id })}
          renderStats={(o) => [
            { label: "Wi-Fi", value: o.hasWiFi ? "Sim" : "Não" },
            { label: "Bluetooth", value: o.hasBluetooth ? "Sim" : "Não" },
            { label: "Online", value: o.hasOnlineServices ? "Sim" : "Não" },
            { label: "Cloud Save", value: o.hasCloudSave ? "Sim" : "Não" },
            { label: "5G", value: o.has5G ? "Sim" : "Não" },
            { label: "Bônus Vendas", value: `+${Math.round(o.onlineMultiplierBonus * 100)}%` },
            { label: "Custo", value: `$${o.costUSD}` },
          ]}
          ref_key="historicalRef"
          currentYear={currentYear}
          color={stepColor}
          colors={colors}
        />
      );
    }
    if (step === "power") return (
      <ComponentPicker
        label="Fonte de Energia"
        options={POWER_UNITS.filter((o) => o.minYear <= currentYear)}
        lockedOptions={POWER_UNITS.filter((o) => o.minYear > currentYear)}
        selectedId={spec.powerUnitId}
        onSelect={(id) => setSpec({ ...spec, powerUnitId: id })}
        renderStats={(o) => [
          { label: "Max Watts", value: `${o.maxWatts}W` },
          { label: "Eficiência", value: `${Math.round(o.efficiency * 100)}%` },
          { label: "Forma", value: o.formFactor },
          { label: "Custo", value: `$${o.costUSD}` },
        ]}
        ref_key="historicalRef"
        currentYear={currentYear}
        color={stepColor}
        colors={colors}
        badge={(() => {
          const cpu = CPU_OPTIONS.find((c) => c.id === spec.cpuId);
          const gpu = GPU_OPTIONS.find((g) => g.id === spec.gpuId);
          const tdp = (cpu?.tdpWatts ?? 0) + (gpu?.tdpWatts ?? 0);
          const required = Math.round(tdp * 1.2 + 20);
          return `Necessário: ≥${required}W`;
        })()}
      />
    );
    if (step === "export") {
      const exportInvestmentTotal = EXPORTABLE_REGIONS.reduce((sum, rid) => {
        const tierIdx = exportSelections[rid] ?? -1;
        if (tierIdx < 0) return sum;
        const restriction = checkRegionRestriction("action", "T", currentYear, state?.reputation ?? 0, rid);
        if (restriction) return sum;
        return sum + REGION_INVESTMENT_TIERS[rid][tierIdx];
      }, 0);
      return (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={[styles.exportInfoBox, { backgroundColor: "#4DA6FF11", borderColor: "#4DA6FF33", marginBottom: 6 }]}>
            <Feather name="globe" size={13} color="#4DA6FF" />
            <Text style={[styles.exportInfoText, { color: "#4DA6FF" }]}>
              🏠 América do Norte incluída por padrão. Seleciona regiões para lançar o console internacionalmente.
            </Text>
          </View>
          <View style={[styles.exportInfoBox, { backgroundColor: "#10B98111", borderColor: "#10B98133", marginBottom: 10 }]}>
            <Feather name="info" size={12} color="#10B981" />
            <Text style={[styles.exportInfoText, { color: "#10B981" }]}>
              Filial aberta = 100% receita · Exportação sem filial = 50% receita
            </Text>
          </View>
          {EXPORTABLE_REGIONS.map((regionId) => {
            const restriction = checkRegionRestriction("action", "T", currentYear, state?.reputation ?? 0, regionId);
            const hasBranch = getRegionHasBranch(regionId, state?.branches ?? []);
            const tierIdx = exportSelections[regionId] ?? -1;
            const regionColor = REGION_COLORS[regionId];
            const tiers = REGION_INVESTMENT_TIERS[regionId];
            const isBlocked = !!restriction;
            const estimatedRev = tierIdx >= 0 && !isBlocked
              ? estimateExportMonthlyRevenue(buildCost * 0.1, regionId, tiers[tierIdx], hasBranch)
              : 0;
            return (
              <View key={regionId} style={[styles.exportRegionCard, {
                backgroundColor: isBlocked ? colors.secondary : tierIdx >= 0 ? regionColor + "11" : colors.card,
                borderColor: isBlocked ? colors.border : tierIdx >= 0 ? regionColor + "66" : colors.border,
                opacity: isBlocked ? 0.6 : 1,
              }]}>
                <View style={styles.exportRegionHeader}>
                  <View style={[styles.exportRegionBadge, { backgroundColor: regionColor + "22" }]}>
                    <Feather name="map-pin" size={12} color={regionColor} />
                  </View>
                  <View style={styles.exportRegionInfo}>
                    <Text style={[styles.exportRegionName, { color: isBlocked ? colors.mutedForeground : colors.foreground }]}>
                      {REGION_NAMES[regionId]}
                    </Text>
                    {isBlocked ? (
                      <Text style={[styles.exportBlockReason, { color: "#FF4D6A" }]}>🔒 {restriction}</Text>
                    ) : (
                      <View style={styles.exportMetaRow}>
                        {hasBranch && (
                          <View style={[styles.exportBranchTag, { backgroundColor: "#10B98122" }]}>
                            <Feather name="home" size={10} color="#10B981" />
                            <Text style={[styles.exportBranchTagText, { color: "#10B981" }]}>Filial</Text>
                          </View>
                        )}
                        {tierIdx >= 0 && (
                          <Text style={[styles.exportEstRev, { color: "#10B981" }]}>
                            ~{formatMoney(estimatedRev)}/mês
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                </View>
                {!isBlocked && (
                  <View style={styles.exportTierRow}>
                    <TouchableOpacity
                      onPress={() => setExportSelections(prev => ({ ...prev, [regionId]: -1 }))}
                      style={[styles.exportTierBtn, {
                        backgroundColor: tierIdx === -1 ? "#6B728033" : colors.secondary,
                        borderColor: tierIdx === -1 ? "#6B7280" : colors.border,
                      }]}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.exportTierBtnText, { color: tierIdx === -1 ? "#fff" : colors.mutedForeground }]}>Pular</Text>
                    </TouchableOpacity>
                    {([0, 1, 2] as const).map((ti) => (
                      <TouchableOpacity
                        key={ti}
                        onPress={() => setExportSelections(prev => ({ ...prev, [regionId]: ti }))}
                        style={[styles.exportTierBtn, {
                          backgroundColor: tierIdx === ti ? regionColor + "33" : colors.secondary,
                          borderColor: tierIdx === ti ? regionColor : colors.border,
                          flex: 1,
                        }]}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.exportTierBtnText, { color: tierIdx === ti ? regionColor : colors.mutedForeground, fontSize: 10 }]}>
                          {REGION_INVESTMENT_LABELS[ti]}
                        </Text>
                        <Text style={[styles.exportTierCost, { color: tierIdx === ti ? regionColor : colors.mutedForeground }]}>
                          {formatMoney(tiers[ti])}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
          {exportInvestmentTotal > 0 && (
            <View style={[styles.exportTotalBox, { backgroundColor: "#F5A62311", borderColor: "#F5A62344" }]}>
              <Text style={[styles.exportTotalLabel, { color: colors.mutedForeground }]}>Investimento total em exportação</Text>
              <Text style={[styles.exportTotalVal, { color: "#F5A623" }]}>{formatMoney(exportInvestmentTotal)}</Text>
            </View>
          )}
          <View style={{ height: 24 }} />
        </ScrollView>
      );
    }
    if (step === "review") return (
      <ReviewStep
        name={name}
        spec={spec}
        validation={validation}
        estimatedRating={estimatedRating}
        price={price}
        setPrice={setPrice}
        suggestedPrice={suggestedPrice}
        buildCost={buildCost}
        canAfford={canAfford}
        money={state?.money ?? 0}
        category={category}
        currentYear={currentYear}
        colors={colors}
      />
    );
    return null;
  };

  const existingConsoles: GameConsole[] = state?.consoles ?? [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GridBackground />
      <ScreenHeader title="Consoles" onBack={showWizard ? goBack : undefined} />

      {/* ── Console Library (default view) ── */}
      {!showWizard && (
        <>
          <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 100 }]} showsVerticalScrollIndicator={false}>
            {existingConsoles.length === 0 && (
              <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="monitor" size={36} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Nenhum console ainda</Text>
                <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
                  Cria o teu primeiro console para gerar receita e conquistar o mercado.
                </Text>
              </View>
            )}
            {existingConsoles.map((con) => {
              const sentColor = con.receptionSentiment ? SENTIMENT_COLORS[con.receptionSentiment] : "#4DA6FF";
              const stars = con.starRating ?? 0;
              return (
                <View key={con.id} style={[styles.consoleCard, { backgroundColor: colors.card, borderColor: con.isDiscontinued ? colors.border : sentColor + "44" }]}>
                  <LinearGradient colors={[sentColor + "08", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                  <View style={styles.consoleCardHeader}>
                    <View style={[styles.consoleCardIcon, { backgroundColor: sentColor + "22" }]}>
                      <Feather name="monitor" size={20} color={con.isDiscontinued ? colors.mutedForeground : sentColor} />
                    </View>
                    <View style={styles.consoleCardMeta}>
                      <Text style={[styles.consoleCardName, { color: colors.foreground }]}>{con.name}</Text>
                      <Text style={[styles.consoleCardSub, { color: colors.mutedForeground }]}>
                        {con.launchYear} · {con.isDiscontinued ? "Descontinuado" : "Ativo"}
                      </Text>
                    </View>
                    <View style={styles.consoleCardStats}>
                      <Text style={[styles.consoleRating, { color: sentColor }]}>{con.rating.toFixed(1)}/10</Text>
                      <Text style={[styles.consolePop, { color: colors.mutedForeground }]}>{Math.round(con.popularity)}% pop.</Text>
                    </View>
                  </View>
                  {con.receptionScore !== undefined && (
                    <View style={[styles.consoleReceptionRow, { backgroundColor: sentColor + "11", borderColor: sentColor + "33" }]}>
                      <View style={styles.starRow}>
                        {[1,2,3,4,5].map(i => (
                          <Feather key={i} name="star" size={12} color={i <= stars ? "#F5A623" : "#33446644"} />
                        ))}
                      </View>
                      <View style={[styles.sentiBadge, { backgroundColor: sentColor + "22" }]}>
                        <Text style={[styles.sentiText, { color: sentColor }]}>
                          {SENTIMENT_LABELS[con.receptionSentiment ?? "mixed"]}
                        </Text>
                      </View>
                      <Text style={[styles.receptionScore, { color: sentColor }]}>{con.receptionScore}/100</Text>
                    </View>
                  )}
                  {con.receptionComment && (
                    <Text style={[styles.receptionComment, { color: colors.mutedForeground }]} numberOfLines={2}>
                      "{con.receptionComment}"
                    </Text>
                  )}
                  <View style={styles.consoleRevRow}>
                    <Text style={[styles.consoleRevLabel, { color: colors.mutedForeground }]}>Vendas · Receita total</Text>
                    <Text style={[styles.consoleRevVal, { color: "#10B981" }]}>
                      {(Number.isFinite(con.unitsSold) ? con.unitsSold : 0).toLocaleString()} un · {formatMoney(con.totalRevenue)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* FAB */}
          <View style={[styles.fab, { paddingBottom: botPad + 12, backgroundColor: colors.background }]}>
            <TouchableOpacity onPress={() => setShowWizard(true)} style={styles.fabBtn} activeOpacity={0.85}>
              <LinearGradient colors={["#10B981", "#059669"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.fabBtnInner}>
                <Feather name="plus-circle" size={18} color="#fff" />
                <Text style={styles.fabBtnText}>Novo Console</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* ── Wizard View ── */}
      {showWizard && (
        <>
          {/* Era Banner */}
          <View style={[styles.eraBanner, { backgroundColor: stepColor + "15", borderColor: stepColor + "33" }]}>
            <Feather name={STEP_ICONS[step] as any} size={13} color={stepColor} />
            <Text style={[styles.eraBannerText, { color: stepColor }]}>
              {currentYear} · {era.name} · ×{eraCostMult.toFixed(2)} era · Passo {stepIndex + 1}/{STEPS.length}
            </Text>
            <Text style={[styles.eraBannerCost, { color: stepColor }]}>{formatMoney(buildCost)} prod.</Text>
          </View>

          {/* Progress Bar */}
          <View style={[styles.progressTrack, { backgroundColor: colors.secondary }]}>
            <View style={[styles.progressFill, { width: `${((stepIndex) / (STEPS.length - 1)) * 100}%`, backgroundColor: stepColor }]} />
          </View>

          {/* Step Dots */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stepDots} contentContainerStyle={styles.stepDotsContent}>
            {STEPS.map((s, i) => {
              const col = STEP_COLORS[s];
              const isDone = i < stepIndex;
              const isCurrent = i === stepIndex;
              return (
                <TouchableOpacity key={s} onPress={() => setStepIndex(i)} style={styles.stepDot}>
                  <View style={[styles.stepDotCircle, {
                    backgroundColor: isCurrent ? col : isDone ? col + "66" : colors.secondary,
                    borderColor: isCurrent ? col : isDone ? col + "44" : colors.border,
                  }]}>
                    <Feather name={(isDone ? "check" : STEP_ICONS[s]) as any} size={10} color={isCurrent || isDone ? "#fff" : colors.mutedForeground} />
                  </View>
                  <Text style={[styles.stepDotLabel, { color: isCurrent ? col : colors.mutedForeground }]}>
                    {STEP_LABELS[s]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Step Content */}
          <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 100 }]} showsVerticalScrollIndicator={false}>
            {renderStepContent()}
          </ScrollView>

          {/* Navigation */}
          <View style={[styles.navBar, { paddingBottom: botPad + 10, backgroundColor: colors.background, borderTopColor: colors.border }]}>
            <TouchableOpacity onPress={goBack} style={[styles.navBtn, { borderColor: colors.border }]}>
              <Feather name="arrow-left" size={16} color={colors.mutedForeground} />
              <Text style={[styles.navBtnText, { color: colors.mutedForeground }]}>Voltar</Text>
            </TouchableOpacity>

            {step === "review" ? (
              <TouchableOpacity
                onPress={handleBuild}
                style={[styles.navBtnPrimary, { opacity: (validation.isValid && canAfford) ? 1 : 0.5 }]}
                disabled={!validation.isValid || !canAfford}
              >
                <LinearGradient colors={["#10B981", "#059669"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.navBtnPrimaryInner}>
                  <Feather name="check-circle" size={16} color="#fff" />
                  <Text style={styles.navBtnPrimaryText}>Lançar Console</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={goNext} style={[styles.navBtnPrimary]}>
                <LinearGradient colors={[stepColor, stepColor + "CC"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.navBtnPrimaryInner}>
                  <Text style={styles.navBtnPrimaryText}>{STEP_LABELS[STEPS[stepIndex + 1] ?? "review"]}</Text>
                  <Feather name="arrow-right" size={16} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}

      {/* ── Console Reception Modal ── */}
      <Modal visible={consoleReception !== null} transparent animationType="slide" statusBarTranslucent>
        <Pressable style={styles.overlay} onPress={() => {}}>
          {consoleReception && (() => {
            const rec = consoleReception;
            const sentColor = SENTIMENT_COLORS[rec.sentiment];
            const stars = rec.stars;
            const lastConsole = existingConsoles[existingConsoles.length - 1];
            return (
              <View style={[styles.receptionSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.recBanner, { backgroundColor: sentColor + "15" }]}>
                  <Feather name="monitor" size={18} color={sentColor} />
                  <Text style={[styles.recBannerText, { color: sentColor }]}>CONSOLE LANÇADO!</Text>
                </View>

                <Text style={[styles.recConsoleName, { color: colors.foreground }]}>
                  {lastConsole?.name ?? "Novo Console"}
                </Text>

                <View style={styles.recStarRow}>
                  {[1,2,3,4,5].map(i => (
                    <Feather key={i} name="star" size={26} color={i <= stars ? "#F5A623" : "#33446644"} />
                  ))}
                  <View style={[styles.recScoreBadge, { backgroundColor: sentColor + "22" }]}>
                    <Text style={[styles.recScoreNum, { color: sentColor }]}>{rec.score}</Text>
                    <Text style={[styles.recScoreDen, { color: sentColor }]}>/100</Text>
                  </View>
                </View>

                <View style={[styles.recSentiBadge, { backgroundColor: sentColor + "22", borderColor: sentColor + "44" }]}>
                  <Text style={[styles.recSentiText, { color: sentColor }]}>
                    {SENTIMENT_LABELS[rec.sentiment]}
                  </Text>
                </View>

                <View style={[styles.recCommentBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                  <Text style={[styles.recCommentText, { color: colors.foreground }]}>
                    "{rec.comment}"
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => setConsoleReception(null)}
                  style={[styles.recBtn, { backgroundColor: sentColor }]}
                  activeOpacity={0.85}
                >
                  <Text style={styles.recBtnText}>Continuar</Text>
                </TouchableOpacity>
              </View>
            );
          })()}
        </Pressable>
      </Modal>
    </View>
  );
}

// ── Name Step ─────────────────────────────────────────────────────

function NameStep({ name, setName, era, year, colors }: { name: string; setName: (s: string) => void; era: any; year: number; colors: any }) {
  return (
    <View style={styles.nameStepContent}>
      <View style={[styles.nameEraCard, { backgroundColor: (era.color ?? "#4DA6FF") + "11", borderColor: (era.color ?? "#4DA6FF") + "33" }]}>
        <Text style={{ fontSize: 32 }}>{era.icon ?? "🎮"}</Text>
        <View>
          <Text style={[styles.nameEraTitle, { color: era.color ?? "#4DA6FF" }]}>{era.name}</Text>
          <Text style={[styles.nameEraSub, { color: colors.mutedForeground }]}>{year}</Text>
        </View>
      </View>

      <Text style={[styles.nameLabel, { color: colors.mutedForeground }]}>NOME DO CONSOLE</Text>
      <View style={[styles.nameInput, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
        <Feather name="monitor" size={18} color="#4DA6FF" />
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Ex: NovaTech FX-1000"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.nameInputText, { color: colors.foreground }]}
          maxLength={32}
          autoFocus
        />
      </View>
      <Text style={[styles.nameHint, { color: colors.mutedForeground }]}>
        Escolhe um nome memorável para o teu console. A seguir, configura cada componente de hardware.
      </Text>
    </View>
  );
}

// ── Component Picker ──────────────────────────────────────────────

function ComponentPicker<T extends { id: string; name: string; costUSD: number; minYear: number }>({
  label, options, lockedOptions, researchLockedOptions, selectedId, onSelect, renderStats, ref_key, currentYear, color, colors, badge,
}: {
  label: string;
  options: T[];
  lockedOptions: T[];
  researchLockedOptions?: T[];
  selectedId: string;
  onSelect: (id: string) => void;
  renderStats: (o: T) => { label: string; value: string }[];
  ref_key: string;
  currentYear: number;
  color: string;
  colors: any;
  badge?: string;
}) {
  return (
    <View style={styles.pickerContainer}>
      <Text style={[styles.pickerTitle, { color: colors.foreground }]}>{label}</Text>
      {badge && (
        <View style={[styles.pickerBadge, { backgroundColor: color + "11", borderColor: color + "33" }]}>
          <Feather name="info" size={11} color={color} />
          <Text style={[styles.pickerBadgeText, { color }]}>{badge}</Text>
        </View>
      )}

      {options.map((opt) => {
        const isSelected = opt.id === selectedId;
        const stats = renderStats(opt);
        const refStr = (opt as any)[ref_key];
        return (
          <TouchableOpacity
            key={opt.id}
            onPress={() => onSelect(opt.id)}
            style={[styles.optCard, {
              backgroundColor: isSelected ? color + "11" : colors.card,
              borderColor: isSelected ? color : colors.border,
            }]}
            activeOpacity={0.85}
          >
            {isSelected && (
              <LinearGradient colors={[color + "10", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
            )}
            <View style={styles.optCardHeader}>
              <View style={[styles.optColorDot, { backgroundColor: isSelected ? color : colors.secondary }]}>
                {isSelected && <Feather name="check" size={12} color="#fff" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optName, { color: colors.foreground }]}>{opt.name}</Text>
                {refStr && (
                  <Text style={[styles.optRef, { color: colors.mutedForeground }]}>{refStr}</Text>
                )}
              </View>
              <Text style={[styles.optCost, { color: isSelected ? color : colors.mutedForeground }]}>${opt.costUSD}</Text>
            </View>
            {isSelected && (
              <View style={styles.optStats}>
                {stats.map((s) => (
                  <View key={s.label} style={styles.optStat}>
                    <Text style={[styles.optStatLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
                    <Text style={[styles.optStatValue, { color }]}>{s.value}</Text>
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>
        );
      })}

      {(researchLockedOptions?.length ?? 0) > 0 && (
        <>
          <Text style={[styles.lockedHeader, { color: "#F59E0B" }]}>
            🔬 Requer Pesquisa
          </Text>
          {researchLockedOptions!.map((opt) => {
            const reqNode = getComponentResearchRequirement(opt.id);
            return (
              <View key={opt.id} style={[styles.optCard, styles.optCardLocked, { backgroundColor: "#F59E0B0A", borderColor: "#F59E0B33" }]}>
                <Feather name="lock" size={14} color="#F59E0B" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optName, { color: colors.mutedForeground }]}>{opt.name}</Text>
                  {reqNode && (
                    <Text style={[styles.optRef, { color: "#F59E0B" }]}>Pesquisa: {reqNode}</Text>
                  )}
                </View>
                <Text style={[styles.optCost, { color: "#F59E0B77" }]}>${opt.costUSD}</Text>
              </View>
            );
          })}
        </>
      )}

      {lockedOptions.length > 0 && (
        <>
          <Text style={[styles.lockedHeader, { color: colors.mutedForeground }]}>
            🔒 Desbloqueável no Futuro
          </Text>
          {lockedOptions.slice(0, 3).map((opt) => (
            <View key={opt.id} style={[styles.optCard, styles.optCardLocked, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Feather name="lock" size={14} color={colors.mutedForeground} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.optName, { color: colors.mutedForeground }]}>{opt.name}</Text>
              </View>
              <Text style={[styles.optRef, { color: colors.mutedForeground }]}>
                {opt.minYear}
              </Text>
            </View>
          ))}
        </>
      )}
    </View>
  );
}

// ── Controller Attribute Picker ──────────────────────────────────

function CtrlAttrRow<T extends string>({
  label, icon, options, selected, onSelect, currentYear, color, colors,
}: {
  label: string; icon: string;
  options: { id: T; label: string; description: string; extraCostUSD: number; comfortBonus: number; qualityScore: number; minYear: number }[];
  selected: T; onSelect: (v: T) => void;
  currentYear: number; color: string; colors: any;
}) {
  return (
    <View style={styles.ctrlRow}>
      <View style={styles.ctrlRowHeader}>
        <Feather name={icon as any} size={13} color={color} />
        <Text style={[styles.ctrlRowLabel, { color: colors.foreground }]}>{label}</Text>
      </View>
      <View style={styles.ctrlRowOptions}>
        {options.map((opt) => {
          const locked = opt.minYear > currentYear;
          const isSelected = opt.id === selected;
          return (
            <TouchableOpacity
              key={opt.id}
              onPress={() => { if (!locked) onSelect(opt.id); }}
              style={[styles.ctrlOptCard, {
                backgroundColor: locked ? colors.secondary : isSelected ? color + "22" : colors.card,
                borderColor: locked ? colors.border : isSelected ? color : colors.border,
                opacity: locked ? 0.5 : 1,
              }]}
              activeOpacity={locked ? 1 : 0.8}
            >
              {isSelected && !locked && (
                <View style={[styles.ctrlOptCheck, { backgroundColor: color }]}>
                  <Feather name="check" size={8} color="#fff" />
                </View>
              )}
              {locked && (
                <View style={styles.ctrlOptCheck}>
                  <Feather name="lock" size={8} color={colors.mutedForeground} />
                </View>
              )}
              <Text style={[styles.ctrlOptLabel, { color: locked ? colors.mutedForeground : isSelected ? color : colors.foreground }]} numberOfLines={1}>
                {opt.label}
              </Text>
              <Text style={[styles.ctrlOptDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                {locked ? `Disponível em ${opt.minYear}` : opt.description}
              </Text>
              <View style={styles.ctrlOptStats}>
                {opt.extraCostUSD > 0 && (
                  <Text style={[styles.ctrlOptStat, { color: "#F5A623" }]}>+${opt.extraCostUSD}</Text>
                )}
                {opt.comfortBonus > 0 && (
                  <Text style={[styles.ctrlOptStat, { color: "#10B981" }]}>+{opt.comfortBonus.toFixed(1)} conforto</Text>
                )}
                {opt.qualityScore > 0 && (
                  <Text style={[styles.ctrlOptStat, { color: color }]}>{opt.qualityScore}/10 qualidade</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function ControllerAttributePicker({
  cfg, onChange, currentYear, color, colors,
}: {
  cfg: ControllerConfig; onChange: (cfg: ControllerConfig) => void;
  currentYear: number; color: string; colors: any;
}) {
  const stats = computeControllerConfigStats(cfg);
  return (
    <View style={styles.pickerContainer}>
      <Text style={[styles.pickerTitle, { color: colors.foreground }]}>Design do Controle</Text>
      <View style={[styles.ctrlSummaryRow, { backgroundColor: color + "11", borderColor: color + "33" }]}>
        <Text style={[styles.ctrlSummaryLabel, { color: colors.mutedForeground }]}>Custo extra</Text>
        <Text style={[styles.ctrlSummaryVal, { color }]}>+${stats.extraCostUSD}</Text>
        <Text style={[styles.ctrlSummaryLabel, { color: colors.mutedForeground }]}>Conforto</Text>
        <Text style={[styles.ctrlSummaryVal, { color: "#10B981" }]}>+{stats.comfortBonus.toFixed(1)}</Text>
        <Text style={[styles.ctrlSummaryLabel, { color: colors.mutedForeground }]}>Qualidade</Text>
        <Text style={[styles.ctrlSummaryVal, { color: "#F5A623" }]}>{stats.qualityScore.toFixed(1)}/10</Text>
      </View>

      <CtrlAttrRow<ControllerMaterial>
        label="Material do Corpo" icon="box" options={CTRL_MATERIAL_OPTIONS}
        selected={cfg.material} onSelect={(v) => onChange({ ...cfg, material: v })}
        currentYear={currentYear} color={color} colors={colors}
      />
      <CtrlAttrRow<ControllerButtons>
        label="Qualidade dos Botões" icon="circle" options={CTRL_BUTTON_OPTIONS}
        selected={cfg.buttons} onSelect={(v) => onChange({ ...cfg, buttons: v })}
        currentYear={currentYear} color={color} colors={colors}
      />
      <CtrlAttrRow<ControllerAnalog>
        label="Precisão dos Analógicos" icon="crosshair" options={CTRL_ANALOG_OPTIONS}
        selected={cfg.analog} onSelect={(v) => onChange({ ...cfg, analog: v })}
        currentYear={currentYear} color={color} colors={colors}
      />
      <CtrlAttrRow<ControllerHaptics>
        label="Vibração / Háptica" icon="activity" options={CTRL_HAPTICS_OPTIONS}
        selected={cfg.haptics} onSelect={(v) => onChange({ ...cfg, haptics: v })}
        currentYear={currentYear} color={color} colors={colors}
      />
      <CtrlAttrRow<ControllerWireless>
        label="Tecnologia Sem Fio" icon="wifi" options={CTRL_WIRELESS_OPTIONS}
        selected={cfg.wireless} onSelect={(v) => onChange({ ...cfg, wireless: v })}
        currentYear={currentYear} color={color} colors={colors}
      />
    </View>
  );
}

// ── Category Step ─────────────────────────────────────────────────

function CategoryStep({ category, setCategory, currentYear, colors }: {
  category: ConsoleCategory; setCategory: (c: ConsoleCategory) => void;
  currentYear: number; colors: any;
}) {
  return (
    <View style={styles.pickerContainer}>
      <Text style={[styles.pickerTitle, { color: colors.foreground }]}>Tipo de Console</Text>
      <Text style={[styles.nameHint, { color: colors.mutedForeground, marginBottom: 8 }]}>
        Cada categoria tem faixas de preço históricas distintas e afeta volume de vendas, margem e prestígio.
      </Text>
      {CONSOLE_CATEGORY_PRICING.map((cat) => {
        const era = getConsolePriceEra(cat.id, currentYear);
        const isSelected = category === cat.id;
        return (
          <TouchableOpacity
            key={cat.id}
            onPress={() => setCategory(cat.id)}
            activeOpacity={0.8}
            style={[
              styles.optCard,
              {
                backgroundColor: isSelected ? cat.color + "18" : colors.card,
                borderColor: isSelected ? cat.color : colors.border,
                borderWidth: isSelected ? 2 : 1,
                marginBottom: 8,
              },
            ]}
          >
            {isSelected && (
              <LinearGradient
                colors={[cat.color + "18", "transparent"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            )}
            <View style={styles.optCardHeader}>
              <View style={[styles.optColorDot, { backgroundColor: cat.color + "22" }]}>
                <Feather name={cat.icon as any} size={14} color={cat.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optName, { color: isSelected ? cat.color : colors.foreground }]}>{cat.label}</Text>
                <Text style={[styles.optRef, { color: colors.mutedForeground }]}>{cat.description}</Text>
              </View>
              {isSelected && (
                <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: cat.color, alignItems: "center", justifyContent: "center" }}>
                  <Feather name="check" size={12} color="#fff" />
                </View>
              )}
            </View>
            {/* Era pricing range */}
            <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
              <View style={[{ flex: 1, backgroundColor: cat.color + "12", borderRadius: 8, padding: 8, gap: 2 }]}>
                <Text style={{ fontSize: 10, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, textTransform: "uppercase" as const, letterSpacing: 0.5 }}>
                  Faixa ideal ({currentYear})
                </Text>
                <Text style={{ fontSize: 13, fontFamily: "Inter_700Bold", color: cat.color }}>
                  ${era.idealMin} – ${era.idealMax}
                </Text>
              </View>
              <View style={[{ flex: 1, backgroundColor: "#EF444412", borderRadius: 8, padding: 8, gap: 2 }]}>
                <Text style={{ fontSize: 10, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, textTransform: "uppercase" as const, letterSpacing: 0.5 }}>
                  Máximo permitido
                </Text>
                <Text style={{ fontSize: 13, fontFamily: "Inter_700Bold", color: "#EF4444" }}>
                  ${era.maxAllowed}
                </Text>
              </View>
              <View style={[{ flex: 1, backgroundColor: "#10B98112", borderRadius: 8, padding: 8, gap: 2 }]}>
                <Text style={{ fontSize: 10, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, textTransform: "uppercase" as const, letterSpacing: 0.5 }}>
                  Volume
                </Text>
                <Text style={{ fontSize: 13, fontFamily: "Inter_700Bold", color: "#10B981" }}>
                  {cat.id === "standard" ? "Alto" : cat.id === "premium" ? "Médio" : "Baixo"}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Review Step ───────────────────────────────────────────────────

function ReviewStep({ name, spec, validation, estimatedRating, price, setPrice, suggestedPrice, buildCost, canAfford, money, category, currentYear, colors }: {
  name: string; spec: ConsoleComponentSpec; validation: ReturnType<typeof validateConsoleComponents>;
  estimatedRating: number; price: string; setPrice: (s: string) => void;
  suggestedPrice: number; buildCost: number; canAfford: boolean; money: number;
  category: ConsoleCategory; currentYear: number; colors: any;
}) {
  const ratingColor = estimatedRating >= 7 ? "#10B981" : estimatedRating >= 5 ? "#F5A623" : "#FF4D6A";
  const catDef = CONSOLE_CATEGORY_PRICING.find((c) => c.id === category) ?? CONSOLE_CATEGORY_PRICING[0];
  const priceEra = getConsolePriceEra(category, currentYear);
  const finalPriceNum = parseInt(price) || suggestedPrice;
  const priceFeedback = getConsolePriceFeedback(finalPriceNum, category, currentYear);
  const cpu = CPU_OPTIONS.find((c) => c.id === spec.cpuId);
  const gpu = GPU_OPTIONS.find((g) => g.id === spec.gpuId);
  const memory = MEMORY_COMPONENTS.find((m) => m.id === spec.memoryId);
  const storage = STORAGE_OPTIONS.find((s) => s.id === spec.storageId);
  const cooling = COOLING_OPTIONS.find((c) => c.id === spec.coolingId);
  const controller = CONTROLLER_OPTIONS.find((c) => c.id === spec.controllerId);
  const design = DESIGN_OPTIONS.find((d) => d.id === spec.designId);
  const connectivity = CONNECTIVITY_OPTIONS.find((c) => c.id === spec.connectivityId);
  const power = POWER_UNITS.find((p) => p.id === spec.powerUnitId);

  return (
    <View style={styles.reviewContent}>
      {/* Rating Preview */}
      <View style={[styles.ratingPreview, { backgroundColor: ratingColor + "11", borderColor: ratingColor + "44" }]}>
        <LinearGradient colors={[ratingColor + "20", "transparent"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={styles.ratingBig}>
          <Text style={[styles.ratingBigScore, { color: ratingColor }]}>{estimatedRating.toFixed(1)}</Text>
          <Text style={[styles.ratingBigLabel, { color: colors.mutedForeground }]}>/ 10</Text>
        </View>
        <View>
          <Text style={[styles.ratingTitle, { color: colors.foreground }]}>{name || "Console Sem Nome"}</Text>
          <Text style={[styles.ratingPerf, { color: ratingColor }]}>Performance: {validation.performanceScore}/100</Text>
          <Text style={[styles.ratingAppeal, { color: colors.mutedForeground }]}>Apelo: {validation.appealScore}/10 · Online: +{Math.round(validation.onlineBonusMult * 100)}%</Text>
        </View>
      </View>

      {/* Validation Alerts */}
      {!validation.thermalOK && (
        <View style={[styles.alertCard, { backgroundColor: "#FF4D6A11", borderColor: "#FF4D6A44" }]}>
          <Feather name="alert-triangle" size={14} color="#FF4D6A" />
          <Text style={[styles.alertText, { color: "#FF4D6A" }]}>Refrigeração insuficiente — risco de YLOD</Text>
        </View>
      )}
      {!validation.powerOK && (
        <View style={[styles.alertCard, { backgroundColor: "#FF4D6A11", borderColor: "#FF4D6A44" }]}>
          <Feather name="alert-triangle" size={14} color="#FF4D6A" />
          <Text style={[styles.alertText, { color: "#FF4D6A" }]}>Fonte de energia insuficiente — risco de falha</Text>
        </View>
      )}
      {validation.warnings.map((w, i) => (
        <View key={i} style={[styles.alertCard, { backgroundColor: "#F5A62311", borderColor: "#F5A62344" }]}>
          <Feather name="alert-circle" size={14} color="#F5A623" />
          <Text style={[styles.alertText, { color: "#F5A623" }]}>{w}</Text>
        </View>
      ))}
      {validation.errors.map((e, i) => (
        <View key={i} style={[styles.alertCard, { backgroundColor: "#FF4D6A11", borderColor: "#FF4D6A44" }]}>
          <Feather name="x-circle" size={14} color="#FF4D6A" />
          <Text style={[styles.alertText, { color: "#FF4D6A" }]}>{e}</Text>
        </View>
      ))}

      {/* Component Summary */}
      <View style={[styles.compSummary, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.compSummaryTitle, { color: colors.foreground }]}>Componentes Selecionados</Text>
        {[
          { label: "CPU", comp: cpu },
          { label: "GPU", comp: gpu },
          { label: "RAM", comp: memory },
          { label: "Storage", comp: storage },
          { label: "Cooling", comp: cooling },
          { label: "Controle", comp: controller },
          { label: "Design", comp: design },
          { label: "Rede", comp: connectivity },
          { label: "Fonte", comp: power },
        ].map(({ label, comp }) => (
          <View key={label} style={[styles.compRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.compRowLabel, { color: colors.mutedForeground }]}>{label}</Text>
            <Text style={[styles.compRowValue, { color: colors.foreground }]}>{comp?.name ?? "—"}</Text>
            <Text style={[styles.compRowCost, { color: "#4DA6FF" }]}>${(comp as any)?.costUSD ?? 0}</Text>
          </View>
        ))}
        {/* Controller config row */}
        {(() => {
          const cfg = spec.controllerConfig ?? DEFAULT_CONTROLLER_CONFIG;
          const mat = CTRL_MATERIAL_OPTIONS.find((o) => o.id === cfg.material);
          const btn = CTRL_BUTTON_OPTIONS.find((o) => o.id === cfg.buttons);
          const anl = CTRL_ANALOG_OPTIONS.find((o) => o.id === cfg.analog);
          const hpt = CTRL_HAPTICS_OPTIONS.find((o) => o.id === cfg.haptics);
          const wrl = CTRL_WIRELESS_OPTIONS.find((o) => o.id === cfg.wireless);
          const cfgCost = computeControllerConfigStats(cfg).extraCostUSD;
          return (
            <View style={[styles.compRow, { borderTopColor: colors.border, flexWrap: "wrap" }]}>
              <Text style={[styles.compRowLabel, { color: colors.mutedForeground }]}>Ctrl+</Text>
              <Text style={[styles.compRowValue, { color: colors.mutedForeground, fontSize: 10 }]} numberOfLines={2}>
                {mat?.label} · {btn?.label} · {anl?.label} · {hpt?.label} · {wrl?.label}
              </Text>
              <Text style={[styles.compRowCost, { color: cfgCost > 0 ? "#4DA6FF" : colors.mutedForeground }]}>
                +${cfgCost}
              </Text>
            </View>
          );
        })()}
        {/* Design config summary row */}
        {(() => {
          const dc = spec.designConfig ?? DEFAULT_CONSOLE_DESIGN_CONFIG;
          const cm  = CASE_MODEL_OPTIONS.find((o) => o.id === dc.caseModel);
          const mat = CASE_MATERIAL_OPTIONS.find((o) => o.id === dc.material);
          const col = CONSOLE_COLOR_OPTIONS.find((o) => o.id === dc.colorStyle);
          const cc  = CONTROLLER_COUNT_OPTIONS.find((o) => o.id === dc.controllerCount);
          const bg  = BUNDLE_GAMES_OPTIONS.find((o) => o.id === dc.bundleGames);
          const lb  = LICENSE_BUNDLE_OPTIONS.find((o) => o.id === dc.licensedBundle);
          const ds  = DESIGN_STYLE_OPTIONS.find((o) => o.id === dc.designStyle);
          const ctrlOpt = CONTROLLER_OPTIONS.find((c) => c.id === spec.controllerId);
          const ctrlStats = computeControllerConfigStats(spec.controllerConfig ?? DEFAULT_CONTROLLER_CONFIG);
          const dStats = computeDesignConfigStats(dc, (ctrlOpt?.costUSD ?? 0) + ctrlStats.extraCostUSD);
          const totalDesignCost = dStats.extraCostUSD + dStats.extraCtrlCostUSD;
          return (
            <>
              <View style={[styles.compRow, { borderTopColor: colors.border, flexWrap: "wrap" }]}>
                <Text style={[styles.compRowLabel, { color: colors.mutedForeground }]}>Design+</Text>
                <Text style={[styles.compRowValue, { color: colors.mutedForeground, fontSize: 10 }]} numberOfLines={2}>
                  {cm?.label} · {mat?.label} · {col?.label}
                </Text>
                <Text style={[styles.compRowCost, { color: totalDesignCost > 0 ? "#EC4899" : colors.mutedForeground }]}>
                  +${totalDesignCost}
                </Text>
              </View>
              <View style={[styles.compRow, { borderTopColor: colors.border, flexWrap: "wrap" }]}>
                <Text style={[styles.compRowLabel, { color: colors.mutedForeground }]}>Bundle+</Text>
                <Text style={[styles.compRowValue, { color: colors.mutedForeground, fontSize: 10 }]} numberOfLines={2}>
                  {cc?.label} · {bg?.label} · {lb?.label} · {ds?.label}
                </Text>
                <Text style={[styles.compRowCost, { color: "#EC4899" }]}>
                  ×{dStats.salesMult.toFixed(2)} vendas
                </Text>
              </View>
            </>
          );
        })()}
        <View style={[styles.compRow, { borderTopColor: colors.border }]}>
          <Text style={[styles.compRowLabel, { color: "#F5A623" }]}>TOTAL BOM</Text>
          <Text style={[styles.compRowValue, { color: "#F5A623" }]}>—</Text>
          <Text style={[styles.compRowCost, { color: "#F5A623" }]}>${validation.totalCostUSD}</Text>
        </View>
      </View>

      {/* Category + Era pricing info */}
      <View style={[styles.priceBox, { backgroundColor: catDef.color + "11", borderColor: catDef.color + "44" }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: catDef.color + "22", alignItems: "center", justifyContent: "center" }}>
            <Feather name={catDef.icon as any} size={14} color={catDef.color} />
          </View>
          <Text style={[styles.priceBoxTitle, { color: catDef.color }]}>{catDef.label}</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
          <View style={{ flex: 1, minWidth: 120, gap: 2 }}>
            <Text style={[styles.priceBoxHint, { color: colors.mutedForeground }]}>Faixa ideal ({currentYear})</Text>
            <Text style={[{ fontSize: 13, fontFamily: "Inter_700Bold", color: colors.foreground }]}>
              ${priceEra.idealMin} – ${priceEra.idealMax}
            </Text>
          </View>
          <View style={{ flex: 1, minWidth: 100, gap: 2 }}>
            <Text style={[styles.priceBoxHint, { color: colors.mutedForeground }]}>Máximo permitido</Text>
            <Text style={[{ fontSize: 13, fontFamily: "Inter_700Bold", color: "#EF4444" }]}>
              ${priceEra.maxAllowed}
            </Text>
          </View>
        </View>
      </View>

      {/* Price Setting */}
      <View style={[styles.priceBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.priceBoxTitle, { color: colors.foreground }]}>Preço de Venda ao Público</Text>
        <Text style={[styles.priceBoxHint, { color: colors.mutedForeground }]}>Sugerido: ${suggestedPrice}</Text>
        <View style={[styles.priceInput, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
          <Text style={[styles.priceSymbol, { color: "#4DA6FF" }]}>$</Text>
          <TextInput
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            placeholder={String(suggestedPrice)}
            placeholderTextColor={colors.mutedForeground}
            style={[styles.priceInputText, { color: colors.foreground }]}
          />
        </View>
        {/* Live feedback on price */}
        <View style={[styles.alertCard, { backgroundColor: priceFeedback.color + "15", borderColor: priceFeedback.color + "44" }]}>
          <Feather
            name={priceFeedback.status === "ideal" ? "check-circle" : priceFeedback.status === "invalid" ? "x-circle" : "alert-circle"}
            size={14}
            color={priceFeedback.color}
          />
          <Text style={[styles.alertText, { color: priceFeedback.color }]}>{priceFeedback.label}</Text>
          {priceFeedback.status !== "invalid" && (
            <Text style={[{ fontSize: 11, fontFamily: "Inter_700Bold", color: priceFeedback.color }]}>
              {Math.round(priceFeedback.demandMult * 100)}% demanda
            </Text>
          )}
        </View>
      </View>

      {/* Build Cost */}
      <View style={[styles.buildCostBox, { backgroundColor: canAfford ? "#10B98111" : "#FF4D6A11", borderColor: canAfford ? "#10B98133" : "#FF4D6A33" }]}>
        <Feather name={canAfford ? "check-circle" : "alert-triangle"} size={18} color={canAfford ? "#10B981" : "#FF4D6A"} />
        <View>
          <Text style={[styles.buildCostLabel, { color: canAfford ? "#10B981" : "#FF4D6A" }]}>
            Custo de Produção Inicial (50 unidades)
          </Text>
          <Text style={[styles.buildCostValue, { color: colors.foreground }]}>
            {formatMoney(buildCost)} · Saldo: {formatMoney(money)}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ── Console Design Picker (Modular 7-Category System) ─────────────

function DesignSection<T>({
  title, icon, color, options, selectedId, onSelect, locked, colors,
}: {
  title: string; icon: string; color: string;
  options: { id: T; label: string; description: string; extraCostUSD: number; salesMult: number; fanBoost: number; repBonus: number; appealBonus: number; minYear: number; icon: string }[];
  selectedId: T; onSelect: (v: T) => void; locked?: boolean; colors: any;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: color + "22", alignItems: "center", justifyContent: "center" }}>
          <Feather name={icon as any} size={12} color={color} />
        </View>
        <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: colors.foreground }}>{title}</Text>
        {locked && <Text style={{ fontSize: 10, color: colors.mutedForeground, marginLeft: 4 }}>🔒</Text>}
      </View>
      {options.map((opt) => {
        const isSelected = opt.id === selectedId;
        const hasBonus = opt.salesMult > 1 || opt.fanBoost > 0 || opt.repBonus > 0;
        return (
          <TouchableOpacity
            key={String(opt.id)}
            onPress={() => onSelect(opt.id)}
            activeOpacity={0.8}
            style={[{
              borderRadius: 10,
              borderWidth: 1.5,
              padding: 10,
              marginBottom: 6,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              backgroundColor: isSelected ? color + "14" : colors.card,
              borderColor: isSelected ? color : colors.border,
            }]}
          >
            <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: isSelected ? color + "22" : colors.secondary, alignItems: "center", justifyContent: "center" }}>
              <Feather name={opt.icon as any} size={14} color={isSelected ? color : colors.mutedForeground} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: "Inter_700Bold", fontSize: 12, color: isSelected ? color : colors.foreground }}>{opt.label}</Text>
              <Text style={{ fontFamily: "Inter_400Regular", fontSize: 10, color: colors.mutedForeground, marginTop: 1 }} numberOfLines={2}>{opt.description}</Text>
              {hasBonus && (
                <View style={{ flexDirection: "row", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                  {opt.salesMult > 1 && (
                    <View style={{ backgroundColor: "#10B98120", borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
                      <Text style={{ fontSize: 9, fontFamily: "Inter_700Bold", color: "#10B981" }}>+{Math.round((opt.salesMult - 1) * 100)}% vendas</Text>
                    </View>
                  )}
                  {opt.repBonus > 0 && (
                    <View style={{ backgroundColor: "#4DA6FF20", borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
                      <Text style={{ fontSize: 9, fontFamily: "Inter_700Bold", color: "#4DA6FF" }}>+{opt.repBonus} rep</Text>
                    </View>
                  )}
                  {opt.fanBoost > 0 && (
                    <View style={{ backgroundColor: "#F5A62320", borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
                      <Text style={{ fontSize: 9, fontFamily: "Inter_700Bold", color: "#F5A623" }}>+{opt.fanBoost.toLocaleString()} fãs</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
            <View style={{ alignItems: "flex-end", gap: 2 }}>
              {opt.extraCostUSD > 0 && (
                <Text style={{ fontSize: 10, fontFamily: "Inter_700Bold", color: "#EC4899" }}>+${opt.extraCostUSD}</Text>
              )}
              {isSelected && <Feather name="check-circle" size={16} color={color} />}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function ConsoleDesignPicker({
  designConfig, onChange, currentYear, color, colors, validation,
}: {
  designConfig: ConsoleDesignConfig;
  onChange: (dc: ConsoleDesignConfig) => void;
  currentYear: number; color: string; colors: any;
  validation: ReturnType<typeof validateConsoleComponents>;
}) {
  const ctrlUnit = CONTROLLER_OPTIONS.find((c) => c.id === "ctrl_joystick")?.costUSD ?? 8;
  const dStats = computeDesignConfigStats(designConfig, ctrlUnit);
  const totalExtraCost = dStats.extraCostUSD + dStats.extraCtrlCostUSD;

  const update = <K extends keyof ConsoleDesignConfig>(key: K, val: ConsoleDesignConfig[K]) =>
    onChange({ ...designConfig, [key]: val });

  const availCaseModels    = CASE_MODEL_OPTIONS.filter((o) => o.minYear <= currentYear);
  const availMaterials     = CASE_MATERIAL_OPTIONS.filter((o) => o.minYear <= currentYear);
  const availColors        = CONSOLE_COLOR_OPTIONS.filter((o) => o.minYear <= currentYear);
  const availCtrlCounts    = CONTROLLER_COUNT_OPTIONS.filter((o) => o.minYear <= currentYear);
  const availBundles       = BUNDLE_GAMES_OPTIONS.filter((o) => o.minYear <= currentYear);
  const availLicenses      = LICENSE_BUNDLE_OPTIONS.filter((o) => o.minYear <= currentYear);
  const availDesignStyles  = DESIGN_STYLE_OPTIONS.filter((o) => o.minYear <= currentYear);

  return (
    <View>
      {/* Live impact banner */}
      <View style={{ backgroundColor: color + "11", borderColor: color + "33", borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 14, flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        <View style={{ flex: 1, minWidth: 100 }}>
          <Text style={{ fontSize: 9, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>CUSTO EXTRA DESIGN</Text>
          <Text style={{ fontSize: 14, fontFamily: "Inter_700Bold", color: "#EC4899" }}>+${totalExtraCost}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 80 }}>
          <Text style={{ fontSize: 9, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>MULT. VENDAS</Text>
          <Text style={{ fontSize: 14, fontFamily: "Inter_700Bold", color: "#10B981" }}>×{dStats.salesMult.toFixed(2)}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 80 }}>
          <Text style={{ fontSize: 9, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>REP. LANÇAM.</Text>
          <Text style={{ fontSize: 14, fontFamily: "Inter_700Bold", color: "#4DA6FF" }}>+{dStats.repBonus}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 80 }}>
          <Text style={{ fontSize: 9, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>FÃS LANÇAM.</Text>
          <Text style={{ fontSize: 14, fontFamily: "Inter_700Bold", color: "#F5A623" }}>+{dStats.fanBoost.toLocaleString()}</Text>
        </View>
      </View>

      <DesignSection
        title="A. Modelo de Caixa" icon="monitor" color="#4DA6FF"
        options={availCaseModels as any}
        selectedId={designConfig.caseModel}
        onSelect={(v) => update("caseModel", v as CaseModel)}
        colors={colors}
      />
      <DesignSection
        title="B. Material" icon="box" color="#10B981"
        options={availMaterials as any}
        selectedId={designConfig.material}
        onSelect={(v) => update("material", v as CaseMaterial)}
        colors={colors}
      />
      <DesignSection
        title="C. Cor & Estilo Visual" icon="droplet" color="#EC4899"
        options={availColors as any}
        selectedId={designConfig.colorStyle}
        onSelect={(v) => update("colorStyle", v as ConsoleColorStyle)}
        colors={colors}
      />
      <DesignSection
        title="D. Nº de Controles no Bundle" icon="users" color="#F5A623"
        options={availCtrlCounts as any}
        selectedId={designConfig.controllerCount}
        onSelect={(v) => update("controllerCount", Number(v) as ConsoleControllerBundle)}
        colors={colors}
      />
      <DesignSection
        title="E. Bundle de Jogos" icon="play" color="#A855F7"
        options={availBundles as any}
        selectedId={designConfig.bundleGames}
        onSelect={(v) => update("bundleGames", v as BundleGames)}
        colors={colors}
      />
      <DesignSection
        title="F. Licença de Jogos Terceiros" icon="link" color="#EF4444"
        options={availLicenses as any}
        selectedId={designConfig.licensedBundle}
        onSelect={(v) => update("licensedBundle", v as LicensedBundle)}
        colors={colors}
      />
      <DesignSection
        title="G. Estilo de Design" icon="feather" color="#8B5CF6"
        options={availDesignStyles as any}
        selectedId={designConfig.designStyle}
        onSelect={(v) => update("designStyle", v as ConsoleDesignStyle)}
        colors={colors}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  eraBanner: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1 },
  eraBannerText: { flex: 1, fontSize: 12, fontFamily: "Inter_600SemiBold" },
  eraBannerCost: { fontSize: 11, fontFamily: "Inter_700Bold" },
  progressTrack: { height: 3 },
  progressFill: { height: "100%", borderRadius: 2 },
  stepDots: { flexGrow: 0 },
  stepDotsContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 4, flexDirection: "row" },
  stepDot: { alignItems: "center", gap: 2, minWidth: 44 },
  stepDotCircle: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  stepDotLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  scroll: { padding: 16, gap: 12 },
  navBar: { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1 },
  navBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 13, borderRadius: 12, borderWidth: 1 },
  navBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  navBtnPrimary: { flex: 2, borderRadius: 12, overflow: "hidden" },
  navBtnPrimaryInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13 },
  navBtnPrimaryText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff" },
  // Name step
  nameStepContent: { gap: 16 },
  nameEraCard: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 16, borderWidth: 1 },
  nameEraTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  nameEraSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  nameLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, textTransform: "uppercase" },
  nameInput: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 14 },
  nameInputText: { flex: 1, fontSize: 16, fontFamily: "Inter_400Regular" },
  nameHint: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  // Component picker
  pickerContainer: { gap: 8 },
  pickerTitle: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 4 },
  pickerBadge: { flexDirection: "row", alignItems: "center", gap: 6, padding: 8, borderRadius: 10, borderWidth: 1, marginBottom: 4 },
  pickerBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  optCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8, overflow: "hidden" },
  optCardLocked: { flexDirection: "row", alignItems: "center", gap: 10, opacity: 0.55 },
  optCardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  optColorDot: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  optName: { fontSize: 13, fontFamily: "Inter_700Bold", marginBottom: 1 },
  optRef: { fontSize: 11, fontFamily: "Inter_400Regular" },
  optCost: { fontSize: 13, fontFamily: "Inter_700Bold" },
  optStats: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optStat: { gap: 1 },
  optStatLabel: { fontSize: 10, fontFamily: "Inter_400Regular", textTransform: "uppercase" },
  optStatValue: { fontSize: 12, fontFamily: "Inter_700Bold" },
  lockedHeader: { fontSize: 11, fontFamily: "Inter_600SemiBold", marginTop: 8 },
  // Console Library
  emptyBox: { borderRadius: 18, borderWidth: 1, padding: 28, alignItems: "center", gap: 12, marginTop: 20 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptyDesc: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  consoleCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12, gap: 10, overflow: "hidden" },
  consoleCardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  consoleCardIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  consoleCardMeta: { flex: 1 },
  consoleCardName: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 2 },
  consoleCardSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  consoleCardStats: { alignItems: "flex-end" },
  consoleRating: { fontSize: 16, fontFamily: "Inter_700Bold" },
  consolePop: { fontSize: 11, fontFamily: "Inter_400Regular" },
  consoleReceptionRow: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7 },
  starRow: { flexDirection: "row", gap: 2 },
  sentiBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  sentiText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  receptionScore: { fontSize: 12, fontFamily: "Inter_700Bold", marginLeft: "auto" },
  receptionComment: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16, fontStyle: "italic" },
  consoleRevRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  consoleRevLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  consoleRevVal: { fontSize: 12, fontFamily: "Inter_700Bold" },
  fab: { borderTopWidth: 0 },
  fabBtn: { borderRadius: 14, overflow: "hidden" },
  fabBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15, paddingHorizontal: 24 },
  fabBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
  // Reception Modal
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end", alignItems: "center" },
  receptionSheet: { width: "100%", borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, padding: 28, gap: 14 },
  recBanner: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  recBannerText: { fontSize: 13, fontFamily: "Inter_700Bold", letterSpacing: 1.5 },
  recConsoleName: { fontSize: 22, fontFamily: "Inter_700Bold", lineHeight: 28 },
  recStarRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  recScoreBadge: { marginLeft: "auto", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, flexDirection: "row", alignItems: "baseline", gap: 2 },
  recScoreNum: { fontSize: 22, fontFamily: "Inter_700Bold" },
  recScoreDen: { fontSize: 13, fontFamily: "Inter_400Regular" },
  recSentiBadge: { alignSelf: "flex-start", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  recSentiText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  recCommentBox: { borderRadius: 12, borderWidth: 1, padding: 14 },
  recCommentText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20, fontStyle: "italic" },
  recBtn: { borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 4 },
  recBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
  // Review
  reviewContent: { gap: 12 },
  ratingPreview: { flexDirection: "row", alignItems: "center", gap: 16, padding: 20, borderRadius: 18, borderWidth: 1, overflow: "hidden" },
  ratingBig: { alignItems: "center" },
  ratingBigScore: { fontSize: 44, fontFamily: "Inter_700Bold" },
  ratingBigLabel: { fontSize: 16, fontFamily: "Inter_400Regular", marginTop: -6 },
  ratingTitle: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 2 },
  ratingPerf: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  ratingAppeal: { fontSize: 11, fontFamily: "Inter_400Regular" },
  alertCard: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10, borderWidth: 1 },
  alertText: { flex: 1, fontSize: 12, fontFamily: "Inter_500Medium" },
  compSummary: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 0 },
  compSummaryTitle: { fontSize: 14, fontFamily: "Inter_700Bold", marginBottom: 8 },
  compRow: { flexDirection: "row", paddingVertical: 7, borderTopWidth: 1 },
  compRowLabel: { width: 60, fontSize: 11, fontFamily: "Inter_400Regular" },
  compRowValue: { flex: 1, fontSize: 11, fontFamily: "Inter_500Medium" },
  compRowCost: { fontSize: 11, fontFamily: "Inter_700Bold" },
  priceBox: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  priceBoxTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  priceBoxHint: { fontSize: 11, fontFamily: "Inter_400Regular" },
  priceInput: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  priceSymbol: { fontSize: 18, fontFamily: "Inter_700Bold" },
  priceInputText: { flex: 1, fontSize: 18, fontFamily: "Inter_400Regular" },
  buildCostBox: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  buildCostLabel: { fontSize: 12, fontFamily: "Inter_700Bold", marginBottom: 2 },
  buildCostValue: { fontSize: 11, fontFamily: "Inter_400Regular" },
  // Controller attribute picker
  ctrlSummaryRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: 12, borderWidth: 1, marginBottom: 8, flexWrap: "wrap" },
  ctrlSummaryLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  ctrlSummaryVal: { fontSize: 12, fontFamily: "Inter_700Bold", marginRight: 4 },
  ctrlRow: { marginBottom: 12 },
  ctrlRowHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  ctrlRowLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  ctrlRowOptions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  ctrlOptCard: { borderRadius: 12, borderWidth: 1.5, padding: 10, minWidth: 110, maxWidth: 180, flex: 1 },
  ctrlOptCheck: { width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center", position: "absolute", top: 6, right: 6 },
  ctrlOptLabel: { fontSize: 12, fontFamily: "Inter_700Bold", marginBottom: 3, paddingRight: 20 },
  ctrlOptDesc: { fontSize: 10, fontFamily: "Inter_400Regular", lineHeight: 14, marginBottom: 4 },
  ctrlOptStats: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  ctrlOptStat: { fontSize: 10, fontFamily: "Inter_600SemiBold", paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5, overflow: "hidden" as const },
  // Export step
  exportInfoBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  exportInfoText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  exportRegionCard: { borderRadius: 14, borderWidth: 1, padding: 12, gap: 10, marginTop: 8 },
  exportRegionHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  exportRegionBadge: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  exportRegionInfo: { flex: 1, gap: 4 },
  exportRegionName: { fontSize: 14, fontFamily: "Inter_700Bold" },
  exportBlockReason: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16 },
  exportMetaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  exportBranchTag: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  exportBranchTagText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  exportEstRev: { fontSize: 11, fontFamily: "Inter_700Bold" },
  exportTierRow: { flexDirection: "row", gap: 6 },
  exportTierBtn: { borderRadius: 9, borderWidth: 1, paddingVertical: 7, paddingHorizontal: 8, alignItems: "center", gap: 2 },
  exportTierBtnText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  exportTierCost: { fontSize: 10, fontFamily: "Inter_400Regular" },
  exportTotalBox: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderRadius: 12, borderWidth: 1, padding: 12, marginTop: 10 },
  exportTotalLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  exportTotalVal: { fontSize: 16, fontFamily: "Inter_700Bold" },
});
