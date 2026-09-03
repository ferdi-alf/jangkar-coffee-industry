import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

import { sendError, type ErrorDetail } from "../contracts/envelope.js";

/**
 * Validasi zod di setiap boundary, keluar sebagai `VALIDATION_ERROR` yang
 * seragam, persis tabel Keamanan di PROJECT-SPEC.
 *
 * Hasil parse yang sudah bersih MENGGANTI `req.body`, jadi controller di
 * belakangnya tidak pernah melihat data mentah. Ini yang mencegah medan liar
 * ikut lolos ke repository, karena zod membuang kunci yang tidak ada di skema.
 */
export function validateBody<T>(schema: ZodType<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const details: ErrorDetail[] = parsed.error.issues.map((issue) => ({
        field: issue.path.join(".") || "body",
        message: issue.message,
      }));
      sendError(res, 422, "VALIDATION_ERROR", "Data yang dikirim tidak valid.", details);
      return;
    }
    req.body = parsed.data;
    next();
  };
}
