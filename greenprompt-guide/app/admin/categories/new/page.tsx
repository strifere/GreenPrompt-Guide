import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styles from "../../admin.module.css";
import { CategoryForm } from "../category-form";

export default async function NewCategoryPage() {
  return (
    <section className={styles.pageSection}>
      <header className={styles.sectionHeader}>
        <div>
          <p className={styles.kicker}>Categories</p>
          <h2 className={styles.sectionTitle}>Add category</h2>
          <p className={styles.sectionCopy}>
            Register a new category in the catalog.
          </p>
        </div>
        <Link href="/admin/categories" className={`ghost-btn ${styles.headerAction}`}>
          <ArrowLeft className={styles.arrowLeft} aria-hidden size={18} />
          Back to categories
        </Link>
      </header>

      <CategoryForm
        submitUrl="/api/admin/categories"
        redirectPath="/admin/categories"
      />
    </section>
  );
}
