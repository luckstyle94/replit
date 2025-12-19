import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { request } from "../api/http";
import { getErrorMessage } from "../utils/apiError";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { useToast } from "../components/ui/toast";

export function ResetPasswordPage() {
  const toast = useToast();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setMessage(null);
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

  return (
    <Card strong title="Definir nova senha">
      {message && (
        <Alert variant="info">{message}</Alert>
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
        <Button type="submit" loading={loading}>
          Atualizar senha
        </Button>
        <Link className="muted small" to="/">
          Voltar para login
        </Link>
      </form>
    </Card>
  );
}
