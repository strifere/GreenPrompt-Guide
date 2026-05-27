"use client";

import { useState, type ChangeEvent, type SyntheticEvent } from "react";
import { Check, Download, Pencil, Send } from "lucide-react";

type Message = {
	id: number;
	authorUsername: string;
	authorRole: string;
	type: string;
	message: string;
	readAt: string | null;
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
	practiceExamples: string | null;
	hyperparameters: string | null;
	promptTechniques: string | null;
	supportingPdfName: string;
	supportingPdfMimeType: string;
	supportingPdfSizeBytes: number;
	rejectionReason: string | null;
	reviewerNotes: string | null;
	requestedMoreInfoAt: string | null;
	reviewedAt: string | null;
	createdAt: string;
	updatedAt: string;
	messages: Message[];
};

type RequestDetailsClientProps = {
	request: Request;
	currentUsername: string;
	currentUserRole: string;
};

type FieldKey = "practiceTitle" | "practiceSummary" | "practiceDescription" | "practiceExamples" | "hyperparameters" | "promptTechniques";

type EditableFieldProps = {
	label: string;
	value: string | null;
	placeholder: string;
	multiline?: boolean;
	canEdit: boolean;
	onSave: (nextValue: string) => Promise<void>;
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

function formatMessageType(type: string) {
	switch (type) {
		case "MORE_INFO_REQUEST":
			return "More info request";
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

function EditableField({ label, value, placeholder, multiline = false, canEdit, onSave }: Readonly<EditableFieldProps>) {
	const fieldId = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
	const [isEditing, setIsEditing] = useState(false);
	const [draft, setDraft] = useState(value ?? "");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

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
					<p className="collaboration-detail-value">{value?.trim() ? value : placeholder}</p>
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
	onMarkAsRead,
}: Readonly<{
	message: Message;
	currentUsername: string;
	onMarkAsRead: (messageId: number) => Promise<void>;
}>) {
	const isOwnMessage = message.authorUsername === currentUsername;
	const needsReadByRequester = !isOwnMessage && message.authorRole === "ADMIN" && !message.readAt;

	return (
		<article className={`collaboration-message-card${isOwnMessage ? " collaboration-message-card-own" : ""}`}>
			<div className="collaboration-message-card-header">
				<div>
					<p className="collaboration-message-meta">{formatMessageAuthor(message.authorUsername, message.authorRole)}</p>
					<p className="collaboration-message-type">{formatMessageType(message.type)}</p>
				</div>
				<div className="collaboration-message-meta-group">
					<span>{message.createdAt}</span>
					{message.readAt ? <span className="collaboration-message-read">Read {message.readAt}</span> : <span className="collaboration-message-unread">Unread</span>}
				</div>
			</div>
			<p className="collaboration-message-body">{message.message}</p>
			{needsReadByRequester && (
				<button type="button" className="ghost-btn collaboration-message-read-btn" onClick={() => void onMarkAsRead(message.id)}>
					<Check size={16} />
					Mark as read
				</button>
			)}
		</article>
	);
}

export default function RequestDetailsClient({ request: initialRequest, currentUsername, currentUserRole }: Readonly<RequestDetailsClientProps>) {
	const [request, setRequest] = useState(initialRequest);
	const [messageDraft, setMessageDraft] = useState("");
	const [messageLoading, setMessageLoading] = useState(false);
	const [messageError, setMessageError] = useState("");

	const canEdit = currentUserRole === "ADMIN" || currentUsername === request.requesterUsername;

	const refreshRequest = (updatedRequest: Request) => {
		setRequest(updatedRequest);
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
			refreshRequest(data.request);
		} catch (submitError) {
			setMessageError(submitError instanceof Error ? submitError.message : "Unable to send your message right now");
		} finally {
			setMessageLoading(false);
		}
	};

	const handleMarkAsRead = async (messageId: number) => {
		const response = await fetch(`/api/collaboration/requests/${request.id}/messages/${messageId}/read`, {
			method: "POST",
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.error || "Failed to mark the message as read");
		}

		refreshRequest(data.request);
	};

	const hasReviewerNotes = Boolean(request.reviewedAt && request.reviewerNotes?.trim());
	const hasRejectionReason = Boolean(request.status === "DENIED" && request.rejectionReason?.trim());
	const showSecondaryMeta = hasReviewerNotes || hasRejectionReason;

	return (
		<section className="collaboration-request-overview">
			<div className="collaboration-request-header-card">
				<div className="collaboration-request-header-copy">
					<EditableField label="Practice title" value={request.practiceTitle} placeholder="No title provided" canEdit={canEdit} onSave={(nextValue) => handleFieldSave("practiceTitle", nextValue)} />
				</div>
                <div className="collaboration-request-header-copy">
					<EditableField label="Practice summary" value={request.practiceSummary} placeholder="No summary provided" multiline canEdit={canEdit} onSave={(nextValue) => handleFieldSave("practiceSummary", nextValue)} />
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

				<div className="collaboration-request-fields-grid">
					<EditableField label="Practice description" value={request.practiceDescription} placeholder="No description provided" multiline canEdit={canEdit} onSave={(nextValue) => handleFieldSave("practiceDescription", nextValue)} />
					<EditableField label="Examples" value={request.practiceExamples} placeholder="Not provided" multiline canEdit={canEdit} onSave={(nextValue) => handleFieldSave("practiceExamples", nextValue)} />
					<EditableField label="Hyperparameters" value={request.hyperparameters} placeholder="Not provided" multiline canEdit={canEdit} onSave={(nextValue) => handleFieldSave("hyperparameters", nextValue)} />
					<EditableField label="Prompt techniques" value={request.promptTechniques} placeholder="Not provided" multiline canEdit={canEdit} onSave={(nextValue) => handleFieldSave("promptTechniques", nextValue)} />
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

				{showSecondaryMeta && (
					<div className="collaboration-request-meta-strip collaboration-request-meta-strip-secondary">
						{hasReviewerNotes && (
							<div>
								<span className="collaboration-request-meta-label">Reviewer notes</span>
								<span className="collaboration-request-meta-value">{request.reviewerNotes?.trim()}</span>
							</div>
						)}
						{hasRejectionReason && (
							<div>
								<span className="collaboration-request-meta-label">Rejection reason</span>
								<span className="collaboration-request-meta-value">{request.rejectionReason?.trim()}</span>
							</div>
						)}
					</div>
				)}

				<section className="collaboration-messages-section" aria-label="Messages">
					<h2>Messages</h2>
					<div className="collaboration-messages-list">
						{request.messages.length > 0 ? (
							request.messages.map((message) => (
								<MessageCard key={message.id} message={message} currentUsername={currentUsername} onMarkAsRead={handleMarkAsRead} />
							))
						) : (
							<div className="collaboration-empty-state">
								<h3>No messages yet</h3>
								<p>The conversation for this request will appear here.</p>
							</div>
						)}
					</div>

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
				</section>
		</section>
	);
}