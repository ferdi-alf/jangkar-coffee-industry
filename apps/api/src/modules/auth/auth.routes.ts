import { Router } from "express";

import { requireAuth } from "../../shared/middleware/auth.js";
import { requireCsrf } from "../../shared/middleware/csrf.js";
import { loginLimiter } from "../../shared/middleware/rateLimit.js";
import { validateBody } from "../../shared/middleware/validate.js";

import { getMe, postLogin, postLogout, postRefresh } from "./auth.controller.js";
import { LoginInput } from "./auth.schema.js";

export const authRouter: Router = Router();

/* Urutan middleware-nya penting. loginLimiter memakai email dari badan
   permintaan sebagai bagian kuncinya, jadi ia harus berada SETELAH parser JSON,
   yang dipasang di app.ts, tapi SEBELUM validasi, supaya percobaan bertubi-tubi
   dengan payload sampah pun tetap ikut terhitung. */
authRouter.post("/login", requireCsrf, loginLimiter, validateBody(LoginInput), postLogin);
authRouter.post("/refresh", requireCsrf, postRefresh);
authRouter.post("/logout", requireCsrf, postLogout);
authRouter.get("/me", requireAuth, getMe);
