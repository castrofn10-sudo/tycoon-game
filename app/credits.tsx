import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";
import { GridBackground } from "@/components/GridBackground";

export default function CreditsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GridBackground />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={18} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Créditos</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: botPad + 48 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Logo hero */}
          <View style={styles.hero}>
            <LinearGradient
              colors={["#4DA6FF33", "#F5A62318"]}
              style={styles.logoWrap}
            >
              <Feather name="trending-up" size={48} color="#4DA6FF" />
            </LinearGradient>
            <Text style={[styles.gameTitle, { color: colors.foreground }]}>MEGA CORP</Text>
            <Text style={[styles.gameSubtitle, { color: colors.mutedForeground }]}>
              Um simulador estratégico da indústria dos games
            </Text>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Criado por */}
          <CreditBlock
            label="Criado por"
            value="André Castro"
            highlight
            colors={colors}
          />

          {/* Desenvolvimento */}
          <CreditBlock
            label="Desenvolvimento"
            value="Projeto Independente"
            colors={colors}
          />

          {/* Direção Criativa */}
          <CreditBlock
            label="Direção Criativa"
            value="André Castro"
            colors={colors}
          />

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Descrição */}
          <View style={styles.descBlock}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Descrição</Text>
            <Text style={[styles.descText, { color: colors.foreground }]}>
              Um simulador estratégico da indústria dos games, onde decisões moldam empresas, tecnologias e mercados ao longo das décadas.
            </Text>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Tecnologia */}
          <CreditBlock
            label="Tecnologia"
            value="React Native & Expo"
            colors={colors}
          />

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Footer copyright */}
          <Text style={[styles.copyright, { color: colors.mutedForeground }]}>
            © 2026 André Castro{"\n"}Todos os direitos reservados.
          </Text>

          {/* Signature */}
          <View style={styles.signatureWrap}>
            <View style={[styles.signatureLine, { backgroundColor: colors.border }]} />
            <View style={styles.signatureBlock}>
              <Text style={[styles.signatureLabel, { color: colors.mutedForeground }]}>Ass.</Text>
              <LinearGradient
                colors={["#4DA6FF", "#F5A623"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.signatureGradientWrap}
              >
                <Text style={styles.signatureName}>A. F. P. Castro</Text>
              </LinearGradient>
            </View>
          </View>

        </Animated.View>
      </ScrollView>
    </View>
  );
}

function CreditBlock({
  label,
  value,
  highlight,
  colors,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.creditRow}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[
        styles.creditValue,
        { color: highlight ? "#4DA6FF" : colors.foreground },
        highlight && styles.creditValueHighlight,
      ]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40, height: 40,
    borderRadius: 10, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  scroll: { paddingHorizontal: 28, paddingTop: 8 },

  hero: { alignItems: "center", paddingVertical: 36 },
  logoWrap: {
    width: 96, height: 96, borderRadius: 28,
    alignItems: "center", justifyContent: "center", marginBottom: 20,
  },
  gameTitle: {
    fontSize: 28, fontFamily: "Inter_700Bold",
    letterSpacing: 4, marginBottom: 8,
  },
  gameSubtitle: {
    fontSize: 13, fontFamily: "Inter_400Regular",
    textAlign: "center", lineHeight: 20,
    maxWidth: 280,
  },

  divider: { height: 1, marginVertical: 28, opacity: 0.5 },

  creditRow: { marginBottom: 24 },
  label: {
    fontSize: 10, fontFamily: "Inter_600SemiBold",
    letterSpacing: 2, textTransform: "uppercase",
    marginBottom: 6,
  },
  creditValue: { fontSize: 20, fontFamily: "Inter_600SemiBold" },
  creditValueHighlight: { fontSize: 22, fontFamily: "Inter_700Bold" },

  descBlock: { marginBottom: 4 },
  descText: {
    fontSize: 15, fontFamily: "Inter_400Regular",
    lineHeight: 24, marginTop: 6,
  },

  copyright: {
    fontSize: 13, fontFamily: "Inter_400Regular",
    textAlign: "center", lineHeight: 22,
    marginBottom: 36,
  },

  signatureWrap: { alignItems: "center", paddingBottom: 8 },
  signatureLine: { width: 60, height: 1, marginBottom: 20, opacity: 0.5 },
  signatureBlock: { alignItems: "center", gap: 6 },
  signatureLabel: { fontSize: 10, fontFamily: "Inter_400Regular", letterSpacing: 2 },
  signatureGradientWrap: { borderRadius: 4, paddingHorizontal: 2, paddingVertical: 1 },
  signatureName: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#070D1A",
    letterSpacing: 1,
  },
});
