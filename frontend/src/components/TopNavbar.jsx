import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function LinkItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
      end={to === "/"}
    >
      {children}
    </NavLink>
  );
}

export default function TopNavbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="top-nav">
      <div className="brand-wrap">
        <div className="brand-mark" aria-hidden>
          MS
        </div>
        <div>
          <p className="brand-title">MedSummary Pro</p>
          <p className="brand-subtitle">Clinical Document Intelligence</p>
        </div>
      </div>

      <div className="nav-links-wrap">
        <LinkItem to="/">Home</LinkItem>
        <LinkItem to="/security">Security</LinkItem>
        {isAuthenticated ? <LinkItem to="/dashboard">Dashboard</LinkItem> : null}
        {isAuthenticated ? <LinkItem to="/history">History</LinkItem> : null}
      </div>

      <div className="nav-actions">
        {isAuthenticated ? (
          <>
            <div className="user-chip">{user?.name || user?.email || "User"}</div>
            <button type="button" className="ghost-btn" onClick={handleLogout}>
              Sign Out
            </button>
          </>
        ) : (
          <>
            <button type="button" className="ghost-btn nav-signup-btn" onClick={() => navigate("/signup")}>
              Sign Up
            </button>
            <button type="button" className="primary-btn nav-login-btn" onClick={() => navigate("/login")}>
              Secure Login
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
