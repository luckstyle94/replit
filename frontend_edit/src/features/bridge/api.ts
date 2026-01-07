import { bridgeDownload, bridgeRequest } from "../../api/bridge";
import {
  AuditExport,
  AuditEvent,
  BridgePlan,
  BridgeSubscription,
  Credential,
  Integration,
  IntegrationRun,
  Report,
  WebhookDelivery,
  WebhookSubscription,
} from "./types";

export function listPlans(token: string) {
  return bridgeRequest<BridgePlan[]>("/plans", { token });
}

export function getSubscription(token: string, tenantId: number) {
  return bridgeRequest<BridgeSubscription>(`/tenants/${tenantId}/subscription`, { token });
}

export function listWebhooks(token: string, tenantId: number) {
  return bridgeRequest<WebhookSubscription[]>(`/tenants/${tenantId}/webhooks/subscriptions`, { token });
}

export function listDeliveries(token: string, tenantId: number) {
  return bridgeRequest<WebhookDelivery[]>(`/tenants/${tenantId}/webhooks/deliveries`, { token });
}

export function createWebhookSubscription(
  token: string,
  tenantId: number,
  payload: { name: string; url: string; events: string[]; secret: string }
) {
  return bridgeRequest<WebhookSubscription>(`/tenants/${tenantId}/webhooks/subscriptions`, {
    method: "POST",
    token,
    body: payload,
  });
}

export function updateWebhookSubscription(
  token: string,
  tenantId: number,
  id: number,
  payload: { url: string; status: string; events: string[] }
) {
  return bridgeRequest<WebhookSubscription>(`/tenants/${tenantId}/webhooks/subscriptions/${id}`, {
    method: "PATCH",
    token,
    body: payload,
  });
}

export function replayWebhookDelivery(token: string, tenantId: number, id: number) {
  return bridgeRequest<WebhookDelivery>(`/tenants/${tenantId}/webhooks/deliveries/${id}/replay`, {
    method: "POST",
    token,
  });
}

export function enableIntegration(
  token: string,
  tenantId: number,
  partner: string,
  config: string
) {
  return bridgeRequest<Integration>(`/tenants/${tenantId}/integrations/${partner}/enable`, {
    method: "POST",
    token,
    body: { config },
  });
}

export function testIntegration(token: string, tenantId: number, partner: string) {
  return bridgeRequest<{ message: string }>(`/tenants/${tenantId}/integrations/${partner}/test`, {
    method: "POST",
    token,
  });
}

export function listIntegrationRuns(token: string, tenantId: number) {
  return bridgeRequest<IntegrationRun[]>(`/tenants/${tenantId}/integrations/runs`, { token });
}

export function replayIntegrationRun(token: string, tenantId: number, id: number) {
  return bridgeRequest<IntegrationRun>(`/tenants/${tenantId}/integrations/runs/${id}/replay`, {
    method: "POST",
    token,
  });
}

export function listCredentials(token: string, tenantId: number) {
  return bridgeRequest<Credential[]>(`/tenants/${tenantId}/credentials`, { token });
}

export function createCredential(
  token: string,
  tenantId: number,
  payload: { label: string; type: string; secret: string }
) {
  return bridgeRequest<Credential>(`/tenants/${tenantId}/credentials`, {
    method: "POST",
    token,
    body: payload,
  });
}

export function rotateCredentialWithSecret(token: string, tenantId: number, id: number, secret: string) {
  return bridgeRequest<Credential>(`/tenants/${tenantId}/credentials/${id}/rotate`, {
    method: "POST",
    token,
    body: { secret },
  });
}

export function listAuditEvents(token: string, tenantId: number) {
  return bridgeRequest<AuditEvent[]>(`/tenants/${tenantId}/audit`, { token });
}

export function exportAudit(token: string, tenantId: number, format: "csv" | "json") {
  return bridgeRequest<{ message: string }>(`/tenants/${tenantId}/audit/export`, {
    method: "POST",
    token,
    body: { format },
  });
}

export function listAuditExports(token: string, tenantId: number) {
  return bridgeRequest<AuditExport[]>(`/tenants/${tenantId}/audit/exports`, { token });
}

export function downloadAuditExport(token: string, tenantId: number, id: number, format: string) {
  const ext = format === "json" ? "json" : "csv";
  return bridgeDownload(`/tenants/${tenantId}/audit/exports/${id}/download`, token, `audit-export-${id}.${ext}`);
}

export function listReports(token: string, tenantId: number) {
  return bridgeRequest<Report[]>(`/tenants/${tenantId}/reports`, { token });
}

export function createReport(token: string, tenantId: number, payload: { type: string }) {
  return bridgeRequest<Report>(`/tenants/${tenantId}/reports`, {
    method: "POST",
    token,
    body: payload,
  });
}

export function downloadReport(token: string, tenantId: number, id: number) {
  return bridgeDownload(`/tenants/${tenantId}/reports/${id}/download`, token, `report-${id}.csv`);
}

export function listPartners(token: string, tenantId: number) {
  return bridgeRequest<string[]>(`/tenants/${tenantId}/partners`, { token });
}

export function executeIntegration(
  token: string,
  tenantId: number,
  partner: string,
  payload: Record<string, unknown>
) {
  return bridgeRequest<{ message: string }>(`/tenants/${tenantId}/integrations/${partner}/execute`, {
    method: "POST",
    token,
    body: { payload },
  });
}
