import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/id";

/**
 * Satu sumber kebenaran navigasi, dibaca dock desktop, overlay mobile, dan footer.
 *
 * Labelnya datang dari kamus, bukan dari sini, jadi berkas ini hanya mengurus
 * STRUKTUR: kunci apa saja yang ada dan ke mana ia menunjuk. Menambah seksi
 * berarti menambah satu entri di sini plus satu kunci di kedua kamus, dan
 * typecheck akan menagih kamus yang tertinggal.
 *
 * Anchor SELALU berprefiks locale. Tanpa itu, mengklik tautan dari `/en` akan
 * melempar pengunjung kembali ke `/id`.
 */
export const NAV_KEYS = ["industri", "menu", "roastery", "outlet", "keliling"] as const;
export type NavKey = (typeof NAV_KEYS)[number];

export interface NavItem {
  key: NavKey;
  href: string;
  /** id elemen yang diamati untuk menandai seksi aktif. */
  section: string;
  label: string;
}

export function navItems(locale: Locale, dict: Dictionary): NavItem[] {
  return NAV_KEYS.map((key) => ({
    key,
    href: `/${locale}#${key}`,
    section: key,
    label: dict.nav.items[key],
  }));
}

export function navCta(locale: Locale, dict: Dictionary) {
  return { href: `/${locale}#kontak`, label: dict.nav.contact };
}

/** Referensi stabil, supaya IntersectionObserver tidak dipasang ulang tiap render. */
export const NAV_SECTION_IDS: readonly string[] = NAV_KEYS;

/**
 * Mark A, keputusan pemilik proyek di brand-analysis.md §3: identitas perusahaan,
 * dipakai header, favicon, hero, dan footer. Berkasnya siluet satu warna dengan
 * latar transparan, jadi dipasang sebagai mask-image dan diwarnai token palet.
 */
export const BRAND = {
  mark: "/brand/jangkar-mark.webp",
  name: "Jangkar",
  qualifier: "Coffee Industry",
  full: "Jangkar Coffee Industry",
} as const;
