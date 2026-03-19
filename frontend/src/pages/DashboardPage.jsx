import { useMemo, useState } from "react";
import ArchitectureFlow from "../components/ArchitectureFlow";
import ProcessingTable from "../components/ProcessingTable";
import ScenarioInsight from "../components/ScenarioInsight";
import SummaryCard from "../components/SummaryCard";
import UploadZone from "../components/UploadZone";
import { summarizeDocument } from "../services/summarizerApi";
import { appendHistoryEntries } from "../utils/historyStore";
import { buildBatchInsight } from "../utils/batchInsights";
import { validateFile } from "../utils/fileUtils";

function createJob(file) {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    file,
    phase: "queued",
    progress: 0,
    startedAt: null,
    completedAt: null,
    result: null,
    error: null,
  };
}

export default function DashboardPage() {
  const [jobs, setJobs] = useState([]);
  const [useMock, setUseMock] = useState(true);
  const [apiBaseUrl, setApiBaseUrl] = useState("http://localhost:8000");
  const [isRunning, setIsRunning] = useState(false);
  const [notice, setNotice] = useState("");

  const pendingJobs = jobs.filter((job) => job.phase === "queued" || job.phase === "error");
  const completedJobs = jobs.filter((job) => job.phase === "completed" && job.result);
  const failedJobs = jobs.filter((job) => job.phase === "error");

  const overallProgress = useMemo(() => {
    if (jobs.length === 0) {
      return 0;
    }

    const total = jobs.reduce((sum, job) => sum + job.progress, 0);
    return Math.round(total / jobs.length);
  }, [jobs]);

  const insight = useMemo(() => buildBatchInsight(completedJobs), [completedJobs]);

  const updateJob = (jobId, patch) => {
    setJobs((prevJobs) =>
      prevJobs.map((job) => {
        if (job.id !== jobId) {
          return job;
        }

        if (typeof patch === "function") {
          return patch(job);
        }

        return { ...job, ...patch };
      })
    );
  };

  const addFiles = (incomingFiles) => {
    if (isRunning) {
      return;
    }

    const incoming = Array.isArray(incomingFiles) ? incomingFiles : Array.from(incomingFiles || []);

    if (incoming.length === 0) {
      return;
    }

    const errors = [];

    setJobs((prevJobs) => {
      const nextJobs = [...prevJobs];
      const existingSignatures = new Set(
        prevJobs.map((job) => `${job.file.name.toLowerCase()}__${job.file.size}`)
      );

      for (const file of incoming) {
        const signature = `${file.name.toLowerCase()}__${file.size}`;
        const validationError = validateFile(file);

        if (validationError) {
          errors.push(`${file.name}: ${validationError}`);
          continue;
        }

        if (existingSignatures.has(signature)) {
          errors.push(`${file.name}: duplicate file skipped.`);
          continue;
        }

        existingSignatures.add(signature);
        nextJobs.push(createJob(file));
      }

      return nextJobs;
    });

    if (errors.length > 0) {
      setNotice(errors.slice(0, 4).join(" "));
      return;
    }

    setNotice(`${incoming.length} document(s) added for processing.`);
  };

  const runOne = async (job, config) => {
    updateJob(job.id, {
      phase: "uploading",
      progress: 8,
      startedAt: Date.now(),
      completedAt: null,
      error: null,
      result: null,
    });

    try {
      const result = await summarizeDocument(job.file, {
        ...config,
        onPhaseChange: (phase, progress) => {
          updateJob(job.id, { phase, progress });
        },
      });

      updateJob(job.id, {
        phase: "completed",
        progress: 100,
        completedAt: Date.now(),
        result,
        error: null,
      });

      return {
        ok: true,
        entry: {
          fileName: job.file.name,
          size: job.file.size,
          topic: result.topic,
          publicationYear: result.publicationYear,
          confidence: result.confidence,
          englishSummary: result.englishSummary,
          sinhalaSummary: result.sinhalaSummary,
          keyFindings: result.keyFindings,
        },
      };
    } catch (error) {
      updateJob(job.id, {
        phase: "error",
        progress: 100,
        completedAt: Date.now(),
        result: null,
        error: error instanceof Error ? error.message : "Failed to summarize this document.",
      });

      return { ok: false };
    }
  };

  const startProcessing = async (jobIds) => {
    if (isRunning) {
      return;
    }

    const selectedIds = jobIds ? new Set(jobIds) : null;
    const targetJobs = jobs.filter((job) => {
      const phaseEligible = job.phase === "queued" || job.phase === "error";
      if (!phaseEligible) {
        return false;
      }

      return selectedIds ? selectedIds.has(job.id) : true;
    });

    if (targetJobs.length === 0) {
      setNotice("No documents are currently waiting for processing.");
      return;
    }

    setIsRunning(true);
    setNotice(`Preparing summaries for ${targetJobs.length} document(s)...`);

    const config = {
      useMock,
      apiBaseUrl,
    };

    const outcomes = await Promise.all(targetJobs.map((job) => runOne(job, config)));

    setIsRunning(false);

    const successfulEntries = outcomes.filter((item) => item.ok && item.entry).map((item) => item.entry);
    appendHistoryEntries(successfulEntries);

    const hasErrors = outcomes.some((item) => !item.ok);
    if (hasErrors) {
      setNotice("Processing completed with a few issues. Please retry affected documents.");
      return;
    }

    setNotice("Processing completed successfully. English and Sinhala summaries are ready.");
  };

  const retryOne = (jobId) => {
    startProcessing([jobId]);
  };

  const removeJob = (jobId) => {
    if (isRunning) {
      return;
    }

    setJobs((prevJobs) => prevJobs.filter((job) => job.id !== jobId));
  };

  const clearAll = () => {
    if (isRunning) {
      return;
    }

    setJobs([]);
    setNotice("All documents have been removed.");
  };

  const clearCompleted = () => {
    if (isRunning) {
      return;
    }

    setJobs((prevJobs) => prevJobs.filter((job) => job.phase !== "completed"));
    setNotice("Ready documents have been removed from the list.");
  };

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

        <section className="panel section controls-panel">
          <div className="panel-header-row">
            <div>
              <p className="kicker">Service Settings</p>
              <h2>Run Settings</h2>
              <p className="subtle-text">
                Use preview mode for quick trials or connect your live service endpoint.
              </p>
            </div>
          </div>

          <div className="controls-grid">
            <label className="switch-row" htmlFor="demoMode">
              <span>Preview Mode</span>
              <input
                id="demoMode"
                type="checkbox"
                checked={useMock}
                onChange={(event) => setUseMock(event.target.checked)}
                disabled={isRunning}
              />
            </label>

            <label className="input-stack" htmlFor="apiBase">
              <span>Service URL</span>
              <input
                id="apiBase"
                type="text"
                value={apiBaseUrl}
                onChange={(event) => setApiBaseUrl(event.target.value)}
                disabled={isRunning || useMock}
                placeholder="http://localhost:8000"
              />
            </label>

            <button
              type="button"
              className="primary-btn"
              disabled={isRunning || pendingJobs.length === 0}
              onClick={() => startProcessing()}
            >
              {isRunning ? "Preparing..." : "Generate Summaries"}
            </button>
          </div>

          {notice ? <div className="notice">{notice}</div> : null}
        </section>

        <ProcessingTable jobs={jobs} onRemove={removeJob} onRetry={retryOne} running={isRunning} />

        <ScenarioInsight insight={insight} />

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

        <ArchitectureFlow />
      </main>
    </div>
  );
}
