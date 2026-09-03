import "server-only";

import {
  ECOMMERCE_PRODUCTS,
  MARKETPLACES,
  type EcommerceProduct,
  type Marketplace,
} from "@/modules/home/constants/menu-data";

/**
 * Produk ecommerce untuk seksi Roastery, DIBACA DARI BASIS DATA.
 *
 * Inilah yang membuat panel admin punya akibat: tautan Shopee dan Tokopedia
 * yang Anda isi di /management-product langsung muncul sebagai tombol di situs,
 * tanpa siapa pun menyentuh kode.
 *
 * SELALU ADA CADANGAN, dan itu bukan kemalasan. Halaman ini dirender statis,
 * jadi pengambilannya terjadi SAAT BUILD. Kalau API sedang mati saat build
 * dijalankan, tanpa cadangan seluruh build gagal dan situs yang sudah tayang
 * tidak bisa dirilis ulang karena alasan yang tidak ada hubungannya dengan
 * kodenya. Dengan cadangan, yang terjadi paling buruk adalah kartu produk
 * kembali ke isi yang sama seperti sebelum basis data ada, dan tombolnya tidak
 * menavigasi. Kegagalannya dicatat ke konsol build supaya tidak lewat diam-diam.
 *
 * `revalidate: 300` menjadikannya ISR. Lima menit cukup cepat untuk perubahan
 * tautan toko, dan cukup lambat untuk tidak membebani API dengan permintaan
 * pada setiap kunjungan.
 */
interface ApiProduct {
  sku: string;
  title: string;
  basePrice: number | null;
  priceNote: string | null;
  image: string | null;
  marketplaceLinks: { marketplace: Marketplace; url: string }[];
}

/**
 * SISI SERVER, jadi ia butuh URL ABSOLUT dan tidak bisa memakai proksi `/api`
 * seperti peramban: pengambilan ini terjadi saat build, tanpa origin apa pun
 * untuk dijadikan acuan relatif. `API_ORIGIN` adalah variabel server yang sama
 * yang dipakai rewrite di next.config.ts.
 */
const API = process.env.API_ORIGIN ?? "http://localhost:4000";

function formatPrice(product: ApiProduct): string {
  if (product.priceNote) return product.priceNote;
  if (product.basePrice === null) return "";
  return `Rp ${product.basePrice.toLocaleString("id-ID")}`;
}

export async function getEcommerceProducts(locale: string): Promise<EcommerceProduct[]> {
  try {
    const res = await fetch(
      `${API}/products?ecommerce=true&status=published&perPage=12&sort=sort_order&order=asc&locale=${locale}`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const body = (await res.json()) as { success: boolean; data: ApiProduct[] };
    if (!body.success || body.data.length === 0) throw new Error("kosong");

    return body.data.map((product) => {
      const links: Partial<Record<Marketplace, string>> = {};
      for (const market of MARKETPLACES) {
        const found = product.marketplaceLinks.find((l) => l.marketplace === market);
        if (found) links[market] = found.url;
      }
      return {
        sku: product.sku,
        name: product.title,
        price: formatPrice(product),
        /* Gambar produk masih berkas lokal di public/. Kalau nanti dipindah ke
           Supabase Storage, image_path akan berisi URL penuh dan baris ini tidak
           perlu berubah. Cadangannya memakai gambar dari konstanta berdasarkan
           SKU, supaya kartu tidak pernah kosong hanya karena kolomnya belum diisi. */
        image:
          product.image ??
          ECOMMERCE_PRODUCTS.find((p) => p.sku === product.sku)?.image ??
          "/roastery/kopi-bubuk-200gr.webp",
        links,
      };
    });
  } catch (error) {
    console.warn(
      "[roastery] gagal membaca produk dari API, memakai konstanta cadangan:",
      error instanceof Error ? error.message : error,
    );
    return ECOMMERCE_PRODUCTS;
  }
}
