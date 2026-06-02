import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styles from "../../admin.module.css";
import { ModelForm } from "../model-form";

export default function NewModelPage() {
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

      <ModelForm submitUrl="/api/admin/models" redirectPath="/admin/models" />
    </section>
  );
}
