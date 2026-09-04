import "server-only";

import { OUTLET_MENU, type MenuCategory } from "@/modules/home/constants/menu-data";

/**
 * Menu outlet, dibaca dari basis data.
 *
 * SEBELUM INI IA KONSTANTA. `MenuSection` mengimpor `OUTLET_MENU` langsung dari
 * berkas kode, jadi menyunting harga di halaman /menu pada panel tidak pernah
 * berpengaruh apa pun terhadap situs. Itu kegagalan yang sama yang sudah dua
 * kali diperbaiki di proyek ini: panel yang mengelola data yang tidak dilihat
 * siapa pun, pertama armada Keliling lalu Outlet.
 *
 * BEDA PENTING DENGAN keliling-menu.ts. Menu keliling mengelompokkan dengan
 * aturan tampilan dua ember yang ditulis di kode, karena poster armadanya
 * memang membagi begitu dan satu kolom kategori tidak bisa melayani dua menu
 * yang mengelompokkan berbeda. Menu outlet TIDAK boleh begitu: ia memakai
 * kategori sungguhan beserta urutannya, sehingga mengganti nama kategori di
 * /category langsung mengubah judul kartu di situs.
 *
 * Karena itu ia mengambil DUA hal sekaligus: produk dan kategori. Nama kategori
 * hidup di `category_translation` dan tidak ikut di respons produk, yang hanya
 * membawa `categorySlug`.
 */
interface ApiProduct {
  sku: string;
  title: string;
  basePrice: number | null;
  priceNote: string | null;
  isSoldOut: boolean;
  sortOrder: number;
  categorySlug: string | null;
}

interface ApiCategory {
  slug: string;
  name: string;
  sortOrder: number;
  status: "draft" | "published" | "archived";
}

const API = process.env.API_ORIGIN ?? "http://localhost:4000";

/**
 * "8000" jadi "8k", sesuai cara menu cetaknya menulis harga.
 *
 * Aturannya SAMA PERSIS dengan keliling-menu.ts, dan kesamaan itu wajib: satu
 * item yang muncul di kedua menu harus terbaca dengan harga yang sama bentuknya.
 * `priceNote` dipakai apa adanya, sehingga "15k / 100gr" tetap utuh.
 */
function shortPrice(product: ApiProduct): string {
  if (product.priceNote) return product.priceNote;
  if (product.basePrice === null) return "";
  return product.basePrice % 1000 === 0
    ? `${product.basePrice / 1000}k`
    : `Rp ${product.basePrice.toLocaleString("id-ID")}`;
}

export async function getOutletMenu(locale: string): Promise<MenuCategory[]> {
  try {
    const [productRes, categoryRes] = await Promise.all([
      fetch(
        `${API}/products?channel=outlet&status=published&perPage=100&sort=sort_order&order=asc&locale=${locale}`,
        { next: { revalidate: 300 } },
      ),
      /* TANPA `status=published` di query, dan itu disengaja: berbeda dengan
         /products, endpoint /categories TIDAK mengenal saring status, jadi
         mengirimnya hanya akan terbaca seperti pagar yang sebenarnya tidak
         ada. Penyaringannya dikerjakan di bawah, terhadap medan `status` yang
         memang ikut di responsnya. */
      fetch(`${API}/categories?perPage=100&sort=sort_order&order=asc&locale=${locale}`, {
        next: { revalidate: 300 },
      }),
    ]);
    if (!productRes.ok) throw new Error(`produk HTTP ${productRes.status}`);
    if (!categoryRes.ok) throw new Error(`kategori HTTP ${categoryRes.status}`);

    const products = (await productRes.json()) as { success: boolean; data: ApiProduct[] };
    const categories = (await categoryRes.json()) as { success: boolean; data: ApiCategory[] };
    if (!products.success || products.data.length === 0) throw new Error("produk kosong");
    if (!categories.success || categories.data.length === 0) throw new Error("kategori kosong");

    /* Ember dibuat dari KATEGORI, dan urutannya urutan kategori. Membuatnya
       dari produk akan membuat urutan kartu mengikuti produk pertama yang
       kebetulan muncul, bukan urutan yang disusun pemilik di /category. */
    const groups = new Map<string, MenuCategory>();
    const published = categories.data.filter((category) => category.status === "published");
    for (const category of [...published].sort((a, b) => a.sortOrder - b.sortOrder)) {
      groups.set(category.slug, { id: category.slug, name: category.name, items: [] });
    }

    const orphans: string[] = [];
    for (const product of products.data) {
      const group = product.categorySlug ? groups.get(product.categorySlug) : undefined;
      if (!group) {
        orphans.push(product.sku);
        continue;
      }
      group.items.push({
        name: product.title,
        price: shortPrice(product),
        ...(product.isSoldOut ? { soldOut: true } : {}),
      });
    }

    /* Produk tanpa kategori TIDAK bisa ditempatkan di kartu mana pun, karena
       kartu itu sendiri adalah kategorinya. Membuat kartu "Lainnya" berarti
       mengarang judul yang tidak pernah ditulis siapa pun, jadi ia dilewati.
       Tapi dilewati DIAM-DIAM adalah cara paling pasti membuat pemilik bingung
       kenapa item barunya tidak muncul, maka SKU-nya disebut di log build, dan
       halaman /menu di panel menandainya dengan lencana "Tanpa kategori". */
    if (orphans.length > 0) {
      console.warn(
        `[menu] ${orphans.length} produk tidak punya kategori dan TIDAK tampil di menu situs: ${orphans.join(", ")}`,
      );
    }

    /* Kategori kosong dibuang, jadi kategori yang dibuat tapi belum diisi tidak
       meninggalkan kartu kosong di halaman. */
    return [...groups.values()].filter((group) => group.items.length > 0);
  } catch (error) {
    console.warn(
      "[menu] gagal membaca menu outlet dari API, memakai konstanta cadangan:",
      error instanceof Error ? error.message : error,
    );
    return OUTLET_MENU;
  }
}
