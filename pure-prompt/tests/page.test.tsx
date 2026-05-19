import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/page";

describe("Home Page", () => {
  it("renders the home page", () => {
    render(<HomePage />);

    const homeShell = screen.getByRole("heading", { name: /Pure/i, level: 1 });
    expect(homeShell).toBeInTheDocument();
  });

  it("renders the hero section with title and tagline", () => {
    render(<HomePage />);

    const title = screen.getByRole("heading", { name: /Pure/, level: 1 });
    expect(title).toBeInTheDocument();

    const allTaglines = screen.getAllByText(/A catalog of Green Prompt Engineering practices/i);
    expect(allTaglines.length).toBeGreaterThan(0);
  });

  it("renders signup and explore buttons in hero section", () => {
    render(<HomePage />);

    const signupBtns = screen.getAllByRole("link", { name: /Sign up/i });
    expect(signupBtns.length).toBeGreaterThan(0);
    signupBtns.forEach((btn) => expect(btn).toHaveAttribute("href", "/signup"));

    const exploreBtns = screen.getAllByRole("link", { name: /Explore/i });
    expect(exploreBtns.length).toBeGreaterThan(0);
    exploreBtns.forEach((btn) => expect(btn).toHaveAttribute("href", "/catalog"));
  });

  it("renders hero summary text", () => {
    render(<HomePage />);

    const summaries = screen.getAllByText(/PurePrompt is a catalog of Green Prompt Engineering practices/i);
    expect(summaries.length).toBeGreaterThan(0);
  });

  it("renders info grid with prompt engineering and green prompt cards", () => {
    render(<HomePage />);

    const promptEngCard = screen.getByRole("heading", { name: /What is Prompt Engineering?/i });
    expect(promptEngCard).toBeInTheDocument();

    expect(
      screen.getByText(/Prompt Engineering is a field of research that studies how prompt crafting affects Language Models/i),
    ).toBeInTheDocument();

    const greenPromptCard = screen.getByRole("heading", { name: /What is a Green Prompt?/i });
    expect(greenPromptCard).toBeInTheDocument();

    expect(
      screen.getByText(/A Green Prompt is a prompt that is environmentally aware crafted/i),
    ).toBeInTheDocument();
  });

  it("renders instructions section with how to use heading", () => {
    render(<HomePage />);

    const instructionsHeading = screen.getByRole("heading", { name: /How to use PurePrompt?/i });
    expect(instructionsHeading).toBeInTheDocument();
  });

  it("renders explore the catalog instruction card with link", () => {
    render(<HomePage />);

    const exploreCardHeading = screen.getByRole("heading", { name: /Explore the catalog/i });
    expect(exploreCardHeading).toBeInTheDocument();

    const exploreCatalogTexts = screen.getAllByText(/You can explore the catalog to find best practices for crafting Green Prompts/i);
    expect(exploreCatalogTexts.length).toBeGreaterThan(0);

    const exploreLink = screen.getAllByRole("link", { name: /Explore/i }).find(
      (link) => link.getAttribute("href") === "/catalog" && link.getAttribute("class")?.includes("green-btn"),
    );
    expect(exploreLink).toBeInTheDocument();
  });

  it("renders contribute to catalog instruction card with link", () => {
    render(<HomePage />);

    const contributeCardHeading = screen.getByRole("heading", { name: /Contribute to the catalog/i });
    expect(contributeCardHeading).toBeInTheDocument();

    const contributeTexts = screen.getAllByText(/You can contribute to the catalog by sharing your own best practices/i);
    expect(contributeTexts.length).toBeGreaterThan(0);

    const collaborateLink = screen.getByRole("link", { name: /Collaborate/i });
    expect(collaborateLink).toBeInTheDocument();
    expect(collaborateLink).toHaveAttribute("href", "/collaboration");
  });

  it("renders join the community instruction card with link", () => {
    render(<HomePage />);

    const communityCardHeading = screen.getByRole("heading", { name: /Join the community/i });
    expect(communityCardHeading).toBeInTheDocument();

    expect(
      screen.getByText(/You can join the PurePrompt community to connect with other people interested in Green Prompt Engineering/i),
    ).toBeInTheDocument();

    const createAccountLink = screen.getByRole("link", { name: /Create account/i });
    expect(createAccountLink).toBeInTheDocument();
    expect(createAccountLink).toHaveAttribute("href", "/signup");
  });

  it("renders about section with heading", () => {
    render(<HomePage />);

    const aboutHeading = screen.getByRole("heading", { name: /About PurePrompt/i });
    expect(aboutHeading).toBeInTheDocument();

    expect(
      screen.getByText(/PurePrompt is an initiative born from a passion for sustainable technology/i),
    ).toBeInTheDocument();

    expect(screen.getByText(/Our mission is to promote environmentally aware practices in the field of Prompt Engineering/i)).toBeInTheDocument();
  });

  it("renders all main sections with proper accessibility labels", () => {
    render(<HomePage />);

    const infoSection = screen.getByLabelText(/Home page introduction/i);
    expect(infoSection).toBeInTheDocument();

    const instructionsSection = screen.getByLabelText(/Instructions of the tool/i);
    expect(instructionsSection).toBeInTheDocument();

    const aboutSection = screen.getByLabelText(/About PurePrompt/i);
    expect(aboutSection).toBeInTheDocument();
  });

  it("renders home hero section with proper heading id", () => {
    render(<HomePage />);

    const heroTitle = screen.getByRole("heading", { name: /Pure/, level: 1 });
    expect(heroTitle).toHaveAttribute("id", "home-title");
  });

  it("renders all required links with correct href values", () => {
    render(<HomePage />);

    // Check for signup links
    const signupLinks = screen.getAllByRole("link", { name: /Sign up|Create account/i });
    expect(signupLinks.length).toBeGreaterThanOrEqual(1);

    // Check for explore/catalog links
    const catalogLinks = screen.getAllByRole("link", { name: /Explore/i });
    expect(catalogLinks.length).toBeGreaterThanOrEqual(1);
    catalogLinks.forEach((link) => {
      expect(link).toHaveAttribute("href", "/catalog");
    });

    // Check for collaboration link
    const collaborationLink = screen.getByRole("link", { name: /Collaborate/i });
    expect(collaborationLink).toHaveAttribute("href", "/collaboration");
  });

  it("displays information about green prompt engineering practices", () => {
    render(<HomePage />);

    const allEnvAwareTexts = screen.getAllByText(/environmentally aware prompts for Language Models/i);
    expect(allEnvAwareTexts.length).toBeGreaterThan(0);

    expect(screen.getByText(/minimize the computational resources required to process it/i)).toBeInTheDocument();
    expect(screen.getByText(/reduce the environmental impact of using Language Models/i)).toBeInTheDocument();
  });

  it("displays contribution workflow information", () => {
  });

  it("displays contribution workflow information", () => {
    render(<HomePage />);

    expect(screen.getByText(/create an account and log in/i)).toBeInTheDocument();
    expect(screen.getByText(/filling out a form with the practice's description/i)).toBeInTheDocument();
    expect(screen.getByText(/Your submission will be reviewed by our team before being published/i)).toBeInTheDocument();
  });

  it("displays open source and community contribution information", () => {
    render(<HomePage />);

    expect(screen.getByText(/PurePrompt is an open-source project/i)).toBeInTheDocument();
    expect(screen.getByText(/we actively welcome contributions from the community/i)).toBeInTheDocument();
    expect(screen.getByText(/Check out our GitHub repository for open issues/i)).toBeInTheDocument();
  });

  it("renders hero title with brand styling (Pure and Prompt spans)", () => {
    render(<HomePage />);

    const heroTitle = screen.getByRole("heading", { name: /Pure/, level: 1 });
    const titleBrands = heroTitle.querySelectorAll(".home-title-brand");
    expect(titleBrands).toHaveLength(2);

    const pureSpan = Array.from(titleBrands).find((el) => el.textContent === "Pure");
    expect(pureSpan).toHaveClass("home-title-brand-green");

    const promptSpan = Array.from(titleBrands).find((el) => el.textContent === "Prompt");
    expect(promptSpan).toHaveClass("home-title-brand-blue");
  });

  it("renders tagline with emphasis on Green", () => {
    render(<HomePage />);

    const taglines = screen.getAllByText(/A catalog of Green Prompt Engineering practices/i);
    const taglineWithEmphasis = Array.from(taglines).find((el) => {
      return el.parentElement?.querySelector(".home-emphasis")?.textContent === "Green";
    });
    expect(taglineWithEmphasis).toBeInTheDocument();
  });

  it("renders instructions with multiple cards in grid layout", () => {
    render(<HomePage />);

    const exploreCard = screen.getByRole("heading", { name: /Explore the catalog/i });
    const contributeCard = screen.getByRole("heading", { name: /Contribute to the catalog/i });
    const communityCard = screen.getByRole("heading", { name: /Join the community/i });

    expect(exploreCard).toBeInTheDocument();
    expect(contributeCard).toBeInTheDocument();
    expect(communityCard).toBeInTheDocument();
  });
});
