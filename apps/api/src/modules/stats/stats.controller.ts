import type { Request, Response } from "express";

import { sendData, sendError } from "../../shared/contracts/envelope.js";
import { getSupabase } from "../../shared/db/supabase.js";

import * as service from "./stats.service.js";

export async function getOverview(_req: Request, res: Response): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) {
    sendError(res, 503, "NOT_CONFIGURED", "Layanan basis data belum dikonfigurasi.");
    return;
  }
  sendData(res, 200, await service.getOverview(supabase));
}
