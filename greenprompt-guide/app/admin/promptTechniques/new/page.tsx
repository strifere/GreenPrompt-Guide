import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styles from "../../admin.module.css";
import { PromptTechniqueForm } from "../prompt-technique-form";
import { listReferences } from "@/domain/reference-repository";

export default async function NewPromptTechniquePage() {
  const references = await listReferences();

  return (
    <section className={styles.pageSection}>
      <header className={styles.sectionHeader}>
        <div>
          <p className={styles.kicker}>Prompt Techniques</p>
          <h2 className={styles.sectionTitle}>Add prompt technique</h2>
          <p className={styles.sectionCopy}>
            Register a new prompt technique in the catalog.
          </p>
        </div>
        <Link href="/admin/promptTechniques" className={`ghost-btn ${styles.headerAction}`}>
          <ArrowLeft className={styles.arrowLeft} aria-hidden size={18} />
          Back to prompt techniques
        </Link>
      </header>

      <PromptTechniqueForm
        submitUrl="/api/admin/promptTechniques"
        redirectPath="/admin/promptTechniques"
        references={references.map((ref) => ({
          title: ref.title,
          year: ref.year,
          authors: ref.authors,
        }))}
      />
    </section>
  );
}
