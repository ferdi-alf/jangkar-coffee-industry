"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { AdminShell } from "@/modules/admin/components/AdminShell";
import { useSession } from "@/modules/admin/hooks/useSession";
import { ROLE_LABEL, USER_ERROR, type AdminUser, type Role } from "@/modules/user/contracts/user";
import {
  useCreateUser,
  useDeleteUser,
  useUpdateUser,
  useUserList,
} from "@/modules/user/hooks/useUsers";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { TextField } from "@/shared/components/Field";
import { FormDialog } from "@/shared/components/FormDialog";
import { PasswordField } from "@/shared/components/PasswordField";
import { ApiError } from "@/shared/lib/api-client";

/**
 * Pengguna: akun admin lain.
 *
 * AKUN DIBUAT LANGSUNG AKTIF DENGAN KATA SANDI AWAL DARI OWNER, sesuai pilihan
 * pemilik proyek. Alternatifnya undangan lewat surel, dan itu menuntut SMTP
 * aktif di dashboard Supabase yang belum terpasang; undangan yang tidak pernah
 * sampai jauh lebih buruk daripada kata sandi awal yang diganti sendiri nanti
 * di halaman Profil.
 *
 * TIGA PAGAR ADA DI SERVER, bukan di sini: tidak bisa menurunkan peran diri
 * sendiri, tidak bisa menonaktifkan diri sendiri, dan owner aktif TERAKHIR
 * tidak bisa dihapus maupun diturunkan. Yang ketiga paling penting, karena
 * tanpa itu satu klik bisa menghasilkan basis data tanpa satu pun owner aktif
 * dan tidak ada seorang pun yang bisa memulihkannya lewat panel.
 *
 * Tombolnya tetap dimatikan di layar untuk kasus yang sudah pasti ditolak,
 * tapi itu KENYAMANAN, bukan pengamanan. Pesan galat dari server yang menjadi
 * kebenarannya.
 */
type Values = {
  email: string;
  name: string;
  role: Role;
  password: string;
  isActive: boolean;
};

export default function PenggunaPage() {
  const { user: me } = useSession();
  const list = useUserList();
  const create = useCreateUser();
  const update = useUpdateUser();
  const remove = useDeleteUser();

  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [removing, setRemoving] = useState<AdminUser | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<Values>({ mode: "onBlur" });

  useEffect(() => {
    if (!dialogOpen) return;
    reset(
      editing
        ? {
            email: editing.email,
            name: editing.name,
            role: editing.role,
            password: "",
            isActive: editing.isActive,
          }
        : { email: "", name: "", role: "staff", password: "", isActive: true },
    );
  }, [dialogOpen, editing, reset]);

  const users = list.data ?? [];
  const activeOwners = users.filter((u) => u.role === "owner" && u.isActive).length;

  /** Benar bila menyentuh akun ini pasti ditolak server. */
  function isLastOwner(user: AdminUser): boolean {
    return user.role === "owner" && user.isActive && activeOwners <= 1;
  }

  function onError(error: unknown): void {
    if (error instanceof ApiError && error.code === "VALIDATION_ERROR") {
      for (const detail of error.details) {
        const field = detail.field as keyof Values;
        if (field in ({ email: 1, name: 1, role: 1, password: 1 } as Record<string, number>)) {
          setError(field, { message: USER_ERROR[detail.message] ?? detail.message });
        }
      }
      toast.error("Ada isian yang belum benar.");
      return;
    }
    toast.error(error instanceof ApiError ? error.message : "Gagal menyimpan.");
  }

  const submit = handleSubmit((values) => {
    const done = () => {
      toast.success(editing ? "Akun diperbarui." : "Akun dibuat.");
      setDialogOpen(false);
      setEditing(null);
    };

    if (editing) {
      update.mutate(
        {
          id: editing.id,
          payload: {
            name: values.name.trim(),
            role: values.role,
            isActive: values.isActive,
            ...(values.password.trim() ? { password: values.password } : {}),
          },
        },
        { onSuccess: done, onError },
      );
      return;
    }

    create.mutate(
      {
        email: values.email.trim(),
        name: values.name.trim(),
        role: values.role,
        password: values.password,
      },
      { onSuccess: done, onError },
    );
  });

  const pending = create.isPending || update.isPending;

  return (
    <AdminShell>
      <div className="adm-card" data-fixed="fill">
        <div className="adm-card-head">
          <div>
            <h2>Akun panel</h2>
            <p>Owner boleh segalanya. Staff hanya penanda habis dan susunan menu.</p>
          </div>
          <div className="adm-card-actions">
            <button
              type="button"
              className="adm-btn"
              data-variant="primary"
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus size={15} aria-hidden="true" />
              Tambah admin
            </button>
          </div>
        </div>
        <div className="adm-card-body" data-flush="true">
          {list.isLoading ? (
            <div style={{ padding: 18 }}>
              <div className="adm-skel" style={{ height: 120 }} />
            </div>
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Surel</th>
                    <th style={{ width: 110 }}>Peran</th>
                    <th style={{ width: 130 }}>Status</th>
                    <th style={{ width: 108 }} />
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <strong>{user.name}</strong>
                        {user.id === me?.id ? (
                          <span className="adm-badge" data-tone="accent" style={{ marginLeft: 8 }}>
                            Anda
                          </span>
                        ) : null}
                      </td>
                      <td>
                        <span className="adm-pick-sku">{user.email}</span>
                      </td>
                      <td>
                        <span className="adm-badge" data-tone={user.role === "owner" ? "accent" : "muted"}>
                          {ROLE_LABEL[user.role]}
                        </span>
                      </td>
                      <td>
                        {/* Status dibawa KATA, tidak pernah warna saja. */}
                        <span className="adm-badge" data-tone={user.isActive ? "ok" : "danger"}>
                          {user.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td>
                        <div className="adm-cell-actions">
                          <button
                            type="button"
                            className="adm-btn"
                            data-variant="ghost"
                            data-icon="true"
                            aria-label={`Ubah ${user.name}`}
                            onClick={() => {
                              setEditing(user);
                              setDialogOpen(true);
                            }}
                          >
                            <Pencil size={15} aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="adm-btn"
                            data-variant="ghost"
                            data-icon="true"
                            aria-label={`Hapus ${user.name}`}
                            disabled={user.id === me?.id || isLastOwner(user)}
                            title={
                              user.id === me?.id
                                ? "Anda tidak bisa menghapus akun sendiri."
                                : isLastOwner(user)
                                  ? "Owner aktif terakhir tidak bisa dihapus."
                                  : undefined
                            }
                            onClick={() => setRemoving(user)}
                          >
                            <Trash2 size={15} aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <FormDialog
        open={dialogOpen}
        title={editing ? `Ubah ${editing.name}` : "Tambah admin"}
        description={
          editing
            ? "Surel tidak bisa diubah. Kosongkan kata sandi bila tidak ingin menyetel ulang."
            : "Akun langsung aktif dan bisa dipakai."
        }
        onClose={() => {
          setDialogOpen(false);
          setEditing(null);
        }}
        footer={
          <>
            <button
              type="button"
              className="adm-btn"
              onClick={() => {
                setDialogOpen(false);
                setEditing(null);
              }}
              disabled={pending}
            >
              Batal
            </button>
            <button
              type="button"
              className="adm-btn"
              data-variant="primary"
              onClick={submit}
              disabled={pending}
            >
              {pending ? "Menyimpan..." : "Simpan"}
            </button>
          </>
        }
      >
        <form onSubmit={submit} noValidate>
          <TextField
            id="u-name"
            label="Nama"
            data-autofocus
            error={errors.name?.message}
            {...register("name", { required: "Nama wajib diisi." })}
          />
          <TextField
            id="u-email"
            label="Surel"
            type="email"
            autoComplete="off"
            readOnly={Boolean(editing)}
            disabled={Boolean(editing)}
            hint={editing ? "Tidak bisa diubah." : "Dipakai untuk masuk ke panel."}
            error={errors.email?.message}
            {...register("email", editing ? {} : { required: "Surel wajib diisi." })}
          />
          <div className="adm-field">
            <label htmlFor="u-role">Peran</label>
            <select
              id="u-role"
              className="adm-select"
              disabled={Boolean(editing && isLastOwner(editing))}
              {...register("role")}
            >
              <option value="staff">Staff</option>
              <option value="owner">Owner</option>
            </select>
            <p className="adm-hint">
              {editing && isLastOwner(editing)
                ? "Owner aktif terakhir tidak bisa diturunkan perannya."
                : "Staff hanya boleh mengubah penanda habis dan susunan menu."}
            </p>
          </div>

          <PasswordField
            id="u-password"
            label={editing ? "Setel ulang kata sandi" : "Kata sandi awal"}
            autoComplete="new-password"
            hint={
              editing
                ? "Kosongkan bila tidak ingin menggantinya. Minimal 12 karakter."
                : "Minimal 12 karakter. Beri tahu pemiliknya lewat jalur yang aman, dan minta ia menggantinya di halaman Profil."
            }
            error={errors.password?.message}
            {...register("password", {
              ...(editing ? {} : { required: "Kata sandi awal wajib diisi." }),
              minLength: { value: 12, message: "Kata sandi minimal 12 karakter." },
            })}
          />

          {editing ? (
            <label
              htmlFor="u-active"
              style={{ display: "flex", gap: 10, alignItems: "center", minHeight: 44 }}
            >
              <input
                id="u-active"
                type="checkbox"
                disabled={editing.id === me?.id || isLastOwner(editing)}
                {...register("isActive")}
              />
              <span style={{ fontSize: "0.86rem" }}>
                Akun aktif dan boleh masuk
                {editing.id === me?.id ? " (akun sendiri tidak bisa dinonaktifkan)" : ""}
              </span>
            </label>
          ) : null}
        </form>
      </FormDialog>

      <ConfirmDialog
        open={Boolean(removing)}
        title="Hapus akun ini?"
        description={removing ? `${removing.name}, ${removing.email}` : undefined}
        onClose={() => setRemoving(null)}
        footer={
          <>
            <button
              type="button"
              className="adm-btn"
              data-autofocus
              onClick={() => setRemoving(null)}
            >
              Batal
            </button>
            <button
              type="button"
              className="adm-btn"
              data-variant="danger"
              disabled={remove.isPending}
              onClick={() => {
                if (!removing) return;
                remove.mutate(removing.id, {
                  onSuccess: () => {
                    toast.success("Akun dihapus.");
                    setRemoving(null);
                  },
                  onError: (error) =>
                    toast.error(error instanceof ApiError ? error.message : "Gagal menghapus."),
                });
              }}
            >
              {remove.isPending ? "Menghapus..." : "Hapus"}
            </button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: "0.86rem", lineHeight: 1.6 }}>
          Akun Supabase Auth-nya ikut terhapus dan orang ini tidak bisa masuk lagi. Catatan audit
          yang pernah ia buat TETAP tersimpan. Kalau hanya ingin mencabut akses sementara,
          nonaktifkan akunnya alih-alih menghapus.
        </p>
      </ConfirmDialog>
    </AdminShell>
  );
}
