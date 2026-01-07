import { useCallback, useEffect, useState } from "react";
import { Alert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { useAuth } from "../../../state/auth";
import { useTenant } from "../../../state/tenant";
import { createCredential, listCredentials, rotateCredentialWithSecret } from "../api";
import { Credential } from "../types";

export function BridgeSecretsPage() {
  const { token } = useAuth();
  const { context } = useTenant();
  const tenant = context?.tenant;
  const tenantId = tenant?.tenantId;
  const isAdmin = tenant?.role === "owner" || tenant?.role === "admin";

  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [type, setType] = useState("token");
  const [secret, setSecret] = useState("");
  const [rotateId, setRotateId] = useState<number | null>(null);
  const [rotateSecret, setRotateSecret] = useState("");

  const load = useCallback(async () => {
    if (!token || !tenantId) return;
    setLoading(true);
    setMessage(null);
    try {
      const data = await listCredentials(token, tenantId);
      setCredentials(data || []);
    } catch (err) {
      setMessage((err as Error).message || "Nao foi possivel carregar credenciais.");
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
      await createCredential(token, tenantId, {
        label: label.trim(),
        type: type.trim(),
        secret,
      });
      setLabel("");
      setSecret("");
      setSuccess("Credencial criada.");
      await load();
    } catch (err) {
      setMessage((err as Error).message || "Erro ao criar credencial.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRotate = async (id: number) => {
    if (!token || !tenantId) return;
    if (!rotateSecret.trim()) {
      setMessage("Informe o novo segredo para rotacao.");
      return;
    }
    setActionLoading(true);
    setMessage(null);
    setSuccess(null);
    try {
      await rotateCredentialWithSecret(token, tenantId, id, rotateSecret.trim());
      setSuccess("Credencial rotacionada.");
      setRotateId(null);
      setRotateSecret("");
      await load();
    } catch (err) {
      setMessage((err as Error).message || "Erro ao rotacionar credencial.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="stack">
      <Card
        title="Credenciais e segredos"
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
        <Card strong title="Nova credencial">
          <div className="stack">
            <Input label="Label" value={label} onChange={(event) => setLabel(event.target.value)} />
            <Input label="Tipo" value={type} onChange={(event) => setType(event.target.value)} />
            <Input
              label="Segredo"
              type="password"
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
            />
            <Button onClick={handleCreate} loading={actionLoading} disabled={!isAdmin}>
              Criar credencial
            </Button>
          </div>
        </Card>
      </Card>

      <Card title="Credenciais ativas">
        <div className="bridge-list">
          {credentials.length === 0 ? (
            <div className="muted">Nenhuma credencial cadastrada.</div>
          ) : (
            credentials.map((credential) => (
              <div key={credential.id} className="bridge-row">
                <div>
                  <div className="bridge-title">{credential.label}</div>
                  <div className="muted small">Tipo: {credential.type}</div>
                  <div className="muted small">Hint: {credential.secretHint}</div>
                </div>
                {rotateId === credential.id ? (
                  <div className="bridge-actions">
                    <Input
                      label="Novo segredo"
                      type="password"
                      value={rotateSecret}
                      onChange={(event) => setRotateSecret(event.target.value)}
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={!isAdmin || actionLoading}
                      onClick={() => handleRotate(credential.id)}
                    >
                      Confirmar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={actionLoading}
                      onClick={() => {
                        setRotateId(null);
                        setRotateSecret("");
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={!isAdmin || actionLoading}
                    onClick={() => {
                      setRotateId(credential.id);
                      setRotateSecret("");
                    }}
                  >
                    Rotacionar
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
