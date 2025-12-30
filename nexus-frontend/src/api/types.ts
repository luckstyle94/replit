export type MfaMode = "authenticator" | "email" | "unknown" | "";
export type MfaManagementMode = "local" | "delegated";

export interface MfaManagementStatus {
  mode: MfaManagementMode;
  message: string;
  reconfigureAllowed: boolean;
}

export interface User {
  id: number;
  name: string;
  email: string;
  roleId: number;
  status: string;
  cpf?: string | null;
  phone?: string | null;
  mfaEnabled: boolean;
  mfaManagement?: MfaManagementStatus;
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

export interface SSODiscoverCandidate {
  tenantId: number;
  tenantName: string;
  providerType: "oidc" | "saml";
  required: boolean;
  enabled: boolean;
  startUrl: string;
  metadataUrl?: string;
}

export interface SSODiscoverResponse {
  candidates: SSODiscoverCandidate[];
  requiresSelection: boolean;
}

export type SessionStatus = "active" | "current";

export interface SessionInfo {
  id: string;
  userId?: number;
  userName?: string;
  userEmail?: string;
  roleId?: number;
  userAgent?: string;
  ip?: string;
  createdAt: string;
  lastActivity: string;
  status: SessionStatus;
}

export interface SessionsResponse {
  data: SessionInfo[];
  nextCursor?: string;
}
