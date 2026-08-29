import cors from "cors";
import express, { type Express, type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";

import { healthRouter } from "./routes/health.js";

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
  const app = express();

  // Vercel berjalan di belakang proxy — tanpa ini req.ip dan
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

  app.use("/health", healthRouter);

  // 404
  app.use((req: Request, res: Response) => {
    res.status(404).json({ ok: false, error: "Not Found", path: req.originalUrl });
  });

  // Error handler. Express 5 meneruskan rejection async ke sini secara
  // otomatis, jadi route tidak perlu membungkus dengan try/catch sendiri.
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    if (process.env.NODE_ENV !== "production") console.error(err);
    res.status(500).json({
      ok: false,
      error: process.env.NODE_ENV === "production" ? "Internal Server Error" : message,
    });
  });

  return app;
}
