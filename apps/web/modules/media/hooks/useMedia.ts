"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { qk } from "@/shared/constants/query-keys";
import { api, listQuery } from "@/shared/lib/api-client";

export interface MediaItem {
  id: string;
  bucket: string;
  path: string;
  url: string;
  mime: string;
  bytes: number;
  width: number | null;
  height: number | null;
  createdAt: string;
  alt: Record<"id" | "en", string>;
}

/** Sama persis dengan daftar putih di apps/api. Kalau berbeda, pengguna lolos di sini lalu ditolak server. */
export const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/avif"];
/* 4 MB, ditentukan batas body Vercel Functions (4,5 MB), bukan selera.
   Harus sama dengan apps/api/src/modules/media/media.contract.ts. */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export function useMediaList(params: { page: number; perPage: number; q?: string }) {
  return useQuery({
    queryKey: qk.media.list(params as unknown as Record<string, unknown>),
    queryFn: () => api.list<MediaItem>(`/media${listQuery(params)}`),
    placeholderData: (previous) => previous,
  });
}

function useInvalidate() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: qk.media.all });
}

/**
 * Unggahan memakai FormData, bukan JSON, karena isinya berkas biner.
 * `alt` dikirim sebagai JSON string di dalam FormData, dan server mengurainya
 * kembali; multipart tidak punya cara membawa objek bersarang.
 */
export function useUploadMedia() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ file, alt }: { file: File; alt: Record<"id" | "en", string> }) => {
      const form = new FormData();
      form.append("file", file);
      form.append("alt", JSON.stringify(alt));
      /* Server mengembalikan item UTUH, termasuk `url`. Itu yang dibutuhkan
         form: nilai yang disimpan ke product.image_path dan ke medan gambar SEO
         adalah URL publiknya, bukan idnya. */
      return api.post<MediaItem>("/media", form);
    },
    onSuccess: invalidate,
  });
}

/**
 * Menghapus media, dari id ATAU dari URL publiknya.
 *
 * Varian URL dipakai saat gambar di form diganti. Kolom tujuannya hanya
 * menyimpan URL, bukan id, karena kolom yang sama juga harus bisa berisi jalur
 * statis lama seperti `/roastery/kopi-bubuk-80gr.webp`. URL yang bukan milik
 * storage kita dijawab server dengan `deleted: false` dan bukan galat, jadi
 * melepas gambar lama tidak pernah menggagalkan penyimpanan form.
 */
export function useDeleteMedia() {
  const invalidate = useInvalidate();
  return useMutation({
    /* Kembaliannya diseragamkan jadi `{ deleted: boolean }`. Kedua endpoint
       memulangkan bentuk yang berbeda, dan membiarkan tipenya berupa gabungan
       memaksa setiap pemanggil menebak yang mana yang ia dapat padahal tidak
       satu pun memakainya. */
    mutationFn: async (target: { id: string } | { url: string }): Promise<{ deleted: boolean }> => {
      if ("id" in target) {
        await api.remove<{ id: string }>(`/media/${target.id}`);
        return { deleted: true };
      }
      return api.remove<{ deleted: boolean }>(`/media?url=${encodeURIComponent(target.url)}`);
    },
    onSuccess: invalidate,
  });
}
