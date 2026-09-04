import type { Request, Response } from "express";

import { sendData, sendError } from "../../shared/contracts/envelope.js";
import { LOCALES, type Locale } from "../../shared/contracts/list.js";
import { getSupabase } from "../../shared/db/supabase.js";
import { param } from "../../shared/utils/params.js";

import type { ContactPatch, SeoPatch, SocialInput, SocialPatch } from "./settings.schema.js";
import * as service from "./settings.service.js";

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
  if (error instanceof service.Conflict) {
    sendError(res, 409, "CONFLICT", error.message);
    return;
  }
  throw error;
}

function locale(req: Request): Locale {
  const raw = String(req.query.locale ?? "id");
  return (LOCALES as readonly string[]).includes(raw) ? (raw as Locale) : "id";
}

export async function getPublic(req: Request, res: Response): Promise<void> {
  const supabase = db(res);
  if (!supabase) return;
  sendData(res, 200, await service.getPublic(supabase, locale(req)));
}

export async function getSeo(_req: Request, res: Response): Promise<void> {
  const supabase = db(res);
  if (!supabase) return;
  sendData(res, 200, await service.getSeo(supabase));
}

export async function patchSeo(req: Request, res: Response): Promise<void> {
  const supabase = db(res);
  if (!supabase) return;
  await service.updateSeo(supabase, req.user!, req.body as SeoPatch);
  sendData(res, 200, await service.getSeo(supabase));
}

export async function getContact(_req: Request, res: Response): Promise<void> {
  const supabase = db(res);
  if (!supabase) return;
  sendData(res, 200, await service.getContact(supabase));
}

export async function patchContact(req: Request, res: Response): Promise<void> {
  const supabase = db(res);
  if (!supabase) return;
  await service.updateContact(supabase, req.user!, req.body as ContactPatch);
  sendData(res, 200, await service.getContact(supabase));
}

export async function getSocial(_req: Request, res: Response): Promise<void> {
  const supabase = db(res);
  if (!supabase) return;
  sendData(res, 200, await service.listSocial(supabase));
}

export async function postSocial(req: Request, res: Response): Promise<void> {
  const supabase = db(res);
  if (!supabase) return;
  try {
    sendData(res, 201, await service.createSocial(supabase, req.user!, req.body as SocialInput));
  } catch (error) {
    handle(res, error);
  }
}

export async function patchSocial(req: Request, res: Response): Promise<void> {
  const supabase = db(res);
  if (!supabase) return;
  try {
    await service.updateSocial(supabase, req.user!, param(req, "id"), req.body as SocialPatch);
    sendData(res, 200, { id: param(req, "id") });
  } catch (error) {
    handle(res, error);
  }
}

export async function deleteSocial(req: Request, res: Response): Promise<void> {
  const supabase = db(res);
  if (!supabase) return;
  try {
    await service.deleteSocial(supabase, req.user!, param(req, "id"));
    sendData(res, 200, { id: param(req, "id") });
  } catch (error) {
    handle(res, error);
  }
}
