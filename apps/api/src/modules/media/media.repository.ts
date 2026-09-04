import type { SupabaseClient } from "@supabase/supabase-js";

import type { ListQuery } from "../../shared/contracts/list.js";
import { range } from "../../shared/utils/pagination.js";

import type { MediaItem } from "./media.contract.js";
import { BUCKET } from "./media.constants.js";

type Row = Record<string, unknown>;

function toItem(supabase: SupabaseClient, row: Row): MediaItem {
  const translations = (row.media_translation as Row[] | undefined) ?? [];
  const pick = (locale: string) =>
    (translations.find((t) => t.locale === locale)?.alt as string) ?? "";
  const bucket = (row.bucket as string) ?? BUCKET;
  const path = row.path as string;

  return {
    id: row.id as string,
    bucket,
    path,
    url: supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl,
    mime: row.mime as string,
    bytes: row.bytes as number,
    width: (row.width as number) ?? null,
    height: (row.height as number) ?? null,
    createdAt: row.created_at as string,
    alt: { id: pick("id"), en: pick("en") },
  };
}

const SELECT = "id, bucket, path, mime, bytes, width, height, created_at, media_translation(locale, alt)";

export async function list(
  supabase: SupabaseClient,
  query: ListQuery,
): Promise<{ items: MediaItem[]; total: number }> {
  let builder = supabase.from("media").select(SELECT, { count: "exact" });
  if (query.q) builder = builder.ilike("path", `%${query.q}%`);

  const [from, to] = range(query);
  const { data, error, count } = await builder
    .order("created_at", { ascending: query.order === "asc" })
    .range(from, to);
  if (error) throw new Error(error.message);

  return {
    items: ((data ?? []) as unknown as Row[]).map((r) => toItem(supabase, r)),
    total: count ?? 0,
  };
}

export async function findById(supabase: SupabaseClient, id: string): Promise<MediaItem | null> {
  const { data, error } = await supabase.from("media").select(SELECT).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toItem(supabase, data as unknown as Row) : null;
}

/**
 * Mencari media dari JALUR OBJEKNYA, bukan dari id.
 *
 * Dipakai saat gambar diganti di form. Kolom tujuan di produk dan SEO hanya
 * menyimpan URL publik, bukan id media, karena kolom itu juga harus bisa berisi
 * jalur statis lama seperti `/roastery/kopi-bubuk-80gr.webp`. Jadi satu-satunya
 * pegangan yang tersisa saat hendak membuang berkas lama adalah jalurnya, dan
 * `media.path` memang unik.
 */
export async function findByPath(
  supabase: SupabaseClient,
  path: string,
): Promise<MediaItem | null> {
  const { data, error } = await supabase.from("media").select(SELECT).eq("path", path).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toItem(supabase, data as unknown as Row) : null;
}

export async function upload(
  supabase: SupabaseClient,
  path: string,
  buffer: Buffer,
  mime: string,
): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: mime,
    /* upsert false dengan sengaja. Nama berkasnya sudah diacak, jadi tabrakan
       berarti ada yang tidak beres, dan menimpanya diam-diam akan menghapus
       gambar yang mungkin masih dipakai halaman lain. */
    upsert: false,
  });
  if (error) throw new Error(error.message);
}

export async function insertRecord(
  supabase: SupabaseClient,
  record: { path: string; mime: string; bytes: number; uploadedBy: string },
  alt: Record<"id" | "en", string>,
): Promise<string> {
  const { data, error } = await supabase
    .from("media")
    .insert({
      bucket: BUCKET,
      path: record.path,
      mime: record.mime,
      bytes: record.bytes,
      uploaded_by: record.uploadedBy,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const id = (data as unknown as Row).id as string;
  const { error: trError } = await supabase.from("media_translation").insert(
    (["id", "en"] as const).map((locale) => ({ media_id: id, locale, alt: alt[locale] })),
  );
  if (trError) throw new Error(trError.message);
  return id;
}

export async function remove(supabase: SupabaseClient, item: MediaItem): Promise<void> {
  /* Berkasnya dihapus lebih dulu, barisnya belakangan. Kalau urutannya dibalik
     dan penghapusan berkas gagal, barisnya sudah hilang dan berkas itu jadi
     yatim di storage tanpa ada yang tahu ia masih di sana. */
  await supabase.storage.from(item.bucket).remove([item.path]);
  const { error } = await supabase.from("media").delete().eq("id", item.id);
  if (error) throw new Error(error.message);
}
