import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getDatasetByName } from "@/domain/dataset-repository";
import styles from "../../../admin.module.css";
import { DatasetForm } from "../../dataset-form";
import type { DataFormatType } from "@prisma/client";

type EditDatasetPageProps = {
  params: Promise<{ datasetName: string }>;
};

export default async function EditDatasetPage({ params }: Readonly<EditDatasetPageProps>) {
  const { datasetName } = await params;
  const decodedName = decodeURIComponent(datasetName);
  const dataset = await getDatasetByName(decodedName);

  if (!dataset) {
    notFound();
  }

  return (
    <section className={styles.pageSection}>
      <header className={styles.sectionHeader}>
        <div>
          <p className={styles.kicker}>Datasets</p>
          <h2 className={styles.sectionTitle}>Modify dataset</h2>
          <p className={styles.sectionCopy}>
            Update the dataset details and supported data formats.
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
        initialValues={{
          name: dataset.name,
          description: dataset.description,
          size: dataset.size,
          dataFormatType: dataset.dataFormatType as DataFormatType[],
        }}
      />
    </section>
  );
}
