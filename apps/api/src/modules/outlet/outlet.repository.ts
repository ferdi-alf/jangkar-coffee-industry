import type { SupabaseClient } from "@supabase/supabase-js";

import type { ListQuery, Locale } from "../../shared/contracts/list.js";
import { range } from "../../shared/utils/pagination.js";

import type { OutletItem, OutletStatus } from "./outlet.contract.js";
import type { OutletInput, OutletPatch } from "./outlet.schema.js";

type Row = Record<string, unknown>;
type Tr = { label: string; hours: string | null; summary: string | null };

const COLUMNS =
  "id, slug, name, address, phone, phone_href, whatsapp, maps_query, lat, lng, " +
  "coords_approximate, is_headquarters, sort_order, status";

function toItem(row: Row, locale: Locale, withTranslations: boolean): OutletItem {
  const rows = (row.outlet_translation as Row[] | undefined) ?? [];
  const picked = rows.find((t) => t.locale === locale) ?? rows.find((t) => t.locale === "id");
  const empty: Tr = { label: "", hours: null, summary: null };

  const item: OutletItem = {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    label: (picked?.label as string) ?? (row.name as string),
    address: row.address as string,
    phone: (row.phone as string) ?? null,
    phoneHref: (row.phone_href as string) ?? null,
    whatsapp: (row.whatsapp as string) ?? null,
    mapsQuery: row.maps_query as string,
    lat: (row.lat as number) ?? null,
    lng: (row.lng as number) ?? null,
    coordsApproximate: row.coords_approximate !== false,
    isHeadquarters: Boolean(row.is_headquarters),
    hours: (picked?.hours as string) ?? null,
    summary: (picked?.summary as string) ?? null,
    sortOrder: (row.sort_order as number) ?? 0,
    status: row.status as OutletStatus,
  };
  if (withTranslations) {
    item.translations = {
      id: (rows.find((t) => t.locale === "id") as Tr | undefined) ?? empty,
      en: (rows.find((t) => t.locale === "en") as Tr | undefined) ?? empty,
    };
  }
  return item;
}

export async function list(
  supabase: SupabaseClient,
  query: ListQuery,
  filters: { status?: OutletStatus },
): Promise<{ items: OutletItem[]; total: number }> {
  let builder = supabase
    .from("outlet")
    .select(`${COLUMNS}, outlet_translation(locale, label, hours, summary)`, { count: "exact" });

  if (filters.status) builder = builder.eq("status", filters.status);
  if (query.q) builder = builder.or(`name.ilike.%${query.q}%,address.ilike.%${query.q}%`);

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
): Promise<OutletItem | null> {
  const { data, error } = await supabase
    .from("outlet")
    .select(`${COLUMNS}, outlet_translation(locale, label, hours, summary)`)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return toItem(data as unknown as Row, locale, true);
}

function toRow(input: OutletPatch): Row {
  const row: Row = {};
  if (input.slug !== undefined) row.slug = input.slug;
  if (input.name !== undefined) row.name = input.name;
  if (input.address !== undefined) row.address = input.address;
  if (input.phone !== undefined) row.phone = input.phone;
  if (input.phoneHref !== undefined) row.phone_href = input.phoneHref;
  if (input.whatsapp !== undefined) row.whatsapp = input.whatsapp;
  if (input.mapsQuery !== undefined) row.maps_query = input.mapsQuery;
  if (input.lat !== undefined) row.lat = input.lat;
  if (input.lng !== undefined) row.lng = input.lng;
  if (input.coordsApproximate !== undefined) row.coords_approximate = input.coordsApproximate;
  if (input.isHeadquarters !== undefined) row.is_headquarters = input.isHeadquarters;
  if (input.sortOrder !== undefined) row.sort_order = input.sortOrder;
  if (input.status !== undefined) row.status = input.status;
  return row;
}

async function writeTranslations(
  supabase: SupabaseClient,
  outletId: string,
  input: OutletPatch,
): Promise<void> {
  if (!input.translations) return;
  const rows = (["id", "en"] as const).map((locale) => ({
    outlet_id: outletId,
    locale,
    label: input.translations![locale].label,
    hours: input.translations![locale].hours ?? null,
    summary: input.translations![locale].summary ?? null,
  }));
  const { error } = await supabase
    .from("outlet_translation")
    .upsert(rows, { onConflict: "outlet_id,locale" });
  if (error) throw new Error(error.message);
}

export async function create(supabase: SupabaseClient, input: OutletInput): Promise<string> {
  const { data, error } = await supabase.from("outlet").insert(toRow(input)).select("id").single();
  if (error) throw new Error(error.message);
  const id = (data as unknown as Row).id as string;
  await writeTranslations(supabase, id, input);
  return id;
}

export async function update(supabase: SupabaseClient, id: string, input: OutletPatch): Promise<void> {
  const row = toRow(input);
  if (Object.keys(row).length > 0) {
    const { error } = await supabase.from("outlet").update(row).eq("id", id);
    if (error) throw new Error(error.message);
  }
  await writeTranslations(supabase, id, input);
}

export async function remove(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("outlet").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
