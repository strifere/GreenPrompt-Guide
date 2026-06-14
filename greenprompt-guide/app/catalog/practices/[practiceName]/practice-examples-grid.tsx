"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import { Tip } from "@/app/ui/tooltip/tip";
import { TOOLTIPS } from "@/app/ui/tooltip/tooltip-content";

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
            <div className="info-header">
              <h3 style={{"padding": "0px 10px"}}>Original prompt</h3>
              <Tip content={TOOLTIPS.PRACTICE_ORIGINAL_PROMPT}>
                <Info size={18} className="info-icon" aria-hidden />
              </Tip>
            </div>
            <p>{example.originalPrompts ?? "No original prompt registered."}</p>
          </article>
          <article className="practice-example-card">
            <div className="info-header">
              <h3 style={{"padding": "0px 10px"}}>Improved prompt</h3>
              <Tip content={TOOLTIPS.PRACTICE_IMPROVED_PROMPT}>
                <Info size={18} className="info-icon" aria-hidden />
              </Tip>
            </div>
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