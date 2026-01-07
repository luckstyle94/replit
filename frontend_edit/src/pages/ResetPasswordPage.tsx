import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError, request } from "../api/http";
import { getErrorMessage } from "../utils/apiError";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { useToast } from "../components/ui/toast";

const COOLDOWN_SECONDS = 60;
const BLOCKED_MESSAGE = "Conta bloqueada, inicie o reset de senha para recuperar a conta.";

export function ResetPasswordPage() {
  const toast = useToast();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = window.setInterval(() => {
      setCooldown((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (cooldown > 0) return;
    setSubmitted(true);
    setMessage(null);
    if (newPassword !== confirmPassword) {
      setMessage("As senhas não conferem.");
      return;
    }
    setLoading(true);
    try {
      await request("/reset-password", {
        method: "POST",
        body: { token, newPassword },
      });
      toast.success("Senha atualizada. Você já pode entrar com a nova senha.");
      setMessage("Senha atualizada. Você já pode entrar com a nova senha.");
    } catch (err) {
      const parsed = getErrorMessage(err);
      const apiErr = err as ApiError;
      if (apiErr?.status === 429) {
        setCooldown(COOLDOWN_SECONDS);
        setMessage("Muitas tentativas. Aguarde e tente novamente.");
        return;
      }
      if (parsed.message.toLowerCase().includes("últimas 5 senhas")) {
        setMessage("Escolha uma senha diferente das últimas 5 usadas.");
        return;
      }
      setMessage(parsed.message || "Erro ao redefinir senha.");
    } finally {
      setLoading(false);
    }
  };

  const tokenError = submitted && !token.trim() ? "Cole o código recebido." : undefined;
  const passwordError =
    submitted && !newPassword
      ? "Informe a nova senha."
      : submitted && newPassword.length < 12
      ? "Use pelo menos 12 caracteres."
      : undefined;
  const confirmError =
    submitted && !confirmPassword
      ? "Confirme a nova senha."
      : submitted && confirmPassword !== newPassword
      ? "As senhas não conferem."
      : undefined;
  const isBlocked = message === BLOCKED_MESSAGE;
  const isRateLimited = cooldown > 0;

  return (
    <Card strong title="Definir nova senha">
      {message && (
        <Alert variant="info">
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
      <form className="grid two" onSubmit={handleSubmit}>
        <Input
          label="Código"
          name="token"
          required
          value={token}
          onChange={(e) => setToken(e.target.value)}
          error={tokenError}
          hint="Cole o código recebido para continuar."
        />
        <Input
          label="Nova senha"
          name="newPassword"
          type="password"
          minLength={12}
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          error={passwordError}
          hint="Use pelo menos 12 caracteres."
        />
        <Input
          label="Confirmar senha"
          name="confirmPassword"
          type="password"
          minLength={12}
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={confirmError}
        />
        <Button type="submit" loading={loading} disabled={isRateLimited}>
          {isRateLimited ? `Aguarde ${cooldown}s` : "Atualizar senha"}
        </Button>
        <Link className="muted small" to="/">
          Voltar para login
        </Link>
      </form>
    </Card>
  );
}
