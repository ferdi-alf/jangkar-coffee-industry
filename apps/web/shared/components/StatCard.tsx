import type { LucideIcon } from "lucide-react";

/** Kartu angka tunggal untuk baris ringkasan dashboard. */
export function StatCard({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  note?: string;
  icon: LucideIcon;
}) {
  return (
    <div className="adm-card">
      <div className="adm-stat">
        <span className="adm-stat-label">
          <Icon size={15} aria-hidden="true" />
          {label}
        </span>
        <p className="adm-stat-value">{value}</p>
        {note ? <p className="adm-stat-note">{note}</p> : null}
      </div>
    </div>
  );
}
