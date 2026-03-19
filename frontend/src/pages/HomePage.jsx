import { useNavigate } from "react-router-dom";
import { coreCapabilities, trustHighlights } from "../data/featureContent";
import { useAuth } from "../context/AuthContext";

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <header className="hero section">
        <p className="tag">Enterprise Clinical Intelligence</p>
        <h1>Transform Medical Documents Into Bilingual Insights</h1>
        <p className="hero-copy">
          MedSummary Pro helps teams process single or multi-document submissions and deliver structured
          English and Sinhala summaries for fast review and confident decision making.
        </p>

        <div className="hero-cta-row">
          <button
            type="button"
            className="primary-btn"
            onClick={() => navigate(isAuthenticated ? "/dashboard" : "/login")}
          >
            {isAuthenticated ? "Open Workspace" : "Start Secure Session"}
          </button>
          <button type="button" className="ghost-btn" onClick={() => navigate("/security")}>
            View Security
          </button>
        </div>
      </header>

      <section className="panel section">
        <div className="panel-header-row">
          <div>
            <p className="kicker">Core Capabilities</p>
            <h2>Built For Scalable Clinical Workflows</h2>
          </div>
        </div>

        <div className="capability-grid">
          {coreCapabilities.map((item) => (
            <article key={item.title} className="capability-card">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel section">
        <div className="panel-header-row">
          <div>
            <p className="kicker">Trust & Governance</p>
            <h2>Security and Reliability Highlights</h2>
          </div>
        </div>

        <ul className="trust-list">
          {trustHighlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
