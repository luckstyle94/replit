import { FormEvent, useState } from "react";
import { isAxiosError } from "axios";
import { useApi } from "../api/client";

// ResetPassword cobre o fluxo completo de esqueci/redefinição de senha.
// Explicação para leigos: primeiro pede o token (enviado por email/log),
// depois troca a senha usando esse token secreto.
export function ResetPassword() {
  const api = useApi();
  const [email, setEmail] = useState("admin@example.com");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("nova_senha_super_secreta");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // handleForgot chama /forgot-password e avisa para checar o email real.
  async function handleForgot(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await api.post("/forgot-password", { email });
      setMessage("Token solicitado. Verifique o email configurado no backend.");
    } catch (err) {
      if (isAxiosError(err)) {
        setMessage(err.response?.data?.error ?? "Erro ao solicitar reset");
      } else {
        setMessage("Erro inesperado ao solicitar reset");
      }
    } finally {
      setLoading(false);
    }
  }

  // handleReset troca a senha usando o token recebido.
  async function handleReset(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await api.post("/reset-password", { token, newPassword });
      setMessage("Senha redefinida");
    } catch (err) {
      if (isAxiosError(err)) {
        setMessage(err.response?.data?.error ?? "Erro ao redefinir senha (token correto?)");
      } else {
        setMessage("Erro inesperado ao redefinir senha");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid">
      <form className="stack" onSubmit={handleForgot}>
        <h2>Solicitar reset</h2>
        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Enviando..." : "Enviar token"}
        </button>
      </form>
      <form className="stack" onSubmit={handleReset}>
        <h2>Redefinir senha</h2>
        <label>
          Token
          <input value={token} onChange={(e) => setToken(e.target.value)} required />
        </label>
        <label>
          Nova senha
          <input
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            type="password"
            minLength={12}
            required
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar"}
        </button>
      </form>
      {message && <p className="info">{message}</p>}
    </div>
  );
}
