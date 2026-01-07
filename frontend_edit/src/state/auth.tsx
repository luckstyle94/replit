import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ApiError, request, UNAUTHORIZED_EVENT } from "../api/http";
import {
  LoginSuccess,
  MfaMode,
  MfaSetupData,
  SocialAuthUrlResponse,
  User,
} from "../api/types";
import * as storage from "./storage";

type PendingLogin = { email: string; password: string };

type MfaStage =
  | {
      kind: "setup";
      token: string;
      setup: MfaSetupData;
      allowEmail: boolean;
    }
  | {
      kind: "challenge";
      token: string;
      allowEmail: boolean;
      authenticatorPreferred: boolean;
      provider?: string;
      ssoProvider?: "oidc" | "saml";
      ssoTenantId?: number;
    }
  | {
      kind: "reconfigure";
      token: string;
      setup: MfaSetupData;
      allowEmail: boolean;
    };

type LoginResult =
  | { status: "authenticated" }
  | { status: "mfa_setup" }
  | { status: "mfa_challenge" };

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loadingUser: boolean;
  mfaStage: MfaStage | null;
  mfaMode: MfaMode;
  login: (email: string, password: string, otp?: string, channel?: MfaMode) => Promise<LoginResult>;
  submitOtp: (code: string, channel?: MfaMode) => Promise<LoginResult>;
  confirmMfa: (code: string, channel?: MfaMode) => Promise<void>;
  verifyMfaEmail: (code: string) => Promise<void>;
  sendMfaEmail: () => Promise<void>;
  startAuthenticatorSetup: () => Promise<void>;
  startSocialLogin: (provider?: string) => Promise<string>;
  completeSocialLogin: (
    params: { provider?: string; code: string; state: string }
  ) => Promise<LoginResult>;
  completeSSOLogin: (params: {
    tenantId: number;
    provider: "oidc" | "saml";
    code: string;
    state: string;
  }) => Promise<LoginResult>;
  acceptSSOToken: (token: string) => Promise<void>;
  cancelMfaFlow: () => void;
  updateProfile: (payload: Partial<Pick<User, "name" | "email" | "cpf" | "phone">>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => storage.getToken());
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [pendingLogin, setPendingLogin] = useState<PendingLogin | null>(null);
  const [mfaStage, setMfaStage] = useState<MfaStage | null>(null);
  const [mfaMode, setMfaMode] = useState<MfaMode>(() => {
    const stored = storage.getMfaMode() as MfaMode | null;
    return stored || "unknown";
  });

  const persistToken = useCallback((value: string | null) => {
    storage.setToken(value);
    setTokenState(value);
  }, []);

  const persistMfaMode = useCallback((mode: MfaMode) => {
    setMfaMode(mode);
    if (mode) {
      storage.setMfaMode(mode);
    } else {
      storage.setMfaMode(null);
    }
  }, []);

  const persistSocialState = useCallback((state: string | null, provider = "google") => {
    storage.setSocialState(state, provider);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) {
      setUser(null);
      return;
    }
    setLoadingUser(true);
    try {
      const data = await request<User>("/me", { token });
      setUser(data);
      if (!data.mfaEnabled && mfaMode !== "email") {
        persistMfaMode("unknown");
      }
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.status === 401) {
        persistToken(null);
        setUser(null);
      }
    } finally {
      setLoadingUser(false);
    }
  }, [mfaMode, persistToken, persistMfaMode, token]);

  useEffect(() => {
    if (token) {
      refreshUser();
    } else {
      setUser(null);
    }
  }, [token, refreshUser]);

  // Centraliza logout quando a API responde 401 em rotas protegidas (token expirado/sessão inválida).
  useEffect(() => {
    const handler = () => {
      persistToken(null);
      setUser(null);
      setMfaStage(null);
      setPendingLogin(null);
      persistMfaMode("unknown");
      persistSocialState(null);
    };
    window.addEventListener(UNAUTHORIZED_EVENT, handler);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handler);
  }, [persistMfaMode, persistSocialState, persistToken]);

  const login = useCallback(
    async (
      email: string,
      password: string,
      otp?: string,
      channel: MfaMode = "authenticator"
    ): Promise<LoginResult> => {
      setPendingLogin({ email, password });
      try {
        const resp = await request<LoginSuccess>("/login", {
          method: "POST",
          body: { email, password, otp },
        });
        persistToken(resp.token);
        persistMfaMode(channel === "email" ? "email" : "authenticator");
        setMfaStage(null);
        setPendingLogin(null);
        persistSocialState(null);
        await refreshUser();
        return { status: "authenticated" };
      } catch (err) {
        const apiErr = err as ApiError;
        if (apiErr.code === "mfa_required" && apiErr.data) {
          const data = apiErr.data;
          const allowEmail = data.allowEmail !== false;
          setMfaStage({
            kind: "setup",
            token: String(data.mfaToken || ""),
            setup: {
              secret: String(data.secret || ""),
              otpauth: String(data.otpauth || ""),
              issuer: typeof data.issuer === "string" ? data.issuer : undefined,
              account: typeof data.account === "string" ? data.account : undefined,
            },
            allowEmail,
          });
          return { status: "mfa_setup" };
        }
        if (apiErr.code === "otp_required" && apiErr.data) {
          const data = apiErr.data;
          setMfaStage({
            kind: "challenge",
            token: String(data.mfaToken || ""),
            allowEmail: Boolean(data.allowEmail),
            authenticatorPreferred: data.authenticatorPreferred !== false,
          });
          return { status: "mfa_challenge" };
        }
        throw err;
      }
    },
    [persistToken, refreshUser, persistMfaMode, persistSocialState]
  );

  const submitOtp = useCallback(
    async (code: string, channel: MfaMode = "authenticator"): Promise<LoginResult> => {
      if (pendingLogin) {
        return login(pendingLogin.email, pendingLogin.password, code, channel);
      }
      if (mfaStage && mfaStage.kind === "challenge" && mfaStage.provider) {
        const resp = await request<LoginSuccess>(`/auth/social/${mfaStage.provider}/otp`, {
          method: "POST",
          headers: { Authorization: `Bearer ${mfaStage.token}` },
          body: { code },
        });
        if (!resp.token) {
          throw new Error("Token não retornado.");
        }
        persistToken(resp.token);
        persistMfaMode(channel === "email" ? "email" : "authenticator");
        setMfaStage(null);
        setPendingLogin(null);
        await refreshUser();
        return { status: "authenticated" };
      }
      if (mfaStage && mfaStage.kind === "challenge" && mfaStage.ssoProvider && mfaStage.ssoTenantId) {
        const resp = await request<LoginSuccess>(
          `/auth/sso/${mfaStage.ssoProvider}/${mfaStage.ssoTenantId}/otp`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${mfaStage.token}` },
            body: { code },
          }
        );
        if (!resp.token) {
          throw new Error("Token não retornado.");
        }
        persistToken(resp.token);
        persistMfaMode(channel === "email" ? "email" : "authenticator");
        setMfaStage(null);
        setPendingLogin(null);
        await refreshUser();
        return { status: "authenticated" };
      }
      throw new Error("Nenhum login pendente. Refaça o login.");
    },
    [login, pendingLogin, mfaStage, persistToken, persistMfaMode, refreshUser]
  );

  const confirmMfa = useCallback(
    async (code: string, channel: MfaMode = "authenticator") => {
      if (!mfaStage || mfaStage.kind === "challenge") {
        throw new Error("Fluxo de MFA não iniciado.");
      }
      const resp = await request<{ token?: string }>("/mfa/confirm", {
        method: "POST",
        mfaToken: mfaStage.token,
        body: { code },
      });
      if (resp.token) {
        persistToken(resp.token);
      }
      persistMfaMode(channel === "email" ? "email" : "authenticator");
      setMfaStage(null);
      setPendingLogin(null);
      await refreshUser();
    },
    [mfaStage, persistMfaMode, persistToken, refreshUser]
  );

  const verifyMfaEmail = useCallback(
    async (code: string) => {
      if (!mfaStage || mfaStage.kind === "challenge") {
        throw new Error("Fluxo de MFA não iniciado.");
      }
      const resp = await request<{ token?: string }>("/mfa/verify-email", {
        method: "POST",
        mfaToken: mfaStage.token,
        body: { code },
      });
      if (!resp.token) {
        throw new Error("Não foi possível concluir a verificação. Tente novamente.");
      }
      persistToken(resp.token);
      persistMfaMode("email");
      setMfaStage(null);
      setPendingLogin(null);
      await refreshUser();
    },
    [mfaStage, persistMfaMode, persistToken, refreshUser]
  );

  const sendMfaEmail = useCallback(async () => {
    if (!mfaStage) {
      throw new Error("Fluxo de MFA não iniciado.");
    }
    await request("/mfa/email-code", {
      method: "POST",
      mfaToken: mfaStage.token,
    });
  }, [mfaStage]);

  const startSocialLogin = useCallback(
    async (provider = "google") => {
      const data = await request<SocialAuthUrlResponse>(`/auth/social/${provider}/url`);
      if (!data.url || !data.state) {
        throw new Error("Não foi possível iniciar o login social. Tente novamente.");
      }
      persistSocialState(data.state, provider);
      return data.url;
    },
    [persistSocialState]
  );

  const completeSocialLogin = useCallback(
    async ({
      provider = "google",
      code,
      state,
    }: {
      provider?: string;
      code: string;
      state: string;
    }): Promise<LoginResult> => {
      const savedState = storage.getSocialState();
      if (savedState && savedState !== state) {
        throw new Error("State inválido ou expirado. Tente novamente.");
      }
      try {
        const resp = await request<LoginSuccess>(
          `/auth/social/${provider}/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`
        );
        if (!resp.token) {
          throw new Error("Token não retornado pelo login social.");
        }
        persistToken(resp.token);
        persistMfaMode("authenticator");
        persistSocialState(null);
        setMfaStage(null);
        setPendingLogin(null);
        await refreshUser();
        return { status: "authenticated" };
      } catch (err) {
        const apiErr = err as ApiError;
        // Reutiliza a mesma lógica de login por senha para MFA.
        if (apiErr.code === "mfa_required" && apiErr.data) {
          const data = apiErr.data;
          const allowEmail = data.allowEmail !== false;
          setMfaStage({
            kind: "setup",
            token: String(data.mfaToken || ""),
            setup: {
              secret: String(data.secret || ""),
              otpauth: String(data.otpauth || ""),
              issuer: typeof data.issuer === "string" ? data.issuer : undefined,
              account: typeof data.account === "string" ? data.account : undefined,
            },
            allowEmail,
          });
          return { status: "mfa_setup" };
        }
        if (apiErr.code === "otp_required" && apiErr.data) {
          const data = apiErr.data;
          setMfaStage({
            kind: "challenge",
            token: String(data.mfaToken || ""),
            allowEmail: Boolean(data.allowEmail),
            authenticatorPreferred: data.authenticatorPreferred !== false,
            provider,
          });
          return { status: "mfa_challenge" };
        }
        throw err;
      }
    },
    [persistMfaMode, persistSocialState, persistToken, refreshUser]
  );

  const completeSSOLogin = useCallback(
    async ({
      tenantId,
      provider,
      code,
      state,
    }: {
      tenantId: number;
      provider: "oidc" | "saml";
      code: string;
      state: string;
    }): Promise<LoginResult> => {
      try {
        const resp = await request<LoginSuccess>(
          `/auth/sso/${provider}/${tenantId}/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(
            state
          )}`
        );
        if (!resp.token) {
          throw new Error("Token não retornado pelo SSO.");
        }
        persistToken(resp.token);
        persistMfaMode("authenticator");
        setMfaStage(null);
        setPendingLogin(null);
        await refreshUser();
        return { status: "authenticated" };
      } catch (err) {
        const apiErr = err as ApiError;
        if (apiErr.code === "mfa_required" && apiErr.data) {
          const data = apiErr.data;
          const allowEmail = data.allowEmail !== false;
          setMfaStage({
            kind: "setup",
            token: String(data.mfaToken || ""),
            setup: {
              secret: String(data.secret || ""),
              otpauth: String(data.otpauth || ""),
              issuer: typeof data.issuer === "string" ? data.issuer : undefined,
              account: typeof data.account === "string" ? data.account : undefined,
            },
            allowEmail,
          });
          return { status: "mfa_setup" };
        }
        if (apiErr.code === "otp_required" && apiErr.data) {
          const data = apiErr.data;
          setMfaStage({
            kind: "challenge",
            token: String(data.mfaToken || ""),
            allowEmail: Boolean(data.allowEmail),
            authenticatorPreferred: data.authenticatorPreferred !== false,
            ssoProvider: provider,
            ssoTenantId: tenantId,
          });
          return { status: "mfa_challenge" };
        }
        throw err;
      }
    },
    [persistMfaMode, persistToken, refreshUser]
  );

  const acceptSSOToken = useCallback(
    async (jwtToken: string) => {
      if (!jwtToken) {
        throw new Error("Token inválido.");
      }
      persistToken(jwtToken);
      persistMfaMode("authenticator");
      setMfaStage(null);
      setPendingLogin(null);
      await refreshUser();
    },
    [persistMfaMode, persistToken, refreshUser]
  );

  const startAuthenticatorSetup = useCallback(async () => {
    if (!token) {
      throw new Error("Usuário não autenticado.");
    }
    await request("/mfa/disable", { method: "POST", token });
    const data = await request<MfaSetupData>("/mfa/setup/auth", { method: "POST", token });
    if (!data.mfaToken) {
      throw new Error("Não foi possível iniciar a configuração do autenticador. Tente novamente.");
    }
    setMfaStage({
      kind: "reconfigure",
      token: data.mfaToken,
      setup: data,
      allowEmail: data.allowEmail !== false,
    });
    setPendingLogin(null);
  }, [token]);

  const cancelMfaFlow = useCallback(() => {
    setMfaStage(null);
    setPendingLogin(null);
  }, []);

  const updateProfile = useCallback(
    async (payload: Partial<Pick<User, "name" | "email" | "cpf" | "phone">>) => {
      if (!token) throw new Error("Usuário não autenticado.");
      const body: Record<string, string> = {};
      if (payload.name?.trim()) body.name = payload.name.trim();
      if (payload.email?.trim()) body.email = payload.email.trim();
      if (payload.cpf?.trim()) body.cpf = payload.cpf.trim();
      if (payload.phone?.trim()) body.phone = payload.phone.trim();
      if (!Object.keys(body).length) {
        throw new Error("Preencha pelo menos um campo para atualizar o perfil.");
      }
      await request("/me", { method: "PUT", token, body });
      await refreshUser();
    },
    [token, refreshUser]
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      if (!token) throw new Error("Usuário não autenticado.");
      await request("/change-password", {
        method: "POST",
        token,
        body: { currentPassword, newPassword },
      });
    },
    [token]
  );

  const logout = useCallback(async () => {
    try {
      if (token) {
        await request("/logout", { method: "POST", token });
      }
    } catch {
      // ignora falha de logout para não travar o usuário
    }
    persistToken(null);
    setUser(null);
    setMfaStage(null);
    setPendingLogin(null);
    persistMfaMode("unknown");
    persistSocialState(null);
  }, [persistToken, persistMfaMode, persistSocialState, token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loadingUser,
      mfaStage,
      mfaMode,
      login,
      submitOtp,
      confirmMfa,
      verifyMfaEmail,
      sendMfaEmail,
      startAuthenticatorSetup,
      startSocialLogin,
      completeSocialLogin,
      completeSSOLogin,
      acceptSSOToken,
      cancelMfaFlow,
      updateProfile,
      changePassword,
      refreshUser,
      logout,
    }),
    [
      user,
      token,
      loadingUser,
      mfaStage,
      mfaMode,
      login,
      submitOtp,
      confirmMfa,
      verifyMfaEmail,
      sendMfaEmail,
      startAuthenticatorSetup,
      startSocialLogin,
      completeSocialLogin,
      completeSSOLogin,
      acceptSSOToken,
      cancelMfaFlow,
      updateProfile,
      changePassword,
      refreshUser,
      logout,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return ctx;
}
