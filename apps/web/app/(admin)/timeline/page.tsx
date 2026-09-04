"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { AdminShell } from "@/modules/admin/components/AdminShell";
import {
  TIMELINE_ERROR,
  type TimelineEntry,
  type TimelinePayload,
} from "@/modules/timeline/contracts/timeline";
import {
  useDeleteTimeline,
  useSaveTimeline,
  useTimelineList,
} from "@/modules/timeline/hooks/useTimeline";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { TextAreaField, TextField } from "@/shared/components/Field";
import { FormDialog } from "@/shared/components/FormDialog";
import { LocaleTabs } from "@/shared/components/LocaleTabs";
import { ApiError } from "@/shared/lib/api-client";

/**
 * Timeline: tonggak perjalanan yang tampil di seksi Tentang kami.
 *
 * BENTUKNYA MODAL, diminta pemilik proyek secara eksplisit. Karena isinya lima
 * medan sedangkan ConfirmDialog memang dibatasi tiga, halaman ini memakai
 * FormDialog, komponen bersama baru yang jujur menyebut dirinya untuk form
 * lebih dari tiga medan. Lihat shared/components/FormDialog.tsx.
 *
 * URUT MENURUT TAHUN, dan urutan itu ditentukan SERVER, bukan tabel ini. Garis
 * waktu yang bisa diurutkan sembarangan bukan garis waktu lagi.
 *
 * Tahun akhir boleh kosong, artinya "masih berjalan". Situs yang menutupnya
 * dengan kata "kini" atau "now", dan kata itu datang dari kamus i18n karena ia
 * teks yang diterjemahkan sedangkan angka tahun tidak.
 *
 * Isi awal tabelnya dipindahkan dari konstanta dan kamus lewat migrasi, JADI
 * TAHUN-TAHUNNYA MASIH KARANGAN. Sesi sebelumnya menandainya sebagai
 * placeholder karena tanggal berdirinya Jangkar tidak tercatat di dokumen mana
 * pun yang dimiliki proyek ini. Halaman inilah tempat memperbaikinya.
 */
type Values = {
  year: string;
  yearEnd: string;
  sortOrder: string;
  status: "draft" | "published";
  titleId: string;
  titleEn: string;
  subtitleId: string;
  subtitleEn: string;
  descId: string;
  descEn: string;
};

const EMPTY: Values = {
  year: String(new Date().getFullYear()),
  yearEnd: "",
  sortOrder: "0",
  status: "published",
  titleId: "",
  titleEn: "",
  subtitleId: "",
  subtitleEn: "",
  descId: "",
  descEn: "",
};

function toValues(entry: TimelineEntry | null): Values {
  if (!entry) return EMPTY;
  return {
    year: String(entry.year),
    yearEnd: entry.yearEnd === null ? "" : String(entry.yearEnd),
    sortOrder: String(entry.sortOrder),
    status: entry.status,
    titleId: entry.translations?.id.title ?? entry.title,
    titleEn: entry.translations?.en.title ?? "",
    subtitleId: entry.translations?.id.subtitle ?? "",
    subtitleEn: entry.translations?.en.subtitle ?? "",
    descId: entry.translations?.id.description ?? "",
    descEn: entry.translations?.en.description ?? "",
  };
}

const FIELD_MAP: Record<string, keyof Values> = {
  year: "year",
  yearEnd: "yearEnd",
  "translations.id.title": "titleId",
  "translations.en.title": "titleEn",
  "translations.id.subtitle": "subtitleId",
  "translations.en.subtitle": "subtitleEn",
  "translations.id.description": "descId",
  "translations.en.description": "descEn",
};

export default function TimelinePage() {
  const list = useTimelineList();
  const save = useSaveTimeline();
  const remove = useDeleteTimeline();

  const [editing, setEditing] = useState<TimelineEntry | null>(null);
  const [open, setOpen] = useState(false);
  const [removing, setRemoving] = useState<TimelineEntry | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<Values>({ defaultValues: EMPTY, mode: "onBlur" });

  useEffect(() => {
    if (open) reset(toValues(editing));
  }, [open, editing, reset]);

  function onError(error: unknown): void {
    if (error instanceof ApiError && error.code === "VALIDATION_ERROR") {
      for (const detail of error.details) {
        const field = FIELD_MAP[detail.field];
        if (field) setError(field, { message: TIMELINE_ERROR[detail.message] ?? detail.message });
      }
      toast.error("Ada isian yang belum benar.");
      return;
    }
    toast.error(error instanceof ApiError ? error.message : "Gagal menyimpan.");
  }

  const submit = handleSubmit((values) => {
    const payload: TimelinePayload = {
      year: Number(values.year),
      yearEnd: values.yearEnd.trim() === "" ? null : Number(values.yearEnd),
      sortOrder: Number(values.sortOrder) || 0,
      status: values.status,
      translations: {
        id: {
          title: values.titleId.trim(),
          subtitle: values.subtitleId.trim() || null,
          description: values.descId.trim() || null,
        },
        en: {
          title: values.titleEn.trim(),
          subtitle: values.subtitleEn.trim() || null,
          description: values.descEn.trim() || null,
        },
      },
    };

    save.mutate(
      { id: editing?.id ?? null, payload },
      {
        onSuccess: () => {
          toast.success(editing ? "Tonggak diperbarui." : "Tonggak ditambahkan.");
          setOpen(false);
          setEditing(null);
        },
        onError,
      },
    );
  });

  const entries = list.data ?? [];

  return (
    <AdminShell>
      <div className="adm-card" data-fixed="fill">
        <div className="adm-card-head">
          <div>
            <h2>Tonggak perjalanan</h2>
            <p>Urut menurut tahun. Tahun akhir boleh kosong bila masih berjalan.</p>
          </div>
          <div className="adm-card-actions">
            <button
              type="button"
              className="adm-btn"
              data-variant="primary"
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              <Plus size={15} aria-hidden="true" />
              Tambah tonggak
            </button>
          </div>
        </div>

        <div className="adm-card-body" data-flush="true">
          {list.isLoading ? (
            <div style={{ padding: 18 }}>
              <div className="adm-skel" style={{ height: 120 }} />
            </div>
          ) : entries.length === 0 ? (
            <p className="adm-empty">Belum ada tonggak.</p>
          ) : (
            <ol className="adm-timeline">
              {entries.map((entry) => (
                <li key={entry.id}>
                  <span className="adm-timeline-year">
                    {entry.year}
                    {entry.yearEnd === null ? " sampai kini" : entry.yearEnd === entry.year ? "" : ` sampai ${entry.yearEnd}`}
                  </span>
                  <div className="adm-timeline-body">
                    <strong>{entry.title}</strong>
                    {entry.subtitle ? <span>{entry.subtitle}</span> : null}
                    {entry.description ? <p>{entry.description}</p> : null}
                    {entry.status === "draft" ? (
                      /* Draf dibawa lencana BERTULISAN, bukan sekadar diredupkan.
                         Warna tidak pernah jadi satu-satunya pembawa makna. */
                      <span className="adm-badge" data-tone="warn">
                        Draf, belum tampil di situs
                      </span>
                    ) : null}
                  </div>
                  <div className="adm-cell-actions">
                    <button
                      type="button"
                      className="adm-btn"
                      data-variant="ghost"
                      data-icon="true"
                      aria-label={`Ubah tonggak ${entry.year}`}
                      onClick={() => {
                        setEditing(entry);
                        setOpen(true);
                      }}
                    >
                      <Pencil size={15} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="adm-btn"
                      data-variant="ghost"
                      data-icon="true"
                      aria-label={`Hapus tonggak ${entry.year}`}
                      onClick={() => setRemoving(entry)}
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <FormDialog
        open={open}
        title={editing ? `Ubah tonggak ${editing.year}` : "Tambah tonggak"}
        description="Isi kedua bahasa sebelum menyimpan."
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        footer={
          <>
            <button
              type="button"
              className="adm-btn"
              onClick={() => {
                setOpen(false);
                setEditing(null);
              }}
              disabled={save.isPending}
            >
              Batal
            </button>
            <button
              type="button"
              className="adm-btn"
              data-variant="primary"
              onClick={submit}
              disabled={save.isPending}
            >
              {save.isPending ? "Menyimpan..." : "Simpan"}
            </button>
          </>
        }
      >
        <form onSubmit={submit} noValidate>
          <div className="adm-row-2">
            <TextField
              id="t-year"
              label="Tahun"
              type="number"
              inputMode="numeric"
              placeholder="2016"
              data-autofocus
              error={errors.year?.message}
              {...register("year", { required: "Tahun wajib diisi." })}
            />
            <TextField
              id="t-year-end"
              label="Tahun akhir"
              type="number"
              inputMode="numeric"
              placeholder="Kosongkan bila masih berjalan"
              hint="Kosong berarti rentangnya belum berakhir."
              error={errors.yearEnd?.message}
              {...register("yearEnd")}
            />
          </div>

          <LocaleTabs
            id={
              <>
                <TextField
                  id="t-title-id"
                  label="Judul (Indonesia)"
                  error={errors.titleId?.message}
                  {...register("titleId", { required: "Judul wajib diisi." })}
                />
                <TextField
                  id="t-subtitle-id"
                  label="Subjudul (Indonesia)"
                  hint="Opsional. Biasanya nama tempat."
                  {...register("subtitleId")}
                />
                <TextAreaField
                  id="t-desc-id"
                  label="Deskripsi (Indonesia)"
                  {...register("descId")}
                />
              </>
            }
            en={
              <>
                <TextField
                  id="t-title-en"
                  label="Judul (English)"
                  error={errors.titleEn?.message}
                  {...register("titleEn", { required: "Judul bahasa Inggris wajib diisi." })}
                />
                <TextField
                  id="t-subtitle-en"
                  label="Subjudul (English)"
                  {...register("subtitleEn")}
                />
                <TextAreaField id="t-desc-en" label="Deskripsi (English)" {...register("descEn")} />
              </>
            }
            shared={
              <div className="adm-row-2">
                <div className="adm-field">
                  <label htmlFor="t-status">Status</label>
                  <select id="t-status" className="adm-select" {...register("status")}>
                    <option value="published">Tayang</option>
                    <option value="draft">Draf, belum tayang</option>
                  </select>
                </div>
                <TextField
                  id="t-sort"
                  label="Urutan dalam tahun sama"
                  type="number"
                  inputMode="numeric"
                  hint="Hanya berlaku bila dua tonggak setahun."
                  {...register("sortOrder")}
                />
              </div>
            }
          />
        </form>
      </FormDialog>

      <ConfirmDialog
        open={Boolean(removing)}
        title="Hapus tonggak ini?"
        description={removing ? `${removing.year} ${removing.title}` : undefined}
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
                    toast.success("Tonggak dihapus.");
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
          Kedua terjemahannya ikut terhapus, dan tonggak ini langsung hilang dari garis waktu di
          situs. Tindakan ini tidak bisa dibatalkan.
        </p>
      </ConfirmDialog>
    </AdminShell>
  );
}
