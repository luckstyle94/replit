import { useCallback, useEffect, useState } from "react";
import { Alert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { useAuth } from "../../../state/auth";
import { useTenant } from "../../../state/tenant";
import { createReport, downloadReport, listReports } from "../api";
import { Report } from "../types";

export function BridgeReportsPage() {
  const { token } = useAuth();
  const { context } = useTenant();
  const tenant = context?.tenant;
  const tenantId = tenant?.tenantId;
  const isAdmin = tenant?.role === "owner" || tenant?.role === "admin";

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [type, setType] = useState("usage");

  const load = useCallback(async () => {
    if (!token || !tenantId) return;
    setLoading(true);
    setMessage(null);
    try {
      const data = await listReports(token, tenantId);
      setReports(data || []);
    } catch (err) {
      setMessage((err as Error).message || "Nao foi possivel carregar reports.");
    } finally {
      setLoading(false);
    }
  }, [token, tenantId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async () => {
    if (!token || !tenantId) return;
    setActionLoading(true);
    setMessage(null);
    setSuccess(null);
    try {
      await createReport(token, tenantId, { type });
      setSuccess("Report solicitado.");
      await load();
    } catch (err) {
      setMessage((err as Error).message || "Erro ao criar report.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="stack">
      <Card
        title="Reports"
        right={
          <Button variant="secondary" onClick={load} loading={loading}>
            Atualizar
          </Button>
        }
      >
        {message ? <Alert variant="error">{message}</Alert> : null}
        {success ? <Alert variant="success">{success}</Alert> : null}
        <div className="grid two">
          <Card strong title="Gerar report">
            <div className="stack">
              <label>
                Tipo
                <select className="input" value={type} onChange={(event) => setType(event.target.value)}>
                  <option value="usage">Uso geral</option>
                  <option value="audit">Auditoria</option>
                  <option value="sla">SLA</option>
                </select>
              </label>
              <Button onClick={handleCreate} loading={actionLoading} disabled={!isAdmin}>
                Gerar report
              </Button>
              {!isAdmin ? <span className="pill danger">Geracao exige admin</span> : null}
            </div>
          </Card>
          <Card strong title="Status">
            <div className="muted">
              Reports podem levar alguns minutos. Quando prontos, o link fica disponivel abaixo.
            </div>
          </Card>
        </div>
      </Card>

      <Card title="Reports gerados">
        <div className="bridge-list">
          {reports.length === 0 ? (
            <div className="muted">Nenhum report gerado.</div>
          ) : (
            reports.map((report) => (
              <div key={report.id} className="bridge-row">
                <div>
                  <div className="bridge-title">{report.type}</div>
                  <div className="muted small">
                    Status: {report.status} • {new Date(report.createdAt).toLocaleString()}
                  </div>
                </div>
                {report.url ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={async () => {
                      if (!token || !tenantId) return;
                      try {
                        await downloadReport(token, tenantId, report.id);
                      } catch (err) {
                        setMessage((err as Error).message || "Erro ao baixar report.");
                      }
                    }}
                  >
                    Baixar
                  </Button>
                ) : report.status === "done" ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={async () => {
                      if (!token || !tenantId) return;
                      try {
                        await downloadReport(token, tenantId, report.id);
                      } catch (err) {
                        setMessage((err as Error).message || "Erro ao baixar report.");
                      }
                    }}
                  >
                    Baixar
                  </Button>
                ) : (
                  <span className="pill">{report.status}</span>
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
