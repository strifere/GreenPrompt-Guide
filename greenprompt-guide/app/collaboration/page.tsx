"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from "react";

type CollaborationFieldName = "practiceTitle" | "practiceSummary" | "practiceDescription" | "referenceLink" | "sourcePdf";

type FieldErrors = Partial<Record<CollaborationFieldName, string>>;

type FormSubmitEvent = {
	preventDefault: () => void;
};

type ModalState =
	| { kind: "login" }
	| { kind: "success"; username: string };

type AuthSession = {
	username: string;
	role: string | null;
};

const FORM_VALIDATION_MESSAGE = "There are fields that are not correct; please check them before submitting.";

function readRequiredValue(formData: FormData, key: string): string {
	const value = formData.get(key);
	return typeof value === "string" ? value.trim() : "";
}

function validateFormData(formData: FormData): FieldErrors {
	const errors: FieldErrors = {};

	if (!readRequiredValue(formData, "practiceTitle")) {
		errors.practiceTitle = "Practice title is required.";
	}

	if (!readRequiredValue(formData, "practiceSummary")) {
		errors.practiceSummary = "Short summary is required.";
	}

	if (!readRequiredValue(formData, "practiceDescription")) {
		errors.practiceDescription = "Full description is required.";
	}

	if (!readRequiredValue(formData, "referenceLink")) {
		errors.referenceLink = "Reference link is required.";
	}

	const sourcePdf = formData.get("sourcePdf");

	if (!(sourcePdf instanceof File) || sourcePdf.size === 0) {
		errors.sourcePdf = "A supporting PDF is required.";
	} else if (sourcePdf.type !== "application/pdf") {
		errors.sourcePdf = "Only PDF files are allowed.";
	}

	return errors;
}

function mapApiErrorToFieldErrors(message: string): FieldErrors {
	if (message.includes("practiceTitle is required")) {
		return { practiceTitle: "Practice title is required." };
	}

	if (message.includes("practiceSummary is required")) {
		return { practiceSummary: "Short summary is required." };
	}

	if (message.includes("practiceDescription is required")) {
		return { practiceDescription: "Full description is required." };
	}

	if (message.includes("referenceLink is required")) {
		return { referenceLink: "Reference link is required." };
	}

	if (message.includes("Reference link cannot be empty")) {
		return { referenceLink: "Reference link is required." };
	}

	if (message.includes("supporting PDF is required")) {
		return { sourcePdf: "A supporting PDF is required." };
	}

	if (message.includes("Only PDF files are allowed")) {
		return { sourcePdf: "Only PDF files are allowed." };
	}

	return {};
}

type CollaborationPageHelpers = {
	formRef: RefObject<HTMLFormElement | null>;
	isCheckingAccess: boolean;
	setIsCheckingAccess: Dispatch<SetStateAction<boolean>>;
	setModalState: Dispatch<SetStateAction<ModalState | null>>;
	setFormErrorMessage: Dispatch<SetStateAction<string | null>>;
	setFieldErrors: Dispatch<SetStateAction<FieldErrors>>;
	getAuthenticatedSession: () => Promise<AuthSession | null>;
};

async function getAuthenticatedSession(): Promise<AuthSession | null> {
	const response = await fetch("/api/auth/check", {
		method: "GET",
		credentials: "include",
		cache: "no-store",
	});

	if (!response.ok) {
		return null;
	}

	const data = (await response.json().catch(() => null)) as { user?: string; role?: string | null } | null;

	if (typeof data?.user !== "string" || !data.user.trim()) {
		return null;
	}

	return {
		username: data.user,
		role: typeof data.role === "string" || data.role === null ? data.role : null,
	};
}

async function submitCollaborationRequest({
	formRef,
	isCheckingAccess,
	setIsCheckingAccess,
	setModalState,
	setFormErrorMessage,
	setFieldErrors,
	getAuthenticatedSession,
}: CollaborationPageHelpers) {
	if (isCheckingAccess) {
		return;
	}

	setIsCheckingAccess(true);

	try {
		setFormErrorMessage(null);
		setFieldErrors({});

		const authenticatedSession = await getAuthenticatedSession();
		const authenticatedUsername = authenticatedSession?.username ?? null;

		if (!authenticatedUsername) {
			setModalState({ kind: "login" });
			return;
		}

		if (!formRef.current) {
			return;
		}

		const formData = new FormData(formRef.current);
		const sourcePdfInput = formRef.current.elements.namedItem("sourcePdf");

		if (sourcePdfInput instanceof HTMLInputElement && sourcePdfInput.files?.[0] instanceof File) {
			formData.set("sourcePdf", sourcePdfInput.files[0]);
		}

		const clientValidationErrors = validateFormData(formData);

		if (Object.keys(clientValidationErrors).length > 0) {
			setFieldErrors(clientValidationErrors);
			setFormErrorMessage(FORM_VALIDATION_MESSAGE);
			return;
		}

		const submitResponse = await fetch("/api/collaboration/requests", {
			method: "POST",
			credentials: "include",
			body: formData,
		});

		if (!submitResponse.ok) {
			const payload = (await submitResponse.json().catch(() => null)) as { error?: string } | null;
			const apiMessage = payload?.error || "Invalid request.";
			const apiFieldErrors = mapApiErrorToFieldErrors(apiMessage);

			if (Object.keys(apiFieldErrors).length > 0) {
				setFieldErrors(apiFieldErrors);
				setFormErrorMessage(FORM_VALIDATION_MESSAGE);
			} else {
				setFormErrorMessage(apiMessage);
			}

			return;
		}

		setFieldErrors({});
		setFormErrorMessage(null);
		setModalState({ kind: "success", username: authenticatedUsername });
		formRef.current.reset();
	} catch {
		setFormErrorMessage("An unexpected error occurred while submitting the form.");
	} finally {
		setIsCheckingAccess(false);
	}
}

async function navigateToMyRequests({
	setModalState,
	getAuthenticatedSession,
	routerPush,
}: {
	setModalState: Dispatch<SetStateAction<ModalState | null>>;
	getAuthenticatedSession: () => Promise<AuthSession | null>;
	routerPush: (href: string) => void;
}) {
	const authenticatedSession = await getAuthenticatedSession();
	const authenticatedUsername = authenticatedSession?.username ?? null;

	if (!authenticatedUsername) {
		setModalState({ kind: "login" });
		return;
	}

	routerPush(`/collaboration/my-requests/${encodeURIComponent(authenticatedUsername)}`);
}

type CollaborationModalProps = {
	title: string;
	message: string;
	primaryLabel: string;
	primaryHref: string;
	onClose: () => void;
};

function CollaborationModal({ title, message, primaryLabel, primaryHref, onClose }: Readonly<CollaborationModalProps>) {
	return (
		<div className="recovery-modal-overlay">
			<dialog className="recovery-modal" open aria-modal="true" aria-labelledby="collaboration-modal-title">			
                <h2 id="collaboration-modal-title">{title}</h2>
                <p>{message}</p>
                <div className="recovery-form">
                    <Link className="solid-btn" href={primaryHref}>
                        {primaryLabel}
                    </Link>
                    <button type="button" className="ghost-btn" onClick={onClose}>
                        Close
                    </button>
                </div>
			</dialog>
		</div>
	);
}

function CollaborationStatusOverlay({
	modalState,
	onClose,
}: Readonly<{
	modalState: ModalState | null;
	onClose: () => void;
}>) {
	if (!modalState) {
		return null;
	}

	if (modalState.kind === "login") {
		return (
			<CollaborationModal
				title="Sign in required"
				message="Please log in before submitting a collaboration request or checking your requests."
				primaryLabel="Log in"
				primaryHref="/login"
				onClose={onClose}
			/>
		);
	}

	return (
		<CollaborationModal
			title="Request submitted successfully"
			message="Your collaboration request was submitted successfully."
			primaryLabel="View my requests"
			primaryHref={`/collaboration/my-requests/${encodeURIComponent(modalState.username)}`}
			onClose={onClose}
		/>
	);
}

function CollaborationIntroPanel() {
	return (
		<aside className="collaboration-intro" aria-label="Collaboration instructions">
			<div className="collaboration-intro-inner">
				<header className="collaboration-intro-header">
					<p className="collaboration-kicker">Instructions</p>
					<h1 className="collaboration-title">How collaboration works</h1>
					<p className="collaboration-subtitle">
						Collaborating with the GreenPrompt Guide is a great way to share your knowledge and contribute to the community. To propose a practice for review, simply fill out the submission form with the required information and attach a supporting PDF. An admin will review your submission and get back to you with feedback or approval.
					</p>
				</header>

				<details className="collaboration-copy-block">
					<summary className="collaboration-copy-block-summary">
						<h2>How the collaboration process works</h2>
					</summary>
					<div className="collaboration-copy-block-content">
						<p>When requesting the addition of a new practice to the catalog, the following stages will take place:</p>
						<h3>1. Submission</h3>
						<p>The contributor fills out the submission form with the required information and attaches a supporting PDF, with a reference link. Once submitted, the request is instantiated for review.</p>
						<h3>2. Review</h3>
						<p>An admin user reviews the submission to ensure it meets our guidelines and quality standards. The admins may reach out to the contributor for additional information or clarification during this stage.</p>
						<h3>3. Decision</h3>
						<p>After the review, an admin will make a decision on whether to approve or reject the submission. If approved, the practice will be added to the catalog and credited to the contributor. If rejected, we will provide feedback on why it was not accepted and how it can be improved for future submissions.</p>
					</div>
				</details>

				<details className="collaboration-copy-block">
					<summary className="collaboration-copy-block-summary">
						<h2>What to include</h2>
					</summary>
					<div className="collaboration-copy-block-content">
						<h3>Submission checklist</h3>
						<p>To ensure your submission has the best chance of being approved, please include the following information in your proposal:</p>
						<ul>
							<li>- A clear and concise practice title</li>
							<li>- A short summary explaining the practice in one or two sentences</li>
							<li>- A full description that explains the practice, its context, and why it should be added to the catalog</li>
							<li>- Examples of the practice in use (optional but highly recommended)</li>
							<li>- Any relevant hyperparameters, settings, or tuning notes (optional)</li>
							<li>- Mention of any specific prompt techniques, patterns, or strategies used (optional)</li>
							<li>- A supporting PDF that proves the practice source, such as a research paper or article</li>
							<li>- A direct reference link to the paper or article that supports the practice</li>
						</ul>
					</div>
				</details>
			</div>
		</aside>
	);
}

function CollaborationRequestForm({
	formRef,
	isCheckingAccess,
	fieldErrors,
	formErrorMessage,
	onSubmit,
	isAdmin,
}: Readonly<{
	formRef: RefObject<HTMLFormElement | null>;
	isCheckingAccess: boolean;
	fieldErrors: FieldErrors;
	formErrorMessage: string | null;
	onSubmit: (event: FormSubmitEvent) => void;
	isAdmin: boolean;
}>) {
	return (
		<section className="collaboration-form-panel" aria-labelledby="collaboration-form-title">
			<div className="collaboration-form-card">
				<div className="collaboration-form-header">
					<p className="collaboration-kicker">Submission form</p>
					<h2 id="collaboration-form-title">Propose a practice for review</h2>
					<p>Share the practice details and attach the supporting PDF so an admin can verify the request.</p>
				</div>

				<form ref={formRef} className="collaboration-form" method="post" encType="multipart/form-data" action="/api/collaboration/requests" onSubmit={onSubmit}>
					<div className="collaboration-grid">
						<div className="collaboration-field collaboration-field--wide">
							<label htmlFor="practiceTitle">Practice title</label>
							<input id="practiceTitle" name="practiceTitle" type="text" placeholder="Short, descriptive practice title" aria-invalid={fieldErrors.practiceTitle ? "true" : "false"} className={fieldErrors.practiceTitle ? "collaboration-input-error" : undefined} />
							{fieldErrors.practiceTitle ? <p className="collaboration-field-error">{fieldErrors.practiceTitle}</p> : null}
						</div>

						<div className="collaboration-field collaboration-field--wide">
							<label htmlFor="practiceSummary">Short summary</label>
							<textarea id="practiceSummary" name="practiceSummary" rows={3} placeholder="One or two sentences explaining the practice" aria-invalid={fieldErrors.practiceSummary ? "true" : "false"} className={fieldErrors.practiceSummary ? "collaboration-input-error" : undefined} />
							{fieldErrors.practiceSummary ? <p className="collaboration-field-error">{fieldErrors.practiceSummary}</p> : null}
						</div>

						<div className="collaboration-field collaboration-field--wide">
							<label htmlFor="practiceDescription">Full description</label>
							<textarea id="practiceDescription" name="practiceDescription" rows={6} placeholder="Explain the practice, its context, and why it should be added" aria-invalid={fieldErrors.practiceDescription ? "true" : "false"} className={fieldErrors.practiceDescription ? "collaboration-input-error" : undefined} />
							{fieldErrors.practiceDescription ? <p className="collaboration-field-error">{fieldErrors.practiceDescription}</p> : null}
						</div>

						<div className="collaboration-field collaboration-field--wide">
							<label htmlFor="practiceExamples">Examples <span className="collaboration-optional">optional</span></label>
							<textarea id="practiceExamples" name="practiceExamples" rows={4} placeholder="Show one or more example usages of this practice" />
						</div>

						<div className="collaboration-field collaboration-field--wide">
							<label htmlFor="hyperparameters">Hyperparameters <span className="collaboration-optional">optional</span></label>
							<textarea id="hyperparameters" name="hyperparameters" rows={3} placeholder="List any relevant settings, values, or tuning notes" />
						</div>

						<div className="collaboration-field collaboration-field--wide">
							<label htmlFor="promptTechniques">Prompt techniques <span className="collaboration-optional">optional</span></label>
							<textarea id="promptTechniques" name="promptTechniques" rows={3} placeholder="Mention any techniques, patterns, or strategies used" />
						</div>

						<div className="collaboration-field collaboration-field--wide">
							<label htmlFor="sourcePdf">Supporting PDF</label>
							<input id="sourcePdf" name="sourcePdf" type="file" accept="application/pdf" aria-invalid={fieldErrors.sourcePdf ? "true" : "false"} className={fieldErrors.sourcePdf ? "collaboration-input-error" : undefined} />
							<p className="collaboration-help-text">Attach the paper or article PDF that proves the practice source.</p>
							{fieldErrors.sourcePdf ? <p className="collaboration-field-error">{fieldErrors.sourcePdf}</p> : null}
						</div>
					</div>

					<div className="collaboration-field collaboration-field--wide">
						<label htmlFor="referenceLink">Reference link</label>
						<input id="referenceLink" name="referenceLink" type="url" placeholder="https://example.com/paper" aria-invalid={fieldErrors.referenceLink ? "true" : "false"} className={fieldErrors.referenceLink ? "collaboration-input-error" : undefined} />
						<p className="collaboration-help-text">Add a direct link to the paper or article that supports the practice.</p>
						{fieldErrors.referenceLink ? <p className="collaboration-field-error">{fieldErrors.referenceLink}</p> : null}
					</div>
					{isAdmin ? (
						null
					) : (
						<div className="collaboration-form-actions">
							{formErrorMessage ? <p className="error-message collaboration-submit-error">{formErrorMessage}</p> : null}
							<button type="submit" className="collaboration-primary-btn" disabled={isCheckingAccess}>
								{isCheckingAccess ? "Checking access..." : "Submit for review"}
							</button>
						</div>
					)}
				</form>
			</div>
		</section>
	);
}

function CollaborationPageContent({
	formRef,
	isCheckingAccess,
	modalState,
	fieldErrors,
	formErrorMessage,
	setModalState,
	handleSubmit,
	handleMyRequestsClick,
	handleListAllRequestsClick,
	canListAllRequests,
}: Readonly<{
	formRef: RefObject<HTMLFormElement | null>;
	isCheckingAccess: boolean;
	modalState: ModalState | null;
	fieldErrors: FieldErrors;
	formErrorMessage: string | null;
	setModalState: Dispatch<SetStateAction<ModalState | null>>;
	handleSubmit: (event: FormSubmitEvent) => void;
	handleMyRequestsClick: () => void;
	handleListAllRequestsClick: () => void;
	canListAllRequests: boolean;
}>) {
	return (
		<main className="collaboration-page">
			<CollaborationStatusOverlay modalState={modalState} onClose={() => setModalState(null)} />
			<div className="collaboration-page-header">
				<h1 className="collaboration-page-title">Collaboration</h1>
				<div className="collaboration-form-actions">
					{canListAllRequests ? (
						<button type="button" className="hollow-btn" onClick={handleListAllRequestsClick}>
							List all requests
						</button>
					) : (
						<button type="button" className="hollow-btn" onClick={handleMyRequestsClick}>
							My requests
						</button>
					)}
				</div>
			</div>
			<div className="collaboration-shell">
				<CollaborationIntroPanel />
				<CollaborationRequestForm
					formRef={formRef}
					isCheckingAccess={isCheckingAccess}
					fieldErrors={fieldErrors}
					formErrorMessage={formErrorMessage}
					onSubmit={handleSubmit}
					isAdmin={canListAllRequests}
				/>
			</div>
		</main>
	);
}

export default function CollaboratePage() {
	const formRef = useRef<HTMLFormElement | null>(null);
	const router = useRouter();
	const [isCheckingAccess, setIsCheckingAccess] = useState(false);
	const [modalState, setModalState] = useState<ModalState | null>(null);
	const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
	const [canListAllRequests, setCanListAllRequests] = useState(false);

	useEffect(() => {
		let isMounted = true;

		const loadAccess = async () => {
			const authenticatedSession = await getAuthenticatedSession();

			if (!isMounted) {
				return;
			}

			setCanListAllRequests(authenticatedSession?.role === "ADMIN");
		};

		void loadAccess();

		return () => {
			isMounted = false;
		};
	}, []);

	const handleSubmit = (event: FormSubmitEvent) => {
		event.preventDefault();
		void submitCollaborationRequest({
			formRef,
			isCheckingAccess,
			setIsCheckingAccess,
			setModalState,
			setFormErrorMessage,
			setFieldErrors,
			getAuthenticatedSession,
		});
	};

	const handleMyRequestsClick = () => {
		void navigateToMyRequests({
			setModalState,
			getAuthenticatedSession,
			routerPush: (href: string) => router.push(href),
		});
	};

	const handleListAllRequestsClick = () => {
		router.push("/collaboration/requests");
	};

	return (
		<CollaborationPageContent
			formRef={formRef}
			isCheckingAccess={isCheckingAccess}
			modalState={modalState}
			fieldErrors={fieldErrors}
			formErrorMessage={formErrorMessage}
			setModalState={setModalState}
			handleSubmit={handleSubmit}
			handleMyRequestsClick={handleMyRequestsClick}
			handleListAllRequestsClick={handleListAllRequestsClick}
			canListAllRequests={canListAllRequests}
		/>
	);
}