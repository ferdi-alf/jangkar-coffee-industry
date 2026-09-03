/**
 * Membuat akun admin PERTAMA. Dijalankan sekali, dengan tangan.
 *
 *   npm run bootstrap:admin -w apps/api
 *
 * KENAPA SKRIP, BUKAN ENDPOINT. Endpoint pendaftaran publik pada panel admin
 * adalah pintu terbuka: siapa pun yang menemukan URL-nya bisa membuat akun
 * owner. Endpoint yang "hanya aktif kalau tabelnya masih kosong" pun berbahaya,
 * karena kondisi itu benar persis pada menit-menit paling rawan, tepat setelah
 * deploy pertama.
 *
 * KATA SANDI DIBACA DARI ENVIRONMENT, tidak pernah dari argumen baris perintah
 * dan tidak pernah ditulis di kode. Argumen baris perintah tersimpan di riwayat
 * shell dan terlihat di daftar proses seluruh pengguna mesin itu. Skrip ini juga
 * tidak pernah mencetak kata sandinya kembali.
 */
import "dotenv/config";

import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
const email = process.env.ADMIN_BOOTSTRAP_EMAIL;
const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
const name = process.env.ADMIN_BOOTSTRAP_NAME ?? "Owner";

function fail(message: string): never {
  console.error(`[bootstrap] ${message}`);
  process.exit(1);
}

if (!url || !key) fail("SUPABASE_URL dan SUPABASE_SECRET_KEY belum diisi di apps/api/.env");
if (!email) fail("ADMIN_BOOTSTRAP_EMAIL belum diisi.");
if (!password) fail("ADMIN_BOOTSTRAP_PASSWORD belum diisi.");
if (password.length < 12) {
  fail("ADMIN_BOOTSTRAP_PASSWORD terlalu pendek. Minimal 12 karakter untuk akun owner.");
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * Dibungkus fungsi async, BUKAN top-level await.
 *
 * apps/api dikompilasi sebagai CommonJS, dan tsx menolak top-level await di
 * sana dengan "Top-level await is currently not supported with the cjs output
 * format". Membungkusnya begini bekerja di kedua format tanpa perlu mengubah
 * konfigurasi modul seluruh workspace hanya demi satu skrip sekali pakai.
 */
async function main(): Promise<void> {
  /* email_confirm true karena akun ini dibuat pemilik server sendiri, bukan
     oleh pengunjung yang perlu dibuktikan memiliki alamat itu. */
  const { data, error } = await supabase.auth.admin.createUser({
    email: email!,
    password: password!,
    email_confirm: true,
  });

  let userId = data?.user?.id;

  if (error) {
    /* Sudah pernah dibuat. Skripnya tetap melanjutkan supaya perannya bisa
       diperbaiki tanpa harus menghapus akunnya lebih dulu. */
    const { data: existing } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
    userId = existing?.users.find((u) => u.email?.toLowerCase() === email!.toLowerCase())?.id;
    if (!userId) fail(`Gagal membuat pengguna: ${error.message}`);
    console.log("[bootstrap] Pengguna auth sudah ada, perannya diperbarui saja.");
  }

  const { error: roleError } = await supabase
    .from("admin_user")
    .upsert(
      { user_id: userId, email, name, role: "owner", is_active: true },
      { onConflict: "user_id" },
    );

  if (roleError) fail(`Gagal menulis admin_user: ${roleError.message}`);

  console.log(`[bootstrap] Akun owner siap untuk ${email}. Silakan masuk lewat /login.`);
  console.log("[bootstrap] Hapus ADMIN_BOOTSTRAP_PASSWORD dari .env setelah ini.");
}

void main();
