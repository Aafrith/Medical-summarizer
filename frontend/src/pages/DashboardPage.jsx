import { useSummary } from "../context/SummaryContext";
import ProcessingTable from "../components/ProcessingTable";
import SummaryCard from "../components/SummaryCard";
import UploadZone from "../components/UploadZone";

export default function DashboardPage() {
  const {
    jobs,
    isRunning,
    notice,
    pendingJobs,
    completedJobs,
    failedJobs,
    overallProgress,
    addFiles,
    startProcessing,
    retryOne,
    removeJob,
    clearAll,
    clearCompleted,
  } = useSummary();

  return (
    <div className="app-shell">
      <header className="hero section">
        <p className="tag">Clinical Intelligence Platform</p>
        <h1>Medical Document Summary Center</h1>
        <p className="hero-copy">
          Upload one or many medical documents and receive clear, document-level summaries in English and
          Sinhala in one run. Designed for both mixed-topic collections and same-topic timeline comparisons.
        </p>

        <div className="hero-metrics">
          <div className="metric-card">
            <span>Documents Uploaded</span>
            <strong>{jobs.length}</strong>
          </div>
          <div className="metric-card">
            <span>Ready</span>
            <strong>{completedJobs.length}</strong>
          </div>
          <div className="metric-card">
            <span>Needs Attention</span>
            <strong>{failedJobs.length}</strong>
          </div>
          <div className="metric-card">
            <span>Batch Progress</span>
            <strong>{overallProgress}%</strong>
          </div>
        </div>
      </header>

      <main>
        <UploadZone
          onAddFiles={addFiles}
          disabled={isRunning}
          selectedCount={jobs.length}
          running={isRunning}
          onClearAll={clearAll}
          onClearCompleted={clearCompleted}
        />

        <section className="panel section" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <button
            type="button"
            className="primary-btn"
            style={{ padding: "1rem", fontSize: "1.05rem" }}
            disabled={isRunning || pendingJobs.length === 0}
            onClick={() => startProcessing()}
          >
            {isRunning ? "Preparing..." : "Generate Summaries"}
          </button>
          {notice ? <div className="notice">{notice}</div> : null}
        </section>

        <ProcessingTable jobs={jobs} onRemove={removeJob} onRetry={retryOne} running={isRunning} />

        {completedJobs.length > 0 ? (
          <section className="panel section">
            <div className="panel-header-row">
              <div>
                <p className="kicker">Results</p>
                <h2>Document Summaries</h2>
                <p className="subtle-text">
                  Each document is presented with dedicated English and Sinhala summaries for easy review.
                </p>
              </div>
            </div>

            <div className="summary-grid">
              {completedJobs.map((job) => (
                <SummaryCard key={job.id} job={job} />
              ))}
            </div>
          </section>
        ) : null}

      </main>
    </div>
  );
}
