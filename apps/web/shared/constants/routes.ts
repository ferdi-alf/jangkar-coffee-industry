/**
 * Rute admin, satu sumber kebenaran.
 *
 * Ada karena rute admin TIDAK berprefiks locale, sementara `app/[locale]` akan
 * dengan senang hati menangkap `/dashboard` sebagai locale bernama "dashboard".
 * Middleware harus menyelesaikan itu lebih dulu, dan daftar ini yang dipakainya.
 *
 * Menambah rute admin berarti menambah satu entri DI SINI, bukan menyebar
 * kondisi ke banyak berkas. Aturan ini dari PROJECT-SPEC.
 */
export const ADMIN_ROUTES = [
  "dashboard",
  "product",
  "management-product",
  "category",
  "outlet",
  "keliling",
  "content",
  "media",
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
