import "@mui/material/styles";

// Sobrescribimos la definición del módulo
declare module "@mui/material/styles" {
  // Extendemos la interfaz 'Palette' para que incluya 'card'
  interface Palette {
    card: {
      defaultBg: string;
      noSelectionBg: string;
      border: string;
      borderSelected: string;
      boxShadow: string;
      boxShadowSelected: string;
      text: string;
    };
  }

  // Extendemos 'PaletteOptions' para que acepte 'card'
  interface PaletteOptions {
    card?: {
      defaultBg?: string;
      noSelectionBg?: string;
      border?: string;
      borderSelected?: string;
      boxShadow?: string;
      boxShadowSelected?: string;
      text?: string;
    };
  }

  interface TypographyOptions {
    fontFamilyMono?: string;
  }
 
  interface Typography {
    fontFamilyMono: string;
  }
}
// Trigger reload

// Emotion theme types for styled-components
export interface EmotionColor {
  main: string;
  light: string;
  dark: string;
  contrastText: string;
}

export interface EmotionBackground {
  default: string;
  paper: string;
  alt: string;
}

export interface EmotionText {
  primary: string;
  secondary: string;
  disabled: string;
}

export interface EmotionBorder {
  main: string;
  light: string;
  dark: string;
}

export interface EmotionSuccess {
  main: string;
  light: string;
  dark: string;
}

export interface EmotionError {
  main: string;
  light: string;
  dark: string;
}

export interface EmotionWarning {
  main: string;
  light: string;
  dark: string;
}

export interface EmotionInfo {
  main: string;
  light: string;
  dark: string;
}

export interface EmotionColors {
  primary: EmotionColor;
  secondary: EmotionColor;
  background: EmotionBackground;
  text: EmotionText;
  border: EmotionBorder;
  success: EmotionSuccess;
  error: EmotionError;
  warning: EmotionWarning;
  info: EmotionInfo;
}

export interface EmotionTypography {
  fontFamily: {
    heading: string;
    body: string;
  };
  fontSizes: {
    h1: string;
    h2: string;
    h3: string;
    h4: string;
    h5: string;
    body: string;
    button: string;
    caption: string;
  };
  fontWeights: {
    regular: number;
    medium: number;
    bold: number;
    semiBold: number;
  };
  lineHeights: {
    heading: number;
    body: number;
  };
}

export interface EmotionBorderRadius {
  small: string;
  medium: string;
  large: string;
}

export interface EmotionShadows {
  primaryGlow: string;
  secondaryGlow: string;
  small: string;
}

export interface EmotionTheme {
  colors: EmotionColors;
  typography: EmotionTypography;
  spacing: (factor: number) => string;
  borderRadius: EmotionBorderRadius;
  shadows: EmotionShadows;
}

// App theme type alias
export type AppTheme = EmotionTheme;
