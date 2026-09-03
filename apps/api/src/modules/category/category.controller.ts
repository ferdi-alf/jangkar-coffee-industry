import type { Request, Response } from "express";

import { sendData, sendError, sendList } from "../../shared/contracts/envelope.js";
import { getSupabase } from "../../shared/db/supabase.js";
import { param } from "../../shared/utils/params.js";
import { parseListQuery } from "../../shared/utils/pagination.js";

import type { CategoryInput, CategoryPatch } from "./category.schema.js";
import * as service from "./category.service.js";

const SORT = ["sort_order", "slug", "created_at"] as const;

function db(res: Response) {
  const supabase = getSupabase();
  if (!supabase) {
    sendError(res, 503, "NOT_CONFIGURED", "Layanan basis data belum dikonfigurasi.");
    return null;
  }
  return supabase;
}

function handle(res: Response, error: unknown): void {
  if (error instanceof service.NotFound) {
    sendError(res, 404, "NOT_FOUND", error.message);
    return;
  }
  throw error;
}

export async function getList(req: Request, res: Response): Promise<void> {
  const supabase = db(res);
  if (!supabase) return;
  const query = parseListQuery(req.query as Record<string, unknown>, SORT, "sort_order");
  const { items, meta } = await service.listCategories(supabase, query);
  sendList(res, items, { ...meta });
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const supabase = db(res);
  if (!supabase) return;
  const query = parseListQuery(req.query as Record<string, unknown>, SORT, "sort_order");
  try {
    sendData(res, 200, await service.getCategory(supabase, param(req, "id"), query.locale));
  } catch (error) {
    handle(res, error);
  }
}

export async function postOne(req: Request, res: Response): Promise<void> {
  const supabase = db(res);
  if (!supabase) return;
  sendData(res, 201, await service.createCategory(supabase, req.user!, req.body as CategoryInput));
}

export async function patchOne(req: Request, res: Response): Promise<void> {
  const supabase = db(res);
  if (!supabase) return;
  try {
    await service.updateCategory(supabase, req.user!, param(req, "id"), req.body as CategoryPatch);
    sendData(res, 200, { id: param(req, "id") });
  } catch (error) {
    handle(res, error);
  }
}

export async function deleteOne(req: Request, res: Response): Promise<void> {
  const supabase = db(res);
  if (!supabase) return;
  try {
    await service.deleteCategory(supabase, req.user!, param(req, "id"));
    sendData(res, 200, { id: param(req, "id") });
  } catch (error) {
    handle(res, error);
  }
}
