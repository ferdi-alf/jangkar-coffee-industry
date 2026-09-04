"use client";

import { useEffect } from "react";
import { useForm, useWatch, type Control, type UseFormSetValue } from "react-hook-form";
import { toast } from "sonner";

import { useCategoryList } from "@/modules/category/hooks/useCategories";
import { TextAreaField, TextField } from "@/shared/components/Field";
import { FormDrawer } from "@/shared/components/FormDrawer";
import { LocaleTabs } from "@/shared/components/LocaleTabs";
import { MediaUploadField } from "@/shared/components/MediaUploadField";
import { ApiError } from "@/shared/lib/api-client";

import {
  MARKETPLACES,
  PRODUCT_ERROR,
  type Channel,
  type ProductDetail,
  type ProductPayload,
} from "../contracts/product";
import { useCreateProduct, useUpdateProduct } from "../hooks/useProducts";

/**
 * Form produk, dipakai DUA HALAMAN lewat satu prop `variant`.
 *
 *   menu      -> /menu, daftar yang dipesan di gerai
 *   ecommerce -> /ecommerce, barang yang dijual di Shopee dan Tokopedia
 *
 * SATU KOMPONEN, BUKAN DUA, karena sembilan dari sebelas medannya sama persis:
 * SKU, judul dan deskripsi dua bahasa, kategori, harga, catatan harga, status,
 * urutan, dan penanda. Menyalinnya jadi dua berkas berarti setiap perbaikan
 * pemetaan galat dan setiap medan baru harus dikerjakan dua kali, dan cepat
 * atau lambat salah satunya tertinggal.
 *
 * Yang benar-benar berbeda hanya tiga:
 *   - ecommerce punya UNGGAH GAMBAR, menu tidak. Kartu Roastery di situs
 *     merender gambar; menu outlet hanya teks.
 *   - ecommerce punya TAUTAN SHOPEE DAN TOKOPEDIA, menu tidak.
 *   - `isEcommerce` tidak lagi berupa kotak centang yang bisa salah dicentang.
 *     Halaman yang membuat produk itulah yang menentukan nilainya, dan itulah
 *     yang membuat kedua daftar benar-benar terpisah, bukan sekadar tersaring.
 *
 * MEDAN SLUG SUDAH DIHAPUS. Server membuatnya dari judul Indonesia saat produk
 * dibuat, lalu menguncinya.
 *
 * SUSUNANNYA MENGIKUTI ATURAN DUA TAB: judul dan deskripsi tampil publik, jadi
 * keduanya dibungkus tab ID dan EN. Sisanya tidak bergantung bahasa, jadi
 * duduk di bawah blok tab.
 *
 * GALAT SERVER DIPETAKAN KE MEDANNYA. Zod mengembalikan `details` berisi path
 * medan, jadi "translations.id.title" bisa diarahkan ke input yang tepat alih
 * alih ditumpahkan sebagai satu kalimat merah di atas form.
 */
export type ProductFormVariant = "menu" | "ecommerce";

type Values = {
  sku: string;
  categoryId: string;
  basePrice: string;
  priceNote: string;
  status: "draft" | "published" | "archived";
  sortOrder: string;
  /* URL gambar sebagai MEDAN FORM, bukan useState terpisah. Menyimpannya di
     luar form berarti ia harus disinkronkan lewat effect setiap kali produknya
     berganti, dan setState di dalam effect memicu render bertingkat yang memang
     ditolak lint proyek ini. Sebagai medan form, `reset()` yang mengisinya
     sekaligus dengan medan lain. String kosong berarti tidak ada gambar. */
  image: string;
  isSignature: boolean;
  isFavourite: boolean;
  isSoldOut: boolean;
  titleId: string;
  titleEn: string;
  descId: string;
  descEn: string;
  shopee: string;
  tokopedia: string;
};

const EMPTY: Values = {
  sku: "",
  categoryId: "",
  basePrice: "",
  priceNote: "",
  status: "draft",
  sortOrder: "0",
  image: "",
  isSignature: false,
  isFavourite: false,
  isSoldOut: false,
  titleId: "",
  titleEn: "",
  descId: "",
  descEn: "",
  shopee: "",
  tokopedia: "",
};

function toValues(product: ProductDetail | null): Values {
  if (!product) return EMPTY;
  const link = (name: string) =>
    product.marketplaceLinks?.find((l) => l.marketplace === name)?.url ?? "";
  return {
    sku: product.sku,
    categoryId: product.categoryId ?? "",
    basePrice: product.basePrice === null ? "" : String(product.basePrice),
    priceNote: product.priceNote ?? "",
    status: product.status,
    sortOrder: String(product.sortOrder),
    image: product.image ?? "",
    isSignature: product.isSignature,
    isFavourite: product.isFavourite,
    isSoldOut: product.isSoldOut,
    titleId: product.translations?.id.title ?? product.title,
    titleEn: product.translations?.en.title ?? "",
    descId: product.translations?.id.description ?? "",
    descEn: product.translations?.en.description ?? "",
    shopee: link("shopee"),
    tokopedia: link("tokopedia"),
  };
}

/** Memetakan path zod ke nama medan form. */
const FIELD_MAP: Record<string, keyof Values> = {
  sku: "sku",
  basePrice: "basePrice",
  priceNote: "priceNote",
  categoryId: "categoryId",
  "translations.id.title": "titleId",
  "translations.en.title": "titleEn",
  "translations.id.description": "descId",
  "translations.en.description": "descEn",
};

/**
 * Medan gambar, DIPISAH JADI KOMPONEN SENDIRI supaya langganan `useWatch`
 * tidak membuat seluruh form render ulang pada setiap ketikan judul.
 *
 * `useWatch` memang perlu di sini: nilai gambar berubah lewat unggahan
 * asinkron, dan judul dipakai mengisi alt text supaya tidak diketik dua kali.
 * Tapi kalau langganannya dipasang di induk, MENGETIK SATU HURUF di judul akan
 * merender ulang seluruh laci berisi belasan medan. Itu pemborosan yang tidak
 * kelihatan sampai form-nya panjang, dan ia juga yang memperbesar peluang
 * effect perebut fokus ikut berjalan.
 *
 * Dengan dipisah, yang render ulang saat judul diketik hanyalah komponen kecil
 * ini. Induknya tetap diam.
 */
function ProductImageField({
  control,
  setValue,
}: {
  control: Control<Values>;
  setValue: UseFormSetValue<Values>;
}) {
  const titleId = useWatch({ control, name: "titleId" });
  const image = useWatch({ control, name: "image" });

  return (
    <MediaUploadField
      label="Gambar produk"
      hint="Tampil di kartu Roastery pada beranda. JPG, PNG, WebP, atau AVIF."
      value={image || null}
      onChange={(url) => setValue("image", url ?? "", { shouldDirty: true })}
      defaultAlt={titleId}
    />
  );
}

export function ProductFormDrawer({
  open,
  product,
  variant,
  defaultChannels,
  onClose,
}: {
  open: boolean;
  product: ProductDetail | null;
  variant: ProductFormVariant;
  /** Kanal yang dinyalakan saat MEMBUAT. Diabaikan saat mengubah. */
  defaultChannels?: Channel[];
  onClose: () => void;
}) {
  const isEcommerce = variant === "ecommerce";

  const create = useCreateProduct();
  const update = useUpdateProduct();
  const pending = create.isPending || update.isPending;

  /* 100 kategori sudah jauh melebihi enam yang ada, jadi satu halaman cukup dan
     tidak perlu pencarian di dalam pemilih. */
  const categories = useCategoryList({ page: 1, perPage: 100 });

  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    setValue,
    formState: { errors },
  } = useForm<Values>({ defaultValues: EMPTY, mode: "onBlur" });


  useEffect(() => {
    if (!open) return;
    reset(toValues(product));
  }, [open, product, reset]);

  function onError(error: unknown): void {
    if (error instanceof ApiError && error.code === "VALIDATION_ERROR") {
      for (const detail of error.details) {
        const field = FIELD_MAP[detail.field];
        if (field) setError(field, { message: PRODUCT_ERROR[detail.message] ?? detail.message });
      }
      toast.error("Ada isian yang belum benar.");
      return;
    }
    if (error instanceof ApiError && error.status === 403) {
      toast.error("Peran Anda tidak berwenang mengubah produk.");
      return;
    }
    toast.error(error instanceof ApiError ? error.message : "Gagal menyimpan.");
  }

  const submit = handleSubmit((values) => {
    const links: ProductPayload["marketplaceLinks"] = [];
    /* Tautan kosong TIDAK dikirim sebagai string kosong. Server mewajibkan
       https, jadi string kosong ditolak sebagai galat validasi padahal maksud
       penggunanya justru menghapus tautan itu. Tidak mengirimnya sama dengan
       menghapusnya, karena server menulis ulang seluruh daftar tautan. */
    if (isEcommerce) {
      for (const marketplace of MARKETPLACES) {
        const url = values[marketplace].trim();
        if (url) links.push({ marketplace, url });
      }
    }

    const payload: ProductPayload = {
      sku: values.sku.trim(),
      categoryId: values.categoryId || null,
      image: isEcommerce ? values.image.trim() || null : (product?.image ?? null),
      basePrice: values.basePrice.trim() === "" ? null : Number(values.basePrice),
      priceNote: values.priceNote.trim() || null,
      isSignature: values.isSignature,
      isFavourite: values.isFavourite,
      /* DITENTUKAN HALAMAN, bukan kotak centang. Inilah yang membuat kedua
         daftar benar-benar terpisah dan tidak bisa saling bocor karena satu
         centang yang salah. */
      isEcommerce,
      isSoldOut: values.isSoldOut,
      status: values.status,
      sortOrder: Number(values.sortOrder) || 0,
      translations: {
        id: { title: values.titleId.trim(), description: values.descId.trim() || null },
        en: { title: values.titleEn.trim(), description: values.descEn.trim() || null },
      },
      marketplaceLinks: links,
    };

    /* Kanal HANYA saat membuat. Mengirimnya saat mengubah akan menulis ulang
       seluruh daftar kanal, jadi menyunting harga dari halaman /menu akan
       diam-diam mencabut item itu dari menu keliling. */
    if (!product && defaultChannels?.length) {
      payload.channels = defaultChannels.map((channel) => ({ channel, available: true }));
    }

    const done = () => {
      toast.success(product ? "Perubahan disimpan." : "Item ditambahkan.");
      onClose();
    };
    if (product) update.mutate({ id: product.id, payload }, { onSuccess: done, onError });
    else create.mutate(payload, { onSuccess: done, onError });
  });

  const noun = isEcommerce ? "produk" : "item menu";

  return (
    <FormDrawer
      open={open}
      title={product ? `Ubah ${noun}` : `Tambah ${noun}`}
      description={product ? product.sku : "Isi kedua bahasa sebelum menyimpan."}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="adm-btn" onClick={onClose} disabled={pending}>
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
        <LocaleTabs
          id={
            <>
              <TextField
                id="p-title-id"
                label="Judul (Indonesia)"
                hint={product ? undefined : "Slug dibuat otomatis dari judul ini."}
                error={errors.titleId?.message}
                {...register("titleId", { required: "Judul wajib diisi." })}
              />
              <TextAreaField id="p-desc-id" label="Deskripsi (Indonesia)" {...register("descId")} />
            </>
          }
          en={
            <>
              <TextField
                id="p-title-en"
                label="Judul (English)"
                error={errors.titleEn?.message}
                {...register("titleEn", { required: "Judul bahasa Inggris wajib diisi." })}
              />
              <TextAreaField id="p-desc-en" label="Deskripsi (English)" {...register("descEn")} />
            </>
          }
          shared={
            <>
              <div className="adm-row-2">
                <TextField
                  id="p-sku"
                  label="SKU"
                  placeholder="RST-200"
                  error={errors.sku?.message}
                  {...register("sku", { required: "SKU wajib diisi." })}
                />
                <div className="adm-field">
                  <label htmlFor="p-category">Kategori</label>
                  <select id="p-category" className="adm-select" {...register("categoryId")}>
                    <option value="">Tanpa kategori</option>
                    {(categories.data?.data ?? []).map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <p className="adm-hint">
                    Kategori `non-coffee` menentukan kelompok Non-Coffee di menu keliling.
                  </p>
                </div>
              </div>

              <div className="adm-row-2">
                <TextField
                  id="p-price"
                  label="Harga dasar (rupiah)"
                  type="number"
                  inputMode="numeric"
                  placeholder="18000"
                  hint="Angka bulat tanpa titik. Kosongkan bila harganya tidak tunggal."
                  error={errors.basePrice?.message}
                  {...register("basePrice")}
                />
                <TextField
                  id="p-price-note"
                  label="Catatan harga"
                  placeholder="15k / 100gr"
                  hint="Untuk harga yang tidak berupa satu angka."
                  {...register("priceNote")}
                />
              </div>

              <div className="adm-row-2">
                <div className="adm-field">
                  <label htmlFor="p-status">Status</label>
                  <select id="p-status" className="adm-select" {...register("status")}>
                    <option value="draft">Draf, belum tayang</option>
                    <option value="published">Tayang</option>
                    <option value="archived">Arsip</option>
                  </select>
                </div>
                <TextField
                  id="p-sort"
                  label="Urutan"
                  type="number"
                  inputMode="numeric"
                  {...register("sortOrder")}
                />
              </div>

              <fieldset style={{ border: 0, padding: 0, margin: "0 0 14px" }}>
                <legend className="adm-shared-label" style={{ padding: 0 }}>
                  Penanda
                </legend>
                {(
                  [
                    ["isSignature", "Signature series"],
                    ["isFavourite", "Favorit"],
                    ["isSoldOut", "Sedang habis"],
                  ] as const
                ).map(([name, label]) => (
                  <label
                    key={name}
                    htmlFor={`p-${name}`}
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                      minHeight: 36,
                      fontSize: "0.84rem",
                    }}
                  >
                    <input id={`p-${name}`} type="checkbox" {...register(name)} />
                    {label}
                  </label>
                ))}
              </fieldset>

              {isEcommerce ? (
                <>
                  <ProductImageField control={control} setValue={setValue} />

                  {/* Tautan produk: contoh yang disebut aturan produk sebagai
                      input yang TIDAK bergantung bahasa, jadi ia memang di bawah
                      blok tab. Mengosongkannya berarti menghapus tautannya, dan
                      tombol di situs berhenti menavigasi ke mana pun. */}
                  <p className="adm-shared-label" style={{ marginTop: 4 }}>
                    Tautan toko
                  </p>
                  <TextField
                    id="p-shopee"
                    label="Shopee"
                    type="url"
                    placeholder="https://shopee.co.id/..."
                    hint="Kosongkan bila belum ada. Tombolnya tetap tampil, hanya tidak menavigasi."
                    error={errors.shopee?.message}
                    {...register("shopee")}
                  />
                  <TextField
                    id="p-tokopedia"
                    label="Tokopedia"
                    type="url"
                    placeholder="https://www.tokopedia.com/..."
                    error={errors.tokopedia?.message}
                    {...register("tokopedia")}
                  />
                </>
              ) : null}
            </>
          }
        />
      </form>
    </FormDrawer>
  );
}
