import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styles from "../../admin.module.css";
import { PromptTechniqueForm } from "../prompt-technique-form";

export default function NewPromptTechniquePage() {
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
      />
    </section>
  );
}
