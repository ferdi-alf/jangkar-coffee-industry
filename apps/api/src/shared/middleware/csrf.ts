import { randomBytes, timingSafeEqual } from "node:crypto";

import type { NextFunction, Request, Response } from "express";

import { sendData, sendError } from "../contracts/envelope.js";

/**
 * CSRF double submit cookie, sesuai tabel Keamanan di docs/PROJECT-SPEC.md.
 *
 * Alurnya: klien meminta `GET /csrf`, server menaruh token di cookie httpOnly
 * DAN mengembalikan token yang sama di badan respons. Klien mengirim token dari
 * badan itu lewat header `X-CSRF-Token` saat POST, lalu server membandingkannya
 * dengan cookie. Penyerang di situs lain bisa membuat peramban mengirim
 * cookie-nya, tapi tidak bisa MEMBACA badan respons kita, jadi ia tidak pernah
 * tahu nilai yang harus ditaruh di header.
 *
 * Cookienya `SameSite=Lax`, dan itu memang cukup di sini. Web di port 3000 dan
 * API di port 4000 adalah lintas ORIGIN tapi masih satu SITE, karena SameSite
 * tidak menghitung port. Di produksi pun `kopijangkar.com` dan
 * `api.kopijangkar.com` masih satu site. `Secure` menyala di produksi saja,
 * karena pengembangan lokal berjalan di http dan browser akan membuang cookie
 * `Secure` di sana.
 *
 * Perbandingannya `timingSafeEqual`, bukan `===`, supaya panjang kecocokan
 * tidak bisa disimpulkan dari waktu respons.
 */
const COOKIE = "jangkar_csrf";
const HEADER = "x-csrf-token";

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 2 * 60 * 60 * 1000,
  };
}

export function issueCsrf(_req: Request, res: Response): void {
  const token = randomBytes(32).toString("base64url");
  res.cookie(COOKIE, token, cookieOptions());
  sendData(res, 200, { token });
}

export function requireCsrf(req: Request, res: Response, next: NextFunction): void {
  const cookie = (req.cookies as Record<string, unknown> | undefined)?.[COOKIE];
  const header = req.get(HEADER);

  if (typeof cookie !== "string" || typeof header !== "string" || cookie.length === 0) {
    sendError(res, 403, "CSRF_INVALID", "Token CSRF tidak ada atau tidak cocok.");
    return;
  }

  const a = Buffer.from(cookie);
  const b = Buffer.from(header);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    sendError(res, 403, "CSRF_INVALID", "Token CSRF tidak ada atau tidak cocok.");
    return;
  }

  next();
}
