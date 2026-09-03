import type { Request, Response } from "express";

import { sendData, sendError } from "../../shared/contracts/envelope.js";
import { getSupabase } from "../../shared/db/supabase.js";
import { param } from "../../shared/utils/params.js";

import type { ContentPatch } from "./content.schema.js";
import * as service from "./content.service.js";

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

export async function getSections(_req: Request, res: Response): Promise<void> {
  const supabase = db(res);
  if (!supabase) return;
  sendData(res, 200, await service.listSections(supabase));
}

export async function getPublic(req: Request, res: Response): Promise<void> {
  const supabase = db(res);
  if (!supabase) return;
  const raw = (req.query as Record<string, unknown>).locale;
  const locale = raw === "en" ? "en" : "id";
  sendData(res, 200, await service.getPublicContent(supabase, locale));
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const supabase = db(res);
  if (!supabase) return;
  try {
    sendData(res, 200, await service.getSection(supabase, param(req, "key")));
  } catch (error) {
    handle(res, error);
  }
}

export async function patchOne(req: Request, res: Response): Promise<void> {
  const supabase = db(res);
  if (!supabase) return;
  try {
    await service.updateSection(supabase, req.user!, param(req, "key"), req.body as ContentPatch);
    sendData(res, 200, { key: param(req, "key") });
  } catch (error) {
    handle(res, error);
  }
}
