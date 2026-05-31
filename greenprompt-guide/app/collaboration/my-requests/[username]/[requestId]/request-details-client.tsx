"use client";

import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type ReactNode, type SyntheticEvent } from "react";
import { Download, Pencil, Send } from "lucide-react";

type MessageData = {
	id: number;
	authorUsername: string;
	authorRole: string;
	type: string;
	message: string;
	createdAt: string | Date;
	author: {
		username: string;
		email: string;
		role: string | null;
	};
};

type RequestData = {
	id: number;
	requesterUsername: string;
	reviewerUsername: string | null;
	status: string;
	practiceTitle: string;
	practiceSummary: string;
	practiceDescription: string;
	referenceLink: string;
	practiceExamples: string | null;
	hyperparameters: string | null;
	promptTechniques: string | null;
	supportingPdfName: string;
	supportingPdfMimeType: string;
	supportingPdfSizeBytes: number;
	rejectionReason: string | null;
	requestedMoreInfoAt: string | Date | null;
	reviewedAt: string | Date | null;
	createdAt: string | Date;
	updatedAt: string | Date;
	messages: MessageData[];
};

type Message = {
	id: number;
	authorUsername: string;
	authorRole: string;
	type: string;
	message: string;
	createdAt: string;
	author: {
		username: string;
		email: string;
		role: string | null;
	};
};

type Request = {
	id: number;
	requesterUsername: string;
	reviewerUsername: string | null;
	status: string;
	practiceTitle: string;
	practiceSummary: string;
	practiceDescription: string;
	referenceLink: string;
	practiceExamples: string | null;
	hyperparameters: string | null;
	promptTechniques: string | null;
	supportingPdfName: string;
	supportingPdfMimeType: string;
	supportingPdfSizeBytes: number;
	rejectionReason: string | null;
	requestedMoreInfoAt: string | null;
	reviewedAt: string | null;
	createdAt: string;
	updatedAt: string;
	messages: Message[];
};

type RequestDetailsClientProps = {
	request: RequestData;
	currentUsername: string;
	currentUserRole: string;
};

type FieldKey = "practiceTitle" | "practiceSummary" | "practiceDescription" | "referenceLink" | "practiceExamples" | "hyperparameters" | "promptTechniques";

type EditableFieldProps = {
	label: string;
	value: string | null;
	placeholder: string;
	multiline?: boolean;
	canEdit: boolean;
	href?: string;
	prominent?: boolean;
	onSave: (nextValue: string) => Promise<void>;
};

function formatDisplayDate(value: string | Date | null) {
	if (!value) {
		return null;
	}

	const parsedDate = value instanceof Date ? value : new Date(value);

	if (Number.isNaN(parsedDate.getTime())) {
		return typeof value === "string" ? value : value.toISOString();
	}

	return new Intl.DateTimeFormat("en", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(parsedDate);
}

function formatMessage(message: MessageData): Message {
	return {
		...message,
		createdAt: formatDisplayDate(message.createdAt) ?? "",
	};
}

function formatRequest(request: RequestData): Request {
	return {
		...request,
		createdAt: formatDisplayDate(request.createdAt) ?? "",
		updatedAt: formatDisplayDate(request.updatedAt) ?? "",
		requestedMoreInfoAt: formatDisplayDate(request.requestedMoreInfoAt),
		reviewedAt: formatDisplayDate(request.reviewedAt),
		messages: request.messages.map(formatMessage),
	};
}

function formatMessageType(type: string) {
	switch (type) {
		case "MORE_INFO_REQUEST":
			return "Request more info";
		case "RESPONSE":
			return "Response";
		case "NOTE":
			return "Note";
		default:
			return type;
}
}

function formatMessageAuthor(authorUsername: string, authorRole: string) {
	return `${authorUsername} · ${authorRole.toLowerCase()}`;
}

function EditableField({ label, value, placeholder, multiline = false, canEdit, href, prominent = false, onSave }: Readonly<EditableFieldProps>) {
	const fieldId = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
	const [isEditing, setIsEditing] = useState(false);
	const [draft, setDraft] = useState(value ?? "");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const trimmedValue = value?.trim();
	let displayValue: ReactNode = placeholder;

	if (trimmedValue) {
		displayValue = href ? (
			<a className="collaboration-detail-link" href={href} target="_blank" rel="noopener noreferrer">
				{trimmedValue}
			</a>
		) : (
			trimmedValue
		);
	}

	const openEditor = () => {
		setDraft(value ?? "");
		setError("");
		setIsEditing(true);
	};

	const cancelEditor = () => {
		setDraft(value ?? "");
		setError("");
		setLoading(false);
		setIsEditing(false);
	};

	const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
		event.preventDefault();
		setLoading(true);
		setError("");

		try {
			await onSave(draft.trim());
			setIsEditing(false);
		} catch (submitError) {
			setError(submitError instanceof Error ? submitError.message : "Unable to save this field right now");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="collaboration-detail-row">
			<div className="collaboration-detail-copy">
				<h2 className="collaboration-detail-label">{label}</h2>
				{isEditing ? (
					<form className="collaboration-inline-form" onSubmit={handleSubmit}>
						<div className="form-group collaboration-inline-input">
							<label className="sr-only" htmlFor={fieldId}>
								{label}
							</label>
							{multiline ? (
								<textarea
									id={fieldId}
									value={draft}
									onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setDraft(event.target.value)}
									rows={4}
									required
								/>
							) : (
								<input
									id={fieldId}
									value={draft}
									onChange={(event: ChangeEvent<HTMLInputElement>) => setDraft(event.target.value)}
									required
								/>
							)}
						</div>
						{error && <div className="error-message">{error}</div>}
						<div className="collaboration-inline-actions">
							<button type="submit" className="solid-btn" disabled={loading}>
								{loading ? "Saving..." : "Save"}
							</button>
							<button type="button" className="ghost-btn" onClick={cancelEditor}>
								Cancel
							</button>
						</div>
					</form>
				) : (
					<p className={`collaboration-detail-value${prominent ? " collaboration-detail-value--prominent" : ""}`}>
						{displayValue}
					</p>
				)}
			</div>
			{canEdit && !isEditing && (
				<button type="button" className="user-icon-button" aria-label={`Edit ${label}`} onClick={openEditor}>
					<Pencil size={18} />
				</button>
			)}
		</div>
	);
}

function MessageCard({
	message,
	currentUsername,
}: Readonly<{
	message: Message;
	currentUsername: string;
}>) {
	const isOwnMessage = message.authorUsername === currentUsername;

	return (
		<article className={`collaboration-message-card${isOwnMessage ? " collaboration-message-card-own" : ""}`}>
			<div className="collaboration-message-card-header">
				<div>
					<p className="collaboration-message-meta">{formatMessageAuthor(message.authorUsername, message.authorRole)}</p>
					<p className="collaboration-message-type">{formatMessageType(message.type)}</p>
				</div>
				<div className="collaboration-message-meta-group">
					<span>{message.createdAt}</span>
				</div>
			</div>
			<p className="collaboration-message-body">{message.message}</p>
		</article>
	);
}

export default function RequestDetailsClient({ request: initialRequest, currentUsername, currentUserRole }: Readonly<RequestDetailsClientProps>) {
	const router = useRouter();
	const [request, setRequest] = useState(() => formatRequest(initialRequest));
	const [messageDraft, setMessageDraft] = useState("");
	const [messageLoading, setMessageLoading] = useState(false);
	const [messageError, setMessageError] = useState("");
	const [adminAction, setAdminAction] = useState<"deny" | "more-info" | null>(null);
	const [adminDraft, setAdminDraft] = useState("");
	const [adminLoading, setAdminLoading] = useState(false);
	const [adminError, setAdminError] = useState("");

	const canEditFields = currentUserRole !== "ADMIN" && currentUsername === request.requesterUsername;
	const isAdmin = currentUserRole === "ADMIN";

	const refreshRequest = (updatedRequest: RequestData) => {
		setRequest(formatRequest(updatedRequest));
	};

	const refreshRequestAndIndicators = (updatedRequest: RequestData) => {
		setRequest(formatRequest(updatedRequest));
		router.refresh();
	};

	const clearAdminAction = () => {
		setAdminAction(null);
		setAdminDraft("");
		setAdminError("");
	};

	const handleFieldSave = async (field: FieldKey, nextValue: string) => {
		const requestBody: Record<string, string | null> = {};

		if (field === "practiceExamples" || field === "hyperparameters" || field === "promptTechniques") {
			requestBody[field] = nextValue || null;
		} else {
			requestBody[field] = nextValue;
		}

		const response = await fetch(`/api/collaboration/requests/${request.id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(requestBody),
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.error || "Failed to update the request");
		}

		refreshRequest(data.request);
	};

	const submitAdminStatusUpdate = async (nextStatus: "APPROVED" | "DENIED" | "PENDING") => {
		setAdminLoading(true);
		setAdminError("");

		try {
			const requestBody: Record<string, string> = { status: nextStatus };

			if (nextStatus === "DENIED") {
				requestBody.rejectionReason = adminDraft.trim();
			}

			const response = await fetch(`/api/collaboration/requests/${request.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(requestBody),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to update the request");
			}

			refreshRequestAndIndicators(data.request);
			clearAdminAction();
		} catch (submitError) {
			setAdminError(submitError instanceof Error ? submitError.message : "Unable to update the request right now");
		} finally {
			setAdminLoading(false);
		}
	};

	const submitMoreInfoMessage = async (event: SyntheticEvent<HTMLFormElement>) => {
		event.preventDefault();
		setAdminLoading(true);
		setAdminError("");

		try {
			const response = await fetch(`/api/collaboration/requests/${request.id}/messages`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ message: adminDraft, intent: "MORE_INFO_REQUEST" }),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to send the message");
			}

			refreshRequestAndIndicators(data.request);
			clearAdminAction();
		} catch (submitError) {
			setAdminError(submitError instanceof Error ? submitError.message : "Unable to send your message right now");
		} finally {
			setAdminLoading(false);
		}
	};

	const handleMessageSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
		event.preventDefault();
		setMessageLoading(true);
		setMessageError("");

		try {
			const response = await fetch(`/api/collaboration/requests/${request.id}/messages`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ message: messageDraft }),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to send the message");
			}

			setMessageDraft("");
			refreshRequestAndIndicators(data.request);
		} catch (submitError) {
			setMessageError(submitError instanceof Error ? submitError.message : "Unable to send your message right now");
		} finally {
			setMessageLoading(false);
		}
	};

	const hasRejectionReason = Boolean(request.status === "DENIED" && request.rejectionReason?.trim());
	const canRequestMoreInfo = request.status === "PENDING";
	const canShowReopen = request.status === "DENIED" || request.status === "APPROVED";

	return (
		<section className="collaboration-request-overview">
			{hasRejectionReason && (
				<div className="collaboration-deny-reason-section">
					<span className="collaboration-request-meta-label">Rejection reason</span>
					<span className="collaboration-request-meta-value">{request.rejectionReason?.trim()}</span>
				</div>
			)}

			<div className="collaboration-request-header-card">
				<div className="collaboration-request-header-copy">
					<EditableField label="Practice title" value={request.practiceTitle} placeholder="No title provided" canEdit={canEditFields} prominent onSave={(nextValue) => handleFieldSave("practiceTitle", nextValue)} />
				</div>
                <div className="collaboration-request-header-copy">
					<EditableField label="Practice summary" value={request.practiceSummary} placeholder="No summary provided" multiline canEdit={canEditFields} onSave={(nextValue) => handleFieldSave("practiceSummary", nextValue)} />
				</div>
				<div className="collaboration-request-header-copy">
					<EditableField label="Reference link" value={request.referenceLink} placeholder="No reference link provided" canEdit={canEditFields} href={request.referenceLink} onSave={(nextValue) => handleFieldSave("referenceLink", nextValue)} />
				</div>
			</div>

			<div className="collaboration-request-fields-grid">
				<EditableField label="Practice description" value={request.practiceDescription} placeholder="No description provided" multiline canEdit={canEditFields} onSave={(nextValue) => handleFieldSave("practiceDescription", nextValue)} />
				<EditableField label="Examples" value={request.practiceExamples} placeholder="Not provided" multiline canEdit={canEditFields} onSave={(nextValue) => handleFieldSave("practiceExamples", nextValue)} />
				<EditableField label="Hyperparameters" value={request.hyperparameters} placeholder="Not provided" multiline canEdit={canEditFields} onSave={(nextValue) => handleFieldSave("hyperparameters", nextValue)} />
				<EditableField label="Prompt techniques" value={request.promptTechniques} placeholder="Not provided" multiline canEdit={canEditFields} onSave={(nextValue) => handleFieldSave("promptTechniques", nextValue)} />
			</div>

			<div className="collaboration-request-pdf-section">
				<h2>Supporting PDF</h2>
				<div className="collaboration-pdf-row">
					<div>
						<p className="collaboration-request-meta-value">{request.supportingPdfName}</p>
						<p className="collaboration-message-meta">{request.supportingPdfMimeType} · {(request.supportingPdfSizeBytes / 1024).toFixed(1)} KB</p>
					</div>
					<a className="collaboration-pdf-link" href={`/api/collaboration/requests/${request.id}/pdf`} target="_blank" rel="noopener noreferrer">
						<Download size={16} />
						Download PDF
					</a>
				</div>
			</div>

			<div className="collaboration-request-meta-strip">
				<div>
					<span className="collaboration-request-meta-label">Reviewer</span>
					<span className="collaboration-request-meta-value">{request.reviewerUsername || "Not assigned"}</span>
				</div>
				<div>
					<span className="collaboration-request-meta-label">Created</span>
					<span className="collaboration-request-meta-value">{request.createdAt}</span>
				</div>
				<div>
					<span className="collaboration-request-meta-label">Updated</span>
					<span className="collaboration-request-meta-value">{request.updatedAt}</span>
				</div>
				<div>
					<span className="collaboration-request-meta-label">Reviewed at</span>
					<span className="collaboration-request-meta-value">{request.reviewedAt || "Not reviewed yet"}</span>
				</div>
				<div>
					<span className="collaboration-request-meta-label">Requested more info at</span>
					<span className="collaboration-request-meta-value">{request.requestedMoreInfoAt || "Not requested"}</span>
				</div>
			</div>

			<section className="collaboration-messages-section" aria-label="Messages">
				<h2>Messages</h2>
				<div className="collaboration-messages-list">
					{request.messages.length > 0 ? (
						request.messages.map((message) => (
							<MessageCard key={message.id} message={message} currentUsername={currentUsername} />
						))
					) : (
						<div className="collaboration-empty-state">
							<h3>No messages yet</h3>
							<p>The conversation for this request will appear here.</p>
						</div>
					)}
				</div>
				{canShowReopen ? null : (
					<form className="collaboration-message-box" onSubmit={handleMessageSubmit}>
					<div className="form-group">
						<label htmlFor="request-message">Write a new message</label>
						<textarea
							id="request-message"
							value={messageDraft}
							onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setMessageDraft(event.target.value)}
							rows={5}
							placeholder="Add an answer or note for this request"
							required
						/>
					</div>
					{messageError && <div className="error-message">{messageError}</div>}
					<div className="collaboration-message-actions">
						<button type="submit" className="collaboration-pdf-link" disabled={messageLoading}>
							<Send size={16} />
							{messageLoading ? "Posting..." : "Post message"}
						</button>
					</div>
				</form>
				)}
			</section>

			{isAdmin ? (
				<div className="collaboration-request-pdf-section">
					<h2>Admin actions</h2>
					<div className="collaboration-inline-actions">
						{canShowReopen ? (
							<button type="button" className="solid-btn" disabled={adminLoading} onClick={() => void submitAdminStatusUpdate("PENDING")}>
								Reopen request
							</button>
						) : (
							<>
								<button type="button" className="green-btn" disabled={adminLoading} onClick={() => void submitAdminStatusUpdate("APPROVED")}>
									Approve request
								</button>
								<button type="button" className="danger-btn" disabled={adminLoading} onClick={() => setAdminAction("deny")}>
									Deny request
								</button>
								{canRequestMoreInfo ? (
									<button type="button" className="ghost-btn" disabled={adminLoading} onClick={() => setAdminAction("more-info")}>
										Request more info
									</button>
								) : null}
							</>
						)}
					</div>
					{adminError ? <div className="error-message">{adminError}</div> : null}

					{adminAction === "deny" ? (
						<form className="collaboration-message-box deny" onSubmit={(event) => {
							event.preventDefault();
							if (!adminDraft.trim()) {
								setAdminError("A rejection reason is required");
								return;
							}
							void submitAdminStatusUpdate("DENIED");
						}}>
							<div className="form-group">
								<label htmlFor="admin-denial-reason">Reason for denial</label>
								<textarea
									id="admin-denial-reason"
									value={adminDraft}
									onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setAdminDraft(event.target.value)}
									rows={5}
									placeholder="Explain why the request is being denied"
									required
								/>
							</div>
							<div className="collaboration-message-actions">
								<button type="submit" className="danger-btn" disabled={adminLoading}>
									{adminLoading ? "Submitting..." : "Deny definitely"}
								</button>
								<button type="button" className="ghost-btn" onClick={clearAdminAction}>
									Cancel
								</button>
							</div>
						</form>
					) : null}

					{adminAction === "more-info" ? (
						<form className="collaboration-message-box moreinfo" onSubmit={submitMoreInfoMessage}>
							<div className="form-group">
								<label htmlFor="admin-more-info-message">Message to requester</label>
								<textarea
									id="admin-more-info-message"
									value={adminDraft}
									onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setAdminDraft(event.target.value)}
									rows={5}
									placeholder="Ask the requester for additional information"
									required
								/>
							</div>
							<div className="collaboration-message-actions">
								<button type="submit" className="solid-btn" disabled={adminLoading}>
									{adminLoading ? "Submitting..." : "Submit"}
								</button>
								<button type="button" className="ghost-btn" onClick={clearAdminAction}>
									Cancel
								</button>
							</div>
						</form>
					) : null}
				</div>
			) : null}
		</section>
	);
}