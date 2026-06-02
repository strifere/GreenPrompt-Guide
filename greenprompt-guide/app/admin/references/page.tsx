import Link from "next/link";
import styles from "../admin.module.css";
import { listReferences } from "@/domain/reference-repository";
import { catalogReferenceHref } from "@/app/catalog/catalog-paths";
import { AdminReferenceDeleteAction } from "./admin-reference-delete-action";

export default async function AdminReferencesPage() {
  const references = await listReferences();

  return (
    <section className={styles.pageSection}>
      <header className={styles.sectionHeader}>
        <div>
          <p className={styles.kicker}>References</p>
          <h2 className={styles.sectionTitle}>All references</h2>
          <p className={styles.sectionCopy}>
            Review the references currently registered in the system.
          </p>
        </div>
        <Link href="/admin/references/new" className={`solid-btn ${styles.headerAction}`}>
          Add reference
        </Link>
      </header>

      {references.length === 0 ? (
        <div className={styles.placeholder}>
          <h3 className={styles.placeholderTitle}>No references yet</h3>
          <p>Once references are imported, they will appear here for review.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {references.map((reference) => (
            <article key={reference.title} className={styles.rowCard}>
              <Link href={catalogReferenceHref(reference.title)} className={styles.rowMain}>
                <div className={styles.titleBar}>
                  <h3 className={styles.cardTitle}>{reference.title}</h3>
                  <span className={styles.badge}>{reference.year}</span>
                </div>
                <p>{reference.abstract ?? "No abstract available."}</p>
                <div className={styles.meta} aria-label="Reference stats">
                  <span>{reference.authors}</span>
                  <span>{reference.practices.length} {reference.practices.length === 1 ? "extracted practice" : "extracted practices"}</span>
                  <span>{reference.models.length} {reference.models.length === 1 ? "model" : "models"}</span>
                  <span>{reference.promptTechniques.length} {reference.promptTechniques.length === 1 ? "prompt technique" : "prompt techniques"}</span>
                  <span>{reference.datasets.length} {reference.datasets.length === 1 ? "dataset" : "datasets"}</span>
                </div>
              </Link>

              <div className={styles.rowActions}>
                <Link href={`/admin/references/edit/${encodeURIComponent(reference.title)}`} className={`ghost-btn ${styles.actionButton}`}>
                  Modify
                </Link>
                <AdminReferenceDeleteAction referenceTitle={reference.title} />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
