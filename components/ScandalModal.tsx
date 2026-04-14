import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { formatMoney } from "@/constants/gameEconomics";
import type { ScandalDef, ScandalOption } from "@/constants/scandals";

// ─────────────────────────────────────────────────────────────────────────────
// RISK TAG COLORS
// ─────────────────────────────────────────────────────────────────────────────
const RISK_COLORS: Record<string, string> = {
  "RISCO ALTO":          "#E53935",
  "RISCO MÉDIO":         "#FB8C00",
  "OPÇÃO SEGURA":        "#43A047",
  "ESTRATÉGIA ARRISCADA": "#8E24AA",
  "TRANSPARÊNCIA":       "#1E88E5",
};

const SEVERITY_COLORS: Record<string, string> = {
  minor:    "#FB8C00",
  major:    "#E53935",
  critical: "#B71C1C",
};

const SEVERITY_LABELS: Record<string, string> = {
  minor:    "⚡ INCIDENTE MENOR",
  major:    "🚨 CRISE EMPRESARIAL",
  critical: "💥 CRISE CRÍTICA",
};

type Props = {
  scandal: ScandalDef;
  onRespond: (optionId: string) => void;
  canIgnore?: boolean;
};

export function ScandalModal({ scandal, onRespond, canIgnore = true }: Props) {
  const colors = useColors();
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const severityColor = SEVERITY_COLORS[scandal.severity] ?? "#E53935";

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 9, useNativeDriver: true }),
    ]).start();

    // Pulse animation for severity badge
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.00, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleConfirm = () => {
    if (!selected) return;
    setConfirmed(true);
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      onRespond(selected);
    });
  };

  const selectedOption = scandal.options.find((o) => o.id === selected);

  return (
    <Modal transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: severityColor, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* ── Header ── */}
          <View style={[styles.header, { backgroundColor: severityColor + "22", borderBottomColor: severityColor + "44" }]}>
            <Animated.View style={[styles.severityBadge, { backgroundColor: severityColor, transform: [{ scale: pulseAnim }] }]}>
              <Text style={styles.severityText}>{SEVERITY_LABELS[scandal.severity]}</Text>
            </Animated.View>
            <Text style={[styles.title, { color: colors.foreground }]}>{scandal.title}</Text>
          </View>

          {/* ── Description ── */}
          <View style={styles.descSection}>
            <Text style={[styles.description, { color: colors.mutedForeground }]}>
              {scandal.description}
            </Text>
            <View style={[styles.impactRow, { backgroundColor: severityColor + "18", borderColor: severityColor + "55" }]}>
              <Text style={styles.impactIcon}>⚠️</Text>
              <Text style={[styles.impactText, { color: severityColor }]}>
                Impacto imediato: reputação {scandal.initialRepDelta < 0 ? scandal.initialRepDelta : `+${scandal.initialRepDelta}`}
                {scandal.initialFansDelta ? `  ·  fãs ${scandal.initialFansDelta < 0 ? scandal.initialFansDelta.toLocaleString() : `+${scandal.initialFansDelta.toLocaleString()}`}` : ""}
              </Text>
            </View>
          </View>

          {/* ── Options ── */}
          <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ESCOLHE A TUA RESPOSTA:</Text>
            {scandal.options.map((opt) => {
              const isSelected = selected === opt.id;
              const riskColor = opt.riskTag ? (RISK_COLORS[opt.riskTag] ?? "#888") : "#888";
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor: isSelected ? riskColor + "22" : colors.background,
                      borderColor: isSelected ? riskColor : colors.border,
                    },
                  ]}
                  onPress={() => setSelected(opt.id)}
                  activeOpacity={0.8}
                >
                  {/* Risk tag */}
                  {opt.riskTag && (
                    <View style={[styles.riskTag, { backgroundColor: riskColor + "33", borderColor: riskColor }]}>
                      <Text style={[styles.riskTagText, { color: riskColor }]}>{opt.riskTag}</Text>
                    </View>
                  )}

                  <Text style={[styles.optionLabel, { color: isSelected ? riskColor : colors.foreground }]}>
                    {isSelected ? "▶ " : ""}{opt.label}
                  </Text>
                  <Text style={[styles.optionDesc, { color: colors.mutedForeground }]}>{opt.description}</Text>

                  {/* Effects + cost row */}
                  <View style={styles.effectsRow}>
                    {opt.cost > 0 && (
                      <View style={[styles.effectChip, { backgroundColor: "#E5393520" }]}>
                        <Text style={[styles.effectChipText, { color: "#E53935" }]}>
                          💸 −{formatMoney(opt.cost)}
                        </Text>
                      </View>
                    )}
                    {opt.cost === 0 && (
                      <View style={[styles.effectChip, { backgroundColor: "#43A04720" }]}>
                        <Text style={[styles.effectChipText, { color: "#43A047" }]}>Sem custo</Text>
                      </View>
                    )}
                    {(opt.effects.repDelta ?? 0) !== 0 && (
                      <View style={[styles.effectChip, { backgroundColor: (opt.effects.repDelta ?? 0) > 0 ? "#43A04720" : "#E5393520" }]}>
                        <Text style={[styles.effectChipText, { color: (opt.effects.repDelta ?? 0) > 0 ? "#43A047" : "#E53935" }]}>
                          Rep {(opt.effects.repDelta ?? 0) > 0 ? "+" : ""}{opt.effects.repDelta}
                        </Text>
                      </View>
                    )}
                    {(opt.effects.fansDelta ?? 0) !== 0 && (
                      <View style={[styles.effectChip, { backgroundColor: (opt.effects.fansDelta ?? 0) > 0 ? "#43A04720" : "#E5393520" }]}>
                        <Text style={[styles.effectChipText, { color: (opt.effects.fansDelta ?? 0) > 0 ? "#43A047" : "#E53935" }]}>
                          Fãs {(opt.effects.fansDelta ?? 0) > 0 ? "+" : ""}{(opt.effects.fansDelta ?? 0).toLocaleString()}
                        </Text>
                      </View>
                    )}
                    {(opt.effects.futureRepRisk ?? 0) > 0 && (
                      <View style={[styles.effectChip, { backgroundColor: "#FB8C0020" }]}>
                        <Text style={[styles.effectChipText, { color: "#FB8C00" }]}>
                          ⚠ Risco futuro
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Spacer */}
            <View style={{ height: 8 }} />
          </ScrollView>

          {/* ── Confirm / Ignore ── */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            {canIgnore && scandal.canIgnore !== false && (
              <TouchableOpacity
                style={[styles.ignoreBtn, { borderColor: colors.border }]}
                onPress={() => onRespond("__dismiss__")}
              >
                <Text style={[styles.ignoreBtnText, { color: colors.mutedForeground }]}>Decidir depois</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.confirmBtn,
                {
                  backgroundColor: selected ? (RISK_COLORS[selectedOption?.riskTag ?? ""] ?? "#4DA6FF") : "#4DA6FF55",
                  opacity: selected ? 1 : 0.5,
                },
              ]}
              onPress={handleConfirm}
              disabled={!selected || confirmed}
            >
              <Text style={styles.confirmBtnText}>
                {confirmed ? "A processar…" : selected ? `✔ Confirmar — ${selectedOption?.label ?? ""}` : "Seleciona uma opção"}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 540,
    maxHeight: "92%",
    borderRadius: 16,
    borderWidth: 2,
    overflow: "hidden",
  },
  header: {
    padding: 18,
    paddingTop: 20,
    borderBottomWidth: 1,
    gap: 10,
  },
  severityBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 8,
  },
  severityText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: 1,
  },
  title: {
    fontSize: 19,
    fontWeight: "800",
    lineHeight: 26,
  },
  descSection: {
    padding: 18,
    gap: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
  },
  impactRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 10,
  },
  impactIcon: { fontSize: 18 },
  impactText: {
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
    lineHeight: 19,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  optionsList: {
    paddingHorizontal: 16,
    maxHeight: 340,
  },
  optionCard: {
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    gap: 7,
  },
  riskTag: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 2,
  },
  riskTagText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 20,
  },
  optionDesc: {
    fontSize: 13,
    lineHeight: 19,
  },
  effectsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  effectChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
  },
  effectChipText: {
    fontSize: 11,
    fontWeight: "700",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  ignoreBtn: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  ignoreBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmBtnText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
