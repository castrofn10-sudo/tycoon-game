import React, { useRef, useCallback } from "react";
import { Animated, Pressable, ViewStyle, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { useSound } from "@/context/SoundContext";

type SoundType = "click" | "success" | "error" | "advance" | "unlock" | "build" | "none";

type Props = {
  onPress?: () => void;
  onLongPress?: () => void;
  sound?: SoundType;
  haptic?: boolean;
  scaleDown?: number;
  style?: ViewStyle | ViewStyle[];
  disabled?: boolean;
  activeOpacity?: number;
  children: React.ReactNode;
};

export function AnimatedPressable({
  onPress,
  onLongPress,
  sound = "click",
  haptic = true,
  scaleDown = 0.96,
  style,
  disabled = false,
  children,
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const { playClick, playSuccess, playError, playAdvance, playUnlock, playBuild } = useSound();

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: scaleDown,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  }, [scale, scaleDown]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  }, [scale]);

  const handlePress = useCallback(() => {
    if (disabled) return;
    // Haptic feedback (mobile only)
    if (haptic && Platform.OS !== "web") {
      if (sound === "success" || sound === "unlock" || sound === "build") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (sound === "error") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
    // Sound
    if (sound === "click") playClick();
    else if (sound === "success") playSuccess();
    else if (sound === "error") playError();
    else if (sound === "advance") playAdvance();
    else if (sound === "unlock") playUnlock();
    else if (sound === "build") playBuild();
    // Callback
    onPress?.();
  }, [disabled, haptic, sound, playClick, playSuccess, playError, playAdvance, playUnlock, playBuild, onPress]);

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      onLongPress={onLongPress}
      disabled={disabled}
      style={style}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
