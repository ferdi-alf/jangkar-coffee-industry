import type { Request, Response } from "express";

import { sendData, sendError } from "../../shared/contracts/envelope.js";
import { getSupabase } from "../../shared/db/supabase.js";

import type { VisitInput } from "./track.schema.js";
import * as service from "./track.service.js";

/** Header rahasia yang dikirim middleware situs. Nama kita sendiri, sengaja. */
const SECRET_HEADER = "x-jangkar-track";

export async function postVisit(req: Request, res: Response): Promise<void> {
  const secret = process.env.TRACK_SECRET;

  /* TANPA TRACK_SECRET, endpoint ini MATI, bukan terbuka.
     Kalau ia dibiarkan menerima apa pun saat rahasianya belum disetel, satu
     variabel environment yang lupa diisi berubah jadi endpoint tulis basis data
     tanpa autentikasi yang bisa ditemukan siapa saja. Gagal tertutup, bukan
     gagal terbuka. */
  if (!secret) {
    sendError(res, 503, "NOT_CONFIGURED", "Pencatat kunjungan belum dikonfigurasi.");
    return;
  }

  const given = req.header(SECRET_HEADER) ?? undefined;
  if (!service.secretMatches(given, secret)) {
    sendError(res, 403, "FORBIDDEN", "Tidak berwenang.");
    return;
  }

  const supabase = getSupabase();
  if (!supabase) {
    sendError(res, 503, "NOT_CONFIGURED", "Layanan basis data belum dikonfigurasi.");
    return;
  }

  /* Garam kunjungan boleh memakai garam kontak yang sudah ada. Keduanya sama
     sama hanya perlu nilai rahasia yang stabil, dan menuntut satu variabel
     environment baru lagi hanya menambah satu hal yang bisa lupa diisi. */
  const salt = process.env.VISIT_HASH_SALT ?? process.env.CONTACT_IP_SALT ?? secret;

  await service.recordVisit(supabase, req.body as VisitInput, salt);

  /* 202, bukan 201. Pemanggilnya adalah middleware yang tidak menunggu dan
     tidak punya apa pun untuk dilakukan dengan barisnya. */
  sendData(res, 202, { recorded: true });
}
