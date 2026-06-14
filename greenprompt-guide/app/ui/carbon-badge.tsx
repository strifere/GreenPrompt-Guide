"use client";

import { useEffect, useState } from "react";
import { WebsiteCarbonBadge } from 'react-websitecarbon-badge';

type ThemePreference = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

type CarbonBadgeProps = {
  initialTheme?: ThemePreference;
};

function getResolvedTheme(): ResolvedTheme {
  const rootTheme = globalThis.document.documentElement.dataset.theme;

  if (rootTheme === "light" || rootTheme === "dark") {
    return rootTheme;
  }

  return globalThis.window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function CarbonBadge({ initialTheme }: Readonly<CarbonBadgeProps>) {
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme | null>(() => {
    if (initialTheme === "light" || initialTheme === "dark") {
      return initialTheme;
    }

    return null;
  });

  useEffect(() => {
    const syncTheme = () => setResolvedTheme(getResolvedTheme());

    syncTheme();

    const root = globalThis.document.documentElement;
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    const mediaQuery = globalThis.window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", syncTheme);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener("change", syncTheme);
    };
  }, []);

  if (resolvedTheme === null) {
    return null;
  }

  return <WebsiteCarbonBadge lang="en" dark={resolvedTheme === "dark"} co2="0.03" percentage="95" url="nattech.fib.upc.edu:40660" />;
}