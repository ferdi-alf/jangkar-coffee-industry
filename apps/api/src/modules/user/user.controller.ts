import type { Request, Response } from "express";

import { sendData, sendError } from "../../shared/contracts/envelope.js";
import { getSupabase } from "../../shared/db/supabase.js";
import { param } from "../../shared/utils/params.js";

import type { ProfilePatch, UserInput, UserPatch } from "./user.schema.js";
import * as service from "./user.service.js";

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
  if (error instanceof service.Forbidden) {
    sendError(res, 403, "FORBIDDEN", error.message);
    return;
  }
  if (error instanceof service.BadRequest) {
    sendError(res, 400, "BAD_REQUEST", error.message);
    return;
  }
  throw error;
}

export async function getList(_req: Request, res: Response): Promise<void> {
  const supabase = db(res);
  if (!supabase) return;
  sendData(res, 200, await service.listUsers(supabase));
}

/**
 * Profil sendiri. TERDAFTAR SEBELUM `/:id`, kalau tidak Express akan
 * memperlakukan "me" sebagai sebuah id dan rutenya tidak pernah tercapai.
 */
export async function getMe(req: Request, res: Response): Promise<void> {
  const supabase = db(res);
  if (!supabase) return;
  try {
    sendData(res, 200, await service.getUser(supabase, req.user!.id));
  } catch (error) {
    handle(res, error);
  }
}

export async function patchMe(req: Request, res: Response): Promise<void> {
  const supabase = db(res);
  if (!supabase) return;
  try {
    await service.updateProfile(supabase, req.user!, req.body as ProfilePatch);
    sendData(res, 200, await service.getUser(supabase, req.user!.id));
  } catch (error) {
    handle(res, error);
  }
}

export async function postOne(req: Request, res: Response): Promise<void> {
  const supabase = db(res);
  if (!supabase) return;
  try {
    sendData(res, 201, await service.createUser(supabase, req.user!, req.body as UserInput));
  } catch (error) {
    handle(res, error);
  }
}

export async function patchOne(req: Request, res: Response): Promise<void> {
  const supabase = db(res);
  if (!supabase) return;
  try {
    await service.updateUser(supabase, req.user!, param(req, "id"), req.body as UserPatch);
    sendData(res, 200, { id: param(req, "id") });
  } catch (error) {
    handle(res, error);
  }
}

export async function deleteOne(req: Request, res: Response): Promise<void> {
  const supabase = db(res);
  if (!supabase) return;
  try {
    await service.deleteUser(supabase, req.user!, param(req, "id"));
    sendData(res, 200, { id: param(req, "id") });
  } catch (error) {
    handle(res, error);
  }
}
