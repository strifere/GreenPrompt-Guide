import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCollaborationRequestDetailsById } from "@/domain/collaboration-request-repository";
import { getUserByUsername } from "@/domain/user-repository";
import { getSession } from "@/lib/session";
import RequestDetailsClient from "./request-details-client";


type RequestDetailsProps = {
  params: Promise<{ username: string; requestId: string }>;
};

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

export default async function RequestDetailsPage({
  params,
}: Readonly<RequestDetailsProps>) {
  const { username, requestId } = await params;
  const requestedUsername = decodeURIComponent(username);
  const currentUsername = await getSession();

  if (!currentUsername) {
    redirect("/login");
  }

  const currentUser = await getUserByUsername(currentUsername);

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.role !== "ADMIN" && currentUsername !== requestedUsername) {
    redirect(`/collaboration/my-requests/${encodeURIComponent(currentUsername)}`);
  }

  const parsedRequestId = Number.parseInt(requestId, 10);

  if (!Number.isInteger(parsedRequestId) || parsedRequestId <= 0) {
    notFound();
  }

  const request = await getCollaborationRequestDetailsById(parsedRequestId);

  if (!request) {
    notFound();
  }

  if (currentUser.role !== "ADMIN" && request.requesterUsername !== currentUsername) {
    notFound();
  }

  return (
    <main className="details-page">
      <div className="practice-details-shell collaboration-details-shell">
        <header className="practice-details-header">
          <div>
            <Link href={`/collaboration/my-requests/${encodeURIComponent(currentUsername)}`} className="animated-link" aria-label="Back to my requests">
              <ArrowLeft aria-hidden size={22} strokeWidth={2.25} />
              <span>Back to my requests</span>
            </Link>
          </div>
          <span className={`collaboration-status-pill ${request.status.toLowerCase()}`}>{formatStatus(request.status)}</span>
        </header>

        <RequestDetailsClient
          currentUsername={currentUsername}
          currentUserRole={currentUser.role ?? "USER"}
          request={{
              ...(() => {
                const { reviewerNotes: _, ...requestWithoutReviewerNotes } = request;
                return {
                  ...requestWithoutReviewerNotes,
                  messages: requestWithoutReviewerNotes.messages.map((message) => {
                    const { readAt: _, ...messageWithoutReadFlag } = message;
                    return messageWithoutReadFlag;
                  }),
                };
              })(),
          }}
        />

      </div>     
    </main>
  );
}
