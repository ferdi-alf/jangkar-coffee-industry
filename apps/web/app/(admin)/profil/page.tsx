"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { AdminShell } from "@/modules/admin/components/AdminShell";
import { ROLE_LABEL, USER_ERROR } from "@/modules/user/contracts/user";
import { useProfile, useSaveProfile } from "@/modules/user/hooks/useUsers";
import { TextField } from "@/shared/components/Field";
import { PasswordField } from "@/shared/components/PasswordField";
import { ApiError } from "@/shared/lib/api-client";

/**
 * Profil: akun Anda sendiri.
 *
 * SUREL DAN PERAN SENGAJA HANYA DIBACA, tidak bisa disunting di sini.
 *
 * Surel tidak bisa diubah karena ia hidup di DUA tempat, `auth.users` milik
 * Supabase dan `admin_user` milik kita. Mengubahnya berarti dua penulisan yang
 * bisa gagal di tengah, dan kalau gagal, orangnya tidak bisa masuk lagi memakai
 * alamat mana pun. Untuk kebutuhan yang jarang ini, membuat akun baru lalu
 * menonaktifkan yang lama jauh lebih aman.
 *
 * Peran tidak bisa diubah karena mengizinkannya berarti setiap staff bisa
 * mengangkat dirinya sendiri jadi owner, dan seluruh pagar peran di API jadi
 * tidak berarti. Perannya diubah owner lain di halaman Pengguna.
 *
 * GANTI KATA SANDI WAJIB MENYERTAKAN YANG LAMA. Sesi panel hidup di cookie,
 * jadi layar yang ditinggal terbuka di gerai adalah skenario nyata. Tanpa
 * pemeriksaan itu siapa pun yang lewat bisa mengunci pemiliknya keluar dari
 * akunnya sendiri dalam sepuluh detik. Server yang memverifikasi, dan ia juga
 * dibatasi lajunya.
 */
type Values = {
  name: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export default function ProfilPage() {
  const query = useProfile();
  const save = useSaveProfile();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    formState: { errors },
  } = useForm<Values>({
    defaultValues: { name: "", currentPassword: "", newPassword: "", confirmPassword: "" },
    mode: "onBlur",
  });

  useEffect(() => {
    if (query.data) {
      reset({
        name: query.data.name,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
  }, [query.data, reset]);

  const submit = handleSubmit((values) => {
    const wantsPassword = values.newPassword.trim().length > 0;

    /* Konfirmasi diperiksa DI KLIEN saja, dan memang tidak dikirim ke server.
       Ia bukan aturan keamanan melainkan penangkap salah ketik, dan menahannya
       di sini berarti kesalahan yang paling sering terjadi tidak perlu
       menempuh perjalanan bolak-balik ke server. */
    if (wantsPassword && values.newPassword !== values.confirmPassword) {
      setError("confirmPassword", { message: "Konfirmasi tidak sama dengan kata sandi baru." });
      return;
    }

    save.mutate(
      {
        name: values.name.trim(),
        ...(wantsPassword
          ? { currentPassword: values.currentPassword, newPassword: values.newPassword }
          : {}),
      },
      {
        onSuccess: () => {
          toast.success(wantsPassword ? "Profil dan kata sandi disimpan." : "Profil disimpan.");
          reset({ name: values.name.trim(), currentPassword: "", newPassword: "", confirmPassword: "" });
        },
        onError: (error) => {
          if (error instanceof ApiError && error.code === "VALIDATION_ERROR") {
            for (const detail of error.details) {
              if (detail.field === "name" || detail.field === "newPassword") {
                setError(detail.field as keyof Values, {
                  message: USER_ERROR[detail.message] ?? detail.message,
                });
              }
            }
            toast.error("Ada isian yang belum benar.");
            return;
          }
          /* Kata sandi lama yang salah datang sebagai 400 BAD_REQUEST, dan
             pesannya diarahkan ke medannya sendiri supaya jelas yang mana. */
          if (error instanceof ApiError && error.status === 400) {
            setError("currentPassword", { message: error.message });
            return;
          }
          if (error instanceof ApiError && error.status === 429) {
            toast.error("Terlalu banyak percobaan. Tunggu satu menit.");
            return;
          }
          toast.error(error instanceof ApiError ? error.message : "Gagal menyimpan.");
        },
      },
    );
  });

  /* `useWatch` alih-alih `watch()`, alasan yang sama dengan halaman SEO. */
  const newPassword = useWatch({ control, name: "newPassword" });
  const wantsPassword = (newPassword ?? "").trim().length > 0;

  return (
    <AdminShell>
      <form onSubmit={submit} noValidate>
        <div className="adm-card">
          <div className="adm-card-head">
            <div>
              <h2>Akun Anda</h2>
              <p>Surel dan peran hanya bisa diubah owner lain di halaman Pengguna.</p>
            </div>
          </div>
          <div className="adm-card-body">
            {query.isLoading ? (
              <div className="adm-skel" style={{ height: 160 }} />
            ) : (
              <>
                <div className="adm-row-2">
                  <TextField
                    id="pr-email"
                    label="Surel"
                    value={query.data?.email ?? ""}
                    readOnly
                    disabled
                    hint="Tidak bisa diubah dari sini."
                  />
                  <TextField
                    id="pr-role"
                    label="Peran"
                    value={query.data ? ROLE_LABEL[query.data.role] : ""}
                    readOnly
                    disabled
                    hint="Diatur owner lain."
                  />
                </div>
                <TextField
                  id="pr-name"
                  label="Nama"
                  hint="Tampil di kaki sidebar dan di catatan audit."
                  error={errors.name?.message}
                  {...register("name", { required: "Nama wajib diisi." })}
                />
              </>
            )}
          </div>
        </div>

        <div className="adm-card" style={{ marginTop: 16 }}>
          <div className="adm-card-head">
            <div>
              <h2>Ganti kata sandi</h2>
              <p>Kosongkan bila tidak ingin menggantinya.</p>
            </div>
          </div>
          <div className="adm-card-body">
            <PasswordField
              id="pr-new"
              label="Kata sandi baru"
              autoComplete="new-password"
              error={errors.newPassword?.message}
              {...register("newPassword", {
                minLength: { value: 12, message: "Kata sandi minimal 12 karakter." },
              })}
            />
            {wantsPassword ? (
              <>
                <PasswordField
                  id="pr-confirm"
                  label="Ulangi kata sandi baru"
                  autoComplete="new-password"
                  error={errors.confirmPassword?.message}
                  {...register("confirmPassword")}
                />
                <PasswordField
                  id="pr-current"
                  label="Kata sandi saat ini"
                  autoComplete="current-password"
                  error={errors.currentPassword?.message}
                  {...register("currentPassword", {
                    required: "Masukkan kata sandi Anda saat ini.",
                  })}
                />
              </>
            ) : null}
          </div>
          <div className="adm-drawer-foot">
            <button
              type="submit"
              className="adm-btn"
              data-variant="primary"
              disabled={save.isPending}
            >
              {save.isPending ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      </form>
    </AdminShell>
  );
}
