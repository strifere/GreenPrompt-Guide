import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AdminPracticesPage from "@/app/admin/practices/page";

const listPracticesMock = vi.hoisted(() => vi.fn());
const refreshMock = vi.hoisted(() => vi.fn());

vi.mock("@/domain/practice-repository", () => ({
  listPractices: listPracticesMock,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

describe("Admin practices page", () => {
  it("renders the practices list and action buttons", async () => {
    listPracticesMock.mockResolvedValueOnce([
      {
        name: "Constraint-first prompting",
        description: "Start with constraints before generating the answer.",
        greenScore: 88,
        tactic: "GREEN_PRACTICE",
        categories: [{ category: { name: "Evaluation" } }],
        models: [{ model: { name: "GPT-4o mini" } }],
        prompts: [{ promptTechnique: { name: "Few-shot" } }],
        papers: [{ reference: { title: "Example reference" } }],
      },
    ] as any);

    const element = await AdminPracticesPage();
    render(element);

    expect(screen.getByRole("heading", { name: /all practices/i })).toBeInTheDocument();
    expect(screen.getByText("Constraint-first prompting")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /add practice/i })).toHaveAttribute("href", "/admin/practices/new");
    expect(screen.getByRole("button", { name: /modify/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  });
});