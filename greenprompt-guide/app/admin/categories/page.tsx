import Link from "next/link";
import styles from "../admin.module.css";
import { prisma } from "@/lib/prisma";
import { AdminDeleteAction } from "../admin-delete-action";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { practices: true },
      },
    },
  });

  return (
    <section className={styles.pageSection}>
      <header className={styles.sectionHeader}>
        <div>
          <p className={styles.kicker}>Categories</p>
          <h2 className={styles.sectionTitle}>All categories</h2>
          <p className={styles.sectionCopy}>
            Manage the categories that group practices in the catalog. Each category has a tactic
            that indicates whether it promotes green or highlights red behaviours.
          </p>
        </div>
        <Link href="/admin/categories/new" className={`solid-btn ${styles.headerAction}`}>
          Add category
        </Link>
      </header>

      {categories.length === 0 ? (
        <div className="empty-state">
          <h2>No categories yet</h2>
          <p>Once categories are added, they will appear here for review.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {categories.map((category) => (
            <article key={category.name} className={styles.rowCard}>
              <div className={styles.rowMain}>
                <div className={styles.titleBar}>
                  <h3 className={styles.cardTitle}>{category.name}</h3>
                  <span
                    className={`${styles.badge} ${category.tactic === "GREEN_PRACTICE" ? "" : styles.badgeMuted}`}
                  >
                    {category.tactic === "GREEN_PRACTICE" ? "Green" : "Red"}
                  </span>
                </div>
                <div className={styles.meta} aria-label="Category stats">
                  {category.description ? (
                    <span>{category.description}</span>
                  ) : (
                    <span className={styles.muted}>No description</span>
                  )}
                  <span>{category._count.practices} practice{category._count.practices === 1 ? "" : "s"}</span>
                </div>
              </div>

              <div className={styles.rowActions}>
                <Link
                  href={`/admin/categories/edit/${encodeURIComponent(category.name)}`}
                  className={`ghost-btn ${styles.actionButton}`}
                >
                  Modify
                </Link>
                <AdminDeleteAction type="category" objectKey={category.name} />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
