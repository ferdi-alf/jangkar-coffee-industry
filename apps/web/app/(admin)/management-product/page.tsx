"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/modules/admin/components/AdminShell";
import { ProductFormDrawer } from "@/modules/product/components/ProductFormDrawer";
import type { ProductDetail, ProductListItem } from "@/modules/product/contracts/product";
import { useDeleteProduct, useProductDetail, useProductList } from "@/modules/product/hooks/useProducts";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { DataTable, type Column } from "@/shared/components/DataTable";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { ApiError } from "@/shared/lib/api-client";

/**
 * Kelola produk: tabel CRUD.
 *
 * Halaman ini berpasangan dengan /product, dan pembagiannya disengaja.
 * /product adalah katalog untuk MELIHAT, dengan kartu dan laci bawah.
 * Halaman ini untuk MENGUBAH, dengan tabel dan laci kanan. Keduanya memakai
 * cache TanStack yang sama, jadi menyimpan di sini langsung terlihat di sana.
 *
 * Pencariannya ber-debounce 320ms dan didukung indeks GIN trigram di basis
 * data. Halamannya kembali ke 1 setiap kata kunci berubah, kalau tidak
 * pengguna bisa terdampar di halaman 4 dari hasil yang cuma punya satu halaman.
 */
const rupiah = (value: number | null, note: string | null) => {
  if (note) return note;
  if (value === null) return "-";
  return `Rp ${value.toLocaleString("id-ID")}`;
};

export default function ManagementProductPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search);

  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState<ProductListItem | null>(null);

  const list = useProductList({ page, perPage: 20, q: debounced || undefined });
  const detail = useProductDetail(editing);
  const remove = useDeleteProduct();

  const columns: Column<ProductListItem>[] = [
    { key: "sku", header: "SKU", width: "120px", render: (row) => <code>{row.sku}</code> },
    {
      key: "title",
      header: "Judul",
      render: (row) => (
        <div>
          <strong>{row.title}</strong>
          {row.isSoldOut ? (
            /* Habis dibawa DUA penanda, teks dan coretan, tidak pernah warna
               saja. Aturan aksesibilitas yang sama dengan menu di situs. */
            <span className="adm-badge" data-tone="danger" style={{ marginLeft: 8 }}>
              Habis
            </span>
          ) : null}
        </div>
      ),
    },
    { key: "price", header: "Harga", numeric: true, render: (row) => rupiah(row.basePrice, row.priceNote) },
    {
      key: "status",
      header: "Status",
      width: "120px",
      render: (row) => (
        <span
          className="adm-badge"
          data-tone={row.status === "published" ? "ok" : row.status === "draft" ? "warn" : "muted"}
        >
          {row.status === "published" ? "Tayang" : row.status === "draft" ? "Draf" : "Arsip"}
        </span>
      ),
    },
    {
      key: "ecommerce",
      header: "Ecommerce",
      width: "110px",
      render: (row) =>
        row.isEcommerce ? (
          <span className="adm-badge" data-tone="accent">
            Ya
          </span>
        ) : (
          <span className="adm-badge" data-tone="muted">
            Tidak
          </span>
        ),
    },
    {
      key: "actions",
      header: "",
      width: "108px",
      render: (row) => (
        <div className="adm-cell-actions">
          <button
            type="button"
            className="adm-btn"
            data-variant="ghost"
            data-icon="true"
            aria-label={`Ubah ${row.title}`}
            onClick={(event) => {
              event.stopPropagation();
              setEditing(row.id);
            }}
          >
            <Pencil size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="adm-btn"
            data-variant="ghost"
            data-icon="true"
            aria-label={`Hapus ${row.title}`}
            onClick={(event) => {
              event.stopPropagation();
              setRemoving(row);
            }}
          >
            <Trash2 size={15} aria-hidden="true" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminShell>
      <DataTable
        columns={columns}
        rows={list.data?.data ?? []}
        loading={list.isLoading}
        emptyLabel={debounced ? "Tidak ada produk yang cocok." : "Belum ada produk."}
        search={search}
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Cari judul produk..."
        toolbar={
          <button
            type="button"
            className="adm-btn"
            data-variant="primary"
            onClick={() => setCreating(true)}
          >
            <Plus size={15} aria-hidden="true" />
            Tambah produk
          </button>
        }
        page={page}
        totalPages={list.data?.meta.totalPages ?? 1}
        total={list.data?.meta.total ?? 0}
        onPage={setPage}
      />

      <ProductFormDrawer open={creating} product={null} onClose={() => setCreating(false)} />
      <ProductFormDrawer
        open={Boolean(editing)}
        product={(detail.data as ProductDetail | undefined) ?? null}
        onClose={() => setEditing(null)}
      />

      {/* Konfirmasi hapus: satu keputusan, jadi dialog, bukan laci. Fokus awal
          mendarat di tombol batal supaya Enter yang tidak sengaja tidak
          menghapus apa pun. */}
      <ConfirmDialog
        open={Boolean(removing)}
        title="Hapus produk ini?"
        description={removing ? `${removing.sku} ${removing.title}` : undefined}
        onClose={() => setRemoving(null)}
        footer={
          <>
            <button type="button" className="adm-btn" data-autofocus onClick={() => setRemoving(null)}>
              Batal
            </button>
            <button
              type="button"
              className="adm-btn"
              data-variant="danger"
              disabled={remove.isPending}
              onClick={() => {
                if (!removing) return;
                remove.mutate(removing.id, {
                  onSuccess: () => {
                    toast.success("Produk dihapus.");
                    setRemoving(null);
                  },
                  onError: (error) =>
                    toast.error(error instanceof ApiError ? error.message : "Gagal menghapus."),
                });
              }}
            >
              {remove.isPending ? "Menghapus..." : "Hapus"}
            </button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: "0.86rem", lineHeight: 1.6 }}>
          Terjemahan, varian, kanal, dan tautan marketplace produk ini ikut terhapus. Tindakan ini
          tidak bisa dibatalkan.
        </p>
      </ConfirmDialog>
    </AdminShell>
  );
}
