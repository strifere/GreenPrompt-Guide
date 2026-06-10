"use client";

import { SyntheticEvent, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import styles from "../admin.module.css";

export type CategoryFormInitialValues = {
  name?: string;
  description?: string | null;
  tactic?: "GREEN_PRACTICE" | "RED_PRACTICE";
};

type CategoryFormProps = {
  submitUrl: string;
  redirectPath: string;
  initialValues?: CategoryFormInitialValues;
  mode?: "create" | "edit";
  method?: "POST" | "PATCH";
};

const TACTIC_OPTIONS = [
  { value: "GREEN_PRACTICE", label: "Green Practice" },
  { value: "RED_PRACTICE", label: "Red Practice" },
] as const;

export function CategoryForm({
  submitUrl,
  redirectPath,
  initialValues,
  mode = "create",
  method = "POST",
}: Readonly<CategoryFormProps>) {
  const router = useRouter();

  const [name, setName] = useState(initialValues?.name ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [tactic, setTactic] = useState<"GREEN_PRACTICE" | "RED_PRACTICE">(
    initialValues?.tactic ?? "GREEN_PRACTICE",
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditMode = mode === "edit";

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const body = {
      name: name.trim(),
      description: description.trim() || null,
      tactic,
    };

    try {
      const res = await fetch(submitUrl, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save category.");
      }

      router.push(redirectPath);
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className={styles.creationForm} onSubmit={handleSubmit}>
      <section className={styles.creationSection}>
        <h3 className={styles.creationSectionTitle}>Category details</h3>

        <div className={styles.creationSplitGrid}>
          <div className="form-group">
            <label htmlFor="cat-name">Name</label>
            <input
              id="cat-name"
              value={name}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              placeholder="e.g., Prompt Design, Inference Efficiency"
              required
              readOnly={isEditMode}
              aria-readonly={isEditMode}
            />
            {isEditMode && (<p className={styles.creationHint}>Read-only.</p>)}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="cat-description">Description</label>
          <textarea
            id="cat-description"
            className={styles.creationTextarea}
            value={description}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
            placeholder="A short description of this category"
            rows={3}
          />
        </div>
      </section>

      <section className={styles.creationSection}>
        <h3 className={styles.creationSectionTitle}>Tactic</h3>
        <p className={styles.creationHint}>
          Choose whether this category groups practices that reduce energy consumption (green) or
          highlight wasteful patterns to avoid (red).
        </p>
        <div className={styles.creationCategoryToggle}>
          {TACTIC_OPTIONS.map((option) => (
            <label key={option.value} className={styles.creationRadioCard}>
              <input
                type="radio"
                name="tactic"
                value={option.value}
                checked={tactic === option.value}
                onChange={() => setTactic(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </section>

      {error ? <div className="error-message">{error}</div> : null}

      <div className={styles.creationActions}>
        <button type="submit" className="green-btn" disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
