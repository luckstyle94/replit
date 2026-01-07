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

export interface FeatureFlag {
  id: number;
  key: string;
  name: string;
  description: string;
  status: string;
}

export interface FeaturePlan {
  id: number;
  featureId: number;
  planCode: string;
  planName: string;
  description: string;
  retentionDays?: number;
  maxEventsMonth?: number;
  maxRetries?: number;
  maxWebhooks?: number;
  maxIntegrations?: number;
  features?: string[];
  isActive: boolean;
  sortOrder: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TenantFeatureSubscription {
  id: number;
  tenantId: number;
  featureId: number;
  featurePlanId: number;
  planCode: string;
  planName: string;
  status: string;
  startDate: string;
  endDate?: string | null;
  renewDate?: string | null;
  updatedBy?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionState {
  state: string;
  isActive: boolean;
  renewalDue: boolean;
  activeUntil?: string;
}

export interface FeatureEntitlement {
  feature: FeatureFlag;
  subscription?: TenantFeatureSubscription | null;
  state: SubscriptionState;
}

export interface TenantMembership {
  tenantId: number;
  tenantName: string;
  description: string;
  status: string;
  role: "owner" | "admin" | "member";
}

export interface TenantContextInfo {
  tenantId: number;
  tenantName: string;
  status: string;
  role: "owner" | "admin" | "member";
}

export interface UserContextResponse {
  tenant?: TenantContextInfo | null;
  tenants: TenantMembership[];
  features: FeatureFlag[];
  selectedTenantId: number;
}
