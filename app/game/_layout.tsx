import { Stack } from "expo-router";
import React from "react";

export default function GameLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="console-builder" options={{ animation: "slide_from_bottom" }} />
      <Stack.Screen name="offices" options={{ animation: "slide_from_bottom" }} />
      <Stack.Screen name="marketing" options={{ animation: "slide_from_bottom" }} />
      <Stack.Screen name="market" options={{ animation: "slide_from_bottom" }} />
      <Stack.Screen name="news" options={{ animation: "slide_from_bottom" }} />
      <Stack.Screen name="research" options={{ animation: "slide_from_bottom" }} />
      <Stack.Screen name="employees" options={{ animation: "slide_from_bottom" }} />
      <Stack.Screen name="game-dev" options={{ animation: "slide_from_bottom" }} />
      <Stack.Screen name="world-map" options={{ animation: "slide_from_bottom" }} />
      <Stack.Screen name="finances" options={{ animation: "slide_from_bottom" }} />
      <Stack.Screen name="consoles" options={{ animation: "slide_from_bottom" }} />
      <Stack.Screen name="trophies" options={{ animation: "slide_from_bottom" }} />
      <Stack.Screen name="achievements" options={{ animation: "slide_from_bottom" }} />
      <Stack.Screen name="history" options={{ animation: "slide_from_bottom" }} />
      <Stack.Screen name="rankings" options={{ animation: "slide_from_bottom" }} />
    </Stack>
  );
}
