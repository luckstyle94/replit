import { ApiError } from "../api/http";

export function getErrorMessage(err: unknown): { message: string; requestId?: string } {
  if (err instanceof ApiError) {
    return { message: err.message || "Erro inesperado.", requestId: err.requestId };
  }
  if (err instanceof Error) {
    return { message: err.message || "Erro inesperado." };
  }
  return { message: "Erro inesperado." };
}

