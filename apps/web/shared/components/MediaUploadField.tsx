"use client";

import { Trash2, Upload } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";

import { DropzoneField } from "@/shared/components/DropzoneField";
import { TextField } from "@/shared/components/Field";
import {
  ALLOWED_MIME,
  MAX_UPLOAD_BYTES,
  useDeleteMedia,
  useUploadMedia,
} from "@/modules/media/hooks/useMedia";
import { ApiError } from "@/shared/lib/api-client";

/**
 * Unggah satu gambar LANGSUNG DI FORM yang membutuhkannya.
 *
 * Menggantikan halaman /media yang dihapus. Pustaka media itu berdiri sendiri
 * tanpa pernah dipakai satu form pun: nol baris di tabelnya, nol foreign key
 * yang menunjuk kepadanya, dan gambar produk justru hidup sebagai jalur teks
 * bebas di kolom lain. Pemilik proyek memilih membuang pustakanya dan
 * mengunggah di tempat, jadi inilah tempatnya.
 *
 * ALT TEXT DUA BAHASA WAJIB, dan itu bukan formalitas. Gambar tanpa alt adalah
 * lubang bagi pembaca layar, dan aturan aksesibilitas proyek ini menuntut
 * keduanya terisi. Basis data juga menuntutnya: media_translation.alt NOT NULL.
 *
 * Nilai yang disimpan pemanggil adalah URL PUBLIK, bukan id media. Kolom
 * tujuannya, `product.image_path` dan medan gambar SEO, memang kolom teks bebas
 * yang sudah berisi jalur statis seperti `/roastery/kopi-bubuk-80gr.webp`.
 * Menyimpan URL membuat keduanya hidup berdampingan tanpa migrasi data.
 */
export function MediaUploadField({
  label,
  value,
  onChange,
  hint,
  defaultAlt,
}: {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  hint?: string;
  /** Isian awal alt, biasanya judul produk, supaya tidak diketik dua kali. */
  defaultAlt?: string;
}) {
  const uid = useId();
  const [file, setFile] = useState<File | null>(null);
  const [altId, setAltId] = useState(defaultAlt ?? "");
  const [altEn, setAltEn] = useState(defaultAlt ?? "");
  const [error, setError] = useState<string | undefined>();

  const upload = useUploadMedia();
  const remove = useDeleteMedia();

  /* Hanya URL storage Supabase yang boleh dihapus. Nilai lama berupa jalur
     statis di public/ TIDAK punya baris media dan bukan milik kita untuk
     dihapus; mencoba menghapusnya hanya menghasilkan galat yang membingungkan. */
  const isUploaded = Boolean(value && value.includes("/storage/v1/object/public/"));

  async function submit(): Promise<void> {
    setError(undefined);
    if (!file) return setError("Pilih berkas gambar lebih dulu.");
    if (file.size > MAX_UPLOAD_BYTES) {
      return setError(`Berkas terlalu besar. Maksimum ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB.`);
    }
    if (!ALLOWED_MIME.includes(file.type)) return setError("Jenis berkas tidak didukung.");
    if (!altId.trim() || !altEn.trim()) return setError("Alt text wajib diisi di kedua bahasa.");

    try {
      const created = await upload.mutateAsync({
        file,
        alt: { id: altId.trim(), en: altEn.trim() },
      });
      onChange(created.url);
      setFile(null);
      toast.success("Gambar diunggah.");
    } catch (err) {
      if (err instanceof ApiError && err.code === "CONTENT_MISMATCH") {
        setError("Isi berkas tidak cocok dengan jenisnya.");
        return;
      }
      setError(err instanceof ApiError ? err.message : "Gagal mengunggah gambar.");
    }
  }

  async function clear(): Promise<void> {
    const previous = value;
    onChange(null);
    setFile(null);

    /* Berkas lama dibuang dari storage supaya tidak menumpuk jadi sampah yang
       tidak terlihat di panel mana pun sejak halaman Media dihapus. Kegagalan
       DITELAN: yang penting bagi pemakai adalah gambarnya lepas dari produk,
       dan berkas yatim jauh lebih ringan akibatnya daripada form yang menolak
       menyimpan karena pembersihan gagal. */
    if (previous && previous.includes("/storage/v1/object/public/")) {
      try {
        await remove.mutateAsync({ url: previous });
      } catch {
        /* sengaja diabaikan, lihat alasan di atas */
      }
    }
  }

  return (
    <div className="adm-field">
      <span className="adm-field-label">{label}</span>
      {hint ? <p className="adm-hint">{hint}</p> : null}

      {value ? (
        <div className="adm-media-preview">
          {/* `img` biasa, BUKAN next/image. Host storage berbeda antar
              lingkungan, dan halaman panel tidak punya anggaran LCP. Pola yang
              sama dipakai halaman media sebelumnya. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" />
          <div>
            <p className="adm-media-path">{value.split("/").pop()}</p>
            <button
              type="button"
              className="adm-btn"
              data-variant="ghost"
              onClick={() => void clear()}
              disabled={remove.isPending}
            >
              <Trash2 size={15} aria-hidden="true" />
              <span>{isUploaded ? "Hapus gambar" : "Lepas gambar"}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="adm-media-upload">
          <DropzoneField
            label="Berkas gambar"
            accept={ALLOWED_MIME}
            maxBytes={MAX_UPLOAD_BYTES}
            value={file}
            onChange={setFile}
            error={error}
          />
          <div className="adm-row-2">
            <TextField
              id={`${uid}-alt-id`}
              label="Alt text (ID)"
              value={altId}
              onChange={(e) => setAltId(e.target.value)}
              hint="Wajib. Dibaca pembaca layar."
            />
            <TextField
              id={`${uid}-alt-en`}
              label="Alt text (EN)"
              value={altEn}
              onChange={(e) => setAltEn(e.target.value)}
              hint="Wajib."
            />
          </div>
          <button
            type="button"
            className="adm-btn"
            data-variant="primary"
            onClick={() => void submit()}
            disabled={upload.isPending || !file}
          >
            <Upload size={15} aria-hidden="true" />
            <span>{upload.isPending ? "Mengunggah..." : "Unggah gambar"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
