import type { CookieOptions } from "express";

/**
 * Nama dan opsi cookie sesi, satu sumber kebenaran.
 *
 * `COOKIE_DOMAIN` ada supaya produksi bisa menaruh API di subdomain saudara,
 * misalnya `api.kopijangkar.com` di samping `kopijangkar.com`. Keduanya masih
 * SATU SITE, jadi `SameSite=Lax` tetap berlaku dan middleware Next di sisi web
 * tetap bisa melihat cookienya untuk menjaga rute admin. Kalau API ditaruh di
 * domain yang sama sekali berbeda, Lax akan membuang cookienya dan panel tidak
 * akan pernah bisa masuk; itu keputusan deployment, bukan sesuatu yang bisa
 * ditambal di kode.
 *
 * Di lokal, `localhost:3000` dan `localhost:4000` juga sudah satu site, karena
 * SameSite tidak menghitung nomor port.
 */
export const ACCESS_COOKIE = "jangkar_at";
export const REFRESH_COOKIE = "jangkar_rt";

export function sessionCookie(maxAgeMs: number): CookieOptions {
  const domain = process.env.COOKIE_DOMAIN;
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeMs,
    ...(domain ? { domain } : {}),
  };
}
