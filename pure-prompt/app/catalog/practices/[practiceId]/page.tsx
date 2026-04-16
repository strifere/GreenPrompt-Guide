import Link from "next/link";
import { notFound } from "next/navigation";
import { getPracticeById } from "@/domain/practice-repository";

type PracticeDetailsProps = {
  params: Promise<{ practiceId: string }>;
};

export default async function PracticeDetailsPage({
  params,
}: Readonly<PracticeDetailsProps>) {
  const { practiceId } = await params;
  const practice = await getPracticeById(Number(practiceId));

  if (!practice) {
    notFound();
  }

  const relatedDatasets = practice.papers.flatMap((paper) =>
    paper.reference.datasets.map((entry) => entry.dataset),
  );

  return (
    <main
      style={{
        padding: "40px 24px",
        maxWidth: "900px",
        margin: "0 auto",
      }}
    >
      <Link href="/catalog" style={{ textDecoration: "underline" }}>
        Back to practices
      </Link>

      <h1 style={{ marginTop: "20px", fontSize: "2rem" }}>{practice.name}</h1>
      <p style={{ maxWidth: "70ch", lineHeight: 1.6 }}>{practice.description}</p>

      <section style={{ marginTop: "24px" }}>
        <h2>Core data</h2>
        <p>Created at: {practice.createdAt.toISOString()}</p>
        <p>Updated at: {practice.updatedAt.toISOString()}</p>
        <p>Verified at: {practice.verifiedAt?.toISOString() ?? "Not verified"}</p>
      </section>

      <section style={{ marginTop: "24px" }}>
        <h2>Categories</h2>
        <ul>
          {practice.categories.map((entry, index) => (
            <li key={`category-${practice.id}-${index}`}>{entry.category.name}</li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: "24px" }}>
        <h2>Models</h2>
        <ul>
          {practice.models.map((entry, index) => (
            <li key={`model-${practice.id}-${index}`}>{entry.model.name}</li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: "24px" }}>
        <h2>Prompt techniques</h2>
        <ul>
          {practice.prompts.map((entry, index) => (
            <li key={`technique-${practice.id}-${index}`}>{entry.promptTechnique.name}</li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: "24px" }}>
        <h2>References</h2>
        <ul>
          {practice.papers.map((entry) => (
            <li key={entry.referenceId}>
              {entry.reference.title} ({entry.reference.year})
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: "24px" }}>
        <h2>Datasets (from references)</h2>
        <ul>
          {relatedDatasets.map((dataset) => (
            <li key={dataset.id}>{dataset.name}</li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: "24px" }}>
        <h2>Examples</h2>
        <ul>
          {practice.practiceExamples.map((example) => (
            <li key={example.id}>{example.scenario}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
