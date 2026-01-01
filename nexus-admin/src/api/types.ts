// User representa o "dono do crachá" retornado pelo backend.
// Explicação para leigos: este objeto descreve quem está logado e qual é o seu nível de acesso.
export interface User {
  id: number;
  name: string;
  email: string;
  roleId: number;
  status: string;
  mfaEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Tenant {
  id: number;
  name: string;
  description: string;
  ownerId?: number; // não exposto para usuários finais
  status: string;
  createdAt: string;
  cnpj?: string | null;
  features?: Feature[];
}

export interface TenantMembership {
  tenantId: number;
  tenantName: string;
  description: string;
  status: string;
  role: string;
}

export interface Feature {
  id: number;
  name: string;
  key: string;
  description: string;
  status: string;
  created_at: string;
}

export interface TenantFeature {
  id: number;
  tenantId: number;
  featureId: number;
  enabledAt: string;
}

export interface TenantSSOSettings {
  exists: boolean;
  id?: number;
  tenantId: number;
  enabled: boolean;
  required: boolean;
  providerType: "oidc" | "saml" | "";
  emailDomains?: string[];
  attributeMapping?: Record<string, string>;
  oidcIssuerUrl?: string | null;
  oidcDiscoveryUrl?: string | null;
  oidcClientId?: string | null;
  oidcClientSecretMasked?: string | null;
  oidcRedirectUris?: string[];
  samlSpEntityId?: string | null;
  samlIdpEntityId?: string | null;
  samlIdpSsoUrl?: string | null;
  samlIdpX509Cert?: string | null;
  samlMetadataUrl?: string | null;
  samlNameIdFormat?: string | null;
  samlClockSkewSeconds?: number | null;
  samlWantAssertionsSigned?: boolean | null;
  samlWantMessagesSigned?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
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
