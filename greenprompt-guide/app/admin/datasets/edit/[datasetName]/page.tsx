import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getDatasetByName } from "@/domain/dataset-repository";
import { listReferences } from "@/domain/reference-repository";
import styles from "../../../admin.module.css";
import { DatasetForm } from "../../dataset-form";

type EditDatasetPageProps = {
  params: Promise<{ datasetName: string }>;
};

export default async function EditDatasetPage({ params }: Readonly<EditDatasetPageProps>) {
  const { datasetName } = await params;
  const decodedName = decodeURIComponent(datasetName);

  const [dataset, allReferences] = await Promise.all([
    getDatasetByName(decodedName),
    listReferences(),
  ]);

  if (!dataset) {
    notFound();
  }

  // Deduplicate reference titles from the papers join (a reference may appear via
  // multiple paper entries if multiple practices share the same reference).
  const selectedReferenceTitles = Array.from(
    new Set(dataset.papers.map((entry) => entry.reference.title)),
  );

  return (
    <section className={styles.pageSection}>
      <header className={styles.sectionHeader}>
        <div>
          <p className={styles.kicker}>Datasets</p>
          <h2 className={styles.sectionTitle}>Modify dataset</h2>
          <p className={styles.sectionCopy}>
            Update the dataset details, supported data formats, and linked references.
          </p>
        </div>
        <Link href="/admin/datasets" className={`ghost-btn ${styles.headerAction}`}>
          <ArrowLeft className={styles.arrowLeft} aria-hidden size={18} />
          Back to datasets
        </Link>
      </header>

      <DatasetForm
        mode="edit"
        method="PATCH"
        submitUrl={`/api/admin/datasets/${encodeURIComponent(dataset.name)}`}
        redirectPath="/admin/datasets"
        references={allReferences.map((ref) => ({
          title: ref.title,
          year: ref.year,
          authors: ref.authors,
        }))}
        initialValues={{
          name: dataset.name,
          description: dataset.description,
          size: dataset.size,
          dataFormatType: dataset.dataFormatType,
          selectedReferenceTitles,
        }}
      />
    </section>
  );
}
