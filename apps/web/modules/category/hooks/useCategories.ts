"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { qk } from "@/shared/constants/query-keys";
import { api, listQuery } from "@/shared/lib/api-client";

export interface CategoryItem {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
  status: "draft" | "published" | "archived";
  translations?: Record<"id" | "en", { name: string; description: string | null }>;
}

export interface CategoryPayload {
  slug: string;
  sortOrder: number;
  status: "draft" | "published" | "archived";
  translations: Record<"id" | "en", { name: string; description: string | null }>;
}

export function useCategoryList(params: { page: number; perPage: number; q?: string }) {
  return useQuery({
    queryKey: qk.category.list(params as unknown as Record<string, unknown>),
    queryFn: () => api.list<CategoryItem>(`/categories${listQuery({ ...params, locale: "id" })}`),
    placeholderData: (previous) => previous,
  });
}

export function useCategoryDetail(id: string | null) {
  return useQuery({
    queryKey: qk.category.detail(id ?? ""),
    enabled: Boolean(id),
    queryFn: () => api.get<CategoryItem>(`/categories/${id}?locale=id`),
  });
}

function useInvalidate() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: qk.category.all });
}

export function useSaveCategory() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string | null; payload: CategoryPayload }) =>
      id
        ? api.patch<{ id: string }>(`/categories/${id}`, payload)
        : api.post<{ id: string }>("/categories", payload),
    onSuccess: invalidate,
  });
}

export function useDeleteCategory() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api.remove<{ id: string }>(`/categories/${id}`),
    onSuccess: invalidate,
  });
}
