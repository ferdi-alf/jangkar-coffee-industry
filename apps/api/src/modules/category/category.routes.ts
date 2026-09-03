import { Router } from "express";

import { requireAuth, requireRole } from "../../shared/middleware/auth.js";
import { requireCsrf } from "../../shared/middleware/csrf.js";
import { validateBody } from "../../shared/middleware/validate.js";

import { deleteOne, getList, getOne, patchOne, postOne } from "./category.controller.js";
import { CategoryInput, CategoryPatch } from "./category.schema.js";

export const categoryRouter: Router = Router();

categoryRouter.get("/", getList);
categoryRouter.get("/:id", getOne);
categoryRouter.post("/", requireAuth, requireRole("owner"), requireCsrf, validateBody(CategoryInput), postOne);
categoryRouter.patch("/:id", requireAuth, requireRole("owner"), requireCsrf, validateBody(CategoryPatch), patchOne);
categoryRouter.delete("/:id", requireAuth, requireRole("owner"), requireCsrf, deleteOne);
