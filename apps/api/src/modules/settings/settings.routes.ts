import { Router } from "express";

import { requireAuth, requireRole } from "../../shared/middleware/auth.js";
import { requireCsrf } from "../../shared/middleware/csrf.js";
import { validateBody } from "../../shared/middleware/validate.js";

import {
  deleteSocial,
  getContact,
  getPublic,
  getSeo,
  getSocial,
  patchContact,
  patchSeo,
  patchSocial,
  postSocial,
} from "./settings.controller.js";
import { ContactPatch, SeoPatch, SocialInput, SocialPatch } from "./settings.schema.js";

export const settingsRouter: Router = Router();

/**
 * `/public` HARUS terdaftar lebih dulu dan TANPA auth.
 *
 * Ia dipanggil situs publik saat build untuk mengisi generateMetadata dan
 * footer. Kalau ia terkunci, judul halaman dan nomor telepon hilang dari HTML
 * statis, dan yang paling menyesatkan: buildnya tetap berhasil.
 */
settingsRouter.get("/public", getPublic);

/* Membaca setelan cukup dengan sesi apa pun, karena halaman panel perlu
   menampilkannya. MENULIS hanya owner: SEO dan kontak adalah wajah perusahaan
   di mesin telusur, sekelas dengan teks beranda yang juga terkunci owner. */
settingsRouter.get("/seo", requireAuth, getSeo);
settingsRouter.patch(
  "/seo",
  requireAuth,
  requireRole("owner"),
  requireCsrf,
  validateBody(SeoPatch),
  patchSeo,
);

settingsRouter.get("/contact", requireAuth, getContact);
settingsRouter.patch(
  "/contact",
  requireAuth,
  requireRole("owner"),
  requireCsrf,
  validateBody(ContactPatch),
  patchContact,
);

settingsRouter.get("/social", requireAuth, getSocial);
settingsRouter.post(
  "/social",
  requireAuth,
  requireRole("owner"),
  requireCsrf,
  validateBody(SocialInput),
  postSocial,
);
settingsRouter.patch(
  "/social/:id",
  requireAuth,
  requireRole("owner"),
  requireCsrf,
  validateBody(SocialPatch),
  patchSocial,
);
settingsRouter.delete("/social/:id", requireAuth, requireRole("owner"), requireCsrf, deleteSocial);
