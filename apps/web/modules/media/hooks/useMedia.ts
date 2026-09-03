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
      return api.post<{ id: string }>("/media", form);
    },
    onSuccess: invalidate,
  });
}

export function useDeleteMedia() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api.remove<{ id: string }>(`/media/${id}`),
    onSuccess: invalidate,
  });
}
