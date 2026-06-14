/**
 * Tests for app/ui/tooltip/tooltip-context.tsx
 *
 * Covers:
 *  - TooltipProvider renders children
 *  - show() makes the tooltip visible with the correct content and coords
 *  - hide() makes the tooltip invisible (with debounce)
 *  - Calling show() after hide() cancels the pending hide
 *  - useTooltipContext returns a no-op default when used outside a provider
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { useEffect } from "react";
import {
  TooltipProvider,
  useTooltipContext,
} from "@/app/ui/tooltip/tooltip-context";

// ---------------------------------------------------------------------------
// Helper: a component that exposes the context state via data-testid attributes
// so we can assert on it without coupling to the overlay UI.
// ---------------------------------------------------------------------------
function ContextInspector() {
  const { state, show, hide } = useTooltipContext();

  return (
    <div>
      <span data-testid="visible">{String(state.visible)}</span>
      <span data-testid="content">{state.content}</span>
      <span data-testid="x">{state.x}</span>
      <span data-testid="y">{state.y}</span>
      <button onClick={() => show("hello tooltip", 100, 200)}>show</button>
      <button onClick={() => hide()}>hide</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper: component that calls show() on mount so we can test effects
// ---------------------------------------------------------------------------
function AutoShower({
  content,
  x,
  y,
}: {
  content: string;
  x: number;
  y: number;
}) {
  const { show } = useTooltipContext();
  useEffect(() => {
    show(content, x, y);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

// ---------------------------------------------------------------------------
// Helper: component that calls hide() on mount
// ---------------------------------------------------------------------------
function AutoHider() {
  const { hide } = useTooltipContext();
  useEffect(() => {
    hide();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("TooltipProvider", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runAllTimers();
    vi.useRealTimers();
  });

  it("renders its children", () => {
    render(
      <TooltipProvider>
        <span data-testid="child">child content</span>
      </TooltipProvider>
    );

    expect(screen.getByTestId("child")).toBeDefined();
    expect(screen.getByTestId("child").textContent).toBe("child content");
  });

  it("starts with tooltip not visible", () => {
    render(
      <TooltipProvider>
        <ContextInspector />
      </TooltipProvider>
    );

    expect(screen.getByTestId("visible").textContent).toBe("false");
    expect(screen.getByTestId("content").textContent).toBe("");
    expect(screen.getByTestId("x").textContent).toBe("0");
    expect(screen.getByTestId("y").textContent).toBe("0");
  });

  it("show() sets visible=true, content, x, and y", () => {
    render(
      <TooltipProvider>
        <ContextInspector />
      </TooltipProvider>
    );

    act(() => {
      screen.getByText("show").click();
    });

    expect(screen.getByTestId("visible").textContent).toBe("true");
    expect(screen.getByTestId("content").textContent).toBe("hello tooltip");
    expect(screen.getByTestId("x").textContent).toBe("100");
    expect(screen.getByTestId("y").textContent).toBe("200");
  });

  it("show() accepts arbitrary content and coordinates", () => {
    function CustomShower() {
      const { show } = useTooltipContext();
      return (
        <button onClick={() => show("custom content", 42, 84)}>trigger</button>
      );
    }

    render(
      <TooltipProvider>
        <ContextInspector />
        <CustomShower />
      </TooltipProvider>
    );

    act(() => {
      screen.getByText("trigger").click();
    });

    expect(screen.getByTestId("content").textContent).toBe("custom content");
    expect(screen.getByTestId("x").textContent).toBe("42");
    expect(screen.getByTestId("y").textContent).toBe("84");
  });

  it("hide() sets visible=false after the debounce delay", () => {
    render(
      <TooltipProvider>
        <ContextInspector />
      </TooltipProvider>
    );

    // First make it visible
    act(() => {
      screen.getByText("show").click();
    });
    expect(screen.getByTestId("visible").textContent).toBe("true");

    // Trigger hide — should still be visible before the timer fires
    act(() => {
      screen.getByText("hide").click();
    });
    expect(screen.getByTestId("visible").textContent).toBe("true");

    // Advance timers past the 80 ms debounce
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.getByTestId("visible").textContent).toBe("false");
  });

  it("calling show() while a hide() is pending cancels the hide", () => {
    render(
      <TooltipProvider>
        <ContextInspector />
      </TooltipProvider>
    );

    // Show, then immediately hide, then show again before the timer fires
    act(() => {
      screen.getByText("show").click();
    });
    act(() => {
      screen.getByText("hide").click();
    });
    act(() => {
      screen.getByText("show").click();
    });

    // Advance past the debounce — the second show should have cancelled the hide
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(screen.getByTestId("visible").textContent).toBe("true");
  });

  it("show() updates coordinates on subsequent calls", () => {
    function MultiShower() {
      const { show } = useTooltipContext();
      return (
        <>
          <button onClick={() => show("first", 10, 20)}>first</button>
          <button onClick={() => show("second", 300, 400)}>second</button>
        </>
      );
    }

    render(
      <TooltipProvider>
        <ContextInspector />
        <MultiShower />
      </TooltipProvider>
    );

    act(() => {
      screen.getByText("first").click();
    });
    expect(screen.getByTestId("x").textContent).toBe("10");

    act(() => {
      screen.getByText("second").click();
    });
    expect(screen.getByTestId("x").textContent).toBe("300");
    expect(screen.getByTestId("y").textContent).toBe("400");
    expect(screen.getByTestId("content").textContent).toBe("second");
  });
});

// ---------------------------------------------------------------------------
// Default context (no provider)
// ---------------------------------------------------------------------------

describe("useTooltipContext outside TooltipProvider", () => {
  it("returns a no-op context with safe defaults instead of throwing", () => {
    // After the fix described in the conversation, useTooltipContext must NOT
    // throw when rendered outside a provider — it should return a no-op default.
    function Consumer() {
      const ctx = useTooltipContext();
      return (
        <span data-testid="ok">
          {String(ctx.state.visible)}
        </span>
      );
    }

    // Should not throw
    expect(() => render(<Consumer />)).not.toThrow();
    expect(screen.getByTestId("ok").textContent).toBe("false");
  });

  it("calling show/hide on the default no-op context does not throw", () => {
    function Consumer() {
      const { show, hide } = useTooltipContext();
      return (
        <>
          <button onClick={() => show("x", 0, 0)}>show</button>
          <button onClick={() => hide()}>hide</button>
        </>
      );
    }

    render(<Consumer />);

    expect(() => {
      act(() => screen.getByText("show").click());
    }).not.toThrow();

    expect(() => {
      act(() => screen.getByText("hide").click());
    }).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// AutoShower / AutoHider (mount-time effect paths)
// ---------------------------------------------------------------------------

describe("TooltipProvider — effect-based show/hide", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runAllTimers();
    vi.useRealTimers();
  });

  it("show() called in useEffect is reflected in context state", () => {
    render(
      <TooltipProvider>
        <ContextInspector />
        <AutoShower content="effect content" x={5} y={15} />
      </TooltipProvider>
    );

    expect(screen.getByTestId("visible").textContent).toBe("true");
    expect(screen.getByTestId("content").textContent).toBe("effect content");
  });

  it("hide() called in useEffect hides after debounce", () => {
    render(
      <TooltipProvider>
        <ContextInspector />
        <AutoShower content="first" x={0} y={0} />
        <AutoHider />
      </TooltipProvider>
    );

    // Before debounce elapses
    expect(screen.getByTestId("visible").textContent).toBe("true");

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByTestId("visible").textContent).toBe("false");
  });
});
