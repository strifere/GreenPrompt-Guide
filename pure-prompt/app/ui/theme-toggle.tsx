"use client";

import { useEffect, useState, type ChangeEvent } from "react";

type ThemePreference = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "theme-preference";
const COOKIE_NAME = "theme-preference";

function getSystemTheme(): ResolvedTheme {
  if (!globalThis.window) {
    return "light";
  }

  return globalThis.window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(preference: ThemePreference): ResolvedTheme {
  return preference === "system" ? getSystemTheme() : preference;
}

function writeThemePreference(preference: ThemePreference) {
  if (!globalThis.window) {
    return;
  }

  const activeWindow = globalThis.window;

  try {
    activeWindow.localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // Ignore storage failures and fall back to the cookie path.
  }

  globalThis.document.cookie = `${COOKIE_NAME}=${preference}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

function readStoredPreference(): ThemePreference | null {
  if (!globalThis.window) {
    return null;
  }

  const activeWindow = globalThis.window;

  try {
    const localValue = activeWindow.localStorage.getItem(STORAGE_KEY);

    if (localValue === "light" || localValue === "dark" || localValue === "system") {
      return localValue;
    }
  } catch {
    // Ignore storage failures and continue with the cookie fallback.
  }

  const cookieValue = globalThis.document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${COOKIE_NAME}=`))
    ?.split("=")[1];

  if (cookieValue === "light" || cookieValue === "dark" || cookieValue === "system") {
    return cookieValue;
  }

  return null;
}

function applyTheme(preference: ThemePreference) {
  if (!globalThis.window) {
    return;
  }

  const root = globalThis.document.documentElement;
  const resolvedTheme = resolveTheme(preference);

  root.style.colorScheme = resolvedTheme;

  if (preference === "system") {
    delete root.dataset.theme;
    return;
  }

  root.dataset.theme = preference;
}

export function ThemeToggle() {
  const [preference, setPreference] = useState<ThemePreference>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");

  useEffect(() => {
    const storedPreference = readStoredPreference();
    const nextPreference = storedPreference ?? "system";

    setPreference(nextPreference);
    setResolvedTheme(resolveTheme(nextPreference));
    applyTheme(nextPreference);
  }, []);

  useEffect(() => {
    if (preference !== "system") {
      setResolvedTheme(preference);
      return;
    }

    const mediaQuery = globalThis.window.matchMedia("(prefers-color-scheme: dark)");
    const updateResolvedTheme = () => {
      setResolvedTheme(mediaQuery.matches ? "dark" : "light");
    };

    updateResolvedTheme();
    mediaQuery.addEventListener("change", updateResolvedTheme);

    return () => mediaQuery.removeEventListener("change", updateResolvedTheme);
  }, [preference]);

  function selectTheme(nextPreference: ThemePreference) {
    setPreference(nextPreference);
    setResolvedTheme(resolveTheme(nextPreference));
    writeThemePreference(nextPreference);
    applyTheme(nextPreference);
  }

  function onChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextPreference = event.currentTarget.value;

    if (nextPreference === "light" || nextPreference === "dark" || nextPreference === "system") {
      selectTheme(nextPreference);
    }
  }

  const activeLabel = preference === "system" ? `System (${resolvedTheme})` : preference[0].toUpperCase() + preference.slice(1);

  return (
    <div className="theme-select-wrap">
      <label className="sr-only" htmlFor="theme-select">
        Theme
      </label>

      <select
        id="theme-select"
        className="theme-select"
        value={preference}
        aria-label={`Theme: ${activeLabel}`}
        onChange={onChange}
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </div>
  );
}