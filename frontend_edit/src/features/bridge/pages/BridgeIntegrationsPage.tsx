import { useCallback, useEffect, useState } from "react";
import { Alert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { useAuth } from "../../../state/auth";
import { useTenant } from "../../../state/tenant";
import {
  enableIntegration,
  executeIntegration,
  listIntegrationRuns,
  replayIntegrationRun,
  testIntegration,
} from "../api";
import { IntegrationRun } from "../types";

export function BridgeIntegrationsPage() {
  const { token } = useAuth();
  const { context } = useTenant();
  const tenant = context?.tenant;
  const tenantId = tenant?.tenantId;
  const isAdmin = tenant?.role === "owner" || tenant?.role === "admin";

  const [runs, setRuns] = useState<IntegrationRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [partner, setPartner] = useState("");
  const [config, setConfig] = useState("");
  const [payload, setPayload] = useState("{}");

  const load = useCallback(async () => {
    if (!token || !tenantId) return;
    setLoading(true);
    setMessage(null);
    try {
      const data = await listIntegrationRuns(token, tenantId);
      setRuns(data || []);
    } catch (err) {
      setMessage((err as Error).message || "Nao foi possivel carregar integracoes.");
    } finally {
      setLoading(false);
    }
  }, [token, tenantId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleEnable = async () => {
    if (!token || !tenantId) return;
    setActionLoading(true);
    setMessage(null);
    setSuccess(null);
    try {
      await enableIntegration(token, tenantId, partner.trim(), config.trim());
      setSuccess("Integracao habilitada.");
      setPartner("");
      setConfig("");
      await load();
    } catch (err) {
      setMessage((err as Error).message || "Erro ao habilitar integracao.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTest = async () => {
    if (!token || !tenantId) return;
    setActionLoading(true);
    setMessage(null);
    setSuccess(null);
    try {
      await testIntegration(token, tenantId, partner.trim());
      setSuccess("Teste agendado.");
    } catch (err) {
      setMessage((err as Error).message || "Erro ao testar integracao.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!token || !tenantId) return;
    setActionLoading(true);
    setMessage(null);
    setSuccess(null);
    try {
      const parsed = payload.trim() ? JSON.parse(payload) : {};
      await executeIntegration(token, tenantId, partner.trim(), parsed);
      setSuccess("Execucao solicitada.");
      await load();
    } catch (err) {
      const msg =
        err instanceof SyntaxError
          ? "Payload JSON invalido."
          : (err as Error).message || "Erro ao executar integracao.";
      setMessage(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReplay = async (runId: number) => {
    if (!token || !tenantId) return;
    setActionLoading(true);
    setMessage(null);
    setSuccess(null);
    try {
      await replayIntegrationRun(token, tenantId, runId);
      setSuccess("Replay solicitado.");
      await load();
    } catch (err) {
      setMessage((err as Error).message || "Erro ao solicitar replay.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="stack">
      <Card
        title="Integracoes"
        right={
          <Button variant="secondary" onClick={load} loading={loading}>
            Atualizar
          </Button>
        }
      >
        {message ? <Alert variant="error">{message}</Alert> : null}
        {success ? <Alert variant="success">{success}</Alert> : null}
        {!isAdmin ? (
          <Alert variant="info">Acoes de escrita exigem perfil admin do tenant.</Alert>
        ) : null}
        <div className="grid two">
          <Card strong title="Habilitar parceiro">
            <div className="stack">
              <Input label="Parceiro" value={partner} onChange={(event) => setPartner(event.target.value)} />
              <label>
                Configuracao (JSON ou texto)
                <textarea
                  className="input"
                  value={config}
                  onChange={(event) => setConfig(event.target.value)}
                  rows={4}
                />
              </label>
              <label>
                Payload de execucao (JSON)
                <textarea
                  className="input"
                  value={payload}
                  onChange={(event) => setPayload(event.target.value)}
                  rows={4}
                />
              </label>
              <div className="pill-row">
                <Button onClick={handleEnable} loading={actionLoading} disabled={!isAdmin || !partner.trim()}>
                  Habilitar
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleTest}
                  loading={actionLoading}
                  disabled={!isAdmin || !partner.trim()}
                >
                  Testar
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleExecute}
                  loading={actionLoading}
                  disabled={!isAdmin || !partner.trim()}
                >
                  Executar
                </Button>
              </div>
            </div>
          </Card>
          <Card strong title="Runs recentes">
            <div className="bridge-list">
              {runs.length === 0 ? (
                <div className="muted">Nenhuma run registrada.</div>
              ) : (
                runs.slice(0, 8).map((run) => (
                  <div key={run.id} className="bridge-row">
                    <div>
                      <div className="bridge-title">{run.partner}</div>
                      <div className="muted small">Status: {run.status}</div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={!isAdmin || actionLoading}
                      onClick={() => handleReplay(run.id)}
                    >
                      Replay
                    </Button>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </Card>

      <Card title="Historico de runs">
        <div className="bridge-list">
          {runs.length === 0 ? (
            <div className="muted">Nenhuma execucao registrada.</div>
          ) : (
            runs.map((run) => (
              <div key={run.id} className="bridge-row">
                <div>
                  <div className="bridge-title">{run.partner}</div>
                  <div className="muted small">
                    Status: {run.status} • Inicio: {new Date(run.startedAt).toLocaleString()}
                  </div>
                </div>
                <span className="pill">{run.status}</span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
