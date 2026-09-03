"use client";

import { useQuery } from "@tanstack/react-query";
import { Boxes, Coffee, MailOpen, MapPin } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AdminShell } from "@/modules/admin/components/AdminShell";
import { ChartCard } from "@/shared/components/ChartCard";
import { StatCard } from "@/shared/components/StatCard";
import { qk } from "@/shared/constants/query-keys";
import { api } from "@/shared/lib/api-client";

/**
 * Beranda panel.
 *
 * SETIAP ANGKA DI HALAMAN INI BERASAL DARI DATA YANG BENAR-BENAR ADA.
 *
 * Tidak ada grafik pendapatan, tidak ada trafik, tidak ada konversi. Jangkar
 * tidak menjual lewat situs ini, jadi tidak ada satu pun transaksi yang tercatat
 * di basis datanya, dan grafik penjualan di sini hanya akan jadi angka karangan
 * yang terlihat meyakinkan. Yang ditampilkan: pesan kontak yang benar-benar
 * masuk, kelengkapan terjemahan yang benar-benar bisa dihitung, dan cakupan
 * jadwal keliling yang benar-benar diisi.
 *
 * KELENGKAPAN TERJEMAHAN adalah metrik yang paling berguna di sini. Situsnya
 * dua bahasa, dan medan yang tertinggal di satu bahasa adalah lubang yang tidak
 * terlihat sampai ada pengunjung yang menemukannya.
 *
 * GRAFIK CAKUPAN JADWAL KELILING SUDAH DICABUT, dan statistik jumlah unit
 * armada bersamanya. Situs ini tidak pernah menampilkan jadwal maupun jumlah
 * armada, jadi keduanya menggambar hal yang tidak dilihat siapa pun. Yang
 * menggantikannya adalah jumlah item menu per kanal, yang benar-benar tampil.
 *
 * LEBAR BARIS BERVARIASI, sesuai aturan dashboard: satu baris 100 persen, satu
 * baris 30 banding 70, satu baris 50 banding 50. Tingginya dikunci ChartCard,
 * jadi kartu sebaris tidak pernah saling melebihi.
 */
interface Overview {
  counts: {
    products: number;
    publishedProducts: number;
    ecommerceProducts: number;
    soldOutProducts: number;
    categories: number;
    outlets: number;
    contactNew: number;
    contactTotal: number;
  };
  contactByDay: { date: string; count: number }[];
  translation: { entity: string; total: number; id: number; en: number }[];
  channelCounts: { channel: string; count: number }[];
  recentAudit: { action: string; entity: string; summary: string | null; at: string; actor: string | null }[];
}

const GOLD = "#B08A16";
const GOLD_SOFT = "#D8B84E";
const INK = "#5A6069";

const shortDate = (iso: string) => iso.slice(8, 10) + "/" + iso.slice(5, 7);

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: qk.stats,
    queryFn: () => api.get<Overview>("/stats/overview"),
  });

  return (
    <AdminShell>
      {error ? (
        <div className="adm-card">
          <div className="adm-card-body">
            <p className="adm-error">
              Data belum bisa dimuat. Pastikan API berjalan dan SUPABASE_SECRET_KEY sudah diisi di
              apps/api/.env.
            </p>
          </div>
        </div>
      ) : null}

      <div className="adm-row" data-split="stat">
        <StatCard
          label="Pesan baru"
          value={isLoading ? "..." : data?.counts.contactNew ?? 0}
          note={`dari ${data?.counts.contactTotal ?? 0} pesan seluruhnya`}
          icon={MailOpen}
        />
        <StatCard
          label="Produk tayang"
          value={isLoading ? "..." : data?.counts.publishedProducts ?? 0}
          note={`dari ${data?.counts.products ?? 0} produk`}
          icon={Coffee}
        />
        <StatCard
          label="Produk ecommerce"
          value={isLoading ? "..." : data?.counts.ecommerceProducts ?? 0}
          note={`${data?.counts.soldOutProducts ?? 0} ditandai habis`}
          icon={Boxes}
        />
        <StatCard
          label="Outlet"
          value={isLoading ? "..." : data?.counts.outlets ?? 0}
          note={`${data?.channelCounts.find((c) => c.channel === "keliling")?.count ?? 0} item di menu armada`}
          icon={MapPin}
        />
      </div>

      <div className="adm-row" data-split="1">
        <ChartCard
          title="Pesan kontak masuk"
          description="30 hari terakhir, dari form kontak beranda."
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data?.contactByDay ?? []} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
              <CartesianGrid stroke="#E4E6EA" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={shortDate}
                tick={{ fontSize: 11, fill: INK }}
                tickLine={false}
                axisLine={{ stroke: "#E4E6EA" }}
                minTickGap={18}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: INK }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                labelFormatter={(value) => `Tanggal ${value}`}
                formatter={(value) => [`${Number(value ?? 0)} pesan`, ""]}
                contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #E4E6EA" }}
              />
              {/* `linear`, BUKAN `monotone`. Terlihat di screenshot: spline
                  monotone melengkung sampai DI BAWAH NOL di antara dua titik,
                  dan cacah pesan tidak bisa negatif. Kurva itu menggambar nilai
                  yang mustahil, dan grafik yang berbohong sedikit lebih buruk
                  daripada grafik yang kaku. Titiknya dimunculkan kembali karena
                  garis lurus antar hari perlu penanda di mana datanya berada. */}
              <Line
                type="linear"
                dataKey="count"
                stroke={GOLD}
                strokeWidth={2}
                dot={{ r: 2, fill: GOLD, strokeWidth: 0 }}
                /* Animasi masuk dimatikan. Grafik ini di bawah lipatan pada
                   layar kecil, dan gerak berulang di luar hero dilarang
                   amandemen A2. */
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="adm-row" data-split="30-70">
        <ChartCard
          title="Kelengkapan terjemahan"
          description="Berapa entri yang sudah punya versi ID dan EN."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data?.translation ?? []}
              layout="vertical"
              margin={{ top: 4, right: 12, bottom: 0, left: 8 }}
            >
              <CartesianGrid stroke="#E4E6EA" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: INK }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="entity" width={68} tick={{ fontSize: 11, fill: INK }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #E4E6EA" }} />
              <Bar dataKey="id" name="Indonesia" fill={GOLD} radius={[0, 4, 4, 0]} isAnimationActive={false} />
              <Bar dataKey="en" name="English" fill={GOLD_SOFT} radius={[0, 4, 4, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Isi menu per kanal"
          description="Berapa item yang benar-benar dibawa outlet dan armada keliling."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.channelCounts ?? []} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
              <CartesianGrid stroke="#E4E6EA" vertical={false} />
              <XAxis
                dataKey="channel"
                tickFormatter={(v) => (v === "keliling" ? "Keliling" : "Outlet")}
                tick={{ fontSize: 11, fill: INK }}
                axisLine={{ stroke: "#E4E6EA" }}
                tickLine={false}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: INK }} axisLine={false} tickLine={false} />
              <Tooltip
                labelFormatter={(v) => (v === "keliling" ? "Menu armada" : "Menu outlet")}
                formatter={(value) => [`${Number(value ?? 0)} item`, ""]}
                contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #E4E6EA" }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                {(data?.channelCounts ?? []).map((entry) => (
                  <Cell key={entry.channel} fill={entry.channel === "keliling" ? GOLD_SOFT : GOLD} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="adm-row" data-split="1">
        <div className="adm-card" data-fixed="sm">
          <div className="adm-card-head">
            <div>
              <h2>Perubahan terakhir</h2>
              <p>Jejak audit, siapa mengubah apa.</p>
            </div>
          </div>
          <div className="adm-card-body" data-flush="true">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Aksi</th>
                  <th>Ringkasan</th>
                  <th>Oleh</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recentAudit ?? []).map((row, index) => (
                  <tr key={`${row.at}-${index}`}>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {new Date(row.at).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td>
                      <span className="adm-badge" data-tone={row.action === "delete" ? "danger" : "muted"}>
                        {row.action}
                      </span>
                    </td>
                    <td>{row.summary ?? row.entity}</td>
                    <td>{row.actor ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!isLoading && (data?.recentAudit.length ?? 0) === 0 ? (
              <p className="adm-empty">Belum ada perubahan yang tercatat.</p>
            ) : null}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
