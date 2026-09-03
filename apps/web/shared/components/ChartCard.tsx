"use client";

import type { ReactNode } from "react";

/**
 * Pembungkus grafik dengan TINGGI TETAP.
 *
 * Aturan dashboard: kartu dan tabel dalam satu baris memakai tinggi tetap yang
 * sama, isinya yang menggulung di dalam, bukan kontainernya yang memanjang.
 * Grafik recharts yang responsif akan memuai mengikuti induknya, jadi tanpa
 * tinggi yang dikunci di sini satu baris bisa jauh lebih tinggi dari
 * tetangganya dan grid dashboard langsung berantakan.
 */
export function ChartCard({
  title,
  description,
  actions,
  size = "true",
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  size?: "true" | "sm";
  children: ReactNode;
}) {
  return (
    <div className="adm-card" data-fixed={size}>
      <div className="adm-card-head">
        <div>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {actions ? <div className="adm-card-actions">{actions}</div> : null}
      </div>
      <div className="adm-card-body">{children}</div>
    </div>
  );
}
