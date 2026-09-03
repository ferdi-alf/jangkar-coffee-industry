import { Router } from "express";

import { requireAuth, requireRole } from "../../shared/middleware/auth.js";
import { requireCsrf } from "../../shared/middleware/csrf.js";
import { validateBody } from "../../shared/middleware/validate.js";

import { getOne, getPublic, getSections, patchOne } from "./content.controller.js";
import { ContentPatch } from "./content.schema.js";

export const contentRouter: Router = Router();

/* `/public` HARUS didaftarkan sebelum `/:key`, kalau tidak Express akan
   membaca kata "public" sebagai nilai parameter key dan rutenya tidak pernah
   tercapai. */
contentRouter.get("/public", getPublic);
contentRouter.get("/", requireAuth, getSections);
contentRouter.get("/:key", requireAuth, getOne);

/* TEKS BERANDA HANYA OWNER. Aturan produk menyebutnya lugas: barista boleh
   mengubah penanda habis, tidak boleh mengubah teks beranda. Di sinilah
   kalimat itu ditegakkan. */
contentRouter.patch("/:key", requireAuth, requireRole("owner"), requireCsrf, validateBody(ContentPatch), patchOne);
