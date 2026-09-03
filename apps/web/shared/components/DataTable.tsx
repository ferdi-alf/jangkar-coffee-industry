"use client";

import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Tabel data panel, dengan pencarian dan paginasi.
 *
 * TINGGINYA TETAP dan isinya yang menggulung, bukan kontainernya yang memanjang.
 * Aturan dashboard: kartu dan tabel dalam satu baris memakai tinggi tetap yang
 * sama. Ditegakkan komponen lewat `fixed`, bukan diingat manusia tiap kali.
 *
 * PENCARIANNYA BER-DEBOUNCE di pemanggilnya lewat useDebounce, dan didukung
 * indeks GIN trigram di basis data. Keduanya perlu: tanpa debounce mengetik
 * sepuluh huruf mengirim sepuluh permintaan, tanpa indeks tiap permintaan itu
 * memindai seluruh tabel.
 *
 * TOMBOL PAGINASI DI BAWAH TABEL, sesuai aturan dashboard.
 */
export interface Column<T> {
  key: string;
  header: string;
  numeric?: boolean;
  width?: string;
  render: (row: T) => ReactNode;
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  loading,
  emptyLabel = "Belum ada data.",
  search,
  onSearch,
  searchPlaceholder = "Cari...",
  toolbar,
  page,
  totalPages,
  total,
  onPage,
  onRowClick,
  fixed = "fill",
}: {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  emptyLabel?: string;
  search?: string;
  onSearch?: (value: string) => void;
  searchPlaceholder?: string;
  toolbar?: ReactNode;
  page: number;
  totalPages: number;
  total: number;
  onPage: (page: number) => void;
  onRowClick?: (row: T) => void;
  /* "fill" mengisi sisa layar, untuk tabel yang berdiri sendiri di halamannya.
     "true" memakai tinggi baris dashboard, untuk tabel yang sebaris dengan
     kartu lain dan harus setinggi tetangganya. */
  fixed?: "fill" | "true" | "sm" | false;
}) {
  return (
    <div className="adm-card" data-fixed={fixed || undefined}>
      {onSearch || toolbar ? (
        <div className="adm-toolbar">
          {onSearch ? (
            <div className="adm-search">
              <Search size={15} aria-hidden="true" />
              <input
                className="adm-input"
                type="search"
                value={search ?? ""}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                onChange={(event) => onSearch(event.target.value)}
              />
            </div>
          ) : null}
          {toolbar ? <div className="adm-card-actions">{toolbar}</div> : null}
        </div>
      ) : null}

      <div className="adm-card-body" data-flush="true">
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key} style={column.width ? { width: column.width } : undefined}>
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, index) => (
                    <tr key={`skeleton-${index}`}>
                      {columns.map((column) => (
                        <td key={column.key}>
                          <div className="adm-skel" />
                        </td>
                      ))}
                    </tr>
                  ))
                : rows.map((row) => (
                    <tr
                      key={row.id}
                      data-clickable={onRowClick ? "true" : undefined}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                    >
                      {columns.map((column) => (
                        <td key={column.key} data-numeric={column.numeric ? "true" : undefined}>
                          {column.render(row)}
                        </td>
                      ))}
                    </tr>
                  ))}
            </tbody>
          </table>

          {!loading && rows.length === 0 ? <p className="adm-empty">{emptyLabel}</p> : null}
        </div>
      </div>

      <div className="adm-pager">
        <span>
          {total} baris, halaman {page} dari {Math.max(totalPages, 1)}
        </span>
        <div className="adm-pager-actions">
          <button
            type="button"
            className="adm-btn"
            data-icon="true"
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
            aria-label="Halaman sebelumnya"
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="adm-btn"
            data-icon="true"
            disabled={page >= totalPages}
            onClick={() => onPage(page + 1)}
            aria-label="Halaman berikutnya"
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
