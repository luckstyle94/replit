import { ApiError, UNAUTHORIZED_EVENT } from "./http";

const BRIDGE_API_URL: string =
  (import.meta.env.VITE_BRIDGE_API_URL as string | undefined)?.replace(/\/$/, "") || "http://localhost:8090/api/v1";

interface BridgeRequestOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
  headers?: Record<string, string>;
}

function createCorrelationId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `corr-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function bridgeRequest<T>(path: string, options: BridgeRequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Correlation-Id": createCorrelationId(),
    ...options.headers,
  };

  if (options.body !== undefined && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${BRIDGE_API_URL}${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const requestId = response.headers.get("x-request-id") || response.headers.get("X-Request-Id") || undefined;
  const contentType = response.headers.get("content-type") || "";
  const isJSON = contentType.includes("application/json");
  const data = isJSON ? await response.json().catch(() => ({})) : undefined;

  if (!response.ok) {
    const message = (data as Record<string, unknown>)?.error || response.statusText;
    if (response.status === 401 && options.token) {
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT, { detail: { requestId } }));
    }
    throw new ApiError(String(message || "Erro na requisição"), response.status, data, requestId);
  }

  return (data as T) || ({} as T);
}

export async function bridgeDownload(path: string, token: string, filename: string): Promise<void> {
  const headers: Record<string, string> = {
    Accept: "*/*",
    "X-Correlation-Id": createCorrelationId(),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${BRIDGE_API_URL}${path}`, {
    method: "GET",
    headers,
  });
  const requestId = response.headers.get("x-request-id") || response.headers.get("X-Request-Id") || undefined;
  if (!response.ok) {
    if (response.status === 401 && token) {
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT, { detail: { requestId } }));
    }
    const text = await response.text().catch(() => "");
    throw new ApiError(text || response.statusText, response.status, undefined, requestId);
  }
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export function bridgeApiUrl(): string {
  return BRIDGE_API_URL;
}
