"use client";

import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type SyntheticEvent } from "react";
import styles from "../admin.module.css";

const DATA_FORMAT_OPTIONS = [
  { value: "TEXT_ONLY", label: "Text only" },
  { value: "IMAGE", label: "Image" },
  { value: "PDF", label: "PDF" },
  { value: "CSV", label: "CSV" },
  { value: "HTML", label: "HTML" },
  { value: "ANY_FORMAT", label: "Any format" },
] as const;

type DataFormatType = (typeof DATA_FORMAT_OPTIONS)[number]["value"];

export type DatasetFormInitialValues = {
  name?: string;
  description?: string | null;
  size?: string | null;
  dataFormatType?: DataFormatType[];
};

type DatasetFormProps = {
  submitUrl: string;
  redirectPath: string;
  initialValues?: DatasetFormInitialValues;
  mode?: "create" | "edit";
  method?: "POST" | "PATCH";
};

export function DatasetForm({
  submitUrl,
  redirectPath,
  initialValues,
  mode = "create",
  method = "POST",
}: Readonly<DatasetFormProps>) {
  const router = useRouter();
  const isEditMode = mode === "edit";

  const [name, setName] = useState(initialValues?.name ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
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
    event.preventDefault();
    setSaving(true);
    setError("");

    const body = {
      name: name.trim(),
      description: description.trim() || null,
      size: size.trim() || null,
      dataFormatType,
    };

    try {
      const response = await fetch(submitUrl, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save the dataset");
      }

      router.push(redirectPath);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to save the dataset right now",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className={styles.creationForm} onSubmit={handleSubmit}>
      <section className={styles.creationSection}>
        <h3 className={styles.creationSectionTitle}>Dataset details</h3>

        <div className="form-group">
          <label htmlFor="dataset-name">Name</label>
          <input
            id="dataset-name"
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            required
            disabled={isEditMode}
            placeholder="e.g. SQuAD, GSM8K, HumanEval"
          />
          {isEditMode ? (
            <p className={styles.creationHint}>The name is the primary key and cannot be changed.</p>
          ) : null}
        </div>

        <div className="form-group">
          <label htmlFor="dataset-description">
            Description <span className={styles.muted}>(optional)</span>
          </label>
          <textarea
            id="dataset-description"
            className={styles.creationTextarea}
            value={description}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div className="form-group">
          <label htmlFor="dataset-size">
            Size <span className={styles.muted}>(optional)</span>
          </label>
          <input
            id="dataset-size"
            value={size}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSize(e.target.value)}
            placeholder="e.g. 10,570 items, large"
          />
        </div>
      </section>

      <section className={styles.creationSection}>
        <h3 className={styles.creationSectionTitle}>Data format types</h3>
        <p className={styles.creationHint}>Select all formats present in this dataset.</p>
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
