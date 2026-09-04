import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";

import { requestId } from "./shared/contracts/envelope.js";
import { issueCsrf } from "./shared/middleware/csrf.js";
import { errorHandler, notFound } from "./shared/middleware/errorHandler.js";
import { generalLimiter, warnIfUnsharedRateLimitStore } from "./shared/middleware/rateLimit.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { categoryRouter } from "./modules/category/category.routes.js";
import { contactRouter } from "./modules/contact/contact.routes.js";
import { contentRouter } from "./modules/content/content.routes.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { mediaRouter } from "./modules/media/media.routes.js";
import { outletRouter } from "./modules/outlet/outlet.routes.js";
import { productRouter } from "./modules/product/product.routes.js";
import { settingsRouter } from "./modules/settings/settings.routes.js";
import { statsRouter } from "./modules/stats/stats.routes.js";
import { timelineRouter } from "./modules/timeline/timeline.routes.js";
import { trackRouter } from "./modules/track/track.routes.js";
import { userRouter } from "./modules/user/user.routes.js";

/**
 * Membangun aplikasi Express.
 *
 * PENTING: fungsi ini TIDAK PERNAH memanggil listen().
 *
 * Alasannya, app yang sama harus jalan di dua tempat:
 *   - lokal    -> src/server.ts memanggil listen()
 *   - Vercel   -> api/index.ts hanya mengekspor app ini sebagai
 *                 serverless function; Vercel yang mengurus socket-nya.
 *
 * Kalau listen() dipanggil di sini, deploy Vercel akan menggantung.
 */
export function createApp(): Express {
  warnIfUnsharedRateLimitStore();

  const app = express();

  // Vercel berjalan di belakang proxy, tanpa ini req.ip dan
  // req.protocol akan salah.
  app.set("trust proxy", 1);

  app.disable("x-powered-by");
  app.use(helmet());

  const origins = (process.env.CORS_ORIGINS ?? "http://localhost:3000,http://localhost:3001")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  app.use(cors({ origin: origins, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Satu id per permintaan, dipakai amplop respons dan log. Harus di atas
  // seluruh route supaya tidak ada respons yang lolos tanpa id.
  app.use(requestId);

  /* Health SENGAJA di atas rate limit. Ia dipanggil pemantau setiap beberapa
     detik, dan membiarkannya ikut kuota 100 per menit berarti pemantauannya
     sendiri yang akan memicu penolakan. */
  app.use("/health", healthRouter);

  // 100 per menit, batas umum dari tabel Keamanan. Route yang lebih rawan punya
  // batasnya sendiri yang jauh lebih ketat, dipasang di router masing-masing.
  app.use(generalLimiter);

  app.get("/csrf", issueCsrf);
  app.use("/auth", authRouter);
  app.use("/contact", contactRouter);
  app.use("/products", productRouter);
  app.use("/categories", categoryRouter);
  app.use("/outlets", outletRouter);
  app.use("/content", contentRouter);
  app.use("/media", mediaRouter);
  app.use("/stats", statsRouter);
  app.use("/settings", settingsRouter);
  app.use("/timeline", timelineRouter);
  app.use("/users", userRouter);
  app.use("/track", trackRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
