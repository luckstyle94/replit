import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { useAuth } from "../../../state/auth";
import { useTenant } from "../../../state/tenant";
import { listDeliveries, listIntegrationRuns } from "../api";
import { IntegrationRun, WebhookDelivery } from "../types";

export function BridgePerformancePage() {
  const { token } = useAuth();
  const { context } = useTenant();
  const tenantId = context?.tenant?.tenantId;
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [runs, setRuns] = useState<IntegrationRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
      setMessage((err as Error).message || "Nao foi possivel carregar performance.");
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
    const failed = deliveries.filter((item) => item.status === "failed").length;
    return { total, success, failed };
  }, [deliveries]);

  const runStats = useMemo(() => {
    const total = runs.length;
    const queued = runs.filter((item) => item.status === "queued").length;
    const running = runs.filter((item) => item.status === "running").length;
    return { total, queued, running };
  }, [runs]);

  return (
    <div className="stack">
      <Card
        title="Performance"
        right={
          <Button variant="secondary" onClick={load} loading={loading}>
            Atualizar
          </Button>
        }
      >
        {message ? <Alert variant="error">{message}</Alert> : null}
        <div className="grid two">
          <Card strong title="Deliveries">
            <div className="metric">{deliveryStats.total}</div>
            <div className="muted">Sucesso: {deliveryStats.success} • Falhas: {deliveryStats.failed}</div>
          </Card>
          <Card strong title="Runs">
            <div className="metric">{runStats.total}</div>
            <div className="muted">Fila: {runStats.queued} • Em execucao: {runStats.running}</div>
          </Card>
        </div>
      </Card>

      <Card title="Ultimas deliveries">
        <div className="bridge-list">
          {deliveries.length === 0 ? (
            <div className="muted">Nenhuma delivery encontrada.</div>
          ) : (
            deliveries.slice(0, 10).map((delivery) => (
              <div key={delivery.id} className="bridge-row">
                <div>
                  <div className="bridge-title">Entrega #{delivery.id}</div>
                  <div className="muted small">
                    Status: {delivery.status} • Tentativas: {delivery.attempts}
                  </div>
                </div>
                <span className="pill">{delivery.status}</span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
