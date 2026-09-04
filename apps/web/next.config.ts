import type { NextConfig } from "next";

/**
 * Dua hal, dan keduanya menentukan apakah produksi hidup atau mati.
 *
 * 1. REWRITE /api KE EXPRESS.
 *
 * Peramban tidak pernah memanggil apps/api langsung. Ia memanggil `/api/...`
 * pada origin situs, dan berkas inilah yang meneruskannya. Karena itu tidak ada
 * NEXT_PUBLIC_API_URL di kode mana pun.
 *
 * Alasannya bukan kerapian. Cookie sesi panel adalah httpOnly SameSite=Lax, dan
 * dua proyek Vercel mendapat domain a.vercel.app dan b.vercel.app. Terverifikasi:
 * vercel.app ada di Public Suffix List, jadi kedua subdomain itu LINTAS SITE dan
 * peramban tidak akan pernah mengirim cookie Lax ke sana. Tanpa proksi ini panel
 * admin mustahil dimasuki di domain bawaan Vercel maupun di preview deployment.
 * Sebagai bonus, CORS lenyap sepenuhnya.
 *
 * 2. REMOTE PATTERNS UNTUK SUPABASE STORAGE.
 *
 * Gambar produk ecommerce diunggah pemilik lewat panel dan disimpan di bucket
 * `public-media`, jadi `product.image_path` berisi URL penuh ke host Supabase,
 * bukan lagi jalur statis di public/. RoasterySection merender nilai itu lewat
 * next/image, dan next/image MENOLAK host yang tidak terdaftar dengan melempar
 * galat, bukan sekadar menampilkan gambar rusak. Tanpa blok di bawah, seksi
 * Roastery mati total begitu satu gambar diunggah.
 *
 * Polanya sengaja sempit: hanya jalur objek PUBLIK. Jalur storage lain, termasuk
 * endpoint bertanda tangan dan endpoint unggah, tetap di luar daftar.
 */
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  async rewrites() {
    const origin = process.env.API_ORIGIN;
    if (!origin) {
      if (process.env.NODE_ENV === "production") {
        console.warn(
          "[next.config] API_ORIGIN belum diisi. Seluruh panggilan /api akan 404 " +
            "dan panel admin tidak bisa dipakai.",
        );
      }
      return [];
    }
    return [{ source: "/api/:path*", destination: `${origin.replace(/\/+$/, "")}/:path*` }];
  },
};

export default nextConfig;
