import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "@/lib/use-auth";

const usePathnameMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  usePathname: usePathnameMock,
}));

function createResponse(user: { username: string; role: string }, ok = true) {
  return {
    ok,
    json: async () => ({ user }),
  } as Response;
}

describe("useAuth", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    usePathnameMock.mockReturnValue("/login");
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  it("fetches the current user session", async () => {
    fetchMock.mockResolvedValueOnce(createResponse({ username: "victor", role: "ADMIN" }));

    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toEqual({ username: "victor", role: "ADMIN" });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/check",
      expect.objectContaining({ method: "GET", credentials: "include", cache: "no-store" })
    );
  });

  it("refreshes when the auth-changed event fires", async () => {
    fetchMock
      .mockResolvedValueOnce(createResponse({ username: "victor", role: "USER" }))
      .mockResolvedValueOnce(createResponse({ username: "ana", role: "ADMIN" }));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.user).toEqual({ username: "victor", role: "USER" }));

    act(() => {
      globalThis.dispatchEvent(new Event("auth-changed"));
    });

    await waitFor(() => expect(result.current.user).toEqual({ username: "ana", role: "ADMIN" }));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("handles auth check failures", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network down"));

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(errorSpy).toHaveBeenCalledWith("Auth check failed:", "network down");
  });
});