import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getModelByName } from "@/domain/model-repository";
import styles from "../../../admin.module.css";
import { ModelForm } from "../../model-form";
import type { DataFormatType } from "@prisma/client";

type EditModelPageProps = {
  params: Promise<{ modelName: string }>;
};

export default async function EditModelPage({ params }: Readonly<EditModelPageProps>) {
  const { modelName } = await params;
  const decodedName = decodeURIComponent(modelName);
  const model = await getModelByName(decodedName);

  if (!model) {
    notFound();
  }

  return (
    <section className={styles.pageSection}>
      <header className={styles.sectionHeader}>
        <div>
          <p className={styles.kicker}>Models</p>
          <h2 className={styles.sectionTitle}>Modify model</h2>
          <p className={styles.sectionCopy}>
            Update the model details and supported data formats.
          </p>
        </div>
        <Link href="/admin/models" className={`ghost-btn ${styles.headerAction}`}>
          <ArrowLeft className={styles.arrowLeft} aria-hidden size={18} />
          Back to models
        </Link>
      </header>

      <ModelForm
        mode="edit"
        method="PATCH"
        submitUrl={`/api/admin/models/${encodeURIComponent(model.name)}`}
        redirectPath="/admin/models"
        initialValues={{
          name: model.name,
          description: model.description,
          parameters: model.parameters,
          size: model.size,
          dataFormatType: model.dataFormatType as DataFormatType[],
        }}
      />
    </section>
  );
}
