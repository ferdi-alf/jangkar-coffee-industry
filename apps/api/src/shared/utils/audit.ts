import type { SupabaseClient } from "@supabase/supabase-js";

import type { AuthUser } from "../middleware/auth.js";

/**
 * Jejak audit: siapa mengubah apa.
 *
 * SENGAJA TIDAK PERNAH MELEMPAR. Gagal mencatat jejak tidak boleh membatalkan
 * perubahan yang sudah berhasil, karena itu akan membuat basis data dan jawaban
 * ke pengguna saling bertentangan. Kegagalannya dicatat ke konsol saat
 * pengembangan dan diabaikan di produksi.
 */
export async function writeAudit(
  supabase: SupabaseClient,
  actor: AuthUser | undefined,
  action: "create" | "update" | "delete" | "login",
  entity: string,
  entityId: string | null,
  summary: string,
): Promise<void> {
  try {
    await supabase.from("audit_log").insert({
      actor_id: actor?.id ?? null,
      actor_email: actor?.email ?? null,
      action,
      entity,
      entity_id: entityId,
      summary,
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("[audit]", error);
  }
}
