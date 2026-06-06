import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styles from "../../admin.module.css";
import { HyperparameterForm } from "../hyperparameter-form";
import { listReferences } from "@/domain/reference-repository";
import { listPractices } from "@/domain/practice-repository"; // Assumed import based on pattern

export default async function NewHyperparameterPage() {
  const [references, practices] = await Promise.all([
    listReferences(),
    listPractices(),
  ]);

  return (
    <section className={styles.pageSection}>
      <header className={styles.sectionHeader}>
        <div>
          <p className={styles.kicker}>Hyperparameters</p>
          <h2 className={styles.sectionTitle}>Add hyperparameter</h2>
          <p className={styles.sectionCopy}>
            Register a new hyperparameter in the catalog.
          </p>
        </div>
        <Link href="/admin/hyperparameters" className={`ghost-btn ${styles.headerAction}`}>
          <ArrowLeft className={styles.arrowLeft} aria-hidden size={18} />
          Back to hyperparameters
        </Link>
      </header>

      <HyperparameterForm
        submitUrl="/api/admin/hyperparameters"
        redirectPath="/admin/hyperparameters"
        references={references.map((ref) => ({
          title: ref.title,
          year: ref.year,
          authors: ref.authors,
        }))}
        practices={practices.map((practice) => ({
          name: practice.name,
        }))}
      />
    </section>
  );
}