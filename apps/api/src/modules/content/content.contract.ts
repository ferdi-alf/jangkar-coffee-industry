export type ContentKind = "text" | "longtext" | "list";

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
