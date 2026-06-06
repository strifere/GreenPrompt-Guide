import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styles from "../../admin.module.css";
import { DatasetForm } from "../dataset-form";
import { listReferences } from "@/domain/reference-repository";

export default async function NewDatasetPage() {
  const references = await listReferences();

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

      <DatasetForm
        submitUrl="/api/admin/datasets"
        redirectPath="/admin/datasets"
        references={references.map((ref) => ({
          title: ref.title,
          year: ref.year,
          authors: ref.authors,
        }))}
      />
    </section>
  );
}
