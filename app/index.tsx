import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
  Image,
  ScrollView,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

import { useColors } from "@/hooks/useColors";
import { useLanguage } from "@/context/LanguageContext";
import { useGame } from "@/context/GameContext";
import { LanguageModal } from "@/components/LanguageModal";
import { GridBackground } from "@/components/GridBackground";
import { useSound } from "@/context/SoundContext";

const { width: W, height: H } = Dimensions.get("window");
const isWide = W >= 768;

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t, currentLanguage } = useLanguage();
  const { playClick, playSuccess } = useSound();
  const [showLangModal, setShowLangModal] = useState(false);
  const [showNewGameModal, setShowNewGameModal] = useState(false);

  const handleNewGameTutorial = () => {
    playSuccess();
    setShowNewGameModal(false);
    router.push({ pathname: "/tutorial", params: { from: "newgame" } } as any);
  };

  const handleNewGameSkip = () => {
    playClick();
    setShowNewGameModal(false);
    router.push("/new-game");
  };

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const heroFade = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(60)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        delay: 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        delay: 100,
        useNativeDriver: true,
      }),
      Animated.timing(heroFade, {
        toValue: 1,
        duration: 900,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.timing(heroSlide, {
        toValue: 0,
        duration: 900,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GridBackground />

      {/* Top Bar */}
      <Animated.View
        style={[
          styles.topBar,
          { paddingTop: topPad + 12, opacity: fadeAnim },
        ]}
      >
        {/* Logo */}
        <View style={styles.logoRow}>
          <View
            style={[
              styles.logoIconBox,
              { backgroundColor: colors.primary + "22", borderColor: colors.primary + "55" },
            ]}
          >
            <Feather name="trending-up" size={20} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.logoText, { color: colors.foreground }]}>
              MEGACORP
            </Text>
            <Text style={[styles.versionText, { color: colors.mutedForeground }]}>
              {t.version}
            </Text>
          </View>
        </View>

        {/* Language Button */}
        <TouchableOpacity
          onPress={() => setShowLangModal(true)}
          activeOpacity={0.75}
          style={[
            styles.langBtn,
            {
              backgroundColor: colors.secondary,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={styles.flagText}>{currentLanguage.flag}</Text>
          <Text
            style={[styles.langCode, { color: colors.foreground }]}
          >
            {currentLanguage.code.toUpperCase()}
          </Text>
          <Feather
            name="chevron-down"
            size={14}
            color={colors.mutedForeground}
          />
        </TouchableOpacity>
      </Animated.View>

      {/* Main content */}
      {isWide ? (
        <View style={styles.wideLayout}>
          <LeftPanel
            colors={colors}
            t={t}
            fadeAnim={fadeAnim}
            slideAnim={slideAnim}
            botPad={botPad}
            onNewGame={() => setShowNewGameModal(true)}
          />
          <Animated.View
            style={[
              styles.heroPanel,
              {
                opacity: heroFade,
                transform: [{ translateX: heroSlide }],
              },
            ]}
          >
            <HeroArt colors={colors} />
          </Animated.View>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.heroMobile,
              {
                opacity: heroFade,
                transform: [{ translateY: heroSlide }],
              },
            ]}
          >
            <HeroArt colors={colors} mobile />
          </Animated.View>
          <LeftPanel
            colors={colors}
            t={t}
            fadeAnim={fadeAnim}
            slideAnim={slideAnim}
            botPad={botPad}
            mobile
            onNewGame={() => setShowNewGameModal(true)}
          />
        </ScrollView>
      )}

      <LanguageModal
        visible={showLangModal}
        onClose={() => setShowLangModal(false)}
      />

      <TutorialPromptModal
        visible={showNewGameModal}
        onClose={() => setShowNewGameModal(false)}
        onTutorial={handleNewGameTutorial}
        onSkip={handleNewGameSkip}
        colors={colors}
      />
    </View>
  );
}

function HeroArt({
  colors,
  mobile,
}: {
  colors: ReturnType<typeof useColors>;
  mobile?: boolean;
}) {
  return (
    <View style={[styles.heroContainer, mobile && styles.heroContainerMobile]}>
      <View
        style={[
          styles.heroImageWrapper,
          mobile && styles.heroImageWrapperMobile,
          {
            borderColor: colors.primary + "44",
            shadowColor: colors.primary,
          },
        ]}
      >
        <Image
          source={require("../assets/images/hero-art.png")}
          style={[styles.heroImage, mobile && styles.heroImageMobile]}
          resizeMode="cover"
        />
        <LinearGradient
          colors={["transparent", colors.background + "DD", colors.background]}
          style={styles.heroGradientOverlay}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        {mobile && (
          <LinearGradient
            colors={["transparent", colors.background + "EE"]}
            style={styles.heroSideGradient}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0, y: 0 }}
          />
        )}
      </View>
    </View>
  );
}

function LeftPanel({
  colors,
  t,
  fadeAnim,
  slideAnim,
  botPad,
  mobile,
  onNewGame,
}: {
  colors: ReturnType<typeof useColors>;
  t: ReturnType<typeof useLanguage>["t"];
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  botPad: number;
  mobile?: boolean;
  onNewGame: () => void;
}) {
  const { saves } = useGame();
  const hasSaves = saves.length > 0;

  return (
    <Animated.View
      style={[
        styles.leftPanel,
        mobile && styles.leftPanelMobile,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          paddingBottom: botPad + 32,
        },
      ]}
    >
      {/* Primary Buttons */}
      <View style={styles.primaryButtons}>
        <MainButton
          label={t.newGame}
          icon="play"
          primary
          colors={colors}
          onPress={onNewGame}
        />
        <MainButton
          label={t.continueGame}
          icon="arrow-right-circle"
          colors={colors}
          onPress={() => router.push("/continue")}
          dimmed={!hasSaves}
        />
        <MainButton
          label="Modo Online"
          icon="wifi"
          online
          colors={colors}
          onPress={() => router.push("/online")}
        />
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Secondary Buttons */}
      <View style={styles.secondaryButtons}>
        <SmallButton label={t.tutorial} icon="book-open" colors={colors} onPress={() => router.push("/tutorial")} />
        <SmallButton label={t.settings} icon="sliders" colors={colors} onPress={() => router.push("/settings")} />
        <SmallButton label={t.credits} icon="star" colors={colors} onPress={() => router.push("/credits")} />
      </View>
    </Animated.View>
  );
}

function MainButton({
  label,
  icon,
  primary,
  online,
  colors,
  onPress,
  dimmed,
}: {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  primary?: boolean;
  online?: boolean;
  colors: ReturnType<typeof useColors>;
  onPress?: () => void;
  dimmed?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const { playClick, playSuccess } = useSound();

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 8,
    }).start();
  };

  const handlePress = () => {
    if (primary || online) playSuccess();
    else playClick();
    onPress?.();
  };

  return (
    <Animated.View style={{ transform: [{ scale }], opacity: dimmed ? 0.5 : 1 }}>
      {primary ? (
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={handlePress}
          style={styles.mainBtnTouchable}
        >
          <LinearGradient
            colors={["#4DA6FF", "#2B88F0", "#1A6ECC"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.mainBtnGradient}
          >
            <Feather name={icon} size={20} color="#070D1A" />
            <Text style={[styles.mainBtnText, { color: "#070D1A" }]}>
              {label}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      ) : online ? (
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={handlePress}
          style={styles.mainBtnTouchable}
        >
          <LinearGradient
            colors={["#1A3A1A", "#1A2A3A", "#0D1E2E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.mainBtnGradient, { borderWidth: 1, borderColor: "#4DFF9155" }]}
          >
            <Feather name={icon} size={20} color="#4DFF91" />
            <Text style={[styles.mainBtnText, { color: "#4DFF91" }]}>
              {label}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={handlePress}
          style={[
            styles.mainBtnOutline,
            {
              backgroundColor: colors.secondary,
              borderColor: colors.border,
            },
          ]}
        >
          <Feather name={icon} size={20} color={colors.primary} />
          <Text style={[styles.mainBtnText, { color: colors.foreground }]}>
            {label}
          </Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

function SmallButton({
  label,
  icon,
  colors,
  onPress,
}: {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  colors: ReturnType<typeof useColors>;
  onPress?: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.94,
      useNativeDriver: true,
      speed: 50,
      bounciness: 2,
    }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 8,
    }).start();
  };

  const { playClick } = useSound();

  return (
    <Animated.View style={{ transform: [{ scale }], flex: 1 }}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={() => { playClick(); onPress?.(); }}
        style={[
          styles.smallBtn,
          {
            backgroundColor: colors.muted,
            borderColor: colors.border,
          },
        ]}
      >
        <Feather name={icon} size={16} color={colors.mutedForeground} />
        <Text style={[styles.smallBtnText, { color: colors.mutedForeground }]}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function TutorialPromptModal({
  visible,
  onClose,
  onTutorial,
  onSkip,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  onTutorial: () => void;
  onSkip: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={modal.overlay}>
        <View style={[modal.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[modal.iconBox, { backgroundColor: "#4DA6FF15", borderColor: "#4DA6FF33" }]}>
            <Feather name="help-circle" size={32} color="#4DA6FF" />
          </View>
          <Text style={[modal.title, { color: colors.foreground }]}>Quer aprender a jogar?</Text>
          <Text style={[modal.subtitle, { color: colors.mutedForeground }]}>
            O tutorial leva menos de 1 minuto.
          </Text>
          <TouchableOpacity onPress={onTutorial} activeOpacity={0.85} style={modal.tutorialBtnWrapper}>
            <LinearGradient
              colors={["#4DA6FF", "#2B88F0"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={modal.tutorialBtn}
            >
              <Feather name="book-open" size={18} color="#070D1A" />
              <Text style={modal.tutorialBtnText}>Sim, tutorial</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onSkip}
            activeOpacity={0.8}
            style={[modal.skipBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
          >
            <Feather name="arrow-right" size={16} color={colors.mutedForeground} />
            <Text style={[modal.skipBtnText, { color: colors.mutedForeground }]}>Pular</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const modal = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    padding: 28,
    alignItems: "center",
    gap: 12,
  },
  iconBox: {
    width: 68,
    height: 68,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 8,
  },
  tutorialBtnWrapper: {
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
  },
  tutorialBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 15,
    borderRadius: 14,
  },
  tutorialBtnText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#070D1A",
  },
  skipBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
  },
  skipBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 12,
    zIndex: 10,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    letterSpacing: 3,
  },
  versionText: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    letterSpacing: 1,
    marginTop: 1,
  },
  langBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  flagText: {
    fontSize: 16,
  },
  langCode: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
  },
  wideLayout: {
    flex: 1,
    flexDirection: "row",
  },
  leftPanel: {
    flex: 1,
    paddingHorizontal: 40,
    paddingTop: 20,
    justifyContent: "center",
    maxWidth: 480,
  },
  leftPanelMobile: {
    paddingHorizontal: 24,
    paddingTop: 0,
    maxWidth: undefined,
  },
  tagline: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.5,
    marginBottom: 32,
    lineHeight: 20,
  },
  primaryButtons: {
    gap: 14,
    marginBottom: 24,
  },
  mainBtnTouchable: {
    borderRadius: 14,
    overflow: "hidden",
  },
  mainBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  mainBtnOutline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  mainBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    marginVertical: 20,
    marginHorizontal: 4,
  },
  secondaryButtons: {
    flexDirection: "row",
    gap: 10,
  },
  smallBtn: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  smallBtnText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.3,
    textAlign: "center",
  },
  heroPanel: {
    flex: 1.2,
    justifyContent: "center",
    alignItems: "center",
    paddingRight: 32,
    paddingTop: 20,
    paddingBottom: 32,
  },
  heroContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  heroContainerMobile: {
    flex: 0,
    height: H * 0.45,
    maxHeight: 360,
    width: "100%",
  },
  heroImageWrapper: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
    width: 300,
    height: 480,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.6,
        shadowRadius: 40,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 20 },
    }),
  },
  heroImageWrapperMobile: {
    width: 220,
    height: 320,
    alignSelf: "flex-end",
    marginRight: 20,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroImageMobile: {
    width: "100%",
    height: "100%",
  },
  heroGradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
  },
  heroSideGradient: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: "50%",
  },
  heroMobile: {
    height: H * 0.42,
    maxHeight: 340,
    overflow: "hidden",
  },
});
