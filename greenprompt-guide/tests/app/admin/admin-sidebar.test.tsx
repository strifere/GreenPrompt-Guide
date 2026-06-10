import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { AdminSidebar } from "@/app/admin/admin-sidebar";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/practices",
}));

describe("AdminSidebar", () => {
  it("renders all admin section links", () => {
    render(<AdminSidebar />);

    expect(screen.getByRole("link", { name: /practices/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /references/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /prompt techniques/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /models/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /datasets/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /hyperparameters/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /requests/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /users/i })).toBeInTheDocument();
  });

  it("marks the current section as active", () => {
    render(<AdminSidebar />);

    const practicesLink = screen.getByRole("link", { name: /practices/i });
    expect(practicesLink).toHaveAttribute("aria-current", "page");
    expect(practicesLink).toHaveAttribute("data-active", "true");
  });

  it("sets correct href attributes for all links", () => {
    render(<AdminSidebar />);

    expect(screen.getByRole("link", { name: /practices/i })).toHaveAttribute("href", "/admin/practices");
    expect(screen.getByRole("link", { name: /references/i })).toHaveAttribute("href", "/admin/references");
    expect(screen.getByRole("link", { name: /models/i })).toHaveAttribute("href", "/admin/models");
    expect(screen.getByRole("link", { name: /datasets/i })).toHaveAttribute("href", "/admin/datasets");
    expect(screen.getByRole("link", { name: /hyperparameters/i })).toHaveAttribute("href", "/admin/hyperparameters");
    expect(screen.getByRole("link", { name: /requests/i })).toHaveAttribute("href", "/admin/requests");
    expect(screen.getByRole("link", { name: /users/i })).toHaveAttribute("href", "/admin/users");
  });

  it("has proper navigation semantics", () => {
    render(<AdminSidebar />);

    const nav = screen.getByRole("navigation", { name: /admin sections/i });
    expect(nav).toBeInTheDocument();
  });
});
