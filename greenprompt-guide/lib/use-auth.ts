import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export type AuthUser = {
  username: string;
  role: string;
};

type AuthCheckResponse = {
  user?: string | AuthUser;
  role?: string | null;
};

/**
 * Hook to get the current user session
 * Returns the current user if logged in, null otherwise
 */
export function useAuth() {
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  function normalizeUser(responseData: AuthCheckResponse): AuthUser | null {
    if (typeof responseData.user === "string") {
      if (typeof responseData.role !== "string") {
        return null;
      }

      return {
        username: responseData.user,
        role: responseData.role,
      };
    }

    if (
      responseData.user &&
      typeof responseData.user.username === "string" &&
      typeof responseData.user.role === "string"
    ) {
      return responseData.user;
    }

    return null;
  }

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
          const data = (await response.json()) as AuthCheckResponse;
          setUser(normalizeUser(data));
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
