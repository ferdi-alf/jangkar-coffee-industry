import { Router } from "express";

import { requireAuth, requireRole } from "../../shared/middleware/auth.js";
import { requireCsrf } from "../../shared/middleware/csrf.js";
import { validateBody } from "../../shared/middleware/validate.js";

import {
  deleteOne,
  getList,
  getOne,
  patchChannels,
  patchOne,
  patchSoldOut,
  postOne,
} from "./product.controller.js";
import { ChannelPatch, ProductInput, ProductPatch, SoldOutPatch } from "./product.schema.js";

export const productRouter: Router = Router();

/* BACA TERBUKA, TULIS TERKUNCI.
   GET dipakai situs publik yang memang tidak punya sesi, jadi ia tanpa auth.
   Setiap mutasi butuh sesi, token CSRF, dan validasi zod. */
productRouter.get("/", getList);
productRouter.get("/:id", getOne);

productRouter.post("/", requireAuth, requireRole("owner"), requireCsrf, validateBody(ProductInput), postOne);
productRouter.patch("/:id", requireAuth, requireRole("owner"), requireCsrf, validateBody(ProductPatch), patchOne);
productRouter.delete("/:id", requireAuth, requireRole("owner"), requireCsrf, deleteOne);

/* DUA JALAN BAGI STAFF, keduanya operasi harian dan bukan keputusan katalog:
   menandai sesuatu habis, dan menyusun isi menu per kanal. Selebihnya milik
   owner, persis aturan produk di PROJECT-SPEC. */
productRouter.patch(
  "/:id/sold-out",
  requireAuth,
  requireRole("owner", "staff"),
  requireCsrf,
  validateBody(SoldOutPatch),
  patchSoldOut,
);

productRouter.patch(
  "/:id/channels",
  requireAuth,
  requireRole("owner", "staff"),
  requireCsrf,
  validateBody(ChannelPatch),
  patchChannels,
);
