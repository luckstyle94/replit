import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../state/auth";
import { Button } from "../ui/Button";

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="page" style={{ padding: 0, display: 'flex', minHeight: '100vh', maxWidth: '100%' }}>
      {/* Sidebar Menu */}
      <aside style={{ 
        width: '280px', 
        backgroundColor: 'var(--color-bg-primary)', 
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        padding: 'var(--space-xl) var(--space-md)',
        position: 'sticky',
        top: 0,
        height: '100vh'
      }}>
        <div style={{ marginBottom: 'var(--space-2xl)', padding: '0 var(--space-sm)' }}>
          <div className="badge" style={{ backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', padding: '6px 16px', fontSize: '14px', fontWeight: '800', marginBottom: 'var(--space-md)' }}>NEXUS</div>
          <div className="muted small" style={{ opacity: 0.6, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Plataforma de Gestão</div>
        </div>

        <nav className="stack" style={{ gap: 'var(--space-xs)', flex: 1 }}>
          <NavButton to="/app" active={location.pathname === "/app"}>
             Dashboard
          </NavButton>
          <NavButton to="/app/profile" active={location.pathname.startsWith("/app/profile")}>
             Configurações de Perfil
          </NavButton>
        </nav>

        <div style={{ 
          marginTop: 'auto', 
          padding: 'var(--space-md)', 
          backgroundColor: 'rgba(255,255,255,0.03)', 
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)'
        }}>
          <div className="muted small" style={{ marginBottom: 'var(--space-xs)', opacity: 0.7 }}>Conectado como:</div>
          <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
          <div className="badge info" style={{ fontSize: '10px', padding: '2px 8px' }}>{user?.roleId === 1 ? "Admin Global" : "Usuário"}</div>
          
          <Button 
            variant="ghost" 
            fullWidth 
            onClick={handleLogout} 
            style={{ marginTop: 'var(--space-md)', border: '1px solid var(--color-border)', fontSize: '13px' }}
          >
            Encerrar Sessão
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: 'var(--space-xl)', backgroundColor: 'var(--color-bg-secondary)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function NavButton({ to, children, active }: { to: string; children: React.ReactNode; active?: boolean }) {
  return (
    <NavLink 
      to={to} 
      className={`btn ${active ? "primary" : "ghost"}`}
      style={{ 
        justifyContent: 'flex-start', 
        padding: '12px 16px', 
        borderRadius: 'var(--radius-md)',
        border: 'none',
        background: active ? 'linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))' : 'transparent',
        color: active ? 'white' : 'var(--color-text-secondary)',
        boxShadow: active ? 'var(--shadow-md)' : 'none',
        opacity: active ? 1 : 0.8
      }}
    >
      {children}
    </NavLink>
  );
}
