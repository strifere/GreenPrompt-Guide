"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./admin.module.css";

const adminSections = [
  {
    href: "/admin/practices",
    label: "Practices",
    description: "List, update, and remove practices.",
  },
  {
    href: "/admin/requests",
    label: "Requests",
    description: "Collaboration requests placeholder.",
  },
  {
    href: "/admin/users",
    label: "Users",
    description: "Inspect roles and moderation actions.",
  },
  {
    href: "/admin/settings",
    label: "Settings",
    description: "Platform-wide configuration and status.",
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
            <span className={styles.linkCopy}>{section.description}</span>
          </Link>
        );
      })}
    </nav>
  );
}