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
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1>Gerenciar Empresas</h1>
        <button onClick={() => setShowCreateModal(true)}>Nova Empresa</button>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <div className="card" style={{ width: '400px', backgroundColor: 'white' }}>
            <h3>Nova Empresa</h3>
            <form onSubmit={handleCreateTenant} className="stack">
              <label>
                Nome
                <input
                  value={newTenant.name}
                  onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                  required
                />
              </label>
              <label>
                Descrição
                <input
                  value={newTenant.description}
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
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit">Criar</button>
                <button type="button" className="secondary" onClick={() => setShowCreateModal(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid">
        {tenants.map((tenant) => (
          <div key={tenant.id} className="card">
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <h3>{tenant.name}</h3>
                <button 
                    className={`small ${tenant.status === 'active' ? 'secondary' : ''}`}
                    onClick={() => handleToggleStatus(tenant)}
                    style={{ marginLeft: '10px' }}
              >
                {tenant.status === 'active' ? 'Desativar' : 'Ativar'}
              </button>
              
              <button 
                className="secondary small" 
                onClick={() => handleDeleteTenant(tenant.id)} 
                style={{ marginLeft: '10px', color: 'red', borderColor: 'red' }}
              >
                Deletar
              </button>
            </div>
            
            <p className="text-sm text-gray-600">{tenant.description}</p>
            <p className="text-xs text-gray-500 mt-2">Status: {tenant.status}</p>
            <p className="text-xs text-gray-500 mt-1">CNPJ: {tenant.cnpj || "não informado"}</p>

            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label className="text-xs">
                Editar descrição
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
              <label className="text-xs">
                Editar CNPJ
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
                Salvar empresa
              </button>
            </div>

            <div style={{ marginTop: '15px' }}>
              <strong>Features</strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px', marginTop: '5px' }}>
                  {tenant.features && tenant.features.map(f => (
                      <span key={f.id} className="tag" style={{ backgroundColor: '#e2e8f0', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', display: 'flex', alignItems: 'center' }}>
                          {f.key}
                          <button onClick={() => handleDisableFeature(tenant.id, f.id)} style={{ marginLeft: '5px', border: 'none', background: 'none', cursor: 'pointer', color: '#666' }}>x</button>
                      </span>
                  ))}
                  {(!tenant.features || tenant.features.length === 0) && <span style={{fontSize: '12px', color: '#999'}}>Nenhuma feature ativa.</span>}
              </div>

              <select 
                  onChange={(e) => {
                      if(e.target.value) handleEnableFeature(tenant.id, Number(e.target.value));
                  }}
                  value=""
                  style={{ fontSize: '12px', padding: '4px' }}
              >
                  <option value="">+ Adicionar Feature</option>
                  {features.filter(f => !tenant.features?.some(tf => tf.id === f.id)).map(f => (
                      <option key={f.id} value={f.id}>{f.key}</option>
                  ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
