import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import api from "../../services/api";
import { SessionInfo, SessionsResponse } from "../../api/types";

const PAGE_LIMIT = 50;

export function Sessions() {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const logError = (label: string, error: unknown) => {
    if (isAxiosError(error)) {
      console.warn(label, error.response?.status ?? "unknown", error.message);
      return;
    }
    if (error instanceof Error) {
      console.warn(label, error.message);
      return;
    }
    console.warn(label);
  };

  const loadSessions = async (reset = false) => {
    const cursor = reset ? "" : nextCursor;
    if (!reset && !cursor && sessions.length > 0) return;
    reset ? setLoading(true) : setLoadingMore(true);
    setMessage(null);
    try {
      const query = new URLSearchParams();
      query.set("limit", String(PAGE_LIMIT));
      if (cursor) query.set("cursor", cursor);
      const { data } = await api.get<SessionsResponse>(`/admin/sessions?${query.toString()}`);
      setSessions((prev) => (reset ? data.data : [...prev, ...data.data]));
      setNextCursor(data.nextCursor || "");
    } catch (error) {
      logError("Failed to load sessions", error);
      setMessage("Erro ao carregar sessões.");
    } finally {
      reset ? setLoading(false) : setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadSessions(true);
  }, []);

  const handleRevokeSession = async (session: SessionInfo) => {
    if (!confirm("Encerrar esta sessão agora?")) return;
    try {
      await api.delete(`/admin/sessions/${session.id}`);
      setSessions((prev) => prev.filter((item) => item.id !== session.id));
      setMessage("Sessão encerrada com sucesso.");
    } catch (error) {
      logError("Failed to revoke session", error);
      setMessage("Erro ao encerrar sessão.");
    }
  };

  const handleRevokeUserSessions = async (session: SessionInfo) => {
    if (!session.userId) return;
    const label = session.userName || session.userEmail || `ID ${session.userId}`;
    if (!confirm(`Encerrar TODAS as sessões de ${label}?`)) return;
    try {
      await api.post(`/admin/users/${session.userId}/sessions/revoke`);
      setSessions((prev) => prev.filter((item) => item.userId !== session.userId));
      setMessage("Sessões do usuário encerradas.");
    } catch (error) {
      logError("Failed to revoke user sessions", error);
      setMessage("Erro ao encerrar sessões do usuário.");
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return "—";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "—";
    return parsed.toLocaleString();
  };

  const truncate = (value?: string, limit = 80) => {
    if (!value) return "Não informado";
    if (value.length <= limit) return value;
    return `${value.slice(0, limit)}...`;
  };

  return (
    <div className="shell stack">
      <div className="header">
        <div>
          <h1>Sessões</h1>
          <p className="muted">Visualize e encerre sessões ativas globalmente.</p>
        </div>
        <div className="actions">
          <button className="secondary" onClick={() => loadSessions(true)} disabled={loading}>
            Atualizar
          </button>
        </div>
      </div>

      {message && <div className="info">{message}</div>}

      <div className="card">
        {loading ? (
          <p className="muted">Carregando sessões...</p>
        ) : sessions.length === 0 ? (
          <p className="muted">Nenhuma sessão ativa encontrada.</p>
        ) : (
          <ul className="list">
            {sessions.map((session) => (
              <li key={session.id}>
                <div>
                  <strong>{session.userName || session.userEmail || "Usuário"}</strong>
                  <div className="muted">ID do usuário: {session.userId ?? "—"}</div>
                  <div className="muted">E-mail: {session.userEmail || "Não informado"}</div>
                  <div className="muted">Dispositivo: {truncate(session.userAgent)}</div>
                  <div className="muted">IP aproximado: {session.ip || "Não informado"}</div>
                  <div className="muted">Início: {formatDate(session.createdAt)}</div>
                  <div className="muted">Última atividade: {formatDate(session.lastActivity)}</div>
                </div>
                <div className="actions">
                  <button className="secondary" onClick={() => handleRevokeSession(session)}>
                    Encerrar sessão
                  </button>
                  <button className="danger" onClick={() => handleRevokeUserSessions(session)}>
                    Encerrar todas do usuário
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {nextCursor && (
          <div className="actions">
            <button onClick={() => loadSessions(false)} disabled={loadingMore}>
              {loadingMore ? "Carregando..." : "Carregar mais"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
