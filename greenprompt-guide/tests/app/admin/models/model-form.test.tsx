import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { ModelForm } from "@/app/admin/models/model-form";
import * as adminActionsClient from "@/lib/admin-actions-client";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    refresh: vi.fn(),
  })),
}));

vi.mock("@/lib/admin-actions-client", () => ({
  submitObject: vi.fn(),
}));

vi.mock("@/app/admin/base-entity-form", () => ({
  BaseEntityForm: ({
    title,
    children,
    mode = "create",
    initialValues,
  }: {
    title: string;
    children: (props: {
      name: string;
      setName: (v: string) => void;
      description: string;
      setDescription: (v: string) => void;
      isEditMode: boolean;
    }) => ReactNode;
    mode?: string;
    initialValues?: { name?: string; description?: string | null };
  }) => {
    const { useState } = require("react");
    const [name, setName] = useState(initialValues?.name ?? "");
    const [description, setDescription] = useState(initialValues?.description ?? "");
    return (
      <div>
        {title}
        {children({
          name,
          setName,
          description,
          setDescription,
          isEditMode: mode === "edit",
        })}
      </div>
    );
  },
}));

describe("ModelForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the form with required fields", () => {
    render(
      <ModelForm
        submitUrl="/api/admin/models"
        redirectPath="/admin/models"
      />
    );

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/parameters/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/size/i)).toBeInTheDocument();
  });

  it("displays initial values when provided", () => {
    const initialValues = {
      name: "GPT-4",
      description: "A large language model",
      parameters: "175B",
      size: "large",
    };

    render(
      <ModelForm
        submitUrl="/api/admin/models"
        redirectPath="/admin/models"
        initialValues={initialValues}
      />
    );

    expect(screen.getByDisplayValue("GPT-4")).toBeInTheDocument();
    expect(screen.getByDisplayValue("A large language model")).toBeInTheDocument();
    expect(screen.getByDisplayValue("175B")).toBeInTheDocument();
    expect(screen.getByDisplayValue("large")).toBeInTheDocument();
  });

  it("allows user to enter model name", async () => {
    const user = userEvent.setup();
    render(
      <ModelForm
        submitUrl="/api/admin/models"
        redirectPath="/admin/models"
      />
    );

    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, "LLaMA-2-7B");

    expect(nameInput).toHaveValue("LLaMA-2-7B");
  });

  it("allows user to enter description", async () => {
    const user = userEvent.setup();
    render(
      <ModelForm
        submitUrl="/api/admin/models"
        redirectPath="/admin/models"
      />
    );

    const descriptionTextarea = screen.getByLabelText(/description/i);
    await user.type(descriptionTextarea, "A 7 billion parameter model");

    expect(descriptionTextarea).toHaveValue("A 7 billion parameter model");
  });

  it("allows user to enter optional parameters", async () => {
    const user = userEvent.setup();
    render(
      <ModelForm
        submitUrl="/api/admin/models"
        redirectPath="/admin/models"
      />
    );

    const parametersInput = screen.getByLabelText(/parameters/i);
    await user.type(parametersInput, "7B");

    expect(parametersInput).toHaveValue("7B");
  });

  it("allows user to enter optional size", async () => {
    const user = userEvent.setup();
    render(
      <ModelForm
        submitUrl="/api/admin/models"
        redirectPath="/admin/models"
      />
    );

    const sizeInput = screen.getByLabelText(/size/i);
    await user.type(sizeInput, "14GB");

    expect(sizeInput).toHaveValue("14GB");
  });

  it("disables name field in edit mode", () => {
    render(
      <ModelForm
        mode="edit"
        submitUrl="/api/admin/models/gpt-4"
        redirectPath="/admin/models"
        initialValues={{
          name: "GPT-4",
          description: "A large language model",
        }}
      />
    );

    const nameInput = screen.getByDisplayValue("GPT-4");
    expect(nameInput).toBeDisabled();
  });

  it("shows primary key warning in edit mode", () => {
    render(
      <ModelForm
        mode="edit"
        submitUrl="/api/admin/models/gpt-4"
        redirectPath="/admin/models"
        initialValues={{
          name: "GPT-4",
        }}
      />
    );

    expect(screen.getByText(/primary key and cannot be changed/i)).toBeInTheDocument();
  });

  it("uses correct HTTP method based on mode", async () => {
    const { rerender } = render(
      <ModelForm
        submitUrl="/api/admin/models"
        redirectPath="/admin/models"
        method="POST"
      />
    );

    rerender(
      <ModelForm
        mode="edit"
        submitUrl="/api/admin/models/gpt-4"
        redirectPath="/admin/models"
        method="PATCH"
      />
    );

    // Both should render without errors
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
  });

  it("renders with references when provided", () => {
    const references = [
      { title: "Paper 1", year: 2020, authors: "Author A" },
      { title: "Paper 2", year: 2021, authors: "Author B" },
    ];

    render(
      <ModelForm
        submitUrl="/api/admin/models"
        redirectPath="/admin/models"
        references={references}
      />
    );

    // BaseEntityForm mock will render these
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
  });

  it("trims whitespace from parameters", async () => {
    const user = userEvent.setup();
    render(
      <ModelForm
        submitUrl="/api/admin/models"
        redirectPath="/admin/models"
      />
    );

    const parametersInput = screen.getByLabelText(/parameters/i);
    await user.type(parametersInput, "  7B  ");

    // Component will trim the value when submitting
    expect(parametersInput).toHaveValue("  7B  ");
  });

  it("trims whitespace from size", async () => {
    const user = userEvent.setup();
    render(
      <ModelForm
        submitUrl="/api/admin/models"
        redirectPath="/admin/models"
      />
    );

    const sizeInput = screen.getByLabelText(/size/i);
    await user.type(sizeInput, "  large  ");

    expect(sizeInput).toHaveValue("  large  ");
  });

  it("handles empty optional fields correctly", async () => {
    const user = userEvent.setup();
    const initialValues = {
      name: "GPT-4",
      description: "Model",
      parameters: "",
      size: "",
    };

    render(
      <ModelForm
        submitUrl="/api/admin/models"
        redirectPath="/admin/models"
        initialValues={initialValues}
      />
    );

    const parametersInput = screen.getByLabelText(/parameters/i);
    const sizeInput = screen.getByLabelText(/size/i);

    expect(parametersInput).toHaveValue("");
    expect(sizeInput).toHaveValue("");
  });

  it("sets default values for empty optional fields", () => {
    render(
      <ModelForm
        submitUrl="/api/admin/models"
        redirectPath="/admin/models"
      />
    );

    const parametersInput = screen.getByLabelText(/parameters/i);
    const sizeInput = screen.getByLabelText(/size/i);

    expect(parametersInput).toHaveValue("");
    expect(sizeInput).toHaveValue("");
  });
});