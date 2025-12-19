import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { request } from "../api/http";
import { getErrorMessage } from "../utils/apiError";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { useToast } from "../components/ui/toast";

export function ForgotPasswordPage() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setMessage(null);
    setLoading(true);
    try {
      await request("/forgot-password", { method: "POST", body: { email } });
      toast.success("Se o e-mail estiver cadastrado, você receberá instruções em instantes.");
      setMessage("Se o e-mail estiver cadastrado, você receberá instruções em instantes.");
    } catch (err) {
      const parsed = getErrorMessage(err);
      setMessage(parsed.message || "Erro ao solicitar redefinição.");
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

  return (
    <div className="grid two">
      <Card strong title="Recuperar acesso">
        {message && (
          <Alert variant="info">{message}</Alert>
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
          <Button type="submit" loading={loading}>
            Enviar instruções
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
