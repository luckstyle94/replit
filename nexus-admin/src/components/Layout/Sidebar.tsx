import { NavLink } from 'react-router-dom';

export function Sidebar() {
  return (
    <aside className="sidebar">
      <h2>Nexus</h2>
      <nav>
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/tenants">Empresas</NavLink>
        <NavLink to="/sso">SSO por Tenant</NavLink>
        <NavLink to="/users">Usuários</NavLink>
        <NavLink to="/features">Features</NavLink>
        <NavLink to="/sessions">Sessões</NavLink>
      </nav>
    </aside>
  );
}
