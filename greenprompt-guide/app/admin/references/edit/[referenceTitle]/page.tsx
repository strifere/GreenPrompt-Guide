import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getReferenceByTitle } from "@/domain/reference-repository";
import styles from "../../../admin.module.css";
import { ReferenceForm } from "../../reference-form";

type EditReferencePageProps = {
  params: Promise<{ referenceTitle: string }>;
};

export default async function EditReferencePage({ params }: Readonly<EditReferencePageProps>) {
  const { referenceTitle } = await params;
  const decodedTitle = decodeURIComponent(referenceTitle);
  const reference = await getReferenceByTitle(decodedTitle);

  if (!reference) {
    notFound();
  }

  return (
    <section className={styles.pageSection}>
      <header className={styles.sectionHeader}>
        <div>
          <p className={styles.kicker}>References</p>
          <h2 className={styles.sectionTitle}>Modify reference</h2>
          <p className={styles.sectionCopy}>
            Update the reference metadata and its related information.
          </p>
        </div>
        <Link href="/admin/references" className={`ghost-btn ${styles.headerAction}`}>
          <ArrowLeft className={styles.arrowLeft} aria-hidden size={18} />
          Back to references
        </Link>
      </header>

      <ReferenceForm
        mode="edit"
        method="PATCH"
        submitUrl={`/api/admin/references/${encodeURIComponent(reference.title)}`}
        redirectPath="/admin/references"
        initialValues={{
          title: reference.title,
          authors: reference.authors,
          abstract: reference.abstract ?? "",
          keywords: reference.keywords ?? "",
          year: reference.year,
          studyType: reference.studyType,
          domain: reference.domain,
          task: reference.task,
          venue: reference.venue,
          toolAvailability: reference.toolAvailability,
          link: reference.link,
        }}
      />
    </section>
  );
}
