/**
 * Design System Tokens
 * 
 * A comprehensive design system for the Sight application.
 * Based on Apple-inspired minimal aesthetics with premium typography.
 */

// =============================================================================
// COLORS
// =============================================================================

export const Colors = {
  // Primary Brand Colors
  primary: {
    blue: "#4A63D8",
    purple: "#8A4DE8",
    pink: "#FF6FAE",
  },

  // Accent Colors
  accent: {
    sky: "#5FA9F5",
    teal: "#2BB6E9",
    cyan: "#35E0E6",
    lightBlue: "#7DD3FC",
  },

  // Semantic Colors
  semantic: {
    success: "#10B981",
    successLight: "#D1FAE5",
    error: "#EF4444",
    errorLight: "#FEE2E2",
    warning: "#F59E0B",
    warningLight: "#FEF3C7",
  },

  // Gradients (start, end)
  gradient: {
    primaryBlue: ["#5FA9F5", "#4A63D8"] as const,
    primaryPurple: ["#8A4DE8", "#5FA9F5"] as const,
    primaryPink: ["#FF6FAE", "#D13DB8"] as const,
    purplePink: ["#8B5CF6", "#FF6FAE"] as const,
    cyanBlue: ["#2BB6E9", "#4A63D8"] as const,
    sightAI: ["#8B5CF6", "#5FA9F5"] as const,
  },

  // Light Mode Backgrounds
  background: {
    primary: "#FFFFFF",
    secondary: "#FAFBFC",
    tertiary: "#F5F6F8",
    subtle: "#F9FAFB",
    card: "#FFFFFF",
    elevated: "#FFFFFF",
  },

  // Light Mode Surface Colors (for tinted cards)
  surface: {
    blueTint: "#EFF6FF",
    purpleTint: "#F5F3FF",
    pinkTint: "#FDF2F8",
    tealTint: "#F0FDFA",
    grayTint: "#F9FAFB",
    error: "#FEE2E2",
  },

  // Status Colors (alias for semantic colors for convenience)
  status: {
    success: "#10B981",
    successLight: "#D1FAE5",
    error: "#EF4444",
    errorLight: "#FEE2E2",
    warning: "#F59E0B",
    warningLight: "#FEF3C7",
  },

  // Dark Mode (SightAI)
  dark: {
    background: "#0A0A14",
    backgroundSecondary: "#0F0F1E",
    surface: "#1E1E2E",
    surfaceLight: "#2D2D3E",
    surfaceLighter: "#3D3D4E",
    border: "#2D2D3E",
    card: "rgba(255, 255, 255, 0.05)",
    cardHover: "rgba(255, 255, 255, 0.08)",
  },

  // Dark Mode Gradients
  darkGradient: {
    background: ["#0A0A14", "#0F0F1E"] as const,
    aiCard: ["#1E1E3F", "#2D1B4E", "#3D1F5E"] as const,
    accent: ["#8B5CF6", "#2BB6E9"] as const,
  },

  // Text Colors - Light Mode
  text: {
    primary: "#1A1A1A",
    secondary: "#5A5A5A",
    tertiary: "#9A9A9A",
    disabled: "#C5C5C5",
    inverse: "#FFFFFF",
    link: "#4A63D8",
  },

  // Text Colors - Dark Mode
  textDark: {
    primary: "#FFFFFF",
    secondary: "#CCCCCC",
    tertiary: "#9CA3AF",
    disabled: "#6B7280",
    accent: "#8B5CF6",
    link: "#5FA9F5",
  },

  // Border Colors
  border: {
    light: "#E8E8E8",
    default: "#E5E7EB",
    dark: "#D1D5DB",
    focus: "#4A63D8",
  },

  // Icon Colors
  icon: {
    default: "#6B7280",
    active: "#4A63D8",
    muted: "#9CA3AF",
  },
};

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const Typography = {
  // Font Families
  fontFamily: {
    light: "Inter_300Light",
    regular: "Inter_400Regular",
    medium: "Inter_500Medium",
    semiBold: "Inter_600SemiBold",
    bold: "Inter_700Bold",
  },

  // Font Weights (for StyleSheet fontWeight property)
  fontWeight: {
    light: "300" as const,
    regular: "400" as const,
    normal: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },

  // Font Sizes
  fontSize: {
    // Display
    display: 40,
    displaySmall: 36,
    
    // Headlines
    h1: 32,
    h2: 28,
    h3: 24,
    h4: 20,
    h5: 18,
    
    // Body
    bodyLarge: 17,
    body: 15,
    bodySmall: 14,
    
    // Captions & Labels
    caption: 13,
    captionSmall: 12,
    label: 11,
    micro: 10,
  },

  // Line Heights
  lineHeight: {
    display: 48,
    headline: 36,
    title: 28,
    body: 24,
    caption: 18,
    tight: 20,
  },

  // Letter Spacing
  letterSpacing: {
    tighter: -0.5,
    tight: -0.25,
    normal: 0,
    wide: 0.25,
    wider: 0.5,
  },

  // Pre-defined Text Styles
  styles: {
    // Display
    display: {
      fontFamily: "Inter_700Bold",
      fontSize: 40,
      lineHeight: 48,
      letterSpacing: -0.5,
      color: "#1A1A1A",
    },

    // Headlines
    h1: {
      fontFamily: "Inter_700Bold",
      fontSize: 32,
      lineHeight: 40,
      letterSpacing: -0.5,
      color: "#1A1A1A",
    },
    h2: {
      fontFamily: "Inter_700Bold",
      fontSize: 28,
      lineHeight: 36,
      letterSpacing: -0.25,
      color: "#1A1A1A",
    },
    h3: {
      fontFamily: "Inter_600SemiBold",
      fontSize: 24,
      lineHeight: 32,
      letterSpacing: -0.25,
      color: "#1A1A1A",
    },
    h4: {
      fontFamily: "Inter_600SemiBold",
      fontSize: 20,
      lineHeight: 28,
      letterSpacing: 0,
      color: "#1A1A1A",
    },
    h5: {
      fontFamily: "Inter_600SemiBold",
      fontSize: 18,
      lineHeight: 24,
      letterSpacing: 0,
      color: "#1A1A1A",
    },

    // Body
    bodyLarge: {
      fontFamily: "Inter_400Regular",
      fontSize: 17,
      lineHeight: 26,
      letterSpacing: 0,
      color: "#5A5A5A",
    },
    body: {
      fontFamily: "Inter_400Regular",
      fontSize: 15,
      lineHeight: 24,
      letterSpacing: 0,
      color: "#5A5A5A",
    },
    bodyMedium: {
      fontFamily: "Inter_500Medium",
      fontSize: 15,
      lineHeight: 24,
      letterSpacing: 0,
      color: "#5A5A5A",
    },
    bodySmall: {
      fontFamily: "Inter_400Regular",
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0,
      color: "#5A5A5A",
    },

    // Labels & Captions
    label: {
      fontFamily: "Inter_500Medium",
      fontSize: 13,
      lineHeight: 18,
      letterSpacing: 0.25,
      color: "#9A9A9A",
    },
    caption: {
      fontFamily: "Inter_400Regular",
      fontSize: 13,
      lineHeight: 18,
      letterSpacing: 0.25,
      color: "#9A9A9A",
    },
    captionSmall: {
      fontFamily: "Inter_500Medium",
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0.25,
      color: "#9A9A9A",
    },
    micro: {
      fontFamily: "Inter_500Medium",
      fontSize: 10,
      lineHeight: 14,
      letterSpacing: 0.5,
      color: "#9A9A9A",
      textTransform: "uppercase" as const,
    },

    // Button Text
    buttonLarge: {
      fontFamily: "Inter_600SemiBold",
      fontSize: 17,
      lineHeight: 24,
      letterSpacing: 0,
      color: "#FFFFFF",
    },
    button: {
      fontFamily: "Inter_600SemiBold",
      fontSize: 15,
      lineHeight: 20,
      letterSpacing: 0,
      color: "#FFFFFF",
    },
    buttonSmall: {
      fontFamily: "Inter_600SemiBold",
      fontSize: 13,
      lineHeight: 18,
      letterSpacing: 0,
      color: "#FFFFFF",
    },

    // Links
    link: {
      fontFamily: "Inter_500Medium",
      fontSize: 15,
      lineHeight: 24,
      letterSpacing: 0,
      color: "#4A63D8",
    },
  },

  // Dark mode variants
  darkStyles: {
    h1: {
      fontFamily: "Inter_700Bold",
      fontSize: 32,
      lineHeight: 40,
      letterSpacing: -0.5,
      color: "#FFFFFF",
    },
    h2: {
      fontFamily: "Inter_700Bold",
      fontSize: 28,
      lineHeight: 36,
      letterSpacing: -0.25,
      color: "#FFFFFF",
    },
    h3: {
      fontFamily: "Inter_600SemiBold",
      fontSize: 24,
      lineHeight: 32,
      letterSpacing: -0.25,
      color: "#FFFFFF",
    },
    h4: {
      fontFamily: "Inter_600SemiBold",
      fontSize: 20,
      lineHeight: 28,
      letterSpacing: 0,
      color: "#FFFFFF",
    },
    body: {
      fontFamily: "Inter_400Regular",
      fontSize: 15,
      lineHeight: 24,
      letterSpacing: 0,
      color: "#CCCCCC",
    },
    caption: {
      fontFamily: "Inter_400Regular",
      fontSize: 13,
      lineHeight: 18,
      letterSpacing: 0.25,
      color: "#9CA3AF",
    },
  },
};

// =============================================================================
// SPACING
// =============================================================================

export const Spacing = {
  // Base unit: 4px
  base: 4,

  // Spacing scale
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,

  // Page Layout
  page: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },

  // Card Layout
  card: {
    padding: 20,
    paddingSmall: 16,
    paddingLarge: 24,
    gap: 12,
    borderRadius: 16,
    borderRadiusSmall: 12,
    borderRadiusLarge: 20,
  },

  // Section Layout
  section: {
    gap: 32,
    headerGap: 16,
    itemGap: 12,
  },

  // Component Spacing
  button: {
    paddingVertical: 14,
    paddingVerticalSmall: 10,
    paddingVerticalLarge: 18,
    paddingHorizontal: 20,
    paddingHorizontalSmall: 16,
    paddingHorizontalLarge: 24,
    gap: 8,
    borderRadius: 12,
    borderRadiusSmall: 8,
    borderRadiusPill: 100,
  },

  input: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },

  // Icon sizes
  icon: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
    xxl: 40,
    huge: 48,
  },

  // Avatar sizes
  avatar: {
    xs: 32,
    sm: 40,
    md: 56,
    lg: 72,
    xl: 80,
    xxl: 100,
  },
};

// =============================================================================
// SHADOWS
// =============================================================================

export const Shadows = {
  // Light Mode Shadows
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },

  xs: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },

  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },

  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },

  xl: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },

  // Colored Shadows
  primary: {
    shadowColor: "#4A63D8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },

  purple: {
    shadowColor: "#8A4DE8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },

  // Glow effects (for dark mode)
  glow: {
    cyan: {
      shadowColor: "#2BB6E9",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 0,
    },
    purple: {
      shadowColor: "#8B5CF6",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 0,
    },
  },
};

// =============================================================================
// ANIMATION
// =============================================================================

export const Animation = {
  // Durations
  duration: {
    instant: 100,
    fast: 200,
    normal: 300,
    slow: 400,
    slower: 600,
    slowest: 800,
  },

  // Easing curves
  easing: {
    // Standard easing
    standard: [0.4, 0, 0.2, 1] as const,
    // Deceleration (entering)
    decelerate: [0, 0, 0.2, 1] as const,
    // Acceleration (leaving)
    accelerate: [0.4, 0, 1, 1] as const,
    // Sharp (for elements that don't need to overshoot)
    sharp: [0.4, 0, 0.6, 1] as const,
    // Smooth (fluid feel)
    smooth: [0.25, 0.1, 0.25, 1] as const,
    // Bounce effect
    bounce: [0.68, -0.55, 0.265, 1.55] as const,
  },

  // Spring configs for react-native-reanimated
  spring: {
    gentle: { damping: 15, stiffness: 150 },
    responsive: { damping: 12, stiffness: 180 },
    bouncy: { damping: 10, stiffness: 200 },
    snappy: { damping: 18, stiffness: 250 },
  },
};

// =============================================================================
// BORDERS
// =============================================================================

export const Borders = {
  width: {
    none: 0,
    thin: 0.5,
    default: 1,
    medium: 1.5,
    thick: 2,
  },

  radius: {
    none: 0,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 9999,
  },
};

// =============================================================================
// Z-INDEX LAYERS
// =============================================================================

export const ZIndex = {
  // Base layers
  background: -1,
  base: 0,
  content: 1,
  card: 2,
  default: 5,
  
  // Elevated layers
  sticky: 10,
  header: 20,
  fixedButton: 25,
  dropdown: 30,
  bottomNav: 35,
  
  // Modal layers
  modal: 40,
  popover: 50,
  toast: 60,
  tooltip: 70,
  
  // Maximum layers
  overlay: 100,
  max: 999,
};

// =============================================================================
// OPACITY
// =============================================================================

export const Opacity = {
  transparent: 0,
  low: 0.2,
  medium: 0.5,
  high: 0.8,
  full: 1,
  
  // Disabled states
  disabled: 0.5,
  
  // Overlay
  overlayLight: 0.3,
  overlayMedium: 0.5,
  overlayDark: 0.7,
  
  // Glass effect
  glass: 0.8,
  glassLight: 0.9,
};

// =============================================================================
// BREAKPOINTS (for responsive design)
// =============================================================================

export const Breakpoints = {
  small: 375, // iPhone SE
  medium: 414, // iPhone Plus/Max
  large: 768, // iPad
  xlarge: 1024, // iPad Pro
};

// =============================================================================
// COMPONENT PRESETS
// =============================================================================

export const ComponentPresets = {
  // Card presets
  card: {
    default: {
      backgroundColor: Colors.background.card,
      borderRadius: Spacing.card.borderRadius,
      padding: Spacing.card.padding,
      ...Shadows.sm,
    },
    flat: {
      backgroundColor: Colors.background.card,
      borderRadius: Spacing.card.borderRadius,
      padding: Spacing.card.padding,
      borderWidth: 1,
      borderColor: Colors.border.light,
    },
    elevated: {
      backgroundColor: Colors.background.card,
      borderRadius: Spacing.card.borderRadius,
      padding: Spacing.card.padding,
      ...Shadows.md,
    },
    dark: {
      backgroundColor: Colors.dark.card,
      borderRadius: Spacing.card.borderRadius,
      padding: Spacing.card.padding,
      borderWidth: 1,
      borderColor: Colors.dark.border,
    },
  },

  // Button presets
  button: {
    primary: {
      backgroundColor: Colors.primary.blue,
      borderRadius: Spacing.button.borderRadius,
      paddingVertical: Spacing.button.paddingVertical,
      paddingHorizontal: Spacing.button.paddingHorizontal,
    },
    secondary: {
      backgroundColor: Colors.surface.blueTint,
      borderRadius: Spacing.button.borderRadius,
      paddingVertical: Spacing.button.paddingVertical,
      paddingHorizontal: Spacing.button.paddingHorizontal,
    },
    outline: {
      backgroundColor: "transparent",
      borderRadius: Spacing.button.borderRadius,
      paddingVertical: Spacing.button.paddingVertical,
      paddingHorizontal: Spacing.button.paddingHorizontal,
      borderWidth: 1.5,
      borderColor: Colors.primary.blue,
    },
    ghost: {
      backgroundColor: "transparent",
      borderRadius: Spacing.button.borderRadius,
      paddingVertical: Spacing.button.paddingVerticalSmall,
      paddingHorizontal: Spacing.button.paddingHorizontalSmall,
    },
  },

  // Input presets
  input: {
    default: {
      backgroundColor: Colors.background.primary,
      borderRadius: Spacing.input.borderRadius,
      paddingVertical: Spacing.input.paddingVertical,
      paddingHorizontal: Spacing.input.paddingHorizontal,
      borderWidth: 1,
      borderColor: Colors.border.default,
      ...Typography.styles.body,
      color: Colors.text.primary,
    },
    focused: {
      borderColor: Colors.primary.blue,
      ...Shadows.xs,
    },
    error: {
      borderColor: Colors.semantic.error,
      backgroundColor: Colors.semantic.errorLight,
    },
  },

  // Badge presets
  badge: {
    default: {
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 100,
      backgroundColor: Colors.surface.grayTint,
    },
    success: {
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 100,
      backgroundColor: Colors.semantic.successLight,
    },
    primary: {
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 100,
      backgroundColor: Colors.surface.blueTint,
    },
  },

  // Header preset
  header: {
    light: {
      backgroundColor: Colors.background.primary,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border.light,
    },
    dark: {
      backgroundColor: Colors.dark.backgroundSecondary,
      borderBottomWidth: 1,
      borderBottomColor: Colors.dark.border,
    },
  },
};

// Export all as a single design object for convenience
export const Design = {
  Colors,
  Typography,
  Spacing,
  Shadows,
  Animation,
  Borders,
  ZIndex,
  Opacity,
  Breakpoints,
  ComponentPresets,
};

// =============================================================================
// LEGACY/SIMPLIFIED EXPORTS (for backwards compatibility)
// =============================================================================

// Flattened color exports for easier use
export const COLORS = {
  // Primary
  primary: Colors.primary.blue,
  purple: Colors.primary.purple,
  pink: Colors.primary.pink,
  
  // Secondary/Accent
  secondary: Colors.accent.sky,
  blue: Colors.accent.sky,
  teal: Colors.accent.teal,
  cyan: Colors.accent.cyan,
  accent: Colors.accent.lightBlue,
  
  // Semantic
  success: Colors.semantic.success,
  successLight: Colors.semantic.successLight,
  successDark: "#059669",
  error: Colors.semantic.error,
  errorLight: Colors.semantic.errorLight,
  warning: Colors.semantic.warning,
  warningLight: Colors.semantic.warningLight,
  
  // Backgrounds
  background: Colors.background.secondary,
  white: Colors.background.primary,
  card: Colors.background.card,
  
  // Surfaces
  lightGrey: Colors.background.tertiary,
  primaryLight: Colors.surface.blueTint,
  primaryDark: "#3B52C4",
  
  // Text
  textDark: Colors.text.primary,
  textGrey: Colors.text.secondary,
  textLight: Colors.text.tertiary,
  
  // Borders
  border: Colors.border.default,
  borderLight: Colors.border.light,
  
  // Shadow
  shadow: "#000000",
  
  // Dark Mode
  dark: Colors.dark,
  darkGradient: Colors.darkGradient,
  textDarkMode: Colors.textDark,
};

// Flattened typography exports
export const TYPOGRAPHY = {
  // Font Families
  fontLight: Typography.fontFamily.light,
  fontRegular: Typography.fontFamily.regular,
  fontMedium: Typography.fontFamily.medium,
  fontSemiBold: Typography.fontFamily.semiBold,
  fontBold: Typography.fontFamily.bold,
  
  // Font Sizes
  fontSize10: Typography.fontSize.micro,
  fontSize11: Typography.fontSize.label,
  fontSize12: Typography.fontSize.captionSmall,
  fontSize13: Typography.fontSize.caption,
  fontSize14: Typography.fontSize.bodySmall,
  fontSize16: Typography.fontSize.body,
  fontSize18: Typography.fontSize.h5,
  fontSize20: Typography.fontSize.h4,
  fontSize24: Typography.fontSize.h3,
  fontSize26: 26,
  fontSize28: Typography.fontSize.h2,
  fontSize32: Typography.fontSize.h1,
  fontSize36: Typography.fontSize.displaySmall,
  fontSize40: Typography.fontSize.display,
  
  // Pre-built styles
  headline: Typography.styles.h1,
  title: Typography.styles.h4,
  body: Typography.styles.body,
  bodySmall: Typography.styles.bodySmall,
  caption: Typography.styles.caption,
  buttonText: Typography.styles.button,
  label: Typography.styles.label,
};

// Flattened spacing exports
export const SPACING = {
  // Base values
  spacing1: 1,
  spacing2: 2,
  spacing4: Spacing.xxs,
  spacing6: 6,
  spacing8: Spacing.xs,
  spacing10: 10,
  spacing12: Spacing.sm,
  spacing14: 14,
  spacing16: Spacing.md,
  spacing18: 18,
  spacing20: Spacing.lg,
  spacing22: 22,
  spacing24: Spacing.xl,
  spacing32: Spacing.xxl,
  spacing40: Spacing.xxxl,
  spacing48: Spacing.huge,
  
  // Page layout
  pagePaddingHorizontal: Spacing.page.paddingHorizontal,
  pagePaddingTop: Spacing.page.paddingTop,
  pagePaddingBottom: Spacing.page.paddingBottom,
  
  // Component
  cardBorderRadius: Spacing.card.borderRadius,
  buttonBorderRadius: Spacing.button.borderRadius,
  inputBorderRadius: Spacing.input.borderRadius,
};

export default Design;

