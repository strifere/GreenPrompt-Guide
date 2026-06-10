"use client";

import { useAuth } from "@/lib/use-auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { User } from "lucide-react";

export function AuthButtons() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
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

  const handleLogout = async () => {
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
        router.push("/");
        setOpen(false);
      }
    } catch (error: unknown) {
      console.error("Logout error:", error);
    } finally {
      setLoggingOut(false);
    }
  };

  if (loading) {
    return null;
  }

  if (user) {
    return (
      <div className="topbar-user-wrap">
        <button
          ref={buttonRef}
          type="button"
          className="topbar-user-button"
          data-open={open}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Open user menu"
          onClick={() => setOpen((currentValue) => !currentValue)}
        >
          <User aria-hidden size={18} />
          <span className="topbar-user-name">{user.username}</span>
        </button>

        {open ? (
          <div ref={menuRef} className="topbar-user-panel" role="menu">
            <Link href={`/user/${encodeURIComponent(user.username)}`} className="topbar-user-item" onClick={() => setOpen(false)}>
              My profile
            </Link>

            {user.role === "ADMIN" ? (
              <Link href="/admin" className="topbar-user-item" onClick={() => setOpen(false)}>
                Admin interface
              </Link>
            ) : null}

            <button
              type="button"
              className="topbar-user-item"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? "Logging Out..." : "Log Out"}
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="topbar-cta topbar-auth-desktop">
      <Link href="/login" className="ghost-btn">
        Log in
      </Link>
      <Link href="/signup" className="solid-btn">
        Sign up
      </Link>
    </div>
  );
}
