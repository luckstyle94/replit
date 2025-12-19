import { Navigate } from "react-router-dom";
import { useAuth } from "../../state/auth";
import { Card } from "../ui/Card";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, loadingUser, user } = useAuth();

  if (!token) {
    return <Navigate to="/" replace />;
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
    return <Navigate to="/" replace />;
  }

  return children;
}
