import type { ApiFailure, ApiList, ApiSuccess } from "@/shared/contracts/api";

/**
 * Klien API panel admin.
 *
 * TIGA HAL YANG DIURUS DI SINI, dan tidak di tempat lain:
 *
 *   1. `credentials: "include"`. Sesi ada di cookie httpOnly, jadi tanpa ini
 *      setiap permintaan terkirim tanpa sesi dan seluruh panel terlihat seperti
 *      belum masuk.
 *   2. TOKEN CSRF untuk setiap mutasi. Diambil sekali lalu disimpan di memori
 *      modul, bukan diambil ulang tiap kali. Ia dicabut dan diambil lagi hanya
 *      kalau server menolaknya, jadi lalu lintasnya satu permintaan tambahan
 *      per sesi, bukan satu per klik.
 *   3. GALAT DIUBAH JADI EXCEPTION bertipe. TanStack Query memperlakukan promise
 *      yang resolve sebagai sukses, jadi respons 4xx yang dikembalikan begitu
 *      saja akan tampil sebagai data yang berhasil dimuat.
 *
 * Token CSRF disimpan di variabel modul, BUKAN localStorage. Ia berumur pendek
 * dan tidak perlu bertahan melewati muat ulang halaman.
 */
/**
 * SELALU SAME-ORIGIN. Peramban tidak pernah bicara langsung ke apps/api, ia
 * bicara ke `/api` pada origin situs, dan Next yang meneruskannya. Itu yang
 * membuat cookie sesi selalu first-party dan menghapus CORS sepenuhnya.
 * Alasan lengkapnya di apps/web/next.config.ts.
 */
const BASE = "/api";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details: { field: string; message: string }[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let csrfToken: string | null = null;

async function fetchCsrf(): Promise<string> {
  const res = await fetch(`${BASE}/csrf`, { credentials: "include" });
  if (!res.ok) throw new ApiError(res.status, "CSRF_UNAVAILABLE", "Gagal menyiapkan token keamanan.");
  const body = (await res.json()) as ApiSuccess<{ token: string }>;
  csrfToken = body.data.token;
  return csrfToken;
}

type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

async function call<T>(path: string, method: Method, body?: unknown, retry = true): Promise<T> {
  const headers: Record<string, string> = {};
  const mutating = method !== "GET";

  if (mutating) headers["X-CSRF-Token"] = csrfToken ?? (await fetchCsrf());

  const isFormData = body instanceof FormData;
  if (body !== undefined && !isFormData) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: "include",
    headers,
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  });

  if (res.ok) return (await res.json()) as T;

  const failure = (await res.json().catch(() => null)) as ApiFailure | null;
  const code = failure?.error.code ?? "UNKNOWN";

  /* Token CSRF punya masa berlaku dua jam. Kalau ia kedaluwarsa di tengah sesi
     panjang, sekali coba ulang dengan token baru jauh lebih baik daripada
     memaksa pengguna kehilangan isian formnya. Hanya SEKALI, supaya token yang
     memang selalu ditolak tidak jadi lingkaran tak berujung. */
  if (res.status === 403 && code === "CSRF_INVALID" && retry) {
    csrfToken = null;
    return call<T>(path, method, body, false);
  }

  throw new ApiError(
    res.status,
    code,
    failure?.error.message ?? "Terjadi galat yang tidak diketahui.",
    failure?.error.details ?? [],
  );
}

export const api = {
  get: <T>(path: string) => call<ApiSuccess<T>>(path, "GET").then((r) => r.data),
  list: <T>(path: string) => call<ApiList<T>>(path, "GET"),
  post: <T>(path: string, body?: unknown) => call<ApiSuccess<T>>(path, "POST", body).then((r) => r.data),
  patch: <T>(path: string, body?: unknown) => call<ApiSuccess<T>>(path, "PATCH", body).then((r) => r.data),
  remove: <T>(path: string) => call<ApiSuccess<T>>(path, "DELETE").then((r) => r.data),
};

/**
 * Merangkai query daftar sesuai contract: page, perPage, q, sort, order,
 * locale, fields. Nilai kosong dibuang, jadi URL-nya tidak penuh parameter
 * bernilai undefined dan kunci cache TanStack tetap stabil.
 */
export function listQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}
