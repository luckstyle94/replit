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
    <div className="shell">
      <div className="header">
        <div className="header-title">
          <h1>Sessões Ativas</h1>
          <p className="muted">Monitore e gerencie acessos em tempo real.</p>
        </div>
        <button className="secondary" onClick={() => loadSessions(true)} disabled={loading}>
          🔄 Atualizar Lista
        </button>
      </div>

      {message && (
        <div className="info" style={{ marginBottom: '1.5rem' }}>
          {message}
        </div>
      )}

      <div className="stack">
        {loading ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p className="muted">Carregando sessões...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p className="muted">Nenhuma sessão ativa encontrada.</p>
          </div>
        ) : (
          <div className="grid">
            {sessions.map((session) => (
              <div key={session.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem' }}>{session.userName || session.userEmail || "Usuário Desconhecido"}</h3>
                    <p className="muted" style={{ fontSize: '0.75rem' }}>{session.userEmail}</p>
                  </div>
                  <span style={{ 
                    padding: '0.2rem 0.4rem', 
                    borderRadius: '4px', 
                    fontSize: '0.625rem',
                    backgroundColor: '#eff6ff',
                    color: '#3b82f6',
                    fontWeight: '700'
                  }}>
                    ID: {session.userId ?? "—"}
                  </span>
                </div>

                <div style={{ fontSize: '0.8125rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span className="muted" style={{ minWidth: '80px' }}>Dispositivo:</span>
                    <span style={{ wordBreak: 'break-all' }}>{truncate(session.userAgent, 60)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span className="muted" style={{ minWidth: '80px' }}>Endereço IP:</span>
                    <span>{session.ip || "Não informado"}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span className="muted" style={{ minWidth: '80px' }}>Iniciado em:</span>
                    <span>{formatDate(session.createdAt)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <span className="muted" style={{ minWidth: '80px' }}>Atividade:</span>
                    <span style={{ color: 'var(--accent)', fontWeight: '500' }}>{formatDate(session.lastActivity)}</span>
                  </div>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
                  <button className="secondary small" onClick={() => handleRevokeSession(session)} style={{ fontSize: '0.75rem' }}>
                    Encerrar Esta Sessão
                  </button>
                  <button className="secondary small" onClick={() => handleRevokeUserSessions(session)} style={{ fontSize: '0.75rem', color: '#ef4444', borderColor: '#fecaca' }}>
                    Revogar Todos os Acessos do Usuário
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {nextCursor && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
            <button onClick={() => loadSessions(false)} disabled={loadingMore} style={{ width: '200px' }}>
              {loadingMore ? "Carregando..." : "Ver Mais Sessões"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
