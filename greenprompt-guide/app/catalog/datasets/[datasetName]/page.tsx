import Link from "next/link";
import { notFound } from "next/navigation";
import { getDatasetByName } from "@/domain/dataset-repository";
import { catalogPracticeHref, catalogReferenceHref } from "../../catalog-paths";
import { getUserByUsername } from "@/domain/user-repository";
import { getSession } from "@/lib/session";
import { TOOLTIPS } from "@/app/ui/tooltip/tooltip-content";
import { TipInfo } from "@/app/ui/tooltip/tip-info";

type DatasetDetailsProps = {
  params: Promise<{ datasetName: string }>;
};

export default async function DatasetDetailsPage({
  params,
}: Readonly<DatasetDetailsProps>) {
  const { datasetName } = await params;
  const datasetNameDecoded = decodeURIComponent(datasetName);
  const dataset = await getDatasetByName(datasetNameDecoded);

  const username = await getSession();
  const currentUser = username ? await getUserByUsername(username) : null;
  const canEditDataset = currentUser?.role === "ADMIN";

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
          {canEditDataset ? (
            <Link href={`/admin/datasets/edit/${encodeURIComponent(dataset.name)}`} className="green-btn">
              Edit dataset
            </Link>
          ) : null}
        </header>

        <section className="practice-facts-grid" aria-label="Dataset metadata">
          <article>
            <div className="info-header">
              <h2 style={{"paddingRight": "10px"}}>Size</h2>  
              <TipInfo content={TOOLTIPS.DATASET_SIZE}/>
            </div>
            
            <ul>
              {dataset.size ? (
                <li>{dataset.size}</li>
              ) : (
                <li>No size specified.</li>
              )}
            </ul>
          </article>

          <article>
            <div className="info-header">
              <h2 style={{"paddingRight": "10px"}}>Data Format Types</h2>
              <TipInfo content={TOOLTIPS.DATASET_DATA_FORMAT_TYPES}/>
            </div>
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
                      {reference.title}{(reference.year !== null) && ` (${reference.year})`}
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
