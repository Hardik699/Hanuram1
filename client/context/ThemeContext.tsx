import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
type ColorScheme = "blue" | "purple" | "green" | "amber";

interface ThemeContextType {
  theme: Theme;
  colorScheme: ColorScheme;
  toggleTheme: () => void;
  setColorScheme: (scheme: ColorScheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>("blue");
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage and system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    const savedColorScheme = localStorage.getItem("colorScheme") as ColorScheme | null;

    // Check system preference if no saved theme
    if (!savedTheme) {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
    } else {
      setTheme(savedTheme);
    }

    if (savedColorScheme) {
      setColorSchemeState(savedColorScheme);
    }

    setMounted(true);
  }, []);

  // Apply theme to DOM
  useEffect(() => {
    if (!mounted) return;

    const html = document.documentElement;
    if (theme === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme, mounted]);

  // Apply color scheme to DOM
  useEffect(() => {
    if (!mounted) return;

    const html = document.documentElement;
    // Remove all color scheme classes
    html.classList.remove("scheme-blue", "scheme-purple", "scheme-green", "scheme-amber");
    // Add current color scheme class
    html.classList.add(`scheme-${colorScheme}`);
    localStorage.setItem("colorScheme", colorScheme);
  }, [colorScheme, mounted]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const setColorScheme = (scheme: ColorScheme) => {
    setColorSchemeState(scheme);
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, colorScheme, toggleTheme, setColorScheme }}>
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
