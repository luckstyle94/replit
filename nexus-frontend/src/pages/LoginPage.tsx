import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../state/auth";
import { getErrorMessage } from "../utils/apiError";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import "./LoginPage.css";

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
      setMessage(parsed.message || "Não foi possível entrar. Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  };

  const emailError =
    submitted && !email.trim()
      ? "E-mail obrigatório"
      : submitted && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      ? "E-mail inválido"
      : undefined;
  const passwordError = submitted && !password ? "Senha obrigatória" : undefined;

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      {mfaStage && (
        <Alert variant="info" title="Autenticação em andamento">
          Você tem uma verificação pendente. Continue em{" "}
          <Link to={mfaStage.kind === "challenge" ? "/mfa/challenge" : "/mfa/setup"}>
            {mfaStage.kind === "challenge" ? "confirmar seu código" : "configurar seu autenticador"}
          </Link>
          .
        </Alert>
      )}

      {message && (
        <Alert variant="error" title="Erro ao entrar">
          {message}
        </Alert>
      )}

      <Input
        label="E-mail"
        name="email"
        type="email"
        placeholder="seu@email.com"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={emailError}
        isValid={submitted && email.trim() && !emailError}
      />

      <Input
        label="Senha"
        name="password"
        type="password"
        placeholder="••••••••"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={passwordError}
        isValid={submitted && password && !passwordError}
      />

      <Button type="submit" loading={loading} fullWidth>
        {loading ? "Entrando..." : "Entrar"}
      </Button>

      <div className="login-divider">
        <span>ou</span>
      </div>

      <Button
        variant="secondary"
        type="button"
        fullWidth
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

      <div className="login-footer">
        <Link to="/forgot">Esqueci minha senha</Link>
        <span className="separator">•</span>
        <Link to="/reset">Usar código de recuperação</Link>
      </div>
    </form>
  );
}
