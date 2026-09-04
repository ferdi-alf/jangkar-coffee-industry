"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Laci bawah untuk MELIHAT detail data yang banyak. Tinggi 85 persen layar.
 *
 * Aturan produk: dapat ditutup dengan klik di luar, DITARIK, atau tombol tutup.
 * Ketiganya ada di sini. Tarikan diambil dari pointer event, bukan pustaka
 * gesture, jadi tidak ada dependensi baru dan ia bekerja sama untuk sentuhan
 * maupun tetikus.
 *
 * Ambang tariknya 110 piksel. Lebih kecil dari itu, gulir yang sedikit meleset
 * akan tanpa sengaja menutup laci saat pengguna sebenarnya sedang membaca.
 */
const DRAG_CLOSE_PX = 110;

/**
 * Pembungkus tipis. Ia yang memutuskan panelnya ada atau tidak, dan itulah yang
 * membuat state tarik selalu bersih: panelnya benar-benar dilepas saat ditutup,
 * jadi `dragY` lahir kembali dari nol tanpa perlu efek yang meresetnya.
 *
 * Versi pertama memanggil `setDragY(0)` di dalam useEffect saat `open` berubah,
 * dan ESLint menangkapnya sebagai setState sinkron di dalam efek: ia memicu
 * render bertingkat, satu untuk membuka dan satu lagi untuk meresetnya.
 */
export function DetailDrawer(props: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!props.open) return null;
  return <DetailDrawerPanel {...props} />;
}

function DetailDrawerPanel({
  title,
  description,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
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

  const startY = useRef<number | null>(null);
  const [dragY, setDragY] = useState(0);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current();
    };
    document.addEventListener("keydown", onKeyDown);
    panelRef.current?.querySelector<HTMLElement>("button")?.focus();
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <>
      <div className="adm-scrim-fixed" onClick={onClose} aria-hidden="true" />
      <div
        className="adm-drawer-bottom"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={dragY > 0 ? { transform: `translateY(${dragY}px)`, animation: "none" } : undefined}
      >
        {/* Pegangan tarik. Hanya di sini yang menangkap pointer, jadi menarik di
            dalam isi laci tetap menggulung isinya seperti biasa. */}
        <div
          className="adm-grabber"
          style={{ touchAction: "none", cursor: "grab" }}
          onPointerDown={(event) => {
            startY.current = event.clientY;
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            if (startY.current === null) return;
            setDragY(Math.max(0, event.clientY - startY.current));
          }}
          onPointerUp={() => {
            if (dragY > DRAG_CLOSE_PX) onClose();
            else setDragY(0);
            startY.current = null;
          }}
          aria-hidden="true"
        />

        <div className="adm-drawer-head">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2>{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
          <button
            type="button"
            className="adm-btn"
            data-variant="ghost"
            data-icon="true"
            onClick={onClose}
            aria-label="Tutup"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="adm-drawer-body">{children}</div>
      </div>
    </>
  );
}
