"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { DataTable, type Column } from "@/shared/components/DataTable";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { ApiError } from "@/shared/lib/api-client";

import type { ProductListItem } from "../contracts/product";
import { useDeleteProduct, useProductList } from "../hooks/useProducts";

/**
 * Tabel katalog, dipakai /menu dan /ecommerce.
 *
 * Keduanya membaca endpoint yang sama dengan saring `ecommerce` yang berbeda,
 * dan menampilkan kolom yang hampir sama. Yang berbeda hanya satu kolom:
 * halaman ecommerce menampilkan penanda tautan toko, halaman menu tidak, karena
 * menu memang tidak punya tautan toko sama sekali.
 *
 * Pencariannya ber-debounce 320ms dan didukung indeks GIN trigram di basis
 * data. Halamannya kembali ke 1 setiap kata kunci berubah, kalau tidak pengguna
 * bisa terdampar di halaman 4 dari hasil yang cuma punya satu halaman.
 */
const rupiah = (value: number | null, note: string | null) => {
  if (note) return note;
  if (value === null) return "-";
  return `Rp ${value.toLocaleString("id-ID")}`;
};

export function CatalogTable({
  ecommerce,
  emptyLabel,
  searchPlaceholder,
  addLabel,
  onAdd,
  onEdit,
}: {
  ecommerce: boolean;
  emptyLabel: string;
  searchPlaceholder: string;
  addLabel: string;
  onAdd: () => void;
  onEdit: (id: string) => void;
}) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search);
  const [removing, setRemoving] = useState<ProductListItem | null>(null);

  const list = useProductList({
    page,
    perPage: 20,
    q: debounced || undefined,
    ecommerce,
  });
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
            /* Habis dibawa DUA penanda, teks dan lencana, tidak pernah warna
               saja. Aturan aksesibilitas yang sama dengan menu di situs. */
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
    ...(ecommerce
      ? []
      : [
          {
            key: "category",
            header: "Kategori",
            width: "150px",
            /* KOLOM INI ADA UNTUK SATU ALASAN. Menu di situs dikelompokkan
               menurut kategori, dan kartunya ADALAH kategorinya. Item tanpa
               kategori karena itu tidak punya kartu untuk ditempati dan tidak
               akan tampil sama sekali. Tanpa penanda di sini, satu-satunya
               gejalanya adalah item yang hilang dari situs tanpa penjelasan. */
            render: (row: ProductListItem) =>
              row.categorySlug ? (
                <span className="adm-badge" data-tone="muted">
                  {row.categorySlug}
                </span>
              ) : (
                <span className="adm-badge" data-tone="warn">
                  Tanpa kategori, tidak tampil
                </span>
              ),
          } as Column<ProductListItem>,
        ]),
    {
      key: "price",
      header: "Harga",
      numeric: true,
      render: (row) => rupiah(row.basePrice, row.priceNote),
    },
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
    ...(ecommerce
      ? [
          {
            key: "links",
            header: "Tautan toko",
            width: "150px",
            render: (row: ProductListItem) => {
              const count = row.marketplaceLinks.length;
              /* Angka DAN kata, bukan sekadar lencana berwarna. Nol tautan
                 berarti tombol di situs tampil tapi tidak menavigasi ke mana
                 pun, dan itu perlu terbaca sebagai keadaan, bukan disimpulkan
                 dari warna abu-abu. */
              return count === 0 ? (
                <span className="adm-badge" data-tone="warn">
                  Belum ada
                </span>
              ) : (
                <span className="adm-badge" data-tone="ok">
                  {count} dari 2
                </span>
              );
            },
          } as Column<ProductListItem>,
        ]
      : []),
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
              onEdit(row.id);
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
    <>
      <DataTable
        columns={columns}
        rows={list.data?.data ?? []}
        loading={list.isLoading}
        emptyLabel={debounced ? "Tidak ada yang cocok." : emptyLabel}
        search={search}
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder={searchPlaceholder}
        toolbar={
          <button type="button" className="adm-btn" data-variant="primary" onClick={onAdd}>
            <Plus size={15} aria-hidden="true" />
            {addLabel}
          </button>
        }
        page={page}
        totalPages={list.data?.meta.totalPages ?? 1}
        total={list.data?.meta.total ?? 0}
        onPage={setPage}
        onRowClick={(row) => onEdit(row.id)}
      />

      {/* Konfirmasi hapus: satu keputusan, jadi dialog, bukan laci. Fokus awal
          mendarat di tombol batal supaya Enter yang tidak sengaja tidak
          menghapus apa pun. */}
      <ConfirmDialog
        open={Boolean(removing)}
        title="Hapus item ini?"
        description={removing ? `${removing.sku} ${removing.title}` : undefined}
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
              disabled={remove.isPending}
              onClick={() => {
                if (!removing) return;
                remove.mutate(removing.id, {
                  onSuccess: () => {
                    toast.success("Item dihapus.");
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
          Terjemahan, varian, kanal, dan tautan marketplace item ini ikut terhapus. Tindakan ini
          tidak bisa dibatalkan.
        </p>
      </ConfirmDialog>
    </>
  );
}
