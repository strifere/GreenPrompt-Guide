"use client";

import { catalogPracticeHref } from "../../catalog-paths";

type PracticeScore = {
  name: string;
  greenScore: number;
};

type PracticeGreenScoreChartProps = {
  currentPracticeName: string;
  scores: PracticeScore[];
};

export function PracticeGreenScoreChart({
  currentPracticeName,
  scores,
}: Readonly<PracticeGreenScoreChartProps>) {
  if (scores.length === 0) return null;

  const sorted = [...scores].sort((a, b) => b.greenScore - a.greenScore);
  const maxScore = Math.max(...sorted.map((s) => s.greenScore), 100);

  return (
    <div className="green-score-chart-wrap" aria-label="Green score comparison chart">
      <div className="green-score-chart-scroll">
        <ul className="green-score-chart-rows">
          {sorted.map((practice) => {
            const isCurrent = practice.name === currentPracticeName;
            const barPct = (practice.greenScore / maxScore) * 100;

            return (
              <li
                key={practice.name}
                className={`green-score-chart-row${isCurrent ? " green-score-chart-row--current" : ""}`}
              >
                {/* Label — capped at 22ch, truncated with ellipsis if longer;
                    title always shows the full name on hover */}
                <a
                  href={catalogPracticeHref(practice.name)}
                  className={`green-score-chart-label${isCurrent ? " green-score-chart-label--current" : ""}`}
                  title={practice.name}
                  tabIndex={0}
                >
                  {practice.name}
                </a>

                {/* Bar track + fill */}
                <div className="green-score-chart-track" aria-hidden="true">
                  <div
                    className={`green-score-chart-bar${isCurrent ? " green-score-chart-bar--current" : ""}`}
                    style={{ width: `${barPct}%` }}
                  />
                </div>

                {/* Score */}
                <span
                  className={`green-score-chart-score${isCurrent ? " green-score-chart-score--current" : ""}`}
                  aria-label={`Score: ${practice.greenScore}`}
                >
                  {practice.greenScore}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="green-score-chart-legend">
        <span className="green-score-chart-legend-current" aria-hidden="true" />
        Current practice{' '}
        <span className="green-score-chart-legend-sep" aria-hidden="true" />
        <span className="green-score-chart-legend-other" aria-hidden="true" />
        Other practices{''}
      </p>
    </div>
  );
}
