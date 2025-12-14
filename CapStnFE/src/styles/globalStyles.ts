/**
 * Global styles for SIGHT app
 * Shared styles that can be reused across components
 */

import { StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

export const globalStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  
  centeredContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Text styles
  heading1: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
  
  heading2: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  
  heading3: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  
  bodyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  
  // Spacing helpers
  marginTop: {
    marginTop: 16,
  },
  
  marginBottom: {
    marginBottom: 16,
  },
  
  paddingHorizontal: {
    paddingHorizontal: 24,
  },
});

