import type { SupabaseClient } from "@supabase/supabase-js";

import type { ListQuery, Locale } from "../../shared/contracts/list.js";
import { range } from "../../shared/utils/pagination.js";

import type {
  Channel,
  Marketplace,
  ProductDetail,
  ProductListItem,
  ProductStatus,
} from "./product.contract.js";
import type { ProductDetailPart } from "./product.constants.js";
import type { ProductInput, ProductPatch } from "./product.schema.js";

/**
 * SATU-SATUNYA lapisan modul ini yang menyentuh Supabase.
 *
 * Baris basis data memakai snake_case, contract memakai camelCase, dan
 * penerjemahannya terjadi HANYA di berkas ini. Kalau pemetaan itu bocor ke
 * service atau controller, mengganti nama kolom akan menyentuh empat berkas
 * alih-alih satu.
 */
type Row = Record<string, unknown>;

const LIST_COLUMNS =
  "id, sku, slug, base_price, price_note, image_path, status, is_ecommerce, " +
  "is_signature, is_favourite, is_sold_out, sort_order, category_id";

function toListItem(row: Row, locale: Locale): ProductListItem {
  const translations = (row.product_translation as Row[] | undefined) ?? [];
  const picked =
    translations.find((t) => t.locale === locale) ?? translations.find((t) => t.locale === "id");

  return {
    id: row.id as string,
    sku: row.sku as string,
    slug: row.slug as string,
    title: (picked?.title as string) ?? (row.sku as string),
    description: (picked?.description as string) ?? null,
    basePrice: (row.base_price as number) ?? null,
    priceNote: (row.price_note as string) ?? null,
    image: (row.image_path as string) ?? null,
    status: row.status as ProductStatus,
    isEcommerce: Boolean(row.is_ecommerce),
    isSignature: Boolean(row.is_signature),
    isFavourite: Boolean(row.is_favourite),
    isSoldOut: Boolean(row.is_sold_out),
    sortOrder: (row.sort_order as number) ?? 0,
    categoryId: (row.category_id as string) ?? null,
    categorySlug: ((row.category as Row | undefined)?.slug as string) ?? null,
    marketplaceLinks: ((row.product_marketplace_link as Row[] | undefined) ?? []).map((l) => ({
      marketplace: l.marketplace as Marketplace,
      url: l.url as string,
    })),
    channels: ((row.product_channel as Row[] | undefined) ?? []).map((c) => ({
      channel: c.channel as Channel,
      available: Boolean(c.available),
    })),
  };
}

export async function list(
  supabase: SupabaseClient,
  query: ListQuery,
  filters: {
    status?: ProductStatus;
    ecommerce?: boolean;
    categoryId?: string;
    channel?: Channel;
  },
): Promise<{ items: ProductListItem[]; total: number }> {
  /* `!inner` dipakai HANYA saat ada kata kunci, karena inner join akan membuang
     produk yang belum punya terjemahan di bahasa itu. Saat tidak mencari, kita
     justru ingin produk itu tetap terlihat di panel supaya terjemahannya yang
     hilang bisa ditemukan dan dilengkapi. */
  const joiner = query.q ? "product_translation!inner" : "product_translation";
  /* `!inner` pada kanal HANYA saat sedang menyaring kanal. Inner join membuang
     produk yang belum punya baris kanal sama sekali, dan di panel justru produk
     itulah yang perlu terlihat supaya kanalnya bisa dilengkapi. */
  const channelJoin = filters.channel ? "product_channel!inner" : "product_channel";
  let builder = supabase
    .from("product")
    .select(
      `${LIST_COLUMNS}, ${joiner}(locale, title, description), ` +
        `product_marketplace_link(marketplace, url), ${channelJoin}(channel, available), ` +
        `category(slug)`,
      { count: "exact" },
    );

  if (filters.channel) {
    builder = builder
      .eq("product_channel.channel", filters.channel)
      .eq("product_channel.available", true);
  }
  if (filters.status) builder = builder.eq("status", filters.status);
  if (filters.ecommerce !== undefined) builder = builder.eq("is_ecommerce", filters.ecommerce);
  if (filters.categoryId) builder = builder.eq("category_id", filters.categoryId);

  if (query.q) {
    builder = builder
      .eq("product_translation.locale", query.locale)
      .ilike("product_translation.title", `%${query.q}%`);
  }

  const [from, to] = range(query);
  const { data, error, count } = await builder
    .order(query.sort ?? "sort_order", { ascending: query.order === "asc" })
    .range(from, to);

  if (error) throw new Error(error.message);
  /* Lewat `unknown` dengan sengaja. String select-nya dirangkai saat runtime,
     jadi parser tipe supabase-js tidak bisa menyimpulkan bentuk hasilnya dan
     mengembalikan ParserError. Bentuk sebenarnya dijamin oleh toListItem, yang
     membaca tiap medan satu per satu dan memberi nilai cadangan. */
  const rows = (data ?? []) as unknown as Row[];
  return {
    items: rows.map((row) => toListItem(row, query.locale)),
    total: count ?? 0,
  };
}

export async function findById(
  supabase: SupabaseClient,
  id: string,
  locale: Locale,
  parts: ProductDetailPart[],
): Promise<ProductDetail | null> {
  /* Inilah tempat penghematan `?fields=` benar-benar terjadi. Bagian yang tidak
     diminta tidak masuk ke select, jadi Postgres tidak menjalankan join-nya. */
  /* Tautan marketplace selalu ikut, karena ia bagian dari bentuk daftar. Yang
     lain tetap opsional dan hanya diambil saat diminta lewat `?fields=`. */
  const pieces = [
    LIST_COLUMNS,
    "product_translation(locale, title, description)",
    "product_marketplace_link(marketplace, url)",
    "product_channel(channel, available)",
    "category(slug)",
  ];
  if (parts.includes("variants")) pieces.push("product_variant(id, label, price, sort_order)");
  if (parts.includes("audit")) pieces.push("created_at, updated_at");

  const { data, error } = await supabase
    .from("product")
    .select(pieces.join(", "))
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const row = data as unknown as Row;
  const detail: ProductDetail = toListItem(row, locale);

  if (parts.includes("translations")) {
    const rows = (row.product_translation as Row[] | undefined) ?? [];
    const empty = { title: "", description: null as string | null };
    detail.translations = {
      id: (rows.find((t) => t.locale === "id") as { title: string; description: string | null } | undefined) ?? empty,
      en: (rows.find((t) => t.locale === "en") as { title: string; description: string | null } | undefined) ?? empty,
    };
  }
  if (parts.includes("variants")) {
    detail.variants = ((row.product_variant as Row[] | undefined) ?? [])
      .map((v) => ({
        id: v.id as string,
        label: v.label as string,
        price: v.price as number,
        sortOrder: (v.sort_order as number) ?? 0,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }
  if (parts.includes("audit")) {
    detail.audit = { createdAt: row.created_at as string, updatedAt: row.updated_at as string };
  }
  return detail;
}

function toRow(input: ProductPatch): Row {
  const row: Row = {};
  if (input.sku !== undefined) row.sku = input.sku;
  if (input.slug !== undefined) row.slug = input.slug;
  if (input.categoryId !== undefined) row.category_id = input.categoryId;
  if (input.basePrice !== undefined) row.base_price = input.basePrice;
  if (input.priceNote !== undefined) row.price_note = input.priceNote;
  if (input.isSignature !== undefined) row.is_signature = input.isSignature;
  if (input.isFavourite !== undefined) row.is_favourite = input.isFavourite;
  if (input.isEcommerce !== undefined) row.is_ecommerce = input.isEcommerce;
  if (input.isSoldOut !== undefined) row.is_sold_out = input.isSoldOut;
  if (input.image !== undefined) row.image_path = input.image;
  if (input.sortOrder !== undefined) row.sort_order = input.sortOrder;
  if (input.status !== undefined) row.status = input.status;
  return row;
}

/**
 * Anak-anaknya ditulis dengan pola HAPUS LALU SISIPKAN, bukan diff per baris.
 *
 * Alasannya jumlahnya kecil dan terbatas: paling banyak dua tautan marketplace,
 * dua kanal, dan dua puluh varian. Melakukan diff pada himpunan sekecil itu
 * menambah banyak kode yang bisa salah tanpa menghemat apa pun yang terasa.
 */
async function writeChildren(
  supabase: SupabaseClient,
  productId: string,
  input: ProductPatch,
): Promise<void> {
  if (input.translations) {
    const rows = (["id", "en"] as const).map((locale) => ({
      product_id: productId,
      locale,
      title: input.translations![locale].title,
      description: input.translations![locale].description ?? null,
    }));
    const { error } = await supabase
      .from("product_translation")
      .upsert(rows, { onConflict: "product_id,locale" });
    if (error) throw new Error(error.message);
  }

  if (input.marketplaceLinks) {
    await supabase.from("product_marketplace_link").delete().eq("product_id", productId);
    if (input.marketplaceLinks.length > 0) {
      const { error } = await supabase.from("product_marketplace_link").insert(
        input.marketplaceLinks.map((l) => ({
          product_id: productId,
          marketplace: l.marketplace,
          url: l.url,
        })),
      );
      if (error) throw new Error(error.message);
    }
  }

  if (input.variants) {
    await supabase.from("product_variant").delete().eq("product_id", productId);
    if (input.variants.length > 0) {
      const { error } = await supabase.from("product_variant").insert(
        input.variants.map((v, i) => ({
          product_id: productId,
          label: v.label,
          price: v.price,
          sort_order: v.sortOrder ?? i,
        })),
      );
      if (error) throw new Error(error.message);
    }
  }

  if (input.channels) {
    const { error } = await supabase.from("product_channel").upsert(
      input.channels.map((c) => ({
        product_id: productId,
        channel: c.channel,
        available: c.available,
      })),
      { onConflict: "product_id,channel" },
    );
    if (error) throw new Error(error.message);
  }
}

export async function create(supabase: SupabaseClient, input: ProductInput): Promise<string> {
  const { data, error } = await supabase
    .from("product")
    .insert(toRow(input))
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const id = (data as unknown as Row).id as string;
  await writeChildren(supabase, id, input);
  return id;
}

export async function update(
  supabase: SupabaseClient,
  id: string,
  input: ProductPatch,
): Promise<boolean> {
  const row = toRow(input);
  if (Object.keys(row).length > 0) {
    const { error } = await supabase.from("product").update(row).eq("id", id);
    if (error) throw new Error(error.message);
  }
  await writeChildren(supabase, id, input);
  return true;
}

export async function remove(supabase: SupabaseClient, id: string): Promise<void> {
  /* Anak-anaknya ikut terhapus lewat ON DELETE CASCADE di migrasi, bukan lewat
     rangkaian delete di sini yang bisa putus di tengah jalan. */
  const { error } = await supabase.from("product").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
