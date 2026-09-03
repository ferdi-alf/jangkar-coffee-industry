"use client";

import { useId, useState } from "react";
import { useForm } from "react-hook-form";

import type { Dictionary } from "@/i18n/dictionaries/id";

/**
 * Form kontak: nama, email, pesan.
 *
 * Memakai `react-hook-form` yang SUDAH terpasang di apps/web, jadi nol
 * dependensi baru di sisi ini. Validasinya ditulis dengan aturan bawaan
 * react-hook-form, bukan zod, karena zod tidak terpasang di apps/web dan
 * menambahkannya hanya untuk tiga medan berarti membawa paket baru ke bundle
 * klien tanpa alasan. Batas panjangnya SAMA PERSIS dengan skema zod di
 * apps/api. Kalau berbeda, pengunjung bisa lolos di sini lalu ditolak server
 * tanpa tahu sebabnya. Validasi di sini untuk kenyamanan, yang di server yang
 * mengikat.
 *
 * CSRF: token diambil lebih dulu dari `GET /csrf`, yang menaruh cookie httpOnly
 * dan mengembalikan token yang sama di badan respons. Token itu dikirim balik
 * lewat header `X-CSRF-Token`. Diambil SAAT KIRIM, bukan saat halaman dimuat,
 * supaya halaman statis tidak menembak API untuk pengunjung yang tidak pernah
 * mengisi form.
 *
 * Aksesibilitas, dikerjakan sejak awal bukan ditambal:
 *   - tiap label terikat `htmlFor`, bukan sekadar teks di atas medan,
 *   - galat dibawa `aria-invalid` DAN `aria-describedby`,
 *   - pesan galatnya TEKS, bukan sekadar bingkai merah, karena warna tidak
 *     boleh jadi satu-satunya pembawa makna,
 *   - hasil kirim diumumkan lewat `aria-live`, jadi pembaca layar tahu tanpa
 *     harus menjelajah ulang,
 *   - `noValidate` mematikan gelembung bawaan peramban supaya galatnya satu
 *     gaya dan satu bahasa, bukan campur bahasa peramban.
 */
type Values = { name: string; email: string; message: string };
type Status = "idle" | "sending" | "sent" | "failed" | "limited";

/* Same-origin lewat proksi Next, sama seperti panel. Lihat next.config.ts. */
const API = "/api";

export function ContactForm({ dict }: { dict: Dictionary }) {
  const t = dict.contact.form;
  const uid = useId();
  const [status, setStatus] = useState<Status>("idle");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Values>({ mode: "onBlur" });

  const fieldId = (name: keyof Values) => `${uid}-${name}`;
  const errorId = (name: keyof Values) => `${uid}-${name}-error`;

  const onSubmit = async (values: Values) => {
    setStatus("sending");
    try {
      const ticket = await fetch(`${API}/csrf`, { credentials: "include" });
      if (!ticket.ok) throw new Error("csrf");
      const { data } = (await ticket.json()) as { data: { token: string } };

      const res = await fetch(`${API}/contact`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": data.token },
        body: JSON.stringify(values),
      });

      if (res.status === 429) {
        setStatus("limited");
        return;
      }
      if (!res.ok) throw new Error(String(res.status));

      reset();
      setStatus("sent");
    } catch {
      setStatus("failed");
    }
  };

  const message =
    status === "sent" ? t.success : status === "limited" ? t.rateLimited : status === "failed" ? t.failure : "";

  return (
    <form className="cform" onSubmit={handleSubmit(onSubmit)} noValidate>
      <h3 className="cform-heading">{t.heading}</h3>
      <p className="cform-lede">{t.lede}</p>

      <div className="cform-row">
        <div className="cform-field">
          <label htmlFor={fieldId("name")}>{t.name}</label>
          <input
            id={fieldId("name")}
            type="text"
            autoComplete="name"
            placeholder={t.namePlaceholder}
            aria-invalid={errors.name ? "true" : undefined}
            aria-describedby={errors.name ? errorId("name") : undefined}
            {...register("name", {
              required: t.errors.nameRequired,
              maxLength: { value: 80, message: t.errors.nameTooLong },
            })}
          />
          {errors.name ? (
            <p className="cform-error" id={errorId("name")}>
              {errors.name.message}
            </p>
          ) : null}
        </div>

        <div className="cform-field">
          <label htmlFor={fieldId("email")}>{t.email}</label>
          <input
            id={fieldId("email")}
            type="email"
            autoComplete="email"
            placeholder={t.emailPlaceholder}
            aria-invalid={errors.email ? "true" : undefined}
            aria-describedby={errors.email ? errorId("email") : undefined}
            {...register("email", {
              required: t.errors.emailRequired,
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: t.errors.emailInvalid },
            })}
          />
          {errors.email ? (
            <p className="cform-error" id={errorId("email")}>
              {errors.email.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="cform-field">
        <label htmlFor={fieldId("message")}>{t.message}</label>
        <textarea
          id={fieldId("message")}
          rows={5}
          placeholder={t.messagePlaceholder}
          aria-invalid={errors.message ? "true" : undefined}
          aria-describedby={errors.message ? errorId("message") : undefined}
          {...register("message", {
            required: t.errors.messageRequired,
            minLength: { value: 10, message: t.errors.messageTooShort },
            maxLength: { value: 2000, message: t.errors.messageTooLong },
          })}
        />
        {errors.message ? (
          <p className="cform-error" id={errorId("message")}>
            {errors.message.message}
          </p>
        ) : null}
      </div>

      <div className="cform-actions">
        <button className="cform-submit" type="submit" disabled={status === "sending"}>
          {status === "sending" ? t.sending : t.submit}
        </button>
        {/* Selalu ada di DOM, jadi pembaca layar mengumumkan isinya begitu
            terisi. Kalau elemennya baru dibuat saat ada pesan, sebagian
            pembaca layar melewatkannya. */}
        <p
          className={status === "sent" ? "cform-status ok" : "cform-status"}
          role="status"
          aria-live="polite"
        >
          {message}
        </p>
      </div>
    </form>
  );
}
