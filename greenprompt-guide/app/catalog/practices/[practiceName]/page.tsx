import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPracticeByName } from "@/domain/practice-repository";
import { getUserByUsername } from "@/domain/user-repository";
import { getSession } from "@/lib/session";
import { PracticeExamplesScrollableGrid } from "./practice-examples-grid";
import {
  catalogDatasetHref,
  catalogHyperparameterHref,
  catalogModelHref,
  catalogPromptTechniqueHref,
  catalogReferenceHref,
} from "../../catalog-paths";

const energyMetricUnitLabels: Record<string, string> = {
  PERCENTAGE: "%",
  TEMPERATURE: "ºC",
  CELSIUS: "ºC",
  FAHRENHEIT: "ºF",
  KELVIN: "K",
  WATT_HOUR: "Wh",
  KILOWATT_HOUR: "kWh",
  JOULE: "J",
};

function formatAccuracyLevel(level: string) {
  switch (level) {
    case "WORSE":
      return "Worse accuracy";
    case "SAME_OR_WORSE":
      return "Same or worse accuracy";
    case "SAME":
      return "Same accuracy";
    case "SAME_OR_BETTER":
      return "Same or better accuracy";
    case "BETTER":
      return "Better accuracy";
    case "MUCH_BETTER":
      return "Much better accuracy";
    case "NEAR_PERFECT":
      return "Near-perfect accuracy";
    default:
      return level;
  }
}

function formatEnergyMetricUnit(unit: string) {
  return energyMetricUnitLabels[unit] ?? unit;
}

function formatMetricConfidence(confidence: number) {
  return `${Math.round(confidence * 100)}%`;
}

function formatMetricValueWithUnit(value: number | null, unit: string) {
  if (value === null) {
    return "Not available";
  }

  return `${value}${formatEnergyMetricUnit(unit)}`;
}

type PracticeDetailsProps = {
  params: Promise<{ practiceName: string }>;
};

type PracticeExample = {
  id: number;
  scenario: string;
  originalPrompts: string;
  improvedPrompts: string;
  observations: string;
};

export default async function PracticeDetailsPage({
  params,
}: Readonly<PracticeDetailsProps>) {
  const { practiceName } = await params;
  const practiceNameDecoded = decodeURIComponent(practiceName);
  const [practice, username] = await Promise.all([
    getPracticeByName(practiceNameDecoded),
    getSession(),
  ]);

  if (!practice) {
    notFound();
  }

  const currentUser = username ? await getUserByUsername(username) : null;
  const canEditPractice = currentUser?.role === "ADMIN";

  const relatedDatasets = Array.from(
    new Map(
      practice.papers
        .flatMap((paper) => paper.reference.datasets.map((entry) => entry.dataset))
        .map((dataset) => [dataset.name, dataset]),
    ).values(),
  );

  const practiceExamples: PracticeExample[] = practice.practiceExamples;

  const renderMetricDetails = (metric: (typeof practice.metrics)[number]) => {
    const energyMetrics = metric.energyMetrics ?? [];
    const accuracyMetrics = metric.accuracyMetrics ?? [];
    const hasEnergyMetric = energyMetrics.length > 0;
    const hasAccuracyMetric = accuracyMetrics.length > 0;
    const shouldShowBaseValue = !hasEnergyMetric && !hasAccuracyMetric;

    return (
      <article key={metric.id} className="practice-metric-card">
        <h3>{metric.title}</h3>
        <p>
          <strong>Confidence:</strong> {formatMetricConfidence(metric.confidence)}
        </p>
        {metric.description ? (
          <p>
            {metric.description}
          </p>
        ) : null}
        {shouldShowBaseValue ? <p>{metric.value}</p> : null}

        {energyMetrics.map((energyMetric) => (
          <div key={energyMetric.metricId}>
            <p>
              <strong>Min value:</strong>{" "}
              {formatMetricValueWithUnit(energyMetric.minValue, energyMetric.unit)}
            </p>
            <p>
              <strong>Max value:</strong>{" "}
              {formatMetricValueWithUnit(energyMetric.maxValue, energyMetric.unit)}
            </p>
            <p>
              <strong>Best guess value:</strong>{" "}
              {formatMetricValueWithUnit(energyMetric.bestGuessValue, energyMetric.unit)}
            </p>
          </div>
        ))}

        {accuracyMetrics.map((accuracyMetric) => (
          <div key={accuracyMetric.metricId}>
            <p>
              <strong>Accuracy level:</strong> {formatAccuracyLevel(accuracyMetric.level)}
            </p>
            <p>
              <strong>Score:</strong> {accuracyMetric.score ?? "Not available"}
            </p>
          </div>
        ))}
      </article>
    );
  };

  return (
    <main className="details-page">
      <div className="practice-details-shell">
        <header className="practice-details-header">
          <div>
            <Link href="/catalog" className="animated-link" aria-label="Back to catalog">
              <ArrowLeft aria-hidden size={22} strokeWidth={2.25} />
              <span>Back to catalog</span>
            </Link>
            <h1>{practice.name}</h1>
          </div>
          {canEditPractice ? (
            <Link href={`/admin/practices/edit/${encodeURIComponent(practice.name)}`} className="green-btn">
              Edit practice
            </Link>
          ) : null}
        </header>

        <section className="practice-section">
          <p>{practice.description}</p>
          <h2> Categories: </h2>
          <div className="tags" aria-label="Practice categories">
            {practice.categories.map((category) => (
              <span key={`${practice.name}-${category.category.name}`}>
                {category.category.name}
              </span>
            ))}
          </div>
          <h2>Examples:</h2>
          {practiceExamples.length === 0 ? (
            <p>No examples registered for this practice yet.</p>
          ) : (
            <PracticeExamplesScrollableGrid examples={practiceExamples} />
          )}
        </section>

        <section className="practice-section">
          <h2>Metrics:</h2>
          <div className="practice-metrics-grid">
            {practice.metrics.length > 0 ? (
              practice.metrics.map((metric) => renderMetricDetails(metric))
            ) : (
              <article className="practice-metric-card">
                <h3>Green score</h3>
                <p>{practice.greenScore}</p>
              </article>
            )}
          </div>
        </section>

        <section className="practice-facts-grid" aria-label="Practice metadata">
          <article>
            <h2>Prompt techniques</h2>
            <ul>
              {practice.prompts.length > 0 ? (
                practice.prompts.map((entry, index) => (
                  <li key={`technique-${practice.name}-${index}`}>
                    <Link href={catalogPromptTechniqueHref(entry.promptTechnique.name)} className="reference-link">
                      {entry.promptTechnique.name}
                    </Link>
                  </li>
                ))
              ) : (
                <li>No prompt techniques mapped yet.</li>
              )}
            </ul>
          </article>

          <article>
            <h2>Models</h2>
            <ul>
              {practice.models.length > 0 ? (
                practice.models.map((entry, index) => (
                  <li key={`model-${practice.name}-${index}`}>
                    <Link href={catalogModelHref(entry.model.name)} className="reference-link">
                      {entry.model.name}
                    </Link>
                  </li>
                ))
              ) : (
                <li>No models mapped yet.</li>
              )}
            </ul>
          </article>

          <article>
            <h2>Hyperparameters</h2>
            <ul>
              {practice.hyperparameters.length > 0 ? (
                practice.hyperparameters.map((hyperparameter) => (
                  <li key={hyperparameter.id}>
                    <Link href={catalogHyperparameterHref(hyperparameter.id)} className="reference-link">
                      {hyperparameter.name}: {hyperparameter.value} ({hyperparameter.dataType})
                    </Link>
                  </li>
                ))
              ) : (
                <li>No hyperparameters mapped yet.</li>
              )}
            </ul>
          </article>

          <article>
            <h2>Datasets</h2>
            <ul>
              {relatedDatasets.length > 0 ? (
                relatedDatasets.map((dataset) => (
                  <li key={dataset.name}>
                    <Link href={catalogDatasetHref(dataset.name)} className="reference-link">
                      {dataset.name}
                    </Link>
                  </li>
                ))
              ) : (
                <li>No datasets linked through references yet.</li>
              )}
            </ul>
          </article>
        </section>

        <section className="practice-section practice-references">
          <h2>Practice extracted from:</h2>
          <ul>
            {practice.papers.map((entry) => (
              <li key={entry.reference.title}>
                <Link href={catalogReferenceHref(entry.reference.title)} className="reference-link">
                  {entry.reference.title ?? "Reference"}{entry.reference.year !== null && ` (${entry.reference.year})`}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
