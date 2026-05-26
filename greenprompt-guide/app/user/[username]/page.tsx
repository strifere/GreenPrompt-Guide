"use client";

import { useParams, useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent, type Dispatch, type SetStateAction, type SyntheticEvent } from "react";

type UserProfile = {
	username: string;
	email: string;
};

type Feedback = {
	kind: "success" | "error";
	message: string;
} | null;

function FeedbackBanner({ feedback }: Readonly<{ feedback: Feedback }>) {
	if (!feedback) {
		return null;
	}

	return <div className={feedback.kind === "error" ? "error-message" : "user-success-message"}>{feedback.message}</div>;
}

type EmailChangeModalProps = {
	isOpen: boolean;
	currentEmail: string;
	onClose: () => void;
	onSuccess: (email: string) => void;
};

type EmailStep = "email" | "code" | "success";

type DeleteAccountModalProps = {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: (currentPassword: string) => Promise<void>;
	onSuccess: () => void;
};

type LoadProfileParams = {
	router: ReturnType<typeof useRouter>;
	routeUsername?: string;
	setProfile: Dispatch<SetStateAction<UserProfile>>;
	setUsernameDraft: Dispatch<SetStateAction<string>>;
};

async function loadProfile({ router, routeUsername, setProfile, setUsernameDraft }: LoadProfileParams) {
	try {
		const response = await fetch("/api/auth/profile", {
			method: "GET",
			credentials: "include",
			cache: "no-store",
		});

		const data = await response.json();

		if (!response.ok) {
			if (response.status === 401) {
				router.replace("/login");
				return;
			}

			console.error(data.error || "Failed to load user details");
			return;
		}

		setProfile(data.user);
		setUsernameDraft(data.user.username);

		if (routeUsername && routeUsername !== data.user.username) {
			router.replace(`/user/${data.user.username}`);
		}
	} catch (profileError) {
		console.error(
			profileError instanceof Error
				? profileError.message
				: "An error occurred while loading your details"
		);
	}
}

function EmailChangeModal({ isOpen, currentEmail, onClose, onSuccess }: Readonly<EmailChangeModalProps>) {
	const [step, setStep] = useState<EmailStep>("email");
	const [email, setEmail] = useState("");
	const [code, setCode] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [canResend, setCanResend] = useState(false);
	const [resendCountdown, setResendCountdown] = useState(0);
	const resendIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const clearResendInterval = () => {
		if (resendIntervalRef.current) {
			clearInterval(resendIntervalRef.current);
			resendIntervalRef.current = null;
		}
	};

	const startResendCountdown = () => {
		clearResendInterval();
		setCanResend(false);
		setResendCountdown(60);

		resendIntervalRef.current = setInterval(() => {
			setResendCountdown((previousValue) => {
				if (previousValue <= 1) {
					clearResendInterval();
					setCanResend(true);
					return 0;
				}

				return previousValue - 1;
			});
		}, 1000);
	};

	useEffect(() => () => clearResendInterval(), []);

	const resetAndClose = () => {
		clearResendInterval();
		setStep("email");
		setEmail("");
		setCode("");
		setError("");
		setLoading(false);
		setCanResend(false);
		setResendCountdown(0);
		onClose();
	};

	const handleRequestCode = async (event: SyntheticEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError("");
		setLoading(true);

		try {
			const response = await fetch("/api/auth/profile/email/request", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
			});

			const data = await response.json();

			if (!response.ok) {
				setError(data.error || "Failed to send verification code");
				return;
			}

			setStep("code");
			startResendCountdown();
		} catch (requestError) {
			setError(
				"An error occurred: " +
					(requestError instanceof Error ? requestError.message : "Please try again.")
			);
		} finally {
			setLoading(false);
		}
	};

	const handleResendCode = async () => {
		setError("");
		setLoading(true);

		try {
			const response = await fetch("/api/auth/profile/email/request", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
			});

			const data = await response.json();

			if (!response.ok) {
				setError(data.error || "Failed to resend verification code");
				return;
			}

			setCode("");
			startResendCountdown();
		} catch (requestError) {
			setError(
				"An error occurred: " +
					(requestError instanceof Error ? requestError.message : "Please try again.")
			);
		} finally {
			setLoading(false);
		}
	};

	const handleVerifyCode = async (event: SyntheticEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError("");
		setLoading(true);

		try {
			const response = await fetch("/api/auth/profile/email/verify", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, code }),
			});

			const data = await response.json();

			if (!response.ok) {
				setError(data.error || "Failed to verify code");
				return;
			}

			onSuccess(data.user?.email || email);
			setStep("success");
		} catch (requestError) {
			setError(
				"An error occurred: " +
					(requestError instanceof Error ? requestError.message : "Please try again.")
			);
		} finally {
			setLoading(false);
		}
	};

	if (!isOpen) {
		return null;
	}

	return (
		<div className="recovery-modal-overlay">
			<button
				type="button"
				className="recovery-modal-backdrop"
				aria-label="Close email change modal"
				onClick={resetAndClose}
			/>
			<div className="recovery-modal">
				<button className="recovery-modal-close" onClick={resetAndClose}>
					✕
				</button>

				{step === "email" && (
					<>
						<h2>Change Your Email</h2>
						<p>Enter a new email address and we will send a verification code to it.</p>

						{error && <div className="error-message">{error}</div>}

						<form onSubmit={handleRequestCode} className="recovery-form">
							<div className="form-group">
								<label htmlFor="new-email">New Email</label>
								<input
									type="email"
									id="new-email"
									value={email}
									onChange={(event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
									placeholder={currentEmail}
									required
									autoComplete="email"
								/>
							</div>

							<button type="submit" className="recovery-btn" disabled={loading}>
								{loading ? "Sending..." : "Send verification code"}
							</button>
						</form>
					</>
				)}

				{step === "code" && (
					<>
						<h2>Verify Your Email</h2>
						<p>We have sent a code to {email}</p>

						{error && <div className="error-message">{error}</div>}

						<form onSubmit={handleVerifyCode} className="recovery-form">
							<div className="form-group">
								<label htmlFor="email-code">Verification Code</label>
								<input
									type="text"
									id="email-code"
									value={code}
									onChange={(event: ChangeEvent<HTMLInputElement>) => setCode(event.target.value.toUpperCase())}
									placeholder="e.g., ABC123"
									required
								/>
							</div>

							<button type="submit" className="recovery-btn" disabled={loading}>
								{loading ? "Verifying..." : "Verify email"}
							</button>
						</form>

						<div className="recovery-footer">
							<button
								type="button"
								className="resend-btn"
								onClick={handleResendCode}
								disabled={!canResend || loading}
							>
								{canResend ? "Resend code" : `Resend in ${resendCountdown}s`}
							</button>
						</div>
					</>
				)}

				{step === "success" && (
					<>
						<h2>Email Changed Successfully</h2>
						<p>Your email has been updated. The new address is now linked to your account.</p>

						<button className="recovery-btn" onClick={resetAndClose}>
							OK
						</button>
					</>
				)}
			</div>
		</div>
	);
}

function DeleteAccountModal({ isOpen, onClose, onConfirm, onSuccess }: Readonly<DeleteAccountModalProps>) {
	const [currentPassword, setCurrentPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const resetAndClose = () => {
		setCurrentPassword("");
		setShowPassword(false);
		setError("");
		setLoading(false);
		onClose();
	};

	const handleDelete = async (event: SyntheticEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError("");
		setLoading(true);

		try {
			await onConfirm(currentPassword);
			resetAndClose();
			onSuccess();
		} catch (deleteError) {
			setError(
				deleteError instanceof Error
					? deleteError.message
					: "An error occurred while deleting your account"
			);
		} finally {
			setLoading(false);
		}
	};

	if (!isOpen) {
		return null;
	}

	return (
		<div className="recovery-modal-overlay">
			<button
				type="button"
				className="recovery-modal-backdrop"
				aria-label="Close delete account modal"
				onClick={resetAndClose}
			/>
			<div className="recovery-modal">
				<button type="button" className="recovery-modal-close" onClick={resetAndClose}>
					✕
				</button>

				<h2>Delete Your Account</h2>
				<p>
					This will permanently erase your account and all related data from the system. Confirm your
					current password to continue.
				</p>

				{error && <div className="error-message">{error}</div>}

				<form onSubmit={handleDelete} className="recovery-form">
					<div className="form-group">
						<label htmlFor="delete-account-password">Current Password</label>
						<div className="password-field">
							<input
								type={showPassword ? "text" : "password"}
								id="delete-account-password"
								value={currentPassword}
								onChange={(event: ChangeEvent<HTMLInputElement>) => setCurrentPassword(event.target.value)}
								placeholder="current password here..."
								autoComplete="current-password"
								required
							/>
							<button
								type="button"
								className="password-visibility-toggle"
								aria-label={showPassword ? "Hide current password" : "Show current password"}
								aria-pressed={showPassword}
								onClick={() => setShowPassword((currentValue) => !currentValue)}
							>
								{showPassword ? "Hide" : "Show"}
							</button>
						</div>
					</div>

					<div className="recovery-footer recovery-footer-inline">
						<button type="button" className="ghost-btn" onClick={resetAndClose}>
							Cancel
						</button>
						<button type="submit" className="danger-btn" disabled={loading}>
							{loading ? "Deleting..." : "Delete definitely"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

export default function UserProfilePage() {
	const router = useRouter();
	const params = useParams<{ username?: string | string[] }>();
	const [profile, setProfile] = useState<UserProfile>({ username: "", email: "" });
	const [isEditingUsername, setIsEditingUsername] = useState(false);
	const [usernameDraft, setUsernameDraft] = useState("");
	const [usernameLoading, setUsernameLoading] = useState(false);
	const [usernameFeedback, setUsernameFeedback] = useState<Feedback>(null);
	const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [passwordForm, setPasswordForm] = useState({
		currentPassword: "",
		password: "",
		passwordConfirm: "",
	});
	const [showCurrentPassword, setShowCurrentPassword] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [passwordLoading, setPasswordLoading] = useState(false);
	const [passwordFeedback, setPasswordFeedback] = useState<Feedback>(null);

	const routeUsername = Array.isArray(params.username) ? params.username[0] : params.username;

	useEffect(() => {
		void loadProfile({ router, routeUsername, setProfile, setUsernameDraft });
	}, [routeUsername, router]);

	const handleUsernameEditOpen = () => {
		setUsernameFeedback(null);
		setUsernameDraft(profile?.username || "");
		setIsEditingUsername(true);
	};

	const handleUsernameCancel = () => {
		setIsEditingUsername(false);
		setUsernameDraft(profile?.username || "");
		setUsernameFeedback(null);
	};

	const handleUsernameSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
		event.preventDefault();

		setUsernameLoading(true);
		setUsernameFeedback(null);

		try {
			const response = await fetch("/api/auth/profile/username", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username: usernameDraft }),
			});

			const data = await response.json();

			if (!response.ok) {
				setUsernameFeedback({ kind: "error", message: data.error || "Failed to update username" });
				return;
			}

			setProfile(data.user);
			setUsernameDraft(data.user.username);
			setIsEditingUsername(false);
			setUsernameFeedback({ kind: "success", message: data.message || "Username updated successfully" });
			globalThis.dispatchEvent(new Event("auth-changed"));
			router.replace(`/user/${data.user.username}`);
		} catch (usernameError) {
			setUsernameFeedback({
				kind: "error",
				message:
					usernameError instanceof Error
						? usernameError.message
						: "An error occurred while updating the username",
			});
		} finally {
			setUsernameLoading(false);
		}
	};

	const handlePasswordChange = async (event: SyntheticEvent<HTMLFormElement>) => {
		event.preventDefault();

		// Quick client-side check: if the user entered the same new password as
		// their current password in the form, warn immediately to avoid an
		// unnecessary round-trip. The server will also enforce this check.
		if (passwordForm.password === passwordForm.currentPassword) {
			setPasswordFeedback({ kind: "error", message: "New password must be different from the current password" });
			return;
		}

		setPasswordLoading(true);
		setPasswordFeedback(null);

		try {
			const response = await fetch("/api/auth/profile/password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(passwordForm),
			});

			const data = await response.json();

			if (!response.ok) {
				setPasswordFeedback({ kind: "error", message: data.error || "Failed to change password" });
				return;
			}

			setPasswordForm({ currentPassword: "", password: "", passwordConfirm: "" });
			setShowCurrentPassword(false);
			setShowNewPassword(false);
			setShowConfirmPassword(false);
			setPasswordFeedback({ kind: "success", message: data.message || "Password changed successfully" });
		} catch (passwordError) {
			setPasswordFeedback({
				kind: "error",
				message:
					passwordError instanceof Error
						? passwordError.message
						: "An error occurred while changing the password",
			});
		} finally {
			setPasswordLoading(false);
		}
	};

	const handleDeleteAccount = async (currentPassword: string) => {
		const response = await fetch("/api/auth/profile/delete", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ currentPassword }),
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.error || "Failed to delete account");
		}
	};

	const handleDeleteSuccess = () => {
		setIsDeleteModalOpen(false);
		globalThis.dispatchEvent(new Event("auth-changed"));
		router.replace("/");
	};

	return (
		<>
			<main className="user-page">
				<div className="user-page-shell">
					<section className="user-hero">
						<p className="user-page-kicker">Account</p>
						<h1 className="user-page-title">Your details</h1>
						<p className="user-page-description">
							Update your username, confirm a new email address, and change your password from one place.
						</p>
					</section>

					<FeedbackBanner feedback={usernameFeedback} />

					<section className="user-card">
						<div className="user-detail-row">
							<div>
								<h2 className="user-detail-label">Username</h2>
								{isEditingUsername ? (
									<form className="user-inline-form" onSubmit={handleUsernameSubmit}>
										<div className="form-group user-inline-input">
											<label htmlFor="username-edit" className="sr-only">
												Username
											</label>
											<input
												id="username-edit"
												value={usernameDraft}
												onChange={(event: ChangeEvent<HTMLInputElement>) => setUsernameDraft(event.target.value)}
												autoComplete="off"
												required
											/>
										</div>
										<div className="user-actions-row">
											<button type="submit" className="solid-btn" disabled={usernameLoading}>
												{usernameLoading ? "Saving..." : "Save username"}
											</button>
											<button type="button" className="ghost-btn" onClick={handleUsernameCancel}>
												Cancel
											</button>
										</div>
									</form>
								) : (
											<p className="user-detail-value">{profile.username}</p>
								)}
							</div>
							{!isEditingUsername && (
								<button type="button" className="user-icon-button" onClick={handleUsernameEditOpen} aria-label="Edit username">
									<Pencil size={18} />
								</button>
							)}
						</div>

						<div className="user-detail-row">
							<div>
								<h2 className="user-detail-label">Email</h2>
								<p className="user-detail-value">{profile.email}</p>
							</div>
							<button
								type="button"
								className="user-icon-button"
								onClick={() => setIsEmailModalOpen(true)}
								aria-label="Edit email"
							>
								<Pencil size={18} />
							</button>
						</div>
					</section>

					<section className="user-card">
						<div className="user-section-heading">
							<h2 className="user-section-title">Change password</h2>
							<p className="user-section-description">
								Confirm your current password before setting a new one.
							</p>
						</div>

						<FeedbackBanner feedback={passwordFeedback} />

						<form className="user-password-form" onSubmit={handlePasswordChange}>
							<div className="user-password-grid">
								<div className="form-group">
									<label htmlFor="current-password">Confirm current password</label>
									<div className="password-field">
										<input
											type={showCurrentPassword ? "text" : "password"}
											id="current-password"
											value={passwordForm.currentPassword}
											onChange={(event: ChangeEvent<HTMLInputElement>) =>
												setPasswordForm((previousValue) => ({ ...previousValue, currentPassword: event.target.value }))
											}
											placeholder="current password here..."
											autoComplete="current-password"
											required
										/>
										<button
											type="button"
											className="password-visibility-toggle"
											aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
											aria-pressed={showCurrentPassword}
											onClick={() => setShowCurrentPassword((currentValue) => !currentValue)}
										>
											{showCurrentPassword ? "Hide" : "Show"}
										</button>
									</div>
								</div>

								<div className="form-group">
									<label htmlFor="new-password">New password</label>
									<div className="password-field">
										<input
											type={showNewPassword ? "text" : "password"}
											id="new-password"
											value={passwordForm.password}
											onChange={(event: ChangeEvent<HTMLInputElement>) =>
												setPasswordForm((previousValue) => ({ ...previousValue, password: event.target.value }))
											}
											placeholder="type your new password here..."
											autoComplete="new-password"
											required
										/>
										<button
											type="button"
											className="password-visibility-toggle"
											aria-label={showNewPassword ? "Hide new password" : "Show new password"}
											aria-pressed={showNewPassword}
											onClick={() => setShowNewPassword((currentValue) => !currentValue)}
										>
											{showNewPassword ? "Hide" : "Show"}
										</button>
									</div>
								</div>

								<div className="form-group">
									<label htmlFor="confirm-password">Confirm new password</label>
									<div className="password-field">
										<input
											type={showConfirmPassword ? "text" : "password"}
											id="confirm-password"
											value={passwordForm.passwordConfirm}
											onChange={(event: ChangeEvent<HTMLInputElement>) =>
												setPasswordForm((previousValue) => ({
													...previousValue,
													passwordConfirm: event.target.value,
												}))
											}
											placeholder="confirm your new password here..."
											autoComplete="new-password"
											required
										/>
										<button
											type="button"
											className="password-visibility-toggle"
											aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
											aria-pressed={showConfirmPassword}
											onClick={() => setShowConfirmPassword((currentValue) => !currentValue)}
										>
											{showConfirmPassword ? "Hide" : "Show"}
										</button>
									</div>
								</div>
							</div>

							<div className="user-actions-row user-actions-row-end">
								<button type="submit" className="green-btn" disabled={passwordLoading}>
									{passwordLoading ? "Changing..." : "Change password"}
								</button>
							</div>
						</form>
					</section>

								<section className="user-card user-danger-card">
							<div className="user-section-heading">
								<h2 className="user-section-title">Delete account</h2>
								<p className="user-section-description">
									This permanently erases your account and signs you out of the system.
								</p>
							</div>

							<div className="user-actions-row user-actions-row-end">
								<button type="button" className="danger-btn" onClick={() => setIsDeleteModalOpen(true)}>
									Delete account
								</button>
							</div>
						</section>
				</div>
			</main>

			<EmailChangeModal
				isOpen={isEmailModalOpen}
				currentEmail={profile.email}
				onClose={() => setIsEmailModalOpen(false)}
				onSuccess={(email) => setProfile((previousValue) => ({ ...previousValue, email }))}
			/>
			<DeleteAccountModal
				isOpen={isDeleteModalOpen}
				onClose={() => setIsDeleteModalOpen(false)}
				onConfirm={handleDeleteAccount}
				onSuccess={handleDeleteSuccess}
			/>
		</>
	);
}
