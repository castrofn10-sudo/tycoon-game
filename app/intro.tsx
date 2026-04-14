import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Platform,
  Dimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { GridBackground } from "@/components/GridBackground";

const { width: W } = Dimensions.get("window");

const FEATURES = [
  {
    icon: "cpu" as const,
    color: "#4DA6FF",
    title: "Pesquisa & Tecnologia",
    desc: "Desbloqueie tecnologias revolucionárias que definem décadas.",
  },
  {
    icon: "monitor" as const,
    color: "#A855F7",
    title: "Consoles & Jogos",
    desc: "Projete hardware icônico e desenvolva títulos que conquistam o mundo.",
  },
  {
    icon: "globe" as const,
    color: "#10B981",
    title: "Mercado Global",
    desc: "Expanda para 27 países com impostos, riscos e oportunidades únicas.",
  },
  {
    icon: "users" as const,
    color: "#FF4D6A",
    title: "Reputação & Fãs",
    desc: "Construa uma base de fãs leal e uma marca respeitada na indústria.",
  },
  {
    icon: "bar-chart-2" as const,
    color: "#F5A623",
    title: "Finanças & Bolsa",
    desc: "Gerencie empréstimos, venda ações e enfrente crises econômicas.",
  },
  {
    icon: "shield" as const,
    color: "#4DA6FF",
    title: "Rivais & Escândalos",
    desc: "Supere concorrentes ferozes e sobreviva a ataques de mídia.",
  },
];

export default function IntroScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, delay: 100, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, delay: 100, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GridBackground />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* ── Hero ── */}
          <View style={styles.hero}>
            <LinearGradient
              colors={["#4DA6FF18", "#A855F718", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={[styles.logoRing, { borderColor: "#4DA6FF44", backgroundColor: "#4DA6FF11" }]}>
              <Feather name="zap" size={36} color="#4DA6FF" />
            </View>
            <Text style={[styles.gameTitle, { color: colors.foreground }]}>MEGACORP</Text>
            <Text style={[styles.gameSubtitle, { color: "#4DA6FF" }]}>
              TYCOON · 1972 → ∞
            </Text>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
              Você está prestes a fundar uma empresa de tecnologia do zero.{"\n"}
              Tudo começa pequeno — um escritório, uma ideia, um sonho.
            </Text>
          </View>

          {/* ── Objective ── */}
          <View style={[styles.objectiveCard, { backgroundColor: colors.card, borderColor: "#F5A62344" }]}>
            <LinearGradient
              colors={["#F5A62310", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.objectiveHeader}>
              <View style={[styles.objectiveIcon, { backgroundColor: "#F5A62322" }]}>
                <Feather name="target" size={18} color="#F5A623" />
              </View>
              <Text style={[styles.objectiveTitle, { color: colors.foreground }]}>Seu Objetivo</Text>
            </View>
            <Text style={[styles.objectiveText, { color: colors.mutedForeground }]}>
              Transformar uma startup desconhecida em um impérito global de jogos e tecnologia.
              Tome decisões estratégicas, pesquise novas tecnologias, lance produtos revolucionários
              e supere rivais poderosos para dominar o mercado mundial.
            </Text>
            <View style={styles.objectivePills}>
              {["Pesquisar", "Lançar", "Expandir", "Dominar"].map((pill, i) => (
                <View key={i} style={[styles.pill, { backgroundColor: "#F5A62322", borderColor: "#F5A62344" }]}>
                  <Text style={[styles.pillText, { color: "#F5A623" }]}>{pill}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── How it works ── */}
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            O QUE VOCÊ VAI GERIR
          </Text>

          <View style={styles.featuresGrid}>
            {FEATURES.map((f, i) => (
              <View
                key={i}
                style={[
                  styles.featureCard,
                  { backgroundColor: colors.card, borderColor: f.color + "33" },
                ]}
              >
                <View style={[styles.featureIcon, { backgroundColor: f.color + "22" }]}>
                  <Feather name={f.icon} size={20} color={f.color} />
                </View>
                <Text style={[styles.featureTitle, { color: colors.foreground }]}>{f.title}</Text>
                <Text style={[styles.featureDesc, { color: colors.mutedForeground }]}>{f.desc}</Text>
              </View>
            ))}
          </View>

          {/* ── Progression hint ── */}
          <View style={[styles.hintCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="clock" size={16} color={colors.mutedForeground} />
            <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
              O jogo avança mês a mês — controle a velocidade e tome suas decisões estratégicas
              sem pressa. Cada era tecnológica traz novos desafios e oportunidades.
            </Text>
          </View>

          {/* ── CTA ── */}
          <TouchableOpacity
            onPress={() => router.push("/new-game")}
            activeOpacity={0.85}
            style={styles.ctaButton}
          >
            <LinearGradient
              colors={["#4DA6FF", "#2563EB"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              <Feather name="arrow-right" size={20} color="#fff" />
              <Text style={styles.ctaText}>Configurar Empresa</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            style={styles.backLink}
          >
            <Feather name="chevron-left" size={14} color={colors.mutedForeground} />
            <Text style={[styles.backLinkText, { color: colors.mutedForeground }]}>Voltar ao menu</Text>
          </TouchableOpacity>

        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 60 },

  hero: {
    alignItems: "center",
    borderRadius: 20,
    padding: 32,
    marginBottom: 20,
    overflow: "hidden",
  },
  logoRing: {
    width: 80,
    height: 80,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  gameTitle: {
    fontSize: 38,
    fontFamily: "Inter_700Bold",
    letterSpacing: 6,
    textAlign: "center",
  },
  gameSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 3,
    marginTop: 4,
    textAlign: "center",
  },
  divider: {
    width: 60,
    height: 1,
    marginVertical: 20,
    opacity: 0.5,
  },
  tagline: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 24,
    textAlign: "center",
  },

  objectiveCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 28,
    overflow: "hidden",
  },
  objectiveHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  objectiveIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  objectiveTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  objectiveText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    marginBottom: 14,
  },
  objectivePills: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
  },

  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
    marginBottom: 12,
    marginLeft: 4,
  },

  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  featureCard: {
    width: W > 500 ? "47%" : "47%",
    minWidth: "47%",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
    flexShrink: 1,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  featureTitle: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  featureDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },

  hintCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 28,
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },

  ctaButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
  },
  ctaGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
  },
  ctaText: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 0.5,
  },

  backLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
  },
  backLinkText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
});
