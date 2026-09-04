/**
 * Kunci cache TanStack, satu sumber kebenaran.
 *
 * Bentuknya bertingkat dengan sengaja: `["product", "list", params]` dan
 * `["product", "detail", id]` sama-sama diawali "product", jadi satu
 * `invalidateQueries({ queryKey: ["product"] })` setelah mutasi menyegarkan
 * daftar dan detailnya sekaligus. Kalau kuncinya datar, tiap tempat harus ingat
 * membatalkan keduanya, dan cepat atau lambat ada yang lupa.
 */
export const qk = {
  session: ["session"] as const,
  stats: ["stats", "overview"] as const,

  product: {
    all: ["product"] as const,
    list: (params: Record<string, unknown>) => ["product", "list", params] as const,
    detail: (id: string, fields?: string) => ["product", "detail", id, fields ?? "all"] as const,
  },
  category: {
    all: ["category"] as const,
    list: (params: Record<string, unknown>) => ["category", "list", params] as const,
    detail: (id: string) => ["category", "detail", id] as const,
  },
  outlet: {
    all: ["outlet"] as const,
    list: (params: Record<string, unknown>) => ["outlet", "list", params] as const,
    detail: (id: string) => ["outlet", "detail", id] as const,
  },
  content: {
    all: ["content"] as const,
    sections: ["content", "sections"] as const,
    section: (key: string) => ["content", "section", key] as const,
  },
  media: {
    all: ["media"] as const,
    list: (params: Record<string, unknown>) => ["media", "list", params] as const,
  },
  contact: {
    all: ["contact"] as const,
    list: (params: Record<string, unknown>) => ["contact", "list", params] as const,
  },
  settings: {
    all: ["settings"] as const,
    seo: ["settings", "seo"] as const,
    contact: ["settings", "contact"] as const,
    social: ["settings", "social"] as const,
  },
  timeline: {
    all: ["timeline"] as const,
    list: ["timeline", "list"] as const,
  },
  user: {
    all: ["user"] as const,
    list: ["user", "list"] as const,
    me: ["user", "me"] as const,
  },
} as const;
