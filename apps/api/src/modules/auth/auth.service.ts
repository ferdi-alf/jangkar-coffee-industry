import type { SupabaseClient } from "@supabase/supabase-js";

import { writeAudit } from "../../shared/utils/audit.js";

import type { LoginResult, SessionUser } from "./auth.contract.js";
import * as repo from "./auth.repository.js";

/**
 * Aturan bisnis autentikasi. Tidak pernah melihat Request maupun Response, jadi
 * ia bisa diuji tanpa menyalakan server.
 *
 * KEGAGALAN LOGIN SELALU DIBALAS SATU BENTUK YANG SAMA, apa pun sebabnya:
 * email tidak ada, kata sandi salah, akun bukan admin, atau akun dinonaktifkan.
 * Membedakan pesannya berarti memberi tahu penyerang alamat mana yang terdaftar,
 * dan daftar itu justru separuh pekerjaan mereka.
 */
export class AuthError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

const INVALID = () =>
  new AuthError(401, "INVALID_CREDENTIALS", "Email atau kata sandi salah.");

export async function login(
  supabase: SupabaseClient,
  email: string,
  password: string,
): Promise<LoginResult> {
  const tokens = await repo.signIn(supabase, email, password);
  if (!tokens) throw INVALID();

  const user = await repo.findAdmin(supabase, tokens.userId);
  /* Punya akun Supabase Auth tidak sama dengan punya akses panel. Tanpa baris
     di admin_user, atau saat is_active false, tokennya langsung dicabut lagi
     supaya tidak ada sesi menganggur yang masih sah di sisi Supabase. */
  if (!user) {
    await repo.revoke(supabase, tokens.accessToken);
    throw INVALID();
  }

  await repo.touchLogin(supabase, user.id);
  await writeAudit(supabase, user, "login", "admin_user", user.id, `${user.email} masuk ke panel.`);

  return {
    user,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn,
  };
}

export async function refresh(
  supabase: SupabaseClient,
  refreshToken: string,
): Promise<LoginResult> {
  const tokens = await repo.refresh(supabase, refreshToken);
  if (!tokens) throw new AuthError(401, "UNAUTHENTICATED", "Sesi tidak berlaku. Silakan masuk lagi.");

  const user = await repo.findAdmin(supabase, tokens.userId);
  if (!user) {
    await repo.revoke(supabase, tokens.accessToken);
    throw new AuthError(403, "FORBIDDEN", "Akun ini tidak punya akses ke panel.");
  }

  return {
    user,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn,
  };
}

export async function logout(supabase: SupabaseClient, accessToken: string | null): Promise<void> {
  if (accessToken) await repo.revoke(supabase, accessToken);
}

export function currentUser(user: SessionUser): SessionUser {
  return user;
}
