import type { NextFunction, Request, Response } from "express";

import { sendError } from "../contracts/envelope.js";

/** 404, memakai amplop yang sama seperti seluruh respons lain. */
export function notFound(_req: Request, res: Response): void {
  sendError(res, 404, "NOT_FOUND", "Endpoint tidak ditemukan.");
}

/**
 * Penangan galat terakhir. Express 5 meneruskan rejection async ke sini secara
 * otomatis, jadi route tidak perlu membungkus dengan try/catch sendiri.
 *
 * Di produksi pesan aslinya TIDAK diteruskan. Pesan galat Postgres dan Node
 * rutin memuat jalur berkas, nama kolom, dan potongan query, dan semuanya itu
 * peta gratis bagi penyerang.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const message = err instanceof Error ? err.message : "Internal Server Error";
  if (process.env.NODE_ENV !== "production") console.error(err);
  sendError(
    res,
    500,
    "INTERNAL_ERROR",
    process.env.NODE_ENV === "production" ? "Terjadi galat di server." : message,
  );
}
