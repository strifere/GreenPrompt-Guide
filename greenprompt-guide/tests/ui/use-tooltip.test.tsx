/**
 * Tests for app/ui/tooltip/use-tooltip.ts
 *
 * Covers:
 *  - onMouseEnter calls show() with content and cursor coordinates
 *  - onMouseMove updates the coordinates on subsequent moves
 *  - onMouseLeave calls hide()
 *  - onFocus calls show() using the element's bounding rect (bottom-centre)
 *  - onBlur calls hide()
 *  - Returns aria-describedby attribute
 *  - Does nothing when content is an empty string (no show() call)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { useTooltip } from "@/app/ui/tooltip/use-tooltip";
import { TooltipProvider, useTooltipContext } from "@/app/ui/tooltip/tooltip-context";

// ---------------------------------------------------------------------------
// Helper: renders a button with useTooltip attached and a state inspector
// ---------------------------------------------------------------------------
function TooltipTarget({
  content,
  testId = "target",
}: {
  content: string;
  testId?: string;
}) {
  const tooltipProps = useTooltip(content);
  return (
    <button data-testid={testId} {...tooltipProps}>
      hover me
    </button>
  );
}

function StateInspector() {
  const { state } = useTooltipContext();
  return (
    <>
      <span data-testid="visible">{String(state.visible)}</span>
      <span data-testid="content">{state.content}</span>
      <span data-testid="x">{state.x}</span>
      <span data-testid="y">{state.y}</span>
    </>
  );
}

function Wrapper({
  content,
  testId,
}: {
  content: string;
  testId?: string;
}) {
  return (
    <TooltipProvider>
      <StateInspector />
      <TooltipTarget content={content} testId={testId} />
    </TooltipProvider>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useTooltip", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runAllTimers();
    vi.useRealTimers();
  });

  // -------------------------------------------------------------------------
  // Mouse events
  // -------------------------------------------------------------------------

  it("onMouseEnter calls show() with the content and cursor coordinates", () => {
    render(<Wrapper content="enter tooltip" />);

    act(() => {
      fireEvent.mouseEnter(screen.getByTestId("target"), {
        clientX: 150,
        clientY: 250,
      });
    });

    expect(screen.getByTestId("visible").textContent).toBe("true");
    expect(screen.getByTestId("content").textContent).toBe("enter tooltip");
    expect(screen.getByTestId("x").textContent).toBe("150");
    expect(screen.getByTestId("y").textContent).toBe("250");
  });

  it("onMouseMove updates the tooltip coordinates", () => {
    render(<Wrapper content="move tooltip" />);

    act(() => {
      fireEvent.mouseEnter(screen.getByTestId("target"), {
        clientX: 100,
        clientY: 100,
      });
    });

    act(() => {
      fireEvent.mouseMove(screen.getByTestId("target"), {
        clientX: 200,
        clientY: 300,
      });
    });

    expect(screen.getByTestId("x").textContent).toBe("200");
    expect(screen.getByTestId("y").textContent).toBe("300");
  });

  it("onMouseLeave calls hide() (tooltip becomes invisible after debounce)", () => {
    render(<Wrapper content="leave tooltip" />);

    act(() => {
      fireEvent.mouseEnter(screen.getByTestId("target"), {
        clientX: 50,
        clientY: 50,
      });
    });
    expect(screen.getByTestId("visible").textContent).toBe("true");

    act(() => {
      fireEvent.mouseLeave(screen.getByTestId("target"));
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByTestId("visible").textContent).toBe("false");
  });

  // -------------------------------------------------------------------------
  // Keyboard / focus events
  // -------------------------------------------------------------------------

  it("onFocus calls show() using the element's bounding rect bottom-centre", () => {
    // Mock getBoundingClientRect for the target element
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
      left: 40,
      right: 140,
      bottom: 80,
      top: 60,
      width: 100,
      height: 20,
      x: 40,
      y: 60,
      toJSON: () => {},
    } as DOMRect);

    render(<Wrapper content="focus tooltip" />);

    act(() => {
      fireEvent.focus(screen.getByTestId("target"));
    });

    expect(screen.getByTestId("visible").textContent).toBe("true");
    expect(screen.getByTestId("content").textContent).toBe("focus tooltip");
    // x = left + width / 2 = 40 + 50 = 90
    expect(screen.getByTestId("x").textContent).toBe("90");
    // y = bottom = 80
    expect(screen.getByTestId("y").textContent).toBe("80");

    vi.restoreAllMocks();
  });

  it("onBlur calls hide() (tooltip becomes invisible after debounce)", () => {
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
      left: 0,
      right: 100,
      bottom: 50,
      top: 30,
      width: 100,
      height: 20,
      x: 0,
      y: 30,
      toJSON: () => {},
    } as DOMRect);

    render(<Wrapper content="blur tooltip" />);

    act(() => {
      fireEvent.focus(screen.getByTestId("target"));
    });
    expect(screen.getByTestId("visible").textContent).toBe("true");

    act(() => {
      fireEvent.blur(screen.getByTestId("target"));
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByTestId("visible").textContent).toBe("false");

    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Empty content guard
  // -------------------------------------------------------------------------

  it("does not call show() when content is an empty string on mouseEnter", () => {
    render(<Wrapper content="" />);

    act(() => {
      fireEvent.mouseEnter(screen.getByTestId("target"), {
        clientX: 99,
        clientY: 99,
      });
    });

    // visible should remain false because content is empty
    expect(screen.getByTestId("visible").textContent).toBe("false");
  });

  it("does not call show() when content is an empty string on mouseMove", () => {
    render(<Wrapper content="" />);

    act(() => {
      fireEvent.mouseMove(screen.getByTestId("target"), {
        clientX: 99,
        clientY: 99,
      });
    });

    expect(screen.getByTestId("visible").textContent).toBe("false");
  });

  it("does not call show() when content is an empty string on focus", () => {
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
      left: 0,
      right: 100,
      bottom: 50,
      top: 30,
      width: 100,
      height: 20,
      x: 0,
      y: 30,
      toJSON: () => {},
    } as DOMRect);

    render(<Wrapper content="" />);

    act(() => {
      fireEvent.focus(screen.getByTestId("target"));
    });

    expect(screen.getByTestId("visible").textContent).toBe("false");

    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Accessibility attribute
  // -------------------------------------------------------------------------

  it("spreads aria-describedby onto the target element", () => {
    render(<Wrapper content="aria tooltip" />);

    const target = screen.getByTestId("target");
    expect(target.getAttribute("aria-describedby")).toBe("global-tooltip");
  });

  // -------------------------------------------------------------------------
  // Multiple targets — each has independent content
  // -------------------------------------------------------------------------

  it("shows the correct content for the most recently hovered target", () => {
    render(
      <TooltipProvider>
        <StateInspector />
        <TooltipTarget content="first target" testId="first" />
        <TooltipTarget content="second target" testId="second" />
      </TooltipProvider>
    );

    act(() => {
      fireEvent.mouseEnter(screen.getByTestId("first"), {
        clientX: 10,
        clientY: 10,
      });
    });
    expect(screen.getByTestId("content").textContent).toBe("first target");

    act(() => {
      fireEvent.mouseLeave(screen.getByTestId("first"));
    });
    act(() => {
      fireEvent.mouseEnter(screen.getByTestId("second"), {
        clientX: 20,
        clientY: 20,
      });
    });
    expect(screen.getByTestId("content").textContent).toBe("second target");
  });
});
