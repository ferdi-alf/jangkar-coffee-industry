/**
 * `image` menyimpan URL gambar, bukan teks.
 *
 * Nilainya tetap hidup di page_content_translation seperti medan lain, dan
 * KEDUA BAHASA sengaja diisi nilai yang sama karena URL gambar tidak
 * bergantung bahasa. Editor panel yang menjaga keduanya tetap sinkron dengan
 * hanya menampilkan satu pengunggah. Alasan lengkapnya di migrasi
 * 20260904_0100_content_image.sql.
 */
export type ContentKind = "text" | "longtext" | "list" | "image";

export interface ContentField {
  id: string;
  key: string;
  kind: ContentKind;
  sortOrder: number;
  values: Record<"id" | "en", string>;
}

export interface ContentSection {
  id: string;
  key: string;
  label: string;
  sortOrder: number;
  status: "draft" | "published";
  fields: ContentField[];
}

/**
 * Bentuk datar untuk situs publik: `"hero.headline"` -> nilainya dalam satu
 * bahasa. Dipakai RSC, jadi ia sengaja sedatar mungkin dan tidak membawa id
 * maupun metadata apa pun yang tidak akan dipakai merender.
 */
export type PublicContent = Record<string, string>;
