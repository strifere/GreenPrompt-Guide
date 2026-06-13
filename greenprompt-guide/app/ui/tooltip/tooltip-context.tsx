"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  ReactNode,
  useMemo,
} from "react";

type TooltipState = {
  visible: boolean;
  content: string;
  x: number;
  y: number;
};

type TooltipContextType = {
  show: (content: string, x: number, y: number) => void;
  hide: () => void;
  state: TooltipState;
};

const TooltipContext = createContext<TooltipContextType | null>(null);

export function TooltipProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [state, setState] = useState<TooltipState>({
    visible: false,
    content: "",
    x: 0,
    y: 0,
  });

  // Debounce hide so fast mouse movements don't flicker
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((content: string, x: number, y: number) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setState({ visible: true, content, x, y });
  }, []);

  const hide = useCallback(() => {
    hideTimer.current = setTimeout(() => {
      setState((prev) => ({ ...prev, visible: false }));
    }, 80);
  }, []);

  const value = useMemo(() => ({ show, hide, state }), [show, hide, state]);

  return (
    <TooltipContext.Provider value={value}>
      {children}
    </TooltipContext.Provider>
  );
}

export function useTooltipContext() {
  const ctx = useContext(TooltipContext);
  if (!ctx) throw new Error("useTooltipContext must be used inside TooltipProvider");
  return ctx;
}