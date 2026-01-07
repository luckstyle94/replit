import { useCallback, useEffect, useState } from "react";
import { Alert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { useAuth } from "../../../state/auth";
import { useTenant } from "../../../state/tenant";
import { downloadAuditExport, exportAudit, listAuditEvents, listAuditExports } from "../api";
import { AuditEvent, AuditExport } from "../types";

export function BridgeAuditPage() {
  const { token } = useAuth();
  const { context } = useTenant();
  const tenant = context?.tenant;
  const tenantId = tenant?.tenantId;
  const isAdmin = tenant?.role === "owner" || tenant?.role === "admin";

  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [exports, setExports] = useState<AuditExport[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [format, setFormat] = useState<"csv" | "json">("csv");

  const load = useCallback(async () => {
    if (!token || !tenantId) return;
    setLoading(true);
    setMessage(null);
    try {
      const [eventsData, exportsData] = await Promise.all([
        listAuditEvents(token, tenantId),
        listAuditExports(token, tenantId),
      ]);
      setEvents(eventsData || []);
      setExports(exportsData || []);
    } catch (err) {
      setMessage((err as Error).message || "Nao foi possivel carregar auditoria.");
    } finally {
      setLoading(false);
    }
  }, [token, tenantId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleExport = async () => {
    if (!token || !tenantId) return;
    setActionLoading(true);
    setMessage(null);
    setSuccess(null);
    try {
      await exportAudit(token, tenantId, format);
      setSuccess("Export solicitado. O arquivo sera disponibilizado.");
      await load();
    } catch (err) {
      setMessage((err as Error).message || "Erro ao exportar auditoria.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="stack">
      <Card
        title="Audit Logs"
        right={
          <Button variant="secondary" onClick={load} loading={loading}>
            Atualizar
          </Button>
        }
      >
        {message ? <Alert variant="error">{message}</Alert> : null}
        {success ? <Alert variant="success">{success}</Alert> : null}
        <div className="pill-row">
          <label className="muted small">
            Formato
            <select className="input" value={format} onChange={(event) => setFormat(event.target.value as "csv" | "json")}>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
          </label>
          <Button variant="secondary" onClick={handleExport} loading={actionLoading} disabled={!isAdmin}>
            Exportar logs
          </Button>
          {!isAdmin ? <span className="pill danger">Exportacao exige admin</span> : null}
        </div>
      </Card>

      <Card title="Exports solicitados">
        <div className="bridge-list">
          {exports.length === 0 ? (
            <div className="muted">Nenhuma exportacao solicitada.</div>
          ) : (
            exports.map((item) => (
              <div key={item.id} className="bridge-row">
                <div>
                  <div className="bridge-title">Export #{item.id}</div>
                  <div className="muted small">
                    Status: {item.status} • {new Date(item.createdAt).toLocaleString()}
                  </div>
                </div>
                {item.status === "done" ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={async () => {
                      if (!token || !tenantId) return;
                      try {
                        await downloadAuditExport(token, tenantId, item.id, item.format);
                      } catch (err) {
                        setMessage((err as Error).message || "Erro ao baixar export.");
                      }
                    }}
                  >
                    Baixar
                  </Button>
                ) : (
                  <span className="pill">{item.status}</span>
                )}
              </div>
            ))
          )}
        </div>
      </Card>

      <Card title="Eventos recentes">
        <div className="bridge-list">
          {events.length === 0 ? (
            <div className="muted">Nenhum evento registrado.</div>
          ) : (
            events.map((event) => (
              <div key={event.id} className="bridge-row">
                <div>
                  <div className="bridge-title">{event.action}</div>
                  <div className="muted small">
                    {event.resource} • {new Date(event.createdAt).toLocaleString()}
                  </div>
                </div>
                <span className="pill">{event.actor}</span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
