import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Get the height of the global bottom navigation bar
 * This should be used to add padding to content so it doesn't get hidden behind the nav
 */
export function useBottomNavHeight(): number {
  const insets = useSafeAreaInsets();
  // Base height (60) + safe area bottom inset
  return 60 + Math.max(insets.bottom, 5);
}

/**
 * Get the bottom nav height as a constant (for use outside of components)
 */
export const BOTTOM_NAV_HEIGHT = 60;

