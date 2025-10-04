import { createTheme, responsiveFontSizes } from '@mui/material/styles';
import { GeistSans } from 'geist/font/sans';

// Trigger reload
// --- BASE THEME CONFIGURATION ---
const baseTheme = createTheme({
  spacing: 8, // Using a base spacing unit of 8px
  shape: {
    borderRadius: 12, // More modern, rounded corners
  },
  typography: {
    fontFamily: [
      GeistSans.style.fontFamily,
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: { fontWeight: 700, fontSize: '2.75rem' },
    h2: { fontWeight: 700, fontSize: '2.25rem' },
    h3: { fontWeight: 600, fontSize: '1.75rem' },
    h4: { fontWeight: 600, fontSize: '1.5rem' },
    h5: { fontWeight: 600, fontSize: '1.25rem' },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 20px',
        },
        containedPrimary: {
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
          '&:hover': {
            boxShadow: '0 6px 16px rgba(59, 130, 246, 0.4)',
          }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          transition: 'all 0.3s ease-in-out',
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
        }
      }
    }
  }
});

// --- LIGHT THEME ---
const lightTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'light',
    primary: {
      main: '#3B82F6', // Blue 500
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#10B981', // Emerald 500
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F9FAFB', // Gray 50
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1F2937', // Gray 800
      secondary: '#6B7280', // Gray 500
    },
  },
});

// --- DARK THEME ---
const darkTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'dark',
    primary: {
      main: '#60A5FA', // Blue 400
      contrastText: '#1F2937',
    },
    secondary: {
      main: '#34D399', // Emerald 400
      contrastText: '#1F2937',
    },
    background: {
      default: '#111827', // Gray 900
      paper: '#1F2937', // Gray 800
    },
    text: {
      primary: '#F9FAFB', // Gray 50
      secondary: '#9CA3AF', // Gray 400
    },
  },
});

const getTheme = (mode: 'light' | 'dark') => {
  let theme = mode === 'light' ? lightTheme : darkTheme;
  theme = responsiveFontSizes(theme);
  return theme;
};

export default getTheme;