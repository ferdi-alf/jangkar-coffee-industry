"use client";

import { Menu, X } from "lucide-react";
import { useEffect, type RefObject } from "react";

import { gsap } from "@/lib/gsap";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/id";
import { BRAND, navCta, navItems } from "@/modules/navigation/constants/nav-items";

/**
 * Navigasi mobile, celah yang ditandai CLAUDE.md.
 *
 * Prototipe 06 Arus menyembunyikan tautan dock di bawah 1000px tanpa pengganti
 * apa pun, padahal itu mayoritas trafik. Ini penggantinya.
 *
 * TOMBOL DAN PANEL DIPISAH JADI DUA KOMPONEN, dan itu bukan selera.
 *
 * Pemilik proyek meminta tombolnya masuk ke dalam navbar, tidak lagi melayang
 * sendiri di pojok kanan atas. Memindahkan komponen ini apa adanya ke dalam
 * `.dock` akan merusak panelnya: `.dock` memakai `backdrop-filter`, dan properti
 * itu membuat elemennya jadi containing block bagi keturunan `position: fixed`.
 * Panel yang `inset: 0` akan mengukur diri terhadap dock, bukan viewport, lalu
 * runtuh jadi seukuran dock. Ini persis kelas cacat nomor 3 di daftar bawah,
 * yang dulu menggugurkan `lightswind/hamburger-menu-overlay`.
 *
 * Karena itu `MobileNavButton` dirender DI DALAM `.dock`, sedangkan
 * `MobileNavPanel` tetap saudara `.dock`, jadi ia tidak pernah jadi keturunan
 * elemen ber-backdrop. State `open` dinaikkan ke `SiteHeader` yang memiliki
 * keduanya, dan ref tombolnya ikut ke atas supaya fokus tetap bisa dikembalikan
 * ke tombol saat panel menutup.
 *
 * KENAPA TIDAK MEMAKAI lightswind/hamburger-menu-overlay. Komponen itu sempat
 * dipasang, lalu dicabut setelah tiga cacat terbukti pada halaman yang sudah
 * dibangun, bukan dari membaca kodenya saja:
 *
 *   1. Ia menyuntikkan `@import url('https://fonts.googleapis.com/...Krona One')`
 *      ke dalam blok style-nya. Terverifikasi: setiap muat halaman menembak
 *      fonts.googleapis.com sungguhan. CLAUDE.md melarang itu tanpa kecuali,
 *      font wajib self-host lewat next/font. Ia juga permintaan pihak ketiga di
 *      jalur kritis, persis yang merusak LCP di Android kelas menengah.
 *   2. `aria-controls="navigation-menu"` menunjuk id yang tidak pernah dirender.
 *   3. Akarnya `position: absolute`, jadi panelnya butuh leluhur berposisi
 *      setinggi viewport. Di dalam header yang fixed dan setinggi dock, panelnya
 *      runtuh.
 *
 * Vendor tidak boleh diedit di tempat, components.json menunjuk registry-nya.
 * Membungkusnya juga tidak menolong, ketiganya ada di dalam komponen itu.
 *
 * Ikon Menu dan X dari lucide, ikon resmi dan bukan emoji.
 *
 * PEMILIH BAHASA TIDAK ADA DI SINI. Ia sempat ditaruh di dalam overlay ini,
 * lalu dipindahkan ke navbar atas permintaan pemilik proyek: mengganti bahasa
 * seharusnya tidak menuntut pengunjung membuka menu lebih dulu. Sekarang ia
 * duduk di dalam `.dock` pada segala lebar layar, dan di bawah 1023px labelnya
 * diringkas jadi bendera saja supaya dock tetap muat di 360px.
 */

const PANEL_ID = "mobile-nav-panel";

/**
 * Tombolnya, dirender di dalam `.dock`.
 *
 * Ia juga yang mengukur titik asal clip-path panel. Nilai lamanya dipatok
 * `calc(100% - 40px) 42px` karena tombolnya dulu melayang tetap di pojok. Kini
 * tombolnya ikut dock, dan dock berukuran sesuai isinya lalu ditaruh di tengah,
 * jadi jaraknya dari tepi kanan berubah mengikuti lebar viewport: sekitar 70px
 * pada 360px, sekitar 390px pada 1000px. Satu nilai tetap pasti salah di salah
 * satunya, jadi rect-nya diukur dan ditulis sebagai variabel CSS. CSS-nya tetap
 * menyimpan nilai cadangan, supaya render server dan keadaan sebelum efek ini
 * jalan tidak pernah kosong.
 */
export function MobileNavButton({
  open,
  onToggle,
  dict,
  buttonRef,
}: {
  open: boolean;
  onToggle: () => void;
  dict: Dictionary;
  buttonRef: RefObject<HTMLButtonElement | null>;
}) {
  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    const write = () => {
      const rect = button.getBoundingClientRect();
      /* Di atas 1023px tombolnya display none, jadi rect-nya nol di semua sisi.
         Panelnya juga tidak dipakai di lebar itu, jadi nilai nol tidak pernah
         terlihat, dan begitu viewport menyempit ResizeObserver di bawah ini
         menuliskan ulang nilai yang benar. */
      if (rect.width === 0) return;
      const style = document.documentElement.style;
      style.setProperty("--mnav-x", `${Math.round(rect.left + rect.width / 2)}px`);
      style.setProperty("--mnav-y", `${Math.round(rect.top + rect.height / 2)}px`);
    };

    write();
    const observer = new ResizeObserver(write);
    observer.observe(document.documentElement);
    observer.observe(button);
    return () => observer.disconnect();
  }, [buttonRef]);

  return (
    <button
      ref={buttonRef}
      type="button"
      className="mnav-button"
      aria-expanded={open}
      aria-controls={PANEL_ID}
      aria-label={open ? dict.nav.closeMenu : `${dict.nav.openMenu} ${BRAND.full}`}
      onClick={onToggle}
    >
      {/* IKONNYA SELALU Menu, tidak pernah berganti jadi X. Dulu tombolnya
          melayang di z-index 96, di ATAS panel, jadi ia tetap terlihat saat
          panel terbuka dan pergantian ikonnya masuk akal. Sekarang ia di dalam
          dock, dan dock ada di bawah panel, jadi saat panel terbuka tombol ini
          tertutup sepenuhnya. Terbukti di screenshot: panel terbuka tanpa satu
          pun tombol tutup yang terlihat, dan di layar sentuh tidak ada Escape,
          jadi menutupnya mustahil kecuali menekan salah satu tautan. Yang
          menutup sekarang adalah tombol di dalam panel, di posisi yang sama
          persis, lihat MobileNavPanel. */}
      <Menu size={20} aria-hidden="true" />
    </button>
  );
}

/** Panelnya, saudara `.dock` dan bukan keturunannya. Alasannya di atas. */
export function MobileNavPanel({
  open,
  onClose,
  dict,
  locale,
  buttonRef,
  panelRef,
}: {
  open: boolean;
  onClose: () => void;
  dict: Dictionary;
  locale: Locale;
  buttonRef: RefObject<HTMLButtonElement | null>;
  panelRef: RefObject<HTMLDivElement | null>;
}) {
  /* Escape, kunci scroll, dan jebakan fokus. Ketiganya wajib untuk dialog yang
     menutupi seluruh layar, kalau tidak pengguna keyboard bisa terlempar ke
     tautan di belakang overlay yang sedang tidak terlihat. */
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        buttonRef.current?.focus();
        return;
      }
      if (event.key !== "Tab") return;

      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled])",
      );
      if (!focusables?.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    panelRef.current?.querySelector<HTMLElement>("a[href]")?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, buttonRef, panelRef]);

  /* Tautan masuk berurutan. Dilewati sepenuhnya saat gerak dikurangi, dan
     clip-path panelnya ikut berhenti sendiri lewat aturan global di globals.css. */
  useEffect(() => {
    const items = panelRef.current?.querySelectorAll<HTMLElement>(".mnav-item");
    if (!items?.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(items, { y: 0, opacity: 1 });
      return;
    }
    if (open) {
      gsap.fromTo(
        items,
        { y: 26, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, stagger: 0.06, ease: "power2.out", delay: 0.22 },
      );
    } else {
      gsap.set(items, { y: 26, opacity: 0 });
    }
  }, [open, panelRef]);

  return (
    <div
      id={PANEL_ID}
      ref={panelRef}
      className={open ? "mnav-panel open" : "mnav-panel"}
      role="dialog"
      aria-modal="true"
      aria-label={dict.nav.aria}
      aria-hidden={!open}
    >
      {/* Tombol tutup ada DI DALAM panel, bukan di dock, karena dock tertutup
          panel ini. Posisinya memakai --mnav-x dan --mnav-y yang sama, jadi X
          muncul persis di tempat ikon Menu tadi berada dan perpindahannya
          terbaca sebagai satu tombol yang berubah, bukan dua tombol berbeda.

          Ia juga yang pertama di DOM panel, jadi Shift+Tab dari tautan pertama
          langsung sampai ke sini dan Tab dari tautan terakhir kembali ke sini. */}
      <button
        type="button"
        className="mnav-close"
        aria-label={dict.nav.closeMenu}
        tabIndex={open ? undefined : -1}
        onClick={() => {
          onClose();
          buttonRef.current?.focus();
        }}
      >
        <X size={22} aria-hidden="true" />
      </button>

      <nav aria-label={dict.nav.aria}>
        {[...navItems(locale, dict), navCta(locale, dict)].map((item) => (
          <a
            className="mnav-item"
            key={item.href}
            href={item.href}
            tabIndex={open ? undefined : -1}
            onClick={() => {
              onClose();
              buttonRef.current?.focus();
            }}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
