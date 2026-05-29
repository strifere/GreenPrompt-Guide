import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export type AuthUser = {
  username: string;
  role: string;
};

/**
 * Hook to get the current user session
 * Returns the current user if logged in, null otherwise
 */
export function useAuth() {
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user from session (from cookie)
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/check", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user as AuthUser);
        } else {
          setUser(null);
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error("Auth check failed:", error.message);
        }
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    const handleAuthChanged = () => {
      setLoading(true);
      void checkAuth();
    };

    void checkAuth();
    globalThis.addEventListener("auth-changed", handleAuthChanged);

    return () => {
      globalThis.removeEventListener("auth-changed", handleAuthChanged);
    };
  }, [pathname]);

  return { user, loading };
}
