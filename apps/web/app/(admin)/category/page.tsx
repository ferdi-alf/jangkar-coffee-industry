"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { AdminShell } from "@/modules/admin/components/AdminShell";
import {
  useCategoryDetail,
  useCategoryList,
  useDeleteCategory,
  useSaveCategory,
  type CategoryItem,
} from "@/modules/category/hooks/useCategories";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { DataTable, type Column } from "@/shared/components/DataTable";
import { TextAreaField, TextField } from "@/shared/components/Field";
import { FormDrawer } from "@/shared/components/FormDrawer";
import { LocaleTabs } from "@/shared/components/LocaleTabs";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { ApiError } from "@/shared/lib/api-client";

/**
 * Kategori menu dan produk.
 *
 * Formnya punya enam medan, jadi bentuknya LACI KANAN, bukan dialog. Nama dan
 * deskripsi tampil publik sehingga masuk tab ID dan EN, sedangkan slug, urutan,
 * dan status tidak bergantung bahasa sehingga duduk di bawah blok tab.
 */
type Values = {
  slug: string;
  sortOrder: string;
  status: "draft" | "published" | "archived";
  nameId: string;
  nameEn: string;
  descId: string;
  descEn: string;
};

const EMPTY: Values = {
  slug: "",
  sortOrder: "0",
  status: "published",
  nameId: "",
  nameEn: "",
  descId: "",
  descEn: "",
};

export default function CategoryPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search);
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState<CategoryItem | null>(null);

  const list = useCategoryList({ page, perPage: 20, q: debounced || undefined });
  const detail = useCategoryDetail(editing);
  const save = useSaveCategory();
  const remove = useDeleteCategory();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Values>({ defaultValues: EMPTY });

  const open = creating || Boolean(editing);

  useEffect(() => {
    if (!open) return;
    const item = editing ? detail.data : null;
    reset(
      item
        ? {
            slug: item.slug,
            sortOrder: String(item.sortOrder),
            status: item.status,
            nameId: item.translations?.id.name ?? item.name,
            nameEn: item.translations?.en.name ?? "",
            descId: item.translations?.id.description ?? "",
            descEn: item.translations?.en.description ?? "",
          }
        : EMPTY,
    );
  }, [open, editing, detail.data, reset]);

  const columns: Column<CategoryItem>[] = [
    { key: "name", header: "Nama", render: (row) => <strong>{row.name}</strong> },
    { key: "slug", header: "Slug", render: (row) => <code>{row.slug}</code> },
    { key: "sort", header: "Urutan", numeric: true, width: "90px", render: (row) => row.sortOrder },
    {
      key: "status",
      header: "Status",
      width: "110px",
      render: (row) => (
        <span className="adm-badge" data-tone={row.status === "published" ? "ok" : "warn"}>
          {row.status === "published" ? "Tayang" : row.status === "draft" ? "Draf" : "Arsip"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      width: "108px",
      render: (row) => (
        <div className="adm-cell-actions">
          <button
            type="button"
            className="adm-btn"
            data-variant="ghost"
            data-icon="true"
            aria-label={`Ubah ${row.name}`}
            onClick={() => setEditing(row.id)}
          >
            <Pencil size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="adm-btn"
            data-variant="ghost"
            data-icon="true"
            aria-label={`Hapus ${row.name}`}
            onClick={() => setRemoving(row)}
          >
            <Trash2 size={15} aria-hidden="true" />
          </button>
        </div>
      ),
    },
  ];

  const submit = handleSubmit((values) => {
    save.mutate(
      {
        id: editing,
        payload: {
          slug: values.slug.trim(),
          sortOrder: Number(values.sortOrder) || 0,
          status: values.status,
          translations: {
            id: { name: values.nameId.trim(), description: values.descId.trim() || null },
            en: { name: values.nameEn.trim(), description: values.descEn.trim() || null },
          },
        },
      },
      {
        onSuccess: () => {
          toast.success(editing ? "Kategori diperbarui." : "Kategori ditambahkan.");
          setCreating(false);
          setEditing(null);
        },
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : "Gagal menyimpan."),
      },
    );
  });

  return (
    <AdminShell>
      <DataTable
        columns={columns}
        rows={list.data?.data ?? []}
        loading={list.isLoading}
        emptyLabel="Belum ada kategori."
        search={search}
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Cari kategori..."
        toolbar={
          <button type="button" className="adm-btn" data-variant="primary" onClick={() => setCreating(true)}>
            <Plus size={15} aria-hidden="true" />
            Tambah kategori
          </button>
        }
        page={page}
        totalPages={list.data?.meta.totalPages ?? 1}
        total={list.data?.meta.total ?? 0}
        onPage={setPage}
      />

      <FormDrawer
        open={open}
        title={editing ? "Ubah kategori" : "Tambah kategori"}
        description="Isi kedua bahasa sebelum menyimpan."
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        footer={
          <>
            <button
              type="button"
              className="adm-btn"
              onClick={() => {
                setCreating(false);
                setEditing(null);
              }}
            >
              Batal
            </button>
            <button type="button" className="adm-btn" data-variant="primary" onClick={submit} disabled={save.isPending}>
              {save.isPending ? "Menyimpan..." : "Simpan"}
            </button>
          </>
        }
      >
        <form onSubmit={submit} noValidate>
          <LocaleTabs
            id={
              <>
                <TextField
                  id="c-name-id"
                  label="Nama (Indonesia)"
                  error={errors.nameId?.message}
                  {...register("nameId", { required: "Nama wajib diisi." })}
                />
                <TextAreaField id="c-desc-id" label="Deskripsi (Indonesia)" {...register("descId")} />
              </>
            }
            en={
              <>
                <TextField
                  id="c-name-en"
                  label="Nama (English)"
                  error={errors.nameEn?.message}
                  {...register("nameEn", { required: "Nama bahasa Inggris wajib diisi." })}
                />
                <TextAreaField id="c-desc-en" label="Deskripsi (English)" {...register("descEn")} />
              </>
            }
            shared={
              <>
                <TextField
                  id="c-slug"
                  label="Slug"
                  hint="Huruf kecil, angka, dan tanda hubung."
                  error={errors.slug?.message}
                  {...register("slug", { required: "Slug wajib diisi." })}
                />
                <div className="adm-row-2">
                  <TextField id="c-sort" label="Urutan" type="number" inputMode="numeric" {...register("sortOrder")} />
                  <div className="adm-field">
                    <label htmlFor="c-status">Status</label>
                    <select id="c-status" className="adm-select" {...register("status")}>
                      <option value="published">Tayang</option>
                      <option value="draft">Draf</option>
                      <option value="archived">Arsip</option>
                    </select>
                  </div>
                </div>
              </>
            }
          />
        </form>
      </FormDrawer>

      <ConfirmDialog
        open={Boolean(removing)}
        title="Hapus kategori ini?"
        description={removing?.name}
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
                    toast.success("Kategori dihapus.");
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
          Produk yang memakai kategori ini TIDAK ikut terhapus, ia hanya jadi tanpa kategori.
        </p>
      </ConfirmDialog>
    </AdminShell>
  );
}
