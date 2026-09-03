"use client";

import { Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/modules/admin/components/AdminShell";
import { useSession } from "@/modules/admin/hooks/useSession";
import {
  ALLOWED_MIME,
  MAX_UPLOAD_BYTES,
  useDeleteMedia,
  useMediaList,
  useUploadMedia,
  type MediaItem,
} from "@/modules/media/hooks/useMedia";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { DropzoneField } from "@/shared/components/DropzoneField";
import { TextField } from "@/shared/components/Field";
import { FormDrawer } from "@/shared/components/FormDrawer";
import { LocaleTabs } from "@/shared/components/LocaleTabs";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { ApiError } from "@/shared/lib/api-client";

/**
 * Pustaka media.
 *
 * ALT TEXT WAJIB DI KEDUA BAHASA, dan itu ditegakkan di tiga tempat: form ini,
 * skema zod di server, dan constraint di migrasi. Tiga lapis untuk satu aturan
 * terdengar berlebihan sampai diingat apa yang dipertaruhkan: gambar tanpa alt
 * adalah lubang yang tidak terlihat oleh siapa pun kecuali pengguna pembaca
 * layar, dan merekalah yang paling tidak punya cara melaporkannya.
 *
 * Formnya punya tiga medan isian plus berkas, jadi bentuknya LACI KANAN. Berkas
 * dan dua bahasa alt sudah melewati batas tiga medan aturan dialog.
 *
 * MENGHAPUS HANYA OWNER, karena gambar yang dihapus bisa saja masih dipakai
 * halaman lain, dan pemulihannya berarti mengunggah ulang.
 */
export default function MediaPage() {
  const { user } = useSession();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [altId, setAltId] = useState("");
  const [altEn, setAltEn] = useState("");
  const [fileError, setFileError] = useState<string | undefined>();
  const [removing, setRemoving] = useState<MediaItem | null>(null);

  const list = useMediaList({ page, perPage: 24, q: debounced || undefined });
  const upload = useUploadMedia();
  const remove = useDeleteMedia();

  function reset(): void {
    setFile(null);
    setAltId("");
    setAltEn("");
    setFileError(undefined);
  }

  function submit(): void {
    if (!file) {
      setFileError("Pilih berkas lebih dulu.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setFileError("Berkas melebihi batas 5 MB.");
      return;
    }
    if (!ALLOWED_MIME.includes(file.type)) {
      setFileError("Jenis berkas ini tidak diizinkan.");
      return;
    }
    if (!altId.trim() || !altEn.trim()) {
      toast.error("Alt text wajib diisi di kedua bahasa.");
      return;
    }

    upload.mutate(
      { file, alt: { id: altId.trim(), en: altEn.trim() } },
      {
        onSuccess: () => {
          toast.success("Media diunggah.");
          reset();
          setUploadOpen(false);
        },
        onError: (error) => {
          if (error instanceof ApiError && error.code === "CONTENT_MISMATCH") {
            setFileError("Isi berkas tidak cocok dengan jenisnya.");
            return;
          }
          toast.error(error instanceof ApiError ? error.message : "Gagal mengunggah.");
        },
      },
    );
  }

  const rows = list.data?.data ?? [];

  return (
    <AdminShell>
      <div className="adm-card">
        <div className="adm-toolbar">
          <div className="adm-search">
            <input
              className="adm-input"
              type="search"
              value={search}
              placeholder="Cari nama berkas..."
              aria-label="Cari media"
              style={{ paddingLeft: 12 }}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="adm-card-actions">
            <button type="button" className="adm-btn" data-variant="primary" onClick={() => setUploadOpen(true)}>
              <Upload size={15} aria-hidden="true" />
              Unggah
            </button>
          </div>
        </div>

        <div className="adm-card-body">
          {list.isLoading ? (
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="adm-skel" style={{ height: 140 }} />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="adm-empty">Belum ada media.</p>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
              {rows.map((item) => (
                <li
                  key={item.id}
                  style={{ border: "1px solid var(--a-line)", borderRadius: "var(--a-radius)", overflow: "hidden", background: "var(--a-surface)" }}
                >
                  {/* next/image dilewati dengan sengaja: URL-nya dari Supabase
                      Storage yang hostnya bisa berubah per lingkungan, dan
                      mendaftarkannya di next.config berarti build gagal di mesin
                      yang envnya belum diisi. Ini halaman admin di balik login,
                      bukan halaman yang punya anggaran LCP. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.alt.id || item.path}
                    style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", display: "block", background: "var(--a-surface-2)" }}
                  />
                  <div style={{ padding: 10 }}>
                    <p style={{ margin: 0, fontSize: "0.76rem", fontWeight: 600, wordBreak: "break-all" }}>{item.path}</p>
                    <p style={{ margin: "4px 0 0", fontSize: "0.72rem", color: "var(--a-text-2)" }}>
                      {Math.round(item.bytes / 1024)} KB
                    </p>
                    {!item.alt.id || !item.alt.en ? (
                      <p className="adm-error" style={{ marginTop: 6 }}>
                        Alt text belum lengkap
                      </p>
                    ) : null}
                    {user?.role === "owner" ? (
                      <button
                        type="button"
                        className="adm-btn"
                        data-variant="ghost"
                        style={{ marginTop: 8, width: "100%" }}
                        onClick={() => setRemoving(item)}
                      >
                        <Trash2 size={14} aria-hidden="true" />
                        Hapus
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="adm-pager">
          <span>
            {list.data?.meta.total ?? 0} berkas, halaman {page} dari {Math.max(list.data?.meta.totalPages ?? 1, 1)}
          </span>
          <div className="adm-pager-actions">
            <button type="button" className="adm-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Sebelumnya
            </button>
            <button
              type="button"
              className="adm-btn"
              disabled={page >= (list.data?.meta.totalPages ?? 1)}
              onClick={() => setPage(page + 1)}
            >
              Berikutnya
            </button>
          </div>
        </div>
      </div>

      <FormDrawer
        open={uploadOpen}
        title="Unggah media"
        description="Alt text wajib di kedua bahasa."
        onClose={() => {
          reset();
          setUploadOpen(false);
        }}
        footer={
          <>
            <button type="button" className="adm-btn" onClick={() => { reset(); setUploadOpen(false); }}>
              Batal
            </button>
            <button type="button" className="adm-btn" data-variant="primary" onClick={submit} disabled={upload.isPending}>
              {upload.isPending ? "Mengunggah..." : "Unggah"}
            </button>
          </>
        }
      >
        <DropzoneField
          label="Berkas gambar"
          accept={ALLOWED_MIME}
          maxBytes={MAX_UPLOAD_BYTES}
          value={file}
          onChange={(next) => {
            setFile(next);
            setFileError(undefined);
          }}
          error={fileError}
        />

        <LocaleTabs
          id={
            <TextField
              id="m-alt-id"
              label="Alt text (Indonesia)"
              hint="Jelaskan isi gambarnya, bukan sekadar namanya."
              value={altId}
              onChange={(event) => setAltId(event.target.value)}
            />
          }
          en={
            <TextField
              id="m-alt-en"
              label="Alt text (English)"
              value={altEn}
              onChange={(event) => setAltEn(event.target.value)}
            />
          }
        />
      </FormDrawer>

      <ConfirmDialog
        open={Boolean(removing)}
        title="Hapus media ini?"
        description={removing?.path}
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
                    toast.success("Media dihapus.");
                    setRemoving(null);
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
          Berkasnya dihapus dari storage juga. Kalau gambar ini masih dipakai sebuah halaman,
          halaman itu akan kehilangan gambarnya.
        </p>
      </ConfirmDialog>
    </AdminShell>
  );
}
