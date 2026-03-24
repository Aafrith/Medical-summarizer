import { apiRequest } from "./apiClient";

export async function summarizeDocument(file, options) {
  const { onPhaseChange, token } = options || {};

  if (!token) {
    throw new Error("Authentication is required to process documents.");
  }

  onPhaseChange?.("processing", 15);

  const formData = new FormData();
  formData.append("file", file);

  const data = await apiRequest("/summaries/upload", {
    method: "POST",
    body: formData,
    token,
  });

  return {
    id: data.id,
    topic: data.topic,
    publicationYear: data.publicationYear,
    confidence: data.confidence,
    keyFindings: Array.isArray(data.keyFindings) ? data.keyFindings : [],
    englishSummary: data.englishSummary,
    sinhalaSummary: data.sinhalaSummary,
    imageDetails: Array.isArray(data.imageDetails) ? data.imageDetails : [],
    tableDetails: Array.isArray(data.tableDetails) ? data.tableDetails : [],
    sinhalaImageDetails: Array.isArray(data.sinhalaImageDetails) ? data.sinhalaImageDetails : [],
    sinhalaTableDetails: Array.isArray(data.sinhalaTableDetails) ? data.sinhalaTableDetails : [],
    createdAt: data.createdAt,
  };

}
