import type { Database, Json } from "@/shared/lib/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type AuditSupabase = SupabaseClient<Database>;

export type AuditEventInput = {
  actorId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, Json | undefined>;
};

/** Strip private fields from audit payloads. */
export function sanitizeAuditMetadata(
  input: Record<string, unknown>,
): Record<string, Json | undefined> {
  const blocked = new Set([
    "vin",
    "private_notes",
    "internal_price",
    "provider_reference",
    "stock_code",
  ]);

  const out: Record<string, Json | undefined> = {};
  for (const [key, value] of Object.entries(input)) {
    if (blocked.has(key)) continue;
    if (value === undefined) continue;
    out[key] = value as Json;
  }
  return out;
}

export async function writeAuditEvent(
  client: AuditSupabase,
  input: AuditEventInput,
): Promise<void> {
  const metadata = sanitizeAuditMetadata(input.metadata ?? {});
  const { error } = await client.from("audit_events").insert({
    actor_id: input.actorId,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    metadata,
  });

  if (error) {
    throw new Error(`No se pudo registrar auditoría: ${error.message}`);
  }
}
