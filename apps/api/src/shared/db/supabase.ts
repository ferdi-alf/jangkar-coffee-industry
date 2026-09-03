import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Klien Supabase sisi SERVER.
 *
 * Ia memakai `SUPABASE_SECRET_KEY`, kunci rahasia yang melewati RLS. Aturan
 * dari secrets/ACCESS.md dan CLAUDE.md: kunci ini tidak boleh menyentuh
 * browser, tidak boleh berprefiks `NEXT_PUBLIC_`, dan tidak boleh dicetak ke
 * log atau chat. Karena itu berkas ini hidup di apps/api, bukan di apps/web,
 * dan tidak ada satu pun baris di sini yang mencetak nilainya.
 *
 * Mengembalikan `null` kalau env-nya belum dipasang, BUKAN melempar galat saat
 * modul dimuat. Alasannya, API harus tetap bisa dijalankan dan `GET /health`
 * harus tetap menjawab di mesin yang belum punya kredensial. Route yang
 * membutuhkannya yang menolak dengan galat jelas.
 */
function credentials(): { url: string; key: string } | null {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  return url && key ? { url, key } : null;
}

let client: SupabaseClient | null = null;
let resolved = false;

/**
 * Klien DATA, dipakai bersama seluruh permintaan. Untuk membaca dan menulis
 * tabel, tidak pernah untuk alur masuk.
 */
export function getSupabase(): SupabaseClient | null {
  if (resolved) return client;
  resolved = true;

  const creds = credentials();
  if (!creds) return null;

  client = createClient(creds.url, creds.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

/**
 * Klien AUTH, BARU SETIAP PANGGILAN dan sengaja tidak pernah disimpan.
 *
 * ADA KARENA CACAT SUNGGUHAN, bukan kerapian. `signInWithPassword` MENGUBAH
 * konteks auth pada klien tempat ia dipanggil: setelah berhasil, klien itu
 * berhenti memakai kunci rahasia dan mulai memakai token pengguna yang baru
 * masuk. Karena RLS menyala tanpa policy, klien itu seketika kehilangan akses
 * ke SEMUA tabel.
 *
 * Terukur pada klien yang sama, satu proses:
 *   sebelum signInWithPassword   product count = 34, page_section = 9
 *   sesudah signInWithPassword   product count = 0,  page_section = 0
 *
 * Akibatnya di server yang berumur panjang: satu percobaan masuk membuat
 * SELURUH API berhenti mengembalikan data sampai proses direstart, dan
 * gejalanya diam-diam, tidak ada galat, hanya daftar kosong di mana-mana.
 * Situs publik akan tampak kehilangan seluruh isinya.
 *
 * `getUser(token)` dan `auth.admin.signOut(token)` sudah diuji dan TIDAK
 * mengubah konteks klien, keduanya menerima token secara eksplisit. Jadi hanya
 * jalur masuk dan perpanjangan sesi yang butuh klien sekali pakai ini.
 */
export function createAuthClient(): SupabaseClient | null {
  const creds = credentials();
  if (!creds) return null;

  return createClient(creds.url, creds.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
