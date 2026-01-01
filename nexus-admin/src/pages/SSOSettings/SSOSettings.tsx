import { FormEvent, useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import { Tenant, TenantSSOSettings } from "../../api/types";

const emptySettings: TenantSSOSettings = {
  exists: false,
  tenantId: 0,
  enabled: false,
  required: false,
  providerType: "oidc",
  emailDomains: [],
  attributeMapping: { email: "email" },
  oidcRedirectUris: [],
  samlSpEntityId: "",
};

export function SSOSettings() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);
  const [settings, setSettings] = useState<TenantSSOSettings>(emptySettings);
  const [oidcSecret, setOidcSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTenants();
  }, []);

  async function loadTenants() {
    try {
      const { data } = await api.get<Tenant[]>("/tenants/all");
      setTenants(data);
      if (data.length > 0) {
        setSelectedTenantId(data[0].id);
      }
    } catch (err) {
      setError("Erro ao carregar tenants.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selectedTenantId) {
      fetchSettings(selectedTenantId);
    }
  }, [selectedTenantId]);

  async function fetchSettings(tenantId: number) {
    try {
      setError(null);
      const { data } = await api.get<TenantSSOSettings>(`/tenants/${tenantId}/sso-settings`);
      const providerType = data.providerType || "oidc";
      setSettings({
        ...emptySettings,
        ...data,
        tenantId,
        providerType,
        emailDomains: data.emailDomains || [],
        oidcRedirectUris: data.oidcRedirectUris || [],
        attributeMapping: data.attributeMapping || { email: "email" },
      });
      setOidcSecret("");
    } catch (err) {
      setError("Erro ao carregar configurações de SSO.");
    }
  }

  const tenantName = useMemo(() => {
    return tenants.find((t) => t.id === selectedTenantId)?.name || "";
  }, [tenants, selectedTenantId]);

  const apiBase = useMemo(() => {
    const base = api.defaults.baseURL || "";
    if (!base) return "";
    return base.replace(/\/api\/v1\/?$/, "");
  }, []);

  const defaultOidcCallback = useMemo(() => {
    if (!apiBase || !selectedTenantId) return "";
    return `${apiBase}/auth/sso/oidc/${selectedTenantId}/callback`;
  }, [apiBase, selectedTenantId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedTenantId) return;
    setSaving(true);
    setError(null);

    if (settings.providerType === "oidc") {
      if (!settings.oidcClientId?.trim()) {
        setError("OIDC: Client ID é obrigatório.");
        setSaving(false);
        return;
      }
      if (!settings.oidcIssuerUrl?.trim() && !settings.oidcDiscoveryUrl?.trim()) {
        setError("OIDC: Informe Issuer URL ou Discovery URL.");
        setSaving(false);
        return;
      }
      if (!settings.oidcRedirectUris || settings.oidcRedirectUris.length === 0) {
        setError("OIDC: Informe ao menos uma Redirect URI.");
        setSaving(false);
        return;
      }
    }

    if (settings.providerType === "saml") {
      if (!settings.samlSpEntityId?.trim()) {
        setError("SAML: SP Entity ID é obrigatório.");
        setSaving(false);
        return;
      }
      if (!settings.samlMetadataUrl?.trim()) {
        if (!settings.samlIdpEntityId?.trim()) {
          setError("SAML: IdP Entity ID é obrigatório quando Metadata URL não é informado.");
          setSaving(false);
          return;
        }
        if (!settings.samlIdpSsoUrl?.trim()) {
          setError("SAML: IdP SSO URL é obrigatório quando Metadata URL não é informado.");
          setSaving(false);
          return;
        }
        if (!settings.samlIdpX509Cert?.trim()) {
          setError("SAML: Certificado X.509 do IdP é obrigatório quando Metadata URL não é informado.");
          setSaving(false);
          return;
        }
      }
    }

    const payload: Record<string, unknown> = {
      enabled: settings.enabled,
      required: settings.required,
      providerType: settings.providerType || "oidc",
      emailDomains: settings.emailDomains || [],
      attributeMapping: settings.attributeMapping || { email: "email" },
      oidcIssuerUrl: settings.oidcIssuerUrl || null,
      oidcDiscoveryUrl: settings.oidcDiscoveryUrl || null,
      oidcClientId: settings.oidcClientId || null,
      oidcRedirectUris: settings.oidcRedirectUris || [],
      samlSpEntityId: settings.samlSpEntityId || null,
      samlIdpEntityId: settings.samlIdpEntityId || null,
      samlIdpSsoUrl: settings.samlIdpSsoUrl || null,
      samlIdpX509Cert: settings.samlIdpX509Cert || null,
      samlMetadataUrl: settings.samlMetadataUrl || null,
      samlNameIdFormat: settings.samlNameIdFormat || null,
      samlClockSkewSeconds: settings.samlClockSkewSeconds ?? null,
      samlWantAssertionsSigned: settings.samlWantAssertionsSigned ?? null,
      samlWantMessagesSigned: settings.samlWantMessagesSigned ?? null,
    };
    if (oidcSecret.trim()) {
      payload.oidcClientSecret = oidcSecret.trim();
    }

    if (import.meta.env.DEV) {
      console.debug("SSO settings payload", payload);
    }
    try {
      const { data } = await api.put<TenantSSOSettings>(`/tenants/${selectedTenantId}/sso-settings`, payload);
      const providerType = data.providerType || settings.providerType || "oidc";
      setSettings({
        ...emptySettings,
        ...data,
        tenantId: selectedTenantId,
        providerType,
        emailDomains: data.emailDomains || [],
        oidcRedirectUris: data.oidcRedirectUris || [],
        attributeMapping: data.attributeMapping || { email: "email" },
      });
      setOidcSecret("");
      alert("Configuração salva com sucesso.");
    } catch (err) {
      const apiError = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(apiError || "Erro ao salvar configuração.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveOIDC = async () => {
    if (!selectedTenantId) return;
    if (!window.confirm("Tem certeza que deseja remover a configuração OIDC deste tenant?")) {
      return;
    }
    setRemoving(true);
    setError(null);
    try {
      await api.delete(`/tenants/${selectedTenantId}/sso-settings/oidc`);
      setSettings({ ...emptySettings, tenantId: selectedTenantId, providerType: "oidc" });
      setOidcSecret("");
      alert("Configuração OIDC removida com sucesso.");
    } catch (err) {
      const apiError = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(apiError || "Erro ao remover configuração OIDC.");
    } finally {
      setRemoving(false);
    }
  };

  const handleRemoveSAML = async () => {
    if (!selectedTenantId) return;
    if (!window.confirm("Tem certeza que deseja remover a configuração SAML deste tenant?")) {
      return;
    }
    setRemoving(true);
    setError(null);
    try {
      await api.delete(`/tenants/${selectedTenantId}/sso-settings/saml`);
      setSettings({ ...emptySettings, tenantId: selectedTenantId, providerType: "saml" });
      setOidcSecret("");
      alert("Configuração SAML removida com sucesso.");
    } catch (err) {
      const apiError = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(apiError || "Erro ao remover configuração SAML.");
    } finally {
      setRemoving(false);
    }
  };

  if (loading) return <p>Carregando...</p>;

  return (
    <div className="shell">
      <div className="header">
        <div className="header-title">
          <h1>Configurações de SSO</h1>
          <p className="muted">Configure Single Sign-On via OIDC ou SAML para seus tenants.</p>
        </div>
      </div>

      {error && (
        <div className="error" style={{ 
          marginBottom: '1.5rem', 
          padding: '1rem', 
          backgroundColor: '#fef2f2', 
          border: '1px solid #fee2e2', 
          borderRadius: '8px',
          color: '#ef4444'
        }}>
          {error}
        </div>
      )}

      <div className="card" style={{ marginBottom: "2rem" }}>
        <label>
          Selecione a Empresa
          <select
            className="secondary"
            value={selectedTenantId ?? ""}
            onChange={(e) => setSelectedTenantId(Number(e.target.value))}
            style={{ marginTop: "0.5rem", height: '42px' }}
          >
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <form className="stack" onSubmit={handleSubmit}>
        <div className="card stack">
          <h3 style={{ marginBottom: '1rem' }}>{tenantName || "Configuração"}</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.75rem', padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                style={{ width: '18px', height: '18px' }}
              />
              <div>
                <span style={{ display: 'block', fontSize: '0.875rem' }}>SSO Habilitado</span>
                <span className="muted" style={{ fontSize: '0.75rem' }}>Permite login via provedor externo.</span>
              </div>
            </label>
            <label style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.75rem', padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.required}
                onChange={(e) => setSettings({ ...settings, required: e.target.checked })}
                style={{ width: '18px', height: '18px' }}
              />
              <div>
                <span style={{ display: 'block', fontSize: '0.875rem' }}>SSO Obrigatório</span>
                <span className="muted" style={{ fontSize: '0.75rem' }}>Bloqueia autenticação local por senha.</span>
              </div>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
            <label>
              Tipo de Provedor
              <select
                className="secondary"
                value={settings.providerType || "oidc"}
                onChange={(e) => setSettings({ ...settings, providerType: e.target.value as "oidc" | "saml" })}
                style={{ height: '42px' }}
              >
                <option value="oidc">OpenID Connect (OIDC)</option>
                <option value="saml">SAML 2.0</option>
              </select>
            </label>
            <label>
              Domínios de Email
              <input
                value={(settings.emailDomains || []).join(", ")}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    emailDomains: e.target.value.split(",").map((d) => d.trim()).filter(Boolean),
                  })
                }
                placeholder="ex: empresa.com, filial.net"
              />
            </label>
          </div>

          <label style={{ marginTop: '0.5rem' }}>
            Mapeamento do Atributo de Email
            <input
              value={settings.attributeMapping?.email || ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  attributeMapping: { ...settings.attributeMapping, email: e.target.value },
                })
              }
              placeholder="Ex: email, preferred_username, nameid"
            />
          </label>
        </div>

        {settings.providerType === "oidc" && (
          <div className="card stack" style={{ backgroundColor: "#f8fafc", border: "1px dashed var(--accent)" }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4>OpenID Connect Configuration</h4>
              <button
                type="button"
                className="secondary small"
                onClick={() => {
                  if (!defaultOidcCallback) return;
                  const existing = settings.oidcRedirectUris || [];
                  if (existing.includes(defaultOidcCallback)) return;
                  setSettings({
                    ...settings,
                    oidcRedirectUris: [...existing, defaultOidcCallback],
                  });
                }}
                style={{ fontSize: '0.75rem' }}
              >
                Auto-preencher Callback
              </button>
            </div>
            
            {defaultOidcCallback && (
              <div style={{ fontSize: "0.75rem", padding: "0.75rem", backgroundColor: "#fff", borderRadius: "6px", border: "1px solid var(--border)" }}>
                <p className="muted" style={{ marginBottom: '0.25rem' }}>URI de Redirecionamento (Callback):</p>
                <code>{defaultOidcCallback}</code>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <label>
                Issuer URL
                <input
                  value={settings.oidcIssuerUrl || ""}
                  onChange={(e) => setSettings({ ...settings, oidcIssuerUrl: e.target.value })}
                  placeholder="https://accounts.google.com"
                />
              </label>
              <label>
                Discovery URL (Opcional)
                <input
                  value={settings.oidcDiscoveryUrl || ""}
                  onChange={(e) => setSettings({ ...settings, oidcDiscoveryUrl: e.target.value })}
                  placeholder=".../.well-known/openid-configuration"
                />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <label>
                Client ID
                <input
                  value={settings.oidcClientId || ""}
                  onChange={(e) => setSettings({ ...settings, oidcClientId: e.target.value })}
                  placeholder="AbC123XyZ..."
                />
              </label>
              <label>
                Client Secret
                <input
                  value={oidcSecret}
                  onChange={(e) => setOidcSecret(e.target.value)}
                  type="password"
                  placeholder={settings.oidcClientSecretMasked || "Digite o novo secret"}
                />
              </label>
            </div>

            <label>
              Redirect URIs (uma por linha)
              <textarea
                value={(settings.oidcRedirectUris || []).join("\n")}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    oidcRedirectUris: e.target.value.split("\n").map((v) => v.trim()).filter(Boolean),
                  })
                }
                rows={3}
                style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
              />
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="secondary small"
                onClick={handleRemoveOIDC}
                disabled={saving || removing}
                style={{ color: '#ef4444' }}
              >
                Limpar Configuração OIDC
              </button>
            </div>
          </div>
        )}

        {settings.providerType === "saml" && (
          <div className="card stack" style={{ backgroundColor: "#f8fafc", border: "1px dashed var(--accent)" }}>
            <h4>SAML 2.0 Configuration</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <label>
                SP Entity ID
                <input
                  value={settings.samlSpEntityId || ""}
                  onChange={(e) => setSettings({ ...settings, samlSpEntityId: e.target.value })}
                  placeholder="nexus-admin-sp"
                />
              </label>
              <label>
                Metadata URL (Opcional)
                <input
                  value={settings.samlMetadataUrl || ""}
                  onChange={(e) => setSettings({ ...settings, samlMetadataUrl: e.target.value })}
                  placeholder="https://idp.com/saml/metadata"
                />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <label>
                IdP Entity ID
                <input
                  value={settings.samlIdpEntityId || ""}
                  onChange={(e) => setSettings({ ...settings, samlIdpEntityId: e.target.value })}
                />
              </label>
              <label>
                IdP SSO URL
                <input
                  value={settings.samlIdpSsoUrl || ""}
                  onChange={(e) => setSettings({ ...settings, samlIdpSsoUrl: e.target.value })}
                />
              </label>
            </div>

            <label>
              Certificado X.509 do IdP
              <textarea
                value={settings.samlIdpX509Cert || ""}
                onChange={(e) => setSettings({ ...settings, samlIdpX509Cert: e.target.value })}
                rows={4}
                style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
                placeholder="-----BEGIN CERTIFICATE----- ..."
              />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <label>
                NameID Format
                <input
                  value={settings.samlNameIdFormat || ""}
                  onChange={(e) => setSettings({ ...settings, samlNameIdFormat: e.target.value })}
                  placeholder="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"
                />
              </label>
              <label>
                Clock Skew (Segundos)
                <input
                  type="number"
                  value={settings.samlClockSkewSeconds ?? ""}
                  onChange={(e) =>
                    setSettings({ ...settings, samlClockSkewSeconds: Number(e.target.value) || undefined })
                  }
                />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
              <label style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.samlWantAssertionsSigned ?? false}
                  onChange={(e) => setSettings({ ...settings, samlWantAssertionsSigned: e.target.checked })}
                />
                <span style={{ fontSize: '0.8125rem' }}>Assertions Assinadas</span>
              </label>
              <label style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.samlWantMessagesSigned ?? false}
                  onChange={(e) => setSettings({ ...settings, samlWantMessagesSigned: e.target.checked })}
                />
                <span style={{ fontSize: '0.8125rem' }}>Mensagens Assinadas</span>
              </label>
            </div>

            <div style={{ fontSize: "0.75rem", padding: "1rem", backgroundColor: "#fff", borderRadius: "8px", border: "1px solid var(--border)" }}>
              <div style={{ marginBottom: '0.5rem' }}>SP Metadata: <code>/auth/sso/saml/{selectedTenantId}/metadata</code></div>
              <div>ACS URL: <code>/auth/sso/saml/{selectedTenantId}/acs</code></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="secondary small"
                onClick={handleRemoveSAML}
                disabled={saving || removing}
                style={{ color: '#ef4444' }}
              >
                Limpar Configuração SAML
              </button>
            </div>
          </div>
        )}

        <button type="submit" disabled={saving || removing} style={{ height: '48px', fontSize: '1rem', marginTop: '1rem' }}>
          {saving ? "Salvando Alterações..." : "Salvar Todas as Configurações"}
        </button>
      </form>
    </div>
  );
}
