/**
 * Interceptador de requisições para usar mock em desenvolvimento
 */

import { ApiError } from "./http";
import {
  mockLogin,
  mockGetUser,
  mockMfaSetup,
  mockCompleteMfaChallenge,
} from "./mock";

const ENABLE_MOCK = import.meta.env.DEV;

interface MockRequestOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
  mfaToken?: string | null;
}

export function shouldUseMock(path: string): boolean {
  if (!ENABLE_MOCK) return false;

  const mockPaths = [
    "/auth/login",
    "/auth/verify-otp",
    "/auth/setup-mfa",
    "/auth/confirm-mfa",
    "/users/me",
  ];

  return mockPaths.some((p) => path.includes(p));
}

export async function processMockRequest<T>(
  path: string,
  options: MockRequestOptions
): Promise<T> {
  console.log("[MOCK] Interceptando:", path, "Body:", options.body);

  // Login
  if (path.includes("/auth/login") && options.method === "POST") {
    const body = options.body as { email: string; password: string };
    const result = mockLogin(body.email, body.password);

    if ("token" in result) {
      return result as T;
    }

    throw new ApiError(result.error || "Login failed", 400, result);
  }

  // Get current user
  if (path.includes("/users/me") && options.method === "GET") {
    const user = mockGetUser(options.token || "");
    if (!user) {
      throw new ApiError("Unauthorized", 401);
    }
    return user as T;
  }

  // Setup MFA
  if (path.includes("/auth/setup-mfa") && options.method === "POST") {
    const mfaToken = options.mfaToken || "";
    const result = mockMfaSetup(mfaToken);
    if (!result) {
      throw new ApiError("Invalid MFA token", 400);
    }
    return result as T;
  }

  // Verify OTP
  if (path.includes("/auth/verify-otp") && options.method === "POST") {
    const body = options.body as { code: string };
    const result = mockCompleteMfaChallenge(body.code);

    if ("token" in result) {
      return result as T;
    }

    throw new ApiError(result.error || "Verification failed", 400, result);
  }

  // Confirm MFA
  if (path.includes("/auth/confirm-mfa") && options.method === "POST") {
    const result = mockCompleteMfaChallenge((options.body as any).code);

    if ("token" in result) {
      return result as T;
    }

    throw new ApiError(result.error || "Verification failed", 400, result);
  }

  throw new ApiError("Mock endpoint not found", 404);
}
