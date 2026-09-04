"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { qk } from "@/shared/constants/query-keys";
import { api } from "@/shared/lib/api-client";

import type {
  ContactSettings,
  SeoSettings,
  SocialLink,
  SocialPlatform,
} from "../contracts/settings";

/* -------------------------------------------------------------------------- */
/* SEO                                                                        */
/* -------------------------------------------------------------------------- */

export function useSeoSettings() {
  return useQuery({
    queryKey: qk.settings.seo,
    queryFn: () => api.get<SeoSettings>("/settings/seo"),
  });
}

export type SeoPayload = Partial<Omit<SeoSettings, "translations">> & {
  translations?: SeoSettings["translations"];
};

export function useSaveSeo() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: SeoPayload) => api.patch<SeoSettings>("/settings/seo", payload),
    /* Respons PATCH adalah bentuk tersimpan yang baru, jadi ia dipasang
       langsung ke cache. Tanpa ini form berkedip ke nilai lama sesaat sebelum
       refetch selesai. */
    onSuccess: (data) => client.setQueryData(qk.settings.seo, data),
  });
}

/* -------------------------------------------------------------------------- */
/* Kontak                                                                     */
/* -------------------------------------------------------------------------- */

export function useContactSettings() {
  return useQuery({
    queryKey: qk.settings.contact,
    queryFn: () => api.get<ContactSettings>("/settings/contact"),
  });
}

export function useSaveContact() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<ContactSettings>) =>
      api.patch<ContactSettings>("/settings/contact", payload),
    onSuccess: (data) => client.setQueryData(qk.settings.contact, data),
  });
}

/* -------------------------------------------------------------------------- */
/* Tautan sosial                                                              */
/* -------------------------------------------------------------------------- */

export function useSocialLinks() {
  return useQuery({
    queryKey: qk.settings.social,
    queryFn: () => api.get<SocialLink[]>("/settings/social"),
  });
}

export interface SocialPayload {
  platform: SocialPlatform;
  url: string;
  label: string | null;
  sortOrder: number;
  isActive: boolean;
}

function useInvalidateSocial() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: qk.settings.social });
}

export function useSaveSocial() {
  const invalidate = useInvalidateSocial();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string | null; payload: SocialPayload }) =>
      id
        ? api.patch<{ id: string }>(`/settings/social/${id}`, payload)
        : api.post<{ id: string }>("/settings/social", payload),
    onSuccess: invalidate,
  });
}

export function useDeleteSocial() {
  const invalidate = useInvalidateSocial();
  return useMutation({
    mutationFn: (id: string) => api.remove<{ id: string }>(`/settings/social/${id}`),
    onSuccess: invalidate,
  });
}
