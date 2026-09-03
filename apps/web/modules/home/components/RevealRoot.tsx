"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Satu-satunya komponen client di modul ini.
 *
 * Seluruh seksi beranda adalah komponen server. Markup-nya sudah ada di HTML
 * awal, dan komponen ini hanya menempel padanya di klien, pola yang sama dengan
 * HeroFilm. Itu yang menjaga teks tetap terbaca mesin telusur dan LCP tidak
 * menunggu JavaScript.
 *
 * Dua perilaku, keduanya murni dekoratif:
 *
 *   1. Reveal saat masuk viewport. Aturan tingkat animasi dari pemilik proyek:
 *      sinematik HANYA di hero, sisanya reveal biasa. Jadi tidak ada GSAP di
 *      sini, cukup IntersectionObserver dan satu transisi CSS.
 *   2. Sorot radial mengikuti kursor pada baris menu dan kartu produk, diport
 *      dari prototipe 06 Arus. Butuh mouse, jadi otomatis mati di layar sentuh.
 *
 * Keduanya dilewati saat `prefers-reduced-motion`, dan CSS sudah menampilkan
 * semuanya dalam keadaan terlihat, jadi kalau JavaScript gagal halaman tetap
 * utuh dan terbaca.
 */
export function RevealRoot({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const targets = Array.from(el.querySelectorAll<HTMLElement>("[data-reveal]"));
    targets.forEach((t) => t.classList.add("reveal-armed"));

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("in");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );
    targets.forEach((t) => observer.observe(t));

    /* Sorot kursor. Satu listener di akar, bukan satu per kartu, dan hanya
       menulis dua custom property sehingga tidak pernah memicu layout. */
    const fine = window.matchMedia("(pointer: fine)").matches;
    const onMove = (event: PointerEvent) => {
      const spot = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-spot]");
      if (!spot) return;
      const rect = spot.getBoundingClientRect();
      spot.style.setProperty("--mx", `${event.clientX - rect.left}px`);
      spot.style.setProperty("--my", `${event.clientY - rect.top}px`);
    };
    if (fine) el.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      observer.disconnect();
      if (fine) el.removeEventListener("pointermove", onMove);
    };
  }, []);

  return <div ref={root}>{children}</div>;
}
