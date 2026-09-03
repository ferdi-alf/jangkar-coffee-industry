"use client";

import { ArrowLeft } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * Laci kanan untuk form BERMEDAN BANYAK.
 *
 * Aturan produk soal bentuk input, dan ia spesifik:
 *   sampai 3 medan          -> dialog, lihat ConfirmDialog
 *   medan banyak            -> laci dari kanan ke kiri, berhenti di batas
 *                              sidebar pada desktop
 *   melihat detail banyak   -> laci dari bawah ke atas, tinggi 85 persen
 *
 * TOMBOL IKON PANAH KIRI DI KIRI ATAS. Diklik, laci menutup dan tertarik
 * kembali ke kanan. Berlaku sama untuk mode tambah maupun edit, jadi komponen
 * ini tidak punya varian untuk keduanya.
 *
 * Batas sidebar diurus CSS lewat `left: 248px`, dan runtuh jadi `left: 0` di
 * bawah 1023px karena di sana sidebarnya memang tidak menempati ruang.
 */
export function FormDrawer({
  open,
  title,
  description,
  onClose,
  footer,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables?.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    /* Fokus mendarat di tombol tutup, bukan di medan pertama. Pengguna pembaca
       layar jadi mendengar judul lacinya lebih dulu, dan jalan keluarnya selalu
       satu Tab dari titik awal. */
    panelRef.current?.querySelector<HTMLElement>("button")?.focus();

    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="adm-scrim-fixed" onClick={onClose} aria-hidden="true" />
      <div
        className="adm-drawer-right"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="adm-drawer-head">
          <button
            type="button"
            className="adm-btn"
            data-variant="ghost"
            data-icon="true"
            onClick={onClose}
            aria-label="Tutup dan kembali"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
          <div>
            <h2>{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
        </div>

        <div className="adm-drawer-body">{children}</div>
        {footer ? <div className="adm-drawer-foot">{footer}</div> : null}
      </div>
    </>
  );
}
