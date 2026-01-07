import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../state/auth";
import { useTenant } from "../state/tenant";
import { Card } from "../components/ui/Card";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { FEATURE_MODULES } from "../features/registry";
import { useFeatureEntitlements } from "../state/entitlements";

export function HomeMenuPage() {
  const { user } = useAuth();
  const { context, loading, error, selectTenant } = useTenant();
  const navigate = useNavigate();

  const tenant = context?.tenant ?? null;
  const tenants = context?.tenants ?? [];
  const selectedTenantId = context?.selectedTenantId ?? 0;
  const { entitlements, loading: loadingEntitlements, error: entitlementsError } = useFeatureEntitlements(tenant?.tenantId);

  const bridgeEntitlement = entitlements.find((item) => item.feature.key === "NEXUS_BRIDGE");

  const visibleModules = useMemo(() => {
    return FEATURE_MODULES.filter((module) =>
      entitlements.some((item) => item.feature.key === module.key)
    );
  }, [entitlements]);

  const handleOpenBridge = () => {
    if (!bridgeEntitlement || !bridgeEntitlement.state.isActive) {
      navigate("/app/bridge/upsell");
      return;
    }
    navigate("/app/bridge");
  };

  if (loading) {
    return (
      <Card title="Carregando" strong>
        <div className="muted">Preparando seu menu...</div>
      </Card>
    );
  }

  return (
    <div className="stack">
      <div className="hero">
        <div className="badge">Home do Nexus</div>
        <h1>Bem-vindo, {user?.name || "usuário"}</h1>
        <p className="muted">
          Escolha uma feature para continuar. O acesso depende das permissões e do plano ativo.
        </p>
        {tenant ? (
          <div className="pill-row">
            <span className="pill">Tenant: {tenant.tenantName}</span>
            <span className="pill">Perfil: {tenant.role}</span>
            <span className="pill">Status: {tenant.status}</span>
          </div>
        ) : null}
      </div>

      {error ? <Alert variant="error">{error}</Alert> : null}
      {entitlementsError ? <Alert variant="error">{entitlementsError}</Alert> : null}

      {!tenant && tenants.length > 1 ? (
        <Card title="Selecione o tenant">
          <div className="stack">
            <div className="muted">Você participa de mais de uma organização. Selecione uma para continuar.</div>
            <div className="pill-row">
              <select
                className="input"
                value={selectedTenantId || ""}
                onChange={(event) => {
                  const id = Number(event.target.value);
                  if (id > 0) {
                    void selectTenant(id);
                  }
                }}
              >
                <option value="">Escolher tenant</option>
                {tenants.map((t) => (
                  <option key={t.tenantId} value={t.tenantId}>
                    {t.tenantName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>
      ) : null}

      {tenant && !loadingEntitlements && !entitlementsError && visibleModules.length === 0 ? (
        <Card title="Nenhuma feature ativa">
          <div className="muted">Sua organizacao ainda nao tem features habilitadas.</div>
        </Card>
      ) : null}

      {tenant && visibleModules.length > 0 ? (
        <div className="feature-grid">
          {visibleModules.map((module) => {
            if (module.key === "NEXUS_BRIDGE") {
              const isLocked = !bridgeEntitlement || !bridgeEntitlement.state.isActive;
              const statusLabel = bridgeEntitlement?.state.state || "none";
              return (
                <div key={module.key} className={`feature-card ${isLocked ? "locked" : ""}`}>
                  <div>
                    <div className="badge">{module.statusLabel}</div>
                    <h3>{module.name}</h3>
                    <p className="muted">{module.description}</p>
                    {loadingEntitlements ? (
                      <span className="pill">Carregando plano...</span>
                    ) : isLocked ? (
                      <span className="pill danger">Plano {statusLabel}</span>
                    ) : (
                      <span className="pill success">Plano ativo</span>
                    )}
                  </div>
                  <div className="feature-actions">
                    <Button variant={isLocked ? "secondary" : "primary"} onClick={handleOpenBridge}>
                      {isLocked ? "Ver planos" : "Acessar"}
                    </Button>
                  </div>
                </div>
              );
            }
            return (
              <div key={module.key} className="feature-card">
                <div>
                  <div className="badge">{module.statusLabel}</div>
                  <h3>{module.name}</h3>
                  <p className="muted">{module.description}</p>
                </div>
                <div className="feature-actions">
                  <Button variant="secondary" onClick={() => navigate(module.route)}>
                    Acessar
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
