/**
 * Rute admin, satu sumber kebenaran.
 *
 * Ada karena rute admin TIDAK berprefiks locale, sementara `app/[locale]` akan
 * dengan senang hati menangkap `/dashboard` sebagai locale bernama "dashboard".
 * Middleware harus menyelesaikan itu lebih dulu, dan daftar ini yang dipakainya.
 *
 * Menambah rute admin berarti menambah satu entri DI SINI, bukan menyebar
 * kondisi ke banyak berkas. Aturan ini dari PROJECT-SPEC.
 *
 * Perubahan 2026-09-03, atas permintaan pemilik proyek:
 *   - `product` DIHAPUS. Halaman kartu baca-saja itu menampilkan katalog yang
 *     sekarang sudah punya halamannya masing-masing per tabel.
 *   - `media` DIHAPUS. Pustaka media berdiri sendiri tanpa pernah dipakai satu
 *     form pun; gambar sekarang diunggah langsung di form yang membutuhkannya.
 *   - `management-product` menjadi `menu`, dan `ecommerce` lahir sebagai
 *     pasangannya, karena menu outlet dan barang yang dijual di marketplace
 *     memang dua hal berbeda.
 */
export const ADMIN_ROUTES = [
  "dashboard",
  "menu",
  "ecommerce",
  "keliling",
  "category",
  "outlet",
  "content",
  "timeline",
  "seo",
  "kontak",
  "profil",
  "pengguna",
  "pesan",
  "login",
] as const;

export function isAdminRoute(segment: string): boolean {
  return (ADMIN_ROUTES as readonly string[]).includes(segment);
}

/**
 * Rute yang boleh dibuka TANPA sesi. Hanya satu, dan daftar ini sengaja
 * terpisah dari ADMIN_ROUTES supaya menambah rute admin baru tidak pernah
 * berarti membukanya secara tidak sengaja: yang tidak disebut di sini terkunci.
 */
export const PUBLIC_ADMIN_ROUTES = ["login"] as const;

export function isPublicAdminRoute(segment: string): boolean {
  return (PUBLIC_ADMIN_ROUTES as readonly string[]).includes(segment);
}
