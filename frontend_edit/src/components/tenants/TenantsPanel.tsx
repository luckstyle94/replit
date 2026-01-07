import { useEffect, useState } from "react";
import { request } from "../../api/http";
import { Tenant, TenantUserInfo } from "../../api/types";
import { useAuth } from "../../state/auth";
import { formatDate } from "../../utils/format";
import { getErrorMessage } from "../../utils/apiError";
import { Alert } from "../ui/Alert";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Modal } from "../ui/Modal";
import { useToast } from "../ui/toast";

export function TenantsPanel() {
  const { token, user } = useAuth();
  const toast = useToast();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selected, setSelected] = useState<Tenant | null>(null);
  const [members, setMembers] = useState<TenantUserInfo[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<{ id: number; name: string } | null>(null);
  const [removingMember, setRemovingMember] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetchTenants();
  }, [token]);

  const fetchTenants = async () => {
    if (!token) return;
    setLoadingTenants(true);
    setMessage(null);
    try {
      const data = await request<Tenant[]>("/tenants", { token });
      setTenants(data);
      if (data.length) {
        void selectTenant(data[0].id);
      } else {
        setSelected(null);
        setMembers([]);
      }
    } catch (err) {
      setMessage(getErrorMessage(err).message || "Não foi possível carregar suas organizações.");
    } finally {
      setLoadingTenants(false);
    }
  };

  const selectTenant = async (id: number) => {
    if (!token) return;
    setLoadingMembers(true);
    setMessage(null);
    try {
      const detail = await request<Tenant>(`/tenants/${id}`, { token });
      const users = await request<TenantUserInfo[]>(`/tenants/${id}/users`, { token });
      setSelected(detail);
      setMembers(users);
    } catch (err) {
      setMessage(getErrorMessage(err).message || "Não foi possível carregar os detalhes.");
    } finally {
      setLoadingMembers(false);
    }
  };

  const removeMember = async (memberId: number) => {
    if (!token || !selected) return;
    setMessage(null);
    setRemovingMember(true);
    try {
      await request(`/tenants/${selected.id}/users/${memberId}`, {
        method: "DELETE",
        token,
      });
      await selectTenant(selected.id);
      toast.success("Membro removido.");
    } catch (err) {
      setMessage(getErrorMessage(err).message || "Não foi possível remover o membro.");
    } finally {
      setRemovingMember(false);
    }
  };

  const currentRole = members.find((m) => m.userId === user?.id)?.role;
  const canManage =
    user?.roleId === 1 || currentRole === "owner" || currentRole === "admin";

  return (
    <Card
      title="Organizações"
      right={
        <Button variant="secondary" type="button" onClick={fetchTenants} disabled={loadingTenants} loading={loadingTenants}>
          Atualizar
        </Button>
      }
    >
      {message && <Alert variant="error">{message}</Alert>}
      <div className="grid two">
        <div className="list">
          {loadingTenants && <div className="muted">Carregando organizações...</div>}
          {!loadingTenants &&
            tenants.map((t) => (
              <div key={t.id} className="list-item">
                <div className="tenant-meta" style={{ flex: 1 }}>
                  <strong style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-primary)' }}>{t.name}</strong>
                  <span className="muted small" style={{ marginBottom: 'var(--space-xs)', display: 'block' }}>{t.description || "Sem descrição"}</span>
                  <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                    <span className="pill" style={{ fontSize: '10px', padding: '2px 8px' }}>{t.status}</span>
                  </div>
                </div>
                <Button variant="secondary" size="sm" type="button" onClick={() => selectTenant(t.id)} disabled={loadingMembers}>
                  Gerenciar
                </Button>
              </div>
            ))}
          {!loadingTenants && tenants.length === 0 && (
            <div className="muted">
              Você ainda não participa de nenhuma organização.
            </div>
          )}
        </div>
        <Card strong title="Detalhes">
          {loadingMembers && <div className="muted">Carregando detalhes...</div>}
          {!loadingMembers && selected && (
            <div className="stack">
              <div className="pill-row" style={{ marginBottom: 'var(--space-md)' }}>
                <span className="badge info" style={{ borderRadius: 'var(--radius-md)' }}>ID: {selected.id}</span>
                <span className={`badge ${selected.status === 'active' ? 'success' : 'warning'}`} style={{ borderRadius: 'var(--radius-md)' }}>{selected.status}</span>
              </div>
              <div className="surface" style={{ padding: 'var(--space-lg)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-tertiary)' }}>
                <h3 style={{ marginBottom: 'var(--space-xs)' }}>{selected.name}</h3>
                <div className="muted small" style={{ marginBottom: 'var(--space-sm)' }}>{selected.description || "Sem descrição"}</div>
                <div className="muted small" style={{ fontSize: '11px', opacity: 0.6 }}>Criado em {formatDate(selected.created_at)}</div>
              </div>
              <div className="divider" />
              <div className="stack">
                <div className="card-title">Membros</div>
                <div className="list">
                  {members.map((m) => (
                    <div key={m.userId} className="list-item">
                      <div className="tenant-meta">
                        <strong>{m.name}</strong>
                        <span className="muted small">{m.email}</span>
                        <span className="pill">Perfil: {m.role}</span>
                      </div>
                      {canManage && m.userId !== user?.id && (
                        <Button
                          variant="danger"
                          type="button"
                          onClick={() => setConfirmRemove({ id: m.userId, name: m.name })}
                        >
                          Remover
                        </Button>
                      )}
                    </div>
                  ))}
                  {!members.length && <div className="muted">Nenhum membro listado.</div>}
                </div>
              </div>
            </div>
          )}
          {!loadingMembers && !selected && (
            <div className="muted">Selecione uma organização para ver os detalhes.</div>
          )}
        </Card>
      </div>
      <Modal
        open={Boolean(confirmRemove)}
        title="Remover membro"
        description={
          confirmRemove
            ? `Tem certeza que deseja remover ${confirmRemove.name} desta organização?`
            : undefined
        }
        onClose={() => setConfirmRemove(null)}
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setConfirmRemove(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              type="button"
              onClick={async () => {
                if (!confirmRemove) return;
                const memberId = confirmRemove.id;
                setConfirmRemove(null);
                await removeMember(memberId);
              }}
              loading={removingMember}
              disabled={removingMember}
            >
              Remover
            </Button>
          </>
        }
      />
    </Card>
  );
}
