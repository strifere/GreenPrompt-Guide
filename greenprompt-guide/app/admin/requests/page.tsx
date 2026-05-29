import styles from "../admin.module.css";

export default function AdminRequestsPage() {
  return (
    <section className={styles.pageSection}>
      <header className={styles.sectionHeader}>
        <div>
          <p className={styles.kicker}>Requests</p>
          <h2 className={styles.sectionTitle}>Collaboration requests</h2>
          <p className={styles.sectionCopy}>
            This area is reserved for the collaboration branch.
          </p>
        </div>
      </header>

      <div className={styles.placeholder}>
        <h3 className={styles.placeholderTitle}>Placeholder</h3>
        <p>Request management will be added once the collaboration flow is merged.</p>
      </div>
    </section>
  );
}