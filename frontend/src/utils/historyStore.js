const HISTORY_KEY = "medical_summary_history";

function toHistoryItem(entry) {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    fileName: entry.fileName,
    size: entry.size,
    topic: entry.topic,
    publicationYear: entry.publicationYear,
    confidence: entry.confidence,
    englishSummary: entry.englishSummary,
    sinhalaSummary: entry.sinhalaSummary,
    keyFindings: entry.keyFindings,
    createdAt: new Date().toISOString(),
  };
}

export function getHistoryEntries() {
  const stored = localStorage.getItem(HISTORY_KEY);

  if (!stored) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendHistoryEntries(entries) {
  if (!entries || entries.length === 0) {
    return;
  }

  const existing = getHistoryEntries();
  const mapped = entries.map((entry) => toHistoryItem(entry));
  const next = [...mapped, ...existing].slice(0, 120);

  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

export function clearHistoryEntries() {
  localStorage.removeItem(HISTORY_KEY);
}
