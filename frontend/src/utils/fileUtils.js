const SUPPORTED_EXTENSIONS = new Set(["pdf", "txt", "doc", "docx"]);

const SUPPORTED_MIME_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export const acceptedFileTypes = ".pdf,.txt,.doc,.docx";

export function getFileExtension(fileName) {
  const parts = fileName.toLowerCase().split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

export function formatBytes(bytes) {
  if (bytes === 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;

  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

export function isSupportedFileType(file) {
  const extension = getFileExtension(file.name);
  const byExtension = SUPPORTED_EXTENSIONS.has(extension);
  const byMime = file.type ? SUPPORTED_MIME_TYPES.has(file.type) : false;

  return byExtension || byMime;
}

export function isFileSizeAllowed(file) {
  return file.size <= MAX_FILE_SIZE_BYTES;
}

export function validateFile(file) {
  if (!isSupportedFileType(file)) {
    return "Unsupported format. Allowed formats: PDF, TXT, DOC, DOCX.";
  }

  if (!isFileSizeAllowed(file)) {
    return "File is larger than 25 MB. Please upload a smaller document.";
  }

  return null;
}

export function formatPhaseLabel(phase) {
  if (!phase) {
    return "Unknown";
  }

  const phaseLabels = {
    queued: "Waiting",
    processing: "Processing...",
    completed: "Ready",
    error: "Needs Attention",
  };

  return phaseLabels[phase] || (phase.charAt(0).toUpperCase() + phase.slice(1));
}
