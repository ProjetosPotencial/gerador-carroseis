import { createContext, useContext, useEffect, useState } from "react";
import { THEMES, type Theme, type Mode } from "./designSystem";

interface ThemeContextValue {
  theme: Theme;
  mode: Mode;
  setMode: (mode: Mode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "gerador_potencial_theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<Mode>(() => {
    if (typeof window === "undefined") return "dark";
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Mode | null;
      if (saved === "dark" || saved === "light") return saved;
    } catch {}
    return "dark";
  });

  const setMode = (newMode: Mode) => {
    setModeState(newMode);
    try {
      localStorage.setItem(STORAGE_KEY, newMode);
    } catch {}
  };

  const toggle = () => setMode(mode === "dark" ? "light" : "dark");

  // Aplica cor de fundo no <body> pra transições suaves
  useEffect(() => {
    const theme = THEMES[mode];
    document.body.style.backgroundColor = theme.bg.base;
    document.body.style.color = theme.text.primary;
    document.body.style.transition = "background-color 250ms ease, color 250ms ease";
    document.documentElement.setAttribute("data-theme", mode);
  }, [mode]);

  const theme = THEMES[mode];

  return (
    <ThemeContext.Provider value={{ theme, mode, setMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Fallback seguro: devolve dark sem quebrar
    return {
      theme: THEMES.dark,
      mode: "dark",
      setMode: () => {},
      toggle: () => {},
    };
  }
  return ctx;
}
