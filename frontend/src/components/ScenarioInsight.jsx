const SCENARIO_LABELS = {
  "mixed-topics": "Multi-Specialty Portfolio",
  "same-topic-evolution": "Clinical Trend Comparison",
  "same-topic": "Focused Topic Review",
  "single-document": "Single Document Review",
};

export default function ScenarioInsight({ insight }) {
  if (!insight) {
    return null;
  }

  return (
    <section className="panel section insight-panel">
      <div className="insight-badge">{SCENARIO_LABELS[insight.scenario] || "Batch Insight"}</div>
      <h3>{insight.title}</h3>
      <p>{insight.summary}</p>
    </section>
  );
}
