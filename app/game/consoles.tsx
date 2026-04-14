import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform,
  Modal, TextInput, Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useGameplay } from "@/context/GameplayContext";
import { GridBackground } from "@/components/GridBackground";
import { ScreenHeader } from "@/components/ScreenHeader";
import { formatMoney } from "@/constants/gameEconomics";
import { GameConsole } from "@/constants/gameEngine";
import { CONSOLE_CATEGORY_PRICING } from "@/constants/consoleComponents";

function safeNum(v: number | undefined | null, fallback = 0): number {
  if (v == null || !isFinite(v) || isNaN(v)) return fallback;
  return v;
}

function formatMemory(memoryGB: number): string {
  const gb = safeNum(memoryGB, 0);
  if (gb === 0) return "N/D";
  if (gb >= 1) return `${gb % 1 === 0 ? gb : gb.toFixed(1)} GB`;
  const mb = gb * 1024;
  if (mb >= 1) return `${mb % 1 === 0 ? mb : mb.toFixed(0)} MB`;
  const kb = mb * 1024;
  if (kb >= 1) return `${kb % 1 === 0 ? kb : kb.toFixed(0)} KB`;
  return `${(kb * 1024).toFixed(0)} B`;
}

function RatingBar({ value, colors }: { value: number; colors: any }) {
  const safe = safeNum(value, 5);
  const color = safe >= 8 ? "#10B981" : safe >= 6 ? "#4DA6FF" : safe >= 4 ? "#F5A623" : "#FF4D6A";
  return (
    <View style={styles.ratingBarWrap}>
      <View style={[styles.ratingBarTrack, { backgroundColor: colors.border }]}>
        <View style={[styles.ratingBarFill, { width: `${Math.min(100, safe * 10)}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.ratingBarLabel, { color }]}>{safe.toFixed(1)}</Text>
    </View>
  );
}

function StatChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.statChip, { backgroundColor: color + "18", borderColor: color + "44" }]}>
      <Text style={[styles.statValue, { color }]} numberOfLines={1}>{value}</Text>
      <Text style={[styles.statLabel, { color: color + "BB" }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

type DetailSection = "visao_geral" | "melhorias" | "estrategia";

const SECTIONS: { id: DetailSection; label: string; icon: string }[] = [
  { id: "visao_geral", label: "Visão Geral", icon: "bar-chart-2" },
  { id: "melhorias",   label: "Melhorias",   icon: "trending-up" },
  { id: "estrategia",  label: "Estratégia",  icon: "target" },
];

function ConsoleDetailModal({
  console: c,
  visible,
  onClose,
  colors,
}: {
  console: GameConsole;
  visible: boolean;
  onClose: () => void;
  colors: any;
}) {
  const { updateConsolePrice, setConsolePricingStrategy, relaunchConsole, setConsoleProductionState, discontinueConsole } = useGameplay();
  const [section, setSection] = useState<DetailSection>("visao_geral");
  const [priceInput, setPriceInput] = useState(String(c.price ?? 0));
  const [priceError, setPriceError] = useState<string | null>(null);

  const rating       = safeNum(c.rating, 5);
  const quality      = safeNum(c.quality, 5);
  const popularity   = safeNum(c.popularity, 0);
  const unitsSold    = safeNum(c.unitsSold, 0);
  const totalRevenue = safeNum(c.totalRevenue, 0);
  const productionCost = safeNum(c.productionCost, 0);
  const price        = safeNum(c.price, 0);
  const suggestedPrice = c.suggestedPrice ?? Math.round(productionCost * 3.5);
  const relaunchCount = c.relaunchCount ?? 0;
  const ratingColor  = rating >= 8 ? "#10B981" : rating >= 6 ? "#4DA6FF" : rating >= 4 ? "#F5A623" : "#FF4D6A";
  const powerLabel   = c.power === "high" ? "Alto Desempenho" : c.power === "medium" ? "Médio" : "Básico";
  const powerColor   = c.power === "high" ? "#FF4D6A" : c.power === "medium" ? "#4DA6FF" : "#10B981";
  const relaunchCost = Math.max(50_000, productionCost * 20);
  const hasRelaunchBoost = (c.relaunchBonusMonthsLeft ?? 0) > 0;
  const pricePct     = suggestedPrice > 0 ? Math.round((price / suggestedPrice) * 100) : 100;
  const isPricedOver = price > suggestedPrice;
  const isLowQuality = quality < 5;

  function handlePriceConfirm() {
    const num = parseInt(priceInput, 10);
    if (isNaN(num)) { setPriceError("Insere um número válido"); return; }
    const err = updateConsolePrice(c.id, num);
    if (err) { setPriceError(err); return; }
    setPriceError(null);
  }

  function handleRelaunch() {
    Alert.alert(
      "Relançar Console",
      `Custo: ${formatMoney(relaunchCost)}\n\nIsso reiniciará o interesse público e aplicará +30% às vendas por 6 meses.\n\nRelançamentos restantes: ${3 - relaunchCount}`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Relançar",
          onPress: () => {
            const err = relaunchConsole(c.id);
            if (err) Alert.alert("Erro", err);
          },
        },
      ]
    );
  }

  function handleDiscontinue() {
    Alert.alert(
      "Descontinuar Console",
      `Tens a certeza que queres descontinuar "${c.name}"? Este console deixará de vender e não pode ser reativado.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Descontinuar",
          style: "destructive",
          onPress: () => { discontinueConsole(c.id); onClose(); },
        },
      ]
    );
  }

  const renderOverview = () => (
    <ScrollView style={styles.sectionContent} showsVerticalScrollIndicator={false}>
      <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.consoleIcon, { backgroundColor: ratingColor + "22" }]}>
            <Feather name="monitor" size={22} color={ratingColor} />
          </View>
          <View style={styles.cardMeta}>
            <Text style={[styles.consoleName, { color: colors.foreground }]}>{c.name}</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: powerColor + "22" }]}>
                <Text style={[styles.badgeText, { color: powerColor }]}>{powerLabel}</Text>
              </View>
              {c.category && (() => {
                const catDef = CONSOLE_CATEGORY_PRICING.find((x) => x.id === c.category);
                if (!catDef) return null;
                return (
                  <View style={[styles.badge, { backgroundColor: catDef.color + "22" }]}>
                    <Text style={[styles.badgeText, { color: catDef.color }]}>{catDef.label}</Text>
                  </View>
                );
              })()}
              {c.isProductionPaused && (
                <View style={[styles.badge, { backgroundColor: "#F5A62322" }]}>
                  <Text style={[styles.badgeText, { color: "#F5A623" }]}>Pausado</Text>
                </View>
              )}
              {hasRelaunchBoost && (
                <View style={[styles.badge, { backgroundColor: "#A855F722" }]}>
                  <Text style={[styles.badgeText, { color: "#A855F7" }]}>🚀 Boost ativo</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.detailCardTitle, { color: colors.mutedForeground }]}>AVALIAÇÃO</Text>
        <RatingBar value={rating} colors={colors} />
        <View style={styles.extraRow}>
          <View style={styles.extraItem}>
            <Text style={[styles.extraLabel, { color: colors.mutedForeground }]}>Qualidade</Text>
            <View style={[styles.extraBar, { backgroundColor: colors.border }]}>
              <View style={[styles.extraFill, { width: `${Math.min(100, quality * 10)}%`, backgroundColor: "#A855F7" }]} />
            </View>
            <Text style={[styles.extraLabelSm, { color: colors.mutedForeground }]}>{quality.toFixed(1)}/10</Text>
          </View>
          <View style={styles.extraItem}>
            <Text style={[styles.extraLabel, { color: colors.mutedForeground }]}>Popularidade</Text>
            <View style={[styles.extraBar, { backgroundColor: colors.border }]}>
              <View style={[styles.extraFill, { width: `${Math.min(100, popularity)}%`, backgroundColor: "#F5A623" }]} />
            </View>
            <Text style={[styles.extraLabelSm, { color: colors.mutedForeground }]}>{popularity.toFixed(0)}%</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatChip label="Vendas" value={unitsSold.toLocaleString()} color="#A855F7" />
        <StatChip label="Receita" value={formatMoney(totalRevenue)} color="#10B981" />
        <StatChip label="Preço" value={`$${price}`} color="#4DA6FF" />
        <StatChip label="Memória" value={formatMemory(c.memoryGB)} color="#F5A623" />
      </View>

      <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.detailCardTitle, { color: colors.mutedForeground }]}>FINANCEIRO</Text>
        <View style={styles.finRow}>
          <Text style={[styles.finLabel, { color: colors.mutedForeground }]}>Custo de Produção</Text>
          <Text style={[styles.finValue, { color: colors.foreground }]}>{formatMoney(productionCost)}</Text>
        </View>
        <View style={styles.finRow}>
          <Text style={[styles.finLabel, { color: colors.mutedForeground }]}>Preço de Venda</Text>
          <Text style={[styles.finValue, { color: "#4DA6FF" }]}>${price}</Text>
        </View>
        <View style={styles.finRow}>
          <Text style={[styles.finLabel, { color: colors.mutedForeground }]}>Preço Sugerido</Text>
          <Text style={[styles.finValue, { color: "#10B981" }]}>${suggestedPrice}</Text>
        </View>
        {productionCost > 0 && price > 0 && (
          <View style={styles.finRow}>
            <Text style={[styles.finLabel, { color: colors.mutedForeground }]}>Margem</Text>
            <Text style={[styles.finValue, { color: ((price - productionCost) / price) >= 0 ? "#10B981" : "#FF4D6A" }]}>
              {Math.round(((price - productionCost) / price) * 100)}%
            </Text>
          </View>
        )}
        <Text style={[styles.launchYear, { color: colors.mutedForeground, marginTop: 8 }]}>
          Lançado em {c.launchYear}
        </Text>
      </View>
    </ScrollView>
  );

  const renderMelhorias = () => (
    <ScrollView style={styles.sectionContent} showsVerticalScrollIndicator={false}>
      <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.detailCardTitle, { color: colors.mutedForeground }]}>ESTADO ATUAL</Text>
        <View style={styles.finRow}>
          <Text style={[styles.finLabel, { color: colors.mutedForeground }]}>Rating</Text>
          <Text style={[styles.finValue, { color: ratingColor }]}>{rating.toFixed(1)}/10</Text>
        </View>
        <View style={styles.finRow}>
          <Text style={[styles.finLabel, { color: colors.mutedForeground }]}>Qualidade</Text>
          <Text style={[styles.finValue, { color: "#A855F7" }]}>{quality.toFixed(1)}/10</Text>
        </View>
        <View style={styles.finRow}>
          <Text style={[styles.finLabel, { color: colors.mutedForeground }]}>Popularidade</Text>
          <Text style={[styles.finValue, { color: "#F5A623" }]}>{popularity.toFixed(0)}%</Text>
        </View>
      </View>

      <View style={[styles.detailCard, { backgroundColor: "#4DA6FF11", borderColor: "#4DA6FF33" }]}>
        <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
          <Feather name="info" size={16} color="#4DA6FF" />
          <Text style={[styles.infoText, { color: colors.foreground }]}>
            A qualidade de hardware é determinada durante o desenvolvimento. Para construir consoles de melhor qualidade, investe no departamento de{" "}
            <Text style={{ color: "#4DA6FF", fontFamily: "Inter_700Bold" }}>Tecnologia</Text> e em nós de{" "}
            <Text style={{ color: "#4DA6FF", fontFamily: "Inter_700Bold" }}>Pesquisa de Hardware</Text>.
          </Text>
        </View>
      </View>

      <View style={[styles.detailCard, { backgroundColor: "#A855F711", borderColor: "#A855F733" }]}>
        <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
          <Feather name="trending-up" size={16} color="#A855F7" />
          <Text style={[styles.infoText, { color: colors.foreground }]}>
            O rating melhora gradualmente com o tempo se a empresa mantiver boa reputação. Investe no departamento de{" "}
            <Text style={{ color: "#A855F7", fontFamily: "Inter_700Bold" }}>Pesquisa</Text> para acelerar a melhoria de rating.
          </Text>
        </View>
      </View>

      <View style={[styles.detailCard, { backgroundColor: "#10B98111", borderColor: "#10B98133" }]}>
        <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
          <Feather name="users" size={16} color="#10B981" />
          <Text style={[styles.infoText, { color: colors.foreground }]}>
            A popularidade cresce organicamente com as vendas. Campanhas de{" "}
            <Text style={{ color: "#10B981", fontFamily: "Inter_700Bold" }}>Marketing</Text> podem dar um impulso significativo à visibilidade do console.
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderSection = () => {
    switch (section) {
      case "visao_geral": return renderOverview();
      case "melhorias":   return renderMelhorias();
      case "estrategia":  return renderEstrategiaFull();
    }
  };

  const renderEstrategiaFull = () => {
    const strategies: { id: "premium" | "budget" | "balanced"; label: string; desc: string; color: string; icon: string }[] = [
      {
        id: "premium",
        label: "Premium",
        desc: "Posicionamento de alto valor. Penalidade de sobrepreço começa apenas em qualidade < 40%. Ideal para hardware de alta qualidade.",
        color: "#FF4D6A",
        icon: "award",
      },
      {
        id: "balanced",
        label: "Equilibrado",
        desc: "Estratégia padrão. Equilíbrio entre preço e volume. Recomendado para a maioria dos consoles.",
        color: "#4DA6FF",
        icon: "sliders",
      },
      {
        id: "budget",
        label: "Volume",
        desc: "Foco em quantidade. Desconto de preço gera até +40% de volume. Melhor para hardware de qualidade média.",
        color: "#10B981",
        icon: "package",
      },
    ];
    const current = c.pricingStrategy ?? "balanced";

    const minP = Math.max(1, productionCost + 1);
    const maxP = suggestedPrice + 200;
    const priceDiff = price - suggestedPrice;
    const priceStatus = isPricedOver
      ? { label: `$${priceDiff} acima do sugerido (${pricePct}%)`, color: "#FF4D6A" }
      : price === suggestedPrice
      ? { label: "No preço sugerido", color: "#10B981" }
      : { label: `$${Math.abs(priceDiff)} abaixo do sugerido (${pricePct}%)`, color: "#F5A623" };

    return (
      <ScrollView style={styles.sectionContent} showsVerticalScrollIndicator={false}>

        {/* ── Posicionamento de Mercado ── */}
        <View style={styles.estrategiaGroupHeader}>
          <Feather name="target" size={13} color="#4DA6FF" />
          <Text style={[styles.estrategiaGroupLabel, { color: "#4DA6FF" }]}>POSICIONAMENTO DE MERCADO</Text>
        </View>

        <View style={[styles.detailCard, { backgroundColor: "#4DA6FF11", borderColor: "#4DA6FF33" }]}>
          <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
            <Feather name="info" size={16} color="#4DA6FF" />
            <Text style={[styles.infoText, { color: colors.foreground }]}>
              A estratégia de posicionamento afeta como o preço interage com a qualidade nas vendas mensais.
            </Text>
          </View>
        </View>

        {strategies.map((s) => {
          const isActive = current === s.id;
          return (
            <TouchableOpacity
              key={s.id}
              onPress={() => setConsolePricingStrategy(c.id, s.id)}
              style={[
                styles.strategyCard,
                {
                  backgroundColor: isActive ? s.color + "22" : colors.card,
                  borderColor: isActive ? s.color : colors.border,
                },
              ]}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={[styles.strategyIcon, { backgroundColor: s.color + "22" }]}>
                  <Feather name={s.icon as any} size={18} color={s.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={[styles.strategyLabel, { color: isActive ? s.color : colors.foreground }]}>{s.label}</Text>
                    {isActive && (
                      <View style={[styles.badge, { backgroundColor: s.color + "22" }]}>
                        <Text style={[styles.badgeText, { color: s.color }]}>Ativo</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.strategyDesc, { color: colors.mutedForeground }]}>{s.desc}</Text>
                </View>
                {isActive && <Feather name="check-circle" size={18} color={s.color} />}
              </View>
            </TouchableOpacity>
          );
        })}

        {/* ── Preço de Venda ── */}
        <View style={[styles.estrategiaGroupHeader, { marginTop: 6 }]}>
          <Feather name="dollar-sign" size={13} color="#10B981" />
          <Text style={[styles.estrategiaGroupLabel, { color: "#10B981" }]}>PREÇO DE VENDA</Text>
        </View>

        <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.detailCardTitle, { color: colors.mutedForeground }]}>PREÇO ATUAL</Text>
          <View style={styles.finRow}>
            <Text style={[styles.finLabel, { color: colors.mutedForeground }]}>Preço de venda</Text>
            <Text style={[styles.finValue, { color: "#4DA6FF" }]}>${price}</Text>
          </View>
          <View style={styles.finRow}>
            <Text style={[styles.finLabel, { color: colors.mutedForeground }]}>Preço sugerido</Text>
            <Text style={[styles.finValue, { color: "#10B981" }]}>${suggestedPrice}</Text>
          </View>
          <View style={styles.finRow}>
            <Text style={[styles.finLabel, { color: colors.mutedForeground }]}>Posição</Text>
            <Text style={[styles.finValue, { color: priceStatus.color }]}>{priceStatus.label}</Text>
          </View>
          <View style={styles.finRow}>
            <Text style={[styles.finLabel, { color: colors.mutedForeground }]}>Intervalo válido</Text>
            <Text style={[styles.finValue, { color: colors.mutedForeground }]}>${minP} – ${maxP}</Text>
          </View>
        </View>

        {isPricedOver && isLowQuality && (
          <View style={[styles.detailCard, { backgroundColor: "#FF4D6A11", borderColor: "#FF4D6A33" }]}>
            <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
              <Feather name="alert-triangle" size={16} color="#FF4D6A" />
              <Text style={[styles.infoText, { color: "#FF4D6A" }]}>
                Atenção: Preço acima do sugerido com qualidade baixa ({"<"}5) resulta em penalidade severa de vendas.
                Considera reduzir o preço ou aguardar uma melhora de qualidade.
              </Text>
            </View>
          </View>
        )}

        <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.detailCardTitle, { color: colors.mutedForeground }]}>ALTERAR PREÇO</Text>
          <View style={styles.priceInputRow}>
            <TouchableOpacity
              onPress={() => setPriceInput(String(Math.max(minP, (parseInt(priceInput, 10) || price) - 10)))}
              style={[styles.priceBtn, { backgroundColor: "#FF4D6A22", borderColor: "#FF4D6A44" }]}
            >
              <Feather name="minus" size={18} color="#FF4D6A" />
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: "center" }}>
              <TextInput
                value={priceInput}
                onChangeText={setPriceInput}
                keyboardType="number-pad"
                style={[styles.priceTextInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                maxLength={7}
              />
            </View>
            <TouchableOpacity
              onPress={() => setPriceInput(String(Math.min(maxP, (parseInt(priceInput, 10) || price) + 10)))}
              style={[styles.priceBtn, { backgroundColor: "#10B98122", borderColor: "#10B98144" }]}
            >
              <Feather name="plus" size={18} color="#10B981" />
            </TouchableOpacity>
          </View>
          {priceError && (
            <Text style={[styles.errorText, { color: "#FF4D6A" }]}>{priceError}</Text>
          )}
          <TouchableOpacity
            onPress={handlePriceConfirm}
            style={[styles.actionBtn, { backgroundColor: "#4DA6FF", marginTop: 8 }]}
            activeOpacity={0.8}
          >
            <Feather name="check" size={16} color="#fff" />
            <Text style={[styles.actionBtnText, { color: "#fff" }]}>Confirmar Preço</Text>
          </TouchableOpacity>
        </View>

        {/* ── Relançamento ── */}
        <View style={[styles.estrategiaGroupHeader, { marginTop: 6 }]}>
          <Feather name="refresh-cw" size={13} color="#A855F7" />
          <Text style={[styles.estrategiaGroupLabel, { color: "#A855F7" }]}>RELANÇAMENTO</Text>
        </View>

        {hasRelaunchBoost && (
          <View style={[styles.detailCard, { backgroundColor: "#A855F722", borderColor: "#A855F755" }]}>
            <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
              <Feather name="zap" size={18} color="#A855F7" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.detailCardTitle, { color: "#A855F7" }]}>BOOST DE RELANÇAMENTO ATIVO</Text>
                <Text style={[styles.infoText, { color: colors.foreground, marginTop: 4 }]}>
                  +30% de vendas ativo por mais{" "}
                  <Text style={{ color: "#A855F7", fontFamily: "Inter_700Bold" }}>
                    {c.relaunchBonusMonthsLeft} {c.relaunchBonusMonthsLeft === 1 ? "mês" : "meses"}
                  </Text>
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.detailCardTitle, { color: colors.mutedForeground }]}>SOBRE O RELANÇAMENTO</Text>
          <Text style={[styles.infoText, { color: colors.foreground, marginBottom: 12 }]}>
            Relançar um console reinicia o interesse público e aplica um boost de{" "}
            <Text style={{ color: "#A855F7", fontFamily: "Inter_700Bold" }}>+30% às vendas por 6 meses</Text>.
            Ideal para consoles com vendas em queda.
          </Text>
          <View style={styles.finRow}>
            <Text style={[styles.finLabel, { color: colors.mutedForeground }]}>Custo</Text>
            <Text style={[styles.finValue, { color: "#FF4D6A" }]}>{formatMoney(relaunchCost)}</Text>
          </View>
          <View style={styles.finRow}>
            <Text style={[styles.finLabel, { color: colors.mutedForeground }]}>Relançamentos usados</Text>
            <Text style={[styles.finValue, { color: relaunchCount >= 3 ? "#FF4D6A" : colors.foreground }]}>
              {relaunchCount}/3
            </Text>
          </View>
          <View style={styles.finRow}>
            <Text style={[styles.finLabel, { color: colors.mutedForeground }]}>Efeito</Text>
            <Text style={[styles.finValue, { color: "#A855F7" }]}>+30% vendas · 6 meses</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleRelaunch}
          disabled={relaunchCount >= 3 || hasRelaunchBoost}
          style={[
            styles.actionBtn,
            { backgroundColor: relaunchCount >= 3 || hasRelaunchBoost ? "#A855F733" : "#A855F7" },
          ]}
          activeOpacity={0.8}
        >
          <Feather name="refresh-cw" size={16} color={relaunchCount >= 3 || hasRelaunchBoost ? "#A855F7" : "#fff"} />
          <Text style={[styles.actionBtnText, { color: relaunchCount >= 3 || hasRelaunchBoost ? "#A855F7" : "#fff" }]}>
            {hasRelaunchBoost ? "Boost já ativo" : relaunchCount >= 3 ? "Limite atingido" : "Relançar Console"}
          </Text>
        </TouchableOpacity>

        {/* ── Produção ── */}
        <View style={[styles.estrategiaGroupHeader, { marginTop: 6 }]}>
          <Feather name="settings" size={13} color="#F5A623" />
          <Text style={[styles.estrategiaGroupLabel, { color: "#F5A623" }]}>PRODUÇÃO</Text>
        </View>

        <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.detailCardTitle, { color: colors.mutedForeground }]}>ESTADO DA PRODUÇÃO</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <View style={[styles.statusDot, { backgroundColor: c.isProductionPaused ? "#F5A623" : "#10B981" }]} />
            <Text style={[styles.infoText, { color: colors.foreground }]}>
              {c.isProductionPaused ? "Produção pausada — sem vendas nem receita" : "Produção ativa — vendas a decorrer"}
            </Text>
          </View>
          {c.isProductionPaused ? (
            <TouchableOpacity
              onPress={() => setConsoleProductionState(c.id, false)}
              style={[styles.actionBtn, { backgroundColor: "#10B981" }]}
              activeOpacity={0.8}
            >
              <Feather name="play" size={16} color="#fff" />
              <Text style={[styles.actionBtnText, { color: "#fff" }]}>Retomar Produção</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => setConsoleProductionState(c.id, true)}
              style={[styles.actionBtn, { backgroundColor: "#F5A623" }]}
              activeOpacity={0.8}
            >
              <Feather name="pause" size={16} color="#fff" />
              <Text style={[styles.actionBtnText, { color: "#fff" }]}>Pausar Produção</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.detailCard, { backgroundColor: "#F5A62311", borderColor: "#F5A62333" }]}>
          <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
            <Feather name="info" size={16} color="#F5A623" />
            <Text style={[styles.infoText, { color: colors.foreground }]}>
              Pausar a produção interrompe todas as vendas e elimina custos de manutenção deste console.
              Podes retomar a qualquer momento.
            </Text>
          </View>
        </View>

        {/* ── Zona de Perigo ── */}
        <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: "#FF4D6A44", marginBottom: 24 }]}>
          <Text style={[styles.detailCardTitle, { color: "#FF4D6A" }]}>ZONA DE PERIGO</Text>
          <Text style={[styles.infoText, { color: colors.mutedForeground, marginBottom: 12 }]}>
            Descontinuar um console é permanente. Ele deixará de vender e não pode ser reativado.
          </Text>
          <TouchableOpacity
            onPress={handleDiscontinue}
            style={[styles.actionBtn, { backgroundColor: "#FF4D6A22", borderWidth: 1, borderColor: "#FF4D6A55" }]}
            activeOpacity={0.8}
          >
            <Feather name="power" size={16} color="#FF4D6A" />
            <Text style={[styles.actionBtnText, { color: "#FF4D6A" }]}>Descontinuar Console</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        {/* Modal Header */}
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <View style={styles.modalHeaderLeft}>
            <View style={[styles.consoleIconSm, { backgroundColor: ratingColor + "22" }]}>
              <Feather name="monitor" size={16} color={ratingColor} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.foreground }]} numberOfLines={1}>{c.name}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Feather name="x" size={22} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Top Tabs + Content */}
        <View style={styles.modalBody}>
          {/* Top Tab Bar */}
          <View style={[styles.topTabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            {SECTIONS.map((s) => {
              const isActive = section === s.id;
              return (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => setSection(s.id)}
                  style={[styles.topTabItem, isActive && styles.topTabItemActive]}
                  activeOpacity={0.7}
                >
                  <Feather
                    name={s.icon as any}
                    size={14}
                    color={isActive ? "#4DA6FF" : colors.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.topTabLabel,
                      { color: isActive ? "#4DA6FF" : colors.mutedForeground },
                      isActive && { fontFamily: "Inter_700Bold" },
                    ]}
                  >
                    {s.label}
                  </Text>
                  {isActive && <View style={styles.topTabIndicator} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Section Content */}
          <View style={styles.contentArea}>
            {renderSection()}
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function ConsolesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state, discontinueConsole, cancelConsoleDev } = useGameplay();
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [selectedConsoleId, setSelectedConsoleId] = useState<string | null>(null);

  if (!state) return null;

  const inDevelopment = state.consoles.filter((c) => !!c.isInDevelopment);
  const active = state.consoles.filter((c) => !c.isDiscontinued && !c.isInDevelopment);
  const discontinued = state.consoles.filter((c) => c.isDiscontinued);
  const selectedConsole = selectedConsoleId ? state.consoles.find((c) => c.id === selectedConsoleId) ?? null : null;

  const totalAllRevenue = state.consoles.reduce(
    (s, c) => s + safeNum(c.totalRevenue, 0),
    0
  );

  const renderConsoleCard = (c: GameConsole, isActive: boolean) => {
    const rating = safeNum(c.rating, 5);
    const unitsSold = safeNum(c.unitsSold, 0);
    const totalRevenue = safeNum(c.totalRevenue, 0);
    const productionCost = safeNum(c.productionCost, 0);
    const price = safeNum(c.price, 0);
    const quality = safeNum(c.quality, 5);
    const popularity = safeNum(c.popularity, 0);
    const memoryGB = safeNum(c.memoryGB, 0);

    const ratingColor = rating >= 8 ? "#10B981" : rating >= 6 ? "#4DA6FF" : rating >= 4 ? "#F5A623" : "#FF4D6A";
    const powerLabel = c.power === "high" ? "Alto Desempenho" : c.power === "medium" ? "Médio" : "Básico";
    const powerColor = c.power === "high" ? "#FF4D6A" : c.power === "medium" ? "#4DA6FF" : "#10B981";

    const qualityPct = Math.min(100, Math.max(0, quality * 10));
    const popPct = Math.min(100, Math.max(0, popularity));
    const hasMargin = productionCost > 0 && price > 0;
    const margin = hasMargin ? Math.round(((price - productionCost) / price) * 100) : null;
    const hasRelaunchBoost = (c.relaunchBonusMonthsLeft ?? 0) > 0;

    const cardContent = (
      <View
        key={c.id}
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: isActive ? ratingColor + "55" : colors.border,
            opacity: isActive ? 1 : 0.7,
          },
        ]}
      >
        <LinearGradient
          colors={isActive ? [ratingColor + "0A", "transparent"] : ["transparent", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={[styles.consoleIcon, { backgroundColor: ratingColor + "22" }]}>
            <Feather name="monitor" size={22} color={ratingColor} />
          </View>
          <View style={styles.cardMeta}>
            <Text style={[styles.consoleName, { color: colors.foreground }]}>{c.name}</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: powerColor + "22" }]}>
                <Text style={[styles.badgeText, { color: powerColor }]}>{powerLabel}</Text>
              </View>
              {c.category && (() => {
                const catDef = CONSOLE_CATEGORY_PRICING.find((x) => x.id === c.category);
                if (!catDef) return null;
                return (
                  <View style={[styles.badge, { backgroundColor: catDef.color + "22" }]}>
                    <Text style={[styles.badgeText, { color: catDef.color }]}>{catDef.label}</Text>
                  </View>
                );
              })()}
              {!isActive && (
                <View style={[styles.badge, { backgroundColor: "#6B728022" }]}>
                  <Text style={[styles.badgeText, { color: "#6B7280" }]}>Descontinuado</Text>
                </View>
              )}
              {isActive && c.isProductionPaused && (
                <View style={[styles.badge, { backgroundColor: "#F5A62322" }]}>
                  <Text style={[styles.badgeText, { color: "#F5A623" }]}>Pausado</Text>
                </View>
              )}
              {isActive && hasRelaunchBoost && (
                <View style={[styles.badge, { backgroundColor: "#A855F722" }]}>
                  <Text style={[styles.badgeText, { color: "#A855F7" }]}>🚀 Boost</Text>
                </View>
              )}
              <Text style={[styles.launchYear, { color: colors.mutedForeground }]}>
                Lançado {c.launchYear ?? "—"}
              </Text>
            </View>
          </View>
          {isActive && (
            <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
          )}
        </View>

        {/* Rating */}
        <View style={styles.ratingSection}>
          <Text style={[styles.ratingLabel, { color: colors.mutedForeground }]}>Rating</Text>
          <RatingBar value={rating} colors={colors} />
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatChip label="Preço" value={price > 0 ? `$${price}` : "—"} color="#4DA6FF" />
          <StatChip label="Vendas" value={unitsSold.toLocaleString()} color="#A855F7" />
          <StatChip label="Receita Total" value={formatMoney(totalRevenue)} color="#10B981" />
          <StatChip label="Memória" value={formatMemory(memoryGB)} color="#F5A623" />
        </View>

        {/* Quality & Popularity */}
        <View style={styles.extraRow}>
          <View style={styles.extraItem}>
            <Text style={[styles.extraLabel, { color: colors.mutedForeground }]}>Qualidade</Text>
            <View style={[styles.extraBar, { backgroundColor: colors.border }]}>
              <View style={[styles.extraFill, { width: `${qualityPct}%`, backgroundColor: "#A855F7" }]} />
            </View>
          </View>
          <View style={styles.extraItem}>
            <Text style={[styles.extraLabel, { color: colors.mutedForeground }]}>Popularidade</Text>
            <View style={[styles.extraBar, { backgroundColor: colors.border }]}>
              <View style={[styles.extraFill, { width: `${popPct}%`, backgroundColor: "#F5A623" }]} />
            </View>
          </View>
        </View>

        {/* Cost breakdown */}
        <View style={[styles.costRow, { borderTopColor: colors.border }]}>
          <Text style={[styles.costLabel, { color: colors.mutedForeground }]}>
            {productionCost > 0 ? `Custo prod.: ${formatMoney(productionCost)} · ` : ""}
            {price > 0 ? `Preço venda: $${price}` : "Sem preço definido"}
          </Text>
          {margin !== null && (
            <Text style={[styles.marginText, { color: margin >= 0 ? "#10B981" : "#FF4D6A" }]}>
              Margem {margin}%
            </Text>
          )}
        </View>

        {/* Tap hint for active consoles */}
        {isActive && (
          <View style={[styles.tapHint, { borderTopColor: colors.border }]}>
            <Feather name="settings" size={11} color={colors.mutedForeground} />
            <Text style={[styles.tapHintText, { color: colors.mutedForeground }]}>Toca para gerir este console</Text>
          </View>
        )}
      </View>
    );

    if (isActive) {
      return (
        <TouchableOpacity key={c.id} onPress={() => setSelectedConsoleId(c.id)} activeOpacity={0.85}>
          {cardContent}
        </TouchableOpacity>
      );
    }
    return cardContent;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GridBackground />
      <ScreenHeader title="Meus Consoles" icon="monitor" color="#4DA6FF" />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary bar */}
        <View style={[styles.summaryBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: "#4DA6FF" }]}>{active.length}</Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Ativos</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: "#A855F7" }]}>
              {state.consoles.reduce((s, c) => s + safeNum(c.unitsSold, 0), 0).toLocaleString()}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Vendas totais</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: "#10B981" }]}>
              {formatMoney(totalAllRevenue)}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Receita total</Text>
          </View>
        </View>

        {/* In Development */}
        {inDevelopment.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: "#F5A623" }]} />
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>EM DESENVOLVIMENTO</Text>
            </View>
            {inDevelopment.map((c) => {
              const pct = Math.min(100, Math.max(0, c.devProgress ?? 0));
              const devTime = c.devTimeMonths ?? 18;
              const monthsDone = Math.round((pct / 100) * devTime);
              const monthsLeft = Math.max(0, devTime - monthsDone);
              const barColor = pct >= 75 ? "#10B981" : pct >= 40 ? "#4DA6FF" : "#F5A623";
              return (
                <View key={c.id} style={[styles.card, { backgroundColor: colors.card, borderColor: "#F5A62344" }]}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.consoleIcon, { backgroundColor: "#F5A62322" }]}>
                      <Feather name="tool" size={22} color="#F5A623" />
                    </View>
                    <View style={styles.cardMeta}>
                      <Text style={[styles.consoleName, { color: colors.foreground }]}>{c.name}</Text>
                      <View style={styles.badgeRow}>
                        <View style={[styles.badge, { backgroundColor: "#F5A62322" }]}>
                          <Text style={[styles.badgeText, { color: "#F5A623" }]}>Em desenvolvimento</Text>
                        </View>
                        <Text style={[styles.launchYear, { color: colors.mutedForeground }]}>
                          {monthsLeft} {monthsLeft === 1 ? "mês restante" : "meses restantes"}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Progress bar */}
                  <View style={{ gap: 6 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <Text style={[styles.extraLabel, { color: colors.mutedForeground }]}>Progresso</Text>
                      <Text style={[styles.extraLabel, { color: barColor, fontFamily: "Inter_700Bold" }]}>{Math.round(pct)}%</Text>
                    </View>
                    <View style={[styles.extraBar, { backgroundColor: colors.border, height: 8, borderRadius: 4 }]}>
                      <View style={[styles.extraFill, { width: `${pct}%`, backgroundColor: barColor, height: 8, borderRadius: 4 }]} />
                    </View>
                    <Text style={[styles.costLabel, { color: colors.mutedForeground }]}>
                      {monthsDone}/{devTime} meses · Qualidade estimada: {(c.quality ?? 5).toFixed(1)}/10
                    </Text>
                  </View>

                  {/* Cancel button */}
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      onPress={() => cancelConsoleDev(c.id)}
                      style={[styles.discontinueBtn, { borderColor: "#FF4D6A44", backgroundColor: "#FF4D6A11" }]}
                      activeOpacity={0.8}
                    >
                      <Feather name="x-circle" size={13} color="#FF4D6A" />
                      <Text style={styles.discontinueBtnText}>Cancelar desenvolvimento (reembolso 50%)</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* Active Consoles */}
        {active.length > 0 ? (
          <>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: "#10B981" }]} />
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>CONSOLES ATIVOS</Text>
            </View>
            {active.map((c) => renderConsoleCard(c, true))}
          </>
        ) : inDevelopment.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="monitor" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Nenhum console ativo</Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              Cria o teu primeiro console para começar a gerar receita.
            </Text>
          </View>
        ) : null}

        {/* Discontinued */}
        {discontinued.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: "#6B7280" }]} />
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>HISTÓRICO</Text>
            </View>
            {discontinued.map((c) => renderConsoleCard(c, false))}
          </>
        )}
      </ScrollView>

      {/* FAB — Novo Console */}
      <View style={[styles.fab, { paddingBottom: botPad + 12, backgroundColor: colors.background }]}>
        <TouchableOpacity
          onPress={() => router.push("/game/console-builder")}
          style={styles.fabBtn}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={["#4DA6FF", "#1E5FAA"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.fabBtnInner}
          >
            <Feather name="plus-circle" size={18} color="#fff" />
            <Text style={styles.fabBtnText}>Novo Console</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Console Detail Modal */}
      {selectedConsole && (
        <ConsoleDetailModal
          console={selectedConsole}
          visible={!!selectedConsole}
          onClose={() => setSelectedConsoleId(null)}
          colors={colors}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, gap: 12 },
  summaryBar: {
    flexDirection: "row", borderRadius: 14, borderWidth: 1, padding: 16,
    alignItems: "center", marginBottom: 4,
  },
  summaryItem: { flex: 1, alignItems: "center", gap: 4 },
  summaryDivider: { width: 1, height: 32 },
  summaryValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
  summaryLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8, marginBottom: 4 },
  sectionDot: { width: 6, height: 6, borderRadius: 3 },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, textTransform: "uppercase" },
  card: {
    borderRadius: 16, borderWidth: 1.5, padding: 16, gap: 12, overflow: "hidden",
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  consoleIcon: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  cardMeta: { flex: 1 },
  consoleName: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 6 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  launchYear: { fontSize: 11, fontFamily: "Inter_400Regular" },
  ratingSection: { gap: 6 },
  ratingLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  ratingBarWrap: { flexDirection: "row", alignItems: "center", gap: 10 },
  ratingBarTrack: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  ratingBarFill: { height: 6, borderRadius: 3 },
  ratingBarLabel: { fontSize: 14, fontFamily: "Inter_700Bold", width: 32 },
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statChip: {
    borderRadius: 11, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 9,
    alignItems: "center", gap: 3, minWidth: 72,
  },
  statValue: { fontSize: 13, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  extraRow: { gap: 8 },
  extraItem: { gap: 5 },
  extraLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  extraLabelSm: { fontSize: 10, fontFamily: "Inter_400Regular" },
  extraBar: { height: 4, borderRadius: 2, overflow: "hidden" },
  extraFill: { height: 4, borderRadius: 2 },
  costRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingTop: 12, borderTopWidth: 1,
  },
  costLabel: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1, marginRight: 8 },
  marginText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  actionRow: { flexDirection: "row", gap: 10 },
  discontinueBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1,
  },
  discontinueBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#FF4D6A" },
  emptyCard: {
    borderRadius: 18, borderWidth: 1, padding: 36, alignItems: "center", gap: 14,
  },
  emptyTitle: { fontSize: 19, fontFamily: "Inter_700Bold" },
  emptyDesc: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 21 },
  fab: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: "#1E3A5F55",
  },
  fabBtn: { borderRadius: 14, overflow: "hidden" },
  fabBtnInner: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 16,
  },
  fabBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
  tapHint: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingTop: 10, borderTopWidth: 1, justifyContent: "center",
  },
  tapHintText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  // Modal styles
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  modalHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  modalTitle: { fontSize: 17, fontFamily: "Inter_700Bold", flex: 1 },
  consoleIconSm: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  closeBtn: { padding: 4 },
  modalBody: { flex: 1, flexDirection: "column" },
  topTabBar: {
    flexDirection: "row", borderBottomWidth: 1, paddingHorizontal: 4,
  },
  topTabItem: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 12, position: "relative",
  },
  topTabItemActive: {
    borderBottomWidth: 2, borderBottomColor: "#4DA6FF",
  },
  topTabLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  topTabIndicator: {
    position: "absolute", bottom: 0, left: 0, right: 0, height: 2,
    backgroundColor: "#4DA6FF", borderRadius: 1,
  },
  contentArea: { flex: 1 },
  estrategiaGroupHeader: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginBottom: 8, marginTop: 4, paddingHorizontal: 2,
  },
  estrategiaGroupLabel: {
    fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.8,
  },
  sectionContent: { flex: 1, padding: 14 },
  detailCard: {
    borderRadius: 14, borderWidth: 1, padding: 14, gap: 10, marginBottom: 12,
  },
  detailCardTitle: {
    fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 2,
  },
  finRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4,
  },
  finLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  finValue: { fontSize: 13, fontFamily: "Inter_700Bold" },
  infoText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20, flex: 1 },
  strategyCard: {
    borderRadius: 14, borderWidth: 1.5, padding: 14, marginBottom: 10,
  },
  strategyIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  strategyLabel: { fontSize: 15, fontFamily: "Inter_700Bold" },
  strategyDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18, marginTop: 4 },
  priceInputRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 },
  priceBtn: {
    width: 44, height: 44, borderRadius: 12, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  priceTextInput: {
    fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center",
    borderWidth: 1, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14, minWidth: 100,
  },
  errorText: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 4 },
  actionBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 12,
  },
  actionBtnText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
});
