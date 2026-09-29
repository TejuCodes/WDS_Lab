import { createContext, useContext, useEffect, useMemo, useState } from "react";

/**
 * ============================================================
 * THEME CONTEXT
 * ------------------------------------------------------------
 * Dark mode is the DEFAULT, the choice is saved in localStorage,
 * and it survives a page refresh.
 *
 * HOW THE THREE PIECES FIT TOGETHER
 *   1. index.html has a tiny inline script that sets
 *      data-theme="dark" (or the saved value) BEFORE React loads,
 *      so the page never flashes the wrong colour.
 *   2. This context owns the "current theme" state for React.
 *   3. global.css declares the colours for [data-theme="dark"] and
 *      [data-theme="light"].
 *
 * When the theme changes we only set one attribute on <html>.
 * Every component picks up the new colours automatically because
 * they all read CSS variables.
 * ============================================================
 */

const STORAGE_KEY = "wvl-theme";
const DEFAULT_THEME = "dark";

const ThemeContext = createContext(null);

/** Reads the saved theme, falling back to dark. */
function readStoredTheme() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // Private browsing modes can throw on localStorage access.
    // Failing silently here is fine - we just use the default.
  }
  return DEFAULT_THEME;
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readStoredTheme);

  // Apply the theme to the document element and persist it.
  // useEffect with [theme] runs whenever the theme changes, and also
  // once on mount - which is what makes a refresh keep the choice.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* storage unavailable - the theme still applies for this session */
    }
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === "dark",
      toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
      setTheme,
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Reads the theme context. Throwing here is deliberate: if a
 * component calls useTheme() outside the provider, that is a
 * programming mistake and should be loud, not silent.
 */
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
