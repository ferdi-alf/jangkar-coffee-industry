import { Router } from "express";

import { trackLimiter } from "../../shared/middleware/rateLimit.js";
import { validateBody } from "../../shared/middleware/validate.js";

import { postVisit } from "./track.controller.js";
import { VisitInput } from "./track.schema.js";

export const trackRouter: Router = Router();

/**
 * Pencatat kunjungan.
 *
 * TIDAK memakai requireCsrf, dan itu disengaja. CSRF melindungi dari permintaan
 * yang dipicu peramban korban memakai cookie-nya; endpoint ini tidak membaca
 * cookie apa pun dan tidak melakukan apa pun atas nama siapa pun, jadi tidak
 * ada yang bisa dibajak. Yang menjaganya adalah header rahasia TRACK_SECRET
 * yang dibandingkan dengan waktu tetap di controller.
 *
 * Pemanggilnya adalah middleware apps/web dari server ke server, bukan
 * peramban, sehingga ia memang tidak bisa mengambil token CSRF lebih dulu.
 */
trackRouter.post("/visit", trackLimiter, validateBody(VisitInput), postVisit);
