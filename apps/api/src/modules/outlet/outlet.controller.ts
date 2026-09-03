import type { Request, Response } from "express";

import { sendData, sendError, sendList } from "../../shared/contracts/envelope.js";
import { getSupabase } from "../../shared/db/supabase.js";
import { param } from "../../shared/utils/params.js";
import { parseListQuery } from "../../shared/utils/pagination.js";

import type { OutletStatus } from "./outlet.contract.js";
import type { OutletInput, OutletPatch } from "./outlet.schema.js";
import * as service from "./outlet.service.js";

const SORT = ["sort_order", "name", "created_at"] as const;

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
  const raw = req.query as Record<string, unknown>;
  const query = parseListQuery(raw, SORT, "sort_order");
  const status = typeof raw.status === "string" ? (raw.status as OutletStatus) : undefined;
  const { items, meta } = await service.listOutlets(supabase, query, { status });
  sendList(res, items, { ...meta });
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const supabase = db(res);
  if (!supabase) return;
  const query = parseListQuery(req.query as Record<string, unknown>, SORT, "sort_order");
  try {
    sendData(res, 200, await service.getOutlet(supabase, param(req, "id"), query.locale));
  } catch (error) {
    handle(res, error);
  }
}

export async function postOne(req: Request, res: Response): Promise<void> {
  const supabase = db(res);
  if (!supabase) return;
  sendData(res, 201, await service.createOutlet(supabase, req.user!, req.body as OutletInput));
}

export async function patchOne(req: Request, res: Response): Promise<void> {
  const supabase = db(res);
  if (!supabase) return;
  try {
    await service.updateOutlet(supabase, req.user!, param(req, "id"), req.body as OutletPatch);
    sendData(res, 200, { id: param(req, "id") });
  } catch (error) {
    handle(res, error);
  }
}

export async function deleteOne(req: Request, res: Response): Promise<void> {
  const supabase = db(res);
  if (!supabase) return;
  try {
    await service.deleteOutlet(supabase, req.user!, param(req, "id"));
    sendData(res, 200, { id: param(req, "id") });
  } catch (error) {
    handle(res, error);
  }
}
