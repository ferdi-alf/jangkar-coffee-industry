import type { SupabaseClient } from "@supabase/supabase-js";

/** Satu-satunya lapisan modul ini yang menyentuh Supabase. */
export async function insertVisit(
  supabase: SupabaseClient,
  row: {
    country: string | null;
    path: string;
    locale: string | null;
    visitorHash: string;
  },
): Promise<void> {
  const { error } = await supabase.from("site_visit").insert({
    country: row.country,
    path: row.path,
    locale: row.locale,
    visitor_hash: row.visitorHash,
  });
  if (error) throw new Error(error.message);
}

/**
 * Memangkas baris yang lebih tua dari batas retensi.
 *
 * Memanggil fungsi Postgres, bukan menyusun DELETE di sini, karena
 * PostgREST tidak bisa menyatakan "lebih tua dari N hari" tanpa lebih dulu
 * menghitung tanggalnya di Node, dan tanggal Node adalah waktu instance
 * serverless yang belum tentu sama dengan waktu basis data.
 */
export async function prune(supabase: SupabaseClient, keepDays: number): Promise<number> {
  const { data, error } = await supabase.rpc("prune_site_visit", { keep_days: keepDays });
  if (error) throw new Error(error.message);
  return (data as number) ?? 0;
}
