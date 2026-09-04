import type { SupabaseClient } from "@supabase/supabase-js";

import type { StatsOverview } from "./stats.contract.js";

type Row = Record<string, unknown>;

/** Menghitung baris tanpa menariknya. head true membuat badan responsnya kosong. */
async function count(
  supabase: SupabaseClient,
  table: string,
  apply?: (q: ReturnType<SupabaseClient["from"]>) => unknown,
): Promise<number> {
  let builder = supabase.from(table).select("*", { count: "exact", head: true });
  if (apply) builder = apply(builder as never) as typeof builder;
  const { count: n, error } = await builder;
  if (error) throw new Error(error.message);
  return n ?? 0;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function overview(supabase: SupabaseClient): Promise<StatsOverview> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 29);

  const [
    products,
    publishedProducts,
    ecommerceProducts,
    soldOutProducts,
    categories,
    outlets,
    contactNew,
    contactTotal,
    outletMenu,
    kelilingMenu,
  ] = await Promise.all([
    count(supabase, "product"),
    count(supabase, "product", (q) => (q as never as { eq: (a: string, b: string) => unknown }).eq("status", "published")),
    count(supabase, "product", (q) => (q as never as { eq: (a: string, b: boolean) => unknown }).eq("is_ecommerce", true)),
    count(supabase, "product", (q) => (q as never as { eq: (a: string, b: boolean) => unknown }).eq("is_sold_out", true)),
    count(supabase, "category"),
    count(supabase, "outlet"),
    count(supabase, "contact_message", (q) => (q as never as { eq: (a: string, b: string) => unknown }).eq("status", "new")),
    count(supabase, "contact_message"),
    /* Item yang benar-benar tampil di tiap kanal: baris kanal yang available.
       Ini yang menggantikan hitungan armada dan jadwal. */
    count(supabase, "product_channel", (q) =>
      (q as never as { eq: (a: string, b: unknown) => { eq: (c: string, d: unknown) => unknown } })
        .eq("channel", "outlet").eq("available", true)),
    count(supabase, "product_channel", (q) =>
      (q as never as { eq: (a: string, b: unknown) => { eq: (c: string, d: unknown) => unknown } })
        .eq("channel", "keliling").eq("available", true)),
  ]);

  /* KUNJUNGAN DIAGREGASI DI POSTGRES, bukan di sini.
     Pesan kontak dulu dihitung di memori karena jumlahnya kecil, tiga puluh
     hari dari satu form. Kunjungan tidak kecil: satu baris per muat halaman.
     Menariknya ke Node lalu menjumlahkannya akan berubah dari lambat menjadi
     kehabisan memori pada situs yang ramai, jadi ia memakai fungsi
     visits_by_day dan visits_by_country dari migrasi 20260903_0230. */
  const [dayRes, countryRes] = await Promise.all([
    supabase.rpc("visits_by_day", { days: 30 }),
    supabase.rpc("visits_by_country", { days: 30 }),
  ]);
  if (dayRes.error) throw new Error(dayRes.error.message);
  if (countryRes.error) throw new Error(countryRes.error.message);

  /* Hari tanpa kunjungan TIDAK punya baris di basis data, tapi grafik butuh
     sumbu yang utuh. Tanpa pengisian ini, satu hari sepi akan tampak seperti
     garis yang melompati waktu, bukan seperti lembah. */
  const visitDays = new Map<string, { visits: number; uniques: number }>();
  for (let i = 0; i < 30; i += 1) {
    const d = new Date(since);
    d.setUTCDate(since.getUTCDate() + i);
    visitDays.set(isoDate(d), { visits: 0, uniques: 0 });
  }
  for (const row of ((dayRes.data ?? []) as unknown as Row[])) {
    const key = String(row.day).slice(0, 10);
    if (visitDays.has(key)) {
      visitDays.set(key, { visits: Number(row.visits ?? 0), uniques: Number(row.uniques ?? 0) });
    }
  }

  const translation = await Promise.all(
    (
      [
        ["product", "product_translation"],
        ["category", "category_translation"],
        ["outlet", "outlet_translation"],
      ] as const
    ).map(async ([entity, table]) => {
      const [total, idCount, enCount] = await Promise.all([
        count(supabase, entity),
        count(supabase, table, (q) => (q as never as { eq: (a: string, b: string) => unknown }).eq("locale", "id")),
        count(supabase, table, (q) => (q as never as { eq: (a: string, b: string) => unknown }).eq("locale", "en")),
      ]);
      return { entity, total, id: idCount, en: enCount };
    }),
  );

  const { data: auditRows } = await supabase
    .from("audit_log")
    .select("action, entity, summary, created_at, actor_email")
    .order("created_at", { ascending: false })
    .limit(12);

  return {
    counts: {
      products,
      publishedProducts,
      ecommerceProducts,
      soldOutProducts,
      categories,
      outlets,
      contactNew,
      contactTotal,
    },
    visitsByDay: [...visitDays.entries()].map(([date, v]) => ({
      date,
      visits: v.visits,
      uniques: v.uniques,
    })),
    visitsByCountry: ((countryRes.data ?? []) as unknown as Row[]).map((r) => ({
      country: (r.country as string) ?? null,
      visits: Number(r.visits ?? 0),
      uniques: Number(r.uniques ?? 0),
    })),
    translation,
    channelCounts: [
      { channel: "outlet", count: outletMenu },
      { channel: "keliling", count: kelilingMenu },
    ],
    recentAudit: ((auditRows ?? []) as unknown as Row[]).map((r) => ({
      action: r.action as string,
      entity: r.entity as string,
      summary: (r.summary as string) ?? null,
      at: r.created_at as string,
      actor: (r.actor_email as string) ?? null,
    })),
  };
}
