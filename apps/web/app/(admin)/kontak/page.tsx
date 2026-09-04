"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { AdminShell } from "@/modules/admin/components/AdminShell";
import {
  SETTINGS_ERROR,
  SOCIAL_LABEL,
  SOCIAL_PLATFORMS,
  type ContactSettings,
  type SocialLink,
  type SocialPlatform,
} from "@/modules/settings/contracts/settings";
import {
  useContactSettings,
  useDeleteSocial,
  useSaveContact,
  useSaveSocial,
  useSocialLinks,
} from "@/modules/settings/hooks/useSettings";
import { SocialIcon } from "@/components/ui/social-icons";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { TextField } from "@/shared/components/Field";
import { FormDialog } from "@/shared/components/FormDialog";
import { ApiError } from "@/shared/lib/api-client";

/**
 * Kontak dan sosial media, yang dikonsumsi situs publik.
 *
 * Sebelum halaman ini ada, nomor telepon, WhatsApp, alamat, dan satu tautan
 * Instagram semuanya HARDCODE di konstanta `HQ` pada
 * modules/home/constants/menu-data.ts. Mengganti nomor telepon berarti deploy
 * ulang, dan menambah TikTok berarti menulis kode.
 *
 * Tautan sosial tampil di situs SEBAGAI IKON masing-masing platform, sesuai
 * permintaan pemilik proyek. Setiap ikon tetap membawa nama platformnya untuk
 * pembaca layar, karena bentuk saja tidak boleh jadi satu-satunya pembawa
 * makna.
 *
 * Satu platform hanya boleh punya SATU tautan, dipaksa UNIQUE di basis data.
 * Karena itu pemilih platform di bawah menyembunyikan yang sudah terpakai:
 * lebih baik pilihannya tidak ada daripada bisa dipilih lalu ditolak 409.
 */
type ContactValues = {
  phone: string;
  phoneHref: string;
  whatsapp: string;
  email: string;
  address: string;
  mapsQuery: string;
  siteLabel: string;
  siteUrl: string;
};

function toContactValues(contact: ContactSettings): ContactValues {
  return {
    phone: contact.phone ?? "",
    phoneHref: contact.phoneHref ?? "",
    whatsapp: contact.whatsapp ?? "",
    email: contact.email ?? "",
    address: contact.address ?? "",
    mapsQuery: contact.mapsQuery ?? "",
    siteLabel: contact.siteLabel ?? "",
    siteUrl: contact.siteUrl ?? "",
  };
}

type SocialValues = {
  platform: SocialPlatform;
  url: string;
  label: string;
  sortOrder: string;
  isActive: boolean;
};

export default function KontakPage() {
  const contactQuery = useContactSettings();
  const saveContact = useSaveContact();
  const socialQuery = useSocialLinks();
  const saveSocial = useSaveSocial();
  const deleteSocial = useDeleteSocial();

  const [editing, setEditing] = useState<SocialLink | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [removing, setRemoving] = useState<SocialLink | null>(null);

  const contactForm = useForm<ContactValues>({ mode: "onBlur" });
  const socialForm = useForm<SocialValues>({ mode: "onBlur" });

  useEffect(() => {
    if (contactQuery.data) contactForm.reset(toContactValues(contactQuery.data));
  }, [contactQuery.data, contactForm]);

  const links = socialQuery.data ?? [];
  const used = new Set(links.filter((l) => l.id !== editing?.id).map((l) => l.platform));
  const available = SOCIAL_PLATFORMS.filter((p) => !used.has(p));

  useEffect(() => {
    if (!dialogOpen) return;
    socialForm.reset(
      editing
        ? {
            platform: editing.platform,
            url: editing.url,
            label: editing.label ?? "",
            sortOrder: String(editing.sortOrder),
            isActive: editing.isActive,
          }
        : {
            platform: available[0] ?? "instagram",
            url: "",
            label: "",
            sortOrder: String(links.length),
            isActive: true,
          },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogOpen, editing]);

  function apiError(error: unknown, setter: (field: never, e: { message: string }) => void): void {
    if (error instanceof ApiError && error.code === "VALIDATION_ERROR") {
      for (const detail of error.details) {
        setter(detail.field as never, {
          message: SETTINGS_ERROR[detail.message] ?? detail.message,
        });
      }
      toast.error("Ada isian yang belum benar.");
      return;
    }
    toast.error(error instanceof ApiError ? error.message : "Gagal menyimpan.");
  }

  const submitContact = contactForm.handleSubmit((values) => {
    saveContact.mutate(
      {
        phone: values.phone.trim() || null,
        phoneHref: values.phoneHref.trim() || null,
        whatsapp: values.whatsapp.trim() || null,
        email: values.email.trim() || null,
        address: values.address.trim() || null,
        mapsQuery: values.mapsQuery.trim() || null,
        siteLabel: values.siteLabel.trim() || null,
        siteUrl: values.siteUrl.trim() || null,
      },
      {
        onSuccess: () => toast.success("Kontak disimpan."),
        onError: (error) => apiError(error, contactForm.setError as never),
      },
    );
  });

  const submitSocial = socialForm.handleSubmit((values) => {
    saveSocial.mutate(
      {
        id: editing?.id ?? null,
        payload: {
          platform: values.platform,
          url: values.url.trim(),
          label: values.label.trim() || null,
          sortOrder: Number(values.sortOrder) || 0,
          isActive: values.isActive,
        },
      },
      {
        onSuccess: () => {
          toast.success(editing ? "Tautan diperbarui." : "Tautan ditambahkan.");
          setDialogOpen(false);
          setEditing(null);
        },
        onError: (error) => apiError(error, socialForm.setError as never),
      },
    );
  });

  return (
    <AdminShell>
      <form onSubmit={submitContact} noValidate>
        <div className="adm-card">
          <div className="adm-card-head">
            <div>
              <h2>Kontak</h2>
              <p>Tampil di footer dan di seksi Kontak pada beranda.</p>
            </div>
          </div>
          <div className="adm-card-body">
            {contactQuery.isLoading ? (
              <div className="adm-skel" style={{ height: 180 }} />
            ) : (
              <>
                <div className="adm-row-2">
                  <TextField
                    id="c-phone"
                    label="Nomor telepon"
                    placeholder="0899 999 3030"
                    hint="Ditulis seperti yang ingin dibaca pengunjung."
                    {...contactForm.register("phone")}
                  />
                  <TextField
                    id="c-phone-href"
                    label="Tautan telepon"
                    placeholder="tel:+628999993030"
                    hint="Yang ditekan di ponsel. Bentuk tel:+62..."
                    error={contactForm.formState.errors.phoneHref?.message}
                    {...contactForm.register("phoneHref")}
                  />
                </div>
                <div className="adm-row-2">
                  <TextField
                    id="c-whatsapp"
                    label="Tautan WhatsApp"
                    type="url"
                    placeholder="https://wa.me/628999993030"
                    error={contactForm.formState.errors.whatsapp?.message}
                    {...contactForm.register("whatsapp")}
                  />
                  <TextField
                    id="c-email"
                    label="Surel"
                    type="email"
                    placeholder="halo@kopijangkar.com"
                    hint="Kosongkan bila belum ada. Jangan diisi alamat karangan."
                    error={contactForm.formState.errors.email?.message}
                    {...contactForm.register("email")}
                  />
                </div>
                <TextField
                  id="c-address"
                  label="Alamat"
                  placeholder="Jln Siaran No 745B, Sako, Palembang"
                  {...contactForm.register("address")}
                />
                <TextField
                  id="c-maps"
                  label="Kata kunci peta"
                  hint="Dipakai tombol navigasi selama koordinat masih perkiraan."
                  {...contactForm.register("mapsQuery")}
                />
                <div className="adm-row-2">
                  <TextField
                    id="c-site-label"
                    label="Label situs"
                    placeholder="kopijangkar.com"
                    {...contactForm.register("siteLabel")}
                  />
                  <TextField
                    id="c-site-url"
                    label="Alamat situs"
                    type="url"
                    placeholder="https://www.kopijangkar.com"
                    error={contactForm.formState.errors.siteUrl?.message}
                    {...contactForm.register("siteUrl")}
                  />
                </div>
              </>
            )}
          </div>
          <div className="adm-drawer-foot">
            <button
              type="submit"
              className="adm-btn"
              data-variant="primary"
              disabled={saveContact.isPending}
            >
              {saveContact.isPending ? "Menyimpan..." : "Simpan kontak"}
            </button>
          </div>
        </div>
      </form>

      <div className="adm-card" style={{ marginTop: 16 }}>
        <div className="adm-card-head">
          <div>
            <h2>Sosial media</h2>
            <p>Tampil di footer sebagai ikon. Yang tidak aktif tidak dirender sama sekali.</p>
          </div>
          <div className="adm-card-actions">
            <button
              type="button"
              className="adm-btn"
              data-variant="primary"
              disabled={available.length === 0}
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus size={15} aria-hidden="true" />
              Tambah tautan
            </button>
          </div>
        </div>
        <div className="adm-card-body" data-flush="true">
          {socialQuery.isLoading ? (
            <div style={{ padding: 18 }}>
              <div className="adm-skel" style={{ height: 100 }} />
            </div>
          ) : links.length === 0 ? (
            <p className="adm-empty">Belum ada tautan sosial media.</p>
          ) : (
            <table className="adm-table">
              <thead>
                <tr>
                  <th style={{ width: 180 }}>Platform</th>
                  <th>Tautan</th>
                  <th style={{ width: 120 }}>Status</th>
                  <th style={{ width: 108 }} />
                </tr>
              </thead>
              <tbody>
                {links.map((link) => (
                  <tr key={link.id}>
                    <td>
                      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <SocialIcon platform={link.platform} size={16} />
                        {SOCIAL_LABEL[link.platform]}
                      </span>
                    </td>
                    <td>
                      <span className="adm-pick-sku">{link.label ?? link.url}</span>
                    </td>
                    <td>
                      {/* Aktif dan nonaktif dibawa KATA, bukan warna saja. */}
                      <span className="adm-badge" data-tone={link.isActive ? "ok" : "muted"}>
                        {link.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td>
                      <div className="adm-cell-actions">
                        <button
                          type="button"
                          className="adm-btn"
                          data-variant="ghost"
                          data-icon="true"
                          aria-label={`Ubah ${SOCIAL_LABEL[link.platform]}`}
                          onClick={() => {
                            setEditing(link);
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
                          aria-label={`Hapus ${SOCIAL_LABEL[link.platform]}`}
                          onClick={() => setRemoving(link)}
                        >
                          <Trash2 size={15} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <FormDialog
        open={dialogOpen}
        title={editing ? `Ubah tautan ${SOCIAL_LABEL[editing.platform]}` : "Tambah tautan sosial"}
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
              disabled={saveSocial.isPending}
            >
              Batal
            </button>
            <button
              type="button"
              className="adm-btn"
              data-variant="primary"
              onClick={submitSocial}
              disabled={saveSocial.isPending}
            >
              {saveSocial.isPending ? "Menyimpan..." : "Simpan"}
            </button>
          </>
        }
      >
        <form onSubmit={submitSocial} noValidate>
          <div className="adm-field">
            <label htmlFor="so-platform">Platform</label>
            <select
              id="so-platform"
              className="adm-select"
              data-autofocus
              {...socialForm.register("platform")}
            >
              {(editing ? [editing.platform, ...available] : available).map((platform) => (
                <option key={platform} value={platform}>
                  {SOCIAL_LABEL[platform]}
                </option>
              ))}
            </select>
            <p className="adm-hint">Satu platform hanya boleh punya satu tautan.</p>
          </div>

          <TextField
            id="so-url"
            label="Tautan"
            type="url"
            placeholder="https://instagram.com/jangkarkeliling.id"
            hint="Harus diawali https://"
            error={socialForm.formState.errors.url?.message}
            {...socialForm.register("url", { required: "Tautan wajib diisi." })}
          />
          <TextField
            id="so-label"
            label="Label"
            placeholder="@jangkarkeliling.id"
            hint="Opsional. Dipakai sebagai teks pendamping ikon."
            {...socialForm.register("label")}
          />
          <div className="adm-row-2">
            <TextField
              id="so-sort"
              label="Urutan"
              type="number"
              inputMode="numeric"
              {...socialForm.register("sortOrder")}
            />
            <label
              htmlFor="so-active"
              style={{ display: "flex", gap: 10, alignItems: "center", minHeight: 44 }}
            >
              <input id="so-active" type="checkbox" {...socialForm.register("isActive")} />
              <span style={{ fontSize: "0.86rem" }}>Tampilkan di situs</span>
            </label>
          </div>
        </form>
      </FormDialog>

      <ConfirmDialog
        open={Boolean(removing)}
        title="Hapus tautan ini?"
        description={removing ? SOCIAL_LABEL[removing.platform] : undefined}
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
              disabled={deleteSocial.isPending}
              onClick={() => {
                if (!removing) return;
                deleteSocial.mutate(removing.id, {
                  onSuccess: () => {
                    toast.success("Tautan dihapus.");
                    setRemoving(null);
                  },
                  onError: (error) =>
                    toast.error(error instanceof ApiError ? error.message : "Gagal menghapus."),
                });
              }}
            >
              {deleteSocial.isPending ? "Menghapus..." : "Hapus"}
            </button>
          </>
        }
      >
        <p style={{ margin: 0, fontSize: "0.86rem", lineHeight: 1.6 }}>
          Ikonnya langsung hilang dari footer situs. Kalau hanya ingin menyembunyikannya sementara,
          matikan sakelar Tampilkan di situs alih-alih menghapusnya.
        </p>
      </ConfirmDialog>
    </AdminShell>
  );
}
