/**
 * SIGHT App Color Palette
 * Centralized color definitions for consistent theming
 */

export const Colors = {
  // Primary brand colors (matching logo cyan-teal)
  primary: '#22D3C5',      // Cyan-teal - main brand color
  primaryDark: '#0DBCAD',  // Deeper teal for gradient end
  primaryLight: '#67E8E4', // Lighter cyan for gradient start/highlights
  
  // Background colors
  background: '#F8FAFC',   // Light gray-white main background
  white: '#FFFFFF',        // Pure white
  
  // Text colors
  textPrimary: '#1F2937',  // Dark charcoal for headings
  textSecondary: '#6B7280', // Gray for subtitles/descriptions
  textMuted: '#9CA3AF',    // Muted text
  
  // Border and divider colors
  border: '#E5E7EB',       // Light border
  divider: '#D1D5DB',      // Divider lines
  
  // Status colors (for future use)
  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
} as const;

export type ColorKeys = keyof typeof Colors;

