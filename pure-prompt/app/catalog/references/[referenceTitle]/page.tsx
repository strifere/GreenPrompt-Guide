import Link from "next/link";
import { notFound } from "next/navigation";
import { getReferenceByTitle } from "@/domain/reference-repository";
import {
  catalogDatasetHref,
  catalogModelHref,
  catalogPracticeHref,
  catalogPromptTechniqueHref,
} from "../../catalog-paths";

type ReferenceDetailsProps = {
  params: Promise<{ referenceTitle: string }>;
};

export default async function ReferenceDetailsPage({
  params,
}: Readonly<ReferenceDetailsProps>) {
  const { referenceTitle } = await params;
  const referenceTitleDecoded = decodeURIComponent(referenceTitle);
  const reference = await getReferenceByTitle(referenceTitleDecoded);

  if (!reference) {
    notFound();
  }

  const relatedDatasets = Array.from(
    new Map(
      reference.datasets
        .map((dataset) => [dataset.dataset.name, dataset.dataset]),
    ).values(),
  );

  return (
    <main className="details-page">
      <div className="practice-details-shell">
        <header className="practice-details-header">
          <div>
            <h1>{reference.title}</h1>
          </div>
        </header>

        <section className="practice-section">
          <h2> Authors: </h2>
          <div className="tags" aria-label="Practice categories">
            <p>{reference.authors}</p>
          </div>
          <h2>Abstract:</h2>
          <p>{reference.abstract}</p>

          <h2>Task:</h2>
          <p>{reference.task}</p>

          <h2>Tool availability:</h2>
          <ul>
            {reference.toolAvailability ? (
                <p>{reference.toolAvailability}</p>
              ) : (
                <p>No tool was developed in this study.</p>
              )}
          </ul>
          
        </section>

        <section className="practice-facts-grid reference-facts-grid" aria-label="Reference metadata">
          <article>
            <h2>Keywords</h2>
            <ul>
              {reference.keywords ? (
                reference.keywords.split(",").map((keyword, index) => (
                  <li key={`keyword-${reference.title}-${index}`}>{keyword.trim()}</li>
                ))
              ) : (
                <li>No keywords registered yet.</li>
              )}
            </ul>
          </article>

          <article>
            <h2>Year</h2>
            <ul>
              {reference.year ? (
                <li>{reference.year}</li>
              ) : (
                <li>Year not specified.</li>
              )}
            </ul>
          </article>

          <article>
            <h2>Study Type</h2>
            <ul>
              {reference.studyType ? (
                <li>{reference.studyType}</li>
              ) : (
                <li>Study type not specified.</li>
              )}
            </ul>
          </article>

          <article>
            <h2>Domain</h2>
            <ul>
              {reference.domain ? (
                <li>{reference.domain}</li>
              ) : (
                <li>Domain not specified.</li>
              )}
            </ul>
          </article>

          <article>
            <h2>Venue</h2>
            <ul>
              {reference.venue ? (
                <li>{reference.venue}</li>
              ) : (
                <li>Venue not specified.</li>
              )}
            </ul>
          </article>
        </section>

        <section className="practice-facts-grid" aria-label="Reference relations">
          <article>
            <h2>Prompt techniques</h2>
            <ul>
              {reference.promptTechniques.length > 0 ? (
                reference.promptTechniques.map((entry, index) => (
                  <li key={`technique-${reference.title}-${index}`}>
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
              {reference.models.length > 0 ? (
                reference.models.map((entry, index) => (
                  <li key={`model-${reference.title}-${index}`}>
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
              {reference.hyperparameters.length > 0 ? (
                reference.hyperparameters.map((hyperparameter) => (
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
          <h2>Practices extracted from this reference:</h2>
          <ul>
            {reference.practices.length > 0 ? (
              reference.practices.map((practice, index) => (
                <li key={`practice-${reference.title}-${index}`}>
                  <Link href={catalogPracticeHref(practice.practice.name)} className="reference-link">
                    {practice.practice.name}
                  </Link>
                </li>
              ))
            ) : (
              <li>No practices extracted from this reference yet.</li>
            )}
          </ul>
          <h2>Link to full reference:</h2>
          {reference.link ? (
            <Link href={reference.link} className="reference-link" target="_blank" rel="noopener noreferrer">
              {reference.link}
            </Link>
          ) : (
            <p>No link available yet.</p>
          )}
        </section>
      </div>
    </main>
  );
}
