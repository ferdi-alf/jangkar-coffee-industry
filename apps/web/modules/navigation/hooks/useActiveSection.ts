"use client";

import { useEffect, useState } from "react";

/**
 * Menandai seksi mana yang sedang dibaca, untuk penanda aktif di navbar.
 *
 * `rootMargin` menyempitkan area pengamatan jadi pita tipis di tengah layar.
 * Tanpa itu, seksi setinggi layar penuh akan dianggap aktif bersamaan dengan
 * tetangganya dan penandanya berkedip bolak-balik saat scroll.
 *
 * `ids` harus referensi stabil, pakai NAV_SECTION_IDS yang dihitung di tingkat
 * modul. Array baru tiap render akan memasang ulang observer terus menerus.
 */
export function useActiveSection(ids: readonly string[]): string | null {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.2, 0.6, 1] },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ids]);

  return active;
}
