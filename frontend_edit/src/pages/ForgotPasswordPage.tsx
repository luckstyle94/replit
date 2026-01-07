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
export function ForgotPasswordPage() {
  const toast = useToast();
  const [email, setEmail] = useState("");
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
    setLoading(true);
    try {
      await request("/forgot-password", { method: "POST", body: { email } });
      toast.success("Se o e-mail estiver cadastrado, você receberá instruções em instantes.");
      setMessage("Se o e-mail estiver cadastrado, você receberá instruções em instantes.");
    } catch (err) {
      const parsed = getErrorMessage(err);
      const apiErr = err as ApiError;
      if (apiErr?.status === 429) {
        setCooldown(COOLDOWN_SECONDS);
        setMessage("Muitas tentativas. Aguarde e tente novamente.");
        return;
      }
      setMessage(parsed.message || "Erro ao solicitar redefinição.");
    } finally {
      setLoading(false);
    }
  };

  const emailError =
    submitted && !email.trim()
      ? "Informe seu e-mail."
      : submitted && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      ? "Digite um e-mail válido."
      : undefined;
  const isRateLimited = cooldown > 0;

  return (
    <div className="grid two">
      <Card strong title="Recuperar acesso">
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
        <form className="stack" onSubmit={handleSubmit}>
          <Input
            label="E-mail"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={emailError}
            hint="Vamos enviar instruções para redefinir sua senha."
          />
          <Button type="submit" loading={loading} disabled={isRateLimited}>
            {isRateLimited ? `Aguarde ${cooldown}s` : "Enviar instruções"}
          </Button>
          <Link className="muted small" to="/">
            Voltar para login
          </Link>
        </form>
      </Card>
      <Card title="O que acontece agora">
        <p className="muted small">
          Se o e-mail estiver cadastrado, você receberá uma mensagem com os próximos passos. Se não
          encontrar, verifique a caixa de spam.
        </p>
      </Card>
    </div>
  );
}
