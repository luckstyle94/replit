import { FormEvent, useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { useApi } from "../api/client";
import type { User } from "../api/types";

interface ListResponse {
  data: User[];
}

// Users lista e cria usuários, apenas para quem tem role de Admin.
// Explicação para leigos: é a sala de controle; se você não for Admin,
// a API devolve 403 e nada é mostrado.
export function Users() {
  const api = useApi();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "Test User",
    email: `test_${Date.now()}@example.com`,
    password: "123456789012",
    roleId: 2
  });

  // load busca a lista paginada de usuários.
  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get<ListResponse>("/users?limit=50");
      setUsers(data.data);
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 403) {
        setMessage("Apenas administradores podem ver esta lista.");
      } else if (isAxiosError(err) && err.response?.status === 401) {
        setMessage("Sessão inválida. Faça login novamente.");
      } else if (err instanceof Error) {
        setMessage(err.message);
      } else {
        setMessage("Erro desconhecido ao listar usuários.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // handleCreate envia o POST /users com os dados do formulário.
  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await api.post("/users", {
        name: form.name,
        email: form.email,
        password: form.password,
        roleId: Number(form.roleId)
      });
      setMessage("Usuário criado");
      setForm({
        ...form,
        email: `test_${Date.now()}@example.com`
      });
      await load();
    } catch (err) {
      if (isAxiosError(err)) {
        console.warn("Failed to create user", err.response?.status ?? "unknown", err.message);
      } else if (err instanceof Error) {
        console.warn("Failed to create user", err.message);
      } else {
        console.warn("Failed to create user");
      }
      setMessage("Erro ao criar usuário (verifique role admin e token)");
    } finally {
      setLoading(false);
    }
  }

  // handleDeactivate faz o soft delete (mantém no banco com deleted_at).
  async function handleDeactivate(id: number) {
    setBusyId(id);
    setMessage(null);
    try {
      await api.delete(`/users/${id}`);
      setMessage("Usuário desativado (soft delete).");
      await load();
    } catch (err) {
      if (isAxiosError(err)) {
        setMessage(err.response?.data?.error ?? "Erro ao desativar usuário.");
      } else {
        setMessage("Erro inesperado ao desativar usuário.");
      }
    } finally {
      setBusyId(null);
    }
  }

  // handleHardDelete remove definitivamente (rota /users/:id/permanent).
  async function handleHardDelete(id: number) {
    const confirm = window.confirm("Remover permanentemente este usuário? Esta ação não pode ser desfeita.");
    if (!confirm) return;
    setBusyId(id);
    setMessage(null);
    try {
      await api.delete(`/users/${id}/permanent`);
      setMessage("Usuário removido permanentemente.");
      await load();
    } catch (err) {
      if (isAxiosError(err)) {
        setMessage(err.response?.data?.error ?? "Erro ao remover usuário.");
      } else {
        setMessage("Erro inesperado ao remover usuário.");
      }
    } finally {
      setBusyId(null);
    }
  }

  // handleRestore reativa um usuário soft-deletado.
  async function handleRestore(id: number) {
    setBusyId(id);
    setMessage(null);
    try {
      await api.post(`/users/${id}/restore`);
      setMessage("Usuário reativado.");
      await load();
    } catch (err) {
      if (isAxiosError(err)) {
        setMessage(err.response?.data?.error ?? "Erro ao reativar usuário.");
      } else {
        setMessage("Erro inesperado ao reativar usuário.");
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="grid">
      <section className="stack">
        <h2>Usuários</h2>
        {loading && <p className="muted">Carregando...</p>}
        {message && <p className="info">{message}</p>}
        <ul className="list">
          {users.map((user) => (
            <li key={user.id}>
              <strong>{user.name}</strong>
              <span>{user.email}</span>
              <span className="muted">
                Role {user.roleId} · Status: {user.status}
              </span>
              <div className="actions">
                {user.status === "active" ? (
                  <button
                    className="secondary"
                    onClick={() => handleDeactivate(user.id)}
                    disabled={busyId === user.id || loading}
                  >
                    {busyId === user.id ? "Desativando..." : "Desativar"}
                  </button>
                ) : (
                  <button
                    className="secondary"
                    onClick={() => handleRestore(user.id)}
                    disabled={busyId === user.id || loading}
                  >
                    {busyId === user.id ? "Reativando..." : "Reativar"}
                  </button>
                )}
                <button
                  className="danger"
                  onClick={() => handleHardDelete(user.id)}
                  disabled={busyId === user.id || loading}
                >
                  {busyId === user.id ? "Removendo..." : "Remover"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section className="stack">
        <h2>Criar usuário</h2>
        <form className="stack" onSubmit={handleCreate}>
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
          <label>
            Senha
            <input
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              type="password"
              minLength={12}
              required
            />
          </label>
          <label>
            Role ID
            <input
              value={form.roleId}
              onChange={(e) => setForm({ ...form, roleId: Number(e.target.value) })}
              type="number"
              min={1}
              required
            />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? "Criando..." : "Criar"}
          </button>
        </form>
      </section>
    </div>
  );
}
