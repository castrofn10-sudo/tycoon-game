import React, { useState, useCallback } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  LayoutAnimation, Platform, UIManager,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

interface CollapsibleSectionProps {
  title: string;
  badge?: string | number;
  badgeColor?: string;
  defaultOpen?: boolean;
  accent?: string;
  children: React.ReactNode;
}

export function CollapsibleSection({
  title,
  badge,
  badgeColor = "#4DA6FF",
  defaultOpen = true,
  accent,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const colors = useColors();

  const toggle = useCallback(() => {
    LayoutAnimation.configureNext({
      duration: 220,
      create: { type: "easeInEaseOut", property: "opacity" },
      update: { type: "easeInEaseOut" },
      delete: { type: "easeInEaseOut", property: "opacity" },
    });
    setOpen((o) => !o);
  }, []);

  return (
    <View style={[styles.wrapper, { borderColor: accent ? accent + "33" : colors.border, backgroundColor: colors.card }]}>
      <TouchableOpacity
        onPress={toggle}
        activeOpacity={0.75}
        style={[styles.header, { borderBottomColor: open ? (accent ? accent + "22" : colors.border) : "transparent" }]}
      >
        {accent && <View style={[styles.accentBar, { backgroundColor: accent }]} />}
        <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
        {badge != null && (
          <View style={[styles.badge, { backgroundColor: badgeColor + "22" }]}>
            <Text style={[styles.badgeText, { color: badgeColor }]}>{badge}</Text>
          </View>
        )}
        <Feather
          name={open ? "chevron-up" : "chevron-down"}
          size={15}
          color={colors.mutedForeground}
          style={styles.chevron}
        />
      </TouchableOpacity>
      {open && <View style={styles.body}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  accentBar: {
    width: 3,
    height: 16,
    borderRadius: 2,
    marginRight: 4,
  },
  title: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
  chevron: {
    marginLeft: 4,
  },
  body: {
    padding: 14,
    gap: 10,
  },
});
