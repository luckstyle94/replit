import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../state/auth";
import { getSubscription } from "./api";
import { BridgeSubscription } from "./types";

export function useBridgeSubscription(tenantId?: number | null) {
  const { token } = useAuth();
  const [subscription, setSubscription] = useState<BridgeSubscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !tenantId) {
      setSubscription(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getSubscription(token, tenantId);
      setSubscription(data || null);
    } catch (err) {
      setError((err as Error).message || "Nao foi possivel carregar o plano.");
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [token, tenantId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { subscription, loading, error, reload: load };
}
