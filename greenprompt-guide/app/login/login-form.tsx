"use client";

import { useState, type ChangeEvent, type SyntheticEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PasswordRecoveryModal } from "@/app/ui/password-recovery-modal";

export function LoginForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to log in");
        setLoading(false);
        return;
      }

      // Redirect to catalog after successful login
      router.push("/catalog");
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An error occurred. Please try again.");
      }
      setLoading(false);
    }
  };

  return (
    <>
      <div className="auth-form-container">
        <div className="auth-form-wrapper">
          <h1>Log in</h1>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="identifier">Username or email</label>
              <input
                type="text"
                id="identifier"
                name="identifier"
                value={formData.identifier}
                onChange={handleChange}
                required
                placeholder="username or email"
                autoComplete="username"
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
                  autoComplete="current-password"
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

            <button
              type="button"
              className="login-helper-link"
              onClick={() => setIsRecoveryModalOpen(true)}
            >
              Forgot your password?
            </button>

            <button
              type="submit"
              className="login-outline-btn"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <div className="login-separator" aria-hidden="true">
            <span>or</span>
          </div>

          <Link href="/signup" className="login-create-account-btn">
            Create an account
          </Link>
        </div>
      </div>

      <PasswordRecoveryModal
        isOpen={isRecoveryModalOpen}
        onClose={() => setIsRecoveryModalOpen(false)}
      />
    </>
  );
}
