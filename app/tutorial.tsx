import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useLanguage } from "@/context/LanguageContext";
import { GridBackground } from "@/components/GridBackground";

const { width: W, height: H } = Dimensions.get("window");

const STEP_ICONS: (keyof typeof Feather.glyphMap)[] = [
  "trending-up",
  "dollar-sign",
  "briefcase",
  "bar-chart-2",
  "globe",
];

const STEP_COLORS = ["#4DA6FF", "#F5A623", "#7C4DFF", "#4CAF50", "#FF6B6B"];

export default function TutorialScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const [step, setStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const steps = [
    { title: t.tut1Title, body: t.tut1Body },
    { title: t.tut2Title, body: t.tut2Body },
    { title: t.tut3Title, body: t.tut3Body },
    { title: t.tut4Title, body: t.tut4Body },
    { title: t.tut5Title, body: t.tut5Body },
  ];

  const total = steps.length;
  const current = steps[step];
  const accentColor = STEP_COLORS[step];

  const fromNewGame = from === "newgame";

  const animateTransition = (nextStep: number) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
    setTimeout(() => setStep(nextStep), 150);
  };

  const handleFinish = () => {
    if (fromNewGame) {
      router.replace("/new-game");
    } else {
      router.back();
    }
  };

  const handleNext = () => {
    if (step < total - 1) animateTransition(step + 1);
    else handleFinish();
  };

  const handlePrev = () => {
    if (step > 0) animateTransition(step - 1);
  };

  const progress = (step + 1) / total;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GridBackground />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={handleFinish} style={styles.skipBtn} activeOpacity={0.7}>
          <Text style={[styles.skipText, { color: colors.mutedForeground }]}>{t.tutorialSkip}</Text>
        </TouchableOpacity>
        <View style={[styles.progressTrack, { backgroundColor: colors.secondary }]}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: `${progress * 100}%`,
                backgroundColor: accentColor,
              },
            ]}
          />
        </View>
        <Text style={[styles.stepCount, { color: colors.mutedForeground }]}>
          {step + 1}/{total}
        </Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
          {/* Step Icon */}
          <View style={[styles.iconRing, { borderColor: accentColor + "44" }]}>
            <LinearGradient
              colors={[accentColor + "33", accentColor + "11"]}
              style={styles.iconGradient}
            >
              <Feather name={STEP_ICONS[step]} size={48} color={accentColor} />
            </LinearGradient>
          </View>

          {/* Dots */}
          <View style={styles.dots}>
            {steps.map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => animateTransition(i)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor: i === step ? accentColor : colors.border,
                      width: i === step ? 20 : 8,
                    },
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.title, { color: colors.foreground }]}>{current.title}</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>{current.body}</Text>
        </Animated.View>
      </View>

      {/* Bottom Nav */}
      <View style={[styles.bottomNav, { paddingBottom: botPad + 20 }]}>
        <TouchableOpacity
          onPress={handlePrev}
          disabled={step === 0}
          style={[
            styles.prevBtn,
            {
              backgroundColor: colors.secondary,
              borderColor: colors.border,
              opacity: step === 0 ? 0.4 : 1,
            },
          ]}
          activeOpacity={0.8}
        >
          <Feather name="chevron-left" size={20} color={colors.foreground} />
          <Text style={[styles.prevText, { color: colors.foreground }]}>{t.tutorialPrev}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleNext} style={styles.nextBtnWrapper} activeOpacity={0.85}>
          <LinearGradient
            colors={[accentColor, accentColor + "CC"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.nextBtn}
          >
            <Text style={styles.nextText}>
              {step === total - 1 ? t.tutorialFinish : t.tutorialNext}
            </Text>
            <Feather
              name={step === total - 1 ? "check" : "chevron-right"}
              size={20}
              color="#070D1A"
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  skipBtn: { paddingHorizontal: 4, paddingVertical: 8 },
  skipText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: { height: 4, borderRadius: 2 },
  stepCount: { fontSize: 12, fontFamily: "Inter_600SemiBold", minWidth: 30, textAlign: "right" },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: 480,
    alignItems: "center",
  },
  iconRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
    overflow: "hidden",
  },
  iconGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  dots: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    marginBottom: 24,
  },
  dot: { height: 8, borderRadius: 4 },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 360,
  },
  bottomNav: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
  },
  prevBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  prevText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  nextBtnWrapper: { flex: 1, borderRadius: 14, overflow: "hidden" },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  nextText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#070D1A" },
});
