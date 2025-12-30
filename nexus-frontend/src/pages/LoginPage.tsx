import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../state/auth";
import { ApiError, request } from "../api/http";
import { SSODiscoverResponse } from "../api/types";
import { setSSOContext } from "../state/storage";
import { getErrorMessage } from "../utils/apiError";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import "./LoginPage.css";

const COOLDOWN_SECONDS = 60;
const BLOCKED_MESSAGE = "Conta bloqueada, inicie o reset de senha para recuperar a conta.";

export function LoginPage() {
  const navigate = useNavigate();
  const { login, token, user, mfaStage, startSocialLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ssoCandidates, setSsoCandidates] = useState<SSODiscoverResponse["candidates"]>([]);
  const [ssoRequiresSelection, setSsoRequiresSelection] = useState(false);
  const [selectedSSOTenant, setSelectedSSOTenant] = useState<number | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = window.setInterval(() => {
      setCooldown((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    if (token && user) {
      navigate("/app", { replace: true });
    }
  }, [token, user, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (cooldown > 0) return;
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
      const apiErr = err as ApiError;
      if (apiErr?.status === 429) {
        setCooldown(COOLDOWN_SECONDS);
        setMessage("Muitas tentativas. Aguarde e tente novamente.");
        return;
      }
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
  const isBlocked = message === BLOCKED_MESSAGE;
  const isRateLimited = cooldown > 0;
  const selectedCandidate = ssoCandidates.find((candidate) => candidate.tenantId === selectedSSOTenant);
  const ssoRequired = selectedCandidate?.required === true;

  const startSSOWithCandidate = async (candidate: SSODiscoverResponse["candidates"][number]) => {
    setSsoLoading(true);
    setMessage(null);
    try {
      setSSOContext(candidate.tenantId, candidate.providerType);
      const resp = await request<{ url: string }>(candidate.startUrl);
      if (!resp.url) {
        throw new Error("URL de SSO inválida.");
      }
      window.location.href = resp.url;
    } catch (err) {
      const parsed = getErrorMessage(err);
      setMessage(parsed.message || "Não foi possível iniciar o SSO.");
    } finally {
      setSsoLoading(false);
    }
  };

  const handleSSODiscover = async () => {
    if (!email.trim()) {
      setMessage("Informe o email para descobrir o SSO.");
      return;
    }
    setSsoLoading(true);
    setMessage(null);
    try {
      const data = await request<SSODiscoverResponse>("/auth/sso/discover", {
        method: "POST",
        body: { email },
      });
      const candidates = data.candidates || [];
      setSsoCandidates(candidates);
      setSsoRequiresSelection(Boolean(data.requiresSelection));
      if (candidates.length === 1 && !data.requiresSelection) {
        setSelectedSSOTenant(candidates[0].tenantId);
        await startSSOWithCandidate(candidates[0]);
        return;
      }
      if (candidates.length === 1) {
        setSelectedSSOTenant(candidates[0].tenantId);
      } else {
        setSelectedSSOTenant(null);
      }
      if (!data.candidates?.length) {
        setMessage("Nenhum tenant com SSO encontrado para este email.");
      }
    } catch (err) {
      const parsed = getErrorMessage(err);
      setMessage(parsed.message || "Erro ao descobrir SSO.");
    } finally {
      setSsoLoading(false);
    }
  };

  const handleSSOStart = async () => {
    if (!selectedCandidate) {
      setMessage("Selecione um tenant para continuar.");
      return;
    }
    await startSSOWithCandidate(selectedCandidate);
  };

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
          {isRateLimited && (
            <span>
              {" "}
              Aguarde {cooldown}s antes de tentar novamente.
            </span>
          )}
        </Alert>
      )}
      {isBlocked && (
        <Link className="btn secondary" to="/forgot">
          Recuperar acesso
        </Link>
      )}
      {ssoRequired && (
        <Alert variant="info" title="SSO obrigatório">
          O login local está bloqueado para este tenant. Continue com SSO.
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
        isValid={submitted && !!email.trim() && !emailError}
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
        isValid={submitted && !!password && !passwordError}
        disabled={ssoRequired}
      />

      <Button type="submit" loading={loading} fullWidth disabled={isRateLimited || ssoRequired}>
        {isRateLimited ? `Aguarde ${cooldown}s` : loading ? "Entrando..." : "Entrar"}
      </Button>

      <div className="login-divider">
        <span>ou</span>
      </div>

      {ssoCandidates.length > 0 && (
        <div className="stack">
          {ssoRequiresSelection && (
            <label className="text-sm">
              Selecione o tenant
              <select
                value={selectedSSOTenant ?? ""}
                onChange={(e) => setSelectedSSOTenant(Number(e.target.value))}
              >
                <option value="" disabled>
                  Escolha uma empresa
                </option>
                {ssoCandidates.map((candidate) => (
                  <option key={candidate.tenantId} value={candidate.tenantId}>
                    {candidate.tenantName} ({candidate.providerType.toUpperCase()})
                  </option>
                ))}
              </select>
            </label>
          )}
          <Button
            variant="secondary"
            type="button"
            fullWidth
            onClick={handleSSOStart}
            disabled={ssoLoading || !selectedSSOTenant}
          >
            {ssoLoading ? "Redirecionando..." : "Continuar com SSO"}
          </Button>
        </div>
      )}

      {ssoCandidates.length === 0 && (
        <Button
          variant="secondary"
          type="button"
          fullWidth
          onClick={handleSSODiscover}
          disabled={ssoLoading}
        >
          {ssoLoading ? "Consultando..." : "Continuar com SSO"}
        </Button>
      )}

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
