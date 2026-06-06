import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styles from "../../admin.module.css";
import { ModelForm } from "../model-form";
import { listReferences } from "@/domain/reference-repository";

export default async function NewModelPage() {
  const references = await listReferences();

  return (
    <section className={styles.pageSection}>
      <header className={styles.sectionHeader}>
        <div>
          <p className={styles.kicker}>Models</p>
          <h2 className={styles.sectionTitle}>Add model</h2>
          <p className={styles.sectionCopy}>
            Register a new AI model in the catalog.
          </p>
        </div>
        <Link href="/admin/models" className={`ghost-btn ${styles.headerAction}`}>
          <ArrowLeft className={styles.arrowLeft} aria-hidden size={18} />
          Back to models
        </Link>
      </header>

      <ModelForm
        submitUrl="/api/admin/models"
        redirectPath="/admin/models"
        references={references.map((ref) => ({
          title: ref.title,
          year: ref.year,
          authors: ref.authors,
        }))}
      />
    </section>
  );
}
