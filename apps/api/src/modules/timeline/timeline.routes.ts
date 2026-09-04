import { Router } from "express";

import { attachUser, requireAuth, requireRole } from "../../shared/middleware/auth.js";
import { requireCsrf } from "../../shared/middleware/csrf.js";
import { validateBody } from "../../shared/middleware/validate.js";

import { deleteOne, getList, getOne, patchOne, postOne } from "./timeline.controller.js";
import { TimelineInput, TimelinePatch } from "./timeline.schema.js";

export const timelineRouter: Router = Router();

/**
 * `attachUser` DI SINI, bukan `requireAuth`.
 *
 * Rute ini publik, dipanggil situs saat build. Tapi panel juga membacanya, dan
 * panel perlu melihat tonggak berstatus draft beserta kedua bahasanya.
 * `attachUser` mengisi req.user kalau sesinya sah dan tidak pernah menolak,
 * jadi satu rute melayani keduanya tanpa menggandakan aturan urutan dan
 * cadangan bahasa. Lihat timeline.controller.ts.
 */
timelineRouter.get("/", attachUser, getList);
timelineRouter.get("/:id", requireAuth, getOne);

/* Menulis hanya owner, setara dengan teks beranda: ini narasi perusahaan yang
   tampil di halaman publik, bukan operasi harian seperti penanda habis. */
timelineRouter.post(
  "/",
  requireAuth,
  requireRole("owner"),
  requireCsrf,
  validateBody(TimelineInput),
  postOne,
);
timelineRouter.patch(
  "/:id",
  requireAuth,
  requireRole("owner"),
  requireCsrf,
  validateBody(TimelinePatch),
  patchOne,
);
timelineRouter.delete("/:id", requireAuth, requireRole("owner"), requireCsrf, deleteOne);
