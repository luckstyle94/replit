import { Outlet } from "react-router-dom";
import "./AuthLayout.css";

export function AuthLayout() {
  return (
    <div className="auth-layout">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">Nexus</div>
          <h1>Acesse sua conta</h1>
          <p className="auth-subtitle">
            Entre para acessar sua área, atualizar seus dados e gerenciar suas organizações.
          </p>
        </div>
        <div className="auth-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
