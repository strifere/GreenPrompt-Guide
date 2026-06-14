"use client";

import { Info } from "lucide-react";
import { Tip } from "./tip";

type TipInfoProps = {
  content: string;
  size?: number;
  className?: string;
};

export function TipInfo({ content, size = 18, className }: Readonly<TipInfoProps>) {
  return (
    <Tip content={content}>
      <Info size={size} className={className} aria-hidden="true" />
    </Tip>
  );
}