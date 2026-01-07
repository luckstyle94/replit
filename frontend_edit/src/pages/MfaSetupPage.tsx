import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../state/auth";
import { MfaMode } from "../api/types";
import { copyToClipboard } from "../utils/clipboard";
import { getErrorMessage } from "../utils/apiError";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { useToast } from "../components/ui/toast";
import { consumeRedirectPath } from "../state/storage";

export function MfaSetupPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const { mfaStage, confirmMfa, verifyMfaEmail, sendMfaEmail, cancelMfaFlow } = useAuth();
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [channel, setChannel] = useState<MfaMode>("authenticator");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [qrSrc, setQrSrc] = useState<string | null>(null);

  const setup = mfaStage && mfaStage.kind !== "challenge" ? mfaStage.setup : null;
  const allowEmail = Boolean(mfaStage && mfaStage.kind !== "challenge" && mfaStage.allowEmail);

  useEffect(() => {
    if (!mfaStage || mfaStage.kind === "challenge") {
      navigate("/", { replace: true });
    }
  }, [mfaStage, navigate]);

  useEffect(() => {
    let active = true;
    const generateQr = async () => {
      if (!setup?.otpauth) {
        setQrSrc(null);
        return;
      }
      try {
        const { toDataURL } = await import("qrcode");
        const url = await toDataURL(setup.otpauth, {
          margin: 1,
          width: 160,
          color: { dark: "#e2e8f0", light: "#0f1422" },
        });
        if (active) {
          setQrSrc(url);
        }
      } catch {
        if (active) {
          setQrSrc(null);
        }
      }
    };

    generateQr();
    return () => {
      active = false;
    };
  }, [setup?.otpauth]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!setup) return;
    setSubmitted(true);
    setLoading(true);
    setMessage(null);
    try {
      if (channel === "email") {
        await verifyMfaEmail(code);
        setMessage("Acesso temporário liberado. Configure o autenticador assim que possível.");
        navigate(consumeRedirectPath() || "/app");
      } else {
        await confirmMfa(code, "authenticator");
        setMessage("Autenticador confirmado. Redirecionando...");
        navigate(consumeRedirectPath() || "/app");
      }
    } catch (err) {
      const parsed = getErrorMessage(err);
      setMessage(parsed.message || "Erro ao confirmar MFA.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    setSendingEmail(true);
    try {
      await sendMfaEmail();
      setChannel("email");
      setMessage(
        "Código enviado. Use-o no campo abaixo para um acesso temporário. Depois, finalize a configuração do autenticador."
      );
    } catch (err) {
      const parsed = getErrorMessage(err);
      setMessage(parsed.message || "Erro ao enviar código por email.");
    } finally {
      setSendingEmail(false);
    }
  };

  if (!setup) {
    return null;
  }

  const codeError =
    submitted && !code.trim()
      ? "Informe o código."
      : submitted && code.trim().length !== 6
      ? "Digite os 6 dígitos."
      : undefined;

  return (
    <div className="grid two">
      <Card strong title="Configurar autenticador" right={<span className="badge">Obrigatório</span>}>
        <p className="muted small">
          Adicione sua conta no app autenticador e confirme o código de 6 dígitos para ativar.
        </p>
        {message && (
          <Alert variant="info">{message}</Alert>
        )}
        <div className="stack">
          <div className="form-group">
            <label>Chave de configuração</label>
            <div className="surface wrap-anywhere">{setup.secret}</div>
            <div className="pill-row">
              <Button
                variant="secondary"
                type="button"
                onClick={async () => {
                  const ok = await copyToClipboard(setup.secret);
                  if (ok) toast.success("Chave copiada.");
                  else toast.error("Não foi possível copiar.");
                }}
              >
                Copiar chave
              </Button>
              {setup.otpauth && (
                <>
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={async () => {
                      const ok = await copyToClipboard(setup.otpauth);
                      if (ok) toast.success("Link copiado.");
                      else toast.error("Não foi possível copiar.");
                    }}
                  >
                    Copiar link
                  </Button>
                  <a className="btn ghost" href={setup.otpauth}>
                    Abrir no autenticador
                  </a>
                </>
              )}
            </div>
            {qrSrc && (
              <div className="qr-only-desktop qr-box" aria-hidden="true">
                <img className="qr-image" src={qrSrc} alt="QR code do autenticador" />
              </div>
            )}
          </div>
          <div className="pill-row">
            {setup.issuer && <span className="pill">Emissor: {setup.issuer}</span>}
            {setup.account && <span className="pill">Conta: {setup.account}</span>}
          </div>
          <Alert variant="info">
            Dica: se preferir, digite a chave manualmente no seu autenticador.
          </Alert>
        </div>
        <div className="divider" />
        <form className="grid two" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Canal</label>
            <div className="pill-row">
              <Button
                type="button"
                variant="secondary"
                className={channel === "authenticator" ? "" : "opacity-70"}
                onClick={() => setChannel("authenticator")}
                disabled={loading}
              >
                Autenticador
              </Button>
              {allowEmail && (
                <Button
                  type="button"
                  variant="secondary"
                  className={channel === "email" ? "" : "opacity-70"}
                  onClick={() => setChannel("email")}
                  disabled={loading}
                >
                  Código por e-mail
                </Button>
              )}
            </div>
          </div>
          <Input
            label="Código"
            name="code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            required
            autoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            error={codeError}
          />
          <Button type="submit" loading={loading}>
            Autenticar
          </Button>
          <div className="pill-row">
            {allowEmail && (
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
      <Card title="Por que isso é importante">
        <p className="muted small">
          O autenticador ajuda a proteger sua conta mesmo que sua senha seja descoberta. Depois de
          ativar, você vai confirmar um código sempre que fizer login.
        </p>
      </Card>
    </div>
  );
}
