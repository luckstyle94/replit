import { FormEvent, useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../state/auth";
import { TenantsPanel } from "../components/tenants/TenantsPanel";
import { maskCpf } from "../utils/format";
import { ApiError, request } from "../api/http";
import { Alert } from "../components/ui/Alert";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { useToast } from "../components/ui/toast";
import { SessionInfo, SessionsResponse } from "../api/types";

export function DashboardPage() {
  const { user, updateProfile, changePassword, mfaMode, startAuthenticatorSetup, mfaStage, token, logout } =
    useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setCpf(user.cpf || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  const loadSessions = useCallback(async () => {
    if (!token) return;
    setLoadingSessions(true);
    setSessionMessage(null);
    try {
      const response = await request<SessionsResponse>("/sessions", { token });
      setSessions(response.data || []);
    } catch (err) {
      const apiErr = err as ApiError;
      setSessionMessage(apiErr.message || "Erro ao carregar sessões.");
    } finally {
      setLoadingSessions(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadSessions();
    }
  }, [loadSessions, token]);

  if (!user) {
    return (
      <Card title="Carregando" strong>
        <div className="muted">Preparando sua área...</div>
      </Card>
    );
  }

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    setSavingProfile(true);
    try {
      await updateProfile({
        name: name.trim(),
        email: email.trim(),
        cpf: cpf.trim(),
        phone: phone.trim(),
      });
      setProfileMessage("Dados atualizados.");
      toast.success("Dados salvos.");
    } catch (err) {
      setProfileMessage((err as Error).message || "Erro ao atualizar perfil.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    if (newPassword.length < 12) {
      setPasswordMessage("Use pelo menos 12 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage("As senhas não conferem.");
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordMessage("Senha atualizada.");
      toast.success("Senha atualizada.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const apiErr = err as ApiError;
      if ((apiErr.message || "").toLowerCase().includes("últimas 5 senhas")) {
        setPasswordMessage("Escolha uma senha diferente das últimas 5 usadas.");
      } else {
        setPasswordMessage(apiErr.message || "Erro ao alterar senha.");
      }
    } finally {
      setSavingPassword(false);
    }
  };

  const handleStartMfa = async () => {
    setPasswordMessage(null);
    try {
      await startAuthenticatorSetup();
      navigate("/mfa/setup");
    } catch (err) {
      const apiErr = err as ApiError;
      setPasswordMessage(apiErr.message || "Erro ao iniciar configuração de MFA.");
    }
  };

  const handleRevokeSession = async (sessionId: string, isCurrent: boolean) => {
    if (!token) {
      toast.error("Sessão inválida. Faça login novamente.");
      return;
    }
    const confirmation = isCurrent
      ? "Essa é sua sessão atual. Encerrar agora vai exigir novo login. Deseja continuar?"
      : "Deseja encerrar esta sessão?";
    if (!confirm(confirmation)) return;
    try {
      await request(`/sessions/${sessionId}`, { method: "DELETE", token });
      toast.success("Sessão encerrada.");
      if (isCurrent) {
        await logout();
        return;
      }
      loadSessions();
    } catch (err) {
      const apiErr = err as ApiError;
      toast.error(apiErr.message || "Erro ao encerrar sessão.");
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return "—";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "—";
    return parsed.toLocaleString();
  };

  const isMfaDelegated = user.mfaManagement?.mode === "delegated";
  const mfaBadge = isMfaDelegated
    ? { text: "MFA gerenciado", className: "badge info" }
    : user.mfaEnabled
    ? { text: "MFA ativo", className: "badge success" }
    : { text: "MFA pendente", className: "badge danger" };
  const channelLabel = isMfaDelegated
    ? "SSO"
    : user.mfaEnabled
    ? "Autenticador"
    : mfaMode === "email"
    ? "E-mail"
    : mfaMode === "authenticator"
    ? "Autenticador"
    : "Indefinido";

  return (
    <div className="stack">
      <div className="hero">
        <div className="badge">Área do usuário</div>
        <h1>Olá, {user.name}</h1>
        <p className="muted">
          Atualize seus dados, troque sua senha e gerencie suas organizações.
        </p>
        <div className="pill-row">
          <span className={mfaBadge.className}>{mfaBadge.text}</span>
          <span className="pill">Situação: {user.status}</span>
          <span className="pill">CPF: {maskCpf(user.cpf)}</span>
        </div>
      </div>

      <div className="grid two">
        <Card title="Perfil">
          {profileMessage && <Alert variant="info">{profileMessage}</Alert>}
          <form className="stack" onSubmit={handleProfileSubmit}>
            <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} />
            <Input
              label="E-mail"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="CPF (opcional)"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              inputMode="numeric"
            />
            <Input
              label="Telefone (opcional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              autoComplete="tel"
            />
            <Button type="submit" loading={savingProfile}>
              Salvar alterações
            </Button>
          </form>
        </Card>

        <Card title="Segurança">
          {passwordMessage && <Alert variant="info">{passwordMessage}</Alert>}
          <form className="stack" onSubmit={handlePasswordSubmit}>
            <Input
              label="Senha atual"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <Input
              label="Nova senha"
              type="password"
              autoComplete="new-password"
              minLength={12}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              hint="Use pelo menos 12 caracteres."
            />
            <Input
              label="Confirmar senha"
              type="password"
              autoComplete="new-password"
              minLength={12}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <Button type="submit" loading={savingPassword}>
              Atualizar senha
            </Button>
          </form>
          <div className="divider" />
          <div className="stack">
            <div className="card-title">Autenticador</div>
            <div className="pill-row">
              <span className={mfaBadge.className}>{mfaBadge.text}</span>
              <span className="pill">Método atual: {channelLabel}</span>
            </div>
            {isMfaDelegated ? (
              <p className="muted small">{user.mfaManagement?.message || "MFA gerenciado pela sua organização."}</p>
            ) : mfaMode === "email" ? (
              <p className="muted small">
                Você confirmou por e-mail neste login. Esse método pode ficar disponível apenas
                durante o primeiro acesso.
              </p>
            ) : (
              <p className="muted small">
                Com o autenticador ativado, o código do app passa a ser obrigatório para entrar.
              </p>
            )}
            <div className="pill-row">
              <Button variant="secondary" type="button" onClick={handleStartMfa}>
                {mfaStage?.kind === "reconfigure"
                  ? "Retomar configuração"
                  : "Reconfigurar autenticador"}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <Card
        title="Sessões ativas"
        right={
          <Button variant="secondary" type="button" onClick={loadSessions} loading={loadingSessions}>
            Atualizar
          </Button>
        }
      >
        {sessionMessage && <Alert variant="info">{sessionMessage}</Alert>}
        {sessions.length === 0 ? (
          <div className="muted">Nenhuma sessão ativa encontrada.</div>
        ) : (
          <div className="session-list">
            {sessions.map((session) => {
              const isCurrent = session.status === "current";
              const statusLabel = isCurrent ? "Sessão atual" : "Ativa";
              const statusClass = isCurrent ? "badge success" : "badge info";
              return (
                <div className="session-row" key={session.id}>
                  <div className="session-cell">
                    <div className="session-title">
                      {session.userAgent || "Dispositivo não identificado"}
                    </div>
                    <div className="muted small">IP: {session.ip || "Não informado"}</div>
                  </div>
                  <div className="session-cell">
                    <div className="session-label">Início</div>
                    <div>{formatDate(session.createdAt)}</div>
                  </div>
                  <div className="session-cell">
                    <div className="session-label">Última atividade</div>
                    <div>{formatDate(session.lastActivity)}</div>
                  </div>
                  <div className="session-cell session-actions">
                    <span className={statusClass}>{statusLabel}</span>
                    <Button
                      variant={isCurrent ? "secondary" : "danger"}
                      type="button"
                      onClick={() => handleRevokeSession(session.id, isCurrent)}
                    >
                      Encerrar
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <TenantsPanel />
    </div>
  );
}
