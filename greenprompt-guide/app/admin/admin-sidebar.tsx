"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./admin.module.css";

const adminSections = [
  {
    href: "/admin/practices",
    label: "Practices",
  },
  {
    href: "/admin/categories",
    label: "Categories",
  },
  {
    href: "/admin/references",
    label: "References",
  },
  {
    href: "/admin/promptTechniques",
    label: "Prompt Techniques",
  },
  {
    href: "/admin/models",
    label: "Models",
  },
  {
    href: "/admin/datasets",
    label: "Datasets",
  },
  {
    href: "/admin/hyperparameters",
    label: "Hyperparameters",
  },
  {
    href: "/admin/requests",
    label: "Requests",
  },
  {
    href: "/admin/users",
    label: "Users",
  },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="Admin sections">
      {adminSections.map((section) => {
        const isActive =
          pathname === section.href || pathname.startsWith(`${section.href}/`);

        return (
          <Link
            key={section.href}
            href={section.href}
            className={styles.navLink}
            aria-current={isActive ? "page" : undefined}
            data-active={isActive}
          >
            <span className={styles.navLabel}>{section.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}