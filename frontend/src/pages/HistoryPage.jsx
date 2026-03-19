import { useMemo, useState } from "react";
import { clearHistoryEntries, getHistoryEntries } from "../utils/historyStore";
import { downloadSummaryPdf } from "../utils/pdfExport";

export default function HistoryPage() {
  const [entries, setEntries] = useState(() => getHistoryEntries());

  const hasData = entries.length > 0;

  const grouped = useMemo(() => {
    return entries.slice(0, 40);
  }, [entries]);

  const clearHistory = () => {
    clearHistoryEntries();
    setEntries([]);
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

        {!hasData ? (
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
