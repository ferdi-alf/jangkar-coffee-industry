import { Router } from "express";
import multer from "multer";

import { requireAuth, requireRole } from "../../shared/middleware/auth.js";
import { requireCsrf } from "../../shared/middleware/csrf.js";
import { uploadLimiter } from "../../shared/middleware/rateLimit.js";

import { deleteByUrl, deleteOne, getList, getOne, postUpload } from "./media.controller.js";
import { MAX_UPLOAD_BYTES } from "./media.contract.js";

/**
 * memoryStorage, bukan diskStorage, dan itu yang memungkinkan magic bytes
 * diperiksa sebelum berkasnya ke mana-mana. Kalau ditulis ke disk lebih dulu,
 * berkas yang belum diperiksa sudah mendarat di sistem berkas server.
 *
 * Batas ukuran dipasang DI SINI juga, bukan hanya di service. Tanpa batas di
 * multer, berkas 2 GB akan lebih dulu masuk memori sepenuhnya sebelum service
 * sempat menolaknya.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
});

export const mediaRouter: Router = Router();

mediaRouter.get("/", requireAuth, getList);
mediaRouter.get("/:id", requireAuth, getOne);
mediaRouter.post(
  "/",
  requireAuth,
  requireRole("owner", "staff"),
  /* requireCsrf SEBELUM multer, bukan sesudah. Token CSRF ada di header, jadi ia
     sudah bisa diperiksa tanpa menyentuh badan permintaan. Kalau urutannya
     dibalik, permintaan tanpa token tetap membuat 5 MB berkas dibaca penuh ke
     memori lebih dulu baru ditolak, dan itu justru menjadikan endpoint ini
     alat menghabiskan memori server. */
  requireCsrf,
  uploadLimiter,
  upload.single("file"),
  postUpload,
);
/* Koleksi lebih dulu, baru `/:id`. Terbalik pun sebenarnya tidak bentrok di
   Express, tapi urutan ini yang terbaca sesuai bentuknya. */
mediaRouter.delete("/", requireAuth, requireRole("owner"), requireCsrf, deleteByUrl);
mediaRouter.delete("/:id", requireAuth, requireRole("owner"), requireCsrf, deleteOne);
