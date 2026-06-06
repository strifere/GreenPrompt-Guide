
import { renderHook, waitFor, act } from "@testing-library/react";
import { vi } from "vitest";
import { useAuth } from "@/lib/use-auth";
import { usePathname } from "next/navigation";

// Mock the next/navigation module
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

// Mock the fetch function
global.fetch = vi.fn();

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (usePathname as vi.Mock).mockReturnValue("/some-path");
  });

  it("should return loading true initially", () => {
    (fetch as vi.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { username: "test", role: "user" } }),
    });
    const { result } = renderHook(() => useAuth());
    expect(result.current.loading).toBe(true);
  });

  it("should return user when authenticated", async () => {
    const mockUser = { username: "test", role: "user" };
    (fetch as vi.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser }),
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.loading).toBe(false);
    });
  });

  it("should return null when not authenticated", async () => {
    (fetch as vi.Mock).mockResolvedValueOnce({
      ok: false,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBe(false);
    });
  });

  it("should handle fetch throwing an error", async () => {
    (fetch as vi.Mock).mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBe(false);
    });
  });

  it("should refetch user when auth-changed event is dispatched", async () => {
    const mockUser1 = { username: "test1", role: "user" };
    const mockUser2 = { username: "test2", role: "admin" };

    (fetch as vi.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser1 }),
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser1);
    });

    (fetch as vi.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser2 }),
    });

    act(() => {
      global.dispatchEvent(new Event("auth-changed"));
    });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser2);
      expect(result.current.loading).toBe(false);
    });
  });

  it("should normalize user correctly when user is a string", async () => {
    const mockResponse = { user: "testuser", role: "editor" };
    const expectedUser = { username: "testuser", role: "editor" };
    (fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });
  
      const { result } = renderHook(() => useAuth());
  
      await waitFor(() => {
        expect(result.current.user).toEqual(expectedUser);
        expect(result.current.loading).toBe(false);
      });
  });

  it("should return null if role is not a string when normalizing", async () => {
    const mockResponse = { user: "testuser", role: null };
    (fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });
  
      const { result } = renderHook(() => useAuth());
  
      await waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.loading).toBe(false);
      });
  });

  it("should return null if user object is invalid", async () => {
    const mockResponse = { user: { name: "test" }, role: "user" }; // Invalid user object
    (fetch as vi.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });
  
      const { result } = renderHook(() => useAuth());
  
      await waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.loading).toBe(false);
      });
  });
});
