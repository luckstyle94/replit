export type FeatureKey = "NEXUS_BRIDGE";

export interface FeatureModule {
  key: FeatureKey;
  name: string;
  description: string;
  route: string;
  statusLabel: string;
}

export const FEATURE_MODULES: FeatureModule[] = [
  {
    key: "NEXUS_BRIDGE",
    name: "Nexus Bridge",
    description: "Integre webhooks e parceiros com controle e auditoria centralizada.",
    route: "/app/bridge",
    statusLabel: "Integrações",
  },
];
