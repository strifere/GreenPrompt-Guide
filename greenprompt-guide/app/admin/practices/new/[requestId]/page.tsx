import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCollaborationRequestDetailsById } from "@/domain/collaboration-request-repository";
import { prisma } from "@/lib/prisma";
import styles from "../../../admin.module.css";
import { RequestPracticeForm } from "./request-practice-form";

type RequestedPracticePageProps = {
	params: Promise<{ requestId: string }>;
};

function parseRequestId(requestId: string) {
	const parsedRequestId = Number.parseInt(requestId, 10);
	return Number.isInteger(parsedRequestId) && parsedRequestId > 0 ? parsedRequestId : null;
}

export default async function RequestedPracticePage({ params }: Readonly<RequestedPracticePageProps>) {
	const { requestId } = await params;
	const parsedRequestId = parseRequestId(requestId);

	if (!parsedRequestId) {
		notFound();
	}

	const request = await getCollaborationRequestDetailsById(parsedRequestId);

	if (!request) {
		notFound();
	}

	if (request.createdPractice) {
		redirect(`/admin/requests/${request.id}`);
	}

	const categories = await prisma.category.findMany({
		orderBy: { name: "asc" },
		select: {
			name: true,
			description: true,
			tactic: true,
		},
	});

	// Fetch references to allow admins to select an existing one
	const references = await prisma.reference.findMany({
		orderBy: { title: "asc" },
		select: {
			title: true,
			year: true,
			authors: true,
		},
	});

	return (
		<section className={styles.pageSection}>
			<header className={styles.sectionHeader}>
				<div>
					<p className={styles.kicker}>Practices</p>
					<h2 className={styles.sectionTitle}>Create practice from request</h2>
					<p className={styles.sectionCopy}>
						Review the request details, adapt the fields, and save the final practice into the catalog.
					</p>
				</div>
				<Link href={`/admin/requests/${request.id}`} className={`ghost-btn ${styles.headerAction}`}>
					<ArrowLeft className={styles.arrowLeft} aria-hidden size={18} />
					Back to request
				</Link>
			</header>

			<RequestPracticeForm
				requestId={request.id}
				requestTitle={request.practiceTitle}
				requestSummary={request.practiceSummary}
				requestDescription={request.practiceDescription}
				requestReferenceLink={request.referenceLink}
				requestExamples={request.practiceExamples}
				categories={categories}
				references={references}
			/>
		</section>
	);
}