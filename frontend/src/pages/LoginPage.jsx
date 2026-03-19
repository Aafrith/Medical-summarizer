import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const destination = location.state?.from || "/dashboard";

  if (isAuthenticated) {
    return <Navigate to={destination} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login({ email, password, rememberMe });
      navigate(destination, { replace: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page-shell">
      <div className="auth-card section">
        <p className="kicker">Secure Access</p>
        <h2>Sign In To Your Workspace</h2>
        <p className="subtle-text">Use your credentials to access document processing and summary history.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Work Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@organization.com"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimum 8 characters"
              required
              minLength={8}
            />
          </label>

          <label className="remember-row">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            Keep me signed in on this device
          </label>

          {error ? <div className="auth-error">{error}</div> : null}

          <button type="submit" className="primary-btn" disabled={submitting}>
            {submitting ? "Signing In..." : "Sign In Securely"}
          </button>
        </form>

        <p className="auth-switch">
          New to the platform? <Link to="/signup">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
