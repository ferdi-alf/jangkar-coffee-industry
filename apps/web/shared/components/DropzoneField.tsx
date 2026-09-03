"use client";

import { FileImage, X } from "lucide-react";
import { useId, useRef, useState } from "react";

/**
 * Input berkas: drag and drop, ikon berkas di tengah, keterangan jenis dan
 * ukuran maksimum, kontainer bergaris putus putus.
 *
 * Keempatnya aturan produk, dan keempatnya ada di sini supaya tidak ada halaman
 * yang menyusunnya sendiri lalu melewatkan salah satunya.
 *
 * KETERANGAN JENIS DAN UKURAN DIRENDER DARI PROP YANG SAMA yang dipakai atribut
 * `accept` dan pemeriksaan ukuran. Kalau ditulis terpisah, tulisannya akan
 * berbeda dari yang sebenarnya diterima cepat atau lambat, dan pengguna
 * disalahkan atas aturan yang tidak pernah diberitahukan.
 *
 * Input file aslinya tetap ada dan tetap bisa difokus, hanya disembunyikan
 * secara visual. Menggantinya dengan div yang bisa diklik akan mematikan
 * pemilih berkas bagi pengguna keyboard.
 */
export function DropzoneField({
  label,
  accept,
  maxBytes,
  value,
  onChange,
  error,
}: {
  label: string;
  accept: string[];
  maxBytes: number;
  value: File | null;
  onChange: (file: File | null) => void;
  error?: string;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  const maxMb = Math.round((maxBytes / (1024 * 1024)) * 10) / 10;
  const kinds = accept.map((mime) => mime.split("/")[1].toUpperCase()).join(", ");

  function take(file: File | undefined): void {
    if (!file) return;
    onChange(file);
  }

  return (
    <div className="adm-field">
      <label htmlFor={inputId}>{label}</label>

      <div
        className="adm-drop"
        data-over={over}
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setOver(false);
          take(event.dataTransfer.files[0]);
        }}
        onClick={() => inputRef.current?.click()}
      >
        {value ? (
          <>
            <span className="adm-drop-file">
              <FileImage size={18} aria-hidden="true" />
              {value.name}
            </span>
            <button
              type="button"
              className="adm-btn"
              data-variant="ghost"
              onClick={(event) => {
                event.stopPropagation();
                onChange(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
            >
              <X size={15} aria-hidden="true" />
              Ganti berkas
            </button>
          </>
        ) : (
          <>
            <FileImage size={26} aria-hidden="true" />
            <span className="adm-drop-title">Tarik berkas ke sini, atau klik untuk memilih</span>
            <span className="adm-drop-note">
              {kinds}, maksimum {maxMb} MB
            </span>
          </>
        )}

        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept.join(",")}
          style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          onChange={(event) => take(event.target.files?.[0])}
        />
      </div>

      {error ? (
        <p className="adm-error" id={`${inputId}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
