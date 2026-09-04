"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { qk } from "@/shared/constants/query-keys";
import { api } from "@/shared/lib/api-client";

import type { TimelineEntry, TimelinePayload } from "../contracts/timeline";

/**
 * Daftar tonggak.
 *
 * Selalu `locale=id` karena panel berbahasa Indonesia. Kedua bahasa tetap ikut
 * lewat `translations`, karena permintaan dengan sesi memang mengembalikannya.
 * Urutannya ditentukan server menurut tahun dan tidak bisa ditawar dari sini.
 */
export function useTimelineList() {
  return useQuery({
    queryKey: qk.timeline.list,
    queryFn: () => api.get<TimelineEntry[]>("/timeline?locale=id"),
  });
}

function useInvalidate() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: qk.timeline.all });
}

export function useSaveTimeline() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string | null; payload: TimelinePayload }) =>
      id
        ? api.patch<{ id: string }>(`/timeline/${id}`, payload)
        : api.post<{ id: string }>("/timeline", payload),
    onSuccess: invalidate,
  });
}

export function useDeleteTimeline() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api.remove<{ id: string }>(`/timeline/${id}`),
    onSuccess: invalidate,
  });
}
