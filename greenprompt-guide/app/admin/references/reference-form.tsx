"use client";

import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type SyntheticEvent } from "react";
import styles from "../admin.module.css";

export type ReferenceFormInitialValues = {
  title?: string;
  authors?: string;
  abstract?: string;
  keywords?: string;
  year?: number;
  studyType?: string;
  domain?: string | null;
  task?: string | null;
  venue?: string | null;
  toolAvailability?: string | null;
  link?: string | null;
};

type ReferenceFormProps = {
  submitUrl: string;
  redirectPath: string;
  initialValues?: ReferenceFormInitialValues;
  mode?: "create" | "edit";
  method?: "POST" | "PATCH";
};

export function ReferenceForm({
  submitUrl,
  redirectPath,
  initialValues,
  mode = "create",
  method = "POST",
}: Readonly<ReferenceFormProps>) {
  const router = useRouter();
  const isEditMode = mode === "edit";

  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [authors, setAuthors] = useState(initialValues?.authors ?? "");
  const [abstract, setAbstract] = useState(initialValues?.abstract ?? "");
  const [keywords, setKeywords] = useState(initialValues?.keywords ?? "");
  const [year, setYear] = useState(String(initialValues?.year ?? new Date().getFullYear()));
  const [studyType, setStudyType] = useState(initialValues?.studyType ?? "");
  const [domain, setDomain] = useState(initialValues?.domain ?? "");
  const [task, setTask] = useState(initialValues?.task ?? "");
  const [venue, setVenue] = useState(initialValues?.venue ?? "");
  const [toolAvailability, setToolAvailability] = useState(initialValues?.toolAvailability ?? "");
  const [link, setLink] = useState(initialValues?.link ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    const body = {
      title: title.trim(),
      authors: authors.trim(),
      abstract: abstract.trim() || null,
      keywords: keywords.trim() || null,
      year: Number.parseInt(year, 10),
      studyType: studyType.trim(),
      domain: domain.trim() || null,
      task: task.trim() || null,
      venue: venue.trim() || null,
      toolAvailability: toolAvailability.trim() || null,
      link: link.trim() || null,
    };

    try {
      const response = await fetch(submitUrl, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save the reference");
      }

      router.push(redirectPath);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save the reference right now");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className={styles.creationForm} onSubmit={handleSubmit}>
      <section className={styles.creationSection}>
        <h3 className={styles.creationSectionTitle}>Reference details</h3>
        <div className={styles.creationSplitGrid}>
          <div className="form-group">
            <label htmlFor="reference-title">Title</label>
            <input
              id="reference-title"
              value={title}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
              required
              disabled={isEditMode}
            />
            {isEditMode ? (
              <p className={styles.creationHint}>The title is the primary key and cannot be changed.</p>
            ) : null}
          </div>
          <div className="form-group">
            <label htmlFor="reference-year">Year</label>
            <input
              id="reference-year"
              type="number"
              value={year}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setYear(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="reference-authors">Authors</label>
          <input
            id="reference-authors"
            value={authors}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setAuthors(e.target.value)}
            placeholder="Separate multiple authors with ; or &"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="reference-abstract">Abstract</label>
          <textarea
            id="reference-abstract"
            className={styles.creationTextarea}
            value={abstract}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setAbstract(e.target.value)}
            rows={6}
          />
        </div>

        <div className={styles.creationSplitGrid}>
          <div className="form-group">
            <label htmlFor="reference-keywords">Keywords</label>
            <input
              id="reference-keywords"
              value={keywords}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setKeywords(e.target.value)}
              placeholder="Comma-separated keywords"
            />
          </div>
          <div className="form-group">
            <label htmlFor="reference-study-type">Study type</label>
            <input
              id="reference-study-type"
              value={studyType}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setStudyType(e.target.value)}
              required
            />
          </div>
        </div>

        <div className={styles.creationSplitGrid}>
          <div className="form-group">
            <label htmlFor="reference-domain">Domain</label>
            <input
              id="reference-domain"
              value={domain}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setDomain(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="reference-task">Task</label>
            <input
              id="reference-task"
              value={task}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setTask(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.creationSplitGrid}>
          <div className="form-group">
            <label htmlFor="reference-venue">Venue</label>
            <input
              id="reference-venue"
              value={venue}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setVenue(e.target.value)}
              placeholder="e.g. NeurIPS 2024, arXiv"
            />
          </div>
          <div className="form-group">
            <label htmlFor="reference-tool-availability">Tool availability</label>
            <input
              id="reference-tool-availability"
              value={toolAvailability}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setToolAvailability(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="reference-link">Link</label>
          <input
            id="reference-link"
            type="url"
            value={link}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setLink(e.target.value)}
            placeholder="https://..."
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
