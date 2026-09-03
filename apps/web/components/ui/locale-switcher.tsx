"use client";

import { Check, ChevronDown } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { LOCALES, LOCALE_META, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/id";

/**
 * Pemilih bahasa di navbar, berbentuk select.
 *
 * Permintaan pemilik proyek: jangan menampilkan kedua bahasa sekaligus. Yang
 * terlihat saat tertutup hanya bahasa yang sedang aktif, seperti input select
 * dengan ikon bendera, dan pilihannya baru muncul saat dibuka.
 *
 * BENTUKNYA SELECT, MEKANISMENYA TETAP TAUTAN, dan itu disengaja.
 * `lightswind/select` sudah diperiksa dan sebenarnya sehat, nol kelas Tailwind
 * arbitrer. Tapi ia select NILAI FORMULIR, sedangkan berpindah bahasa adalah
 * NAVIGASI. Memakainya berarti memalsukan sebuah value lalu mendorong navigasi
 * di onChange, dan `<a href>` yang sesungguhnya jadi hilang. Akibatnya nyata:
 * klik tengah dan buka di tab baru mati, dan tag hreflang timbal balik yang
 * dipasang di layout tidak punya pasangan yang bisa dirayapi di dalam halaman.
 *
 * Karena isinya tautan, ia disclosure (`aria-expanded` pada tombol), BUKAN
 * `role="listbox"`. Tautan di dalam listbox adalah pola ARIA yang salah, anak
 * sebuah listbox harus `role="option"` dan option tidak boleh punya href.
 *
 * Bahasa aktif ditandai `aria-current` DAN ikon centang, jadi maknanya tidak
 * dibawa warna saja.
 *
 * PATH DAN ANCHOR sama-sama dipertahankan, dan yang kedua butuh kerja tambahan.
 * `usePathname()` tidak pernah memuat hash, dan hash memang tidak pernah dikirim
 * peramban ke server, jadi href yang dirender hanya bisa membawa path. Terukur:
 * dari `/id#keliling` versi lama mendarat di `/en` tanpa anchor, dan pengunjung
 * dilempar kembali ke atas halaman. Hash disambung saat diklik, sementara href
 * polosnya dibiarkan utuh supaya klik tengah, Ctrl klik, dan perayap tetap
 * mendapat tautan yang sebenarnya.
 *
 * Ikon dari lucide, ikon resmi dan bukan emoji. Tanpa framer-motion: header ada
 * di jalur kritis setiap halaman dan transisi CSS sudah cukup.
 */
export function LocaleSwitcher({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  const current = LOCALE_META[locale];

  const swap = (target: Locale) => {
    const rest = pathname.replace(/^\/(id|en)/, "");
    return `/${target}${rest}`;
  };

  const close = useCallback((focusTrigger: boolean) => {
    setOpen(false);
    if (focusTrigger) buttonRef.current?.focus();
  }, []);

  /* Menutup lewat klik di luar dan Escape, plus panah atas dan bawah untuk
     berpindah antar pilihan. Fokus TIDAK dipindahkan saat dibuka: pengguna
     mouse tidak boleh kehilangan fokusnya, dan pengguna keyboard tetap sampai
     ke pilihannya lewat Tab biasa karena tautannya persis di belakang tombol. */
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close(true);
        return;
      }
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

      const options = Array.from(
        rootRef.current?.querySelectorAll<HTMLAnchorElement>(".locale-option") ?? [],
      );
      if (!options.length) return;

      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      const at = options.indexOf(document.activeElement as HTMLAnchorElement);
      const next =
        at < 0 ? (step === 1 ? 0 : options.length - 1) : (at + step + options.length) % options.length;
      options[next].focus();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  return (
    <div className="locale-switcher" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className="locale-trigger"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${dict.nav.language}, ${current.name}`}
        onClick={() => setOpen((value) => !value)}
      >
        <Image src={current.flag} alt="" width={18} height={12} unoptimized />
        <span className="locale-label">{current.label}</span>
        <ChevronDown className="locale-caret" size={13} aria-hidden="true" />
      </button>

      {/* Tetap ada di DOM supaya bisa bertransisi. Saat tertutup ia
          `visibility: hidden`, yang sekaligus mengeluarkannya dari pohon
          aksesibilitas, jadi tidak ada dua bahasa yang terbaca sekaligus. */}
      <ul id={listId} className="locale-list" aria-hidden={!open}>
        {LOCALES.map((code) => {
          const meta = LOCALE_META[code];
          const active = code === locale;
          return (
            <li key={code}>
              <a
                className="locale-option"
                href={swap(code)}
                hrefLang={code}
                lang={code}
                aria-current={active ? "true" : undefined}
                tabIndex={open ? undefined : -1}
                onClick={(event) => {
                  setOpen(false);
                  /* Klik dengan pengubah atau tombol selain kiri dibiarkan
                     memakai href polosnya, supaya buka di tab baru tetap
                     bekerja. Sisanya disambung hash yang sedang aktif. */
                  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                  if (event.button !== 0) return;
                  const hash = window.location.hash;
                  if (!hash) return;
                  event.preventDefault();
                  /* NAVIGASI DOKUMEN PENUH, dan ini disengaja meski Next
                     menyarankan router.push. Berpindah bahasa harus mengubah
                     `<html lang>`, dan atribut itu dirender layout akar. Next
                     sendiri memperingatkan atribut html dan body layout akar
                     tidak dijamin ikut diperbarui pada navigasi sisi klien,
                     sedangkan `lang` yang salah membuat pembaca layar
                     melafalkan seluruh halaman dengan aturan bahasa yang keliru.
                     Muat ulang penuh sudah diuji: /id#keliling menjadi
                     /en#keliling dengan lang="en", anchor ikut terbawa. */
                  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
                  window.location.href = `${swap(code)}${hash}`;
                }}
              >
                <Image src={meta.flag} alt="" width={18} height={12} unoptimized />
                <span>{meta.name}</span>
                {active ? <Check size={14} aria-hidden="true" /> : null}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
