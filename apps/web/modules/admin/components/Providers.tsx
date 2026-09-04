"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Toaster } from "sonner";

/**
 * Penyedia untuk seluruh panel: cache TanStack dan toast sonner.
 *
 * QueryClient dibuat di dalam useState, BUKAN di ruang modul. Modul dievaluasi
 * sekali per proses, jadi klien di ruang modul akan dibagi antar permintaan di
 * server dan data satu pengguna bisa terlihat oleh pengguna lain.
 *
 * TOAST DI KANAN ATAS. Posisi ini diminta pemilik proyek secara eksplisit pada
 * 2026-09-03, menggantikan kiri atas yang dipakai sebelumnya. Bawaan sonner
 * adalah kanan BAWAH, jadi nilainya tetap harus ditulis, bukan dihapus.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            /* Panel dipakai satu sampai dua orang, dan datanya jarang berubah
               dari luar. Refetch tiap kali jendela difokuskan hanya menambah
               lalu lintas tanpa menambah kebenaran. */
            refetchOnWindowFocus: false,
            staleTime: 30_000,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{ style: { fontFamily: "var(--font-sans), system-ui, sans-serif" } }}
      />
    </QueryClientProvider>
  );
}
