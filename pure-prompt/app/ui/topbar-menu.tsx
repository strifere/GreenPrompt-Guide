"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

function MenuIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="topbar-menu-icon">
      <path d="M4 6.5h16M4 12h16M4 17.5h16" />
    </svg>
  );
}

export function TopbarMenu() {
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
            <Link href="/catalog" onClick={closeMenu}>
              Catalog
            </Link>
            <Link href="/contribute" onClick={closeMenu}>
              Contribute
            </Link>
            <Link href="/" onClick={closeMenu}>
              About
            </Link>
          </nav>

          <div className="topbar-menu-actions">
            <ThemeToggle />
            <Link href="/login" className="ghost-btn" onClick={closeMenu}>
              Log in
            </Link>
            <Link href="/signup" className="solid-btn" onClick={closeMenu}>
              Sign up
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}