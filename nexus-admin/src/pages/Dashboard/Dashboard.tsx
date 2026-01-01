import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import api from "../../services/api";

interface DashboardStats {
  active_tenants: number;
  total_users: number;
  active_features: number;
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
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
    <div className="shell">
      <div className="header">
        <div className="header-title">
          <h1>Dashboard</h1>
          <p className="muted">Bem-vindo ao Painel Administrativo Nexus.</p>
        </div>
      </div>
      
      <div className="grid">
        <div className="card">
          <p className="muted">Empresas Ativas</p>
          <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--accent)', marginTop: '0.5rem', letterSpacing: '-0.05em' }}>
            {stats.active_tenants}
          </div>
        </div>
        <div className="card">
          <p className="muted">Usuários Totais</p>
          <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--accent)', marginTop: '0.5rem', letterSpacing: '-0.05em' }}>
            {stats.total_users}
          </div>
        </div>
        <div className="card">
          <p className="muted">Features Ativas</p>
          <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--accent)', marginTop: '0.5rem', letterSpacing: '-0.05em' }}>
            {stats.active_features}
          </div>
        </div>
      </div>
    </div>
  );
}
