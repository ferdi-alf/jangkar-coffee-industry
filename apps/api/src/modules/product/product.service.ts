import type { SupabaseClient } from "@supabase/supabase-js";

import type { ListQuery, Locale } from "../../shared/contracts/list.js";
import type { AuthUser } from "../../shared/middleware/auth.js";
import { listMeta } from "../../shared/utils/pagination.js";
import { writeAudit } from "../../shared/utils/audit.js";

import { PRODUCT_DETAIL_PARTS, type ProductDetailPart } from "./product.constants.js";
import type { Channel, ProductDetail, ProductListItem, ProductStatus } from "./product.contract.js";
import type { ProductInput, ProductPatch } from "./product.schema.js";
import * as repo from "./product.repository.js";

/** Aturan bisnis produk. Tidak pernah melihat Request maupun Response. */
export class NotFound extends Error {}

export async function listProducts(
  supabase: SupabaseClient,
  query: ListQuery,
  filters: {
    status?: ProductStatus;
    ecommerce?: boolean;
    categoryId?: string;
    channel?: Channel;
  },
) {
  const { items, total } = await repo.list(supabase, query, filters);
  return { items, meta: listMeta(query, total) };
}

/**
 * Menerjemahkan `?fields=` jadi daftar bagian yang benar-benar diambil.
 *
 * Tanpa `fields`, seluruh bagian ikut. Itu disengaja: klien yang tidak
 * memikirkan cache tetap mendapat objek utuh dan tidak patah. Yang memikirkan
 * cache tinggal menyebut bagian yang belum dimilikinya, dan hanya itu yang
 * dikerjakan basis data.
 */
export function resolveParts(fields: string[] | null): ProductDetailPart[] {
  if (!fields) return [...PRODUCT_DETAIL_PARTS];
  const wanted = fields.filter((f): f is ProductDetailPart =>
    (PRODUCT_DETAIL_PARTS as readonly string[]).includes(f),
  );
  return wanted.length > 0 ? wanted : [...PRODUCT_DETAIL_PARTS];
}

export async function getProduct(
  supabase: SupabaseClient,
  id: string,
  locale: Locale,
  fields: string[] | null,
): Promise<ProductDetail> {
  const product = await repo.findById(supabase, id, locale, resolveParts(fields));
  if (!product) throw new NotFound("Produk tidak ditemukan.");
  return product;
}

export async function createProduct(
  supabase: SupabaseClient,
  actor: AuthUser,
  input: ProductInput,
): Promise<{ id: string }> {
  const id = await repo.create(supabase, input);
  await writeAudit(supabase, actor, "create", "product", id, `Produk ${input.sku} dibuat.`);
  return { id };
}

export async function updateProduct(
  supabase: SupabaseClient,
  actor: AuthUser,
  id: string,
  input: ProductPatch,
): Promise<void> {
  const existing = await repo.findById(supabase, id, "id", []);
  if (!existing) throw new NotFound("Produk tidak ditemukan.");
  await repo.update(supabase, id, input);
  await writeAudit(supabase, actor, "update", "product", id, `Produk ${existing.sku} diubah.`);
}

/**
 * Penanda habis, satu-satunya perubahan produk yang boleh dilakukan staff.
 * Aturan produk: barista boleh mengubah penanda habis, tidak boleh mengubah
 * teks beranda. Karena itu ia endpoint sendiri, bukan cabang di dalam update
 * umum, sehingga pagar perannya ada di router dan tidak bisa terlewat.
 */
export async function setSoldOut(
  supabase: SupabaseClient,
  actor: AuthUser,
  id: string,
  isSoldOut: boolean,
): Promise<void> {
  const existing = await repo.findById(supabase, id, "id", []);
  if (!existing) throw new NotFound("Produk tidak ditemukan.");
  await repo.update(supabase, id, { isSoldOut });
  await writeAudit(
    supabase,
    actor,
    "update",
    "product",
    id,
    `Produk ${existing.sku} ditandai ${isSoldOut ? "habis" : "tersedia"}.`,
  );
}

/**
 * Ketersediaan per kanal, boleh diubah staff.
 *
 * Endpoint sendiri, bukan cabang di dalam updateProduct, karena pagar perannya
 * berbeda: update produk terkunci owner, sedangkan menyusun menu armada adalah
 * operasi harian. Memisahkannya membuat aturan itu hidup di router dan tidak
 * bisa terlewat oleh siapa pun yang menambah medan baru ke form produk.
 */
export async function setChannels(
  supabase: SupabaseClient,
  actor: AuthUser,
  id: string,
  channels: { channel: Channel; available: boolean }[],
): Promise<void> {
  const existing = await repo.findById(supabase, id, "id", []);
  if (!existing) throw new NotFound("Produk tidak ditemukan.");
  await repo.update(supabase, id, { channels });

  const ringkasan = channels
    .map((c) => `${c.channel} ${c.available ? "tampil" : "disembunyikan"}`)
    .join(", ");
  await writeAudit(
    supabase,
    actor,
    "update",
    "product",
    id,
    `Kanal ${existing.sku} diubah: ${ringkasan}.`,
  );
}

export async function deleteProduct(
  supabase: SupabaseClient,
  actor: AuthUser,
  id: string,
): Promise<void> {
  const existing = await repo.findById(supabase, id, "id", []);
  if (!existing) throw new NotFound("Produk tidak ditemukan.");
  await repo.remove(supabase, id);
  await writeAudit(supabase, actor, "delete", "product", id, `Produk ${existing.sku} dihapus.`);
}

export type { ProductListItem };
