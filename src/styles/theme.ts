import { createTheme, ThemeOptions } from "@mui/material/styles";

// Sleek Innovator Color Palette
const sleekInnovatorColors = {
  primary: {
    main: "#1297FD", // Electric adamantine blue
    light: "#4DB8FF",
    dark: "#0077CC",
    contrastText: "#000000",
  },
  secondary: {
    main: "#6F4C6C", // Dark plum
    light: "#8B6B88",
    dark: "#523150",
    contrastText: "#ffffff",
  },
  background: {
    default: "#121212", // Deep charcoal
    paper: "#1E1E1E", // Slightly lighter for surfaces
    alt: "#0F0F0F", // Alternative darker background
  },
  text: {
    primary: "#FCFCFC", // Off-white
    secondary: "#C3C3C5", // Light gray
    disabled: "#8A8A8C",
  },
  border: {
    main: "#353536", // Dark gray
    light: "#4A4A4B",
    dark: "#1F1F20",
  },
  success: {
    main: "#00C851",
    light: "#5DFC88",
    dark: "#009624",
  },
  error: {
    main: "#FF4444",
    light: "#FF7F7F",
    dark: "#CC0000",
  },
  warning: {
    main: "#FFBB33",
    light: "#FFFF66",
    dark: "#CC9900",
  },
  info: {
    main: "#1297FD",
    light: "#4DB8FF",
    dark: "#0077CC",
  },
};

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: sleekInnovatorColors.primary,
    secondary: {
      main: "#6F4C6C",
      light: "#8B6B88",
      dark: "#523150",
      contrastText: "#ffffff",
    },
    background: {
      default: "#FCFCFC",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#2C2C2C",
      secondary: "#6F6F6F",
    },
    success: sleekInnovatorColors.success,
    error: sleekInnovatorColors.error,
    warning: sleekInnovatorColors.warning,
    info: sleekInnovatorColors.info,
  },
  typography: {
    fontFamily: '"Inter", "Montserrat", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Montserrat", sans-serif',
      fontWeight: 700,
      fontSize: '4.5rem', // 72px desktop
      lineHeight: 1.2,
      '@media (max-width:600px)': {
        fontSize: '2.5rem', // 40px mobile
      },
    },
    h2: {
      fontFamily: '"Montserrat", sans-serif',
      fontWeight: 700,
      fontSize: '3rem', // 48px desktop
      lineHeight: 1.2,
      '@media (max-width:600px)': {
        fontSize: '2rem', // 32px mobile
      },
    },
    h3: {
      fontFamily: '"Montserrat", sans-serif',
      fontWeight: 700,
      fontSize: '1.5rem', // 24px desktop
      lineHeight: 1.3,
      '@media (max-width:600px)': {
        fontSize: '2.25rem', // 36px mobile
      },
    },
    h4: {
      fontFamily: '"Montserrat", sans-serif',
      fontWeight: 700,
      fontSize: '1.25rem', // 20px desktop
      lineHeight: 1.4,
      '@media (max-width:600px)': {
        fontSize: '1.5rem', // 24px mobile
      },
    },
    h5: {
      fontFamily: '"Montserrat", sans-serif',
      fontWeight: 700,
      fontSize: '1.125rem', // 18px
      lineHeight: 1.4,
    },
    h6: {
      fontFamily: '"Montserrat", sans-serif',
      fontWeight: 700,
      fontSize: '1rem', // 16px
      lineHeight: 1.4,
    },
    body1: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '1.125rem', // 18px desktop
      lineHeight: 1.6,
      '@media (max-width:600px)': {
        fontSize: '1rem', // 16px mobile
      },
    },
    body2: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '1rem', // 16px
      lineHeight: 1.6,
    },
    subtitle1: {
      fontFamily: '"Inter", sans-serif',
      fontWeight: 500,
      fontSize: '0.875rem', // 14px
      lineHeight: 1.5,
    },
    subtitle2: {
      fontFamily: '"Inter", sans-serif',
      fontWeight: 500,
      fontSize: '0.75rem', // 12px
      lineHeight: 1.5,
    },
    button: {
      fontFamily: '"Inter", sans-serif',
      textTransform: 'none',
      fontWeight: 500,
      fontSize: '0.875rem',
    },
    caption: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '0.75rem', // 12px
      lineHeight: 1.5,
    },
    overline: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '0.75rem',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
  },
  spacing: (factor: number) => `${factor * 4}px`, // 4px base unit
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  shadows: [
    'none',
    '0px 2px 4px -1px rgba(0,0,0,0.1)',
    '0px 4px 8px -2px rgba(0,0,0,0.1)',
    '0px 6px 12px -3px rgba(0,0,0,0.15)',
    '0px 8px 16px -4px rgba(0,0,0,0.2)',
    '0px 10px 20px -5px rgba(0,0,0,0.25)',
    '0px 12px 24px -6px rgba(0,0,0,0.3)',
    '0px 14px 28px -7px rgba(0,0,0,0.35)',
    '0px 16px 32px -8px rgba(0,0,0,0.4)',
    '0px 18px 36px -9px rgba(0,0,0,0.45)',
    '0px 20px 40px -10px rgba(0,0,0,0.5)',
    '0px 22px 44px -11px rgba(0,0,0,0.55)',
    '0px 24px 48px -12px rgba(0,0,0,0.6)',
    // Custom shadows for Sleek Innovator
    '0px 4px 12px rgba(18, 151, 253, 0.15)', // Primary glow
    '0px 8px 24px rgba(18, 151, 253, 0.2)', // Primary hover
    '0px 12px 36px rgba(18, 151, 253, 0.25)', // Primary elevated
    '0px 16px 48px rgba(18, 151, 253, 0.3)', // Primary prominent
    '0px 20px 60px rgba(18, 151, 253, 0.35)', // Primary hero
    '0px 24px 72px rgba(18, 151, 253, 0.4)', // Primary epic
    '0px 4px 12px rgba(111, 76, 108, 0.15)', // Secondary glow
    '0px 8px 24px rgba(111, 76, 108, 0.2)', // Secondary hover
    '0px 12px 36px rgba(111, 76, 108, 0.25)', // Secondary elevated
    '0px 16px 48px rgba(111, 76, 108, 0.3)', // Secondary prominent
    '0px 20px 60px rgba(111, 76, 108, 0.35)', // Secondary hero
    '0px 24px 72px rgba(111, 76, 108, 0.4)', // Secondary epic
  ],
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          fontFamily: '"Inter", sans-serif',
        },
        contained: {
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            boxShadow: '0px 4px 12px rgba(18, 151, 253, 0.3)',
            transform: 'translateY(-2px)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(45deg, #1297FD 30%, #0077CC 90%)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: '1px solid #E0E0E0',
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.05)',
          '&:hover': {
            borderColor: '#1297FD',
            boxShadow: '0px 8px 24px rgba(18, 151, 253, 0.1)',
            transform: 'translateY(-4px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          '&.MuiTypography-h1, &.MuiTypography-h2, &.MuiTypography-h3, &.MuiTypography-h4, &.MuiTypography-h5, &.MuiTypography-h6': {
            fontFamily: '"Montserrat", sans-serif',
            fontWeight: 700,
          },
        },
      },
    },
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: sleekInnovatorColors.primary,
    secondary: sleekInnovatorColors.secondary,
    background: {
      default: sleekInnovatorColors.background.default,
      paper: sleekInnovatorColors.background.paper,
    },
    text: {
      primary: sleekInnovatorColors.text.primary,
      secondary: sleekInnovatorColors.text.secondary,
    },
    success: sleekInnovatorColors.success,
    error: sleekInnovatorColors.error,
    warning: sleekInnovatorColors.warning,
    info: sleekInnovatorColors.info,
    divider: sleekInnovatorColors.border.main,
  },
  typography: {
    fontFamily: '"Inter", "Montserrat", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Montserrat", sans-serif',
      fontWeight: 700,
      fontSize: '4.5rem', // 72px desktop
      lineHeight: 1.2,
      '@media (max-width:600px)': {
        fontSize: '2.5rem', // 40px mobile
      },
    },
    h2: {
      fontFamily: '"Montserrat", sans-serif',
      fontWeight: 700,
      fontSize: '3rem', // 48px desktop
      lineHeight: 1.2,
      '@media (max-width:600px)': {
        fontSize: '2rem', // 32px mobile
      },
    },
    h3: {
      fontFamily: '"Montserrat", sans-serif',
      fontWeight: 700,
      fontSize: '1.5rem', // 24px desktop
      lineHeight: 1.3,
      '@media (max-width:600px)': {
        fontSize: '2.25rem', // 36px mobile
      },
    },
    h4: {
      fontFamily: '"Montserrat", sans-serif',
      fontWeight: 700,
      fontSize: '1.25rem', // 20px desktop
      lineHeight: 1.4,
      '@media (max-width:600px)': {
        fontSize: '1.5rem', // 24px mobile
      },
    },
    h5: {
      fontFamily: '"Montserrat", sans-serif',
      fontWeight: 700,
      fontSize: '1.125rem', // 18px
      lineHeight: 1.4,
    },
    h6: {
      fontFamily: '"Montserrat", sans-serif',
      fontWeight: 700,
      fontSize: '1rem', // 16px
      lineHeight: 1.4,
    },
    body1: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '1.125rem', // 18px desktop
      lineHeight: 1.6,
      '@media (max-width:600px)': {
        fontSize: '1rem', // 16px mobile
      },
    },
    body2: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '1rem', // 16px
      lineHeight: 1.6,
    },
    subtitle1: {
      fontFamily: '"Inter", sans-serif',
      fontWeight: 500,
      fontSize: '0.875rem', // 14px
      lineHeight: 1.5,
    },
    subtitle2: {
      fontFamily: '"Inter", sans-serif',
      fontWeight: 500,
      fontSize: '0.75rem', // 12px
      lineHeight: 1.5,
    },
    button: {
      fontFamily: '"Inter", sans-serif',
      textTransform: 'none',
      fontWeight: 500,
      fontSize: '0.875rem',
    },
    caption: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '0.75rem', // 12px
      lineHeight: 1.5,
    },
    overline: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '0.75rem',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
  },
  spacing: (factor: number) => `${factor * 4}px`, // 4px base unit
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  shadows: [
    'none',
    '0px 2px 4px -1px rgba(0,0,0,0.2)',
    '0px 4px 8px -2px rgba(0,0,0,0.25)',
    '0px 6px 12px -3px rgba(0,0,0,0.3)',
    '0px 8px 16px -4px rgba(0,0,0,0.35)',
    '0px 10px 20px -5px rgba(0,0,0,0.4)',
    '0px 12px 24px -6px rgba(0,0,0,0.45)',
    '0px 14px 28px -7px rgba(0,0,0,0.5)',
    '0px 16px 32px -8px rgba(0,0,0,0.55)',
    '0px 18px 36px -9px rgba(0,0,0,0.6)',
    '0px 20px 40px -10px rgba(0,0,0,0.65)',
    '0px 22px 44px -11px rgba(0,0,0,0.7)',
    '0px 24px 48px -12px rgba(0,0,0,0.75)',
    // Custom shadows for Sleek Innovator
    '0px 4px 12px rgba(18, 151, 253, 0.3)', // Primary glow
    '0px 8px 24px rgba(18, 151, 253, 0.4)', // Primary hover
    '0px 12px 36px rgba(18, 151, 253, 0.5)', // Primary elevated
    '0px 16px 48px rgba(18, 151, 253, 0.6)', // Primary prominent
    '0px 20px 60px rgba(18, 151, 253, 0.7)', // Primary hero
    '0px 24px 72px rgba(18, 151, 253, 0.8)', // Primary epic
    '0px 4px 12px rgba(111, 76, 108, 0.3)', // Secondary glow
    '0px 8px 24px rgba(111, 76, 108, 0.4)', // Secondary hover
    '0px 12px 36px rgba(111, 76, 108, 0.5)', // Secondary elevated
    '0px 16px 48px rgba(111, 76, 108, 0.6)', // Secondary prominent
    '0px 20px 60px rgba(111, 76, 108, 0.7)', // Secondary hero
    '0px 24px 72px rgba(111, 76, 108, 0.8)', // Secondary epic
  ],
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          fontFamily: '"Inter", sans-serif',
        },
        contained: {
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.3)',
          '&:hover': {
            boxShadow: '0px 4px 12px rgba(18, 151, 253, 0.5)',
            transform: 'translateY(-2px)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(45deg, #1297FD 30%, #0077CC 90%)',
          '&:hover': {
            background: 'linear-gradient(45deg, #0077CC 30%, #1297FD 90%)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: sleekInnovatorColors.background.paper,
          border: `1px solid ${sleekInnovatorColors.border.main}`,
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.2)',
          '&:hover': {
            borderColor: sleekInnovatorColors.primary.main,
            boxShadow: '0px 8px 24px rgba(18, 151, 253, 0.2)',
            transform: 'translateY(-4px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: sleekInnovatorColors.background.paper,
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          '&.MuiTypography-h1, &.MuiTypography-h2, &.MuiTypography-h3, &.MuiTypography-h4, &.MuiTypography-h5, &.MuiTypography-h6': {
            fontFamily: '"Montserrat", sans-serif',
            fontWeight: 700,
          },
        },
      },
    },
  },
});

// Light theme object for use with Emotion styled components
export const lightEmotionTheme = {
  ...lightTheme,
  colors: {
    primary: {
      main: "#1297FD",
      light: "#4DB8FF",
      dark: "#0077CC",
      contrastText: "#000000",
    },
    secondary: {
      main: "#6F4C6C",
      light: "#8B6B88",
      dark: "#523150",
      contrastText: "#ffffff",
    },
    background: {
      default: "#FCFCFC",
      paper: "#FFFFFF",
      alt: "#F0F0F0",
    },
    text: {
      primary: "#2C2C2C",
      secondary: "#6F6F6F",
      disabled: "#BDBDBD",
    },
    border: {
      main: "#E0E0E0",
      light: "#F0F0F0",
      dark: "#BDBDBD",
    },
    success: {
      main: "#00C851",
      light: "#5DFC88",
      dark: "#009624",
    },
    error: {
      main: "#FF4444",
      light: "#FF7F7F",
      dark: "#CC0000",
    },
    warning: {
      main: "#FFBB33",
      light: "#FFFF66",
      dark: "#CC9900",
    },
    info: {
      main: "#1297FD",
      light: "#4DB8FF",
      dark: "#0077CC",
    },
  },
  typography: {
    fontFamily: {
      body: '"Inter", sans-serif',
      heading: '"Montserrat", sans-serif',
    },
    fontSizes: {
      body: '1rem',
      caption: '0.75rem',
    },
    fontWeights: {
      light: 300,
      regular: 400,
      medium: 500,
      bold: 700,
    },
  },
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '16px',
    circle: '50%',
  },
  spacing: (factor: number) => `${factor * 4}px`,
  shadows: {
    focus: `0 0 0 3px ${sleekInnovatorColors.primary.main}1A`,
    focusError: `0 0 0 3px ${sleekInnovatorColors.error.main}1A`,
  },
};

// Dark theme object for use with Emotion styled components
export const darkEmotionTheme = {
  ...darkTheme,
  colors: {
    primary: {
      main: "#1297FD",
      light: "#4DB8FF",
      dark: "#0077CC",
      contrastText: "#000000",
    },
    secondary: {
      main: "#6F4C6C",
      light: "#8B6B88",
      dark: "#523150",
      contrastText: "#ffffff",
    },
    background: {
      default: "#121212",
      paper: "#1E1E1E",
      alt: "#0F0F0F",
    },
    text: {
      primary: "#FCFCFC",
      secondary: "#C3C3C5",
      disabled: "#8A8A8C",
    },
    border: {
      main: "#353536",
      light: "#4A4A4B",
      dark: "#1F1F20",
    },
    success: {
      main: "#00C851",
      light: "#5DFC88",
      dark: "#009624",
    },
    error: {
      main: "#FF4444",
      light: "#FF7F7F",
      dark: "#CC0000",
    },
    warning: {
      main: "#FFBB33",
      light: "#FFFF66",
      dark: "#CC9900",
    },
    info: {
      main: "#1297FD",
      light: "#4DB8FF",
      dark: "#0077CC",
    },
  },
  typography: {
    fontFamily: {
      body: '"Inter", sans-serif',
      heading: '"Montserrat", sans-serif',
    },
    fontSizes: {
      body: '1rem', // 16px
      caption: '0.75rem', // 12px
    },
    fontWeights: {
      light: 300,
      regular: 400,
      medium: 500,
      bold: 700,
    },
  },
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '16px',
    circle: '50%',
  },
  spacing: (factor: number) => `${factor * 4}px`, // 4px base unit
  shadows: {
    focus: `0 0 0 3px ${sleekInnovatorColors.primary.main}1A`,
    focusError: `0 0 0 3px ${sleekInnovatorColors.error.main}1A`,
  },
};
