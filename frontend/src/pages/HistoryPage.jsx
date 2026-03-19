import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/apiClient";
import { downloadSummaryPdf } from "../utils/pdfExport";

export default function HistoryPage() {
  const { authToken } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadHistory() {
      if (!authToken) {
        setEntries([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const data = await apiRequest("/summaries/history", { token: authToken });
        setEntries(Array.isArray(data.items) ? data.items : []);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Unable to load summary history.");
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, [authToken]);

  const hasData = entries.length > 0;

  const grouped = useMemo(() => {
    return entries.slice(0, 40);
  }, [entries]);

  const clearHistory = async () => {
    if (!authToken || entries.length === 0) {
      return;
    }

    try {
      await apiRequest("/summaries/history", { method: "DELETE", token: authToken });
      setEntries([]);
      setError("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to clear summary history.");
    }
  };

  return (
    <div className="app-shell">
      <section className="panel section">
        <div className="panel-header-row">
          <div>
            <p className="kicker">History</p>
            <h2>Previous Summary Runs</h2>
            <p className="subtle-text">Review previous outputs and download reports again when needed.</p>
          </div>

          <button type="button" className="ghost-btn danger" onClick={clearHistory} disabled={!hasData}>
            Clear History
          </button>
        </div>

        {error ? <div className="notice">{error}</div> : null}

        {loading ? (
          <div className="empty-state">
            <h3>Loading history...</h3>
            <p>Retrieving your previous summary runs.</p>
          </div>
        ) : !hasData ? (
          <div className="empty-state">
            <h3>No history available yet</h3>
            <p>Processed summaries will appear here automatically.</p>
          </div>
        ) : (
          <div className="history-grid">
            {grouped.map((entry) => (
              <article key={entry.id} className="history-card">
                <div className="history-head">
                  <div>
                    <h3>{entry.fileName}</h3>
                    <p>{entry.topic}</p>
                  </div>
                  <button
                    type="button"
                    className="tiny-btn accent"
                    onClick={() =>
                      downloadSummaryPdf({
                        file: { name: entry.fileName },
                        result: {
                          topic: entry.topic,
                          confidence: entry.confidence,
                          englishSummary: entry.englishSummary,
                          sinhalaSummary: entry.sinhalaSummary,
                          keyFindings: entry.keyFindings,
                        },
                      })
                    }
                  >
                    Download PDF
                  </button>
                </div>

                <p className="history-time">{new Date(entry.createdAt).toLocaleString()}</p>
                <p className="history-summary">{entry.englishSummary}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
