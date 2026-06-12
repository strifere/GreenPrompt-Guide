"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PracticeExample = {
  id: number;
  scenario: string;
  originalPrompts: string;
  improvedPrompts: string;
  observations: string;
};

export function PracticeExamplesScrollableGrid({ examples }: Readonly<{ examples: PracticeExample[] }>) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const example = examples[currentIndex];
  const canGoNext = currentIndex < examples.length - 1;
  const canGoPrev = currentIndex > 0;

  return (
    <div className="practice-example-viewer">
      <div className="practice-example-details">
        <p>
          <strong>Scenario:</strong> {example.scenario ?? "No scenario available for this practice yet."}
        </p>

        <div className="practice-example-grid">
          <article className="practice-example-card">
            <h3>Original prompt</h3>
            <p>{example.originalPrompts ?? "No original prompt registered."}</p>
          </article>
          <article className="practice-example-card">
            <h3>Improved prompt</h3>
            <p>{example.improvedPrompts ?? "No improved prompt registered."}</p>
          </article>
        </div>

        <p>
          <strong>Observations:</strong> {example.observations ?? "No observations registered yet."}
        </p>
      </div>
      {examples.length > 1 && (
        <div className="practice-example-nav">
        <button type="button" className="user-icon-button" onClick={() => setCurrentIndex(currentIndex - 1)} disabled={!canGoPrev} aria-label="Previous example">
          <ChevronLeft size={20} />
        </button>
        <span>
          Example {currentIndex + 1} of {examples.length}
        </span>
        <button type="button" className="user-icon-button" onClick={() => setCurrentIndex(currentIndex + 1)} disabled={!canGoNext} aria-label="Next example">
          <ChevronRight size={20} />
        </button>
      </div>
      )}
    </div>
  );
}