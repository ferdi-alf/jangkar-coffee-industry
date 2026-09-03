"use client";

import { useMutation } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { TextField } from "@/shared/components/Field";
import { PasswordField } from "@/shared/components/PasswordField";
import { ApiError, api } from "@/shared/lib/api-client";

/**
 * Halaman masuk panel.
 *
 * PESAN GALATNYA SATU BENTUK untuk semua sebab, dan itu memang sengaja
 * dipertahankan dari sisi server: email tidak terdaftar, kata sandi salah, akun
 * bukan admin, dan akun dinonaktifkan semuanya menghasilkan kalimat yang sama.
 * Membedakannya berarti memberi tahu penyerang alamat mana yang terdaftar.
 *
 * Setelah berhasil, ia MEMUAT DOKUMEN PENUH ke /dashboard, bukan router.push.
 * Cookie sesi baru saja dipasang server, dan muat penuh memastikan middleware
 * ikut melihatnya pada permintaan berikutnya.
 */
type Values = { email: string; password: string };

const MESSAGES: Record<string, string> = {
  "email.invalid": "Format email belum benar.",
  "email.tooLong": "Email terlalu panjang.",
  "password.required": "Kata sandi wajib diisi.",
  "password.tooShort": "Kata sandi minimal 8 karakter.",
  "password.tooLong": "Kata sandi terlalu panjang.",
};

function LoginForm() {
  const params = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);

  /* Middleware membawa halaman yang tadi dituju lewat `next`, jadi pengguna
     kembali ke sana setelah masuk. Nilainya DIPERIKSA harus jalur relatif yang
     diawali satu garis miring: tanpa itu, `?next=https://situs-lain` akan
     mengubah halaman masuk ini jadi alat pengalihan terbuka, dan pengalihan
     dari domain yang dipercaya adalah bahan phishing yang sangat berguna. */
  const raw = params.get("next");
  const target = raw && /^\/[^/\\]/.test(raw) ? raw : "/dashboard";
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Values>({ mode: "onBlur" });

  const mutation = useMutation({
    mutationFn: (values: Values) => api.post<{ user: unknown }>("/auth/login", values),
    onSuccess: () => {
      toast.success("Berhasil masuk.");
      window.location.href = target;
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        if (error.code === "VALIDATION_ERROR") {
          for (const detail of error.details) {
            if (detail.field === "email" || detail.field === "password") {
              setError(detail.field, { message: MESSAGES[detail.message] ?? detail.message });
            }
          }
          return;
        }
        if (error.code === "NOT_CONFIGURED") {
          /* Halaman ini PUBLIK, jadi pesannya sengaja tidak menyebut nama
             variabel environment maupun layanan basis data yang dipakai.
             Menyebutkannya memberi tahu siapa pun yang membuka /login tentang
             tumpukan teknologi dan tahap penyiapan sistem, dan itu peta gratis
             bagi penyerang. Petunjuk lengkapnya ada di dashboard, yang hanya
             bisa dibuka setelah masuk. */
          setFormError("Layanan belum siap. Hubungi pengelola sistem.");
          return;
        }
        if (error.status === 429) {
          setFormError("Terlalu banyak percobaan. Coba lagi satu menit lagi.");
          return;
        }
        setFormError(error.message);
        return;
      }
      setFormError("Tidak bisa menghubungi server. Pastikan API berjalan di port 4000.");
    },
  });

  return (
    <div className="adm-login">
      <form
        className="adm-login-card"
        noValidate
        onSubmit={handleSubmit((values) => {
          setFormError(null);
          mutation.mutate(values);
        })}
      >
        <div className="adm-login-brand">
          <span className="brand-mark" aria-hidden="true" style={{ width: 30, height: 30 }} />
          <strong>Jangkar Coffee Industry</strong>
        </div>

        <h1>Masuk ke panel</h1>
        <p>Panel ini hanya untuk pengelola. Sesi berlaku sampai Anda keluar.</p>

        <TextField
          id="login-email"
          label="Email"
          type="email"
          autoComplete="username"
          placeholder="nama@contoh.com"
          error={errors.email?.message}
          {...register("email", { required: "Email wajib diisi." })}
        />

        <PasswordField
          id="login-password"
          label="Kata sandi"
          autoComplete="current-password"
          placeholder="Kata sandi"
          error={errors.password?.message}
          {...register("password", { required: "Kata sandi wajib diisi." })}
        />

        {/* Galat tingkat form diumumkan lewat aria-live, jadi pembaca layar
            mendengarnya tanpa harus menjelajah ulang halaman. */}
        <p className="adm-error" role="status" aria-live="polite" style={{ minHeight: 18 }}>
          {formError ?? ""}
        </p>

        <button
          className="adm-btn"
          data-variant="primary"
          type="submit"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Memeriksa..." : "Masuk"}
        </button>

        <p className="adm-hint" style={{ marginTop: 14, textAlign: "center" }}>
          {/* Menyeberang ke route group (site), jadi Next melakukan muat
              dokumen penuh dengan sendirinya. Itu memang yang dibutuhkan:
              `<html lang>` situs publik mengikuti locale, dan atribut itu
              dirender layout akar yang berbeda. */}
          <Link href="/id" style={{ color: "inherit" }}>
            Kembali ke situs
          </Link>
        </p>
      </form>
    </div>
  );
}

/**
 * `useSearchParams` menuntut Suspense di sekelilingnya, kalau tidak seluruh
 * rute jatuh ke render dinamis saat build. Batas Suspense inilah yang menjaga
 * halaman masuk tetap bisa dirender statis.
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="adm-login" />}>
      <LoginForm />
    </Suspense>
  );
}
