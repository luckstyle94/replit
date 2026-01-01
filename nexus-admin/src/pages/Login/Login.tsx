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
    <div className="login-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#f4f4f9" }}>
      <form className="card stack" onSubmit={handleSubmit} style={{ width: "100%", maxWidth: "400px", padding: "2rem" }}>
        <h2 style={{ textAlign: "center", color: "#1a1a2e" }}>Nexus Admin</h2>
        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>
        <label>
          Senha
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </label>
        <button type="submit" disabled={loading} style={{ marginTop: "1rem" }}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
        {error && <p className="error" style={{ textAlign: "center" }}>{error}</p>}
        {otpStep && (
          <div className="card" style={{ marginTop: "1rem", padding: "1rem", background: "#f7f7fb" }}>
            <h4>Informe o código do autenticador</h4>
            <label>
              Código MFA
              <input value={otp} onChange={(e) => setOtp(e.target.value)} type="text" placeholder="123456" />
            </label>
            <small>Este código vem do Google Authenticator ou app similar.</small>
          </div>
        )}
        {mfaData && (
          <div className="card" style={{ marginTop: "1rem", padding: "1rem", background: "#f7f7fb" }}>
            <h4>Configure seu MFA</h4>
            <p>Escaneie o QR Code no Google Authenticator ou app similar, ou use a chave manual.</p>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <img
                alt="QR MFA"
                src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(mfaData.otpauth)}&size=150x150`}
              />
              <div>
                <div style={{ fontFamily: "monospace" }}>Chave: {mfaData.secret}</div>
              </div>
            </div>
            <form onSubmit={handleConfirmMFA} className="stack" style={{ marginTop: "0.5rem" }}>
              <label>
                Código de 6 dígitos
                <input value={mfaCode} onChange={(e) => setMfaCode(e.target.value)} required />
              </label>
              <button type="submit" disabled={loading}>
                Confirmar MFA
              </button>
            </form>
          </div>
        )}
      </form>
    </div>
  );
}
