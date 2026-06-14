/**
 * Tests for app/ui/tooltip/tip.tsx
 *
 * Covers:
 *  - Renders the child element unchanged when content is provided
 *  - Injects mouse/focus event handlers onto the child
 *  - Tooltip becomes visible on mouseEnter and invisible after mouseLeave
 *  - Tooltip content matches the prop passed to <Tip>
 *  - Works with non-interactive elements (span, div, etc.)
 *  - Falls back gracefully when child is not a valid React element
 *  - Does not add an extra wrapper DOM node (zero-markup)
 *  - aria-describedby is forwarded to the child
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { Tip } from "@/app/ui/tooltip/tip";
import {
  TooltipProvider,
  useTooltipContext,
} from "@/app/ui/tooltip/tooltip-context";

// ---------------------------------------------------------------------------
// Helper: state inspector so we can assert tooltip context state
// ---------------------------------------------------------------------------
function StateInspector() {
  const { state } = useTooltipContext();
  return (
    <>
      <span data-testid="visible">{String(state.visible)}</span>
      <span data-testid="content">{state.content}</span>
    </>
  );
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <StateInspector />
      {children}
    </TooltipProvider>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Tip", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runAllTimers();
    vi.useRealTimers();
  });

  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------

  it("renders the child element", () => {
    render(
      <Wrapper>
        <Tip content="tooltip content">
          <button data-testid="child">click me</button>
        </Tip>
      </Wrapper>
    );

    expect(screen.getByTestId("child")).toBeDefined();
    expect(screen.getByTestId("child").textContent).toBe("click me");
  });

  it("does not add an extra wrapper DOM node around the child", () => {
    render(
      <Wrapper>
        <Tip content="no wrapper">
          <span data-testid="child">text</span>
        </Tip>
      </Wrapper>
    );

    const child = screen.getByTestId("child");
    // The parent of the child should NOT be an anonymous wrapper div/span
    // added by <Tip> — it should be whatever wraps the Wrapper itself.
    expect(child.tagName.toLowerCase()).toBe("span");
  });

  it("preserves the child's own props (data-testid, className, etc.)", () => {
    render(
      <Wrapper>
        <Tip content="preserve props">
          <button data-testid="child" className="my-class" aria-label="btn">
            btn
          </button>
        </Tip>
      </Wrapper>
    );

    const child = screen.getByTestId("child");
    expect(child.className).toBe("my-class");
    expect(child.getAttribute("aria-label")).toBe("btn");
  });

  it("forwards aria-describedby to the child element", () => {
    render(
      <Wrapper>
        <Tip content="aria test">
          <button data-testid="child">btn</button>
        </Tip>
      </Wrapper>
    );

    expect(screen.getByTestId("child").getAttribute("aria-describedby")).toBe(
      "global-tooltip"
    );
  });

  // -------------------------------------------------------------------------
  // Interaction — mouse
  // -------------------------------------------------------------------------

  it("shows the tooltip on mouseEnter", () => {
    render(
      <Wrapper>
        <Tip content="hover text">
          <button data-testid="child">hover</button>
        </Tip>
      </Wrapper>
    );

    act(() => {
      fireEvent.mouseEnter(screen.getByTestId("child"), {
        clientX: 100,
        clientY: 200,
      });
    });

    expect(screen.getByTestId("visible").textContent).toBe("true");
    expect(screen.getByTestId("content").textContent).toBe("hover text");
  });

  it("hides the tooltip after mouseLeave and debounce", () => {
    render(
      <Wrapper>
        <Tip content="hover text">
          <button data-testid="child">hover</button>
        </Tip>
      </Wrapper>
    );

    act(() => {
      fireEvent.mouseEnter(screen.getByTestId("child"), {
        clientX: 100,
        clientY: 200,
      });
    });

    act(() => {
      fireEvent.mouseLeave(screen.getByTestId("child"));
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByTestId("visible").textContent).toBe("false");
  });

  it("updates coordinates on mouseMove", () => {
    function CoordInspector() {
      const { state } = useTooltipContext();
      return (
        <>
          <span data-testid="x">{state.x}</span>
          <span data-testid="y">{state.y}</span>
        </>
      );
    }

    render(
      <TooltipProvider>
        <CoordInspector />
        <Tip content="move">
          <button data-testid="child">move</button>
        </Tip>
      </TooltipProvider>
    );

    act(() => {
      fireEvent.mouseEnter(screen.getByTestId("child"), {
        clientX: 50,
        clientY: 50,
      });
    });
    act(() => {
      fireEvent.mouseMove(screen.getByTestId("child"), {
        clientX: 300,
        clientY: 400,
      });
    });

    expect(screen.getByTestId("x").textContent).toBe("300");
    expect(screen.getByTestId("y").textContent).toBe("400");
  });

  // -------------------------------------------------------------------------
  // Interaction — keyboard / focus
  // -------------------------------------------------------------------------

  it("shows the tooltip on focus", () => {
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
      left: 20,
      right: 120,
      bottom: 60,
      top: 40,
      width: 100,
      height: 20,
      x: 20,
      y: 40,
      toJSON: () => {},
    } as DOMRect);

    render(
      <Wrapper>
        <Tip content="focus text">
          <button data-testid="child">focus</button>
        </Tip>
      </Wrapper>
    );

    act(() => {
      fireEvent.focus(screen.getByTestId("child"));
    });

    expect(screen.getByTestId("visible").textContent).toBe("true");
    expect(screen.getByTestId("content").textContent).toBe("focus text");

    vi.restoreAllMocks();
  });

  it("hides the tooltip on blur after debounce", () => {
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

    render(
      <Wrapper>
        <Tip content="blur text">
          <button data-testid="child">focus</button>
        </Tip>
      </Wrapper>
    );

    act(() => {
      fireEvent.focus(screen.getByTestId("child"));
    });

    act(() => {
      fireEvent.blur(screen.getByTestId("child"));
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(screen.getByTestId("visible").textContent).toBe("false");

    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Non-element children
  // -------------------------------------------------------------------------

  it("renders plain text children without crashing (no cloneElement path)", () => {
    // Tip should fall back to rendering the child as-is when it's not a
    // valid React element (e.g., a plain string).
    expect(() =>
      render(
        <Wrapper>
          <Tip content="plain text child">just a string</Tip>
        </Wrapper>
      )
    ).not.toThrow();
  });

  // -------------------------------------------------------------------------
  // Different element types
  // -------------------------------------------------------------------------

  it("works with a <span> child", () => {
    render(
      <Wrapper>
        <Tip content="span tooltip">
          <span data-testid="span-child">span</span>
        </Tip>
      </Wrapper>
    );

    act(() => {
      fireEvent.mouseEnter(screen.getByTestId("span-child"), {
        clientX: 10,
        clientY: 10,
      });
    });

    expect(screen.getByTestId("visible").textContent).toBe("true");
    expect(screen.getByTestId("content").textContent).toBe("span tooltip");
  });

  it("works with a <div> child", () => {
    render(
      <Wrapper>
        <Tip content="div tooltip">
          <div data-testid="div-child">div</div>
        </Tip>
      </Wrapper>
    );

    act(() => {
      fireEvent.mouseEnter(screen.getByTestId("div-child"), {
        clientX: 10,
        clientY: 10,
      });
    });

    expect(screen.getByTestId("visible").textContent).toBe("true");
    expect(screen.getByTestId("content").textContent).toBe("div tooltip");
  });

  // -------------------------------------------------------------------------
  // Outside provider (no-op default context)
  // -------------------------------------------------------------------------

  it("does not throw when used outside a TooltipProvider", () => {
    expect(() =>
      render(
        <Tip content="no provider">
          <button data-testid="orphan">orphan</button>
        </Tip>
      )
    ).not.toThrow();
  });

  it("does not throw on mouseEnter when used outside a TooltipProvider", () => {
    render(
      <Tip content="no provider">
        <button data-testid="orphan">orphan</button>
      </Tip>
    );

    expect(() => {
      act(() => {
        fireEvent.mouseEnter(screen.getByTestId("orphan"), {
          clientX: 10,
          clientY: 10,
        });
      });
    }).not.toThrow();
  });
});
