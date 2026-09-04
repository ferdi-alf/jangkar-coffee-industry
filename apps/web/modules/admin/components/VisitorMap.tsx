"use client";

import { useMemo } from "react";
import WorldMap, { regions, type CountryContext, type ISOCode } from "react-svg-worldmap";

import { countryName } from "@/modules/admin/constants/country-centroids";

export interface CountryVisits {
  country: string | null;
  visits: number;
  uniques: number;
}

/**
 * Peta pengunjung: negara yang berkunjung DIWARNAI, makin banyak makin pekat.
 *
 * MENGGANTIKAN PETA LEAFLET, dan penggantinya menyelesaikan dua hal sekaligus.
 *
 * 1. BUG DI PONSEL. Leaflet memasang z-index 600 sampai 1000 pada pane penanda,
 *    tooltip, dan kontrolnya, sedangkan sidebar panel hanya 60 dan scrim-nya 55.
 *    Akibatnya membuka sidebar di layar kecil membuat isi peta tetap tercetak DI
 *    ATAS sidebar. Peta ini SVG biasa tanpa satu pun z-index, jadi seluruh kelas
 *    masalah itu hilang, bukan ditambal.
 * 2. BENTUK YANG DIMINTA. Penanda titik tidak menjawab pertanyaan "negara mana
 *    yang datang". Choropleth menjawabnya langsung: negaranya sendiri yang
 *    berwarna.
 *
 * `size="responsive"` membuat petanya mengikuti lebar kartunya, jadi tingginya
 * tidak pernah melampaui ruang yang tersedia. Peta Leaflet sebelumnya memakai
 * tinggi minimum tetap, dan itu sebab lain kenapa ia meluber di ponsel.
 *
 * WARNA DARI PALET CREST, bukan skala bawaan pustaka. Kuning cerah `--red-deep`
 * untuk kunjungan paling sedikit sampai merah bata `--signal` untuk paling
 * banyak. Keduanya warna Jangkar, dan rentangnya bergerak dari terang ke gelap
 * sehingga urutannya terbaca bahkan pada layar yang buruk.
 *
 * WARNA TIDAK PERNAH JADI SATU-SATUNYA PEMBAWA MAKNA. Aturan aksesibilitas
 * proyek melarangnya, dan lagipula negara sekecil Singapura mustahil terlihat
 * pada peta dunia. Karena itu induknya SELALU merender daftar peringkat
 * bertuliskan angka, dan daftar itulah sumber kebenarannya.
 */

/* Ujung rentang warna, keduanya dari palet crest. */
const LOW = "#E8C244"; // --red-deep, kuning cerah
const HIGH = "#6B2218"; // --signal, merah bata
/* Negara tanpa kunjungan. Sengaja abu netral, bukan versi paling pucat dari
   rentang di atas, supaya "nol" tidak pernah salah dibaca sebagai "sedikit". */
const EMPTY = "#E4E6EA";

function lerpHex(from: string, to: string, t: number): string {
  const parse = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const [ar, ag, ab] = parse(from);
  const [br, bg, bb] = parse(to);
  const mix = (a: number, b: number) => Math.round(a + (b - a) * t);
  return `#${[mix(ar!, br!), mix(ag!, bg!), mix(ab!, bb!)]
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("")}`;
}

/** Kode ISO yang benar-benar bisa digambar pustaka ini. */
const DRAWABLE = new Set(regions.map((r) => r.code.toUpperCase()));

export function VisitorMap({ rows }: { rows: CountryVisits[] }) {
  const { data, undrawable } = useMemo(() => {
    const withCode = rows.filter(
      (row): row is CountryVisits & { country: string } => Boolean(row.country),
    );
    return {
      data: withCode
        .filter((row) => DRAWABLE.has(row.country.toUpperCase()))
        .map((row) => ({ country: row.country.toUpperCase() as ISOCode, value: row.visits })),
      /* Negara yang punya kunjungan tapi TIDAK ADA bentuknya di peta, misalnya
         Singapura dan Hong Kong yang terlalu kecil untuk digambar pada skala
         dunia. Disebut apa adanya di bawah peta, karena kunjungan yang hilang
         dari layar tanpa penjelasan jauh lebih membingungkan. */
      undrawable: withCode.filter((row) => !DRAWABLE.has(row.country.toUpperCase())),
    };
  }, [rows]);

  function style({ countryValue, minValue, maxValue }: CountryContext<number>) {
    if (countryValue === undefined) {
      return { fill: EMPTY, stroke: "#FFFFFF", strokeWidth: 0.4, fillOpacity: 1 };
    }
    /* AKAR, bukan linear. Dengan satu negara yang jauh lebih ramai daripada
       sisanya, skala linear membuat semua negara lain tampak nyaris seragam.
       Akar merapatkan ujung atas sehingga selisih di ujung bawah tetap terbaca.
       Saat hanya ada satu negara, min sama dengan max: ia diberi nilai penuh. */
    const span = maxValue - minValue;
    const t = span === 0 ? 1 : Math.sqrt((countryValue - minValue) / span);
    return { fill: lerpHex(LOW, HIGH, t), stroke: "#FFFFFF", strokeWidth: 0.4, fillOpacity: 1 };
  }

  return (
    <div className="adm-choropleth">
      <WorldMap
        data={data}
        size="responsive"
        backgroundColor="transparent"
        borderColor="#FFFFFF"
        strokeOpacity={0.6}
        styleFunction={style}
        tooltipBgColor="#241012"
        tooltipTextColor="#F5F3F1"
        tooltipTextFunction={({ countryCode, countryValue }) =>
          `${countryName(countryCode)}: ${countryValue ?? 0} kunjungan`
        }
      />
      {undrawable.length > 0 ? (
        <p className="adm-hint">
          Terlalu kecil untuk digambar di peta, lihat daftar di bawah:{" "}
          {undrawable.map((row) => countryName(row.country)).join(", ")}.
        </p>
      ) : null}
    </div>
  );
}
