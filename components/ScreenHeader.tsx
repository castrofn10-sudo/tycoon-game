import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

import { useColors } from "@/hooks/useColors";

type Props = {
  title: string;
  rightElement?: React.ReactNode;
  onBack?: () => void;
};

export function ScreenHeader({ title, rightElement, onBack }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 16 : insets.top;

  return (
    <View style={[styles.wrapper, { paddingTop: topPad }]}>
      <LinearGradient
        colors={[colors.background, colors.background + "F0", colors.background + "00"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.card + "CC",
            borderColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => { if (onBack) onBack(); else router.back(); }}
          style={[styles.backBtn, { backgroundColor: colors.secondary }]}
          activeOpacity={0.7}
        >
          <Feather name="chevron-left" size={22} color={colors.primary} />
        </TouchableOpacity>

        <Text
          style={[styles.title, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {title}
        </Text>

        <View style={styles.rightSlot}>
          {rightElement ?? <View style={styles.spacer} />}
        </View>
      </View>
      <View style={[styles.separator, { backgroundColor: colors.border }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    zIndex: 10,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  rightSlot: {
    width: 38,
    alignItems: "flex-end",
  },
  spacer: {
    width: 38,
    height: 38,
  },
  separator: {
    height: 1,
    opacity: 0.6,
  },
});
