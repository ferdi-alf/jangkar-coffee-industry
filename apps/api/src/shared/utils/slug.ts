import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Slug dibuat dari judul, bukan diketik tangan.
 *
 * ATURAN YANG MENENTUKAN: slug hanya dibuat SAAT MEMBUAT, tidak pernah dihitung
 * ulang saat judul berubah. Slug adalah identitas, bukan cerminan judul.
 *
 * Ini bukan selera. `category.slug` dipakai sebagai ATURAN TAMPILAN di
 * apps/web/modules/home/lib/keliling-menu.ts: item berkategori `non-coffee`
 * masuk kelompok Non-Coffee, sisanya Coffee. Kalau slug ikut berubah setiap
 * kali nama kategori disunting, mengganti "Non-Coffee" menjadi "Tanpa Kopi"
 * akan memindahkan empat item ke kelompok yang salah tanpa satu pun pesan
 * galat. Kegagalan diam adalah kegagalan terburuk, jadi slug dikunci.
 */

/** Rentang tanda diakritik Unicode yang tersisa setelah normalisasi NFD. */
const COMBINING_MARKS = /[\u0300-\u036f]/g;

/**
 * Ubah teks bebas menjadi slug yang lolos CHECK `^[a-z0-9-]+$` di basis data.
 *
 * NFD lalu buang tanda diakritik: "Kopi Susu Jangkar" dengan aksen menjadi
 * "kopi-susu-jangkar", bukan "kopi-susu-jangk-r". Tanpa langkah itu setiap
 * huruf beraksen berubah jadi tanda hubung dan slugnya berlubang.
 */
export function slugify(input: string): string {
  const slug = input
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, ""); // slice bisa memotong tepat di tanda hubung

  /* Judul yang seluruhnya di luar aksara latin, misalnya hanya emoji, akan
     menyisakan string kosong dan itu ditolak CHECK dengan galat yang tidak bisa
     dibaca pemakai panel. Beri dasar yang pasti sah; uniqueSlug di bawah yang
     menambahkan angka pembedanya. */
  return slug || "item";
}

/**
 * Slug yang bebas dipakai pada satu tabel, dengan akhiran angka kalau perlu.
 *
 * "Americano" dua kali menghasilkan `americano` lalu `americano-2`. Batas 50
 * percobaan ada supaya kesalahan tak terduga tidak berubah jadi lingkaran tak
 * berujung yang menahan satu permintaan HTTP selamanya.
 */
export async function uniqueSlug(
  supabase: SupabaseClient,
  table: "product" | "category" | "outlet",
  base: string,
): Promise<string> {
  const root = slugify(base);

  for (let attempt = 1; attempt <= 50; attempt += 1) {
    const candidate = attempt === 1 ? root : `${root.slice(0, 76)}-${attempt}`;

    const { data, error } = await supabase
      .from(table)
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    /* Galat baca DIBIARKAN NAIK, tidak diperlakukan sebagai "slug bebas".
       Menganggap kueri gagal sebagai tanda aman menghasilkan INSERT yang
       menabrak batasan unik, dan galatnya muncul jauh dari sebabnya. */
    if (error) throw error;
    if (!data) return candidate;
  }

  /* Praktis tidak tercapai, tapi akhiran acak lebih baik daripada melempar
     galat kepada pemakai yang hanya ingin menambah satu produk. */
  return `${root.slice(0, 70)}-${Date.now().toString(36)}`;
}
