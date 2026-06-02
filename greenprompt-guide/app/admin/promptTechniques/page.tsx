import Link from "next/link";
import styles from "../admin.module.css";
import { prisma } from "@/lib/prisma";
import { catalogPromptTechniqueHref } from "@/app/catalog/catalog-paths";
import { AdminPromptTechniqueDeleteAction } from "./admin-prompt-technique-delete-action";

export default async function AdminPromptTechniquesPage() {
  const promptTechniques = await prisma.promptTechnique.findMany({
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
          <p className={styles.kicker}>Prompt Techniques</p>
          <h2 className={styles.sectionTitle}>All prompt techniques</h2>
          <p className={styles.sectionCopy}>
            Manage the prompt techniques registered across studies and practices.
          </p>
        </div>
        <Link href="/admin/promptTechniques/new" className={`solid-btn ${styles.headerAction}`}>
          Add technique
        </Link>
      </header>

      {promptTechniques.length === 0 ? (
        <div className={styles.placeholder}>
          <h3 className={styles.placeholderTitle}>No prompt techniques yet</h3>
          <p>Once prompt techniques are added, they will appear here for review.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {promptTechniques.map((technique) => (
            <article key={technique.name} className={styles.rowCard}>
              <Link href={catalogPromptTechniqueHref(technique.name)} className={styles.rowMain}>
                <div className={styles.titleBar}>
                  <h3 className={styles.cardTitle}>{technique.name}</h3>
                </div>
                <p>{technique.description}</p>
                {technique.example ? (
                  <p className={styles.muted}><em>Example: {technique.example}</em></p>
                ) : null}
                <div className={styles.meta} aria-label="Prompt technique stats">
                  <span>{technique.practices.length} {technique.practices.length === 1 ? "practice" : "practices"}</span>
                  <span>{technique.references.length} {technique.references.length === 1 ? "reference" : "references"}</span>
                </div>
              </Link>

              <div className={styles.rowActions}>
                <Link
                  href={`/admin/promptTechniques/edit/${encodeURIComponent(technique.name)}`}
                  className={`ghost-btn ${styles.actionButton}`}
                >
                  Modify
                </Link>
                <AdminPromptTechniqueDeleteAction techniqueName={technique.name} />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
