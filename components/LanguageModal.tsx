import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Pressable,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useLanguage } from "@/context/LanguageContext";
import { Language } from "@/constants/i18n";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function LanguageModal({ visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentLanguage, setLanguage, languages, t } = useLanguage();

  const handleSelect = (lang: Language) => {
    setLanguage(lang.code);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {t.selectLanguage}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
          <View
            style={[styles.divider, { backgroundColor: colors.border }]}
          />
          <FlatList
            data={languages}
            keyExtractor={(item) => item.code}
            scrollEnabled={false}
            renderItem={({ item }) => {
              const isSelected = item.code === currentLanguage.code;
              return (
                <TouchableOpacity
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                  style={[
                    styles.langItem,
                    isSelected && {
                      backgroundColor: colors.secondary,
                      borderColor: colors.primary,
                      borderWidth: 1,
                    },
                  ]}
                >
                  <Text style={styles.flag}>{item.flag}</Text>
                  <Text
                    style={[styles.langName, { color: colors.foreground }]}
                  >
                    {item.nativeName}
                  </Text>
                  {isSelected && (
                    <Feather
                      name="check"
                      size={16}
                      color={colors.primary}
                      style={styles.check}
                    />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  sheet: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 20,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#4DA6FF",
        shadowOpacity: 0.3,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 16 },
    }),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  langItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginHorizontal: 8,
    marginVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },
  flag: {
    fontSize: 22,
    marginRight: 12,
  },
  langName: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  check: {
    marginLeft: 8,
  },
});
