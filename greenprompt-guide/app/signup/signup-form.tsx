"use client";

import { useState, type ChangeEvent, type SyntheticEvent } from "react";
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
  const [loading, setLoading] = useState(false);

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
    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to sign up");
        setLoading(false);
        return;
      }

      // Redirect to catalog after successful signup
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
    </div>
  );
}
