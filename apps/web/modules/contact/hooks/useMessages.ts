"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { qk } from "@/shared/constants/query-keys";
import { api, listQuery } from "@/shared/lib/api-client";

export type ContactStatus = "new" | "read" | "replied" | "spam";

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  status: ContactStatus;
  createdAt: string;
}

export function useMessageList(params: { page: number; perPage: number; q?: string; status?: string }) {
  return useQuery({
    queryKey: qk.contact.list(params as unknown as Record<string, unknown>),
    queryFn: () => api.list<ContactMessage>(`/contact/messages${listQuery(params)}`),
    placeholderData: (previous) => previous,
  });
}

function useInvalidate() {
  const client = useQueryClient();
  return () => {
    void client.invalidateQueries({ queryKey: qk.contact.all });
    /* Angka "pesan baru" di dashboard ikut berubah setiap status ditandai, jadi
       ringkasannya dibatalkan sekalian. Tanpa ini pengguna menandai lima pesan
       lalu kembali ke dashboard dan masih melihat angka lama. */
    void client.invalidateQueries({ queryKey: qk.stats });
  };
}

export function useSetMessageStatus() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ContactStatus }) =>
      api.patch<{ id: string }>(`/contact/messages/${id}`, { status }),
    onSuccess: invalidate,
  });
}

export function useDeleteMessage() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api.remove<{ id: string }>(`/contact/messages/${id}`),
    onSuccess: invalidate,
  });
}
