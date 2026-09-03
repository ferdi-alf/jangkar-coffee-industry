import { Router } from "express";

import { sendData } from "../../shared/contracts/envelope.js";

export const healthRouter: Router = Router();

/* Memakai amplop yang sama seperti seluruh endpoint lain. Sebelumnya ia
   mengembalikan `{ ok: true, ... }`, bentuk sendiri yang tidak ada di contract
   PROJECT-SPEC dan memaksa klien menangani dua bentuk respons. */
healthRouter.get("/", (_req, res) => {
  sendData(res, 200, {
    service: "@jangkar/api",
    env: process.env.NODE_ENV ?? "development",
  });
});
