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

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const cancel = panelRef.current?.querySelector<HTMLElement>("[data-autofocus]");
    (cancel ?? panelRef.current?.querySelector<HTMLElement>("button"))?.focus();
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

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
