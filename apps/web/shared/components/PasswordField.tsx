"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, type InputHTMLAttributes } from "react";

/**
 * Input kata sandi dengan ikon mata.
 *
 * Aturan produk: input password SELALU punya ikon mata untuk mengatur
 * keterlihatan teks. Karena itu ia komponen sendiri, bukan sesuatu yang
 * ditambahkan per halaman dan akhirnya terlupa di salah satunya.
 *
 * Tombolnya `type="button"`. Tanpa itu ia default `submit`, dan mengintip kata
 * sandi justru mengirim formnya.
 */
export function PasswordField({
  id,
  label,
  error,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  error?: string;
  /* Sama seperti TextField. Ada karena aturan kata sandi, misalnya "minimal 12
     karakter", harus terbaca SEBELUM diketik, bukan muncul sebagai galat merah
     setelah percobaan gagal. */
  hint?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="adm-field">
      <label htmlFor={id}>{label}</label>
      <div className="adm-password">
        <input
          {...props}
          id={id}
          className="adm-input"
          type={visible ? "text" : "password"}
          aria-invalid={error ? "true" : undefined}
          /* Petunjuk ikut ditunjuk aria-describedby, jadi pembaca layar
             mengumumkan aturannya juga, bukan cuma galatnya. */
          aria-describedby={
            error ? `${id}-error` : hint ? `${id}-hint` : undefined
          }
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
          aria-pressed={visible}
        >
          {visible ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
        </button>
      </div>
      {error ? (
        <p className="adm-error" id={`${id}-error`}>
          {error}
        </p>
      ) : hint ? (
        <p className="adm-hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
