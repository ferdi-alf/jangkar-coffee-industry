"use client";

import { useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/modules/admin/components/AdminShell";
import type { ProductListItem } from "@/modules/product/contracts/product";
import { useProductDetail, useProductList, useToggleSoldOut } from "@/modules/product/hooks/useProducts";
import { DetailDrawer } from "@/shared/components/DetailDrawer";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { ApiError } from "@/shared/lib/api-client";

/**
 * Katalog produk, berorientasi BACA.
 *
 * Ini halaman yang menjalankan aturan pengambilan sebagian secara nyata.
 * Daftarnya membawa judul, gambar, deskripsi, dan harga. Mengklik kartu membuka
 * laci bawah, dan laci itu hanya meminta medan yang BELUM ada di cache lewat
 * `?fields=`. Isian awal laci diambil dari cache daftar, jadi ia langsung
 * berisi dan tidak pernah tampil kosong sedetik pun.
 *
 * Satu-satunya perubahan yang bisa dilakukan dari sini adalah penanda habis,
 * dan itu memang satu-satunya perubahan produk yang boleh dilakukan staff.
 * Selebihnya ada di halaman Kelola produk.
 */
const rupiah = (value: number | null, note: string | null) => {
  if (note) return note;
  if (value === null) return "-";
  return `Rp ${value.toLocaleString("id-ID")}`;
};

export default function ProductCataloguePage() {
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search);
  const [openId, setOpenId] = useState<string | null>(null);

  const list = useProductList({ page: 1, perPage: 60, q: debounced || undefined });
  const detail = useProductDetail(openId);
  const toggle = useToggleSoldOut();

  const rows = (list.data?.data ?? []) as ProductListItem[];
  const current = detail.data;

  return (
    <AdminShell>
      <div className="adm-card">
        <div className="adm-toolbar">
          <div className="adm-search">
            <input
              className="adm-input"
              type="search"
              value={search}
              placeholder="Cari produk..."
              aria-label="Cari produk"
              onChange={(event) => setSearch(event.target.value)}
              style={{ paddingLeft: 12 }}
            />
          </div>
          <span className="adm-hint" style={{ marginLeft: "auto" }}>
            {list.data?.meta.total ?? 0} produk
          </span>
        </div>

        <div className="adm-card-body">
          {list.isLoading ? (
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="adm-skel" style={{ height: 120 }} />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="adm-empty">Belum ada produk.</p>
          ) : (
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "grid",
                gap: 12,
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              }}
            >
              {rows.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(row.id)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: 14,
                      border: "1px solid var(--a-line)",
                      borderRadius: "var(--a-radius)",
                      background: "var(--a-surface)",
                      cursor: "pointer",
                      font: "inherit",
                      color: "inherit",
                    }}
                  >
                    <code style={{ fontSize: "0.7rem", color: "var(--a-text-3)" }}>{row.sku}</code>
                    <p style={{ margin: "6px 0 0", fontWeight: 600, fontSize: "0.9rem" }}>
                      {/* Habis dicoret DAN dilabeli, bukan sekadar diredupkan.
                          Warna tidak pernah jadi satu-satunya pembawa makna. */}
                      <span style={row.isSoldOut ? { textDecoration: "line-through" } : undefined}>
                        {row.title}
                      </span>
                    </p>
                    <p style={{ margin: "6px 0 0", fontSize: "0.84rem", fontWeight: 700 }}>
                      {rupiah(row.basePrice, row.priceNote)}
                    </p>
                    <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <span
                        className="adm-badge"
                        data-tone={row.status === "published" ? "ok" : "warn"}
                      >
                        {row.status === "published" ? "Tayang" : row.status === "draft" ? "Draf" : "Arsip"}
                      </span>
                      {row.isSoldOut ? (
                        <span className="adm-badge" data-tone="danger">
                          Habis
                        </span>
                      ) : null}
                      {row.isEcommerce ? (
                        <span className="adm-badge" data-tone="accent">
                          Ecommerce
                        </span>
                      ) : null}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <DetailDrawer
        open={Boolean(openId)}
        title={current?.title ?? "Detail produk"}
        description={current?.sku}
        onClose={() => setOpenId(null)}
      >
        {!current ? (
          <div className="adm-skel" style={{ height: 120 }} />
        ) : (
          <div style={{ display: "grid", gap: 18, maxWidth: 720 }}>
            <div className="adm-row-2">
              <div>
                <p className="adm-shared-label">Harga</p>
                <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>
                  {rupiah(current.basePrice, current.priceNote)}
                </p>
              </div>
              <div>
                <p className="adm-shared-label">Ketersediaan</p>
                <button
                  type="button"
                  className="adm-btn"
                  disabled={toggle.isPending}
                  onClick={() =>
                    toggle.mutate(
                      { id: current.id, isSoldOut: !current.isSoldOut },
                      {
                        onSuccess: () =>
                          toast.success(current.isSoldOut ? "Ditandai tersedia." : "Ditandai habis."),
                        onError: (error) =>
                          toast.error(error instanceof ApiError ? error.message : "Gagal mengubah."),
                      },
                    )
                  }
                >
                  {current.isSoldOut ? "Tandai tersedia" : "Tandai habis"}
                </button>
              </div>
            </div>

            <div>
              <p className="adm-shared-label">Teks dua bahasa</p>
              <div className="adm-row-2">
                {(["id", "en"] as const).map((locale) => (
                  <div key={locale}>
                    <p style={{ margin: "0 0 4px", fontWeight: 600, fontSize: "0.84rem" }}>
                      {locale === "id" ? "Indonesia" : "English"}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.86rem" }}>
                      {current.translations?.[locale].title || (
                        <span className="adm-error">Belum diisi</span>
                      )}
                    </p>
                    <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "var(--a-text-2)" }}>
                      {current.translations?.[locale].description ?? "Tanpa deskripsi."}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="adm-shared-label">Tautan toko</p>
              {current.marketplaceLinks?.length ? (
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.84rem" }}>
                  {current.marketplaceLinks.map((link) => (
                    <li key={link.marketplace}>
                      {link.marketplace === "shopee" ? "Shopee" : "Tokopedia"}:{" "}
                      <a href={link.url} target="_blank" rel="noopener noreferrer">
                        {link.url}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ margin: 0, fontSize: "0.84rem", color: "var(--a-text-2)" }}>
                  Belum ada tautan. Tombol di situs tetap tampil tapi tidak menavigasi.
                </p>
              )}
            </div>

            {current.variants?.length ? (
              <div>
                <p className="adm-shared-label">Varian</p>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.84rem" }}>
                  {current.variants.map((variant) => (
                    <li key={variant.id}>
                      {variant.label}, Rp {variant.price.toLocaleString("id-ID")}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {current.audit ? (
              <p className="adm-hint">
                Dibuat {new Date(current.audit.createdAt).toLocaleString("id-ID")}, terakhir diubah{" "}
                {new Date(current.audit.updatedAt).toLocaleString("id-ID")}.
              </p>
            ) : null}
          </div>
        )}
      </DetailDrawer>
    </AdminShell>
  );
}
