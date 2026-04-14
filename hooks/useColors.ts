import { useTheme } from "@/context/ThemeContext";

/**
 * Returns the design tokens for the current theme.
 * Wraps ThemeContext to provide backwards-compatible color access.
 */
export function useColors() {
  const { colors } = useTheme();
  return colors;
}
