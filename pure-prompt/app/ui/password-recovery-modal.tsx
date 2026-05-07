"use client";

import { useState, ChangeEvent, SyntheticEvent } from "react";

type Step = "email" | "code" | "password" | "success";

type PasswordRecoveryModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function PasswordRecoveryModal({ isOpen, onClose }: Readonly<PasswordRecoveryModalProps>) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  const handleEmailSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/password-recovery/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to send recovery code");
        setLoading(false);
        return;
      }

      setStep("code");
      setCanResend(false);
      setResendCountdown(60);

      // Start resend countdown
      const interval = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError("An error occurred: " + (err instanceof Error ? err.message : "Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/password-recovery/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to resend recovery code");
        setLoading(false);
        return;
      }

      setCode("");
      setCanResend(false);
      setResendCountdown(60);

      // Start resend countdown
      const interval = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError("An error occurred: " + (err instanceof Error ? err.message : "Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/password-recovery/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to verify code");
        setLoading(false);
        return;
      }

      setResetToken(data.resetToken);
      setStep("password");
    } catch (err) {
      setError("An error occurred: " + (err instanceof Error ? err.message : "Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/password-recovery/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken, password, passwordConfirm }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to reset password");
        setLoading(false);
        return;
      }

      setStep("success");
    } catch (err) {
      setError("An error occurred: " + (err instanceof Error ? err.message : "Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep("email");
    setEmail("");
    setCode("");
    setResetToken("");
    setPassword("");
    setPasswordConfirm("");
    setError("");
    setLoading(false);
    setCanResend(false);
    setResendCountdown(0);
    onClose();
  };

  const handleSuccessClose = () => {
    handleClose();
    // The user is already on the login page, so they can now log in with the new password
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="recovery-modal-overlay">
      <button
        type="button"
        className="recovery-modal-backdrop"
        aria-label="Close password recovery modal"
        onClick={handleClose}
      />
      <div className="recovery-modal">
        <button className="recovery-modal-close" onClick={handleClose}>
          ✕
        </button>

        {step === "email" && (
          <>
            <h2>Recover Your Password</h2>
            <p>Enter the email associated with your account</p>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleEmailSubmit} className="recovery-form">
              <div className="form-group">
                <label htmlFor="recovery-email">Email</label>
                <input
                  type="email"
                  id="recovery-email"
                  value={email}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
              </div>

              <button type="submit" className="recovery-btn" disabled={loading}>
                {loading ? "Sending..." : "Verify"}
              </button>
            </form>
          </>
        )}

        {step === "code" && (
          <>
            <h2>Enter Verification Code</h2>
            <p>We have sent a code to {email}</p>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleCodeSubmit} className="recovery-form">
              <div className="form-group">
                <label htmlFor="recovery-code">Verification Code</label>
                <input
                  type="text"
                  id="recovery-code"
                  value={code}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setCode(e.target.value.toUpperCase())
                  }
                  placeholder="e.g., ABC123"
                  required
                />
              </div>

              <button type="submit" className="recovery-btn" disabled={loading}>
                {loading ? "Verifying..." : "Verify"}
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

        {step === "password" && (
          <>
            <h2>Create New Password</h2>
            <p>Enter your new password</p>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handlePasswordSubmit} className="recovery-form">
              <div className="form-group">
                <label htmlFor="recovery-password">New Password</label>
                <input
                  type="password"
                  id="recovery-password"
                  value={password}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setPassword(e.target.value)
                  }
                  placeholder="password"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="recovery-password-confirm">Confirm Password</label>
                <input
                  type="password"
                  id="recovery-password-confirm"
                  value={passwordConfirm}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setPasswordConfirm(e.target.value)
                  }
                  placeholder="confirm password"
                  required
                />
              </div>

              <button type="submit" className="recovery-btn" disabled={loading}>
                {loading ? "Changing..." : "Change Password"}
              </button>
            </form>
          </>
        )}

        {step === "success" && (
          <>
            <h2>Password Changed Successfully</h2>
            <p>Your password has been updated. You can now log in with your new password.</p>

            <button className="recovery-btn" onClick={handleSuccessClose}>
              OK
            </button>
          </>
        )}
      </div>
    </div>
  );
}
