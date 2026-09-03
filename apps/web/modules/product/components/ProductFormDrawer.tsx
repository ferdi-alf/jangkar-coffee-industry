"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { TextAreaField, TextField } from "@/shared/components/Field";
import { FormDrawer } from "@/shared/components/FormDrawer";
import { LocaleTabs } from "@/shared/components/LocaleTabs";
import { ApiError } from "@/shared/lib/api-client";

import {
  MARKETPLACES,
  PRODUCT_ERROR,
  type ProductDetail,
  type ProductPayload,
} from "../contracts/product";
import { useCreateProduct, useUpdateProduct } from "../hooks/useProducts";

/**
 * Form produk. Medannya jauh lebih dari tiga, jadi bentuknya LACI KANAN, bukan
 * dialog. Aturan produk soal bentuk input.
 *
 * SUSUNANNYA MENGIKUTI ATURAN DUA TAB: judul dan deskripsi tampil publik, jadi
 * keduanya dibungkus tab ID dan EN. SKU, slug, harga, penanda, dan tautan
 * marketplace tidak bergantung bahasa, jadi semuanya duduk di bawah blok tab.
 * Tautan marketplace disebut namanya di aturan itu sebagai contoh, dan di sini
 * ia memang persis di sana.
 *
 * GALAT SERVER DIPETAKAN KE MEDANNYA. Zod mengembalikan `details` berisi path
 * medan, jadi "translations.id.title" bisa diarahkan ke input yang tepat alih
 * alih ditumpahkan sebagai satu kalimat merah di atas form.
 */
type Values = {
  sku: string;
  slug: string;
  basePrice: string;
  priceNote: string;
  status: "draft" | "published" | "archived";
  sortOrder: string;
  isEcommerce: boolean;
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
  slug: "",
  basePrice: "",
  priceNote: "",
  status: "draft",
  sortOrder: "0",
  isEcommerce: false,
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
    slug: product.slug,
    basePrice: product.basePrice === null ? "" : String(product.basePrice),
    priceNote: product.priceNote ?? "",
    status: product.status,
    sortOrder: String(product.sortOrder),
    isEcommerce: product.isEcommerce,
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

function toPayload(values: Values): ProductPayload {
  const links: ProductPayload["marketplaceLinks"] = [];
  /* Tautan kosong TIDAK dikirim sebagai string kosong. Server mewajibkan https,
     jadi string kosong akan ditolak sebagai galat validasi padahal maksud
     penggunanya justru menghapus tautan itu. Tidak mengirimnya sama dengan
     menghapusnya, karena server menulis ulang seluruh daftar tautan. */
  for (const marketplace of MARKETPLACES) {
    const url = values[marketplace].trim();
    if (url) links.push({ marketplace, url });
  }

  return {
    sku: values.sku.trim(),
    slug: values.slug.trim(),
    categoryId: null,
    basePrice: values.basePrice.trim() === "" ? null : Number(values.basePrice),
    priceNote: values.priceNote.trim() || null,
    isSignature: values.isSignature,
    isFavourite: values.isFavourite,
    isEcommerce: values.isEcommerce,
    isSoldOut: values.isSoldOut,
    status: values.status,
    sortOrder: Number(values.sortOrder) || 0,
    translations: {
      id: { title: values.titleId.trim(), description: values.descId.trim() || null },
      en: { title: values.titleEn.trim(), description: values.descEn.trim() || null },
    },
    marketplaceLinks: links,
  };
}

/** Memetakan path zod ke nama medan form. */
const FIELD_MAP: Record<string, keyof Values> = {
  sku: "sku",
  slug: "slug",
  basePrice: "basePrice",
  priceNote: "priceNote",
  "translations.id.title": "titleId",
  "translations.en.title": "titleEn",
  "translations.id.description": "descId",
  "translations.en.description": "descEn",
};

export function ProductFormDrawer({
  open,
  product,
  onClose,
}: {
  open: boolean;
  product: ProductDetail | null;
  onClose: () => void;
}) {
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const pending = create.isPending || update.isPending;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<Values>({ defaultValues: EMPTY, mode: "onBlur" });

  useEffect(() => {
    if (open) reset(toValues(product));
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
    const payload = toPayload(values);
    const done = () => {
      toast.success(product ? "Produk diperbarui." : "Produk ditambahkan.");
      onClose();
    };
    if (product) update.mutate({ id: product.id, payload }, { onSuccess: done, onError });
    else create.mutate(payload, { onSuccess: done, onError });
  });

  return (
    <FormDrawer
      open={open}
      title={product ? "Ubah produk" : "Tambah produk"}
      description={product ? product.sku : "Isi kedua bahasa sebelum menyimpan."}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="adm-btn" onClick={onClose} disabled={pending}>
            Batal
          </button>
          <button type="button" className="adm-btn" data-variant="primary" onClick={submit} disabled={pending}>
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
                <TextField
                  id="p-slug"
                  label="Slug"
                  placeholder="kopi-bubuk-200gr"
                  hint="Huruf kecil, angka, dan tanda hubung."
                  error={errors.slug?.message}
                  {...register("slug", { required: "Slug wajib diisi." })}
                />
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
                <TextField id="p-sort" label="Urutan" type="number" inputMode="numeric" {...register("sortOrder")} />
              </div>

              <fieldset style={{ border: 0, padding: 0, margin: "0 0 14px" }}>
                <legend className="adm-shared-label" style={{ padding: 0 }}>
                  Penanda
                </legend>
                {(
                  [
                    ["isEcommerce", "Dijual di Shopee dan Tokopedia"],
                    ["isSignature", "Signature series"],
                    ["isFavourite", "Favorit"],
                    ["isSoldOut", "Sedang habis"],
                  ] as const
                ).map(([name, label]) => (
                  <label
                    key={name}
                    htmlFor={`p-${name}`}
                    style={{ display: "flex", gap: 10, alignItems: "center", minHeight: 36, fontSize: "0.84rem" }}
                  >
                    <input id={`p-${name}`} type="checkbox" {...register(name)} />
                    {label}
                  </label>
                ))}
              </fieldset>

              {/* Tautan produk: contoh yang disebut aturan produk sebagai input
                  yang TIDAK bergantung bahasa, jadi ia memang di bawah blok tab.
                  Mengosongkannya berarti menghapus tautannya, dan tombol di situs
                  publik akan berhenti menavigasi ke mana pun. */}
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
          }
        />
      </form>
    </FormDrawer>
  );
}
