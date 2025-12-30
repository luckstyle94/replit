import { Outlet, useLocation } from "react-router-dom";
import "./AuthLayout.css";

export function AuthLayout() {
  const location = useLocation();
  const isWide = location.pathname === "/mfa/setup";

  return (
    <div className={`auth-layout ${isWide ? "auth-layout-wide" : ""}`}>
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
