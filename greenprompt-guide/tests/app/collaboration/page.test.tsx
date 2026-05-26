import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CollaboratePage from "@/app/collaboration/page";

describe("CollaboratePage", () => {
  it("renders the collaboration layout with explainer and submission form", () => {
    render(<CollaboratePage />);

    expect(screen.getByRole("heading", { name: /how collaboration works/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /placeholder heading/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /placeholder subheading/i })).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: /propose a practice for review/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/practice title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/short summary/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/full description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/supporting pdf/i)).toBeInTheDocument();
  });

  it("exposes the expected submission controls", () => {
    render(<CollaboratePage />);

    const pdfInput = screen.getByLabelText(/supporting pdf/i);
    expect(pdfInput).toHaveAttribute("type", "file");
    expect(pdfInput).toHaveAttribute("accept", "application/pdf");

    expect(screen.getByRole("button", { name: /save draft/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit for review/i })).toBeInTheDocument();
  });

  it("renders the collaboration page as a two-column workspace", () => {
    render(<CollaboratePage />);

    expect(screen.getByLabelText(/collaboration instructions/i)).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /propose a practice for review/i })).toBeInTheDocument();
  });
});
