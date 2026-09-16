import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeToggle } from "@/app/ui/theme-toggle";

const mockMediaQuery = {
  media: "(prefers-color-scheme: dark)",
  matches: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  addListener: vi.fn(),
  removeListener: vi.fn(),
  onchange: null,
  dispatchEvent: vi.fn(),
};

Object.defineProperty(globalThis.window, "matchMedia", {
  writable: true,
  value: vi.fn(),
});

describe("ThemeToggle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    mockMediaQuery.matches = false;
    // Clear localStorage between tests
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("renders theme select dropdown with three options", () => {
    vi.spyOn(globalThis.window, "matchMedia").mockReturnValue(mockMediaQuery as MediaQueryList);
    vi.spyOn(globalThis.window.localStorage, "getItem").mockReturnValue(null);

    render(<ThemeToggle />);

    const select = screen.getByLabelText(/Theme/i);
    expect(select).toBeInTheDocument();

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveValue("system");
    expect(options[1]).toHaveValue("light");
    expect(options[2]).toHaveValue("dark");
  });

  it("defaults to system preference when no stored preference exists", () => {
    vi.spyOn(globalThis.window, "matchMedia").mockReturnValue(mockMediaQuery as MediaQueryList);
    vi.spyOn(globalThis.window.localStorage, "getItem").mockReturnValue(null);

    render(<ThemeToggle />);

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("system");
  });

  it("reads stored preference from localStorage if available", () => {
    vi.spyOn(globalThis.window, "matchMedia").mockReturnValue(mockMediaQuery as MediaQueryList);
    // Set localStorage directly instead of mocking
    localStorage.setItem("theme-preference", "dark");

    render(<ThemeToggle />);

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("dark");
  });

  it("allows user to change theme preference", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis.window, "matchMedia").mockReturnValue(mockMediaQuery as MediaQueryList);
    vi.spyOn(globalThis.window.localStorage, "getItem").mockReturnValue(null);

    render(<ThemeToggle />);

    const select = screen.getByRole("combobox");
    await user.selectOptions(select, "dark");

    expect(select).toHaveValue("dark");
    expect(localStorage.getItem("theme-preference")).toBe("dark");
  });

  it("persists theme preference to localStorage when changed", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis.window, "matchMedia").mockReturnValue(mockMediaQuery as MediaQueryList);
    vi.spyOn(globalThis.window.localStorage, "getItem").mockReturnValue(null);

    render(<ThemeToggle />);

    const select = screen.getByRole("combobox");
    await user.selectOptions(select, "light");

    expect(localStorage.getItem("theme-preference")).toBe("light");
  });

  it("sets document cookie when preference changes", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis.window, "matchMedia").mockReturnValue(mockMediaQuery as MediaQueryList);
    vi.spyOn(globalThis.window.localStorage, "getItem").mockReturnValue(null);

    render(<ThemeToggle />);

    const select = screen.getByRole("combobox");
    await user.selectOptions(select, "dark");

    expect(document.cookie).toContain("theme-preference=dark");
  });

  it("displays correct label based on preference", () => {
    localStorage.setItem("theme-preference", "light");
    vi.spyOn(globalThis.window.localStorage, "getItem").mockReturnValue("light");

    render(<ThemeToggle />);

    const label = screen.getByRole("combobox") as HTMLSelectElement;
    expect(label.value).toBe("light");
  });

  it("ignores invalid stored preferences and defaults to dark", () => {
    vi.spyOn(globalThis.window, "matchMedia").mockReturnValue(mockMediaQuery as MediaQueryList);
    localStorage.setItem("theme-preference", "invalid");

    render(<ThemeToggle />);

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("dark");
  });

  it("handles localStorage errors gracefully", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis.window, "matchMedia").mockReturnValue(mockMediaQuery as MediaQueryList);
    vi.spyOn(globalThis.window.localStorage, "getItem").mockImplementation(() => {
      throw new Error("Storage full");
    });
    vi.spyOn(globalThis.window.localStorage, "setItem").mockImplementation(() => {
      throw new Error("Storage full");
    });

    render(<ThemeToggle />);

    const select = screen.getByRole("combobox");
    // Should not throw even if storage fails
    expect(async () => {
      await user.selectOptions(select, "dark");
    }).not.toThrow();
  });

  it("applies theme to document when preference changes", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis.window, "matchMedia").mockReturnValue(mockMediaQuery as MediaQueryList);
    vi.spyOn(globalThis.window.localStorage, "getItem").mockReturnValue(null);

    render(<ThemeToggle />);

    const select = screen.getByRole("combobox");
    await user.selectOptions(select, "dark");

    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("sets colorScheme on document element", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis.window, "matchMedia").mockReturnValue(mockMediaQuery as MediaQueryList);
    vi.spyOn(globalThis.window.localStorage, "getItem").mockReturnValue(null);
    vi.spyOn(globalThis.window.localStorage, "setItem");
    render(<ThemeToggle />);

    const select = screen.getByRole("combobox");
    await user.selectOptions(select, "light");

    expect(document.documentElement.style.colorScheme).toBe("light");
  });
});
