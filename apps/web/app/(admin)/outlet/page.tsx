"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { AdminShell } from "@/modules/admin/components/AdminShell";
import {
  useDeleteOutlet,
  useOutletDetail,
  useOutletList,
  useSaveOutlet,
  type OutletItem,
} from "@/modules/outlet/hooks/useOutlets";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { DataTable, type Column } from "@/shared/components/DataTable";
import { TextAreaField, TextField } from "@/shared/components/Field";
import { FormDrawer } from "@/shared/components/FormDrawer";
import { LocaleTabs } from "@/shared/components/LocaleTabs";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { ApiError } from "@/shared/lib/api-client";

/**
 * Outlet, gerai tetap.
 *
 * PENANDA KOORDINAT PERKIRAAN ada di form ini dan sengaja menyala secara bawaan.
 * Selama ia menyala, tombol navigasi di situs memakai alamat teks, bukan
 * koordinatnya, supaya pengunjung tetap sampai ke tempat yang benar meski
 * pinnya masih meleset. Mematikannya adalah pernyataan bahwa koordinatnya sudah
 * diperiksa, jadi ia harus dilakukan sadar, bukan jadi bawaan.
 */
type Values = {
  slug: string;
  name: string;
  address: string;
  phone: string;
  phoneHref: string;
  whatsapp: string;
  mapsQuery: string;
  lat: string;
  lng: string;
  coordsApproximate: boolean;
  isHeadquarters: boolean;
  sortOrder: string;
  status: "draft" | "published" | "archived";
  labelId: string;
  labelEn: string;
  hoursId: string;
  hoursEn: string;
  summaryId: string;
  summaryEn: string;
};

const EMPTY: Values = {
  slug: "",
  name: "",
  address: "",
  phone: "",
  phoneHref: "",
  whatsapp: "",
  mapsQuery: "",
  lat: "",
  lng: "",
  coordsApproximate: true,
  isHeadquarters: false,
  sortOrder: "0",
  status: "published",
  labelId: "",
  labelEn: "",
  hoursId: "",
  hoursEn: "",
  summaryId: "",
  summaryEn: "",
};

export default function OutletPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search);
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState<OutletItem | null>(null);

  const list = useOutletList({ page, perPage: 20, q: debounced || undefined });
  const detail = useOutletDetail(editing);
  const save = useSaveOutlet();
  const remove = useDeleteOutlet();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Values>({ defaultValues: EMPTY });
  const open = creating || Boolean(editing);

  useEffect(() => {
    if (!open) return;
    const item = editing ? detail.data : null;
    reset(
      item
        ? {
            slug: item.slug,
            name: item.name,
            address: item.address,
            phone: item.phone ?? "",
            phoneHref: item.phoneHref ?? "",
            whatsapp: item.whatsapp ?? "",
            mapsQuery: item.mapsQuery,
            lat: item.lat === null ? "" : String(item.lat),
            lng: item.lng === null ? "" : String(item.lng),
            coordsApproximate: item.coordsApproximate,
            isHeadquarters: item.isHeadquarters,
            sortOrder: String(item.sortOrder),
            status: item.status,
            labelId: item.translations?.id.label ?? item.label,
            labelEn: item.translations?.en.label ?? "",
            hoursId: item.translations?.id.hours ?? "",
            hoursEn: item.translations?.en.hours ?? "",
            summaryId: item.translations?.id.summary ?? "",
            summaryEn: item.translations?.en.summary ?? "",
          }
        : EMPTY,
    );
  }, [open, editing, detail.data, reset]);

  const columns: Column<OutletItem>[] = [
    {
      key: "name",
      header: "Nama",
      render: (row) => (
        <div>
          <strong>{row.name}</strong>
          {row.isHeadquarters ? (
            <span className="adm-badge" data-tone="accent" style={{ marginLeft: 8 }}>
              HQ
            </span>
          ) : null}
        </div>
      ),
    },
    { key: "address", header: "Alamat", render: (row) => row.address },
    {
      key: "coords",
      header: "Koordinat",
      width: "150px",
      render: (row) =>
        row.lat === null || row.lng === null ? (
          <span className="adm-badge" data-tone="muted">Belum ada</span>
        ) : (
          <span className="adm-badge" data-tone={row.coordsApproximate ? "warn" : "ok"}>
            {row.coordsApproximate ? "Perkiraan" : "Terverifikasi"}
          </span>
        ),
    },
    {
      key: "actions",
      header: "",
      width: "108px",
      render: (row) => (
        <div className="adm-cell-actions">
          <button type="button" className="adm-btn" data-variant="ghost" data-icon="true" aria-label={`Ubah ${row.name}`} onClick={() => setEditing(row.id)}>
            <Pencil size={15} aria-hidden="true" />
          </button>
          <button type="button" className="adm-btn" data-variant="ghost" data-icon="true" aria-label={`Hapus ${row.name}`} onClick={() => setRemoving(row)}>
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
          name: values.name.trim(),
          address: values.address.trim(),
          phone: values.phone.trim() || null,
          phoneHref: values.phoneHref.trim() || null,
          whatsapp: values.whatsapp.trim() || null,
          mapsQuery: values.mapsQuery.trim(),
          lat: values.lat.trim() === "" ? null : Number(values.lat),
          lng: values.lng.trim() === "" ? null : Number(values.lng),
          coordsApproximate: values.coordsApproximate,
          isHeadquarters: values.isHeadquarters,
          sortOrder: Number(values.sortOrder) || 0,
          status: values.status,
          translations: {
            id: { label: values.labelId.trim(), hours: values.hoursId.trim() || null, summary: values.summaryId.trim() || null },
            en: { label: values.labelEn.trim(), hours: values.hoursEn.trim() || null, summary: values.summaryEn.trim() || null },
          },
        },
      },
      {
        onSuccess: () => {
          toast.success(editing ? "Outlet diperbarui." : "Outlet ditambahkan.");
          setCreating(false);
          setEditing(null);
        },
        onError: (error) => toast.error(error instanceof ApiError ? error.message : "Gagal menyimpan."),
      },
    );
  });

  return (
    <AdminShell>
      <DataTable
        columns={columns}
        rows={list.data?.data ?? []}
        loading={list.isLoading}
        emptyLabel="Belum ada outlet."
        search={search}
        onSearch={(value) => { setSearch(value); setPage(1); }}
        searchPlaceholder="Cari nama atau alamat..."
        toolbar={
          <button type="button" className="adm-btn" data-variant="primary" onClick={() => setCreating(true)}>
            <Plus size={15} aria-hidden="true" />
            Tambah outlet
          </button>
        }
        page={page}
        totalPages={list.data?.meta.totalPages ?? 1}
        total={list.data?.meta.total ?? 0}
        onPage={setPage}
      />

      <FormDrawer
        open={open}
        title={editing ? "Ubah outlet" : "Tambah outlet"}
        onClose={() => { setCreating(false); setEditing(null); }}
        footer={
          <>
            <button type="button" className="adm-btn" onClick={() => { setCreating(false); setEditing(null); }}>Batal</button>
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
                <TextField id="o-label-id" label="Label (Indonesia)" error={errors.labelId?.message} {...register("labelId", { required: "Label wajib diisi." })} />
                <TextField id="o-hours-id" label="Jam buka (Indonesia)" placeholder="07.00 sampai 23.00, setiap hari" {...register("hoursId")} />
                <TextAreaField id="o-sum-id" label="Ringkasan (Indonesia)" {...register("summaryId")} />
              </>
            }
            en={
              <>
                <TextField id="o-label-en" label="Label (English)" error={errors.labelEn?.message} {...register("labelEn", { required: "Label bahasa Inggris wajib diisi." })} />
                <TextField id="o-hours-en" label="Opening hours (English)" placeholder="07.00 to 23.00, every day" {...register("hoursEn")} />
                <TextAreaField id="o-sum-en" label="Summary (English)" {...register("summaryEn")} />
              </>
            }
            shared={
              <>
                <div className="adm-row-2">
                  <TextField id="o-name" label="Nama" error={errors.name?.message} {...register("name", { required: "Nama wajib diisi." })} />
                  <TextField id="o-slug" label="Slug" error={errors.slug?.message} {...register("slug", { required: "Slug wajib diisi." })} />
                </div>
                <TextAreaField id="o-address" label="Alamat" error={errors.address?.message} {...register("address", { required: "Alamat wajib diisi." })} />
                <TextField
                  id="o-maps"
                  label="Kata kunci Google Maps"
                  hint="Dipakai tombol navigasi selama koordinatnya masih perkiraan."
                  error={errors.mapsQuery?.message}
                  {...register("mapsQuery", { required: "Kata kunci maps wajib diisi." })}
                />
                <div className="adm-row-2">
                  <TextField id="o-phone" label="Telepon" {...register("phone")} />
                  <TextField id="o-phone-href" label="Tautan telepon" placeholder="tel:+62..." {...register("phoneHref")} />
                </div>
                <TextField id="o-wa" label="Tautan WhatsApp" placeholder="https://wa.me/62..." {...register("whatsapp")} />
                <div className="adm-row-2">
                  <TextField id="o-lat" label="Lintang" type="number" step="any" {...register("lat")} />
                  <TextField id="o-lng" label="Bujur" type="number" step="any" {...register("lng")} />
                </div>
                <label htmlFor="o-approx" style={{ display: "flex", gap: 10, alignItems: "center", minHeight: 40, fontSize: "0.84rem" }}>
                  <input id="o-approx" type="checkbox" {...register("coordsApproximate")} />
                  Koordinat masih perkiraan, pakai alamat teks untuk navigasi
                </label>
                <label htmlFor="o-hq" style={{ display: "flex", gap: 10, alignItems: "center", minHeight: 40, fontSize: "0.84rem" }}>
                  <input id="o-hq" type="checkbox" {...register("isHeadquarters")} />
                  Ini kantor pusat
                </label>
                <div className="adm-row-2">
                  <TextField id="o-sort" label="Urutan" type="number" inputMode="numeric" {...register("sortOrder")} />
                  <div className="adm-field">
                    <label htmlFor="o-status">Status</label>
                    <select id="o-status" className="adm-select" {...register("status")}>
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
        title="Hapus outlet ini?"
        description={removing?.name}
        onClose={() => setRemoving(null)}
        footer={
          <>
            <button type="button" className="adm-btn" data-autofocus onClick={() => setRemoving(null)}>Batal</button>
            <button
              type="button"
              className="adm-btn"
              data-variant="danger"
              disabled={remove.isPending}
              onClick={() =>
                removing &&
                remove.mutate(removing.id, {
                  onSuccess: () => { toast.success("Outlet dihapus."); setRemoving(null); },
                  onError: (error) => toast.error(error instanceof ApiError ? error.message : "Gagal menghapus."),
                })
              }
            >
              Hapus
            </button>
          </>
        }
      />
    </AdminShell>
  );
}
