"use client";

import { cloneElement, isValidElement, ReactElement, ReactNode } from "react";
import { useTooltip } from "./use-tooltip";

type TipProps = {
  content: string;
  children: ReactNode;
};

export function Tip({ content, children }: Readonly<TipProps>) {
  const tooltipProps = useTooltip(content);

  if (!isValidElement(children)) return <>{children}</>;

  return cloneElement(children as ReactElement<Record<string, unknown>>, {
    ...tooltipProps,
  });
}