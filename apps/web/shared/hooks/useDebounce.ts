"use client";

import { useEffect, useState } from "react";

/**
 * Menunda sebuah nilai. Dipakai kotak pencarian setiap tabel.
 *
 * Aturan dashboard di PROJECT-SPEC: setiap tabel punya pencarian dengan
 * debounce, DAN indeks pendukungnya di backend. Keduanya perlu. Tanpa debounce,
 * mengetik "kopi bubuk" mengirim sebelas permintaan; tanpa indeks, tiap
 * permintaan itu jadi sequential scan. Indeksnya ada di migrasi katalog, berupa
 * GIN trigram pada product_translation.title.
 */
export function useDebounce<T>(value: T, delay = 320): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
