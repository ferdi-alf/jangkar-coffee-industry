import {
  Boxes,
  Coffee,
  FileText,
  Image,
  LayoutDashboard,
  MailOpen,
  MapPin,
  Table2,
  Truck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Navigasi panel, satu sumber kebenaran.
 *
 * RUTE TIDAK PERNAH BERPREFIKS /admin. Aturan produk menyebutnya lugas:
 * langsung /dashboard, /product, /management-product, dan seterusnya. Setiap
 * href di sini juga harus punya pasangannya di shared/constants/routes.ts,
 * karena daftar itulah yang dipakai middleware untuk tahu bahwa segmen ini
 * bukan kode bahasa.
 *
 * Ikonnya lucide, ikon resmi dan bukan emoji.
 */
export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Hanya terlihat oleh peran ini. Kosong berarti semua peran. */
  roles?: ("owner" | "staff")[];
}

export interface AdminNavGroup {
  label: string;
  items: AdminNavItem[];
}

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    label: "Ringkasan",
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Katalog",
    items: [
      { href: "/product", label: "Produk", icon: Coffee },
      { href: "/management-product", label: "Kelola produk", icon: Table2 },
      { href: "/category", label: "Kategori", icon: Boxes },
    ],
  },
  {
    label: "Operasi",
    items: [
      { href: "/outlet", label: "Outlet", icon: MapPin },
      { href: "/keliling", label: "Menu armada", icon: Truck },
    ],
  },
  {
    label: "Isi situs",
    items: [
      /* Teks beranda hanya owner. Aturan produk: barista boleh mengubah penanda
         habis, tidak boleh mengubah teks beranda. Menyembunyikannya dari menu
         saja tidak cukup, pagar sesungguhnya ada di router Express, tapi
         menampilkan menu yang pasti ditolak hanya membingungkan. */
      { href: "/content", label: "Konten", icon: FileText, roles: ["owner"] },
      { href: "/media", label: "Media", icon: Image },
      { href: "/pesan", label: "Pesan masuk", icon: MailOpen },
    ],
  },
];

export const ADMIN_PAGE_TITLE: Record<string, { title: string; sub: string }> = {
  "/dashboard": { title: "Dashboard", sub: "Ringkasan isi situs dan pesan masuk." },
  "/product": { title: "Produk", sub: "Katalog produk, klik kartu untuk melihat detailnya." },
  "/management-product": { title: "Kelola produk", sub: "Tambah, ubah, dan hapus produk." },
  "/category": { title: "Kategori", sub: "Pengelompokan menu dan produk." },
  "/outlet": { title: "Outlet", sub: "Gerai tetap beserta alamat dan koordinatnya." },
  "/keliling": { title: "Menu armada", sub: "Item mana yang dibawa Jangkar Keliling." },
  "/content": { title: "Konten", sub: "Teks yang tampil di halaman publik, dua bahasa." },
  "/media": { title: "Media", sub: "Pustaka gambar. Alt text wajib di kedua bahasa." },
  "/pesan": { title: "Pesan masuk", sub: "Kiriman dari form kontak beranda." },
};
