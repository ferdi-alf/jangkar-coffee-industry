"use client";

import { Check, Plus, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { ApiError } from "@/shared/lib/api-client";

import type { ProductListItem } from "../contracts/product";
import { useProductList, useSetChannel } from "../hooks/useProducts";

/** Berapa hasil yang ditampilkan sekaligus. Sengaja kecil. */
const MAX_RESULTS = 20;

/**
 * Mengimpor item dari menu utama ke menu keliling.
 *
 * SENGAJA KOSONG SAMPAI ADA YANG DIKETIK, dan ini permintaan eksplisit pemilik
 * proyek: "jangan langsung munculkan semua daftar menu, ditakutkan akan
 * kebanyakan muncul datanya". Katalognya 34 produk hari ini dan akan bertambah,
 * dan daftar sepanjang itu yang tumpah begitu dialog dibuka membuat pencarian
 * jadi mustahil justru pada saat paling dibutuhkan.
 *
 * Karena itu keadaan awalnya BUKAN daftar kosong yang menyesatkan, melainkan
 * ajakan mengetik. Daftar kosong terbaca sebagai "tidak ada data", ajakan
 * terbaca sebagai "giliran Anda".
 *
 * Item yang SUDAH ada di menu keliling tetap muncul di hasil, tapi ditandai dan
 * tombolnya mati. Menyembunyikannya akan membuat pencarian yang gagal terasa
 * seperti item itu hilang dari sistem.
 */
export function ImportFromMenuDialog({
  open,
  onClose,
  alreadyIn,
}: {
  open: boolean;
  onClose: () => void;
  /** Id yang sudah ada di menu keliling, apa pun status ketersediaannya. */
  alreadyIn: Set<string>;
}) {
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search);
  const setChannel = useSetChannel();

  /* Kuerinya MATI sampai ada kata kunci. `enabled` di bawah yang menjamin
     tidak ada satu permintaan pun terkirim saat dialog baru dibuka. */
  const hasQuery = debounced.trim().length > 0;
  const list = useProductList(
    { page: 1, perPage: MAX_RESULTS, q: debounced || undefined, ecommerce: false },
    { enabled: open && hasQuery },
  );

  function add(row: ProductListItem): void {
    setChannel.mutate(
      { id: row.id, channels: [{ channel: "keliling", available: true }] },
      {
        onSuccess: () => toast.success(`${row.title} masuk menu keliling.`),
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : "Gagal menambahkan."),
      },
    );
  }

  const rows = list.data?.data ?? [];

  return (
    <ConfirmDialog
      open={open}
      title="Impor dari menu utama"
      description="Ketik untuk mencari. Daftar sengaja tidak ditampilkan sekaligus."
      onClose={onClose}
      footer={
        <button type="button" className="adm-btn" data-autofocus onClick={onClose}>
          Selesai
        </button>
      }
    >
      <div className="adm-field">
        <label htmlFor="import-search">Cari item menu</label>
        <input
          id="import-search"
          className="adm-input"
          type="search"
          autoComplete="off"
          placeholder="Misalnya: kopi susu"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {!hasQuery ? (
        <p className="adm-empty" style={{ padding: "18px 0" }}>
          <Search size={16} aria-hidden="true" />
          <span style={{ marginLeft: 8 }}>Ketik nama item untuk mulai mencari.</span>
        </p>
      ) : list.isLoading ? (
        <div className="adm-skel" style={{ height: 96 }} />
      ) : rows.length === 0 ? (
        <p className="adm-empty" style={{ padding: "18px 0" }}>
          Tidak ada item menu yang cocok.
        </p>
      ) : (
        <ul className="adm-pick-list">
          {rows.map((row) => {
            const already = alreadyIn.has(row.id);
            return (
              <li key={row.id}>
                <div>
                  <strong>{row.title}</strong>
                  <span className="adm-pick-sku">{row.sku}</span>
                </div>
                {already ? (
                  <span className="adm-badge" data-tone="ok">
                    <Check size={13} aria-hidden="true" /> Sudah ada
                  </span>
                ) : (
                  <button
                    type="button"
                    className="adm-btn"
                    data-variant="primary"
                    disabled={setChannel.isPending}
                    onClick={() => add(row)}
                  >
                    <Plus size={14} aria-hidden="true" />
                    Tambah
                  </button>
                )}
              </li>
            );
          })}
          {rows.length === MAX_RESULTS ? (
            <li className="adm-pick-note">
              Menampilkan {MAX_RESULTS} hasil pertama. Persempit pencarian bila yang dicari belum
              terlihat.
            </li>
          ) : null}
        </ul>
      )}
    </ConfirmDialog>
  );
}
