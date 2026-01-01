import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import api from "../../services/api";

export function Dashboard() {
  const [stats, setStats] = useState({
    active_tenants: 0,
    total_users: 0,
    active_features: 0,
  });

  useEffect(() => {
    api.get("/dashboard/stats")
      .then((response) => setStats(response.data))
      .catch((error) => {
        if (isAxiosError(error)) {
          console.warn("Failed to load stats", error.response?.status ?? "unknown", error.message);
          return;
        }
        if (error instanceof Error) {
          console.warn("Failed to load stats", error.message);
          return;
        }
        console.warn("Failed to load stats");
      });
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Bem-vindo ao Painel Administrativo.</p>
      <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <div className="card">
          <h3>Empresas Ativas</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#e94560' }}>{stats.active_tenants}</p>
        </div>
        <div className="card">
          <h3>Usuários Totais</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#e94560' }}>{stats.total_users}</p>
        </div>
        <div className="card">
          <h3>Features Ativas</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#e94560' }}>{stats.active_features}</p>
        </div>
      </div>
    </div>
  );
}
