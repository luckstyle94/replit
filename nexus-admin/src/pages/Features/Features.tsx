import { useEffect, useState, FormEvent } from "react";
import { isAxiosError } from "axios";
import api from "../../services/api";
import { Feature } from "../../api/types";

export function Features() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFeature, setNewFeature] = useState({ name: "", key: "", description: "" });

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
    loadFeatures();
  }, []);

  async function loadFeatures() {
    try {
      const { data } = await api.get<Feature[]>("/features");
      setFeatures(data);
    } catch (error) {
      logError("Failed to load features", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateFeature(e: FormEvent) {
    e.preventDefault();
    try {
      await api.post("/features", newFeature);
      setShowCreateModal(false);
      setNewFeature({ name: "", key: "", description: "" });
      loadFeatures();
    } catch (error) {
      logError("Failed to create feature", error);
      alert("Erro ao criar feature.");
    }
  }

  async function handleDeleteFeature(id: number) {
    if (!confirm("Tem certeza que deseja deletar esta feature?")) return;
    try {
      await api.delete(`/features/${id}`);
      loadFeatures();
    } catch (error) {
      logError("Failed to delete feature", error);
      alert("Erro ao deletar feature.");
    }
  }

  async function handleToggleFeatureStatus(id: number, currentStatus: string) {
      const newStatus = currentStatus === 'inactive' ? 'active' : 'inactive';
      try {
          await api.put(`/features/${id}/status`, { status: newStatus });
          loadFeatures();
      } catch (error) {
          logError("Failed to update feature status", error);
          alert("Erro ao atualizar status da feature.");
      }
  }

  if (loading) return <p>Carregando features...</p>;

  return (
    <div className="shell">
      <div className="header">
        <div className="header-title">
          <h1>Gerenciar Features</h1>
          <p className="muted">Controle de funcionalidades e flags do sistema.</p>
        </div>
        <button onClick={() => setShowCreateModal(true)}>
          <span style={{ marginRight: '0.5rem' }}>+</span> Nova Feature
        </button>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '440px', padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Nova Feature</h3>
            <form onSubmit={handleCreateFeature} className="stack">
              <label>
                Nome
                <input
                  value={newFeature.name}
                  placeholder="Ex: Modo Escuro"
                  onChange={(e) => setNewFeature({ ...newFeature, name: e.target.value })}
                  required
                />
              </label>
              <label>
                Chave (Código Único)
                <input
                  value={newFeature.key}
                  onChange={(e) => setNewFeature({ ...newFeature, key: e.target.value.toUpperCase() })}
                  required
                  placeholder="EX: DARK_MODE"
                />
              </label>
              <label>
                Descrição
                <input
                  value={newFeature.description}
                  placeholder="Explique o que esta feature controla"
                  onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })}
                />
              </label>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="submit" style={{ flex: 1 }}>Criar Feature</button>
                <button type="button" className="secondary" style={{ flex: 1 }} onClick={() => setShowCreateModal(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid">
        {features.map((feature) => (
          <div key={feature.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <h3 style={{ margin: 0 }}>{feature.name}</h3>
                <code style={{ 
                  fontSize: '0.75rem', 
                  backgroundColor: '#f1f5f9', 
                  padding: '0.125rem 0.375rem', 
                  borderRadius: '4px',
                  color: 'var(--accent)',
                  fontWeight: '600',
                  alignSelf: 'flex-start'
                }}>{feature.key}</code>
              </div>
              <span style={{ 
                padding: '0.25rem 0.5rem', 
                borderRadius: '6px', 
                fontSize: '0.7rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                backgroundColor: feature.status === 'inactive' ? '#f1f5f9' : '#f0fdf4',
                color: feature.status === 'inactive' ? '#64748b' : '#16a34a',
                border: `1px solid ${feature.status === 'inactive' ? '#e2e8f0' : '#dcfce7'}`
              }}>
                {feature.status || 'active'}
              </span>
            </div>
            
            <p className="muted" style={{ fontSize: '0.875rem', flex: 1 }}>{feature.description || "Nenhuma descrição fornecida."}</p>
            
            <div style={{ marginTop: '0.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button 
                    className="secondary small" 
                    onClick={() => handleToggleFeatureStatus(feature.id, feature.status)}
                    style={{ fontSize: '0.75rem' }}
                >
                  {feature.status === 'inactive' ? 'Ativar' : 'Desativar'}
                </button>
                <button 
                    className="secondary small" 
                    onClick={() => handleDeleteFeature(feature.id)} 
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
