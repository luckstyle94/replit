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
      <div className="upsell-hero" style={{ padding: 'var(--space-2xl)', background: 'linear-gradient(135deg, var(--color-bg-tertiary) 0%, var(--color-bg-primary) 100%)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-xl)' }}>
        <div className="upsell-summary">
          <div className="badge info" style={{ marginBottom: 'var(--space-md)', padding: '6px 16px', fontSize: 'var(--font-size-sm)' }}>Acesso Premium</div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: 'var(--space-md)', lineHeight: '1.1' }}>Potencialize sua integração com o <span style={{ color: 'var(--color-primary)' }}>Nexus Bridge</span></h1>
          <p className="muted" style={{ fontSize: 'var(--font-size-lg)', maxWidth: '600px', marginBottom: 'var(--space-lg)' }}>
            Libere fluxos de trabalho avançados, webhooks em tempo real e maior tempo de retenção de dados.
          </p>
          {tenant ? (
            <div className="pill-row" style={{ marginTop: 'var(--space-md)' }}>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.05)' }}>Organização: {tenant.tenantName}</span>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.05)' }}>Nível: {tenant.role}</span>
            </div>
          ) : null}
        </div>
        <div className="upsell-status" style={{ backgroundColor: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)', padding: 'var(--space-xl)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-light)' }}>
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <div className="muted small" style={{ marginBottom: 'var(--space-xs)' }}>Status do Serviço</div>
            <span className={`badge ${statusTone}`} style={{ fontSize: 'var(--font-size-base)', padding: '8px 16px', width: '100%', justifyContent: 'center' }}>{statusText}</span>
          </div>
          
          <div className="stack" style={{ gap: 'var(--space-xs)', marginBottom: 'var(--space-lg)' }}>
            {subscription ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span className="muted">Vigência:</span>
                  <span>{formatDate(subscription.startDate)} - {formatDate(subscription.endDate)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                   <span className="muted">Renovação:</span>
                   <span>{formatDate(subscription.renewDate)}</span>
                </div>
              </>
            ) : (
              <div className="muted small" style={{ textAlign: 'center' }}>Nenhuma assinatura ativa encontrada.</div>
            )}
          </div>

          <div className="stack" style={{ gap: 'var(--space-sm)' }}>
            <Button variant="primary" size="lg" fullWidth onClick={() => setShowRequest(true)}>
              Ver Planos e Upgrade
            </Button>
            <Button variant="ghost" fullWidth onClick={reloadPlans} loading={loadingPlans}>
              Atualizar Status
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
            <div 
              key={plan.id} 
              className={`plan-card ${isCurrent ? "highlight" : ""}`}
              style={{ 
                position: 'relative',
                overflow: 'hidden',
                border: isCurrent ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                transform: isCurrent ? 'scale(1.02)' : 'none',
                zIndex: isCurrent ? 1 : 0
              }}
            >
              {isCurrent && (
                <div style={{ 
                  position: 'absolute', 
                  top: '12px', 
                  right: '-30px', 
                  background: 'var(--color-primary)', 
                  color: 'white', 
                  padding: '4px 40px', 
                  transform: 'rotate(45deg)',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                  ATUAL
                </div>
              )}
              <div className="stack" style={{ gap: 'var(--space-md)' }}>
                <div>
                  <div className="badge" style={{ marginBottom: 'var(--space-xs)' }}>{plan.planCode.toUpperCase()}</div>
                  <h3 style={{ fontSize: 'var(--font-size-xl)' }}>{plan.planName}</h3>
                  <p className="muted" style={{ fontSize: 'var(--font-size-sm)', minHeight: '3em' }}>{plan.description}</p>
                </div>

                <div className="divider">Limites e Recursos</div>

                <div className="stack" style={{ gap: 'var(--space-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="muted small">Retenção de Dados</span>
                    <span className="badge info">{limits.retentionDays ?? "n/d"} dias</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="muted small">Webhooks</span>
                    <span className="badge info">{limits.maxWebhooks ?? "n/d"}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="muted small">Integrações</span>
                    <span className="badge info">{limits.maxIntegrations ?? "n/d"}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="muted small">Eventos mensais</span>
                    <span className="badge info">{limits.maxEventsMonth ?? "n/d"}</span>
                  </div>
                </div>
              </div>
              <div className="plan-footer" style={{ marginTop: 'var(--space-lg)' }}>
                <Button 
                  variant={isCurrent ? "secondary" : "primary"} 
                  fullWidth 
                  disabled={isCurrent}
                  onClick={() => setShowRequest(true)}
                >
                  {isCurrent ? "Plano Atual" : "Escolher este Plano"}
                </Button>
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
