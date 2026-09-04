"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Dialog untuk form SAMPAI TIGA MEDAN dan untuk konfirmasi.
 *
 * Aturan produk memisahkan bentuknya menurut jumlah medan, dan pemisahan itu
 * dipatuhi di sini: yang lebih dari tiga medan pakai FormDrawer, bukan dialog
 * yang dipaksa memanjang.
 *
 * Tombol yang merusak diberi `data-variant="danger"` oleh pemanggilnya, dan
 * fokus awal SENGAJA mendarat di tombol batal, bukan di tombol hapus. Enter
 * yang tidak sengaja tidak boleh menghapus apa pun.
 */
export function ConfirmDialog({
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
  children?: ReactNode;
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
      if (event.key === "Escape") closeRef.current();
    };
    document.addEventListener("keydown", onKeyDown);
    const cancel = panelRef.current?.querySelector<HTMLElement>("[data-autofocus]");
    (cancel ?? panelRef.current?.querySelector<HTMLElement>("button"))?.focus();
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div className="adm-scrim-fixed" onClick={onClose} aria-hidden="true" />
      <div className="adm-dialog" ref={panelRef} role="dialog" aria-modal="true" aria-label={title}>
        <div className="adm-drawer-head">
          <div>
            <h2>{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
        </div>
        {children ? <div style={{ padding: 18 }}>{children}</div> : null}
        {footer ? <div className="adm-drawer-foot">{footer}</div> : null}
      </div>
    </>
  );
}
