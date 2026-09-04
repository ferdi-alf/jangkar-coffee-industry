import type { SupabaseClient } from "@supabase/supabase-js";

import { createAuthClient } from "../../shared/db/supabase.js";
import type { Role } from "../../shared/middleware/auth.js";

import type { AdminUser } from "./user.contract.js";

/** Satu-satunya lapisan modul ini yang menyentuh Supabase. */
type Row = Record<string, unknown>;

const COLUMNS = "user_id, email, name, role, is_active, last_login_at, created_at";

function toUser(row: Row): AdminUser {
  return {
    id: row.user_id as string,
    email: row.email as string,
    name: row.name as string,
    role: row.role as Role,
    isActive: Boolean(row.is_active),
    lastLoginAt: (row.last_login_at as string) ?? null,
    createdAt: row.created_at as string,
  };
}

export async function list(supabase: SupabaseClient): Promise<AdminUser[]> {
  const { data, error } = await supabase
    .from("admin_user")
    .select(COLUMNS)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as Row[]).map(toUser);
}

export async function findById(
  supabase: SupabaseClient,
  id: string,
): Promise<AdminUser | null> {
  const { data, error } = await supabase
    .from("admin_user")
    .select(COLUMNS)
    .eq("user_id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toUser(data as unknown as Row) : null;
}

export async function findByEmail(
  supabase: SupabaseClient,
  email: string,
): Promise<AdminUser | null> {
  const { data, error } = await supabase
    .from("admin_user")
    .select(COLUMNS)
    .ilike("email", email)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toUser(data as unknown as Row) : null;
}

/** Berapa owner yang MASIH AKTIF. Dipakai pagar "owner terakhir". */
export async function activeOwnerCount(supabase: SupabaseClient): Promise<number> {
  const { count, error } = await supabase
    .from("admin_user")
    .select("user_id", { count: "exact", head: true })
    .eq("role", "owner")
    .eq("is_active", true);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

/**
 * Membuat akun auth beserta barisnya di admin_user.
 *
 * `email_confirm: true` karena akun ini dibuat owner dari dalam panel, bukan
 * oleh pengunjung yang perlu dibuktikan memiliki alamat itu. Konsekuensinya
 * akun langsung bisa dipakai, dan itu memang yang diminta pemilik proyek:
 * tanpa undangan surel, tanpa SMTP.
 *
 * KALAU PENULISAN admin_user GAGAL, akun auth-nya DIHAPUS LAGI. Tanpa itu,
 * percobaan yang gagal meninggalkan akun Supabase Auth yatim yang tidak terlihat
 * di panel mana pun, dan alamat itu tidak akan pernah bisa dipakai lagi karena
 * percobaan berikutnya ditolak sebagai duplikat.
 */
export async function createUser(
  supabase: SupabaseClient,
  input: { email: string; name: string; role: Role; password: string },
): Promise<string> {
  const created = await supabase.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
  });
  if (created.error || !created.data.user) {
    throw new Error(created.error?.message ?? "Gagal membuat akun.");
  }

  const userId = created.data.user.id;
  const { error } = await supabase.from("admin_user").insert({
    user_id: userId,
    email: input.email,
    name: input.name,
    role: input.role,
    is_active: true,
  });

  if (error) {
    await supabase.auth.admin.deleteUser(userId).catch(() => undefined);
    throw new Error(error.message);
  }
  return userId;
}

export async function updateProfileRow(
  supabase: SupabaseClient,
  id: string,
  patch: { name?: string; role?: Role; isActive?: boolean },
): Promise<void> {
  const row: Row = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.role !== undefined) row.role = patch.role;
  if (patch.isActive !== undefined) row.is_active = patch.isActive;
  if (Object.keys(row).length === 0) return;

  const { error } = await supabase.from("admin_user").update(row).eq("user_id", id);
  if (error) throw new Error(error.message);
}

export async function setPassword(
  supabase: SupabaseClient,
  id: string,
  password: string,
): Promise<void> {
  const { error } = await supabase.auth.admin.updateUserById(id, { password });
  if (error) throw new Error(error.message);
}

/**
 * Memverifikasi kata sandi lama dengan mencoba masuk memakai KLIEN SEKALI PAKAI.
 *
 * Alasannya sama dengan auth.repository.signIn dan ini bukan kerapian:
 * `signInWithPassword` memasang sesi pada klien tempat ia dipanggil, jadi
 * memakai klien data bersama di sini akan membuat seluruh API kehilangan akses
 * tabel begitu satu orang mengganti kata sandinya. Kejadiannya sudah pernah
 * terukur di proyek ini, 34 produk berubah jadi 0. Lihat shared/db/supabase.ts.
 */
export async function verifyPassword(email: string, password: string): Promise<boolean> {
  const auth = createAuthClient();
  if (!auth) return false;
  const { data, error } = await auth.auth.signInWithPassword({ email, password });
  return !error && Boolean(data.session);
}

/**
 * Menghapus akun auth. Baris admin_user ikut lenyap lewat
 * ON DELETE CASCADE pada admin_user.user_id -> auth.users.id.
 */
export async function removeUser(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.auth.admin.deleteUser(id);
  if (error) throw new Error(error.message);
}
