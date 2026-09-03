import type { Request, Response } from "express";

import { sendData, sendError } from "../../shared/contracts/envelope.js";
import { ACCESS_COOKIE, REFRESH_COOKIE, sessionCookie } from "../../shared/constants/cookies.js";
import { getSupabase } from "../../shared/db/supabase.js";

import type { LoginInput } from "./auth.schema.js";
import type { LoginResult } from "./auth.contract.js";
import { AuthError, login, logout, refresh } from "./auth.service.js";

/**
 * Controller: satu-satunya lapisan yang tahu tentang Request dan Response, dan
 * satu-satunya yang menyentuh cookie. Ia tidak pernah memanggil Supabase
 * langsung, hanya service.
 */
const REFRESH_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

function setSession(res: Response, result: LoginResult): void {
  res.cookie(ACCESS_COOKIE, result.accessToken, sessionCookie(result.expiresIn * 1000));
  res.cookie(REFRESH_COOKIE, result.refreshToken, sessionCookie(REFRESH_MAX_AGE));
}

function clearSession(res: Response): void {
  /* Opsi cookie saat menghapus harus SAMA dengan saat memasang, termasuk path
     dan domain. Kalau berbeda, peramban menganggapnya cookie lain dan yang asli
     tetap tinggal di sana. */
  res.clearCookie(ACCESS_COOKIE, sessionCookie(0));
  res.clearCookie(REFRESH_COOKIE, sessionCookie(0));
}

function db(res: Response) {
  const supabase = getSupabase();
  if (!supabase) {
    sendError(res, 503, "NOT_CONFIGURED", "Layanan basis data belum dikonfigurasi.");
    return null;
  }
  return supabase;
}

export async function postLogin(req: Request, res: Response): Promise<void> {
  const supabase = db(res);
  if (!supabase) return;

  const { email, password } = req.body as LoginInput;
  try {
    const result = await login(supabase, email, password);
    setSession(res, result);
    sendData(res, 200, { user: result.user });
  } catch (error) {
    if (error instanceof AuthError) {
      sendError(res, error.status, error.code, error.message);
      return;
    }
    throw error;
  }
}

export async function postRefresh(req: Request, res: Response): Promise<void> {
  const supabase = db(res);
  if (!supabase) return;

  const cookies = req.cookies as Record<string, unknown> | undefined;
  const token = cookies?.[REFRESH_COOKIE];
  if (typeof token !== "string" || token.length === 0) {
    sendError(res, 401, "UNAUTHENTICATED", "Sesi tidak ditemukan. Silakan masuk lagi.");
    return;
  }

  try {
    const result = await refresh(supabase, token);
    setSession(res, result);
    sendData(res, 200, { user: result.user });
  } catch (error) {
    if (error instanceof AuthError) {
      /* Refresh yang gagal berarti sesinya memang sudah mati. Cookienya dibuang
         di sini supaya klien tidak terus mencoba dengan token yang sama. */
      clearSession(res);
      sendError(res, error.status, error.code, error.message);
      return;
    }
    throw error;
  }
}

export async function postLogout(req: Request, res: Response): Promise<void> {
  const supabase = getSupabase();
  const cookies = req.cookies as Record<string, unknown> | undefined;
  const token = cookies?.[ACCESS_COOKIE];

  if (supabase) await logout(supabase, typeof token === "string" ? token : null);
  clearSession(res);
  sendData(res, 200, { ok: true });
}

export function getMe(req: Request, res: Response): void {
  /* requireAuth sudah menjamin req.user ada saat sampai ke sini. */
  sendData(res, 200, { user: req.user });
}
