"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { AdminShell } from "@/modules/admin/components/AdminShell";
import { SETTINGS_ERROR, type SeoSettings } from "@/modules/settings/contracts/settings";
import { useSaveSeo, useSeoSettings } from "@/modules/settings/hooks/useSettings";
import { TextAreaField, TextField } from "@/shared/components/Field";
import { LocaleTabs } from "@/shared/components/LocaleTabs";
import { MediaUploadField } from "@/shared/components/MediaUploadField";
import { ApiError } from "@/shared/lib/api-client";

/**
 * SEO: bagaimana situs memperkenalkan dirinya ke mesin telusur dan ke aplikasi
 * chat yang menempelkan pratinjau tautan.
 *
 * Sebelum halaman ini ada, judul dan deskripsi hidup di `dict.meta`, dan gambar
 * berbagi hanya berupa satu berkas statis `app/opengraph-image.jpg` yang sama
 * untuk kedua bahasa. Artinya menyunting judul halaman berarti deploy ulang.
 *
 * TIGA MEDAN GAMBAR, dan ketiganya berbeda peran:
 *   og image  gambar besar saat tautan dibagikan di WhatsApp atau X
 *   logo      dipakai data terstruktur organisasi
 *   favicon   ikon tab peramban
 *
 * `robotsIndex` PUNYA PERINGATAN DI LAYAR, bukan sekadar sakelar. Mematikannya
 * memerintahkan mesin telusur melupakan seluruh situs, dan akibatnya baru
 * terasa berminggu-minggu kemudian saat trafik pencarian sudah hilang.
 */
type Values = {
  siteUrl: string;
  organizationName: string;
  twitterHandle: string;
  themeColor: string;
  robotsIndex: boolean;
  /* Ketiga URL gambar sebagai MEDAN FORM, bukan tiga useState terpisah.
     Menyimpannya di luar form berarti menyinkronkannya lewat effect, dan
     setState di dalam effect memicu render bertingkat yang ditolak lint proyek
     ini. Sebagai medan form, satu `reset()` mengisi semuanya sekaligus. String
     kosong berarti belum ada gambar. */
  ogImageUrl: string;
  logoUrl: string;
  faviconUrl: string;
  titleId: string;
  titleEn: string;
  descId: string;
  descEn: string;
  keywordsId: string;
  keywordsEn: string;
  ogTitleId: string;
  ogTitleEn: string;
  ogDescId: string;
  ogDescEn: string;
};

function toValues(seo: SeoSettings): Values {
  return {
    siteUrl: seo.siteUrl ?? "",
    organizationName: seo.organizationName ?? "",
    twitterHandle: seo.twitterHandle ?? "",
    themeColor: seo.themeColor,
    robotsIndex: seo.robotsIndex,
    ogImageUrl: seo.ogImageUrl ?? "",
    logoUrl: seo.logoUrl ?? "",
    faviconUrl: seo.faviconUrl ?? "",
    titleId: seo.translations.id.title,
    titleEn: seo.translations.en.title,
    descId: seo.translations.id.description,
    descEn: seo.translations.en.description,
    keywordsId: seo.translations.id.keywords,
    keywordsEn: seo.translations.en.keywords,
    ogTitleId: seo.translations.id.ogTitle ?? "",
    ogTitleEn: seo.translations.en.ogTitle ?? "",
    ogDescId: seo.translations.id.ogDescription ?? "",
    ogDescEn: seo.translations.en.ogDescription ?? "",
  };
}

const FIELD_MAP: Record<string, keyof Values> = {
  siteUrl: "siteUrl",
  organizationName: "organizationName",
  twitterHandle: "twitterHandle",
  themeColor: "themeColor",
  "translations.id.title": "titleId",
  "translations.en.title": "titleEn",
  "translations.id.description": "descId",
  "translations.en.description": "descEn",
  "translations.id.keywords": "keywordsId",
  "translations.en.keywords": "keywordsEn",
};

export default function SeoPage() {
  const query = useSeoSettings();
  const save = useSaveSeo();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    setValue,
    formState: { errors },
  } = useForm<Values>({ mode: "onBlur" });

  /* `useWatch` alih-alih `watch()`, supaya React Compiler tetap bisa
     memoisasi komponen ini. Lihat catatan yang sama di ProductFormDrawer. */
  const indexing = useWatch({ control, name: "robotsIndex" });
  const ogImage = useWatch({ control, name: "ogImageUrl" });
  const logo = useWatch({ control, name: "logoUrl" });
  const favicon = useWatch({ control, name: "faviconUrl" });

  /* Dipasang sekali saat data tiba. `query.data` sebagai dependensi, bukan
     `query.isSuccess`, supaya refetch yang membawa nilai baru ikut menyegarkan
     form alih-alih menampilkan angka lama tanpa alasan yang terlihat. */
  useEffect(() => {
    if (!query.data) return;
    reset(toValues(query.data));
  }, [query.data, reset]);

  const submit = handleSubmit((values) => {
    save.mutate(
      {
        siteUrl: values.siteUrl.trim() || null,
        organizationName: values.organizationName.trim() || null,
        twitterHandle: values.twitterHandle.trim() || null,
        themeColor: values.themeColor,
        robotsIndex: values.robotsIndex,
        ogImageUrl: values.ogImageUrl.trim() || null,
        logoUrl: values.logoUrl.trim() || null,
        faviconUrl: values.faviconUrl.trim() || null,
        translations: {
          id: {
            title: values.titleId.trim(),
            description: values.descId.trim(),
            keywords: values.keywordsId.trim(),
            ogTitle: values.ogTitleId.trim() || null,
            ogDescription: values.ogDescId.trim() || null,
          },
          en: {
            title: values.titleEn.trim(),
            description: values.descEn.trim(),
            keywords: values.keywordsEn.trim(),
            ogTitle: values.ogTitleEn.trim() || null,
            ogDescription: values.ogDescEn.trim() || null,
          },
        },
      },
      {
        onSuccess: () => toast.success("Setelan SEO disimpan."),
        onError: (error) => {
          if (error instanceof ApiError && error.code === "VALIDATION_ERROR") {
            for (const detail of error.details) {
              const field = FIELD_MAP[detail.field];
              if (field)
                setError(field, { message: SETTINGS_ERROR[detail.message] ?? detail.message });
            }
            toast.error("Ada isian yang belum benar.");
            return;
          }
          toast.error(error instanceof ApiError ? error.message : "Gagal menyimpan.");
        },
      },
    );
  });

  if (query.isLoading) {
    return (
      <AdminShell>
        <div className="adm-skel" style={{ height: 320 }} />
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <form onSubmit={submit} noValidate>
        <div className="adm-card">
          <div className="adm-card-head">
            <div>
              <h2>Judul dan deskripsi</h2>
              <p>Tampil di hasil pencarian dan di pratinjau tautan.</p>
            </div>
          </div>
          <div className="adm-card-body">
            <LocaleTabs
              id={
                <>
                  <TextField
                    id="s-title-id"
                    label="Judul halaman (Indonesia)"
                    hint="Sekitar 60 karakter agar tidak terpotong di Google."
                    error={errors.titleId?.message}
                    {...register("titleId", { required: "Judul wajib diisi." })}
                  />
                  <TextAreaField
                    id="s-desc-id"
                    label="Deskripsi (Indonesia)"
                    rows={3}
                    hint="Sekitar 155 karakter."
                    error={errors.descId?.message}
                    {...register("descId", { required: "Deskripsi wajib diisi." })}
                  />
                  <TextField
                    id="s-kw-id"
                    label="Kata kunci (Indonesia)"
                    hint="Dipisah koma."
                    {...register("keywordsId")}
                  />
                  <TextField
                    id="s-ogtitle-id"
                    label="Judul berbagi (Indonesia)"
                    hint="Opsional. Kosong berarti memakai judul halaman."
                    {...register("ogTitleId")}
                  />
                  <TextAreaField
                    id="s-ogdesc-id"
                    label="Deskripsi berbagi (Indonesia)"
                    rows={2}
                    hint="Opsional."
                    {...register("ogDescId")}
                  />
                </>
              }
              en={
                <>
                  <TextField
                    id="s-title-en"
                    label="Judul halaman (English)"
                    error={errors.titleEn?.message}
                    {...register("titleEn", { required: "Judul bahasa Inggris wajib diisi." })}
                  />
                  <TextAreaField
                    id="s-desc-en"
                    label="Deskripsi (English)"
                    rows={3}
                    error={errors.descEn?.message}
                    {...register("descEn", { required: "Deskripsi bahasa Inggris wajib diisi." })}
                  />
                  <TextField
                    id="s-kw-en"
                    label="Kata kunci (English)"
                    hint="Dipisah koma."
                    {...register("keywordsEn")}
                  />
                  <TextField
                    id="s-ogtitle-en"
                    label="Judul berbagi (English)"
                    {...register("ogTitleEn")}
                  />
                  <TextAreaField
                    id="s-ogdesc-en"
                    label="Deskripsi berbagi (English)"
                    rows={2}
                    {...register("ogDescEn")}
                  />
                </>
              }
            />
          </div>
        </div>

        <div className="adm-card" style={{ marginTop: 16 }}>
          <div className="adm-card-head">
            <div>
              <h2>Gambar</h2>
              <p>Berlaku untuk kedua bahasa.</p>
            </div>
          </div>
          <div className="adm-card-body">
            <MediaUploadField
              label="Gambar berbagi (og:image)"
              hint="Tampil saat tautan dibagikan. Ukuran ideal 1200 x 630 piksel."
              value={ogImage || null}
              onChange={(url) => setValue("ogImageUrl", url ?? "", { shouldDirty: true })}
              defaultAlt="Jangkar Coffee Industry"
            />
            <MediaUploadField
              label="Logo"
              hint="Dipakai data terstruktur organisasi."
              value={logo || null}
              onChange={(url) => setValue("logoUrl", url ?? "", { shouldDirty: true })}
              defaultAlt="Logo Jangkar Coffee Industry"
            />
            <MediaUploadField
              label="Favicon"
              hint="Ikon tab peramban. Persegi, minimal 180 x 180 piksel."
              value={favicon || null}
              onChange={(url) => setValue("faviconUrl", url ?? "", { shouldDirty: true })}
              defaultAlt="Ikon Jangkar Coffee Industry"
            />
          </div>
        </div>

        <div className="adm-card" style={{ marginTop: 16 }}>
          <div className="adm-card-head">
            <div>
              <h2>Identitas dan pengindeksan</h2>
              <p>Tidak bergantung bahasa.</p>
            </div>
          </div>
          <div className="adm-card-body">
            <div className="adm-row-2">
              <TextField
                id="s-site-url"
                label="Alamat situs"
                type="url"
                placeholder="https://www.kopijangkar.com"
                hint="Dipakai sebagai canonical dan dasar seluruh tautan absolut."
                error={errors.siteUrl?.message}
                {...register("siteUrl")}
              />
              <TextField
                id="s-org"
                label="Nama organisasi"
                placeholder="Jangkar Coffee Industry"
                error={errors.organizationName?.message}
                {...register("organizationName")}
              />
            </div>
            <div className="adm-row-2">
              <TextField
                id="s-twitter"
                label="Handle X"
                placeholder="jangkarcoffee"
                hint="Tanpa tanda @."
                error={errors.twitterHandle?.message}
                {...register("twitterHandle")}
              />
              <TextField
                id="s-theme"
                label="Warna tema"
                placeholder="#FBFAF8"
                hint="Warna bilah peramban di ponsel. Bentuk #RRGGBB."
                error={errors.themeColor?.message}
                {...register("themeColor")}
              />
            </div>

            <label
              htmlFor="s-robots"
              style={{ display: "flex", gap: 10, alignItems: "center", minHeight: 44 }}
            >
              <input id="s-robots" type="checkbox" {...register("robotsIndex")} />
              <span style={{ fontSize: "0.86rem" }}>Izinkan mesin telusur mengindeks situs</span>
            </label>
            {!indexing ? (
              /* Peringatan BERUPA TEKS, muncul hanya saat keadaannya berbahaya.
                 Mematikan pengindeksan tidak menimbulkan galat apa pun hari ini,
                 akibatnya baru terlihat saat trafik pencarian sudah hilang. */
              <p className="adm-error" role="status">
                Situs akan diminta HILANG dari hasil pencarian. Nyalakan lagi kecuali Anda memang
                sedang menyembunyikannya dengan sengaja.
              </p>
            ) : null}
          </div>
          <div className="adm-drawer-foot">
            <button
              type="submit"
              className="adm-btn"
              data-variant="primary"
              disabled={save.isPending}
            >
              {save.isPending ? "Menyimpan..." : "Simpan setelan SEO"}
            </button>
          </div>
        </div>
      </form>
    </AdminShell>
  );
}
