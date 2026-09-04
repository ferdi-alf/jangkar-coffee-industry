"use client";

import { useQuery } from "@tanstack/react-query";
import { Boxes, Coffee, Globe2, MailOpen } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AdminShell } from "@/modules/admin/components/AdminShell";
import { countryName } from "@/modules/admin/constants/country-centroids";
import { VisitorMap } from "@/modules/admin/components/VisitorMap";
import { ChartCard } from "@/shared/components/ChartCard";
import { StatCard } from "@/shared/components/StatCard";
import { qk } from "@/shared/constants/query-keys";
import { api } from "@/shared/lib/api-client";

/**
 * Beranda panel.
 *
 * SETIAP ANGKA DI HALAMAN INI BERASAL DARI DATA YANG BENAR-BENAR ADA.
 *
 * Tidak ada grafik pendapatan dan tidak ada konversi. Jangkar tidak menjual
 * lewat situs ini, jadi tidak ada satu pun transaksi yang tercatat di basis
 * datanya, dan grafik penjualan di sini hanya akan jadi angka karangan yang
 * terlihat meyakinkan.
 *
 * KUNJUNGAN SITUS KINI ADA, dan ia menggantikan grafik pesan kontak masuk atas
 * permintaan pemilik proyek. Angkanya nyata: satu baris dicatat middleware
 * apps/web untuk setiap muat halaman, dengan negara dari header geo Vercel.
 * Dua batasnya harus diingat siapa pun yang membacanya, dan keduanya ditulis
 * di keterangan kartunya sendiri: ia menghitung MUAT HALAMAN bukan manusia,
 * dan kunjungan tanpa negara adalah keadaan normal, bukan galat.
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
  visitsByDay: { date: string; visits: number; uniques: number }[];
  visitsByCountry: { country: string | null; visits: number; uniques: number }[];
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
          label="Kunjungan 30 hari"
          value={isLoading ? "..." : (data?.visitsByDay ?? []).reduce((sum, d) => sum + d.visits, 0)}
          note={`${data?.visitsByCountry.length ?? 0} negara tercatat`}
          icon={Globe2}
        />
      </div>

      {/* 70 banding 30, diminta pemilik proyek: grafik kunjungan di kiri, peta
          dunia di kanan. Variannya baru di admin.css, yang ada sebelumnya hanya
          30 banding 70. */}
      <div className="adm-row" data-split="70-30">
        <ChartCard
          title="Kunjungan situs"
          description="30 hari terakhir. Menghitung muat halaman, bukan orang, jadi bot ikut terhitung."
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data?.visitsByDay ?? []}
              margin={{ top: 8, right: 8, bottom: 0, left: -18 }}
            >
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
                formatter={(value, name) => [
                  `${Number(value ?? 0)}`,
                  name === "uniques" ? "Pengunjung berbeda" : "Kunjungan",
                ]}
                contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #E4E6EA" }}
              />
              <Legend
                formatter={(value) => (value === "uniques" ? "Pengunjung berbeda" : "Kunjungan")}
                wrapperStyle={{ fontSize: 11 }}
              />
              {/* `linear`, BUKAN `monotone`. Terlihat di screenshot sebelumnya:
                  spline monotone melengkung sampai DI BAWAH NOL di antara dua
                  titik, dan cacah kunjungan tidak bisa negatif. Kurva itu
                  menggambar nilai yang mustahil, dan grafik yang berbohong
                  sedikit lebih buruk daripada grafik yang kaku. */}
              <Line
                type="linear"
                dataKey="visits"
                stroke={GOLD}
                strokeWidth={2}
                dot={{ r: 2, fill: GOLD, strokeWidth: 0 }}
                isAnimationActive={false}
              />
              {/* Garis kedua: pengunjung berbeda per hari, dihitung dari hash
                  bergaram yang berganti tiap tengah malam. Ia selalu di bawah
                  atau sama dengan kunjungan, dan jarak antar keduanya persis
                  menunjukkan berapa banyak yang membuka lebih dari sekali. */}
              <Line
                type="linear"
                dataKey="uniques"
                stroke={GOLD_SOFT}
                strokeWidth={2}
                strokeDasharray="4 3"
                dot={{ r: 2, fill: GOLD_SOFT, strokeWidth: 0 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Negara pengunjung"
          description="30 hari terakhir, dari header geo Vercel."
        >
          {/* PETA PLUS DAFTAR, dan daftarnya bukan pelengkap. Ukuran lingkaran
              tidak boleh jadi satu-satunya pembawa makna, dan lingkaran di peta
              dunia memang mustahil dibandingkan dengan mata. Daftar bertuliskan
              angka inilah yang benar-benar bisa dibaca, termasuk oleh pembaca
              layar; petanya `aria-hidden`. */}
          <div className="adm-geo">
            <VisitorMap rows={data?.visitsByCountry ?? []} />
            {(data?.visitsByCountry.length ?? 0) === 0 ? (
              <p className="adm-empty" style={{ padding: "12px 0" }}>
                Belum ada kunjungan tercatat.
              </p>
            ) : (
              <ol className="adm-geo-list">
                {(data?.visitsByCountry ?? []).slice(0, 6).map((row) => (
                  <li key={row.country ?? "unknown"}>
                    <span>{countryName(row.country)}</span>
                    <b>{row.visits}</b>
                  </li>
                ))}
              </ol>
            )}
          </div>
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
