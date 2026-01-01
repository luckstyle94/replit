import { FormEvent, useState } from "react";
import { isAxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaData, setMfaData] = useState<{ secret: string; otpauth: string; mfaToken: string } | null>(null);
  const [otpStep, setOtpStep] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMfaData(null);
    setOtpStep(false);
    try {
      const { data } = await api.post<{ token: string }>("/login", { email, password, otp });
      login(data.token);
      navigate("/dashboard");
    } catch (err: any) {
      logError("Login failed", err);
      const code = err?.response?.data?.code;
      if (code === "mfa_required") {
        setMfaData({
          secret: err.response.data.secret,
          otpauth: err.response.data.otpauth,
          mfaToken: err.response.data.mfaToken,
        });
        setError("MFA obrigatório. Configure e confirme o código.");
        setOtpStep(false);
      } else if (code === "otp_required") {
        setOtpStep(true);
        setError("Informe o código do autenticador.");
      } else {
        setError("Falha no login. Verifique suas credenciais.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmMFA(e: FormEvent) {
    e.preventDefault();
    if (!mfaData) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1"}/mfa/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${mfaData.mfaToken}`,
        },
        body: JSON.stringify({ code: mfaCode }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data?.error || "Erro ao confirmar MFA");
      }
      if (data.token) {
        await login(data.token);
        navigate("/dashboard");
      } else {
        setError("MFA confirmado. Faça login novamente com seu código.");
      }
      setMfaData(null);
      setMfaCode("");
    } catch (err: any) {
      setError(err.message || "Erro ao confirmar MFA");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container" style={{ 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      height: "100vh", 
      backgroundColor: "var(--background)",
      background: "radial-gradient(circle at 50% 50%, #f1f5f9 0%, #f8fafc 100%)"
    }}>
      <form className="card stack" onSubmit={handleSubmit} style={{ 
        width: "100%", 
        maxWidth: "420px", 
        padding: "2.5rem",
        boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)"
      }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--primary)", letterSpacing: "-0.05em", margin: 0 }}>Nexus</h2>
          <p className="muted">Acesse o painel administrativo</p>
        </div>
        
        <label>
          Email
          <input 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            type="email" 
            placeholder="admin@nexus.com"
            required 
          />
        </label>
        
        <label>
          Senha
          <input 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            type="password" 
            placeholder="••••••••••••"
            required 
          />
        </label>
        
        <button type="submit" disabled={loading} style={{ marginTop: "1rem", height: "48px" }}>
          {loading ? "Entrando..." : "Entrar na plataforma"}
        </button>
        
        {error && (
          <div style={{ 
            marginTop: "1rem", 
            padding: "0.75rem", 
            backgroundColor: "#fef2f2", 
            border: "1px solid #fee2e2", 
            borderRadius: "8px",
            color: "#ef4444",
            fontSize: "0.875rem",
            textAlign: "center"
          }}>
            {error}
          </div>
        )}
        
        {otpStep && (
          <div className="card" style={{ marginTop: "1.5rem", padding: "1.25rem", background: "#f8fafc", border: "1px solid var(--border)" }}>
            <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.875rem" }}>Informe o código do autenticador</h4>
            <label>
              Código MFA
              <input value={otp} onChange={(e) => setOtp(e.target.value)} type="text" placeholder="123456" />
            </label>
            <p className="muted" style={{ fontSize: "0.75rem", marginTop: "0.5rem" }}>Confira seu aplicativo de autenticação (Google, Authy, etc).</p>
          </div>
        )}
        
        {mfaData && (
          <div className="card" style={{ marginTop: "1.5rem", padding: "1.25rem", background: "#f8fafc", border: "1px solid var(--border)" }}>
            <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.875rem" }}>Configure seu MFA</h4>
            <p className="muted" style={{ fontSize: "0.75rem", marginBottom: "1rem" }}>Escaneie o QR Code abaixo para ativar a segurança em duas etapas.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center" }}>
              <img
                alt="QR MFA"
                style={{ borderRadius: "8px", border: "4px solid #fff", boxShadow: "var(--shadow)" }}
                src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(mfaData.otpauth)}&size=150x150`}
              />
              <div style={{ width: "100%" }}>
                <p className="muted" style={{ fontSize: "0.7rem", marginBottom: "0.25rem" }}>Chave manual:</p>
                <div style={{ 
                  fontFamily: "monospace", 
                  fontSize: "0.75rem", 
                  padding: "0.5rem", 
                  background: "#fff", 
                  border: "1px solid var(--border)", 
                  borderRadius: "4px",
                  wordBreak: "break-all"
                }}>
                  {mfaData.secret}
                </div>
              </div>
            </div>
            <form onSubmit={handleConfirmMFA} className="stack" style={{ marginTop: "1rem" }}>
              <label>
                Código de 6 dígitos
                <input value={mfaCode} onChange={(e) => setMfaCode(e.target.value)} required placeholder="000000" />
              </label>
              <button type="submit" disabled={loading} style={{ height: "40px" }}>
                Confirmar MFA
              </button>
            </form>
          </div>
        )}
      </form>
    </div>
  );
}
