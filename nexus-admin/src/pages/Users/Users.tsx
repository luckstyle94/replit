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
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1>Gerenciar Usuários</h1>
        <button onClick={() => setShowCreateModal(true)}>Novo Usuário</button>
      </div>
      {actionMessage && <div className="info-block">{actionMessage}</div>}

      {showCreateModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '400px', backgroundColor: 'white' }}>
            <h3>Novo Usuário</h3>
            <form onSubmit={handleCreateUser} className="stack">
              <label>
                Nome
                <input
                  value={newUser.name}
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
                  required
                />
              </label>
              <label>
                Senha
                <input
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  type="password"
                  required
                  minLength={12}
                />
              </label>
              <label>
                Role
                <select 
                  value={newUser.roleId} 
                  onChange={(e) => setNewUser({ ...newUser, roleId: Number(e.target.value) })}
                >
                  <option value={1}>Admin Global</option>
                  <option value={2}>Usuário Comum</option>
                </select>
              </label>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit">Criar</button>
                <button type="button" className="secondary" onClick={() => setShowCreateModal(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddToTenantModal && selectedUser && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '400px', backgroundColor: 'white' }}>
            <h3>Adicionar {selectedUser.name} a uma Empresa</h3>
            <form onSubmit={handleAddToTenant} className="stack">
              <label>
                Empresa
                <select 
                  value={addToTenantData.tenantId} 
                  onChange={(e) => setAddToTenantData({ ...addToTenantData, tenantId: Number(e.target.value) })}
                >
                  {tenants.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </label>
              <label>
                Role na Empresa
                <select 
                  value={addToTenantData.role} 
                  onChange={(e) => setAddToTenantData({ ...addToTenantData, role: e.target.value })}
                >
                  <option value="member">Membro</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" disabled={tenants.length === 0}>Adicionar</button>
                <button type="button" className="secondary" onClick={() => setShowAddToTenantModal(false)}>Cancelar</button>
              </div>
              {tenants.length === 0 && <small style={{ color: '#c53030' }}>Nenhuma empresa disponível. Crie uma empresa primeiro.</small>}
            </form>
          </div>
        </div>
      )}

      <div className="grid">
        {users.map((user) => (
          <div key={user.id} className="card">
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <h3>{user.name}</h3>
                <span style={{ 
                    padding: '2px 6px', 
                    borderRadius: '4px', 
                    fontSize: '0.8rem',
                    backgroundColor: user.status === 'active' ? '#e6fffa' : '#fff5f5',
                    color: user.status === 'active' ? '#2c7a7b' : '#c53030'
                }}>
                    {user.status}
                </span>
            </div>
            <p>{user.email}</p>
            <p><small>Role ID: {user.roleId}</small></p>
            <p><small>MFA: {user.mfaEnabled ? "Ativo" : "Pendente"}</small></p>
            <div style={{ marginTop: '8px' }}>
              <strong>Empresas</strong>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                {userTenants[user.id]?.length ? (
                  userTenants[user.id].map((tenant) => (
                    <div key={tenant.tenantId} className="tag" style={{ backgroundColor: '#eef2ff', padding: '8px', borderRadius: '6px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong>{tenant.tenantName}</strong>
                        <span style={{ color: '#4a5568' }}>Role no tenant: {tenant.role}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <select
                          value={tenant.role}
                          onChange={(e) => handleChangeTenantRole(tenant.tenantId, user.id, e.target.value)}
                          style={{ fontSize: '12px' }}
                        >
                          <option value="member">Membro</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          onClick={() => handleRemoveFromTenant(tenant.tenantId, user.id)}
                          style={{ marginLeft: '6px', border: 'none', background: 'none', cursor: 'pointer', color: '#c53030' }}
                          aria-label={`Remover ${user.name} da empresa ${tenant.tenantName}`}
                        >
                          x
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <span style={{ fontSize: '12px', color: '#718096' }}>Sem empresas vinculadas</span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                <button className="small" onClick={() => openAddToTenantModal(user)}>
                    + Empresa
                </button>
                <button className="small secondary" onClick={() => handleChangePassword(user)}>
                    Alterar senha
                </button>
                <button className="small secondary" onClick={() => handleResetMFA(user)}>
                    Resetar MFA
                </button>
                <button 
                    className={`small ${user.status === 'active' ? 'secondary' : ''}`}
                    onClick={() => handleToggleStatus(user)}
                >
                    {user.status === 'active' ? 'Desativar' : 'Ativar'}
                </button>
                <button className="secondary small" onClick={() => handleDeleteUser(user.id)} style={{ color: 'red', borderColor: 'red' }}>
                Deletar
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
