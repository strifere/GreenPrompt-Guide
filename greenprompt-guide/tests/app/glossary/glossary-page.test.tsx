import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import userEvent from "@testing-library/user-event";
import GlossaryPage from "@/app/glossary/page";

const terms = [
  "Prompt",
  "Prompt Engineering",
  "Green Prompt Engineering",
  "Language Models",
  "LLM and SLM",
  "Metrics",
  "Green Score",
  "Hyperparameters",
  "Prompt Technique",
];

describe("Glossary Page", () => {
  it("renders the main title", () => {
    render(<GlossaryPage />);

    const title = screen.getByRole("heading", { name: /glossary/i, level: 1 });
    expect(title).toBeInTheDocument();
  });

  it("renders a subtitle/description for the page", async () => {
    render(<GlossaryPage />);

    const subtitle = screen.getByText(
      /a comprehensive guide to the key terms and concepts/i,
    );
    expect(subtitle).toBeInTheDocument();
  });

  it("renders all the glossary term sections with headings by default", async () => {
    render(<GlossaryPage />);

    for (const term of terms) {
      const termHeading = screen.getByRole("heading", { name: term, level: 3 });
      expect(termHeading).toBeInTheDocument();
    }
    expect(screen.getAllByRole("article")).toHaveLength(terms.length);
  });

  it("renders definitions for all glossary terms", async () => {
    render(<GlossaryPage />);

    const articles = screen.getAllByRole("article");
    articles.forEach((article) => {
      const definition = article.querySelector("p");
      expect(definition).toBeInTheDocument();
      expect(definition?.textContent).not.toBe("");
    });
  });

  it("renders a search bar", async () => {
    render(<GlossaryPage />);
    expect(screen.getByLabelText(/search glossary terms/i)).toBeInTheDocument();
  });
  
  it("filters terms based on search input", async () => {
    const user = userEvent.setup();
    render(<GlossaryPage />);
  
    const searchInput = screen.getByLabelText(/search glossary terms/i);
    await user.type(searchInput, "prompt engineering");
  
    // Both "Prompt Engineering" and "Green Prompt Engineering" contain "Prompt Engineering"
    const promptEngineeringHeadings = screen.getAllByRole("heading", { name: /prompt engineering/i });
    expect(promptEngineeringHeadings).toHaveLength(2);
    expect(screen.getByRole("heading", { name: "Prompt Engineering" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Green Prompt Engineering" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Prompt" })).not.toBeInTheDocument(); // Ensure "Prompt" alone is not present
    expect(screen.getAllByRole("article")).toHaveLength(2);
  });
  
  it("filters terms based on search input (case-insensitive)", async () => {
    const user = userEvent.setup();
    render(<GlossaryPage />);
  
    const searchInput = screen.getByLabelText(/search glossary terms/i);
    await user.type(searchInput, "metrics");
  
    expect(screen.getByRole("heading", { name: /metrics/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Prompt" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(1);
  });
  
  it("shows all terms when search input is cleared", async () => {
    const user = userEvent.setup();
    render(<GlossaryPage />);
  
    const searchInput = screen.getByLabelText(/search glossary terms/i);
    await user.type(searchInput, "metrics");
    expect(screen.getAllByRole("article")).toHaveLength(1);
  
    await user.clear(searchInput);
    expect(screen.getAllByRole("article")).toHaveLength(terms.length);
  });
});