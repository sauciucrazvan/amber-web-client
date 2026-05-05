import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
/* eslint-disable react-refresh/only-export-components */

type Theme = "dark" | "light";

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [fontScale] = useState<string>(
    () => localStorage.getItem("amber.fontScale") ?? "100",
  );

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontScale}%`;
    localStorage.setItem("amber.fontScale", fontScale);
  }, [fontScale]);

  useEffect(() => {
    const stored = (localStorage.getItem("amber.theme") ??
      localStorage.getItem("theme")) as Theme | null;
    if (stored && (stored === "dark" || stored === "light")) {
      setThemeState(stored);
    } else {
      setThemeState("dark");
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("amber.theme", theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
