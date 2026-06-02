import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import styles from "../../admin.module.css";
import { PracticeForm } from "../practice-form";

export default async function NewPracticePage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: {
      name: true,
      description: true,
      tactic: true,
    },
  });

  return (
    <section className={styles.pageSection}>
      <header className={styles.sectionHeader}>
        <div>
          <p className={styles.kicker}>Practices</p>
          <h2 className={styles.sectionTitle}>Create practice</h2>
          <p className={styles.sectionCopy}>
            Add a catalog practice directly, including its reference, category, and examples.
          </p>
        </div>
        <Link href="/admin/practices" className={`ghost-btn ${styles.headerAction}`}>
          <ArrowLeft className={styles.arrowLeft} aria-hidden size={18} />
          Back to practices
        </Link>
      </header>

      <PracticeForm categories={categories} submitUrl="/api/admin/practices" redirectPath="/admin/practices" />
    </section>
  );
}
