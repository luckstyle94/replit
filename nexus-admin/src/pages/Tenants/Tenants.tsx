import { useEffect, useState, FormEvent } from "react";
import { isAxiosError } from "axios";
import api from "../../services/api";
import { Tenant, Feature } from "../../api/types";

export function Tenants() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTenant, setNewTenant] = useState({ name: "", description: "", cnpj: "" });
  const [editFields, setEditFields] = useState<Record<number, { description: string; cnpj: string }>>({});

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
    loadTenants();
    loadFeatures();
  }, []);

  async function loadTenants() {
    try {
      const { data } = await api.get<Tenant[]>("/tenants/all");
      setTenants(data);
      const mapped: Record<number, { description: string; cnpj: string }> = {};
      data.forEach((t) => {
        mapped[t.id] = { description: t.description || "", cnpj: t.cnpj || "" };
      });
      setEditFields(mapped);
    } catch (error) {
      logError("Failed to load tenants", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadFeatures() {
    try {
      const { data } = await api.get<Feature[]>("/features");
      setFeatures(data);
    } catch (error) {
      logError("Failed to load features", error);
    }
  }

  async function handleCreateTenant(e: FormEvent) {
    e.preventDefault();
    try {
      const payload: any = { name: newTenant.name, description: newTenant.description };
      if (newTenant.cnpj.trim()) payload.cnpj = newTenant.cnpj.trim();
      await api.post("/tenants", payload);
      setShowCreateModal(false);
      setNewTenant({ name: "", description: "", cnpj: "" });
      loadTenants();
    } catch (error) {
      logError("Failed to create tenant", error);
      alert("Erro ao criar empresa.");
    }
  }

  async function handleEnableFeature(tenantId: number, featureId: number) {
    try {
      await api.post(`/tenants/${tenantId}/features`, { feature_id: featureId });
      loadTenants(); // Reload to update UI
    } catch (error) {
      logError("Failed to enable feature", error);
      alert("Erro ao habilitar feature.");
    }
  }

  async function handleDisableFeature(tenantId: number, featureId: number) {
      if (!confirm("Remover feature desta empresa?")) return;
      try {
        await api.delete(`/tenants/${tenantId}/features/${featureId}`);
        loadTenants(); // Reload to update UI
      } catch (error) {
        logError("Failed to disable feature", error);
        alert("Erro ao remover feature.");
      }
  }

  async function handleToggleStatus(tenant: Tenant) {
      const newStatus = tenant.status === 'active' ? 'inactive' : 'active';
      if (!confirm(`Deseja alterar o status para ${newStatus}?`)) return;
      try {
          await api.put(`/tenants/${tenant.id}/status`, { status: newStatus });
          loadTenants();
      } catch (error) {
          logError("Failed to update status", error);
          alert("Erro ao atualizar status.");
      }
  }

  async function handleDeleteTenant(id: number) {
      if (!confirm("Tem certeza que deseja DELETAR permanentemente esta empresa? Todos os dados serão perdidos.")) return;
      try {
          await api.delete(`/tenants/${id}`);
          loadTenants();
      } catch (error) {
          logError("Failed to delete tenant", error);
          alert("Erro ao deletar empresa.");
      }
  }

  async function handleUpdateTenant(id: number) {
    const current = editFields[id] || { description: "", cnpj: "" };
    const payload: any = { description: current.description };
    payload.cnpj = current.cnpj.trim() ? current.cnpj.trim() : null;
    try {
      await api.put(`/tenants/${id}`, payload);
      loadTenants();
      alert("Empresa atualizada.");
    } catch (error) {
      logError("Failed to update tenant", error);
      alert("Erro ao atualizar empresa.");
    }
  }

  if (loading) return <p>Carregando empresas...</p>;

  return (
    <div className="shell">
      <div className="header">
        <div className="header-title">
          <h1>Gerenciar Empresas</h1>
          <p className="muted">Visualize e administre todos os tenants da plataforma.</p>
        </div>
        <button onClick={() => setShowCreateModal(true)}>
          <span style={{ marginRight: '0.5rem' }}>+</span> Nova Empresa
        </button>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '440px', padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Nova Empresa</h3>
            <form onSubmit={handleCreateTenant} className="stack">
              <label>
                Nome
                <input
                  value={newTenant.name}
                  placeholder="Ex: Nexus Corp"
                  onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                  required
                />
              </label>
              <label>
                Descrição
                <input
                  value={newTenant.description}
                  placeholder="Descrição breve da empresa"
                  onChange={(e) => setNewTenant({ ...newTenant, description: e.target.value })}
                />
              </label>
              <label>
                CNPJ (opcional)
                <input
                  value={newTenant.cnpj}
                  onChange={(e) => setNewTenant({ ...newTenant, cnpj: e.target.value })}
                  placeholder="Somente números"
                />
              </label>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="submit" style={{ flex: 1 }}>Criar</button>
                <button type="button" className="secondary" style={{ flex: 1 }} onClick={() => setShowCreateModal(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid">
        {tenants.map((tenant) => (
          <div key={tenant.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0 }}>{tenant.name}</h3>
                <span style={{ 
                  display: 'inline-block',
                  marginTop: '0.5rem',
                  padding: '0.25rem 0.5rem', 
                  borderRadius: '6px', 
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  backgroundColor: tenant.status === 'active' ? '#f0fdf4' : '#fef2f2',
                  color: tenant.status === 'active' ? '#16a34a' : '#ef4444',
                  border: `1px solid ${tenant.status === 'active' ? '#dcfce7' : '#fee2e2'}`
                }}>
                  {tenant.status === 'active' ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                    className="secondary small"
                    onClick={() => handleToggleStatus(tenant)}
                    style={{ padding: '0.4rem 0.6rem' }}
                    title={tenant.status === 'active' ? 'Desativar' : 'Ativar'}
                >
                  {tenant.status === 'active' ? '⏸' : '▶'}
                </button>
                <button 
                  className="secondary small" 
                  onClick={() => handleDeleteTenant(tenant.id)} 
                  style={{ padding: '0.4rem 0.6rem', color: '#ef4444', borderColor: '#fecaca' }}
                  title="Deletar"
                >
                  🗑
                </button>
              </div>
            </div>
            
            <div style={{ fontSize: '0.875rem' }}>
              <p className="muted" style={{ marginBottom: '0.5rem' }}>{tenant.description || "Sem descrição disponível."}</p>
              <p className="muted" style={{ fontSize: '0.75rem' }}>CNPJ: <strong>{tenant.cnpj || "não informado"}</strong></p>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <details style={{ width: '100%' }}>
                <summary style={{ cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Editar Informações</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>▼</span>
                </summary>
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <label>
                    Descrição
                    <input
                      value={editFields[tenant.id]?.description ?? ""}
                      onChange={(e) =>
                        setEditFields((prev) => ({
                          ...prev,
                          [tenant.id]: { ...(prev[tenant.id] || { description: "", cnpj: "" }), description: e.target.value },
                        }))
                      }
                    />
                  </label>
                  <label>
                    CNPJ
                    <input
                      value={editFields[tenant.id]?.cnpj ?? ""}
                      placeholder="Somente números"
                      onChange={(e) =>
                        setEditFields((prev) => ({
                          ...prev,
                          [tenant.id]: { ...(prev[tenant.id] || { description: "", cnpj: "" }), cnpj: e.target.value },
                        }))
                      }
                    />
                  </label>
                  <button className="small" onClick={() => handleUpdateTenant(tenant.id)}>
                    Atualizar Dados
                  </button>
                </div>
              </details>

              <div>
                <strong style={{ fontSize: '0.875rem', display: 'block', marginBottom: '0.75rem' }}>Features Habilitadas</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    {tenant.features && tenant.features.map(f => (
                        <span key={f.id} style={{ 
                          backgroundColor: '#f1f5f9', 
                          border: '1px solid #e2e8f0',
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '6px', 
                          fontSize: '0.75rem', 
                          fontWeight: '500',
                          display: 'flex', 
                          alignItems: 'center',
                          gap: '0.375rem'
                        }}>
                            {f.key}
                            <button 
                              onClick={() => handleDisableFeature(tenant.id, f.id)} 
                              style={{ padding: 0, background: 'none', color: '#94a3b8', fontSize: '1rem', lineHeight: 1 }}
                              title="Remover"
                            >×</button>
                        </span>
                    ))}
                    {(!tenant.features || tenant.features.length === 0) && <span style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Nenhuma feature ativa.</span>}
                </div>

                <select 
                    className="secondary"
                    onChange={(e) => {
                        if(e.target.value) handleEnableFeature(tenant.id, Number(e.target.value));
                    }}
                    value=""
                    style={{ width: '100%', fontSize: '0.75rem', height: '32px', padding: '0 0.5rem' }}
                >
                    <option value="">+ Adicionar Feature</option>
                    {features.filter(f => !tenant.features?.some(tf => tf.id === f.id)).map(f => (
                        <option key={f.id} value={f.id}>{f.key}</option>
                    ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
