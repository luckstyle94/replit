export interface BridgePlan {
  id: number;
  code: string;
  name: string;
  description: string;
  retentionDays: number;
  maxEventsMonth: number;
  maxRetries: number;
  maxWebhooks: number;
  maxIntegrations: number;
  features: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BridgeSubscription {
  id: number;
  tenantId: number;
  planId: number;
  planCode: string;
  planName?: string;
  status: string;
  startDate?: string;
  endDate?: string | null;
  renewDate?: string | null;
  startedAt?: string;
  renewAt?: string;
  cancelAt?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookSubscription {
  id: number;
  name: string;
  url: string;
  status: string;
  events: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface WebhookDelivery {
  id: number;
  status: string;
  attempts: number;
  lastError: string;
  createdAt: string;
  updatedAt?: string;
}

export interface IntegrationRun {
  id: number;
  partner: string;
  status: string;
  startedAt: string;
  endedAt?: string | null;
}

export interface Integration {
  id: number;
  partner: string;
  status: string;
  config: string;
  createdAt: string;
  updatedAt: string;
}

export interface Credential {
  id: number;
  label: string;
  type: string;
  secretHint: string;
  createdAt: string;
  rotatedAt?: string | null;
}

export interface AuditEvent {
  id: number;
  actor: string;
  action: string;
  resource: string;
  metadata: string;
  createdAt: string;
}

export interface Report {
  id: number;
  type: string;
  status: string;
  url?: string;
  filePath?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditExport {
  id: number;
  format: string;
  status: string;
  filePath?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
}
