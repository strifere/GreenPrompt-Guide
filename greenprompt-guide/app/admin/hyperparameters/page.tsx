import Link from "next/link";
import styles from "../admin.module.css";
import { prisma } from "@/lib/prisma";
import { catalogHyperparameterHref } from "@/app/catalog/catalog-paths";
import { AdminDeleteAction } from "../admin-delete-action";

export default async function AdminHyperparametersPage() {
  const hyperparameters = await prisma.hyperparameter.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <section className={styles.pageSection}>
      <header className={styles.sectionHeader}>
        <div>
          <p className={styles.kicker}>Hyperparameters</p>
          <h2 className={styles.sectionTitle}>All hyperparameters</h2>
          <p className={styles.sectionCopy}>
            Manage the different hyperparameters that have been extracted from the papers in the catalog.
          </p>
        </div>
        <Link href="/admin/hyperparameters/new" className={`solid-btn ${styles.headerAction}`}>
          Add hyperparameter
        </Link>
      </header>

      {hyperparameters.length === 0 ? (
        <div className="empty-state">
          <h2>No hyperparameters yet</h2>
          <p>Once hyperparameters are added, they will appear here for review.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {hyperparameters.map((hyperparameter) => (
            <article key={hyperparameter.id} className={styles.rowCard}>
              <Link href={catalogHyperparameterHref(hyperparameter.id)} className={styles.rowMain}>
                <div className={styles.titleBar}>
                  <h3 className={styles.cardTitle}>{hyperparameter.name}</h3>
                </div>
                <div className={styles.meta} aria-label="Hyperparameter stats">
                  <span>Extracted from: {hyperparameter.referenceTitle} </span>
                  <span>Used in: {hyperparameter.practiceName} </span>
                </div>
              </Link>

              <div className={styles.rowActions}>
                <Link
                  href={`/admin/hyperparameters/edit/${encodeURIComponent(String(hyperparameter.id))}`}
                  className={`ghost-btn ${styles.actionButton}`}
                >
                  Modify
                </Link>
                <AdminDeleteAction type="hyperparameter" objectKey={hyperparameter.id} />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
