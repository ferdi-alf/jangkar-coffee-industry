"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/modules/admin/components/AdminShell";
import { useSession } from "@/modules/admin/hooks/useSession";
import {
  useDeleteMessage,
  useMessageList,
  useSetMessageStatus,
  type ContactMessage,
  type ContactStatus,
} from "@/modules/contact/hooks/useMessages";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { DataTable, type Column } from "@/shared/components/DataTable";
import { DetailDrawer } from "@/shared/components/DetailDrawer";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { ApiError } from "@/shared/lib/api-client";

/**
 * Kotak masuk form kontak.
 *
 * Isi pesan bisa panjang, jadi membacanya memakai LACI BAWAH setinggi 85 persen
 * layar, sesuai aturan produk untuk melihat detail data yang banyak.
 *
 * Membuka sebuah pesan berstatus "baru" otomatis menandainya "dibaca". Ini satu
 * satunya perubahan status yang terjadi tanpa diminta, dan ia aman karena tidak
 * menghilangkan apa pun: pengguna tetap bisa mengembalikannya lewat tombol.
 *
 * MENGHAPUS HANYA OWNER. Pagarnya ada di server, dan tombolnya disembunyikan di
 * sini supaya staff tidak menekan tombol yang pasti ditolak.
 */
const STATUS_LABEL: Record<ContactStatus, string> = {
  new: "Baru",
  read: "Dibaca",
  replied: "Dibalas",
  spam: "Spam",
};

const STATUS_TONE: Record<ContactStatus, string> = {
  new: "accent",
  read: "muted",
  replied: "ok",
  spam: "danger",
};

export default function PesanPage() {
  const { user } = useSession();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("");
  const debounced = useDebounce(search);

  const [openRow, setOpenRow] = useState<ContactMessage | null>(null);
  const [removing, setRemoving] = useState<ContactMessage | null>(null);

  const list = useMessageList({
    page,
    perPage: 20,
    q: debounced || undefined,
    status: filter || undefined,
  });
  const setStatus = useSetMessageStatus();
  const remove = useDeleteMessage();

  function openMessage(row: ContactMessage): void {
    setOpenRow(row);
    if (row.status === "new") setStatus.mutate({ id: row.id, status: "read" });
  }

  const columns: Column<ContactMessage>[] = [
    {
      key: "status",
      header: "Status",
      width: "110px",
      render: (row) => (
        <span className="adm-badge" data-tone={STATUS_TONE[row.status]}>
          {STATUS_LABEL[row.status]}
        </span>
      ),
    },
    {
      key: "from",
      header: "Pengirim",
      render: (row) => (
        <div>
          <strong>{row.name}</strong>
          <div style={{ fontSize: "0.78rem", color: "var(--a-text-2)" }}>{row.email}</div>
        </div>
      ),
    },
    {
      key: "message",
      header: "Pesan",
      render: (row) => (
        <span style={{ display: "block", maxWidth: 420, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {row.message}
        </span>
      ),
    },
    {
      key: "at",
      header: "Masuk",
      width: "150px",
      render: (row) => new Date(row.createdAt).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" }),
    },
  ];

  if (user?.role === "owner") {
    columns.push({
      key: "actions",
      header: "",
      width: "64px",
      render: (row) => (
        <div className="adm-cell-actions">
          <button
            type="button"
            className="adm-btn"
            data-variant="ghost"
            data-icon="true"
            aria-label={`Hapus pesan dari ${row.name}`}
            onClick={(event) => {
              event.stopPropagation();
              setRemoving(row);
            }}
          >
            <Trash2 size={15} aria-hidden="true" />
          </button>
        </div>
      ),
    });
  }

  return (
    <AdminShell>
      <DataTable
        columns={columns}
        rows={list.data?.data ?? []}
        loading={list.isLoading}
        emptyLabel={filter || debounced ? "Tidak ada pesan yang cocok." : "Belum ada pesan masuk."}
        search={search}
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Cari nama atau email..."
        toolbar={
          <div className="adm-field" style={{ margin: 0 }}>
            <label htmlFor="msg-filter" className="adm-hint">
              Saring status
            </label>
            <select
              id="msg-filter"
              className="adm-select"
              value={filter}
              onChange={(event) => {
                setFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="">Semua</option>
              <option value="new">Baru</option>
              <option value="read">Dibaca</option>
              <option value="replied">Dibalas</option>
              <option value="spam">Spam</option>
            </select>
          </div>
        }
        page={page}
        totalPages={list.data?.meta.totalPages ?? 1}
        total={list.data?.meta.total ?? 0}
        onPage={setPage}
        onRowClick={openMessage}
      />

      <DetailDrawer
        open={Boolean(openRow)}
        title={openRow ? `Pesan dari ${openRow.name}` : "Pesan"}
        description={openRow ? new Date(openRow.createdAt).toLocaleString("id-ID") : undefined}
        onClose={() => setOpenRow(null)}
      >
        {openRow ? (
          <div style={{ display: "grid", gap: 18, maxWidth: 720 }}>
            <div>
              <p className="adm-shared-label">Pengirim</p>
              <p style={{ margin: 0, fontSize: "0.9rem" }}>
                <strong>{openRow.name}</strong>
                <br />
                <a href={`mailto:${openRow.email}`}>{openRow.email}</a>
              </p>
            </div>

            <div>
              <p className="adm-shared-label">Isi pesan</p>
              <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                {openRow.message}
              </p>
            </div>

            <div>
              <p className="adm-shared-label">Tandai sebagai</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {(["new", "read", "replied", "spam"] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    className="adm-btn"
                    data-variant={openRow.status === status ? "primary" : undefined}
                    aria-pressed={openRow.status === status}
                    onClick={() =>
                      setStatus.mutate(
                        { id: openRow.id, status },
                        {
                          onSuccess: () => {
                            setOpenRow({ ...openRow, status });
                            toast.success(`Ditandai ${STATUS_LABEL[status].toLowerCase()}.`);
                          },
                          onError: (error) =>
                            toast.error(error instanceof ApiError ? error.message : "Gagal mengubah status."),
                        },
                      )
                    }
                  >
                    {STATUS_LABEL[status]}
                  </button>
                ))}
              </div>
            </div>

            <a className="adm-btn" href={`mailto:${openRow.email}`} style={{ justifySelf: "start" }}>
              Balas lewat email
            </a>
          </div>
        ) : null}
      </DetailDrawer>

      <ConfirmDialog
        open={Boolean(removing)}
        title="Hapus pesan ini?"
        description={removing ? `Dari ${removing.name}` : undefined}
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
              onClick={() =>
                removing &&
                remove.mutate(removing.id, {
                  onSuccess: () => {
                    toast.success("Pesan dihapus.");
                    setRemoving(null);
                    setOpenRow(null);
                  },
                  onError: (error) =>
                    toast.error(error instanceof ApiError ? error.message : "Gagal menghapus."),
                })
              }
            >
              Hapus
            </button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: "0.86rem", lineHeight: 1.6 }}>
          Tulisan pengunjung ini hilang untuk selamanya. Kalau maksudnya menyingkirkan spam,
          menandainya sebagai spam lebih baik daripada menghapusnya.
        </p>
      </ConfirmDialog>
    </AdminShell>
  );
}
