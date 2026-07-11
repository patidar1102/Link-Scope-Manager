import { useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("linkscope-theme") as Theme;
      if (stored) return stored;
    }
    return "light"; // default to light as requested
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
    localStorage.setItem("linkscope-theme", theme);
  }, [theme]);

  return {
    theme,
    setTheme,
    isDark: theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
  };
}