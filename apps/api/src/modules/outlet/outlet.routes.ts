import { Router } from "express";

import { requireAuth, requireRole } from "../../shared/middleware/auth.js";
import { requireCsrf } from "../../shared/middleware/csrf.js";
import { validateBody } from "../../shared/middleware/validate.js";

import { deleteOne, getList, getOne, patchOne, postOne } from "./outlet.controller.js";
import { OutletInput, OutletPatch } from "./outlet.schema.js";

export const outletRouter: Router = Router();

outletRouter.get("/", getList);
outletRouter.get("/:id", getOne);
outletRouter.post("/", requireAuth, requireRole("owner"), requireCsrf, validateBody(OutletInput), postOne);
outletRouter.patch("/:id", requireAuth, requireRole("owner"), requireCsrf, validateBody(OutletPatch), patchOne);
outletRouter.delete("/:id", requireAuth, requireRole("owner"), requireCsrf, deleteOne);
