import { useCallback, useEffect, useState } from "react";
import { request } from "../api/http";
import { FeatureEntitlement, FeaturePlan } from "../api/types";
import { useAuth } from "./auth";

export function useFeatureEntitlements(tenantId?: number | null) {
  const { token } = useAuth();
  const [entitlements, setEntitlements] = useState<FeatureEntitlement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !tenantId) {
      setEntitlements([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await request<FeatureEntitlement[]>(`/tenants/${tenantId}/features/entitlements`, { token });
      setEntitlements(data || []);
    } catch (err) {
      setError((err as Error).message || "Nao foi possivel carregar features.");
    } finally {
      setLoading(false);
    }
  }, [token, tenantId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { entitlements, loading, error, reload: load };
}

export function useFeaturePlans(tenantId?: number | null, featureId?: number | null) {
  const { token } = useAuth();
  const [plans, setPlans] = useState<FeaturePlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !tenantId || !featureId) {
      setPlans([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await request<FeaturePlan[]>(`/tenants/${tenantId}/features/${featureId}/plans`, { token });
      setPlans(data || []);
    } catch (err) {
      setError((err as Error).message || "Nao foi possivel carregar planos.");
    } finally {
      setLoading(false);
    }
  }, [token, tenantId, featureId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { plans, loading, error, reload: load };
}
