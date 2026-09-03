"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { qk } from "@/shared/constants/query-keys";
import { api } from "@/shared/lib/api-client";

export interface ContentField {
  id: string;
  key: string;
  kind: "text" | "longtext" | "list";
  sortOrder: number;
  values: Record<"id" | "en", string>;
}

export interface ContentSection {
  id: string;
  key: string;
  label: string;
  sortOrder: number;
  status: "draft" | "published";
  fields: ContentField[];
}

export function useContentSections() {
  return useQuery({
    queryKey: qk.content.sections,
    queryFn: () => api.get<ContentSection[]>("/content"),
  });
}

export function useSaveContent() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ key, fields }: { key: string; fields: { id: string; values: Record<"id" | "en", string> }[] }) =>
      api.patch<{ key: string }>(`/content/${key}`, { fields }),
    onSuccess: () => client.invalidateQueries({ queryKey: qk.content.all }),
  });
}
