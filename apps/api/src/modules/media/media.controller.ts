import type { Request, Response } from "express";

import { sendData, sendError, sendList } from "../../shared/contracts/envelope.js";
import { getSupabase } from "../../shared/db/supabase.js";
import { param } from "../../shared/utils/params.js";
import { parseListQuery } from "../../shared/utils/pagination.js";

import { MediaMeta } from "./media.schema.js";
import * as service from "./media.service.js";

const SORT = ["created_at"] as const;

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
  if (error instanceof service.Rejected) {
    sendError(res, 422, error.code, error.message);
    return;
  }
  throw error;
}

export async function getList(req: Request, res: Response): Promise<void> {
  const supabase = db(res);
  if (!supabase) return;
  const query = parseListQuery(req.query as Record<string, unknown>, SORT, "created_at");
  const { items, meta } = await service.listMedia(supabase, query);
  sendList(res, items, { ...meta });
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const supabase = db(res);
  if (!supabase) return;
  try {
    sendData(res, 200, await service.getMedia(supabase, param(req, "id")));
  } catch (error) {
    handle(res, error);
  }
}

/**
 * Unggahan datang sebagai multipart, jadi alt text tiba sebagai STRING di
 * `req.body`, bukan objek. Ia diurai lalu divalidasi zod di sini, bukan lewat
 * middleware validateBody, karena middleware itu mengasumsikan badan JSON.
 */
export async function postUpload(req: Request, res: Response): Promise<void> {
  const supabase = db(res);
  if (!supabase) return;

  const file = (req as Request & { file?: Express.Multer.File }).file;
  if (!file) {
    sendError(res, 422, "VALIDATION_ERROR", "Berkas tidak ada.", [
      { field: "file", message: "file.required" },
    ]);
    return;
  }

  const body = req.body as Record<string, unknown>;
  let altRaw: unknown = body.alt;
  if (typeof altRaw === "string") {
    try {
      altRaw = JSON.parse(altRaw);
    } catch {
      altRaw = undefined;
    }
  }

  const parsed = MediaMeta.safeParse({ alt: altRaw });
  if (!parsed.success) {
    sendError(
      res,
      422,
      "VALIDATION_ERROR",
      "Data yang dikirim tidak valid.",
      parsed.error.issues.map((issue) => ({
        field: issue.path.join(".") || "alt",
        message: issue.message,
      })),
    );
    return;
  }

  try {
    sendData(res, 201, await service.uploadMedia(supabase, req.user!, file, parsed.data.alt));
  } catch (error) {
    handle(res, error);
  }
}

export async function deleteOne(req: Request, res: Response): Promise<void> {
  const supabase = db(res);
  if (!supabase) return;
  try {
    await service.deleteMedia(supabase, req.user!, param(req, "id"));
    sendData(res, 200, { id: param(req, "id") });
  } catch (error) {
    handle(res, error);
  }
}
