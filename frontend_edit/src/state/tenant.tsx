import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { request } from "../api/http";
import { UserContextResponse } from "../api/types";
import { useAuth } from "./auth";

interface TenantContextValue {
  context: UserContextResponse | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  selectTenant: (tenantId: number | null) => Promise<void>;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [context, setContext] = useState<UserContextResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) {
      setContext(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await request<UserContextResponse>("/me/context", { token });
      setContext(data);
    } catch (err) {
      setError((err as Error).message || "Nao foi possivel carregar o tenant.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const selectTenant = useCallback(
    async (tenantId: number | null) => {
      if (!token) return;
      const targetTenantId = tenantId ?? 0;
      setLoading(true);
      setError(null);
      try {
        const data = await request<UserContextResponse>("/me/tenant", {
          method: "POST",
          token,
          body: { tenantId: targetTenantId },
        });
        setContext(data);
      } catch (err) {
        setError((err as Error).message || "Nao foi possivel trocar o tenant.");
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      context,
      loading,
      error,
      refresh,
      selectTenant,
    }),
    [context, loading, error, refresh, selectTenant]
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const value = useContext(TenantContext);
  if (!value) {
    throw new Error("useTenant deve ser usado dentro de TenantProvider");
  }
  return value;
}
