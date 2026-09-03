import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

/**
 * Medan teks dan area teks panel.
 *
 * GALAT SELALU BERUPA TEKS, tidak pernah sekadar bingkai merah, dan itu bukan
 * gaya melainkan lantai aksesibilitas: warna tidak boleh jadi satu-satunya
 * pembawa makna. `aria-invalid` dan `aria-describedby` ikut dipasang, jadi
 * pembaca layar mendengar galatnya saat medannya difokus, bukan hanya saat
 * pengguna kebetulan menjelajah ke bawah.
 */
export function TextField({
  id,
  label,
  error,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  error?: string;
  hint?: string;
}) {
  return (
    <div className="adm-field">
      <label htmlFor={id}>{label}</label>
      <input
        {...props}
        id={id}
        className="adm-input"
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
      />
      {hint && !error ? (
        <p className="adm-hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="adm-error" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextAreaField({
  id,
  label,
  error,
  hint,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  id: string;
  label: string;
  error?: string;
  hint?: string;
}) {
  return (
    <div className="adm-field">
      <label htmlFor={id}>{label}</label>
      <textarea
        {...props}
        id={id}
        className="adm-textarea"
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
      />
      {hint && !error ? (
        <p className="adm-hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="adm-error" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
