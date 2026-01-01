import { FormEvent, useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { useApi } from "../api/client";
import type { User } from "../api/types";

interface Props {
  user: User | null;
  loading: boolean;
  onReload: () => Promise<void>;
  onForceLogout: () => void;
}

// Profile mostra e permite atualizar os dados do próprio usuário.
// Explicação para leigos: é a tela "meus dados"; ela lê o crachá (/me)
// e deixa ajustar nome/email sem mexer na permissão (role).
export function Profile({ user, loading, onReload, onForceLogout }: Props) {
  const api = useApi();
  const [form, setForm] = useState({ name: "", email: "" });
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pwdMessage, setPwdMessage] = useState<string | null>(null);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdForm, setPwdForm] = useState({ currentPassword: "", newPassword: "" });

  useEffect(() => {
    if (user) {
      setForm({ name: user.name, email: user.email });
    }
  }, [user]);

  // handleUpdate envia o PUT /me com campos editados.
  const handleUpdate = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage(null);
    try {
      await api.put("/me", { name: form.name, email: form.email });
      setMessage("Perfil atualizado com sucesso.");
      await onReload();
    } catch (err) {
      if (isAxiosError(err)) {
        if (err.response?.status === 401) {
          onForceLogout();
          return;
        }
        setMessage(err.response?.data?.error ?? "Erro ao salvar perfil.");
      } else {
        setMessage("Erro inesperado ao salvar perfil.");
      }
    } finally {
      setSaving(false);
    }
  };

  // handlePasswordChange troca a senha usando /me/change-password.
  const handlePasswordChange = async (event: FormEvent) => {
    event.preventDefault();
    setPwdSaving(true);
    setPwdMessage(null);
    try {
      await api.post("/me/change-password", {
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword
      });
      setPwdMessage("Senha alterada com sucesso.");
      setPwdForm({ currentPassword: "", newPassword: "" });
    } catch (err) {
      if (isAxiosError(err)) {
        if (err.response?.status === 401) {
          onForceLogout();
          return;
        }
        setPwdMessage(err.response?.data?.error ?? "Erro ao alterar senha.");
      } else {
        setPwdMessage("Erro inesperado ao alterar senha.");
      }
    } finally {
      setPwdSaving(false);
    }
  };

  if (loading) return <p className="muted">Carregando perfil...</p>;
  if (!user) return <p className="error">Nenhum usuário logado. Faça login novamente.</p>;

  return (
    <div className="stack">
      <h2>Meu perfil</h2>
      <p className="muted">
        Você está autenticado como <strong>{user.email}</strong> (role {user.roleId}).
      </p>

      <form className="stack" onSubmit={handleUpdate}>
        <label>
          Nome
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </label>
        <label>
          Email
          <input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            type="email"
            required
          />
        </label>
        <button type="submit" disabled={saving}>
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </form>

      {message && <p className="info">{message}</p>}

      <form className="stack" onSubmit={handlePasswordChange}>
        <h3>Alterar senha</h3>
        <label>
          Senha atual
          <input
            value={pwdForm.currentPassword}
            onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
            type="password"
            required
          />
        </label>
        <label>
          Nova senha
          <input
            value={pwdForm.newPassword}
            onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
            type="password"
            minLength={12}
            required
          />
        </label>
        <button type="submit" disabled={pwdSaving}>
          {pwdSaving ? "Trocando..." : "Trocar senha"}
        </button>
        {pwdMessage && <p className="info">{pwdMessage}</p>}
      </form>
    </div>
  );
}
