"use client";

import { useCallback, useRef, useState } from "react";

import { MobileNavButton, MobileNavPanel } from "@/components/ui/mobile-nav";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/id";
import {
  BRAND,
  NAV_SECTION_IDS,
  navCta,
  navItems,
} from "@/modules/navigation/constants/nav-items";
import { useActiveSection } from "@/modules/navigation/hooks/useActiveSection";

/**
 * Dock mengambang, bentuk navigasi konsep 06 Arus.
 *
 * Nama merek tampil lengkap, disusun dua baris supaya muat di dock tanpa
 * memaksa lebarnya. `aria-label` pada tautannya membawa nama utuh dalam satu
 * kalimat untuk pembaca layar.
 *
 * Penanda seksi aktif tidak dibawa warna saja. `aria-current` ikut berpindah,
 * jadi maknanya tetap sampai tanpa persepsi warna.
 *
 * STATE HAMBURGER ADA DI SINI, bukan di dalam komponennya. Pemilik proyek
 * meminta tombolnya masuk ke dalam navbar, sementara panelnya tidak boleh jadi
 * keturunan `.dock` karena `backdrop-filter` dock akan menjadikannya containing
 * block bagi elemen `position: fixed` dan panelnya runtuh. Jadi tombol dan
 * panel dirender di dua tempat berbeda, dan yang menyatukan keduanya adalah
 * state plus ref di komponen ini. Penjelasan lengkapnya di mobile-nav.tsx.
 */
export function SiteHeader({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const active = useActiveSection(NAV_SECTION_IDS);
  const items = navItems(locale, dict);
  const cta = navCta(locale, dict);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const toggleMenu = useCallback(() => setMenuOpen((value) => !value), []);

  return (
    <header className="site-header">
      <div className="dock">
        <a className="dock-brand" href={`/${locale}`} aria-label={BRAND.full}>
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-text" aria-hidden="true">
            <span className="brand-name">{BRAND.name}</span>
            <span className="brand-qualifier">{BRAND.qualifier}</span>
          </span>
        </a>

        <nav className="dock-nav" aria-label={dict.nav.aria}>
          {items.map((item) => (
            <a
              key={item.key}
              href={item.href}
              aria-current={active === item.section ? "true" : undefined}
            >
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <LocaleSwitcher locale={locale} dict={dict} />

        <a className="dock-cta" href={cta.href}>
          {cta.label}
        </a>

        <MobileNavButton
          open={menuOpen}
          onToggle={toggleMenu}
          dict={dict}
          buttonRef={menuButtonRef}
        />
      </div>

      <MobileNavPanel
        open={menuOpen}
        onClose={closeMenu}
        dict={dict}
        locale={locale}
        buttonRef={menuButtonRef}
        panelRef={menuPanelRef}
      />
    </header>
  );
}
