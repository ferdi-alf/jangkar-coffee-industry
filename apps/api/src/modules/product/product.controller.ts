import type { Request, Response } from "express";

import { sendData, sendError, sendList } from "../../shared/contracts/envelope.js";
import { getSupabase } from "../../shared/db/supabase.js";
import { param } from "../../shared/utils/params.js";
import { parseListQuery } from "../../shared/utils/pagination.js";

import { PRODUCT_DEFAULT_SORT, PRODUCT_SORT } from "./product.constants.js";
import type { Channel, ProductStatus } from "./product.contract.js";
import type { ChannelPatch, ProductInput, ProductPatch, SoldOutPatch } from "./product.schema.js";
import * as service from "./product.service.js";

/**
 * Controller. Tahu tentang Request dan Response, tidak pernah tahu tentang
 * Supabase. Kalau berkas ini pernah mengimpor klien basis data, aturan lapisan
 * di PROJECT-SPEC sudah dilanggar.
 */
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

  const query = parseListQuery(req.query as Record<string, unknown>, PRODUCT_SORT, PRODUCT_DEFAULT_SORT);
  const raw = req.query as Record<string, unknown>;
  const status = typeof raw.status === "string" ? (raw.status as ProductStatus) : undefined;
  const categoryId = typeof raw.categoryId === "string" ? raw.categoryId : undefined;
  const ecommerce = raw.ecommerce === "true" ? true : raw.ecommerce === "false" ? false : undefined;
  const channel = raw.channel === "outlet" || raw.channel === "keliling" ? (raw.channel as Channel) : undefined;

  const { items, meta } = await service.listProducts(supabase, query, {
    status,
    ecommerce,
    categoryId,
    channel,
  });
  sendList(res, items, { ...meta });
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const supabase = db(res);
  if (!supabase) return;

  const query = parseListQuery(req.query as Record<string, unknown>, PRODUCT_SORT, PRODUCT_DEFAULT_SORT);
  try {
    sendData(res, 200, await service.getProduct(supabase, param(req, "id"), query.locale, query.fields));
  } catch (error) {
    handle(res, error);
  }
}

export async function postOne(req: Request, res: Response): Promise<void> {
  const supabase = db(res);
  if (!supabase) return;
  sendData(res, 201, await service.createProduct(supabase, req.user!, req.body as ProductInput));
}

export async function patchOne(req: Request, res: Response): Promise<void> {
  const supabase = db(res);
  if (!supabase) return;
  try {
    await service.updateProduct(supabase, req.user!, param(req, "id"), req.body as ProductPatch);
    sendData(res, 200, { id: param(req, "id") });
  } catch (error) {
    handle(res, error);
  }
}

export async function patchSoldOut(req: Request, res: Response): Promise<void> {
  const supabase = db(res);
  if (!supabase) return;
  try {
    const { isSoldOut } = req.body as SoldOutPatch;
    await service.setSoldOut(supabase, req.user!, param(req, "id"), isSoldOut);
    sendData(res, 200, { id: param(req, "id"), isSoldOut });
  } catch (error) {
    handle(res, error);
  }
}

export async function patchChannels(req: Request, res: Response): Promise<void> {
  const supabase = db(res);
  if (!supabase) return;
  try {
    const { channels } = req.body as ChannelPatch;
    await service.setChannels(supabase, req.user!, param(req, "id"), channels);
    sendData(res, 200, { id: param(req, "id"), channels });
  } catch (error) {
    handle(res, error);
  }
}

export async function deleteOne(req: Request, res: Response): Promise<void> {
  const supabase = db(res);
  if (!supabase) return;
  try {
    await service.deleteProduct(supabase, req.user!, param(req, "id"));
    sendData(res, 200, { id: param(req, "id") });
  } catch (error) {
    handle(res, error);
  }
}
