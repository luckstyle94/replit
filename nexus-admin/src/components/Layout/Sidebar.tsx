import { NavLink } from 'react-router-dom';

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>Nexus</h2>
        <span className="badge">Admin</span>
      </div>
      <nav>
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
          <span className="nav-icon">📊</span>
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/tenants" className={({ isActive }) => isActive ? 'active' : ''}>
          <span className="nav-icon">🏢</span>
          <span>Empresas</span>
        </NavLink>
        <NavLink to="/sso" className={({ isActive }) => isActive ? 'active' : ''}>
          <span className="nav-icon">🔑</span>
          <span>SSO por Tenant</span>
        </NavLink>
        <NavLink to="/users" className={({ isActive }) => isActive ? 'active' : ''}>
          <span className="nav-icon">👥</span>
          <span>Usuários</span>
        </NavLink>
        <NavLink to="/features" className={({ isActive }) => isActive ? 'active' : ''}>
          <span className="nav-icon">✨</span>
          <span>Features</span>
        </NavLink>
        <NavLink to="/sessions" className={({ isActive }) => isActive ? 'active' : ''}>
          <span className="nav-icon">🕒</span>
          <span>Sessões</span>
        </NavLink>
      </nav>
      <div className="sidebar-footer">
        <p className="muted">v1.0.0</p>
      </div>
    </aside>
  );
}
