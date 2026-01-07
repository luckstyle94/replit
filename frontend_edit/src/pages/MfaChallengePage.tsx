import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../state/auth";
import { MfaMode } from "../api/types";
import { getErrorMessage } from "../utils/apiError";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { consumeRedirectPath } from "../state/storage";

export function MfaChallengePage() {
  const navigate = useNavigate();
  const { mfaStage, submitOtp, sendMfaEmail, cancelMfaFlow } = useAuth();
  const [code, setCode] = useState("");
  const [channel, setChannel] = useState<MfaMode>("authenticator");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!mfaStage || mfaStage.kind !== "challenge") {
      navigate("/", { replace: true });
    } else {
      setChannel(mfaStage.authenticatorPreferred ? "authenticator" : mfaStage.allowEmail ? "email" : "authenticator");
    }
  }, [mfaStage, navigate]);

  if (!mfaStage || mfaStage.kind !== "challenge") return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setMessage(null);
    setLoading(true);
    try {
      const result = await submitOtp(code, channel);
      if (result.status === "authenticated") {
        navigate(consumeRedirectPath() || "/app");
      }
      if (result.status === "mfa_setup") {
        navigate("/mfa/setup");
      }
      if (result.status === "mfa_challenge") {
        setMessage("Código inválido. Tente novamente.");
      }
    } catch (err) {
      const parsed = getErrorMessage(err);
      setMessage(parsed.message || "Erro ao validar código.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    setSendingEmail(true);
    try {
      await sendMfaEmail();
      setChannel("email");
      setMessage("Código enviado. Verifique sua caixa de entrada e digite abaixo.");
    } catch (err) {
      const parsed = getErrorMessage(err);
      setMessage(parsed.message || "Erro ao enviar código por email.");
    } finally {
      setSendingEmail(false);
    }
  };

  const codeError =
    submitted && !code.trim()
      ? "Informe o código."
      : submitted && code.trim().length !== 6
      ? "Digite os 6 dígitos."
      : undefined;

  return (
    <div className="grid two">
      <Card strong title="Confirmar código" right={<span className="badge">Etapa de segurança</span>}>
        <p className="muted small">
          Para concluir seu acesso, confirme com o código do autenticador. Em alguns casos, você
          pode receber um código por e-mail durante o primeiro acesso.
        </p>
        {message && (
          <Alert variant="info">{message}</Alert>
        )}
        <form className="stack" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Canal</label>
            <div className="pill-row">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setChannel("authenticator")}
                disabled={loading}
                className={channel === "authenticator" ? "" : "opacity-70"}
              >
                Autenticador
              </Button>
              {mfaStage.allowEmail && (
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setChannel("email")}
                  disabled={loading}
                  className={channel === "email" ? "" : "opacity-70"}
                >
                  E-mail
                </Button>
              )}
            </div>
          </div>
          <Input
            label="Código"
            name="code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            inputMode="numeric"
            autoComplete="one-time-code"
            error={codeError}
          />
          <Button type="submit" loading={loading}>
            Confirmar e entrar
          </Button>
          <div className="pill-row">
            {mfaStage.allowEmail && (
              <Button
                variant="secondary"
                type="button"
                onClick={handleSendEmail}
                disabled={loading || sendingEmail}
                loading={sendingEmail}
              >
                Enviar código por e-mail
              </Button>
            )}
            <Link className="btn secondary" to="/" onClick={cancelMfaFlow}>
              Cancelar
            </Link>
          </div>
        </form>
      </Card>
      <Card title="Dicas">
        <p className="muted small">
          Se o código for recusado, verifique o horário do seu dispositivo e tente novamente. Se
          você trocar de aplicativo autenticador, será necessário reconfigurar.
        </p>
      </Card>
    </div>
  );
}
