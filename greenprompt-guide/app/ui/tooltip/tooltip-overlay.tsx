"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useTooltipContext } from "./tooltip-context";

export function TooltipOverlay() {
  const { state } = useTooltipContext();
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const updatePosition = useEffectEvent(({top, left}: {top: number, left: number}) => {
    setPosition({ top, left });
  });

  useEffect(() => {
    if (!ref.current || !state.visible) return;

    const { width, height } = ref.current.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const MARGIN = 12;
    const CURSOR_OFFSET = 14; // gap below the cursor

    let top = state.y + CURSOR_OFFSET;
    let left = state.x;

    // Flip above cursor if it would overflow bottom
    if (top + height + MARGIN > viewportH) {
      top = state.y - height - CURSOR_OFFSET;
    }

    // Clamp horizontally
    if (left + width + MARGIN > viewportW) {
      left = viewportW - width - MARGIN;
    }
    if (left < MARGIN) left = MARGIN;

    updatePosition({ top, left });
  }, [state]);

  if (!state.visible) return null;

  return (
    <div
      ref={ref}
      role="tooltip"
      className="tooltip-overlay"
      style={{ top: position.top, left: position.left }}
    >
      {state.content}
    </div>
  );
}