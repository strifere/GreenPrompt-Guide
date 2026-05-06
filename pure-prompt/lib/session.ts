import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "auth-session";
const SESSION_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

/**
 * Create a session cookie for the user
 */
export async function createSessionCookie(username: string): Promise<void> {
  const cookieStore = await cookies();
  
  const secureCookie = process.env.COOKIE_SECURE
    ? process.env.COOKIE_SECURE === "true"
    : process.env.NODE_ENV === "production";

  cookieStore.set(SESSION_COOKIE_NAME, username, {
    httpOnly: true,
    secure: secureCookie,
    sameSite: "lax",
    maxAge: SESSION_COOKIE_MAX_AGE,
    path: "/",
  });
}

/**
 * Get the current user session from cookies
 */
export async function getSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME);
  return session?.value || null;
}

/**
 * Clear the session cookie
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
