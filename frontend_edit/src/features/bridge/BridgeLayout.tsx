import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { useTenant } from "../../state/tenant";

export function BridgeLayout() {
  const { context } = useTenant();
  const navigate = useNavigate();
  const tenant = context?.tenant;

  const links = [
    { to: "/app/bridge", label: "Dashboard", end: true },
    { to: "/app/bridge/webhooks", label: "Webhooks" },
    { to: "/app/bridge/integrations", label: "Integracoes" },
    { to: "/app/bridge/partners", label: "Partners" },
    { to: "/app/bridge/performance", label: "Performance" },
    { to: "/app/bridge/secrets", label: "Credenciais" },
    { to: "/app/bridge/audit", label: "Audit Logs" },
    { to: "/app/bridge/reports", label: "Reports" },
  ];

  return (
    <div className="stack">
      <div className="card strong">
        <div className="bridge-header">
          <div>
            <div className="badge">Nexus Bridge</div>
            <h2 className="h2-tight">Hub de integracoes</h2>
            {tenant ? (
              <div className="muted small">
                Tenant: {tenant.tenantName} • Perfil: {tenant.role}
              </div>
            ) : null}
          </div>
          <Button variant="secondary" onClick={() => navigate("/app")}>
            Voltar ao menu
          </Button>
        </div>
        <div className="bridge-nav">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className="bridge-nav-link">
              {link.label}
            </NavLink>
          ))}
        </div>
      </div>
      <Outlet />
    </div>
  );
}
