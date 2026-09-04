"use client";

import { ArrowLeft } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * Modal untuk form yang LEBIH DARI TIGA MEDAN.
 *
 * KENAPA KOMPONEN BARU, BUKAN ConfirmDialog YANG DILEBARKAN. Aturan produk
 * membagi bentuk menurut jumlah medan: sampai tiga medan pakai dialog, lebih
 * dari itu pakai FormDrawer. Halaman Timeline diminta pemilik proyek memakai
 * MODAL secara eksplisit, sementara isinya lima medan, jadi ia tidak muat di
 * kedua bentuk yang sudah ada.
 *
 * Menjejalkannya ke ConfirmDialog berarti diam-diam melanggar batas tiga medan
 * yang ditulis di komponen itu sendiri, dan sesi berikutnya akan membaca
 * komentarnya lalu percaya batas itu masih berlaku. Menambah satu bentuk yang
 * jujur menyebut dirinya lebih baik daripada melunakkan aturan yang sudah ada.
 *
 * Perbedaannya dengan ConfirmDialog hanya tiga: lebih lebar, badannya bisa
 * digulir saat layarnya pendek, dan fokus awal mendarat di MEDAN PERTAMA, bukan
 * di tombol batal. Yang terakhir disengaja: dialog konfirmasi menahan tangan
 * pemakai, form justru harus siap diketik.
 */
export function FormDialog({
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

  /**
   * `onClose` DIPEGANG LEWAT REF, dan itu memperbaiki bug nyata.
   *
   * Sebelumnya effect di bawah bergantung pada `onClose`, sementara SELURUH
   * pemanggil mengirimnya sebagai arrow inline (`onClose={() => setX(false)}`)
   * yang identitasnya baru pada setiap render induk. Akibatnya: setiap kali
   * induk render ulang, entah karena kueri TanStack selesai atau state lain
   * berubah, effect dibersihkan lalu dijalankan lagi, dan baris terakhirnya
   * MEREBUT FOKUS ke tombol pertama. Pemakai yang sedang mengetik tiba-tiba
   * kehilangan fokus dan mendarat di tombol.
   *
   * Terukur di peramban sungguhan: mengetik di medan tahun akhir pada modal
   * Timeline melompatkan fokus kembali ke medan tahun, dengan tepat satu
   * panggilan `.focus()` dari kode.
   *
   * Dengan ref, effect hanya bergantung pada `open`, jadi ia berjalan tepat
   * sekali saat dibuka. Tidak ada satu pun pemanggil yang perlu diubah.
   */
  const closeRef = useRef(onClose);
  /* Disegarkan lewat EFFECT, bukan saat render. Menulis ke ref selama render
     dilarang aturan lint React dan memang bisa salah pada render yang
     dibuang. Effect ini murah dan tidak pernah memicu effect utama di bawah,
     karena effect itu hanya bergantung pada `open`. */
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);


  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeRef.current();
        return;
      }

      /* Jebakan fokus. Tanpa ini, Tab dari medan terakhir keluar ke halaman di
         belakang modal, dan pemakai keyboard mengetik ke dalam form yang tidak
         bisa mereka lihat. */
      if (event.key !== "Tab") return;
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    panelRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();

    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div className="adm-scrim-fixed" onClick={onClose} aria-hidden="true" />
      <div
        className="adm-dialog"
        data-wide="true"
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
            aria-label="Tutup"
          >
            <ArrowLeft size={17} aria-hidden="true" />
          </button>
          <div>
            <h2>{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
        </div>
        <div className="adm-dialog-body">{children}</div>
        {footer ? <div className="adm-drawer-foot">{footer}</div> : null}
      </div>
    </>
  );
}
