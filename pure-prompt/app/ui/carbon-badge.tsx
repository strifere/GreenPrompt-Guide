"use client";

import { useEffect, useState } from "react";
import { WebsiteCarbonBadge } from 'react-websitecarbon-badge';

type ThemePreference = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

type CarbonBadgeProps = {
  initialTheme?: ThemePreference;
  url: string;
};

function getResolvedTheme(): ResolvedTheme {
  const rootTheme = globalThis.document.documentElement.getAttribute("data-theme");

  if (rootTheme === "light" || rootTheme === "dark") {
    return rootTheme;
  }

  return globalThis.window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function CarbonBadge({ initialTheme, url }: CarbonBadgeProps) {
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

  return <WebsiteCarbonBadge dark={resolvedTheme === "dark"} url={url} />;
}