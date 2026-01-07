import { useCallback, useEffect, useState } from "react";
import { Alert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { useAuth } from "../../../state/auth";
import { useTenant } from "../../../state/tenant";
import {
  createWebhookSubscription,
  listDeliveries,
  listWebhooks,
  replayWebhookDelivery,
  updateWebhookSubscription,
} from "../api";
import { WebhookDelivery, WebhookSubscription } from "../types";

export function BridgeWebhooksPage() {
  const { token } = useAuth();
  const { context } = useTenant();
  const tenant = context?.tenant;
  const tenantId = tenant?.tenantId;
  const isAdmin = tenant?.role === "owner" || tenant?.role === "admin";

  const [subscriptions, setSubscriptions] = useState<WebhookSubscription[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState("");
  const [secret, setSecret] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [editEvents, setEditEvents] = useState("");

  const load = useCallback(async () => {
    if (!token || !tenantId) return;
    setLoading(true);
    setMessage(null);
    try {
      const [subs, dels] = await Promise.all([
        listWebhooks(token, tenantId),
        listDeliveries(token, tenantId),
      ]);
      setSubscriptions(subs || []);
      setDeliveries(dels || []);
    } catch (err) {
      setMessage((err as Error).message || "Nao foi possivel carregar webhooks.");
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
      await createWebhookSubscription(token, tenantId, {
        name: name.trim(),
        url: url.trim(),
        events: events.split(",").map((item) => item.trim()).filter(Boolean),
        secret,
      });
      setName("");
      setUrl("");
      setEvents("");
      setSecret("");
      setSuccess("Subscription criada.");
      await load();
    } catch (err) {
      setMessage((err as Error).message || "Erro ao criar subscription.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = (subscription: WebhookSubscription) => {
    setEditingId(subscription.id);
    setEditUrl(subscription.url);
    setEditEvents(subscription.events.join(","));
  };

  const handleSaveEdit = async (subscription: WebhookSubscription) => {
    if (!token || !tenantId) return;
    setActionLoading(true);
    setMessage(null);
    setSuccess(null);
    try {
      await updateWebhookSubscription(token, tenantId, subscription.id, {
        url: editUrl.trim(),
        status: subscription.status,
        events: editEvents.split(",").map((item) => item.trim()).filter(Boolean),
      });
      setEditingId(null);
      setSuccess("Subscription atualizada.");
      await load();
    } catch (err) {
      setMessage((err as Error).message || "Erro ao atualizar subscription.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggle = async (subscription: WebhookSubscription) => {
    if (!token || !tenantId) return;
    setActionLoading(true);
    setMessage(null);
    setSuccess(null);
    try {
      const nextStatus = subscription.status === "active" ? "paused" : "active";
      await updateWebhookSubscription(token, tenantId, subscription.id, {
        url: subscription.url,
        status: nextStatus,
        events: subscription.events,
      });
      setSuccess("Status atualizado.");
      await load();
    } catch (err) {
      setMessage((err as Error).message || "Erro ao atualizar status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReplay = async (deliveryId: number) => {
    if (!token || !tenantId) return;
    setActionLoading(true);
    setMessage(null);
    setSuccess(null);
    try {
      await replayWebhookDelivery(token, tenantId, deliveryId);
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
        title="Webhooks"
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
          <Card strong title="Nova subscription">
            <div className="stack">
              <Input label="Nome" value={name} onChange={(event) => setName(event.target.value)} />
              <Input label="URL" value={url} onChange={(event) => setUrl(event.target.value)} />
              <Input
                label="Eventos (separados por virgula)"
                value={events}
                onChange={(event) => setEvents(event.target.value)}
              />
              <Input
                label="Segredo de assinatura"
                type="password"
                value={secret}
                onChange={(event) => setSecret(event.target.value)}
              />
              <Button onClick={handleCreate} loading={actionLoading} disabled={!isAdmin}>
                Criar subscription
              </Button>
            </div>
          </Card>
          <Card strong title="Deliveries">
            <div className="bridge-list">
              {deliveries.length === 0 ? (
                <div className="muted">Nenhuma delivery registrada.</div>
              ) : (
                deliveries.slice(0, 6).map((delivery) => (
                  <div key={delivery.id} className="bridge-row">
                    <div>
                      <div className="bridge-title">#{delivery.id}</div>
                      <div className="muted small">Status: {delivery.status}</div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={!isAdmin || actionLoading}
                      onClick={() => handleReplay(delivery.id)}
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

      <Card title="Subscriptions cadastradas">
        <div className="bridge-list">
          {subscriptions.length === 0 ? (
            <div className="muted">Nenhuma subscription cadastrada.</div>
          ) : (
            subscriptions.map((subscription) => (
              <div key={subscription.id} className="bridge-row">
                <div>
                  <div className="bridge-title">{subscription.name}</div>
                  <div className="muted small">{subscription.url}</div>
                  <div className="muted small">Eventos: {subscription.events.join(", ")}</div>
                </div>
                <div className="bridge-actions">
                  <span className="pill">{subscription.status}</span>
                  {editingId === subscription.id ? (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={actionLoading || !isAdmin}
                        onClick={() => handleSaveEdit(subscription)}
                      >
                        Salvar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={!isAdmin}
                        onClick={() => handleEdit(subscription)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={!isAdmin || actionLoading}
                        onClick={() => handleToggle(subscription)}
                      >
                        {subscription.status === "active" ? "Pausar" : "Ativar"}
                      </Button>
                    </>
                  )}
                </div>
                {editingId === subscription.id ? (
                  <div className="bridge-edit">
                    <Input label="URL" value={editUrl} onChange={(event) => setEditUrl(event.target.value)} />
                    <Input
                      label="Eventos"
                      value={editEvents}
                      onChange={(event) => setEditEvents(event.target.value)}
                    />
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
