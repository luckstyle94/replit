/**
 * Mock API para desenvolvimento e testes de UI/UX
 * Remove este arquivo em produção
 */

import { LoginErrorData, LoginSuccess, MfaSetupData, User } from "./types";

// Credenciais de teste
const TEST_USERS = {
  "test@example.com": {
    password: "Test123!",
    user: {
      id: 1,
      name: "João Silva",
      email: "test@example.com",
      roleId: 1,
      status: "active",
      mfaEnabled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as User,
    mfaRequired: false,
  },
  "mfa@example.com": {
    password: "Test123!",
    user: {
      id: 2,
      name: "Maria Santos",
      email: "mfa@example.com",
      roleId: 2,
      status: "active",
      mfaEnabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as User,
    mfaRequired: true,
    mfaToken: "mock_mfa_token_12345",
  },
};

const VALID_MFA_CODE = "123456";
const MOCK_SECRET = "JBSWY3DPEBLW64TMMQ======";
const MOCK_OTPAUTH =
  "otpauth://totp/Nexus:test@example.com?secret=JBSWY3DPEBLW64TMMQ======&issuer=Nexus";

export function mockLogin(
  email: string,
  password: string
): LoginSuccess | LoginErrorData {
  console.log("[MOCK LOGIN]", { email, password });
  const testUser = TEST_USERS[email as keyof typeof TEST_USERS];

  if (!testUser) {
    console.log("[MOCK LOGIN] Usuário não encontrado:", email);
    return {
      error: "Usuário ou senha inválidos",
      code: undefined,
    };
  }

  if (testUser.password !== password) {
    console.log("[MOCK LOGIN] Senha incorreta para:", email);
    return {
      error: "Usuário ou senha inválidos",
      code: undefined,
    };
  }

  console.log("[MOCK LOGIN] Autenticação bem-sucedida para:", email);

  if (testUser.mfaRequired) {
    return {
      error: "MFA required",
      code: "mfa_required",
      mfaToken: (testUser as any).mfaToken || "mock_mfa_token",
      authenticatorPreferred: true,
      allowEmail: true,
    };
  }

  return {
    token: `mock_token_${email}_${Date.now()}`,
  };
}

export function mockGetUser(token: string): User | null {
  if (!token.startsWith("mock_token_")) {
    return null;
  }

  // Extrai email do token
  const parts = token.split("_");
  const email = parts.slice(2, -1).join("_");

  const testUser = TEST_USERS[email as keyof typeof TEST_USERS];
  return testUser?.user || null;
}

export function mockMfaSetup(mfaToken: string): MfaSetupData | null {
  if (!mfaToken.startsWith("mock_mfa")) {
    return null;
  }

  return {
    secret: MOCK_SECRET,
    otpauth: MOCK_OTPAUTH,
    issuer: "Nexus",
    account: "test@example.com",
    mfaToken,
    allowEmail: true,
  };
}

export function mockVerifyMfaCode(code: string): boolean {
  // Para teste, aceita o código fixo ou qualquer código de 6 dígitos
  if (code === VALID_MFA_CODE) return true;

  // Simula validação de TOTP aceitando qualquer código de 6 dígitos
  if (/^\d{6}$/.test(code)) {
    return true; // 100% de sucesso no desenvolvimento
  }

  return false;
}

export function mockCompleteMfaChallenge(code: string, email?: string): LoginSuccess | LoginErrorData {
  if (!mockVerifyMfaCode(code)) {
    return {
      error: "Código inválido ou expirado",
      code: "otp_required",
    };
  }

  const tokenEmail = email || "mfa@example.com";
  return {
    token: `mock_token_${tokenEmail}_${Date.now()}`,
  };
}
