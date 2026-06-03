"use client";

import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type SyntheticEvent } from "react";
import styles from "../admin.module.css";
import { submitObject } from "@/lib/admin-actions-client";

export type PromptTechniqueFormInitialValues = {
  name?: string;
  description?: string;
  example?: string | null;
};

type PromptTechniqueFormProps = {
  submitUrl: string;
  redirectPath: string;
  initialValues?: PromptTechniqueFormInitialValues;
  mode?: "create" | "edit";
  method?: "POST" | "PATCH";
};

export function PromptTechniqueForm({
  submitUrl,
  redirectPath,
  initialValues,
  mode = "create",
  method = "POST",
}: Readonly<PromptTechniqueFormProps>) {
  const router = useRouter();
  const isEditMode = mode === "edit";

  const [name, setName] = useState(initialValues?.name ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [example, setExample] = useState(initialValues?.example ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    const body = {
      name: name.trim(),
      description: description.trim(),
      example: example.trim() || null,
    };

    submitObject({ event, setSaving, setError, submitUrl, method, body, redirectPath, router, type: "practice" });
  };

  return (
    <form className={styles.creationForm} onSubmit={handleSubmit}>
      <section className={styles.creationSection}>
        <h3 className={styles.creationSectionTitle}>Prompt technique details</h3>

        <div className="form-group">
          <label htmlFor="technique-name">Name</label>
          <input
            id="technique-name"
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            required
            disabled={isEditMode}
          />
          {isEditMode ? (
            <p className={styles.creationHint}>The name is the primary key and cannot be changed.</p>
          ) : null}
        </div>

        <div className="form-group">
          <label htmlFor="technique-description">Description</label>
          <textarea
            id="technique-description"
            className={styles.creationTextarea}
            value={description}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
            rows={4}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="technique-example">Example <span className={styles.muted}>(optional)</span></label>
          <textarea
            id="technique-example"
            className={styles.creationTextarea}
            value={example}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setExample(e.target.value)}
            rows={4}
            placeholder="Provide a short illustrative example of this technique in use"
          />
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
