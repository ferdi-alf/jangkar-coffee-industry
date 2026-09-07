import type { SupabaseClient } from "@supabase/supabase-js";

import type { StatsOverview } from "./stats.contract.js";
import * as repo from "./stats.repository.js";

/**
 * Ringkasan dashboard.
 *
 * `trackingConfigured` dibaca DI SINI, bukan di repository, karena ia bukan
 * fakta basis data melainkan keadaan konfigurasi server. Aturan lapisan proyek
 * ini menaruh aturan bisnis di service, dan "apakah fitur ini menyala" adalah
 * aturan bisnis, bukan kueri.
 */
export async function getOverview(supabase: SupabaseClient): Promise<StatsOverview> {
  const data = await repo.overview(supabase);
  return { ...data, trackingConfigured: Boolean(process.env.TRACK_SECRET) };
}
