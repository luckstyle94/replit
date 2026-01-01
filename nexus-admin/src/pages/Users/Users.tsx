import { useEffect, useState, FormEvent } from "react";
import { isAxiosError } from "axios";
import api from "../../services/api";
import { User, Tenant, TenantMembership } from "../../api/types";

export function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [userTenants, setUserTenants] = useState<Record<number, TenantMembership[]>>({});
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddToTenantModal, setShowAddToTenantModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", roleId: 2 });
  const [addToTenantData, setAddToTenantData] = useState({ tenantId: 0, role: "member" });
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const logError = (label: string, error: unknown) => {
    if (isAxiosError(error)) {
      console.warn(label, error.response?.status ?? "unknown", error.message);
      return;
    }
    if (error instanceof Error) {
      console.warn(label, error.message);
      return;
    }
    console.warn(label);
  };

  useEffect(() => {
    loadUsers();
    loadTenants();
  }, []);

  async function loadUsers() {
    try {
      const { data } = await api.get<{ data: User[] }>("/users?limit=200&page=1");
      setUsers(data.data);
      await loadTenantsForUsers(data.data);
    } catch (error) {
      logError("Failed to load users", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadTenants() {
      try {
          const { data } = await api.get<Tenant[]>("/tenants/all");
          setTenants(data);
      } catch (error) {
          logError("Failed to load tenants", error);
      }
  }

  // Busca as empresas que um usuário específico participa para exibir/remover.
  async function loadTenantsForUsers(list: User[]) {
    if (!list.length) {
      setUserTenants({});
      return;
    }
    try {
      const responses = await Promise.all(
        list.map(async (user) => ({
          userId: user.id,
          memberships: (await api.get<TenantMembership[]>(`/tenants/user/${user.id}/memberships`)).data,
        }))
      );
      const mapped: Record<number, TenantMembership[]> = {};
      responses.forEach(({ userId, memberships }) => {
        mapped[userId] = memberships;
      });
      setUserTenants(mapped);
    } catch (error) {
      logError("Failed to load user tenants", error);
    }
  }

  async function refreshUserTenants(userId: number) {
    try {
      const { data } = await api.get<TenantMembership[]>(`/tenants/user/${userId}/memberships`);
      setUserTenants((prev) => ({ ...prev, [userId]: data }));
    } catch (error) {
      logError("Failed to refresh user tenants", error);
    }
  }

  async function handleCreateUser(e: FormEvent) {
    e.preventDefault();
    try {
      await api.post("/users", newUser);
      setShowCreateModal(false);
      setNewUser({ name: "", email: "", password: "", roleId: 2 });
      loadUsers();
    } catch (error) {
      logError("Failed to create user", error);
      const message =
        (error as any)?.response?.data?.error ||
        (error as any)?.message ||
        "Erro ao criar usuário.";
      alert(message);
    }
  }

  async function handleDeleteUser(id: number) {
    if (!confirm("Tem certeza que deseja deletar este usuário?")) return;
    try {
      await api.delete(`/users/${id}`);
      loadUsers();
    } catch (error) {
      logError("Failed to delete user", error);
      alert("Erro ao deletar usuário.");
    }
  }

  async function handleToggleStatus(user: User) {
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      if (!confirm(`Deseja alterar o status para ${newStatus}?`)) return;
      try {
          await api.put(`/users/${user.id}`, { status: newStatus });
          loadUsers();
      } catch (error) {
          logError("Failed to update status", error);
          alert("Erro ao atualizar status.");
      }
  }

  async function handleResetMFA(user: User) {
    if (!confirm(`Resetar MFA para ${user.name}?`)) return;
    try {
      await api.post(`/mfa/users/${user.id}/disable`);
      setActionMessage(`MFA resetado para ${user.name}.`);
      loadUsers();
    } catch (error) {
      logError("Failed to reset MFA", error);
      alert("Erro ao resetar MFA.");
    }
  }

  // Permite ao administrador redefinir a senha de um usuário diretamente.
  async function handleChangePassword(user: User) {
      const newPassword = prompt(`Digite a nova senha para ${user.name} (mínimo 12 caracteres):`);
      if (!newPassword) return;
      if (newPassword.length < 12) {
          alert("A senha deve ter pelo menos 12 caracteres.");
          return;
      }
      try {
          await api.put(`/users/${user.id}`, { password: newPassword });
          alert("Senha atualizada com sucesso.");
      } catch (error) {
          logError("Failed to change password", error);
          const message =
            (error as any)?.response?.data?.error ||
            (error as any)?.message ||
            "Erro ao alterar senha.";
          alert(message);
      }
  }

  async function handleAddToTenant(e: FormEvent) {
      e.preventDefault();
      if (!selectedUser || addToTenantData.tenantId === 0) return;
      
      try {
          await api.post(`/tenants/${addToTenantData.tenantId}/users`, {
              user_id: selectedUser.id,
              role: addToTenantData.role
          });
          alert("Usuário adicionado à empresa!");
          setShowAddToTenantModal(false);
          refreshUserTenants(selectedUser.id);
      } catch (error) {
          logError("Failed to add user to tenant", error);
          alert("Erro ao adicionar usuário à empresa.");
      }
  }

  function openAddToTenantModal(user: User) {
      setSelectedUser(user);
      setAddToTenantData({ tenantId: tenants.length > 0 ? tenants[0].id : 0, role: "member" });
      setShowAddToTenantModal(true);
  }

  // Remove a associação do usuário com uma empresa específica.
  async function handleRemoveFromTenant(tenantId: number, userId: number) {
      if (!confirm("Remover este usuário da empresa?")) return;
      try {
          await api.delete(`/tenants/${tenantId}/users/${userId}`);
          refreshUserTenants(userId);
      } catch (error) {
          logError("Failed to remove user from tenant", error);
          alert("Erro ao remover usuário da empresa.");
      }
  }

  async function handleChangeTenantRole(tenantId: number, userId: number, role: string) {
    try {
      await api.put(`/tenants/${tenantId}/users/${userId}/role`, { role });
      refreshUserTenants(userId);
    } catch (error) {
      logError("Failed to change tenant role", error);
      alert("Erro ao atualizar papel no tenant.");
    }
  }

  if (loading) return <p>Carregando usuários...</p>;

  return (
    <div className="shell">
      <div className="header">
        <div className="header-title">
          <h1>Gerenciar Usuários</h1>
          <p className="muted">Controle de acessos, permissões e autenticação MFA.</p>
        </div>
        <button onClick={() => setShowCreateModal(true)}>
          <span style={{ marginRight: '0.5rem' }}>+</span> Novo Usuário
        </button>
      </div>
      
      {actionMessage && (
        <div className="info" style={{ marginBottom: '1.5rem' }}>
          {actionMessage}
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '440px', padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Novo Usuário</h3>
            <form onSubmit={handleCreateUser} className="stack">
              <label>
                Nome
                <input
                  value={newUser.name}
                  placeholder="Nome completo"
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  required
                />
              </label>
              <label>
                Email
                <input
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  type="email"
                  placeholder="exemplo@nexus.com"
                  required
                />
              </label>
              <label>
                Senha
                <input
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  type="password"
                  placeholder="Mínimo 12 caracteres"
                  required
                  minLength={12}
                />
              </label>
              <label>
                Nível de Acesso
                <select 
                  className="secondary"
                  value={newUser.roleId} 
                  onChange={(e) => setNewUser({ ...newUser, roleId: Number(e.target.value) })}
                  style={{ height: '42px' }}
                >
                  <option value={1}>Admin Global (Super Admin)</option>
                  <option value={2}>Usuário Comum (Tenant Admin/User)</option>
                </select>
              </label>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="submit" style={{ flex: 1 }}>Criar Usuário</button>
                <button type="button" className="secondary" style={{ flex: 1 }} onClick={() => setShowCreateModal(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddToTenantModal && selectedUser && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '440px', padding: '2rem' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>Vincular Empresa</h3>
            <p className="muted" style={{ marginBottom: '1.5rem' }}>Usuário: <strong>{selectedUser.name}</strong></p>
            <form onSubmit={handleAddToTenant} className="stack">
              <label>
                Empresa
                <select 
                  className="secondary"
                  value={addToTenantData.tenantId} 
                  onChange={(e) => setAddToTenantData({ ...addToTenantData, tenantId: Number(e.target.value) })}
                  style={{ height: '42px' }}
                >
                  {tenants.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Papel na Empresa
                <select 
                  className="secondary"
                  value={addToTenantData.role} 
                  onChange={(e) => setAddToTenantData({ ...addToTenantData, role: e.target.value })}
                  style={{ height: '42px' }}
                >
                  <option value="member">Membro (Visualização)</option>
                  <option value="admin">Administrador (Total)</option>
                </select>
              </label>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="submit" disabled={tenants.length === 0} style={{ flex: 1 }}>Vincular</button>
                <button type="button" className="secondary" style={{ flex: 1 }} onClick={() => setShowAddToTenantModal(false)}>Cancelar</button>
              </div>
              {tenants.length === 0 && <p className="error" style={{ marginTop: '0.5rem' }}>Nenhuma empresa disponível.</p>}
            </form>
          </div>
        </div>
      )}

      <div className="grid">
        {users.map((user) => (
          <div key={user.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0 }}>{user.name}</h3>
                <p className="muted" style={{ fontSize: '0.8125rem', marginTop: '0.25rem' }}>{user.email}</p>
              </div>
              <span style={{ 
                  padding: '0.25rem 0.5rem', 
                  borderRadius: '6px', 
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  backgroundColor: user.status === 'active' ? '#f0fdf4' : '#fef2f2',
                  color: user.status === 'active' ? '#16a34a' : '#ef4444',
                  border: `1px solid ${user.status === 'active' ? '#dcfce7' : '#fee2e2'}`
              }}>
                  {user.status}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <div style={{ flex: 1 }}>
                <p className="muted" style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: '600', marginBottom: '0.25rem' }}>Acesso</p>
                <p style={{ fontSize: '0.875rem', fontWeight: '500' }}>{user.roleId === 1 ? 'Global Admin' : 'Regular User'}</p>
              </div>
              <div style={{ flex: 1 }}>
                <p className="muted" style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: '600', marginBottom: '0.25rem' }}>Segurança MFA</p>
                <p style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: '500',
                  color: user.mfaEnabled ? '#16a34a' : '#f59e0b'
                }}>
                  {user.mfaEnabled ? '✓ Ativo' : '⚠ Pendente'}
                </p>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <strong style={{ fontSize: '0.8125rem', color: 'var(--text-main)' }}>Empresas Vinculadas</strong>
                <button className="secondary small" onClick={() => openAddToTenantModal(user)} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                  + Vincular
                </button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {userTenants[user.id]?.length ? (
                  userTenants[user.id].map((tenant) => (
                    <div key={tenant.tenantId} style={{ 
                      backgroundColor: '#f8fafc', 
                      padding: '0.75rem', 
                      borderRadius: '8px', 
                      border: '1px solid #e2e8f0',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <p style={{ fontSize: '0.8125rem', fontWeight: '600', margin: 0 }}>{tenant.tenantName}</p>
                        <select
                          value={tenant.role}
                          onChange={(e) => handleChangeTenantRole(tenant.tenantId, user.id, e.target.value)}
                          style={{ 
                            fontSize: '0.7rem', 
                            border: 'none', 
                            background: 'none', 
                            color: 'var(--accent)', 
                            padding: 0, 
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="member">Papel: Membro</option>
                          <option value="admin">Papel: Admin</option>
                        </select>
                      </div>
                      <button
                        onClick={() => handleRemoveFromTenant(tenant.tenantId, user.id)}
                        style={{ background: 'none', color: '#94a3b8', fontSize: '1.25rem', padding: '0 0.5rem' }}
                        title="Remover"
                      >×</button>
                    </div>
                  ))
                ) : (
                  <p className="muted" style={{ fontSize: '0.75rem', fontStyle: 'italic', textAlign: 'center', padding: '0.5rem' }}>Sem empresas vinculadas</p>
                )}
              </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button className="secondary small" onClick={() => handleChangePassword(user)} style={{ fontSize: '0.75rem' }}>
                    Nova Senha
                </button>
                <button className="secondary small" onClick={() => handleResetMFA(user)} style={{ fontSize: '0.75rem' }}>
                    Reset MFA
                </button>
                <button 
                    className={`small ${user.status === 'active' ? 'secondary' : ''}`}
                    onClick={() => handleToggleStatus(user)}
                    style={{ fontSize: '0.75rem' }}
                >
                    {user.status === 'active' ? 'Desativar' : 'Ativar'}
                </button>
                <button 
                  className="secondary small" 
                  onClick={() => handleDeleteUser(user.id)} 
                  style={{ fontSize: '0.75rem', color: '#ef4444', borderColor: '#fecaca' }}
                >
                  Excluir
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
