"use client";

import { useEffect, useRef, useState, type ChangeEvent, type SyntheticEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function SignupForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });
  const [isAdministrator, setIsAdministrator] = useState(false);
  const [adminAuthCode, setAdminAuthCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [error, setError] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [isVerificationDialogOpen, setIsVerificationDialogOpen] = useState(false);
  const [isVerificationCodeSent, setIsVerificationCodeSent] = useState(false);
  const [canResendVerificationCode, setCanResendVerificationCode] = useState(false);
  const [verificationResendCountdown, setVerificationResendCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const resendTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearVerificationCountdown = () => {
    if (resendTimerRef.current) {
      clearInterval(resendTimerRef.current);
      resendTimerRef.current = null;
    }
  };

  const startVerificationCountdown = () => {
    clearVerificationCountdown();
    setCanResendVerificationCode(false);
    setVerificationResendCountdown(60);

    resendTimerRef.current = setInterval(() => {
      setVerificationResendCountdown((previousValue) => {
        if (previousValue <= 1) {
          clearVerificationCountdown();
          setCanResendVerificationCode(true);
          return 0;
        }

        return previousValue - 1;
      });
    }, 1000);
  };

  useEffect(() => () => clearVerificationCountdown(), []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAdminToggle = () => {
    setIsAdministrator((currentValue) => {
      const nextValue = !currentValue;

      if (!nextValue) {
        setAdminAuthCode("");
      }

      return nextValue;
    });
  };

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setVerificationError("");
    setVerificationCode("");
    setIsVerificationDialogOpen(true);
    setIsVerificationCodeSent(false);
    setCanResendVerificationCode(false);
    setVerificationResendCountdown(0);
    clearVerificationCountdown();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup/request-email-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to send verification code");
        setIsVerificationDialogOpen(false);
        setLoading(false);
        return;
      }

      setIsVerificationCodeSent(true);
      setLoading(false);
      startVerificationCountdown();
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An error occurred. Please try again.");
      }
      setIsVerificationDialogOpen(false);
      setLoading(false);
    }
  };

  const handleVerificationSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setVerificationError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          verificationCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setVerificationError(data.error || "Failed to verify email");
        setLoading(false);
        return;
      }

      setIsVerificationDialogOpen(false);
      clearVerificationCountdown();
      router.push("/catalog");
    } catch (error: unknown) {
      if (error instanceof Error) {
        setVerificationError(error.message);
      } else {
        setVerificationError("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerificationCode = async () => {
    setVerificationError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup/request-email-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setVerificationError(data.error || "Failed to resend verification code");
        setLoading(false);
        return;
      }

      setVerificationCode("");
      startVerificationCountdown();
    } catch (error: unknown) {
      if (error instanceof Error) {
        setVerificationError(error.message);
      } else {
        setVerificationError("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCloseVerificationDialog = () => {
    setIsVerificationDialogOpen(false);
    setIsVerificationCodeSent(false);
    setVerificationCode("");
    setVerificationError("");
    setCanResendVerificationCode(false);
    setVerificationResendCountdown(0);
    clearVerificationCountdown();
  };

  return (
    <div className="auth-form-container">
      <div className="auth-form-wrapper">
        <h1>Create an account</h1>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="password"
              />
              <button
                type="button"
                className="password-visibility-toggle"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((currentValue) => !currentValue)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="passwordConfirm">Confirm Password</label>
            <div className="password-field">
              <input
                type={showPasswordConfirm ? "text" : "password"}
                id="passwordConfirm"
                name="passwordConfirm"
                value={formData.passwordConfirm}
                onChange={handleChange}
                required
                placeholder="confirm password"
              />
              <button
                type="button"
                className="password-visibility-toggle"
                aria-label={showPasswordConfirm ? "Hide confirm password" : "Show confirm password"}
                aria-pressed={showPasswordConfirm}
                onClick={() => setShowPasswordConfirm((currentValue) => !currentValue)}
              >
                {showPasswordConfirm ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="admin-toggle-row">
            <span className="admin-toggle-label">Are you an administrator?</span>
            <button
              type="button"
              className="admin-toggle"
              role="switch"
              aria-checked={isAdministrator}
              aria-label="Toggle administrator account"
              data-on={isAdministrator}
              onClick={handleAdminToggle}
            >
              <span className="admin-toggle-thumb" />
            </button>
          </div>

          {isAdministrator && (
            <div className="form-group admin-code-group">
              <label htmlFor="adminAuthCode">Admin auth. code</label>
              <input
                type="text"
                id="adminAuthCode"
                name="adminAuthCode"
                value={adminAuthCode}
                onChange={(event) => setAdminAuthCode(event.target.value)}
                placeholder="Admin auth. code"
              />
            </div>
          )}

          <button type="submit" className="signup-create-btn" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="auth-form-footer">
          Already have an account?{" "}
          <Link href="/login" className="animated-link">
            Log in here
          </Link>
        </p>
      </div>

      {isVerificationDialogOpen && (
        <div className="recovery-modal-overlay">
          <button
            type="button"
            className="recovery-modal-backdrop"
            aria-label="Close email verification dialog"
            onClick={handleCloseVerificationDialog}
          />
          <div className="recovery-modal">
            <button className="recovery-modal-close" onClick={handleCloseVerificationDialog}>
              ✕
            </button>

            <h2>Verify your email</h2>

            {verificationError && <div className="error-message">{verificationError}</div>}

            {isVerificationCodeSent ? (
              <>
                <p>We sent a verification code to {formData.email}</p>

                <form onSubmit={handleVerificationSubmit} className="recovery-form">
                  <div className="form-group">
                    <label htmlFor="signup-verification-code">Verification Code</label>
                    <input
                      type="text"
                      id="signup-verification-code"
                      value={verificationCode}
                      onChange={(event) => setVerificationCode(event.target.value.toUpperCase())}
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
                    onClick={handleResendVerificationCode}
                    disabled={!canResendVerificationCode || loading}
                  >
                    {canResendVerificationCode
                      ? "Resend code"
                      : `Resend in ${verificationResendCountdown}s`}
                  </button>
                </div>
              </>
            ) : (
              <p>Sending verification code to {formData.email}...</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
