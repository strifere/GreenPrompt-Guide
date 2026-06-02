import Link from "next/link";
import styles from "../admin.module.css";
import { prisma } from "@/lib/prisma";
import { catalogDatasetHref } from "@/app/catalog/catalog-paths";
import { AdminDatasetDeleteAction } from "./admin-dataset-delete-action";

export default async function AdminDatasetsPage() {
  const datasets = await prisma.dataset.findMany({
    orderBy: { name: "asc" },
    include: {
      papers: true,
    },
  });

  return (
    <section className={styles.pageSection}>
      <header className={styles.sectionHeader}>
        <div>
          <p className={styles.kicker}>Datasets</p>
          <h2 className={styles.sectionTitle}>All datasets</h2>
          <p className={styles.sectionCopy}>
            Manage the evaluation and training datasets used across the catalog.
          </p>
        </div>
        <Link href="/admin/datasets/new" className={`solid-btn ${styles.headerAction}`}>
          Add dataset
        </Link>
      </header>

      {datasets.length === 0 ? (
        <div className={styles.placeholder}>
          <h3 className={styles.placeholderTitle}>No datasets yet</h3>
          <p>Once datasets are added, they will appear here for review.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {datasets.map((dataset) => (
            <article key={dataset.name} className={styles.rowCard}>
              <Link href={catalogDatasetHref(dataset.name)} className={styles.rowMain}>
                <div className={styles.titleBar}>
                  <h3 className={styles.cardTitle}>{dataset.name}</h3>
                  {dataset.size ? (
                    <span className={styles.badge}>{dataset.size}</span>
                  ) : null}
                </div>
                {dataset.description ? <p>{dataset.description}</p> : null}
                <div className={styles.meta} aria-label="Dataset stats">
                  {dataset.dataFormatType.length > 0 ? (
                    <span>{dataset.dataFormatType.join(", ")}</span>
                  ) : null}
                  <span>{dataset.papers.length} {dataset.papers.length === 1 ? "reference" : "references"}</span>
                </div>
              </Link>

              <div className={styles.rowActions}>
                <Link
                  href={`/admin/datasets/edit/${encodeURIComponent(dataset.name)}`}
                  className={`ghost-btn ${styles.actionButton}`}
                >
                  Modify
                </Link>
                <AdminDatasetDeleteAction datasetName={dataset.name} />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
