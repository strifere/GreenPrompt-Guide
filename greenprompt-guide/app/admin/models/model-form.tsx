"use client";

import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type SyntheticEvent } from "react";
import styles from "../admin.module.css";
import { submitObject } from "@/lib/admin-actions-client";

const DATA_FORMAT_OPTIONS = [
  { value: "TEXT_ONLY", label: "Text only" },
  { value: "IMAGE", label: "Image" },
  { value: "PDF", label: "PDF" },
  { value: "CSV", label: "CSV" },
  { value: "HTML", label: "HTML" },
  { value: "ANY_FORMAT", label: "Any format" },
] as const;

type DataFormatType = (typeof DATA_FORMAT_OPTIONS)[number]["value"];

export type ModelFormInitialValues = {
  name?: string;
  description?: string | null;
  parameters?: string | null;
  size?: string | null;
  dataFormatType?: DataFormatType[];
};

type ModelFormProps = {
  submitUrl: string;
  redirectPath: string;
  initialValues?: ModelFormInitialValues;
  mode?: "create" | "edit";
  method?: "POST" | "PATCH";
};

export function ModelForm({
  submitUrl,
  redirectPath,
  initialValues,
  mode = "create",
  method = "POST",
}: Readonly<ModelFormProps>) {
  const router = useRouter();
  const isEditMode = mode === "edit";

  const [name, setName] = useState(initialValues?.name ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [parameters, setParameters] = useState(initialValues?.parameters ?? "");
  const [size, setSize] = useState(initialValues?.size ?? "");
  const [dataFormatType, setDataFormatType] = useState<DataFormatType[]>(
    initialValues?.dataFormatType ?? ["TEXT_ONLY"],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggleFormat = (format: DataFormatType) => {
    setDataFormatType((current) =>
      current.includes(format)
        ? current.filter((f) => f !== format)
        : [...current, format],
    );
  };

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    const body = {
      name: name.trim(),
      description: description.trim() || null,
      parameters: parameters.trim() || null,
      size: size.trim() || null,
      dataFormatType,
    };

    submitObject({ event, setSaving, setError, submitUrl, method, body, redirectPath, router, type: "dataset" })
  };

  return (
    <form className={styles.creationForm} onSubmit={handleSubmit}>
      <section className={styles.creationSection}>
        <h3 className={styles.creationSectionTitle}>Model details</h3>

        <div className="form-group">
          <label htmlFor="model-name">Name</label>
          <input
            id="model-name"
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            required
            disabled={isEditMode}
            placeholder="e.g. GPT-4, LLaMA-2-7B"
          />
          {isEditMode ? (
            <p className={styles.creationHint}>The name is the primary key and cannot be changed.</p>
          ) : null}
        </div>

        <div className="form-group">
          <label htmlFor="model-description">
            Description <span className={styles.muted}>(optional)</span>
          </label>
          <textarea
            id="model-description"
            className={styles.creationTextarea}
            value={description}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div className={styles.creationSplitGrid}>
          <div className="form-group">
            <label htmlFor="model-parameters">
              Parameters <span className={styles.muted}>(optional)</span>
            </label>
            <input
              id="model-parameters"
              value={parameters}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setParameters(e.target.value)}
              placeholder="e.g. 7B, 13B, 70B"
            />
          </div>
          <div className="form-group">
            <label htmlFor="model-size">
              Size <span className={styles.muted}>(optional)</span>
            </label>
            <input
              id="model-size"
              value={size}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSize(e.target.value)}
              placeholder="e.g. small, large"
            />
          </div>
        </div>
      </section>

      <section className={styles.creationSection}>
        <h3 className={styles.creationSectionTitle}>Supported data formats</h3>
        <p className={styles.creationHint}>Select all formats this model can process as input.</p>
        <div className={styles.creationCategoryToggle}>
          {DATA_FORMAT_OPTIONS.map((option) => (
            <label key={option.value} className={styles.creationRadioCard}>
              <input
                type="checkbox"
                checked={dataFormatType.includes(option.value)}
                onChange={() => toggleFormat(option.value)}
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
