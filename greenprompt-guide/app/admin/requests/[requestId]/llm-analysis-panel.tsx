"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { OllamaExtractionResult } from "@/lib/ollama-client";
import styles from "../../admin.module.css";

type LlmAnalysisPanelProps = {
  requestId: number;
};

type AnalysisState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "done"; result: OllamaExtractionResult };

export function LlmAnalysisPanel({ requestId }: Readonly<LlmAnalysisPanelProps>) {
  const router = useRouter();
  const [state, setState] = useState<AnalysisState>({ kind: "idle" });

  const handleAnalyze = async () => {
    setState({ kind: "loading" });

    try {
      const response = await fetch(
        `/api/admin/requests/${requestId}/analyze`,
        { method: "POST" },
      );
      const data = await response.json() as { extraction?: OllamaExtractionResult; error?: string };

      if (!response.ok) {
        setState({ kind: "error", message: data.error ?? "Analysis failed" });
        return;
      }

      setState({ kind: "done", result: data.extraction! });
    } catch {
      setState({ kind: "error", message: "Network error. Is Ollama running?" });
    }
  };

  const handleApproveAndCreate = () => {
    if (state.kind !== "done") return;
    // Store in sessionStorage so the practice form can read it
    sessionStorage.setItem(
      `llm-draft-${requestId}`,
      JSON.stringify(state.result),
    );
    router.push(`/admin/practices/new/${requestId}`);
  };

  return (
    <div className="collaboration-important-section" style={{ marginTop: "20px" }}>
      <h2>AI-Assisted Extraction</h2>

      {state.kind === "idle" && (
        <>
          <p style={{ color: "var(--text-muted)", margin: "0 0 12px" }}>
            Let the AI analyze the supporting PDF and extract structured data to help you fill in
            the practice form faster.
          </p>
          <button type="button" className="solid-btn" onClick={handleAnalyze}>
            Analyze PDF with AI
          </button>
        </>
      )}

      {state.kind === "loading" && (
        <p style={{ color: "var(--text-muted)" }}>
          Analyzing PDF… this can take 30–60 seconds.
        </p>
      )}

      {state.kind === "error" && (
        <>
          <div className="error-message">{state.message}</div>
          <button
            type="button"
            className="ghost-btn"
            style={{ marginTop: "10px" }}
            onClick={handleAnalyze}
          >
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
            <div key={i} style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginBottom: "6px" }}>
              <strong>Scenario:</strong> {e.scenario}
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