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
            <span className="pill">Organização: {tenant.tenantName}</span>
            <span className="pill">Perfil: {tenant.role}</span>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => selectTenant(null)}
              style={{ marginLeft: 'var(--space-md)' }}
            >
              Trocar Organização
            </Button>
          </div>
        ) : null}
      </div>

      {error ? <Alert variant="error">{error}</Alert> : null}
      {entitlementsError ? <Alert variant="error">{entitlementsError}</Alert> : null}

      {!tenant && tenants.length > 0 ? (
        <Card title="Selecione a organização para continuar">
          <div className="stack" style={{ gap: 'var(--space-lg)' }}>
            <div className="muted" style={{ fontSize: 'var(--font-size-sm)' }}>
              Você participa de {tenants.length} {tenants.length === 1 ? 'organização' : 'organizações'}. Clique em um card para acessar.
            </div>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
              gap: 'var(--space-md)' 
            }}>
              {tenants.map((t) => (
                <div 
                  key={t.tenantId} 
                  className="card clickable"
                  style={{ 
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-sm)',
                    padding: 'var(--space-lg)'
                  }}
                  onClick={() => selectTenant(t.tenantId)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ fontSize: 'var(--font-size-lg)', margin: 0, color: 'var(--color-primary)' }}>{t.tenantName}</h3>
                    <span className={`badge ${t.status === 'active' ? 'success' : 'warning'}`} style={{ fontSize: '10px' }}>
                      {t.status}
                    </span>
                  </div>
                  <div className="muted small" style={{ opacity: 0.7 }}>
                    ID: {t.tenantId}
                  </div>
                  <div style={{ marginTop: 'auto', paddingTop: 'var(--space-sm)' }}>
                    <Button variant="secondary" size="sm" fullWidth>Acessar Organização</Button>
                  </div>
                </div>
              ))}
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
