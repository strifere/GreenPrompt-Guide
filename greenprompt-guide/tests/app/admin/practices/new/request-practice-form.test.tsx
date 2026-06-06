import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RequestPracticeForm } from "@/app/admin/practices/new/[requestId]/request-practice-form";

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

vi.mock("@/app/admin/practices/practice-form", () => ({
  PracticeForm: (props: any) => (
    <div data-testid="practice-form" data-props={JSON.stringify(props)}>
      Practice Form
    </div>
  ),
}));

describe("RequestPracticeForm", () => {
  it("renders PracticeForm component", () => {
    const categories = [];

    render(
      <RequestPracticeForm
        requestId={1}
        requestTitle="Test Practice"
        requestSummary="Test summary"
        requestDescription="Test description"
        requestReferenceLink="https://example.com"
        requestExamples="Examples"
        categories={categories}
      />
    );

    expect(screen.getByTestId("practice-form")).toBeInTheDocument();
  });

  it("passes correct submit URL with request ID", () => {

    render(
      <RequestPracticeForm
        requestId={42}
        requestTitle="Test"
        requestSummary="Summary"
        requestDescription="Description"
        requestReferenceLink="https://example.com"
        requestExamples="Examples"
        categories={[]}
      />
    );

    const form = screen.getByTestId("practice-form");
    const props = JSON.parse(form.dataset.props || "{}");
    expect(props.submitUrl).toContain("/42");
  });

  it("passes redirect path with request ID", () => {

    render(
      <RequestPracticeForm
        requestId={1}
        requestTitle="Test"
        requestSummary="Summary"
        requestDescription="Description"
        requestReferenceLink="https://example.com"
        requestExamples="Examples"
        categories={[]}
        promptTechniques={[]}
        models={[]}
        hyperparameters={[]}
      />
    );

    const form = screen.getByTestId("practice-form");
    const props = JSON.parse(form.dataset.props || "{}");
    expect(props.redirectPath).toContain("/1");
  });

  it("pre-fills practice name from request", () => {
    render(
      <RequestPracticeForm
        requestId={1}
        requestTitle="My Practice"
        requestSummary="Summary"
        requestDescription="Description"
        requestReferenceLink="https://example.com"
        requestExamples="Examples"
        categories={[]}
      />
    );

    const form = screen.getByTestId("practice-form");
    const props = JSON.parse(form.dataset.props || "{}");
    expect(props.initialValues.practiceTitle).toBe("My Practice");
  });

  it("pre-fills description from request summary", () => {
    render(
      <RequestPracticeForm
        requestId={1}
        requestTitle="Practice"
          requestSummary="This is a detailed summary"
          requestDescription="This is a detailed summary"
        requestReferenceLink="https://example.com"
        requestExamples="Examples"
        categories={[]}
      />
    );

    const form = screen.getByTestId("practice-form");
    const props = JSON.parse(form.dataset.props || "{}");
      expect(props.initialValues.practiceDescription).toBe("This is a detailed summary");
  });

  it("pre-fills reference title from request", () => {
    render(
      <RequestPracticeForm
        requestId={1}
        requestTitle="Important Paper"
          requestSummary="Paper Title"
        requestDescription="Description"
        requestReferenceLink="https://example.com"
        requestExamples="Examples"
        categories={[]}
      />
    );

    const form = screen.getByTestId("practice-form");
    const props = JSON.parse(form.dataset.props || "{}");
    expect(props.initialValues.referenceTitle).toBe("Important Paper");
  });

  it("passes categories to form", () => {
    const categories = [
      { name: "Efficiency", description: "Efficient", tactic: "GREEN_PRACTICE" },
    ];

    render(
      <RequestPracticeForm
        requestId={1}
        requestTitle="Practice"
        requestSummary="Summary"
        requestDescription="Description"
        requestReferenceLink="https://example.com"
        requestExamples="Examples"
        categories={categories}
      />
    );

    const form = screen.getByTestId("practice-form");
    const props = JSON.parse(form.dataset.props || "{}");
    expect(props.categories).toHaveLength(1);
  });

  it("passes request reference link to form", () => {
    render(
      <RequestPracticeForm
        requestId={1}
        requestTitle="Practice"
        requestSummary="Summary"
        requestDescription="Description"
        requestReferenceLink="https://example.com"
        requestExamples="Examples"
        categories={[]}
      />
    );

    const form = screen.getByTestId("practice-form");
    const props = JSON.parse(form.dataset.props || "{}");
    expect(props.initialValues.referenceLink).toBe("https://example.com");
  });

  it("handles null optional fields", () => {
    render(
      <RequestPracticeForm
        requestId={1}
        requestTitle="Practice"
        requestSummary="Summary"
        requestDescription="Description"
        requestReferenceLink="https://example.com"
        requestExamples={null}
        categories={[]}
      />
    );

    const form = screen.getByTestId("practice-form");
    const props = JSON.parse(form.dataset.props || "{}");
    expect(props.initialValues.examplesText).toBeNull();
  });
});
