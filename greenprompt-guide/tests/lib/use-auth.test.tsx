import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuth } from "@/lib/use-auth";

const usePathnameMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  usePathname: usePathnameMock,
}));

function createResponse(user: string, ok = true) {
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
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);
    fetchMock.mockReset();
  });

  it("fetches the current user session", async () => {
    fetchMock.mockResolvedValueOnce(createResponse("victor"));

    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBe("victor");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/check",
      expect.objectContaining({ method: "GET", credentials: "include", cache: "no-store" })
    );
  });

  it("refreshes when the auth-changed event fires", async () => {
    fetchMock
      .mockResolvedValueOnce(createResponse("victor"))
      .mockResolvedValueOnce(createResponse("ana"));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.user).toBe("victor"));

    act(() => {
      globalThis.dispatchEvent(new Event("auth-changed"));
    });

    await waitFor(() => expect(result.current.user).toBe("ana"));
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