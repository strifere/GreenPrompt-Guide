import Link from "next/link";
import { listPractices } from "@/domain/practice-repository";
import styles from "../admin.module.css";
import { AdminPracticeDeleteAction } from "../admin-practice-delete-action";

export default async function AdminPracticesPage() {
  const practices = await listPractices();

  return (
    <section className={styles.pageSection}>
      <header className={styles.sectionHeader}>
        <div>
          <p className={styles.kicker}>Practices</p>
          <h2 className={styles.sectionTitle}>All practices</h2>
          <p className={styles.sectionCopy}>
            Review the practices currently registered in the system.
          </p>
        </div>
        <Link href="/admin/practices/new" className={`solid-btn ${styles.headerAction}`}>
          Add practice
        </Link>
      </header>

      {practices.length === 0 ? (
        <div className={styles.placeholder}>
          <h3 className={styles.placeholderTitle}>No practices yet</h3>
          <p>Once practices are imported, they will appear here for review.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {practices.map((practice) => (
            <article key={practice.name} className={styles.rowCard}>
              <div className={styles.rowMain}>
                <div className={styles.titleBar}>
                  <h3 className={styles.cardTitle}>{practice.name}</h3>
                  <span className={styles.badge}>{practice.tactic}</span>
                </div>
                <p>{practice.description}</p>
                <div className={styles.meta} aria-label="Practice stats">
                  <span>{practice.greenScore} green score</span>
                  <span>{practice.categories.length} categories</span>
                  <span>{practice.models.length} models</span>
                  <span>{practice.prompts.length} prompt techniques</span>
                  <span>{practice.papers.length} references</span>
                </div>
              </div>

              <div className={styles.rowActions}>
                <button type="button" className={`ghost-btn ${styles.actionButton}`}>
                  Modify
                </button>
                <AdminPracticeDeleteAction practiceName={practice.name} />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}