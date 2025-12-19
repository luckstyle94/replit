import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="page">
      <div className="hero">
        <div className="badge">Nexus</div>
        <h1>Acesse sua conta</h1>
        <p className="muted">
          Entre para acessar sua área, atualizar seus dados e gerenciar suas organizações. Em alguns
          casos, você precisará confirmar um código de segurança.
        </p>
      </div>
      <div className="spacer-16" />
      <Outlet />
    </div>
  );
}
