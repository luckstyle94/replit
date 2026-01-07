import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { useTenant } from "../../state/tenant";
import { useFeatureEntitlements } from "../../state/entitlements";

export function BridgeGuard({ children }: { children: ReactNode }) {
  const { context } = useTenant();
  const location = useLocation();
  const tenantId = context?.tenant?.tenantId;
  const { entitlements, loading } = useFeatureEntitlements(tenantId);
  const bridgeEntitlement = entitlements.find((item) => item.feature.key === "NEXUS_BRIDGE");

  if (!tenantId) {
    return (
      <Card title="Tenant nao definido" strong>
        <div className="muted">Selecione um tenant no menu principal para acessar o Bridge.</div>
      </Card>
    );
  }

  if (!bridgeEntitlement) {
    return (
      <Card title="Bridge nao habilitado" strong>
        <div className="muted">Essa feature nao esta ativa para este tenant.</div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card title="Carregando acesso" strong>
        <div className="muted">Verificando plano do Bridge...</div>
      </Card>
    );
  }

  if (!bridgeEntitlement.state.isActive) {
    if (location.pathname.endsWith("/upsell")) {
      return <>{children}</>;
    }
    return <Navigate to="/app/bridge/upsell" replace />;
  }

  return <>{children}</>;
}
