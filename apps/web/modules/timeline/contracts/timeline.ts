/** Sepadan dengan apps/api/src/modules/timeline/timeline.contract.ts. */
export interface TimelineTranslation {
  title: string;
  subtitle: string | null;
  description: string | null;
}

export interface TimelineEntry {
  id: string;
  year: number;
  /** null berarti rentangnya masih berjalan; situs menutupnya dengan "kini". */
  yearEnd: number | null;
  sortOrder: number;
  status: "draft" | "published";
  title: string;
  subtitle: string | null;
  description: string | null;
  translations?: Record<"id" | "en", TimelineTranslation>;
}

export interface TimelinePayload {
  year: number;
  yearEnd: number | null;
  sortOrder: number;
  status: "draft" | "published";
  translations: Record<"id" | "en", TimelineTranslation>;
}

export const TIMELINE_ERROR: Record<string, string> = {
  "year.integer": "Tahun harus berupa angka bulat.",
  "year.tooEarly": "Tahun terlalu awal.",
  "year.tooLate": "Tahun terlalu jauh ke depan.",
  "yearEnd.beforeYear": "Tahun akhir tidak boleh sebelum tahun mulai.",
  "title.required": "Judul wajib diisi.",
  "title.tooLong": "Judul terlalu panjang.",
  "subtitle.tooLong": "Subjudul terlalu panjang.",
  "description.tooLong": "Deskripsi terlalu panjang.",
};
