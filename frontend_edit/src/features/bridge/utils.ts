import { BridgeSubscription } from "./types";

const ACTIVE_PLANS = new Set(["basic", "plus", "enterprise"]);

export function isBridgePlanActive(subscription: BridgeSubscription | null | undefined): boolean {
  if (!subscription) return false;
  if (!ACTIVE_PLANS.has(subscription.planCode.toLowerCase())) return false;
  return subscription.status.toLowerCase() === "active";
}
