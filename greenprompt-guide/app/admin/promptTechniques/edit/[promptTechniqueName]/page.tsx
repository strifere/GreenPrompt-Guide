import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPromptTechniqueByName } from "@/domain/prompt-technique-repository";
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
  const technique = await getPromptTechniqueByName(decodedName);

  if (!technique) {
    notFound();
  }

  return (
    <section className={styles.pageSection}>
      <header className={styles.sectionHeader}>
        <div>
          <p className={styles.kicker}>Prompt Techniques</p>
          <h2 className={styles.sectionTitle}>Modify prompt technique</h2>
          <p className={styles.sectionCopy}>
            Update the description and example for this prompt technique.
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
        initialValues={{
          name: technique.name,
          description: technique.description,
          example: technique.example,
        }}
      />
    </section>
  );
}
