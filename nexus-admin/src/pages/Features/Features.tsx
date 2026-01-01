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
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1>Gerenciar Features</h1>
        <button onClick={() => setShowCreateModal(true)}>Nova Feature</button>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <div className="card" style={{ width: '400px', backgroundColor: 'white' }}>
            <h3>Nova Feature</h3>
            <form onSubmit={handleCreateFeature} className="stack">
              <label>
                Nome
                <input
                  value={newFeature.name}
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
                  onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })}
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
        {features.map((feature) => (
          <div key={feature.id} className="card">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start'}}>
                <h3>{feature.name}</h3>
                <span className={`badge ${feature.status === 'inactive' ? 'badge-inactive' : 'badge-active'}`} style={{fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: feature.status === 'inactive' ? '#eee' : '#d1fae5', color: feature.status === 'inactive' ? '#666' : '#065f46'}}>
                    {feature.status || 'active'}
                </span>
            </div>
            <code>{feature.key}</code>
            <p>{feature.description}</p>
            <div style={{marginTop: '10px', display: 'flex', gap: '10px'}}>
                <button 
                    className="secondary small" 
                    onClick={() => handleToggleFeatureStatus(feature.id, feature.status)}
                >
                  {feature.status === 'inactive' ? 'Ativar' : 'Desativar'}
                </button>
                <button 
                    className="secondary small" 
                    onClick={() => handleDeleteFeature(feature.id)} 
                    style={{ color: 'red', borderColor: 'red' }}
                >
                  Deletar
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
