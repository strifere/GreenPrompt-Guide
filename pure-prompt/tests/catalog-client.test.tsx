import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import type { PracticeListItem, SidebarData } from "@/domain/practice-repository";
import CatalogClient from "@/app/catalog/catalog-client";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const sidebarData: SidebarData = {
  categories: ["Token Optimization", "Prompt Compression"],
  models: ["GPT-4o-mini", "Llama-3"],
  promptTechniques: ["Few-shot", "Chain-of-thought"],
  hyperparameters: ["temperature", "max_tokens"],
  datasets: ["MMLU", "TruthfulQA"],
};

const practices = [
  {
    id: 1,
    name: "Token-aware Prompting",
    description: "Reduce output length while preserving task quality.",
    createdAt: new Date("2026-04-01T10:00:00.000Z"),
    categories: [{ category: { name: "Token Optimization" } }],
    models: [{ model: { name: "GPT-4o-mini" } }],
    prompts: [{ promptTechnique: { name: "Few-shot" } }],
    hyperparameters: [
      { id: 10, name: "temperature", value: "0.2", dataType: "float" },
    ],
    papers: [
      {
        reference: {
          title: "Green Prompting in Practice",
          year: 2024,
          datasets: [{ dataset: { id: 200, name: "MMLU" } }],
        },
      },
      {
        reference: {
          title: "Green Prompting Revisited",
          year: 2026,
          datasets: [{ dataset: { id: 202, name: "MMLU" } }],
        },
      },
    ],
  },
  {
    id: 2,
    name: "Evaluation Batching",
    description: "Batch evaluations to reduce repeated calls.",
    createdAt: new Date("2026-04-16T10:00:00.000Z"),
    categories: [{ category: { name: "Prompt Compression" } }],
    models: [{ model: { name: "Llama-3" } }],
    prompts: [{ promptTechnique: { name: "Chain-of-thought" } }],
    hyperparameters: [
      { id: 11, name: "max_tokens", value: "256", dataType: "int" },
    ],
    papers: [
      {
        reference: {
          title: "Efficient Inference Study",
          year: 2025,
          datasets: [{ dataset: { id: 201, name: "TruthfulQA" } }],
        },
      },
    ],
  },
] as unknown as PracticeListItem[];

describe("Catalog page requirements", () => {
  it("FR1/US1: lists clickable practice previews with core information", () => {
    render(<CatalogClient practices={practices} sidebarData={sidebarData} />);

    const firstPracticeLink = screen.getByRole("link", {
      name: /token-aware prompting/i,
    });

    expect(firstPracticeLink).toHaveAttribute("href", "/catalog/practices/Token-aware Prompting");
    expect(screen.getByText(/reduce output length/i)).toBeInTheDocument();
    expect(screen.getByText(/extracted from: green prompting in practice/i)).toBeInTheDocument();
  });

  it("FR1/US9: searches by practice name and description", async () => {
    const user = userEvent.setup();

    render(<CatalogClient practices={practices} sidebarData={sidebarData} />);

    await user.type(screen.getByPlaceholderText(/search practices/i), "batch");

    expect(screen.getByRole("link", { name: /evaluation batching/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /token-aware prompting/i }),
    ).not.toBeInTheDocument();
  });

  it("FR1/US9: includes source title in search when source toggle is enabled", async () => {
    const user = userEvent.setup();

    render(<CatalogClient practices={practices} sidebarData={sidebarData} />);

    await user.type(screen.getByPlaceholderText(/search practices/i), "inference study");

    expect(
      screen.queryByRole("link", { name: /evaluation batching/i }),
    ).not.toBeInTheDocument();

    const sidebar = screen.getByRole("complementary", { name: /practice filters/i });
    await user.click(
      within(sidebar).getByRole("checkbox", {
        name: /search by source reference title/i,
      }),
    );

    expect(screen.getByRole("link", { name: /evaluation batching/i })).toBeInTheDocument();
  });

  it("FR1/US9: filters by source year when the source toggle is enabled", async () => {
    const user = userEvent.setup();

    render(<CatalogClient practices={practices} sidebarData={sidebarData} />);

    const sidebar = screen.getByRole("complementary", { name: /practice filters/i });

    expect(
      within(sidebar).queryByRole("combobox", { name: /source year/i }),
    ).not.toBeInTheDocument();

    await user.click(
      within(sidebar).getByRole("checkbox", {
        name: /search by source reference title/i,
      }),
    );

    const sourceYearSelect = within(sidebar).getByRole("combobox", { name: /source year/i });
    await user.selectOptions(sourceYearSelect, "2024");

    expect(screen.getByRole("link", { name: /token-aware prompting/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /evaluation batching/i }),
    ).not.toBeInTheDocument();
  });

  it("FR2/US9: filters by metadata and date range", async () => {
    const user = userEvent.setup();

    render(<CatalogClient practices={practices} sidebarData={sidebarData} />);

    const sidebar = screen.getByRole("complementary", { name: /practice filters/i });

    await user.click(
      within(sidebar).getByRole("checkbox", { name: /token optimization/i }),
    );
    await user.click(within(sidebar).getByRole("checkbox", { name: /gpt-4o-mini/i }));
    await user.click(within(sidebar).getByRole("checkbox", { name: /few-shot/i }));
    await user.click(within(sidebar).getByRole("checkbox", { name: /temperature/i }));

    expect(screen.getByRole("link", { name: /token-aware prompting/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /evaluation batching/i }),
    ).not.toBeInTheDocument();

    await user.clear(within(sidebar).getByLabelText(/created from/i));
    await user.type(within(sidebar).getByLabelText(/created from/i), "2026-04-10");

    expect(
      screen.queryByRole("link", { name: /token-aware prompting/i }),
    ).not.toBeInTheDocument();
  });
});
