export interface MediaItem {
  id: string;
  bucket: string;
  path: string;
  url: string;
  mime: string;
  bytes: number;
  width: number | null;
  height: number | null;
  createdAt: string;
  alt: Record<"id" | "en", string>;
}

/** Tipe yang diizinkan naik. Daftar putih, bukan daftar hitam. */
export const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
export type AllowedMime = (typeof ALLOWED_MIME)[number];

/**
 * 4 MB, BUKAN 5, dan angkanya ditentukan platform bukan selera.
 *
 * Batas body permintaan Vercel Functions adalah 4,5 MB. Berkas di atas itu
 * ditolak Vercel dengan 413 FUNCTION_PAYLOAD_TOO_LARGE SEBELUM kode ini
 * dijalankan, jadi pengguna mendapat halaman galat Vercel, bukan amplop
 * FILE_TOO_LARGE kita yang rapi dan dua bahasa. 4 MB memberi ruang untuk
 * overhead multipart dan header.
 *
 * Nilai ini harus SAMA dengan yang di apps/web/modules/media/hooks/useMedia.ts.
 * Kalau berbeda, pengguna lolos validasi di peramban lalu ditolak di server.
 */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
