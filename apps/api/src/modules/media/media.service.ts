import { randomBytes } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { ListQuery } from "../../shared/contracts/list.js";
import type { AuthUser } from "../../shared/middleware/auth.js";
import { writeAudit } from "../../shared/utils/audit.js";
import { listMeta } from "../../shared/utils/pagination.js";

import { ALLOWED_MIME, MAX_UPLOAD_BYTES, type AllowedMime, type MediaItem } from "./media.contract.js";
import { EXTENSION, MAGIC } from "./media.constants.js";
import * as repo from "./media.repository.js";

export class NotFound extends Error {}
export class Rejected extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
  }
}

export async function listMedia(supabase: SupabaseClient, query: ListQuery) {
  const { items, total } = await repo.list(supabase, query);
  return { items, meta: listMeta(query, total) };
}

/**
 * Tiga pagar unggahan, dan urutannya penting.
 *
 *   1. UKURAN. Diperiksa multer juga, tapi diperiksa lagi di sini karena
 *      service ini harus tetap benar walau dipanggil dari tempat lain.
 *   2. TIPE MIME dari daftar putih.
 *   3. MAGIC BYTES. Ini yang benar-benar menentukan. Nama berkas dan header
 *      Content-Type keduanya dikendalikan pengunggah, jadi keduanya bukan bukti
 *      apa pun. Isi berkasnya yang tidak bisa dipalsukan tanpa benar-benar
 *      menjadi gambar.
 *
 * NAMA BERKAS DIACAK dan nama aslinya DIBUANG. Nama unggahan bisa memuat
 * traversal jalur, karakter aneh, atau justru informasi pribadi pengunggah.
 * Tidak ada satu pun dari itu yang kita butuhkan.
 */
export async function uploadMedia(
  supabase: SupabaseClient,
  actor: AuthUser,
  file: { buffer: Buffer; mimetype: string; size: number },
  alt: Record<"id" | "en", string>,
): Promise<{ id: string }> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Rejected("FILE_TOO_LARGE", "Berkas melebihi batas 5 MB.");
  }
  if (!(ALLOWED_MIME as readonly string[]).includes(file.mimetype)) {
    throw new Rejected("MIME_NOT_ALLOWED", "Jenis berkas ini tidak diizinkan.");
  }
  const mime = file.mimetype as AllowedMime;
  if (!MAGIC[mime](file.buffer)) {
    throw new Rejected("CONTENT_MISMATCH", "Isi berkas tidak cocok dengan jenisnya.");
  }

  const now = new Date();
  const folder = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const path = `${folder}/${randomBytes(16).toString("hex")}.${EXTENSION[mime]}`;

  await repo.upload(supabase, path, file.buffer, mime);
  const id = await repo.insertRecord(
    supabase,
    { path, mime, bytes: file.size, uploadedBy: actor.id },
    alt,
  );
  await writeAudit(supabase, actor, "create", "media", id, `Media ${path} diunggah.`);
  return { id };
}

export async function getMedia(supabase: SupabaseClient, id: string): Promise<MediaItem> {
  const found = await repo.findById(supabase, id);
  if (!found) throw new NotFound("Media tidak ditemukan.");
  return found;
}

export async function deleteMedia(
  supabase: SupabaseClient,
  actor: AuthUser,
  id: string,
): Promise<void> {
  const found = await repo.findById(supabase, id);
  if (!found) throw new NotFound("Media tidak ditemukan.");
  await repo.remove(supabase, found);
  await writeAudit(supabase, actor, "delete", "media", id, `Media ${found.path} dihapus.`);
}
