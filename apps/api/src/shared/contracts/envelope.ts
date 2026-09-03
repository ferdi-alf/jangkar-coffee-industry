import { randomUUID } from "node:crypto";

import type { NextFunction, Request, Response } from "express";

/**
 * Amplop respons, satu bentuk untuk SELURUH endpoint tanpa kecuali.
 *
 * Bentuknya diambil persis dari contract di docs/PROJECT-SPEC.md. Route lama
 * `health` dan penangan 404 serta galat di app.ts sempat memakai bentuk sendiri
 * (`{ ok: false, error: "..." }`), yang berbeda dari contract dan akan memaksa
 * klien menangani dua bentuk sekaligus. Semuanya diseragamkan ke sini.
 */
export interface ResponseMeta {
  requestId: string;
  timestamp: string;
}

export interface ErrorDetail {
  field: string;
  message: string;
}

/**
 * `requestId` dibuat SEKALI per permintaan, bukan per respons, supaya id yang
 * dikirim ke klien sama dengan yang muncul di log. Kalau dibuat di dalam
 * pengirim respons, keduanya akan berbeda dan penelusuran jadi mustahil.
 */
export function requestId(_req: Request, res: Response, next: NextFunction): void {
  res.locals.requestId = randomUUID();
  next();
}

function meta(res: Response): ResponseMeta {
  return {
    requestId: typeof res.locals.requestId === "string" ? res.locals.requestId : randomUUID(),
    timestamp: new Date().toISOString(),
  };
}

export function sendData<T>(res: Response, status: number, data: T): void {
  res.status(status).json({ success: true, data, meta: meta(res) });
}

/**
 * Amplop DAFTAR. Meta paginasi digabung ke meta biasa, persis contract:
 * page, perPage, total, totalPages, hasNext, hasPrev, requestId, timestamp.
 *
 * Ada sebagai fungsi sendiri supaya tidak ada controller yang menyusun bentuk
 * itu dengan tangan lalu keliru satu kunci.
 */
export function sendList<T>(
  res: Response,
  data: T[],
  pagination: Record<string, number | boolean>,
): void {
  res.status(200).json({ success: true, data, meta: { ...pagination, ...meta(res) } });
}

export function sendError(
  res: Response,
  status: number,
  code: string,
  message: string,
  details: ErrorDetail[] = [],
): void {
  res.status(status).json({ success: false, error: { code, message, details }, meta: meta(res) });
}
