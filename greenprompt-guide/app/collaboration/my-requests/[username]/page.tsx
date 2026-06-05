import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { listCollaborationRequestsByRequesterUsername } from "@/domain/collaboration-request-repository";
import { getSession } from "@/lib/session";

type MyRequestsPageProps = {
	params: { username: string };
};

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

export default async function MyRequestsPage({ params }: Readonly<MyRequestsPageProps>) {
	const { username } = params;
	const requestedUsername = decodeURIComponent(username);
	const currentUsername = await getSession();

	if (!currentUsername) {
		redirect("/login");
	}

	if (currentUsername !== requestedUsername) {
		redirect(`/collaboration/my-requests/${encodeURIComponent(currentUsername)}`);
	}

	const requests = await listCollaborationRequestsByRequesterUsername(requestedUsername);

	return (
		<main className="collaboration-page collaboration-my-requests-page">
			<div className="collaboration-page-header">
				<div>
					<Link href="/collaboration" className="animated-link">
						<ArrowLeft aria-hidden size={20} />
						<span>Back to collaboration</span>
					</Link>
					<h1 className="collaboration-page-title">My requests</h1>
				</div>
			</div>

			<section className="collaboration-requests-panel" aria-label="Your collaboration requests">
				{requests.length > 0 ? (
					<div className="collaboration-request-list">
						{requests.map((request) => (
							<Link key={request.id} href={`/collaboration/my-requests/${encodeURIComponent(currentUsername)}/${request.id}`} className="practice-card collaboration-request-card">
								<header>
									<div className="collaboration-request-heading-row">
										<h2>{request.practiceTitle}</h2>
										<span className={`collaboration-status-pill ${request.status.toLowerCase()}`}>{formatStatus(request.status)}</span>
									</div>
									<p className="collaboration-request-summary">{request.practiceSummary}</p>
								</header>

								<div className="collaboration-request-meta-grid">
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
					<div className="empty-state">
						<h2>No requests yet</h2>
						<p>You have not submitted any collaboration requests yet.</p>
					</div>
				)}
			</section>
		</main>
	);
}