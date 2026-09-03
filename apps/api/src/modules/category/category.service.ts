import type { SupabaseClient } from "@supabase/supabase-js";

import type { ListQuery, Locale } from "../../shared/contracts/list.js";
import type { AuthUser } from "../../shared/middleware/auth.js";
import { writeAudit } from "../../shared/utils/audit.js";
import { listMeta } from "../../shared/utils/pagination.js";

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

export async function createCategory(
  supabase: SupabaseClient,
  actor: AuthUser,
  input: CategoryInput,
) {
  const id = await repo.create(supabase, input);
  await writeAudit(supabase, actor, "create", "category", id, `Kategori ${input.slug} dibuat.`);
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
  await repo.update(supabase, id, input);
  await writeAudit(supabase, actor, "update", "category", id, `Kategori ${found.slug} diubah.`);
}

export async function deleteCategory(supabase: SupabaseClient, actor: AuthUser, id: string) {
  const found = await repo.findById(supabase, id, "id");
  if (!found) throw new NotFound("Kategori tidak ditemukan.");
  await repo.remove(supabase, id);
  await writeAudit(supabase, actor, "delete", "category", id, `Kategori ${found.slug} dihapus.`);
}
