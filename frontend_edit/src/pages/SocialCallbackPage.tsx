import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../state/auth";
import { consumeRedirectPath } from "../state/storage";
import { getErrorMessage } from "../utils/apiError";
import { Alert } from "../components/ui/Alert";
import { Card } from "../components/ui/Card";

export function SocialCallbackPage() {
  const { provider = "google" } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { completeSocialLogin } = useAuth();
  const [message, setMessage] = useState<string | null>("Finalizando seu acesso...");
  const [status, setStatus] = useState<"loading" | "error" | "success">("loading");

  const payload = useMemo(
    () => ({
      code: searchParams.get("code") || "",
      state: searchParams.get("state") || "",
    }),
    [searchParams]
  );

  useEffect(() => {
    if (!payload.code || !payload.state) {
      setMessage("Retorno inválido do provedor. Refaça o login.");
      setStatus("error");
      return;
    }
    (async () => {
      try {
        const result = await completeSocialLogin({ provider, code: payload.code, state: payload.state });
        if (result.status === "authenticated") {
          setMessage("Tudo certo. Redirecionando...");
          setStatus("success");
          const target = consumeRedirectPath() || "/app";
          setTimeout(() => navigate(target, { replace: true }), 800);
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
        setMessage(parsed.message || "Erro ao concluir login social.");
        setStatus("error");
      }
    })();
  }, [completeSocialLogin, navigate, payload.code, payload.state, provider]);

  return (
    <Card
      strong
      className="centered-card"
      title={provider === "google" ? "Continuar com Google" : "Continuar"}
      right={<span className="badge">{status === "loading" ? "Aguarde..." : status === "error" ? "Falhou" : "Ok"}</span>}
    >
      {message && (
        <Alert variant={status === "error" ? "error" : "info"}>{message}</Alert>
      )}
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
