import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import NewReferencePage from "@/app/admin/references/new/page";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("lucide-react", () => ({
  ArrowLeft: () => <div>Arrow</div>,
}));

vi.mock("@/app/admin/references/reference-form", () => ({
  ReferenceForm: ({
    submitUrl,
    redirectPath,
  }: {
    submitUrl: string;
    redirectPath: string;
  }) => (
    <div>
      ReferenceForm - {submitUrl} - {redirectPath}
    </div>
  ),
}));

describe("New Reference Page", () => {
  it("renders the page header", () => {
    render(<NewReferencePage />);

    expect(screen.getByText(/Add reference/i)).toBeInTheDocument();
    expect(screen.getByText(/Register a new paper/i)).toBeInTheDocument();
  });

  it("displays back to references link", () => {
    render(<NewReferencePage />);

    const backLink = screen.getByRole("link", { name: /Back to references/i });
    expect(backLink).toHaveAttribute("href", "/admin/references");
  });

  it("renders reference form component", () => {
    render(<NewReferencePage />);

    expect(screen.getByText(/ReferenceForm/i)).toBeInTheDocument();
  });

  it("passes correct submit URL to form", () => {
    render(<NewReferencePage />);

    expect(screen.getByText(/\/api\/admin\/references/)).toBeInTheDocument();
  });

  it("passes correct redirect path to form", () => {
    render(<NewReferencePage />);

    expect(screen.getByText(/\/admin\/references/)).toBeInTheDocument();
  });

  it("displays kicker text", () => {
    render(<NewReferencePage />);

    expect(screen.getByText(/References/)).toBeInTheDocument();
  });

  it("renders section wrapper", () => {
    render(<NewReferencePage />);

    expect(screen.getByText(/Add reference/i)).toBeInTheDocument();
  });
});