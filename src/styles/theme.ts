import { createTheme } from "@mui/material/styles";

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1e3a8a", // Azul profundo, inspirado en cartas de póker
      light: "#3b5cb8",
      dark: "#0c2461",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#c0392b", // Rojo intenso, inspirado en diamantes de póker
      light: "#e74c3c",
      dark: "#962d22",
      contrastText: "#ffffff",
    },
    success: {
      main: "#218c74", // Verde esmeralda, inspirado en mesas de póker
      light: "#2ecc71",
      dark: "#1a6952",
    },
    error: {
      main: "#c0392b", // Rojo intenso
      light: "#e74c3c",
      dark: "#962d22",
    },
    warning: {
      main: "#f39c12", // Ámbar dorado
      light: "#f1c40f",
      dark: "#d35400",
    },
    info: {
      main: "#3498db", // Azul claro
      light: "#5dade2",
      dark: "#2874a6",
    },
    background: {
      default: "#ecf0f1", // Gris muy claro con toque azulado
      paper: "#ffffff", // Blanco para los contenedores
    },
    text: {
      primary: "#2c3e50", // Azul muy oscuro, casi negro
      secondary: "#7f8c8d", // Gris medio con toque azulado
    },
    // Agregamos sección "card" personalizada
    card: {
      defaultBg: "#ffffff", // color normal de la carta
      noSelectionBg: "#ecf0f1", // cuando no hay selección, gris azulado
      border: "#bdc3c7", // Borde gris claro
      borderSelected: "#c0392b", // Rojo para selección
      boxShadow: "0px 4px 8px rgba(30, 58, 138, 0.15)", // Sombra azul profundo
      boxShadowSelected: "0px 4px 12px rgba(192, 57, 43, 0.4)", // Sombra roja
      text: "#2c3e50", // Azul muy oscuro para texto
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 500,
    },
    h2: {
      fontWeight: 500,
    },
    h3: {
      fontWeight: 500,
    },
    button: {
      textTransform: 'none', // Evita que los botones estén en mayúsculas
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8, // Bordes más redondeados
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
        },
        contained: {
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.05)',
        },
      },
    },
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#bb86fc", // Púrpura claro, más moderno y vibrante
      light: "#d4a4ff",
      dark: "#9969d3",
      contrastText: "#000000",
    },
    secondary: {
      main: "#03dac6", // Verde azulado, complementa bien con el púrpura
      light: "#84ffff",
      dark: "#00a895",
      contrastText: "#000000",
    },
    success: {
      main: "#00e676", // Verde más vibrante para el tema oscuro
      light: "#66ffa6",
      dark: "#00b248",
    },
    error: {
      main: "#cf6679", // Rojo rosado, más suave para el tema oscuro
      light: "#ff95a2",
      dark: "#9b3753",
    },
    warning: {
      main: "#ffab40", // Naranja más claro
      light: "#ffdd71",
      dark: "#c77c02",
    },
    info: {
      main: "#64b5f6", // Azul claro
      light: "#9be7ff",
      dark: "#2286c3",
    },
    background: {
      default: "#121212", // Casi negro, estándar para temas oscuros modernos
      paper: "#1e1e1e", // Un poco más claro que el fondo
    },
    text: {
      primary: "#ffffff", // Blanco para mejor contraste
      secondary: "#b0b0b0", // Gris claro para texto secundario
    },
    // Ajustes de la "card" para el tema oscuro
    card: {
      defaultBg: "#1e1e1e", // Color normal de la carta
      noSelectionBg: "#2d2d2d", // Gris un poco más claro para la carta sin selección
      border: "#3d3d3d", // Borde estándar más sutil
      borderSelected: "#bb86fc", // Borde púrpura al seleccionar
      boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.5)", // Sombra más pronunciada
      boxShadowSelected: "0px 4px 12px rgba(187, 134, 252, 0.5)", // Sombra púrpura
      text: "#ffffff", // Blanco para mejor contraste
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 400, // Un poco más ligero en tema oscuro
    },
    h2: {
      fontWeight: 400,
    },
    h3: {
      fontWeight: 400,
    },
    button: {
      textTransform: 'none', // Evita que los botones estén en mayúsculas
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8, // Bordes más redondeados
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
        },
        contained: {
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.2)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none', // Elimina el patrón de fondo en los papeles
        },
      },
    },
  },
});
