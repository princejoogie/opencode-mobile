/**
 * Terminal-inspired color scheme for the OpenCode mobile app
 * Colors based on common terminal themes and code editors
 */

// Terminal color palette
const terminal = {
  // Background colors
  bg: '#0c0c0c',           // Primary dark background
  bgSecondary: '#1a1a1a',  // Secondary background for cards/panels
  bgTertiary: '#2d2d2d',   // Tertiary background for highlighted areas
  
  // Text colors  
  text: '#e0e0e0',         // Primary text
  textMuted: '#a0a0a0',    // Muted text (line numbers, comments)
  textDim: '#606060',      // Very dim text
  
  // Syntax highlighting colors (from terminal image)
  green: '#00ff88',        // Keywords, strings
  purple: '#ff79c6',       // Types, functions
  blue: '#8be9fd',         // Constants, numbers
  yellow: '#f1fa8c',       // Variables, properties
  orange: '#ffb86c',       // Operators
  red: '#ff5555',          // Errors, warnings
  cyan: '#50fa7b',         // Comments, metadata
  
  // UI accent colors
  border: '#404040',       // Borders, dividers
  borderActive: '#606060', // Active/focused borders
  selection: '#44475a',    // Selection background
  
  // Status colors
  success: '#50fa7b',
  warning: '#f1fa8c', 
  error: '#ff5555',
  info: '#8be9fd',
};

export const Colors = {
  light: {
    text: terminal.text,
    background: terminal.bg,
    tint: terminal.green,
    icon: terminal.textMuted,
    tabIconDefault: terminal.textMuted,
    tabIconSelected: terminal.green,
    border: terminal.border,
    card: terminal.bgSecondary,
    surface: terminal.bgTertiary,
    muted: terminal.textMuted,
    accent: terminal.purple,
    success: terminal.success,
    warning: terminal.warning,
    error: terminal.error,
    info: terminal.info,
  },
  dark: {
    text: terminal.text,
    background: terminal.bg,
    tint: terminal.green,
    icon: terminal.textMuted,
    tabIconDefault: terminal.textMuted,
    tabIconSelected: terminal.green,
    border: terminal.border,
    card: terminal.bgSecondary,
    surface: terminal.bgTertiary,
    muted: terminal.textMuted,
    accent: terminal.purple,
    success: terminal.success,
    warning: terminal.warning,
    error: terminal.error,
    info: terminal.info,
  },
};

// Terminal-specific color utilities
export const TerminalColors = terminal;
