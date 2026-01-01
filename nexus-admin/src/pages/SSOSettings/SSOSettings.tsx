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
    <div>
      <h1>SSO por Tenant</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={{ marginBottom: "20px" }}>
        <label>
          Tenant
          <select
            value={selectedTenantId ?? ""}
            onChange={(e) => setSelectedTenantId(Number(e.target.value))}
            style={{ marginLeft: "10px" }}
          >
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <form className="card stack" onSubmit={handleSubmit}>
        <h3>{tenantName || "Configuração"}</h3>

        <label>
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
          />
          SSO habilitado
        </label>
        <label>
          <input
            type="checkbox"
            checked={settings.required}
            onChange={(e) => setSettings({ ...settings, required: e.target.checked })}
          />
          SSO obrigatório (bloqueia login local)
        </label>

        <label>
          Tipo de provedor
          <select
            value={settings.providerType || "oidc"}
            onChange={(e) => setSettings({ ...settings, providerType: e.target.value as "oidc" | "saml" })}
          >
            <option value="oidc">OIDC</option>
            <option value="saml">SAML 2.0</option>
          </select>
        </label>

        <label>
          Domínios de email (separados por vírgula)
          <input
            value={(settings.emailDomains || []).join(", ")}
            onChange={(e) =>
              setSettings({
                ...settings,
                emailDomains: e.target.value.split(",").map((d) => d.trim()).filter(Boolean),
              })
            }
            placeholder="ex: empresa.com.br, filial.com.br"
          />
        </label>

        <label>
          Mapeamento do email (claim/atributo)
          <input
            value={settings.attributeMapping?.email || ""}
            onChange={(e) =>
              setSettings({
                ...settings,
                attributeMapping: { ...settings.attributeMapping, email: e.target.value },
              })
            }
            placeholder="email ou nameid"
          />
        </label>

        {settings.providerType === "oidc" && (
          <div className="card" style={{ background: "#f8f8fb" }}>
            <h4>OIDC</h4>
            {defaultOidcCallback && (
              <div className="text-xs" style={{ marginBottom: "8px" }}>
                Callback sugerida: <code>{defaultOidcCallback}</code>
              </div>
            )}
            <label>
              Issuer URL
              <input
                value={settings.oidcIssuerUrl || ""}
                onChange={(e) => setSettings({ ...settings, oidcIssuerUrl: e.target.value })}
                placeholder="https://idp.exemplo.com"
              />
            </label>
            <label>
              Discovery URL (opcional)
              <input
                value={settings.oidcDiscoveryUrl || ""}
                onChange={(e) => setSettings({ ...settings, oidcDiscoveryUrl: e.target.value })}
                placeholder="https://idp.exemplo.com/.well-known/openid-configuration"
              />
            </label>
            <label>
              Client ID
              <input
                value={settings.oidcClientId || ""}
                onChange={(e) => setSettings({ ...settings, oidcClientId: e.target.value })}
              />
            </label>
            <label>
              Client secret (atual: {settings.oidcClientSecretMasked || "não definido"})
              <input
                value={oidcSecret}
                onChange={(e) => setOidcSecret(e.target.value)}
                type="password"
                placeholder="Atualize somente se necessário"
              />
            </label>
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
                rows={4}
              />
            </label>
            <button
              type="button"
              className="btn secondary"
              onClick={() => {
                if (!defaultOidcCallback) return;
                const existing = settings.oidcRedirectUris || [];
                if (existing.includes(defaultOidcCallback)) return;
                setSettings({
                  ...settings,
                  oidcRedirectUris: [...existing, defaultOidcCallback],
                });
              }}
            >
              Adicionar callback padrão
            </button>
            <button
              type="button"
              className="danger"
              onClick={handleRemoveOIDC}
              disabled={saving || removing}
              style={{ marginTop: "12px" }}
            >
              Remover configuração OIDC
            </button>
          </div>
        )}

        {settings.providerType === "saml" && (
          <div className="card" style={{ background: "#f8f8fb" }}>
            <h4>SAML 2.0</h4>
            <label>
              SP Entity ID
              <input
                value={settings.samlSpEntityId || ""}
                onChange={(e) => setSettings({ ...settings, samlSpEntityId: e.target.value })}
                placeholder="ex: nexus-saml-tenant-teste"
              />
            </label>
            <label>
              Metadata URL (opcional)
              <input
                value={settings.samlMetadataUrl || ""}
                onChange={(e) => setSettings({ ...settings, samlMetadataUrl: e.target.value })}
                placeholder="https://idp.exemplo.com/metadata"
              />
            </label>
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
            <label>
              Certificado X.509 do IdP
              <textarea
                value={settings.samlIdpX509Cert || ""}
                onChange={(e) => setSettings({ ...settings, samlIdpX509Cert: e.target.value })}
                rows={5}
              />
            </label>
            <label>
              NameID format (opcional)
              <input
                value={settings.samlNameIdFormat || ""}
                onChange={(e) => setSettings({ ...settings, samlNameIdFormat: e.target.value })}
                placeholder="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"
              />
            </label>
            <label>
              Clock skew (segundos)
              <input
                type="number"
                value={settings.samlClockSkewSeconds ?? ""}
                onChange={(e) =>
                  setSettings({ ...settings, samlClockSkewSeconds: Number(e.target.value) || undefined })
                }
              />
            </label>
            <label>
              <input
                type="checkbox"
                checked={settings.samlWantAssertionsSigned ?? false}
                onChange={(e) => setSettings({ ...settings, samlWantAssertionsSigned: e.target.checked })}
              />
              Exigir assertions assinadas
            </label>
            <label>
              <input
                type="checkbox"
                checked={settings.samlWantMessagesSigned ?? false}
                onChange={(e) => setSettings({ ...settings, samlWantMessagesSigned: e.target.checked })}
              />
              Exigir mensagens assinadas
            </label>
            <div className="text-xs" style={{ marginTop: "8px" }}>
              Metadata SP: <code>/auth/sso/saml/{selectedTenantId}/metadata</code>
              <br />
              ACS URL: <code>/auth/sso/saml/{selectedTenantId}/acs</code>
            </div>
            <button
              type="button"
              className="danger"
              onClick={handleRemoveSAML}
              disabled={saving || removing}
              style={{ marginTop: "12px" }}
            >
              Remover configuração SAML
            </button>
          </div>
        )}

        <button type="submit" disabled={saving || removing}>
          {saving ? "Salvando..." : "Salvar configurações"}
        </button>
      </form>
    </div>
  );
}
