import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPromptTechniqueByName } from "@/domain/prompt-technique-repository";
import { listReferences } from "@/domain/reference-repository";
import styles from "../../../admin.module.css";
import { PromptTechniqueForm } from "../../prompt-technique-form";

type EditPromptTechniquePageProps = {
  params: Promise<{ promptTechniqueName: string }>;
};

export default async function EditPromptTechniquePage({
  params,
}: Readonly<EditPromptTechniquePageProps>) {
  const { promptTechniqueName } = await params;
  const decodedName = decodeURIComponent(promptTechniqueName);

  const [technique, allReferences] = await Promise.all([
    getPromptTechniqueByName(decodedName),
    listReferences(),
  ]);

  if (!technique) {
    notFound();
  }

  const selectedReferenceTitles = technique.references.map(
    (entry) => entry.reference.title,
  );

  return (
    <section className={styles.pageSection}>
      <header className={styles.sectionHeader}>
        <div>
          <p className={styles.kicker}>Prompt Techniques</p>
          <h2 className={styles.sectionTitle}>Modify prompt technique</h2>
          <p className={styles.sectionCopy}>
            Update the description, example, and linked references for this prompt technique.
          </p>
        </div>
        <Link href="/admin/promptTechniques" className={`ghost-btn ${styles.headerAction}`}>
          <ArrowLeft className={styles.arrowLeft} aria-hidden size={18} />
          Back to prompt techniques
        </Link>
      </header>

      <PromptTechniqueForm
        mode="edit"
        method="PATCH"
        submitUrl={`/api/admin/promptTechniques/${encodeURIComponent(technique.name)}`}
        redirectPath="/admin/promptTechniques"
        references={allReferences.map((ref) => ({
          title: ref.title,
          year: ref.year,
          authors: ref.authors,
        }))}
        initialValues={{
          name: technique.name,
          description: technique.description,
          example: technique.example,
          selectedReferenceTitles,
        }}
      />
    </section>
  );
}
