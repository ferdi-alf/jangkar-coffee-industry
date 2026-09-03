import { Router } from "express";

import { requireAuth } from "../../shared/middleware/auth.js";

import { getOverview } from "./stats.controller.js";

export const statsRouter: Router = Router();

/* Butuh sesi. Angka-angka ini memang tidak rahasia satu per satu, tapi
   gabungannya menggambarkan ukuran dan ritme operasi bisnis, dan itu bukan
   untuk publik. */
statsRouter.get("/overview", requireAuth, getOverview);
