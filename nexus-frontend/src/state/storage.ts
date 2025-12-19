const TOKEN_KEY = "frontend_user_v2_token";
const MFA_MODE_KEY = "frontend_user_v2_mfa_mode";
const SOCIAL_STATE_KEY = "frontend_user_v2_social_state";
const SOCIAL_PROVIDER_KEY = "frontend_user_v2_social_provider";

// Storage de sessão: reduz exposição do token (não persiste após fechar o navegador).
// Mantemos compatibilidade com tokens antigos no localStorage migrando uma única vez.
const session = window.sessionStorage;
const local = window.localStorage;

export const storageKeys = {
  token: TOKEN_KEY,
  mfaMode: MFA_MODE_KEY,
  socialState: SOCIAL_STATE_KEY,
  socialProvider: SOCIAL_PROVIDER_KEY,
} as const;

export function getToken(): string | null {
  const sessionToken = session.getItem(TOKEN_KEY);
  if (sessionToken) return sessionToken;

  const legacy = local.getItem(TOKEN_KEY);
  if (legacy) {
    // Migra para sessão e remove do localStorage para reduzir risco de persistência.
    session.setItem(TOKEN_KEY, legacy);
    local.removeItem(TOKEN_KEY);
    return legacy;
  }
  return null;
}

export function setToken(value: string | null) {
  if (value) {
    session.setItem(TOKEN_KEY, value);
  } else {
    session.removeItem(TOKEN_KEY);
  }
  // Segurança: garantimos que não sobrou token persistido.
  local.removeItem(TOKEN_KEY);
}

export function getMfaMode(): string | null {
  return session.getItem(MFA_MODE_KEY) || local.getItem(MFA_MODE_KEY);
}

export function setMfaMode(value: string | null) {
  if (value) {
    session.setItem(MFA_MODE_KEY, value);
  } else {
    session.removeItem(MFA_MODE_KEY);
  }
}

export function getSocialState(): string | null {
  return session.getItem(SOCIAL_STATE_KEY);
}

export function getSocialProvider(): string | null {
  return session.getItem(SOCIAL_PROVIDER_KEY);
}

export function setSocialState(state: string | null, provider: string) {
  if (state) {
    session.setItem(SOCIAL_STATE_KEY, state);
    session.setItem(SOCIAL_PROVIDER_KEY, provider);
  } else {
    session.removeItem(SOCIAL_STATE_KEY);
    session.removeItem(SOCIAL_PROVIDER_KEY);
  }
}

