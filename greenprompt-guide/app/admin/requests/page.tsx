import Link from "next/link";
import { listAllCollaborationRequests } from "@/domain/collaboration-request-repository";
import styles from "../admin.module.css";

type RequestListItem = Awaited<ReturnType<typeof listAllCollaborationRequests>>[number];

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatStatus(status: string) {
  switch (status) {
    case "PENDING":
      return "Pending";
    case "REQUESTED_MORE_INFO":
      return "Requested more info";
    case "DENIED":
      return "Denied";
    case "APPROVED":
      return "Approved";
    default:
      return status;
  }
}

export default async function AdminRequestsPage() {
  const requests = await listAllCollaborationRequests();

  return (
    <section className={styles.pageSection}>
      <header className={styles.sectionHeader}>
        <div>
          <p className={styles.kicker}>Requests</p>
          <h2 className={styles.sectionTitle}>Collaboration requests</h2>
        </div>
      </header>

      <section className="collaboration-requests-panel" aria-label="All collaboration requests">
        {requests.length > 0 ? (
          <div className="collaboration-request-list">
            {requests.map((request: RequestListItem) => (
              <Link
                key={request.id}
                href={`/admin/requests/${request.id}`}
                className="practice-card collaboration-request-card"
              >
                <header>
                  <div className="collaboration-request-heading-row">
                    <h2>{request.practiceTitle}</h2>
                    <span className={`collaboration-status-pill ${request.status.toLowerCase()}`}>
                      {formatStatus(request.status)}
                    </span>
                  </div>
                  <p className="collaboration-request-summary">{request.practiceSummary}</p>
                </header>

                <div className="collaboration-request-meta-grid">
                  <div>
                    <span className="collaboration-request-meta-label">Requester</span>
                    <span className="collaboration-request-meta-value">{request.requesterUsername}</span>
                  </div>
                  <div>
                    <span className="collaboration-request-meta-label">Created</span>
                    <span className="collaboration-request-meta-value">{formatDate(request.createdAt)}</span>
                  </div>
                  <div>
                    <span className="collaboration-request-meta-label">Modified</span>
                    <span className="collaboration-request-meta-value">{formatDate(request.updatedAt)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="collaboration-empty-state">
            <h2>No requests yet</h2>
            <p>There are no collaboration requests in the system yet.</p>
          </div>
        )}
      </section>
    </section>
  );
}