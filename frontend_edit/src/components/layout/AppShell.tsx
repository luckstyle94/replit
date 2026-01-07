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
    <div className="page">
      <div className="header" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <div className="badge" style={{ backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', padding: '4px 12px' }}>Nexus</div>
          <div>
            <h2 className="h2-tight" style={{ fontSize: 'var(--font-size-lg)', letterSpacing: '-0.01em' }}>Área do Usuário</h2>
            <div className="muted small" style={{ opacity: 0.7 }}>
              {user?.email} • {user?.roleId === 1 ? "Admin Global" : "Usuário"}
            </div>
          </div>
        </div>
        <div className="nav" style={{ gap: 'var(--space-sm)' }}>
          <NavButton to="/app" active={location.pathname === "/app"}>
            Menu
          </NavButton>
          <NavButton to="/app/profile" active={location.pathname.startsWith("/app/profile")}>
            Perfil
          </NavButton>
          <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--color-border)', margin: '0 var(--space-xs)' }} />
          <Button variant="ghost" type="button" onClick={handleLogout} style={{ border: 'none' }}>
            Sair
          </Button>
        </div>
      </div>
      <Outlet />
    </div>
  );
}

function NavButton({ to, children, active }: { to: string; children: React.ReactNode; active?: boolean }) {
  return (
    <NavLink to={to} className={`btn secondary ${active ? "" : "opacity-80"}`}>
      {children}
    </NavLink>
  );
}
