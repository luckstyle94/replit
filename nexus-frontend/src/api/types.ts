export type MfaMode = "authenticator" | "email" | "unknown" | "";

export interface User {
  id: number;
  name: string;
  email: string;
  roleId: number;
  status: string;
  cpf?: string | null;
  phone?: string | null;
  mfaEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Tenant {
  id: number;
  name: string;
  description: string;
  owner_id?: number;
  cnpj?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface TenantUserInfo {
  userId: number;
  name: string;
  email: string;
  status: string;
  role: "owner" | "admin" | "member";
}

export interface LoginSuccess {
  token: string;
}

export interface LoginErrorData {
  error?: string;
  code?: "mfa_required" | "otp_required" | "email_mfa_not_allowed";
  mfaToken?: string;
  allowEmail?: boolean;
  authenticatorPreferred?: boolean;
  secret?: string;
  otpauth?: string;
  issuer?: string;
  account?: string;
}

export interface SocialAuthUrlResponse {
  url: string;
  state: string;
}

export interface MfaSetupData {
  secret: string;
  otpauth: string;
  issuer?: string;
  account?: string;
  mfaToken?: string;
  allowEmail?: boolean;
}
