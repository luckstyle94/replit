import { useCallback, useEffect, useState } from "react";
import { Alert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { useAuth } from "../../../state/auth";
import { useTenant } from "../../../state/tenant";
import { listPartners } from "../api";

export function BridgePartnersPage() {
  const { token } = useAuth();
  const { context } = useTenant();
  const tenantId = context?.tenant?.tenantId;

  const [partners, setPartners] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !tenantId) return;
    setLoading(true);
    setMessage(null);
    try {
      const data = await listPartners(token, tenantId);
      setPartners(data || []);
    } catch (err) {
      setMessage((err as Error).message || "Nao foi possivel carregar partners.");
    } finally {
      setLoading(false);
    }
  }, [token, tenantId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="stack">
      <Card
        title="Partners"
        right={
          <Button variant="secondary" onClick={load} loading={loading}>
            Atualizar
          </Button>
        }
      >
        {message ? <Alert variant="error">{message}</Alert> : null}
        <div className="bridge-list">
          {partners.length === 0 ? (
            <div className="muted">Nenhum partner conectado.</div>
          ) : (
            partners.map((partner) => (
              <div key={partner} className="bridge-row">
                <div>
                  <div className="bridge-title">{partner}</div>
                  <div className="muted small">Parceiro habilitado.</div>
                </div>
                <span className="pill">ativo</span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
