"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import type { Dictionary } from "@/i18n/dictionaries/id";
import { HQ } from "@/modules/home/constants/menu-data";

/**
 * Seksi 5, Outlet. Satu titik tetap, HQ Sako.
 *
 * Kartu "Segera" dihapus atas permintaan pemilik proyek: hanya data yang
 * benar-benar ada yang ditampilkan.
 *
 * Petanya dimuat MALAS DUA LAPIS. Pertama `next/dynamic` dengan `ssr: false`,
 * karena Leaflet menyentuh `window` dan akan meledak saat prerender. Kedua
 * `IntersectionObserver`, jadi modulnya baru diminta ketika seksinya
 * benar-benar mendekati layar. Pengunjung yang berhenti di tengah halaman tidak
 * pernah mengunduh Leaflet maupun satu tile pun.
 */
const OutletMap = dynamic(
  () => import("@/modules/home/components/OutletMap").then((m) => m.OutletMap),
  { ssr: false },
);

export function OutletSection({ dict }: { dict: Dictionary }) {
  const section = useRef<HTMLElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = section.current;
    if (!el || near) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [near]);

  return (
    <section className="section" id="outlet" ref={section}>
      <p className="eyebrow" data-reveal>
        {dict.outlet.eyebrow}
      </p>
      <h2 className="section-heading" data-reveal>
        {dict.outlet.heading}
      </h2>

      <div className="outlet-single" data-reveal data-spot>
        <div className="outlet-body">
          <span className="outlet-chip">{dict.outlet.chip}</span>
          <h3 className="outlet-name">{HQ.name}</h3>
          <address className="outlet-address">{HQ.address}</address>
          <span className="outlet-hours">{HQ.hours}</span>
          <a
            className="outlet-directions"
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(HQ.mapsQuery)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {dict.outlet.directions}
            <span aria-hidden="true">&#8594;</span>
          </a>
          {HQ.coords.approximate ? (
            <p className="outlet-note">{dict.outlet.mapPending}</p>
          ) : null}
        </div>

        <div className="outlet-map-holder">
          {near ? <OutletMap label={dict.outlet.mapLabel} /> : null}
        </div>
      </div>
    </section>
  );
}
