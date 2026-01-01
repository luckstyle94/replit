import { useAuth } from '../../context/AuthContext';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <h3>Painel Administrativo</h3>
      <div className="header-user">
        <span>Olá, <strong>{user?.name}</strong></span>
        <button onClick={logout} className="btn-logout">Sair</button>
      </div>
    </header>
  );
}
