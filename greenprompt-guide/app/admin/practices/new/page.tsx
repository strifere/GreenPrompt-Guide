import Link from "next/link";
import styles from "../../admin.module.css";

export default function NewPracticePage() {
  return (
    <section className={styles.pageSection}>
      <header className={styles.sectionHeader}>
        <div>
          <p className={styles.kicker}>Practices</p>
          <h2 className={styles.sectionTitle}>Create practice</h2>
          <p className={styles.sectionCopy}>
            The practice creation flow is coming in a follow-up iteration.
          </p>
        </div>
        <Link href="/admin/practices" className={`ghost-btn ${styles.headerAction}`}>
          Back to practices
        </Link>
      </header>

      <div className={styles.placeholder}>
        <h3 className={styles.placeholderTitle}>Creation form pending</h3>
        <p>Approve a collaboration request to open the request-driven practice creation flow.</p>
        <p>
          <Link href="/admin/requests" className="animated-link">
            Review collaboration requests
          </Link>
        </p>
      </div>
    </section>
  );
}