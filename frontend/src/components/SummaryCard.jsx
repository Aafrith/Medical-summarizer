import PdfDownloadButton from "./PdfDownloadButton";

export default function SummaryCard({ job }) {
  const { result } = job;

  if (!result) {
    return null;
  }

  return (
    <article className="summary-card">
      <header className="summary-header">
        <div>
          <h3>{job.file.name}</h3>
          <p>{result.topic}</p>
        </div>
        <div className="summary-header-actions">
          <div className="confidence-pill">Quality Score {Math.round(result.confidence * 100)}%</div>
          <PdfDownloadButton job={job} />
        </div>
      </header>

      <div className="summary-columns">
        <section className="summary-block english">
          <h4>English Summary</h4>
          <p>{result.englishSummary}</p>
        </section>

        <section className="summary-block sinhala">
          <h4>Sinhala Summary</h4>
          <p className="sinhala-text">{result.sinhalaSummary}</p>
        </section>
      </div>

      <section className="findings-block">
        <h5>Key Findings</h5>
        <ul>
          {result.keyFindings.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      {result.imageDetails && result.imageDetails.length > 0 && (
        <section className="analysis-block">
          <h5>Visual Content Analysis (Gemini)</h5>
          {result.imageDetails.map((detail, idx) => (
            <div key={idx} className="analysis-item">
              <h6>Image {idx + 1}</h6>
              <p>{detail}</p>
            </div>
          ))}
        </section>
      )}

      {result.tableDetails && result.tableDetails.length > 0 && (
        <section className="analysis-block">
          <h5>Tabular Content Analysis (Gemini)</h5>
          {result.tableDetails.map((detail, idx) => (
            <div key={idx} className="analysis-item">
              <h6>Table {idx + 1}</h6>
              <p>{detail}</p>
            </div>
          ))}
        </section>
      )}
    </article>

  );
}
