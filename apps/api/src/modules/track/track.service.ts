import { createHash, timingSafeEqual } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { VisitInput } from "./track.schema.js";
import * as repo from "./track.repository.js";

/** Simpan setengah tahun. Cukup membandingkan musim, tidak menyimpan selamanya. */
const KEEP_DAYS = 180;

/**
 * Satu dari sekian penulisan ikut memangkas baris lama.
 *
 * Proyek ini tidak punya penjadwal, jadi pemangkasan harus menumpang pada
 * sesuatu yang memang berjalan. Satu per seribu berarti pada situs yang ramai
 * ia berjalan beberapa kali sehari, dan pada situs yang sepi ia praktis tidak
 * pernah berjalan, yang juga benar karena tidak ada yang perlu dipangkas.
 */
const PRUNE_CHANCE = 0.001;

/**
 * Membandingkan rahasia dengan waktu tetap.
 *
 * `===` pada string keluar pada karakter pertama yang berbeda, dan selisih
 * waktunya bisa diukur dari jauh untuk menebak rahasianya huruf demi huruf.
 * Pola yang sama sudah dipakai requireCsrf di shared/middleware/csrf.ts.
 */
export function secretMatches(given: string | undefined, expected: string): boolean {
  if (!given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Hash pengunjung: IP + user agent + garam + TANGGAL.
 *
 * Tanggal ikut masuk dengan sengaja. Hash orang yang sama berubah setiap lewat
 * tengah malam, jadi angka ini hanya bisa menjawab "berapa pengunjung berbeda
 * hari ini" dan tidak pernah bisa merangkai jejak seseorang antar hari.
 *
 * IP MENTAH TIDAK PERNAH DISIMPAN, hanya dipakai sebagai bahan hash lalu
 * dibuang. Pola yang sama sudah dipakai contact_message.ip_hash.
 */
function visitorHash(input: VisitInput, salt: string): string {
  const day = new Date().toISOString().slice(0, 10);
  return createHash("sha256")
    .update(`${input.ip ?? "-"}|${input.ua ?? "-"}|${salt}|${day}`)
    .digest("hex");
}

export async function recordVisit(
  supabase: SupabaseClient,
  input: VisitInput,
  salt: string,
): Promise<void> {
  await repo.insertVisit(supabase, {
    country: input.country ? input.country.toUpperCase() : null,
    path: input.path,
    locale: input.locale ?? null,
    visitorHash: visitorHash(input, salt),
  });

  if (Math.random() < PRUNE_CHANCE) {
    try {
      await repo.prune(supabase, KEEP_DAYS);
    } catch {
      /* Pemangkasan yang gagal TIDAK BOLEH menggagalkan pencatatannya. Ia
         perawatan, bukan bagian dari permintaan, dan akan dicoba lagi sendiri
         pada penulisan berikutnya yang terpilih. */
    }
  }
}
