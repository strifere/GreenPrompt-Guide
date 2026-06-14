/**
 * Tests for app/ui/tooltip/tooltip-overlay.tsx
 *
 * Covers:
 *  - Overlay is not rendered when visible=false
 *  - Overlay is rendered with the correct content when visible=true
 *  - Overlay has role="tooltip" for accessibility
 *  - Position is clamped when the tooltip would overflow the right edge
 *  - Position is flipped above the cursor when it would overflow the bottom edge
 *  - Position is clamped away from the left edge
 *  - The overlay is not interactive (pointer-events: none via CSS class)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { TooltipProvider, useTooltipContext } from "@/app/ui/tooltip/tooltip-context";
import { TooltipOverlay } from "@/app/ui/tooltip/tooltip-overlay";

// ---------------------------------------------------------------------------
// Helper: renders the overlay inside a provider and exposes a way to trigger
// show/hide without depending on real mouse events.
// ---------------------------------------------------------------------------
function Setup({ initialVisible = false }: Readonly<{ initialVisible?: boolean }>) {
  return (
    <TooltipProvider>
      <OverlayDriver initialVisible={initialVisible} />
      <TooltipOverlay />
    </TooltipProvider>
  );
}

function OverlayDriver({ }: Readonly<{ initialVisible: boolean }>) {
  const { show, hide } = useTooltipContext();

  return (
    <>
      <button
        onClick={() => show("tooltip text", 400, 300)}
        data-testid="btn-show"
      >
        show
      </button>
      <button
        onClick={() => show("edge content", 5, 300)}
        data-testid="btn-show-left-edge"
      >
        show left edge
      </button>
      <button
        onClick={() => show("edge content", 1200, 300)}
        data-testid="btn-show-right-edge"
      >
        show right edge
      </button>
      <button
        onClick={() => show("edge content", 400, 750)}
        data-testid="btn-show-bottom-edge"
      >
        show bottom edge
      </button>
      <button onClick={() => hide()} data-testid="btn-hide">
        hide
      </button>
    </>
  );
}

// ---------------------------------------------------------------------------
// Viewport helpers — jsdom defaults to 1024×768
// ---------------------------------------------------------------------------
const VIEWPORT_W = 1024;
const VIEWPORT_H = 768;

describe("TooltipOverlay", () => {
  beforeEach(() => {
    vi.useFakeTimers();

    // Give the tooltip element a realistic bounding box so positioning
    // calculations have something to work with.
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
      function (this: Element) {
        // Only mock the tooltip overlay div itself
        if ((this as HTMLElement).getAttribute("role") === "tooltip") {
          return {
            width: 200,
            height: 48,
            top: 0,
            left: 0,
            right: 200,
            bottom: 48,
            x: 0,
            y: 0,
            toJSON: () => {},
          } as DOMRect;
        }
        return {
          width: 0,
          height: 0,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          x: 0,
          y: 0,
          toJSON: () => {},
        } as DOMRect;
      }
    );

    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: VIEWPORT_W,
    });
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: VIEWPORT_H,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.runAllTimers();
    vi.useRealTimers();
  });

  // -------------------------------------------------------------------------
  // Visibility
  // -------------------------------------------------------------------------

  it("renders nothing when the tooltip is not visible", () => {
    render(<Setup />);

    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("renders the tooltip element with role=tooltip when visible", () => {
    render(<Setup />);

    act(() => {
      screen.getByTestId("btn-show").click();
    });

    expect(screen.getByRole("tooltip")).toBeDefined();
  });

  it("displays the content text passed to show()", () => {
    render(<Setup />);

    act(() => {
      screen.getByTestId("btn-show").click();
    });

    expect(screen.getByRole("tooltip").textContent).toBe("tooltip text");
  });

  it("disappears after hide() and the debounce delay", () => {
    render(<Setup />);

    act(() => {
      screen.getByTestId("btn-show").click();
    });

    expect(screen.getByRole("tooltip")).toBeDefined();

    act(() => {
      screen.getByTestId("btn-hide").click();
    });

    // Still visible before debounce
    expect(screen.getByRole("tooltip")).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("updates content when show() is called again", () => {
    function Driver() {
      const { show } = useTooltipContext();
      return (
        <>
          <button onClick={() => show("first", 100, 100)}>first</button>
          <button onClick={() => show("second", 100, 100)}>second</button>
        </>
      );
    }

    render(
      <TooltipProvider>
        <Driver />
        <TooltipOverlay />
      </TooltipProvider>
    );

    act(() => screen.getByText("first").click());
    expect(screen.getByRole("tooltip").textContent).toBe("first");

    act(() => screen.getByText("second").click());
    expect(screen.getByRole("tooltip").textContent).toBe("second");
  });

  // -------------------------------------------------------------------------
  // Accessibility
  // -------------------------------------------------------------------------

  it("has role='tooltip' for screen readers", () => {
    render(<Setup />);

    act(() => {
      screen.getByTestId("btn-show").click();
    });

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip.getAttribute("role")).toBe("tooltip");
  });

  it("applies the tooltip-overlay CSS class", () => {
    render(<Setup />);

    act(() => {
      screen.getByTestId("btn-show").click();
    });

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip.className).toContain("tooltip-overlay");
  });

  // -------------------------------------------------------------------------
  // Positioning — happy path
  // -------------------------------------------------------------------------

  it("positions the tooltip below the cursor by default (top = y + offset)", async () => {
    render(<Setup />);

    act(() => {
      screen.getByTestId("btn-show").click();
    });

    // useEffect runs after paint; flush it
    await act(async () => {});

    const tooltip = screen.getByRole("tooltip") as HTMLElement;
    const top = parseInt(tooltip.style.top, 10);

    // cursor y=300, CURSOR_OFFSET=14 → top should be 314
    expect(top).toBe(314);
  });

  it("positions the tooltip at the cursor x by default (left = x)", async () => {
    render(<Setup />);

    act(() => {
      screen.getByTestId("btn-show").click();
    });

    await act(async () => {});

    const tooltip = screen.getByRole("tooltip") as HTMLElement;
    const left = parseInt(tooltip.style.left, 10);

    // cursor x=400, tooltip width=200, viewport=1024 → no clamping needed
    expect(left).toBe(400);
  });

  // -------------------------------------------------------------------------
  // Positioning — overflow clamping
  // -------------------------------------------------------------------------

  it("clamps left position away from the right viewport edge", async () => {
    render(<Setup />);

    // cursor x=1200 → tooltip would overflow right (1200+200+12 > 1024)
    act(() => {
      screen.getByTestId("btn-show-right-edge").click();
    });

    await act(async () => {});

    const tooltip = screen.getByRole("tooltip") as HTMLElement;
    const left = parseInt(tooltip.style.left, 10);

    // Expected: 1024 - 200 - 12 = 812
    expect(left).toBe(VIEWPORT_W - 200 - 12);
  });

  it("clamps left position away from the left viewport edge", async () => {
    render(<Setup />);

    // cursor x=5 → tooltip would go negative
    act(() => {
      screen.getByTestId("btn-show-left-edge").click();
    });

    await act(async () => {});

    const tooltip = screen.getByRole("tooltip") as HTMLElement;
    const left = parseInt(tooltip.style.left, 10);

    // Expected: clamped to MARGIN (12)
    expect(left).toBe(12);
  });

  it("flips the tooltip above the cursor when it would overflow the bottom edge", async () => {
    render(<Setup />);

    // cursor y=750, tooltip height=48, offset=14 → 750+14+48+12 > 768
    act(() => {
      screen.getByTestId("btn-show-bottom-edge").click();
    });

    await act(async () => {});

    const tooltip = screen.getByRole("tooltip") as HTMLElement;
    const top = parseInt(tooltip.style.top, 10);

    // Expected: y - height - CURSOR_OFFSET = 750 - 48 - 14 = 688
    expect(top).toBe(750 - 48 - 14);
  });
});
