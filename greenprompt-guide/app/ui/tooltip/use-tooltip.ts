"use client";

import { useCallback } from "react";
import { useTooltipContext } from "./tooltip-context";

export function useTooltip(content: string) {
  const { show, hide } = useTooltipContext();

  const onMouseEnter = useCallback(
    (e: React.MouseEvent) => {
      if (content) show(content, e.clientX, e.clientY);
    },
    [content, show]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (content) show(content, e.clientX, e.clientY);
    },
    [content, show]
  );

  const onMouseLeave = useCallback(() => hide(), [hide]);

  // Accessibility: keyboard focus support
  const onFocus = useCallback(
    (e: React.FocusEvent) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      if (content) show(content, rect.left + rect.width / 2, rect.bottom);
    },
    [content, show]
  );

  const onBlur = useCallback(() => hide(), [hide]);

  return {
    onMouseEnter,
    onMouseMove,
    onMouseLeave,
    onFocus,
    onBlur,
    "aria-describedby": "global-tooltip",
  };
}