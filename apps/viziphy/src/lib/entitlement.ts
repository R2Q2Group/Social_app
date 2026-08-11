import { supabase } from "./supabase";
import { ensureAnonymousSession } from "./session";

export interface Entitlement {
  tier: "free" | "pro";
  status: "active" | "canceled" | "past_due";
}

export async function getEntitlement(): Promise<Entitlement> {
  await ensureAnonymousSession();

  const { data, error } = await supabase.functions.invoke<Entitlement>(
    "entitlement",
    { method: "GET" },
  );

  if (error) {
    throw new Error(`Failed to fetch entitlement: ${error.message}`);
  }
  if (!data) {
    throw new Error("entitlement endpoint returned no data");
  }
  return data;
}
