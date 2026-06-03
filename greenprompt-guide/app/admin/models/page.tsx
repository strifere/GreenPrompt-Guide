import Link from "next/link";
import styles from "../admin.module.css";
import { prisma } from "@/lib/prisma";
import { catalogModelHref } from "@/app/catalog/catalog-paths";
import { AdminDeleteAction } from "../admin-delete-action";

export default async function AdminModelsPage() {
  const models = await prisma.model.findMany({
    orderBy: { name: "asc" },
    include: {
      practices: true,
      references: true,
    },
  });

  return (
    <section className={styles.pageSection}>
      <header className={styles.sectionHeader}>
        <div>
          <p className={styles.kicker}>Models</p>
          <h2 className={styles.sectionTitle}>All models</h2>
          <p className={styles.sectionCopy}>
            Manage the AI models registered across studies and practices.
          </p>
        </div>
        <Link href="/admin/models/new" className={`solid-btn ${styles.headerAction}`}>
          Add model
        </Link>
      </header>

      {models.length === 0 ? (
        <div className={styles.placeholder}>
          <h3 className={styles.placeholderTitle}>No models yet</h3>
          <p>Once models are added, they will appear here for review.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {models.map((model) => (
            <article key={model.name} className={styles.rowCard}>
              <Link href={catalogModelHref(model.name)} className={styles.rowMain}>
                <div className={styles.titleBar}>
                  <h3 className={styles.cardTitle}>{model.name}</h3>
                  {model.parameters ? (
                    <span className={styles.badge}>{model.parameters}</span>
                  ) : null}
                </div>
                {model.description ? <p>{model.description}</p> : null}
                <div className={styles.meta} aria-label="Model stats">
                  {model.size ? <span>Size: {model.size}</span> : null}
                  {model.dataFormatType.length > 0 ? (
                    <span>{model.dataFormatType.join(", ")}</span>
                  ) : null}
                  <span>{model.practices.length} {model.practices.length === 1 ? "practice" : "practices"}</span>
                  <span>{model.references.length} {model.references.length === 1 ? "reference" : "references"}</span>
                </div>
              </Link>

              <div className={styles.rowActions}>
                <Link
                  href={`/admin/models/edit/${encodeURIComponent(model.name)}`}
                  className={`ghost-btn ${styles.actionButton}`}
                >
                  Modify
                </Link>
                <AdminDeleteAction type="model" objectKey={model.name} />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
