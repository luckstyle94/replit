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
      <div className="header">
        <div>
          <div className="badge">Nexus</div>
          <h2 className="h2-tight">Minha conta</h2>
          <div className="muted small">
            {user?.email} • {user?.roleId === 1 ? "Admin global" : "Usuário"}
          </div>
        </div>
        <div className="nav">
          <NavButton to="/app" active={location.pathname === "/app"}>
            Perfil
          </NavButton>
          <Button variant="secondary" type="button" onClick={handleLogout}>
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
