"use client";

import { useRouter } from "next/navigation";
import { useState, type SyntheticEvent, type ReactNode } from "react";
import styles from "./admin.module.css";
import { submitObject } from "@/lib/admin-actions-client";

export const DATA_FORMAT_OPTIONS = [
  { value: "TEXT_ONLY", label: "Text only" },
  { value: "IMAGE", label: "Image" },
  { value: "PDF", label: "PDF" },
  { value: "CSV", label: "CSV" },
  { value: "HTML", label: "HTML" },
  { value: "ANY_FORMAT", label: "Any format" },
] as const;

export type DataFormatType = (typeof DATA_FORMAT_OPTIONS)[number]["value"];

export type ReferenceOption = {
  title: string;
  year: number;
  authors: string;
};

export type BaseEntityInitialValues = {
  name?: string;
  description?: string | null;
  dataFormatType?: DataFormatType[];
  selectedReferenceTitles?: string[];
};

type BaseEntityFormProps<T extends BaseEntityInitialValues> = {
  title: string;
  formatSectionTitle: string;
  formatHint: string;
  referenceHint: string;
  type: "dataset" | "model";
  submitUrl: string;
  redirectPath: string;
  initialValues?: T;
  references?: ReferenceOption[];
  mode?: "create" | "edit";
  method?: "POST" | "PATCH";
  // Used to aggregate additional state fields unique to the sub-forms
  getExtraBodyFields: () => Record<string, unknown>;
  children: (props: {
    name: string;
    setName: (v: string) => void;
    description: string;
    setDescription: (v: string) => void;
    isEditMode: boolean;
  }) => ReactNode;
};

export function BaseEntityForm<T extends BaseEntityInitialValues>({
  title,
  formatSectionTitle,
  formatHint,
  referenceHint,
  type,
  submitUrl,
  redirectPath,
  initialValues,
  references = [],
  mode = "create",
  method = "POST",
  getExtraBodyFields,
  children,
}: Readonly<BaseEntityFormProps<T>>) {
  const router = useRouter();
  const isEditMode = mode === "edit";

  const [name, setName] = useState(initialValues?.name ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [dataFormatType, setDataFormatType] = useState<DataFormatType[]>(
    initialValues?.dataFormatType ?? ["TEXT_ONLY"],
  );
  const [selectedReferenceTitles, setSelectedReferenceTitles] = useState<string[]>(
    initialValues?.selectedReferenceTitles ?? [],
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

  const toggleReference = (title: string) => {
    setSelectedReferenceTitles((current) =>
      current.includes(title)
        ? current.filter((t) => t !== title)
        : [...current, title],
    );
  };

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    const body = {
      name: name.trim(),
      description: description.trim() || null,
      ...getExtraBodyFields(),
      dataFormatType,
      referenceTitles: selectedReferenceTitles,
    };

    submitObject({ event, setSaving, setError, submitUrl, method, body, redirectPath, router, type });
  };

  return (
    <form className={styles.creationForm} onSubmit={handleSubmit}>
      <section className={styles.creationSection}>
        <h3 className={styles.creationSectionTitle}>{title}</h3>
        {children({ name, setName, description, setDescription, isEditMode })}
      </section>

      <section className={styles.creationSection}>
        <h3 className={styles.creationSectionTitle}>{formatSectionTitle}</h3>
        <p className={styles.creationHint}>{formatHint}</p>
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

      <section className={styles.creationSection}>
        <h3 className={styles.creationSectionTitle}>References</h3>
        <p className={styles.creationHint}>{referenceHint}</p>
        {references.length === 0 ? (
          <p className={styles.creationHint}>No references available. Add a reference first.</p>
        ) : (
          <div className={styles.creationCategoryToggle}>
            {references.map((ref) => (
              <label key={ref.title} className={styles.creationRadioCard}>
                <input
                  type="checkbox"
                  checked={selectedReferenceTitles.includes(ref.title)}
                  onChange={() => toggleReference(ref.title)}
                />
                <span>
                  {ref.title} ({ref.year}) — {ref.authors}
                </span>
              </label>
            ))}
          </div>
        )}
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