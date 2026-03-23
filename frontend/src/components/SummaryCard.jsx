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
    </article>
  );
}
