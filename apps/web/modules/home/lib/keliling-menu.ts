import "server-only";

import { KELILING_MENU, type MenuCategory } from "@/modules/home/constants/menu-data";

/**
 * Menu armada Keliling, DIBACA DARI BASIS DATA.
 *
 * Inilah yang membuat halaman /keliling di panel punya akibat. Sebelumnya
 * seksi ini membaca konstanta, sementara panel mengurus unit armada dan jadwal
 * titik singgah yang tidak pernah ditampilkan situs sama sekali. Pemilik proyek
 * menunjuk ketimpangan itu, dan ini sisi situs dari perbaikannya.
 *
 * PENGELOMPOKAN DUA KATEGORI DIPERTAHANKAN LEWAT ATURAN TAMPILAN, bukan
 * perubahan skema, dan alasannya struktural: poster keliling aslinya membagi
 * menunya jadi Coffee dan Non-Coffee, sedangkan di basis data tiap produk hanya
 * punya SATU kategori yang mengikuti menu outlet. "Kopi Susu Jangkar" ada di
 * Signature Series di sana, bukan di Coffee. Satu kolom kategori tidak bisa
 * melayani dua menu yang mengelompokkan berbeda, dan menambah kategori per
 * kanal ke skema jauh lebih mahal daripada masalah yang dipecahkannya.
 *
 * Aturannya: item berkategori `non-coffee` masuk Non-Coffee, sisanya Coffee.
 * Diperiksa terhadap data yang ada, hasilnya sama persis dengan poster aslinya,
 * enam kopi dan empat non-kopi.
 *
 * SELALU ADA CADANGAN. Halaman ini dirender statis, jadi pengambilannya terjadi
 * saat build. Tanpa cadangan, API yang sedang mati saat build berarti seluruh
 * build gagal dan situs yang sudah tayang tidak bisa dirilis ulang karena alasan
 * yang tidak ada hubungannya dengan kodenya. Pola yang sama dipakai seksi
 * Roastery.
 */
interface ApiProduct {
  sku: string;
  title: string;
  basePrice: number | null;
  priceNote: string | null;
  isFavourite: boolean;
  isSoldOut: boolean;
  sortOrder: number;
  categorySlug: string | null;
}

/**
 * SISI SERVER, jadi ia butuh URL ABSOLUT dan tidak bisa memakai proksi `/api`
 * seperti peramban: pengambilan ini terjadi saat build, tanpa origin apa pun
 * untuk dijadikan acuan relatif. `API_ORIGIN` adalah variabel server yang sama
 * yang dipakai rewrite di next.config.ts.
 */
const API = process.env.API_ORIGIN ?? "http://localhost:4000";

/** "8000" -> "8k", sesuai cara menu cetaknya menulis harga. */
function shortPrice(product: ApiProduct): string {
  if (product.priceNote) return product.priceNote;
  if (product.basePrice === null) return "";
  return product.basePrice % 1000 === 0
    ? `${product.basePrice / 1000}k`
    : `Rp ${product.basePrice.toLocaleString("id-ID")}`;
}

export async function getKelilingMenu(locale: string): Promise<MenuCategory[]> {
  try {
    const res = await fetch(
      `${API}/products?channel=keliling&status=published&perPage=100&sort=sort_order&order=asc&locale=${locale}`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const body = (await res.json()) as { success: boolean; data: ApiProduct[] };
    if (!body.success || body.data.length === 0) throw new Error("kosong");

    const groups: MenuCategory[] = [
      { id: "coffee", name: "Coffee", items: [] },
      { id: "non-coffee", name: "Non-Coffee", items: [] },
    ];

    for (const product of body.data) {
      const target = product.categorySlug === "non-coffee" ? groups[1] : groups[0];
      target.items.push({
        name: product.title,
        price: shortPrice(product),
        ...(product.isFavourite ? { favourite: true } : {}),
        ...(product.isSoldOut ? { soldOut: true } : {}),
      });
    }

    /* Kelompok kosong dibuang, jadi mematikan seluruh item non-kopi di panel
       membuat judul kelompoknya ikut hilang, bukan menyisakan judul menggantung
       tanpa isi. */
    return groups.filter((group) => group.items.length > 0);
  } catch (error) {
    console.warn(
      "[keliling] gagal membaca menu dari API, memakai konstanta cadangan:",
      error instanceof Error ? error.message : error,
    );
    return KELILING_MENU;
  }
}
