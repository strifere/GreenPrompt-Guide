import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPracticeByName } from "@/domain/practice-repository";
import {
  catalogDatasetHref,
  catalogModelHref,
  catalogPromptTechniqueHref,
  catalogReferenceHref,
} from "../../catalog-paths";

type PracticeDetailsProps = {
  params: Promise<{ practiceName: string }>;
};

export default async function PracticeDetailsPage({
  params,
}: Readonly<PracticeDetailsProps>) {
  const { practiceName } = await params;
  const practiceNameDecoded = decodeURIComponent(practiceName);
  const practice = await getPracticeByName(practiceNameDecoded);

  if (!practice) {
    notFound();
  }

  const relatedDatasets = Array.from(
    new Map(
      practice.papers
        .flatMap((paper) => paper.reference.datasets.map((entry) => entry.dataset))
        .map((dataset) => [dataset.name, dataset]),
    ).values(),
  );

  const primaryExample = practice.practiceExamples[0];
  const secondaryExample = practice.practiceExamples[1] ?? primaryExample;

  return (
    <main className="details-page">
      <div className="practice-details-shell">
        <header className="practice-details-header">
          <Link href="/catalog" className="practice-back-link" aria-label="Back to practices">
            <ArrowLeft aria-hidden size={30} strokeWidth={2.25} />
          </Link>
          <div>
            <h1>{practice.name}</h1>
          </div>
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
          <h2>Example:</h2>
          <p>
            <strong>Scenario:</strong>{" "}
            {primaryExample?.scenario ?? "No scenario available for this practice yet."}
          </p>

          <div className="practice-example-grid">
            <article className="practice-example-card">
              <h3>Original prompt</h3>
              <p>{primaryExample?.originalPrompts ?? "No original prompt registered."}</p>
            </article>
            <article className="practice-example-card">
              <h3>Improved prompt</h3>
              <p>{secondaryExample?.improvedPrompts ?? "No improved prompt registered."}</p>
            </article>
          </div>

          <p>
            <strong>Observations:</strong>{" "}
            {primaryExample?.observations ?? "No observations registered yet."}
          </p>
        </section>

        <section className="practice-section">
          <h2>Metrics:</h2>
          <div className="practice-metrics-grid">
            {practice.metrics.length > 0 ? (
              practice.metrics.map((metric) => (
                <article key={metric.id} className="practice-metric-card">
                  <h3>{metric.title}</h3>
                  <p>{metric.value}</p>
                </article>
              ))
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
                    {hyperparameter.name}: {hyperparameter.value} ({hyperparameter.dataType})
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
                  {entry.reference.title ?? "Reference"}{entry.reference.year && ` (${entry.reference.year})`}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
