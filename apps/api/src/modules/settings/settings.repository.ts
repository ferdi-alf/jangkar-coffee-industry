import type { SupabaseClient } from "@supabase/supabase-js";

import type { Locale } from "../../shared/contracts/list.js";

import type {
  ContactSettings,
  PublicSettings,
  SeoSettings,
  SeoTranslation,
  SocialLink,
  SocialPlatform,
} from "./settings.contract.js";
import type { ContactPatch, SeoPatch, SocialInput, SocialPatch } from "./settings.schema.js";

/** Satu-satunya lapisan modul ini yang menyentuh Supabase. */
type Row = Record<string, unknown>;

const SEO_COLUMNS =
  "id, site_url, organization_name, og_image_url, logo_url, favicon_url, " +
  "twitter_handle, theme_color, robots_index";

const CONTACT_COLUMNS =
  "id, phone, phone_href, whatsapp, email, address, maps_query, site_label, site_url";

const EMPTY_TRANSLATION: SeoTranslation = {
  title: "",
  description: "",
  keywords: "",
  ogTitle: null,
  ogDescription: null,
};

function toSeoTranslation(row: Row | undefined): SeoTranslation {
  if (!row) return { ...EMPTY_TRANSLATION };
  return {
    title: (row.title as string) ?? "",
    description: (row.description as string) ?? "",
    keywords: (row.keywords as string) ?? "",
    ogTitle: (row.og_title as string) ?? null,
    ogDescription: (row.og_description as string) ?? null,
  };
}

function toSeo(row: Row): SeoSettings {
  const translations = (row.site_seo_translation as Row[] | undefined) ?? [];
  return {
    siteUrl: (row.site_url as string) ?? null,
    organizationName: (row.organization_name as string) ?? null,
    ogImageUrl: (row.og_image_url as string) ?? null,
    logoUrl: (row.logo_url as string) ?? null,
    faviconUrl: (row.favicon_url as string) ?? null,
    twitterHandle: (row.twitter_handle as string) ?? null,
    themeColor: (row.theme_color as string) ?? "#FBFAF8",
    robotsIndex: Boolean(row.robots_index),
    translations: {
      id: toSeoTranslation(translations.find((t) => t.locale === "id")),
      en: toSeoTranslation(translations.find((t) => t.locale === "en")),
    },
  };
}

function toContact(row: Row | null): ContactSettings {
  return {
    phone: (row?.phone as string) ?? null,
    phoneHref: (row?.phone_href as string) ?? null,
    whatsapp: (row?.whatsapp as string) ?? null,
    email: (row?.email as string) ?? null,
    address: (row?.address as string) ?? null,
    mapsQuery: (row?.maps_query as string) ?? null,
    siteLabel: (row?.site_label as string) ?? null,
    siteUrl: (row?.site_url as string) ?? null,
  };
}

function toSocial(row: Row): SocialLink {
  return {
    id: row.id as string,
    platform: row.platform as SocialPlatform,
    url: row.url as string,
    label: (row.label as string) ?? null,
    sortOrder: (row.sort_order as number) ?? 0,
    isActive: Boolean(row.is_active),
  };
}

/* -------------------------------------------------------------------------- */
/* SEO                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Baris setelan dibuat kalau belum ada, bukan dilaporkan sebagai 404.
 *
 * Migrasi memang sudah menyisipkan satu baris, tapi mengandalkan itu berarti
 * seluruh halaman SEO mati kalau seseorang pernah menghapusnya secara manual.
 * Kolomnya semua punya default, jadi menciptakannya kembali selalu aman.
 */
async function seoRowId(supabase: SupabaseClient): Promise<string> {
  const { data, error } = await supabase
    .from("site_seo")
    .select("id")
    .eq("singleton", "default")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (data) return (data as unknown as Row).id as string;

  const created = await supabase
    .from("site_seo")
    .insert({ singleton: "default" })
    .select("id")
    .single();
  if (created.error) throw new Error(created.error.message);
  return (created.data as unknown as Row).id as string;
}

export async function findSeo(supabase: SupabaseClient): Promise<SeoSettings> {
  const id = await seoRowId(supabase);
  const { data, error } = await supabase
    .from("site_seo")
    .select(
      `${SEO_COLUMNS}, site_seo_translation(locale, title, description, keywords, og_title, og_description)`,
    )
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return toSeo(data as unknown as Row);
}

export async function writeSeo(supabase: SupabaseClient, input: SeoPatch): Promise<void> {
  const id = await seoRowId(supabase);

  const row: Row = {};
  if (input.siteUrl !== undefined) row.site_url = input.siteUrl;
  if (input.organizationName !== undefined) row.organization_name = input.organizationName;
  if (input.ogImageUrl !== undefined) row.og_image_url = input.ogImageUrl;
  if (input.logoUrl !== undefined) row.logo_url = input.logoUrl;
  if (input.faviconUrl !== undefined) row.favicon_url = input.faviconUrl;
  if (input.twitterHandle !== undefined) row.twitter_handle = input.twitterHandle;
  if (input.themeColor !== undefined) row.theme_color = input.themeColor;
  if (input.robotsIndex !== undefined) row.robots_index = input.robotsIndex;

  if (Object.keys(row).length > 0) {
    const { error } = await supabase.from("site_seo").update(row).eq("id", id);
    if (error) throw new Error(error.message);
  }

  if (input.translations) {
    const rows = (["id", "en"] as const).map((locale) => ({
      seo_id: id,
      locale,
      title: input.translations![locale].title,
      description: input.translations![locale].description,
      keywords: input.translations![locale].keywords ?? "",
      og_title: input.translations![locale].ogTitle ?? null,
      og_description: input.translations![locale].ogDescription ?? null,
    }));
    const { error } = await supabase
      .from("site_seo_translation")
      .upsert(rows, { onConflict: "seo_id,locale" });
    if (error) throw new Error(error.message);
  }
}

/* -------------------------------------------------------------------------- */
/* Kontak                                                                     */
/* -------------------------------------------------------------------------- */

async function contactRowId(supabase: SupabaseClient): Promise<string> {
  const { data, error } = await supabase
    .from("site_contact")
    .select("id")
    .eq("singleton", "default")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (data) return (data as unknown as Row).id as string;

  const created = await supabase
    .from("site_contact")
    .insert({ singleton: "default" })
    .select("id")
    .single();
  if (created.error) throw new Error(created.error.message);
  return (created.data as unknown as Row).id as string;
}

export async function findContact(supabase: SupabaseClient): Promise<ContactSettings> {
  const id = await contactRowId(supabase);
  const { data, error } = await supabase
    .from("site_contact")
    .select(CONTACT_COLUMNS)
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return toContact(data as unknown as Row);
}

export async function writeContact(supabase: SupabaseClient, input: ContactPatch): Promise<void> {
  const id = await contactRowId(supabase);

  const row: Row = {};
  if (input.phone !== undefined) row.phone = input.phone;
  if (input.phoneHref !== undefined) row.phone_href = input.phoneHref;
  if (input.whatsapp !== undefined) row.whatsapp = input.whatsapp;
  if (input.email !== undefined) row.email = input.email;
  if (input.address !== undefined) row.address = input.address;
  if (input.mapsQuery !== undefined) row.maps_query = input.mapsQuery;
  if (input.siteLabel !== undefined) row.site_label = input.siteLabel;
  if (input.siteUrl !== undefined) row.site_url = input.siteUrl;
  if (Object.keys(row).length === 0) return;

  const { error } = await supabase.from("site_contact").update(row).eq("id", id);
  if (error) throw new Error(error.message);
}

/* -------------------------------------------------------------------------- */
/* Tautan sosial                                                              */
/* -------------------------------------------------------------------------- */

export async function listSocial(supabase: SupabaseClient): Promise<SocialLink[]> {
  const { data, error } = await supabase
    .from("site_social_link")
    .select("id, platform, url, label, sort_order, is_active")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as Row[]).map(toSocial);
}

export async function findSocial(
  supabase: SupabaseClient,
  id: string,
): Promise<SocialLink | null> {
  const { data, error } = await supabase
    .from("site_social_link")
    .select("id, platform, url, label, sort_order, is_active")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toSocial(data as unknown as Row) : null;
}

function socialRow(input: SocialPatch): Row {
  const row: Row = {};
  if (input.platform !== undefined) row.platform = input.platform;
  if (input.url !== undefined) row.url = input.url;
  if (input.label !== undefined) row.label = input.label;
  if (input.sortOrder !== undefined) row.sort_order = input.sortOrder;
  if (input.isActive !== undefined) row.is_active = input.isActive;
  return row;
}

export async function createSocial(
  supabase: SupabaseClient,
  input: SocialInput,
): Promise<string> {
  const { data, error } = await supabase
    .from("site_social_link")
    .insert(socialRow(input))
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return (data as unknown as Row).id as string;
}

export async function updateSocial(
  supabase: SupabaseClient,
  id: string,
  input: SocialPatch,
): Promise<void> {
  const row = socialRow(input);
  if (Object.keys(row).length === 0) return;
  const { error } = await supabase.from("site_social_link").update(row).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function removeSocial(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("site_social_link").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* -------------------------------------------------------------------------- */
/* Bentuk publik                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Satu panggilan untuk situs publik.
 *
 * Terjemahan yang kosong JATUH KE BAHASA INDONESIA, bukan dibiarkan kosong.
 * Judul halaman yang kosong jauh lebih merusak daripada judul berbahasa
 * Indonesia di halaman Inggris, dan pola cadangan yang sama sudah dipakai
 * content.repository.ts.
 */
export async function publicSettings(
  supabase: SupabaseClient,
  locale: Locale,
): Promise<PublicSettings> {
  const [seo, contact, social] = await Promise.all([
    findSeo(supabase),
    findContact(supabase),
    listSocial(supabase),
  ]);

  const wanted = seo.translations[locale];
  const fallback = seo.translations.id;
  const pick = (a: string, b: string) => (a.trim() ? a : b);

  return {
    seo: {
      title: pick(wanted.title, fallback.title),
      description: pick(wanted.description, fallback.description),
      keywords: pick(wanted.keywords, fallback.keywords),
      ogTitle: wanted.ogTitle ?? fallback.ogTitle,
      ogDescription: wanted.ogDescription ?? fallback.ogDescription,
      siteUrl: seo.siteUrl,
      organizationName: seo.organizationName,
      ogImageUrl: seo.ogImageUrl,
      logoUrl: seo.logoUrl,
      faviconUrl: seo.faviconUrl,
      twitterHandle: seo.twitterHandle,
      themeColor: seo.themeColor,
      robotsIndex: seo.robotsIndex,
    },
    contact,
    social: social
      .filter((link) => link.isActive)
      .map((link) => ({ platform: link.platform, url: link.url, label: link.label })),
  };
}
