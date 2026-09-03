import type { Request } from "express";

/**
 * Membaca satu parameter rute sebagai string.
 *
 * Ada karena tipe Express 5 menyatakan `req.params.x` bisa berupa
 * `string | string[] | undefined`, dan itu benar: rute wildcard bisa
 * menghasilkan larik. Rute kita tidak, tapi menegaskannya dengan `as string`
 * di setiap controller berarti menyebar kebohongan kecil ke banyak tempat.
 * Satu fungsi ini yang menanganinya, dan ia mengembalikan string kosong untuk
 * hal yang mustahil, bukan melempar.
 */
export function param(req: Request, name: string): string {
  const value = (req.params as Record<string, string | string[] | undefined>)[name];
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? "";
  return "";
}
