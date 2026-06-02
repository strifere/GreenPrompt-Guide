import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styles from "../../admin.module.css";
import { DatasetForm } from "../dataset-form";

export default function NewDatasetPage() {
  return (
    <section className={styles.pageSection}>
      <header className={styles.sectionHeader}>
        <div>
          <p className={styles.kicker}>Datasets</p>
          <h2 className={styles.sectionTitle}>Add dataset</h2>
          <p className={styles.sectionCopy}>
            Register a new evaluation or training dataset in the catalog.
          </p>
        </div>
        <Link href="/admin/datasets" className={`ghost-btn ${styles.headerAction}`}>
          <ArrowLeft className={styles.arrowLeft} aria-hidden size={18} />
          Back to datasets
        </Link>
      </header>

      <DatasetForm submitUrl="/api/admin/datasets" redirectPath="/admin/datasets" />
    </section>
  );
}
