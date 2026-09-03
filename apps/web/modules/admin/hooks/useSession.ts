"use client";

import { useQuery } from "@tanstack/react-query";

import { qk } from "@/shared/constants/query-keys";
import { ApiError, api } from "@/shared/lib/api-client";

export type Role = "owner" | "staff";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

/**
 * Sesi yang sedang berjalan.
 *
 * Sumbernya SERVER, lewat GET /auth/me, bukan cookie yang dibaca sendiri.
 * Cookienya httpOnly, jadi memang tidak bisa dibaca JavaScript, dan itu
 * disengaja: satu XSS tidak otomatis berarti token admin dicuri.
 *
 * `retry: false` supaya 401 tidak dicoba ulang tiga kali. Belum masuk bukan
 * kegagalan sementara, dan mengulanginya hanya menunda pengalihan ke /login.
 */
export function useSession() {
  const query = useQuery({
    queryKey: qk.session,
    queryFn: () => api.get<{ user: SessionUser }>("/auth/me").then((d) => d.user),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const unauthenticated =
    query.error instanceof ApiError && (query.error.status === 401 || query.error.status === 403);

  return { user: query.data, isLoading: query.isLoading, unauthenticated, error: query.error };
}
