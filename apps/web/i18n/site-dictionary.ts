import "server-only";

import type { Locale } from "./config";
import type { Dictionary } from "./dictionaries/id";
import { getDictionary } from "./get-dictionary";

/**
 * Kamus situs: teks statis DITIMPA nilai dari basis data.
 *
 * MASALAH YANG DIPECAHKANNYA. Halaman /content di panel menyunting 86 medan
 * teks di sembilan seksi, dan situs TIDAK PERNAH SEKALI PUN MEMBACANYA. Semua
 * kalimat datang dari i18n/dictionaries. Endpoint `GET /content/public` sudah
 * ada dan berfungsi, tapi nol pemanggil. Akibatnya menyunting teks di panel
 * tidak berpengaruh apa pun, dan tidak ada satu pesan galat pun yang memberi
 * tahu. Berkas ini yang menyambungkannya.
 *
 * KENAPA MENIMPA, BUKAN MENGGANTI. Tiga alasan, dan ketiganya menentukan:
 *
 *   1. Tipe `Dictionary` tidak berubah sama sekali, jadi NOL komponen situs
 *      perlu disentuh. Komponen tetap menerima objek yang bentuknya persis
 *      sama seperti sebelumnya.
 *   2. Medan yang kosong di basis data jatuh ke teks statis. Halaman tanpa
 *      judul jauh lebih merusak daripada halaman berjudul lama, dan baris
 *      kosong adalah keadaan yang mungkin terjadi.
 *   3. API mati saat build berarti situs memakai teks statis, persis seperti
 *      sebelum berkas ini ada. Build tidak pernah gagal karenanya.
 *
 * Pola cadangan yang sama dengan lib lain: `server-only`, ISR 300 detik.
 */
const API = process.env.API_ORIGIN ?? "http://localhost:4000";

/** Bentuk datar dari API: `{"hero.headline.accent": "..."}`. */
type FlatContent = Record<string, string>;

async function fetchContent(locale: Locale): Promise<FlatContent> {
  try {
    const res = await fetch(`${API}/content/public?locale=${locale}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const body = (await res.json()) as { success: boolean; data: FlatContent };
    if (!body.success) throw new Error("gagal");
    return body.data ?? {};
  } catch (error) {
    console.warn(
      "[content] gagal membaca teks dari API, memakai kamus statis:",
      error instanceof Error ? error.message : error,
    );
    return {};
  }
}

/**
 * Menulis satu nilai ke dalam objek kamus menurut jalur bertitik.
 *
 * TIDAK PERNAH MEMBUAT JALUR BARU. Kalau jalurnya tidak ada di kamus statis,
 * nilainya diabaikan diam-diam. Ini disengaja: kamus statis adalah bentuk yang
 * BERTIPE, dan menyuntikkan kunci asing ke dalamnya hanya akan menghasilkan
 * medan yang tidak pernah dirender siapa pun sambil membuat objeknya berbeda
 * dari tipenya sendiri. Baris basis data yang tidak dikenali komponen mana pun
 * memang tidak punya tempat untuk ditampilkan.
 */
function assign(target: Record<string, unknown>, path: string[], value: string): void {
  let node: Record<string, unknown> = target;

  for (let i = 0; i < path.length - 1; i += 1) {
    const step = path[i];
    if (step === undefined) return;
    const next = node[step];
    if (!next || typeof next !== "object" || Array.isArray(next)) return;
    node = next as Record<string, unknown>;
  }

  const leaf = path[path.length - 1];
  if (leaf === undefined) return;
  const current = node[leaf];

  /* MEDAN DAFTAR DIPECAH PER BARIS. `about.body` dan `menu.notes` adalah array
     di kamus, dan skrip seed menyimpannya sebagai satu string dipisah baris
     baru. Editor panel pun menampilkannya sebagai textarea dengan petunjuk
     "Satu butir per baris", jadi memecahnya di sini menutup lingkarannya. */
  if (Array.isArray(current)) {
    const items = value.split("\n").map((line) => line.trim()).filter(Boolean);
    if (items.length > 0) node[leaf] = items;
    return;
  }

  /* Hanya string yang boleh ditimpa. Kalau targetnya objek, jalurnya kurang
     dalam dan menimpanya akan menghancurkan cabang kamus. */
  if (typeof current === "string") node[leaf] = value;
}

/**
 * Salinan dalam, supaya modul kamus yang di-cache Node tidak ikut termutasi.
 *
 * `getDictionary` melakukan `import()` statis, dan modul di Node hanya
 * dievaluasi SEKALI per proses. Menimpa objeknya langsung berarti nilai satu
 * permintaan bocor ke permintaan berikutnya, dan lebih buruk lagi, ke locale
 * yang lain. `structuredClone` tersedia sejak Node 17 dan proyek ini di Node 24.
 */
export async function getSiteDictionary(locale: Locale): Promise<Dictionary> {
  const [base, overrides] = await Promise.all([getDictionary(locale), fetchContent(locale)]);
  const merged = structuredClone(base) as unknown as Record<string, unknown>;

  for (const [key, value] of Object.entries(overrides)) {
    if (typeof value !== "string" || value.trim() === "") continue;
    assign(merged, key.split("."), value);
  }

  return merged as unknown as Dictionary;
}
