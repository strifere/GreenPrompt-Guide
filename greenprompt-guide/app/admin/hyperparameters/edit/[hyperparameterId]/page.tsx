import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getHyperparameterById } from "@/domain/hyperparameter-repository";
import { listReferences } from "@/domain/reference-repository";
import { listPractices } from "@/domain/practice-repository"; // Assumed import based on pattern
import styles from "../../../admin.module.css";
import { HyperparameterForm } from "../../hyperparameter-form";

type EditHyperparameterPageProps = {
  params: Promise<{ hyperparameterId: string }>;
};

export default async function EditHyperparameterPage({ params }: Readonly<EditHyperparameterPageProps>) {
  const { hyperparameterId } = await params;
  const decodedId = decodeURIComponent(hyperparameterId);

  const [hyperparameter, allReferences, allPractices] = await Promise.all([
    getHyperparameterById(Number.parseInt(decodedId)),
    listReferences(),
    listPractices(),
  ]);

  if (!hyperparameter) {
    notFound();
  }

  return (
    <section className={styles.pageSection}>
      <header className={styles.sectionHeader}>
        <div>
          <p className={styles.kicker}>Hyperparameters</p>
          <h2 className={styles.sectionTitle}>Modify hyperparameter</h2>
          <p className={styles.sectionCopy}>
            Update the hyperparameter details, value bindings, and linked practice/reference.
          </p>
        </div>
        <Link href="/admin/hyperparameters" className={`ghost-btn ${styles.headerAction}`}>
          <ArrowLeft className={styles.arrowLeft} aria-hidden size={18} />
          Back to hyperparameters
        </Link>
      </header>

      <HyperparameterForm
        method="PATCH"
        submitUrl={`/api/admin/hyperparameters/${encodeURIComponent(hyperparameter.id.toString())}`}
        redirectPath="/admin/hyperparameters"
        references={allReferences.map((ref) => ({
          title: ref.title,
          year: ref.year,
          authors: ref.authors,
        }))}
        practices={allPractices.map((practice) => ({
          name: practice.name,
        }))}
        initialValues={{
          id: hyperparameter.id,
          name: hyperparameter.name,
          value: hyperparameter.value,
          dataType: hyperparameter.dataType,
          referenceTitle: hyperparameter.referenceTitle,
          practiceName: hyperparameter.practiceName,
        }}
      />
    </section>
  );
}