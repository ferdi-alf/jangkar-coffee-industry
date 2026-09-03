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
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; error?: string }) {
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
          aria-describedby={error ? `${id}-error` : undefined}
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
      ) : null}
    </div>
  );
}
