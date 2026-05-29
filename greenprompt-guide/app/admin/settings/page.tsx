import { listPractices } from "@/domain/practice-repository";
import { listUsers } from "@/domain/user-repository";
import styles from "../admin.module.css";

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export default async function AdminSettingsPage() {
  const [practices, users] = await Promise.all([listPractices(), listUsers()]);

  const adminUsers = users.filter((user) => user.role === "ADMIN").length;

  const cards = [
    {
      title: "Site identity",
      copy: "GreenPrompt Guide serves as the central catalog for prompt engineering knowledge.",
      details: ["Public catalog", "Knowledge base", "Community contributions"],
    },
    {
      title: "Access policy",
      copy: "Admin actions are limited to users with the ADMIN role.",
      details: ["Admin-only route", "Non-admin redirect", "Read-only placeholders"],
    },
    {
      title: "Catalog health",
      copy: `Currently tracking ${formatCount(practices.length)} practices and ${formatCount(users.length)} users.`,
      details: [
        `${formatCount(adminUsers)} admin users`,
        `${formatCount(Math.max(users.length - adminUsers, 0))} standard users`,
      ],
    },
    {
      title: "Maintenance",
      copy: "Use this area for rollout notes, backups, and operational reminders.",
      details: ["Backup cadence", "Data import checks", "Pending moderation work"],
    },
  ];

  return (
    <section className={styles.pageSection}>
      <header className={styles.sectionHeader}>
        <div>
          <p className={styles.kicker}>Settings</p>
          <h2 className={styles.sectionTitle}>System overview</h2>
          <p className={styles.sectionCopy}>
            Read-only configuration and operational notes for the platform.
          </p>
        </div>
      </header>

      <div className={styles.summaryGrid}>
        {cards.map((card) => (
          <article key={card.title} className={styles.summaryCard}>
            <h3 className={styles.cardTitle}>{card.title}</h3>
            <p>{card.copy}</p>
            <ul>
              {card.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}