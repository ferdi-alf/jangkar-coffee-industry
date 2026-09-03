import { Router } from "express";

export const healthRouter: Router = Router();

healthRouter.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "@jangkar/api",
    env: process.env.NODE_ENV ?? "development",
    ts: new Date().toISOString(),
  });
});
