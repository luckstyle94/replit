import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../state/auth";
import { Card } from "../ui/Card";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, loadingUser, user } = useAuth();
  const location = useLocation();
  const redirect = encodeURIComponent(`${location.pathname}${location.search}${location.hash}`);

  if (!token) {
    return <Navigate to={`/?redirect=${redirect}`} replace />;
  }

  if (loadingUser && !user) {
    return (
      <div className="page">
        <Card strong title="Carregando">
          <div className="muted">Validando seu acesso...</div>
        </Card>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/?redirect=${redirect}`} replace />;
  }

  return children;
}
