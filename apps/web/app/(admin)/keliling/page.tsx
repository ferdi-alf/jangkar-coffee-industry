"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/modules/admin/components/AdminShell";
import type { ProductListItem } from "@/modules/product/contracts/product";
import { useProductList, useSetChannel } from "@/modules/product/hooks/useProducts";
import { DataTable, type Column } from "@/shared/components/DataTable";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { ApiError } from "@/shared/lib/api-client";

/**
 * Menu armada Jangkar Keliling.
 *
 * HALAMAN INI DULU MENGURUS UNIT ARMADA DAN JADWAL TITIK SINGGAH, dan itu
 * salah. Seksi Keliling di situs hanya menampilkan MENU, logo, dan satu baris
 * "jadwal titik henti menyusul". Tidak ada jumlah armada, tidak ada lokasi.
 * Jadi panel mengelola data yang tidak pernah dilihat satu pengunjung pun, dan
 * pemilik proyek menunjuk itu. Tabel `keliling_unit` dan `keliling_schedule`
 * beserta modul API-nya sudah dihapus.
 *
 * Penggantinya bukan tabel baru. Isi menu Keliling sejak awal sudah punya
 * tempatnya sendiri, yaitu `product_channel` dengan channel 'keliling', dan
 * halaman inilah yang mengelolanya. Situs membacanya lewat
 * modules/home/lib/keliling-menu.ts, jadi sakelar di sini benar-benar mengubah
 * apa yang tampil.
 *
 * BOLEH DIUBAH STAFF, sama seperti penanda habis. Menyusun isi menu armada
 * adalah operasi harian, dan orang yang mendorong gerobaknya yang paling tahu
 * apa yang dibawa hari itu. Pagarnya ada di router Express pada endpoint
 * PATCH /products/:id/channels.
 *
 * SAKELARNYA <input type="checkbox"> BIASA, bukan tombol bergaya. Ia sudah
 * membawa peran, keadaan, dan dukungan keyboard bawaan peramban, dan tidak ada
 * satu pun dari itu yang perlu ditulis ulang untuk mendapat rupa yang sedikit
 * lebih rapi.
 */
const rupiah = (value: number | null, note: string | null) => {
  if (note) return note;
  if (value === null) return "-";
  return `Rp ${value.toLocaleString("id-ID")}`;
};

export default function MenuArmadaPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [onlyKeliling, setOnlyKeliling] = useState(false);
  const debounced = useDebounce(search);

  const list = useProductList({
    page,
    perPage: 20,
    q: debounced || undefined,
    status: "published",
    channel: onlyKeliling ? "keliling" : undefined,
  });
  const setChannel = useSetChannel();

  const isOn = (row: ProductListItem) =>
    row.channels.some((c) => c.channel === "keliling" && c.available);

  const columns: Column<ProductListItem>[] = [
    {
      key: "on",
      header: "Di menu",
      width: "90px",
      render: (row) => {
        const on = isOn(row);
        return (
          <label
            style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", minHeight: 24 }}
            onClick={(event) => event.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={on}
              disabled={setChannel.isPending}
              aria-label={`${on ? "Keluarkan" : "Masukkan"} ${row.title} ${on ? "dari" : "ke"} menu armada`}
              onChange={() =>
                setChannel.mutate(
                  { id: row.id, channel: "keliling", available: !on },
                  {
                    onSuccess: () =>
                      toast.success(
                        on ? `${row.title} dikeluarkan dari menu armada.` : `${row.title} masuk menu armada.`,
                      ),
                    onError: (error) =>
                      toast.error(
                        error instanceof ApiError && error.status === 403
                          ? "Peran Anda tidak berwenang mengubah menu."
                          : "Gagal menyimpan.",
                      ),
                  },
                )
              }
            />
            {/* Keadaannya tidak dibawa centang saja: ada teks pendampingnya,
                jadi ia terbaca tanpa bergantung persepsi bentuk. */}
            <span style={{ fontSize: "0.74rem", color: "var(--a-text-2)" }}>{on ? "Ya" : "Tidak"}</span>
          </label>
        );
      },
    },
    {
      key: "title",
      header: "Item",
      render: (row) => (
        <div>
          <strong>{row.title}</strong>
          {row.isFavourite ? (
            <span className="adm-badge" data-tone="accent" style={{ marginLeft: 8 }}>
              <Star size={11} aria-hidden="true" />
              Favorit
            </span>
          ) : null}
          {row.isSoldOut ? (
            <span className="adm-badge" data-tone="danger" style={{ marginLeft: 8 }}>
              Habis
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "group",
      header: "Kelompok di menu",
      width: "170px",
      render: (row) => (
        <span className="adm-badge" data-tone="muted">
          {row.categorySlug === "non-coffee" ? "Non-Coffee" : "Coffee"}
        </span>
      ),
    },
    { key: "price", header: "Harga", numeric: true, width: "120px", render: (row) => rupiah(row.basePrice, row.priceNote) },
  ];

  return (
    <AdminShell>
      <DataTable
        columns={columns}
        rows={list.data?.data ?? []}
        loading={list.isLoading}
        emptyLabel={
          onlyKeliling ? "Belum ada item di menu armada." : "Tidak ada produk yang cocok."
        }
        search={search}
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Cari item..."
        toolbar={
          <label
            className="adm-btn"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer" }}
          >
            <input
              type="checkbox"
              checked={onlyKeliling}
              onChange={(event) => {
                setOnlyKeliling(event.target.checked);
                setPage(1);
              }}
            />
            Hanya yang di menu
          </label>
        }
        page={page}
        totalPages={list.data?.meta.totalPages ?? 1}
        total={list.data?.meta.total ?? 0}
        onPage={setPage}
      />

      <div className="adm-card">
        <div className="adm-card-body">
          <p style={{ margin: 0, fontSize: "0.84rem", lineHeight: 1.7, color: "var(--a-text-2)" }}>
            Menu armada di situs mengelompokkan item jadi dua, Coffee dan Non-Coffee, mengikuti
            poster aslinya. Kelompoknya ditentukan kategori produk: yang berkategori Non-Coffee
            masuk kelompok Non-Coffee, sisanya Coffee. Ubah kategorinya di Kelola produk kalau
            sebuah item perlu berpindah kelompok.
          </p>
          <p style={{ margin: "10px 0 0", fontSize: "0.84rem", lineHeight: 1.7, color: "var(--a-text-2)" }}>
            Harga di menu armada selalu sama dengan harga outlet. Itu fakta dari kedua menu
            cetaknya, dan karena keduanya membaca produk yang sama, harganya mustahil berbeda.
          </p>
        </div>
      </div>
    </AdminShell>
  );
}
