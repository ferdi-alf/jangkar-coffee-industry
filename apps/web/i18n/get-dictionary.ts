import "server-only";

import type { Locale } from "./config";
import type { Dictionary } from "./dictionaries/id";

/**
 * Pemuat kamus, HANYA di server.
 *
 * `server-only` bukan hiasan: ia membuat build gagal kalau berkas ini pernah
 * terseret ke bundle klien. Itu yang menjamin kedua kamus tidak pernah dikirim
 * ke peramban, sehingga i18n ini benar-benar nol byte di sisi klien.
 *
 * Impor dinamis di dalam peta, bukan impor statis keduanya, supaya hanya kamus
 * yang dipakai yang ikut dievaluasi.
 */
const dictionaries: Record<Locale, () => Promise<{ default: Dictionary }>> = {
  id: () => import("./dictionaries/id"),
  en: () => import("./dictionaries/en"),
};

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return (await dictionaries[locale]()).default;
}
