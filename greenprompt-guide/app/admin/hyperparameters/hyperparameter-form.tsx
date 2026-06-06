"use client";

import { SyntheticEvent, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import styles from "../admin.module.css";

export type HyperparameterFormInitialValues = {
  id?: number;
  referenceTitle: string;
  practiceName?: string | null;
  name: string;
  value: string;
  dataType: string;
};

type HyperparameterFormProps = {
  submitUrl: string;
  redirectPath: string;
  initialValues?: HyperparameterFormInitialValues;
  references?: { title: string; year: number; authors: string }[];
  practices?: { name: string }[];
  method?: "POST" | "PATCH";
};

export function HyperparameterForm({
  submitUrl,
  redirectPath,
  initialValues,
  references = [],
  practices = [],
  method = "POST",
}: Readonly<HyperparameterFormProps>) {
  const router = useRouter();
  
  const [name, setName] = useState(initialValues?.name ?? "");
  const [value, setValue] = useState(initialValues?.value ?? "");
  const [dataType, setDataType] = useState(initialValues?.dataType ?? "string");
  const [referenceTitle, setReferenceTitle] = useState<string>(initialValues?.referenceTitle ?? "");
  const [practiceName, setPracticeName] = useState<string>(initialValues?.practiceName ?? "");
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    if (!referenceTitle) {
      setError("A Reference is required to map this hyperparameter.");
      setSaving(false);
      return;
    }

    const body = {
      id: initialValues?.id,
      name: name.trim(),
      value: value.trim(),
      dataType,
      referenceTitle,
      practiceName: practiceName || null,
    };

    console.log("Submitting hyperparameter with body:", body);

    try {
      const res = await fetch(submitUrl, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to save hyperparameter.");
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
        <h3 className={styles.creationSectionTitle}>Hyperparameter details</h3>
        
        <div className={styles.creationSplitGrid}>
          <div className="form-group">
            <label htmlFor="hp-name">Name</label>
            <input
              id="hp-name"
              value={name}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              placeholder="e.g., learning_rate, batch_size"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="hp-value">Value</label>
            <input
              id="hp-value"
              value={value}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
              placeholder="e.g., 0.001, 32"
              required
            />
          </div>
        </div>

        <div className={styles.creationSplitGrid}>
          <div className="form-group">
            <label htmlFor="hp-value">Data Type</label>
            <input
              id="hp-value"
              value={dataType}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setDataType(e.target.value)}
              placeholder="e.g., string, int, float, etc."
              required
            />
          </div>
        </div>
      </section>

      <section className={styles.creationSection}>
        <h3 className={styles.creationSectionTitle}>Relationships</h3>
        <div className={styles.creationSplitGrid}>
          <div className="form-group">
            <label htmlFor="hp-referenceTitle">Reference (Required)</label>
            <select
              className={styles.creationSelect}
              id="hp-referenceTitle"
              value={referenceTitle}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setReferenceTitle(e.target.value)}
            >
              <option value="" disabled>Select a reference...</option>
              {references.map((ref) => (
                <option key={ref.title} value={ref.title}>
                  {ref.title} ({ref.year})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="hp-practiceName">Practice (Optional)</label>
            <select
              className={styles.creationSelect}
              id="hp-practiceName"
              value={practiceName}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setPracticeName(e.target.value)}
            >
              <option value="">-- None --</option>
              {practices.map((practice) => (
                <option key={practice.name} value={practice.name}>
                  {practice.name}
                </option>
              ))}
            </select>
          </div>
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