import type { AllowedMime } from "./media.contract.js";

/**
 * Magic bytes per tipe, dan ini yang benar-benar menentukan, bukan header
 * Content-Type maupun ekstensi berkas.
 *
 * Aturan keamanan di PROJECT-SPEC menyebutnya eksplisit: periksa magic bytes.
 * Alasannya, keduanya yang lain dikendalikan sepenuhnya oleh pengunggah. Berkas
 * skrip yang dinamai `foto.png` dan dikirim dengan `Content-Type: image/png`
 * akan lolos pemeriksaan mana pun yang hanya membaca keduanya.
 */
export const MAGIC: Record<AllowedMime, (buf: Buffer) => boolean> = {
  "image/jpeg": (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/png": (b) =>
    b.length > 8 &&
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  // RIFF....WEBP
  "image/webp": (b) =>
    b.length > 12 && b.subarray(0, 4).toString("ascii") === "RIFF" &&
    b.subarray(8, 12).toString("ascii") === "WEBP",
  // ....ftypavif
  "image/avif": (b) =>
    b.length > 12 && b.subarray(4, 8).toString("ascii") === "ftyp" &&
    b.subarray(8, 12).toString("ascii").startsWith("avif"),
};

export const EXTENSION: Record<AllowedMime, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export const BUCKET = process.env.SUPABASE_MEDIA_BUCKET ?? "public-media";
