import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../state/auth";
import { getErrorMessage } from "../utils/apiError";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";

export function LoginPage() {
  const navigate = useNavigate();
  const { login, token, user, mfaStage, startSocialLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (token && user) {
      navigate("/app", { replace: true });
    }
  }, [token, user, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setMessage(null);
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.status === "authenticated") {
        navigate("/app");
      }
      if (result.status === "mfa_setup") {
        navigate("/mfa/setup");
      }
      if (result.status === "mfa_challenge") {
        navigate("/mfa/challenge");
      }
    } catch (err) {
      const parsed = getErrorMessage(err);
      setMessage(parsed.message || "Falha no login.");
    } finally {
      setLoading(false);
    }
  };

  const emailError =
    submitted && !email.trim()
      ? "Informe seu e-mail."
      : submitted && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email.trim())
      ? "Digite um e-mail válido."
      : undefined;
  const passwordError = submitted && !password ? "Informe sua senha." : undefined;

  return (
    <div className="grid two">
      <Card strong title="Entrar">
        <p className="muted small">Use seu e-mail e senha para continuar.</p>
        {mfaStage && (
          <div className="mb-12">
            <Alert variant="info" title="Verificação em andamento">
              Há uma confirmação pendente. Continue em{" "}
              <Link to={mfaStage.kind === "challenge" ? "/mfa/challenge" : "/mfa/setup"}>
                {mfaStage.kind === "challenge" ? "Confirmar código" : "Configurar autenticador"}
              </Link>
              .
            </Alert>
          </div>
        )}
        {message && (
          <Alert variant="error" title="Não foi possível entrar">
            {message}
          </Alert>
        )}
        <form className="stack" onSubmit={handleSubmit}>
          <Input
            label="E-mail"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={emailError}
          />
          <Input
            label="Senha"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={passwordError}
          />
          <Button type="submit" loading={loading}>
            Entrar
          </Button>
          <div className="divider">
            <span>ou</span>
          </div>
          <Button
            variant="ghost"
            type="button"
            onClick={async () => {
              setMessage(null);
              setSocialLoading(true);
              try {
                const url = await startSocialLogin("google");
                window.location.href = url;
              } catch (err) {
                const parsed = getErrorMessage(err);
                setMessage(parsed.message || "Não foi possível iniciar o login com Google.");
              } finally {
                setSocialLoading(false);
              }
            }}
            disabled={socialLoading}
          >
            {socialLoading ? "Redirecionando..." : "Continuar com Google"}
          </Button>
          <div className="muted small">
            <Link to="/forgot">Esqueci minha senha</Link> · <Link to="/reset">Já tenho um código</Link>
          </div>
        </form>
      </Card>
      <Card title="Dicas rápidas">
        <ul className="muted small list-indent">
          <li>Se solicitado, confirme com o código do seu autenticador.</li>
          <li>Está sem acesso? Use “Esqueci minha senha”.</li>
          <li>Por segurança, sua sessão expira automaticamente com o tempo.</li>
        </ul>
      </Card>
    </div>
  );
}
