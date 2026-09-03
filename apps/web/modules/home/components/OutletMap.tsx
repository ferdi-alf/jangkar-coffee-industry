"use client";

import { useEffect, useRef } from "react";

import "leaflet/dist/leaflet.css";

import { HQ } from "@/modules/home/constants/menu-data";

/**
 * Peta HQ Sako.
 *
 * Leaflet polos, BUKAN react-leaflet. Pembungkus React-nya menambah sekitar
 * 100 KB untuk kemudahan yang tidak dibutuhkan di sini: satu peta, satu
 * penanda, tanpa interaksi React sama sekali.
 *
 * Leaflet diimpor DINAMIS di dalam effect, jadi ia baru diunduh ketika komponen
 * ini benar-benar dipasang. Induknya memasangnya lewat IntersectionObserver,
 * sehingga pengunjung yang tidak pernah menggulir sampai sini tidak membayar
 * satu byte pun.
 *
 * Tile-nya terang lalu disaring CSS agar warnanya jatuh ke palet crest, karena
 * peta berwarna penuh akan jadi satu-satunya benda di halaman yang tidak patuh
 * palet.
 *
 * KOORDINATNYA MASIH PERKIRAAN sampai pemilik proyek memberikan yang tepat.
 * Karena itu tombol arah memakai ALAMAT TEKS yang terverifikasi, bukan
 * koordinat ini, supaya pengunjung tetap sampai ke tempat yang benar.
 */
export function OutletMap({ label }: { label: string }) {
  const holder = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = holder.current;
    if (!el) return;
    let map: { remove: () => void } | null = null;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !holder.current) return;

      const instance = L.map(el, {
        center: [HQ.coords.lat, HQ.coords.lng],
        zoom: 15,
        scrollWheelZoom: false,
        attributionControl: true,
      });
      map = instance;

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(instance);

      // Penanda digambar sendiri, bukan ikon PNG bawaan Leaflet, supaya tidak
      // ada permintaan gambar tambahan dan warnanya patuh palet.
      L.marker([HQ.coords.lat, HQ.coords.lng], {
        icon: L.divIcon({
          className: "outlet-pin",
          html: '<span class="outlet-pin-dot"></span>',
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        }),
      }).addTo(instance);
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, []);

  return <div className="outlet-map" ref={holder} role="img" aria-label={label} />;
}
