// Gate 5: Pro upgrade/cancel. The intended real path is Google Play
// Billing / Apple StoreKit (native purchase -> receipt -> a service-role
// webhook that validates it and flips `entitlements`), which needs store
// console access and native build config this environment can't provision.
// purchasePro/cancelPro are the seam for that: same call shape a real flow
// would need (an async action that resolves to the caller's updated
// Entitlement), backed today by upgrade_to_pro/downgrade_to_free -- two
// dev-mock RPCs that flip the caller's own row directly, mirroring how
// Gate 3.5 verified this same transition by editing the DB by hand. Swap
// the body of these two functions for a real IAP call + webhook later;
// nothing that calls purchasePro/cancelPro (paywall UI, this return type)
// needs to change.
import { supabase } from "./supabase";
import { ensureAnonymousSession } from "./session";
import { getEntitlement, type Entitlement } from "./entitlement";

export async function purchasePro(): Promise<Entitlement> {
  await ensureAnonymousSession();

  const { error } = await supabase.rpc("upgrade_to_pro");
  if (error) {
    throw new Error(`Upgrade failed: ${error.message}`);
  }
  return getEntitlement();
}

/** Stands in for "manage subscription" -- a real IAP integration would
 * deep-link to the platform's native subscription-management screen
 * instead of calling this directly. */
export async function cancelPro(): Promise<Entitlement> {
  await ensureAnonymousSession();

  const { error } = await supabase.rpc("downgrade_to_free");
  if (error) {
    throw new Error(`Cancel failed: ${error.message}`);
  }
  return getEntitlement();
}
