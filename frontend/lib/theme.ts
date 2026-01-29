// Theme utilities for dark mode toggle

export type ThemeMode = "light" | "dark";

export function getTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  
  const stored = localStorage.getItem("theme");
  // Migrate old "amoled" preference to "dark"
  if (stored === "amoled") return "dark";
  if (stored === "dark" || stored === "light") return stored;
  
  // Default to system preference
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

export function setTheme(theme: ThemeMode) {
  if (typeof window === "undefined") return;
  
  localStorage.setItem("theme", theme);
  
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

export function toggleTheme(): ThemeMode {
  const current = getTheme();
  const next: ThemeMode = current === "light" ? "dark" : "light";
  setTheme(next);
  return next;
}

export function initTheme() {
  const theme = getTheme();
  setTheme(theme);
}
