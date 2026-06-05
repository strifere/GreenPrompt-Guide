import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import styles from "../../../admin.module.css";
import { CategoryForm } from "../../category-form";

type EditCategoryPageProps = {
  params: Promise<{ categoryName: string }>;
};

export default async function EditCategoryPage({ params }: Readonly<EditCategoryPageProps>) {
  const { categoryName } = await params;
  const decodedName = decodeURIComponent(categoryName);

  const category = await prisma.category.findUnique({
    where: { name: decodedName },
  });

  if (!category) {
    notFound();
  }

  return (
    <section className={styles.pageSection}>
      <header className={styles.sectionHeader}>
        <div>
          <p className={styles.kicker}>Categories</p>
          <h2 className={styles.sectionTitle}>Modify category</h2>
          <p className={styles.sectionCopy}>
            Update the category description or tactic. The name cannot be changed once set.
          </p>
        </div>
        <Link href="/admin/categories" className={`ghost-btn ${styles.headerAction}`}>
          <ArrowLeft className={styles.arrowLeft} aria-hidden size={18} />
          Back to categories
        </Link>
      </header>

      <CategoryForm
        mode="edit"
        method="PATCH"
        submitUrl={`/api/admin/categories/${encodeURIComponent(category.name)}`}
        redirectPath="/admin/categories"
        initialValues={{
          name: category.name,
          description: category.description,
          tactic: category.tactic,
        }}
      />
    </section>
  );
}
