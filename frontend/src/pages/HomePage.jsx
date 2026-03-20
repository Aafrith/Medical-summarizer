import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <header className="hero section">
        <p className="tag">Welcome</p>
        <h1>Medical Summarizer</h1>
        <p className="hero-copy">
          Upload your medical documents and generate clear English and Sinhala summaries in one place.
        </p>

        <div className="hero-cta-row">
          <button
            type="button"
            className="primary-btn"
            onClick={() => navigate(isAuthenticated ? "/dashboard" : "/login")}
          >
            Start Summarising
          </button>
        </div>
      </header>

      <section className="panel section">
        <div className="panel-header-row">
          <div>
            <p className="kicker">About This System</p>
            <h2>Simple and Easy to Use</h2>
          </div>
        </div>

        <div className="capability-grid">
          <article className="capability-card">
            <h3>Upload Your Documents</h3>
            <p>Add one file or many files at once in just a few clicks.</p>
          </article>

          <article className="capability-card">
            <h3>Get Clear Summaries</h3>
            <p>Read short and clear summaries in English and Sinhala.</p>
          </article>

          <article className="capability-card">
            <h3>Review with Confidence</h3>
            <p>See your results in one place and keep your work organized.</p>
          </article>
        </div>
      </section>
    </div>
  );
}
