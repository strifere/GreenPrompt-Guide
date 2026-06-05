import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getModelByName } from "@/domain/model-repository";
import { listReferences } from "@/domain/reference-repository";
import styles from "../../../admin.module.css";
import { ModelForm } from "../../model-form";

type EditModelPageProps = {
  params: Promise<{ modelName: string }>;
};

export default async function EditModelPage({ params }: Readonly<EditModelPageProps>) {
  const { modelName } = await params;
  const decodedName = decodeURIComponent(modelName);

  const [model, allReferences] = await Promise.all([
    getModelByName(decodedName),
    listReferences(),
  ]);

  if (!model) {
    notFound();
  }

  const selectedReferenceTitles = model.references.map((entry) => entry.reference.title);

  return (
    <section className={styles.pageSection}>
      <header className={styles.sectionHeader}>
        <div>
          <p className={styles.kicker}>Models</p>
          <h2 className={styles.sectionTitle}>Modify model</h2>
          <p className={styles.sectionCopy}>
            Update the model details, supported data formats, and linked references.
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
        references={allReferences.map((ref) => ({
          title: ref.title,
          year: ref.year,
          authors: ref.authors,
        }))}
        initialValues={{
          name: model.name,
          description: model.description,
          parameters: model.parameters,
          size: model.size,
          dataFormatType: model.dataFormatType,
          selectedReferenceTitles,
        }}
      />
    </section>
  );
}
