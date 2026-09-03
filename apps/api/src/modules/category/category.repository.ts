import type { SupabaseClient } from "@supabase/supabase-js";

import type { ListQuery, Locale } from "../../shared/contracts/list.js";
import { range } from "../../shared/utils/pagination.js";

import type { CategoryItem, CategoryStatus } from "./category.contract.js";
import type { CategoryInput, CategoryPatch } from "./category.schema.js";

type Row = Record<string, unknown>;

function toItem(row: Row, locale: Locale, withTranslations: boolean): CategoryItem {
  const rows = (row.category_translation as Row[] | undefined) ?? [];
  const picked = rows.find((t) => t.locale === locale) ?? rows.find((t) => t.locale === "id");
  const empty = { name: "", description: null as string | null };

  const item: CategoryItem = {
    id: row.id as string,
    slug: row.slug as string,
    name: (picked?.name as string) ?? (row.slug as string),
    description: (picked?.description as string) ?? null,
    sortOrder: (row.sort_order as number) ?? 0,
    status: row.status as CategoryStatus,
  };
  if (withTranslations) {
    item.translations = {
      id: (rows.find((t) => t.locale === "id") as typeof empty | undefined) ?? empty,
      en: (rows.find((t) => t.locale === "en") as typeof empty | undefined) ?? empty,
    };
  }
  return item;
}

export async function list(
  supabase: SupabaseClient,
  query: ListQuery,
): Promise<{ items: CategoryItem[]; total: number }> {
  const joiner = query.q ? "category_translation!inner" : "category_translation";
  let builder = supabase
    .from("category")
    .select(`id, slug, sort_order, status, ${joiner}(locale, name, description)`, { count: "exact" });

  if (query.q) {
    builder = builder
      .eq("category_translation.locale", query.locale)
      .ilike("category_translation.name", `%${query.q}%`);
  }

  const [from, to] = range(query);
  const { data, error, count } = await builder
    .order(query.sort ?? "sort_order", { ascending: query.order === "asc" })
    .range(from, to);
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as Row[];
  return { items: rows.map((r) => toItem(r, query.locale, false)), total: count ?? 0 };
}

export async function findById(
  supabase: SupabaseClient,
  id: string,
  locale: Locale,
): Promise<CategoryItem | null> {
  const { data, error } = await supabase
    .from("category")
    .select("id, slug, sort_order, status, category_translation(locale, name, description)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return toItem(data as unknown as Row, locale, true);
}

function toRow(input: CategoryPatch): Row {
  const row: Row = {};
  if (input.slug !== undefined) row.slug = input.slug;
  if (input.sortOrder !== undefined) row.sort_order = input.sortOrder;
  if (input.status !== undefined) row.status = input.status;
  return row;
}

async function writeTranslations(
  supabase: SupabaseClient,
  categoryId: string,
  input: CategoryPatch,
): Promise<void> {
  if (!input.translations) return;
  const rows = (["id", "en"] as const).map((locale) => ({
    category_id: categoryId,
    locale,
    name: input.translations![locale].name,
    description: input.translations![locale].description ?? null,
  }));
  const { error } = await supabase
    .from("category_translation")
    .upsert(rows, { onConflict: "category_id,locale" });
  if (error) throw new Error(error.message);
}

export async function create(supabase: SupabaseClient, input: CategoryInput): Promise<string> {
  const { data, error } = await supabase.from("category").insert(toRow(input)).select("id").single();
  if (error) throw new Error(error.message);
  const id = (data as unknown as Row).id as string;
  await writeTranslations(supabase, id, input);
  return id;
}

export async function update(
  supabase: SupabaseClient,
  id: string,
  input: CategoryPatch,
): Promise<void> {
  const row = toRow(input);
  if (Object.keys(row).length > 0) {
    const { error } = await supabase.from("category").update(row).eq("id", id);
    if (error) throw new Error(error.message);
  }
  await writeTranslations(supabase, id, input);
}

export async function remove(supabase: SupabaseClient, id: string): Promise<void> {
  /* Produk yang memakainya TIDAK ikut terhapus. Migrasinya memakai
     ON DELETE SET NULL untuk product.category_id, jadi menghapus kategori
     membuat produknya tak berkategori, bukan lenyap. */
  const { error } = await supabase.from("category").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
