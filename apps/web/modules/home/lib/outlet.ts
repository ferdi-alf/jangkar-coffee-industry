import "server-only";

import { HQ } from "@/modules/home/constants/menu-data";

/**
 * Outlet HQ, dibaca dari API saat build.
 *
 * KENAPA INI DIKERJAKAN SEKARANG. Panel sudah lama punya halaman /outlet yang
 * menyunting tabel `outlet`, tapi situsnya membaca konstanta HQ, jadi apa pun
 * yang diketik di sana TIDAK PERNAH TAMPIL. Itu persis kegagalan yang sudah
 * pernah diperbaiki proyek ini untuk halaman Keliling: panel yang mengelola
 * data yang tidak dilihat satu pengunjung pun. Membiarkannya berarti pemilik
 * memperbaiki alamat gerainya lalu bingung kenapa situs tidak berubah.
 *
 * Pola cadangannya sama dengan lib lain di folder ini.
 */
export interface OutletInfo {
  name: string;
  address: string;
  hours: string | null;
  mapsQuery: string;
  lat: number;
  lng: number;
  coordsApproximate: boolean;
}

interface ApiOutlet {
  name: string;
  address: string;
  hours: string | null;
  mapsQuery: string;
  lat: number | null;
  lng: number | null;
  coordsApproximate: boolean;
  isHeadquarters: boolean;
}

const API = process.env.API_ORIGIN ?? "http://localhost:4000";

function fallback(): OutletInfo {
  return {
    name: HQ.name,
    address: HQ.address,
    hours: HQ.hours,
    mapsQuery: HQ.mapsQuery,
    lat: HQ.coords.lat,
    lng: HQ.coords.lng,
    coordsApproximate: HQ.coords.approximate,
  };
}

export async function getHeadquarters(locale: string): Promise<OutletInfo> {
  try {
    const res = await fetch(
      `${API}/outlets?status=published&perPage=20&sort=sort_order&order=asc&locale=${locale}`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const body = (await res.json()) as { success: boolean; data: ApiOutlet[] };
    if (!body.success || body.data.length === 0) throw new Error("kosong");

    /* HQ lebih dulu, kalau tidak ada ambil yang pertama. Situs ini hanya
       menampilkan SATU gerai, dan yang benar untuk ditampilkan adalah yang
       ditandai kantor pusat. */
    const hq = body.data.find((o) => o.isHeadquarters) ?? body.data[0];
    if (!hq) throw new Error("kosong");

    return {
      name: hq.name,
      address: hq.address,
      hours: hq.hours,
      mapsQuery: hq.mapsQuery,
      /* Koordinat yang kosong di basis data jatuh ke konstanta, karena peta
         tetap harus punya titik pusat. Penanda `coordsApproximate` yang
         memberi tahu pengunjung bahwa pinnya belum pasti. */
      lat: hq.lat ?? HQ.coords.lat,
      lng: hq.lng ?? HQ.coords.lng,
      coordsApproximate: hq.coordsApproximate,
    };
  } catch (error) {
    console.warn(
      "[outlet] gagal membaca outlet dari API, memakai konstanta cadangan:",
      error instanceof Error ? error.message : error,
    );
    return fallback();
  }
}
