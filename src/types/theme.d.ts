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
}
