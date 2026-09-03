"use client";

import { useId, useState, type ReactNode } from "react";

/**
 * Tab ID dan EN untuk setiap input teks yang tampil publik.
 *
 * Aturan produk, dan berlaku DI SEMUA FORM, bukan hanya form produk: input
 * berisi teks publik dibungkus dua tab, dan input yang tidak bergantung bahasa
 * diletakkan di bawah blok tab. Prop `shared` yang mewujudkan bagian kedua itu,
 * jadi susunannya ditegakkan komponen dan tidak bisa lupa diterapkan.
 *
 * KEDUA PANEL SELALU ADA DI DOM, yang tidak aktif hanya disembunyikan. Ini
 * penting untuk form: kalau panel EN dilepas saat tab ID dibuka, isian EN yang
 * belum disimpan akan hilang begitu pengguna berpindah tab.
 */
export function LocaleTabs({
  id,
  en,
  shared,
  sharedLabel = "Tidak bergantung bahasa",
}: {
  id: ReactNode;
  en: ReactNode;
  shared?: ReactNode;
  sharedLabel?: string;
}) {
  const [active, setActive] = useState<"id" | "en">("id");
  const uid = useId();

  return (
    <div>
      <div className="adm-tabs" role="tablist" aria-label="Bahasa">
        {(["id", "en"] as const).map((locale) => (
          <button
            key={locale}
            type="button"
            role="tab"
            id={`${uid}-tab-${locale}`}
            aria-selected={active === locale}
            aria-controls={`${uid}-panel-${locale}`}
            className="adm-tab"
            onClick={() => setActive(locale)}
          >
            {locale === "id" ? "Indonesia" : "English"}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`${uid}-panel-id`}
        aria-labelledby={`${uid}-tab-id`}
        hidden={active !== "id"}
      >
        {id}
      </div>
      <div
        role="tabpanel"
        id={`${uid}-panel-en`}
        aria-labelledby={`${uid}-tab-en`}
        hidden={active !== "en"}
      >
        {en}
      </div>

      {shared ? (
        <div className="adm-shared-fields">
          <p className="adm-shared-label">{sharedLabel}</p>
          {shared}
        </div>
      ) : null}
    </div>
  );
}
