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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
        {loadingTenants && <div className="muted">Carregando organizações...</div>}
        {!loadingTenants &&
          tenants.map((t) => (
            <div 
              key={t.id} 
              className={`card ${selected?.id === t.id ? 'strong' : ''}`}
              style={{ 
                cursor: 'pointer', 
                transition: 'all 0.2s ease',
                border: selected?.id === t.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                padding: 'var(--space-md)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 'var(--space-sm)'
              }}
              onClick={() => selectTenant(t.id)}
            >
              <div className="tenant-meta">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <strong style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-text-primary)' }}>{t.name}</strong>
                  <span className={`badge ${t.status === 'active' ? 'success' : 'warning'}`} style={{ fontSize: '10px' }}>{t.status}</span>
                </div>
                <p className="muted small" style={{ marginTop: 'var(--space-xs)', minHeight: '3em' }}>{t.description || "Sem descrição"}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-sm)' }}>
                <Button variant={selected?.id === t.id ? 'primary' : 'secondary'} size="sm" type="button" disabled={loadingMembers}>
                  {selected?.id === t.id ? 'Selecionado' : 'Selecionar'}
                </Button>
              </div>
            </div>
          ))}
        {!loadingTenants && tenants.length === 0 && (
          <div className="muted">Você ainda não participa de nenhuma organização.</div>
        )}
      </div>

      {selected && (
        <Card strong title="Detalhes da Organização" style={{ marginTop: 'var(--space-xl)' }}>
          {loadingMembers && <div className="muted">Carregando detalhes...</div>}
          {!loadingMembers && (
            <div className="stack">
              <div className="surface" style={{ padding: 'var(--space-lg)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                   <h2 style={{ margin: 0 }}>{selected.name}</h2>
                   <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                     <span className="badge info">ID: {selected.id}</span>
                     {selected.cnpj && <span className="badge info">CNPJ: {selected.cnpj}</span>}
                   </div>
                </div>
                <div className="muted" style={{ marginBottom: 'var(--space-md)' }}>{selected.description || "Sem descrição"}</div>
                <div className="muted small" style={{ opacity: 0.6 }}>Criado em {formatDate(selected.created_at)}</div>
              </div>
              
              <div className="divider">Membros da Equipe</div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 'var(--space-md)' }}>
                {members.map((m) => (
              <div key={m.userId} className="list-item" style={{ padding: 'var(--space-md)', background: 'var(--color-bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-md)' }}>
                <div className="tenant-meta" style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</strong>
                  <span className="muted small" style={{ display: 'block', marginBottom: 'var(--space-xs)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email}</span>
                  <span className="badge" style={{ fontSize: '10px' }}>{m.role}</span>
                </div>
                {canManage && m.userId !== user?.id && (
                  <div style={{ flexShrink: 0 }}>
                    <Button
                      variant="danger"
                      size="sm"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmRemove({ id: m.userId, name: m.name });
                      }}
                    >
                      Remover
                    </Button>
                  </div>
                )}
              </div>
                ))}
                {!members.length && <div className="muted">Nenhum membro listado.</div>}
              </div>
            </div>
          )}
        </Card>
      )}
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
