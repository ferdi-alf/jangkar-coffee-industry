import {
  Boxes,
  Coffee,
  Contact,
  FileText,
  History,
  LayoutDashboard,
  MailOpen,
  MapPin,
  Search,
  ShoppingBag,
  Truck,
  UserCog,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Navigasi panel, satu sumber kebenaran.
 *
 * RUTE TIDAK PERNAH BERPREFIKS /admin. Aturan produk menyebutnya lugas:
 * langsung /dashboard, /menu, /ecommerce, dan seterusnya. Setiap href di sini
 * juga harus punya pasangannya di shared/constants/routes.ts, karena daftar itu
 * yang dipakai middleware untuk tahu bahwa segmen ini bukan kode bahasa.
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
  /** Kunci stabil untuk menyimpan keadaan buka-tutup di localStorage. */
  key: string;
  label: string;
  items: AdminNavItem[];
  /**
   * Grup yang bisa dibuka-tutup. HANYA SATU yang begini, sesuai permintaan
   * pemilik proyek: "buat 1 sidebar dropdown yang menampung navigation menu".
   * Grup lain tetap judul biasa, karena dropdown yang dipasang di mana-mana
   * hanya menambah satu klik untuk setiap perpindahan halaman tanpa menghemat
   * apa pun yang berarti.
   */
  collapsible?: boolean;
}

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    key: "ringkasan",
    label: "Ringkasan",
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    key: "navigasi-menu",
    label: "Navigasi menu",
    collapsible: true,
    items: [
      { href: "/category", label: "Kategori", icon: Boxes },
      { href: "/menu", label: "Menu utama", icon: Coffee },
      { href: "/keliling", label: "Menu keliling", icon: Truck },
    ],
  },
  {
    /* Ecommerce SENGAJA di luar dropdown di atas. Barang yang dijual di Shopee
       dan Tokopedia bukan menu yang dipesan di gerai: ia punya gambar, punya
       tautan marketplace, dan tidak punya kanal. Memisahkannya secara visual
       adalah setengah dari permintaan "pisahkan produk ecommerce dari menu
       utama"; setengah lainnya adalah dua halaman yang benar-benar berbeda. */
    key: "katalog",
    label: "Katalog",
    items: [{ href: "/ecommerce", label: "Produk ecommerce", icon: ShoppingBag }],
  },
  {
    key: "isi-situs",
    label: "Isi situs",
    items: [
      /* Teks beranda hanya owner. Aturan produk: barista boleh mengubah penanda
         habis, tidak boleh mengubah teks beranda. Menyembunyikannya dari menu
         saja tidak cukup, pagar sesungguhnya ada di router Express, tapi
         menampilkan menu yang pasti ditolak hanya membingungkan. */
      { href: "/content", label: "Konten", icon: FileText, roles: ["owner"] },
      { href: "/timeline", label: "Timeline", icon: History, roles: ["owner"] },
      { href: "/seo", label: "SEO", icon: Search, roles: ["owner"] },
      { href: "/kontak", label: "Kontak & sosial", icon: Contact, roles: ["owner"] },
      /* Outlet TANPA pagar peran, sama seperti sebelum penataan ulang ini.
         Menulisnya memang terkunci owner di router Express, tapi staff selama
         ini boleh melihat alamat dan jam bukanya, dan mencabut itu bukan bagian
         dari yang diminta. */
      { href: "/outlet", label: "Outlet", icon: MapPin },
    ],
  },
  {
    key: "akun",
    label: "Akun",
    items: [
      { href: "/profil", label: "Profil", icon: UserCog },
      { href: "/pengguna", label: "Pengguna", icon: Users, roles: ["owner"] },
      { href: "/pesan", label: "Pesan masuk", icon: MailOpen },
    ],
  },
];

export const ADMIN_PAGE_TITLE: Record<string, { title: string; sub: string }> = {
  "/dashboard": { title: "Dashboard", sub: "Kunjungan situs dan ringkasan isinya." },
  "/category": { title: "Kategori", sub: "Pengelompokan menu dan produk." },
  "/menu": { title: "Menu utama", sub: "Daftar yang dipesan di gerai. Slug dibuat otomatis dari judul." },
  "/keliling": { title: "Menu keliling", sub: "Item yang dibawa armada. Bisa diimpor dari menu utama." },
  "/ecommerce": { title: "Produk ecommerce", sub: "Barang yang dijual di Shopee dan Tokopedia." },
  "/outlet": { title: "Outlet", sub: "Gerai tetap beserta alamat dan koordinatnya." },
  "/content": { title: "Konten", sub: "Teks yang tampil di halaman publik, dua bahasa." },
  "/timeline": { title: "Timeline", sub: "Tonggak perjalanan, urut menurut tahun." },
  "/seo": { title: "SEO", sub: "Judul, deskripsi, kata kunci, dan gambar berbagi." },
  "/kontak": { title: "Kontak & sosial", sub: "Nomor, surel, dan tautan sosial yang tampil di situs." },
  "/profil": { title: "Profil", sub: "Akun Anda sendiri." },
  "/pengguna": { title: "Pengguna", sub: "Akun admin lain dan perannya." },
  "/pesan": { title: "Pesan masuk", sub: "Kiriman dari form kontak beranda." },
};
