import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { useAuth } from "../../../state/auth";
import { useTenant } from "../../../state/tenant";
import { listDeliveries, listIntegrationRuns } from "../api";
import { IntegrationRun, WebhookDelivery } from "../types";
import { useFeatureEntitlements, useFeaturePlans } from "../../../state/entitlements";

export function BridgeDashboardPage() {
  const { token } = useAuth();
  const { context } = useTenant();
  const tenantId = context?.tenant?.tenantId;
  const { entitlements } = useFeatureEntitlements(tenantId);
  const bridgeEntitlement = entitlements.find((item) => item.feature.key === "NEXUS_BRIDGE");
  const featureId = bridgeEntitlement?.feature.id;
  const { plans } = useFeaturePlans(tenantId, featureId);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [runs, setRuns] = useState<IntegrationRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const subscription = bridgeEntitlement?.subscription || null;

  const load = useCallback(async () => {
    if (!token || !tenantId) return;
    setLoading(true);
    setMessage(null);
    try {
      const [deliveriesData, runsData] = await Promise.all([
        listDeliveries(token, tenantId),
        listIntegrationRuns(token, tenantId),
      ]);
      setDeliveries(deliveriesData || []);
      setRuns(runsData || []);
    } catch (err) {
      setMessage((err as Error).message || "Nao foi possivel carregar o dashboard.");
    } finally {
      setLoading(false);
    }
  }, [token, tenantId]);

  useEffect(() => {
    void load();
  }, [load]);

  const deliveryStats = useMemo(() => {
    const total = deliveries.length;
    const success = deliveries.filter((item) => item.status === "success").length;
    const successRate = total > 0 ? Math.round((success / total) * 100) : 0;
    return { total, successRate };
  }, [deliveries]);

  const runStats = useMemo(() => {
    const total = runs.length;
    const queued = runs.filter((item) => item.status === "queued").length;
    return { total, queued };
  }, [runs]);

  const currentPlan = useMemo(() => {
    if (!subscription) return null;
    return plans.find((plan) => plan.id === subscription.featurePlanId) || null;
  }, [plans, subscription]);

  return (
    <div className="stack">
      <Card
        title="Resumo do Bridge"
        right={
          <Button variant="secondary" onClick={load} loading={loading}>
            Atualizar
          </Button>
        }
      >
        {message ? <Alert variant="error">{message}</Alert> : null}
        <div className="grid two">
          <Card strong title="Webhooks">
            <div className="metric">{deliveryStats.total}</div>
            <div className="muted">Deliveries registradas</div>
          </Card>
          <Card strong title="Taxa de sucesso">
            <div className="metric">{deliveryStats.successRate}%</div>
            <div className="muted">Ultimas entregas</div>
          </Card>
          <Card strong title="Integracoes">
            <div className="metric">{runStats.total}</div>
            <div className="muted">Runs recentes</div>
          </Card>
          <Card strong title="Fila">
            <div className="metric">{runStats.queued}</div>
            <div className="muted">Runs em processamento</div>
          </Card>
        </div>
      </Card>

      <Card title="Plano ativo">
        {subscription ? (
          <div className="stack">
            <div className="pill-row">
              <span className="pill">Plano: {subscription.planCode}</span>
              <span className="pill">Status: {subscription.status}</span>
              <span className="pill">
                Renovacao: {subscription.renewDate ? new Date(subscription.renewDate).toLocaleDateString() : "Nao informado"}
              </span>
            </div>
            {currentPlan ? (
              <div className="muted">
                {currentPlan.planName} • Codigo {currentPlan.planCode}
              </div>
            ) : (
              <div className="muted">Detalhes do plano indisponiveis.</div>
            )}
          </div>
        ) : (
          <div className="muted">Assinatura nao encontrada.</div>
        )}
      </Card>
    </div>
  );
}
