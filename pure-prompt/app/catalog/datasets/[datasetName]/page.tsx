import Link from "next/link";
import { notFound } from "next/navigation";
import { getDatasetByName } from "@/domain/dataset-repository";
import { catalogPracticeHref, catalogReferenceHref } from "../../catalog-paths";

type DatasetDetailsProps = {
  params: Promise<{ datasetName: string }>;
};

export default async function DatasetDetailsPage({
  params,
}: Readonly<DatasetDetailsProps>) {
  const { datasetName } = await params;
  const datasetNameDecoded = decodeURIComponent(datasetName);
  const dataset = await getDatasetByName(datasetNameDecoded);

  if (!dataset) {
    notFound();
  }

  const relatedReferences = Array.from(
    new Map(
      dataset.papers.map((entry) => [entry.reference.title, entry.reference]),
    ).values(),
  );

  const relatedPractices = Array.from(
    new Map(
      dataset.papers
        .flatMap((paper) => paper.reference.practices.map((entry) => entry.practice))
        .map((practice) => [practice.name, practice]),
    ).values(),
  );

  return (
    <main className="details-page">
      <div className="practice-details-shell">
        <header className="practice-details-header">
          <div>
            <h1>{dataset.name}</h1>
            {dataset.description && (
              <p>{dataset.description}</p>
            )}
          </div>
        </header>

        <section className="practice-facts-grid" aria-label="Dataset metadata">
          <article>
            <h2>Size</h2>
            <ul>
              {dataset.size ? (
                <li>{dataset.size}</li>
              ) : (
                <li>No size specified.</li>
              )}
            </ul>
          </article>

          <article>
            <h2>Data Format Types</h2>
            <ul>
              {dataset.dataFormatType && dataset.dataFormatType.length > 0 ? (
                dataset.dataFormatType.map((format) => (
                  <li key={`format-${format}`}>{format}</li>
                ))
              ) : (
                <li>No data format types specified.</li>
              )}
            </ul>
          </article>
        </section>

        <section className="facts-grid" aria-label="Dataset relations">
          <article>
            <h2>Related practices</h2>
            <ul>
              {relatedPractices.length > 0 ? (
                relatedPractices.map((practice, index) => (
                  <li key={`practice-${dataset.name}-${index}`}>
                    <Link href={catalogPracticeHref(practice.name)} className="reference-link">
                      {practice.name}
                    </Link>
                  </li>
                ))
              ) : (
                <li>No practices linked yet.</li>
              )}
            </ul>
          </article>

          <article>
            <h2>Extracted from:</h2>
            <ul>
              {relatedReferences.length > 0 ? (
                relatedReferences.map((reference, index) => (
                  <li key={`reference-${dataset.name}-${index}`}>
                    <Link href={catalogReferenceHref(reference.title)} className="reference-link">
                      {reference.title}{reference.year && ` (${reference.year})`}
                    </Link>
                  </li>
                ))
              ) : (
                <li>No references linked yet.</li>
              )}
            </ul>
          </article>
        </section>
      </div>
    </main>
  );
}
