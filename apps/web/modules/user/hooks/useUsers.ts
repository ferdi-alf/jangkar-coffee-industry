"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { qk } from "@/shared/constants/query-keys";
import { api } from "@/shared/lib/api-client";

import type { AdminUser, Role } from "../contracts/user";

export function useUserList() {
  return useQuery({
    queryKey: qk.user.list,
    queryFn: () => api.get<AdminUser[]>("/users"),
  });
}

export function useProfile() {
  return useQuery({
    queryKey: qk.user.me,
    queryFn: () => api.get<AdminUser>("/users/me"),
  });
}

function useInvalidate() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: qk.user.all });
}

export interface CreateUserPayload {
  email: string;
  name: string;
  role: Role;
  password: string;
}

export interface UpdateUserPayload {
  name?: string;
  role?: Role;
  isActive?: boolean;
  password?: string;
}

export function useCreateUser() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: CreateUserPayload) => api.post<{ id: string }>("/users", payload),
    onSuccess: invalidate,
  });
}

export function useUpdateUser() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) =>
      api.patch<{ id: string }>(`/users/${id}`, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteUser() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api.remove<{ id: string }>(`/users/${id}`),
    onSuccess: invalidate,
  });
}

export interface ProfilePayload {
  name?: string;
  currentPassword?: string;
  newPassword?: string;
}

/**
 * Menyimpan profil sendiri.
 *
 * Membatalkan `session` JUGA, bukan hanya `user`. Nama pemakai tampil di kaki
 * sidebar dan datangnya dari GET /auth/me, jadi tanpa pembatalan itu nama lama
 * bertahan di layar sampai halaman dimuat ulang, dan pemakai wajar menyimpulkan
 * penyimpanannya gagal.
 */
export function useSaveProfile() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProfilePayload) => api.patch<AdminUser>("/users/me", payload),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: qk.user.all });
      void client.invalidateQueries({ queryKey: qk.session });
    },
  });
}
