"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { qk } from "@/shared/constants/query-keys";
import { api, listQuery } from "@/shared/lib/api-client";

export interface OutletItem {
  id: string;
  slug: string;
  name: string;
  label: string;
  address: string;
  phone: string | null;
  phoneHref: string | null;
  whatsapp: string | null;
  mapsQuery: string;
  lat: number | null;
  lng: number | null;
  /**
   * Selama true, situs publik memakai `mapsQuery` berupa alamat teks untuk
   * tombol navigasi, BUKAN lat dan lng. Pin yang meleset lebih berbahaya
   * daripada pin yang tidak ada, karena ia terlihat pasti.
   */
  coordsApproximate: boolean;
  isHeadquarters: boolean;
  hours: string | null;
  summary: string | null;
  sortOrder: number;
  status: "draft" | "published" | "archived";
  translations?: Record<"id" | "en", { label: string; hours: string | null; summary: string | null }>;
}

export interface OutletPayload {
  slug: string;
  name: string;
  address: string;
  phone: string | null;
  phoneHref: string | null;
  whatsapp: string | null;
  mapsQuery: string;
  lat: number | null;
  lng: number | null;
  coordsApproximate: boolean;
  isHeadquarters: boolean;
  sortOrder: number;
  status: "draft" | "published" | "archived";
  translations: Record<"id" | "en", { label: string; hours: string | null; summary: string | null }>;
}

export function useOutletList(params: { page: number; perPage: number; q?: string }) {
  return useQuery({
    queryKey: qk.outlet.list(params as unknown as Record<string, unknown>),
    queryFn: () => api.list<OutletItem>(`/outlets${listQuery({ ...params, locale: "id" })}`),
    placeholderData: (previous) => previous,
  });
}

export function useOutletDetail(id: string | null) {
  return useQuery({
    queryKey: qk.outlet.detail(id ?? ""),
    enabled: Boolean(id),
    queryFn: () => api.get<OutletItem>(`/outlets/${id}?locale=id`),
  });
}

function useInvalidate() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: qk.outlet.all });
}

export function useSaveOutlet() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string | null; payload: OutletPayload }) =>
      id ? api.patch<{ id: string }>(`/outlets/${id}`, payload) : api.post<{ id: string }>("/outlets", payload),
    onSuccess: invalidate,
  });
}

export function useDeleteOutlet() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api.remove<{ id: string }>(`/outlets/${id}`),
    onSuccess: invalidate,
  });
}
