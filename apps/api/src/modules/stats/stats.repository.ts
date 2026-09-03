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

  /* Pengelompokan per hari dilakukan di sini, bukan lewat SQL date_trunc,
     karena PostgREST tidak mengekspos GROUP BY. Jumlah barisnya kecil, 30 hari
     pesan kontak, jadi menariknya lalu menghitung di memori jauh lebih murah
     daripada menambah view atau fungsi RPC hanya untuk ini. */
  const { data: contactRows } = await supabase
    .from("contact_message")
    .select("created_at")
    .gte("created_at", since.toISOString())
    .limit(5000);

  const byDay = new Map<string, number>();
  for (let i = 0; i < 30; i += 1) {
    const d = new Date(since);
    d.setUTCDate(since.getUTCDate() + i);
    byDay.set(isoDate(d), 0);
  }
  for (const row of ((contactRows ?? []) as unknown as Row[])) {
    const key = String(row.created_at).slice(0, 10);
    if (byDay.has(key)) byDay.set(key, (byDay.get(key) ?? 0) + 1);
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
    contactByDay: [...byDay.entries()].map(([date, n]) => ({ date, count: n })),
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
