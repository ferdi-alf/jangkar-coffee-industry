import type { SupabaseClient } from "@supabase/supabase-js";

import type { Locale } from "../../shared/contracts/list.js";

import type { TimelineEntry, TimelineStatus, TimelineTranslation } from "./timeline.contract.js";
import type { TimelineInput, TimelinePatch } from "./timeline.schema.js";

type Row = Record<string, unknown>;

const COLUMNS = "id, year, year_end, sort_order, status";
const SELECT = `${COLUMNS}, timeline_entry_translation(locale, title, subtitle, description)`;

const EMPTY: TimelineTranslation = { title: "", subtitle: null, description: null };

function toTranslation(row: Row | undefined): TimelineTranslation {
  if (!row) return { ...EMPTY };
  return {
    title: (row.title as string) ?? "",
    subtitle: (row.subtitle as string) ?? null,
    description: (row.description as string) ?? null,
  };
}

function toEntry(row: Row, locale: Locale, withTranslations: boolean): TimelineEntry {
  const rows = (row.timeline_entry_translation as Row[] | undefined) ?? [];
  /* Bahasa yang diminta lebih dulu, lalu Indonesia sebagai cadangan. Tonggak
     tanpa terjemahan Inggris lebih baik tampil berbahasa Indonesia daripada
     meninggalkan kartu kosong di tengah garis waktu. */
  const picked = toTranslation(
    rows.find((t) => t.locale === locale) ?? rows.find((t) => t.locale === "id"),
  );

  const entry: TimelineEntry = {
    id: row.id as string,
    year: row.year as number,
    yearEnd: (row.year_end as number) ?? null,
    sortOrder: (row.sort_order as number) ?? 0,
    status: row.status as TimelineStatus,
    title: picked.title,
    subtitle: picked.subtitle,
    description: picked.description,
  };

  if (withTranslations) {
    entry.translations = {
      id: toTranslation(rows.find((t) => t.locale === "id")),
      en: toTranslation(rows.find((t) => t.locale === "en")),
    };
  }
  return entry;
}

/**
 * Selalu diurutkan menurut tahun naik, tidak bisa ditawar lewat query string.
 *
 * Pemilik proyek menyebutnya lugas: "order berdasarkan tahun". Garis waktu yang
 * bisa diurutkan sembarangan bukan garis waktu lagi. `sort_order` hanya jadi
 * pemutus seri untuk dua tonggak pada tahun yang sama.
 */
export async function list(
  supabase: SupabaseClient,
  locale: Locale,
  onlyPublished: boolean,
): Promise<TimelineEntry[]> {
  let builder = supabase.from("timeline_entry").select(SELECT);
  if (onlyPublished) builder = builder.eq("status", "published");

  const { data, error } = await builder
    .order("year", { ascending: true })
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);

  return ((data ?? []) as unknown as Row[]).map((r) => toEntry(r, locale, !onlyPublished));
}

export async function findById(
  supabase: SupabaseClient,
  id: string,
  locale: Locale,
): Promise<TimelineEntry | null> {
  const { data, error } = await supabase.from("timeline_entry").select(SELECT).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toEntry(data as unknown as Row, locale, true) : null;
}

function toRow(input: TimelinePatch): Row {
  const row: Row = {};
  if (input.year !== undefined) row.year = input.year;
  if (input.yearEnd !== undefined) row.year_end = input.yearEnd;
  if (input.sortOrder !== undefined) row.sort_order = input.sortOrder;
  if (input.status !== undefined) row.status = input.status;
  return row;
}

async function writeTranslations(
  supabase: SupabaseClient,
  entryId: string,
  input: TimelinePatch,
): Promise<void> {
  if (!input.translations) return;
  const rows = (["id", "en"] as const).map((locale) => ({
    entry_id: entryId,
    locale,
    title: input.translations![locale].title,
    subtitle: input.translations![locale].subtitle ?? null,
    description: input.translations![locale].description ?? null,
  }));
  const { error } = await supabase
    .from("timeline_entry_translation")
    .upsert(rows, { onConflict: "entry_id,locale" });
  if (error) throw new Error(error.message);
}

export async function create(supabase: SupabaseClient, input: TimelineInput): Promise<string> {
  const { data, error } = await supabase
    .from("timeline_entry")
    .insert(toRow(input))
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  const id = (data as unknown as Row).id as string;
  await writeTranslations(supabase, id, input);
  return id;
}

export async function update(
  supabase: SupabaseClient,
  id: string,
  input: TimelinePatch,
): Promise<void> {
  const row = toRow(input);
  if (Object.keys(row).length > 0) {
    const { error } = await supabase.from("timeline_entry").update(row).eq("id", id);
    if (error) throw new Error(error.message);
  }
  await writeTranslations(supabase, id, input);
}

export async function remove(supabase: SupabaseClient, id: string): Promise<void> {
  /* Terjemahannya ikut lewat ON DELETE CASCADE, bukan lewat rangkaian delete
     di sini yang bisa putus di tengah. */
  const { error } = await supabase.from("timeline_entry").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
