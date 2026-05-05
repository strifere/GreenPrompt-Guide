"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "@/lib/use-auth";
import { Menu } from "lucide-react";

function MenuIcon() {
  return (
    <Menu aria-hidden size={23} strokeWidth={1.5} />
  );
}

type MenuAuthActionsProps = {
  loading: boolean;
  user: string | null;
  loggingOut: boolean;
  closeMenu: () => void;
  handleLogout: () => void;
};

function MenuAuthActions({
  loading,
  user,
  loggingOut,
  closeMenu,
  handleLogout,
}: Readonly<MenuAuthActionsProps>) {
  if (loading) {
    return null;
  }

  if (user) {
    return (
      <>
        <span style={{ fontSize: "0.95rem" }}>Welcome, {user}</span>
        <button
          type="button"
          className="ghost-btn"
          onClick={handleLogout}
          disabled={loggingOut}
          style={{ cursor: loggingOut ? "not-allowed" : "pointer", opacity: loggingOut ? 0.6 : 1 }}
        >
          {loggingOut ? "Logging Out..." : "Log Out"}
        </button>
      </>
    );
  }

  return (
    <>
      <Link href="/login" className="ghost-btn" onClick={closeMenu}>
        Log in
      </Link>
      <Link href="/signup" className="solid-btn" onClick={closeMenu}>
        Sign up
      </Link>
    </>
  );
}

export function TopbarMenu() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
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

  async function handleLogout() {
    setLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        globalThis.dispatchEvent(new Event("auth-changed"));
        router.refresh();
        closeMenu();
        router.push("/");
      }
    } catch (error: unknown) {
      console.error("Logout error:", error);
    } finally {
      setLoggingOut(false);
    }
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
            <Link href="/collaboration" className="animated-link" onClick={closeMenu}>
              Collaboration
            </Link>
            <Link href="/" className="animated-link" onClick={closeMenu}>
              About
            </Link>
          </nav>

          <div className="topbar-menu-actions">
            <ThemeToggle />
            <MenuAuthActions
              loading={loading}
              user={user}
              loggingOut={loggingOut}
              closeMenu={closeMenu}
              handleLogout={handleLogout}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}