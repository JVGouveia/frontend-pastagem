import { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import type { ReactNode } from 'react';

interface ThemeContextType {
  mode: 'light' | 'dark';
  toggleTheme: () => void;
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: 'hsl(217, 72%, 46%)' },
    secondary: { main: '#9333ea', light: '#ede9fe', dark: '#7e22ce' },
    background: { default: '#f8fafc', paper: '#ffffff' },
    text: { primary: '#1f2937', secondary: '#6b7280' },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#90caf9' },
    secondary: { main: '#bb86fc', light: '#ede7f6', dark: '#3700b3' },
    background: { default: '#181a20', paper: '#23272f' },
    text: { primary: '#f3f4f6', secondary: '#b0b3b8' },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

export function ThemeProviderCustom({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('themeMode');
    return saved === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  const toggleTheme = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const theme = mode === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, theme }}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useThemeMode() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeMode must be used within a ThemeProviderCustom');
  }
  return context;
} 