import { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/material';
import { getTheme } from '../theme';

const ThemeContext = createContext();

export function useThemeMode() {
  return useContext(ThemeContext);
}

export function ThemeModeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    try {
      return localStorage.getItem('themeMode') || 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('themeMode', mode);
    } catch {}
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const theme = useMemo(() => getTheme(mode), [mode]);
  const toggleMode = () => setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ mode, toggleMode }}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeContext.Provider>
  );
}
