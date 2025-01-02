import { createTheme } from "@mui/material/styles";

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#ef6c00",
    },
    background: {
      default: "#f5f5f5",
      paper: "#ffffff",
    },
    text: {
      primary: "#333333",
      secondary: "#757575",
    },
    // Agregamos sección "card" personalizada
    card: {
      defaultBg: "#ffffff", // color normal de la carta
      noSelectionBg: "#e0e0e0", // cuando no hay selección
      border: "#ccc",
      borderSelected: "#ff9800",
      boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
      boxShadowSelected: "0px 4px 12px rgba(255, 152, 0, 0.7)",
      text: "#333", // color principal del texto en la carta
    },
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#651fff",
    },
    secondary: {
      main: "#ffb74d",
    },
    background: {
      // Un gris oscuro para el fondo principal
      default: "#242424",
      // Un gris ligeramente más claro para los contenedores/paneles
      paper: "#2f2f2f",
    },
    text: {
      primary: "#efefef", // Un gris muy claro para mantener legibilidad
      secondary: "#b0b0b0",
    },
    // Ajustes de la "card" para el tema oscuro
    card: {
      defaultBg: "#2f2f2f", // Color normal de la carta
      noSelectionBg: "#3a3a3a", // Gris un poco más claro para la carta sin selección
      border: "#555", // Borde estándar
      borderSelected: "#ffb74d", // Borde al seleccionar
      boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.4)",
      boxShadowSelected: "0px 4px 12px rgba(255, 183, 77, 0.7)",
      text: "#ddd", // Color de texto para la carta
    },
  },
});
