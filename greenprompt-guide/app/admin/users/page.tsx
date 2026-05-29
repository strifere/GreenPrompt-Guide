import { listUsers } from "@/domain/user-repository";
import styles from "../admin.module.css";

function roleLabel(role: string | null) {
  if (role === "ADMIN") {
    return "Admin user";
  }

  return "Standard user";
}

export default async function AdminUsersPage() {
  const users = await listUsers();

  return (
    <section className={styles.pageSection}>
      <header className={styles.sectionHeader}>
        <div>
          <p className={styles.kicker}>Users</p>
          <h2 className={styles.sectionTitle}>All users</h2>
          <p className={styles.sectionCopy}>
            Review user roles and moderate standard accounts.
          </p>
        </div>
      </header>

      {users.length === 0 ? (
        <div className={styles.placeholder}>
          <h3 className={styles.placeholderTitle}>No users found</h3>
          <p>Registered accounts will appear here.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {users.map((user) => {
            const isAdmin = user.role === "ADMIN";

            return (
              <article key={user.username} className={styles.rowCard}>
                <div className={styles.rowMain}>
                  <div className={styles.titleBar}>
                    <h3 className={styles.cardTitle}>{user.username}</h3>
                    <span className={styles.badge}>{roleLabel(user.role)}</span>
                  </div>
                  <p>{user.email}</p>
                  <div className={styles.meta} aria-label="User metadata">
                    <span>Created {new Date(user.createdAt).toLocaleDateString()}</span>
                    <span>Updated {new Date(user.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {isAdmin ? (
                  <div className={styles.rowActions}>
                    <span className={`${styles.badge} ${styles.badgeMuted}`}>Protected admin account</span>
                  </div>
                ) : (
                  <div className={styles.rowActions}>
                    <button type="button" className={`ghost-btn ${styles.actionButton}`}>
                      Ban
                    </button>
                    <button type="button" className={`ghost-btn ${styles.actionButton} ${styles.dangerAction}`}>
                      Delete
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}