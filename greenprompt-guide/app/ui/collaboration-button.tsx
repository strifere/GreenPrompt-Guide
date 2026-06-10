"use client";

import { useAuth } from "@/lib/use-auth";
import Link from "next/link";
import { useEffect, useRef } from "react";

export function CollaborationButton({ onClick }: Readonly<{ onClick?: () => void }>) {
  const { user, loading } = useAuth();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;

      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
    }

    globalThis.window.addEventListener("pointerdown", onPointerDown);

    return () => {
      globalThis.window.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  if (loading) {
    return null;
  }

  if (user) {
    return (
      <Link href="/collaboration" className="animated-link" onClick={onClick}>
        Collaboration
      </Link>
    );
  }

  return (null);
}
