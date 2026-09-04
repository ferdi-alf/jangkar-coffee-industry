import type { SupabaseClient } from "@supabase/supabase-js";

import type { ListQuery, Locale } from "../../shared/contracts/list.js";
import type { AuthUser } from "../../shared/middleware/auth.js";
import { writeAudit } from "../../shared/utils/audit.js";
import { listMeta } from "../../shared/utils/pagination.js";
import { uniqueSlug } from "../../shared/utils/slug.js";

import type { CategoryItem } from "./category.contract.js";
import type { CategoryInput, CategoryPatch } from "./category.schema.js";
import * as repo from "./category.repository.js";

export class NotFound extends Error {}

export async function listCategories(supabase: SupabaseClient, query: ListQuery) {
  const { items, total } = await repo.list(supabase, query);
  return { items, meta: listMeta(query, total) };
}

export async function getCategory(
  supabase: SupabaseClient,
  id: string,
  locale: Locale,
): Promise<CategoryItem> {
  const found = await repo.findById(supabase, id, locale);
  if (!found) throw new NotFound("Kategori tidak ditemukan.");
  return found;
}

/** Slug lahir dari nama Indonesia, sama seperti produk. */
export async function createCategory(
  supabase: SupabaseClient,
  actor: AuthUser,
  input: CategoryInput,
) {
  const slug = input.slug ?? (await uniqueSlug(supabase, "category", input.translations.id.name));
  const id = await repo.create(supabase, { ...input, slug });
  await writeAudit(supabase, actor, "create", "category", id, `Kategori ${slug} dibuat.`);
  return { id };
}

export async function updateCategory(
  supabase: SupabaseClient,
  actor: AuthUser,
  id: string,
  input: CategoryPatch,
) {
  const found = await repo.findById(supabase, id, "id");
  if (!found) throw new NotFound("Kategori tidak ditemukan.");

  /* Slug dibuang dari patch, dan DI SINI taruhannya paling tinggi di seluruh
     proyek: `category.slug === "non-coffee"` adalah aturan yang memisahkan
     kelompok Coffee dan Non-Coffee pada menu keliling di situs, lihat
     apps/web/modules/home/lib/keliling-menu.ts. Membiarkan slug ikut berubah
     saat nama kategori disunting berarti empat item bisa pindah kelompok tanpa
     satu pun pesan galat. */
  const { slug: _ignored, ...patch } = input;
  await repo.update(supabase, id, patch);
  await writeAudit(supabase, actor, "update", "category", id, `Kategori ${found.slug} diubah.`);
}

export async function deleteCategory(supabase: SupabaseClient, actor: AuthUser, id: string) {
  const found = await repo.findById(supabase, id, "id");
  if (!found) throw new NotFound("Kategori tidak ditemukan.");
  await repo.remove(supabase, id);
  await writeAudit(supabase, actor, "delete", "category", id, `Kategori ${found.slug} dihapus.`);
}
