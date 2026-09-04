"use client";

import { useEffect, useRef } from "react";

import "leaflet/dist/leaflet.css";

import { COUNTRY_CENTROIDS, countryName } from "@/modules/admin/constants/country-centroids";

export interface CountryVisits {
  country: string | null;
  visits: number;
  uniques: number;
}

/**
 * Peta dunia negara pengunjung.
 *
 * LEAFLET POLOS, bukan react-leaflet dan bukan pustaka peta baru. Leaflet SUDAH
 * TERPASANG di apps/web dan sudah terbukti dipakai OutletMap di situs publik,
 * jadi peta ini tidak menambah satu dependensi pun. Pilihan lain, misalnya
 * react-simple-maps dengan TopoJSON dunia, berarti paket baru plus berkas
 * ratusan kilobyte untuk sesuatu yang cuma perlu menaruh lingkaran.
 *
 * Diimpor DINAMIS di dalam effect, jadi Leaflet baru diunduh saat dashboard
 * benar-benar dibuka, bukan ikut bundel setiap halaman panel.
 *
 * UKURAN LINGKARAN BUKAN SATU-SATUNYA PEMBAWA MAKNA. Aturan aksesibilitas
 * proyek melarang itu, dan lingkaran di peta dunia memang mustahil dibandingkan
 * dengan mata. Karena itu induknya SELALU merender daftar peringkat bertuliskan
 * angka di bawah peta, dan daftar itulah sumber kebenaran yang bisa dibaca
 * pembaca layar. Peta ini sendiri `aria-hidden`.
 *
 * Negara yang tidak ada di tabel titik tengah tidak digambar, tapi tetap ikut
 * di daftar peringkat, jadi tidak ada kunjungan yang hilang dari layar.
 */
export function VisitorMap({ rows }: { rows: CountryVisits[] }) {
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
        center: [12, 40],
        zoom: 1,
        minZoom: 1,
        scrollWheelZoom: false,
        attributionControl: true,
        /* Kontrol zoom dimatikan. Kartunya hanya 30 persen lebar dashboard,
           dan tombol zoom di ruang sesempit itu lebih sering tertekan tidak
           sengaja daripada dipakai. */
        zoomControl: false,
      });
      map = instance;

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 8,
        attribution: "&copy; OpenStreetMap",
      }).addTo(instance);

      const plotted = rows.filter(
        (row): row is CountryVisits & { country: string } =>
          Boolean(row.country) && row.country! in COUNTRY_CENTROIDS,
      );
      const max = Math.max(1, ...plotted.map((row) => row.visits));

      for (const row of plotted) {
        const point = COUNTRY_CENTROIDS[row.country];
        if (!point) continue;

        /* Radius mengikuti AKAR jumlah, bukan jumlah itu sendiri, supaya yang
           dibaca mata adalah LUAS lingkaran dan bukan jari-jarinya. Tanpa akar,
           negara dengan 100 kunjungan tampak sepuluh ribu kali lebih besar
           daripada yang punya 1. */
        const radius = 5 + 13 * Math.sqrt(row.visits / max);

        L.circleMarker(point, {
          radius,
          color: "#B08A16",
          weight: 1.5,
          fillColor: "#B08A16",
          fillOpacity: 0.35,
        })
          .bindTooltip(`${countryName(row.country)}: ${row.visits} kunjungan`, { direction: "top" })
          .addTo(instance);
      }
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [rows]);

  return (
    <div className="adm-map" ref={holder} aria-hidden="true" role="presentation" />
  );
}
