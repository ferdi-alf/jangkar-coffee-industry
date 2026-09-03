import type { ListQuery, ListMeta } from "../contracts/list.js";

/**
 * Membaca query daftar dari URL, dengan pagar yang dipasang di sini sekali
 * untuk semua modul.
 *
 * `perPage` DIBATASI 100. Tanpa batas, `?perPage=100000` adalah cara termudah
 * membuat satu permintaan menarik seluruh tabel dan menghabiskan memori server.
 * `sort` tidak diloloskan apa adanya ke SQL, tiap modul memberi daftar kolom
 * yang boleh diurutkan, jadi nama kolom sembarang tidak bisa disuntikkan.
 */
const MAX_PER_PAGE = 100;

export function parseListQuery(
  raw: Record<string, unknown>,
  allowedSort: readonly string[],
  defaultSort: string,
): ListQuery {
  const num = (v: unknown, fallback: number) => {
    const n = Number(Array.isArray(v) ? v[0] : v);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
  };
  const str = (v: unknown) => {
    const s = Array.isArray(v) ? v[0] : v;
    return typeof s === "string" && s.trim().length > 0 ? s.trim() : null;
  };

  const sort = str(raw.sort);
  const locale = str(raw.locale);
  const fields = str(raw.fields);

  return {
    page: num(raw.page, 1),
    perPage: Math.min(num(raw.perPage, 20), MAX_PER_PAGE),
    q: str(raw.q),
    sort: sort && allowedSort.includes(sort) ? sort : defaultSort,
    order: str(raw.order) === "asc" ? "asc" : "desc",
    locale: locale === "en" ? "en" : "id",
    fields: fields ? fields.split(",").map((f) => f.trim()).filter(Boolean) : null,
  };
}

export function listMeta(query: ListQuery, total: number): ListMeta {
  const totalPages = query.perPage > 0 ? Math.ceil(total / query.perPage) : 0;
  return {
    page: query.page,
    perPage: query.perPage,
    total,
    totalPages,
    hasNext: query.page < totalPages,
    hasPrev: query.page > 1,
  };
}

/** Rentang baris untuk `.range()` Supabase, yang inklusif di kedua ujungnya. */
export function range(query: ListQuery): [number, number] {
  const from = (query.page - 1) * query.perPage;
  return [from, from + query.perPage - 1];
}

/**
 * Menerjemahkan `fields` jadi daftar kolom select.
 *
 * Medan yang diminta klien disaring terhadap peta milik modulnya, jadi klien
 * tidak bisa meminta kolom yang tidak dimaksudkan untuk keluar, misalnya
 * `ip_hash` pada pesan kontak. Yang tidak dikenali diabaikan diam-diam, bukan
 * jadi galat, supaya klien lama tidak patah saat sebuah medan dihapus.
 */
export function selectFor(
  fields: string[] | null,
  map: Record<string, string>,
  always: string[],
): string {
  if (!fields) return [...new Set([...always, ...Object.values(map)])].join(", ");
  const picked = fields.map((f) => map[f]).filter((c): c is string => Boolean(c));
  return [...new Set([...always, ...picked])].join(", ");
}
