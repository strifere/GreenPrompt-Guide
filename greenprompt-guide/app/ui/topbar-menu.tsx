"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "@/lib/use-auth";
import { Menu } from "lucide-react";
import { CollaborationButton } from "./collaboration-button";

function MenuIcon() {
  return (
    <Menu aria-hidden size={23} strokeWidth={1.5} />
  );
}

export function TopbarMenu() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;

      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }

      setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    globalThis.window.addEventListener("pointerdown", onPointerDown);
    globalThis.window.addEventListener("keydown", onKeyDown);

    return () => {
      globalThis.window.removeEventListener("pointerdown", onPointerDown);
      globalThis.window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  function toggleMenu() {
    setOpen((currentValue) => !currentValue);
  }

  function closeMenu() {
    setOpen(false);
  }

  return (
    <div className="topbar-menu-wrap">
      <button
        ref={buttonRef}
        type="button"
        className="topbar-menu-button"
        data-open={open}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open menu"
        onClick={toggleMenu}
      >
        <MenuIcon />
      </button>

      {open ? (
        <div ref={menuRef} className="topbar-menu-panel">
          <nav className="topnav-links topnav-links-mobile" aria-label="Primary">
            <Link href="/catalog" className="animated-link" onClick={closeMenu}>
              Catalog
            </Link>
            <Link href="/glossary" className="animated-link" onClick={closeMenu}>
              Glossary
            </Link>
            <CollaborationButton onClick={closeMenu} />
            <Link href="/#about-greenprompt-guide" className="animated-link" onClick={closeMenu}>
              About
            </Link>
          </nav>

          <div className="topbar-menu-actions">
            <ThemeToggle />
            {!loading && !user ? (
              <>
                <Link href="/login" className="ghost-btn" onClick={closeMenu}>
                  Log in
                </Link>
                <Link href="/signup" className="solid-btn" onClick={closeMenu}>
                  Sign up
                </Link>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}