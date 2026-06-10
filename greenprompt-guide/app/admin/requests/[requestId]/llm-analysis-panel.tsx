"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { OllamaExtractionResult } from "@/lib/ollama-client";
import styles from "../../admin.module.css";

type ExistingJob = {
  status: "PENDING" | "RUNNING" | "DONE" | "FAILED";
  result: unknown;
  error: string | null;
} | null;

type LlmAnalysisPanelProps = {
  requestId: number;
  existingJob: ExistingJob;
};

type AnalysisState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "polling"; attempt: number }
  | { kind: "error"; message: string }
  | { kind: "done"; result: OllamaExtractionResult };

function getNextInterval(attempt: number): number {
  return Math.min(3000 + attempt * 2000, 12000);
}

function deriveInitialState(existingJob: ExistingJob): AnalysisState {
  if (!existingJob) return { kind: "idle" };

  switch (existingJob.status) {
    case "DONE":
      return { kind: "done", result: existingJob.result as OllamaExtractionResult };
    case "FAILED":
      return { kind: "error", message: existingJob.error ?? "Analysis failed" };
    case "PENDING":
    case "RUNNING":
      // Job was in progress when user left — resume polling
      return { kind: "polling", attempt: 0 };
  }
}

export function LlmAnalysisPanel({ requestId, existingJob }: Readonly<LlmAnalysisPanelProps>) {
  const router = useRouter();
  const [state, setState] = useState<AnalysisState>(() => deriveInitialState(existingJob));
  const [step, setStep] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (state.kind !== "polling") return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/admin/requests/${requestId}/analyze`);
        const data = await res.json() as {
          status: "NONE" | "PENDING" | "RUNNING" | "DONE" | "FAILED";
          step: "FIRST_PROMPT" | "SECOND_PROMPT" | "THIRD_PROMPT" | "FOURTH_PROMPT" | "FINISHED";
          extraction?: OllamaExtractionResult;
          error?: string;
        };

        if (data.status === "DONE") {
          setState({ kind: "done", result: data.extraction! });
        } else if (data.status === "FAILED") {
          setState({ kind: "error", message: data.error ?? "Analysis failed" });
        } else {
          const next = getNextInterval(state.attempt);
          timeoutRef.current = setTimeout(() => {
            setState((prev) =>
              prev.kind === "polling"
                ? { kind: "polling", attempt: prev.attempt + 1 }
                : prev,
            );
          }, next);
        }

        switch (data.step) {
          case "FIRST_PROMPT":
            setStep("Phase 1/4: Extracting the practice, examples and prompt techniques...");
            break;
          case "SECOND_PROMPT":
            setStep("Phase 2/4: Extracting reference data from the PDF...");
            break;
          case "THIRD_PROMPT":
            setStep("Phase 3/4: Extracting models, datasets and hyperparameters...");
            break;
          case "FOURTH_PROMPT":
            setStep("Phase 4/4: Extracting metrics...");
            break;
          case "FINISHED":
            // This means the worker marked the analysis as finished, but we haven't received the DONE status yet. Continue polling as normal.
            setStep("Analysis complete.");
            break;
        }
      } catch {
        setState({ kind: "error", message: "Network error while polling" });
      }
    };

    poll();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [state.kind, state.kind === "polling" ? state.attempt : null, requestId]);

  const handleAnalyze = async () => {
    setState({ kind: "submitting" });
    try {
      const res = await fetch(`/api/admin/requests/${requestId}/analyze`, {
        method: "POST",
      });
      const data = await res.json() as { jobId?: number; error?: string };
      if (!res.ok) {
        setState({ kind: "error", message: data.error ?? "Failed to enqueue job" });
        return;
      }
      setState({ kind: "polling", attempt: 0 });
    } catch {
      setState({ kind: "error", message: "Network error. Please try again." });
    }
  };

  const handleApproveAndCreate = () => {
    if (state.kind !== "done") return;
    sessionStorage.setItem(`llm-draft-${requestId}`, JSON.stringify(state.result));
    router.push(`/admin/practices/new/${requestId}`);
  };

  return (
    <div className="collaboration-important-section" style={{ marginTop: "20px" }}>
      <h2>AI-Assisted Extraction</h2>

      {state.kind === "idle" && (
        <>
          <p style={{ color: "var(--text-muted)", margin: "0 0 12px" }}>
            Let the AI analyze the supporting PDF and extract structured data.
          </p>
          <button type="button" className="solid-btn" onClick={handleAnalyze}>
            Analyze PDF with AI
          </button>
        </>
      )}

      {state.kind === "submitting" && (
        <p style={{ color: "var(--text-muted)" }}>Submitting job…</p>
      )}

      {state.kind === "polling" && (
        <p style={{ color: "var(--text-muted)" }}>
          {step}
        </p>
      )}

      {state.kind === "error" && (
        <>
          <div className="error-message">{state.message}</div>
          <button type="button" className="ghost-btn"
            style={{ marginTop: "10px" }} onClick={handleAnalyze}>
            Try again
          </button>
        </>
      )}

      {state.kind === "done" && (
        <ExtractionPreview
          result={state.result}
          onApprove={handleApproveAndCreate}
          onRetry={handleAnalyze}
        />
      )}
    </div>
  );
}

function Section({ title, children }: Readonly<{ title: string; children: React.ReactNode }>) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <h3 style={{ margin: "0 0 8px", fontFamily: "var(--font-display)", fontSize: "1rem" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function Tag({ label }: Readonly<{ label: string }>) {
  return (
    <span className={styles.badge} style={{ marginRight: "6px", marginBottom: "4px" }}>
      {label}
    </span>
  );
}

function ExtractionPreview({
  result,
  onApprove,
  onRetry,
}: Readonly<{
  result: OllamaExtractionResult;
  onApprove: () => void;
  onRetry: () => void;
}>) {
  return (
    <div>
      <p style={{ color: "var(--text-muted)", margin: "0 0 16px", fontSize: "0.92rem" }}>
        Review the extracted data below. Click "Use this draft" to pre-fill the practice form.
      </p>

      <Section title="Practice">
        <p style={{ margin: "0 0 4px" }}>
          <strong>{result.practice.name}</strong>
          <span className={styles.badge} style={{ marginLeft: "8px" }}>
            Score: {result.practice.greenScore}
          </span>
          <span className={styles.badge} style={{ marginLeft: "6px" }}>
            {result.practice.tactic === "GREEN_PRACTICE" ? "Green" : "Red"}
          </span>
        </p>
        <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.92rem" }}>
          {result.practice.description}
        </p>
      </Section>

      <Section title="Reference">
        <p style={{ margin: "0 0 2px" }}>
          <strong>{result.reference.title}</strong> ({result.reference.year})
        </p>
        <p style={{ margin: "0", color: "var(--text-muted)", fontSize: "0.92rem" }}>
          {result.reference.authors}
        </p>
      </Section>

      {result.practice.categories.length > 0 && (
        <Section title="Categories">
          <div>{result.practice.categories.map((c) => <Tag key={c} label={c} />)}</div>
        </Section>
      )}

      {result.metrics && (
        <Section title={`Metrics (${result.metrics.genericMetrics.length + result.metrics.energyMetrics.length + result.metrics.accuracyMetrics.length})`}>
          {result.metrics.genericMetrics.map((m, i) => (
            <div key={i} style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginBottom: "4px" }}>
              <strong>{m.title}</strong>: {m.value} — {m.description}
            </div>
          ))}
          {result.metrics.energyMetrics.map((m, i) => (
            <div key={i} style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginBottom: "4px" }}>
              <strong>{m.title}</strong>: {m.value} — {m.description}
            </div>
          ))}
          {result.metrics.accuracyMetrics.map((m, i) => (
            <div key={i} style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginBottom: "4px" }}>
              <strong>{m.title}</strong>: {m.value} — {m.description}
            </div>
          ))}
        </Section>
      )}

      {result.models.length > 0 && (
        <Section title={`Models (${result.models.length})`}>
          <div>{result.models.map((m) => <Tag key={m.name} label={m.parameters ? `${m.name} (${m.parameters})` : m.name} />)}</div>
        </Section>
      )}

      {result.hyperparameters.length > 0 && (
        <Section title={`Hyperparameters (${result.hyperparameters.length})`}>
          {result.hyperparameters.map((h, i) => (
            <div key={i} style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>
              {h.name}: {h.value} ({h.dataType})
            </div>
          ))}
        </Section>
      )}

      {result.examples.length > 0 && (
        <Section title={`Examples (${result.examples.length})`}>
          {result.examples.map((e, i) => (
            <div key={i} style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginBottom: "6px", display: "flex", flexDirection: "column", gap: "4px" }}>
              <strong>Scenario:</strong> {e.scenario}
              <strong>Original prompts:</strong> {e.originalPrompts}
              <strong>Improved prompts:</strong> {e.improvedPrompts}
              <strong>Observations:</strong> {e.observations}
            </div>
          ))}
        </Section>
      )}

      <div style={{ display: "flex", gap: "10px", marginTop: "16px", flexWrap: "wrap" }}>
        <button type="button" className="green-btn" onClick={onApprove}>
          Use this draft
        </button>
        <button type="button" className="ghost-btn" onClick={onRetry}>
          Re-analyze
        </button>
      </div>
    </div>
  );
}