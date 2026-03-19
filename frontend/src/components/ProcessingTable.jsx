import { formatBytes, formatPhaseLabel } from "../utils/fileUtils";

function getStatusClass(phase) {
  if (phase === "completed") {
    return "status success";
  }

  if (phase === "error") {
    return "status danger";
  }

  if (phase === "queued") {
    return "status idle";
  }

  return "status active";
}

export default function ProcessingTable({ jobs, onRemove, onRetry, running }) {
  if (jobs.length === 0) {
    return (
      <section className="panel section">
        <div className="empty-state">
          <h3>No documents uploaded yet</h3>
          <p>Upload clinical documents to begin preparing English and Sinhala summaries.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="panel section">
      <div className="panel-header-row">
        <div>
          <p className="kicker">Processing</p>
          <h2>Document Status</h2>
          <p className="subtle-text">Track progress for every document in this submission.</p>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>File</th>
              <th>Size</th>
              <th>Status</th>
              <th>Progress</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id}>
                <td>
                  <div className="doc-name">{job.file.name}</div>
                  {job.result?.topic ? <div className="doc-topic">{job.result.topic}</div> : null}
                  {job.error ? <div className="row-error">{job.error}</div> : null}
                </td>
                <td>{formatBytes(job.file.size)}</td>
                <td>
                  <span className={getStatusClass(job.phase)}>{formatPhaseLabel(job.phase)}</span>
                </td>
                <td>
                  <div className="progress-shell" role="progressbar" aria-valuemin={0} aria-valuemax={100}>
                    <div className="progress-bar" style={{ width: `${job.progress}%` }} />
                  </div>
                  <div className="progress-value">{job.progress}%</div>
                </td>
                <td>
                  <div className="row-actions">
                    <button type="button" className="tiny-btn" onClick={() => onRemove(job.id)} disabled={running}>
                      Delete
                    </button>
                    {job.phase === "error" ? (
                      <button type="button" className="tiny-btn accent" onClick={() => onRetry(job.id)} disabled={running}>
                        Try Again
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
