import Link from "next/link";
import { notFound } from "next/navigation";
import { getReferenceByTitle } from "@/domain/reference-repository";
import {
  catalogDatasetHref,
  catalogHyperparameterHref,
  catalogModelHref,
  catalogPracticeHref,
  catalogPromptTechniqueHref,
} from "../../catalog-paths";
import { getUserByUsername } from "@/domain/user-repository";
import { getSession } from "@/lib/session";
import { TOOLTIPS } from "@/app/ui/tooltip/tooltip-content";
import { TipInfo } from "@/app/ui/tooltip/tip-info";

type ReferenceDetailsProps = {
  params: Promise<{ referenceTitle: string }>;
};

function formatReferenceCitation(reference: {
  authors: string;
  title: string;
  year: number;
  venue: string | null;
  link: string | null;
}) {
  const splitAuthors = (authors: string) => {
    const result: string[] = [];
    let current = "";

    for (let index = 0; index < authors.length; index += 1) {
      const character = authors[index];

      if (character === ";" || character === "&") {
        if (current.trim()) {
          result.push(current.trim());
        }

        current = "";
        continue;
      }

      if (
        authors.slice(index, index + 3).toLowerCase() === "and" &&
        (index === 0 || /\s/.test(authors[index - 1])) &&
        (index + 3 === authors.length || /\s/.test(authors[index + 3]))
      ) {
        if (current.trim()) {
          result.push(current.trim());
        }

        current = "";
        index += 2;
        continue;
      }

      current += character;
    }

    if (current.trim()) {
      result.push(current.trim());
    }

    return result;
  };

  const formatAuthorName = (author: string) => {
    const normalizedAuthor = author.trim().replace(/\s+/g, " ");

    if (!normalizedAuthor) {
      return null;
    }

    const nameParts = normalizedAuthor.split(/\s+/).filter(Boolean);

    if (nameParts.length < 2) {
      return normalizedAuthor;
    }

    if (normalizedAuthor.includes(",")) {
      const [lastNamePart, givenNamesPart] = normalizedAuthor
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);

      if (!lastNamePart || !givenNamesPart) {
        return normalizedAuthor;
      }

      const initials = givenNamesPart
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => `${part[0].toUpperCase()}.`)
        .join(" ");

      return `${initials} ${lastNamePart}`;
    }

    const lastName = nameParts.at(-1);
    const initials = nameParts.slice(0, -1).map((part) => `${part[0].toUpperCase()}.`).join(" ");

    return `${initials} ${lastName}`;
  };

  const authors = splitAuthors(reference.authors)
    .map((author) => formatAuthorName(author))
    .filter((author): author is string => Boolean(author));

  const formattedAuthors = authors.length > 0 ? authors.join(", ") : reference.authors.trim();
  const venue = reference.venue?.trim();
  const citationParts = [
    `[1] ${formattedAuthors},`,
    `"${reference.title},"`,
    venue ? `${venue},` : null,
    `${reference.year}.`,
  ].filter(Boolean);

  return citationParts.join(" ");
}

export default async function ReferenceDetailsPage({
  params,
}: Readonly<ReferenceDetailsProps>) {
  const { referenceTitle } = await params;
  const referenceTitleDecoded = decodeURIComponent(referenceTitle);
  const reference = await getReferenceByTitle(referenceTitleDecoded);

  const username = await getSession();
  const currentUser = username ? await getUserByUsername(username) : null;
  const canEditReference = currentUser?.role === "ADMIN";

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
          {canEditReference ? (
            <Link href={`/admin/references/edit/${encodeURIComponent(reference.title)}`} className="green-btn">
              Edit reference
            </Link>
          ) : null}
        </header>

        <section className="practice-section">
          <h2> Authors: </h2>
          <div className="tags" aria-label="Practice categories">
            <p>{reference.authors}</p>
          </div>
          <h2>Abstract:</h2>
          <p>{reference.abstract ? reference.abstract : "No abstract available yet."}</p>

          <h2>Task:</h2>
          <p>{reference.task ? reference.task : "No task available yet."}</p>

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
              <li>{reference.year}</li>
            </ul>
          </article>

          <article>
            <h2>Study Type</h2>
            <ul>
              <li>{reference.studyType}</li>
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
            <div className="info-header">
              <h2 style={{"paddingRight": "10px"}}>Prompt techniques</h2>
              <TipInfo content={TOOLTIPS.REFERENCE_PROMPT_TECHNIQUES}/>
            </div>
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
            <div className="info-header">
              <h2 style={{"paddingRight": "10px"}}>Models</h2>
              <TipInfo content={TOOLTIPS.REFERENCE_MODELS}/>
            </div>
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
            <div className="info-header">
              <h2 style={{"paddingRight": "10px"}}>Hyperparameters</h2>
              <TipInfo content={TOOLTIPS.REFERENCE_HYPERPARAMETERS}/>
            </div>
            <ul>
              {reference.hyperparameters.length > 0 ? (
                reference.hyperparameters.map((hyperparameter) => (
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
            <div className="info-header">
              <h2 style={{"paddingRight": "10px"}}>Datasets</h2>
              <TipInfo content={TOOLTIPS.REFERENCE_DATASETS}/>
            </div>
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
          <div className="info-header">
            <h2 style={{"paddingRight": "10px"}}>Citation</h2>
            <TipInfo content={TOOLTIPS.REFERENCE_CITATION}/>
          </div>
          <p>{formatReferenceCitation(reference)}</p>
          {reference.link ? (
            <p>
              <Link href={reference.link} className="reference-link" target="_blank" rel="noopener noreferrer">
                Full reference link
              </Link>
            </p>
          ) : (
            <p>No link available yet.</p>
          )}
        </section>
      </div>
    </main>
  );
}
