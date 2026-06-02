import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styles from "../../admin.module.css";
import { ReferenceForm } from "../reference-form";

export default function NewReferencePage() {
  return (
    <section className={styles.pageSection}>
      <header className={styles.sectionHeader}>
        <div>
          <p className={styles.kicker}>References</p>
          <h2 className={styles.sectionTitle}>Add reference</h2>
          <p className={styles.sectionCopy}>
            Register a new paper or study in the catalog.
          </p>
        </div>
        <Link href="/admin/references" className={`ghost-btn ${styles.headerAction}`}>
          <ArrowLeft className={styles.arrowLeft} aria-hidden size={18} />
          Back to references
        </Link>
      </header>

      <ReferenceForm
        submitUrl="/api/admin/references"
        redirectPath="/admin/references"
      />
    </section>
  );
}
