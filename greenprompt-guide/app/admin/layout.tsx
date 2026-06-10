import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getUserByUsername } from "@/domain/user-repository";
import { AdminSidebar } from "./admin-sidebar";
import styles from "./admin.module.css";

export default async function AdminLayout({
	children,
}: Readonly<{
	children: ReactNode;
}>) {
	const username = await getSession();

	if (!username) {
		redirect("/");
	}

	const user = await getUserByUsername(username);

	if (user?.role !== "ADMIN") {
		redirect("/");
	}

	return (
		<div className={styles.adminShell}>
			<aside className={styles.sidebar} aria-label="Admin navigation">
				<div className={styles.sidebarHeader}>
					<p className={styles.kicker}>System control panel</p>
					<h1 className={styles.sidebarTitle}>Admin interface</h1>
					<p className={styles.muted}>
						Manage practices, monitor requests, and keep the platform tidy.
					</p>
				</div>
				<AdminSidebar />
			</aside>
			<div className={styles.content}>{children}</div>
		</div>
	);
}
