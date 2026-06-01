import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCollaborationRequestDetailsById } from "@/domain/collaboration-request-repository";
import { getSession } from "@/lib/session";
import RequestDetailsClient from "@/app/collaboration/my-requests/[username]/[requestId]/request-details-client";
import styles from "../../admin.module.css";

type AdminRequestDetails = Awaited<ReturnType<typeof getCollaborationRequestDetailsById>>;
type AdminRequestMessage = NonNullable<AdminRequestDetails>["messages"][number];

type RequestDetailsProps = {
  params: Promise<{ requestId: string }>;
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
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

export default async function AdminRequestDetailsPage({ params }: Readonly<RequestDetailsProps>) {
  const { requestId } = await params;
  const currentUsername = await getSession();

  if (!currentUsername) {
    redirect("/");
  }

  const parsedRequestId = Number.parseInt(requestId, 10);

  if (!Number.isInteger(parsedRequestId) || parsedRequestId <= 0) {
    notFound();
  }

  const request = await getCollaborationRequestDetailsById(parsedRequestId);

  if (!request) {
    notFound();
  }

  return (
    <section className={styles.pageSection}>
      <div className="practice-details-shell collaboration-details-shell">
        <header className="practice-details-header">
          <div>
            <Link href="/admin/requests" className="animated-link" aria-label="Back to all requests">
              <ArrowLeft aria-hidden size={22} strokeWidth={2.25} />
              <span>Back to all requests</span>
            </Link>
          </div>
          <span className={`collaboration-status-pill ${request.status.toLowerCase()}`}>{formatStatus(request.status)}</span>
        </header>

        <RequestDetailsClient
          currentUsername={currentUsername}
          currentUserRole="ADMIN"
          request={{
            ...request,
            createdAt: formatDate(request.createdAt),
            updatedAt: formatDate(request.updatedAt),
            requestedMoreInfoAt: request.requestedMoreInfoAt ? formatDate(request.requestedMoreInfoAt) : null,
            reviewedAt: request.reviewedAt ? formatDate(request.reviewedAt) : null,
            messages: request.messages.map((message: AdminRequestMessage) => ({
              ...message,
              createdAt: formatDate(message.createdAt),
              readAt: message.readAt ? formatDate(message.readAt) : null,
            })),
          }}
        />
      </div>
    </section>
  );
}
