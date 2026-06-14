import Link from "next/link";
import { notFound } from "next/navigation";
import { getModelByName } from "@/domain/model-repository";
import { catalogPracticeHref, catalogReferenceHref } from "../../catalog-paths";
import { getSession } from "@/lib/session";
import { getUserByUsername } from "@/domain/user-repository";
import { Tip } from "@/app/ui/tooltip/tip";
import { Info } from "lucide-react";
import { TOOLTIPS } from "@/app/ui/tooltip/tooltip-content";
import { TipInfo } from "@/app/ui/tooltip/tip-info";

type ModelDetailsProps = {
  params: Promise<{ modelName: string }>;
};

export default async function ModelDetailsPage({
  params,
}: Readonly<ModelDetailsProps>) {
  const { modelName } = await params;
  const modelNameDecoded = decodeURIComponent(modelName);
  const [model, username] = await Promise.all([
    getModelByName(modelNameDecoded),
    getSession(),
  ]);

  if (!model) {
    notFound();
  }

  const currentUser = username ? await getUserByUsername(username) : null;
  const canEditModel = currentUser?.role === "ADMIN";

  const relatedPractices = model.practices.map((entry) => entry.practice);
  const relatedReferences = model.references.map((entry) => entry.reference);

  return (
    <main className="details-page">
      <div className="practice-details-shell">
        <header className="practice-details-header">
          <div>
            <h1>{model.name}</h1>
            {model.description && (
              <p>{model.description}</p>
            )}
          </div>
          {canEditModel ? (
            <Link href={`/admin/models/edit/${encodeURIComponent(model.name)}`} className="green-btn">
              Edit model
            </Link>
          ) : null}
        </header>

        <section className="practice-facts-grid" aria-label="Model metadata">
          <article>
            <div className="info-header">
              <h2 style={{"paddingRight": "10px"}}>Parameters</h2>
              <TipInfo content={TOOLTIPS.MODEL_PARAMETERS}/>
            </div>
            <ul>
              {model.parameters ? (
                <li>{model.parameters}</li>
              ) : (
                <li>No parameters specified.</li>
              )}
            </ul>
          </article>

          <article>
            <div className="info-header">
              <h2 style={{"paddingRight": "10px"}}>Size</h2>
              <TipInfo content={TOOLTIPS.MODEL_SIZE}/>
            </div>
            <ul>
              {model.size ? (
                <li>{model.size}</li>
              ) : (
                <li>No size specified.</li>
              )}
            </ul>
          </article>

          <article>
            <div className="info-header">
              <h2 style={{"paddingRight": "10px"}}>Data Format Types</h2>
              <TipInfo content={TOOLTIPS.MODEL_DATA_FORMAT_TYPES}/>
            </div>
            <ul>
              {model.dataFormatType && model.dataFormatType.length > 0 ? (
                model.dataFormatType.map((format) => (
                  <li key={`format-${format}`}>{format}</li>
                ))
              ) : (
                <li>No data format types specified.</li>
              )}
            </ul>
          </article>
        </section>

        <section className="facts-grid" aria-label="Model relations">
          <article>
            <h2>Related practices</h2>
            <ul>
              {relatedPractices.length > 0 ? (
                relatedPractices.map((practice, index) => (
                  <li key={`practice-${model.name}-${index}`}>
                    <Link href={catalogPracticeHref(practice.name)} className="reference-link">
                      {practice.name}
                    </Link>
                  </li>
                ))
              ) : (
                <li>No practices mapped yet.</li>
              )}
            </ul>
          </article>

          <article>
            <h2>Extracted from:</h2>
            <ul>
              {relatedReferences.length > 0 ? (
                relatedReferences.map((reference, index) => (
                  <li key={`reference-${model.name}-${index}`}>
                    <Link href={catalogReferenceHref(reference.title)} className="reference-link">
                      {reference.title}{(reference.year !== null) && ` (${reference.year})`}
                    </Link>
                  </li>
                ))
              ) : (
                <li>No references mapped yet.</li>
              )}
            </ul>
          </article>
        </section>
      </div>
    </main>
  );
}
