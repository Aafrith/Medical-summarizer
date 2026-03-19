export function buildBatchInsight(completedJobs) {
  if (completedJobs.length === 0) {
    return null;
  }

  if (completedJobs.length === 1) {
    const job = completedJobs[0];
    const topic = job.result?.topic ?? "General medicine";

    return {
      title: "Single Document Ready",
      summary: `A complete summary package is available for ${topic}, including both English and Sinhala versions.`,
      scenario: "single-document",
    };
  }

  const topicFrequency = new Map();
  const years = [];

  for (const job of completedJobs) {
    const topic = job.result?.topic ?? "General medicine";
    topicFrequency.set(topic, (topicFrequency.get(topic) ?? 0) + 1);

    if (job.result?.publicationYear) {
      years.push(job.result.publicationYear);
    }
  }

  const topics = [...topicFrequency.keys()];

  if (topics.length > 1) {
    const topicBreakdown = [...topicFrequency.entries()]
      .map(([topic, count]) => `${topic} (${count})`)
      .join(", ");

    return {
      title: "Mixed-Topic Portfolio Identified",
      summary: `This submission includes multiple medical topics: ${topicBreakdown}. Each document has been prepared independently for clear review.`,
      scenario: "mixed-topics",
    };
  }

  const sharedTopic = topics[0];

  if (years.length >= 2) {
    const oldest = Math.min(...years);
    const latest = Math.max(...years);

    return {
      title: "Same-Topic Time Comparison Identified",
      summary: `All uploaded documents focus on ${sharedTopic}. Publication years range from ${oldest} to ${latest}, supporting side-by-side review of earlier and newer findings.`,
      scenario: "same-topic-evolution",
    };
  }

  return {
    title: "Focused Topic Submission",
    summary: `All uploaded documents focus on ${sharedTopic}. Each document has a separate summary to support direct comparison.`,
    scenario: "same-topic",
  };
}
