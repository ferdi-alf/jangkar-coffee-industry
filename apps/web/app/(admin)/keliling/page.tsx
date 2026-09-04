"use client";

import { Download, Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/modules/admin/components/AdminShell";
import { ImportFromMenuDialog } from "@/modules/product/components/ImportFromMenuDialog";
import { ProductFormDrawer } from "@/modules/product/components/ProductFormDrawer";
import type { ProductDetail, ProductListItem } from "@/modules/product/contracts/product";
import {
  useProductDetail,
  useProductList,
  useSetChannel,
} from "@/modules/product/hooks/useProducts";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { DataTable, type Column } from "@/shared/components/DataTable";
import { ApiError } from "@/shared/lib/api-client";

/**
 * Menu keliling: apa yang dibawa armada.
 *
 * DUA CARA MENAMBAH, sesuai permintaan pemilik proyek:
 *
 *   1. Impor dari menu utama. Sebagian besar yang dibawa armada memang item
 *      yang sama dengan di gerai, jadi mengetiknya ulang berarti dua baris
 *      produk untuk satu minuman, dengan harga yang cepat atau lambat berbeda.
 *   2. Buat baru. Untuk item yang HANYA ada di armada dan tidak pernah dijual
 *      di gerai.
 *
 * Mengeluarkan item dari sini TIDAK MENGHAPUS PRODUKNYA, hanya mematikan kanal
 * keliling. Produknya tetap hidup di /menu. Ini pembedaan yang harus jelas di
 * layar, bukan cuma di kode, karena tombol yang salah dimengerti di sini bisa
 * menghapus item dari seluruh situs.
 *
 * PENGELOMPOKAN COFFEE DAN NON-COFFEE ADALAH ATURAN TAMPILAN, bukan skema.
 * Poster armada membagi menunya jadi dua kelompok, sedangkan tiap produk hanya
 * punya satu kategori yang mengikuti menu gerai. Aturannya: berkategori
 * `non-coffee` masuk Non-Coffee, sisanya Coffee. Lihat
 * modules/home/lib/keliling-menu.ts.
 */
const rupiah = (value: number | null, note: string | null) => {
  if (note) return note;
  if (value === null) return "-";
  return `Rp ${value.toLocaleString("id-ID")}`;
};

export default function KelilingPage() {
  const [page, setPage] = useState(1);
  const [importing, setImporting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [removing, setRemoving] = useState<ProductListItem | null>(null);

  /* Saring `channel=keliling` hanya memulangkan yang kanalnya AVAILABLE, jadi
     daftar ini memang isi menu armada, bukan seluruh katalog. */
  const list = useProductList({ page, perPage: 50, channel: "keliling" });
  const detail = useProductDetail(editing);
  const setChannel = useSetChannel();

  const rows = list.data?.data ?? [];
  const alreadyIn = new Set(rows.map((row) => row.id));

  function removeFromMenu(row: ProductListItem): void {
    setChannel.mutate(
      { id: row.id, channels: [{ channel: "keliling", available: false }] },
      {
        onSuccess: () => {
          toast.success(`${row.title} dikeluarkan dari menu keliling.`);
          setRemoving(null);
        },
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : "Gagal mengubah."),
      },
    );
  }

  const columns: Column<ProductListItem>[] = [
    { key: "sku", header: "SKU", width: "120px", render: (row) => <code>{row.sku}</code> },
    {
      key: "title",
      header: "Judul",
      render: (row) => (
        <div>
          <strong>{row.title}</strong>
          {row.isSoldOut ? (
            <span className="adm-badge" data-tone="danger" style={{ marginLeft: 8 }}>
              Habis
            </span>
          ) : null}
          {row.isFavourite ? (
            <span className="adm-badge" data-tone="accent" style={{ marginLeft: 8 }}>
              Favorit
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "group",
      header: "Kelompok",
      width: "130px",
      /* Kelompok yang benar-benar dipakai situs, dihitung dengan aturan yang
         sama persis. Menampilkannya di sini membuat akibat dari mengganti
         kategori terlihat sebelum seseorang membuka situsnya. */
      render: (row) => (
        <span className="adm-badge" data-tone={row.categorySlug === "non-coffee" ? "muted" : "accent"}>
          {row.categorySlug === "non-coffee" ? "Non-Coffee" : "Coffee"}
        </span>
      ),
    },
    {
      key: "price",
      header: "Harga",
      numeric: true,
      render: (row) => rupiah(row.basePrice, row.priceNote),
    },
    {
      key: "actions",
      header: "",
      width: "150px",
      render: (row) => (
        <div className="adm-cell-actions">
          <button
            type="button"
            className="adm-btn"
            data-variant="ghost"
            onClick={(event) => {
              event.stopPropagation();
              setRemoving(row);
            }}
          >
            <X size={14} aria-hidden="true" />
            Keluarkan
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminShell>
      <DataTable
        columns={columns}
        rows={rows}
        loading={list.isLoading}
        emptyLabel="Belum ada item di menu keliling. Impor dari menu utama atau buat baru."
        toolbar={
          <>
            <button
              type="button"
              className="adm-btn"
              data-variant="primary"
              onClick={() => setImporting(true)}
            >
              <Download size={15} aria-hidden="true" />
              Impor dari menu utama
            </button>
            <button type="button" className="adm-btn" onClick={() => setCreating(true)}>
              <Plus size={15} aria-hidden="true" />
              Buat item baru
            </button>
          </>
        }
        page={page}
        totalPages={list.data?.meta.totalPages ?? 1}
        total={list.data?.meta.total ?? 0}
        onPage={setPage}
        onRowClick={(row) => setEditing(row.id)}
      />

      <ImportFromMenuDialog
        open={importing}
        alreadyIn={alreadyIn}
        onClose={() => setImporting(false)}
      />

      {/* Item baru dari sini langsung menyala di kanal keliling SAJA. Kalau ia
          juga dijual di gerai, tempatnya memang di /menu lalu diimpor. */}
      <ProductFormDrawer
        open={creating}
        product={null}
        variant="menu"
        defaultChannels={["keliling"]}
        onClose={() => setCreating(false)}
      />
      <ProductFormDrawer
        open={Boolean(editing)}
        product={(detail.data as ProductDetail | undefined) ?? null}
        variant="menu"
        onClose={() => setEditing(null)}
      />

      <ConfirmDialog
        open={Boolean(removing)}
        title="Keluarkan dari menu keliling?"
        description={removing ? removing.title : undefined}
        onClose={() => setRemoving(null)}
        footer={
          <>
            <button
              type="button"
              className="adm-btn"
              data-autofocus
              onClick={() => setRemoving(null)}
            >
              Batal
            </button>
            <button
              type="button"
              className="adm-btn"
              data-variant="danger"
              disabled={setChannel.isPending}
              onClick={() => removing && removeFromMenu(removing)}
            >
              {setChannel.isPending ? "Menyimpan..." : "Keluarkan"}
            </button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: "0.86rem", lineHeight: 1.6 }}>
          Produknya TIDAK dihapus. Ia hanya berhenti tampil di menu armada dan tetap ada di menu
          utama, jadi bisa diimpor lagi kapan saja.
        </p>
      </ConfirmDialog>
    </AdminShell>
  );
}
