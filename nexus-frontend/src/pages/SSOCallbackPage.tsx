import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../state/auth";
import { getErrorMessage } from "../utils/apiError";
import { Alert } from "../components/ui/Alert";
import { Card } from "../components/ui/Card";
import { getSSOTenantId, getSSOProvider, setSSOContext } from "../state/storage";

export function SSOCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { completeSSOLogin, acceptSSOToken } = useAuth();
  const [message, setMessage] = useState<string | null>("Finalizando seu acesso...");
  const [status, setStatus] = useState<"loading" | "error" | "success">("loading");

  const payload = useMemo(
    () => ({
      code: searchParams.get("code") || "",
      state: searchParams.get("state") || "",
    }),
    [searchParams]
  );

  const errorCode = searchParams.get("error") || "";
  const tokenFromQuery = searchParams.get("token") || "";
  const tokenFromHash = useMemo(() => {
    const raw = window.location.hash.replace(/^#/, "");
    if (!raw) return "";
    const params = new URLSearchParams(raw);
    return params.get("token") || "";
  }, []);

  useEffect(() => {
    if (errorCode) {
      const messages: Record<string, string> = {
        state_invalid: "Sua sessão expirou. Inicie o login novamente.",
        sso_disabled: "SSO não está habilitado para esta organização.",
        user_not_member: "Você não pertence a esta organização.",
        user_inactive: "Seu acesso está inativo. Fale com o suporte.",
        user_not_found: "Usuário não encontrado.",
        tenant_inactive: "Organização inativa. Fale com o suporte.",
        sso_failed: "Não foi possível concluir o SSO.",
      };
      setMessage(messages[errorCode] || "Erro ao concluir login SSO.");
      setStatus("error");
      setSSOContext(null, null);
      return;
    }

    const token = tokenFromQuery || tokenFromHash;
    if (token) {
      setSSOContext(null, null);
      (async () => {
        try {
          await acceptSSOToken(token);
          setMessage("Tudo certo. Redirecionando...");
          setStatus("success");
          setTimeout(() => navigate("/app", { replace: true }), 400);
        } catch (err) {
          const parsed = getErrorMessage(err);
          setMessage(parsed.message || "Erro ao concluir login SSO.");
          setStatus("error");
        }
      })();
      return;
    }

    const tenantId = getSSOTenantId();
    const provider = (getSSOProvider() as "oidc" | "saml" | null) || "oidc";
    if (!tenantId) {
      setMessage("Tenant do SSO não encontrado. Inicie novamente.");
      setStatus("error");
      return;
    }
    if (!payload.code || !payload.state) {
      setMessage("Retorno inválido do provedor. Refaça o login.");
      setStatus("error");
      return;
    }
    (async () => {
      try {
        const result = await completeSSOLogin({
          tenantId,
          provider,
          code: payload.code,
          state: payload.state,
        });
        setSSOContext(null, null);
        if (result.status === "authenticated") {
          setMessage("Tudo certo. Redirecionando...");
          setStatus("success");
          setTimeout(() => navigate("/app", { replace: true }), 800);
          return;
        }
        if (result.status === "mfa_setup") {
          setMessage("Só falta configurar o autenticador para concluir o acesso.");
          setStatus("success");
          setTimeout(() => navigate("/mfa/setup", { replace: true }), 200);
          return;
        }
        if (result.status === "mfa_challenge") {
          setMessage("Confirme o código para concluir o acesso.");
          setStatus("success");
          setTimeout(() => navigate("/mfa/challenge", { replace: true }), 200);
          return;
        }
      } catch (err) {
        const parsed = getErrorMessage(err);
        setMessage(parsed.message || "Erro ao concluir login SSO.");
        setStatus("error");
      }
    })();
  }, [
    acceptSSOToken,
    completeSSOLogin,
    errorCode,
    navigate,
    payload.code,
    payload.state,
    tokenFromHash,
    tokenFromQuery,
  ]);

  return (
    <Card
      strong
      className="centered-card"
      title="Continuar com SSO"
      right={<span className="badge">{status === "loading" ? "Aguarde..." : status === "error" ? "Falhou" : "Ok"}</span>}
    >
      {message && <Alert variant={status === "error" ? "error" : "info"}>{message}</Alert>}
      {status === "error" && (
        <div className="stack mt-12">
          <Link className="btn ghost" to="/">
            Voltar para login
          </Link>
          <Link className="btn secondary" to="/forgot">
            Recuperar acesso
          </Link>
        </div>
      )}
    </Card>
  );
}
