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
 * TOAST DI KIRI ATAS. Aturan produk, dan ia memang disebut posisinya secara
 * eksplisit, jadi jangan diubah ke bawaan sonner yang di kanan bawah.
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
        position="top-left"
        richColors
        closeButton
        toastOptions={{ style: { fontFamily: "var(--font-sans), system-ui, sans-serif" } }}
      />
    </QueryClientProvider>
  );
}
