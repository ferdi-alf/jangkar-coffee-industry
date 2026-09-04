import type { Request, Response } from "express";

import { sendData, sendError } from "../../shared/contracts/envelope.js";
import { LOCALES, type Locale } from "../../shared/contracts/list.js";
import { getSupabase } from "../../shared/db/supabase.js";
import { param } from "../../shared/utils/params.js";

import type { TimelineInput, TimelinePatch } from "./timeline.schema.js";
import * as service from "./timeline.service.js";

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

function locale(req: Request): Locale {
  const raw = String(req.query.locale ?? "id");
  return (LOCALES as readonly string[]).includes(raw) ? (raw as Locale) : "id";
}

/**
 * Satu endpoint melayani dua pemakai, dan pembedanya adalah SESI.
 *
 * Tanpa sesi, hanya tonggak berstatus `published` yang keluar dan terjemahannya
 * sudah diratakan ke satu bahasa: itu yang dipakai situs. Dengan sesi, draft
 * ikut keluar beserta kedua bahasanya: itu yang dipakai panel. Memisahkannya
 * jadi dua rute akan menggandakan urutan dan aturan cadangan bahasa di dua
 * tempat, dan dua salinan aturan selalu berakhir berbeda.
 */
export async function getList(req: Request, res: Response): Promise<void> {
  const supabase = db(res);
  if (!supabase) return;
  const onlyPublished = !req.user;
  sendData(res, 200, await service.listEntries(supabase, locale(req), onlyPublished));
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const supabase = db(res);
  if (!supabase) return;
  try {
    sendData(res, 200, await service.getEntry(supabase, param(req, "id"), locale(req)));
  } catch (error) {
    handle(res, error);
  }
}

export async function postOne(req: Request, res: Response): Promise<void> {
  const supabase = db(res);
  if (!supabase) return;
  sendData(res, 201, await service.createEntry(supabase, req.user!, req.body as TimelineInput));
}

export async function patchOne(req: Request, res: Response): Promise<void> {
  const supabase = db(res);
  if (!supabase) return;
  try {
    await service.updateEntry(supabase, req.user!, param(req, "id"), req.body as TimelinePatch);
    sendData(res, 200, { id: param(req, "id") });
  } catch (error) {
    handle(res, error);
  }
}

export async function deleteOne(req: Request, res: Response): Promise<void> {
  const supabase = db(res);
  if (!supabase) return;
  try {
    await service.deleteEntry(supabase, req.user!, param(req, "id"));
    sendData(res, 200, { id: param(req, "id") });
  } catch (error) {
    handle(res, error);
  }
}
