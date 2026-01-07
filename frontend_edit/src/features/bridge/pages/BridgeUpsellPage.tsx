import { useMemo, useState } from "react";
import { Alert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { useTenant } from "../../../state/tenant";
import { useFeatureEntitlements, useFeaturePlans } from "../../../state/entitlements";

export function BridgeUpsellPage() {
  const { context } = useTenant();
  const tenant = context?.tenant;
  const tenantId = tenant?.tenantId;
  const { entitlements, error: entitlementsError } = useFeatureEntitlements(tenantId);
  const bridgeEntitlement = entitlements.find((item) => item.feature.key === "NEXUS_BRIDGE");
  const featureId = bridgeEntitlement?.feature.id;
  const { plans, loading: loadingPlans, error: plansError, reload: reloadPlans } = useFeaturePlans(
    tenantId,
    featureId
  );
  const [showRequest, setShowRequest] = useState(false);

  const subscription = bridgeEntitlement?.subscription || null;
  const state = bridgeEntitlement?.state;

  const statusText = useMemo(() => {
    if (!state) return "Sem acesso";
    switch (state.state) {
      case "none":
        return "Sem plano ativo";
      case "inactive":
        return "Plano inativo";
      case "expired":
        return "Plano expirado";
      case "scheduled":
        return "Plano agendado";
      case "active":
        return "Plano ativo";
      default:
        return `Status: ${state.state}`;
    }
  }, [state]);

  const statusTone = useMemo(() => {
    if (!state || !state.isActive) return "danger";
    if (state.renewalDue) return "warning";
    return "success";
  }, [state]);

  const formatDate = (value?: string | null) => {
    if (!value) return "Nao informado";
    return new Date(value).toLocaleDateString();
  };

  return (
    <div className="stack">
      <div className="upsell-hero">
        <div className="upsell-summary">
          <div className="badge">Nexus Bridge</div>
          <h2>Seu acesso esta bloqueado por plano</h2>
          <p className="muted">
            Esta feature esta habilitada para o tenant, mas precisa de um plano ativo para liberar acesso completo.
          </p>
          {tenant ? (
            <div className="pill-row">
              <span className="pill">Tenant: {tenant.tenantName}</span>
              <span className="pill">Perfil: {tenant.role}</span>
            </div>
          ) : null}
        </div>
        <div className="upsell-status">
          <span className={`pill ${statusTone}`}>{statusText}</span>
          {state?.renewalDue ? <span className="pill warning">Renovacao pendente</span> : null}
          {subscription ? (
            <>
              <span className="pill">Inicio: {formatDate(subscription.startDate)}</span>
              <span className="pill">Fim: {formatDate(subscription.endDate)}</span>
              <span className="pill">Renova em: {formatDate(subscription.renewDate)}</span>
            </>
          ) : (
            <span className="pill">Sem assinatura registrada</span>
          )}
          <div className="upsell-actions">
            <Button variant="secondary" onClick={() => setShowRequest(true)}>
              Solicitar upgrade
            </Button>
            <Button variant="primary" onClick={reloadPlans} loading={loadingPlans}>
              Recarregar planos
            </Button>
          </div>
        </div>
      </div>

      {entitlementsError ? <Alert variant="error">{entitlementsError}</Alert> : null}
      {plansError ? <Alert variant="error">{plansError}</Alert> : null}

      <div className="upsell-grid">
        {plans.map((plan) => {
          const limits = (plan.metadata?.limits as Record<string, number>) || {};
          const isCurrent = subscription?.featurePlanId === plan.id;
          return (
            <div key={plan.id} className={`plan-card ${isCurrent ? "highlight" : ""}`}>
              <div>
                <div className="badge">{plan.planCode.toUpperCase()}</div>
                <h3>{plan.planName}</h3>
                <p className="muted">{plan.description}</p>
                <div className="plan-limits">
                  <span className="pill">Retencao: {limits.retentionDays ?? "n/d"} dias</span>
                  <span className="pill">Webhooks: {limits.maxWebhooks ?? "n/d"}</span>
                  <span className="pill">Integracoes: {limits.maxIntegrations ?? "n/d"}</span>
                  <span className="pill">Eventos/mes: {limits.maxEventsMonth ?? "n/d"}</span>
                </div>
              </div>
              <div className="plan-footer">
                <span className={`pill ${isCurrent ? "success" : "info"}`}>
                  {isCurrent ? "Plano atual" : "Disponivel"}
                </span>
              </div>
            </div>
          );
        })}
        {!loadingPlans && plans.length === 0 ? (
          <Card title="Planos indisponiveis">
            <div className="muted">Nenhum plano encontrado no momento.</div>
          </Card>
        ) : null}
        {loadingPlans ? (
          <Card title="Carregando planos">
            <div className="muted">Buscando o catalogo atualizado...</div>
          </Card>
        ) : null}
      </div>

      {showRequest ? (
        <div className="modal-overlay">
          <div className="card plan-modal">
            <h3>Solicitar upgrade</h3>
            <p className="muted">
              Envie um pedido para a equipe comercial. Inclua o tenant e o plano desejado para acelerarmos a ativacao.
            </p>
            <div className="plan-modal-box">
              <div>Tenant: {tenant?.tenantName || "nao informado"}</div>
              <div>Feature: NEXUS_BRIDGE</div>
            </div>
            <div className="pill-row">
              <Button
                variant="primary"
                onClick={() => window.open("mailto:suporte@nexus.local?subject=Upgrade%20Nexus%20Bridge")}
              >
                Enviar solicitacao
              </Button>
              <Button variant="secondary" onClick={() => setShowRequest(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
