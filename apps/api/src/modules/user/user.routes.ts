import { Router } from "express";

import { requireAuth, requireRole } from "../../shared/middleware/auth.js";
import { requireCsrf } from "../../shared/middleware/csrf.js";
import { passwordLimiter } from "../../shared/middleware/rateLimit.js";
import { validateBody } from "../../shared/middleware/validate.js";

import { deleteOne, getList, getMe, patchMe, patchOne, postOne } from "./user.controller.js";
import { ProfilePatch, UserInput, UserPatch } from "./user.schema.js";

export const userRouter: Router = Router();

/**
 * `/me` HARUS di atas `/:id`.
 *
 * Express mencocokkan rute menurut urutan pendaftaran, jadi kalau `/:id`
 * terdaftar lebih dulu, permintaan ke `/users/me` akan ditangkapnya dengan
 * id bernilai "me" dan berakhir 404. Ini kesalahan klasik dan tidak terlihat
 * sampai seseorang membuka halaman profil.
 */
userRouter.get("/me", requireAuth, getMe);

/* Pembatas laju dipasang pada perubahan profil karena di sinilah kata sandi
   lama diverifikasi. Tanpa batas, endpoint ini berubah jadi alat menebak kata
   sandi milik sesi yang kebetulan tertinggal terbuka. */
userRouter.patch(
  "/me",
  requireAuth,
  requireCsrf,
  passwordLimiter,
  validateBody(ProfilePatch),
  patchMe,
);

/* Selebihnya OWNER SAJA. Mengelola akun berarti bisa mengangkat diri sendiri
   jadi owner, jadi tidak ada satu pun bagian di bawah ini yang boleh disentuh
   staff. */
userRouter.get("/", requireAuth, requireRole("owner"), getList);
userRouter.post(
  "/",
  requireAuth,
  requireRole("owner"),
  requireCsrf,
  validateBody(UserInput),
  postOne,
);
userRouter.patch(
  "/:id",
  requireAuth,
  requireRole("owner"),
  requireCsrf,
  validateBody(UserPatch),
  patchOne,
);
userRouter.delete("/:id", requireAuth, requireRole("owner"), requireCsrf, deleteOne);
