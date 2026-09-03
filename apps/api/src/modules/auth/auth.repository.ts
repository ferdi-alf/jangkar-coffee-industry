import type { SupabaseClient } from "@supabase/supabase-js";

import { createAuthClient } from "../../shared/db/supabase.js";

import type { Role, SessionUser } from "./auth.contract.js";

/**
 * SATU-SATUNYA lapisan di modul ini yang menyentuh Supabase.
 *
 * Aturan lapisan dari PROJECT-SPEC: controller tidak pernah menyentuh Supabase,
 * hanya repository, dan service tidak pernah melihat objek request Express.
 * Yang membuat aturan bisnis bisa diuji tanpa menyalakan server adalah ini.
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  userId: string;
}

/**
 * MASUK MEMAKAI KLIEN SEKALI PAKAI, bukan klien data yang dibagi.
 *
 * `signInWithPassword` mengubah konteks auth klien tempat ia dipanggil, jadi
 * memakai klien bersama di sini akan membuat seluruh API kehilangan akses data
 * begitu ada satu orang mencoba masuk. Penjelasan lengkap dan angkanya ada di
 * createAuthClient pada shared/db/supabase.ts.
 *
 * Parameter `supabase` sengaja dipertahankan supaya bentuk pemanggilannya sama
 * dengan fungsi repository lain, tapi ia TIDAK dipakai untuk operasi auth.
 */
export async function signIn(
  _supabase: SupabaseClient,
  email: string,
  password: string,
): Promise<AuthTokens | null> {
  const auth = createAuthClient();
  if (!auth) return null;
  const { data, error } = await auth.auth.signInWithPassword({ email, password });
  if (error || !data.session || !data.user) return null;
  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresIn: data.session.expires_in ?? 3600,
    userId: data.user.id,
  };
}

/** Sama alasannya dengan signIn: refreshSession juga memasang sesi pada kliennya. */
export async function refresh(
  _supabase: SupabaseClient,
  refreshToken: string,
): Promise<AuthTokens | null> {
  const auth = createAuthClient();
  if (!auth) return null;
  const { data, error } = await auth.auth.refreshSession({ refresh_token: refreshToken });
  if (error || !data.session || !data.user) return null;
  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresIn: data.session.expires_in ?? 3600,
    userId: data.user.id,
  };
}

export async function findAdmin(
  supabase: SupabaseClient,
  userId: string,
): Promise<SessionUser | null> {
  const { data } = await supabase
    .from("admin_user")
    .select("user_id, email, name, role, is_active")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data || data.is_active !== true) return null;
  return {
    id: data.user_id as string,
    email: data.email as string,
    name: data.name as string,
    role: data.role as Role,
  };
}

export async function touchLogin(supabase: SupabaseClient, userId: string): Promise<void> {
  await supabase
    .from("admin_user")
    .update({ last_login_at: new Date().toISOString() })
    .eq("user_id", userId);
}

/** Mencabut token di sisi Supabase, bukan sekadar menghapus cookie di klien. */
export async function revoke(supabase: SupabaseClient, accessToken: string): Promise<void> {
  try {
    await supabase.auth.admin.signOut(accessToken);
  } catch {
    /* Token yang sudah kedaluwarsa akan gagal di sini, dan itu tidak apa-apa:
       hasil akhirnya sama, sesi tidak berlaku lagi. Cookie tetap dihapus oleh
       controller apa pun yang terjadi. */
  }
}
