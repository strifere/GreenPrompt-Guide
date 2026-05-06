"use client";

import { useAuth } from "@/lib/use-auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

export function AuthButtons() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

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
      <div className="topbar-cta topbar-cta-desktop" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <span style={{ fontSize: "0.95rem" }}>Welcome, {user}</span>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="ghost-btn"
          style={{ cursor: loggingOut ? "not-allowed" : "pointer", opacity: loggingOut ? 0.6 : 1 }}
        >
          {loggingOut ? "Logging Out..." : "Log Out"}
        </button>
      </div>
    );
  }

  return (
    <div className="topbar-cta topbar-cta-desktop">
      <Link href="/login" className="ghost-btn">
        Log in
      </Link>
      <Link href="/signup" className="solid-btn">
        Sign up
      </Link>
    </div>
  );
}
