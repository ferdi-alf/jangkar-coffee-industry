"use client";

import { useEffect, useState } from "react";

/**
 * Kemampuan perangkat pengunjung, dipakai untuk memutuskan seberapa berat animasi
 * boleh berjalan. Lihat pagar performa di docs/PROJECT-SPEC.md.
 *
 * Selalu mulai dari nilai paling aman, yaitu gerak dimatikan, sampai `ready`
 * menjadi true. Kalau tidak, render pertama di server dan render pertama di klien
 * bisa berbeda dan React akan mengeluh soal hidrasi.
 */
export interface MediaCapability {
  /** false sampai pengukuran pertama di browser selesai. */
  ready: boolean;
  /** Pengunjung meminta gerak dikurangi lewat setelan sistem. */
  reducedMotion: boolean;
  /** Layar sentuh atau penunjuk kasar. Efek yang butuh mouse tidak ada gunanya. */
  coarsePointer: boolean;
  /** Perangkat hemat data, memori kecil, atau inti CPU sedikit. */
  lowPower: boolean;
}

/** Bagian navigator yang belum ada di lib DOM bawaan TypeScript. */
interface NavigatorCapability extends Navigator {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
}

const SAFE: MediaCapability = {
  ready: false,
  reducedMotion: true,
  coarsePointer: true,
  lowPower: true,
};

export function useMediaCapability(): MediaCapability {
  const [capability, setCapability] = useState<MediaCapability>(SAFE);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointerQuery = window.matchMedia("(pointer: coarse)");
    const nav = navigator as NavigatorCapability;

    const lowPower =
      nav.connection?.saveData === true ||
      (typeof nav.deviceMemory === "number" && nav.deviceMemory < 4) ||
      (typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency < 4);

    const read = () =>
      setCapability({
        ready: true,
        reducedMotion: motionQuery.matches,
        coarsePointer: pointerQuery.matches,
        lowPower,
      });

    read();
    motionQuery.addEventListener("change", read);
    pointerQuery.addEventListener("change", read);
    return () => {
      motionQuery.removeEventListener("change", read);
      pointerQuery.removeEventListener("change", read);
    };
  }, []);

  return capability;
}
