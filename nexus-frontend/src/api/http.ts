import { LoginErrorData } from "./types";
import { shouldUseMock, processMockRequest } from "./mock-interceptor";

export class ApiError extends Error {
  status: number;
  data?: LoginErrorData | Record<string, unknown>;
  code?: string;
  requestId?: string;

  constructor(
    message: string,
    status: number,
    data?: LoginErrorData | Record<string, unknown>,
    requestId?: string
  ) {
    super(message);
    this.status = status;
    this.data = data;
    this.code = (data as LoginErrorData | undefined)?.code;
    this.requestId = requestId;
  }
}

// Base URL da API.
// - Em Docker (recomendado): use `VITE_API_URL=/api/v1` para chamar via Nginx (mesma origem).
// - Fora do Docker: use `VITE_API_URL=http://localhost:8080/api/v1`.
const API_URL: string = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || "/api/v1";

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
  mfaToken?: string | null;
  headers?: Record<string, string>;
}

export const UNAUTHORIZED_EVENT = "nexus:unauthorized";

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  // Use mock API em desenvolvimento
  if (shouldUseMock(path)) {
    try {
      return await processMockRequest<T>(path, options);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("Erro na requisição", 500);
    }
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...options.headers,
  };

  if (options.body !== undefined && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const authToken = options.mfaToken || options.token;
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const requestId = response.headers.get("x-request-id") || response.headers.get("X-Request-ID") || undefined;
  const contentType = response.headers.get("content-type") || "";
  const isJSON = contentType.includes("application/json");
  const data = isJSON ? await response.json().catch(() => ({})) : undefined;

  if (!response.ok) {
    const message = (data as Record<string, unknown>)?.error || response.statusText;
    // Só emite evento para chamadas autenticadas (sessão), evitando interferir no fluxo de login/MFA.
    if (response.status === 401 && options.token && !options.mfaToken) {
      window.dispatchEvent(
        new CustomEvent(UNAUTHORIZED_EVENT, { detail: { requestId } })
      );
    }
    throw new ApiError(String(message || "Erro na requisição"), response.status, data, requestId);
  }

  return (data as T) || ({} as T);
}

export function apiUrl(): string {
  return API_URL;
}
