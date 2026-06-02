import Link from "next/link";
import { notFound } from "next/navigation";
import { getPromptTechniqueByName } from "@/domain/prompt-technique-repository";
import { catalogPracticeHref, catalogReferenceHref } from "../../catalog-paths";
import { getUserByUsername } from "@/domain/user-repository";
import { getSession } from "@/lib/session";

type PromptTechniqueDetailsProps = {
  params: Promise<{ promptTechniqueName: string }>;
};

export default async function PromptTechniqueDetailsPage({
  params,
}: Readonly<PromptTechniqueDetailsProps>) {
  const { promptTechniqueName } = await params;
  const promptTechniqueNameDecoded = decodeURIComponent(promptTechniqueName);
  const promptTechnique = await getPromptTechniqueByName(promptTechniqueNameDecoded);

  if (!promptTechnique) {
    notFound();
  }

  const username = await getSession();
  const currentUser = username ? await getUserByUsername(username) : null;
  const canEditPromptTechnique = currentUser?.role === "ADMIN";

  const relatedPractices = promptTechnique.practices.map((entry) => entry.practice);
  const relatedReferences = promptTechnique.references.map((entry) => entry.reference);

  return (
    <main className="details-page">
      <div className="practice-details-shell">
        <header className="practice-details-header">
          <div>
            <h1>{promptTechnique.name}</h1>
            {promptTechnique.description && (
              <p>{promptTechnique.description}</p>
            )}
          </div>
          {canEditPromptTechnique ? (
            <Link href={`/admin/prompt-techniques/edit/${encodeURIComponent(promptTechnique.name)}`} className="green-btn">
              Edit prompt technique
            </Link>
          ) : null}
        </header>

        {promptTechnique.example && (
          <section className="practice-section">
            <h2>Example:</h2>
            <p>{promptTechnique.example}</p>
          </section>
        )}

        <section className="facts-grid" aria-label="Prompt technique metadata">
          <article>
            <h2>Related practices</h2>
            <ul>
              {relatedPractices.length > 0 ? (
                relatedPractices.map((practice, index) => (
                  <li key={`practice-${promptTechnique.name}-${index}`}>
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
                  <li key={`reference-${promptTechnique.name}-${index}`}>
                    <Link href={catalogReferenceHref(reference.title)} className="reference-link">
                      {reference.title}{reference.year && ` (${reference.year})`}
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
