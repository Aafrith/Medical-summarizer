const STAGES = [
  {
    lane: "Intake",
    nodes: ["Medical Documents", "Secure Submission"],
  },
  {
    lane: "Content Review",
    nodes: ["Narrative Content", "Structured Data", "Visual Content"],
  },
  {
    lane: "Draft Creation",
    nodes: ["English Summary Draft", "Clinical Highlights", "Topic Classification"],
  },
  {
    lane: "Consolidation",
    nodes: ["Unified Summary", "Quality Alignment"],
  },
  {
    lane: "Assurance",
    nodes: ["Consistency Review", "Accuracy Review", "Refinement Cycle"],
  },
  {
    lane: "Delivery",
    nodes: ["Final English Summary", "Final Sinhala Summary"],
  },
];

export default function ArchitectureFlow() {
  return (
    <section className="panel section architecture-panel">
      <div className="panel-header-row">
        <div>
          <p className="kicker">Service Workflow</p>
          <h2>How Your Documents Are Prepared</h2>
          <p className="subtle-text">
            A clear end-to-end process from secure upload to bilingual summary delivery.
          </p>
        </div>
      </div>

      <div className="architecture-grid">
        {STAGES.map((stage) => (
          <div key={stage.lane} className="architecture-column">
            <h4>{stage.lane}</h4>
            <div className="stage-stack">
              {stage.nodes.map((node) => (
                <div key={node} className="node-chip">
                  {node}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
