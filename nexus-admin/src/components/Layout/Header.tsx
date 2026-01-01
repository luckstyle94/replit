import { useAuth } from '../../context/AuthContext';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div className="header-title">
        <h3>Painel Administrativo</h3>
        <p className="muted">Gerenciamento de plataforma Nexus</p>
      </div>
      <div className="header-user">
        <div className="user-info">
          <span className="user-label">Olá,</span>
          <strong>{user?.name}</strong>
        </div>
        <button onClick={logout} className="btn-logout">Sair</button>
      </div>
    </header>
  );
}
