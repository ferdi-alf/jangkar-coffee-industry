"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { qk } from "@/shared/constants/query-keys";
import type { ApiList } from "@/shared/contracts/api";
import { api, listQuery } from "@/shared/lib/api-client";

import type { ProductDetail, ProductListItem, ProductPayload } from "../contracts/product";

export interface ProductListParams {
  page: number;
  perPage: number;
  q?: string;
  status?: string;
  ecommerce?: boolean;
  channel?: "outlet" | "keliling";
}

export function useProductList(params: ProductListParams) {
  return useQuery({
    queryKey: qk.product.list(params as unknown as Record<string, unknown>),
    queryFn: () =>
      api.list<ProductListItem>(`/products${listQuery({ ...params, locale: "id" })}`),
    placeholderData: (previous) => previous,
  });
}

/**
 * Detail produk, DENGAN PENGAMBILAN SEBAGIAN.
 *
 * Aturan pemilik proyek: saat drawer terbuka, data yang sudah ada di cache
 * tidak diambil ulang, hanya sisa medan yang belum ada. Dua hal mewujudkannya:
 *
 *   `fields`           menyebut bagian yang belum dimiliki, dan repository di
 *                      server menerjemahkannya jadi daftar kolom select, jadi
 *                      penghematannya terjadi di basis data, bukan cuma di
 *                      klien.
 *   `placeholderData`  mengambil baris yang sudah ada di cache daftar, jadi
 *                      drawer langsung berisi judul dan harga tanpa menunggu
 *                      satu permintaan pun selesai.
 */
const DETAIL_FIELDS = "translations,marketplaceLinks,variants,channels,audit";

export function useProductDetail(id: string | null, enabled = true) {
  const client = useQueryClient();

  return useQuery({
    queryKey: qk.product.detail(id ?? "", DETAIL_FIELDS),
    enabled: Boolean(id) && enabled,
    queryFn: () => api.get<ProductDetail>(`/products/${id}?fields=${DETAIL_FIELDS}&locale=id`),
    placeholderData: () => {
      if (!id) return undefined;
      /* Menyisir cache daftar yang mana pun yang sudah dimuat, lalu memakai
         baris yang cocok sebagai isi sementara. Ini yang membuat drawer tidak
         pernah tampil kosong. */
      const caches = client.getQueriesData<ApiList<ProductListItem>>({ queryKey: qk.product.all });
      for (const [, value] of caches) {
        const row = value?.data?.find((item) => item.id === id);
        if (row) return row as ProductDetail;
      }
      return undefined;
    },
  });
}

/**
 * Semua mutasi membatalkan cache dengan kunci akar `["product"]`, jadi daftar
 * DAN detail sama-sama disegarkan dalam satu panggilan. Kalau kuncinya datar,
 * setiap tempat harus ingat membatalkan keduanya, dan cepat atau lambat ada
 * yang lupa lalu panel menampilkan data basi.
 */
function useInvalidate() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: qk.product.all });
}

export function useCreateProduct() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: ProductPayload) => api.post<{ id: string }>("/products", payload),
    onSuccess: invalidate,
  });
}

export function useUpdateProduct() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ProductPayload> }) =>
      api.patch<{ id: string }>(`/products/${id}`, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteProduct() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api.remove<{ id: string }>(`/products/${id}`),
    onSuccess: invalidate,
  });
}

/**
 * Ketersediaan per kanal, endpoint sendiri karena staff boleh memakainya.
 *
 * Ini yang menggerakkan halaman Menu armada. Hanya kanal yang disebut yang
 * ditulis, jadi mematikan keliling tidak menyentuh ketersediaan outlet.
 */
export function useSetChannel() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, channel, available }: { id: string; channel: "outlet" | "keliling"; available: boolean }) =>
      api.patch<{ id: string }>(`/products/${id}/channels`, { channels: [{ channel, available }] }),
    onSuccess: invalidate,
  });
}

/** Penanda habis punya endpoint sendiri karena staff boleh memakainya. */
export function useToggleSoldOut() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, isSoldOut }: { id: string; isSoldOut: boolean }) =>
      api.patch<{ id: string }>(`/products/${id}/sold-out`, { isSoldOut }),
    onSuccess: invalidate,
  });
}
