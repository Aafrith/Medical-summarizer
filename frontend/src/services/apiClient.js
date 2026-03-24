const DEFAULT_API_BASE_URL = "http://localhost:8000";
const apiBase = (import.meta.env.VITE_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL).replace(/\/$/, "");

export const API_PREFIX = `${apiBase}/api/v1`;

function buildPath(path) {
  if (!path) {
    return API_PREFIX;
  }

  return path.startsWith("/") ? `${API_PREFIX}${path}` : `${API_PREFIX}/${path}`;
}

export async function apiRequest(path, options = {}) {
  const { method = "GET", body, token, headers = {} } = options;

  const requestHeaders = {
    ...headers,
  };

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  let requestBody = body;
  if (body && !(body instanceof FormData)) {
    requestHeaders["Content-Type"] = "application/json";
    requestBody = JSON.stringify(body);
  }

  let response;

  try {
    response = await fetch(buildPath(path), {
      method,
      headers: requestHeaders,
      body: requestBody,
    });
  } catch {
    throw new Error("Unable to reach backend service. Please verify the API server is running.");
  }

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const rawPayload = await response.text();
  let payload = rawPayload;

  if (isJson) {
    if (!rawPayload.trim()) {
      payload = null;
    } else {
      try {
        payload = JSON.parse(rawPayload);
      } catch {
        throw new Error("Received an invalid JSON response from the backend service.");
      }
    }
  }

  if (!response.ok) {
    const detail =
      typeof payload === "object" && payload !== null && typeof payload.detail === "string"
        ? payload.detail
        : typeof payload === "string" && payload
          ? payload
          : `Request failed with status ${response.status}.`;

    throw new Error(detail);
  }

  return payload;
}
