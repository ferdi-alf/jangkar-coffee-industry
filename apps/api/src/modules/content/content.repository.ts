import type { SupabaseClient } from "@supabase/supabase-js";

import type { Locale } from "../../shared/contracts/list.js";

import type { ContentKind, ContentSection, PublicContent } from "./content.contract.js";

type Row = Record<string, unknown>;

const SELECT =
  "id, key, label, sort_order, status, " +
  "page_content(id, key, kind, sort_order, page_content_translation(locale, value))";

function toSection(row: Row): ContentSection {
  const fields = ((row.page_content as Row[] | undefined) ?? [])
    .map((field) => {
      const translations = (field.page_content_translation as Row[] | undefined) ?? [];
      const pick = (locale: Locale) =>
        (translations.find((t) => t.locale === locale)?.value as string) ?? "";
      return {
        id: field.id as string,
        key: field.key as string,
        kind: field.kind as ContentKind,
        sortOrder: (field.sort_order as number) ?? 0,
        values: { id: pick("id"), en: pick("en") },
      };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    id: row.id as string,
    key: row.key as string,
    label: row.label as string,
    sortOrder: (row.sort_order as number) ?? 0,
    status: row.status as "draft" | "published",
    fields,
  };
}

export async function listSections(supabase: SupabaseClient): Promise<ContentSection[]> {
  const { data, error } = await supabase
    .from("page_section")
    .select(SELECT)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as Row[]).map(toSection);
}

export async function findSection(
  supabase: SupabaseClient,
  key: string,
): Promise<ContentSection | null> {
  const { data, error } = await supabase.from("page_section").select(SELECT).eq("key", key).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toSection(data as unknown as Row) : null;
}

/**
 * Bentuk datar untuk situs publik. Hanya seksi berstatus published yang ikut,
 * jadi draft tidak pernah bocor ke halaman meski sudah tersimpan.
 */
export async function publicContent(
  supabase: SupabaseClient,
  locale: Locale,
): Promise<PublicContent> {
  const sections = await listSections(supabase);
  const out: PublicContent = {};
  for (const section of sections) {
    if (section.status !== "published") continue;
    for (const field of section.fields) {
      out[`${section.key}.${field.key}`] = field.values[locale] || field.values.id;
    }
  }
  return out;
}

export async function writeValues(
  supabase: SupabaseClient,
  fields: { id: string; values: Record<"id" | "en", string> }[],
): Promise<void> {
  const rows = fields.flatMap((field) =>
    (["id", "en"] as const).map((locale) => ({
      content_id: field.id,
      locale,
      value: field.values[locale],
    })),
  );
  const { error } = await supabase
    .from("page_content_translation")
    .upsert(rows, { onConflict: "content_id,locale" });
  if (error) throw new Error(error.message);
}
