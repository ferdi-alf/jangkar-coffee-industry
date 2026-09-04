import "server-only";

import { ABOUT_MILESTONES } from "@/modules/home/constants/about-timeline";
import type { Dictionary } from "@/i18n/dictionaries/id";

/**
 * Tonggak garis waktu, dibaca dari API saat build.
 *
 * Sebelumnya tersebar di TIGA tempat: tahunnya di konstanta about-timeline.ts,
 * kalimatnya di kamus i18n, dan salinan kalimat yang sama juga terseed sebagai
 * medan `timeline.*` pada seksi about. Sekarang satu tabel, dikelola di
 * /timeline pada panel.
 *
 * Pola cadangannya sama dengan lib lain di folder ini: kalau API tidak bisa
 * dihubungi saat build, konstanta dan kamus lama dipakai supaya build tidak
 * pernah gagal karenanya, dan ISR memperbaikinya sendiri dalam lima menit.
 */
export interface TimelineItem {
  key: string;
  year: number;
  yearEnd: number | null;
  title: string;
  subtitle: string | null;
  description: string | null;
}

interface ApiEntry {
  id: string;
  year: number;
  yearEnd: number | null;
  title: string;
  subtitle: string | null;
  description: string | null;
}

const API = process.env.API_ORIGIN ?? "http://localhost:4000";

/** Cadangan dari konstanta plus kamus, bentuk yang dipakai situs sebelum panel. */
function fallback(dict: Dictionary): TimelineItem[] {
  return ABOUT_MILESTONES.map((milestone) => {
    const copy = dict.about.timeline[milestone.key];
    return {
      key: milestone.key,
      year: Number(milestone.from),
      yearEnd: milestone.to === null ? null : Number(milestone.to),
      title: copy.title,
      subtitle: copy.subtitle,
      description: copy.body,
    };
  });
}

export async function getTimeline(locale: string, dict: Dictionary): Promise<TimelineItem[]> {
  try {
    const res = await fetch(`${API}/timeline?locale=${locale}`, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const body = (await res.json()) as { success: boolean; data: ApiEntry[] };
    if (!body.success || body.data.length === 0) throw new Error("kosong");

    return body.data.map((entry) => ({
      key: entry.id,
      year: entry.year,
      yearEnd: entry.yearEnd,
      title: entry.title,
      subtitle: entry.subtitle,
      description: entry.description,
    }));
  } catch (error) {
    console.warn(
      "[timeline] gagal membaca tonggak dari API, memakai konstanta cadangan:",
      error instanceof Error ? error.message : error,
    );
    return fallback(dict);
  }
}
